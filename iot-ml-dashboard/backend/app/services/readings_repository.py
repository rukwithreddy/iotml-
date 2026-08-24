from __future__ import annotations

import csv
import logging
from pathlib import Path

from app.schemas.sensor_reading import SensorReading

LOGGER = logging.getLogger(__name__)
RAW_SENSOR_CSV = Path(__file__).resolve().parents[3] / "data" / "raw" / "sensor_readings.csv"


def _coerce_float(value: str | None) -> float | None:
    if not value or value.strip() == "":
        return None
    try:
        return float(value)
    except ValueError:
        return None


def _coerce_int(value: str | None, default: int = 0) -> int:
    if not value or value.strip() == "":
        return default
    try:
        return int(float(value))
    except ValueError:
        return default


def _row_to_reading(row: dict[str, str]) -> SensorReading | None:
    try:
        captured_at = row.get("captured_at") or ""
        sec = _coerce_int(row.get("sec"), 0)
        distance_cm = _coerce_float(row.get("distance_cm")) or 0.0
        temperature_c = _coerce_float(row.get("temperature_c"))
        humidity = _coerce_float(row.get("humidity"))
        sound_raw = _coerce_int(row.get("sound_raw"), 0)
        soil_raw = _coerce_int(row.get("soil_raw"), 0)
        soil_percent = _coerce_int(row.get("soil_percent"), 0)
        vibration_raw = _coerce_int(row.get("vibration_raw"), 0)
        vibration_percent = _coerce_int(row.get("vibration_percent"), 0)
        raw_line = row.get("raw_line") or ""

        return SensorReading(
            captured_at=captured_at,
            sec=sec,
            distance_cm=distance_cm,
            temperature_c=temperature_c,
            humidity=humidity,
            sound_raw=sound_raw,
            soil_raw=soil_raw,
            soil_percent=soil_percent,
            vibration_raw=vibration_raw,
            vibration_percent=vibration_percent,
            raw_line=raw_line,
        )
    except Exception as exc:
        LOGGER.warning("Skipping unparseable CSV row: %s (%s)", row, exc)
        return None


def load_all_readings(csv_path: Path = RAW_SENSOR_CSV) -> list[SensorReading]:
    if not csv_path.exists():
        return []

    readings: list[SensorReading] = []
    with csv_path.open(newline="", encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            parsed = _row_to_reading(row)
            if parsed is not None:
                readings.append(parsed)
    return readings


def load_latest_reading(csv_path: Path = RAW_SENSOR_CSV) -> SensorReading | None:
    readings = load_all_readings(csv_path)
    return readings[-1] if readings else None


def append_reading_to_csv(reading: SensorReading, csv_path: Path = RAW_SENSOR_CSV) -> None:
    """Append a live sensor reading to the server CSV file."""
    csv_path.parent.mkdir(parents=True, exist_ok=True)
    file_exists = csv_path.exists()
    fieldnames = [
        "captured_at",
        "sec",
        "distance_cm",
        "temperature_c",
        "humidity",
        "sound_raw",
        "soil_raw",
        "soil_percent",
        "vibration_raw",
        "vibration_percent",
        "raw_line",
    ]
    with csv_path.open("a", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        if not file_exists:
            writer.writeheader()
        writer.writerow(reading.to_dict())