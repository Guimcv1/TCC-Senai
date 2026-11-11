from __future__ import annotations

from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from src.models import Addon, Customer, Delivery, Ingredient, Order, OrderItem, OrderItemAddon, OrderStatus, OrderStatusHistory, Payment, Product
from src.schemas.common import OrderCreate


def create_order(db: Session, data: OrderCreate) -> Order:
    if data.delivery_type != "counter" and data.customer_id is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Pedidos que não são de balcão exigem um cliente cadastrado.",
        )
    customer = db.get(Customer, data.customer_id) if data.customer_id is not None else None
    if data.customer_id is not None and customer is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cliente não encontrado.")
    if data.delivery_type == "delivery" and (customer is None or not customer.address):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Pedidos de delivery exigem um cliente com endereço cadastrado.",
        )
    if data.delivery_type == "delivery" and data.delivery is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="O endereço do cliente é obrigatório para pedidos delivery.",
        )
    if data.delivery_type != "delivery" and data.delivery is not None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Endereço de entrega só pode ser informado em pedidos delivery.",
        )

    initial_status = db.scalar(select(OrderStatus).where(OrderStatus.name == "recebido"))
    if initial_status is None:
        initial_status = OrderStatus(name="recebido")
        db.add(initial_status)
        db.flush()

    order = Order(
        channel=data.channel,
        delivery_type=data.delivery_type,
        customer_id=data.customer_id,
        employee_id=data.employee_id,
        table_id=data.table_id,
        status_id=initial_status.id,
        total=Decimal("0"),
    )
    db.add(order)
    db.flush()

    total = Decimal("0")
    required_stock: dict[int, Decimal] = {}
    for item_data in data.items:
        if (item_data.product_id is None) == (item_data.combo_id is None):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Cada item deve informar exatamente um produto ou combo.",
            )
        if item_data.product_id is not None:
            product = db.get(Product, item_data.product_id)
            if product is None or not product.active:
                raise HTTPException(status_code=404, detail="Produto não encontrado ou inativo.")
            if not product.ingredients:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=f"O produto '{product.name}' não possui ingredientes cadastrados na receita.",
                )
            unit_price = Decimal(product.base_price)
            for recipe_item in product.ingredients:
                required_stock[recipe_item.ingredient_id] = required_stock.get(recipe_item.ingredient_id, Decimal("0")) + (
                    Decimal(recipe_item.quantity) * item_data.quantity
                )
        else:
            raise HTTPException(
                status_code=status.HTTP_501_NOT_IMPLEMENTED,
                detail="Combos ainda não estão disponíveis nesta versão.",
            )

        order_item = OrderItem(
            order_id=order.id,
            product_id=item_data.product_id,
            combo_id=item_data.combo_id,
            quantity=item_data.quantity,
            unit_price=unit_price,
            notes=item_data.notes,
        )
        db.add(order_item)
        db.flush()
        total += unit_price * item_data.quantity

        for addon_id in item_data.addon_ids:
            addon = db.get(Addon, addon_id)
            if addon is None:
                raise HTTPException(status_code=404, detail=f"Adicional {addon_id} não encontrado.")
            db.add(OrderItemAddon(order_item_id=order_item.id, addon_id=addon_id))
            total += Decimal(addon.price) * item_data.quantity

    payment_total = sum((payment.amount for payment in data.payments), Decimal("0"))
    if data.delivery is not None:
        total += data.delivery.fee
    if data.payments and payment_total != total:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="A soma dos pagamentos deve ser igual ao total do pedido.",
        )

    order.total = total
    db.add(OrderStatusHistory(order_id=order.id, status_id=initial_status.id))
    for payment in data.payments:
        db.add(Payment(order_id=order.id, method=payment.method, amount=payment.amount))
    if data.delivery is not None:
        db.add(Delivery(order_id=order.id, address=customer.address, fee=data.delivery.fee, courier_id=data.delivery.courier_id))
    for ingredient_id, required_quantity in required_stock.items():
        ingredient = db.get(Ingredient, ingredient_id)
        if ingredient is None:
            raise HTTPException(status_code=404, detail=f"Ingrediente {ingredient_id} não encontrado.")
        if Decimal(ingredient.stock_quantity) < required_quantity:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Estoque insuficiente para {ingredient.name}. Necessário: {required_quantity}, disponível: {ingredient.stock_quantity}.",
            )
        ingredient.stock_quantity = Decimal(ingredient.stock_quantity) - required_quantity
    db.commit()
    db.refresh(order)
    return order


def update_order_status(db: Session, order_id: int, status_id: int) -> Order:
    order = db.get(Order, order_id)
    if order is None:
        raise HTTPException(status_code=404, detail="Pedido não encontrado.")
    if db.get(OrderStatus, status_id) is None:
        raise HTTPException(status_code=404, detail="Status não encontrado.")
    order.status_id = status_id
    db.add(OrderStatusHistory(order_id=order.id, status_id=status_id))
    db.commit()
    db.refresh(order)
    return order
