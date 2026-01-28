from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from dependencies import get_current_user_id, get_optional_current_user_id
from database import get_db
from models import Folder, FolderItem, User, Media
from schemas.folders import (
    FolderCreate, FolderUpdate, FolderResponse, 
    FolderItemCreate, FolderItemUpdate, FolderWithItems
)
from controllers import folders as folder_controller

router = APIRouter(prefix="/folders", tags=["folders"])

@router.get("/public")
def get_public_folders(
    sort: str = "popular",  # popular, recent
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Get public folders sorted by popularity"""
    
    query = db.query(Folder).filter(Folder.is_public == True)
    
    if sort == "popular":
        query = query.order_by(Folder.likes_count.desc())
    elif sort == "recent":
        query = query.order_by(Folder.created_at.desc())
    
    folders = query.limit(limit).all()
    
    result = []
    for folder in folders:
        user = db.query(User).filter(User.id == folder.user_id).first()
        item_count = db.query(FolderItem).filter(FolderItem.folder_id == folder.id).count()
        
        # Get preview images
        items = db.query(FolderItem).filter(FolderItem.folder_id == folder.id).limit(4).all()
        preview_images = []
        for item in items:
            media = db.query(Media).filter(Media.id == item.media_id).first()
            if media and media.cover_image:
                preview_images.append(media.cover_image)
        
        result.append({
            "id": folder.id,
            "user_id": folder.user_id,
            "title": folder.title,
            "description": folder.description,
            "is_public": folder.is_public,
            "likes_count": folder.likes_count or 0,
            "item_count": item_count,
            "created_at": folder.created_at.isoformat(),
            "user": {
                "id": user.id,
                "username": user.username,
                "profile_picture": user.profile_picture,
            } if user else None,
            "preview_images": preview_images,
        })
    
    return result

@router.post("", response_model=dict, status_code=status.HTTP_201_CREATED)
def create_folder(
    folder: FolderCreate,
    user_id: int = Depends(get_current_user_id),  
    db: Session = Depends(get_db)
):
    """Create a new folder"""
    try:
        return folder_controller.create_folder(
            db=db,
            user_id=user_id,
            title=folder.title,
            description=folder.description,
            is_public=folder.is_public
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/me", response_model=List[dict])
def get_user_folders(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Get all folders for a user"""
    return folder_controller.get_user_folders(db=db, user_id=user_id)


@router.get("/{folder_id}", response_model=dict)
def get_folder(
    folder_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Get a specific folder with all its items"""
    try:
        return folder_controller.get_folder_by_id(
            db=db,
            folder_id=folder_id,
            user_id=user_id
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.put("/{folder_id}", response_model=dict)
def update_folder(
    folder_id: int,
    folder_update: FolderUpdate,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Update a folder"""
    try:
        return folder_controller.update_folder(
            db=db,
            folder_id=folder_id,
            user_id=user_id,
            title=folder_update.title,
            description=folder_update.description,
            is_public=folder_update.is_public
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.delete("/{folder_id}", status_code=status.HTTP_200_OK)
def delete_folder(
    folder_id: int,
    user_id: int = Depends(get_current_user_id),  
    db: Session = Depends(get_db)
):
    """Delete a folder"""
    try:
        return folder_controller.delete_folder(
            db=db,
            folder_id=folder_id,
            user_id=user_id
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.post("/{folder_id}/items", status_code=status.HTTP_201_CREATED)
def add_media_to_folder(
    folder_id: int,
    item: FolderItemCreate,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Add media to a folder"""
    try:
        return folder_controller.add_media_to_folder(
            db=db,
            folder_id=folder_id,
            user_id=user_id,
            media_id=item.media_id,
            notes=item.notes
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/{folder_id}/items/{media_id}")
def remove_media_from_folder(
    folder_id: int,
    media_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Remove media from a folder"""
    try:
        return folder_controller.remove_media_from_folder(
            db=db,
            folder_id=folder_id,
            user_id=user_id,
            media_id=media_id
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.put("/{folder_id}/items/{media_id}/notes")
def update_item_notes(
    folder_id: int,
    media_id: int,
    notes_update: FolderItemUpdate,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Update notes for a media item in a folder"""
    try:
        return folder_controller.update_folder_item_notes(
            db=db,
            folder_id=folder_id,
            user_id=user_id,
            media_id=media_id,
            notes=notes_update.notes
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

