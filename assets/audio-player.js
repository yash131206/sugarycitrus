/* Sugary Citrus audio player.
   The wave is a dot grid that reacts to the real audio spectrum: each column of
   dots follows one frequency band of the playing audio. Time and speed sit
   opposite the label; the play button shares the row with the wave. */
(function () {
  var COLS = 30;
  var ROWS = 2;
  var SPEEDS = [0.75, 1, 1.25, 1.5, 2];

  function fmt(sec) {
    if (!isFinite(sec) || sec < 0) sec = 0;
    var m = Math.floor(sec / 60), s = Math.floor(sec % 60);
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  function build(card, audio) {
    var meta = document.createElement('div');
    meta.className = 'wave-meta';

    var time = document.createElement('span');
    time.className = 'wave-time';
    time.textContent = '0:00 / 0:00';

    /* custom speed menu: a native <select> renders its own OS-styled popup,
       which we cannot colour, so the list is ours */
    var speedWrap = document.createElement('div');
    speedWrap.className = 'wave-speed-wrap';

    var speed = document.createElement('button');
    speed.type = 'button';
    speed.className = 'wave-speed';
    speed.setAttribute('aria-label', 'Playback speed');
    speed.setAttribute('aria-haspopup', 'listbox');
    speed.setAttribute('aria-expanded', 'false');
    speed.innerHTML = '<span>1x</span><svg viewBox="0 0 24 24" width="9" height="9" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';

    var speedMenu = document.createElement('div');
    speedMenu.className = 'wave-speed-menu';
    speedMenu.setAttribute('role', 'listbox');
    var options = [];
    SPEEDS.forEach(function (v) {
      var o = document.createElement('button');
      o.type = 'button';
      o.className = 'wave-speed-opt' + (v === 1 ? ' is-current' : '');
      o.setAttribute('role', 'option');
      o.dataset.v = v;
      o.textContent = (v === 1 ? '1x' : v + 'x');
      speedMenu.appendChild(o);
      options.push(o);
    });

    speedWrap.appendChild(speed);
    speedWrap.appendChild(speedMenu);

    meta.appendChild(time);
    meta.appendChild(speedWrap);

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

    var lottieBox = document.createElement('div');
    lottieBox.className = 'wave-lottie';
    stage.appendChild(lottieBox);

    var fill = document.createElement('span');
    fill.className = 'wave-line';
    fill.innerHTML = '<i></i>';
    stage.appendChild(fill);

    row.appendChild(play);
    row.appendChild(stage);

    card.appendChild(meta);
    card.appendChild(row);

    var knownDuration = 0;
    var ctx = null, analyser = null, source = null, data = null, raf = null;

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

    function setupAnalyser() {
      if (ctx) return true;
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      try {
        ctx = new AC();
        source = ctx.createMediaElementSource(audio);
        analyser = ctx.createAnalyser();
        analyser.fftSize = 128;
        analyser.smoothingTimeConstant = 0.75;
        data = new Uint8Array(analyser.frequencyBinCount);
        source.connect(analyser);
        analyser.connect(ctx.destination);
        return true;
      } catch (err) {
        ctx = null;
        return false;
      }
    }

    var anim = null;
    var level = 0;

    function draw() {
      raf = requestAnimationFrame(draw);
      if (!analyser) return;
      analyser.getByteFrequencyData(data);
      // average the low-mid bands: that is where speech energy lives
      var sum = 0, n = 0;
      for (var i = 1; i < 24 && i < data.length; i++) { sum += data[i]; n++; }
      var target = n ? Math.min(1, ((sum / n) / 255) * 2.8) : 0;  // gain: speech sits low, lift it
      level = level * 0.55 + target * 0.45;             // quick enough to feel live
      var speed = 0.25 + level * 3.4;                   // quiet = slow, loud = fast
      if (anim) anim.setSpeed(Math.max(0.15, Math.min(3.6, speed)));
      if (lottieBox) {
        // the dots stretch and brighten with the voice, like a real meter
        var sy = (0.72 + level * 0.95).toFixed(3);
        var sx = (1 + level * 0.06).toFixed(3);
        lottieBox.style.transform = 'scaleX(' + sx + ') scaleY(' + sy + ')';
        lottieBox.style.opacity = (0.62 + level * 0.38).toFixed(3);
      }
    }

    function stopDraw() {
      if (raf) cancelAnimationFrame(raf);
      raf = null;
      level = 0;
      if (anim) anim.setSpeed(1);
      if (lottieBox) lottieBox.style.transform = '';
    }

    play.addEventListener('click', function () {
      if (audio.paused) {
        if (setupAnalyser() && ctx.state === 'suspended') ctx.resume();
        audio.play();
      } else {
        audio.pause();
      }
    });

    audio.addEventListener('play', function () {
      card.classList.add('is-playing');
      play.setAttribute('aria-label', 'Pause audio');
      play.innerHTML = '<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z"/></svg>';
      if (anim) anim.play();
      if (setupAnalyser()) { if (ctx.state === 'suspended') ctx.resume(); if (!raf) draw(); }
    });
    audio.addEventListener('pause', function () {
      card.classList.remove('is-playing');
      play.setAttribute('aria-label', 'Play audio');
      play.innerHTML = '<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13l11-6.5z"/></svg>';
      if (anim) anim.pause();
      stopDraw();
    });
    audio.addEventListener('ended', function () { stopDraw(); progress(); });
    audio.addEventListener('timeupdate', progress);
    audio.addEventListener('loadedmetadata', function () { knownDuration = audio.duration || knownDuration; progress(); });

    function closeMenu() {
      speedWrap.classList.remove('is-open');
      speed.setAttribute('aria-expanded', 'false');
    }
    speed.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = !speedWrap.classList.contains('is-open');
      speedWrap.classList.toggle('is-open', open);
      speed.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    options.forEach(function (o) {
      o.addEventListener('click', function (e) {
        e.stopPropagation();
        audio.playbackRate = parseFloat(o.dataset.v);
        speed.querySelector('span').textContent = o.textContent;
        options.forEach(function (x) { x.classList.toggle('is-current', x === o); });
        closeMenu();
      });
    });
    document.addEventListener('click', closeMenu);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });
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

    (window.lottie ? Promise.resolve() : loadScript(base + 'vendor/lottie.min.js'))
      .then(function () { return fetch(base + 'audio/wave-dots.json').then(function (r) { return r.json(); }); })
      .then(function (data) {
        if (!window.lottie) return;
        anim = window.lottie.loadAnimation({
          container: lottieBox, renderer: 'svg', loop: true, autoplay: false,
          animationData: data, rendererSettings: { preserveAspectRatio: 'xMidYMid slice' }
        });
        if (!audio.paused) anim.play();
      })
      .catch(function () {});
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
