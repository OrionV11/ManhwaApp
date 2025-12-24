from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, EmailStr
from typing import Dict
from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta

router = APIRouter(prefix="/auth", tags=["auth"])

# In-memory "database"
users_db: Dict[str, dict] = {}

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT settings
SECRET_KEY = "supersecretkey"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

# Schemas
class SignupRequest(BaseModel):
    username: str
    email: EmailStr
    password: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: EmailStr

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# Helpers
def hash_password(password: str) -> str:
    truncated_pw = password.encode("utf-8")[:72].decode("utf-8", "ignore")
    return pwd_context.hash(password)

def verify_password(password: str, hashed: str) -> bool:
    return pwd_context.verify(password, hashed)

def create_token(user_id: int) -> str:
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": str(user_id), "exp": expire}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

# Routes
@router.post("/signup", response_model=TokenResponse)
def signup(data: SignupRequest):
    if data.email in users_db:
        raise HTTPException(status_code=400, detail="Email already registered")
    user_id = len(users_db) + 1
    hashed_pw = hash_password(data.password)
    users_db[data.email] = {
        "id": user_id,
        "username": data.username,
        "email": data.email,
        "password_hash": hashed_pw
    }
    token = create_token(user_id)
    return {
        "access_token": token,
        "user": {
            "id": user_id,
            "username": data.username,
            "email": data.email
        }
    }

@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest):
    user = users_db.get(data.email)
    if not user or not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_token(user["id"])
    return {
        "access_token": token,
        "user": {
            "id": user["id"],
            "username": user["username"],
            "email": user["email"]
        }
    }
