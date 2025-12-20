from fastapi import FastAPI, HTTPException, Query, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from datetime import timedelta

from database import Base, engine, SessionLocal
from models import User
from passlib.context import CryptContext
from fastapi.middleware.cors import CORSMiddleware
from config.database import query_db
from auth import create_access_token, verify_token, ACCESS_TOKEN_EXPIRE_MINUTES

app = FastAPI(title="Manhwa App API")

# Create tables
Base.metadata.create_all(bind=engine)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def hash_password(password: str):
    return pwd_context.hash(password)

def verify_password(password, hashed):
    return pwd_context.verify(password, hashed)

# --------- Schemas ------------
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict

# CORS middleware - moved before routes
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update with your frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- Routes -----------
@app.get("/api/health")
def health_check():
    return {"message": "Server is running"}

@app.post("/signup", response_model=dict)
def signup(user: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    new_user = User(
        name=user.name,
        email=user.email,
        hashed_password=hash_password(user.password),
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return {"message": "User created successfully", "user_id": new_user.id}

@app.post("/login", response_model=Token)
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if not db_user or not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Create JWT token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": db_user.id, "email": db_user.email},
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": db_user.id,
            "name": db_user.name,
            "email": db_user.email,
        }
    }

# Protected route example
@app.get("/api/profile")
def get_profile(user_id: int = Depends(verify_token), db: Session = Depends(get_db)):
    """Get user profile (requires authentication)"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "created_at": user.created_at
    }

@app.get("/api/media/search")
def search_media(query: str = Query(..., min_length=1), type: str = None, genre: str = None):
    """Search for anime/manga"""
    try:
        sql = """
            SELECT * FROM media
            WHERE (title_romaji ILIKE %s OR title_english ILIKE %s)
        """
        params = [f"%{query}%", f"%{query}%"]
        
        if type:
            sql += " AND type = %s"
            params.append(type.upper())
        
        if genre:
            sql += " AND %s = ANY(genres)"
            params.append(genre)
        
        sql += " ORDER BY average_score DESC LIMIT 50"
        
        results = query_db(sql, tuple(params))
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/media/trending")
def get_trending(limit: int = Query(10, ge=1, le=100)):
    """Get trending media"""
    try:
        sql = """
            SELECT * FROM media
            ORDER BY average_score DESC
            LIMIT %s
        """
        results = query_db(sql, (limit,))
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/media/latest")
def get_latest(limit: int = Query(10, ge=1, le=100)):
    """Get latest media added"""
    try:
        sql = """
            SELECT * FROM media
            ORDER BY created_at DESC
            LIMIT %s
        """
        results = query_db(sql, (limit,))
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/media/{media_id}")
def get_media_by_id(media_id: int):
    """Get media details by ID"""
    try:
        results = query_db("SELECT * FROM media WHERE id = %s", (media_id,))
        if not results:
            raise HTTPException(status_code=404, detail="Media not found")
        return results[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3000)