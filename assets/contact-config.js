/* Email endpoint for the contact form.
   Default: Supabase Edge Function (supabase/functions/contact) which sends via Resend.
   Change the endpoint only if you move the backend elsewhere. */
window.SUGARY_CONTACT = {
  endpoint: 'https://ckzpdfqewmzbekndleji.supabase.co/functions/v1/contact',
  web3formsKey: '',
  fallbackEmail: ''
};
