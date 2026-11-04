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

test("checkout without payment keys falls back to waitlist", async ({ page }) => {
  await runQuiz(page);
  await page.locator("#r-unlock").click();
  await page.locator("#pw-pay").click();
  await expect(page.locator("#pw-demo")).toBeVisible();
  await expect(page.locator("#fd-msg")).toContainText("Rp89.000");
});

test("paid order unlocks the full map with the Keuntungan tab", async ({ page, request }) => {
  await runQuiz(page);
  const co = await (await request.post("/api/checkout", { data: { anonId: "e2e", price: 89000, arm: 0 } })).json();
  const hook = await request.post("/api/webhooks/xendit", { headers: { "x-callback-token": "test-callback" }, data: { external_id: co.orderId, status: "PAID" } });
  expect(hook.ok()).toBeTruthy();
  await page.goto("/?order=" + co.orderId);
  await expect(page.locator("#v-full")).toBeVisible({ timeout: 15_000 });
  await expect(page.locator("#u-total")).toContainText("/ tahun");
  await page.fill("#u-gross", "16");
  await page.fill("#u-zakat", "0.375");
  await expect(page.locator("#u-zres")).toContainText("675.000");
});

test("sample report renders with share card", async ({ page }) => {
  await page.goto("/contoh-laporan.html");
  await expect(page.locator("h1")).toContainText("58% syariah");
  await expect(page.locator("#untung")).toContainText("1.755.000");
  const src = await page.locator("#sh-img").getAttribute("src");
  expect(src).toMatch(/^data:image\/png/);
});
