const express = require('express');
const router = express.Router();
const config = require('../config');

const ST_API = 'https://api.smartthings.com/v1';

async function stFetch(path) {
  const response = await fetch(`${ST_API}${path}`, {
    headers: {
      Authorization: `Bearer ${config.smartthings.token}`,
      'Content-Type': 'application/json',
    },
  });
  const data = await response.json();
  if (!response.ok) {
    console.error(`SmartThings API ${response.status}:`, JSON.stringify(data));
    throw new Error(data.message || data.error || `SmartThings API returned ${response.status}`);
  }
  return data;
}

async function stPost(path, body) {
  const response = await fetch(`${ST_API}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.smartthings.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) {
    console.error(`SmartThings POST ${response.status}:`, JSON.stringify(data));
    throw new Error(data.message || data.error || `SmartThings API returned ${response.status}`);
  }
  return data;
}

// List all devices (filtered to lights/switches)
router.get('/devices', async (req, res) => {
  try {
    if (!config.smartthings.token) {
      return res.status(503).json({ error: 'SmartThings token not configured' });
    }
    const data = await stFetch('/devices');
    if (!data.items || !Array.isArray(data.items)) {
      console.error('SmartThings unexpected response:', JSON.stringify(data).substring(0, 500));
      return res.status(502).json({ error: 'Unexpected response from SmartThings API' });
    }
    const lights = data.items.filter(d =>
      d.components?.some(c =>
        c.capabilities?.some(cap =>
          ['switch', 'switchLevel', 'colorControl', 'colorTemperature'].includes(cap.id)
        )
      )
    );
    res.json(lights);
  } catch (err) {
    console.error('SmartThings error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Get device status
router.get('/devices/:id/status', async (req, res) => {
  try {
    const data = await stFetch(`/devices/${req.params.id}/status`);
    res.json(data);
  } catch (err) {
    console.error('SmartThings status error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Execute command on device
router.post('/devices/:id/commands', async (req, res) => {
  try {
    const data = await stPost(`/devices/${req.params.id}/commands`, req.body);
    res.json(data);
  } catch (err) {
    console.error('SmartThings command error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
