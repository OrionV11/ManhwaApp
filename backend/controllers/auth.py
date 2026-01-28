# controllers/auth.py
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from fastapi import HTTPException, status
import bcrypt
from config.database import query_db, execute_db
from schemas.auth import UserResponse
import os
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

# ----------------- Password Utils -----------------
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

# ----------------- JWT Utils -----------------
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta if expires_delta else timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# ----------------- Auth Functions -----------------
def signup(username: str, email: str, password: str):
    # Check if user exists
    existing = query_db("SELECT id FROM users WHERE email = %s OR username = %s", (email, username))
    if existing:
        raise ValueError("User already exists")

    hashed_pw = hash_password(password)
    result = execute_db(
        "INSERT INTO users (username, email, password_hash) VALUES (%s, %s, %s) RETURNING id, username, email",
        (username, email, hashed_pw)
    )

    user = result[0]
    token = create_access_token({"sub": str(user['id'])})

    return {
        "user": UserResponse(**user),
        "token": token
    }

def login(email: str, password: str):
    users = query_db("SELECT * FROM users WHERE email = %s", (email,))
    if not users:
        raise ValueError("Invalid credentials")

    user = users[0]
    if not verify_password(password, user['password_hash']):
        raise ValueError("Invalid credentials")

    token = create_access_token({"sub": str(user['id'])})
    return {
        "user": UserResponse(id=user['id'], username=user['username'], email=user['email']),
        "token": token
    }
