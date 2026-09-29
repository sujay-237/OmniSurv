import { type ReactNode, type ButtonHTMLAttributes, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

/* ----------------------------------- text ---------------------------------- */

export function Label({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("label-mono", className)}>{children}</div>;
}

export function Mono({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("data-mono", className)}>{children}</span>;
}

export function PageHeader({
  crumb,
  title,
  subtitle,
  actions,
}: {
  crumb: string;
  title: string;
  subtitle?: string | undefined;
  actions?: ReactNode | undefined;
}) {
  return (
    <div className="border-b border-hairline pb-6">
      <Label>{crumb}</Label>
      <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-6 sm:flex sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-3xl font-extrabold tracking-tight">{title}</h1>
          {subtitle ? (
            <p className="mt-1 text-sm text-text-secondary">{subtitle}</p>
          ) : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}

export function SectionTitle({
  children,
  right,
}: {
  children: ReactNode;
  right?: ReactNode | undefined;
}) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-4 border-b border-hairline px-4 py-3">
      <div className="label-mono truncate text-foreground">{children}</div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  );
}

/* ---------------------------------- panels --------------------------------- */

export function Panel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string | undefined;
}) {
  return <div className={cn("panel", className)}>{children}</div>;
}

/* --------------------------------- buttons --------------------------------- */

type BtnVariant = "solid" | "outline" | "ghost" | "navy" | "danger";

export function Btn({
  variant = "outline",
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant }) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-md border px-3.5 py-2 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors disabled:cursor-not-allowed disabled:opacity-40";
  const variants: Record<BtnVariant, string> = {
    solid: "border-foreground bg-foreground text-background hover:bg-navy hover:border-navy",
    outline: "border-hairline bg-card text-foreground hover:bg-background",
    ghost: "border-transparent bg-transparent text-text-secondary hover:bg-surface-container hover:text-foreground",
    navy: "border-navy bg-navy text-white hover:bg-navy-deep hover:border-navy-deep",
    danger: "border-danger bg-card text-danger hover:bg-danger hover:text-white",
  };
  return (
    <button className={cn(base, variants[variant], className)} {...props}>
      {children}
    </button>
  );
}

/* --------------------------------- badges ---------------------------------- */

const badgeTones = {
  ink: "border-foreground text-foreground bg-card",
  navy: "border-navy text-navy bg-card",
  verified: "border-verified text-verified bg-verified-bg",
  event: "border-event text-event bg-event-bg",
  danger: "border-danger text-danger bg-danger-bg",
  neutral: "border-hairline text-text-tertiary bg-surface",
} as const;

export type Tone = keyof typeof badgeTones;

export function StatusBadge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: Tone | undefined;
  className?: string | undefined;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em]",
        badgeTones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function toneForStatus(status: string): Tone {
  switch (status) {
    case "VERIFIED":
    case "COMPLETED":
    case "SUPPORTED":
    case "READY":
    case "SUCCESS":
    case "RECOVERED":
    case "ACTIVE":
    case "ENABLED":
      return "verified";
    case "PENDING":
    case "ANALYSIS":
    case "PROCESSING":
    case "PARTIAL":
    case "REVIEW":
    case "DELETED":
    case "ACQUISITION":
      return "event";
    case "MISMATCH":
    case "CORRUPTED":
    case "QUARANTINED":
    case "FAILED":
    case "CRITICAL":
    case "DISABLED":
      return "danger";
    case "NEW":
      return "navy";
    case "UNKNOWN":
    case "ARCHIVED":
    case "NORMAL":
    default:
      return "neutral";
  }
}

export function Dot({ tone = "verified" }: { tone?: "verified" | "event" | "danger" }) {
  const map = { verified: "bg-verified", event: "bg-event", danger: "bg-danger" };
  return (
    <span className={cn("inline-block h-1.5 w-1.5 !rounded-full", map[tone])} aria-hidden />
  );
}

/* --------------------------------- metrics --------------------------------- */

export function MetricCard({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string | undefined;
}) {
  return (
    <div className="panel px-4 py-4">
      <Label>{label}</Label>
      <div className="mt-3 text-3xl font-extrabold tracking-tight tabular-nums">{value}</div>
      {note ? (
        <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-text-tertiary">
          {note}
        </div>
      ) : null}
    </div>
  );
}

/* ---------------------------------- tables --------------------------------- */

export function TableWrap({ children }: { children: ReactNode }) {
  return <div className="w-full overflow-x-auto">{children}</div>;
}

export function Th({
  children,
  className,
}: {
  children?: ReactNode | undefined;
  className?: string | undefined;
}) {
  return (
    <th
      className={cn(
        "whitespace-nowrap border-b border-hairline bg-surface px-3 py-2.5 text-left font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-text-tertiary",
        className,
      )}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  className,
  mono,
}: {
  children?: ReactNode | undefined;
  className?: string | undefined;
  mono?: boolean | undefined;
}) {
  return (
    <td
      className={cn(
        "border-b border-hairline-light px-3 py-2.5 align-middle text-sm",
        mono && "font-mono text-xs",
        className,
      )}
    >
      {children}
    </td>
  );
}

export function Tr({
  children,
  onClick,
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string | undefined;
}) {
  return (
    <tr
      onClick={onClick}
      className={cn(
        "transition-colors hover:bg-surface",
        onClick && "cursor-pointer",
        className,
      )}
    >
      {children}
    </tr>
  );
}

/* ---------------------------------- inputs --------------------------------- */

export function TextInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-md border border-hairline bg-card px-3 py-2 font-mono text-xs text-foreground outline-none placeholder:text-text-tertiary focus:border-navy",
        className,
      )}
      {...props}
    />
  );
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string | undefined;
}) {
  return (
    <div>
      <Label className="mb-2">{label}</Label>
      {children}
      {hint ? (
        <div className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-text-tertiary">
          {hint}
        </div>
      ) : null}
    </div>
  );
}

export function Select({
  value,
  onChange,
  options,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  className?: string | undefined;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "rounded-md border border-hairline bg-card px-3 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-foreground outline-none focus:border-navy",
        className,
      )}
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

export function Check({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: ReactNode | undefined;
}) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2.5 select-none">
      <span
        onClick={(e) => {
          e.preventDefault();
          onChange(!checked);
        }}
        className={cn(
          "grid h-4 w-4 shrink-0 place-items-center border transition-colors",
          checked ? "border-foreground bg-foreground" : "border-hairline bg-card",
        )}
      >
        {checked ? (
          <svg viewBox="0 0 10 10" className="h-2.5 w-2.5 fill-none stroke-background stroke-2">
            <path d="M1 5.2 3.6 8 9 2" />
          </svg>
        ) : null}
      </span>
      {label ? <span className="text-sm text-foreground">{label}</span> : null}
    </label>
  );
}

/* ----------------------------------- tabs ---------------------------------- */

export function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: string[];
  active: string;
  onChange: (t: string) => void;
}) {
  return (
    <div className="flex overflow-x-auto border-b border-hairline">
      {tabs.map((t) => (
        <button
          key={t}
          onClick={() => onChange(t)}
          className={cn(
            "-mb-px shrink-0 border-b-2 px-4 py-3 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors",
            active === t
              ? "border-foreground text-foreground"
              : "border-transparent text-text-tertiary hover:text-foreground",
          )}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

/* --------------------------------- progress -------------------------------- */

export function Bar({
  pct,
  tone = "ink",
  className,
}: {
  pct: number;
  tone?: "ink" | "navy" | "event" | "verified" | undefined;
  className?: string | undefined;
}) {
  const map = {
    ink: "bg-foreground",
    navy: "bg-navy",
    event: "bg-event",
    verified: "bg-verified",
  };
  return (
    <div className={cn("h-1.5 w-full bg-surface-container", className)}>
      <div
        className={cn("h-full transition-[width] duration-500", map[tone])}
        style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
      />
    </div>
  );
}

/* ---------------------------------- modal ---------------------------------- */

export function Modal({
  open,
  onClose,
  title,
  crumb,
  children,
  footer,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  crumb?: string | undefined;
  children: ReactNode;
  footer?: ReactNode | undefined;
  wide?: boolean | undefined;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-foreground/40 p-4 sm:p-10">
      <div
        className={cn(
          "panel w-full animate-in fade-in duration-150",
          wide ? "max-w-4xl" : "max-w-xl",
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-hairline px-5 py-4">
          <div className="min-w-0">
            {crumb ? <Label>{crumb}</Label> : null}
            <div className="mt-1 truncate text-lg font-bold tracking-tight">{title}</div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 border border-hairline p-1.5 text-text-secondary transition-colors hover:bg-background hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="px-5 py-5">{children}</div>
        {footer ? (
          <div className="flex flex-wrap justify-end gap-2 border-t border-hairline bg-surface px-5 py-4">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/* ---------------------------------- drawer --------------------------------- */

export function Drawer({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-foreground/40">
      <div className="h-full w-full max-w-md overflow-y-auto border-l border-hairline bg-card animate-in slide-in-from-right duration-200">
        <div className="sticky top-0 flex items-center justify-between border-b border-hairline bg-card px-5 py-4">
          <div className="label-mono text-foreground">{title}</div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="border border-hairline p-1.5 text-text-secondary transition-colors hover:bg-background hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ------------------------------- data display ------------------------------ */

export function DefRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: ReactNode;
  tone?: "verified" | "danger" | "navy" | undefined;
}) {
  const toneClass =
    tone === "verified"
      ? "text-verified"
      : tone === "danger"
        ? "text-danger"
        : tone === "navy"
          ? "text-navy"
          : "text-foreground";
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] gap-4 border-b border-hairline-light px-4 py-2.5 last:border-0">
      <div className="label-mono">{label}</div>
      <div className={cn("font-mono text-xs break-all", toneClass)}>{value}</div>
    </div>
  );
}

export function HashDisplay({
  algo,
  value,
  verified,
}: {
  algo: string;
  value: string;
  verified?: boolean | undefined;
}) {
  return (
    <div className="border border-hairline bg-surface px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <Label>{algo}</Label>
        {verified ? (
          <StatusBadge tone="verified">
            <Dot /> VERIFIED
          </StatusBadge>
        ) : null}
      </div>
      <div className="mt-2 font-mono text-[11px] leading-5 break-all text-foreground">
        {value}
      </div>
    </div>
  );
}

export function EmptyState({ title, note }: { title: string; note?: string }) {
  return (
    <div className="border border-dashed border-hairline bg-surface px-6 py-14 text-center">
      <div className="label-mono">{title}</div>
      {note ? <p className="mt-2 text-sm text-text-secondary">{note}</p> : null}
    </div>
  );
}

export function DemoNote({ children }: { children?: ReactNode }) {
  return (
    <div className="rounded-lg border border-hairline bg-surface-container px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-text-secondary">
      {children ?? "Forensic Engine Active · Write-blocked read-only binary processing (ISO/IEC 27037 & BSA Sec 63)."}
    </div>
  );
}

export const AuditNotice = DemoNote;

