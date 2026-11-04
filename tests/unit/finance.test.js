import { test } from "node:test";
import assert from "node:assert/strict";
import { pph, annualPkp, marginalRate, zakatTaxSaving, sukukVsDeposito } from "../../web/src/finance.js";

test("PPh brackets (UU HPP)", () => {
  assert.equal(pph(0), 0);
  assert.equal(pph(60e6), 3e6);
  assert.equal(pph(100e6), 3e6 + 40e6 * 0.15);
  assert.equal(pph(250e6), 3e6 + 28.5e6);
  assert.equal(pph(300e6), 3e6 + 28.5e6 + 12.5e6);
});

test("PKP uses biaya jabatan cap and PTKP", () => {
  // 16 jt/bulan: 192 jt - 6 jt (cap) - 54 jt = 132 jt
  assert.equal(annualPkp(16e6, "TK/0"), 132e6);
  assert.equal(annualPkp(4e6, "TK/0"), 0);
  assert.equal(marginalRate(132e6), 0.15);
});

test("zakat saving equals zakat x marginal rate inside one bracket", () => {
  assert.equal(zakatTaxSaving(16e6, "TK/0", 375000), Math.round(4.5e6 * 0.15));
  assert.equal(zakatTaxSaving(4e6, "TK/0", 100000), 0);
});

test("sukuk vs deposito net of final tax", () => {
  const r = sukukVsDeposito(50e6, 4.5, 6.4);
  assert.equal(Math.round(r.deposito), 1_800_000);
  assert.equal(Math.round(r.sukuk), 2_880_000);
  assert.equal(Math.round(r.gain), 1_080_000);
});
