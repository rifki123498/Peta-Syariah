import { test, expect } from "@playwright/test";

const DINDA = ["rumah", "37", "keduanya", "konv", "3", "kk", "none", "bpjs"];

async function answer(page, v) {
  const before = await page.locator("#q-count").textContent();
  await page.locator(`#q-opts button[data-v="${v}"]`).click();
  if (v === "bpjs") await page.locator("#q-next").click();
  await page.waitForFunction((b) => {
    const r = document.querySelector("#q-refgo");
    return (r && r.offsetParent !== null) || document.querySelector("#q-count").textContent !== b;
  }, before);
  const ref = page.locator("#q-refgo");
  if (await ref.isVisible()) await ref.click();
  await expect(page.locator("#q-count")).not.toHaveText(before);
}

async function runQuiz(page) {
  await page.goto("/?harga=89000");
  await page.locator('#consent [data-c="no"]').click();
  await page.locator(".pill-cta").click();
  await page.locator("#q-intro1go").click();
  for (const v of DINDA) await answer(page, v);
  for (const v of ["sahamx", "rdkonv", "emas"]) await page.locator(`#q-opts button[data-v="${v}"]`).click();
  await page.locator("#q-next").click();
  await expect(page.locator("#q-count")).toHaveText("Pertanyaan 9/10 · 90%");
  await answer(page, "fitrah");
  await page.locator('#q-opts button[data-v="15"]').click();
  await expect(page.locator("#v-result")).toBeVisible({ timeout: 10_000 });
}

test("lander shows verified facts, consent bar and price arm", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#consent")).toBeVisible();
  await expect(page.locator(".trust")).toContainText("6 pilar");
  await expect(page.locator(".guess")).toHaveCount(1);
  await expect(page.locator(".px").first()).toHaveText("Rp89.000");
  await expect(page.locator(".px-was").first()).toHaveText("Rp149.000");
  await expect(page.locator(".tag-promo").first()).toHaveText("Harga spesial · hemat 40%");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);
});

test("Dinda profile scores 54%, level Hijrah, 1 of 8 badges; first step free, previews per row", async ({ page }) => {
  await runQuiz(page);
  await expect(page.locator("#r-card")).toContainText("54%");
  await expect(page.locator("#r-card")).toContainText("Hijrah");
  await expect(page.locator("#r-bcount")).toHaveText("1 dari 8");
  await expect(page.locator("#r-first")).toContainText("Kenapa ini dulu");
  await expect(page.locator("#r-ngain")).toHaveText("4");
  await expect(page.locator("#r-teaser")).toContainText("/ tahun");
  await expect(page.locator("#r-teaser .math")).toContainText("Bukan angka pasti");
  await expect(page.locator("#r-unlock")).toContainText("Buka Laporan Premium · Rp89.000");
  await expect(page.locator("#r-guess")).toContainText("lebih syariah");
  await expect(page.locator("#r-contoh")).toBeVisible();
  await expect(page.locator(".rfoot")).toContainText("Pulihkan akses");
  await expect(page.locator("#sh-captxt")).toHaveValue(/#ShariaCompass/);
  const src = await page.locator("#sh-img").getAttribute("src");
  expect(src).toMatch(/^data:image\/png/);
  await expect(page.locator("body")).not.toContainText("Perlindungan");
});

const BUYER = { name: "Dinda", email: "dinda@example.com", consent: true };

test("paywall requires one contact (email or WhatsApp), validated and stored", async ({ page, request }) => {
  await runQuiz(page);
  await page.locator("#r-unlock").click();
  await expect(page.locator("#pw-form input")).toHaveCount(2);
  await expect(page.locator("#pw-teaser")).toContainText("/ tahun");
  await expect(page.locator("#pw-pay")).toBeDisabled();
  await page.fill("#b-name", "Dinda");
  await page.fill("#b-email", "dinda@contoh");
  await expect(page.locator("#pw-pay")).toBeDisabled();
  await page.fill("#b-email", "dinda.e2e@example.com");
  await page.locator("#pw-pay").click();
  await expect(page.locator("#pw-demo")).toBeVisible();
  await expect(page.locator("#fd-msg")).toContainText("Kami kabari ke dinda.e2e@example.com");
  await expect(page.locator("#fd-wa")).toHaveCount(0);
  const rows = await (await request.get("/api/admin/orders?days=1", { headers: { authorization: "Bearer test-admin" } })).json();
  const mine = rows.orders.find((o) => o.buyer_email === "dinda.e2e@example.com");
  expect(mine).toBeTruthy();
  expect(mine.status).toBe("waitlist");
});

test("a WhatsApp number is accepted as the contact", async ({ page }) => {
  await runQuiz(page);
  await page.locator("#r-unlock").click();
  await page.fill("#b-name", "Dinda");
  await page.fill("#b-email", "0812-3456-7890");
  await page.locator("#pw-pay").click();
  await expect(page.locator("#pw-demo")).toBeVisible();
  await expect(page.locator("#fd-msg")).toContainText("+6281234567890");
});

test("evidence persona: 50%, Hijrah, guess on the band edge, no partial badge, zakat estimate shows its math", async ({ page }) => {
  await page.goto("/");
  await page.locator('#consent [data-c="no"]').click();
  await page.locator('.hero .guess-chip[data-guess="62"]').click();
  await expect(page.locator("#v-lander")).toBeVisible();
  await page.locator(".guess-go button").first().click();
  await expect(page.locator("#q-count")).toHaveText("Pertanyaan 1/10 · 10%");
  for (const v of ["ibadah", "konv", "campur", "0", "debit", "both", "bpjs"]) await answer(page, v);
  await page.locator('#q-opts button[data-v="belum"]').click();
  await page.locator("#q-next").click();
  await answer(page, "kadang");
  await page.locator('#q-opts button[data-v="8"]').click();
  await expect(page.locator("#v-result")).toBeVisible({ timeout: 10_000 });
  await expect(page.locator("#r-card")).toContainText("50%");
  await expect(page.locator("#r-card")).toContainText("Hijrah");
  await expect(page.locator("#r-guess")).toContainText("tepat di batasnya");
  await expect(page.locator("#r-badges")).not.toContainText("✓ Tabungan syariah");
  await page.locator('#r-badges details.badge:has-text("Tabungan syariah") summary').click();
  await expect(page.locator('#r-badges details.badge:has-text("Tabungan syariah") .crit')).toContainText("bukan campuran");
  await expect(page.locator("#r-nat")).toContainText("bukan peringkat pribadimu");
  await expect(page.locator("#r-pnotes")).toContainText("BPJS");
  await expect(page.locator("#r-teaser .math")).toContainText("Rp5–10 juta");
  await page.reload();
  await expect(page.locator("#v-result")).toBeVisible();
});

test("refresh in the middle of the quiz resumes", async ({ page }) => {
  await page.goto("/");
  await page.locator('#consent [data-c="no"]').click();
  await page.locator(".pill-cta").click();
  await page.locator("#q-intro1go").click();
  for (const v of ["rumah", "37", "keduanya"]) await answer(page, v);
  await page.reload();
  await expect(page.locator("#q-text")).toHaveText("Tabungan dan depositomu disimpan di mana?");
});

test("restore access with an order number, no chat", async ({ page, request }) => {
  const co = await (await request.post("/api/checkout", { data: { anonId: "e2e-r", price: 89000, arm: 0, buyer: BUYER } })).json();
  await request.post("/api/webhooks/xendit", { headers: { "x-callback-token": "test-callback" }, data: { external_id: co.orderId, status: "PAID" } });
  await page.goto("/?pulihkan");
  await expect(page.locator("#restore")).toBeVisible();
  await page.fill("#rs-id", "PS-000");
  await page.locator("#rs-go").click();
  await expect(page.locator("#rs-err")).toContainText("diawali PS-");
  await page.fill("#rs-id", co.orderId.toLowerCase());
  await page.locator("#rs-go").click();
  await expect(page.locator("#v-quiz")).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("petasyariah.v2")).unlocked)).toBe(true);
});

test("checkout API rejects a bad email and a price outside the arms", async ({ request }) => {
  let r = await request.post("/api/checkout", { data: { anonId: "e2e", price: 89000, arm: 0, buyer: { name: "X", email: "x@y", consent: true } } });
  expect(r.status()).toBe(400);
  r = await request.post("/api/checkout", { data: { anonId: "e2e", price: 69000, arm: 0, buyer: BUYER } });
  expect((await r.json()).error).toBe("bad_price");
});

test("guess chip asks for confirmation, then skips the guess question", async ({ page }) => {
  await page.goto("/?harga=89000");
  await page.locator('#consent [data-c="no"]').click();
  await page.locator('.hero .guess-chip[data-guess="37"]').click();
  await expect(page.locator(".guess-go").first()).toContainText("25–50%");
  await page.locator('.hero .guess-chip[data-guess="62"]').click();
  await expect(page.locator(".guess-go").first()).toContainText("50–75%");
  await page.locator(".guess-go button").first().click();
  await expect(page.locator("#q-count")).toHaveText("Pertanyaan 1/10 · 10%");
  await answer(page, "rumah");
  await expect(page.locator("#q-count")).toHaveText("Pertanyaan 2/10 · 20%");
  await page.locator("#q-back").click();
  await expect(page.locator("#q-count")).toHaveText("Pertanyaan 1/10 · 10%");
});

test("English mode translates lander, quiz and result", async ({ page }) => {
  await page.goto("/?harga=89000&lang=en");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await page.locator('#consent [data-c="no"]').click();
  await expect(page.locator("h1")).toContainText("Your finances may be more sharia than you think.");
  const lander = await page.locator("#v-lander").innerText();
  expect(lander).not.toMatch(/\b(kamu|yang|nggak|keuanganmu)\b/i);
  await page.locator(".pill-cta").click();
  await page.locator("#q-intro1go").click();
  await expect(page.locator("#q-count")).toHaveText("Question 1/10 · 10%");
  for (const v of DINDA) await answer(page, v);
  for (const v of ["sahamx", "rdkonv", "emas"]) await page.locator(`#q-opts button[data-v="${v}"]`).click();
  await page.locator("#q-next").click();
  await answer(page, "fitrah");
  await page.locator('#q-opts button[data-v="15"]').click();
  await expect(page.locator("#v-result")).toBeVisible({ timeout: 10_000 });
  await expect(page.locator("#r-bcount")).toHaveText("1 of 8");
  await expect(page.locator("#r-card")).toContainText("Hijrah");
  await page.locator("#r-unlock").click();
  await expect(page.locator("#pw-pay")).toContainText("Open the Premium report");
});

test("paid order opens the Premium report, then the Keuntungan tab", async ({ page, request }) => {
  await runQuiz(page);
  const co = await (await request.post("/api/checkout", { data: { anonId: "e2e", price: 89000, arm: 0, buyer: BUYER } })).json();
  const hook = await request.post("/api/webhooks/xendit", { headers: { "x-callback-token": "test-callback" }, data: { external_id: co.orderId, status: "PAID" } });
  expect(hook.ok()).toBeTruthy();
  await page.goto("/?order=" + co.orderId);
  await expect(page.locator("#v-full")).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('[data-panel="lap"]')).toBeVisible();
  await expect(page.locator("#lap-sum")).toContainText("54% →");
  await expect(page.locator("#lap-gains > li")).toHaveCount(4);
  await expect(page.locator("#lap-gains .pchip").first()).toBeVisible();
  await page.fill("#m-sav", "50");
  await expect(page.locator("#lap-gains")).toContainText("DATA KAMU");
  await expect(page.locator("#f-oid")).toHaveText(co.orderId);
  await page.locator("#f-sync").check();
  await page.waitForTimeout(1200);
  const pr = await (await request.get("/api/progress/" + co.orderId)).json();
  expect(pr.data.ans.goal).toBe("rumah");
  await page.locator("#lap-gains .go-untung").first().click();
  await expect(page.locator('[data-panel="untung"]')).toBeVisible();
  await expect(page.locator("#u-total")).toContainText("/ tahun");
  await page.fill("#u-gross", "16");
  await page.fill("#u-zakat", "0.375");
  await expect(page.locator("#u-zres")).toContainText("675.000");
});

test("legal pages switch to English", async ({ page }) => {
  await page.goto("/syarat.html?lang=en");
  await expect(page.locator("h1:visible")).toHaveText("Terms of use");
  await page.locator("#lang-toggle").click();
  await expect(page.locator("h1:visible")).toHaveText("Syarat penggunaan");
});

test("sample report is the real Premium view for the example profile and leaves own state alone", async ({ page }) => {
  await page.goto("/contoh-laporan.html");
  await expect(page).toHaveURL(/\?contoh/);
  await expect(page.locator("#demo-bar")).toBeVisible();
  await expect(page.locator("#lap-sum")).toContainText("54% →");
  await expect(page.locator("#lap-nat .nat-big")).toContainText("13 dari 100");
  await expect(page.locator('[data-panel="lap"] .cut-cta')).toBeVisible();
  await expect(page.locator('[data-panel="lap"] .cut-cta a')).toHaveText("Cek punyamu gratis, 3 menit");
  expect(await page.evaluate(() => localStorage.getItem("petasyariah.v2"))).toBeNull();
  await page.locator('[data-tab="untung"]').click();
  await expect(page.locator("#u-gross")).toBeDisabled();
  await expect(page.locator('[data-panel="untung"] .demo-lock')).toBeVisible();
  await page.locator('[data-tab="kat"]').click();
  await expect(page.locator("#kat-list .ex").first()).toContainText("bukan rekomendasi");
});

test("result has one report card; its button opens the one-screen paywall", async ({ page }) => {
  await runQuiz(page);
  await page.locator("#r-unlock").click();
  await expect(page.locator("#paywall")).toBeVisible();
  await expect(page.locator("#paywall")).toContainText("12 halaman");
  await expect(page.locator("#paywall")).toContainText("tanpa refund");
});
