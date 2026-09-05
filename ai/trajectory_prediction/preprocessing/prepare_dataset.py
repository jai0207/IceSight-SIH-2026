import os
import pandas as pd


# ============================================================
# PATHS
# ============================================================

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

RAW_DIR = os.path.join(
    BASE_DIR,
    "data",
    "raw",
    "consolidated_database_v8.0",
    "updated7_consol"
)

PROCESSED_DIR = os.path.join(BASE_DIR, "data", "processed")

OUTPUT_FILE = os.path.join(
    PROCESSED_DIR,
    "iceberg_trajectories.csv"
)


# ============================================================
# SENSOR PRIORITY
# ============================================================

SENSORS = [
    "ascat",
    "qscat",
    "ers",
    "nscat",
    "oscat",
    "sass",
    "seawinds",
    "nic"
]


# ============================================================
# DATE PARSER
# ============================================================

def parse_date(value):
    """
    Parse iceberg database dates.

    Normal format:
        YYYYDDD
        Example: 2014091 -> 2014-04-01

    Special ERS format:
        YYDDD
        Example: 92226 -> 1992-08-13
    """

    if pd.isna(value):
        return pd.NaT

    try:
        value = int(value)
    except (ValueError, TypeError):
        return pd.NaT

    text = str(value)

    # Normal format: YYYYDDD
    if len(text) == 7:
        year = int(text[:4])
        day_of_year = int(text[4:])

    # Special ERS format: YYDDD
    elif len(text) == 5:
        year = 1900 + int(text[:2])
        day_of_year = int(text[2:])

    else:
        return pd.NaT

    try:
        return pd.Timestamp(
            year=year,
            month=1,
            day=1
        ) + pd.Timedelta(days=day_of_year - 1)

    except Exception:
        return pd.NaT


# ============================================================
# MAIN
# ============================================================

def main():

    print("=" * 60)
    print("ICEBERG TRAJECTORY DATA PREPROCESSING")
    print("=" * 60)

    print("Raw directory:")
    print(RAW_DIR)
    print()

    os.makedirs(PROCESSED_DIR, exist_ok=True)

    files = sorted(
        f for f in os.listdir(RAW_DIR)
        if f.lower().endswith(".csv")
    )

    print(f"CSV files found: {len(files)}")
    print()

    all_data = []

    raw_rows = 0
    valid_observations = 0
    skipped_files = []
    successful_files = 0

    # ========================================================
    # PROCESS EACH ICEBERG
    # ========================================================

    for index, filename in enumerate(files, start=1):

        filepath = os.path.join(RAW_DIR, filename)

        iceberg_id = os.path.splitext(filename)[0]

        print(f"[{index}/{len(files)}] {iceberg_id}")

        try:
            df = pd.read_csv(filepath)

            raw_rows += len(df)

            # ------------------------------------------------
            # Find date column
            # ------------------------------------------------

            if "date" not in df.columns:
                skipped_files.append(
                    (iceberg_id, "missing date column")
                )
                continue

            # ------------------------------------------------
            # Parse dates
            # ------------------------------------------------

            df["parsed_date"] = df["date"].apply(parse_date)

            # ------------------------------------------------
            # Find first valid sensor according to priority
            # ------------------------------------------------

            selected = None

            for sensor in SENSORS:

                lat_col = f"{sensor}_1"
                lon_col = f"{sensor}_2"
                flag_col = f"{sensor}_3"

                if not all(
                    col in df.columns
                    for col in [lat_col, lon_col, flag_col]
                ):
                    continue

                lat = pd.to_numeric(
                    df[lat_col],
                    errors="coerce"
                )

                lon = pd.to_numeric(
                    df[lon_col],
                    errors="coerce"
                )

                flag = pd.to_numeric(
                    df[flag_col],
                    errors="coerce"
                )

                valid = (
                    (flag == 1)
                    & lat.notna()
                    & lon.notna()
                    & (lat != 0)
                    & (lon != 0)
                    & (lat >= -90)
                    & (lat <= 90)
                    & (lon >= -180)
                    & (lon <= 180)
                    & df["parsed_date"].notna()
                )

                if valid.any():

                    if selected is None:
                        selected = pd.DataFrame(
                            {
                                "date": df.loc[valid, "parsed_date"],
                                "latitude": lat.loc[valid],
                                "longitude": lon.loc[valid],
                                "source": sensor
                            }
                        )

                    else:
                        # Only use rows that haven't already
                        # received a higher-priority sensor.
                        existing_dates = set(
                            selected["date"]
                        )

                        new_rows = pd.DataFrame(
                            {
                                "date": df.loc[valid, "parsed_date"],
                                "latitude": lat.loc[valid],
                                "longitude": lon.loc[valid],
                                "source": sensor
                            }
                        )

                        new_rows = new_rows[
                            ~new_rows["date"].isin(existing_dates)
                        ]

                        selected = pd.concat(
                            [selected, new_rows],
                            ignore_index=True
                        )

            # ------------------------------------------------
            # No usable data
            # ------------------------------------------------

            if selected is None or selected.empty:

                skipped_files.append(
                    (iceberg_id, "no valid observations")
                )

                continue

            # ------------------------------------------------
            # Add iceberg ID
            # ------------------------------------------------

            selected.insert(
                0,
                "iceberg_id",
                iceberg_id
            )

            # ------------------------------------------------
            # Remove duplicate dates
            # ------------------------------------------------

            selected = (
                selected
                .sort_values("date")
                .drop_duplicates(
                    subset=["iceberg_id", "date"],
                    keep="first"
                )
            )

            valid_observations += len(selected)

            all_data.append(selected)

            successful_files += 1

        except Exception as e:

            skipped_files.append(
                (iceberg_id, str(e))
            )

    # ========================================================
    # COMBINE EVERYTHING
    # ========================================================

    if not all_data:
        print()
        print("ERROR: No valid data was produced.")
        return

    result = pd.concat(
        all_data,
        ignore_index=True
    )

    result = result.sort_values(
        ["iceberg_id", "date"]
    ).reset_index(drop=True)

    # ========================================================
    # SAVE
    # ========================================================

    result.to_csv(
        OUTPUT_FILE,
        index=False
    )

    # ========================================================
    # STATISTICS
    # ========================================================

    invalid_rows = raw_rows - valid_observations

    print()
    print("=" * 60)
    print("PREPROCESSING COMPLETE")
    print("=" * 60)

    print(f"Raw rows examined          : {raw_rows:,}")
    print(f"Valid sensor observations  : {valid_observations:,}")
    print(f"Invalid/unusable rows      : {invalid_rows:,}")
    print(f"Files successfully processed: {successful_files}")
    print(f"Files skipped               : {len(skipped_files)}")
    print(f"Final observations          : {len(result):,}")
    print(f"Unique icebergs             : {result['iceberg_id'].nunique()}")

    print()
    print("Date range:")
    print(
        f"  {result['date'].min().date()} "
        f"→ "
        f"{result['date'].max().date()}"
    )

    print()
    print("Position sources:")
    print(result["source"].value_counts())

    print()
    print("Example iceberg IDs:")
    print(
        result["iceberg_id"]
        .drop_duplicates()
        .head(20)
        .tolist()
    )

    print()
    print("First 10 rows:")
    print(
        result.head(10).to_string(index=False)
    )

    print()
    print("Saved to:")
    print(OUTPUT_FILE)

    print()
    print("=" * 60)
    print("DONE")
    print("=" * 60)


if __name__ == "__main__":
    main()