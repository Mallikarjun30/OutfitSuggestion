# weather_client.py
import os
import requests
from datetime import datetime
from typing import Optional, Dict, Any
from dotenv import load_dotenv

load_dotenv()

class WeatherClient:
    def __init__(self):
        self.api_key = os.getenv("OPENWEATHER_API_KEY")
        if not self.api_key:
            raise ValueError("OPENWEATHER_API_KEY not found in environment variables")

    def current_by_city(self, city: str, units: str = "metric") -> Optional[Dict[str, Any]]:
        url = "https://api.openweathermap.org/data/2.5/weather"
        params = {"q": city, "appid": self.api_key, "units": units}
        r = requests.get(url, params=params, timeout=15)
        if not r.ok:
            return None
        return r.json()

    def current_by_coords(self, lat: float, lon: float, units: str = "metric") -> Optional[Dict[str, Any]]:
        url = "https://api.openweathermap.org/data/2.5/weather"
        params = {"lat": lat, "lon": lon, "appid": self.api_key, "units": units}
        r = requests.get(url, params=params, timeout=15)
        if not r.ok:
            return None
        return r.json()

def infer_season(date: datetime, hemisphere: str = "north") -> str:
    """
    Very simple month-based season inference.
    """
    m = date.month
    if hemisphere.lower().startswith("n"):
        if m in (12, 1, 2): return "winter"
        if m in (3, 4, 5):  return "spring"
        if m in (6, 7, 8):  return "summer"
        return "autumn"
    else:
        # southern hemisphere inverted
        if m in (12, 1, 2): return "summer"
        if m in (3, 4, 5):  return "autumn"
        if m in (6, 7, 8):  return "winter"
        return "spring"
