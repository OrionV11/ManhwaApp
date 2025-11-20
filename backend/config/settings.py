from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DB_HOST: str = "localhost"
    DB_PORT: int = 5432
    DB_NAME: str = "manhwa_app"
    DB_USER: str = "postgres"
    DB_PASSWORD: str = "postgres"
    JWT_SECRET: str = "your-super-secret-key-change-this"
    ALGORITHM: str = "HS256"
    PORT: int = 3000

    class Config:
        env_file = ".env"

settings = Settings()