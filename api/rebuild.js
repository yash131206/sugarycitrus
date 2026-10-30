/** Vercel serverless endpoint. Only a signed-in CMS admin can trigger a rebuild. */
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  const hook = process.env.VERCEL_DEPLOY_HOOK_URL;
  if (!token || !url || !key || !hook) return res.status(503).json({ error: 'Rebuild service is not configured.' });
  try {
    const base = url.replace(/\/$/,'');
    const auth = await fetch(`${base}/auth/v1/user`, { headers: { apikey: key, Authorization: `Bearer ${token}` } });
    if (!auth.ok) return res.status(401).json({ error: 'Valid admin session required.' });
    const user = await auth.json();
    const check = await fetch(`${base}/rest/v1/cms_admins?select=user_id&user_id=eq.${encodeURIComponent(user.id)}`, { headers: { apikey: key, Authorization: `Bearer ${token}` } });
    if (!check.ok) return res.status(403).json({ error: 'Could not verify CMS administrator.' });
    const admins = await check.json();
    if (!Array.isArray(admins) || admins.length !== 1) return res.status(403).json({ error: 'CMS administrator access required.' });
    const deploy = await fetch(hook, { method: 'POST' });
    if (!deploy.ok) return res.status(502).json({ error: 'Vercel rebuild request failed.' });
    return res.status(202).json({ ok: true, message: 'Production rebuild requested.' });
  } catch (error) {
    return res.status(500).json({ error: 'Could not trigger rebuild.' });
  }
};
