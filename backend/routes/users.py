# backend/routes/users.py or backend/main.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from dependencies import get_current_user_id

router = APIRouter()

@router.get("/api/users/settings")
async def get_user_settings(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Get user settings"""
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Return user settings (adjust fields as needed)
    return {
        "user_id": user.id,
        "email_notifications": True,  # Default values
        "privacy_public_profile": False,
        "theme": "light",
        # Add more settings as needed
    }

@router.put("/api/users/{user_id}/settings")
async def update_user_settings(
    settings: dict,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Update user settings"""
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update settings logic here
    return {"message": "Settings updated successfully"}