// SmartThings lights widget
window.LightsWidget = {
  devices: [],

  init() {
    this.container = document.getElementById('lights-list');
    this.fetch();
    setInterval(() => this.fetch(), 15 * 1000); // refresh every 15s
  },

  async fetch() {
    try {
      const res = await fetch('/api/smartthings/devices');
      if (res.status === 503) {
        this.container.innerHTML = '<div class="loading">SmartThings not configured</div>';
        return;
      }
      if (!res.ok) return;

      this.devices = await res.json();
      await this.fetchStatuses();
      this.render();
    } catch (err) {
      console.warn('Lights fetch failed:', err);
    }
  },

  async fetchStatuses() {
    const statusPromises = this.devices.map(async (device) => {
      try {
        const res = await fetch(`/api/smartthings/devices/${device.deviceId}/status`);
        if (res.ok) {
          device._status = await res.json();
        }
      } catch { /* ignore */ }
    });
    await Promise.allSettled(statusPromises);
  },

  render() {
    if (!this.devices.length) {
      this.container.innerHTML = '<div class="loading">No lights found</div>';
      return;
    }

    this.container.innerHTML = this.devices.map(device => {
      const switchStatus = device._status?.components?.main?.switch?.switch?.value;
      const isOn = switchStatus === 'on';
      const level = device._status?.components?.main?.switchLevel?.level?.value;

      return `
        <div class="light-card ${isOn ? 'on' : ''}" data-device-id="${device.deviceId}">
          <div>
            <div class="light-name">${this.escapeHtml(device.label || device.name)}</div>
          </div>
          <button class="light-toggle ${isOn ? 'on' : ''}"
                  onclick="LightsWidget.toggle('${device.deviceId}', ${isOn})"></button>
        </div>
        ${level !== undefined ? `
          <input type="range" class="light-brightness" min="0" max="100" value="${level}"
                 onchange="LightsWidget.setBrightness('${device.deviceId}', this.value)">
        ` : ''}`;
    }).join('');
  },

  async toggle(deviceId, currentlyOn) {
    try {
      await fetch(`/api/smartthings/devices/${deviceId}/commands`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commands: [{
            component: 'main',
            capability: 'switch',
            command: currentlyOn ? 'off' : 'on',
          }],
        }),
      });
      // Quick re-fetch
      setTimeout(() => this.fetch(), 500);
    } catch (err) {
      console.warn('Toggle failed:', err);
    }
  },

  async setBrightness(deviceId, level) {
    try {
      await fetch(`/api/smartthings/devices/${deviceId}/commands`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commands: [{
            component: 'main',
            capability: 'switchLevel',
            command: 'setLevel',
            arguments: [parseInt(level)],
          }],
        }),
      });
    } catch (err) {
      console.warn('Brightness set failed:', err);
    }
  },

  // Called by voice commands
  async turnOnAll() {
    for (const device of this.devices) {
      await this.toggle(device.deviceId, false);
    }
  },

  async turnOffAll() {
    for (const device of this.devices) {
      await this.toggle(device.deviceId, true);
    }
  },

  async controlByName(name, action) {
    const device = this.devices.find(d =>
      (d.label || d.name).toLowerCase().includes(name.toLowerCase())
    );
    if (device) {
      const isOn = device._status?.components?.main?.switch?.switch?.value === 'on';
      if (action === 'on' && !isOn) await this.toggle(device.deviceId, false);
      if (action === 'off' && isOn) await this.toggle(device.deviceId, true);
      return true;
    }
    return false;
  },

  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },
};
