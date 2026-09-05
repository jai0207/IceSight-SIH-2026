from pathlib import Path

import pandas as pd
import matplotlib.pyplot as plt


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

OUTPUT_DIR = BASE_DIR / "visualization" / "output"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


# ---------------------------------------------------------
# LOAD DATA
# ---------------------------------------------------------

print("=" * 60)
print("ICEBERG TRAJECTORY VISUALIZATION")
print("=" * 60)

print(f"Loading dataset:\n{DATA_FILE}")

df = pd.read_csv(DATA_FILE)

df["date"] = pd.to_datetime(df["date"])

print(f"Observations: {len(df):,}")
print(f"Unique icebergs: {df['iceberg_id'].nunique():,}")


# ---------------------------------------------------------
# FIND ICEBERGS WITH THE MOST OBSERVATIONS
# ---------------------------------------------------------

iceberg_counts = (
    df["iceberg_id"]
    .value_counts()
    .head(10)
)

print()
print("Top 10 icebergs by number of observations:")
print(iceberg_counts)


# ---------------------------------------------------------
# PLOT TOP 10 TRAJECTORIES
# ---------------------------------------------------------

plt.figure(figsize=(12, 8))

for iceberg_id in iceberg_counts.index:

    iceberg = df[df["iceberg_id"] == iceberg_id]

    iceberg = iceberg.sort_values("date")

    plt.plot(
        iceberg["longitude"],
        iceberg["latitude"],
        linewidth=1,
        label=iceberg_id
    )


plt.xlabel("Longitude")
plt.ylabel("Latitude")

plt.title("Historical Antarctic Iceberg Trajectories")

plt.grid(True)
plt.legend()

plt.tight_layout()


# ---------------------------------------------------------
# SAVE
# ---------------------------------------------------------

output_file = OUTPUT_DIR / "all_trajectories_top10.png"

plt.savefig(
    output_file,
    dpi=200
)

plt.show()

print()
print("Plot saved to:")
print(output_file)

print()
print("=" * 60)
print("VISUALIZATION COMPLETE")
print("=" * 60)