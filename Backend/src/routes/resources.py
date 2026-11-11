from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from src.database import get_db
from src.models import Addon, Category, Customer, Employee, Ingredient, Product, ProductIngredient, Supplier
from src.schemas.common import (
    AddonCreate,
    AddonResponse,
    CategoryCreate,
    CategoryResponse,
    CustomerCreate,
    CustomerResponse,
    EmployeeCreate,
    EmployeeResponse,
    IngredientCreate,
    IngredientResponse,
    ProductCreate,
    ProductResponse,
    SupplierCreate,
    SupplierResponse,
)
from src.services.crud import create_entity, delete_entity, get_entity, list_entities, update_entity

router = APIRouter(tags=["cadastros"])


def _list(db: Session, model: type[Any]) -> list[Any]:
    return list_entities(db, model)


def _get(db: Session, model: type[Any], entity_id: int) -> Any:
    return get_entity(db, model, entity_id)


def _create(db: Session, model: type[Any], payload: Any) -> Any:
    return create_entity(db, model, payload.model_dump())


@router.get("/categories", response_model=list[CategoryResponse])
def list_categories(db: Session = Depends(get_db)) -> list[Category]:
    return _list(db, Category)


@router.get("/categories/{entity_id}", response_model=CategoryResponse)
def get_category(entity_id: int, db: Session = Depends(get_db)) -> Category:
    return _get(db, Category, entity_id)


@router.post("/categories", response_model=CategoryResponse, status_code=201)
def create_category(payload: CategoryCreate, db: Session = Depends(get_db)) -> Category:
    return _create(db, Category, payload)


@router.put("/categories/{entity_id}", response_model=CategoryResponse)
def update_category(entity_id: int, payload: CategoryCreate, db: Session = Depends(get_db)) -> Category:
    return update_entity(db, Category, entity_id, payload.model_dump())


@router.delete("/categories/{entity_id}", status_code=204)
def delete_category(entity_id: int, db: Session = Depends(get_db)) -> None:
    delete_entity(db, Category, entity_id)


@router.get("/customers", response_model=list[CustomerResponse])
def list_customers(db: Session = Depends(get_db)) -> list[Customer]:
    return _list(db, Customer)


@router.get("/customers/{entity_id}", response_model=CustomerResponse)
def get_customer(entity_id: int, db: Session = Depends(get_db)) -> Customer:
    return _get(db, Customer, entity_id)


@router.post("/customers", response_model=CustomerResponse, status_code=201)
def create_customer(payload: CustomerCreate, db: Session = Depends(get_db)) -> Customer:
    return _create(db, Customer, payload)


@router.put("/customers/{entity_id}", response_model=CustomerResponse)
def update_customer(entity_id: int, payload: CustomerCreate, db: Session = Depends(get_db)) -> Customer:
    return update_entity(db, Customer, entity_id, payload.model_dump())


@router.delete("/customers/{entity_id}", status_code=204)
def delete_customer(entity_id: int, db: Session = Depends(get_db)) -> None:
    delete_entity(db, Customer, entity_id)


@router.get("/products", response_model=list[ProductResponse])
def list_products(db: Session = Depends(get_db)) -> list[Product]:
    return _list(db, Product)


@router.get("/products/{entity_id}", response_model=ProductResponse)
def get_product(entity_id: int, db: Session = Depends(get_db)) -> Product:
    return _get(db, Product, entity_id)


@router.post("/products", response_model=ProductResponse, status_code=201)
def create_product(payload: ProductCreate, db: Session = Depends(get_db)) -> Product:
    product = Product(
        name=payload.name,
        base_price=payload.base_price,
        category_id=payload.category_id,
        active=payload.active,
    )
    db.add(product)
    db.flush()
    for item in payload.ingredients:
        if db.get(Ingredient, item.ingredient_id) is None:
            from fastapi import HTTPException

            raise HTTPException(status_code=404, detail=f"Ingrediente {item.ingredient_id} não encontrado.")
        product.ingredients.append(ProductIngredient(ingredient_id=item.ingredient_id, quantity=item.quantity))
    db.commit()
    db.refresh(product)
    return product


@router.put("/products/{entity_id}", response_model=ProductResponse)
def update_product(entity_id: int, payload: ProductCreate, db: Session = Depends(get_db)) -> Product:
    product = get_entity(db, Product, entity_id)
    product.name = payload.name
    product.base_price = payload.base_price
    product.category_id = payload.category_id
    product.active = payload.active
    product.ingredients.clear()
    for item in payload.ingredients:
        if db.get(Ingredient, item.ingredient_id) is None:
            from fastapi import HTTPException

            raise HTTPException(status_code=404, detail=f"Ingrediente {item.ingredient_id} não encontrado.")
        product.ingredients.append(ProductIngredient(ingredient_id=item.ingredient_id, quantity=item.quantity))
    db.commit()
    db.refresh(product)
    return product


@router.delete("/products/{entity_id}", status_code=204)
def delete_product(entity_id: int, db: Session = Depends(get_db)) -> None:
    delete_entity(db, Product, entity_id)


@router.get("/employees", response_model=list[EmployeeResponse])
def list_employees(db: Session = Depends(get_db)) -> list[Employee]:
    return _list(db, Employee)


@router.get("/employees/{entity_id}", response_model=EmployeeResponse)
def get_employee(entity_id: int, db: Session = Depends(get_db)) -> Employee:
    return _get(db, Employee, entity_id)


@router.post("/employees", response_model=EmployeeResponse, status_code=201)
def create_employee(payload: EmployeeCreate, db: Session = Depends(get_db)) -> Employee:
    return _create(db, Employee, payload)


@router.get("/suppliers", response_model=list[SupplierResponse])
def list_suppliers(db: Session = Depends(get_db)) -> list[Supplier]:
    return _list(db, Supplier)


@router.post("/suppliers", response_model=SupplierResponse, status_code=201)
def create_supplier(payload: SupplierCreate, db: Session = Depends(get_db)) -> Supplier:
    return _create(db, Supplier, payload)


@router.put("/suppliers/{entity_id}", response_model=SupplierResponse)
def update_supplier(entity_id: int, payload: SupplierCreate, db: Session = Depends(get_db)) -> Supplier:
    return update_entity(db, Supplier, entity_id, payload.model_dump())


@router.delete("/suppliers/{entity_id}", status_code=204)
def delete_supplier(entity_id: int, db: Session = Depends(get_db)) -> None:
    delete_entity(db, Supplier, entity_id)


@router.get("/ingredients", response_model=list[IngredientResponse])
def list_ingredients(db: Session = Depends(get_db)) -> list[Ingredient]:
    return _list(db, Ingredient)


@router.post("/ingredients", response_model=IngredientResponse, status_code=201)
def create_ingredient(payload: IngredientCreate, db: Session = Depends(get_db)) -> Ingredient:
    return _create(db, Ingredient, payload)


@router.put("/ingredients/{entity_id}", response_model=IngredientResponse)
def update_ingredient(entity_id: int, payload: IngredientCreate, db: Session = Depends(get_db)) -> Ingredient:
    return update_entity(db, Ingredient, entity_id, payload.model_dump())


@router.delete("/ingredients/{entity_id}", status_code=204)
def delete_ingredient(entity_id: int, db: Session = Depends(get_db)) -> None:
    delete_entity(db, Ingredient, entity_id)


@router.get("/addons", response_model=list[AddonResponse])
def list_addons(db: Session = Depends(get_db)) -> list[Addon]:
    return _list(db, Addon)


@router.post("/addons", response_model=AddonResponse, status_code=201)
def create_addon(payload: AddonCreate, db: Session = Depends(get_db)) -> Addon:
    return _create(db, Addon, payload)
