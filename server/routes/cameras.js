const express = require('express');
const router = express.Router();
const config = require('../config');
const { getAuthClient, isAuthenticated } = require('../services/googleAuth');

const SDM_API = 'https://smartdevicemanagement.googleapis.com/v1';

router.get('/devices', async (req, res) => {
  try {
    if (!config.google.deviceAccessProjectId) {
      return res.status(503).json({ error: 'Device Access not configured' });
    }
    if (!isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated', authUrl: '/auth/google' });
    }

    const auth = getAuthClient();
    const url = `${SDM_API}/enterprises/${config.google.deviceAccessProjectId}/devices`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${(await auth.getAccessToken()).token}` },
    });
    const data = await response.json();

    const cameras = (data.devices || []).filter(d =>
      d.type.includes('CAMERA') || d.type.includes('DOORBELL')
    );
    res.json(cameras);
  } catch (err) {
    console.error('Camera list error:', err.message);
    res.status(500).json({ error: 'Failed to list cameras' });
  }
});

router.post('/:deviceId/stream', async (req, res) => {
  try {
    if (!isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const auth = getAuthClient();
    const deviceName = `enterprises/${config.google.deviceAccessProjectId}/devices/${req.params.deviceId}`;
    const url = `${SDM_API}/${deviceName}:executeCommand`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${(await auth.getAccessToken()).token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        command: 'sdm.devices.commands.CameraLiveStream.GenerateRtspStream',
      }),
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('Camera stream error:', err.message);
    res.status(500).json({ error: 'Failed to start stream' });
  }
});

module.exports = router;
