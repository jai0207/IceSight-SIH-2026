"""Create continuous, physically plausible daily iceberg-track segments.

This deliberately works only with the existing selected-position dataset.  It
does not invent positions across missing days: a gap or an implausible jump
starts a new segment, preventing trajectories from being stitched together.
"""
from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
import pandas as pd

BASE_DIR = Path(__file__).resolve().parents[1]
INPUT_FILE = BASE_DIR / "data" / "processed" / "iceberg_trajectories.csv"
OUTPUT_FILE = BASE_DIR / "data" / "processed" / "iceberg_tracks_clean.csv"


def haversine_km(lat1, lon1, lat2, lon2):
    """Vectorised great-circle distance in kilometres."""
    radius = 6371.0088
    lat1, lon1, lat2, lon2 = map(np.radians, (lat1, lon1, lat2, lon2))
    a = np.sin((lat2 - lat1) / 2) ** 2 + np.cos(lat1) * np.cos(lat2) * np.sin((lon2 - lon1) / 2) ** 2
    return 2 * radius * np.arctan2(np.sqrt(a), np.sqrt(1 - a))


def clean_tracks(data: pd.DataFrame, max_speed_km_day: float) -> pd.DataFrame:
    data = data.copy()
    data["date"] = pd.to_datetime(data["date"], errors="coerce")
    data["latitude"] = pd.to_numeric(data["latitude"], errors="coerce")
    data["longitude"] = pd.to_numeric(data["longitude"], errors="coerce")
    data = data.dropna(subset=["iceberg_id", "date", "latitude", "longitude"])
    data = data.sort_values(["iceberg_id", "date"]).drop_duplicates(["iceberg_id", "date"], keep="first")

    previous = data.groupby("iceberg_id", sort=False)[["date", "latitude", "longitude"]].shift()
    data["gap_days"] = (data["date"] - previous["date"]).dt.total_seconds() / 86400
    data["distance_km"] = haversine_km(previous["latitude"], previous["longitude"], data["latitude"], data["longitude"])
    data["speed_km_day"] = data["distance_km"] / data["gap_days"]

    # We train from observed daily positions only.  The first point, a date gap,
    # or a position requiring excessive speed begins a new independent segment.
    data["segment_start"] = (
        data["gap_days"].isna()
        | ~np.isclose(data["gap_days"], 1.0)
        | (data["speed_km_day"] > max_speed_km_day)
        | ~np.isfinite(data["speed_km_day"].fillna(0))
    )
    data["segment_number"] = data.groupby("iceberg_id", sort=False)["segment_start"].cumsum().astype(int)
    data["track_segment_id"] = data["iceberg_id"].astype(str) + "_" + data["segment_number"].astype(str)
    data["quality_flag"] = np.where(data["segment_start"], "segment_start", "continuous_daily")
    data.loc[data["speed_km_day"] > max_speed_km_day, "quality_flag"] = "jump_segment_start"

    return data.drop(columns=["segment_start", "segment_number"]).reset_index(drop=True)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--max-speed-km-day", type=float, default=75.0,
                        help="Start a new segment above this speed (default: 75).")
    args = parser.parse_args()
    cleaned = clean_tracks(pd.read_csv(INPUT_FILE), args.max_speed_km_day)
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    cleaned.to_csv(OUTPUT_FILE, index=False)
    lengths = cleaned.groupby("track_segment_id").size()
    print(f"Saved {len(cleaned):,} observations to {OUTPUT_FILE}")
    print(f"Segments: {len(lengths):,}; segments >=17 days: {(lengths >= 17).sum():,}")


if __name__ == "__main__":
    main()
