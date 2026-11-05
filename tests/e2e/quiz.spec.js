import { test, expect } from "@playwright/test";

const DINDA = ["rumah", "37", "keduanya", "konv", "3", "kk", "none", "bpjs"];

async function answer(page, v) {
  const before = await page.locator("#q-count").textContent();
  await page.locator(`#q-opts button[data-v="${v}"]`).click();
  await expect(page.locator("#q-count")).not.toHaveText(before);
}

async function runQuiz(page) {
  await page.goto("/?harga=89000");
  await page.locator('#consent [data-c="no"]').click();
  await page.locator(".pill-cta").click();
  await page.locator("#q-intro1go").click();
  for (const v of DINDA) await answer(page, v);
  for (const v of ["saham", "rdkonv", "emas"]) await page.locator(`#q-opts button[data-v="${v}"]`).click();
  await page.locator("#q-next").click();
  await expect(page.locator("#q-count")).toHaveText("Pertanyaan 10/11");
  await answer(page, "fitrah");
  await page.locator('#q-opts button[data-v="15"]').click();
  await expect(page.locator("#v-result")).toBeVisible({ timeout: 10_000 });
}

test("lander shows verified facts, consent bar and price arm", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#consent")).toBeVisible();
  await expect(page.locator("#l-facts .fact")).toHaveCount(6);
  await expect(page.locator(".px").first()).toHaveText("Rp89.000");
  await expect(page.locator(".px-was").first()).toHaveText("Rp149.000");
  await expect(page.locator(".tag-promo").first()).toHaveText("Harga spesial · hemat 40%");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);
});

test("Dinda profile scores 58%, level Istiqamah, 2 of 8 badges", async ({ page }) => {
  await runQuiz(page);
  await expect(page.locator("#r-card")).toContainText("58%");
  await expect(page.locator("#r-card")).toContainText("Istiqamah");
  await expect(page.locator("#r-bcount")).toHaveText("2 dari 8");
  await expect(page.locator("#r-gains li")).toHaveCount(4);
  await expect(page.locator("#r-gains")).toHaveClass(/blur/);
  await expect(page.locator("#r-ngain")).toHaveText("Ada 4 keuntungan yang belum kamu ambil");
  await expect(page.locator("#r-badges .badge span").first()).toBeHidden();
  await expect(page.locator("#r-guess")).toContainText("lebih syariah");
  const src = await page.locator("#sh-img").getAttribute("src");
  expect(src).toMatch(/^data:image\/png/);
  await expect(page.locator("body")).not.toContainText("Perlindungan");
});

const BUYER = { email: "dinda@example.com", consent: true };

test("paywall needs no data; optional email is validated and stored", async ({ page, request }) => {
  await runQuiz(page);
  await page.locator("#r-unlock").click();
  await expect(page.locator("#pw-form input")).toHaveCount(1);
  await page.fill("#b-email", "dinda@contoh");
  await page.locator("#pw-pay").click();
  await expect(page.locator("#buy-err")).toContainText("Cek lagi alamat emailmu");
  await page.fill("#b-email", "dinda.e2e@example.com");
  await page.locator("#pw-pay").click();
  await expect(page.locator("#pw-demo")).toBeVisible();
  await expect(page.locator("#fd-msg")).toContainText("Rp89.000");
  const rows = await (await request.get("/api/admin/orders?days=1", { headers: { authorization: "Bearer test-admin" } })).json();
  const mine = rows.orders.find((o) => o.buyer_email === "dinda.e2e@example.com");
  expect(mine).toBeTruthy();
  expect(mine.status).toBe("waitlist");
});

test("paying without an email works", async ({ page }) => {
  await runQuiz(page);
  await page.locator("#r-unlock").click();
  await page.locator("#pw-pay").click();
  await expect(page.locator("#pw-demo")).toBeVisible();
});

test("checkout API rejects a bad email and a price outside the arms", async ({ request }) => {
  let r = await request.post("/api/checkout", { data: { anonId: "e2e", price: 89000, arm: 0, buyer: { email: "x@y", consent: true } } });
  expect(r.status()).toBe(400);
  r = await request.post("/api/checkout", { data: { anonId: "e2e", price: 69000, arm: 0, buyer: BUYER } });
  expect((await r.json()).error).toBe("bad_price");
});

test("guess chip on the lander skips the guess question", async ({ page }) => {
  await page.goto("/?harga=89000");
  await page.locator('#consent [data-c="no"]').click();
  await page.locator('.hero .guess-chip[data-guess="37"]').click();
  await expect(page.locator("#q-count")).toHaveText("Pertanyaan 1/10");
  await answer(page, "rumah");
  await expect(page.locator("#q-count")).toHaveText("Pertanyaan 2/10");
  await expect(page.locator("#q-text")).toHaveText("Gajimu atau rekening utamamu ada di mana?");
  await page.locator("#q-back").click();
  await expect(page.locator("#q-count")).toHaveText("Pertanyaan 1/10");
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
  await expect(page.locator("#q-count")).toHaveText("Question 1/11");
  for (const v of DINDA) await answer(page, v);
  for (const v of ["saham", "rdkonv", "emas"]) await page.locator(`#q-opts button[data-v="${v}"]`).click();
  await page.locator("#q-next").click();
  await answer(page, "fitrah");
  await page.locator('#q-opts button[data-v="15"]').click();
  await expect(page.locator("#v-result")).toBeVisible({ timeout: 10_000 });
  await expect(page.locator("#r-bcount")).toHaveText("2 of 8");
  await expect(page.locator("#r-card")).toContainText("Istiqamah");
  await page.locator("#r-unlock").click();
  await expect(page.locator("#pw-sub")).toContainText("From 58% to about");
});

test("paid order opens the Premium report, then the Keuntungan tab", async ({ page, request }) => {
  await runQuiz(page);
  const co = await (await request.post("/api/checkout", { data: { anonId: "e2e", price: 89000, arm: 0, buyer: BUYER } })).json();
  const hook = await request.post("/api/webhooks/xendit", { headers: { "x-callback-token": "test-callback" }, data: { external_id: co.orderId, status: "PAID" } });
  expect(hook.ok()).toBeTruthy();
  await page.goto("/?order=" + co.orderId);
  await expect(page.locator("#v-full")).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('[data-panel="lap"]')).toBeVisible();
  await expect(page.locator("#lap-sum")).toContainText("58% →");
  await expect(page.locator("#lap-gains li")).toHaveCount(4);
  await expect(page.locator("#lap-badges .badge span").first()).toBeVisible();
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
  await expect(page.locator("#lap-sum")).toContainText("58% →");
  await expect(page.locator("#lap-nat .nat-big")).toContainText("13 dari 100");
  expect(await page.evaluate(() => localStorage.getItem("petasyariah.v2"))).toBeNull();
});

test("tapping a blurred preview opens the paywall", async ({ page }) => {
  await runQuiz(page);
  await page.locator('.tease[data-tease="first"]').click();
  await expect(page.locator("#paywall")).toBeVisible();
});
