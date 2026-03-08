const express = require('express');
const path = require('path');
const cors = require('cors');
const config = require('./config');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// API routes
app.use('/api/weather', require('./routes/weather'));
app.use('/api/calendar', require('./routes/calendar'));
app.use('/api/stocks', require('./routes/stocks'));
app.use('/api/smartthings', require('./routes/smartthings'));
app.use('/api/sonos', require('./routes/sonos'));
app.use('/api/cameras', require('./routes/cameras'));
app.use('/api/recipes', require('./routes/recipes'));

// Google OAuth callback
app.use('/auth', require('./services/googleAuth'));

// Config endpoint (safe subset for frontend)
app.get('/api/config', (req, res) => {
  res.json({
    picovoiceAccessKey: config.picovoice.accessKey || null,
    hasWeatherKey: !!config.weather.apiKey,
    hasSmartThings: !!config.smartthings.token,
    hasGoogleAuth: !!config.google.clientId,
  });
});

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.listen(config.port, '0.0.0.0', () => {
  console.log(`Home Dashboard running at http://localhost:${config.port}`);
  console.log(`Access from tablet: http://<your-ip>:${config.port}`);
});
