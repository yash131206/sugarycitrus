
/* ---- disposable / temporary email protection (v6.3) ---- */
(function () {
  const BLOCKED = new Set([
  '10minutemail.com',
  '10minutemail.net',
  '10minutemail.org',
  '20minutemail.com',
  '24hourmail.com',
  'anonbox.net',
  'anonmail.de',
  'antispam.de',
  'binkmail.com',
  'bobmail.info',
  'bofthew.com',
  'bogusmail.com',
  'bugmenot.com',
  'bumpymail.com',
  'bunnyban.com',
  'burnermail.io',
  'cool.fr.nf',
  'deadaddress.com',
  'despam.it',
  'despammed.com',
  'devnullmail.com',
  'dingbone.com',
  'discard.email',
  'discardmail.com',
  'disposableaddress.com',
  'disposableemailaddresses.com',
  'disposableinbox.com',
  'dispostable.com',
  'ditchmail.com',
  'dodgit.com',
  'dontreg.com',
  'dump-email.info',
  'dumpandjunk.com',
  'e4ward.com',
  'email60.com',
  'emailgo.de',
  'emailias.com',
  'emailinfive.com',
  'emailondeck.com',
  'emailtemporanea.com',
  'emailtemporario.com.br',
  'emailthe.net',
  'emailtmp.com',
  'emailwarden.com',
  'enterto.com',
  'ephemail.net',
  'etranquil.com',
  'evopo.com',
  'explodemail.com',
  'fakeinbox.com',
  'fastacura.com',
  'fastchevy.com',
  'fastchrysler.com',
  'fastkawasaki.com',
  'fastmazda.com',
  'fastmitsubishi.com',
  'fastnissan.com',
  'fastsubaru.com',
  'fastsuzuki.com',
  'fasttoyota.com',
  'fastyamaha.com',
  'filzmail.com',
  'fleckens.hu',
  'fr33mail.info',
  'frapmail.com',
  'friendlymail.co',
  'garbagemail.org',
  'get1mail.com',
  'get2mail.fr',
  'getairmail.com',
  'getnada.com',
  'getonemail.com',
  'girlsundertheinfluence.com',
  'gishpuppy.com',
  'gowikibooks.com',
  'great-host.in',
  'grr.la',
  'guerrillamail.com',
  'guerrillamail.de',
  'guerrillamail.net',
  'guerrillamail.org',
  'haltospam.com',
  'harakirimail.com',
  'herp.in',
  'hidemail.de',
  'hotpop.com',
  'ieatspam.eu',
  'imails.info',
  'inboxalias.com',
  'incognitomail.com',
  'incognitomail.net',
  'incognitomail.org',
  'insorg-mail.info',
  'ipoo.org',
  'irish2me.com',
  'jetable.com',
  'jetable.fr.nf',
  'jetable.net',
  'jetable.org',
  'junkmail.com',
  'junkmail.notsharklasers.com',
  'kasmail.com',
  'klassmaster.com',
  'klassmaster.net',
  'klzlk.com',
  'koszmail.pl',
  'kurzepost.de',
  'letthemeatspam.com',
  'lifesanemail.net',
  'link2mail.net',
  'lortemail.dk',
  'lr78.com',
  'maboard.com',
  'mail-temporaire.fr',
  'mail.mezimages.net',
  'mailboxy.com',
  'mailcatch.com',
  'maildrop.cc',
  'maileater.com',
  'mailexpire.com',
  'mailforspam.com',
  'mailimate.com',
  'mailin8r.com',
  'mailinater.com',
  'mailinator.com',
  'mailinator.net',
  'mailinator.us',
  'mailinator2.com',
  'mailincubator.com',
  'mailismagic.com',
  'mailme.ir',
  'mailme.lv',
  'mailmetrash.com',
  'mailmoat.com',
  'mailnator.com',
  'mailnesia.com',
  'mailnull.com',
  'mailsac.com',
  'mailscrap.com',
  'mailshell.com',
  'mailsiphon.com',
  'mailslite.com',
  'mailtemp.info',
  'mailzilla.com',
  'mega.zik.dj',
  'meltmail.com',
  'messagebeamer.de',
  'mezimages.net',
  'mierdamail.com',
  'mintemail.com',
  'mobileninja.co.uk',
  'mohmal.com',
  'moncourrier.fr.nf',
  'monemail.fr.nf',
  'monmail.fr.nf',
  'mt2009.com',
  'mycleaninbox.net',
  'mytemp.email',
  'mytempemail.com',
  'mytrashmail.com',
  'nada.email',
  'neverbox.com',
  'no-spam.ws',
  'nobulk.com',
  'noclickemail.com',
  'nogmailspam.info',
  'nomail.pw',
  'nomail.xl.cx',
  'nospam.ze.tc',
  'notmailinator.com',
  'nowmymail.com',
  'objectmail.com',
  'obobbo.com',
  'oneoffemail.com',
  'onewaymail.com',
  'owlpic.com',
  'pjjkp.com',
  'politikerclub.de',
  'pookmail.com',
  'privacy.net',
  'proxymail.eu',
  'punkass.com',
  'putthisinyourspamdatabase.com',
  'quickinbox.com',
  'rcpt.at',
  'recode.me',
  'recursor.net',
  'regbypass.com',
  'rejectmail.com',
  'rmqkr.net',
  'rppkn.com',
  'rtrtr.com',
  'safe-mail.net',
  'sandelf.de',
  'saynotospams.com',
  'selfdestructingmail.com',
  'sendspamhere.com',
  'sharklasers.com',
  'shiftmail.com',
  'shitmail.me',
  'shortmail.net',
  'sibmail.com',
  'skepticism.org',
  'slapsfromlastnight.com',
  'slaskpost.se',
  'smellymail.com',
  'snakemail.com',
  'sneakemail.com',
  'soodonims.com',
  'spam.la',
  'spam.su',
  'spam4.me',
  'spamavert.com',
  'spambob.com',
  'spambob.net',
  'spambob.org',
  'spambog.com',
  'spambog.de',
  'spambog.ru',
  'spambox.info',
  'spambox.us',
  'spamcannon.com',
  'spamcannon.net',
  'spamcon.org',
  'spamcorptastic.com',
  'spamcowboy.com',
  'spamcowboy.net',
  'spamcowboy.org',
  'spamday.com',
  'spamex.com',
  'spamfree.eu',
  'spamfree24.de',
  'spamfree24.org',
  'spamgoes.in',
  'spamgourmet.com',
  'spamgourmet.net',
  'spamherelots.com',
  'spamify.com',
  'spaminator.de',
  'spamkill.info',
  'spaml.com',
  'spaml.de',
  'spamlot.net',
  'spammotel.com',
  'spamobox.com',
  'spamoff.de',
  'spamslicer.com',
  'spamspot.com',
  'spamthis.co.uk',
  'spamtrail.com',
  'spiderdail.com',
  'supergreatmail.com',
  'supermailer.jp',
  'superrito.com',
  'suremail.info',
  'teewars.org',
  'teleworm.com',
  'teleworm.us',
  'temp-mail.io',
  'temp-mail.org',
  'tempail.com',
  'tempalias.com',
  'tempemail.biz',
  'tempemail.com',
  'tempemail.net',
  'tempinbox.co.uk',
  'tempinbox.com',
  'tempmail.com',
  'tempmail.net',
  'tempmail.org',
  'tempmailer.com',
  'tempmailer.de',
  'tempmailo.com',
  'tempomail.fr',
  'tempr.email',
  'tempsky.com',
  'tempthe.net',
  'thankyou2010.com',
  'thelimestones.com',
  'thisisnotmyrealemail.com',
  'throam.com',
  'throwaway.email',
  'throwawayinbox.com',
  'throwawaymail.com',
  'throwawaymailbox.com',
  'tiltblog.com',
  'tmail.com',
  'tmail.ws',
  'tmailinator.com',
  'tmpmail.net',
  'tmpmail.org',
  'tradermail.info',
  'trash-amil.com',
  'trash-mail.at',
  'trash-mail.com',
  'trash-mail.de',
  'trash2009.com',
  'trashdevil.com',
  'trashdevil.de',
  'trashemail.de',
  'trashmail.at',
  'trashmail.com',
  'trashmail.de',
  'trashmail.me',
  'trashmail.net',
  'trashmail.org',
  'trillianpro.com',
  'turual.com',
  'tweakly.com',
  'tyldd.com',
  'uggsrock.com',
  'venompen.com',
  'veryrealemail.com',
  'viditag.com',
  'viewcastmedia.com',
  'viewcastmedia.net',
  'viewcastmedia.org',
  'vtmpmail.com',
  'webemail.me',
  'wegwerfmail.de',
  'wegwerfmail.net',
  'wegwerfmail.org',
  'wegwerpmailadres.nl',
  'wetrainbayarea.com',
  'wh4f.org',
  'whopy.com',
  'whyspam.me',
  'wilemail.com',
  'willhackforfood.biz',
  'willselfdestruct.com',
  'winemaven.info',
  'wronghead.com',
  'wuzup.net',
  'xagloo.co',
  'xagloo.com',
  'xemaps.com',
  'xents.com',
  'xmaily.com',
  'xoxy.net',
  'yep.it',
  'yogamaven.com',
  'yopmail.com',
  'yopmail.fr',
  'yopmail.gq',
  'yopmail.ml',
  'yopmail.net',
  'zetmail.com',
  'zippymail.info',
  'zoemail.com',
  'zoemail.net',
  'zoemail.org',
  'zomg.info'
  ]);
  const HINTS = ['tempmail', 'temp-mail', '10minute', 'guerrillamail', 'throwaway', 'trashmail',
                 'disposable', 'fakeinbox', 'mailinator', 'yopmail', 'getnada', 'maildrop',
                 'spamgourmet', 'burnermail', 'mintemail', 'tempr.email', 'sharklasers'];
  window.isDisposableEmail = function (email) {
    const at = String(email || '').lastIndexOf('@');
    if (at === -1) return false;
    const domain = String(email).slice(at + 1).toLowerCase().trim();
    if (!domain) return false;
    if (BLOCKED.has(domain)) return true;
    // catch sub-domains of blocked hosts and look-alike names
    const parts = domain.split('.');
    for (let i = 0; i < parts.length - 1; i++) {
      if (BLOCKED.has(parts.slice(i).join('.'))) return true;
    }
    return HINTS.some(h => domain.includes(h));
  };
})();
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
    if (window.isDisposableEmail && window.isDisposableEmail(data.email)) {
      say('Please use a permanent email address — temporary inboxes are blocked.', true);
      const field = document.getElementById('email');
      if (field) field.focus();
      return;
    }
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
        if (!res.ok) {
          let detail = '';
          try { const body = await res.json(); detail = body.error || ''; } catch (e) {}
          throw new Error(detail || 'HTTP ' + res.status);
        }
        form.reset();
        say('Thanks — your enquiry is in. Taking you to the confirmation page…');
        setTimeout(function () { location.href = 'thank-you'; }, 700);
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
