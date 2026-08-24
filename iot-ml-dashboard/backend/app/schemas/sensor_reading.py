from __future__ import annotations

from dataclasses import asdict, dataclass


@dataclass(frozen=True, slots=True)
class SensorReading:
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

    def to_dict(self) -> dict[str, object]:
        return asdict(self)