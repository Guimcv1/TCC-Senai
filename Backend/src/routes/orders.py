from __future__ import annotations

from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from src.database import get_db
from src.models import Order, OrderStatusHistory
from src.schemas.common import OrderCreate, OrderHistoryResponse, OrderResponse, StatusUpdate
from src.services.order_service import create_order, update_order_status

router = APIRouter(prefix="/orders", tags=["pedidos"])


@router.get("", response_model=list[OrderResponse])
def list_orders(db: Session = Depends(get_db)) -> list[Order]:
    return list(db.scalars(select(Order).order_by(Order.id.desc())).all())


@router.get("/{order_id}", response_model=OrderResponse)
def get_order(order_id: int, db: Session = Depends(get_db)) -> Order:
    order = db.get(Order, order_id)
    if order is None:
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="Pedido não encontrado.")
    return order


@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order_route(payload: OrderCreate, db: Session = Depends(get_db)) -> Order:
    return create_order(db, payload)


@router.delete("/{order_id}", status_code=204)
def delete_order(order_id: int, db: Session = Depends(get_db)) -> None:
    from src.services.crud import delete_entity

    delete_entity(db, Order, order_id)


@router.patch("/{order_id}/status", response_model=OrderResponse)
def update_status(order_id: int, payload: StatusUpdate, db: Session = Depends(get_db)) -> Order:
    return update_order_status(db, order_id, payload.status_id)


@router.get("/{order_id}/history", response_model=list[OrderHistoryResponse])
def order_history(order_id: int, db: Session = Depends(get_db)) -> list[OrderStatusHistory]:
    return list(
        db.scalars(
            select(OrderStatusHistory)
            .where(OrderStatusHistory.order_id == order_id)
            .order_by(OrderStatusHistory.changed_at)
        ).all()
    )
