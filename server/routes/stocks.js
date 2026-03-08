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

router.get('/', async (req, res) => {
  try {
    const now = Date.now();
    if (stockCache.data && now - stockCache.timestamp < CACHE_DURATION) {
      return res.json(stockCache.data);
    }

    const yahooFinance = require('yahoo-finance2').default;
    const allSymbols = [...SYMBOLS.indices, ...SYMBOLS.stocks];

    const quotes = await Promise.allSettled(
      allSymbols.map(symbol => yahooFinance.quote(symbol))
    );

    const results = quotes
      .map((result, i) => {
        if (result.status === 'rejected') return null;
        const q = result.value;
        return {
          symbol: allSymbols[i],
          name: INDEX_NAMES[allSymbols[i]] || q.shortName || allSymbols[i],
          price: q.regularMarketPrice,
          change: q.regularMarketChange,
          changePercent: q.regularMarketChangePercent,
          isIndex: SYMBOLS.indices.includes(allSymbols[i]),
        };
      })
      .filter(Boolean);

    stockCache = { data: results, timestamp: now };
    res.json(results);
  } catch (err) {
    console.error('Stocks error:', err.message);
    res.status(500).json({ error: 'Failed to fetch stocks' });
  }
});

module.exports = router;
