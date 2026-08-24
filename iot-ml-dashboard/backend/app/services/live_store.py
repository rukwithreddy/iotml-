"""
live_store.py
=============
Thread-safe in-memory store for the most recent live sensor reading.

A daemon background thread reads from the serial port continuously and
updates this store. API routes call get_latest() to serve fresh data
without touching the (slow) CSV file for every request.
"""
from __future__ import annotations

import logging
import threading
import time
from typing import Optional

from app.schemas.sensor_reading import SensorReading

LOGGER = logging.getLogger(__name__)

_lock = threading.Lock()
_latest_reading: Optional[SensorReading] = None
_serial_connected: bool = False


# ── Public API ────────────────────────────────────────────────────────────────

def get_latest() -> Optional[SensorReading]:
    """Return the most recent reading, or None if nothing received yet."""
    with _lock:
        return _latest_reading


def is_connected() -> bool:
    """Return True while the serial port is open and streaming."""
    with _lock:
        return _serial_connected


# ── Internal helpers ──────────────────────────────────────────────────────────

def _store_reading(reading: SensorReading) -> None:
    global _latest_reading, _serial_connected
    with _lock:
        _latest_reading = reading
        _serial_connected = True

    try:
        from app.services.readings_repository import append_reading_to_csv
        append_reading_to_csv(reading)
    except Exception as exc:
        LOGGER.warning("Failed to append reading to CSV: %s", exc)


def _mark_disconnected() -> None:
    global _serial_connected
    with _lock:
        _serial_connected = False


# ── Background thread ─────────────────────────────────────────────────────────

def start_serial_background_thread(port: str = "/dev/ttyACM0", baud: int = 9600) -> None:
    """Spawn a daemon thread that reads the serial port forever.

    Safe to call multiple times – only the first call starts the thread.
    """
    t = threading.Thread(
        target=_reader_loop,
        args=(port, baud),
        daemon=True,
        name="arduino-serial-reader",
    )
    t.start()
    LOGGER.info("Arduino serial background thread started on %s @ %d baud", port, baud)


def _reader_loop(port: str, baud: int) -> None:
    """Keep trying to open the serial port; retry on any error."""
    # Import here to avoid circular imports at module load time
    from app.services.serial_reader import SerialReader

    while True:
        LOGGER.info("Serial reader: connecting to %s …", port)
        try:
            reader = SerialReader(port=port, baudrate=baud)
            for reading in reader.iter_readings():
                _store_reading(reading)
                LOGGER.debug(
                    "Live reading stored: temp=%.1f dist=%.1f",
                    reading.temperature_c or 0,
                    reading.distance_cm,
                )
        except Exception as exc:
            LOGGER.warning("Serial reader disconnected (%s) — retrying in 5 s", exc)
            _mark_disconnected()
            time.sleep(5)
