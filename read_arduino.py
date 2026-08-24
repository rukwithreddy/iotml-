#!/usr/bin/env python3
"""
read_arduino.py  –  Live Arduino Sensor Reader
================================================
Reads the pipe-delimited sensor lines from your SHM Arduino and prints them
as a nicely formatted live table in the terminal.

Sensors read:
  Ultrasonic (distance), DHT22 (temperature), Sound, Soil moisture, Vibration

Usage:
  python read_arduino.py                         # default /dev/ttyACM0 @ 9600
  python read_arduino.py --port /dev/ttyUSB0     # different port
  python read_arduino.py --baud 115200           # different baud rate
  python read_arduino.py --count 30             # stop after 30 readings
  python read_arduino.py --count 0              # run forever (Ctrl+C to stop)

Expected Arduino serial format:
  Sec | Dist(cm) | Temp(C) | Sound | Soil_Raw | Soil(%) | Vib_Raw | Vib(%)
  1   | 99.0     | 29.7    | 1023  | 315      | 69%     | 772     | 75%
"""

from __future__ import annotations

import argparse
import re
import sys
import time
from datetime import datetime

# ── colour helpers (no extra deps) ──────────────────────────────────────────
RESET   = "\033[0m"
BOLD    = "\033[1m"
CYAN    = "\033[96m"
GREEN   = "\033[92m"
YELLOW  = "\033[93m"
RED     = "\033[91m"
MAGENTA = "\033[95m"
BLUE    = "\033[94m"
WHITE   = "\033[97m"
DIM     = "\033[2m"


def _col(value: object, color: str) -> str:
    return f"{color}{value}{RESET}"


# ── serial port detection ────────────────────────────────────────────────────
def _detect_port() -> str:
    """Try common Arduino port names and return the first that exists."""
    import glob
    candidates = (
        glob.glob("/dev/ttyACM*")
        + glob.glob("/dev/ttyUSB*")
        + glob.glob("/dev/cu.usbmodem*")   # macOS
        + glob.glob("/dev/cu.usbserial*")  # macOS
    )
    if candidates:
        return candidates[0]
    return "/dev/ttyACM0"  # fallback


# ── parsing ──────────────────────────────────────────────────────────────────
ROW_RE = re.compile(r"^\d+\s*\|")


def _parse_percent(s: str) -> int:
    return int(s.strip().rstrip("%"))


def parse_line(line: str) -> dict | None:
    """Parse one pipe-delimited Arduino line. Returns None if not a data row."""
    line = line.strip()
    if not ROW_RE.match(line):
        return None

    parts = [p.strip() for p in line.split("|")]
    if len(parts) != 8:
        return None

    try:
        sec            = int(parts[0])
        distance_cm    = float(parts[1])
        temp_raw       = parts[2]
        temperature_c  = None if temp_raw.lower() == "error" else float(temp_raw)
        sound_raw      = int(parts[3])
        soil_raw       = int(parts[4])
        soil_pct       = _parse_percent(parts[5])
        vib_raw        = int(parts[6])
        vib_pct        = _parse_percent(parts[7])
    except (ValueError, IndexError):
        return None

    return {
        "sec":           sec,
        "distance_cm":   distance_cm,
        "temperature_c": temperature_c,
        "sound_raw":     sound_raw,
        "soil_raw":      soil_raw,
        "soil_pct":      soil_pct,
        "vib_raw":       vib_raw,
        "vib_pct":       vib_pct,
        "raw_line":      line,
        "captured_at":   datetime.now().strftime("%H:%M:%S"),
    }


# ── display ──────────────────────────────────────────────────────────────────
HEADER = (
    f"{BOLD}{CYAN}"
    f"{'Time':^10} {'Sec':^5} {'Dist(cm)':^10} {'Temp(C)':^10} "
    f"{'Sound':^8} {'Soil_Raw':^10} {'Soil%':^12} {'Vib_Raw':^9} {'Vib%':^12}"
    f"{RESET}"
)
DIVIDER = DIM + "-" * 98 + RESET


def _fmt_distance(d: float) -> str:
    if d > 400:
        return _col(f"{'OOR':^10}", RED)
    elif d < 5:
        return _col(f"{d:^10.1f}", YELLOW)
    return _col(f"{d:^10.1f}", GREEN)


def _fmt_temp(t: float | None) -> str:
    if t is None:
        return _col(f"{'ERR':^10}", RED)
    if t > 35:
        return _col(f"{t:^10.1f}", RED)
    elif t > 30:
        return _col(f"{t:^10.1f}", YELLOW)
    return _col(f"{t:^10.1f}", GREEN)


def _fmt_pct(p: int, warn: int = 70, danger: int = 90) -> str:
    bar_len = 5
    filled  = round(p / 100 * bar_len)
    bar     = "#" * filled + "." * (bar_len - filled)
    color   = GREEN if p < warn else (YELLOW if p < danger else RED)
    return f"{color}{p:>3}% [{bar}]{RESET}"


def _fmt_sound(s: int) -> str:
    if s >= 900:
        return _col(f"{s:^8}", RED)
    elif s >= 600:
        return _col(f"{s:^8}", YELLOW)
    return _col(f"{s:^8}", GREEN)


def print_reading(r: dict, count: int) -> None:
    if count == 1:
        print()
        print(HEADER)
        print(DIVIDER)

    dist_str  = _fmt_distance(r["distance_cm"])
    temp_str  = _fmt_temp(r["temperature_c"])
    sound_str = _fmt_sound(r["sound_raw"])
    soil_str  = _fmt_pct(r["soil_pct"])
    vib_str   = _fmt_pct(r["vib_pct"], warn=60, danger=85)

    row = (
        f"{DIM}{r['captured_at']:^10}{RESET} "
        f"{MAGENTA}{r['sec']:^5}{RESET} "
        f"{dist_str} "
        f"{temp_str} "
        f"{sound_str} "
        f"{BLUE}{r['soil_raw']:^10}{RESET} "
        f"{soil_str} "
        f"{BLUE}{r['vib_raw']:^9}{RESET} "
        f"{vib_str}"
    )
    print(row)


def print_banner(port: str, baud: int, count: int) -> None:
    print()
    print(f"{BOLD}{CYAN}+==================================================+{RESET}")
    print(f"{BOLD}{CYAN}|     Arduino SHM Sensor Live Reader               |{RESET}")
    print(f"{BOLD}{CYAN}+==================================================+{RESET}")
    print(f"  {BOLD}Port :{RESET} {WHITE}{port}{RESET}")
    print(f"  {BOLD}Baud :{RESET} {WHITE}{baud}{RESET}")
    limit = f"{count} readings" if count else "unlimited (Ctrl+C to stop)"
    print(f"  {BOLD}Limit:{RESET} {WHITE}{limit}{RESET}")
    print(f"  {DIM}Waiting for data...{RESET}")


# ── main ─────────────────────────────────────────────────────────────────────
def main() -> None:
    parser = argparse.ArgumentParser(
        description="Read live Arduino sensor data and display it in the terminal."
    )
    parser.add_argument(
        "--port", default=None,
        help="Serial port (default: auto-detect, e.g. /dev/ttyACM0)"
    )
    parser.add_argument(
        "--baud", type=int, default=9600,
        help="Baud rate (default: 9600)"
    )
    parser.add_argument(
        "--count", type=int, default=0,
        help="Number of readings to show (0 = unlimited, default: 0)"
    )
    parser.add_argument(
        "--raw", action="store_true",
        help="Also print the raw serial line below each reading"
    )
    args = parser.parse_args()

    # ── import pyserial ──────────────────────────────────────────────────────
    try:
        import serial
    except ImportError:
        print(f"{RED}ERROR: pyserial is not installed.{RESET}")
        print("Run:  pip install pyserial")
        sys.exit(1)

    port = args.port or _detect_port()
    print_banner(port, args.baud, args.count)

    # ── open serial port ─────────────────────────────────────────────────────
    try:
        ser = serial.Serial(port, args.baud, timeout=2.0)
    except serial.SerialException as exc:
        print(f"\n{RED}Cannot open port {port!r}: {exc}{RESET}")
        print()
        _list_ports()
        sys.exit(1)

    # brief settle so Arduino resets properly after opening
    time.sleep(2)
    ser.reset_input_buffer()

    # trigger a fresh logging run (Arduino waits for 'R' between sessions)
    ser.write(b"R\n")
    ser.flush()
    print(f"  {DIM}Sent 'R' to start a new logging session...{RESET}")

    count = 0
    try:
        while True:
            try:
                raw = ser.readline()
            except serial.SerialException as exc:
                print(f"\n{RED}Serial error: {exc}{RESET}")
                break

            if not raw:
                continue

            line = raw.decode("utf-8", errors="replace")
            reading = parse_line(line)

            if reading is None:
                # Print non-data lines in dim style so you can see Arduino messages
                stripped = line.strip()
                if stripped:
                    print(f"  {DIM}{stripped}{RESET}")
                continue

            count += 1
            print_reading(reading, count)
            if args.raw:
                print(f"    {DIM}raw: {reading['raw_line']}{RESET}")

            if args.count and count >= args.count:
                break

    except KeyboardInterrupt:
        print(f"\n\n{YELLOW}Interrupted by user.{RESET}")
    finally:
        if ser.is_open:
            ser.close()

    print(f"\n{GREEN}Done -- {count} reading(s) received.{RESET}\n")


def _list_ports() -> None:
    """Print available serial ports to help the user pick the right one."""
    try:
        from serial.tools import list_ports
        ports = list(list_ports.comports())
        if ports:
            print(f"{YELLOW}Available serial ports:{RESET}")
            for p in ports:
                print(f"  {WHITE}{p.device}{RESET}  {DIM}{p.description}{RESET}")
        else:
            print(f"{YELLOW}No serial ports detected. Is the Arduino plugged in?{RESET}")
    except Exception:
        pass


if __name__ == "__main__":
    main()
