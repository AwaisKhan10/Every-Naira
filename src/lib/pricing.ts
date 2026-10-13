import { applyBps, bpsToLabel, roundDiv } from "@/lib/money";
import type { FeeAssumption, Purchase } from "@/lib/types";

export interface LandedLine {
  qty: number;
  unitMinor: number;
}

export interface LandedInput {
  lines: LandedLine[];
  /** Kobo per 1 major unit of the purchase currency. NGN is 100. */
  ngnKoboPerMajor: number;
  shippingKobo: number;
  dutiesKobo: number;
  otherKobo: number;
}

export interface LandedResult {
  goodsKobo: number;
  extrasKobo: number;
  totalKobo: number;
  orderedQty: number;
  unitKobo: number;
  remainderKobo: number;
}

/**
 * Landed cost converts each line into naira, then adds shipping, duties, and other costs.
 * The unit cost is total ÷ ordered quantity, rounded half away from zero.
 * Remainder kobo is total − (unit × qty), so the rounding is visible.
 * Batch costs are spread across ordered quantity, including units not yet received.
 */
export function landedCost(input: LandedInput): LandedResult | { error: string } {
  if (!Number.isInteger(input.ngnKoboPerMajor) || input.ngnKoboPerMajor <= 0) {
    return { error: "Enter a sample exchange rate greater than zero." };
  }
  if (input.lines.length === 0) return { error: "Add at least one purchase line." };
  let goods = 0n;
  let qty = 0;
  for (const line of input.lines) {
    if (!Number.isInteger(line.qty) || line.qty <= 0) return { error: "Quantity must be a whole number greater than zero." };
    if (!Number.isInteger(line.unitMinor) || line.unitMinor < 0) return { error: "Purchase price cannot be negative." };
    const converted = BigInt(line.unitMinor) * BigInt(input.ngnKoboPerMajor);
    const lineKobo = (converted + 50n) / 100n;
    goods += lineKobo * BigInt(line.qty);
    qty += line.qty;
  }
  for (const extra of [input.shippingKobo, input.dutiesKobo, input.otherKobo]) {
    if (!Number.isInteger(extra) || extra < 0) return { error: "Allocated costs cannot be negative." };
  }
  const extras = input.shippingKobo + input.dutiesKobo + input.otherKobo;
  const total = goods + BigInt(extras);
  if (total > BigInt(Number.MAX_SAFE_INTEGER)) return { error: "Landed cost is too large to calculate safely." };
  const totalKobo = Number(total);
  const unitKobo = roundDiv(totalKobo, qty);
  return {
    goodsKobo: Number(goods),
    extrasKobo: extras,
    totalKobo,
    orderedQty: qty,
    unitKobo,
    remainderKobo: totalKobo - unitKobo * qty,
  };
}

export function purchaseLanded(purchase: Purchase): LandedResult | { error: string } {
  return landedCost({
    lines: purchase.lines.map((line) => ({ qty: line.orderedQty, unitMinor: line.unitMinor })),
    ngnKoboPerMajor: purchase.ngnKoboPerMajor,
    shippingKobo: purchase.shippingKobo,
    dutiesKobo: purchase.dutiesKobo,
    otherKobo: purchase.otherKobo,
  });
}

export function grossProfitKobo(priceKobo: number, costKobo: number): number {
  return priceKobo - costKobo;
}

/** Suggested price from a target margin. Margin is basis points of the selling price. */
export function suggestedPriceKobo(costKobo: number, targetMarginBps: number): number | { error: string } {
  if (!Number.isInteger(costKobo) || costKobo < 0) return { error: "Cost must be zero or a positive amount." };
  if (!Number.isInteger(targetMarginBps) || targetMarginBps < 0 || targetMarginBps >= 10_000) {
    return { error: "Target margin must be between 0% and 99.99%." };
  }
  return roundDiv(costKobo * 10_000, 10_000 - targetMarginBps);
}

export function roundPriceToNaira(kobo: number): number {
  return roundDiv(kobo, 100) * 100;
}

export interface DiscountImpact {
  discountedKobo: number;
  profitKobo: number;
  marginLabel: string;
}

export function discountImpact(priceKobo: number, costKobo: number, discountKobo: number): DiscountImpact | { error: string } {
  if (discountKobo < 0) return { error: "Discount cannot be negative." };
  if (discountKobo > priceKobo) return { error: "Discount cannot exceed the selling price." };
  const discountedKobo = priceKobo - discountKobo;
  const profitKobo = discountedKobo - costKobo;
  const marginLabel = discountedKobo === 0 ? "—" : bpsToLabel(roundDiv(profitKobo * 10_000, discountedKobo));
  return { discountedKobo, profitKobo, marginLabel };
}

export interface MarketplaceEstimate {
  commissionKobo: number;
  marketplaceKobo: number;
  paymentKobo: number;
  fulfilmentKobo: number;
  otherKobo: number;
  feesKobo: number;
  netKobo: number;
  profitKobo: number;
}

/**
 * Illustrative marketplace estimate from editable assumptions.
 * Fees are not official Jumia or Konga tariffs.
 */
export function marketplaceEstimate(priceKobo: number, costKobo: number, fee: Pick<FeeAssumption, "commissionBps" | "marketplaceBps" | "paymentBps" | "fulfilmentKobo" | "otherKobo">): MarketplaceEstimate | { error: string } {
  if (priceKobo < 0 || costKobo < 0) return { error: "Price and cost cannot be negative." };
  const commissionKobo = applyBps(priceKobo, fee.commissionBps);
  const marketplaceKobo = applyBps(priceKobo, fee.marketplaceBps);
  const paymentKobo = applyBps(priceKobo, fee.paymentBps);
  const fulfilmentKobo = fee.fulfilmentKobo;
  const otherKobo = fee.otherKobo;
  if ([fulfilmentKobo, otherKobo].some((value) => value < 0)) return { error: "Fees cannot be negative." };
  const feesKobo = commissionKobo + marketplaceKobo + paymentKobo + fulfilmentKobo + otherKobo;
  const netKobo = priceKobo - feesKobo;
  return {
    commissionKobo,
    marketplaceKobo,
    paymentKobo,
    fulfilmentKobo,
    otherKobo,
    feesKobo,
    netKobo,
    profitKobo: netKobo - costKobo,
  };
}
