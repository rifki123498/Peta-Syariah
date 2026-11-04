# Peta Syariah

Web app Indonesia: berapa persen keuanganmu yang sudah syariah, lencana yang sudah kamu punya, dan keuntungan yang belum kamu ambil. Kuis gratis; peta lengkap berbayar sekali (Rp69.000, dicoret dari Rp149.000).

## Stack
- `web/` — Vite (vanilla JS). `index.html` (lander, kuis, hasil, paywall, peta lengkap), `contoh-laporan.html` (contoh laporan Pro), `privasi.html`.
  - `src/app.js` UI dan logika skor · `src/platform.js` id anonim, harga A/B, event + Meta Pixel (dengan persetujuan), checkout, simpan gambar · `src/sharecard.js` kartu Instagram · `src/finance.js` hitungan pajak zakat dan sukuk vs deposito.
- `worker/` — Hono di Cloudflare Workers + D1. Route: `GET /api/config`, `POST /api/events`, `POST /api/checkout` (invoice Xendit, atau waitlist bila kunci belum ada), `POST /api/webhooks/xendit`, `GET /api/order/:id`, `GET /api/admin/funnel` (Bearer `ADMIN_TOKEN`).
- `docs/` — spec, fakta dan sumber, panduan bahasa, rencana tes. `prototype/` — versi artifact asli.

## Jalankan lokal
```bash
npm ci
cp .env.example .env            # opsional
printf 'XENDIT_CALLBACK_TOKEN=test-callback\nADMIN_TOKEN=test-admin\n' > .dev.vars
npm run build
npx wrangler d1 migrations apply peta-syariah-db --local
npx wrangler dev --local        # http://127.0.0.1:8787
```
Untuk mengubah tampilan dengan hot reload: `npm run dev` (Vite, proxy `/api` ke Worker di 8787).

## Tes
`npm test` = unit test (hitungan pajak) + build + e2e Playwright terhadap Worker lokal (kuis profil contoh → 58%, level Penggerak, 2/8 lencana; checkout fallback; pesanan lunas membuka peta lengkap; contoh laporan).

## Deploy otomatis
Setiap push ke `main`: tes → deploy ke Cloudflare (D1 dibuat otomatis, migrasi dijalankan, secret disinkronkan). Deploy dilewati dengan aman sampai secret Cloudflare diisi.

GitHub → Settings → Secrets and variables → Actions:

| Jenis | Nama | Isi |
|---|---|---|
| Secret | `CLOUDFLARE_API_TOKEN` | Token dengan izin Workers Scripts:Edit dan D1:Edit |
| Secret | `CLOUDFLARE_ACCOUNT_ID` | ID akun Cloudflare |
| Secret (opsional) | `XENDIT_SECRET_KEY`, `XENDIT_CALLBACK_TOKEN` | Mengaktifkan pembayaran QRIS/e-wallet/VA. Callback URL di dasbor Xendit: `https://<domain>/api/webhooks/xendit` |
| Secret (opsional) | `META_CAPI_TOKEN` | Conversions API |
| Secret (opsional) | `ADMIN_TOKEN` | Akses `/api/admin/funnel` |
| Variable | `META_PIXEL_ID`, `PUBLIC_BASE_URL`, `PRICE_ARMS` | Pixel, domain publik, harga tes |

Tanpa kunci Xendit, tombol bayar mencatat minat (waitlist) dan menawarkan pesan WhatsApp, jadi tes harga tetap bisa berjalan.

## Batasan yang diketahui
- Akses berbayar disimpan di perangkat (localStorage). Akun dan sinkron lintas perangkat ada di Fase 1b (`docs/spec.md`).
- Integrasi Xendit mengikuti API invoice v2; uji dengan kunci test mode sebelum live.
- `privasi.html` masih draf dan perlu ditinjau hukum (UU PDP).
