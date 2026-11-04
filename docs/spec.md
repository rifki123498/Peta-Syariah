# Peta Syariah — product and technical spec

Status: Phase 1 built (Nov 2026): Vite web app + Hono Worker + D1, events with Meta Pixel/CAPI, two-arm price test, Xendit invoice checkout with waitlist fallback, paid "Keuntungan" tab, share cards, CI/CD. Not yet validated with paying users. Owner decisions still open are listed at the end.

## 1. Premise
- **Who:** Indonesian Muslims, mostly 22–40, salaried or small-business, who want their finances to be more sharia-compliant but do not know where they stand ("hijrah finansial", riba anxiety).
- **Problem:** they assume they are "belum syariah sama sekali", do not know which benefits sharia products actually give them, and do not know the first step.
- **Promise:** "Keuanganmu mungkin lebih syariah dari yang kamu kira." In 3 minutes: your % syariah and level, the badges you already have, the benefits you have not taken yet, and one first step.
- **Positioning:** benefits and pride, not fear. Curiosity loop: guess your % → see the real % → see which benefits apply → rupiah amounts unlock in Pro.

## 2. Core loop
`Guess % → 11 questions → result (%, level, lencana, locked benefits, facts) → share card → Pro report (rupiah benefits + 90-day plan) → day 30 / day 90 progress card → retake → share again`

## 3. Free flow (port from `prototype/kuis.html`)
### 3.1 Lander
Hero "Keuanganmu mungkin lebih syariah dari yang kamu kira." · section "Syariah ada di tempat yang nggak kamu sangka" (facts from `facts-and-sources.md`) · four free outputs · 4 basic akad (free) · scenarios · 90-day stepper · Pro contents and price · FAQ · "Cara kami menilai" sheet.

### 3.2 Quiz (11 questions, no knowledge test)
Exact questions, options and weights are in `STEPS` in the prototype. Order: goal, **guess %**, salary account, savings/deposits, emergency fund, daily payments, home/vehicle financing, insurance ("Asuransi"), investments (**multi-select**), zakat habit (including "lewat BAZNAS/LAZ resmi" vs "langsung ke penerima"), income band.

### 3.3 Scoring (keep identical to prototype unless the owner changes it)
- Six pillars: Tabungan & dana darurat (rekening 35% · tabungan 35% · dana darurat 30%), Cara bayar, Cicilan & utang, Asuransi, Investasi (average of selected instruments; saham = 70 because most but not all IDX stocks are sharia), Zakat & sedekah.
- % syariah = average of six pillars. Level: Perintis <30, Penjelajah 30–54, Penggerak 55–79, Penjaga Amanah ≥80.
- 8 lencana (`BADGES`), benefits (`GAINS`, max 4 shown, rupiah locked), potential after 90 days (`project()`).

### 3.4 Result
Card (level, %, lencana count, radar, potential) · guess vs result · lencana grid · locked benefits · six-pillar glossary · share card · first step · SNLIK position · facts · Pro teaser · paywall.

### 3.5 Share cards (port `prototype/sharecard.js`)
Story 1080×1920 and Feed 1080×1350 PNG, drawn on canvas. Free card: % syariah, level, "Tadinya kutebak …" (opt-in), radar, lencana count, focus pillar, "Berapa persen punyamu? #PetaSyariahku". Pro cards: day 1 / day 30 / day 90 progress. In production use the Web Share API with files on mobile (`navigator.share({files})`) so the image goes straight to Instagram, with download as fallback. Add `?ref=<shortcode>` to the shared link for attribution.

## 4. Pro report (port `prototype/laporan-pro.html`, make it generated)
- Input: quiz answers + "Lengkapi data" form (6 fields): penghasilan bersih, pengeluaran rutin, dana darurat, deposito (amount + maturity date + purpose), investasi (amount), target rumah (price, DP %, months). Optional, each skippable.
- Sections: 01 Ringkasan · 02 Enam pilar · 03 Keuntungan yang bisa kamu ambil (rupiah) · 04 Angkamu (cash flow, DP gap, zakat, emergency fund, murabahah vs MMQ) · 05 Rencana 90 hari (dated from purchase date and the user's maturity dates) · 06 Bagikan progres · 07 Pertanyaan untuk bank/asuransi (checklist) · 08 Hindari · 09 Data, rujukan, batasan.
- Benefit calculators (inputs editable, assumptions labelled):
  - Zakat via BAZNAS/LAZ resmi → taxable income reduced by annual zakat × user's marginal PPh rate (bracket from income; show the bracket used).
  - Deposito → sukuk negara ritel: net = amount × rate × (1 − tax); deposito tax 20%, SBN tax 10%. Rates are inputs; prefill from an admin-maintained table of current offers with an "as of" date.
  - Murabahah vs MMQ: certainty, not counted in the rupiah total.
- Access: one-time payment, no expiry (owner to confirm, see §8). Report must survive device change → needs account (magic link or WhatsApp OTP) in Phase 1b.

## 5. Tech stack (from the playbook defaults; web first)
| Role | Choice | Note |
|---|---|---|
| Front end | Vite + TypeScript, vanilla or Preact | Prototype is vanilla; keep it light |
| Back end | Hono on Cloudflare Workers | API + webhooks |
| DB | Cloudflare D1 | answers (anonymous id), purchases, events |
| Storage | Cloudflare R2 | generated share images if server-rendered |
| Payments | Xendit or Midtrans (QRIS + e-wallet + VA) for Indonesian buyers | owner picks; MoR not needed for IDR-only |
| Ads tracking | Meta Pixel + Conversions API | events below; dedupe with event_id |
| Product analytics | OpenPanel (or PostHog) | funnel and retention |
| Hosting/domain | Cloudflare Pages/Workers + Registrar | |

### Events (same names in Pixel/CAPI and analytics)
`lp_view, quiz_start, q_answer{q}, quiz_complete, result_view{pct,level,badges,guess}, share_save{fmt}, share_caption, paywall_view, checkout_start{price}, purchase{price}, data_form_complete, report_view, task_toggle, progress_share{day}, retake`

## 6. Phases
- **Phase 1 — prove payment (2 weeks):** port lander + quiz + result + share card; real events + Pixel/CAPI; paywall with real QRIS checkout (or fake door if payment account not ready) at two prices (Rp89.000 / Rp179.000, 50/50 split by anonymous id); static Pro report generated from answers + form; privacy policy and consent; deploy to a domain. Exit: metrics in `test-plan.md`.
- **Phase 1b — keep buyers:** account (magic link / WhatsApp OTP), report saved server-side, progress checklist synced.
- **Phase 2 — retention triggers (only if Phase 1 passes):** reminders for natural triggers (payday, deposito maturity, zakat haul, Ramadan, DES review May/Nov, ST/SR offering windows), day-30/day-90 progress cards, referral reward.
- **Phase 3:** sharia reviewer sign-off shown in the report; admin table for current ST/SR and deposit offers; stock screener against current DES.

## 7. Out of scope for now
Native apps, subscriptions, product recommendations by brand, any automated halal/haram status of named banks.

## 8. Owner decisions still open
1. Price test arms (proposal: Rp89.000 vs Rp179.000) and whether access is truly "tidak kedaluwarsa".
2. Payment provider and legal entity (PT Perorangan is the simplest start).
3. Sharia reviewer (DSN-MUI certified) to review weights and copy before paid launch.
4. Employer outside-activity / conflict-of-interest clearance.
5. Domain and brand handle; WhatsApp business number for waitlist.
6. Whether to store financial inputs server-side (needs explicit consent, UU PDP) or keep them on device only.
