from __future__ import annotations

from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.predictions import router as predictions_router
from app.api.readings import router as readings_router
from app.api.status import router as system_router
from app.services.live_store import start_serial_background_thread


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Start the Arduino serial reader background thread when the server boots."""
    start_serial_background_thread()
    yield
    # daemon thread will be cleaned up automatically when the process exits


app = FastAPI(title="IoT ML Dashboard API", version="0.1.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(system_router)
app.include_router(readings_router)
app.include_router(predictions_router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
