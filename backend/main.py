from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from passlib.context import CryptContext

from database import Base, engine
from routes.media import router as media_router
from routes.auth import router as auth_router
from routes.profile import router as profile_router
from routes.favorites import router as favorites_router
from routes.reading_progress import router as reading_progress_router
from routes.stats import router as stats_router 

app = FastAPI(title="Manhwa App API")

# Create tables
Base.metadata.create_all(bind=engine)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

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

# --------- Health ----------
@app.get("/api/health")
def health_check():
    return {"message": "Server is running", "status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3000)