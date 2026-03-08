const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const config = require('../config');
const fs = require('fs');
const path = require('path');

const TOKEN_PATH = path.join(__dirname, '..', '..', '.google-tokens.json');

let oauth2Client = null;

function getOAuth2Client() {
  if (!oauth2Client && config.google.clientId) {
    oauth2Client = new google.auth.OAuth2(
      config.google.clientId,
      config.google.clientSecret,
      config.google.redirectUri
    );

    // Load saved tokens if they exist
    if (fs.existsSync(TOKEN_PATH)) {
      const tokens = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
      oauth2Client.setCredentials(tokens);
    }
  }
  return oauth2Client;
}

function isAuthenticated() {
  const client = getOAuth2Client();
  return client && client.credentials && client.credentials.access_token;
}

function getAuthClient() {
  return getOAuth2Client();
}

// Initiate OAuth flow
router.get('/google', (req, res) => {
  const client = getOAuth2Client();
  if (!client) {
    return res.status(503).send('Google OAuth not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env');
  }

  const scopes = [
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/sdm.service',
  ];

  const url = client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent',
  });

  res.redirect(url);
});

// OAuth callback
router.get('/google/callback', async (req, res) => {
  try {
    const { code } = req.query;
    const client = getOAuth2Client();
    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);

    // Save tokens for persistence
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));

    res.send('<h1>Authenticated!</h1><p>You can close this tab and return to the dashboard.</p><script>setTimeout(()=>window.close(),3000)</script>');
  } catch (err) {
    console.error('OAuth callback error:', err.message);
    res.status(500).send('Authentication failed: ' + err.message);
  }
});

router.get('/google/status', (req, res) => {
  res.json({ authenticated: isAuthenticated() });
});

module.exports = router;
module.exports.getAuthClient = getAuthClient;
module.exports.isAuthenticated = isAuthenticated;
