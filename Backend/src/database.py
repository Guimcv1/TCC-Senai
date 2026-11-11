from __future__ import annotations

import os
from collections.abc import Generator

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

load_dotenv()


class Base(DeclarativeBase):
    pass


def _database_url() -> str:
    configured_url = os.getenv("DATABASE_URL")
    if configured_url:
        return configured_url

    user = os.getenv("POSTGRES_USER", "lanchonete")
    password = os.getenv("POSTGRES_PASSWORD", "lanchonete")
    host = os.getenv("DB_HOST", "localhost")
    port = os.getenv("DB_PORT", "5432")
    name = os.getenv("POSTGRES_DB", "lanchonete")
    return f"postgresql+psycopg://{user}:{password}@{host}:{port}/{name}"


DATABASE_URL = _database_url()
engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
