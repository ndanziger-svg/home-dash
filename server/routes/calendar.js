const express = require('express');
const router = express.Router();
const config = require('../config');
const { getAuthClient, isAuthenticated } = require('../services/googleAuth');

router.get('/events', async (req, res) => {
  try {
    if (!isAuthenticated()) {
      return res.status(401).json({
        error: 'Not authenticated',
        authUrl: `/auth/google`,
      });
    }

    const { google } = require('googleapis');
    const calendar = google.calendar({ version: 'v3', auth: getAuthClient() });

    const now = new Date();
    const threeDaysLater = new Date(now);
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);

    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: now.toISOString(),
      timeMax: threeDaysLater.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 20,
    });

    res.json(response.data.items || []);
  } catch (err) {
    console.error('Calendar error:', err.message);
    res.status(500).json({ error: 'Failed to fetch calendar events' });
  }
});

module.exports = router;
