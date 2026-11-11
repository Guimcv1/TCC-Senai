from fastapi import APIRouter

from src.routes.orders import router as orders_router
from src.routes.resources import router as resources_router

api_router = APIRouter()
api_router.include_router(resources_router)
api_router.include_router(orders_router)