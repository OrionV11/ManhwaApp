from auth import verify_token
from fastapi import FastAPI, HTTPException, Query, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from datetime import timedelta
from typing import Optional

from database import Base, engine, SessionLocal
from models import User, Media
from passlib.context import CryptContext
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional

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
class FavoriteAdd(BaseModel):
    media_id: int

class ReadingProgressAdd(BaseModel):
    media_id: int
    current_chapter: Optional[int] = 0
    total_chapters: Optional[int] = None

class ReviewAdd(BaseModel):
    media_id: int
    rating: int
    review_text: Optional[str] = None

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update with your frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------- Favorites Routes ------------
@app.post("/api/favorites/add")
def add_to_favorites(
    favorite: FavoriteAdd,
    user_id: int = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Add media to user's favorites"""
    try:
        # Check if already in favorites
        from config.database import query_db, execute_db
        existing = query_db(
            "SELECT * FROM favorites WHERE user_id = %s AND media_id = %s",
            (user_id, favorite.media_id)
        )
        
        if existing:
            raise HTTPException(status_code=400, detail="Already in favorites")
        
        # Add to favorites
        execute_db(
            "INSERT INTO favorites (user_id, media_id) VALUES (%s, %s)",
            (user_id, favorite.media_id)
        )
        
        return {"message": "Added to favorites successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/favorites/remove/{media_id}")
def remove_from_favorites(
    media_id: int,
    user_id: int = Depends(verify_token)
):
    """Remove media from favorites"""
    try:
        from config.database import execute_db
        execute_db(
            "DELETE FROM favorites WHERE user_id = %s AND media_id = %s",
            (user_id, media_id)
        )
        return {"message": "Removed from favorites"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/favorites")
def get_user_favorites(user_id: int = Depends(verify_token)):
    """Get user's favorite media"""
    try:
        from config.database import query_db
        results = query_db("""
            SELECT m.* FROM media m
            JOIN favorites f ON m.id = f.media_id
            WHERE f.user_id = %s
            ORDER BY f.created_at DESC
        """, (user_id,))
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --------- Reading Progress Routes ------------
@app.post("/api/reading-progress/add")
def add_to_reading_list(
    progress: ReadingProgressAdd,
    user_id: int = Depends(verify_token)
):
    """Add media to reading list"""
    try:
        from config.database import query_db, execute_db
        
        # Check if already exists
        existing = query_db(
            "SELECT * FROM reading_progress WHERE user_id = %s AND media_id = %s",
            (user_id, progress.media_id)
        )
        
        if existing:
            # Update existing
            execute_db("""
                UPDATE reading_progress 
                SET current_chapter = %s, total_chapters = %s, last_read_at = CURRENT_TIMESTAMP
                WHERE user_id = %s AND media_id = %s
            """, (progress.current_chapter, progress.total_chapters, user_id, progress.media_id))
        else:
            # Insert new
            execute_db("""
                INSERT INTO reading_progress (user_id, media_id, current_chapter, total_chapters)
                VALUES (%s, %s, %s, %s)
            """, (user_id, progress.media_id, progress.current_chapter, progress.total_chapters))
        
        return {"message": "Reading progress updated"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/reading-progress")
def get_reading_progress(user_id: int = Depends(verify_token)):
    """Get user's reading list"""
    try:
        from config.database import query_db
        results = query_db("""
            SELECT 
                m.*,
                rp.current_chapter,
                rp.total_chapters,
                rp.last_read_at
            FROM media m
            JOIN reading_progress rp ON m.id = rp.media_id
            WHERE rp.user_id = %s
            ORDER BY rp.last_read_at DESC
        """, (user_id,))
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/reading-progress/{media_id}")
def update_reading_progress(
    media_id: int,
    progress: ReadingProgressAdd,
    user_id: int = Depends(verify_token)
):
    """Update reading progress for a specific media"""
    try:
        from config.database import execute_db
        execute_db("""
            UPDATE reading_progress 
            SET current_chapter = %s, total_chapters = %s, last_read_at = CURRENT_TIMESTAMP
            WHERE user_id = %s AND media_id = %s
        """, (progress.current_chapter, progress.total_chapters, user_id, media_id))
        
        return {"message": "Progress updated"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# --------- Reviews Routes ------------
@app.post("/api/reviews/add")
def add_review(
    review: ReviewAdd,
    user_id: int = Depends(verify_token)
):
    """Add or update a review"""
    if review.rating < 1 or review.rating > 10:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 10")
    
    try:
        from config.database import query_db, execute_db
        
        # Check if review already exists
        existing = query_db(
            "SELECT * FROM reviews WHERE user_id = %s AND media_id = %s",
            (user_id, review.media_id)
        )
        
        if existing:
            # Update existing review
            execute_db("""
                UPDATE reviews 
                SET rating = %s, review_text = %s, updated_at = CURRENT_TIMESTAMP
                WHERE user_id = %s AND media_id = %s
            """, (review.rating, review.review_text, user_id, review.media_id))
        else:
            # Insert new review
            execute_db("""
                INSERT INTO reviews (user_id, media_id, rating, review_text)
                VALUES (%s, %s, %s, %s)
            """, (user_id, review.media_id, review.rating, review.review_text))
        
        return {"message": "Review submitted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/reviews/media/{media_id}")
def get_media_reviews(media_id: int, limit: int = Query(20, ge=1, le=100)):
    """Get reviews for a specific media"""
    try:
        from config.database import query_db
        results = query_db("""
            SELECT 
                r.id,
                r.rating,
                r.review_text,
                r.created_at,
                r.updated_at,
                u.name as user_name
            FROM reviews r
            JOIN users u ON r.user_id = u.id
            WHERE r.media_id = %s
            ORDER BY r.created_at DESC
            LIMIT %s
        """, (media_id, limit))
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/reviews/user")
def get_user_reviews(user_id: int = Depends(verify_token)):
    """Get all reviews by the current user"""
    try:
        from config.database import query_db
        results = query_db("""
            SELECT 
                r.*,
                m.title_english,
                m.title_romaji,
                m.cover_image
            FROM reviews r
            JOIN media m ON r.media_id = m.id
            WHERE r.user_id = %s
            ORDER BY r.created_at DESC
        """, (user_id,))
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/reviews/{media_id}")
def delete_review(
    media_id: int,
    user_id: int = Depends(verify_token)
):
    """Delete a review"""
    try:
        from config.database import execute_db
        execute_db(
            "DELETE FROM reviews WHERE user_id = %s AND media_id = %s",
            (user_id, media_id)
        )
        return {"message": "Review deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



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



@app.put("/api/profile/{user_id}")
def update_profile(
    user_id: int,
    username: Optional[str] = None,
    bio: Optional[str] = None,
    profile_picture: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Update user profile"""
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Check if username is already taken
        if username and username != user.username:
            existing = db.query(User).filter(User.username == username).first()
            if existing:
                raise HTTPException(status_code=400, detail="Username already taken")
            user.username = username
        
        if bio is not None:
            user.bio = bio
        
        if profile_picture is not None:
            user.profile_picture = profile_picture
        
        db.commit()
        db.refresh(user)
        
        return {
            "message": "Profile updated successfully",
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "bio": user.bio,
                "profile_picture": user.profile_picture,
            }
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Update profile error: {e}")
        db.rollback()
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