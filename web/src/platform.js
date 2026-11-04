/* Platform layer: anonymous id, price arm, events (first-party + Meta Pixel after consent),
   checkout, order status and image saving. Every network call fails soft so the quiz
   keeps working offline or on a static host. */

const LS = {
  get(k) { try { return localStorage.getItem(k); } catch (_) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (_) {} },
};

function uid() {
  if (crypto && crypto.randomUUID) return crypto.randomUUID();
  return "x" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export const ANON_ID = (() => { let id = LS.get("ps.anon"); if (!id) { id = uid(); LS.set("ps.anon", id); } return id; })();

/* Price arms come from build-time env so the first paint never waits on the network. */
const ARMS = String(import.meta.env.VITE_PRICE_ARMS || "89000,179000").split(",").map((x) => parseInt(x, 10)).filter((x) => x > 0);
function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
const forced = new URLSearchParams(location.search).get("harga");
export const PRICE = ARMS.includes(+forced) ? +forced : ARMS[hash(ANON_ID) % ARMS.length];
export const PRICE_ARM = ARMS.indexOf(PRICE);
export const fmtRp = (n) => "Rp" + Math.round(n).toLocaleString("id-ID");

/* Referral: ?ref=CODE is kept for attribution of shared links. */
const ref = new URLSearchParams(location.search).get("ref");
if (ref) LS.set("ps.ref", ref.slice(0, 32));
export const REF = LS.get("ps.ref") || null;
export const SHARE_URL = `${location.origin}/?ref=${ANON_ID.slice(0, 8)}`;

/* ---------- consent + Meta Pixel ---------- */
let pixelId = import.meta.env.VITE_META_PIXEL_ID || "";
let pixelLoaded = false;
const PIXEL_MAP = { lp_view: "PageView", quiz_complete: "CompleteRegistration", paywall_view: "ViewContent", checkout_start: "InitiateCheckout" };

function loadPixel() {
  if (pixelLoaded || !pixelId || LS.get("ps.consent") !== "yes") return;
  pixelLoaded = true;
  /* Standard Meta Pixel base code. */
  !function (f, b, e, v, n, t, s) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); }; if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = "2.0"; n.queue = []; t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s); }(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
  window.fbq("init", pixelId, {}, { external_id: ANON_ID });
}

export function initConsent() {
  const bar = document.getElementById("consent");
  if (!bar) return;
  const c = LS.get("ps.consent");
  const setOpen = (open) => { bar.hidden = !open; document.body.classList.toggle("has-consent", open); };
  setOpen(!c);
  bar.querySelector("[data-c=yes]").addEventListener("click", () => { LS.set("ps.consent", "yes"); setOpen(false); loadPixel(); track("consent", { v: "yes" }); });
  bar.querySelector("[data-c=no]").addEventListener("click", () => { LS.set("ps.consent", "no"); setOpen(false); track("consent", { v: "no" }); });
  loadPixel();
}

/* Optional runtime config from the Worker (pixel id, payments on/off). */
export const CONFIG = fetch("/api/config").then((r) => (r.ok ? r.json() : {})).catch(() => ({})).then((c) => {
  if (c && c.pixelId && !pixelId) { pixelId = c.pixelId; loadPixel(); }
  return c || {};
});

/* ---------- events ---------- */
export function track(name, props) {
  const event_id = uid();
  const body = JSON.stringify({ name, props: props || {}, anonId: ANON_ID, eventId: event_id, arm: PRICE_ARM, price: PRICE, ref: REF, url: location.pathname + location.search, ts: Date.now() });
  try {
    if (navigator.sendBeacon) navigator.sendBeacon("/api/events", new Blob([body], { type: "application/json" }));
    else fetch("/api/events", { method: "POST", headers: { "content-type": "application/json" }, body, keepalive: true }).catch(() => {});
  } catch (_) {}
  try {
    if (window.fbq && pixelLoaded) {
      const std = PIXEL_MAP[name];
      if (std) window.fbq("track", std, name === "checkout_start" ? { value: PRICE, currency: "IDR" } : {}, { eventID: event_id });
      else window.fbq("trackCustom", name, props || {}, { eventID: event_id });
    }
  } catch (_) {}
  if (import.meta.env.DEV) console.log("[event]", name, props || {});
}

/* ---------- checkout ---------- */
export async function checkout(extra) {
  try {
    const r = await fetch("/api/checkout", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ anonId: ANON_ID, price: PRICE, arm: PRICE_ARM, ref: REF, ...extra }) });
    if (!r.ok) throw new Error("checkout " + r.status);
    return await r.json();
  } catch (_) {
    return { mode: "waitlist" };
  }
}

export async function orderStatus(orderId) {
  try { const r = await fetch("/api/order/" + encodeURIComponent(orderId)); return r.ok ? await r.json() : { status: "unknown" }; }
  catch (_) { return { status: "unknown" }; }
}

/* ---------- saving share images ---------- */
export async function saveImage(canvas, filename) {
  const blob = await new Promise((r) => canvas.toBlob(r, "image/png"));
  if (!blob) return "failed";
  const file = new File([blob], filename, { type: "image/png" });
  try {
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: "Peta Syariah" });
      return "shared";
    }
  } catch (e) {
    if (e && e.name === "AbortError") return "cancelled";
  }
  try {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    return "downloaded";
  } catch (_) { return "failed"; }
}
