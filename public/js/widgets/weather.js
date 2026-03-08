// Weather widget - uses Open-Meteo (free, no API key)
window.WeatherWidget = {
  init() {
    this.iconEl = document.getElementById('weather-icon');
    this.tempEl = document.getElementById('weather-temp');
    this.descEl = document.getElementById('weather-desc');
    this.fetch();
    setInterval(() => this.fetch(), 10 * 60 * 1000); // every 10 min
  },

  async fetch() {
    try {
      const res = await fetch('/api/weather/current');
      if (!res.ok) return;
      const data = await res.json();

      this.tempEl.textContent = `${data.temp}°F`;
      this.descEl.textContent = data.description;

      // Use emoji icon instead of image
      this.iconEl.style.display = 'none';
      if (!this.emojiEl) {
        this.emojiEl = document.createElement('span');
        this.emojiEl.className = 'weather-emoji';
        this.emojiEl.style.fontSize = '36px';
        this.iconEl.parentNode.insertBefore(this.emojiEl, this.iconEl);
      }
      this.emojiEl.textContent = data.icon;
    } catch (err) {
      console.warn('Weather fetch failed:', err);
    }
  },
};
