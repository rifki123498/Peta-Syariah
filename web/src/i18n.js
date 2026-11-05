/* Lightweight i18n: the app is written in Indonesian; in English mode every visible text node,
   aria-label/placeholder/title is swapped via the EN dictionary plus a few patterns for dynamic strings.
   A MutationObserver keeps content rendered later (quiz, result, paywall) translated.
   The paid full map (#v-full) and anything with [data-noi18n] stay Indonesian. */
import { EN } from "./i18n-en.js";

const q = new URLSearchParams(location.search).get("lang");
let stored = null;
try { stored = localStorage.getItem("ps_lang"); } catch (_) {}
export const LANG = q === "en" || q === "id" ? q : stored === "en" ? "en" : "id";
try { localStorage.setItem("ps_lang", LANG); } catch (_) {}
export const isEN = LANG === "en";

const rpJt = (s) => s.replace(/Rp([\d.,]+) jt/g, "Rp$1 million");
const PATTERNS = [
  [/^Pertanyaan (\d+)\/(\d+)$/, (m) => `Question ${m[1]}/${m[2]}`],
  [/^(\d+) dari (\d+)$/, (m) => `${m[1]} of ${m[2]}`],
  [/^Ada (\d+) keuntungan yang belum kamu ambil$/, (m) => `${m[1]} benefit${m[1] === "1" ? "" : "s"} you haven't claimed yet`],
  [/^(\d+) keuntungan$/, (m) => `${m[1]} benefit${m[1] === "1" ? "" : "s"}`],
  [/^Level (.+)$/, (m) => `Level ${tr(m[1])}`],
  [/^Dari (\d+)% ke sekitar (\d+)% syariah dalam 90 hari\.$/, (m) => `From ${m[1]}% to about ${m[2]}% sharia in 90 days.`],
  [/^Rencanamu dimulai dari (.+?)\. (?:Ada (\d+) keuntungan yang belum kamu ambil, lengkap dengan hitungan rupiahnya\. )?Angka potensi adalah perkiraan kalau semua langkah dijalankan\.$/,
    (m) => `Your plan starts with ${tr(m[1][0].toUpperCase() + m[1].slice(1)).toLowerCase()}. ${m[2] ? `There ${m[2] === "1" ? "is 1 benefit" : `are ${m[2]} benefits`} you haven't claimed yet, with the rupiah figures. ` : ""}The potential figure is an estimate if every step is completed.`],
  [/^Radar enam pilar: (.+)$/, (m) => "Six-pillar radar: " + m[1].split(", ").map((p) => p.replace(/^(.+) (\d+)$/, (_, n, v) => `${tr(n)} ${v}`)).join(", ")],
  [/^Bangun dana darurat: target awal (.+)$/, (m) => `Build an emergency fund: first target ${rpJt(m[1])}`],
  [/^Saya mau peta lengkap · (.+)$/, (m) => `I want the full map · ${m[1]}`],
  [/^Satu di antaranya saja, zakat lewat lembaga resmi, bisa menghemat pajakmu sekitar$/, () => "Just one of them, zakat through an official institution, could cut your tax by about"],
  [/^(Rp[\d.,]+ (?:rb|jt)) setahun$/, (m) => `${m[1].replace(" jt"," million").replace(" rb","k")} a year`],
  [/^Kami kabari ke (.+) begitu pembayaran dibuka\.$/, (m) => `We'll let ${m[1]} know when payments open.`],
  [/^Bayar sekarang (Rp.+)$/, (m) => `Pay now ${m[1]}`],
  [/^Tadinya kutebak (cuma )?(.+)\.$/, (m) => `I guessed ${m[1] ? "only " : ""}${tr(m[2])}.`],
  [/^([✓○]) (.+)$/, (m) => `${m[1]} ${tr(m[2])}`],
  [/^(\d+) dari (\d+) terjawab$/, (m) => `${m[1]} of ${m[2]} answered`],
];

/** Translate one string (keeps surrounding whitespace). Identity in Indonesian mode. */
export function tr(s) {
  if (!isEN || s == null) return s;
  const str = String(s);
  const core = str.replace(/\s+/g, " ").trim();
  if (!core) return str;
  let out = EN[core];
  if (out === undefined) for (const [re, fn] of PATTERNS) { const m = core.match(re); if (m) { out = fn(m); break; } }
  if (out === undefined) return str;
  const lead = /^\s/.test(str) ? " " : "", trail = /\s$/.test(str) ? " " : "";
  return lead + out + trail;
}
export const t = tr;

const DONE = new WeakMap(); // text node -> translated value we wrote (prevents re-processing)
const SKIP = "script,style,[data-noi18n],#v-full";
function doText(n) {
  const p = n.parentElement;
  if (!p || p.closest(SKIP)) return;
  if (DONE.get(n) === n.nodeValue) return;
  const v = tr(n.nodeValue);
  if (v !== n.nodeValue) n.nodeValue = v;
  DONE.set(n, n.nodeValue);
}
function doAttrs(el) {
  if (el.closest(SKIP)) return;
  for (const a of ["aria-label", "placeholder", "title"]) {
    const v = el.getAttribute(a);
    if (v) { const nv = tr(v); if (nv !== v) el.setAttribute(a, nv); }
  }
}
function walk(root) {
  if (root.nodeType === 3) return doText(root);
  if (root.nodeType !== 1) return;
  doAttrs(root);
  root.querySelectorAll("[aria-label],[placeholder],[title]").forEach(doAttrs);
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let n; while ((n = w.nextNode())) doText(n);
}

export function initI18n() {
  document.documentElement.lang = LANG;
  const btn = document.getElementById("lang-toggle");
  if (btn) {
    btn.textContent = isEN ? "ID" : "EN";
    btn.setAttribute("aria-label", isEN ? "Ganti bahasa ke Indonesia" : "Switch language to English");
    btn.addEventListener("click", () => {
      const u = new URL(location.href);
      u.searchParams.set("lang", isEN ? "id" : "en");
      try { localStorage.setItem("ps_lang", isEN ? "id" : "en"); } catch (_) {}
      location.href = u.toString();
    });
  }
  if (!isEN) return;
  document.title = "Sharia Compass: how much of your finances is already sharia?";
  const md = document.querySelector('meta[name="description"]');
  if (md) md.setAttribute("content", "Find out what share of your finances is already sharia, the badges you already have, and the benefits you haven't claimed yet. Free, 3 minutes.");
  const full = document.getElementById("v-full");
  if (full && !full.querySelector(".i18n-note")) {
    const note = document.createElement("p");
    note.className = "i18n-note"; note.setAttribute("data-noi18n", "");
    note.textContent = EN["Peta lengkap saat ini tersedia dalam Bahasa Indonesia."];
    full.prepend(note);
  }
  walk(document.body);
  new MutationObserver((muts) => {
    for (const m of muts) {
      if (m.type === "characterData") doText(m.target);
      else if (m.type === "attributes") doAttrs(m.target);
      else m.addedNodes.forEach(walk);
    }
  }).observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ["aria-label", "placeholder", "title"] });
}
