/* Sugary Citrus — analytics events.
   gtag is defined early in the page and the library itself loads late, so
   anything pushed here is queued and sent once it arrives. */
(function () {
  if (typeof window.gtag !== 'function') return;

  function track(name, params) {
    try { window.gtag('event', name, params || {}); } catch (e) {}
  }

  function slug() {
    var m = location.pathname.match(/articles\/([a-z0-9-]+)/i);
    return m ? m[1] : '';
  }


  /* the thank-you page is the most reliable conversion signal: it is a page
     view, so it cannot be lost to a redirect */
  if (/thank-you/.test(location.pathname)) {
    track('thank_you_view', { conversion: 'enquiry_sent' });
  }

  /* an article was opened */
  if (/\/articles\//.test(location.pathname)) {
    track('read_article', { article: slug(), page_location: location.href });
  }

  /* one listener handles every click we care about */
  document.addEventListener('click', function (e) {
    var el = e.target && e.target.closest ? e.target.closest('[data-listen], a.share-offsite, a[href^="mailto:"], a[href*="instagram.com"]') : null;
    if (!el) return;

    if (el.hasAttribute('data-listen')) {
      track('listen_article', { article: slug() });
    } else if (el.classList.contains('share-offsite')) {
      track('share', { method: el.textContent.trim().slice(0, 20), article: slug() });
    } else if ((el.getAttribute('href') || '').indexOf('instagram.com') > -1) {
      track('instagram_click', { from: location.pathname });
    }
  }, { passive: true });

  /* the contact form reports success by filling #form-status */
  var status = document.getElementById('form-status');
  if (status) {
    var sent = false;
    new MutationObserver(function () {
      var text = (status.textContent || '').toLowerCase();
      if (sent) return;
      if (text.indexOf('thank') > -1 || text.indexOf('sent') > -1 || text.indexOf('received') > -1) {
        sent = true;
        track('form_submit', { form: 'contact' });
      }
    }).observe(status, { childList: true, characterData: true, subtree: true });
  }

  /* how far down the page people read */
  var marks = { 50: false, 90: false };
  window.addEventListener('scroll', function () {
    var h = document.documentElement;
    var pct = (h.scrollTop + window.innerHeight) / h.scrollHeight * 100;
    Object.keys(marks).forEach(function (k) {
      if (!marks[k] && pct >= Number(k)) {
        marks[k] = true;
        track('scroll_depth', { percent: Number(k), page: location.pathname });
      }
    });
  }, { passive: true });
})();
