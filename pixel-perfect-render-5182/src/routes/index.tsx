import { createFileRoute, Link } from "@tanstack/react-router";
import { Fragment, useState } from "react";
import { AppShell } from "@/components/fx/AppShell";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import {
  Bar,
  Btn,
  Label,
  MetricCard,
  Panel,
  PageHeader,
  SectionTitle,
  StatusBadge,
  TableWrap,
  Td,
  Th,
  Tr,
  toneForStatus,
} from "@/components/fx/ui";
import {
  cases,
  metrics,
  oemDistribution,
  processingStages,
  systemActivity,
} from "@/lib/mock-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — OmniSurv Forensic Investigation Overview" },
      {
        name: "description",
        content:
          "Forensic investigation overview: active cases, evidence items, DVR/NVR devices, recovered video and verification status across the OmniSurv workstation.",
      },
      { property: "og:title", content: "OmniSurv Investigation Dashboard" },
      {
        property: "og:description",
        content:
          "Active cases, evidence intake, device coverage and evidence processing progress in one forensic overview.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const maxOem = Math.max(...oemDistribution.map((o) => o.count));
  const [range, setRange] = useState<"7D" | "MONTH">("7D");
  const [month, setMonth] = useState("SEP");
  const cols = range === "7D" ? DAYS : WEEKS;
  const seed = range === "7D" ? 0 : MONTHS.indexOf(month) + 1;

  return (
    <AppShell>
      <PageHeader
        crumb="Overview / Dashboard"
        title="DASHBOARD"
        subtitle="Forensic Investigation Overview"
        actions={
          <>
            <Link to="/cases/new">
              <Btn variant="solid">+ New case</Btn>
            </Link>
            <Link to="/reports">
              <Btn>Reports</Btn>
            </Link>
          </>
        }
      />

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {metrics.map((m, i) => {
          const to = (["/cases", "/evidence", "/devices", "/recovery", "/findings", "/integrity", "/reports"] as const)[i] ?? "/";
          return (
            <Link key={m.label} to={to} className="block w-[calc(50%-6px)] overflow-hidden rounded-lg border border-hairline transition-colors hover:[&>div]:bg-surface md:w-[calc(25%-9px)] xl:w-auto xl:flex-1">
              <MetricCard label={m.label} value={m.value} note={m.note} />
            </Link>
          );
        })}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)]">
        <Panel>
          <SectionTitle right={<Link to="/cases" className="label-mono hover:text-foreground">View all</Link>}>
            Active cases
          </SectionTitle>
          <TableWrap>
            <table className="w-full min-w-[880px] border-collapse">
              <thead>
                <tr>
                  <Th>Case ID</Th>
                  <Th>Case Name</Th>
                  <Th>Investigator</Th>
                  <Th>Devices</Th>
                  <Th>Evidence</Th>
                  <Th>Status</Th>
                  <Th>Last Updated</Th>
                  <Th />
                </tr>
              </thead>
              <tbody>
                {cases.slice(0, 4).map((c) => (
                  <Tr key={c.id}>
                    <Td mono className="font-medium">{c.id}</Td>
                    <Td className="max-w-[240px] truncate">{c.name}</Td>
                    <Td mono className="text-text-secondary">{c.investigator}</Td>
                    <Td mono>{String(c.devices).padStart(2, "0")}</Td>
                    <Td mono>{String(c.evidence).padStart(2, "0")}</Td>
                    <Td>
                      <StatusBadge tone={toneForStatus(c.status)}>{c.status}</StatusBadge>
                    </Td>
                    <Td mono className="whitespace-nowrap text-text-secondary">{c.updated}</Td>
                    <Td>
                      <Link to="/cases/$caseId" params={{ caseId: c.id }}>
                        <Btn variant="ghost">Open</Btn>
                      </Link>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        </Panel>

        <Panel>
          <SectionTitle>System activity</SectionTitle>
          <div className="px-4 py-2">
            {systemActivity.map((a) => (
              <div
                key={a.time}
                className="grid grid-cols-[54px_minmax(0,1fr)] gap-3 border-b border-hairline-light py-3 last:border-0"
              >
                <span className="font-mono text-xs text-text-tertiary">{a.time}</span>
                <span className="min-w-0">
                  <span
                    className={
                      a.tone === "verified"
                        ? "block text-[13px] text-verified"
                        : a.tone === "navy"
                          ? "block text-[13px] text-navy"
                          : "block text-[13px] text-foreground"
                    }
                  >
                    {a.action}
                  </span>
                  <span className="mt-0.5 block font-mono text-[10px] uppercase tracking-[0.12em] text-text-tertiary">
                    {a.detail}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 xl:grid-cols-2">
        <Panel>
          <SectionTitle right={<span className="label-mono">CASE-2026-014</span>}>
            Evidence processing
          </SectionTitle>
          <div className="grid grid-cols-1 gap-6 px-4 py-5 md:grid-cols-[180px_minmax(0,1fr)]">
            <div className="relative h-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={processingStages} dataKey="pct" nameKey="stage" innerRadius="62%" outerRadius="95%" paddingAngle={2} stroke="none">
                    {processingStages.map((s, i) => (
                      <Cell key={s.stage} fill={viz(i)} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontFamily: "var(--font-mono)", fontSize: 11, borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-extrabold tabular-nums">{avgPct}%</span>
                <span className="label-mono">overall</span>
              </div>
            </div>
            <div>
              {processingStages.map((s, i) => (
                <div key={s.stage} className="grid grid-cols-[12px_110px_minmax(0,1fr)_40px] items-center gap-3 border-b border-hairline-light py-2 last:border-0">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: viz(i) }} />
                  <span className="truncate font-mono text-xs uppercase tracking-[0.1em]">{s.stage}</span>
                  <span className="h-2 w-full rounded-full bg-surface-container">
                    <span className="block h-full rounded-full" style={{ width: `${s.pct}%`, background: viz(i) }} />
                  </span>
                  <span className="text-right font-mono text-xs tabular-nums">{s.pct}%</span>
                </div>
              ))}
            </div>
          </div>
          <div className="border-t border-hairline px-4 py-4">
            <Label>
              Activity heatmap · {range === "7D" ? "last 7 days" : `${month} 2026 · by week`}
            </Label>
            <div className="mt-3 grid grid-cols-1 items-start justify-start gap-5 sm:grid-cols-[auto_minmax(9rem,1fr)] sm:gap-8">
            <div className="min-w-0 max-w-full overflow-x-auto">
            <div className="w-fit">
            <div
              className="grid justify-start gap-x-1.5 gap-y-1.5 pl-[18px]"
              style={{ gridTemplateColumns: `165px repeat(${cols.length}, 36px)` }}
            >
              <span />
              {cols.map((d) => (
                <span key={d} className="text-center font-mono text-[10px] text-text-tertiary">{d}</span>
              ))}
              {processingStages.map((s, r) => (
                <Fragment key={s.stage}>
                  <span className="self-center truncate pr-4 font-mono text-[10px] uppercase tracking-[0.08em] text-text-secondary">{s.stage}</span>
                  {cols.map((d, c) => {
                    const v = heat(r + seed, c + seed * 2);
                    return (
                      <span
                        key={d}
                        title={`${s.stage} · ${d} · ${v} jobs`}
                        className="h-5 rounded-md"
                        style={{ background: `color-mix(in oklch, var(--heat) ${Math.round((v / 12) * 100)}%, var(--heat-low))`, opacity: 0.25 + (v / 12) * 0.75 }}
                      />
                    );
                  })}
                </Fragment>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-end gap-1.5 font-mono text-[10px] text-text-tertiary">
              LESS
              {[0.15, 0.35, 0.55, 0.8, 1].map((o) => (
                <span key={o} className="h-2.5 w-2.5 rounded-full" style={{ background: `color-mix(in oklch, var(--heat) ${o * 100}%, var(--heat-low))`, opacity: 0.25 + o * 0.75 }} />
              ))}
              MORE
            </div>
            </div>
            </div>
            <div className="flex w-36 flex-col gap-2 sm:ml-[18%]">
              <span className="label-mono">Range</span>
              <div className="flex overflow-hidden rounded-md border border-hairline">
                {(["7D", "MONTH"] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRange(r)}
                    className={`flex-1 px-2 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] ${range === r ? "bg-navy text-primary-foreground" : "hover:bg-surface"}`}
                  >
                    {r === "7D" ? "7 days" : "Month"}
                  </button>
                ))}
              </div>
              {range === "MONTH" && (
                <>
                  <span className="label-mono mt-1">Month</span>
                  <select
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    className="rounded-md border border-hairline bg-background px-2 py-1.5 font-mono text-[11px] uppercase"
                  >
                    {MONTHS.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </>
              )}
            </div>
            </div>

          </div>
        </Panel>

        <Panel>
          <SectionTitle right={<span className="label-mono">27 devices</span>}>
            OEM distribution
          </SectionTitle>
          <div className="grid grid-cols-1 gap-6 px-4 py-5 md:grid-cols-[180px_minmax(0,1fr)]">
            <div className="relative h-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={oemDistribution} dataKey="count" nameKey="oem" innerRadius="62%" outerRadius="95%" paddingAngle={2} stroke="none">
                    {oemDistribution.map((o, i) => (
                      <Cell key={o.oem} fill={viz(i)} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontFamily: "var(--font-mono)", fontSize: 11, borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-extrabold tabular-nums">27</span>
                <span className="label-mono">devices</span>
              </div>
            </div>
            <div>
              {oemDistribution.map((o, i) => (
                <div key={o.oem} className="grid grid-cols-[12px_90px_minmax(0,1fr)_28px] items-center gap-3 border-b border-hairline-light py-2 last:border-0">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ background: viz(i) }} />
                  <span className="truncate font-mono text-xs uppercase tracking-[0.1em]">{o.oem}</span>
                  <span className="h-2 w-full rounded-full bg-surface-container">
                    <span className="block h-full rounded-full" style={{ width: `${(o.count / maxOem) * 100}%`, background: viz(i) }} />
                  </span>
                  <span className="text-right font-mono text-xs tabular-nums">{o.count}</span>
                </div>
              ))}
            </div>
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}

const avgPct = Math.round(processingStages.reduce((a, s) => a + s.pct, 0) / processingStages.length);
const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const WEEKS = ["WK1", "WK2", "WK3", "WK4", "WK5"];
const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const heat = (r: number, c: number) => (r * 7 + c * 5 + ((r + 1) * (c + 3)) % 7) % 13;
const viz = (i: number) => `var(--viz-${(i % 6) + 1})`;
