from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.pool import NullPool
import os

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable not set!")

# Ensure sslmode=require for Render
if "postgresql" in DATABASE_URL:
    if "?sslmode=" in DATABASE_URL:
        DATABASE_URL = DATABASE_URL.split("?sslmode=")[0] + "?sslmode=require"
    else:
        DATABASE_URL = DATABASE_URL + "?sslmode=require"

print(f"Connecting to Render PostgreSQL...")

engine = create_engine(
    DATABASE_URL,
    connect_args={
        "connect_timeout": 15,
        "application_name": "manhwa_app",
        "sslmode": "require",
    },
    pool_pre_ping=True,
    pool_recycle=3600,
    poolclass=NullPool,
)

SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()