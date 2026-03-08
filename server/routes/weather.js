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

let weatherCache = { data: null, timestamp: 0 };
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

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
      weatherCode: code,
    };

    weatherCache = { data, timestamp: now };
    res.json(data);
  } catch (err) {
    console.error('Weather error:', err.message);
    res.status(500).json({ error: 'Failed to fetch weather' });
  }
});

let forecastCache = { data: null, timestamp: 0 };

router.get('/forecast', async (req, res) => {
  try {
    const now = Date.now();
    if (forecastCache.data && now - forecastCache.timestamp < CACHE_DURATION) {
      return res.json(forecastCache.data);
    }

    const { lat, lon } = config.weather;
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max&temperature_unit=fahrenheit&timezone=auto&forecast_days=5`;
    const response = await fetch(url);
    const raw = await response.json();

    const days = raw.daily.time.map((date, i) => {
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

    forecastCache = { data: days, timestamp: now };
    res.json(days);
  } catch (err) {
    console.error('Forecast error:', err.message);
    res.status(500).json({ error: 'Failed to fetch forecast' });
  }
});

module.exports = router;
