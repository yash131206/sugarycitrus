/* Sugary Citrus audio player.
   The wave is a dot grid drawn on a canvas and driven by the real audio
   spectrum: each column of dots follows one frequency band, so the shape
   tracks the voice instead of looping on a timer. No animation library and
   no extra JSON to download, which is why the card is interactive at once. */
(function () {
  var COLS = 30;
  var ROWS = 2;
  var SPEEDS = [0.75, 1, 1.25, 1.5, 2];

  /* start both downloads immediately so the wave is ready before anyone
     presses play, instead of after */
  var BASE = (function () {
    var scripts = document.getElementsByTagName('script');
    for (var i = 0; i < scripts.length; i++) {
      var src = scripts[i].src || '';
      if (src.indexOf('audio-player.js') !== -1) return src.replace(/audio-player\.js.*$/, '');
    }
    return 'assets/';
  })();

  var LIB = window.lottie ? Promise.resolve() : new Promise(function (res, rej) {
    var el = document.createElement('script');
    el.src = BASE + 'vendor/lottie.min.js';
    el.onload = res; el.onerror = rej;
    document.head.appendChild(el);
  });

  var WAVE = LIB.then(function () {
    return fetch(BASE + 'audio/wave-dots.json').then(function (r) { return r.json(); });
  });

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
      o.textContent = v + 'x';
      speedMenu.appendChild(o);
      options.push(o);
    });

    speedWrap.appendChild(speed);
    speedWrap.appendChild(speedMenu);
    meta.appendChild(time);
    meta.appendChild(speedWrap);

    var row = document.createElement('div');
    row.className = 'wave-row';

    var back = document.createElement('button');
    back.type = 'button';
    back.className = 'wave-skip';
    back.setAttribute('aria-label', 'Back 15 seconds');
    back.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 4 12l7 7"/><path d="M20 5l-7 7 7 7"/></svg><span>15</span>';

    var fwd = document.createElement('button');
    fwd.type = 'button';
    fwd.className = 'wave-skip';
    fwd.setAttribute('aria-label', 'Forward 15 seconds');
    fwd.innerHTML = '<span>15</span><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M13 5l7 7-7 7"/><path d="M4 5l7 7-7 7"/></svg>';

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

    row.appendChild(back);
    row.appendChild(play);
    row.appendChild(fwd);
    row.appendChild(stage);
    card.appendChild(meta);
    card.appendChild(row);

    var knownDuration = 0;
    var actx = null, analyser = null, source = null, freq = null, raf = null;
    var levels = new Array(COLS).fill(0);
    var idle = 0;

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
      if (actx) return true;
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      try {
        actx = new AC();
        source = actx.createMediaElementSource(audio);
        analyser = actx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.72;
        analyser.minDecibels = -85;
        analyser.maxDecibels = -18;
        freq = new Uint8Array(analyser.frequencyBinCount);
        source.connect(analyser);
        analyser.connect(actx.destination);
        return true;
      } catch (err) {
        actx = null; analyser = null;
        return false;
      }
    }

    var anim = null;
    var level = 0;
    var raf = null;

    function driver() {
      raf = requestAnimationFrame(driver);
      if (!analyser || audio.paused) return;
      analyser.getByteFrequencyData(freq);
      var sum = 0, n = 0;
      for (var i = 1; i < 24 && i < freq.length; i++) { sum += freq[i]; n++; }
      var target = n ? Math.min(1, ((sum / n) / 255) * 2.8) : 0;
      level = level * 0.55 + target * 0.45;
      if (anim) anim.setSpeed(Math.max(0.25, Math.min(1.15, 0.3 + level * 0.9)));
      lottieBox.style.opacity = (0.72 + level * 0.28).toFixed(3);
      lottieBox.style.transform = 'scaleY(' + (0.96 + level * 0.12).toFixed(3) + ')';
    }

    function startLoop() { if (!raf) driver(); }
    function stopLoop() { if (raf) cancelAnimationFrame(raf); raf = null; level = 0; if (anim) anim.setSpeed(1); lottieBox.style.transform = ''; }

    play.addEventListener('click', async function () {
      if (audio.paused) {
        if (setupAnalyser() && actx.state !== 'running') {
          try { await actx.resume(); } catch (e) {}
        }
        audio.play();
      } else {
        audio.pause();
      }
    });

    audio.addEventListener('play', function () {
      card.classList.add('is-playing');
      play.setAttribute('aria-label', 'Pause audio');
      play.innerHTML = '<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z"/></svg>';
      if (setupAnalyser() && actx.state === 'suspended') actx.resume();
      if (anim) anim.play();
      startLoop();
    });
    audio.addEventListener('pause', function () {
      card.classList.remove('is-playing');
      if (anim) anim.pause();
      stopLoop();
      play.setAttribute('aria-label', 'Play audio');
      play.innerHTML = '<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13l11-6.5z"/></svg>';
    });
    audio.addEventListener('ended', function () { progress(); });
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
    back.addEventListener('click', function () {
      audio.currentTime = Math.max(0, audio.currentTime - 15);
      progress();
    });
    fwd.addEventListener('click', function () {
      audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 15);
      progress();
    });
    stage.addEventListener('click', seek);
    stage.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 10);
      if (e.key === 'ArrowLeft') audio.currentTime = Math.max(0, audio.currentTime - 10);
    });

    progress();
    startLoop();

    /* attach the animation as soon as it is available */
    WAVE.then(function (data) {
      if (!window.lottie || anim) return;
      anim = window.lottie.loadAnimation({
        container: lottieBox, renderer: 'svg', loop: true, autoplay: false,
        animationData: data,
        rendererSettings: { preserveAspectRatio: 'xMidYMid slice' }
      });
      if (!audio.paused) anim.play();
    }).catch(function () {});
  }

  function upgrade(card) {
    if (card.getAttribute('data-wave') === 'on') return;
    var audio = card.querySelector('audio');
    if (!audio) return;
    card.setAttribute('data-wave', 'on');
    audio.removeAttribute('controls');
    audio.style.cssText = 'position:absolute;width:1px;height:1px;opacity:0;pointer-events:none;';
    try { build(card, audio); }
    catch (err) { audio.setAttribute('controls', ''); audio.style.display = ''; }
  }

  function init() {
    var cards = document.querySelectorAll('.audio-card');
    for (var i = 0; i < cards.length; i++) upgrade(cards[i]);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  /* the card is inserted by article-audio.js after its fetch: catch it the
     moment it appears instead of polling on a timer */
  if (window.MutationObserver) {
    new MutationObserver(function (muts) {
      for (var i = 0; i < muts.length; i++) {
        var added = muts[i].addedNodes;
        for (var j = 0; j < added.length; j++) {
          var n = added[j];
          if (n.nodeType !== 1) continue;
          if (n.classList && n.classList.contains('audio-card')) upgrade(n);
          else if (n.querySelector && n.querySelector('.audio-card')) upgrade(n.querySelector('.audio-card'));
        }
      }
    }).observe(document.body, { childList: true, subtree: true });
  }
})();
