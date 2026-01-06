# schemas/folders.py
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class FolderCreate(BaseModel):
    """Schema for creating a new folder"""
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    is_public: bool = False


class FolderUpdate(BaseModel):
    """Schema for updating a folder"""
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    is_public: Optional[bool] = None


class FolderItemCreate(BaseModel):
    """Schema for adding media to a folder"""
    media_id: int
    notes: Optional[str] = None


class FolderItemUpdate(BaseModel):
    """Schema for updating folder item notes"""
    notes: str


class FolderItemResponse(BaseModel):
    """Schema for folder item response"""
    id: int
    folder_id: int
    media_id: int
    added_at: datetime
    notes: Optional[str]
    
    class Config:
        from_attributes = True


class FolderResponse(BaseModel):
    """Schema for folder response"""
    id: int
    user_id: int
    title: str
    description: Optional[str]
    is_public: bool
    likes_count: int
    item_count: Optional[int] = 0
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True


class FolderWithItems(BaseModel):
    """Schema for folder with all its media items"""
    id: int
    user_id: int
    title: str
    description: Optional[str]
    is_public: bool
    likes_count: int
    items: List[FolderItemResponse] = []
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True