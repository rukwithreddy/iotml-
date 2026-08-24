from __future__ import annotations

from fastapi import APIRouter, Query

from app.schemas.api_responses import SensorHistoryResponse, SensorReadingResponse
from app.services.live_store import get_latest
from app.services.readings_repository import load_all_readings, load_latest_reading


router = APIRouter(prefix="/api/sensors", tags=["sensors"])


@router.get("/latest", response_model=SensorReadingResponse | dict[str, str])
def latest_reading() -> SensorReadingResponse | dict[str, str]:
    # Prefer the live in-memory reading (freshest); fall back to CSV for cold start
    reading = get_latest() or load_latest_reading()
    if reading is None:
        return {"status": "no_data"}
    return SensorReadingResponse(**reading.to_dict())


@router.get("/history", response_model=SensorHistoryResponse)
def reading_history(limit: int = Query(default=20, ge=1, le=500)) -> SensorHistoryResponse:
    readings = load_all_readings()[-limit:]
    return SensorHistoryResponse(
        count=len(readings),
        readings=[SensorReadingResponse(**reading.to_dict()) for reading in readings],
    )