
from sqlalchemy.orm import Session
from typing import Dict, List, Optional
from models import Folder, FolderItem, User

def create_folder(
    db: Session, 
    user_id: int, 
    title: str, 
    description: Optional[str] = None,
    is_public: bool = False
) -> Dict:
    """Create a new empty folder"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise ValueError(f"User with id {user_id} not found")
    
    new_folder = Folder(
        user_id=user_id,
        title=title,
        description=description,
        is_public=is_public
    )
    
    db.add(new_folder)
    db.commit()
    db.refresh(new_folder)
    
    return {
        "message": "Folder created successfully",
        "folder_id": new_folder.id,
        "user_id": new_folder.user_id,
        "title": new_folder.title,
        "description": new_folder.description,
        "is_public": new_folder.is_public,
        "created_at": new_folder.created_at
    }


def get_user_folders(db: Session, user_id: int) -> List[Dict]:
    """Get all folders for a user"""
    folders = db.query(Folder).filter(Folder.user_id == user_id).all()
    
    result = []
    for folder in folders:
        item_count = db.query(FolderItem).filter(FolderItem.folder_id == folder.id).count()
        result.append({
            "id": folder.id,
            "user_id": folder.user_id,
            "title": folder.title,
            "description": folder.description,
            "is_public": folder.is_public,
            "likes_count": folder.likes_count,
            "item_count": item_count,
            "created_at": folder.created_at,
            "updated_at": folder.updated_at
        })
    
    return result


def get_folder_by_id(db: Session, folder_id: int, user_id: Optional[int]) -> Dict:
    # First find the folder
    folder = db.query(Folder).filter(Folder.id == folder_id).first()
    
    if not folder:
        raise ValueError(f"Folder with id {folder_id} not found")
    
    # Allow access if: owner OR public folder
    if folder.user_id != user_id and not folder.is_public:
        raise ValueError(f"Access denied")
    
    items = db.query(FolderItem).filter(FolderItem.folder_id == folder_id).all()
    
    items_list = []
    for item in items:
        items_list.append({
            "id": item.id,
            "media_id": item.media_id,
            "added_at": item.added_at,
            "notes": item.notes
        })
    
    return {
        "id": folder.id,
        "user_id": folder.user_id,
        "title": folder.title,
        "description": folder.description,
        "is_public": folder.is_public,
        "likes_count": folder.likes_count,
        "items": items_list,
        "created_at": folder.created_at,
        "updated_at": folder.updated_at
    }


def update_folder(
    db: Session,
    folder_id: int,
    user_id: int,
    title: Optional[str] = None,
    description: Optional[str] = None,
    is_public: Optional[bool] = None
) -> Dict:
    """Update folder details"""
    folder = db.query(Folder).filter(
        Folder.id == folder_id,
        Folder.user_id == user_id
    ).first()
    
    if not folder:
        raise ValueError(f"Folder with id {folder_id} not found or access denied")
    
    if title is not None:
        folder.title = title
    if description is not None:
        folder.description = description
    if is_public is not None:
        folder.is_public = is_public
    
    db.commit()
    db.refresh(folder)
    
    return {
        "message": "Folder updated successfully",
        "folder_id": folder.id,
        "title": folder.title,
        "description": folder.description,
        "is_public": folder.is_public,
        "updated_at": folder.updated_at
    }


def delete_folder(db: Session, folder_id: int, user_id: int) -> Dict:
    """Delete a folder and all its items"""
    folder = db.query(Folder).filter(
        Folder.id == folder_id,
        Folder.user_id == user_id
    ).first()
    
    if not folder:
        raise ValueError(f"Folder with id {folder_id} not found or access denied")
    
    db.delete(folder)
    db.commit()
    
    return {
        "message": "Folder deleted successfully",
        "folder_id": folder_id
    }


def add_media_to_folder(
    db: Session,
    folder_id: int,
    user_id: int,
    media_id: int,
    notes: Optional[str] = None
) -> Dict:
    """Add media to a folder"""
    folder = db.query(Folder).filter(
        Folder.id == folder_id,
        Folder.user_id == user_id
    ).first()
    
    if not folder:
        raise ValueError(f"Folder with id {folder_id} not found or access denied")
    
    existing = db.query(FolderItem).filter(
        FolderItem.folder_id == folder_id,
        FolderItem.media_id == media_id
    ).first()
    
    if existing:
        raise ValueError(f"Media with id {media_id} already in this folder")
    
    new_item = FolderItem(
        folder_id=folder_id,
        media_id=media_id,
        notes=notes
    )
    
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    
    return {
        "message": "Media added to folder successfully",
        "item_id": new_item.id,
        "folder_id": folder_id,
        "media_id": media_id,
        "added_at": new_item.added_at
    }


def remove_media_from_folder(
    db: Session,
    folder_id: int,
    user_id: int,
    media_id: int
) -> Dict:
    """Remove media from a folder"""
    folder = db.query(Folder).filter(
        Folder.id == folder_id,
        Folder.user_id == user_id
    ).first()
    
    if not folder:
        raise ValueError(f"Folder with id {folder_id} not found or access denied")
    
    item = db.query(FolderItem).filter(
        FolderItem.folder_id == folder_id,
        FolderItem.media_id == media_id
    ).first()
    
    if not item:
        raise ValueError(f"Media with id {media_id} not in this folder")
    
    db.delete(item)
    db.commit()
    
    return {
        "message": "Media removed from folder successfully",
        "folder_id": folder_id,
        "media_id": media_id
    }


def update_folder_item_notes(
    db: Session,
    folder_id: int,
    user_id: int,
    media_id: int,
    notes: str
) -> Dict:
    """Update notes for a media item in a folder"""
    folder = db.query(Folder).filter(
        Folder.id == folder_id,
        Folder.user_id == user_id
    ).first()
    
    if not folder:
        raise ValueError(f"Folder with id {folder_id} not found or access denied")
    
    item = db.query(FolderItem).filter(
        FolderItem.folder_id == folder_id,
        FolderItem.media_id == media_id
    ).first()
    
    if not item:
        raise ValueError(f"Media with id {media_id} not in this folder")
    
    item.notes = notes
    db.commit()
    db.refresh(item)
    
    return {
        "message": "Notes updated successfully",
        "item_id": item.id,
        "notes": item.notes
    }
