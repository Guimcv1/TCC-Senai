from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.routes import api_router

app = FastAPI(
    title="Sabor & Cia API",
    version="1.0.0",
    description="API de pedidos, cardápio, estoque e entregas da lanchonete.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["health"])
def health() -> dict[str, str]:
    return {"status": "ok"}


app.include_router(api_router, prefix="/api")
