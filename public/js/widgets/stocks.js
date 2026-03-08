// Stocks widget
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

      return `
        <div class="stock-card ${s.isIndex ? 'is-index' : ''}">
          <div>
            <div class="stock-symbol">${this.escapeHtml(s.symbol.replace('^', ''))}</div>
            <div class="stock-name">${this.escapeHtml(s.name)}</div>
          </div>
          <div>
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
