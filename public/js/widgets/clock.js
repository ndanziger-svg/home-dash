// Clock widget
window.ClockWidget = {
  init() {
    this.timeEl = document.getElementById('clock-time');
    this.dateEl = document.getElementById('clock-date');
    this.update();
    setInterval(() => this.update(), 1000);
  },

  update() {
    const now = new Date();

    // Time
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const h = hours % 12 || 12;
    const m = String(minutes).padStart(2, '0');
    const period = hours >= 12 ? 'PM' : 'AM';
    this.timeEl.textContent = `${h}:${m}`;

    // Date
    const options = { weekday: 'long', month: 'long', day: 'numeric' };
    this.dateEl.textContent = now.toLocaleDateString('en-US', options);
  },
};
