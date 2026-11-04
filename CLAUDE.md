# Peta Syariah — project rules for Claude Code

Consumer web app (Indonesia) that tells people what percent of their finances is already sharia-compliant, which sharia habits ("lencana") they already have, which concrete benefits they have not taken yet, and sells a one-time Pro report (Rp89.000 special price shown against a struck-through Rp149.000, set by the owner).

Read before any work: `docs/spec.md` (what to build, in what order), `docs/copy-guide.md` (voice and guardrails), `docs/facts-and-sources.md` (every fact the product may state), `docs/test-plan.md` (launch metrics and kill rules). The working prototype is in `prototype/` — port its logic, copy and design; do not redesign from scratch.

## Non-negotiables
- **No halal/haram verdicts** on any product, bank, company or person. The product scores habits and points to questions to ask; the user and their ustadz decide. Disclaimer "Panduan edukasi, bukan fatwa" stays on result, report and paywall.
- **No invented facts or numbers.** Every fact, fatwa/POJK number, tax rate and statistic comes from `docs/facts-and-sources.md`. A new fact needs a source added there first. Rates used in money calculations (deposito, sukuk, PPh bracket) are inputs or clearly labelled assumptions, never hardcoded as truth.
- **No borrowed trust.** Peta Syariah is not supervised by OJK or DSN-MUI. Never write "diawasi OJK/DSN-MUI".
- **Payments:** no refunds (all sales final; failed access is fixed, not refunded). The paywall asks for nothing except an optional email.
- **No fear or attack framing** against conventional banks. Sell certainty, benefits and pride.
- **Privacy:** share cards never show income, savings, debt or zakat amounts. Store the minimum; financial inputs are personal data under UU PDP (UU 27/2022) — get explicit consent before storing them server-side.
- **Language:** all user-facing copy in Bahasa Indonesia, address the user as "kamu". Code, comments and docs in English.
- **Provenance labels:** in the Pro report every number carries a source chip: KUIS (from quiz), DATA KAMU (from the user's form), ASUMSI (assumption to replace with an official offer).

## Working style
- Ship in the phase order in `docs/spec.md`. Phase 1 exists to prove people pay; do not build Phase 2 features before the Phase 1 metrics are read.
- Before accepting your own change, be able to answer: what does it do in one sentence, which files changed and why, how was it proven to work, what is the most likely way it fails.
- Test on a real phone width (390px) in light and dark mode. The quiz must work without login.
- Never commit secrets (payment keys, Meta CAPI token). Use Wrangler secrets / environment variables.
