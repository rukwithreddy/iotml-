from __future__ import annotations

from dataclasses import asdict

from fastapi import APIRouter

from app.ml.model_loader import _resolve_model_path, load_model
from app.schemas.system_status import SystemStatus
from app.services.live_store import is_connected


router = APIRouter(prefix="/api", tags=["system"])


@router.get("/system/status", response_model=None)
def system_status() -> dict[str, object]:
    model = load_model()
    model_path = str(_resolve_model_path())
    feature_names = list(getattr(model, "feature_names_in_", []))
    unresolved_features = ["vibration_ms2", "soil_settlement_mm"]
    status = SystemStatus(
        model_loaded=True,
        model_path=model_path,
        model_classes=list(getattr(model, "classes_", [])),
        required_features=feature_names,
        directly_mappable_features=["displacement_mm", "temperature_c"],
        unresolved_features=unresolved_features,
        ready_for_prediction=True,
    )
    result = asdict(status)
    result["serial_connected"] = is_connected()
    return result