/**
 * Sugary Citrus — contact form endpoint (Cloudflare Worker + Resend)
 *
 * Environment variables (set with `wrangler secret put` / wrangler.toml):
 *   RESEND_API_KEY  secret  — from https://resend.com/api-keys
 *   TO_EMAIL        var     — where enquiries should land
 *   FROM_EMAIL      var     — verified sender, e.g. "Sugary Citrus <hello@sugarycitrus.co>"
 *   ALLOWED_ORIGIN  var     — your site origin, e.g. https://yash131206.github.io
 */

function cors(origin) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400'
  };
}

const esc = (s = '') => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export default {
  async fetch(request, env) {
    const origin = env.ALLOWED_ORIGIN || '*';
    const headers = cors(origin);

    if (request.method === 'OPTIONS') return new Response(null, { headers });
    if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405, headers);

    let data;
    try { data = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400, headers); }

    // simple spam traps: honeypot field + minimum message length
    if (data.bot) return json({ ok: true }, 200, headers);
    const name = (data.name || '').trim();
    const email = (data.email || '').trim();
    const message = (data.message || '').trim();
    if (!name || !email || !message) return json({ error: 'Name, email and message are required' }, 400, headers);
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ error: 'That email address looks wrong' }, 400, headers);

    const subject = `New enquiry — ${(data.company || name).slice(0, 80)}`;
    const rows = [
      ['Name', name], ['Email', email], ['Brand / company', data.company || '—'],
      ['Needs help with', data.service || '—'], ['Message', message]
    ];

    const html = `<div style="font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;color:#1B1B1B;line-height:1.6">
      <h2 style="margin:0 0 4px;letter-spacing:-.02em">New enquiry</h2>
      <p style="margin:0 0 18px;color:#6c6862;font-size:13px">Sent from sugarycitrus website</p>
      <table cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:14px">
        ${rows.map(([k, v]) => `<tr>
          <td style="padding:8px 18px 8px 0;vertical-align:top;color:#6c6862;white-space:nowrap">${esc(k)}</td>
          <td style="padding:8px 0;vertical-align:top">${esc(v).replace(/\n/g, '<br>')}</td>
        </tr>`).join('')}
      </table>
      <p style="margin:22px 0 0"><a href="mailto:${esc(email)}" style="background:#1B1B1B;color:#F9F2E4;padding:11px 18px;border-radius:100px;text-decoration:none;font-size:13px">Reply to ${esc(name)}</a></p>
    </div>`;

    const send = (payload) => fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const primary = await send({
      from: env.FROM_EMAIL,
      to: [env.TO_EMAIL],
      reply_to: email,
      subject,
      html
    });

    if (!primary.ok) {
      const detail = await primary.text();
      return json({ error: 'Email service rejected the message', detail: detail.slice(0, 300) }, 502, headers);
    }

    // optional auto-reply to the sender (fails silently)
    if (env.SEND_AUTOREPLY === 'true') {
      await send({
        from: env.FROM_EMAIL,
        to: [email],
        subject: 'We got your note — Sugary Citrus',
        html: `<div style="font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;color:#1B1B1B;line-height:1.7">
          <p>Hi ${esc(name.split(' ')[0])},</p>
          <p>Thanks for writing in. We have your message and will reply within two working days.</p>
          <p style="color:#6c6862;font-size:13px">For reference, this is what you sent:</p>
          <blockquote style="margin:0;padding:12px 16px;border-left:3px solid #FF5520;color:#4f4b45;font-size:13px">${esc(message).replace(/\n/g, '<br>')}</blockquote>
          <p style="margin-top:22px">— Sugary Citrus<br><span style="color:#6c6862;font-size:12px">Sweet Strategy. Sharp Execution.</span></p>
        </div>`
      }).catch(() => {});
    }

    return json({ ok: true }, 200, headers);
  }
};

function json(body, status, headers) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json' }
  });
}
