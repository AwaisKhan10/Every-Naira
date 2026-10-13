"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/shell";
import { Button, Card, Field, SelectInput, TextInput } from "@/components/ui";
import { saveGoal, saveTask, toggleTask } from "@/lib/domain";
import { formatDate, uid } from "@/lib/format";
import { formatNgn, parseNairaToKobo } from "@/lib/money";
import { byWorkspace, selectMetrics } from "@/lib/selectors";
import { DEMO_ANCHOR } from "@/lib/seed";
import { useDemoStore } from "@/lib/store";
import { toCsv } from "@/lib/csv";
import type { MetricKey } from "@/lib/types";

export function GoalsScreen() {
  const data = useDemoStore((state) => state.data);
  const apply = useDemoStore((state) => state.apply);
  const metrics = selectMetrics(data, data.activeWorkspaceId, "all", DEMO_ANCHOR);
  const goals = byWorkspace(data.goals, data.activeWorkspaceId);
  const [title, setTitle] = useState("");
  const [metric, setMetric] = useState<MetricKey>("sales");
  const [target, setTarget] = useState("100000");
  const [deadline, setDeadline] = useState("2026-10-31");
  return (
    <div>
      <PageHeader title="Goals" description="Progress uses the same sales and profit figures as the dashboard for this workspace." />
      <div className="grid gap-3">
        {goals.map((goal) => {
          const current = goal.metric === "sales" ? metrics.salesKobo : goal.metric === "profit" ? metrics.estimatedProfitKobo : metrics.orderCount;
          const ratio = Math.max(0, Math.min(100, Math.round((current / goal.target) * 100)));
          return (
            <Card key={goal.id} className="p-4">
              <div className="flex items-center justify-between gap-3"><h2 className="font-medium">{goal.title}</h2><span className="text-sm text-muted">Due {formatDate(goal.deadline)}</span></div>
              <p className="mt-1 text-sm text-muted">{goal.notes}</p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-2"><div className="h-full bg-accent" style={{ width: `${ratio}%` }} /></div>
              <p className="mt-2 text-sm tabular-nums">{goal.metric === "orders" ? `${current} / ${goal.target} orders` : `${formatNgn(current)} / ${formatNgn(goal.target)}`} · {ratio}%</p>
            </Card>
          );
        })}
      </div>
      <form className="mt-4 grid max-w-xl gap-3" onSubmit={(event) => {
        event.preventDefault();
        const parsed = metric === "orders" ? Number(target) : parseNairaToKobo(target);
        if (parsed === null || !Number.isInteger(parsed)) return;
        apply(saveGoal(data, { id: uid("goal"), workspaceId: data.activeWorkspaceId, title, metric, target: parsed, deadline, notes: "" }));
        setTitle("");
      }}>
        <Field label="Goal"><TextInput value={title} onChange={(event) => setTitle(event.target.value)} /></Field>
        <Field label="Measure"><SelectInput value={metric} onChange={(event) => setMetric(event.target.value as MetricKey)}><option value="sales">Sales</option><option value="profit">Estimated profit</option><option value="orders">Orders</option></SelectInput></Field>
        <Field label={metric === "orders" ? "Target count" : "Target (₦)"}><TextInput value={target} onChange={(event) => setTarget(event.target.value)} /></Field>
        <Field label="Deadline"><TextInput type="date" value={deadline} onChange={(event) => setDeadline(event.target.value)} /></Field>
        <Button type="submit">Add goal</Button>
      </form>
    </div>
  );
}

export function PlannerScreen() {
  const data = useDemoStore((state) => state.data);
  const apply = useDemoStore((state) => state.apply);
  const tasks = byWorkspace(data.tasks, data.activeWorkspaceId);
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("2026-10-18");
  const [cursor, setCursor] = useState("2026-10-01");
  const days = useMemo(() => {
    const [year, month] = cursor.split("-").map(Number);
    const count = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const start = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
    return { count, start, year, month };
  }, [cursor]);
  return (
    <div>
      <PageHeader title="Planner" description="Tasks and reminders live in this browser. Completing a task updates the list immediately." />
      <div className="mb-3 flex gap-2">
        <Button type="button" variant="secondary" onClick={() => setCursor("2026-09-01")}>Sep 2026</Button>
        <Button type="button" variant="secondary" onClick={() => setCursor("2026-10-01")}>Oct 2026</Button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <div key={day} className="py-1 text-muted">{day}</div>)}
        {Array.from({ length: days.start }, (_, index) => <div key={`pad-${index}`} />)}
        {Array.from({ length: days.count }, (_, index) => {
          const day = String(index + 1).padStart(2, "0");
          const iso = `${days.year}-${String(days.month).padStart(2, "0")}-${day}`;
          const dueTasks = tasks.filter((task) => task.due === iso);
          return <div key={iso} className="min-h-16 rounded-md border border-line bg-surface p-1 text-left"><span className="text-xs">{index + 1}</span>{dueTasks.map((task) => <p key={task.id} className="truncate text-[11px] text-accent">{task.title}</p>)}</div>;
        })}
      </div>
      <ul className="mt-4 grid gap-2">
        {tasks.map((task) => (
          <li key={task.id} className="flex items-center justify-between gap-3 rounded-md border border-line bg-surface px-3 py-2 text-sm">
            <span className={task.done ? "text-muted line-through" : ""}>{task.title} · {formatDate(task.due)}</span>
            <Button type="button" size="sm" variant="secondary" onClick={() => apply(toggleTask(data, { workspaceId: data.activeWorkspaceId, taskId: task.id }))}>{task.done ? "Reopen" : "Complete"}</Button>
          </li>
        ))}
      </ul>
      <form className="mt-4 flex flex-wrap gap-2" onSubmit={(event) => { event.preventDefault(); apply(saveTask(data, { id: uid("task"), workspaceId: data.activeWorkspaceId, title, due, notes: "" })); setTitle(""); }}>
        <TextInput value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Task" aria-label="Task title" className="max-w-sm" />
        <TextInput type="date" value={due} onChange={(event) => setDue(event.target.value)} aria-label="Due date" className="max-w-40" />
        <Button type="submit">Add task</Button>
      </form>
    </div>
  );
}

export function ReportsScreen() {
  const data = useDemoStore((state) => state.data);
  const [range, setRange] = useState<"all" | "30d" | "7d">("all");
  const metrics = selectMetrics(data, data.activeWorkspaceId, range, DEMO_ANCHOR);
  const orders = byWorkspace(data.orders, data.activeWorkspaceId).filter((order) => order.status !== "cancelled");
  function download() {
    const csv = toCsv(["order", "date", "total_kobo"], orders.map((order) => [order.number, order.createdAt, String(order.lines.reduce((sum, line) => sum + line.qty * line.unitPriceKobo - line.discountKobo, 0) - order.discountKobo + order.deliveryFeeKobo)]));
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "orders-demo.csv";
    link.click();
    URL.revokeObjectURL(url);
  }
  return (
    <div>
      <PageHeader title="Reports" description="These totals are derived from the demonstration orders, stock, and expenses." actions={<Button onClick={download}>Download orders CSV</Button>} />
      <SelectInput className="mb-4 max-w-xs" value={range} onChange={(event) => setRange(event.target.value as typeof range)} aria-label="Report range">
        <option value="7d">7 days</option>
        <option value="30d">30 days</option>
        <option value="all">All sample dates</option>
      </SelectInput>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Card className="p-4"><p className="text-xs text-muted">Sales</p><p className="text-xl font-semibold tabular-nums">{formatNgn(metrics.salesKobo)}</p></Card>
        <Card className="p-4"><p className="text-xs text-muted">Estimated profit</p><p className="text-xl font-semibold tabular-nums">{formatNgn(metrics.estimatedProfitKobo)}</p></Card>
        <Card className="p-4"><p className="text-xs text-muted">Inventory value</p><p className="text-xl font-semibold tabular-nums">{formatNgn(metrics.inventoryValueKobo)}</p></Card>
        <Card className="p-4"><p className="text-xs text-muted">Orders</p><p className="text-xl font-semibold">{metrics.orderCount}</p></Card>
      </div>
      <h2 className="mt-6 mb-2 text-sm font-medium">Customers</h2>
      <ul className="grid gap-2 text-sm">
        {byWorkspace(data.customers, data.activeWorkspaceId).map((customer) => {
          const count = orders.filter((order) => order.customerId === customer.id).length;
          return <li key={customer.id} className="flex justify-between rounded-md border border-line bg-surface px-3 py-2"><span>{customer.name}</span><span>{count} orders</span></li>;
        })}
      </ul>
    </div>
  );
}
