from __future__ import annotations

from fastapi import APIRouter

from app.ml.prediction_service import PredictionService
from app.schemas.predictions import (
    FinalSeverityDetail,
    MappedFeatures,
    PredictionResponse,
    SeverityDetail,
)
from app.services.live_store import get_latest
from app.services.readings_repository import load_latest_reading
from app.services.severity import compute_combined_severity, compute_severity


router = APIRouter(prefix="/api/predictions", tags=["predictions"])


@router.get("/latest", response_model=PredictionResponse)
def latest_prediction() -> PredictionResponse:
    # Prefer live in-memory reading; fall back to CSV
    reading = get_latest() or load_latest_reading()

    if reading is None:
        return PredictionResponse(status="unavailable", reason="no_sensor_data")

    # ── Rule-based severity ───────────────────────────────────────────────
    severity_report = compute_severity(reading)
    severity_detail = SeverityDetail(
        distance=severity_report.distance,
        temperature=severity_report.temperature,
        sound=severity_report.sound,
        moisture=severity_report.moisture,
        vibration=severity_report.vibration,
        overall=severity_report.overall,
    )

    # ── ML model prediction ─────────────────────────────────────────────────
    service = PredictionService()
    try:
        result = service.predict_from_reading(reading)
    except ValueError as exc:
        mapping = service.map_reading(reading)
        combined = compute_combined_severity(reading, "Low")
        return PredictionResponse(
            status="unavailable",
            reason=str(exc),
            mapping_notes=list(mapping.notes),
            severity=severity_detail,
            final_severity=FinalSeverityDetail(**combined.to_dict()),
        )

    # ── Combined final severity (max of ML prediction and rule status) ───────
    combined = compute_combined_severity(reading, result.prediction)
    final_severity_detail = FinalSeverityDetail(**combined.to_dict())

    mapped = result.features
    mapped_features = MappedFeatures(
        displacement_mm=mapped.get("displacement_mm"),
        temperature_c=mapped.get("temperature_c"),
        vibration_ms2=mapped.get("vibration_ms2"),
        soil_settlement_mm=mapped.get("soil_settlement_mm"),
    )

    notes = list(result.mapping_notes)
    if result.imputed_features:
        notes.append(
            f"Imputed features via training median: {', '.join(result.imputed_features)}"
        )

    return PredictionResponse(
        status="ok",
        prediction=result.prediction,
        confidence=result.confidence,
        mapping_notes=notes,
        severity=severity_detail,
        final_severity=final_severity_detail,
        mapped_features=mapped_features,
    )