from __future__ import annotations

from pydantic import BaseModel


class SensorReadingResponse(BaseModel):
    captured_at: str
    sec: int
    distance_cm: float
    temperature_c: float | None
    humidity: float | None
    sound_raw: int
    soil_raw: int
    soil_percent: int
    vibration_raw: int
    vibration_percent: int
    raw_line: str


class SensorHistoryResponse(BaseModel):
    count: int
    readings: list[SensorReadingResponse]