/* Pulls the audio version of a static article page from the CMS, so uploading
   or replacing audio in the admin panel shows up without a rebuild. */
(function () {
  var cfg = window.SUGARY_SUPABASE;
  if (!cfg || !cfg.url || !cfg.publishableKey) return;

  var match = location.pathname.match(/\/articles\/([^\/?#]+)/);
  if (!match) return;
  var slug = decodeURIComponent(match[1]);
  if (document.querySelector('.audio-card')) return;

  var endpoint = cfg.url + '/rest/v1/articles?select=audio_url&status=eq.published&slug=eq.' + encodeURIComponent(slug);

  fetch(endpoint, {
    headers: {
      apikey: cfg.publishableKey,
      Authorization: 'Bearer ' + cfg.publishableKey
    }
  })
    .then(function (r) { return r.ok ? r.json() : []; })
    .then(function (rows) {
      var url = rows && rows[0] && rows[0].audio_url;
      if (!url) return;
      if (document.querySelector('.audio-card')) return;

      var anchor = document.querySelector('.article .intro') || document.querySelector('.article h1');
      if (!anchor) return;

      var card = document.createElement('div');
      card.className = 'audio-card';

      var label = document.createElement('div');
      label.className = 'audio-label';
      label.innerHTML = '<b>Listen to this article</b><span>Audio version</span>';

      var audio = document.createElement('audio');
      audio.controls = true;
      audio.preload = 'metadata';
      audio.src = url;

      card.appendChild(label);
      card.appendChild(audio);
      anchor.insertAdjacentElement('afterend', card);
    })
    .catch(function () { /* silent: the article reads fine without audio */ });
})();
