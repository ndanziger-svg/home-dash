// Timer widget
window.TimersWidget = {
  timers: [],
  nextId: 1,
  audioCtx: null,

  init() {
    this.container = document.getElementById('active-timers');
    this.overlay = document.getElementById('timer-overlay');

    // Preset buttons
    document.querySelectorAll('.timer-preset').forEach(btn => {
      btn.addEventListener('click', () => {
        this.addTimer(parseInt(btn.dataset.minutes));
      });
    });

    // Custom timer
    document.getElementById('timer-custom-btn').addEventListener('click', () => {
      const input = document.getElementById('timer-custom-input');
      const minutes = parseInt(input.value);
      if (minutes > 0) {
        this.addTimer(minutes);
        input.value = '';
      }
    });

    // Update every second
    setInterval(() => this.tick(), 1000);
  },

  addTimer(minutes, label) {
    const timer = {
      id: this.nextId++,
      label: label || `${minutes} min timer`,
      endTime: Date.now() + minutes * 60 * 1000,
      alarming: false,
      dismissed: false,
    };
    this.timers.push(timer);
    this.render();
    this.renderOverlay();
  },

  tick() {
    const now = Date.now();
    let needsRender = false;

    for (const timer of this.timers) {
      if (!timer.alarming && !timer.dismissed && now >= timer.endTime) {
        timer.alarming = true;
        this.playAlarm();
        needsRender = true;
      }
    }

    if (this.timers.length > 0) {
      this.render();
      this.renderOverlay();
    }
  },

  dismiss(id) {
    this.timers = this.timers.filter(t => t.id !== id);
    this.stopAlarm();
    this.render();
    this.renderOverlay();
  },

  formatRemaining(endTime) {
    const diff = Math.max(0, endTime - Date.now());
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);

    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  },

  render() {
    if (!this.timers.length) {
      this.container.innerHTML = '<div class="loading" style="padding:20px">No active timers</div>';
      return;
    }

    this.container.innerHTML = this.timers.map(timer => `
      <div class="timer-card ${timer.alarming ? 'alarming' : ''}">
        <div>
          <div class="timer-remaining">${timer.alarming ? "Time's up!" : this.formatRemaining(timer.endTime)}</div>
          <div class="timer-label">${this.escapeHtml(timer.label)}</div>
        </div>
        <button class="timer-dismiss" onclick="TimersWidget.dismiss(${timer.id})">
          ${timer.alarming ? 'Dismiss' : 'Cancel'}
        </button>
      </div>
    `).join('');
  },

  renderOverlay() {
    if (!this.timers.length) {
      this.overlay.classList.add('hidden');
      return;
    }

    this.overlay.classList.remove('hidden');
    this.overlay.innerHTML = this.timers.map(timer => `
      <div class="timer-overlay-item ${timer.alarming ? 'alarming' : ''}">
        <span class="timer-overlay-icon">&#x23F2;</span>
        <span>${timer.alarming ? "Time's up!" : this.formatRemaining(timer.endTime)}</span>
      </div>
    `).join('');
  },

  playAlarm() {
    try {
      if (!this.audioCtx) {
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      this._playAlarmTone();
    } catch (err) {
      console.warn('Audio alarm failed:', err);
    }
  },

  _playAlarmTone() {
    if (!this.timers.some(t => t.alarming)) return;

    const ctx = this.audioCtx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.frequency.value = 880;
    osc.type = 'sine';
    gain.gain.value = 0.3;

    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.stop(ctx.currentTime + 0.5);

    // Repeat if still alarming
    setTimeout(() => this._playAlarmTone(), 1000);
  },

  stopAlarm() {
    // Alarm stops when no timers are alarming
  },

  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },
};
