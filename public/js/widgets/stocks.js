// Stocks widget with intraday sparkline charts
window.StocksWidget = {
  init() {
    this.container = document.getElementById('stocks-list');
    this.fetch();
    setInterval(() => this.fetch(), 60 * 1000); // every 1 min
  },

  async fetch() {
    try {
      const res = await fetch('/api/stocks');
      if (!res.ok) return;
      const stocks = await res.json();
      this.render(stocks);
    } catch (err) {
      console.warn('Stocks fetch failed:', err);
    }
  },

  buildSparkline(chart, change, width = 240, height = 60) {
    if (!chart || chart.length < 2) return '';

    const prices = chart.map(p => p.p);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1;

    const points = prices.map((p, i) => {
      const x = (i / (prices.length - 1)) * width;
      const y = height - ((p - min) / range) * (height - 4) - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');

    const color = change >= 0 ? '#34a853' : '#ea4335';
    const fillColor = change >= 0 ? 'rgba(52,168,83,0.15)' : 'rgba(234,67,53,0.15)';

    // Create fill area (line down to bottom)
    const firstPoint = points.split(' ')[0];
    const lastPoint = points.split(' ').pop();
    const fillPoints = `${points} ${lastPoint.split(',')[0]},${height} 0,${height}`;

    return `
      <svg viewBox="0 0 ${width} ${height}" class="sparkline-svg">
        <polygon points="${fillPoints}" fill="${fillColor}" />
        <polyline points="${points}" fill="none" stroke="${color}" stroke-width="1.5" stroke-linejoin="round" />
      </svg>`;
  },

  render(stocks) {
    if (!stocks.length) {
      this.container.innerHTML = '<div class="loading">No market data</div>';
      return;
    }

    this.container.innerHTML = stocks.map(s => {
      const changeClass = s.change >= 0 ? 'positive' : 'negative';
      const changeSign = s.change >= 0 ? '+' : '';
      const price = s.isIndex
        ? s.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : s.price.toFixed(2);

      const sparkline = this.buildSparkline(s.chart, s.change);

      return `
        <div class="stock-card ${s.isIndex ? 'is-index' : ''}">
          <div class="stock-info">
            <div class="stock-symbol">${this.escapeHtml(s.symbol.replace('^', ''))}</div>
            <div class="stock-name">${this.escapeHtml(s.name)}</div>
          </div>
          <div class="stock-chart">${sparkline}</div>
          <div class="stock-numbers">
            <div class="stock-price">$${price}</div>
            <div class="stock-change ${changeClass}">
              ${changeSign}${s.change.toFixed(2)} (${changeSign}${s.changePercent.toFixed(2)}%)
            </div>
          </div>
        </div>`;
    }).join('');
  },

  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },
};
