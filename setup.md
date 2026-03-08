# Home Dashboard - Setup Guide

## 1. Install Node.js (on Mac Mini)

```bash
# Install via Homebrew (recommended)
brew install node

# Or download from https://nodejs.org (LTS version)
```

## 2. Install Dependencies

```bash
cd home-dashboard
npm install
```

## 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your API keys and settings:

### Required: Weather
1. Sign up at https://openweathermap.org/api (free)
2. Get your API key from the dashboard
3. Set `WEATHER_API_KEY`, `WEATHER_LAT`, `WEATHER_LON` in `.env`

### Required: SmartThings (for light control)
1. Go to https://account.smartthings.com/tokens
2. Create a Personal Access Token with device permissions
3. Set `SMARTTHINGS_TOKEN` in `.env`

### Optional: Google Calendar
1. Go to https://console.cloud.google.com
2. Create a new project (or use existing)
3. Enable "Google Calendar API"
4. Create OAuth 2.0 credentials (Web application type)
5. Add `http://localhost:3000/auth/google/callback` as authorized redirect URI
6. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env`

### Optional: Nest Cameras
1. Go to https://console.nest.google.com/device-access
2. Pay $5 one-time fee and create a project
3. Link your Google Cloud OAuth client to the Device Access project
4. Add `https://www.googleapis.com/auth/sdm.service` scope
5. Set `GOOGLE_DEVICE_ACCESS_PROJECT_ID` in `.env`

### Optional: Voice Wake Word (Porcupine)
1. Sign up at https://picovoice.ai
2. Get your access key
3. Set `PICOVOICE_ACCESS_KEY` in `.env`

## 4. Start the Server

```bash
# Development (auto-restart on file changes)
npm run dev

# Production
npm start
```

The dashboard will be available at `http://localhost:3000`

## 5. First-Time Google Auth

If you configured Google Calendar or Nest cameras:
1. Open `http://localhost:3000/auth/google` in a browser on the Mac Mini
2. Sign in with your Google account
3. Grant permissions
4. The tokens are saved automatically

## 6. Set Up on Fire 10 Tablet

### Option A: Fully Kiosk Browser (Recommended)
1. Install "Fully Kiosk Browser" from Amazon Appstore
2. Set the start URL to `http://<mac-mini-ip>:3000`
3. Enable "Fullscreen Mode"
4. Enable "Keep Screen On"
5. Enable "Launch on Boot"

### Option B: Silk Browser
1. Open Silk browser on the Fire tablet
2. Navigate to `http://<mac-mini-ip>:3000`
3. Tap the menu → "Add to Home Screen"
4. Open from home screen for full-screen experience

## 7. Keep Server Running (PM2)

```bash
# Install PM2 globally
npm install -g pm2

# Start the dashboard
pm2 start server/index.js --name home-dashboard

# Auto-start on boot
pm2 startup
pm2 save
```

## Find Your Mac Mini's IP

```bash
ipconfig getifaddr en0
# or
hostname -I
```

## Troubleshooting

- **Weather not showing**: Check your API key in `.env`. Wait up to 2 hours for a new key to activate.
- **Lights not loading**: Verify your SmartThings token has device permissions.
- **Calendar shows "Not authenticated"**: Visit `http://localhost:3000/auth/google` on the Mac Mini.
- **Sonos not found**: Ensure the Mac Mini and Sonos speakers are on the same network/VLAN.
- **Voice not working**: The Silk browser may not fully support Web Speech API. Use the tap-to-talk mic button instead.

## Voice Commands

- "Set a timer for 10 minutes"
- "Search for chicken parmesan recipe"
- "Turn on the living room lights"
- "Turn off all lights"
- "Show my calendar"
- "Go to stocks"
- "Show cameras"
