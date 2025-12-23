from fastapi import APIRouter, HTTPException, status
from typing import Optional
from controllers import profile

router = APIRouter(prefix="/api/profile", tags=["profile"])

@router.put("/{user_id}")
def update_profile(
    user_id: int,
    username: Optional[str] = None,
    bio: Optional[str] = None,
    profile_picture: Optional[str] = None,
):
    try:
        return profile.update_profile(
            user_id=user_id,
            username=username,
            bio=bio,
            profile_picture=profile_picture,
        )
    except ValueError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(e))
    except Exception as e:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Server error")
