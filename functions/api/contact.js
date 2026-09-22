const CONTACT_EMAIL = "business@mittalsols.com";
const MAX_NAME = 120;
const MAX_EMAIL = 254;
const MAX_MESSAGE = 5000;
const MAX_COMPANY = 120;

function jsonResponse(body, status = 200, origin = "*") {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Cache-Control": "no-store",
    },
  });
}

function sanitize(value, max) {
  return String(value || "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .trim()
    .slice(0, max);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function sendWithResend(env, payload) {
  const apiKey = env.RESEND_API_KEY;
  if (!apiKey) return null;

  const to = env.CONTACT_TO_EMAIL || CONTACT_EMAIL;
  const from = env.CONTACT_FROM_EMAIL || "Mittal Solutions <onboarding@resend.dev>";

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: payload.email,
      subject: `Website inquiry from ${payload.name}`,
      text: [
        `Name: ${payload.name}`,
        `Email: ${payload.email}`,
        payload.company ? `Company: ${payload.company}` : null,
        "",
        payload.message,
      ]
        .filter(Boolean)
        .join("\n"),
      html: `
        <h2>New website inquiry</h2>
        <p><strong>Name:</strong> ${escapeHtml(payload.name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(payload.email)}</p>
        ${payload.company ? `<p><strong>Company:</strong> ${escapeHtml(payload.company)}</p>` : ""}
        <p><strong>Message:</strong></p>
        <p>${escapeHtml(payload.message).replace(/\n/g, "<br>")}</p>
      `,
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Resend error: ${res.status} ${detail}`);
  }

  return "resend";
}

async function sendWithWeb3Forms(env, payload) {
  const accessKey = env.WEB3FORMS_ACCESS_KEY;
  if (!accessKey) return null;

  const res = await fetch("https://api.web3forms.com/submit", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      access_key: accessKey,
      subject: `Website inquiry from ${payload.name}`,
      from_name: "Mittal Solutions Website",
      name: payload.name,
      email: payload.email,
      company: payload.company || "",
      message: payload.message,
      to: env.CONTACT_TO_EMAIL || CONTACT_EMAIL,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) {
    throw new Error(data.message || `Web3Forms error: ${res.status}`);
  }

  return "web3forms";
}

async function sendWithFormSubmit(payload) {
  const res = await fetch(`https://formsubmit.co/ajax/${CONTACT_EMAIL}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      name: payload.name,
      email: payload.email,
      company: payload.company || "",
      message: payload.message,
      _subject: `Website inquiry from ${payload.name}`,
      _template: "table",
      _captcha: "false",
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === "false" || data.success === false) {
    throw new Error(data.message || `FormSubmit error: ${res.status}`);
  }

  return "formsubmit";
}

export async function onRequestOptions() {
  return jsonResponse({ ok: true });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const origin = request.headers.get("Origin") || "*";

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ ok: false, error: "Invalid JSON body." }, 400, origin);
  }

  // Honeypot: bots fill this; real users leave it empty.
  if (sanitize(body.website, 200)) {
    return jsonResponse({ ok: true, message: "Thanks. We will be in touch soon." }, 200, origin);
  }

  const payload = {
    name: sanitize(body.name, MAX_NAME),
    email: sanitize(body.email, MAX_EMAIL).toLowerCase(),
    company: sanitize(body.company, MAX_COMPANY),
    message: sanitize(body.message, MAX_MESSAGE),
  };

  if (!payload.name || !payload.email || !payload.message) {
    return jsonResponse(
      { ok: false, error: "Name, email, and message are required." },
      400,
      origin
    );
  }

  if (!isValidEmail(payload.email)) {
    return jsonResponse({ ok: false, error: "Please enter a valid email address." }, 400, origin);
  }

  try {
    const provider =
      (await sendWithResend(env, payload)) ||
      (await sendWithWeb3Forms(env, payload)) ||
      (await sendWithFormSubmit(payload));

    return jsonResponse(
      {
        ok: true,
        message: "Thanks. Your message was sent to business@mittalsols.com.",
        provider,
      },
      200,
      origin
    );
  } catch (err) {
    console.error("Contact form send failed:", err && err.message ? err.message : err);
    return jsonResponse(
      {
        ok: false,
        error:
          "We could not send your message right now. Please email business@mittalsols.com directly.",
      },
      502,
      origin
    );
  }
}

export async function onRequest(context) {
  if (context.request.method === "OPTIONS") {
    return onRequestOptions();
  }
  if (context.request.method === "POST") {
    return onRequestPost(context);
  }
  return jsonResponse({ ok: false, error: "Method not allowed." }, 405);
}
