const express = require('express');
const router = express.Router();

let sonosDevices = [];
let discoveryDone = false;

async function discoverSonos() {
  try {
    const { DeviceDiscovery } = require('sonos');
    return new Promise((resolve) => {
      const devices = [];
      const search = DeviceDiscovery({ timeout: 5000 });
      search.on('DeviceAvailable', (device) => {
        devices.push(device);
      });
      search.on('timeout', () => {
        sonosDevices = devices;
        discoveryDone = true;
        resolve(devices);
      });
    });
  } catch (err) {
    console.error('Sonos discovery error:', err.message);
    return [];
  }
}

// Discover on startup
discoverSonos();

router.get('/devices', async (req, res) => {
  try {
    if (!discoveryDone) {
      await discoverSonos();
    }
    const deviceInfo = await Promise.all(
      sonosDevices.map(async (device) => {
        try {
          const desc = await device.deviceDescription();
          const state = await device.getCurrentState();
          const track = await device.currentTrack();
          const volume = await device.getVolume();
          return {
            host: device.host,
            port: device.port,
            name: desc.roomName,
            state,
            track: {
              title: track.title,
              artist: track.artist,
              album: track.album,
              albumArtURI: track.albumArtURI,
              duration: track.duration,
              position: track.position,
            },
            volume,
          };
        } catch {
          return { host: device.host, port: device.port, name: 'Unknown', state: 'unknown' };
        }
      })
    );
    res.json(deviceInfo);
  } catch (err) {
    console.error('Sonos list error:', err.message);
    res.status(500).json({ error: 'Failed to list Sonos devices' });
  }
});

router.post('/rediscover', async (req, res) => {
  discoveryDone = false;
  const devices = await discoverSonos();
  res.json({ found: devices.length });
});

function getDevice(host) {
  return sonosDevices.find(d => d.host === host);
}

router.post('/:host/play', async (req, res) => {
  try {
    const device = getDevice(req.params.host);
    if (!device) return res.status(404).json({ error: 'Device not found' });
    await device.play();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:host/pause', async (req, res) => {
  try {
    const device = getDevice(req.params.host);
    if (!device) return res.status(404).json({ error: 'Device not found' });
    await device.pause();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:host/next', async (req, res) => {
  try {
    const device = getDevice(req.params.host);
    if (!device) return res.status(404).json({ error: 'Device not found' });
    await device.next();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:host/previous', async (req, res) => {
  try {
    const device = getDevice(req.params.host);
    if (!device) return res.status(404).json({ error: 'Device not found' });
    await device.previous();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:host/volume', async (req, res) => {
  try {
    const device = getDevice(req.params.host);
    if (!device) return res.status(404).json({ error: 'Device not found' });
    await device.setVolume(req.body.volume);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
