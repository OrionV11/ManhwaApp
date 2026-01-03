from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from schemas.folders import (
    FolderCreate, FolderUpdate, FolderResponse, 
    FolderItemCreate, FolderItemUpdate, FolderWithItems
)
from controllers import folders as folder_controller

router = APIRouter(prefix="/api/folders", tags=["folders"])

@router.post("", response_model=dict, status_code=status.HTTP_201_CREATED)
def create_folder(
    folder: FolderCreate,
    user_id: int = 1,  # TODO: Get from auth token
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


@router.get("", response_model=List[dict])
def get_user_folders(
    user_id: int = 1,  # TODO: Get from auth token
    db: Session = Depends(get_db)
):
    """Get all folders for a user"""
    return folder_controller.get_user_folders(db=db, user_id=user_id)


@router.get("/{folder_id}", response_model=dict)
def get_folder(
    folder_id: int,
    user_id: int = 1,  # TODO: Get from auth token
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
    user_id: int = 1,  # TODO: Get from auth token
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
    user_id: int = 1,  # TODO: Get from auth token
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
    user_id: int = 1,  # TODO: Get from auth token
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
    user_id: int = 1,  # TODO: Get from auth token
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
    user_id: int = 1,  # TODO: Get from auth token
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
