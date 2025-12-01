// src/services/weatherApi.ts

const API_BASE_URL = 'http://localhost:8000';

export interface WeatherData {
  date: string;
  temperature: number;
  humidity: number;
  precipitation: number;
  wind_speed: number;
  weather_condition: string;
  weather_icon: string;
  description: string;
}

export interface WeatherForecast {
  location: string;
  forecasts: WeatherData[];
}

export interface WeatherRecommendation {
  task_type: string;
  recommendation: string;
  severity: string;
  reason: string;
}

export interface WeatherImpact {
  will_rain_today: boolean;
  rain_probability: number;
  temperature_trend: string;
  recommendations: WeatherRecommendation[];
}

/**
 * Get weather forecast for farming recommendations
 */
export async function getWeatherForecast(
  lat: number = 12.9716,
  lon: number = 77.5946,
  days: number = 7
): Promise<WeatherForecast> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/weather/forecast?lat=${lat}&lon=${lon}&days=${days}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.detail ||
        `HTTP error! status: ${response.status}`
      );
    }

    const result: WeatherForecast = await response.json();
    return result;
  } catch (error) {
    console.error('Error fetching weather forecast:', error);
    throw error;
  }
}

/**
 * Get weather impact analysis for farming tasks
 */
export async function getWeatherImpact(
  lat: number = 12.9716,
  lon: number = 77.5946,
  days: number = 7
): Promise<WeatherImpact> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/weather/impact?lat=${lat}&lon=${lon}&days=${days}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.detail ||
        `HTTP error! status: ${response.status}`
      );
    }

    const result: WeatherImpact = await response.json();
    return result;
  } catch (error) {
    console.error('Error fetching weather impact:', error);
    throw error;
  }
}

/**
 * Get weather-based farming recommendations
 */
export async function getWeatherRecommendations(
  lat: number = 12.9716,
  lon: number = 77.5946
): Promise<{
  recommendations: WeatherRecommendation[];
  weather_summary: {
    will_rain_today: boolean;
    rain_probability: number;
    temperature_trend: string;
    next_3_days: WeatherData[];
  };
}> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/weather/recommendations?lat=${lat}&lon=${lon}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.detail ||
        `HTTP error! status: ${response.status}`
      );
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error fetching weather recommendations:', error);
    throw error;
  }
}

/**
 * Get weather icon URL from OpenWeatherMap
 */
export function getWeatherIconUrl(iconCode: string, size: '2x' | '4x' = '2x'): string {
  return `https://openweathermap.org/img/wn/${iconCode}@${size}.png`;
}

/**
 * Format weather condition for display
 */
export function formatWeatherCondition(condition: string): string {
  const conditionMap: Record<string, string> = {
    'Clear': 'Sunny',
    'Clouds': 'Cloudy',
    'Rain': 'Rainy',
    'Drizzle': 'Light Rain',
    'Thunderstorm': 'Stormy',
    'Snow': 'Snowy',
    'Mist': 'Misty',
    'Fog': 'Foggy',
    'Haze': 'Hazy'
  };

  return conditionMap[condition] || condition;
}

/**
 * Get weather-based task adjustment suggestions
 */
export function getWeatherTaskAdjustments(weatherImpact: WeatherImpact): string[] {
  const adjustments: string[] = [];

  if (weatherImpact.will_rain_today) {
    adjustments.push("🌧️ Skip watering tasks - natural rainfall expected");
  } else if (weatherImpact.rain_probability > 50) {
    adjustments.push("🌦️ Reduce watering - high chance of rain upcoming");
  }

  if (weatherImpact.temperature_trend === 'rising') {
    adjustments.push("🌡️ Increase watering frequency - temperatures rising");
  } else if (weatherImpact.temperature_trend === 'falling') {
    adjustments.push("❄️ Monitor for frost - temperatures dropping");
  }

  return adjustments;
}