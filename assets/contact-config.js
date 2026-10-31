/* Email endpoint for the contact form.
   Option A — Resend via the Cloudflare Worker in workers/contact (recommended).
     Deploy it, then paste the Worker URL below.
   Option B — Web3Forms: paste the access key from https://web3forms.com
   Option C — any endpoint that accepts a JSON POST and returns 2xx.
   Leave everything empty and the form shows a "not connected" message. */
window.SUGARY_CONTACT = {
  endpoint: '',          // e.g. 'https://sugarycitrus-contact.you.workers.dev'
  web3formsKey: '',      // e.g. 'a1b2c3d4-....'
  fallbackEmail: ''      // optional mailto: fallback
};
