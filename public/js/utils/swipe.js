// Touch swipe gesture handler
window.SwipeHandler = {
  init(container, { onSwipe, threshold = 50 }) {
    let startX = 0;
    let startY = 0;
    let isDragging = false;

    container.addEventListener('touchstart', (e) => {
      // Don't capture swipes on interactive elements
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'BUTTON' || tag === 'SELECT' || tag === 'TEXTAREA') return;
      if (e.target.closest('input, button, select, textarea, .no-swipe')) return;

      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      isDragging = true;
    }, { passive: true });

    container.addEventListener('touchend', (e) => {
      if (!isDragging) return;
      isDragging = false;

      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const diffX = endX - startX;
      const diffY = endY - startY;

      // Only trigger if horizontal swipe is dominant
      if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > threshold) {
        onSwipe(diffX > 0 ? 'right' : 'left');
      }
    }, { passive: true });
  },
};
