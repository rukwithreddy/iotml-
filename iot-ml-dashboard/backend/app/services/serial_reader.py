from __future__ import annotations

import json
import logging
import re
from datetime import datetime, timezone
from typing import Iterable

try:
    import serial
    from serial import SerialException
except ImportError as exc:  # pragma: no cover
    serial = None
    SerialException = Exception  # type: ignore[assignment]
    _serial_import_error = exc
else:
    _serial_import_error = None

from app.schemas.sensor_reading import SensorReading


LOGGER = logging.getLogger(__name__)

# Legacy pipe-delimited format: "23 | 0.1 | Error | 124 | 256 | 74% | 51 | 4%"
PIPE_ROW_PATTERN = re.compile(r"^\d+\s*\|")

# New key=value format: "temperature_c=26.00,humidity=62.60,distance_cm=35.86,..."
KV_ROW_PATTERN = re.compile(r"temperature_c=")

_seq: int = 0  # monotonic counter for key=value lines (no sec field in new format)


def _next_seq() -> int:
    global _seq
    _seq += 1
    return _seq


# ── New key=value parser ──────────────────────────────────────────────────────

def parse_kv_line(line: str) -> SensorReading:
    """Parse the new Arduino key=value CSV format.

    Expected format::
        temperature_c=26.00,humidity=62.60,distance_cm=35.86,sound=685,moisture=303,piezo=165
    """
    raw_line = line.strip()
    parts: dict[str, str] = {}
    for chunk in raw_line.split(","):
        if "=" in chunk:
            k, _, v = chunk.partition("=")
            parts[k.strip()] = v.strip()

    if not parts:
        raise ValueError("no key=value pairs found")

    def _float(key: str) -> float | None:
        val = parts.get(key)
        if val is None:
            return None
        try:
            return float(val)
        except ValueError:
            return None

    def _int(key: str, default: int = 0) -> int:
        val = parts.get(key)
        if val is None:
            return default
        try:
            return int(float(val))
        except ValueError:
            return default

    temperature_c = _float("temperature_c")
    humidity = _float("humidity")
    distance_cm = _float("distance_cm") or 0.0
    sound_raw = _int("sound")
    soil_raw = _int("moisture")
    vibration_raw = _int("piezo")

    # Derive percentages from 10-bit ADC (0-1023)
    soil_percent = min(100, int(soil_raw / 1023 * 100))
    vibration_percent = min(100, int(vibration_raw / 1023 * 100))

    return SensorReading(
        captured_at=datetime.now(timezone.utc).isoformat(),
        sec=_next_seq(),
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


# ── Legacy pipe-delimited parser ──────────────────────────────────────────────

def parse_sensor_row(line: str) -> SensorReading:
    """Parse the legacy pipe-delimited Arduino line.

    Expected format::
        23 | 0.1 | Error | 124 | 256 | 74% | 51 | 4%
    """
    raw_line = line.strip()
    if not PIPE_ROW_PATTERN.match(raw_line):
        raise ValueError("line is not a pipe-delimited sensor row")

    parts = [part.strip() for part in raw_line.split("|")]
    if len(parts) != 8:
        raise ValueError(f"expected 8 pipe columns, got {len(parts)}")

    sec = int(parts[0])
    distance_cm = float(parts[1])
    temperature_c = None if parts[2].lower() == "error" else float(parts[2])
    sound_raw = int(parts[3])
    soil_raw = int(parts[4])
    soil_percent = _parse_percent(parts[5])
    vibration_raw = int(parts[6])
    vibration_percent = _parse_percent(parts[7])

    _validate_adc_value("sound_raw", sound_raw)
    _validate_adc_value("soil_raw", soil_raw)
    _validate_adc_value("vibration_raw", vibration_raw)
    _validate_percent("soil_percent", soil_percent)
    _validate_percent("vibration_percent", vibration_percent)

    return SensorReading(
        captured_at=datetime.now(timezone.utc).isoformat(),
        sec=sec,
        distance_cm=distance_cm,
        temperature_c=temperature_c,
        humidity=None,
        sound_raw=sound_raw,
        soil_raw=soil_raw,
        soil_percent=soil_percent,
        vibration_raw=vibration_raw,
        vibration_percent=vibration_percent,
        raw_line=raw_line,
    )


# ── Serial reader ─────────────────────────────────────────────────────────────

class SerialReader:
    def __init__(self, port: str = "/dev/ttyACM0", baudrate: int = 9600, timeout: float = 1.0):
        self.port = port
        self.baudrate = baudrate
        self.timeout = timeout

    def iter_readings(self) -> Iterable[SensorReading]:
        if serial is None:
            raise RuntimeError("pyserial is not installed") from _serial_import_error

        try:
            with serial.Serial(self.port, self.baudrate, timeout=self.timeout) as connection:
                connection.reset_input_buffer()
                while True:
                    raw = connection.readline()
                    if not raw:
                        continue

                    line = raw.decode("utf-8", errors="replace").strip()
                    if not line:
                        continue

                    # Try new key=value format first
                    if KV_ROW_PATTERN.search(line):
                        try:
                            yield parse_kv_line(line)
                        except Exception as exc:
                            LOGGER.warning("Rejected kv line: %s (%s)", line, exc)
                        continue

                    # Fall back to legacy pipe-delimited format
                    if PIPE_ROW_PATTERN.match(line):
                        try:
                            yield parse_sensor_row(line)
                        except ValueError as exc:
                            LOGGER.warning("Rejected pipe line: %s (%s)", line, exc)
                        continue

                    LOGGER.debug("Non-data line ignored: %s", line)

        except SerialException as exc:
            LOGGER.error("Serial connection failed: %s", exc)
            raise


# ── CLI helper ────────────────────────────────────────────────────────────────

def main() -> None:
    import argparse

    parser = argparse.ArgumentParser(description="Read live Arduino sensor data")
    parser.add_argument("--port", default="/dev/ttyACM0")
    parser.add_argument("--baud", type=int, default=9600)
    parser.add_argument("--count", type=int, default=10,
                        help="Number of readings to print; use 0 for endless")
    args = parser.parse_args()

    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
    reader = SerialReader(port=args.port, baudrate=args.baud)

    printed = 0
    for reading in reader.iter_readings():
        print(json.dumps(reading.to_dict(), ensure_ascii=False))
        printed += 1
        if args.count and printed >= args.count:
            break


# ── Validation helpers ────────────────────────────────────────────────────────

def _parse_percent(value: str) -> int:
    cleaned = value.strip().rstrip("%")
    return int(cleaned)


def _validate_adc_value(name: str, value: int) -> None:
    if not 0 <= value <= 1023:
        raise ValueError(f"{name} must be between 0 and 1023")


def _validate_percent(name: str, value: int) -> None:
    if not 0 <= value <= 100:
        raise ValueError(f"{name} must be between 0 and 100")


if __name__ == "__main__":
    main()