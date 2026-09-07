/**
 * Utility functions for jumping/scrolling to the top and bottom of long pages/tables.
 * Supports scrolling window, documentElement, body, and custom container elements (like <main>).
 */

export function scrollToTop() {
  if (typeof window === 'undefined') return;

  // 1. Try scrolling anchor if present
  const topAnchor = document.getElementById('costs-top-anchor') || document.getElementById('top-anchor');
  if (topAnchor) {
    topAnchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // 2. Scroll main container
  const main = document.getElementById('main-scroll-container') || document.querySelector('main');
  if (main) {
    main.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // 3. Scroll document / window
  window.scrollTo({ top: 0, behavior: 'smooth' });
  document.documentElement.scrollTo({ top: 0, behavior: 'smooth' });
  document.body.scrollTo({ top: 0, behavior: 'smooth' });
}

export function scrollToBottom() {
  if (typeof window === 'undefined') return;

  // 1. Try scrolling anchor if present
  const bottomAnchor = document.getElementById('costs-bottom-anchor') || document.getElementById('bottom-anchor');
  if (bottomAnchor) {
    bottomAnchor.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }

  // 2. Scroll main container
  const main = document.getElementById('main-scroll-container') || document.querySelector('main');
  if (main) {
    main.scrollTo({ top: main.scrollHeight, behavior: 'smooth' });
  }

  // 3. Scroll document / window
  const maxScroll = Math.max(
    document.body.scrollHeight,
    document.documentElement.scrollHeight,
    window.innerHeight * 5
  );
  window.scrollTo({ top: maxScroll, behavior: 'smooth' });
  document.documentElement.scrollTo({ top: maxScroll, behavior: 'smooth' });
  document.body.scrollTo({ top: maxScroll, behavior: 'smooth' });
}
