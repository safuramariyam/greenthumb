"""
Weather Integration Routes
Provides weather forecasts and weather-based farming recommendations
"""

import os
import requests
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import logging

router = APIRouter()

# Setup logging
logger = logging.getLogger(__name__)

# Weather API Configuration
OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY", "demo_key")  # Replace with actual API key
OPENWEATHER_BASE_URL = "https://api.openweathermap.org/data/2.5"

# Response Models
class WeatherData(BaseModel):
    date: str
    temperature: float
    humidity: int
    precipitation: float
    wind_speed: float
    weather_condition: str
    weather_icon: str
    description: str

class WeatherForecast(BaseModel):
    location: str
    forecasts: List[WeatherData]

class WeatherRecommendation(BaseModel):
    task_type: str
    recommendation: str
    severity: str  # 'low', 'medium', 'high'
    reason: str

class WeatherImpact(BaseModel):
    will_rain_today: bool
    rain_probability: float
    temperature_trend: str  # 'rising', 'falling', 'stable'
    recommendations: List[WeatherRecommendation]

# Mock weather data for demo purposes (when API key is not available)
def get_mock_weather_forecast() -> List[Dict[str, Any]]:
    """Return mock weather data for demonstration"""
    today = datetime.now()
    forecast = []

    for i in range(7):
        date = today + timedelta(days=i)
        forecast.append({
            "date": date.strftime("%Y-%m-%d"),
            "temperature": 25 + (i % 3) * 2,  # Vary temperature slightly
            "humidity": 65 + (i % 2) * 10,
            "precipitation": 0.0 if i > 2 else 2.5,  # Rain on first few days
            "wind_speed": 5 + (i % 2),
            "weather_condition": "Rain" if i < 3 else "Clear",
            "weather_icon": "10d" if i < 3 else "01d",
            "description": "light rain" if i < 3 else "clear sky"
        })

    return forecast

def get_real_weather_forecast(lat: float = 12.9716, lon: float = 77.5946, days: int = 7) -> List[Dict[str, Any]]:
    """Get real weather forecast from OpenWeatherMap API"""
    try:
        # Get current weather
        current_url = f"{OPENWEATHER_BASE_URL}/weather"
        current_params = {
            "lat": lat,
            "lon": lon,
            "appid": OPENWEATHER_API_KEY,
            "units": "metric"
        }

        current_response = requests.get(current_url, params=current_params, timeout=10)
        current_response.raise_for_status()
        current_data = current_response.json()

        # Get forecast (OpenWeatherMap free tier gives 5 days, 3-hour intervals)
        forecast_url = f"{OPENWEATHER_BASE_URL}/forecast"
        forecast_params = {
            "lat": lat,
            "lon": lon,
            "appid": OPENWEATHER_API_KEY,
            "units": "metric"
        }

        forecast_response = requests.get(forecast_url, params=forecast_params, timeout=10)
        forecast_response.raise_for_status()
        forecast_data = forecast_response.json()

        # Process forecast data - group by day
        daily_forecasts = {}
        today = datetime.now().date()

        for item in forecast_data.get("list", []):
            dt = datetime.fromtimestamp(item["dt"])
            date_key = dt.date()

            # Only include next 7 days
            if date_key < today or (date_key - today).days >= days:
                continue

            if date_key not in daily_forecasts:
                daily_forecasts[date_key] = {
                    "date": date_key.strftime("%Y-%m-%d"),
                    "temperatures": [],
                    "humidities": [],
                    "precipitations": [],
                    "wind_speeds": [],
                    "conditions": [],
                    "icons": [],
                    "descriptions": []
                }

            daily_forecasts[date_key]["temperatures"].append(item["main"]["temp"])
            daily_forecasts[date_key]["humidities"].append(item["main"]["humidity"])
            daily_forecasts[date_key]["precipitations"].append(item.get("rain", {}).get("3h", 0) or 0)
            daily_forecasts[date_key]["wind_speeds"].append(item["wind"]["speed"])
            daily_forecasts[date_key]["conditions"].append(item["weather"][0]["main"])
            daily_forecasts[date_key]["icons"].append(item["weather"][0]["icon"])
            daily_forecasts[date_key]["descriptions"].append(item["weather"][0]["description"])

        # Calculate daily averages/summaries
        forecast = []
        for date_key in sorted(daily_forecasts.keys()):
            day_data = daily_forecasts[date_key]

            forecast.append({
                "date": day_data["date"],
                "temperature": round(sum(day_data["temperatures"]) / len(day_data["temperatures"]), 1),
                "humidity": round(sum(day_data["humidities"]) / len(day_data["humidities"])),
                "precipitation": round(sum(day_data["precipitations"]), 1),
                "wind_speed": round(sum(day_data["wind_speeds"]) / len(day_data["wind_speeds"]), 1),
                "weather_condition": max(set(day_data["conditions"]), key=day_data["conditions"].count),
                "weather_icon": max(set(day_data["icons"]), key=day_data["icons"].count),
                "description": max(set(day_data["descriptions"]), key=day_data["descriptions"].count)
            })

        return forecast

    except Exception as e:
        logger.warning(f"Failed to get real weather data: {e}. Using mock data.")
        return get_mock_weather_forecast()

def analyze_weather_impact(weather_forecast: List[Dict[str, Any]]) -> WeatherImpact:
    """Analyze weather forecast and provide farming recommendations"""

    # Check if it will rain today
    today_forecast = next((f for f in weather_forecast if f["date"] == datetime.now().strftime("%Y-%m-%d")), None)
    will_rain_today = today_forecast and today_forecast["precipitation"] > 0.5
    rain_probability = today_forecast["precipitation"] * 20 if today_forecast else 0  # Rough probability calculation

    # Analyze temperature trend
    if len(weather_forecast) >= 2:
        temp_change = weather_forecast[1]["temperature"] - weather_forecast[0]["temperature"]
        if temp_change > 2:
            temperature_trend = "rising"
        elif temp_change < -2:
            temperature_trend = "falling"
        else:
            temperature_trend = "stable"
    else:
        temperature_trend = "stable"

    # Generate recommendations
    recommendations = []

    # Watering recommendations
    if will_rain_today:
        recommendations.append(WeatherRecommendation(
            task_type="watering",
            recommendation="Skip watering - rain expected today",
            severity="high",
            reason="Natural rainfall will provide adequate moisture"
        ))
    elif rain_probability > 50:
        recommendations.append(WeatherRecommendation(
            task_type="watering",
            recommendation="Reduce watering - high chance of rain",
            severity="medium",
            reason="Upcoming rain will affect soil moisture levels"
        ))

    # Temperature-based recommendations
    avg_temp = sum(f["temperature"] for f in weather_forecast[:3]) / min(3, len(weather_forecast))
    if avg_temp > 35:
        recommendations.append(WeatherRecommendation(
            task_type="general",
            recommendation="High temperature alert - monitor crops closely",
            severity="high",
            reason="Extreme heat can stress plants and increase water needs"
        ))
    elif avg_temp < 10:
        recommendations.append(WeatherRecommendation(
            task_type="general",
            recommendation="Cold weather precautions needed",
            severity="medium",
            reason="Low temperatures may affect plant growth and increase frost risk"
        ))

    # Wind recommendations
    high_wind_days = [f for f in weather_forecast[:3] if f["wind_speed"] > 15]
    if high_wind_days:
        recommendations.append(WeatherRecommendation(
            task_type="general",
            recommendation="Strong winds expected - secure loose equipment",
            severity="medium",
            reason="High winds can damage crops and farming equipment"
        ))

    return WeatherImpact(
        will_rain_today=will_rain_today,
        rain_probability=min(rain_probability, 100),  # Cap at 100%
        temperature_trend=temperature_trend,
        recommendations=recommendations
    )

@router.get("/forecast", response_model=WeatherForecast)
async def get_weather_forecast(
    lat: float = 12.9716,  # Default to Bangalore coordinates
    lon: float = 77.5946,
    days: int = 7
):
    """Get weather forecast for farming recommendations"""
    try:
        forecast_data = get_real_weather_forecast(lat, lon, days)

        return WeatherForecast(
            location="Bangalore, India",  # You can make this dynamic based on coordinates
            forecasts=[WeatherData(**item) for item in forecast_data]
        )
    except Exception as e:
        logger.error(f"Error getting weather forecast: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve weather forecast")

@router.get("/impact", response_model=WeatherImpact)
async def get_weather_impact(
    lat: float = 12.9716,
    lon: float = 77.5946,
    days: int = 7
):
    """Get weather impact analysis for farming tasks"""
    try:
        forecast_data = get_real_weather_forecast(lat, lon, days)
        impact = analyze_weather_impact(forecast_data)

        return impact
    except Exception as e:
        logger.error(f"Error analyzing weather impact: {e}")
        raise HTTPException(status_code=500, detail="Failed to analyze weather impact")

@router.get("/recommendations")
async def get_weather_recommendations(
    lat: float = 12.9716,
    lon: float = 77.5946
):
    """Get weather-based farming recommendations"""
    try:
        forecast_data = get_real_weather_forecast(lat, lon, 3)  # Next 3 days
        impact = analyze_weather_impact(forecast_data)

        return {
            "recommendations": [rec.dict() for rec in impact.recommendations],
            "weather_summary": {
                "will_rain_today": impact.will_rain_today,
                "rain_probability": impact.rain_probability,
                "temperature_trend": impact.temperature_trend,
                "next_3_days": forecast_data[:3]
            }
        }
    except Exception as e:
        logger.error(f"Error getting weather recommendations: {e}")
        raise HTTPException(status_code=500, detail="Failed to get weather recommendations")