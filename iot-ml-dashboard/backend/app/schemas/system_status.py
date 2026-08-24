from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class SystemStatus:
    model_loaded: bool
    model_path: str
    model_classes: list[str]
    required_features: list[str]
    directly_mappable_features: list[str]
    unresolved_features: list[str]
    ready_for_prediction: bool