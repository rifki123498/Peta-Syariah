# Phase 1 test plan — does anyone pay?

Framework: "How to Sell Consumer Apps Globally" (Radja Thaher, ALIF Academy, 10 Oct 2026). All benchmark numbers below are that deck's assumptions or vendor data, not ours.

## Setup
- Tracking live first (Pixel + CAPI + analytics). Judge nothing until events are verified end to end.
- Budget ~Rp100.000/day, Indonesia only. One campaign, one ad set, one ad per test; stop each test at 3.000 impressions.
- Creative: founder-led talking head + screen recording. Hook direction: curiosity and pride ("Coba tebak, berapa persen keuanganmu sudah syariah?"), never fear. Keep text in the 9:16 safe zone.
- Price: Rp69.000 shown as a launch price against a struck-through Rp149.000 (owner decision, 4 Nov 2026). Single arm; the A/B mechanism stays (`PRICE_ARMS`, `PRICE_ANCHOR`).

## Unit economics (deck assumptions: CPM $2, CTR 2%, $1 = Rp17.890)
- Breakeven CAC = price × 0,993 ÷ 1,11 (0,7% QRIS fee, 11% ad tax).
- CPC at these assumptions ≈ Rp1.789.
- Rp69.000 → breakeven CAC ≈ Rp61.700 → needs ≥ 2,9% of link clicks to buy; ROAS 1,75 needs ≈ 4,5%.
- Deck's real Indonesian web-quiz funnel converted ~1,6% of clicks → Rp69.000 would run at ROAS ≈ 0,6 (Rp89.000 was ≈ 0,8). The lower price only pays if it lifts conversion by roughly 30% or more.

## Funnel targets (read after ~1.000 link clicks per price arm)
| Step | Target | If below |
|---|---|---|
| Link CTR | ≥ 1,5% (kill < 1%) | new hook |
| Landing → quiz start | ≥ 50% | lander must repeat the ad's promise |
| Quiz completion | ≥ 70% | cut or simplify questions |
| Result → paywall view | ≥ 60% | strengthen locked-benefit teaser |
| Paywall → checkout/fake-door click | ≥ 8% | offer, price, proof |
| Result → share card saved | track only (no benchmark yet) | |
| Link clicks → purchase | ≥ 3% continue · < 1,5% stop or pivot | |

## Ad kill rules (per ad, λ = spend ÷ target CAC)
- Kill: 0 sales by 2× target CAC, or CPA > 1,6× target after 4× CAC spent.
- Promote: 3+ sales and CPA ≤ target. Double: 6+ sales and CPA ≤ target.
- Max one budget step per day; count only since the last change.

## Decision after 2 weeks
- Continue: ≥ 3% click→purchase on either arm → Phase 1b.
- Pivot: CTR fine, conversion low → test report + sharia-reviewer Q&A bundle, or subscription companion.
- Stop: < 1,5% on both arms after ~1.000 clicks each.
