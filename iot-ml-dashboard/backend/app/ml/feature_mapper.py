from __future__ import annotations

from dataclasses import dataclass

from app.schemas.model_input import BridgeFeatureVector
from app.schemas.sensor_reading import SensorReading

# ── Calibration constants ─────────────────────────────────────────────────────
# Arduino uses a 10-bit ADC → 0-1023 raw range.
# These linear scales convert raw ADC counts to the physical units the ML model
# was trained on.  They are engineering approximations, not lab-calibrated.
_ADC_MAX = 1023.0
_VIBRATION_MS2_MAX = 20.0      # typical small-bridge peak vibration range
_SOIL_SETTLEMENT_MM_MAX = 50.0  # typical shallow-foundation settlement range


def _adc_to_vibration_ms2(raw: int) -> float:
    return (raw / _ADC_MAX) * _VIBRATION_MS2_MAX


def _adc_to_soil_settlement_mm(raw: int) -> float:
    return (raw / _ADC_MAX) * _SOIL_SETTLEMENT_MM_MAX


# ── Result type ───────────────────────────────────────────────────────────────

@dataclass(frozen=True, slots=True)
class FeatureMappingResult:
    features: BridgeFeatureVector
    notes: tuple[str, ...]

    @property
    def missing_features(self) -> list[str]:
        return self.features.missing_features()


# ── Mapper ────────────────────────────────────────────────────────────────────

def map_sensor_reading_to_bridge_features(reading: SensorReading) -> FeatureMappingResult:
    notes: list[str] = []

    # Displacement: ultrasonic distance cm → mm (exact conversion)
    displacement_mm = reading.distance_cm * 10.0
    notes.append(
        f"displacement_mm={displacement_mm:.1f} mapped from ultrasonic distance "
        f"({reading.distance_cm:.2f} cm × 10)."
    )

    # Temperature: direct pass-through from DHT22
    if reading.temperature_c is None:
        temperature_c = None
        notes.append("Temperature unavailable — DHT22 reported error.")
    else:
        temperature_c = reading.temperature_c

    # Vibration: piezo_raw ADC → ms² via linear scale
    vibration_ms2 = _adc_to_vibration_ms2(reading.vibration_raw)
    notes.append(
        f"vibration_ms2={vibration_ms2:.3f} estimated from piezo_raw={reading.vibration_raw} "
        f"via linear ADC scale (0–{_ADC_MAX:.0f} → 0–{_VIBRATION_MS2_MAX} ms²)."
    )

    # Soil settlement: moisture_raw ADC → mm via linear scale
    soil_settlement_mm = _adc_to_soil_settlement_mm(reading.soil_raw)
    notes.append(
        f"soil_settlement_mm={soil_settlement_mm:.3f} estimated from moisture_raw={reading.soil_raw} "
        f"via linear ADC scale (0–{_ADC_MAX:.0f} → 0–{_SOIL_SETTLEMENT_MM_MAX} mm)."
    )

    return FeatureMappingResult(
        features=BridgeFeatureVector(
            displacement_mm=displacement_mm,
            temperature_c=temperature_c,
            vibration_ms2=vibration_ms2,
            soil_settlement_mm=soil_settlement_mm,
        ),
        notes=tuple(notes),
    )