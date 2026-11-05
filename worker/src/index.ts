import { Hono } from "hono";

type Env = {
  DB: D1Database;
  ASSETS: Fetcher;
  PRICE_ARMS: string;
  PUBLIC_BASE_URL?: string;
  META_PIXEL_ID?: string;
  META_CAPI_TOKEN?: string;
  DOKU_CLIENT_ID?: string;
  DOKU_SECRET_KEY?: string;
  DOKU_ENV?: string;
  XENDIT_SECRET_KEY?: string;
  XENDIT_CALLBACK_TOKEN?: string;
  ADMIN_TOKEN?: string;
  RESEND_API_KEY?: string;
  MAIL_FROM?: string;
};

const app = new Hono<{ Bindings: Env }>();

/* Best-effort per-isolate rate limit by IP. Stops casual spam of /api/events and /api/checkout;
   not a substitute for Cloudflare WAF rules once traffic grows. */
const hits = new Map<string, number[]>();
function limited(key: string, max: number, windowMs: number) {
  const t = Date.now();
  const arr = (hits.get(key) || []).filter((x) => t - x < windowMs);
  arr.push(t);
  hits.set(key, arr);
  if (hits.size > 5000) hits.clear();
  return arr.length > max;
}
app.use("/api/*", async (c, next) => {
  const ip = c.req.header("cf-connecting-ip") || "local";
  const path = new URL(c.req.url).pathname;
  const rule = path === "/api/checkout" ? [10, 60_000] : path === "/api/events" ? [120, 60_000] : path.startsWith("/api/order/") || path.startsWith("/api/progress/") ? [30, 60_000] : null;
  if (rule && limited(path + "|" + ip, rule[0], rule[1])) return c.json({ error: "rate_limited" }, 429);
  await next();
});

const EVENT_NAMES = new Set([
  "lp_view", "quiz_start", "q_answer", "quiz_complete", "result_view", "share_save", "share_caption",
  "paywall_view", "checkout_start", "purchase_return", "consent", "wa_click", "feedback_click",
  "task_toggle", "ask_toggle", "catalog_filter", "scenario_tab", "owner_preview",
  "tease_click", "tab_view", "sample_view", "restore", "reflection_view", "magic_request", "report_open",
  "landing_view", "guess_selected", "quiz_started", "quiz_completed", "result_viewed", "locked_row_clicked", "contoh_viewed", "premium_dialog_opened",
  "share_downloaded", "share_caption_copied", "contoh_cta", "product_link_clicked", "progress_sync", "pdf_print",
]);
/* Our event name → Meta standard event for the Conversions API. */
const CAPI_MAP: Record<string, string> = {
  landing_view: "PageView", quiz_completed: "CompleteRegistration", premium_dialog_opened: "ViewContent", checkout_start: "InitiateCheckout",
};

const arms = (env: Env) => String(env.PRICE_ARMS || "89000").split(",").map((x) => parseInt(x, 10)).filter((x) => x > 0);
const clip = (v: unknown, n: number) => (typeof v === "string" ? v.slice(0, n) : null);
const now = () => Date.now();

async function sha256(s: string) {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
}

async function sendCapi(env: Env, req: Request, eventName: string, eventId: string, anonId: string | null, url: string | null, custom?: Record<string, unknown>) {
  if (!env.META_PIXEL_ID || !env.META_CAPI_TOKEN) return;
  const user_data: Record<string, unknown> = {
    client_ip_address: req.headers.get("cf-connecting-ip") || undefined,
    client_user_agent: req.headers.get("user-agent") || undefined,
  };
  if (anonId) user_data.external_id = [await sha256(anonId)];
  const body = {
    data: [{ event_name: eventName, event_time: Math.floor(now() / 1000), event_id: eventId, action_source: "website", event_source_url: env.PUBLIC_BASE_URL ? env.PUBLIC_BASE_URL + (url || "/") : undefined, user_data, custom_data: custom }],
  };
  await fetch(`https://graph.facebook.com/v21.0/${env.META_PIXEL_ID}/events?access_token=${encodeURIComponent(env.META_CAPI_TOKEN)}`, {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body),
  }).catch(() => {});
}

/* Version of syarat.html + privasi.html the buyer agreed to. Bump when either page changes materially. */
const TERMS_VERSION = "2026-11-05";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
function parseBuyer(v: any): { name: string; email: string | null; wa: string | null } | null {
  /* One contact is required (email or WhatsApp) so access can be restored. Pressing pay = accepting Syarat & Privasi. */
  if (!v || typeof v !== "object" || v.consent !== true) return null;
  const email = typeof v.email === "string" ? v.email.trim().toLowerCase().slice(0, 120) : "";
  if (email && !EMAIL_RE.test(email)) return null;
  const wa = typeof v.wa === "string" && /^\+62\d{8,13}$/.test(v.wa) ? v.wa : null;
  const name = typeof v.name === "string" ? v.name.trim().slice(0, 80) : "";
  if ((!email && !wa) || name.length < 2) return null;
  return { name, email: email || null, wa };
}

/* ---------- DOKU Checkout (non-SNAP). Signature: HMACSHA256=base64(hmac(secret, "Client-Id:..\nRequest-Id:..\nRequest-Timestamp:..\nRequest-Target:..[\nDigest:base64(sha256(body))]")) ---------- */
const hasDoku = (env: Env) => !!(env.DOKU_CLIENT_ID && env.DOKU_SECRET_KEY);
const dokuBase = (env: Env) => (env.DOKU_ENV === "production" ? "https://api.doku.com" : "https://api-sandbox.doku.com");
const b64 = (buf: ArrayBuffer) => btoa(String.fromCharCode(...new Uint8Array(buf)));
async function dokuSignature(secret: string, clientId: string, requestId: string, ts: string, target: string, body: string | null) {
  let comp = `Client-Id:${clientId}\nRequest-Id:${requestId}\nRequest-Timestamp:${ts}\nRequest-Target:${target}`;
  if (body !== null) comp += `\nDigest:${b64(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(body)))}`;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return "HMACSHA256=" + b64(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(comp)));
}
async function dokuFetch(env: Env, method: "GET" | "POST", target: string, bodyObj?: unknown) {
  const body = bodyObj === undefined ? null : JSON.stringify(bodyObj);
  const rid = crypto.randomUUID(), ts = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
  const sig = await dokuSignature(env.DOKU_SECRET_KEY!, env.DOKU_CLIENT_ID!, rid, ts, target, body);
  return fetch(dokuBase(env) + target, { method, headers: { "Client-Id": env.DOKU_CLIENT_ID!, "Request-Id": rid, "Request-Timestamp": ts, Signature: sig, ...(body ? { "content-type": "application/json" } : {}) }, body: body ?? undefined });
}
async function markPaid(env: Env, req: Request, ctx: ExecutionContext, id: string) {
  const row: any = await env.DB.prepare("SELECT id,anon_id,price,status,meta_consent FROM orders WHERE id=?").bind(id).first();
  if (!row || row.status === "paid") return row;
  await env.DB.prepare("UPDATE orders SET status='paid', paid_at=? WHERE id=?").bind(now(), id).run();
  if (row.meta_consent === 1) ctx.waitUntil(sendCapi(env, req, "Purchase", "purchase-" + id, row.anon_id, "/", { value: row.price, currency: "IDR", order_id: id }));
  ctx.waitUntil(sendReportMail(env, req, id));
  return { ...row, status: "paid" };
}

/* ---------- Email: report link after purchase + magic links for "Laporanku". Needs RESEND_API_KEY and MAIL_FROM (a verified domain). ---------- */
const baseOf = (env: Env, req: Request) => env.PUBLIC_BASE_URL || new URL(req.url).origin;
async function sendMail(env: Env, to: string, subject: string, html: string) {
  if (!env.RESEND_API_KEY || !env.MAIL_FROM) return false;
  const r = await fetch("https://api.resend.com/emails", { method: "POST", headers: { authorization: "Bearer " + env.RESEND_API_KEY, "content-type": "application/json" }, body: JSON.stringify({ from: env.MAIL_FROM, to: [to], subject, html }) }).catch(() => null);
  return !!(r && r.ok);
}
async function newToken(env: Env, email: string) {
  const t = [...crypto.getRandomValues(new Uint8Array(20))].map((x) => x.toString(16).padStart(2, "0")).join("");
  await env.DB.prepare("INSERT INTO magic (token,email,expires_at) VALUES (?,?,?)").bind(t, email, now() + 7 * 864e5).run();
  return t;
}
async function sendReportMail(env: Env, req: Request, id: string) {
  const o: any = await env.DB.prepare("SELECT buyer_email,buyer_name FROM orders WHERE id=?").bind(id).first();
  if (!o?.buyer_email) return;
  const link = `${baseOf(env, req)}/?laporan=${await newToken(env, o.buyer_email)}`;
  await sendMail(env, o.buyer_email, "Laporan Sharia Compass-mu sudah siap", `<p>Halo ${o.buyer_name || ""},</p><p>Terima kasih. Laporan Premium-mu siap dibuka dan diunduh sebagai PDF:</p><p><a href="${link}">Buka laporanku</a></p><p>Kode aksesmu: <b>${id}</b>. Simpan email ini; kamu bisa meminta link baru kapan saja di halaman Laporanku.</p><p>Sharia Compass oleh SIFA Ventures. Panduan edukasi, bukan fatwa.</p>`);
}

app.get("/api/config", (c) => c.json({ pixelId: c.env.META_PIXEL_ID || null, priceArms: arms(c.env), payments: hasDoku(c.env) || !!c.env.XENDIT_SECRET_KEY }));

app.post("/api/events", async (c) => {
  let b: any;
  try { b = await c.req.json(); } catch { return c.json({ ok: false }, 400); }
  const name = clip(b?.name, 40);
  if (!name || !EVENT_NAMES.has(name)) return c.json({ ok: false, error: "unknown_event" }, 400);
  const props = JSON.stringify(b.props && typeof b.props === "object" ? b.props : {}).slice(0, 2000);
  const eventId = clip(b.eventId, 64) || crypto.randomUUID();
  const anonId = clip(b.anonId, 64);
  const url = clip(b.url, 300);
  await c.env.DB.prepare(
    "INSERT INTO events (event_id,name,anon_id,arm,price,ref,url,props,ua,country,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
  ).bind(eventId, name, anonId, Number.isInteger(b.arm) ? b.arm : null, Number.isInteger(b.price) ? b.price : null, clip(b.ref, 32), url, props,
    clip(c.req.header("user-agent"), 300), clip(c.req.header("cf-ipcountry"), 4), now()).run();
  const std = CAPI_MAP[name];
  /* Meta CAPI only for visitors who accepted the cookie bar (mc = marketing consent). */
  if (std && b.mc === true) c.executionCtx.waitUntil(sendCapi(c.env, c.req.raw, std, eventId, anonId, url, name === "checkout_start" ? { value: b.price, currency: "IDR" } : undefined));
  return c.json({ ok: true });
});

app.post("/api/checkout", async (c) => {
  let b: any;
  try { b = await c.req.json(); } catch { return c.json({ error: "bad_json" }, 400); }
  const price = parseInt(b?.price, 10);
  if (!arms(c.env).includes(price)) return c.json({ error: "bad_price" }, 400);
  const id = "PS-" + crypto.randomUUID().slice(0, 13).replace(/-/g, "").toUpperCase();
  const anonId = clip(b.anonId, 64), ref = clip(b.ref, 32), arm = Number.isInteger(b.arm) ? b.arm : null;
  const buyer = parseBuyer(b.buyer);
  if (!buyer) return c.json({ error: "bad_buyer" }, 400);
  const t = now();
  const ansRaw = b?.answers && typeof b.answers === "object" ? JSON.stringify({ ans: b.answers }).slice(0, 4000) : null;
  if (ansRaw) await c.env.DB.prepare("INSERT INTO progress (order_id,data,updated_at) VALUES (?,?,?) ON CONFLICT(order_id) DO NOTHING").bind(id, ansRaw, t).run();
  const insert = (mode: string, status: string, providerRef: string | null = null, invoiceUrl: string | null = null) =>
    c.env.DB.prepare(
      "INSERT INTO orders (id,anon_id,price,arm,ref,mode,status,provider_ref,invoice_url,created_at,buyer_name,buyer_email,buyer_wa,consent_at,terms_version,meta_consent) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
    ).bind(id, anonId, price, arm, ref, mode, status, providerRef, invoiceUrl, t, buyer.name, buyer.email, buyer.wa, t, TERMS_VERSION, b.mc === true ? 1 : 0).run();

  const base = c.env.PUBLIC_BASE_URL || new URL(c.req.url).origin;

  if (hasDoku(c.env)) {
    const full = {
      order: {
        amount: price, invoice_number: id, currency: "IDR", auto_redirect: true,
        callback_url: `${base}/?order=${id}`, callback_url_result: `${base}/?order=${id}`,
        line_items: [{ name: "Sharia Compass Premium", price, quantity: 1 }],
      },
      payment: { payment_due_date: 60 },
      ...(buyer.email ? { customer: { id: id, email: buyer.email } } : {}),
      additional_info: { override_notification_url: `${base}/api/webhooks/doku` },
    };
    let r = await dokuFetch(c.env, "POST", "/checkout/v1/payment", full).catch(() => null);
    let txt = r ? await r.text().catch(() => "") : "network_error";
    /* If DOKU finds no usable method for the full request, retry with DOKU's minimal documented body
       (some methods filter on customer/line_items). The error of the last attempt is kept. */
    if (r && r.status === 400 && /ANOTHER PAYMENT METHOD/i.test(txt)) {
      r = await dokuFetch(c.env, "POST", "/checkout/v1/payment", {
        order: { amount: price, invoice_number: id, callback_url: `${base}/?order=${id}` },
        payment: { payment_due_date: 60 },
      }).catch(() => null);
      txt = (r ? await r.text().catch(() => "") : "network_error");
      if (!/payment/.test(txt) || (r && !r.ok)) txt = "minimal: " + txt;
    }
    let j: any = null; try { j = JSON.parse(txt); } catch {}
    const url = j?.response?.payment?.url;
    if (!url) {
      /* Keep DOKU's error (no secrets in it) on the order so failures can be diagnosed from D1. */
      await insert("doku", "failed", `ERR ${r ? r.status : 0}: ${txt.slice(0, 400)}`);
      console.log("doku_checkout_failed", id, r ? r.status : 0, txt.slice(0, 400));
      return c.json({ mode: "waitlist", orderId: id, error: "payment_unavailable" });
    }
    await insert("doku", "pending", j.response.payment.token_id || null, url);
    return c.json({ mode: "redirect", orderId: id, url });
  }

  if (!c.env.XENDIT_SECRET_KEY) {
    await insert("waitlist", "waitlist");
    return c.json({ mode: "waitlist", orderId: id });
  }

  const r = await fetch("https://api.xendit.co/v2/invoices", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: "Basic " + btoa(c.env.XENDIT_SECRET_KEY + ":") },
    body: JSON.stringify({
      external_id: id, amount: price, currency: "IDR",
      description: "Sharia Compass Premium (sekali bayar)",
      ...(buyer.email ? { payer_email: buyer.email, customer: { email: buyer.email } } : {}),
      items: [{ name: "Sharia Compass Premium", quantity: 1, price, category: "Produk digital" }],
      success_redirect_url: `${base}/?order=${id}`,
      failure_redirect_url: `${base}/?order=${id}&gagal=1`,
    }),
  });
  if (!r.ok) {
    await insert("invoice", "failed");
    return c.json({ mode: "waitlist", orderId: id, error: "payment_unavailable" });
  }
  const inv: any = await r.json();
  await insert("invoice", "pending", inv.id || null, inv.invoice_url || null);
  return c.json({ mode: "redirect", orderId: id, url: inv.invoice_url });
});

/* Xendit invoice callback. Configure the callback URL in the Xendit dashboard: <base>/api/webhooks/xendit */
app.post("/api/webhooks/xendit", async (c) => {
  const token = c.req.header("x-callback-token");
  if (!c.env.XENDIT_CALLBACK_TOKEN || token !== c.env.XENDIT_CALLBACK_TOKEN) return c.json({ error: "unauthorized" }, 401);
  const b: any = await c.req.json().catch(() => ({}));
  const id = clip(b.external_id, 40);
  if (!id) return c.json({ error: "bad_payload" }, 400);
  const status = String(b.status || "").toUpperCase();
  const mapped = status === "PAID" || status === "SETTLED" ? "paid" : status === "EXPIRED" ? "expired" : null;
  if (!mapped) return c.json({ ok: true, ignored: status });
  const row: any = await c.env.DB.prepare("SELECT id,anon_id,price,status,meta_consent FROM orders WHERE id=?").bind(id).first();
  if (!row) return c.json({ error: "unknown_order" }, 404);
  if (row.status !== "paid") {
    await c.env.DB.prepare("UPDATE orders SET status=?, paid_at=? WHERE id=?").bind(mapped, mapped === "paid" ? now() : null, id).run();
    if (mapped === "paid" && row.meta_consent === 1) c.executionCtx.waitUntil(sendCapi(c.env, c.req.raw, "Purchase", "purchase-" + id, row.anon_id, "/", { value: row.price, currency: "IDR", order_id: id }));
  }
  return c.json({ ok: true });
});

/* DOKU HTTP notification. URL is sent per order (override_notification_url), so nothing to configure in the back office. */
app.post("/api/webhooks/doku", async (c) => {
  if (!hasDoku(c.env)) return c.json({ error: "not_configured" }, 404);
  const raw = await c.req.text();
  const h = (k: string) => c.req.header(k) || "";
  if (h("client-id") !== c.env.DOKU_CLIENT_ID) return c.json({ error: "unauthorized" }, 401);
  const expect = await dokuSignature(c.env.DOKU_SECRET_KEY!, c.env.DOKU_CLIENT_ID!, h("request-id"), h("request-timestamp"), "/api/webhooks/doku", raw);
  if (h("signature") !== expect) return c.json({ error: "bad_signature" }, 401);
  let b: any; try { b = JSON.parse(raw); } catch { return c.json({ error: "bad_payload" }, 400); }
  const id = clip(b?.order?.invoice_number, 40), status = String(b?.transaction?.status || "").toUpperCase();
  if (!id) return c.json({ error: "bad_payload" }, 400);
  const row: any = await c.env.DB.prepare("SELECT price,status FROM orders WHERE id=?").bind(id).first();
  if (!row) return c.json({ error: "unknown_order" }, 404);
  if (status === "SUCCESS" && Number(b?.order?.amount) === row.price) await markPaid(c.env, c.req.raw, c.executionCtx, id);
  else if ((status === "FAILED" || status === "EXPIRED") && row.status === "pending") await c.env.DB.prepare("UPDATE orders SET status=? WHERE id=?").bind(status.toLowerCase(), id).run();
  return c.json({ ok: true });
});

/* Opt-in server copy of the plan (answers, done steps, own numbers), only for paid orders. */
app.put("/api/progress/:id", async (c) => {
  const id = c.req.param("id").slice(0, 40);
  const row: any = await c.env.DB.prepare("SELECT status FROM orders WHERE id=?").bind(id).first();
  if (!row || row.status !== "paid") return c.json({ error: "not_paid" }, 403);
  const raw = await c.req.text(); if (raw.length > 6000) return c.json({ error: "too_large" }, 413);
  try { JSON.parse(raw); } catch { return c.json({ error: "bad_json" }, 400); }
  await c.env.DB.prepare("INSERT INTO progress (order_id,data,updated_at) VALUES (?,?,?) ON CONFLICT(order_id) DO UPDATE SET data=excluded.data, updated_at=excluded.updated_at").bind(id, raw, now()).run();
  return c.json({ ok: true });
});
app.delete("/api/progress/:id", async (c) => {
  await c.env.DB.prepare("DELETE FROM progress WHERE order_id=?").bind(c.req.param("id").slice(0, 40)).run();
  return c.json({ ok: true });
});
app.get("/api/progress/:id", async (c) => {
  const id = c.req.param("id").slice(0, 40);
  const row: any = await c.env.DB.prepare("SELECT o.status, p.data FROM orders o LEFT JOIN progress p ON p.order_id=o.id WHERE o.id=?").bind(id).first();
  if (!row || row.status !== "paid") return c.json({ error: "not_paid" }, 403);
  return c.json({ data: row.data ? JSON.parse(row.data) : null });
});

/* Laporanku: request a magic link by email (same answer whether or not the email bought, to avoid leaking customers). */
app.post("/api/magic", async (c) => {
  const b: any = await c.req.json().catch(() => ({}));
  const email = typeof b.email === "string" ? b.email.trim().toLowerCase() : "";
  if (!EMAIL_RE.test(email)) return c.json({ error: "bad_email" }, 400);
  const has: any = await c.env.DB.prepare("SELECT 1 FROM orders WHERE buyer_email=? AND status='paid' LIMIT 1").bind(email).first();
  let sent = false;
  if (has) sent = await sendMail(c.env, email, "Link Laporanku · Sharia Compass", `<p>Ini link untuk membuka laporanmu (berlaku 7 hari):</p><p><a href="${baseOf(c.env, c.req.raw)}/?laporan=${await newToken(c.env, email)}">Buka Laporanku</a></p><p>Kalau kamu tidak meminta link ini, abaikan email ini.</p>`);
  void sent;
  return c.json({ ok: true, mail: !!(c.env.RESEND_API_KEY && c.env.MAIL_FROM) });
});
app.get("/api/reports", async (c) => {
  const t = (c.req.query("t") || "").slice(0, 64);
  const m: any = await c.env.DB.prepare("SELECT email,expires_at FROM magic WHERE token=?").bind(t).first();
  if (!m || m.expires_at < now()) return c.json({ error: "expired" }, 403);
  const rows = await c.env.DB.prepare("SELECT o.id,o.paid_at,o.buyer_name,p.data FROM orders o LEFT JOIN progress p ON p.order_id=o.id WHERE o.buyer_email=? AND o.status='paid' ORDER BY o.paid_at DESC").bind(m.email).all();
  return c.json({ reports: (rows.results || []).map((r: any) => ({ id: r.id, paidAt: r.paid_at, name: r.buyer_name, data: r.data ? JSON.parse(r.data) : null })) });
});
/* Public counters for social proof; the page shows them only above a threshold. */
app.get("/api/stats", async (c) => {
  const q: any = await c.env.DB.prepare("SELECT COUNT(DISTINCT anon_id) AS n FROM events WHERE name IN ('quiz_completed','quiz_complete')").first();
  const r: any = await c.env.DB.prepare("SELECT COUNT(*) AS n FROM orders WHERE status='paid'").first();
  return c.json({ quizzes: q?.n || 0, reports: r?.n || 0 });
});

app.get("/api/order/:id", async (c) => {
  const id = c.req.param("id").slice(0, 40);
  const row: any = await c.env.DB.prepare("SELECT status,mode,price FROM orders WHERE id=?").bind(id).first();
  if (!row) return c.json({ status: "unknown" });
  /* Self-heal: if the notification is late or lost, ask DOKU directly. */
  if (row.status === "pending" && row.mode === "doku" && hasDoku(c.env)) {
    const r = await dokuFetch(c.env, "GET", `/orders/v1/status/${encodeURIComponent(id)}`).catch(() => null);
    const j: any = r && r.ok ? await r.json().catch(() => null) : null;
    const st = String(j?.transaction?.status || "").toUpperCase();
    if (st === "SUCCESS" && (j?.order?.amount == null || Number(j.order.amount) === row.price)) { await markPaid(c.env, c.req.raw, c.executionCtx, id); return c.json({ status: "paid" }); }
    if (st === "FAILED" || st === "EXPIRED") return c.json({ status: st.toLowerCase() });
  }
  return c.json({ status: row.status });
});

/* Funnel numbers for the owner: GET /api/admin/funnel?days=14 with header "authorization: Bearer <ADMIN_TOKEN>". */
app.get("/api/admin/funnel", async (c) => {
  if (!c.env.ADMIN_TOKEN || c.req.header("authorization") !== "Bearer " + c.env.ADMIN_TOKEN) return c.json({ error: "unauthorized" }, 401);
  const days = Math.min(90, Math.max(1, parseInt(c.req.query("days") || "14", 10)));
  const since = now() - days * 864e5;
  const ev = await c.env.DB.prepare("SELECT arm, name, COUNT(DISTINCT anon_id) AS users FROM events WHERE created_at>=? GROUP BY arm, name").bind(since).all();
  const od = await c.env.DB.prepare("SELECT arm, price, status, COUNT(*) AS n FROM orders WHERE created_at>=? GROUP BY arm, price, status").bind(since).all();
  return c.json({ days, events: ev.results, orders: od.results });
});

/* Buyer list for fulfilment and waitlist follow-up: GET /api/admin/orders?days=30 with the same Bearer token. */
app.get("/api/admin/orders", async (c) => {
  if (!c.env.ADMIN_TOKEN || c.req.header("authorization") !== "Bearer " + c.env.ADMIN_TOKEN) return c.json({ error: "unauthorized" }, 401);
  const days = Math.min(365, Math.max(1, parseInt(c.req.query("days") || "30", 10)));
  const rows = await c.env.DB.prepare(
    "SELECT id,price,mode,status,buyer_name,buyer_email,buyer_wa,created_at,paid_at FROM orders WHERE created_at>=? ORDER BY created_at DESC LIMIT 1000",
  ).bind(now() - days * 864e5).all();
  return c.json({ days, orders: rows.results });
});

app.all("/api/*", (c) => c.json({ error: "not_found" }, 404));
app.all("*", (c) => c.env.ASSETS.fetch(c.req.raw));

/* Daily retention job: anonymous usage events are kept at most 12 months (privasi.html). */
async function scheduled(_ev: ScheduledEvent, env: Env) {
  await env.DB.prepare("DELETE FROM events WHERE created_at < ?").bind(now() - 365 * 864e5).run();
}

export default { fetch: app.fetch, scheduled };
