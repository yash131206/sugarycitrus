/* Sugary Citrus audio player: a brand-coloured waveform instead of the browser's
   default control strip. Works anywhere a .audio-card is rendered.
   Peaks come from a small JSON next to the audio file; if it is missing the
   script decodes the audio itself and computes them on the fly. */
(function () {
  var ORANGE = '#FF5520';
  var BAR_COUNT = 140;

  function fmt(sec) {
    if (!isFinite(sec) || sec < 0) sec = 0;
    var m = Math.floor(sec / 60);
    var s = Math.floor(sec % 60);
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  function peaksUrl(audioUrl) {
    return audioUrl.replace(/\.(mp3|m4a|aac|wav|ogg)$/i, '-peaks.json');
  }

  function build(card, audio) {
    var wrap = document.createElement('div');
    wrap.className = 'wave';

    var play = document.createElement('button');
    play.type = 'button';
    play.className = 'wave-play';
    play.setAttribute('aria-label', 'Play audio');
    play.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13l11-6.5z"/></svg>';

    var bars = document.createElement('div');
    bars.className = 'wave-bars';
    bars.setAttribute('role', 'slider');
    bars.setAttribute('aria-label', 'Seek');
    bars.tabIndex = 0;

    var time = document.createElement('span');
    time.className = 'wave-time';
    time.textContent = '0:00';

    wrap.appendChild(play);
    wrap.appendChild(bars);
    wrap.appendChild(time);
    card.appendChild(wrap);

    var spans = [];
    var knownDuration = 0;

    function paint(peaks) {
      bars.innerHTML = '';
      spans = [];
      var n = peaks && peaks.length ? peaks.length : BAR_COUNT;
      for (var i = 0; i < n; i++) {
        var b = document.createElement('i');
        var h = peaks && peaks.length ? peaks[i] : 0.3;
        b.style.height = Math.max(8, Math.round(h * 100)) + '%';
        b.style.animationDelay = ((i % 24) * 45) + 'ms';
        bars.appendChild(b);
        spans.push(b);
      }
    }

    function progress() {
      var d = audio.duration || 0;
      var p = d ? audio.currentTime / d : 0;
      var upto = Math.round(p * spans.length);
      for (var i = 0; i < spans.length; i++) {
        spans[i].classList.toggle('is-played', i < upto);
      }
      time.textContent = fmt(audio.currentTime) + ' / ' + fmt(d || knownDuration);
    }

    function seek(e) {
      var r = bars.getBoundingClientRect();
      var x = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
      var p = Math.min(1, Math.max(0, x / r.width));
      if (audio.duration) audio.currentTime = p * audio.duration;
      progress();
    }

    play.addEventListener('click', function () {
      if (audio.paused) audio.play(); else audio.pause();
    });
    audio.addEventListener('play', function () {
      play.classList.add('is-playing');
      wrap.classList.add('is-playing');
      play.setAttribute('aria-label', 'Pause audio');
      play.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z"/></svg>';
    });
    audio.addEventListener('pause', function () {
      play.classList.remove('is-playing');
      wrap.classList.remove('is-playing');
      play.setAttribute('aria-label', 'Play audio');
      play.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13l11-6.5z"/></svg>';
    });
    audio.addEventListener('timeupdate', progress);
    audio.addEventListener('loadedmetadata', progress);
    bars.addEventListener('click', seek);
    bars.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 10); }
      if (e.key === 'ArrowLeft') { audio.currentTime = Math.max(0, audio.currentTime - 10); }
    });

    paint(null);
    progress();

    fetch(peaksUrl(audio.src))
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        if (data && data.bars && data.bars.length) {
          knownDuration = data.duration || 0;
          paint(data.bars);
          progress();
          return;
        }
        throw new Error('no peaks');
      })
      .catch(function () {
        // fall back to decoding the audio in the browser
        try {
          var AC = window.AudioContext || window.webkitAudioContext;
          if (!AC) return;
          fetch(audio.src).then(function (r) { return r.arrayBuffer(); }).then(function (buf) {
            var ctx = new AC();
            return ctx.decodeAudioData(buf);
          }).then(function (decoded) {
            var data = decoded.getChannelData(0);
            var step = Math.floor(data.length / BAR_COUNT) || 1;
            var out = [];
            for (var i = 0; i < BAR_COUNT; i++) {
              var sum = 0, n = 0;
              for (var j = i * step; j < (i + 1) * step && j < data.length; j += 40) { sum += data[j] * data[j]; n++; }
              out.push(Math.sqrt(sum / (n || 1)));
            }
            var m = Math.max.apply(null, out) || 1;
            paint(out.map(function (v) { return Math.max(0.12, v / m); }));
            progress();
          }).catch(function () {});
        } catch (err) { /* the player still works without a waveform */ }
      });
  }

  function init() {
    var cards = document.querySelectorAll('.audio-card');
    for (var i = 0; i < cards.length; i++) {
      var card = cards[i];
      if (card.getAttribute('data-wave') === 'on') continue;
      var audio = card.querySelector('audio');
      if (!audio) continue;
      card.setAttribute('data-wave', 'on');
      audio.removeAttribute('controls');
      audio.style.display = 'none';
      build(card, audio);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
  // the article page injects the card after load
  setTimeout(init, 800);
  setTimeout(init, 2000);
})();
