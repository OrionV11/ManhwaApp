from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.pool import NullPool
import os
from dotenv import load_dotenv
import ssl

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("DATABASE_URL not set!")

# Configure SSL based on environment
connect_args = {
    "connect_timeout": 15,
    "application_name": "manhwa_app",
}

# If using Render (render.com), enforce SSL
if "render.com" in DATABASE_URL:
    # Ensure sslmode is set to require
    if "?sslmode=" not in DATABASE_URL:
        DATABASE_URL = DATABASE_URL + "?sslmode=require"
    
    # Add SSL context
    connect_args["sslmode"] = "require"
    
elif "localhost" in DATABASE_URL:
    # Local development - disable SSL
    if "?sslmode=" not in DATABASE_URL:
        DATABASE_URL = DATABASE_URL + "?sslmode=disable"
    connect_args["sslmode"] = "disable"

print(f"Connecting to database...")

try:
    engine = create_engine(
        DATABASE_URL,
        connect_args=connect_args,
        pool_pre_ping=True,
        pool_recycle=3600,
        poolclass=NullPool,
    )
    
    # Test connection
    with engine.connect() as conn:
        print("Database connection successful!")
    
except Exception as e:
    print(f"Database connection failed: {e}")
    raise

SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()

from models import Media, User, UserFollow, MediaLike, Folder, FolderItem  # Import models to register them with Base

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()