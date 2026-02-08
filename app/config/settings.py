import os
from pydantic_settings import BaseSettings
from typing import Optional
from functools import lru_cache


class Settings(BaseSettings):
    # Application settings
    APP_NAME: str = "InItinereGo API"
    DEBUG: bool = True
    API_V1_PREFIX: str = "/api/v1"
    
    # Security settings
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # MongoDB settings
    MONGODB_URL: str = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    MONGODB_DB_NAME: str = os.getenv("MONGODB_DB_NAME", "initinerego")
    
    # CORS settings
    CORS_ORIGINS: list = [
        "http://localhost:3000", 
        "http://localhost:8081",
        "http://localhost:19000", 
        "http://localhost:19006",
        "http://127.0.0.1:8081",
        "http://127.0.0.1:19000",
        "http://127.0.0.1:19006",
        "https://initinerego-api-2df8651fd39b.herokuapp.com",
        "https://expo.dev",
        "https://exp.host"
    ]
    
    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
