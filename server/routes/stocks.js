const express = require('express');
const router = express.Router();

let stockCache = { data: null, timestamp: 0 };
const CACHE_DURATION = 60 * 1000; // 1 minute

const SYMBOLS = {
  indices: ['^GSPC', '^IXIC', '^DJI'],
  stocks: ['AAPL', 'GOOG', 'MSFT', 'AMZN', 'META', 'NVDA', 'TSLA'],
};

const INDEX_NAMES = {
  '^GSPC': 'S&P 500',
  '^IXIC': 'NASDAQ',
  '^DJI': 'DOW',
};

const YF_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
};

// Fetch quote + intraday chart in one call
async function fetchQuoteWithChart(symbol) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=5m&range=1d&includePrePost=false`;
  const response = await fetch(url, { headers: YF_HEADERS });

  if (!response.ok) {
    throw new Error(`Yahoo returned ${response.status} for ${symbol}`);
  }

  const data = await response.json();
  const result = data.chart?.result?.[0];
  if (!result) throw new Error(`No data for ${symbol}`);

  const meta = result.meta;
  const price = meta.regularMarketPrice;
  const prevClose = meta.chartPreviousClose || meta.previousClose;
  const change = price - prevClose;
  const changePercent = (change / prevClose) * 100;

  // Extract intraday price points for sparkline
  const timestamps = result.timestamp || [];
  const closes = result.indicators?.quote?.[0]?.close || [];
  const chart = timestamps
    .map((ts, i) => closes[i] != null ? { t: ts * 1000, p: closes[i] } : null)
    .filter(Boolean);

  return {
    symbol,
    name: INDEX_NAMES[symbol] || meta.shortName || symbol,
    price,
    change,
    changePercent,
    isIndex: SYMBOLS.indices.includes(symbol),
    chart,
    prevClose,
  };
}

router.get('/', async (req, res) => {
  try {
    const now = Date.now();
    if (stockCache.data && now - stockCache.timestamp < CACHE_DURATION) {
      return res.json(stockCache.data);
    }

    const allSymbols = [...SYMBOLS.indices, ...SYMBOLS.stocks];

    const quotes = await Promise.allSettled(
      allSymbols.map(symbol => fetchQuoteWithChart(symbol))
    );

    const results = quotes
      .map((result) => {
        if (result.status === 'rejected') {
          console.warn('Stock fetch failed:', result.reason?.message);
          return null;
        }
        return result.value;
      })
      .filter(Boolean);

    if (results.length === 0) {
      console.error('All stock fetches failed');
      return res.status(502).json({ error: 'Could not fetch any stock data' });
    }

    stockCache = { data: results, timestamp: now };
    res.json(results);
  } catch (err) {
    console.error('Stocks error:', err.message);
    res.status(500).json({ error: 'Failed to fetch stocks' });
  }
});

module.exports = router;
