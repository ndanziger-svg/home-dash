// Calendar widget
window.CalendarWidget = {
  init() {
    this.container = document.getElementById('calendar-events');
    this.fetch();
    setInterval(() => this.fetch(), 5 * 60 * 1000); // every 5 min
  },

  async fetch() {
    try {
      const res = await fetch('/api/calendar/events');
      if (res.status === 401) {
        const data = await res.json();
        this.container.innerHTML = `
          <div class="loading">
            <p>Calendar not connected</p>
            <p style="margin-top:12px;opacity:0.6;font-size:14px">
              Visit <a href="${data.authUrl}" style="color:#8ab4f8" target="_blank">the auth page</a> on your Mac to connect Google Calendar
            </p>
          </div>`;
        return;
      }
      if (!res.ok) return;

      const events = await res.json();
      if (!events.length) {
        this.container.innerHTML = '<div class="loading">No upcoming events</div>';
        return;
      }

      this.render(events);
    } catch (err) {
      console.warn('Calendar fetch failed:', err);
    }
  },

  render(events) {
    let html = '';
    let currentDate = '';

    for (const event of events) {
      const start = event.start.dateTime || event.start.date;
      const isAllDay = !event.start.dateTime;
      const date = new Date(start);
      const dateStr = date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

      if (dateStr !== currentDate) {
        currentDate = dateStr;
        html += `<div class="cal-date-header">${dateStr}</div>`;
      }

      const timeStr = isAllDay
        ? 'All day'
        : date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

      html += `
        <div class="cal-event ${isAllDay ? 'cal-event-allday' : ''}">
          <div class="cal-event-time">${timeStr}</div>
          <div class="cal-event-title">${this.escapeHtml(event.summary || 'Untitled')}</div>
        </div>`;
    }

    this.container.innerHTML = html;
  },

  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },
};
