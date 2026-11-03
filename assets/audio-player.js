/* Sugary Citrus audio player.
   The wave is a dot grid drawn on a canvas and driven by the real audio
   spectrum: each column of dots follows one frequency band, so the shape
   tracks the voice instead of looping on a timer. No animation library and
   no extra JSON to download, which is why the card is interactive at once. */
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

    var canvas = document.createElement('canvas');
    canvas.className = 'wave-canvas';
    stage.appendChild(canvas);

    var fill = document.createElement('span');
    fill.className = 'wave-line';
    fill.innerHTML = '<i></i>';
    stage.appendChild(fill);

    row.appendChild(play);
    row.appendChild(stage);
    card.appendChild(meta);
    card.appendChild(row);

    var ctx2d = canvas.getContext('2d');
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var w = 0, h = 0;

    function size() {
      var r = stage.getBoundingClientRect();
      w = Math.max(1, Math.round(r.width));
      h = Math.max(1, Math.round(r.height));
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    size();
    window.addEventListener('resize', size);

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

    function paint() {
      ctx2d.clearRect(0, 0, w, h);

      var colW = w / COLS;
      var gapY = h / (ROWS + 1);
      var baseR = Math.max(1.1, Math.min(2.4, colW * 0.16));
      var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      var idleCol = isDark ? 'rgba(249,242,228,0.22)' : 'rgba(249,242,228,0.30)';
      var hot = 'rgb(255,85,32)';

      for (var c = 0; c < COLS; c++) {
        var lv = levels[c];
        var cx = colW * c + colW / 2;
        for (var r = 0; r < ROWS; r++) {
          var cy = gapY * (r + 1);
          var rad = baseR + lv * baseR * 1.9;
          ctx2d.beginPath();
          ctx2d.arc(cx, cy, rad, 0, Math.PI * 2);
          if (lv > 0.04) {
            ctx2d.fillStyle = hot;
            ctx2d.globalAlpha = 0.45 + Math.min(0.55, lv);
          } else {
            ctx2d.fillStyle = idleCol;
            ctx2d.globalAlpha = 1;
          }
          ctx2d.fill();
        }
      }
      ctx2d.globalAlpha = 1;
    }

    function loop() {
      raf = requestAnimationFrame(loop);
      idle += 0.05;

      if (analyser && !audio.paused) {
        analyser.getByteFrequencyData(freq);
        /* map the 30 columns across the bands that carry speech, skipping DC */
        var usable = Math.min(freq.length - 1, 96);
        for (var c = 0; c < COLS; c++) {
          var from = Math.floor((c / COLS) * usable) + 1;
          var to = Math.max(from + 1, Math.floor(((c + 1) / COLS) * usable) + 1);
          var sum = 0, n = 0;
          for (var i = from; i < to && i < freq.length; i++) { sum += freq[i]; n++; }
          var target = n ? (sum / n) / 255 : 0;
          target = Math.min(1, Math.pow(target, 0.72) * 2.1);
          levels[c] = levels[c] * 0.62 + target * 0.38;
        }
      } else {
        /* paused: a slow breath so the grid never looks dead */
        for (var k = 0; k < COLS; k++) {
          var wave = 0.5 + 0.5 * Math.sin(idle * 0.6 + k * 0.35);
          levels[k] = levels[k] * 0.86 + (0.05 + wave * 0.07) * 0.14;
        }
      }
      paint();
    }

    function startLoop() { if (!raf) loop(); }
    function stopLoop() { if (raf) cancelAnimationFrame(raf); raf = null; }

    play.addEventListener('click', function () {
      if (audio.paused) {
        if (setupAnalyser() && actx.state === 'suspended') actx.resume();
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
      startLoop();
    });
    audio.addEventListener('pause', function () {
      card.classList.remove('is-playing');
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
    stage.addEventListener('click', seek);
    stage.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 10);
      if (e.key === 'ArrowLeft') audio.currentTime = Math.max(0, audio.currentTime - 10);
    });

    progress();
    startLoop();
  }

  function upgrade(card) {
    if (card.getAttribute('data-wave') === 'on') return;
    var audio = card.querySelector('audio');
    if (!audio) return;
    card.setAttribute('data-wave', 'on');
    audio.removeAttribute('controls');
    audio.style.display = 'none';
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
