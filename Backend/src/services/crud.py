from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

ModelT = TypeVar("ModelT")


def list_entities(db: Session, model: type[ModelT]) -> list[ModelT]:
    return list(db.scalars(select(model).order_by(model.id)).all())  # type: ignore[attr-defined]


def get_entity(db: Session, model: type[ModelT], entity_id: int) -> ModelT:
    entity = db.get(model, entity_id)
    if entity is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Registro não encontrado.")
    return entity


def create_entity(db: Session, model: type[ModelT], data: Mapping[str, Any]) -> ModelT:
    entity = model(**data)
    db.add(entity)
    db.commit()
    db.refresh(entity)
    return entity


def update_entity(db: Session, model: type[ModelT], entity_id: int, data: Mapping[str, Any]) -> ModelT:
    entity = get_entity(db, model, entity_id)
    for key, value in data.items():
        if key != "id":
            setattr(entity, key, value)
    db.commit()
    db.refresh(entity)
    return entity


def delete_entity(db: Session, model: type[ModelT], entity_id: int) -> None:
    entity = get_entity(db, model, entity_id)
    db.delete(entity)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Registro não pode ser removido porque possui dados relacionados.",
        ) from exc
