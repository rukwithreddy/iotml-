from __future__ import annotations

from dataclasses import asdict, dataclass


@dataclass(frozen=True, slots=True)
class BridgeFeatureVector:
    displacement_mm: float | None
    temperature_c: float | None
    vibration_ms2: float | None
    soil_settlement_mm: float | None

    def to_dict(self) -> dict[str, float | None]:
        return asdict(self)

    def missing_features(self) -> list[str]:
        missing: list[str] = []
        if self.displacement_mm is None:
            missing.append("displacement_mm")
        if self.temperature_c is None:
            missing.append("temperature_c")
        if self.vibration_ms2 is None:
            missing.append("vibration_ms2")
        if self.soil_settlement_mm is None:
            missing.append("soil_settlement_mm")
        return missing