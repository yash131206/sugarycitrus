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

    var grid = document.createElement('div');
    grid.className = 'wave-spectrum';
    var dots = [];
    for (var r = 0; r < ROWS; r++) {
      var line = document.createElement('div');
      line.className = 'wave-spectrum-row';
      var rowDots = [];
      for (var c = 0; c < COLS; c++) {
        var d = document.createElement('i');
        line.appendChild(d);
        rowDots.push(d);
      }
      grid.appendChild(line);
      dots.push(rowDots);
    }
    stage.appendChild(grid);

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

    var peak = 40;

    function draw() {
      raf = requestAnimationFrame(draw);
      if (!analyser) return;
      analyser.getByteFrequencyData(data);
      var bins = data.length;
      for (var c = 0; c < COLS; c++) {
        // spread the low-to-mid bins across the columns, skipping the empty top end
        var idx = Math.min(bins - 1, Math.floor(Math.pow(c / COLS, 1.45) * (bins * 0.55)));
        var raw = data[idx];
        peak = Math.max(peak * 0.985, raw, 30);
        // tilt: lift the quieter high bands so the whole row moves, like a real spectrum display
        var tilt = 1 + (c / COLS) * 2.2;
        var v = Math.min(1, (raw / peak) * tilt);
        var scale = 0.55 + v * 1.15;
        var op = 0.35 + v * 0.65;
        var top = dots[0][c], bottom = dots[1][c];
        top.style.transform = 'scale(' + scale.toFixed(3) + ')';
        top.style.opacity = op.toFixed(3);
        bottom.style.transform = 'scale(' + (scale * 0.82).toFixed(3) + ')';
        bottom.style.opacity = (op * 0.8).toFixed(3);
      }
    }

    function stopDraw() {
      if (raf) cancelAnimationFrame(raf);
      raf = null;
      for (var r = 0; r < ROWS; r++) {
        for (var c = 0; c < COLS; c++) {
          dots[r][c].style.transform = '';
          dots[r][c].style.opacity = '';
        }
      }
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
      if (setupAnalyser()) { if (ctx.state === 'suspended') ctx.resume(); if (!raf) draw(); }
    });
    audio.addEventListener('pause', function () {
      card.classList.remove('is-playing');
      play.setAttribute('aria-label', 'Play audio');
      play.innerHTML = '<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13l11-6.5z"/></svg>';
      stopDraw();
    });
    audio.addEventListener('ended', function () { stopDraw(); progress(); });
    audio.addEventListener('timeupdate', progress);
    audio.addEventListener('loadedmetadata', function () { knownDuration = audio.duration || knownDuration; progress(); });

    speed.addEventListener('change', function () { audio.playbackRate = parseFloat(speed.value); });
    stage.addEventListener('click', seek);
    stage.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 10);
      if (e.key === 'ArrowLeft') audio.currentTime = Math.max(0, audio.currentTime - 10);
    });

    progress();
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
