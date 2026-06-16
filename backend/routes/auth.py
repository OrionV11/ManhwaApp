# backend/routes/auth.py
from typing import Optional
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr, validator
from utils.sanitize import sanitize_text, sanitize_username
import bcrypt
from datetime import datetime, timedelta
from jose import jwt
import os
from dotenv import load_dotenv

from logger import auth_logger, error_logger
from database import get_db
from models import User

from fastapi import APIRouter, Depends, HTTPException, status, Request
from slowapi import Limiter
from slowapi.util import get_remote_address

from utils.email import generate_otp, send_otp_email
from utils.otp_store import store_otp, verify_otp

load_dotenv()

SIGNUP_LIMIT = os.getenv("SIGNUP_RATE_LIMIT", "3/minute")
LOGIN_LIMIT = os.getenv("LOGIN_RATE_LIMIT", "5/minute")

limiter = Limiter(key_func=get_remote_address)



router = APIRouter()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 7

class SignupOTPRequest(BaseModel):
    email: EmailStr

class SignupVerifyRequest(BaseModel):
    email: EmailStr
    otp: str
    username: str
    password: str

class OTPRequest(BaseModel):
    email: EmailStr

class OTPVerifyRequest(BaseModel):
    email: EmailStr
    otp: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    otp: Optional[str] = None

class SignupRequest(BaseModel):
    username: str
    email: EmailStr
    password: str

    @validator('username')
    def validate_username(cls, v):
        if len(v) < 3:
            raise ValueError('Username must be at least 3 characters')
        if len(v) > 30:
            raise ValueError('Username must be under 30 characters')
        return sanitize_username(v)

    @validator('password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        if len(v) > 100:
            raise ValueError('Password must be under 100 characters')
        return v

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    bio: str | None = None
    profile_picture: str | None = None
    created_at: str
    updated_at: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode('utf-8'), hashed.encode('utf-8'))

def create_access_token(user_id: int) -> str:
    expire = datetime.utcnow() + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    to_encode = {
        "sub": str(user_id),
        "exp": expire,
        "iat": datetime.utcnow()
    }
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

@router.post("/auth/send-signup-otp")
@limiter.limit("3/minute")
def send_signup_otp(request: Request, data: SignupOTPRequest, db: Session = Depends(get_db)):
    """Send OTP to verify email before signup"""
    # Check if email already exists
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    otp = generate_otp()
    store_otp(data.email, otp)
    
    sent = send_otp_email(data.email, otp)
    if not sent:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send OTP email"
        )
    
    auth_logger.info(f"Signup OTP sent | email={data.email}")
    return {"message": "Verification code sent to your email"}

@router.post("/auth/verify-signup-otp", response_model=TokenResponse)
@limiter.limit("5/minute")
def verify_signup_otp(request: Request, data: SignupVerifyRequest, db: Session = Depends(get_db)):
    """Verify OTP and create account"""
    if not verify_otp(data.email, data.otp):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired OTP"
        )
    
    # Check again in case someone registered while waiting
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    hashed_password = hash_password(data.password)
    new_user = User(
        username=data.username,
        email=data.email,
        hashed_password=hashed_password,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = create_access_token(new_user.id)
    auth_logger.info(f"New signup verified | user={data.email}")

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": new_user.id,
            "username": new_user.username,
            "email": new_user.email,
            "bio": new_user.bio,
            "profile_picture": new_user.profile_picture,
            "created_at": new_user.created_at.isoformat(),
            "updated_at": new_user.updated_at.isoformat()
        }
    }

@router.post("/auth/request-otp")
@limiter.limit("3/minute")
def request_otp(request: Request, data: OTPRequest, db: Session = Depends(get_db)):
    """Send OTP to user email"""
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        # Don't reveal if email exists
        return {"message": "If this email exists, an OTP has been sent"}
    
    otp = generate_otp()
    store_otp(data.email, otp)
    
    sent = send_otp_email(data.email, otp)
    if not sent:
        error_logger.error(f"Failed to send OTP | email={data.email}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send OTP email"
        )
    
    auth_logger.info(f"OTP sent | email={data.email}")
    return {"message": "If this email exists, an OTP has been sent"}

@router.post("/auth/verify-otp")
@limiter.limit("5/minute")
def verify_otp_route(request: Request, data: OTPVerifyRequest, db: Session = Depends(get_db)):
    """Verify OTP and return token"""
    if not verify_otp(data.email, data.otp):
        auth_logger.warning(f"Invalid OTP | email={data.email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired OTP"
        )
    
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    token = create_access_token(user.id)
    auth_logger.info(f"OTP verified | email={data.email}")
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "bio": user.bio,
            "profile_picture": user.profile_picture,
            "created_at": user.created_at.isoformat(),
            "updated_at": user.updated_at.isoformat()
        }
    }

@router.post("/auth/signup", response_model=TokenResponse)
@limiter.limit(SIGNUP_LIMIT)
def signup(request: Request, data: SignupRequest, db: Session = Depends(get_db)):
    """Sign up a new user"""
    try:
        existing_email = db.query(User).filter(User.email == data.email).first()
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )

        existing_username = db.query(User).filter(User.username == data.username).first()
        if existing_username:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken"
            )

        hashed_password = hash_password(data.password)
        new_user = User(
            username=data.username,
            email=data.email,
            hashed_password=hashed_password,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )

        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        token = create_access_token(new_user.id)

        auth_logger.info(f"New signup | user={data.email}")

        return {
            "access_token": token,
            "token_type": "bearer",
            "user": {
                "id": new_user.id,
                "username": new_user.username,
                "email": new_user.email,
                "bio": new_user.bio,
                "profile_picture": new_user.profile_picture,
                "created_at": new_user.created_at.isoformat(),
                "updated_at": new_user.updated_at.isoformat()
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        error_logger.error(f"Signup failed | user={data.email} | error={e}")
        raise

@router.post("/auth/login", response_model=TokenResponse)
@limiter.limit(LOGIN_LIMIT)
def login(data: LoginRequest, request: Request, db: Session = Depends(get_db)):
    """Log in an existing user"""
    ip = request.client.host

    user = db.query(User).filter(User.email == data.email).first()

    if not user:
        auth_logger.warning(f"Failed login - user not found | email={data.email} | ip={ip}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    if not verify_password(data.password, user.hashed_password):
        auth_logger.warning(f"Failed login - wrong password | user={data.email} | ip={ip}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    auth_logger.info(f"Successful login | user={data.email} | ip={ip}")

    token = create_access_token(user.id)

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "bio": user.bio,
            "profile_picture": user.profile_picture,
            "created_at": user.created_at.isoformat(),
            "updated_at": user.updated_at.isoformat()
        }
    }

@router.post("/auth/logout")
def logout():
    """Logout endpoint (token invalidation should be handled client-side)"""
    return {"message": "Logged out successfully"}
