from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path

import joblib


DEFAULT_MODEL_PATH = Path(__file__).resolve().parents[4] / "bridge_anomaly_model.pkl"


def _resolve_model_path() -> Path:
    configured_path = os.getenv("MODEL_PATH")
    if configured_path:
        return Path(configured_path).expanduser().resolve()
    return DEFAULT_MODEL_PATH


@lru_cache(maxsize=1)
def load_model() -> object:
    model_path = _resolve_model_path()
    if not model_path.exists():
        raise FileNotFoundError(f"Model artifact not found: {model_path}")
    return joblib.load(model_path)