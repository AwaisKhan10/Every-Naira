"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button, Field, TextArea, TextInput } from "@/components/ui";
import { addSupportNote, setSession } from "@/lib/domain";
import { todayIso, uid } from "@/lib/format";
import { formatNgn } from "@/lib/money";
import { useDemoStore } from "@/lib/store";

const LINKS = [
  ["How it works", "/how-it-works"],
  ["Features", "/features"],
  ["Pricing", "/pricing"],
  ["FAQ", "/faq"],
  ["About", "/about"],
  ["Help", "/help"],
  ["Contact", "/contact"],
] as const;

export function MarketingChrome({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen bg-bg text-ink">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
          <Link href="/" className="flex items-center gap-2 font-semibold"><span className="grid size-8 place-items-center rounded-md bg-accent text-sm text-accent-ink">₦</span>Every Naira Has a Job</Link>
          <nav className="ml-auto hidden items-center gap-4 text-sm md:flex" aria-label="Marketing">
            {LINKS.slice(0, 4).map(([label, href]) => <Link key={href} href={href} className="text-muted hover:text-ink">{label}</Link>)}
            <Link href="/login" className="text-muted hover:text-ink">Log in</Link>
            <Link href="/dashboard" className="inline-flex h-10 items-center rounded-md bg-accent px-3 text-accent-ink">Open demo</Link>
          </nav>
          <button type="button" className="ml-auto h-10 rounded-md border border-line px-3 text-sm md:hidden" onClick={() => setOpen((value) => !value)} aria-expanded={open}>Menu</button>
        </div>
        {open ? <nav className="grid gap-2 border-t border-line px-4 py-3 text-sm md:hidden" aria-label="Marketing">{LINKS.map(([label, href]) => <Link key={href} href={href} onClick={() => setOpen(false)}>{label}</Link>)}<Link href="/login">Log in</Link><Link href="/dashboard">Open demo</Link></nav> : null}
      </header>
      <main>{children}</main>
      <footer className="border-t border-line">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 text-sm md:grid-cols-4">
          <div><p className="font-medium">Every Naira Has a Job</p><p className="mt-2 text-muted">A demonstration of a product workspace for Nigerian sellers.</p></div>
          <div className="grid gap-1">{LINKS.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}</div>
          <div className="grid gap-1"><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/contact">Contact</Link></div>
          <p className="text-muted">Sample figures and testimonials on this site are placeholders, not customer endorsements or a live offer.</p>
        </div>
      </footer>
    </div>
  );
}

export function HomeScreen() {
  return (
    <MarketingChrome>
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 lg:grid-cols-2">
        <div>
          <p className="text-sm font-medium text-accent">For product businesses that sell in naira</p>
          <h1 className="mt-3 font-serif text-5xl leading-tight tracking-tight">Every naira should have a job.</h1>
          <p className="mt-4 max-w-xl text-lg text-muted">See what a product costs after freight and duty, what it should sell for, and what is still unpaid — before the month disappears into guesswork.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/dashboard" className="inline-flex h-11 items-center rounded-md bg-accent px-4 text-accent-ink">Open the demo</Link>
            <Link href="/how-it-works" className="inline-flex h-11 items-center rounded-md border border-line px-4">How it works</Link>
          </div>
        </div>
        <div className="rounded-xl border border-line bg-surface p-4 shadow-[var(--shadow)]">
          <p className="text-xs text-muted">Preview illustration, not live books</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {[["Sales", "₦154,000"], ["Estimated profit", "₦47,700"], ["Outstanding", "₦39,000"], ["Low stock", "2 variants"]].map(([label, value]) => (
              <div key={label} className="rounded-md border border-line bg-bg px-3 py-3"><p className="text-xs text-muted">{label}</p><p className="mt-1 text-lg font-semibold">{value}</p></div>
            ))}
          </div>
          <div className="mt-3 h-24 rounded-md bg-accent-soft" />
        </div>
      </section>
      <section className="border-t border-line bg-surface">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-14 md:grid-cols-3">
          {[["True cost", "Turn a foreign invoice, freight, and duty into a unit cost you can explain."], ["Pricing", "Test a margin, a discount, and illustrative marketplace fees before you change a price."], ["Orders and stock", "A sale reduces the same stock figure the inventory page is reading."]].map(([title, body]) => (
            <div key={title}><h2 className="font-medium">{title}</h2><p className="mt-2 text-sm text-muted">{body}</p></div>
          ))}
        </div>
      </section>
    </MarketingChrome>
  );
}

export function SimplePage({ title, lede, children }: { title: string; lede: string; children: React.ReactNode }) {
  return (
    <MarketingChrome>
      <article className="mx-auto max-w-3xl px-4 py-14">
        <h1 className="font-serif text-4xl tracking-tight">{title}</h1>
        <p className="mt-3 text-muted">{lede}</p>
        <div className="mt-8 grid gap-4 text-sm leading-6">{children}</div>
      </article>
    </MarketingChrome>
  );
}

const contactSchema = z.object({
  name: z.string().trim().min(2, "Enter your name."),
  email: z.string().trim().email("Enter an email address."),
  topic: z.string().trim().min(2, "Add a topic."),
  message: z.string().trim().min(8, "Write a short message."),
});

export function ContactScreen() {
  const data = useDemoStore((state) => state.data);
  const apply = useDemoStore((state) => state.apply);
  const [saved, setSaved] = useState(false);
  const form = useForm({ resolver: zodResolver(contactSchema), defaultValues: { name: "", email: "", topic: "Demo question", message: "" } });
  return (
    <SimplePage title="Contact" lede="This form stores a note in the browser for the admin demo. It does not email anyone.">
      <form className="grid gap-3" onSubmit={form.handleSubmit((values) => {
        if (apply(addSupportNote(data, { id: uid("sup"), at: todayIso(), ...values }))) setSaved(true);
      })}>
        <Field label="Name" error={form.formState.errors.name?.message}><TextInput {...form.register("name")} /></Field>
        <Field label="Email" error={form.formState.errors.email?.message}><TextInput {...form.register("email")} /></Field>
        <Field label="Topic" error={form.formState.errors.topic?.message}><TextInput {...form.register("topic")} /></Field>
        <Field label="Message" error={form.formState.errors.message?.message}><TextArea {...form.register("message")} /></Field>
        <Button type="submit">Save in this browser</Button>
        {saved ? <p>Saved. Open Admin in the demo to see it. Nobody was contacted.</p> : null}
      </form>
    </SimplePage>
  );
}

const authSchema = z.object({
  name: z.string().trim().min(2, "Enter a name."),
  email: z.string().trim().email("Enter an email."),
  password: z.string().min(8, "Use at least 8 characters. It is not stored as a real password."),
  business: z.string().trim().min(2, "Name the business."),
});

export function AuthScreen({ mode }: { mode: "login" | "start" }) {
  const data = useDemoStore((state) => state.data);
  const apply = useDemoStore((state) => state.apply);
  const router = useRouter();
  const form = useForm({ resolver: zodResolver(mode === "login" ? authSchema.omit({ business: true, name: true }).extend({ name: z.string().optional(), business: z.string().optional() }) : authSchema), defaultValues: { name: "Adaeze Okonkwo", email: "adaeze@adaeze.example", password: "demonstration", business: "Adaeze Collective" } });
  return (
    <SimplePage title={mode === "login" ? "Log in" : "Get started"} lede="This is a demonstration sign-in. It does not create an account or check a password against a server.">
      <form className="grid gap-3" onSubmit={form.handleSubmit((values) => {
        if (apply(setSession(data, values.name || "Adaeze Okonkwo", values.email))) router.push("/dashboard");
      })}>
        {mode === "start" ? <Field label="Name" error={form.formState.errors.name?.message}><TextInput {...form.register("name")} /></Field> : null}
        {mode === "start" ? <Field label="Business" error={form.formState.errors.business?.message}><TextInput {...form.register("business")} /></Field> : null}
        <Field label="Email" error={form.formState.errors.email?.message}><TextInput {...form.register("email")} /></Field>
        <Field label="Password" error={form.formState.errors.password?.message}><TextInput type="password" {...form.register("password")} /></Field>
        <Button type="submit">{mode === "login" ? "Continue to the demo" : "Create demonstration profile"}</Button>
      </form>
      <p>Plan preview prices start at {formatNgn(1_500_000)} a month and are not a live offer. <Link className="text-accent" href="/pricing">See pricing</Link></p>
    </SimplePage>
  );
}
