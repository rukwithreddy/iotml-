"""
severity.py
===========
Internal rule-based severity engine & final combined severity logic.

Rule-based thresholds:
  Distance (cm)      : <=30 Low | >30-60 Medium | >60 High
  Temperature (°C)   : <=30 Low | >30-40 Medium | >40 High
  Sound (ADC raw)    : <=1500 Low | >1500-2000 Medium | >2000 High
  Moisture (ADC raw) : <=400 Low | >400-700 Medium | >700 High
  Vibration (ADC raw): <=400 Low | >400-900 Medium | >900 High

Combined Severity Rule:
  Final severity is always the higher severity between the ML model prediction
  and the internal rule-based severity:
    Low < Medium < High
"""
from __future__ import annotations

from dataclasses import asdict, dataclass
from typing import Literal

from app.schemas.sensor_reading import SensorReading

Severity = Literal["Low", "Medium", "High"]

_SEVERITY_ORDER: dict[str, int] = {"Low": 1, "Medium": 2, "High": 3}


def higher_severity(a: str | None, b: str | None) -> Severity:
    """Return the higher severity rank between a and b (Low < Medium < High)."""
    rank_a = _SEVERITY_ORDER.get(a or "Low", 1)
    rank_b = _SEVERITY_ORDER.get(b or "Low", 1)
    max_rank = max(rank_a, rank_b)
    if max_rank >= 3:
        return "High"
    if max_rank == 2:
        return "Medium"
    return "Low"


def _classify(value: float, low_max: float, medium_max: float) -> Severity:
    """Return Low / Medium / High based on two boundary thresholds."""
    if value <= low_max:
        return "Low"
    if value <= medium_max:
        return "Medium"
    return "High"


@dataclass(frozen=True, slots=True)
class SeverityReport:
    distance: Severity | None
    temperature: Severity | None
    sound: Severity
    moisture: Severity
    vibration: Severity

    def to_dict(self) -> dict[str, str | None]:
        return asdict(self)

    @property
    def overall(self) -> Severity:
        """Worst-case severity across all available channels."""
        levels: list[Severity] = []
        for v in (self.distance, self.temperature, self.sound, self.moisture, self.vibration):
            if v is not None:
                levels.append(v)
        if not levels:
            return "Low"
        return max(levels, key=lambda s: _SEVERITY_ORDER.get(s, 1))


@dataclass(frozen=True, slots=True)
class CombinedSeverityReport:
    distance: Severity
    temperature: Severity
    sound: Severity
    moisture: Severity
    vibration: Severity
    overall: Severity

    def to_dict(self) -> dict[str, str]:
        return asdict(self)


def compute_severity(reading: SensorReading) -> SeverityReport:
    """Apply rule-based thresholds to a live SensorReading."""
    distance_sev: Severity | None = None
    if reading.distance_cm > 0:
        distance_sev = _classify(reading.distance_cm, low_max=30.0, medium_max=60.0)

    temp_sev: Severity | None = None
    if reading.temperature_c is not None:
        temp_sev = _classify(reading.temperature_c, low_max=30.0, medium_max=40.0)

    sound_sev = _classify(reading.sound_raw, low_max=1500, medium_max=2000)
    moisture_sev = _classify(reading.soil_raw, low_max=400, medium_max=700)
    vibration_sev = _classify(reading.vibration_raw, low_max=400, medium_max=900)

    return SeverityReport(
        distance=distance_sev,
        temperature=temp_sev,
        sound=sound_sev,
        moisture=moisture_sev,
        vibration=vibration_sev,
    )


def compute_combined_severity(
    reading: SensorReading, ml_prediction: str | None
) -> CombinedSeverityReport:
    """Compute the final combined severity: max(ML prediction, rule-based status)."""
    rule_report = compute_severity(reading)
    ml_pred = ml_prediction or "Low"

    dist_final = higher_severity(rule_report.distance, ml_pred)
    temp_final = higher_severity(rule_report.temperature, ml_pred)
    sound_final = higher_severity(rule_report.sound, ml_pred)
    moisture_final = higher_severity(rule_report.moisture, ml_pred)
    vib_final = higher_severity(rule_report.vibration, ml_pred)

    overall_final = max(
        [dist_final, temp_final, sound_final, moisture_final, vib_final, ml_pred],
        key=lambda s: _SEVERITY_ORDER.get(s, 1),
    )

    return CombinedSeverityReport(
        distance=dist_final,
        temperature=temp_final,
        sound=sound_final,
        moisture=moisture_final,
        vibration=vib_final,
        overall=overall_final,
    )
