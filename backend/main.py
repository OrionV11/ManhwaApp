from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import auth, media, entries

app = FastAPI(title="Manhwa App API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes
app.include_router(auth.router)
app.include_router(media.router)
app.include_router(entries.router)

@app.get("/api/health")
def health_check():
    return {"message": "Server is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3000)