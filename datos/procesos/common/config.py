from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

PROCESOS_DIR = Path(__file__).resolve().parent.parent
DATOS_DIR = PROCESOS_DIR.parent
PROYECTO_DIR = DATOS_DIR.parent
SALIDA_DIR = PROCESOS_DIR / "salida"
ESTADO_DIR = PROCESOS_DIR / "estado"


def load_env() -> None:
    env_path = PROYECTO_DIR / ".env"
    if env_path.exists():
        load_dotenv(env_path)
    load_dotenv()


def get_database_url() -> str:
    load_env()
    url = os.getenv("DATABASE_URL", "").strip()
    if not url:
        raise RuntimeError(
            "DATABASE_URL no definida. Configurala en stella ultima/.env"
        )
    return url


def get_database_schema() -> str:
    load_env()
    return os.getenv("DATABASE_SCHEMA", "guarderia").strip() or "guarderia"
