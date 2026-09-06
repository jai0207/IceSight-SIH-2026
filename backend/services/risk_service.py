def calculate_risk(weather, sea_ice):
    score = 0

    # Wind contribution
    if weather["wind_speed_kmh"] > 50:
        score += 30
    elif weather["wind_speed_kmh"] > 30:
        score += 20
    elif weather["wind_speed_kmh"] > 15:
        score += 10

    # Visibility contribution
    if weather["visibility_km"] < 2:
        score += 30
    elif weather["visibility_km"] < 5:
        score += 20
    elif weather["visibility_km"] < 10:
        score += 10

    # Wave contribution
    if sea_ice["wave_height_m"] and sea_ice["wave_height_m"] > 3:
        score += 25
    elif sea_ice["wave_height_m"] and sea_ice["wave_height_m"] > 1.5:
        score += 15

    # Ocean current contribution
    if sea_ice["ocean_current_kmh"] > 4:
        score += 15
    elif sea_ice["ocean_current_kmh"] > 2:
        score += 10

    score = min(score, 100)

    if score >= 70:
        level = "High"
    elif score >= 40:
        level = "Moderate"
    else:
        level = "Low"

    return {
        "risk_score": score,
        "risk_level": level
    }