// Main dashboard app
window.App = {
  currentPanel: 0,
  totalPanels: 7,
  ambientIndex: 0,

  init() {
    this.panelsEl = document.getElementById('panels');
    this.navDots = document.querySelectorAll('.nav-dot');

    // Initialize swipe navigation
    SwipeHandler.init(document.getElementById('dashboard'), {
      onSwipe: (dir) => {
        if (dir === 'left' && this.currentPanel < this.totalPanels - 1) {
          this.goToPanel(this.currentPanel + 1);
        } else if (dir === 'right' && this.currentPanel > 0) {
          this.goToPanel(this.currentPanel - 1);
        }
      },
    });

    // Nav dot clicks
    this.navDots.forEach(dot => {
      dot.addEventListener('click', () => {
        this.goToPanel(parseInt(dot.dataset.index));
      });
    });

    // Keyboard navigation (for testing on desktop)
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') this.goToPanel(Math.max(0, this.currentPanel - 1));
      if (e.key === 'ArrowRight') this.goToPanel(Math.min(this.totalPanels - 1, this.currentPanel + 1));
    });

    // Initialize all widgets
    ClockWidget.init();
    WeatherWidget.init();
    CalendarWidget.init();
    StocksWidget.init();
    LightsWidget.init();
    SonosWidget.init();
    CamerasWidget.init();
    TimersWidget.init();
    RecipesWidget.init();
    VoiceSystem.init();

    // Ambient background rotation
    this.rotateBackground();
    setInterval(() => this.rotateBackground(), 30000);

    // Auto-dim
    this.checkAutoDim();
    setInterval(() => this.checkAutoDim(), 60000);

    // Prevent screen from sleeping (when supported)
    this.requestWakeLock();

    console.log('Home Dashboard initialized');
  },

  goToPanel(index) {
    this.currentPanel = index;
    this.panelsEl.style.transform = `translateX(-${index * 100}%)`;

    // Update nav dots
    this.navDots.forEach((dot, i) => {
      dot.classList.toggle('active', i === index);
    });
  },

  rotateBackground() {
    const bg = document.getElementById('ambient-bg');
    this.ambientIndex = (this.ambientIndex % 5) + 1;
    bg.className = `ambient-bg gradient-${this.ambientIndex}`;
  },

  checkAutoDim() {
    const hour = new Date().getHours();
    const dimOverlay = document.getElementById('dim-overlay');
    // Dim between 10 PM and 6 AM
    if (hour >= 22 || hour < 6) {
      dimOverlay.classList.add('dimmed');
    } else {
      dimOverlay.classList.remove('dimmed');
    }
  },

  async requestWakeLock() {
    try {
      if ('wakeLock' in navigator) {
        await navigator.wakeLock.request('screen');
      }
    } catch { /* not supported or denied */ }
  },

  showFeedback(message) {
    const overlay = document.getElementById('voice-overlay');
    const text = document.getElementById('voice-text');
    text.textContent = message;
    overlay.classList.remove('hidden');

    // Hide the pulse rings during feedback
    overlay.querySelector('.voice-indicator').style.display = 'none';

    setTimeout(() => {
      overlay.classList.add('hidden');
      overlay.querySelector('.voice-indicator').style.display = '';
    }, 2000);
  },
};

// Start when DOM is ready
document.addEventListener('DOMContentLoaded', () => App.init());
