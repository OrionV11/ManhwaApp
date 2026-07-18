#!/usr/bin/env python3
"""
Create database user and grant permissions
Run as the postgres admin user
"""
from sqlalchemy import text, create_engine
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("❌ DATABASE_URL not set in .env file!")
    exit(1)

print("🔐 Setting up database permissions...\n")

try:
    engine = create_engine(
        DATABASE_URL,
        connect_args={"connect_timeout": 15},
        pool_pre_ping=True,
    )
    
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()
    
    # Test connection
    db.execute(text("SELECT 1"))
    print("✓ Connected to database")
    
    # Create user if it doesn't exist
    print("\n👤 Creating user 'manhwaapp_db_user' if not exists...")
    try:
        db.execute(text("""
            CREATE USER manhwaapp_db_user WITH PASSWORD 'g511pMdXWHIdnzhq9a2W5fsvZTg1EoDN';
        """))
        db.commit()
        print("✓ User created")
    except Exception as e:
        if "already exists" in str(e):
            print("✓ User already exists")
            db.rollback()
        else:
            print(f"⚠ {e}")
            db.rollback()
    
    # Grant privileges
    print("\n🔐 Granting privileges...")
    
    commands = [
        "GRANT CONNECT ON DATABASE manhwaapp_db TO manhwaapp_db_user;",
        "GRANT USAGE ON SCHEMA public TO manhwaapp_db_user;",
        "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO manhwaapp_db_user;",
        "GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO manhwaapp_db_user;",
        "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO manhwaapp_db_user;",
        "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO manhwaapp_db_user;",
    ]
    
    for cmd in commands:
        try:
            db.execute(text(cmd))
            db.commit()
            cmd_short = ' '.join(cmd.split()[0:3])
            print(f"✓ {cmd_short}...")
        except Exception as e:
            db.rollback()
            cmd_short = ' '.join(cmd.split()[0:3])
            print(f"⚠ {cmd_short}: {str(e)[:60]}")
    
    db.close()
    print("\n✅ Database user setup complete!")
    print("\nYou can now run: python import_data_fixed.py")

except Exception as e:
    print(f"❌ Error: {e}")
    exit(1)