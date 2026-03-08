require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  weather: {
    apiKey: process.env.WEATHER_API_KEY,
    lat: process.env.WEATHER_LAT || '40.7128',
    lon: process.env.WEATHER_LON || '-74.0060',
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/google/callback',
    deviceAccessProjectId: process.env.GOOGLE_DEVICE_ACCESS_PROJECT_ID,
  },
  smartthings: {
    token: process.env.SMARTTHINGS_TOKEN,
  },
  picovoice: {
    accessKey: process.env.PICOVOICE_ACCESS_KEY,
  },
};
