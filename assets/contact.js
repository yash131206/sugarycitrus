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
