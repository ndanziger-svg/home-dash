// Camera feed widget
window.CamerasWidget = {
  init() {
    this.container = document.getElementById('camera-feeds');
    this.fetch();
  },

  async fetch() {
    try {
      const res = await fetch('/api/cameras/devices');
      if (res.status === 503) {
        this.container.innerHTML = '<div class="loading">Nest cameras not configured.<br><span style="opacity:0.5;font-size:14px">Set up Google Device Access to view camera feeds.</span></div>';
        return;
      }
      if (res.status === 401) {
        const data = await res.json();
        this.container.innerHTML = `<div class="loading">Not authenticated.<br><a href="${data.authUrl}" style="color:#8ab4f8" target="_blank">Connect Google account</a></div>`;
        return;
      }
      if (!res.ok) return;

      const cameras = await res.json();
      this.render(cameras);
    } catch (err) {
      console.warn('Cameras fetch failed:', err);
    }
  },

  render(cameras) {
    if (!cameras.length) {
      this.container.innerHTML = '<div class="loading">No cameras found</div>';
      return;
    }

    this.container.innerHTML = cameras.map(cam => {
      const name = cam.traits?.['sdm.devices.traits.Info']?.customName
        || cam.parentRelations?.[0]?.displayName
        || 'Camera';
      const deviceId = cam.name.split('/').pop();

      return `
        <div class="camera-feed" data-device-id="${deviceId}">
          <div class="loading" style="display:flex;align-items:center;justify-content:center;height:100%">
            <span>Tap to load stream</span>
          </div>
          <div class="camera-label">${this.escapeHtml(name)}</div>
        </div>`;
    }).join('');

    // Click to load stream
    this.container.querySelectorAll('.camera-feed').forEach(el => {
      el.addEventListener('click', () => this.loadStream(el));
    });
  },

  async loadStream(el) {
    const deviceId = el.dataset.deviceId;
    try {
      el.querySelector('.loading').textContent = 'Loading stream...';
      const res = await fetch(`/api/cameras/${deviceId}/stream`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to start stream');
      const data = await res.json();

      if (data.results?.streamUrls?.rtspUrl) {
        // For RTSP, we'd need a WebRTC bridge or HLS transcoder
        el.querySelector('.loading').innerHTML = `
          <span style="font-size:13px;opacity:0.6">RTSP stream available.<br>
          Use go2rtc or similar bridge for browser playback.</span>`;
      }
    } catch (err) {
      el.querySelector('.loading').textContent = 'Failed to load stream';
      console.warn('Stream load failed:', err);
    }
  },

  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },
};
