/* Pure money functions for the "Keuntungan" tab. No DOM. Covered by tests/unit/finance.test.js.
   Rules (see docs/facts-and-sources.md):
   - PPh orang pribadi brackets (UU 7/2021 HPP): 5% ≤60jt, 15% ≤250jt, 25% ≤500jt, 30% ≤5M, 35% above.
   - Biaya jabatan 5% of gross, max Rp6 jt per year; PTKP from the user's status.
   - Zakat via BAZNAS/LAZ resmi reduces taxable income (UU 23/2011 Pasal 22; PMK 114/2025).
   - Deposito interest final tax 20%; SBN incl. sukuk ritel 10% (PP 91/2021). Rates are user inputs. */

export const PTKP = { "TK/0": 54e6, "K/0": 58.5e6, "K/1": 63e6, "K/2": 67.5e6, "K/3": 72e6 };
const BRACKETS = [[60e6, 0.05], [250e6, 0.15], [500e6, 0.25], [5e9, 0.30], [Infinity, 0.35]];

export function pph(pkp) {
  let tax = 0, lower = 0, rest = Math.max(0, Math.floor(pkp / 1000) * 1000);
  for (const [upper, rate] of BRACKETS) {
    if (rest <= lower) break;
    tax += (Math.min(rest, upper) - lower) * rate;
    lower = upper;
  }
  return Math.round(tax);
}

export function annualPkp(grossMonthly, status = "TK/0") {
  const gross = Math.max(0, grossMonthly) * 12;
  const jabatan = Math.min(gross * 0.05, 6e6);
  return Math.max(0, gross - jabatan - (PTKP[status] ?? PTKP["TK/0"]));
}

export function marginalRate(pkp) {
  for (const [upper, rate] of BRACKETS) if (pkp <= upper) return rate;
  return 0.35;
}

/* Tax saved by deducting annual zakat (paid via an official body) from taxable income. */
export function zakatTaxSaving(grossMonthly, status, zakatMonthly) {
  const pkp = annualPkp(grossMonthly, status);
  const z = Math.max(0, zakatMonthly) * 12;
  return pph(pkp) - pph(Math.max(0, pkp - z));
}

export function netYield(amount, ratePct, taxRate) {
  return Math.max(0, amount) * (Math.max(0, ratePct) / 100) * (1 - taxRate);
}

/* Deposito (20% tax) vs sukuk negara ritel (10% tax), per year. */
export function sukukVsDeposito(amount, depositoRatePct, sukukRatePct) {
  const dep = netYield(amount, depositoRatePct, 0.20);
  const suk = netYield(amount, sukukRatePct, 0.10);
  return { deposito: dep, sukuk: suk, gain: suk - dep };
}

export const ZAKAT_RATE = 0.025;
