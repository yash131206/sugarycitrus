(function () {
  const form = document.querySelector('.form');
  if (!form) return;
  const status = document.getElementById('form-status');
  const cfg = window.SUGARY_CONTACT || {};
  const button = form.querySelector('button[type="submit"]');

  function say(msg, bad) {
    if (!status) return;
    status.textContent = msg;
    status.style.color = bad ? '#B3261E' : '';
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    const subject = 'New enquiry — ' + (data.company || data.name || 'website');

    if (cfg.web3formsKey) {
      await send('https://api.web3forms.com/submit', {
        access_key: cfg.web3formsKey,
        subject: subject,
        from_name: 'Sugary Citrus website',
        ...data
      });
    } else if (cfg.endpoint) {
      await send(cfg.endpoint, data);
    } else if (cfg.fallbackEmail) {
      const body = Object.entries(data).map(([k, v]) => k + ': ' + v).join('\n');
      location.href = 'mailto:' + cfg.fallbackEmail + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
      say('Opening your email app…');
    } else {
      say('The form is not connected yet. Add a Web3Forms key or your own endpoint in assets/contact-config.js.', true);
    }

    async function send(url, payload) {
      const original = button ? button.innerHTML : '';
      if (button) { button.disabled = true; button.innerHTML = 'Sending…'; }
      say('Sending…');
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        form.reset();
        say('Thanks — your enquiry is in. We reply within two working days.');
      } catch (err) {
        say('Sorry, that did not send (' + err.message + '). Email us directly instead.', true);
      } finally {
        if (button) { button.disabled = false; button.innerHTML = original; }
      }
    }
  });
})();

/* brand-coloured dropdown */
(function () {
  document.querySelectorAll('[data-select]').forEach(function (root) {
    const trigger = root.querySelector('.select-trigger');
    const valueEl = root.querySelector('.select-value');
    const menu = root.querySelector('.select-menu');
    const input = root.querySelector('input[type="hidden"]');
    if (!trigger || !menu || !input) return;
    const options = [...menu.querySelectorAll('[role="option"]')];

    function open() {
      root.classList.add('is-open');
      trigger.setAttribute('aria-expanded', 'true');
      const sel = options.find(o => o.getAttribute('aria-selected') === 'true') || options[0];
      if (sel) sel.focus();
    }
    function close() {
      root.classList.remove('is-open');
      trigger.setAttribute('aria-expanded', 'false');
    }
    function choose(opt) {
      options.forEach(o => o.setAttribute('aria-selected', o === opt ? 'true' : 'false'));
      input.value = opt.dataset.value;
      valueEl.textContent = opt.dataset.value;
      close();
      trigger.focus();
    }

    trigger.addEventListener('click', function (e) {
      e.stopPropagation();
      root.classList.contains('is-open') ? close() : open();
    });
    options.forEach(function (opt) {
      opt.addEventListener('click', function () { choose(opt); });
      opt.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(opt); }
        if (e.key === 'ArrowDown') { e.preventDefault(); (opt.nextElementSibling || options[0]).focus(); }
        if (e.key === 'ArrowUp') { e.preventDefault(); (opt.previousElementSibling || options[options.length - 1]).focus(); }
        if (e.key === 'Escape') { close(); trigger.focus(); }
      });
    });
    trigger.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
      if (e.key === 'Escape') close();
    });
    document.addEventListener('click', function (e) { if (!root.contains(e.target)) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  });
})();
