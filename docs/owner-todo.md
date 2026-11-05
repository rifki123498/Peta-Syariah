# Owner to-do (in order)

Things only the owner can do. Each unblocks the next. Updated 4 Nov 2026.

## P0 — before any paid traffic (this week)
1. **Check the brand name.** Search "Sharia Compass" at pdki-indonesia.dgip.go.id (merek) and on Instagram/TikTok. A quick web search found no app or brand with this name, but that is not a trademark check.
2. **Buy the domain.** Check petasyariah.id and petasyariah.com at a registrar (Cloudflare Registrar for .com; a PANDI-accredited registrar for .id). Then in Cloudflare: Workers & Pages → peta-syariah → Settings → Domains & Routes → Add custom domain. Set the GitHub variable `PUBLIC_BASE_URL` to the new URL.
3. ~~Set up the business entity.~~ Done: PT Perorangan created (4 Nov 2026).
4. ~~Seller details~~ Done: PT Buana Karya Bersama, NIB 2704260038441 in `web/syarat.html` and `web/privasi.html`. Terms (no refunds, optional email only) and UU PDP sections are already written in ID and EN. A lawyer review is still recommended before paid traffic.
5. **Create a WhatsApp Business number** for support and put it in `.env.production` (`VITE_WAITLIST_WA`) instead of the personal number. Consider making the GitHub repo private.

## P1 — to take payments with DOKU (preferred; Xendit code stays as a fallback)
- Add GitHub secrets `DOKU_CLIENT_ID` and `DOKU_SECRET_KEY` (DOKU Back Office → API keys; sandbox first). GitHub variable `DOKU_ENV` = `sandbox`, later `production` with production keys.
- Nothing to configure for notifications: each order sends `override_notification_url` = `<base>/api/webhooks/doku`. The app also checks DOKU's status API when the buyer returns, so a late notification still unlocks.
- Make one sandbox purchase end to end, then switch to production.

## P1 (old) — Xendit
6. **Open a Xendit account** (business verification with NIB). Use test mode first. Add GitHub secrets `XENDIT_SECRET_KEY` and `XENDIT_CALLBACK_TOKEN`. In the Xendit dashboard set the invoice callback URL to `https://<domain>/api/webhooks/xendit`. Then make one test purchase end to end.
7. **Add `ADMIN_TOKEN`** (any long random password) as a GitHub secret so the funnel can be read at `/api/admin/funnel` and buyers/waitlist at `/api/admin/orders`.

## P2 — to run ads
8. **Meta Business account + Pixel.** Create a Pixel, add `META_PIXEL_ID` as a GitHub variable and `META_CAPI_TOKEN` as a secret. Check in Events Manager that PageView, CompleteRegistration, ViewContent and InitiateCheckout arrive before spending.
9. **Ad account**: real business profile, 2FA, a backup admin and a backup payment card (deck: new accounts get flagged).
10. **Brief 2–3 UGC creators** with `docs/marketing.md`. Start organic posts on day 1.
11. **Run the 2-week test** in `docs/test-plan.md` (~Rp100.000/day, 3.000 impressions per ad, read after ~1.000 clicks per price arm).

## P3 — credibility (start now, runs in parallel)
12. **Find a sharia reviewer** (DSN-MUI certified or a known ustadz with finance background) to review weights, copy and the report. Their name in the report is the strongest trust signal for this segment.
13. **Delete or keep** the old D1 database `peta-syariah` in Cloudflare (the app now uses `peta-syariah-db`).

## Claude can do next (no owner input needed)
- Full copywriting pass on the live app.
- Phase 1b account system (magic link or WhatsApp OTP) so buyers keep access across devices.
- Refresh dated facts (JII list, SBSN project count, a recent corporate sukuk).
- Ad creative files (slideshow images, card animations) from the scripts in `docs/marketing.md`.
