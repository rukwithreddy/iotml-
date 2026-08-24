from __future__ import annotations

import argparse
import csv
from pathlib import Path

from app.services.serial_reader import SerialReader


DEFAULT_OUTPUT = Path("../data/raw/sensor_readings.csv")


def collect(output_path: Path, port: str, baud: int, count: int) -> None:
    reader = SerialReader(port=port, baudrate=baud)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    fieldnames = [
        "captured_at",
        "sec",
        "distance_cm",
        "temperature_c",
        "sound_raw",
        "soil_raw",
        "soil_percent",
        "vibration_raw",
        "vibration_percent",
        "raw_line",
    ]

    file_exists = output_path.exists()
    with output_path.open("a", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        if not file_exists:
            writer.writeheader()

        written = 0
        for reading in reader.iter_readings():
            writer.writerow(reading.to_dict())
            handle.flush()
            written += 1
            print(f"saved row {written}: sec={reading.sec}")
            if count and written >= count:
                break


def main() -> None:
    parser = argparse.ArgumentParser(description="Collect raw Arduino sensor data to CSV")
    parser.add_argument("--output", default=str(DEFAULT_OUTPUT))
    parser.add_argument("--port", default="/dev/ttyACM0")
    parser.add_argument("--baud", type=int, default=9600)
    parser.add_argument("--count", type=int, default=10, help="Number of readings to save; use 0 for endless")
    args = parser.parse_args()

    collect(Path(args.output), port=args.port, baud=args.baud, count=args.count)


if __name__ == "__main__":
    main()