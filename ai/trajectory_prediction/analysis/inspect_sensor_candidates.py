import pandas as pd
from pathlib import Path
from math import radians, sin, cos, asin, sqrt


# ============================================================
# PATHS
# ============================================================

PROJECT_ROOT = Path(__file__).resolve().parents[3]

RAW_DIR = (
    PROJECT_ROOT
    / "ai"
    / "trajectory_prediction"
    / "data"
    / "raw"
    / "consolidated_database_v8.0"
    / "updated7_consol"
)


# ============================================================
# SENSOR CONFIGURATION
# ============================================================

SENSORS = [
    "qscat",
    "ascat",
    "ers",
    "nic",
    "seawinds",
    "sass",
    "nscat",
    "oscat",
]


# ============================================================
# CASES TO INSPECT
# ============================================================

CASES = {
    "a43g": [
        "2003-08-30",
        "2003-08-31",
        "2003-09-01",
    ],

    "b09d": [
        "2015-09-03",
        "2015-09-04",
        "2015-09-05",
        "2015-09-06",
    ],

    "b15k": [
        "2013-03-21",
        "2013-03-22",
        "2013-03-23",
    ],

    "b16": [
        "2007-12-02",
        "2007-12-03",
        "2007-12-04",
        "2008-04-11",
        "2008-04-13",
        "2008-04-14",
        "2008-04-19",
        "2008-04-20",
        "2008-05-10",
        "2008-05-11",
        "2008-05-25",
        "2008-05-27",
    ],

    "d21a": [
        "2017-07-09",
        "2017-07-10",
        "2017-07-11",
        "2017-12-21",
        "2017-12-22",
        "2017-12-23",
    ],
}


# ============================================================
# DATE PARSER
# ============================================================

def parse_date(value):
    """
    BYU consolidated database uses:

    7 digits -> YYYYDDD
    5 digits -> YYDDD

    Example:
        2003243 -> 2003-08-31
        92226   -> 1992-08-13
    """

    value = str(value).strip()

    if not value.isdigit():
        return pd.NaT

    if len(value) == 7:
        year = int(value[:4])
        day_of_year = int(value[4:])

    elif len(value) == 5:
        year = 1900 + int(value[:2])
        day_of_year = int(value[2:])

    else:
        return pd.NaT

    try:
        return pd.Timestamp(year=year, month=1, day=1) + pd.Timedelta(
            days=day_of_year - 1
        )
    except Exception:
        return pd.NaT


# ============================================================
# HAVERSINE DISTANCE
# ============================================================

def haversine_km(lat1, lon1, lat2, lon2):

    R = 6371.0

    lat1 = radians(lat1)
    lat2 = radians(lat2)

    dlat = lat2 - lat1
    dlon = radians(lon2 - lon1)

    a = (
        sin(dlat / 2) ** 2
        + cos(lat1)
        * cos(lat2)
        * sin(dlon / 2) ** 2
    )

    return 2 * R * asin(sqrt(a))


# ============================================================
# READ ONE ICEBERG FILE
# ============================================================

def load_iceberg(iceberg_id):

    path = RAW_DIR / f"{iceberg_id}.csv"

    if not path.exists():
        print(f"\nERROR: File not found: {path}")
        return None

    df = pd.read_csv(path)

    df["parsed_date"] = df["date"].apply(parse_date)

    return df


# ============================================================
# GET VALID SENSOR CANDIDATES
# ============================================================

def get_candidates(row):

    candidates = []

    for sensor in SENSORS:

        lat_col = f"{sensor}_1"
        lon_col = f"{sensor}_2"
        flag_col = f"{sensor}_3"

        if (
            lat_col not in row.index
            or lon_col not in row.index
            or flag_col not in row.index
        ):
            continue

        lat = row[lat_col]
        lon = row[lon_col]
        flag = row[flag_col]

        if pd.isna(lat) or pd.isna(lon) or pd.isna(flag):
            continue

        try:
            lat = float(lat)
            lon = float(lon)
            flag = int(flag)
        except Exception:
            continue

        # Only consider observations explicitly marked valid.
        if flag != 1:
            continue

        # Basic coordinate sanity check.
        if not (-90 <= lat <= 90):
            continue

        if not (-180 <= lon <= 180):
            continue

        candidates.append(
            {
                "sensor": sensor,
                "lat": lat,
                "lon": lon,
            }
        )

    return candidates


# ============================================================
# MAIN INSPECTION
# ============================================================

def main():

    print("=" * 80)
    print("ICEBERG SENSOR CANDIDATE INSPECTION")
    print("=" * 80)

    for iceberg_id, target_dates in CASES.items():

        print("\n")
        print("#" * 80)
        print(f"ICEBERG: {iceberg_id}")
        print("#" * 80)

        df = load_iceberg(iceberg_id)

        if df is None:
            continue

        df = df.sort_values("parsed_date").reset_index(drop=True)

        target_timestamps = {
            pd.Timestamp(date): date
            for date in target_dates
        }

        selected_previous = None

        for _, row in df.iterrows():

            current_date = row["parsed_date"]

            if pd.isna(current_date):
                continue

            if current_date not in target_timestamps:
                continue

            candidates = get_candidates(row)

            print("\n" + "-" * 80)
            print(f"DATE: {current_date.date()}")
            print("-" * 80)

            if not candidates:
                print("No valid sensor candidates.")
                continue

            print("Valid sensor candidates:")

            for candidate in candidates:

                print(
                    f"  {candidate['sensor']:10s} "
                    f"lat={candidate['lat']:10.4f} "
                    f"lon={candidate['lon']:10.4f}"
                )

            # ------------------------------------------------
            # Current preprocessing choice
            # ------------------------------------------------

            chosen = candidates[0]

            print("\nCurrent preprocessing would choose:")
            print(
                f"  {chosen['sensor']} "
                f"({chosen['lat']:.4f}, {chosen['lon']:.4f})"
            )

            # ------------------------------------------------
            # Compare candidates against each other
            # ------------------------------------------------

            if len(candidates) > 1:

                print("\nDistances between sensor candidates:")

                for i in range(len(candidates)):

                    for j in range(i + 1, len(candidates)):

                        a = candidates[i]
                        b = candidates[j]

                        distance = haversine_km(
                            a["lat"],
                            a["lon"],
                            b["lat"],
                            b["lon"],
                        )

                        print(
                            f"  {a['sensor']:10s} <-> "
                            f"{b['sensor']:10s}: "
                            f"{distance:10.2f} km"
                        )

            # ------------------------------------------------
            # Compare with previous selected observation
            # ------------------------------------------------

            if selected_previous is not None:

                previous_date = selected_previous["date"]

                days_elapsed = (
                    current_date - previous_date
                ).total_seconds() / 86400.0

                distance = haversine_km(
                    selected_previous["lat"],
                    selected_previous["lon"],
                    chosen["lat"],
                    chosen["lon"],
                )

                speed = distance / days_elapsed

                print("\nMovement from previous inspected date:")
                print(
                    f"  Previous: "
                    f"{previous_date.date()} "
                    f"({selected_previous['lat']:.4f}, "
                    f"{selected_previous['lon']:.4f})"
                )

                print(
                    f"  Current : "
                    f"{current_date.date()} "
                    f"({chosen['lat']:.4f}, "
                    f"{chosen['lon']:.4f})"
                )

                print(
                    f"  Time gap: {days_elapsed:.1f} days"
                )

                print(
                    f"  Distance: {distance:.2f} km"
                )

                print(
                    f"  Speed   : {speed:.2f} km/day"
                )

            selected_previous = {
                "date": current_date,
                "lat": chosen["lat"],
                "lon": chosen["lon"],
                "sensor": chosen["sensor"],
            }

    print("\n")
    print("=" * 80)
    print("INSPECTION COMPLETE")
    print("=" * 80)


if __name__ == "__main__":
    main()
