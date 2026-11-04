import { Hono } from "hono";

type Env = {
  DB: D1Database;
  ASSETS: Fetcher;
  PRICE_ARMS: string;
  PUBLIC_BASE_URL?: string;
  META_PIXEL_ID?: string;
  META_CAPI_TOKEN?: string;
  XENDIT_SECRET_KEY?: string;
  XENDIT_CALLBACK_TOKEN?: string;
  ADMIN_TOKEN?: string;
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
  const rule = path === "/api/checkout" ? [10, 60_000] : path === "/api/events" ? [120, 60_000] : null;
  if (rule && limited(path + "|" + ip, rule[0], rule[1])) return c.json({ error: "rate_limited" }, 429);
  await next();
});

const EVENT_NAMES = new Set([
  "lp_view", "quiz_start", "q_answer", "quiz_complete", "result_view", "share_save", "share_caption",
  "paywall_view", "checkout_start", "purchase_return", "consent", "wa_click", "feedback_click",
  "task_toggle", "ask_toggle", "catalog_filter", "scenario_tab", "owner_preview",
]);
/* Our event name → Meta standard event for the Conversions API. */
const CAPI_MAP: Record<string, string> = {
  lp_view: "PageView", quiz_complete: "CompleteRegistration", paywall_view: "ViewContent", checkout_start: "InitiateCheckout",
};

const arms = (env: Env) => String(env.PRICE_ARMS || "89000,179000").split(",").map((x) => parseInt(x, 10)).filter((x) => x > 0);
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
const TERMS_VERSION = "2026-11-04";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
function parseBuyer(v: any): { name: string; email: string; wa: string | null } | null {
  if (!v || typeof v !== "object" || v.consent !== true) return null;
  const name = typeof v.name === "string" ? v.name.trim().slice(0, 80) : "";
  const email = typeof v.email === "string" ? v.email.trim().toLowerCase().slice(0, 120) : "";
  if (name.length < 2 || !EMAIL_RE.test(email)) return null;
  const wa = typeof v.wa === "string" && /^\+62\d{8,13}$/.test(v.wa) ? v.wa : null;
  return { name, email, wa };
}

app.get("/api/config", (c) => c.json({ pixelId: c.env.META_PIXEL_ID || null, priceArms: arms(c.env), payments: !!c.env.XENDIT_SECRET_KEY }));

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
  const insert = (mode: string, status: string, providerRef: string | null = null, invoiceUrl: string | null = null) =>
    c.env.DB.prepare(
      "INSERT INTO orders (id,anon_id,price,arm,ref,mode,status,provider_ref,invoice_url,created_at,buyer_name,buyer_email,buyer_wa,consent_at,terms_version,meta_consent) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
    ).bind(id, anonId, price, arm, ref, mode, status, providerRef, invoiceUrl, t, buyer.name, buyer.email, buyer.wa, t, TERMS_VERSION, b.mc === true ? 1 : 0).run();

  if (!c.env.XENDIT_SECRET_KEY) {
    await insert("waitlist", "waitlist");
    return c.json({ mode: "waitlist", orderId: id });
  }

  const base = c.env.PUBLIC_BASE_URL || new URL(c.req.url).origin;
  const r = await fetch("https://api.xendit.co/v2/invoices", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: "Basic " + btoa(c.env.XENDIT_SECRET_KEY + ":") },
    body: JSON.stringify({
      external_id: id, amount: price, currency: "IDR",
      description: "Peta Syariah Lengkap (sekali bayar)",
      payer_email: buyer.email,
      customer: { given_names: buyer.name, email: buyer.email, ...(buyer.wa ? { mobile_number: buyer.wa } : {}) },
      items: [{ name: "Peta Syariah Lengkap", quantity: 1, price, category: "Produk digital" }],
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

app.get("/api/order/:id", async (c) => {
  const row: any = await c.env.DB.prepare("SELECT status FROM orders WHERE id=?").bind(c.req.param("id").slice(0, 40)).first();
  return c.json({ status: row ? row.status : "unknown" });
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
