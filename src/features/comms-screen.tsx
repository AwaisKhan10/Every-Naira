"use client";

import { useState } from "react";
import { PageHeader } from "@/components/shell";
import { Badge, Button, Card, Field, SelectInput, TextArea, TextInput } from "@/components/ui";
import { createMessage, setMessageStatus } from "@/lib/domain";
import { formatDate, todayIso, uid } from "@/lib/format";
import { formatNgn } from "@/lib/money";
import { customerBalance, byWorkspace } from "@/lib/selectors";
import { useDemoStore } from "@/lib/store";
import type { Channel, MessageStatus } from "@/lib/types";

export function CommsScreen({ channel }: { channel: Channel }) {
  const data = useDemoStore((state) => state.data);
  const apply = useDemoStore((state) => state.apply);
  const customers = byWorkspace(data.customers, data.activeWorkspaceId);
  const templates = byWorkspace(data.templates, data.activeWorkspaceId).filter((template) => template.channel === channel);
  const messages = byWorkspace(data.messages, data.activeWorkspaceId).filter((message) => message.channel === channel);
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? "");
  const [customerId, setCustomerId] = useState(customers[0]?.id ?? "");
  const customer = customers.find((item) => item.id === customerId);
  const template = templates.find((item) => item.id === templateId);
  const order = data.orders.find((item) => item.customerId === customerId && item.status !== "cancelled");
  const rendered = (template?.body ?? "").replaceAll("{{customer}}", customer?.name ?? "").replaceAll("{{order}}", order?.number ?? "an order").replaceAll("{{balance}}", formatNgn(customer ? customerBalance(data, customer.id) : 0)).replaceAll("{{status}}", order?.fulfilment ?? "open");
  const [body, setBody] = useState(rendered);
  const [subject, setSubject] = useState(template?.subject ?? "");

  return (
    <div>
      <PageHeader title={channel === "whatsapp" ? "WhatsApp Business Centre" : "Email centre"} description="Demo mode — messages are not sent externally. Status changes below are simulated inside this browser." />
      <Card className="mb-4 border-warn/40 bg-warn-soft px-4 py-3 text-sm text-warn">Demo mode — messages are not sent externally.</Card>
      <div className="grid gap-4 lg:grid-cols-2">
        <form className="grid gap-3" onSubmit={(event) => { event.preventDefault(); apply(createMessage(data, { id: uid("msg"), workspaceId: data.activeWorkspaceId, channel, customerId, recipient: channel === "email" ? customer?.email ?? "" : customer?.name ?? "", subject, body, date: todayIso() })); }}>
          <Field label="Template"><SelectInput value={templateId} onChange={(event) => { const next = templates.find((item) => item.id === event.target.value); setTemplateId(event.target.value); if (next) { setSubject(next.subject); setBody(next.body); } }}>{templates.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</SelectInput></Field>
          <Field label="Recipient"><SelectInput value={customerId} onChange={(event) => setCustomerId(event.target.value)}>{customers.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</SelectInput></Field>
          {channel === "email" ? <Field label="Subject"><TextInput value={subject} onChange={(event) => setSubject(event.target.value)} /></Field> : null}
          <Field label="Message"><TextArea value={body} onChange={(event) => setBody(event.target.value)} /></Field>
          <Button type="submit">Save draft</Button>
          <div className="rounded-md border border-line bg-surface p-3 text-sm">
            <p className="text-xs text-muted">Attachment preview</p>
            <p>{order ? `${order.number} invoice preview is available in Documents.` : "No open order to attach."}</p>
          </div>
        </form>
        <div className="grid gap-2">
          <h2 className="text-sm font-medium">History</h2>
          {messages.map((message) => (
            <Card key={message.id} className="p-3 text-sm">
              <div className="flex items-center justify-between gap-2"><span>{message.recipient}</span><Badge tone={message.status === "simulated_failed" ? "bad" : message.status === "simulated_queued" ? "warn" : "neutral"}>{label(message.status)}</Badge></div>
              <p className="mt-1 text-muted">{formatDate(message.at)} · {message.subject}</p>
              <p className="mt-2 whitespace-pre-wrap">{message.body}</p>
              {message.failureReason ? <p className="mt-1 text-danger">{message.failureReason}</p> : null}
              <div className="mt-2 flex gap-2">
                <Button type="button" size="sm" variant="secondary" onClick={() => apply(setMessageStatus(data, { workspaceId: data.activeWorkspaceId, messageId: message.id, status: "simulated_queued" }))}>Simulate queue</Button>
                <Button type="button" size="sm" variant="secondary" onClick={() => apply(setMessageStatus(data, { workspaceId: data.activeWorkspaceId, messageId: message.id, status: "simulated_failed" }))}>Simulate failure</Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => apply(setMessageStatus(data, { workspaceId: data.activeWorkspaceId, messageId: message.id, status: "draft" }))}>Back to draft</Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

function label(status: MessageStatus): string {
  if (status === "simulated_queued") return "Simulated queue";
  if (status === "simulated_failed") return "Simulated failure";
  return "Draft";
}
