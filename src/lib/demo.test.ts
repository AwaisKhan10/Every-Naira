import { describe, expect, it } from "vitest";
import { validateProductCsv, parseCsv, toCsv } from "@/lib/csv";
import { addPayment, adjustStock, cancelOrder, createOrder, receivePurchase } from "@/lib/domain";
import { stockOf } from "@/lib/inventory";
import { applyBps, formatNgn, parseNairaToKobo, roundDiv } from "@/lib/money";
import { orderTotals } from "@/lib/orders";
import { discountImpact, landedCost, marketplaceEstimate, suggestedPriceKobo } from "@/lib/pricing";
import { createSeed } from "@/lib/seed";
import { inventoryValue, selectMetrics } from "@/lib/selectors";

describe("money", () => {
  it("rounds half away from zero and formats naira from kobo", () => {
    expect(roundDiv(150, 100)).toBe(2);
    expect(roundDiv(149, 100)).toBe(1);
    expect(roundDiv(-150, 100)).toBe(-2);
    expect(applyBps(1_850_000, 150)).toBe(27_750);
    expect(formatNgn(1_850_050)).toBe("₦18,500.50");
    expect(formatNgn(-450_000)).toBe("-₦4,500.00");
    expect(parseNairaToKobo("18,500.50")).toBe(1_850_050);
    expect(parseNairaToKobo("10.5")).toBe(1_050);
    expect(parseNairaToKobo("10.555")).toBeNull();
  });
});

describe("landed cost and pricing", () => {
  it("allocates the ankara batch to ₦8,000 per unit", () => {
    const result = landedCost({
      lines: [
        { qty: 18, unitMinor: 700_000 },
        { qty: 10, unitMinor: 700_000 },
      ],
      ngnKoboPerMajor: 100,
      shippingKobo: 2_200_000,
      dutiesKobo: 0,
      otherKobo: 600_000,
    });
    expect(result).toMatchObject({ totalKobo: 22_400_000, unitKobo: 800_000, remainderKobo: 0 });
  });

  it("converts the sample sandal rate without treating it as a live rate", () => {
    const result = landedCost({
      lines: [
        { qty: 12, unitMinor: 400 },
        { qty: 8, unitMinor: 400 },
      ],
      ngnKoboPerMajor: 155_000,
      shippingKobo: 2_200_000,
      dutiesKobo: 800_000,
      otherKobo: 0,
    });
    expect(result).toMatchObject({ goodsKobo: 12_400_000, unitKobo: 770_000 });
  });

  it("suggests a price from margin and shows discount impact", () => {
    expect(suggestedPriceKobo(800_000, 5_000)).toBe(1_600_000);
    const impact = discountImpact(1_850_000, 800_000, 100_000);
    expect(impact).toMatchObject({ discountedKobo: 1_750_000, profitKobo: 950_000 });
  });

  it("estimates marketplace net from editable assumptions", () => {
    const estimate = marketplaceEstimate(1_850_000, 800_000, {
      commissionBps: 800,
      marketplaceBps: 0,
      paymentBps: 150,
      fulfilmentKobo: 50_000,
      otherKobo: 0,
    });
    expect(estimate).toMatchObject({
      commissionKobo: 148_000,
      paymentKobo: 27_750,
      fulfilmentKobo: 50_000,
      feesKobo: 225_750,
      netKobo: 1_624_250,
      profitKobo: 824_250,
    });
  });
});

describe("seed integrity", () => {
  const data = createSeed();

  it("keeps stock, sales, profit, and inventory on one dataset", () => {
    const movements = data.movements;
    expect(stockOf(movements, "v_ankara_m")).toBe(17);
    expect(stockOf(movements, "v_ankara_l")).toBe(9);
    expect(stockOf(movements, "v_san_39")).toBe(10);
    expect(stockOf(movements, "v_san_42")).toBe(2);
    expect(stockOf(movements, "v_shea")).toBe(36);
    expect(stockOf(movements, "v_ear")).toBe(1);
    const all = selectMetrics(data, "ws_adaeze", "all", "2026-10-13");
    expect(all.salesKobo).toBe(15_400_000);
    expect(all.cogsKobo).toBe(6_090_000);
    expect(all.expenseKobo).toBe(4_150_000);
    expect(all.estimatedProfitKobo).toBe(4_770_000);
    expect(all.outstandingKobo).toBe(3_900_000);
    expect(all.inventoryValueKobo).toBe(36_740_000);
    expect(inventoryValue(data, "ws_adaeze")).toBe(36_740_000);
    expect(all.lowStockCount).toBe(2);
    const week = selectMetrics(data, "ws_adaeze", "7d", "2026-10-13");
    expect(week.salesKobo).toBe(10_550_000);
    expect(week.estimatedProfitKobo).toBe(6_360_000);
    expect(week.orderCount).toBe(5);
  });

  it("does not let payments exceed order totals", () => {
    for (const order of data.orders) {
      const totals = orderTotals(order);
      expect(totals.outstandingKobo).toBeGreaterThanOrEqual(0);
      expect(totals.netPaidKobo).toBeLessThanOrEqual(totals.totalKobo);
    }
  });
});

describe("order and inventory mutations", () => {
  it("rejects overpayment, duplicate payments, and negative stock", () => {
    const data = createSeed();
    const over = addPayment(data, {
      workspaceId: "ws_adaeze",
      orderId: "o2",
      id: "pay_over",
      amountKobo: 1_600_001,
      method: "Transfer",
      date: "2026-10-13",
      note: "too much",
      idempotencyKey: "once",
    });
    expect(over.ok).toBe(false);
    const paid = addPayment(data, {
      workspaceId: "ws_adaeze",
      orderId: "o2",
      id: "pay_ok",
      amountKobo: 1_600_000,
      method: "Transfer",
      date: "2026-10-13",
      note: "balance",
      idempotencyKey: "once",
    });
    expect(paid.ok).toBe(true);
    if (!paid.ok) return;
    const duplicate = addPayment(paid.data, {
      workspaceId: "ws_adaeze",
      orderId: "o2",
      id: "pay_ok_2",
      amountKobo: 1,
      method: "Transfer",
      date: "2026-10-13",
      note: "again",
      idempotencyKey: "once",
    });
    expect(duplicate.ok).toBe(false);
    const negative = adjustStock(data, {
      id: "adj1",
      workspaceId: "ws_adaeze",
      variantId: "v_ear",
      delta: -5,
      date: "2026-10-13",
      note: "count correction",
      type: "adjustment",
    });
    expect(negative.ok).toBe(false);
  });

  it("creates an order, reduces stock, and restores it on cancel", () => {
    const data = createSeed();
    const created = createOrder(data, {
      id: "o_new",
      workspaceId: "ws_adaeze",
      customerId: "c5",
      date: "2026-10-13",
      discountKobo: 0,
      deliveryFeeKobo: 0,
      deliveryCostKobo: 0,
      historyId: "h_new",
      movementIds: ["mv_new"],
      lines: [{ id: "ln1", variantId: "v_ear", qty: 1, unitPriceKobo: 650_000, discountKobo: 0 }],
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    expect(stockOf(created.data.movements, "v_ear")).toBe(0);
    expect(orderTotals(created.data.orders[0]).totalKobo).toBe(650_000);
    const blocked = createOrder(created.data, {
      id: "o_new_2",
      workspaceId: "ws_adaeze",
      customerId: "c5",
      date: "2026-10-13",
      discountKobo: 0,
      deliveryFeeKobo: 0,
      deliveryCostKobo: 0,
      historyId: "h_new_2",
      movementIds: ["mv_new_2"],
      lines: [{ id: "ln2", variantId: "v_ear", qty: 1, unitPriceKobo: 650_000, discountKobo: 0 }],
    });
    expect(blocked.ok).toBe(false);
    const cancelled = cancelOrder(created.data, { workspaceId: "ws_adaeze", orderId: "o_new", date: "2026-10-13", historyId: "h_cancel", movementIds: ["mv_back"] });
    expect(cancelled.ok).toBe(true);
    if (!cancelled.ok) return;
    expect(stockOf(cancelled.data.movements, "v_ear")).toBe(1);
  });

  it("receives the remaining sandals without exceeding the order", () => {
    const data = createSeed();
    const received = receivePurchase(data, {
      workspaceId: "ws_adaeze",
      purchaseId: "pu2",
      date: "2026-10-16",
      receipts: [{ lineId: "pl4", qty: 5, movementId: "mv_more" }],
    });
    expect(received.ok).toBe(true);
    if (!received.ok) return;
    expect(stockOf(received.data.movements, "v_san_42")).toBe(7);
    const purchase = received.data.purchases.find((item) => item.id === "pu2");
    expect(purchase?.status).toBe("received");
    const extra = receivePurchase(received.data, {
      workspaceId: "ws_adaeze",
      purchaseId: "pu2",
      date: "2026-10-16",
      receipts: [{ lineId: "pl4", qty: 1, movementId: "mv_too_many" }],
    });
    expect(extra.ok).toBe(false);
  });
});

describe("csv", () => {
  it("parses quotes and rejects invalid product rows", () => {
    const parsed = parseCsv('name,type,sku,price,stock\n"Brass cuff, small",physical,BRC-1,"4,200.00",6\n,physical,X,nope,-1\n');
    expect("error" in parsed).toBe(false);
    if ("error" in parsed) return;
    expect(parsed.rows[0]?.[0]).toBe("Brass cuff, small");
    const mapped = { name: "name", type: "type", sku: "sku", category: "", price: "price", cost: "", stock: "stock", barcode: "", description: "" };
    const result = validateProductCsv(parsed, mapped, ["ANK-IND-M"]);
    expect(result.drafts).toHaveLength(1);
    expect(result.drafts[0]?.priceKobo).toBe(420_000);
    expect(result.issues.length).toBeGreaterThan(0);
    expect(toCsv(["sku"], [["A,B"]])).toBe('sku\n"A,B"');
  });
});
