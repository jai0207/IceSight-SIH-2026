"""Turn clean daily track segments into LSTM-ready 14-day samples."""
from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
import pandas as pd

BASE_DIR = Path(__file__).resolve().parents[1]
INPUT_FILE = BASE_DIR / "data" / "processed" / "iceberg_tracks_clean.csv"
OUTPUT_FILE = BASE_DIR / "data" / "processed" / "trajectory_sequences.npz"
METADATA_FILE = BASE_DIR / "data" / "processed" / "trajectory_sequence_metadata.csv"
WINDOW_DAYS = 14
HORIZONS_DAYS = (1, 2, 3)
FEATURE_NAMES = ("latitude", "longitude_unwrapped", "delta_north_km", "delta_east_km", "speed_km_day", "heading_radians")


def east_north_delta(lat0, lon0, lat1, lon1):
    """Local tangent-plane displacement, suitable for short daily movements."""
    north = (lat1 - lat0) * 111.32
    lon_difference = (lon1 - lon0 + 180) % 360 - 180
    east = lon_difference * 111.32 * np.cos(np.radians((lat0 + lat1) / 2))
    return north, east


def build_sequences(data: pd.DataFrame):
    X_parts, y_parts, metadata_parts = [], [], []
    for segment_id, track in data.groupby("track_segment_id", sort=False):
        track = track.sort_values("date").reset_index(drop=True).copy()
        if len(track) < WINDOW_DAYS + max(HORIZONS_DAYS):
            continue
        # Make longitude continuous around the international date line.
        track["longitude_unwrapped"] = np.degrees(np.unwrap(np.radians(track["longitude"].to_numpy())))
        north, east = east_north_delta(track["latitude"].shift(), track["longitude"].shift(), track["latitude"], track["longitude"])
        track["delta_north_km"] = np.nan_to_num(north, nan=0.0)
        track["delta_east_km"] = np.nan_to_num(east, nan=0.0)
        track["speed_km_day"] = np.hypot(track["delta_north_km"], track["delta_east_km"])
        track["heading_radians"] = np.arctan2(track["delta_east_km"], track["delta_north_km"])
        sample_count = len(track) - WINDOW_DAYS - max(HORIZONS_DAYS) + 1
        features = track.loc[:, FEATURE_NAMES].to_numpy(dtype=np.float32)
        # Produces every 14-day window in one operation; this is substantially
        # faster than constructing hundreds of thousands of DataFrame slices.
        windows = np.lib.stride_tricks.sliding_window_view(features, WINDOW_DAYS, axis=0)
        X_parts.append(windows[:sample_count].transpose(0, 2, 1).copy())

        anchor_indices = np.arange(WINDOW_DAYS - 1, WINDOW_DAYS - 1 + sample_count)
        anchor_lat = track["latitude"].to_numpy()[anchor_indices]
        anchor_lon = track["longitude"].to_numpy()[anchor_indices]
        target_columns = []
        for horizon in HORIZONS_DAYS:
            future_indices = anchor_indices + horizon
            n, e = east_north_delta(anchor_lat, anchor_lon,
                                    track["latitude"].to_numpy()[future_indices],
                                    track["longitude"].to_numpy()[future_indices])
            target_columns.extend([n, e])
        y_parts.append(np.column_stack(target_columns).astype(np.float32))
        anchors = track.iloc[anchor_indices]
        metadata_parts.append(pd.DataFrame({
            "track_segment_id": segment_id,
            "iceberg_id": anchors["iceberg_id"].to_numpy(),
            "anchor_date": anchors["date"].to_numpy(),
            "anchor_latitude": anchor_lat,
            "anchor_longitude": anchor_lon,
        }))
    return (np.concatenate(X_parts), np.concatenate(y_parts),
            pd.concat(metadata_parts, ignore_index=True))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", type=Path, default=INPUT_FILE)
    args = parser.parse_args()
    data = pd.read_csv(args.input, parse_dates=["date"])
    X, y, metadata = build_sequences(data)
    if not len(X):
        raise RuntimeError("No sequences were generated; inspect cleaning thresholds and daily coverage.")
    np.savez_compressed(OUTPUT_FILE, X=X, y=y, feature_names=np.asarray(FEATURE_NAMES), horizons_days=np.asarray(HORIZONS_DAYS))
    metadata.to_csv(METADATA_FILE, index=False)
    print(f"X shape: {X.shape}; y shape: {y.shape}")
    print(f"Saved {OUTPUT_FILE} and {METADATA_FILE}")


if __name__ == "__main__":
    main()
