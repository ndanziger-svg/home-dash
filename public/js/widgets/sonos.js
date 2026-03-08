// Sonos music controls widget
window.SonosWidget = {
  devices: [],

  init() {
    this.container = document.getElementById('sonos-controls');
    this.fetch();
    setInterval(() => this.fetch(), 10 * 1000); // refresh every 10s
  },

  async fetch() {
    try {
      const res = await fetch('/api/sonos/devices');
      if (!res.ok) return;
      this.devices = await res.json();
      this.render();
    } catch (err) {
      console.warn('Sonos fetch failed:', err);
    }
  },

  render() {
    if (!this.devices.length) {
      this.container.innerHTML = '<div class="loading">No Sonos speakers found</div>';
      return;
    }

    this.container.innerHTML = this.devices.map(device => {
      const isPlaying = device.state === 'playing';
      const hasTrack = device.track && device.track.title;

      return `
        <div class="sonos-player" data-host="${device.host}">
          <div class="sonos-room">${this.escapeHtml(device.name)}</div>
          ${hasTrack ? `
            <div class="sonos-track">
              ${device.track.albumArtURI ? `<img class="sonos-album-art" src="${device.track.albumArtURI}" alt="">` : '<div class="sonos-album-art"></div>'}
              <div class="sonos-track-info">
                <div class="sonos-track-title">${this.escapeHtml(device.track.title)}</div>
                <div class="sonos-track-artist">${this.escapeHtml(device.track.artist || '')}</div>
              </div>
            </div>
          ` : '<div class="sonos-track"><div class="sonos-track-info"><div class="sonos-track-title" style="opacity:0.4">Nothing playing</div></div></div>'}
          <div class="sonos-buttons">
            <button class="sonos-btn" onclick="SonosWidget.command('${device.host}','previous')">&#x23EE;</button>
            <button class="sonos-btn play-pause" onclick="SonosWidget.command('${device.host}','${isPlaying ? 'pause' : 'play'}')">
              ${isPlaying ? '&#x23F8;' : '&#x25B6;'}
            </button>
            <button class="sonos-btn" onclick="SonosWidget.command('${device.host}','next')">&#x23ED;</button>
          </div>
          <div class="sonos-volume">
            <span class="sonos-volume-label">&#x1F509;</span>
            <input type="range" class="sonos-volume-slider no-swipe" min="0" max="100"
                   value="${device.volume || 0}"
                   onchange="SonosWidget.setVolume('${device.host}', this.value)">
            <span class="sonos-volume-label">${device.volume || 0}%</span>
          </div>
        </div>`;
    }).join('');
  },

  async command(host, cmd) {
    try {
      await fetch(`/api/sonos/${host}/${cmd}`, { method: 'POST' });
      setTimeout(() => this.fetch(), 500);
    } catch (err) {
      console.warn(`Sonos ${cmd} failed:`, err);
    }
  },

  async setVolume(host, volume) {
    try {
      await fetch(`/api/sonos/${host}/volume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ volume: parseInt(volume) }),
      });
    } catch (err) {
      console.warn('Sonos volume failed:', err);
    }
  },

  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },
};
