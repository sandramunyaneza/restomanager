"""Configuration chargée depuis les variables d'environnement."""

from functools import lru_cache
from pathlib import Path
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Important: rendre le chemin du .env indépendant du dossier courant (cwd).
    # `settings.py` -> `config/` -> `app/` -> `backend/` (racine du projet backend)
    _ENV_PATH = Path(__file__).resolve().parents[2] / ".env"
    model_config = SettingsConfigDict(env_file=str(_ENV_PATH), env_file_encoding="utf-8", extra="ignore")

    app_name: str = "RestoManager API"
    debug: bool = False

    mysql_host: str = "127.0.0.1"
    mysql_port: int = 3306
    mysql_user: str = "root"
    mysql_password: str = "root123"
    mysql_database: str = "resto_manager"

    jwt_secret: str = "change-me-in-production-use-long-random-string"
    jwt_algorithm: str = "HS256"
    jwt_expires_minutes: int = 60 * 24

    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    @property
    def cors_origin_list(self) -> List[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
