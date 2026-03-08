const express = require('express');
const router = express.Router();

// TheMealDB - free, no API key needed
const BASE_URL = 'https://www.themealdb.com/api/json/v1/1';

router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json({ meals: [] });

    const url = `${BASE_URL}/search.php?s=${encodeURIComponent(q)}`;
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('Recipe search error:', err.message);
    res.status(500).json({ error: 'Failed to search recipes' });
  }
});

router.get('/ingredient', async (req, res) => {
  try {
    const { i } = req.query;
    if (!i) return res.json({ meals: [] });

    const url = `${BASE_URL}/filter.php?i=${encodeURIComponent(i)}`;
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('Recipe ingredient search error:', err.message);
    res.status(500).json({ error: 'Failed to search by ingredient' });
  }
});

router.get('/detail/:id', async (req, res) => {
  try {
    const url = `${BASE_URL}/lookup.php?i=${req.params.id}`;
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('Recipe detail error:', err.message);
    res.status(500).json({ error: 'Failed to fetch recipe' });
  }
});

router.get('/random', async (req, res) => {
  try {
    const url = `${BASE_URL}/random.php`;
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('Random recipe error:', err.message);
    res.status(500).json({ error: 'Failed to fetch random recipe' });
  }
});

router.get('/categories', async (req, res) => {
  try {
    const url = `${BASE_URL}/categories.php`;
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('Recipe categories error:', err.message);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

module.exports = router;
