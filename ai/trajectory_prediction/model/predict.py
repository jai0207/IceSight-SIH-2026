"""Reusable Model 3 inference interface returning the six specification fields."""
from __future__ import annotations

from pathlib import Path

import joblib
import numpy as np
import pandas as pd
import tensorflow as tf

from train_lstm import destination

BASE_DIR = Path(__file__).resolve().parents[1]
ARTIFACT_DIR = BASE_DIR / "model" / "artifacts"


class TrajectoryPredictor:
    def __init__(self, artifact_dir: Path = ARTIFACT_DIR):
        self.model = tf.keras.models.load_model(artifact_dir / "trajectory_lstm.keras")
        self.feature_scaler = joblib.load(artifact_dir / "feature_scaler.joblib")
        self.target_scaler = joblib.load(artifact_dir / "target_scaler.joblib")

    def predict(self, observations: list[dict]) -> dict:
        """Predict from at least 14 daily ordered observations with lat/lon keys."""
        if len(observations) < 14:
            raise ValueError("Model 3 needs at least 14 consecutive daily observations.")
        frame = pd.DataFrame(observations[-14:]).copy()
        required = {"latitude", "longitude"}
        if not required.issubset(frame.columns):
            raise ValueError("Each observation must contain latitude and longitude.")
        lat, lon = frame.latitude.to_numpy(float), frame.longitude.to_numpy(float)
        lon_unwrapped = np.degrees(np.unwrap(np.radians(lon)))
        north = np.zeros(14); east = np.zeros(14)
        north[1:] = (lat[1:] - lat[:-1]) * 111.32
        east[1:] = ((lon[1:] - lon[:-1] + 180) % 360 - 180) * 111.32 * np.cos(np.radians((lat[1:] + lat[:-1]) / 2))
        features = np.column_stack([lat, lon_unwrapped, north, east, np.hypot(north, east), np.arctan2(east, north)])
        X = self.feature_scaler.transform(features).reshape(1, 14, 6)
        displacement = self.target_scaler.inverse_transform(self.model.predict(X, verbose=0))[0]
        result = {}
        for horizon, index in ((24, 0), (48, 2), (72, 4)):
            future_lat, future_lon = destination(lat[-1], lon[-1], displacement[index], displacement[index + 1])
            result[f"future_latitude_{horizon}h"] = float(future_lat)
            result[f"future_longitude_{horizon}h"] = float(future_lon)
        return result
