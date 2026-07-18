from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from secure import Secure
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from database import Base, engine
from routes.media import router as media_router
from routes.auth import router as auth_router
from routes.profile import router as profile_router
from routes.favorites import router as favorites_router
from routes.reading_progress import router as reading_progress_router
from routes.stats import router as stats_router
from routes.userlikes import router as userlikes_router
from routes.userreviews import router as userreviews_router
from routes.followers import router as followers_router
from routes.user_media_likes import router as user_media_likes_router
from routes.user_activity import router as user_activity_router
from routes.folders import router as folder_router
from dependencies import get_current_user_id
from routes.users import router as user_router
import os

# Security headers
secure_headers = Secure()

# Rate Limit
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(title="Manhwa App API")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Create tables on startup
try:
    Base.metadata.create_all(bind=engine)
    print("✓ Database tables created successfully")
except Exception as e:
    print(f"⚠ Database table creation failed: {e}")
    print("Note: Tables may already exist, continuing startup...")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------- Routers ----------
app.include_router(media_router, prefix="/api")
app.include_router(auth_router, prefix="/api")
app.include_router(profile_router, prefix="/api")
app.include_router(favorites_router, prefix="/api")
app.include_router(reading_progress_router, prefix="/api")
app.include_router(stats_router, prefix="/api")
app.include_router(userlikes_router, prefix="/api")
app.include_router(userreviews_router, prefix="/api")
app.include_router(followers_router, prefix="/api")
app.include_router(user_media_likes_router, prefix="/api")
app.include_router(user_activity_router, prefix="/api")
app.include_router(folder_router, prefix="/api")
app.include_router(user_router, prefix="/api")

# --------- Health Check ----------
@app.get("/api/health")
def health_check():
    return {"message": "Server is running", "status": "ok"}

# --------- Security Headers Middleware ----------
@app.middleware("http")
async def set_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "SAMEORIGIN"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
    return response

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3000)