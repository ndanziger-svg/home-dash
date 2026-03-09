// Weather widget - uses Open-Meteo (free, no API key)
// Shows current conditions, 4-hour hourly forecast, 7-day daily forecast, and location
window.WeatherWidget = {
  init() {
    this.emojiEl = document.getElementById('weather-emoji');
    this.tempEl = document.getElementById('weather-temp');
    this.descEl = document.getElementById('weather-desc');
    this.detailsEl = document.getElementById('weather-details');
    this.locationEl = document.getElementById('weather-location');
    this.hourlyEl = document.getElementById('hourly-items');
    this.dailyEl = document.getElementById('daily-items');
    this.fetch();
    setInterval(() => this.fetch(), 10 * 60 * 1000); // every 10 min
  },

  async fetch() {
    try {
      const res = await fetch('/api/weather/full');
      if (!res.ok) return;
      const data = await res.json();

      // Current weather
      this.emojiEl.textContent = data.current.icon;
      this.tempEl.textContent = `${data.current.temp}°F`;
      this.descEl.textContent = data.current.description;
      this.detailsEl.textContent = `Feels ${data.current.feelsLike}° · Wind ${data.current.windSpeed} mph · ${data.current.humidity}% humidity`;
      this.locationEl.textContent = data.location;

      // Hourly forecast (next 4-5 hours)
      this.renderHourly(data.hourly);

      // Daily forecast (7 days)
      this.renderDaily(data.daily);
    } catch (err) {
      console.warn('Weather fetch failed:', err);
    }
  },

  renderHourly(hourly) {
    if (!hourly || !hourly.length) return;
    this.hourlyEl.innerHTML = hourly.map((h, i) => {
      const date = new Date(h.time);
      const label = i === 0 ? 'Now' : date.toLocaleTimeString('en-US', { hour: 'numeric' });
      return `
        <div class="hourly-item ${i === 0 ? 'now' : ''}">
          <div class="hourly-time">${label}</div>
          <div class="hourly-icon">${h.icon}</div>
          <div class="hourly-temp">${h.temp}°</div>
          ${h.precipChance > 0 ? `<div class="hourly-precip">${h.precipChance}%</div>` : ''}
        </div>`;
    }).join('');
  },

  renderDaily(daily) {
    if (!daily || !daily.length) return;
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    this.dailyEl.innerHTML = daily.map((d, i) => {
      const date = new Date(d.date + 'T12:00:00');
      const label = i === 0 ? 'Today' : days[date.getDay()];
      return `
        <div class="daily-item ${i === 0 ? 'today' : ''}">
          <div class="daily-day">${label}</div>
          <div class="daily-icon">${d.icon}</div>
          <div class="daily-temps">
            <span class="daily-high">${d.high}°</span>
            <span class="daily-low">${d.low}°</span>
          </div>
          ${d.precipChance > 0 ? `<div class="daily-precip">${d.precipChance}%</div>` : ''}
        </div>`;
    }).join('');
  },
};
