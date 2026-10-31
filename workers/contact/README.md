# Contact form endpoint (Cloudflare Worker + Resend)

Sends the website enquiry form to your inbox through Resend.

## 0. Which address receives enquiries
`wrangler.toml` sends every enquiry to `yashsharma96971@outlook.com`.
Sign up to Resend with **that same address** — on the free plan, before a domain is
verified, Resend will only deliver to the address that owns the account.

## 1. Get a Resend API key
1. Sign in at https://resend.com and open **API Keys**.
2. **Create API Key** → name it `sugarycitrus-website`, permission **Sending access**.
3. Copy the key (`re_...`). It is shown once.

## 2. Deploy the Worker
```bash
cd workers/contact
npx wrangler login
npx wrangler secret put RESEND_API_KEY     # paste the re_... key
npx wrangler deploy
```
Wrangler prints the Worker URL, e.g.
`https://sugarycitrus-contact.<your-subdomain>.workers.dev`

## 3. Point the site at it
Open `assets/contact-config.js` and set:
```js
endpoint: 'https://sugarycitrus-contact.<your-subdomain>.workers.dev'
```

## 4. Send from your own domain (recommended)
1. In Resend open **Domains → Add domain**, enter `sugarycitrus.co`.
2. Add the SPF and DKIM DNS records Resend shows (Cloudflare DNS: proxy **off** for these).
3. Wait for "Verified", then set in `wrangler.toml`:
   `FROM_EMAIL = "Sugary Citrus <hello@sugarycitrus.co>"`
4. `npx wrangler deploy` again.

Until the domain is verified you can send from `onboarding@resend.dev`, but only to
the email address you signed up with.

## Optional: auto-reply
Set `SEND_AUTOREPLY = "true"` in `wrangler.toml` to email the sender a confirmation.

## Notes
- The API key lives only in the Worker secret, never in the website code.
- CORS is limited to `ALLOWED_ORIGIN`; update it when the custom domain goes live.
