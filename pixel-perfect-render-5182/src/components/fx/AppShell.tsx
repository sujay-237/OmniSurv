import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Activity,
  Bell,
  Boxes,
  BrainCircuit,
  ClipboardList,
  Cpu,
  FileSearch,
  FileText,
  Fingerprint,
  FolderTree,
  Gauge,
  HardDriveDownload,
  Layers,
  ListOrdered,
  Menu,
  Search,
  ServerCog,
  Settings as SettingsIcon,
  ShieldCheck,
  Undo2,
  Users as UsersIcon,
  Video,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import logo from "@/assets/omnisurv-logo.png.asset.json";
import { Dot, Drawer, Label, StatusBadge, TextInput } from "./ui";
import { cases, notifications, searchIndex } from "@/lib/mock-data";

interface NavItem {
  label: string;
  to: string;
  icon: typeof Gauge;
}

// Top-level = user goals. Sub-pages (SECTIONS) = technical tools.
const NAV: { group: string; items: (NavItem & { match: string[] })[] }[] = [
  { group: "Overview", items: [{ label: "Dashboard", to: "/", icon: Gauge, match: ["/"] }] },
  {
    group: "Investigations",
    items: [
      { label: "Cases", to: "/cases", icon: ClipboardList, match: ["/cases"] },
      { label: "Evidence", to: "/evidence", icon: Boxes, match: ["/evidence", "/devices", "/acquisition", "/files", "/custody", "/integrity"] },
      { label: "Analysis", to: "/findings", icon: BrainCircuit, match: ["/findings", "/recovery", "/video", "/multicam", "/timeline", "/ai"] },
      { label: "Reports", to: "/reports", icon: FileText, match: ["/reports"] },
    ],
  },
  {
    group: "Administration",
    items: [
      { label: "Users & Roles", to: "/users", icon: UsersIcon, match: ["/users"] },
      { label: "Audit Log", to: "/audit", icon: ListOrdered, match: ["/audit"] },
      { label: "Settings", to: "/settings", icon: SettingsIcon, match: ["/settings", "/sop"] },
    ],
  },
];

const SECTIONS: { title: string; tabs: { label: string; to: string }[] }[] = [
  {
    title: "Evidence",
    tabs: [
      { label: "Items", to: "/evidence" },
      { label: "Devices & Sources", to: "/devices" },
      { label: "Acquisition", to: "/acquisition" },
      { label: "File Explorer", to: "/files" },
      { label: "Chain of Custody", to: "/custody" },
      { label: "Integrity & Hashes", to: "/integrity" },
    ],
  },
  {
    title: "Analysis",
    tabs: [
      { label: "Findings", to: "/findings" },
      { label: "Recovery", to: "/recovery" },
      { label: "Video", to: "/video" },
      { label: "Multi-Camera", to: "/multicam" },
      { label: "Timeline", to: "/timeline" },
      { label: "AI Insights", to: "/ai" },
    ],
  },
  {
    title: "Settings",
    tabs: [
      { label: "Settings", to: "/settings" },
      { label: "SOP / Workflow", to: "/sop" },
    ],
  },
];


function SectionNav() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const section = SECTIONS.find((s) => s.tabs.some((t) => path.startsWith(t.to)));
  if (!section) return null;
  return (
    <div className="mb-6 flex items-stretch overflow-x-auto rounded-lg border border-hairline bg-card">
      <div className="flex shrink-0 items-center border-r border-hairline px-4 font-mono text-[10px] uppercase tracking-[0.18em] text-text-tertiary">
        {section.title}
      </div>
      {section.tabs.map((t) => {
        const active = path.startsWith(t.to);
        return (
          <Link
            key={t.to}
            to={t.to}
            className={cn(
              "shrink-0 border-r border-hairline-light px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors",
              active ? "bg-foreground text-background" : "hover:bg-surface",
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const path = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="flex h-full flex-col bg-card">
      <div className="border-b border-hairline px-5 py-4">
        <img src={logo?.url || "/omnisurv-logo.png"} alt="OmniSurv — Forensic Analysis Platform" className="mx-auto h-28 w-auto rounded-lg object-contain mix-blend-multiply dark:mix-blend-normal dark:bg-[oklch(0.95_0.015_85)] dark:p-2" />
      </div>

      <nav className="flex-1 overflow-y-auto py-2">
        {NAV.map((group) => (
          <div key={group.group} className="border-b border-hairline-light py-3 last:border-0">
            <div className="px-5 pb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-text-tertiary">
              {group.group}
            </div>
            {group.items.map((item) => {
              const active = item.to === "/" ? path === "/" : item.match.some((m) => path.startsWith(m));
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-3 px-5 py-2 text-[13px] transition-colors",
                    active
                      ? "bg-foreground text-background"
                      : "text-foreground hover:bg-background",
                  )}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="border-t border-hairline px-5 py-4">
        <Link
          to="/oem"
          onClick={onNavigate}
          className="mb-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-text-secondary hover:text-foreground"
        >
          <ServerCog className="h-3.5 w-3.5" /> Help · OEM support
        </Link>
        <Link
          to="/login"
          onClick={() => localStorage.removeItem("omnisurv-session")}
          className="mb-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-text-secondary hover:text-foreground"
        >
          → Sign out
        </Link>
      </div>
    </div>
  );
}

function GlobalSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState("CAM-03");
  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return searchIndex;
    return searchIndex.filter((r) =>
      `${r.kind} ${r.id} ${r.label} ${r.tags}`.toLowerCase().includes(term),
    );
  }, [q]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-foreground/40 p-4 sm:p-16" onClick={onClose}>
      <div
        className="panel mx-auto w-full max-w-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-hairline px-4 py-3">
          <Search className="h-4 w-4 shrink-0 text-text-tertiary" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search cases, evidence, devices, files, cameras, events, reports…"
            className="w-full bg-transparent font-mono text-xs outline-none placeholder:text-text-tertiary"
          />
          <button onClick={onClose} aria-label="Close" className="shrink-0 text-text-tertiary hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          {results.length === 0 ? (
            <div className="px-4 py-10 text-center label-mono">No matching records</div>
          ) : (
            results.map((r) => (
              <Link
                key={r.kind + r.id + r.label}
                to={r.to}
                onClick={onClose}
                className="grid grid-cols-[92px_minmax(0,1fr)] items-center gap-3 border-b border-hairline-light px-4 py-2.5 transition-colors hover:bg-surface"
              >
                <span className="label-mono">{r.kind}</span>
                <span className="min-w-0">
                  <span className="block truncate font-mono text-xs text-foreground">{r.id}</span>
                  <span className="block truncate text-[13px] text-text-secondary">{r.label}</span>
                </span>
              </Link>
            ))
          )}
        </div>
        <div className="border-t border-hairline bg-surface px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-text-tertiary">
          {results.length} results · forensic index
        </div>
      </div>
    </div>
  );
}

function TopBar({
  onOpenSearch,
  onOpenNotifications,
  onOpenSidebar,
}: {
  onOpenSearch: () => void;
  onOpenNotifications: () => void;
  onOpenSidebar: () => void;
}) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [activeCase, setActiveCase] = useState(cases[0]!.id);

  const crumb = useMemo(() => {
    const seg = path.split("/").filter(Boolean);
    if (seg.length === 0) return ["DASHBOARD"];
    return seg.map((s) => s.replace(/-/g, "-").toUpperCase());
  }, [path]);

  return (
    <header className="sticky top-0 z-30 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b border-hairline bg-card px-4 py-3 lg:px-10">
      <div className="flex min-w-0 items-center gap-4">
        <button
          onClick={onOpenSidebar}
          aria-label="Open navigation"
          className="shrink-0 rounded-md border border-hairline p-1.5 lg:hidden"
        >
          <Menu className="h-4 w-4" />
        </button>
        <div className="min-w-0 truncate font-mono text-[10px] uppercase tracking-[0.18em] text-text-tertiary">
          {crumb.join("  /  ")}
        </div>
        <div className="hidden shrink-0 items-center gap-2 border-l border-hairline pl-4 xl:flex">
          <Label>Case</Label>
          <select
            value={activeCase}
            onChange={(e) => setActiveCase(e.target.value)}
            className="rounded-md border border-hairline bg-card px-2 py-1 font-mono text-[11px] tracking-[0.08em] outline-none focus:border-navy"
          >
            {cases.map((c) => (
              <option key={c.id} value={c.id}>
                {c.id}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button
          onClick={onOpenSearch}
          className="hidden items-center gap-2 rounded-md border border-hairline px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-text-tertiary transition-colors hover:border-navy hover:text-foreground md:flex"
        >
          <Search className="h-3.5 w-3.5" /> Global search
        </button>
        <button
          onClick={onOpenSearch}
          aria-label="Search"
          className="rounded-md border border-hairline p-1.5 md:hidden"
        >
          <Search className="h-4 w-4" />
        </button>
        <button
          onClick={onOpenNotifications}
          aria-label="Notifications"
          className="relative rounded-md border border-hairline p-1.5 transition-colors hover:bg-background"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute -top-1 -right-1 grid h-4 w-4 place-items-center rounded-full bg-foreground font-mono text-[9px] text-background">
            5
          </span>
        </button>
        <StatusBadge tone="verified" className="hidden lg:inline-flex">
          <Dot /> Secure session
        </StatusBadge>
        <AccountMenu />
      </div>
    </header>
  );
}

function AccountMenu() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("Anika Rao");
  const [email, setEmail] = useState("anika.rao@omnisurv.local");
  const [saved, setSaved] = useState(false);
  const navigate = useNavigate();
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => { setOpen((o) => !o); setSaved(false); }}
        className="flex items-center gap-2 rounded-md border border-hairline px-2.5 py-1 transition-colors hover:bg-background"
      >
        <span className="grid h-6 w-6 place-items-center rounded-full bg-foreground font-mono text-[10px] text-background" style={{ borderRadius: "9999px" }}>AR</span>
        <span className="hidden text-left font-mono text-[10px] uppercase tracking-[0.12em] leading-3 sm:block">
          INV-001
          <span className="block text-text-tertiary">Investigator</span>
        </span>
      </button>
      {open ? (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="panel absolute right-0 z-50 mt-2 w-72 bg-card">
            <div className="flex items-center gap-3 border-b border-hairline px-4 py-3">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-foreground font-mono text-xs text-background" style={{ borderRadius: "9999px" }}>AR</span>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">{name}</div>
                <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-tertiary">INV-001 · Investigator</div>
              </div>
            </div>
            <div className="space-y-3 px-4 py-3">
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-tertiary">Account settings</div>
              <label className="block text-xs">
                Full name
                <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-md border border-hairline bg-background px-2 py-1.5 text-sm" />
              </label>
              <label className="block text-xs">
                Email
                <input value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-md border border-hairline bg-background px-2 py-1.5 text-sm" />
              </label>
              <div className="flex items-center justify-between text-xs">
                <span>Role</span><span className="font-mono text-text-tertiary">Investigator</span>
              </div>
              <button type="button" onClick={() => setSaved(true)} className="w-full rounded-md bg-foreground py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-background">
                {saved ? "Saved ✓" : "Save changes"}
              </button>
              <Link to="/settings" onClick={() => setOpen(false)} className="block text-center font-mono text-[10px] uppercase tracking-[0.14em] text-navy hover:underline">
                All settings →
              </Link>
            </div>
            <button
              type="button"
              onClick={() => { localStorage.removeItem("omnisurv-session"); setOpen(false); navigate({ to: "/login", replace: true }); }}
              className="w-full border-t border-hairline px-4 py-2.5 text-left font-mono text-[11px] uppercase tracking-[0.14em] text-danger hover:bg-background"
            >
              → Sign out
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}

function NotificationsDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const toneMap = {
    ink: "neutral",
    verified: "verified",
    danger: "danger",
    event: "event",
  } as const;
  return (
    <Drawer open={open} onClose={onClose} title="Notifications">
      {notifications.map((n) => (
        <div key={n.text} className="border-b border-hairline-light px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[13px] text-foreground">{n.text}</div>
              <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-text-tertiary">
                {n.detail}
              </div>
            </div>
            <span className="shrink-0 font-mono text-[10px] text-text-tertiary">{n.time}</span>
          </div>
          <div className="mt-2.5">
            <StatusBadge tone={toneMap[n.tone]}>{n.tone === "danger" ? "Attention" : n.tone === "event" ? "Review" : n.tone === "verified" ? "Verified" : "Logged"}</StatusBadge>
          </div>
        </div>
      ))}
      <div className="px-5 py-4 font-mono text-[10px] uppercase tracking-[0.14em] text-text-tertiary">
        Demo notifications
      </div>
    </Drawer>
  );
}

function Bone({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-muted ${className}`} />;
}

function PageSkeleton() {
  return (
    <div className="space-y-5 p-4 md:p-6" aria-busy="true" aria-label="Loading">
      <div className="space-y-2">
        <Bone className="h-3 w-24" />
        <Bone className="h-7 w-72 max-w-full" />
        <Bone className="h-3 w-96 max-w-full" />
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="panel space-y-3 p-4">
            <Bone className="h-3 w-20" />
            <Bone className="h-7 w-16" />
          </div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="panel space-y-3 p-4">
          <Bone className="h-4 w-40" />
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Bone className="h-3 w-3 rounded-full" />
              <Bone className="h-3 flex-1" />
              <Bone className="h-3 w-12" />
            </div>
          ))}
        </div>
        <div className="panel space-y-3 p-4">
          <Bone className="h-4 w-32" />
          <Bone className="mx-auto h-32 w-32 rounded-full" />
          <Bone className="h-3 w-full" />
          <Bone className="h-3 w-2/3" />
        </div>
      </div>
    </div>
  );
}

let shellBooted = false;

export function AppShell({ children }: { children: ReactNode }) {
  const [search, setSearch] = useState(false);
  const [notif, setNotif] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("omnisurv-session") === "1") setAuthed(true);
    else navigate({ to: "/login", replace: true });
  }, [navigate]);


  // Skeleton only on the very first app load; later page switches are instant.
  const [loading, setLoading] = useState(!shellBooted);
  useEffect(() => {
    setMobileNav(false);
    if (shellBooted) return;
    const t = setTimeout(() => {
      shellBooted = true;
      setLoading(false);
    }, 400);
    return () => clearTimeout(t);
  }, [path]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearch(true);
      }
      if (e.key === "Escape") {
        setSearch(false);
        setNotif(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed top-0 left-0 z-40 hidden h-screen w-[14.4rem] border-r border-hairline lg:block">
        <SidebarContent />
      </aside>

      {mobileNav ? (
        <div className="fixed inset-0 z-50 flex bg-foreground/40 lg:hidden" onClick={() => setMobileNav(false)}>
          <div className="h-full w-[14.4rem] border-r border-hairline" onClick={(e) => e.stopPropagation()}>
            <SidebarContent onNavigate={() => setMobileNav(false)} />
          </div>
        </div>
      ) : null}

      <div className="lg:pl-[14.4rem]">
        <TopBar
          onOpenSearch={() => setSearch(true)}
          onOpenNotifications={() => setNotif(true)}
          onOpenSidebar={() => setMobileNav(true)}
        />
        <main className="px-4 py-8 lg:px-10 lg:py-10">
          <SectionNav />
          {loading ? <PageSkeleton /> : <div key={path} className="animate-fade-in">{children}</div>}
        </main>
        <footer className="border-t border-hairline px-4 py-5 font-mono text-[10px] uppercase tracking-[0.14em] text-text-tertiary lg:px-10">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>OmniSurv DVR/NVR Forensic Engine · ISO/IEC 27037 & BSA Sec 63 Compliant</span>
            <span className="text-text-secondary opacity-70">Created by team Cyber Synergists</span>
          </div>
        </footer>
      </div>

      <GlobalSearch open={search} onClose={() => setSearch(false)} />
      <NotificationsDrawer open={notif} onClose={() => setNotif(false)} />
    </div>
  );
}

export { TextInput };
