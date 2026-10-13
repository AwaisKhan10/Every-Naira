import type { Order, OrderTotals } from "@/lib/types";

export function lineNetKobo(line: { qty: number; unitPriceKobo: number; discountKobo: number }): number {
  return line.qty * line.unitPriceKobo - line.discountKobo;
}

export function orderTotals(order: Pick<Order, "lines" | "discountKobo" | "deliveryFeeKobo" | "deliveryCostKobo" | "payments" | "refunds">): OrderTotals {
  const merchandiseKobo = order.lines.reduce((sum, line) => sum + lineNetKobo(line), 0);
  const totalKobo = merchandiseKobo - order.discountKobo + order.deliveryFeeKobo;
  const paidKobo = order.payments.reduce((sum, payment) => sum + payment.amountKobo, 0);
  const refundedKobo = order.refunds.reduce((sum, refund) => sum + refund.amountKobo, 0);
  const netPaidKobo = paidKobo - refundedKobo;
  const cogsKobo = order.lines.reduce((sum, line) => sum + line.qty * line.unitCostKobo, 0);
  const restockedCogsKobo = order.refunds.reduce((sum, refund) => sum + refund.restockQty * refund.unitCostKobo, 0);
  return {
    merchandiseKobo,
    totalKobo,
    paidKobo,
    refundedKobo,
    netPaidKobo,
    outstandingKobo: totalKobo - netPaidKobo,
    cogsKobo,
    restockedCogsKobo,
    deliveryFeeKobo: order.deliveryFeeKobo,
    deliveryCostKobo: order.deliveryCostKobo,
  };
}

export function paymentStatus(order: Order): "unpaid" | "partial" | "paid" | "refunded" | "cancelled" {
  if (order.status === "cancelled") return "cancelled";
  const totals = orderTotals(order);
  if (totals.refundedKobo > 0 && totals.netPaidKobo <= 0) return "refunded";
  if (totals.outstandingKobo <= 0 && totals.netPaidKobo > 0) return "paid";
  if (totals.netPaidKobo > 0) return "partial";
  return "unpaid";
}

export function nextOrderNumber(numbers: string[]): string {
  const max = numbers.reduce((highest, number) => {
    const value = Number(number.replace(/\D/g, ""));
    return Number.isFinite(value) ? Math.max(highest, value) : highest;
  }, 1000);
  return `ORD-${max + 1}`;
}
