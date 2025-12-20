from fastapi import FastAPI, HTTPException, Query, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from datetime import timedelta
from typing import Optional

from database import Base, engine, SessionLocal
from models import User, Media
from passlib.context import CryptContext
from fastapi.middleware.cors import CORSMiddleware

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
    username: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict

# CORS middleware
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
    return {"message": "Server is running", "status": "ok"}

@app.post("/signup", response_model=dict)
def signup(user: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Check username
    existing_username = db.query(User).filter(User.username == user.username).first()
    if existing_username:
        raise HTTPException(status_code=400, detail="Username already taken")
    
    new_user = User(
        username=user.username,
        email=user.email,
        hashed_password=hash_password(user.password),
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return {"message": "User created successfully", "user_id": new_user.id}

@app.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if not db_user or not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # For now, return a simple response (you can add JWT later)
    return {
        "message": "Login successful",
        "user": {
            "id": db_user.id,
            "username": db_user.username,
            "email": db_user.email,
        }
    }

@app.get("/api/media/search")
def search_media(
    query: str = Query(..., min_length=1),
    type: Optional[str] = None,
    genre: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Search for anime/manga/manhwa"""
    try:
        # Start with base query
        media_query = db.query(Media)
        
        # Search in title fields
        search_filter = (
            Media.title_romaji.ilike(f"%{query}%") |
            Media.title_english.ilike(f"%{query}%")
        )
        media_query = media_query.filter(search_filter)
        
        # Filter by type if provided
        if type:
            media_query = media_query.filter(Media.type == type.upper())
        
        # Filter by genre if provided (PostgreSQL array contains)
        if genre:
            media_query = media_query.filter(Media.genres.contains([genre]))
        
        # Order by score and limit
        results = media_query.order_by(Media.average_score.desc()).limit(50).all()
        
        # Convert to dict
        return [media_to_dict(media) for media in results]
    
    except Exception as e:
        print(f"Search error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/media/trending")
def get_trending(limit: int = Query(10, ge=1, le=100), db: Session = Depends(get_db)):
    """Get trending media"""
    try:
        results = db.query(Media)\
            .filter(Media.average_score.isnot(None))\
            .order_by(Media.popularity.desc(), Media.average_score.desc())\
            .limit(limit)\
            .all()
        
        return [media_to_dict(media) for media in results]
    
    except Exception as e:
        print(f"Trending error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/media/latest")
def get_latest(limit: int = Query(10, ge=1, le=100), db: Session = Depends(get_db)):
    """Get latest media added"""
    try:
        results = db.query(Media)\
            .order_by(Media.created_at.desc())\
            .limit(limit)\
            .all()
        
        return [media_to_dict(media) for media in results]
    
    except Exception as e:
        print(f"Latest error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/media/{media_id}")
def get_media_by_id(media_id: int, db: Session = Depends(get_db)):
    """Get media details by ID"""
    try:
        media = db.query(Media).filter(Media.id == media_id).first()
        
        if not media:
            raise HTTPException(status_code=404, detail="Media not found")
        
        return media_to_dict(media)
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Get media error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/media/type/{media_type}")
def get_by_type(
    media_type: str,
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Get media by type (ANIME, MANGA, MANHWA, MANHUA)"""
    try:
        results = db.query(Media)\
            .filter(Media.type == media_type.upper())\
            .order_by(Media.popularity.desc())\
            .limit(limit)\
            .all()
        
        return [media_to_dict(media) for media in results]
    
    except Exception as e:
        print(f"Get by type error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

def media_to_dict(media: Media) -> dict:
    """Convert Media object to dictionary"""
    return {
        "id": media.id,
        "title_romaji": media.title_romaji,
        "title_english": media.title_english,
        "title_native": media.title_native,
        "type": media.type,
        "format": media.format,
        "status": media.status,
        "description": media.description,
        "start_date": media.start_date.isoformat() if media.start_date else None,
        "end_date": media.end_date.isoformat() if media.end_date else None,
        "chapters": media.chapters,
        "volumes": media.volumes,
        "episodes": media.episodes,
        "cover_image": media.cover_image,
        "banner_image": media.banner_image,
        "genres": media.genres or [],
        "tags": media.tags or [],
        "average_score": float(media.average_score) if media.average_score else None,
        "popularity": media.popularity,
        "favorites": media.favorites,
        "source": media.source,
        "country_of_origin": media.country_of_origin,
        "created_at": media.created_at.isoformat() if media.created_at else None,
        "updated_at": media.updated_at.isoformat() if media.updated_at else None,
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3000)