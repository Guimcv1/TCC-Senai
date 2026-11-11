from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from sqlalchemy import Boolean, DateTime, ForeignKey, Numeric, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.database import Base


class Category(Base):
    __tablename__ = "categoria"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), unique=True)
    products: Mapped[list[Product]] = relationship(back_populates="category")


class Product(Base):
    __tablename__ = "produto"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(150))
    base_price: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    category_id: Mapped[int] = mapped_column(ForeignKey("categoria.id"))
    category: Mapped[Category] = relationship(back_populates="products")
    variations: Mapped[list[ProductVariation]] = relationship(back_populates="product", cascade="all, delete-orphan")
    ingredients: Mapped[list[ProductIngredient]] = relationship(back_populates="product", cascade="all, delete-orphan")


class ProductVariation(Base):
    __tablename__ = "variacao_produto"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    price_delta: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0)
    product_id: Mapped[int] = mapped_column(ForeignKey("produto.id"))
    product: Mapped[Product] = relationship(back_populates="variations")


class Addon(Base):
    __tablename__ = "adicional"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), unique=True)
    price: Mapped[Decimal] = mapped_column(Numeric(10, 2))


class Combo(Base):
    __tablename__ = "combo"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(150))
    price: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    items: Mapped[list[ComboItem]] = relationship(cascade="all, delete-orphan")


class ComboItem(Base):
    __tablename__ = "combo_item"

    combo_id: Mapped[int] = mapped_column(ForeignKey("combo.id"), primary_key=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("produto.id"), primary_key=True)
    quantity: Mapped[int] = mapped_column(default=1)


class Promotion(Base):
    __tablename__ = "promocao"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(150))
    discount_percent: Mapped[Decimal] = mapped_column(Numeric(5, 2))
    starts_at: Mapped[datetime] = mapped_column(DateTime)
    ends_at: Mapped[datetime] = mapped_column(DateTime)
    products: Mapped[list[PromotionProduct]] = relationship(cascade="all, delete-orphan")


class PromotionProduct(Base):
    __tablename__ = "promocao_produto"

    promotion_id: Mapped[int] = mapped_column(ForeignKey("promocao.id"), primary_key=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("produto.id"), primary_key=True)


class Supplier(Base):
    __tablename__ = "fornecedor"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(150))
    contact: Mapped[str | None] = mapped_column(String(100), nullable=True)
    ingredients: Mapped[list[Ingredient]] = relationship(back_populates="supplier")


class Ingredient(Base):
    __tablename__ = "ingrediente"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(150))
    stock_quantity: Mapped[Decimal] = mapped_column(Numeric(10, 3), default=0)
    unit: Mapped[str] = mapped_column(String(20))
    supplier_id: Mapped[int] = mapped_column(ForeignKey("fornecedor.id"))
    supplier: Mapped[Supplier] = relationship(back_populates="ingredients")
    products: Mapped[list[ProductIngredient]] = relationship(back_populates="ingredient")


class ProductIngredient(Base):
    __tablename__ = "produto_ingrediente"

    product_id: Mapped[int] = mapped_column(ForeignKey("produto.id"), primary_key=True)
    ingredient_id: Mapped[int] = mapped_column(ForeignKey("ingrediente.id"), primary_key=True)
    quantity: Mapped[Decimal] = mapped_column(Numeric(10, 3))
    product: Mapped[Product] = relationship(back_populates="ingredients")
    ingredient: Mapped[Ingredient] = relationship(back_populates="products")


class Customer(Base):
    __tablename__ = "cliente"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(150))
    contact: Mapped[str] = mapped_column(String(30))
    address: Mapped[str | None] = mapped_column(String(255), nullable=True)
    orders: Mapped[list[Order]] = relationship(back_populates="customer")


class Employee(Base):
    __tablename__ = "funcionario"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(150))
    role: Mapped[str] = mapped_column(String(50))
    active: Mapped[bool] = mapped_column(Boolean, default=True)


class DiningTable(Base):
    __tablename__ = "mesa"

    id: Mapped[int] = mapped_column(primary_key=True)
    number: Mapped[int] = mapped_column(unique=True)
    seats: Mapped[int] = mapped_column(default=2)


class OrderStatus(Base):
    __tablename__ = "status_pedido"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(50), unique=True)


class Order(Base):
    __tablename__ = "pedido"

    id: Mapped[int] = mapped_column(primary_key=True)
    channel: Mapped[str] = mapped_column(String(20))
    delivery_type: Mapped[str] = mapped_column(String(20))
    total: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0)
    customer_id: Mapped[int | None] = mapped_column(ForeignKey("cliente.id"), nullable=True)
    employee_id: Mapped[int | None] = mapped_column(ForeignKey("funcionario.id"), nullable=True)
    table_id: Mapped[int | None] = mapped_column(ForeignKey("mesa.id"), nullable=True)
    status_id: Mapped[int] = mapped_column(ForeignKey("status_pedido.id"))
    customer: Mapped[Customer | None] = relationship(back_populates="orders")
    items: Mapped[list[OrderItem]] = relationship(back_populates="order", cascade="all, delete-orphan")
    payments: Mapped[list[Payment]] = relationship(back_populates="order", cascade="all, delete-orphan")
    status: Mapped[OrderStatus] = relationship()
    history: Mapped[list[OrderStatusHistory]] = relationship(back_populates="order", cascade="all, delete-orphan")
    delivery: Mapped[Delivery | None] = relationship(back_populates="order", uselist=False, cascade="all, delete-orphan")
    review: Mapped[Review | None] = relationship(back_populates="order", uselist=False, cascade="all, delete-orphan")


class OrderItem(Base):
    __tablename__ = "pedido_item"

    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("pedido.id"))
    product_id: Mapped[int | None] = mapped_column(ForeignKey("produto.id"), nullable=True)
    combo_id: Mapped[int | None] = mapped_column(ForeignKey("combo.id"), nullable=True)
    quantity: Mapped[int] = mapped_column()
    unit_price: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    order: Mapped[Order] = relationship(back_populates="items")
    addons: Mapped[list[OrderItemAddon]] = relationship(cascade="all, delete-orphan")


class OrderItemAddon(Base):
    __tablename__ = "pedido_item_adicional"

    order_item_id: Mapped[int] = mapped_column(ForeignKey("pedido_item.id"), primary_key=True)
    addon_id: Mapped[int] = mapped_column(ForeignKey("adicional.id"), primary_key=True)
    quantity: Mapped[int] = mapped_column(default=1)


class Payment(Base):
    __tablename__ = "pagamento"

    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("pedido.id"))
    method: Mapped[str] = mapped_column(String(30))
    amount: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    order: Mapped[Order] = relationship(back_populates="payments")


class OrderStatusHistory(Base):
    __tablename__ = "historico_status_pedido"

    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("pedido.id"))
    status_id: Mapped[int] = mapped_column(ForeignKey("status_pedido.id"))
    changed_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    order: Mapped[Order] = relationship(back_populates="history")
    status: Mapped[OrderStatus] = relationship()


class Coupon(Base):
    __tablename__ = "cupom"

    id: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String(50), unique=True)
    discount_value: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    discount_type: Mapped[str] = mapped_column(String(10))
    starts_at: Mapped[datetime] = mapped_column(DateTime)
    ends_at: Mapped[datetime] = mapped_column(DateTime)


class CouponUse(Base):
    __tablename__ = "uso_cupom"
    __table_args__ = (UniqueConstraint("coupon_id", "customer_id"),)

    coupon_id: Mapped[int] = mapped_column(ForeignKey("cupom.id"), primary_key=True)
    customer_id: Mapped[int] = mapped_column(ForeignKey("cliente.id"), primary_key=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("pedido.id"), unique=True)


class Delivery(Base):
    __tablename__ = "entrega"

    order_id: Mapped[int] = mapped_column(ForeignKey("pedido.id"), primary_key=True)
    address: Mapped[str] = mapped_column(String(255))
    fee: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0)
    courier_id: Mapped[int | None] = mapped_column(ForeignKey("funcionario.id"), nullable=True)
    order: Mapped[Order] = relationship(back_populates="delivery")


class Review(Base):
    __tablename__ = "avaliacao"

    order_id: Mapped[int] = mapped_column(ForeignKey("pedido.id"), primary_key=True)
    score: Mapped[int] = mapped_column()
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    order: Mapped[Order] = relationship(back_populates="review")
