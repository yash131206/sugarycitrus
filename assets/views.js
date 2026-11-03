/* Sugary Citrus — article view counter.
   Fires once per article per browser session, skips obvious bots,
   and never stores an IP or a persistent identifier. */
(function () {
  function slugFromPath() {
    var m = location.pathname.match(/\/articles\/([^\/?#]+)/);
    if (m) return decodeURIComponent(m[1]).replace(/\.html$/, '');
    var q = new URLSearchParams(location.search).get('slug');
    if (q && /article/.test(location.pathname)) return q;
    return null;
  }

  function looksLikeBot() {
    var ua = navigator.userAgent || '';
    return /bot|crawler|spider|crawling|headless|prerender|lighthouse|pingdom|uptime|monitor/i.test(ua);
  }

  function config() {
    var c = window.SUGARY_SUPABASE || window.SUPABASE_PUBLIC_CONFIG || null;
    if (!c) return null;
    return { url: c.url, key: c.publishableKey || c.anonKey || c.key };
  }

  function once(slug) {
    try {
      var key = 'sc_view_' + slug;
      if (sessionStorage.getItem(key)) return false;
      sessionStorage.setItem(key, '1');
      return true;
    } catch (e) {
      return true; // storage blocked: still count, worst case a duplicate
    }
  }

  function send(slug, cfg) {
    var base = (cfg.url || '').replace(/\/$/, '');
    var key = cfg.key;
    if (!base || !key) return;
    fetch(base + '/rest/v1/rpc/record_article_view', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': key,
        'Authorization': 'Bearer ' + key
      },
      body: JSON.stringify({ p_slug: slug }),
      keepalive: true
    }).catch(function () {});
  }

  function start() {
    var slug = slugFromPath();
    if (!slug || looksLikeBot() || !once(slug)) return;
    var cfg = config();
    if (cfg) { send(slug, cfg); return; }
    // the config script may load after us
    var tries = 0;
    var t = setInterval(function () {
      var c = config();
      if (c) { clearInterval(t); send(slug, c); }
      if (++tries > 40) clearInterval(t);
    }, 250);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
