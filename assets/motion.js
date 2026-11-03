/* Sugary Citrus — motion layer.
   Adds a gentle staggered entrance to blocks that do not already carry
   .reveal, and numbers the children of grids so they arrive one after
   another. Nothing here hides content if JavaScript fails: the classes are
   only added once the observer is ready, and a safety timer shows
   everything after three seconds regardless. */
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !('IntersectionObserver' in window)) return;

  var GRIDS = ['.blog-grid', '.services-grid', '.latest-grid', '.faq-list', '.posts-wrap', '.footer-cols'];
  var BLOCKS = '.content-section > .container > *, .page-hero .container > *, .hero-copy, .hero-visual';

  function numberChildren() {
    GRIDS.forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (grid) {
        var i = 0;
        Array.prototype.forEach.call(grid.children, function (child) {
          if (!child.classList || child.classList.contains('reveal')) return;
          child.style.setProperty('--i', i++);
        });
      });
    });
  }

  function markBlocks() {
    var i = 0;
    document.querySelectorAll(BLOCKS).forEach(function (el) {
      if (el.classList.contains('reveal')) return;
      if (el.hasAttribute('data-no-motion')) return;
      if (el.id === 'posts' || el.classList.contains('posts-wrap')) return;
      el.classList.add('reveal');
      el.style.setProperty('--i', Math.min(i++, 6));
    });
  }

  function observe() {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -4% 0px' });

    document.querySelectorAll('.reveal:not(.visible)').forEach(function (el) { io.observe(el); });
  }

  function start() {
    numberChildren();
    markBlocks();
    observe();
    /* anything still hidden after three seconds is shown, no matter what */
    setTimeout(function () {
      document.querySelectorAll('.reveal:not(.visible)').forEach(function (el) {
        el.classList.add('visible');
      });
    }, 3000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();

  /* cards rendered by blog.js / latest.js arrive later */
  if (window.MutationObserver) {
    var pending = null;
    new MutationObserver(function () {
      clearTimeout(pending);
      pending = setTimeout(function () { numberChildren(); observe(); }, 250);
    }).observe(document.body, { childList: true, subtree: true });
  }
})();
