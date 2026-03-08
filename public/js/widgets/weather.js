// Weather widget
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

      if (data.main && data.weather) {
        this.tempEl.textContent = `${Math.round(data.main.temp)}°F`;
        this.descEl.textContent = data.weather[0].description;
        this.iconEl.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
        this.iconEl.alt = data.weather[0].description;
      }
    } catch (err) {
      console.warn('Weather fetch failed:', err);
    }
  },
};
