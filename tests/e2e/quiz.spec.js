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
  await page.goto("/?harga=179000");
  await expect(page.locator("#consent")).toBeVisible();
  await expect(page.locator("#l-facts .fact")).toHaveCount(5);
  await expect(page.locator(".px").first()).toHaveText("Rp179.000");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);
});

test("Dinda profile scores 58%, level Penggerak, 2 of 8 badges", async ({ page }) => {
  await runQuiz(page);
  await expect(page.locator("#r-card")).toContainText("58%");
  await expect(page.locator("#r-card")).toContainText("Penggerak");
  await expect(page.locator("#r-bcount")).toHaveText("2 dari 8");
  await expect(page.locator("#r-gains li")).toHaveCount(4);
  await expect(page.locator("#r-guess")).toContainText("lebih syariah");
  const src = await page.locator("#sh-img").getAttribute("src");
  expect(src).toMatch(/^data:image\/png/);
  await expect(page.locator("body")).not.toContainText("Perlindungan");
});

const BUYER = { name: "Dinda Pratiwi", email: "dinda@example.com", wa: "+6281234567890", consent: true };

test("checkout asks for buyer data and consent, then falls back to waitlist", async ({ page, request }) => {
  await runQuiz(page);
  await page.locator("#r-unlock").click();
  await page.locator("#pw-pay").click();
  await expect(page.locator("#buy-err")).toHaveText("Isi nama lengkapmu.");
  await page.fill("#b-name", "Dinda Pratiwi");
  await page.fill("#b-email", "dinda@contoh");
  await page.locator("#pw-pay").click();
  await expect(page.locator("#buy-err")).toHaveText("Cek lagi alamat emailmu.");
  await page.fill("#b-email", "dinda.e2e@example.com");
  await page.fill("#b-wa", "0812-3456-7890");
  await page.locator("#pw-pay").click();
  await expect(page.locator("#buy-err")).toContainText("Centang persetujuan");
  await page.locator("#b-agree").check();
  await page.locator("#pw-pay").click();
  await expect(page.locator("#pw-demo")).toBeVisible();
  await expect(page.locator("#fd-msg")).toContainText("Rp89.000");
  await expect(page.locator("#fd-msg")).toContainText("Dinda Pratiwi");
  const rows = await (await request.get("/api/admin/orders?days=1", { headers: { authorization: "Bearer test-admin" } })).json();
  const mine = rows.orders.find((o) => o.buyer_email === "dinda.e2e@example.com");
  expect(mine).toBeTruthy();
  expect(mine.buyer_wa).toBe("+6281234567890");
  expect(mine.status).toBe("waitlist");
});

test("checkout API rejects orders without buyer consent", async ({ request }) => {
  const r = await request.post("/api/checkout", { data: { anonId: "e2e", price: 89000, arm: 0, buyer: { ...BUYER, consent: false } } });
  expect(r.status()).toBe(400);
  expect((await r.json()).error).toBe("bad_buyer");
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
  await expect(page.locator("#r-card")).toContainText("Mover");
  await page.locator("#r-unlock").click();
  await expect(page.locator("#pw-sub")).toContainText("From 58% to about");
});

test("paid order unlocks the full map with the Keuntungan tab", async ({ page, request }) => {
  await runQuiz(page);
  const co = await (await request.post("/api/checkout", { data: { anonId: "e2e", price: 89000, arm: 0, buyer: BUYER } })).json();
  const hook = await request.post("/api/webhooks/xendit", { headers: { "x-callback-token": "test-callback" }, data: { external_id: co.orderId, status: "PAID" } });
  expect(hook.ok()).toBeTruthy();
  await page.goto("/?order=" + co.orderId);
  await expect(page.locator("#v-full")).toBeVisible({ timeout: 15_000 });
  await expect(page.locator("#u-total")).toContainText("/ tahun");
  await page.fill("#u-gross", "16");
  await page.fill("#u-zakat", "0.375");
  await expect(page.locator("#u-zres")).toContainText("675.000");
});

test("legal pages switch to English", async ({ page }) => {
  await page.goto("/syarat.html?lang=en");
  await expect(page.locator("h1:visible")).toHaveText("Terms of use and refund policy");
  await page.locator("#lang-toggle").click();
  await expect(page.locator("h1:visible")).toHaveText("Syarat penggunaan dan kebijakan refund");
});

test("sample report renders with share card", async ({ page }) => {
  await page.goto("/contoh-laporan.html");
  await expect(page.locator("h1")).toContainText("58% syariah");
  await expect(page.locator("#untung")).toContainText("1.755.000");
  const src = await page.locator("#sh-img").getAttribute("src");
  expect(src).toMatch(/^data:image\/png/);
});
