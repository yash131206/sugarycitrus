/* Email endpoint for the contact form.
   Option A (easiest, no server): Web3Forms — paste your access key below.
     Get one free at https://web3forms.com (enter the inbox email, copy the key).
   Option B: your own endpoint (Vercel function / Cloudflare Worker / Formspree).
     Set endpoint to the full URL; it must accept JSON POST and return 2xx.
   Leave both empty and the form falls back to a mailto: link. */
window.SUGARY_CONTACT = {
  web3formsKey: '',
  endpoint: '',
  fallbackEmail: ''
};
