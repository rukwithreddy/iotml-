from __future__ import annotations

from dataclasses import dataclass

import numpy as np
import pandas as pd

from app.ml.feature_mapper import FeatureMappingResult, map_sensor_reading_to_bridge_features
from app.ml.model_loader import load_model
from app.schemas.sensor_reading import SensorReading


@dataclass(frozen=True, slots=True)
class PredictionResult:
    prediction: str
    confidence: float | None
    features: dict[str, float | None]
    mapping_notes: tuple[str, ...]
    imputed_features: tuple[str, ...]


class PredictionService:
    def __init__(self) -> None:
        self.model = load_model()
        self.feature_names = tuple(getattr(self.model, "feature_names_in_", ()))

    def map_reading(self, reading: SensorReading) -> FeatureMappingResult:
        return map_sensor_reading_to_bridge_features(reading)

    def predict_from_reading(self, reading: SensorReading) -> PredictionResult:
        mapping = self.map_reading(reading)

        feature_row = mapping.features.to_dict()
        row_values = []
        for name in self.feature_names:
            source_value = feature_row.get(name.lower(), np.nan)
            row_values.append(np.nan if source_value is None else source_value)

        ordered_row = pd.DataFrame([row_values], columns=self.feature_names)

        if ordered_row.isna().all(axis=None):
            raise ValueError("No usable model features were available from the live reading")

        prediction = self.model.predict(ordered_row)[0]

        confidence = None
        if hasattr(self.model, "predict_proba"):
            probabilities = self.model.predict_proba(ordered_row)[0]
            confidence = float(max(probabilities))

        return PredictionResult(
            prediction=str(prediction),
            confidence=confidence,
            features=feature_row,
            mapping_notes=mapping.notes,
            imputed_features=tuple(mapping.missing_features),
        )