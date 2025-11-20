from fastapi import APIRouter, HTTPException, status
from schemas.auth import SignupRequest, LoginRequest
from controllers import auth

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/signup")
def signup(data: SignupRequest):
    try:
        return auth.signup(data.username, data.email, data.password)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Server error")

@router.post("/login")
def login(data: LoginRequest):
    try:
        return auth.login(data.email, data.password)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Server error")
