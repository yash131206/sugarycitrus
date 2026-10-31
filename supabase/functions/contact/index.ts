// Sugary Citrus — contact form endpoint (Supabase Edge Function + Resend)
// Public endpoint: verify_jwt is off because the website is static.
// The Resend key lives in private_config, readable only by service_role.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const ALLOWED_ORIGINS = [
  "https://yash131206.github.io",
  "http://localhost:8899",
  "http://127.0.0.1:8899"
];

const BLOCKED = new Set([
"10minutemail.com",
  "10minutemail.net",
  "10minutemail.org",
  "20minutemail.com",
  "24hourmail.com",
  "anonbox.net",
  "anonmail.de",
  "antispam.de",
  "binkmail.com",
  "bobmail.info",
  "bofthew.com",
  "bogusmail.com",
  "bugmenot.com",
  "bumpymail.com",
  "bunnyban.com",
  "burnermail.io",
  "cool.fr.nf",
  "deadaddress.com",
  "despam.it",
  "despammed.com",
  "devnullmail.com",
  "dingbone.com",
  "discard.email",
  "discardmail.com",
  "disposableaddress.com",
  "disposableemailaddresses.com",
  "disposableinbox.com",
  "dispostable.com",
  "ditchmail.com",
  "dodgit.com",
  "dontreg.com",
  "dump-email.info",
  "dumpandjunk.com",
  "e4ward.com",
  "email60.com",
  "emailgo.de",
  "emailias.com",
  "emailinfive.com",
  "emailondeck.com",
  "emailtemporanea.com",
  "emailtemporario.com.br",
  "emailthe.net",
  "emailtmp.com",
  "emailwarden.com",
  "enterto.com",
  "ephemail.net",
  "etranquil.com",
  "evopo.com",
  "explodemail.com",
  "fakeinbox.com",
  "fastacura.com",
  "fastchevy.com",
  "fastchrysler.com",
  "fastkawasaki.com",
  "fastmazda.com",
  "fastmitsubishi.com",
  "fastnissan.com",
  "fastsubaru.com",
  "fastsuzuki.com",
  "fasttoyota.com",
  "fastyamaha.com",
  "filzmail.com",
  "fleckens.hu",
  "fr33mail.info",
  "frapmail.com",
  "friendlymail.co",
  "garbagemail.org",
  "get1mail.com",
  "get2mail.fr",
  "getairmail.com",
  "getnada.com",
  "getonemail.com",
  "girlsundertheinfluence.com",
  "gishpuppy.com",
  "gowikibooks.com",
  "great-host.in",
  "grr.la",
  "guerrillamail.com",
  "guerrillamail.de",
  "guerrillamail.net",
  "guerrillamail.org",
  "haltospam.com",
  "harakirimail.com",
  "herp.in",
  "hidemail.de",
  "hotpop.com",
  "ieatspam.eu",
  "imails.info",
  "inboxalias.com",
  "incognitomail.com",
  "incognitomail.net",
  "incognitomail.org",
  "insorg-mail.info",
  "ipoo.org",
  "irish2me.com",
  "jetable.com",
  "jetable.fr.nf",
  "jetable.net",
  "jetable.org",
  "junkmail.com",
  "junkmail.notsharklasers.com",
  "kasmail.com",
  "klassmaster.com",
  "klassmaster.net",
  "klzlk.com",
  "koszmail.pl",
  "kurzepost.de",
  "letthemeatspam.com",
  "lifesanemail.net",
  "link2mail.net",
  "lortemail.dk",
  "lr78.com",
  "maboard.com",
  "mail-temporaire.fr",
  "mail.mezimages.net",
  "mailboxy.com",
  "mailcatch.com",
  "maildrop.cc",
  "maileater.com",
  "mailexpire.com",
  "mailforspam.com",
  "mailimate.com",
  "mailin8r.com",
  "mailinater.com",
  "mailinator.com",
  "mailinator.net",
  "mailinator.us",
  "mailinator2.com",
  "mailincubator.com",
  "mailismagic.com",
  "mailme.ir",
  "mailme.lv",
  "mailmetrash.com",
  "mailmoat.com",
  "mailnator.com",
  "mailnesia.com",
  "mailnull.com",
  "mailsac.com",
  "mailscrap.com",
  "mailshell.com",
  "mailsiphon.com",
  "mailslite.com",
  "mailtemp.info",
  "mailzilla.com",
  "mega.zik.dj",
  "meltmail.com",
  "messagebeamer.de",
  "mezimages.net",
  "mierdamail.com",
  "mintemail.com",
  "mobileninja.co.uk",
  "mohmal.com",
  "moncourrier.fr.nf",
  "monemail.fr.nf",
  "monmail.fr.nf",
  "mt2009.com",
  "mycleaninbox.net",
  "mytemp.email",
  "mytempemail.com",
  "mytrashmail.com",
  "nada.email",
  "neverbox.com",
  "no-spam.ws",
  "nobulk.com",
  "noclickemail.com",
  "nogmailspam.info",
  "nomail.pw",
  "nomail.xl.cx",
  "nospam.ze.tc",
  "notmailinator.com",
  "nowmymail.com",
  "objectmail.com",
  "obobbo.com",
  "oneoffemail.com",
  "onewaymail.com",
  "owlpic.com",
  "pjjkp.com",
  "politikerclub.de",
  "pookmail.com",
  "privacy.net",
  "proxymail.eu",
  "punkass.com",
  "putthisinyourspamdatabase.com",
  "quickinbox.com",
  "rcpt.at",
  "recode.me",
  "recursor.net",
  "regbypass.com",
  "rejectmail.com",
  "rmqkr.net",
  "rppkn.com",
  "rtrtr.com",
  "safe-mail.net",
  "sandelf.de",
  "saynotospams.com",
  "selfdestructingmail.com",
  "sendspamhere.com",
  "sharklasers.com",
  "shiftmail.com",
  "shitmail.me",
  "shortmail.net",
  "sibmail.com",
  "skepticism.org",
  "slapsfromlastnight.com",
  "slaskpost.se",
  "smellymail.com",
  "snakemail.com",
  "sneakemail.com",
  "soodonims.com",
  "spam.la",
  "spam.su",
  "spam4.me",
  "spamavert.com",
  "spambob.com",
  "spambob.net",
  "spambob.org",
  "spambog.com",
  "spambog.de",
  "spambog.ru",
  "spambox.info",
  "spambox.us",
  "spamcannon.com",
  "spamcannon.net",
  "spamcon.org",
  "spamcorptastic.com",
  "spamcowboy.com",
  "spamcowboy.net",
  "spamcowboy.org",
  "spamday.com",
  "spamex.com",
  "spamfree.eu",
  "spamfree24.de",
  "spamfree24.org",
  "spamgoes.in",
  "spamgourmet.com",
  "spamgourmet.net",
  "spamherelots.com",
  "spamify.com",
  "spaminator.de",
  "spamkill.info",
  "spaml.com",
  "spaml.de",
  "spamlot.net",
  "spammotel.com",
  "spamobox.com",
  "spamoff.de",
  "spamslicer.com",
  "spamspot.com",
  "spamthis.co.uk",
  "spamtrail.com",
  "spiderdail.com",
  "supergreatmail.com",
  "supermailer.jp",
  "superrito.com",
  "suremail.info",
  "teewars.org",
  "teleworm.com",
  "teleworm.us",
  "temp-mail.io",
  "temp-mail.org",
  "tempail.com",
  "tempalias.com",
  "tempemail.biz",
  "tempemail.com",
  "tempemail.net",
  "tempinbox.co.uk",
  "tempinbox.com",
  "tempmail.com",
  "tempmail.net",
  "tempmail.org",
  "tempmailer.com",
  "tempmailer.de",
  "tempmailo.com",
  "tempomail.fr",
  "tempr.email",
  "tempsky.com",
  "tempthe.net",
  "thankyou2010.com",
  "thelimestones.com",
  "thisisnotmyrealemail.com",
  "throam.com",
  "throwaway.email",
  "throwawayinbox.com",
  "throwawaymail.com",
  "throwawaymailbox.com",
  "tiltblog.com",
  "tmail.com",
  "tmail.ws",
  "tmailinator.com",
  "tmpmail.net",
  "tmpmail.org",
  "tradermail.info",
  "trash-amil.com",
  "trash-mail.at",
  "trash-mail.com",
  "trash-mail.de",
  "trash2009.com",
  "trashdevil.com",
  "trashdevil.de",
  "trashemail.de",
  "trashmail.at",
  "trashmail.com",
  "trashmail.de",
  "trashmail.me",
  "trashmail.net",
  "trashmail.org",
  "trillianpro.com",
  "turual.com",
  "tweakly.com",
  "tyldd.com",
  "uggsrock.com",
  "venompen.com",
  "veryrealemail.com",
  "viditag.com",
  "viewcastmedia.com",
  "viewcastmedia.net",
  "viewcastmedia.org",
  "vtmpmail.com",
  "webemail.me",
  "wegwerfmail.de",
  "wegwerfmail.net",
  "wegwerfmail.org",
  "wegwerpmailadres.nl",
  "wetrainbayarea.com",
  "wh4f.org",
  "whopy.com",
  "whyspam.me",
  "wilemail.com",
  "willhackforfood.biz",
  "willselfdestruct.com",
  "winemaven.info",
  "wronghead.com",
  "wuzup.net",
  "xagloo.co",
  "xagloo.com",
  "xemaps.com",
  "xents.com",
  "xmaily.com",
  "xoxy.net",
  "yep.it",
  "yogamaven.com",
  "yopmail.com",
  "yopmail.fr",
  "yopmail.gq",
  "yopmail.ml",
  "yopmail.net",
  "zetmail.com",
  "zippymail.info",
  "zoemail.com",
  "zoemail.net",
  "zoemail.org",
  "zomg.info"
]);

const HINTS = ["tempmail", "temp-mail", "10minute", "guerrillamail", "throwaway", "trashmail",
  "disposable", "fakeinbox", "mailinator", "yopmail", "getnada", "maildrop",
  "spamgourmet", "burnermail", "mintemail", "tempr.email", "sharklasers"];

function isDisposable(email: string): boolean {
  const at = email.lastIndexOf("@");
  if (at === -1) return false;
  const domain = email.slice(at + 1).toLowerCase().trim();
  if (!domain) return false;
  if (BLOCKED.has(domain)) return true;
  const parts = domain.split(".");
  for (let i = 0; i < parts.length - 1; i++) {
    if (BLOCKED.has(parts.slice(i).join("."))) return true;
  }
  return HINTS.some((h) => domain.includes(h));
}

const esc = (s = "") =>
  String(s).replace(/[&<>"']/g, (c) =>
    (({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" } as Record<string, string>)[c]));

function cors(origin: string) {
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, apikey, Authorization",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin"
  };
}

function json(body: unknown, status: number, headers: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, "Content-Type": "application/json" }
  });
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin") || "";
  const headers = cors(origin);

  if (req.method === "OPTIONS") return new Response(null, { headers });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405, headers);

  let data: Record<string, string>;
  try {
    data = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400, headers);
  }

  if (data.bot) return json({ ok: true }, 200, headers);

  const name = (data.name || "").trim();
  const email = (data.email || "").trim();
  const message = (data.message || "").trim();

  if (!name || !email || !message) {
    return json({ error: "Name, email and message are required" }, 400, headers);
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return json({ error: "That email address looks wrong" }, 400, headers);
  }
  if (isDisposable(email)) {
    return json({ error: "Please use a permanent email address — temporary inboxes are blocked." }, 400, headers);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: rows, error: cfgError } = await supabase
    .from("private_config")
    .select("key, value")
    .in("key", ["resend_api_key", "to_email", "from_email"]);

  if (cfgError) return json({ error: "Server configuration unreadable" }, 500, headers);

  const cfg: Record<string, string> = {};
  (rows || []).forEach((r: { key: string; value: string }) => (cfg[r.key] = r.value));

  if (!cfg.resend_api_key) {
    return json({ error: "Email is not configured yet" }, 503, headers);
  }

  const subject = `New enquiry — ${(data.company || name).slice(0, 80)}`;
  const rowsHtml = [
    ["Name", name],
    ["Email", email],
    ["Brand / company", data.company || "—"],
    ["Needs help with", data.service || "—"],
    ["Message", message]
  ]
    .map(
      ([k, v]) =>
        `<tr><td style="padding:8px 18px 8px 0;vertical-align:top;color:#6c6862;white-space:nowrap">${esc(k)}</td>` +
        `<td style="padding:8px 0;vertical-align:top">${esc(v).replace(/\n/g, "<br>")}</td></tr>`
    )
    .join("");

  const html = `<div style="font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;color:#1B1B1B;line-height:1.6">
    <h2 style="margin:0 0 4px;letter-spacing:-.02em">New enquiry</h2>
    <p style="margin:0 0 18px;color:#6c6862;font-size:13px">Sent from the Sugary Citrus website</p>
    <table cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:14px">${rowsHtml}</table>
    <p style="margin:22px 0 0"><a href="mailto:${esc(email)}" style="background:#1B1B1B;color:#F9F2E4;padding:11px 18px;border-radius:100px;text-decoration:none;font-size:13px">Reply to ${esc(name)}</a></p>
  </div>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cfg.resend_api_key}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: cfg.from_email || "Sugary Citrus <onboarding@resend.dev>",
      to: [cfg.to_email || "yashsharma96971@outlook.com"],
      reply_to: email,
      subject,
      html
    })
  });

  if (!res.ok) {
    const detail = await res.text();
    console.error("Resend error", res.status, detail);
    return json({ error: "Email service rejected the message" }, 502, headers);
  }

  return json({ ok: true }, 200, headers);
});
