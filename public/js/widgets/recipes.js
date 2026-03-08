// Recipe search widget
window.RecipesWidget = {
  init() {
    this.resultsContainer = document.getElementById('recipe-results');
    this.detailContainer = document.getElementById('recipe-detail');
    this.searchInput = document.getElementById('recipe-search-input');
    this.searchBtn = document.getElementById('recipe-search-btn');

    this.searchBtn.addEventListener('click', () => this.search());
    this.searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.search();
    });
  },

  async search(query) {
    const q = query || this.searchInput.value.trim();
    if (!q) return;

    this.searchInput.value = q;
    this.resultsContainer.innerHTML = '<div class="loading">Searching...</div>';
    this.detailContainer.classList.add('hidden');

    try {
      const res = await fetch(`/api/recipes/search?q=${encodeURIComponent(q)}`);
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();

      if (!data.meals) {
        // Try ingredient search
        const res2 = await fetch(`/api/recipes/ingredient?i=${encodeURIComponent(q)}`);
        const data2 = await res2.json();
        if (data2.meals) {
          this.renderResults(data2.meals, true);
        } else {
          this.resultsContainer.innerHTML = '<div class="recipe-hint">No recipes found. Try a different search.</div>';
        }
        return;
      }

      this.renderResults(data.meals, false);
    } catch (err) {
      console.warn('Recipe search failed:', err);
      this.resultsContainer.innerHTML = '<div class="recipe-hint">Search failed. Please try again.</div>';
    }
  },

  renderResults(meals, isIngredientSearch) {
    this.resultsContainer.innerHTML = meals.slice(0, 12).map(meal => `
      <div class="recipe-card" onclick="RecipesWidget.showDetail('${meal.idMeal}')">
        <img src="${meal.strMealThumb}/preview" alt="" loading="lazy">
        <div class="recipe-card-title">${this.escapeHtml(meal.strMeal)}</div>
      </div>
    `).join('');
  },

  async showDetail(id) {
    try {
      const res = await fetch(`/api/recipes/detail/${id}`);
      if (!res.ok) throw new Error('Failed to load recipe');
      const data = await res.json();
      const meal = data.meals?.[0];
      if (!meal) return;

      // Extract ingredients
      const ingredients = [];
      for (let i = 1; i <= 20; i++) {
        const ing = meal[`strIngredient${i}`];
        const measure = meal[`strMeasure${i}`];
        if (ing && ing.trim()) {
          ingredients.push(`${measure?.trim() || ''} ${ing.trim()}`.trim());
        }
      }

      // Parse instructions into steps
      const steps = meal.strInstructions
        .split(/\r?\n/)
        .filter(s => s.trim())
        .map(s => s.replace(/^\d+\.\s*/, ''));

      this.detailContainer.innerHTML = `
        <button class="recipe-back-btn" onclick="RecipesWidget.hideDetail()">&#x2190; Back to results</button>
        <div class="recipe-detail-header">
          <img src="${meal.strMealThumb}" alt="">
          <div>
            <div class="recipe-detail-title">${this.escapeHtml(meal.strMeal)}</div>
            <div class="recipe-detail-category">${this.escapeHtml(meal.strCategory || '')} ${meal.strArea ? '&middot; ' + this.escapeHtml(meal.strArea) : ''}</div>
          </div>
        </div>
        <div class="recipe-ingredients">
          <h3>Ingredients</h3>
          <ul>${ingredients.map(i => `<li>${this.escapeHtml(i)}</li>`).join('')}</ul>
        </div>
        <div class="recipe-instructions">
          <h3>Instructions</h3>
          <ol>${steps.map(s => `<li>${this.escapeHtml(s)}</li>`).join('')}</ol>
        </div>
      `;
      this.detailContainer.classList.remove('hidden');
    } catch (err) {
      console.warn('Recipe detail failed:', err);
    }
  },

  hideDetail() {
    this.detailContainer.classList.add('hidden');
  },

  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },
};
