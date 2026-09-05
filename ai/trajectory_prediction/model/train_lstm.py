"""Train and evaluate the first Model 3 trajectory LSTM baseline."""
from __future__ import annotations

import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
import tensorflow as tf
from sklearn.preprocessing import StandardScaler

BASE_DIR = Path(__file__).resolve().parents[1]
SEQUENCES_FILE = BASE_DIR / "data" / "processed" / "trajectory_sequences.npz"
METADATA_FILE = BASE_DIR / "data" / "processed" / "trajectory_sequence_metadata.csv"
MODEL_DIR = BASE_DIR / "model" / "artifacts"
HORIZON_LABELS = ("24h", "48h", "72h")


def destination(lat, lon, north_km, east_km):
    """Convert short local north/east displacement back to geographic position."""
    destination_lat = lat + north_km / 111.32
    destination_lon = lon + east_km / (111.32 * np.cos(np.radians((lat + destination_lat) / 2)))
    return destination_lat, ((destination_lon + 180) % 360) - 180


def haversine_km(lat1, lon1, lat2, lon2):
    radius = 6371.0088
    lat1, lon1, lat2, lon2 = map(np.radians, (lat1, lon1, lat2, lon2))
    a = np.sin((lat2 - lat1) / 2) ** 2 + np.cos(lat1) * np.cos(lat2) * np.sin((lon2 - lon1) / 2) ** 2
    return 2 * radius * np.arctan2(np.sqrt(a), np.sqrt(1 - a))


def chronological_split(metadata: pd.DataFrame):
    """Split by anchor time, never randomly, to prevent future leakage."""
    order = np.argsort(pd.to_datetime(metadata["anchor_date"]).to_numpy())
    count = len(order)
    train_end, validation_end = int(count * .70), int(count * .85)
    return order[:train_end], order[train_end:validation_end], order[validation_end:]


def scale_features(X_train, X_other):
    scaler = StandardScaler().fit(X_train.reshape(-1, X_train.shape[-1]))
    return scaler, scaler.transform(X_other.reshape(-1, X_other.shape[-1])).reshape(X_other.shape)


def report_errors(name, predicted, actual, anchors):
    results = {}
    for i, label in enumerate(HORIZON_LABELS):
        pred_lat, pred_lon = destination(anchors[:, 0], anchors[:, 1], predicted[:, 2 * i], predicted[:, 2 * i + 1])
        true_lat, true_lon = destination(anchors[:, 0], anchors[:, 1], actual[:, 2 * i], actual[:, 2 * i + 1])
        errors = haversine_km(pred_lat, pred_lon, true_lat, true_lon)
        results[label] = {"mean_km": float(errors.mean()), "median_km": float(np.median(errors)), "p90_km": float(np.quantile(errors, .90))}
    print(name, json.dumps(results, indent=2))
    return results


def main():
    tf.keras.utils.set_random_seed(42)
    archive = np.load(SEQUENCES_FILE, allow_pickle=True)
    X, y = archive["X"], archive["y"]
    metadata = pd.read_csv(METADATA_FILE)
    train_idx, validation_idx, test_idx = chronological_split(metadata)

    feature_scaler, X_train = scale_features(X[train_idx], X[train_idx])
    _, X_validation = scale_features(X[train_idx], X[validation_idx])
    _, X_test = scale_features(X[train_idx], X[test_idx])
    target_scaler = StandardScaler().fit(y[train_idx])
    y_train, y_validation = target_scaler.transform(y[train_idx]), target_scaler.transform(y[validation_idx])

    model = tf.keras.Sequential([
        tf.keras.layers.Input(shape=X.shape[1:]),
        tf.keras.layers.LSTM(64, dropout=.15),
        tf.keras.layers.Dense(32, activation="relu"),
        tf.keras.layers.Dense(6),
    ])
    model.compile(optimizer=tf.keras.optimizers.Adam(1e-3), loss="mse")
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    callbacks = [
        tf.keras.callbacks.EarlyStopping(monitor="val_loss", patience=12, restore_best_weights=True),
        tf.keras.callbacks.ModelCheckpoint(MODEL_DIR / "trajectory_lstm.keras", monitor="val_loss", save_best_only=True),
    ]
    model.fit(X_train, y_train, validation_data=(X_validation, y_validation), epochs=100, batch_size=128, callbacks=callbacks, verbose=2)

    predicted = target_scaler.inverse_transform(model.predict(X_test, verbose=0))
    anchors = metadata.iloc[test_idx][["anchor_latitude", "anchor_longitude"]].to_numpy(float)
    # Persistence is a mandatory honest baseline: the iceberg remains at anchor.
    persistence = np.zeros_like(y[test_idx])
    # Constant-velocity baseline extrapolates latest observed daily displacement.
    velocity = X[test_idx, -1, 2:4]
    drift = np.column_stack([velocity * h for h in (1, 2, 3)]).reshape(-1, 6)
    results = {"persistence": report_errors("Persistence", persistence, y[test_idx], anchors),
               "constant_velocity": report_errors("Constant velocity", drift, y[test_idx], anchors),
               "lstm": report_errors("LSTM", predicted, y[test_idx], anchors)}
    (MODEL_DIR / "evaluation.json").write_text(json.dumps(results, indent=2), encoding="utf-8")
    joblib.dump(feature_scaler, MODEL_DIR / "feature_scaler.joblib")
    joblib.dump(target_scaler, MODEL_DIR / "target_scaler.joblib")
    (MODEL_DIR / "model_metadata.json").write_text(json.dumps({"window_days": int(X.shape[1]), "feature_names": archive["feature_names"].tolist(), "target": "north/east displacement kilometres at 24/48/72h"}, indent=2), encoding="utf-8")
    print(f"Saved model and evaluation to {MODEL_DIR}")


if __name__ == "__main__":
    main()
