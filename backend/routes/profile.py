from fastapi import APIRouter, HTTPException, status, Depends, Body
from typing import Optional
from pydantic import BaseModel
from controllers import profile
from dependencies import get_current_user_id

router = APIRouter(prefix="/profile", tags=["profile"])

# Create a Pydantic model for the request body
class ProfileUpdate(BaseModel):
    username: Optional[str] = None
    bio: Optional[str] = None
    profile_picture: Optional[str] = None

@router.put("/")
def update_profile(
    profile_data: ProfileUpdate,  # Accept JSON body
    user_id: int = Depends(get_current_user_id),
):
    try:
        return profile.update_profile(
            user_id=user_id,
            username=profile_data.username,
            bio=profile_data.bio,
            profile_picture=profile_data.profile_picture,
        )
    except ValueError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(e))
    except Exception as e:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Server error")
