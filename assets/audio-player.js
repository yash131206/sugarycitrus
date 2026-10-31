/* Sugary Citrus audio player — pure CSS dot wave.
   Layout: label on the left; time and speed top-right; play button and the
   dot wave on the same row underneath. Dots before the playhead turn orange,
   the rest stay faint, and the row breathes while the audio is playing. */
(function () {
  var ROWS = 2;
  var PER_ROW = 30;
  var SPEEDS = [0.75, 1, 1.25, 1.5, 2];

  function fmt(sec) {
    if (!isFinite(sec) || sec < 0) sec = 0;
    var m = Math.floor(sec / 60), s = Math.floor(sec % 60);
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  function build(card, audio) {
    var wrap = document.createElement('div');
    wrap.className = 'wave';

    var meta = document.createElement('div');
    meta.className = 'wave-meta';

    var time = document.createElement('span');
    time.className = 'wave-time';
    time.textContent = '0:00 / 0:00';

    var speed = document.createElement('select');
    speed.className = 'wave-speed';
    speed.setAttribute('aria-label', 'Playback speed');
    SPEEDS.forEach(function (v) {
      var o = document.createElement('option');
      o.value = v;
      o.textContent = (v === 1 ? '1x' : v + 'x');
      speed.appendChild(o);
    });
    speed.value = '1';

    meta.appendChild(time);
    meta.appendChild(speed);

    var row = document.createElement('div');
    row.className = 'wave-row';

    var play = document.createElement('button');
    play.type = 'button';
    play.className = 'wave-play';
    play.setAttribute('aria-label', 'Play audio');
    play.innerHTML = '<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13l11-6.5z"/></svg>';

    var stage = document.createElement('div');
    stage.className = 'wave-stage';
    stage.setAttribute('role', 'slider');
    stage.setAttribute('aria-label', 'Seek');
    stage.tabIndex = 0;

    var dots = document.createElement('div');
    dots.className = 'wave-dots';
    stage.appendChild(dots);
    var all = [];

    var fill = document.createElement('span');
    fill.className = 'wave-line';
    fill.innerHTML = '<i></i>';
    stage.appendChild(fill);

    row.appendChild(play);
    row.appendChild(stage);

    /* label and meta share the first row; play + wave sit underneath */
    card.appendChild(meta);
    card.appendChild(row);

    var knownDuration = 0;

    function progress() {
      var d = audio.duration || knownDuration || 0;
      var p = d ? Math.min(1, audio.currentTime / d) : 0;
      fill.firstChild.style.width = (p * 100) + '%';
      time.textContent = fmt(audio.currentTime) + ' / ' + fmt(d);
    }

    function seek(e) {
      var rect = stage.getBoundingClientRect();
      var x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
      var p = Math.min(1, Math.max(0, x / rect.width));
      if (audio.duration) audio.currentTime = p * audio.duration;
      progress();
    }

    play.addEventListener('click', function () { audio.paused ? audio.play() : audio.pause(); });
    audio.addEventListener('play', function () {
      wrap.classList.add('is-playing');
      play.setAttribute('aria-label', 'Pause audio');
      play.innerHTML = '<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z"/></svg>';
    });
    audio.addEventListener('pause', function () {
      wrap.classList.remove('is-playing');
      play.setAttribute('aria-label', 'Play audio');
      play.innerHTML = '<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13l11-6.5z"/></svg>';
    });
    audio.addEventListener('timeupdate', progress);
    audio.addEventListener('loadedmetadata', function () { knownDuration = audio.duration || knownDuration; progress(); });

    speed.addEventListener('change', function () { audio.playbackRate = parseFloat(speed.value); });
    stage.addEventListener('click', seek);
    stage.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 10);
      if (e.key === 'ArrowLeft') audio.currentTime = Math.max(0, audio.currentTime - 10);
    });

    progress();

    var base = (function () {
      var scripts = document.getElementsByTagName('script');
      for (var i = 0; i < scripts.length; i++) {
        var src = scripts[i].src || '';
        if (src.indexOf('audio-player.js') !== -1) return src.replace(/audio-player\.js.*$/, '');
      }
      return 'assets/';
    })();

    function loadScript(src) {
      return new Promise(function (res, rej) {
        var el = document.createElement('script');
        el.src = src; el.onload = res; el.onerror = rej;
        document.head.appendChild(el);
      });
    }

    var anim = null;
    (window.lottie ? Promise.resolve() : loadScript(base + 'vendor/lottie.min.js'))
      .then(function () { return fetch(base + 'audio/wave-dots.json').then(function (r) { return r.json(); }); })
      .then(function (data) {
        if (!window.lottie) throw new Error('no lottie');
        stage.classList.add('has-lottie');
        anim = window.lottie.loadAnimation({
          container: dots, renderer: 'svg', loop: true, autoplay: false,
          animationData: data, rendererSettings: { preserveAspectRatio: 'xMidYMid slice' }
        });
        if (!audio.paused) anim.play();
        audio.addEventListener('play', function () { anim.setDirection(1); anim.play(); });
        audio.addEventListener('pause', function () { anim.pause(); });
        audio.addEventListener('ended', function () { anim.goToAndStop(0, true); });
      })
      .catch(function () { stage.classList.remove('has-lottie'); });
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
  setTimeout(init, 800);
  setTimeout(init, 2000);
})();
