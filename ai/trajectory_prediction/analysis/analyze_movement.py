from pathlib import Path

import numpy as np
import pandas as pd


# ---------------------------------------------------------
# PATHS
# ---------------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent.parent

DATA_FILE = (
    BASE_DIR
    / "data"
    / "processed"
    / "iceberg_trajectories.csv"
)

OUTPUT_DIR = BASE_DIR / "analysis" / "output"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

OUTPUT_FILE = OUTPUT_DIR / "iceberg_movement.csv"


# ---------------------------------------------------------
# HAVERSINE DISTANCE
# ---------------------------------------------------------

def haversine_km(lat1, lon1, lat2, lon2):

    earth_radius_km = 6371.0

    lat1 = np.radians(lat1)
    lat2 = np.radians(lat2)

    delta_lat = np.radians(lat2 - lat1)
    delta_lon = np.radians(lon2 - lon1)

    a = (
        np.sin(delta_lat / 2) ** 2
        + np.cos(lat1)
        * np.cos(lat2)
        * np.sin(delta_lon / 2) ** 2
    )

    c = 2 * np.arctan2(
        np.sqrt(a),
        np.sqrt(1 - a)
    )

    return earth_radius_km * c


# ---------------------------------------------------------
# LOAD DATA
# ---------------------------------------------------------

print("=" * 60)
print("ICEBERG MOVEMENT ANALYSIS")
print("=" * 60)

print()
print("Loading dataset...")

df = pd.read_csv(DATA_FILE)

df["date"] = pd.to_datetime(df["date"])

df = df.sort_values(
    ["iceberg_id", "date"]
).reset_index(drop=True)

print(f"Observations: {len(df):,}")
print(f"Unique icebergs: {df['iceberg_id'].nunique():,}")


# ---------------------------------------------------------
# PREVIOUS POSITION
# ---------------------------------------------------------

df["previous_latitude"] = (
    df.groupby("iceberg_id")["latitude"].shift(1)
)

df["previous_longitude"] = (
    df.groupby("iceberg_id")["longitude"].shift(1)
)

df["previous_date"] = (
    df.groupby("iceberg_id")["date"].shift(1)
)


# ---------------------------------------------------------
# TIME DIFFERENCE
# ---------------------------------------------------------

df["days_elapsed"] = (
    df["date"] - df["previous_date"]
).dt.total_seconds() / (24 * 3600)


# ---------------------------------------------------------
# DISTANCE
# ---------------------------------------------------------

df["distance_km"] = haversine_km(
    df["previous_latitude"],
    df["previous_longitude"],
    df["latitude"],
    df["longitude"]
)


# ---------------------------------------------------------
# SPEED
# ---------------------------------------------------------

df["speed_km_per_day"] = (
    df["distance_km"] / df["days_elapsed"]
)


# ---------------------------------------------------------
# KEEP VALID MOVEMENT RECORDS
# ---------------------------------------------------------

movement = df[
    df["previous_latitude"].notna()
    & df["previous_longitude"].notna()
    & df["days_elapsed"].notna()
    & (df["days_elapsed"] > 0)
].copy()


# ---------------------------------------------------------
# REMOVE EXTREME / INVALID VALUES
# ---------------------------------------------------------

movement = movement[
    movement["distance_km"].notna()
    & np.isfinite(movement["distance_km"])
    & np.isfinite(movement["speed_km_per_day"])
]


# ---------------------------------------------------------
# SAVE
# ---------------------------------------------------------

movement.to_csv(
    OUTPUT_FILE,
    index=False
)


# ---------------------------------------------------------
# STATISTICS
# ---------------------------------------------------------

print()
print("=" * 60)
print("MOVEMENT STATISTICS")
print("=" * 60)

print()
print(f"Movement records: {len(movement):,}")

print()
print("Distance travelled per observation:")
print(movement["distance_km"].describe())

print()
print("Speed (km/day):")
print(movement["speed_km_per_day"].describe())

print()
print("Speed percentiles:")

for percentile in [50, 75, 90, 95, 99]:

    value = movement["speed_km_per_day"].quantile(
        percentile / 100
    )

    print(
        f"  {percentile}th percentile: "
        f"{value:.3f} km/day"
    )


# ---------------------------------------------------------
# TIME GAP STATISTICS
# ---------------------------------------------------------

print()
print("Time gap between observations:")

print(
    movement["days_elapsed"].describe()
)


# ---------------------------------------------------------
# FASTEST OBSERVATIONS
# ---------------------------------------------------------

print()
print("10 fastest movements:")

fastest = (
    movement
    .sort_values(
        "speed_km_per_day",
        ascending=False
    )
    .head(10)
)

print(
    fastest[
        [
            "iceberg_id",
            "date",
            "latitude",
            "longitude",
            "distance_km",
            "days_elapsed",
            "speed_km_per_day"
        ]
    ].to_string(index=False)
)


# ---------------------------------------------------------
# COMPLETE
# ---------------------------------------------------------

print()
print("Movement dataset saved to:")

print(OUTPUT_FILE)

print()
print("=" * 60)
print("MOVEMENT ANALYSIS COMPLETE")
print("=" * 60)
