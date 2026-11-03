/* Sugary Citrus — article share row and "was this helpful?" vote.
   Both are injected client-side so the static pages stay clean.
   The vote stores only a count per article: no IP, no identifier. */
(function () {
  function slug() {
    var m = location.pathname.match(/\/articles\/([^\/?#]+)/);
    if (m) return decodeURIComponent(m[1]).replace(/\.html$/, '');
    var q = new URLSearchParams(location.search).get('slug');
    if (q && /article/.test(location.pathname)) return q;
    return null;
  }

  function cfg() {
    var c = window.SUGARY_SUGARBASE || window.SUGARY_SUPABASE || null;
    if (!c) return null;
    return { url: (c.url || '').replace(/\/$/, ''), key: c.publishableKey || c.anonKey || c.key };
  }

  function icon(path) {
    return '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + path + '</svg>';
  }

  function build(slugValue) {
    var host = document.querySelector('.article-meta');
    if (!host || document.getElementById('sc-share')) return;

    var url = location.origin + location.pathname;
    var title = (document.querySelector('h1') || {}).textContent || document.title;

    var wrap = document.createElement('div');
    wrap.id = 'sc-share';
    wrap.className = 'article-tools';

    // ---- share ----
    var share = document.createElement('div');
    share.className = 'tool-row';
    share.innerHTML =
      '<span class="tool-label">Share</span>' +
      '<a class="tool-btn" target="_blank" rel="noopener" href="https://wa.me/?text=' + encodeURIComponent(title + ' — ' + url) + '">' +
        icon('<path d="M20 12a8 8 0 1 1-3.2-6.4L21 4l-1.2 4A8 8 0 0 1 20 12z"/><path d="M3 21l3.4-1.6"/>') + 'WhatsApp</a>' +
      '<a class="tool-btn" target="_blank" rel="noopener" href="https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(url) + '">' +
        icon('<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M7.5 10.5v6M7.5 7.6v.1M11.5 16.5v-3.2a2 2 0 0 1 4 0v3.2"/>') + 'LinkedIn</a>' +
      '<a class="tool-btn" target="_blank" rel="noopener" href="https://twitter.com/intent/tweet?text=' + encodeURIComponent(title) + '&url=' + encodeURIComponent(url) + '">' +
        icon('<path d="M4 4l16 16M20 4L4 20"/>') + 'X</a>' +
      '<button class="tool-btn" type="button" data-copy>' +
        icon('<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a1 1 0 0 1 1-1h9"/>') + 'Copy link</button>';

    // ---- helpful vote ----
    var vote = document.createElement('div');
    vote.className = 'tool-row';
    vote.innerHTML =
      '<span class="tool-label">Was this helpful?</span>' +
      '<button class="tool-btn" type="button" data-vote="yes">' + icon('<path d="M7 20V9l4-5 1 1v4h6a2 2 0 0 1 2 2.3l-1 6A2 2 0 0 1 17 20H7z"/><path d="M3 20h4V9H3z"/>') + 'Yes</button>' +
      '<button class="tool-btn" type="button" data-vote="no">' + icon('<path d="M17 4v11l-4 5-1-1v-4H6a2 2 0 0 1-2-2.3l1-6A2 2 0 0 1 7 4h10z"/><path d="M21 4h-4v11h4z"/>') + 'Not really</button>';

    wrap.appendChild(share);
    wrap.appendChild(vote);
    host.insertAdjacentElement('afterend', wrap);

    // copy
    var copyBtn = wrap.querySelector('[data-copy]');
    copyBtn.addEventListener('click', function () {
      var done = function () {
        copyBtn.textContent = 'Copied';
        setTimeout(function () { copyBtn.innerHTML = icon('<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a1 1 0 0 1 1-1h9"/>') + 'Copy link'; }, 1800);
      };
      if (navigator.clipboard) navigator.clipboard.writeText(url).then(done).catch(done);
      else done();
    });

    // vote
    wrap.addEventListener('click', function (e) {
      var b = e.target.closest('[data-vote]');
      if (!b) return;
      var helpful = b.dataset.vote === 'yes';
      var key = 'sc_fb_' + slugValue;
      try { if (sessionStorage.getItem(key)) return; sessionStorage.setItem(key, '1'); } catch (err) {}

      vote.innerHTML = '<span class="tool-note">' +
        (helpful ? 'Thanks — glad it was useful.' : 'Thanks for saying so. It helps me decide what to write next.') +
        '</span>';

      var c = cfg();
      if (!c || !c.url) return;
      fetch(c.url + '/rest/v1/rpc/record_article_feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: c.key, Authorization: 'Bearer ' + c.key },
        body: JSON.stringify({ p_slug: slugValue, p_helpful: helpful }),
        keepalive: true
      }).catch(function () {});
    });
  }

  function start() {
    var s = slug();
    if (!s) return;
    if (document.querySelector('.article-meta')) { build(s); return; }
    // dynamic article page renders after load
    var tries = 0;
    var t = setInterval(function () {
      if (document.querySelector('.article-meta')) { clearInterval(t); build(s); }
      if (++tries > 40) clearInterval(t);
    }, 250);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
