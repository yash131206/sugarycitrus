/* Sugary Citrus audio player.
   The wave is the brand-coloured Lottie animation (assets/audio/wave-dots.json),
   driven by real playback state, with a progress line, seek, speed control and time.
   If Lottie cannot load, it falls back to a bar waveform from the peaks file. */
(function () {
  var ORANGE = '#FF5520';
  var BAR_COUNT = 140;
  var SPEEDS = [0.75, 1, 1.25, 1.5, 2];

  function fmt(sec) {
    if (!isFinite(sec) || sec < 0) sec = 0;
    var m = Math.floor(sec / 60), s = Math.floor(sec % 60);
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  function basePath() {
    var scripts = document.getElementsByTagName('script');
    for (var i = 0; i < scripts.length; i++) {
      var src = scripts[i].src || '';
      if (src.indexOf('audio-player.js') !== -1) return src.replace(/audio-player\.js.*$/, '');
    }
    return 'assets/';
  }

  function peaksUrl(audioUrl) {
    return audioUrl.replace(/\.(mp3|m4a|aac|wav|ogg)(\?.*)?$/i, '-peaks.json');
  }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  function build(card, audio) {
    var base = basePath();

    var wrap = document.createElement('div');
    wrap.className = 'wave';

    var play = document.createElement('button');
    play.type = 'button';
    play.className = 'wave-play';
    play.setAttribute('aria-label', 'Play audio');
    play.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13l11-6.5z"/></svg>';

    var stage = document.createElement('div');
    stage.className = 'wave-stage';
    stage.setAttribute('role', 'slider');
    stage.setAttribute('aria-label', 'Seek');
    stage.tabIndex = 0;

    var dots = document.createElement('div');
    dots.className = 'wave-dots';
    var bars = document.createElement('div');
    bars.className = 'wave-bars';
    var line = document.createElement('span');
    line.className = 'wave-line';
    line.innerHTML = '<i></i>';

    stage.appendChild(dots);
    stage.appendChild(bars);
    stage.appendChild(line);

    var time = document.createElement('span');
    time.className = 'wave-time';
    time.textContent = '0:00';

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

    wrap.appendChild(play);
    wrap.appendChild(stage);
    wrap.appendChild(time);
    wrap.appendChild(speed);
    card.appendChild(wrap);

    var anim = null, spans = [], knownDuration = 0, peaksReady = false;

    function progress() {
      var d = audio.duration || knownDuration || 0;
      var p = d ? Math.min(1, audio.currentTime / d) : 0;
      line.firstChild.style.width = (p * 100) + '%';
      if (spans.length) {
        var upto = Math.round(p * spans.length);
        for (var i = 0; i < spans.length; i++) spans[i].classList.toggle('is-played', i < upto);
      }
      time.textContent = fmt(audio.currentTime) + ' / ' + fmt(d);
    }

    function seek(e) {
      var r = stage.getBoundingClientRect();
      var x = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
      var p = Math.min(1, Math.max(0, x / r.width));
      if (audio.duration) audio.currentTime = p * audio.duration;
      progress();
    }

    play.addEventListener('click', function () { audio.paused ? audio.play() : audio.pause(); });

    audio.addEventListener('play', function () {
      wrap.classList.add('is-playing');
      play.setAttribute('aria-label', 'Pause audio');
      play.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z"/></svg>';
      if (anim) { anim.setDirection(1); anim.play(); }
    });
    audio.addEventListener('pause', function () {
      wrap.classList.remove('is-playing');
      play.setAttribute('aria-label', 'Play audio');
      play.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13l11-6.5z"/></svg>';
      if (anim) anim.pause();
    });
    audio.addEventListener('timeupdate', progress);
    audio.addEventListener('loadedmetadata', progress);
    audio.addEventListener('ended', function () { if (anim) anim.goToAndStop(0, true); });

    speed.addEventListener('change', function () { audio.playbackRate = parseFloat(speed.value); });

    stage.addEventListener('click', seek);
    stage.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 10);
      if (e.key === 'ArrowLeft') audio.currentTime = Math.max(0, audio.currentTime - 10);
    });

    function paintBars(peaks) {
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

    paintBars(null);
    progress();

    // 1) try the Lottie wave
    var lottieSrc = base + 'vendor/lottie.min.js';
    var waveSrc = base + 'audio/wave-dots.json';
    (window.lottie ? Promise.resolve() : loadScript(lottieSrc))
      .then(function () {
        return fetch(waveSrc).then(function (r) { return r.json(); });
      })
      .then(function (data) {
        if (!window.lottie) throw new Error('no lottie');
        stage.classList.add('has-lottie');
        anim = window.lottie.loadAnimation({
          container: dots,
          renderer: 'svg',
          loop: true,
          autoplay: false,
          animationData: data,
          rendererSettings: { preserveAspectRatio: 'xMidYMid slice' }
        });
        if (!audio.paused) anim.play();
      })
      .catch(function () {
        // 2) fall back to the bar waveform
        fetch(peaksUrl(audio.src))
          .then(function (r) { return r.ok ? r.json() : null; })
          .then(function (d) {
            if (!d || !d.bars) return;
            knownDuration = d.duration || 0;
            paintBars(d.bars);
            progress();
          })
          .catch(function () {});
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
  setTimeout(init, 800);
  setTimeout(init, 2000);
})();
