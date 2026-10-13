"use client";

import * as Popover from "@radix-ui/react-popover";
import {
  BarChart3,
  Bell,
  Calculator,
  CalendarDays,
  ChevronLeft,
  CreditCard,
  FileText,
  FlaskConical,
  LayoutDashboard,
  Mail,
  Menu as MenuIcon,
  MessageCircle,
  Moon,
  Package,
  Plug,
  Search,
  Shield,
  ShoppingBag,
  Sun,
  Target,
  Tags,
  Truck,
  Upload,
  Users,
  Warehouse,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState, useSyncExternalStore } from "react";
import { Menu, MenuItem } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { markNotificationsRead, setRole, setWorkspace } from "@/lib/domain";
import { cn } from "@/lib/cn";
import { useDemoStore } from "@/lib/store";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, group: "Operate" },
  { href: "/orders", label: "Orders", icon: ShoppingBag, group: "Operate" },
  { href: "/customers", label: "Customers", icon: Users, group: "Operate" },
  { href: "/documents", label: "Documents", icon: FileText, group: "Operate" },
  { href: "/products", label: "Products", icon: Package, group: "Catalog" },
  { href: "/costing", label: "True cost", icon: Calculator, group: "Catalog" },
  { href: "/pricing-studio", label: "Pricing", icon: Tags, group: "Catalog" },
  { href: "/inventory", label: "Inventory", icon: Warehouse, group: "Catalog" },
  { href: "/suppliers", label: "Suppliers", icon: Truck, group: "Catalog" },
  { href: "/development", label: "Development", icon: FlaskConical, group: "Catalog" },
  { href: "/whatsapp", label: "WhatsApp", icon: MessageCircle, group: "Grow" },
  { href: "/email", label: "Email", icon: Mail, group: "Grow" },
  { href: "/goals", label: "Goals", icon: Target, group: "Grow" },
  { href: "/planner", label: "Planner", icon: CalendarDays, group: "Grow" },
  { href: "/reports", label: "Reports", icon: BarChart3, group: "Grow" },
  { href: "/import", label: "CSV import", icon: Upload, group: "System" },
  { href: "/integrations", label: "Integrations", icon: Plug, group: "System" },
  { href: "/billing", label: "Billing", icon: CreditCard, group: "System" },
  { href: "/admin", label: "Admin", icon: Shield, group: "System" },
];

const LABELS: Record<string, string> = Object.fromEntries(NAV.map((item) => [item.href.slice(1), item.label]));

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const dark = useSyncExternalStore(subscribeTheme, getThemeSnapshot, () => false);

  function toggleTheme() {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("enj-theme", next ? "dark" : "light");
  }

  const crumbs = pathname.split("/").filter(Boolean).slice(0, 2).map((part, index, all) => ({
    href: `/${all.slice(0, index + 1).join("/")}`,
    label: LABELS[part] ?? part,
  }));

  return (
    <div className="min-h-screen bg-bg text-ink">
      <aside className={cn("no-print fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-line bg-surface md:flex", collapsed ? "w-[76px]" : "w-64")}>
        <Brand collapsed={collapsed} />
        <nav className="flex-1 overflow-y-auto px-2 py-3" aria-label="Application">
          <NavLinks pathname={pathname} collapsed={collapsed} />
        </nav>
        <button type="button" className="m-2 flex h-10 items-center justify-center rounded-md text-muted hover:bg-surface-2" onClick={() => setCollapsed((value) => !value)} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
          <ChevronLeft className={cn("size-4", collapsed && "rotate-180")} />
        </button>
      </aside>
      {mobileOpen ? (
        <div className="no-print fixed inset-0 z-40 md:hidden">
          <button className="absolute inset-0 bg-ink/40" aria-label="Close menu" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 overflow-y-auto bg-surface p-3 shadow-[var(--shadow)]">
            <Brand collapsed={false} />
            <nav aria-label="Application" onClick={() => setMobileOpen(false)}>
              <NavLinks pathname={pathname} collapsed={false} />
            </nav>
          </div>
        </div>
      ) : null}
      <div className={cn("min-h-screen", collapsed ? "md:pl-[76px]" : "md:pl-64")}>
        <header className="no-print sticky top-0 z-20 border-b border-line bg-bg/90 backdrop-blur">
          <div className="flex h-14 items-center gap-2 px-3 md:px-5">
            <button type="button" className="grid size-10 place-items-center rounded-md hover:bg-surface md:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu">
              <MenuIcon className="size-5" />
            </button>
            <SearchBox />
            <div className="ml-auto flex items-center gap-1">
              <button type="button" className="grid size-10 place-items-center rounded-md hover:bg-surface" onClick={toggleTheme} aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}>
                {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
              </button>
              <Notifications />
              <ProfileMenu />
            </div>
          </div>
        </header>
        <div className="no-print border-b border-line bg-accent-soft px-4 py-2 text-xs text-accent md:px-6">
          Demonstration data. Changes stay in this browser and are not a production database. Payments and messages are simulated.
        </div>
        <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6">
          <nav className="no-print mb-4 flex flex-wrap items-center gap-1 text-xs text-muted" aria-label="Breadcrumb">
            <Link href="/dashboard" className="hover:text-ink">Home</Link>
            {crumbs.map((crumb) => (
              <span key={crumb.href} className="flex items-center gap-1">
                <span>/</span>
                <Link href={crumb.href} className="hover:text-ink">{crumb.label}</Link>
              </span>
            ))}
          </nav>
          {children}
        </div>
      </div>
    </div>
  );
}

function Brand({ collapsed }: { collapsed: boolean }) {
  return (
    <Link href="/dashboard" className="flex h-14 items-center gap-2 px-3">
      <span className="grid size-8 shrink-0 place-items-center rounded-md bg-accent text-sm font-semibold text-accent-ink">₦</span>
      {collapsed ? null : <span className="text-sm leading-tight font-semibold">Every Naira Has a Job</span>}
    </Link>
  );
}

function subscribeTheme(onStoreChange: () => void) {
  const observer = new MutationObserver(onStoreChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
}

function getThemeSnapshot() {
  return document.documentElement.classList.contains("dark");
}

function NavLinks({ pathname, collapsed }: { pathname: string; collapsed: boolean }) {
  return (
    <div className="grid gap-0.5">
      {NAV.map((item, index) => {
        const showGroup = index === 0 || NAV[index - 1]?.group !== item.group;
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <div key={item.href}>
            {showGroup && !collapsed ? <p className="px-2 pt-3 pb-1 text-[11px] font-medium tracking-wide text-muted uppercase">{item.group}</p> : null}
            <Link href={item.href} aria-current={active ? "page" : undefined} title={item.label} className={cn("flex h-10 items-center gap-2 rounded-md px-2 text-sm", active ? "bg-accent-soft font-medium text-accent" : "text-ink hover:bg-surface-2")}>
              <Icon className="size-4 shrink-0" />
              {collapsed ? <span className="sr-only">{item.label}</span> : item.label}
            </Link>
          </div>
        );
      })}
    </div>
  );
}

function SearchBox() {
  const data = useDemoStore((state) => state.data);
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 1) return [];
    const workspaceId = data.activeWorkspaceId;
    const products = data.products.filter((item) => item.workspaceId === workspaceId && item.name.toLowerCase().includes(q)).slice(0, 5).map((item) => ({ href: `/products/${item.id}`, label: item.name, kind: "Product" }));
    const customers = data.customers.filter((item) => item.workspaceId === workspaceId && item.name.toLowerCase().includes(q)).slice(0, 5).map((item) => ({ href: `/customers/${item.id}`, label: item.name, kind: "Customer" }));
    const orders = data.orders.filter((item) => item.workspaceId === workspaceId && item.number.toLowerCase().includes(q)).slice(0, 5).map((item) => ({ href: `/orders/${item.id}`, label: item.number, kind: "Order" }));
    return [...orders, ...products, ...customers];
  }, [data, query]);

  return (
    <div className="relative max-w-md flex-1">
      <Search className="pointer-events-none absolute top-2.5 left-3 size-4 text-muted" />
      <input
        value={query}
        onChange={(event) => { setQuery(event.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder="Search orders, products, customers"
        aria-label="Search the demonstration"
        className="h-10 w-full rounded-md border border-line bg-surface pr-3 pl-9 text-sm outline-none"
      />
      {open && query.trim() ? (
        <div className="absolute z-30 mt-1 w-full rounded-lg border border-line bg-surface p-1 shadow-[var(--shadow)]">
          {results.length === 0 ? <p className="px-3 py-2 text-sm text-muted">No matching records.</p> : results.map((result) => (
            <button key={result.href} type="button" className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-surface-2" onClick={() => { setOpen(false); setQuery(""); router.push(result.href); }}>
              <span>{result.label}</span>
              <span className="text-xs text-muted">{result.kind}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function Notifications() {
  const data = useDemoStore((state) => state.data);
  const apply = useDemoStore((state) => state.apply);
  const items = data.notifications.filter((item) => item.workspaceId === data.activeWorkspaceId);
  const unread = items.filter((item) => !item.read).length;
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button type="button" className="relative grid size-10 place-items-center rounded-md hover:bg-surface" aria-label="Notifications">
          <Bell className="size-4" />
          {unread > 0 ? <span className="absolute top-2 right-2 size-2 rounded-full bg-accent" /> : null}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content className="z-40 w-80 rounded-lg border border-line bg-surface p-3 shadow-[var(--shadow)]" align="end" sideOffset={8}>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium">Notifications</p>
            <button type="button" className="text-xs text-accent" onClick={() => apply(markNotificationsRead(data, data.activeWorkspaceId))}>Mark read</button>
          </div>
          <div className="grid gap-2">
            {items.map((item) => (
              <Link key={item.id} href={item.href} className="rounded-md px-2 py-2 hover:bg-surface-2">
                <p className="text-sm font-medium">{item.title}</p>
                <p className="text-xs text-muted">{item.body}</p>
                <p className="mt-1 text-[11px] text-muted">{formatDate(item.at)}</p>
              </Link>
            ))}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

function ProfileMenu() {
  const router = useRouter();
  const data = useDemoStore((state) => state.data);
  const apply = useDemoStore((state) => state.apply);
  const reset = useDemoStore((state) => state.reset);
  const workspace = data.workspaces.find((item) => item.id === data.activeWorkspaceId);
  return (
    <Menu trigger={<button type="button" className="flex h-10 items-center gap-2 rounded-md px-2 hover:bg-surface"><span className="grid size-7 place-items-center rounded-full bg-accent-soft text-xs font-semibold text-accent">{data.session.name.slice(0, 1)}</span><span className="hidden text-sm md:inline">{data.session.name.split(" ")[0]}</span></button>}>
      <div className="px-2.5 py-2 text-xs text-muted">
        <p className="font-medium text-ink">{data.session.name}</p>
        <p>{workspace?.name}</p>
        <p className="mt-1">Demo role: {data.role}. Not production security.</p>
      </div>
      {data.workspaces.map((item) => (
        <MenuItem key={item.id} onSelect={() => apply(setWorkspace(data, item.id))}>{item.name}</MenuItem>
      ))}
      {(["owner", "staff", "admin"] as const).map((role) => (
        <MenuItem key={role} onSelect={() => apply(setRole(data, role))}>View as {role}</MenuItem>
      ))}
      <MenuItem onSelect={() => { useDemoStore.persist.clearStorage(); reset(); }}>Reset demo data</MenuItem>
      <MenuItem onSelect={() => router.push("/")}>Marketing site</MenuItem>
    </Menu>
  );
}

export function PageHeader({ title, description, actions }: { title: string; description: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">{description}</p>
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
