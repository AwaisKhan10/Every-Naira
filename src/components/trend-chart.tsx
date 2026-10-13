"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatDate } from "@/lib/format";
import { formatCompactNgn, formatNgn } from "@/lib/money";
import type { ChartPoint } from "@/lib/selectors";

export function TrendChart({ points, metric }: { points: ChartPoint[]; metric: "salesKobo" | "profitKobo" }) {
  const data = points.map((point) => ({ ...point, label: formatDate(point.date).slice(0, 6) }));
  if (data.length === 0) {
    return <p className="grid h-64 place-items-center text-sm text-muted">No orders in this range.</p>;
  }
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="var(--line)" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: "var(--muted)", fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={(value: number) => formatCompactNgn(value)} tick={{ fill: "var(--muted)", fontSize: 12 }} axisLine={false} tickLine={false} width={64} />
          <Tooltip formatter={(value) => formatNgn(Number(value ?? 0))} labelFormatter={(_, payload) => String(payload?.[0]?.payload?.date ? formatDate(payload[0].payload.date) : "")} />
          <Area type="monotone" dataKey={metric} stroke="var(--accent)" fill="var(--accent-soft)" strokeWidth={2} name={metric === "salesKobo" ? "Sales" : "Estimated profit"} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
