/* Pulls the audio version of a static article page from the CMS, so uploading
   or replacing audio in the admin panel shows up without a rebuild.
   The card shell is rendered straight away so the page does not jump when the
   request comes back; it is removed only if the article has no audio. */
(function () {
  var cfg = window.SUGARY_SUPABASE;
  if (!cfg || !cfg.url || !cfg.publishableKey) return;

  var slug = null;
  var match = location.pathname.match(/\/articles\/([^\/?#]+)/);
  if (match) {
    slug = decodeURIComponent(match[1]).replace(/\.html$/, '');
  } else {
    var q = new URLSearchParams(location.search).get('slug');
    if (q && /article/.test(location.pathname)) slug = q;
  }
  if (!slug) return;
  if (document.querySelector('.audio-card')) return;

  var anchor = document.querySelector('.article .intro') || document.querySelector('.article h1');
  if (!anchor) return;

  /* --- shell first, so space is reserved before the network answers --- */
  var card = document.createElement('div');
  card.className = 'audio-card is-loading';
  card.setAttribute('aria-busy', 'true');

  var label = document.createElement('div');
  label.className = 'audio-label';
  label.innerHTML = '<b>Listen to this article</b><span>Audio version</span>';

  var audio = document.createElement('audio');
  audio.preload = 'metadata';
  audio.setAttribute('controls', '');
  audio.style.visibility = 'hidden';
  audio.style.height = '0';

  card.appendChild(label);
  card.appendChild(audio);
  anchor.insertAdjacentElement('afterend', card);

  var endpoint = cfg.url + '/rest/v1/articles?select=audio_url&status=eq.published&slug=eq.' + encodeURIComponent(slug);

  fetch(endpoint, {
    headers: { apikey: cfg.publishableKey, Authorization: 'Bearer ' + cfg.publishableKey }
  })
    .then(function (r) { return r.ok ? r.json() : []; })
    .then(function (rows) {
      var url = rows && rows[0] && rows[0].audio_url;
      if (!url) { card.remove(); return; }
      audio.src = url;
      card.classList.remove('is-loading');
      card.removeAttribute('aria-busy');
      audio.style.visibility = '';
      audio.style.height = '';
    })
    .catch(function () { card.remove(); });
})();
