const express = require('express');
const router = express.Router();
const config = require('../config');

// Open-Meteo: free, no API key needed
// WMO Weather Code mapping
const WMO_CODES = {
  0: { desc: 'Clear sky', icon: '☀️' },
  1: { desc: 'Mainly clear', icon: '🌤️' },
  2: { desc: 'Partly cloudy', icon: '⛅' },
  3: { desc: 'Overcast', icon: '☁️' },
  45: { desc: 'Fog', icon: '🌫️' },
  48: { desc: 'Rime fog', icon: '🌫️' },
  51: { desc: 'Light drizzle', icon: '🌦️' },
  53: { desc: 'Drizzle', icon: '🌦️' },
  55: { desc: 'Dense drizzle', icon: '🌧️' },
  61: { desc: 'Light rain', icon: '🌦️' },
  63: { desc: 'Rain', icon: '🌧️' },
  65: { desc: 'Heavy rain', icon: '🌧️' },
  71: { desc: 'Light snow', icon: '🌨️' },
  73: { desc: 'Snow', icon: '❄️' },
  75: { desc: 'Heavy snow', icon: '❄️' },
  77: { desc: 'Snow grains', icon: '❄️' },
  80: { desc: 'Light showers', icon: '🌦️' },
  81: { desc: 'Showers', icon: '🌧️' },
  82: { desc: 'Heavy showers', icon: '🌧️' },
  85: { desc: 'Light snow showers', icon: '🌨️' },
  86: { desc: 'Snow showers', icon: '❄️' },
  95: { desc: 'Thunderstorm', icon: '⛈️' },
  96: { desc: 'Thunderstorm + hail', icon: '⛈️' },
  99: { desc: 'Thunderstorm + heavy hail', icon: '⛈️' },
};

const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

// Reverse geocode lat/lon to city name
let locationCache = null;
async function getLocationName(lat, lon) {
  if (locationCache) return locationCache;
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=_&count=1&latitude=${lat}&longitude=${lon}`;
    // Open-Meteo doesn't have reverse geocode, use Nominatim (free, no key)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
      { headers: { 'User-Agent': 'HomeDashboard/1.0' } }
    );
    const data = await response.json();
    const city = data.address?.city || data.address?.town || data.address?.village || data.address?.county || '';
    const state = data.address?.state || '';
    locationCache = city ? `${city}, ${state}` : `${lat}, ${lon}`;
    return locationCache;
  } catch {
    return `${lat}, ${lon}`;
  }
}

// Combined endpoint: current + hourly (next 4hr) + daily (7 day) + location
let fullCache = { data: null, timestamp: 0 };

router.get('/full', async (req, res) => {
  try {
    const now = Date.now();
    if (fullCache.data && now - fullCache.timestamp < CACHE_DURATION) {
      return res.json(fullCache.data);
    }

    const { lat, lon } = config.weather;
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m` +
      `&hourly=temperature_2m,weather_code,precipitation_probability` +
      `&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max` +
      `&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto&forecast_days=7`;
    const response = await fetch(url);
    const raw = await response.json();

    // Current
    const curCode = raw.current?.weather_code ?? 0;
    const curWmo = WMO_CODES[curCode] || { desc: 'Unknown', icon: '❓' };
    const current = {
      temp: Math.round(raw.current.temperature_2m),
      feelsLike: Math.round(raw.current.apparent_temperature),
      humidity: raw.current.relative_humidity_2m,
      windSpeed: Math.round(raw.current.wind_speed_10m),
      description: curWmo.desc,
      icon: curWmo.icon,
    };

    // Hourly: next 4 hours
    const nowHour = new Date().getHours();
    const nowISO = new Date().toISOString().slice(0, 13);
    const hourlyTimes = raw.hourly.time;
    const startIdx = hourlyTimes.findIndex(t => t >= nowISO);
    const hourly = [];
    for (let i = startIdx; i < Math.min(startIdx + 5, hourlyTimes.length); i++) {
      if (i < 0) continue;
      const code = raw.hourly.weather_code[i];
      const wmo = WMO_CODES[code] || { desc: 'Unknown', icon: '❓' };
      hourly.push({
        time: hourlyTimes[i],
        temp: Math.round(raw.hourly.temperature_2m[i]),
        icon: wmo.icon,
        description: wmo.desc,
        precipChance: raw.hourly.precipitation_probability[i],
      });
    }

    // Daily: 7 days
    const daily = raw.daily.time.map((date, i) => {
      const code = raw.daily.weather_code[i];
      const wmo = WMO_CODES[code] || { desc: 'Unknown', icon: '❓' };
      return {
        date,
        high: Math.round(raw.daily.temperature_2m_max[i]),
        low: Math.round(raw.daily.temperature_2m_min[i]),
        description: wmo.desc,
        icon: wmo.icon,
        precipChance: raw.daily.precipitation_probability_max[i],
      };
    });

    // Location
    const location = await getLocationName(lat, lon);

    const data = { current, hourly, daily, location };
    fullCache = { data, timestamp: now };
    res.json(data);
  } catch (err) {
    console.error('Weather full error:', err.message);
    res.status(500).json({ error: 'Failed to fetch weather' });
  }
});

// Keep the simple endpoints as fallbacks
let weatherCache = { data: null, timestamp: 0 };
router.get('/current', async (req, res) => {
  try {
    const now = Date.now();
    if (weatherCache.data && now - weatherCache.timestamp < CACHE_DURATION) {
      return res.json(weatherCache.data);
    }
    const { lat, lon } = config.weather;
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto`;
    const response = await fetch(url);
    const raw = await response.json();
    const code = raw.current?.weather_code ?? 0;
    const wmo = WMO_CODES[code] || { desc: 'Unknown', icon: '❓' };
    const data = {
      temp: Math.round(raw.current.temperature_2m),
      feelsLike: Math.round(raw.current.apparent_temperature),
      humidity: raw.current.relative_humidity_2m,
      windSpeed: Math.round(raw.current.wind_speed_10m),
      description: wmo.desc,
      icon: wmo.icon,
    };
    weatherCache = { data, timestamp: now };
    res.json(data);
  } catch (err) {
    console.error('Weather error:', err.message);
    res.status(500).json({ error: 'Failed to fetch weather' });
  }
});

module.exports = router;
