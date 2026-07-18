from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os
from dotenv import load_dotenv
import certifi

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("DATABASE_URL not set!")

connect_args = {
    "connect_timeout": 15,
    "application_name": "manhwa_app",
}

if "render.com" in DATABASE_URL:
    if "?sslmode=" not in DATABASE_URL:
        DATABASE_URL = DATABASE_URL + "?sslmode=require"
    connect_args["sslcert"] = certifi.where()
elif "localhost" in DATABASE_URL:
    if "?sslmode=" not in DATABASE_URL:
        DATABASE_URL = DATABASE_URL + "?sslmode=disable"

print(f"Connecting to database...")

try:
    engine = create_engine(
        DATABASE_URL,
        connect_args=connect_args,
        pool_pre_ping=True,
        pool_recycle=3600,
        pool_size=5,
        max_overflow=10,
    )
    
    with engine.connect() as conn:
        print("✅ Database connection successful!")
    
except Exception as e:
    print(f"❌ Database connection failed: {e}")
    raise

SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()

# Remove the model imports from here - they'll import Base from this file

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()