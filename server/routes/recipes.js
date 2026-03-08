const express = require('express');
const router = express.Router();

// TheMealDB - free, no API key needed
const BASE_URL = 'https://www.themealdb.com/api/json/v1/1';

async function mealFetch(url) {
  console.log('Recipe API request:', url);
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'HomeDashboard/1.0',
      'Accept': 'application/json',
    },
  });
  if (!response.ok) {
    throw new Error(`TheMealDB returned ${response.status}: ${response.statusText}`);
  }
  const text = await response.text();
  console.log('Recipe API response length:', text.length);
  try {
    return JSON.parse(text);
  } catch (e) {
    console.error('Recipe API invalid JSON:', text.substring(0, 200));
    throw new Error('Invalid JSON from TheMealDB');
  }
}

router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    console.log('Recipe search query:', q);
    if (!q) return res.json({ meals: [] });

    const url = `${BASE_URL}/search.php?s=${encodeURIComponent(q)}`;
    const data = await mealFetch(url);

    // If no results by name, try by ingredient
    if (!data.meals) {
      console.log('No name match, trying ingredient search for:', q);
      const ingredientUrl = `${BASE_URL}/filter.php?i=${encodeURIComponent(q)}`;
      try {
        const ingredientData = await mealFetch(ingredientUrl);
        return res.json(ingredientData);
      } catch {
        return res.json({ meals: null });
      }
    }

    res.json(data);
  } catch (err) {
    console.error('Recipe search error:', err.message);
    res.status(500).json({ error: 'Failed to search recipes: ' + err.message });
  }
});

router.get('/ingredient', async (req, res) => {
  try {
    const { i } = req.query;
    if (!i) return res.json({ meals: [] });

    const url = `${BASE_URL}/filter.php?i=${encodeURIComponent(i)}`;
    const data = await mealFetch(url);
    res.json(data);
  } catch (err) {
    console.error('Recipe ingredient search error:', err.message);
    res.status(500).json({ error: 'Failed to search by ingredient: ' + err.message });
  }
});

router.get('/detail/:id', async (req, res) => {
  try {
    const url = `${BASE_URL}/lookup.php?i=${req.params.id}`;
    const data = await mealFetch(url);
    res.json(data);
  } catch (err) {
    console.error('Recipe detail error:', err.message);
    res.status(500).json({ error: 'Failed to fetch recipe: ' + err.message });
  }
});

router.get('/random', async (req, res) => {
  try {
    const url = `${BASE_URL}/random.php`;
    const data = await mealFetch(url);
    res.json(data);
  } catch (err) {
    console.error('Random recipe error:', err.message);
    res.status(500).json({ error: 'Failed to fetch random recipe: ' + err.message });
  }
});

router.get('/categories', async (req, res) => {
  try {
    const url = `${BASE_URL}/categories.php`;
    const data = await mealFetch(url);
    res.json(data);
  } catch (err) {
    console.error('Recipe categories error:', err.message);
    res.status(500).json({ error: 'Failed to fetch categories: ' + err.message });
  }
});

module.exports = router;
