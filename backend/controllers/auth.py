from jose import jwt
import bcrypt
from datetime import datetime, timedelta
from config.database import query_db, execute_db
from config.settings import settings
from schemas.auth import UserResponse

def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    """Verify password against hash"""
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_token(user_id: str) -> str:
    """Create JWT token"""
    payload = {
        "id": user_id,
        "exp": datetime.utcnow() + timedelta(days=30)
    }
    token = jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.ALGORITHM)
    return token

def signup(username: str, email: str, password: str):
    """Create new user"""
    # Check if user exists
    existing = query_db(
        "SELECT id FROM users WHERE email = %s OR username = %s",
        (email, username)
    )

    if existing:
        raise ValueError("User already exists")

    # Hash password and create user
    hashed_pw = hash_password(password)
    result = execute_db(
        "INSERT INTO users (username, email, password_hash) VALUES (%s, %s, %s) RETURNING id, username, email",
        (username, email, hashed_pw)
    )

    user = result[0]
    token = create_token(str(user['id']))

    return {
        "user": UserResponse(**user),
        "token": token
    }

def login(email: str, password: str):
    """Authenticate user"""
    users = query_db("SELECT * FROM users WHERE email = %s", (email,))

    if not users:
        raise ValueError("Invalid credentials")

    user = users[0]

    if not verify_password(password, user['password_hash']):
        raise ValueError("Invalid credentials")

    token = create_token(str(user['id']))

    return {
        "user": UserResponse(id=user['id'], username=user['username'], email=user['email']),
        "token": token
    }
