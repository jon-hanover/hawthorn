// Contact form endpoint for hawthorneducation.com/contact.
// Verifies the Turnstile token, then forwards the submission to an Airtable
// automation webhook that saves the record and emails Jon.
//
// Secrets (set with `wrangler secret put` or the Cloudflare dashboard):
//   TURNSTILE_SECRET      Turnstile widget secret key
//   AIRTABLE_WEBHOOK_URL  "When webhook received" URL of the Airtable automation

const ALLOWED_ORIGINS = [
  "https://hawthorneducation.com",
  "https://www.hawthorneducation.com",
];
const ALLOWED_HOSTNAMES = ["hawthorneducation.com", "www.hawthorneducation.com"];
const LIMITS = { name: 200, email: 254, organization: 200, message: 5000 };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const cors = corsHeaders(origin);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }
    if (request.method !== "POST") {
      return json({ ok: false, error: "Method not allowed" }, 405, cors);
    }
    if (!ALLOWED_ORIGINS.includes(origin)) {
      return json({ ok: false, error: "Origin not allowed" }, 403, cors);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ ok: false, error: "Invalid request" }, 400, cors);
    }

    // Honeypot: people never see this field, so anything in it is a bot.
    // Answer as if it worked so the bot learns nothing.
    if (typeof body.website === "string" && body.website.trim() !== "") {
      return json({ ok: true }, 200, cors);
    }

    const fields = {};
    for (const key of Object.keys(LIMITS)) {
      const value = typeof body[key] === "string" ? body[key].trim() : "";
      if (value.length > LIMITS[key]) {
        return json({ ok: false, error: `That ${key} is too long.` }, 400, cors);
      }
      fields[key] = value;
    }
    if (!fields.name || !fields.email || !fields.message) {
      return json({ ok: false, error: "Please fill in your name, email and message." }, 400, cors);
    }
    if (!EMAIL_RE.test(fields.email)) {
      return json({ ok: false, error: "Please check your email address." }, 400, cors);
    }

    const human = await verifyTurnstile(body.token, request, env);
    if (!human) {
      return json({ ok: false, error: "We couldn't confirm you're human. Please try again." }, 403, cors);
    }

    const forwarded = await fetch(env.AIRTABLE_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...fields, submittedAt: new Date().toISOString() }),
    });
    if (!forwarded.ok) {
      console.error("Airtable webhook failed", forwarded.status, await forwarded.text());
      return json({ ok: false, error: "Something went wrong sending your message." }, 502, cors);
    }

    return json({ ok: true }, 200, cors);
  },
};

async function verifyTurnstile(token, request, env) {
  if (typeof token !== "string" || token === "") return false;
  const form = new FormData();
  form.append("secret", env.TURNSTILE_SECRET);
  form.append("response", token);
  const ip = request.headers.get("CF-Connecting-IP");
  if (ip) form.append("remoteip", ip);

  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: form,
  });
  if (!res.ok) return false;
  const outcome = await res.json();
  // Cloudflare's always-pass test secret reports "example.com" as the hostname.
  const hostnameOk =
    ALLOWED_HOSTNAMES.includes(outcome.hostname) || outcome.hostname === "example.com";
  return outcome.success === true && hostnameOk;
}

function corsHeaders(origin) {
  const headers = {
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
  if (ALLOWED_ORIGINS.includes(origin)) headers["Access-Control-Allow-Origin"] = origin;
  return headers;
}

function json(data, status, headers) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...headers, "Content-Type": "application/json" },
  });
}
