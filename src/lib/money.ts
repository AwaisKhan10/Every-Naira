/** Integer kobo arithmetic. 100 kobo = ₦1. Rounding is half away from zero. */

const SAFE = BigInt(Number.MAX_SAFE_INTEGER);

function assertInteger(value: number, label: string): void {
  if (!Number.isInteger(value)) {
    throw new Error(`${label} must be an integer`);
  }
}

export function roundDiv(numerator: number, denominator: number): number {
  assertInteger(numerator, "numerator");
  assertInteger(denominator, "denominator");
  if (denominator === 0) throw new Error("Cannot divide by zero");
  const neg = (numerator < 0) !== (denominator < 0);
  const abs = BigInt(Math.abs(numerator));
  const den = BigInt(Math.abs(denominator));
  const rounded = (abs + den / 2n) / den;
  const signed = neg ? -rounded : rounded;
  if (signed > SAFE || signed < -SAFE) {
    throw new Error("Money result is outside the safe integer range");
  }
  return Number(signed);
}

/** Apply a basis-point rate. 10_000 bps = 100%. */
export function applyBps(kobo: number, bps: number): number {
  assertInteger(kobo, "kobo");
  assertInteger(bps, "bps");
  const product = BigInt(kobo) * BigInt(bps);
  const neg = product < 0n;
  const abs = neg ? -product : product;
  const rounded = (abs + 5_000n) / 10_000n;
  const signed = neg ? -rounded : rounded;
  if (signed > SAFE || signed < -SAFE) {
    throw new Error("Money result is outside the safe integer range");
  }
  return Number(signed);
}

export function formatNgn(kobo: number): string {
  assertInteger(kobo, "kobo");
  const negative = kobo < 0;
  const abs = Math.abs(kobo);
  const naira = Math.trunc(abs / 100);
  const rem = abs % 100;
  const body = new Intl.NumberFormat("en-NG", { maximumFractionDigits: 0 }).format(naira);
  return `${negative ? "-" : ""}₦${body}.${String(rem).padStart(2, "0")}`;
}

export function formatCompactNgn(kobo: number): string {
  assertInteger(kobo, "kobo");
  const negative = kobo < 0;
  const naira = Math.trunc(Math.abs(kobo) / 100);
  const sign = negative ? "-" : "";
  if (naira >= 1_000_000) {
    const tenths = Math.round(naira / 100_000);
    const whole = Math.trunc(tenths / 10);
    const frac = tenths % 10;
    return `${sign}₦${whole}${frac ? `.${frac}` : ""}m`;
  }
  if (naira >= 10_000) {
    return `${sign}₦${Math.trunc(naira / 1_000)}k`;
  }
  return `${sign}₦${new Intl.NumberFormat("en-NG").format(naira)}`;
}

const SYMBOLS: Record<string, string> = {
  NGN: "₦",
  USD: "$",
  GBP: "£",
  EUR: "€",
  CNY: "¥",
};

export function formatMinor(amountMinor: number, currency: string): string {
  assertInteger(amountMinor, "amount");
  const negative = amountMinor < 0;
  const abs = Math.abs(amountMinor);
  const major = Math.trunc(abs / 100);
  const rem = abs % 100;
  const body = new Intl.NumberFormat("en-NG", { maximumFractionDigits: 0 }).format(major);
  const symbol = SYMBOLS[currency] ?? `${currency} `;
  return `${negative ? "-" : ""}${symbol}${body}.${String(rem).padStart(2, "0")}`;
}

/** Parse a naira string such as "18,500.50" into kobo. Rejects more than two decimal places. */
export function parseNairaToKobo(input: string): number | null {
  const cleaned = input.trim().replace(/₦/g, "").replace(/,/g, "").replace(/\s/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  const [nairaPart, frac = ""] = cleaned.split(".");
  const fracPadded = `${frac}00`.slice(0, 2);
  const kobo = Number(nairaPart) * 100 + Number(fracPadded);
  if (!Number.isSafeInteger(kobo)) return null;
  return kobo;
}

export function parseRate(input: string): number | null {
  const cleaned = input.trim().replace(/,/g, "");
  if (!/^\d+(\.\d{1,4})?$/.test(cleaned)) return null;
  const [whole, frac = ""] = cleaned.split(".");
  const padded = `${frac}0000`.slice(0, 4);
  const scaled = Number(whole) * 10_000 + Number(padded);
  if (!Number.isSafeInteger(scaled) || scaled <= 0) return null;
  return scaled;
}

/** Convert a major-unit rate scaled by 10_000 into kobo per one major unit. */
export function rateScaleToKoboPerMajor(scale: number): number {
  return roundDiv(scale * 100, 10_000);
}

export function bpsToLabel(bps: number): string {
  const negative = bps < 0;
  const abs = Math.abs(bps);
  const whole = Math.trunc(abs / 100);
  const rem = abs % 100;
  return `${negative ? "-" : ""}${whole}.${String(rem).padStart(2, "0")}%`;
}

export function formatPercentFromRatio(numerator: number, denominator: number): string {
  if (denominator === 0) return "—";
  const bps = roundDiv(numerator * 10_000, denominator);
  return bpsToLabel(bps);
}
