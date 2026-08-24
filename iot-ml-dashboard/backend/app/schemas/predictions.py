from __future__ import annotations

from pydantic import BaseModel, Field


class SeverityDetail(BaseModel):
    distance: str | None = None
    temperature: str | None = None
    sound: str
    moisture: str
    vibration: str
    overall: str


class FinalSeverityDetail(BaseModel):
    distance: str
    temperature: str
    sound: str
    moisture: str
    vibration: str
    overall: str


class MappedFeatures(BaseModel):
    displacement_mm: float | None = None
    temperature_c: float | None = None
    vibration_ms2: float | None = None
    soil_settlement_mm: float | None = None


class PredictionResponse(BaseModel):
    status: str
    prediction: str | None = None
    confidence: float | None = None
    mapping_notes: list[str] = Field(default_factory=list)
    reason: str | None = None
    severity: SeverityDetail | None = None
    final_severity: FinalSeverityDetail | None = None
    mapped_features: MappedFeatures | None = None