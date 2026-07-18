from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.pool import NullPool
import os

# Get database URL from environment or use default
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://localhost/manhwa")

# Add SSL mode if using PostgreSQL and sslmode not already specified
if "postgresql" in DATABASE_URL and "?sslmode=" not in DATABASE_URL:
    DATABASE_URL = DATABASE_URL + "?sslmode=prefer"

print(f"Database URL: {DATABASE_URL.split('@')[1] if '@' in DATABASE_URL else 'local'}")

# Create engine with proper connection settings for Render
engine = create_engine(
    DATABASE_URL,
    connect_args={
        "connect_timeout": 10,
        "application_name": "manhwa_app",
    },
    pool_pre_ping=True,  # Test connection before using
    pool_recycle=3600,   # Recycle connections every hour
    poolclass=NullPool,  # Important for serverless/Render deployments
    echo=False,          # Set to True for SQL debugging
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base for ORM models
Base = declarative_base()

# Dependency for getting DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()