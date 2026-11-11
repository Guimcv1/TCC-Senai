from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Generic, TypeVar

from pydantic import BaseModel, ConfigDict, Field

T = TypeVar("T")


class Schema(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class IdResponse(Schema):
    id: int


class CategoryCreate(Schema):
    name: str = Field(min_length=2, max_length=100)


class CategoryResponse(CategoryCreate, IdResponse):
    pass


class CustomerCreate(Schema):
    name: str = Field(min_length=2, max_length=150)
    contact: str = Field(min_length=3, max_length=30)
    address: str | None = Field(default=None, max_length=255)


class CustomerResponse(CustomerCreate, IdResponse):
    pass


class ProductIngredientCreate(Schema):
    ingredient_id: int
    quantity: Decimal = Field(gt=0, decimal_places=3)


class ProductIngredientResponse(ProductIngredientCreate):
    pass


class ProductCreate(Schema):
    name: str = Field(min_length=2, max_length=150)
    base_price: Decimal = Field(ge=0, decimal_places=2)
    category_id: int
    active: bool = True
    ingredients: list[ProductIngredientCreate] = Field(default_factory=list)


class ProductResponse(ProductCreate, IdResponse):
    ingredients: list[ProductIngredientResponse] = Field(default_factory=list)


class EmployeeCreate(Schema):
    name: str = Field(min_length=2, max_length=150)
    role: str = Field(min_length=2, max_length=50)
    active: bool = True


class EmployeeResponse(EmployeeCreate, IdResponse):
    pass


class SupplierCreate(Schema):
    name: str = Field(min_length=2, max_length=150)
    contact: str | None = Field(default=None, max_length=100)


class SupplierResponse(SupplierCreate, IdResponse):
    pass


class IngredientCreate(Schema):
    name: str = Field(min_length=2, max_length=150)
    stock_quantity: Decimal = Field(ge=0, decimal_places=3)
    unit: str = Field(min_length=1, max_length=20)
    supplier_id: int


class IngredientResponse(IngredientCreate, IdResponse):
    pass


class AddonCreate(Schema):
    name: str = Field(min_length=2, max_length=100)
    price: Decimal = Field(ge=0, decimal_places=2)


class AddonResponse(AddonCreate, IdResponse):
    pass


class OrderItemCreate(Schema):
    product_id: int | None = None
    combo_id: int | None = None
    quantity: int = Field(ge=1)
    notes: str | None = Field(default=None, max_length=500)
    addon_ids: list[int] = Field(default_factory=list)


class PaymentCreate(Schema):
    method: str = Field(min_length=2, max_length=30)
    amount: Decimal = Field(gt=0, decimal_places=2)


class DeliveryCreate(Schema):
    address: str = Field(min_length=5, max_length=255)
    fee: Decimal = Field(ge=0, decimal_places=2)
    courier_id: int | None = None


class OrderCreate(Schema):
    channel: str = Field(pattern="^(counter|phone|app)$")
    delivery_type: str = Field(pattern="^(counter|pickup|delivery|table)$")
    customer_id: int | None = None
    employee_id: int | None = None
    table_id: int | None = None
    items: list[OrderItemCreate] = Field(min_length=1)
    payments: list[PaymentCreate] = Field(default_factory=list)
    delivery: DeliveryCreate | None = None


class StatusUpdate(Schema):
    status_id: int


class OrderResponse(Schema):
    id: int
    channel: str
    delivery_type: str
    total: Decimal
    customer_id: int | None
    employee_id: int | None
    table_id: int | None
    status_id: int


class OrderHistoryResponse(Schema):
    status_id: int
    changed_at: datetime
