const express = require('express');
const router = express.Router();
const config = require('../config');

let weatherCache = { data: null, timestamp: 0 };
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

router.get('/current', async (req, res) => {
  try {
    if (!config.weather.apiKey) {
      return res.status(503).json({ error: 'Weather API key not configured' });
    }

    const now = Date.now();
    if (weatherCache.data && now - weatherCache.timestamp < CACHE_DURATION) {
      return res.json(weatherCache.data);
    }

    const { lat, lon } = config.weather;
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=imperial&appid=${config.weather.apiKey}`;
    const response = await fetch(url);
    const data = await response.json();

    weatherCache = { data, timestamp: now };
    res.json(data);
  } catch (err) {
    console.error('Weather error:', err.message);
    res.status(500).json({ error: 'Failed to fetch weather' });
  }
});

router.get('/forecast', async (req, res) => {
  try {
    if (!config.weather.apiKey) {
      return res.status(503).json({ error: 'Weather API key not configured' });
    }

    const { lat, lon } = config.weather;
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=imperial&appid=${config.weather.apiKey}`;
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('Forecast error:', err.message);
    res.status(500).json({ error: 'Failed to fetch forecast' });
  }
});

module.exports = router;
