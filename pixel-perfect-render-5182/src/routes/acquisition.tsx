import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/fx/AppShell";
import {
  Bar,
  Btn,
  DefRow,
  DemoNote,
  Label,
  Panel,
  PageHeader,
  SectionTitle,
  StatusBadge,
  Dot,
} from "@/components/fx/ui";

export const Route = createFileRoute("/acquisition")({
  head: () => ({
    meta: [
      { title: "Evidence Acquisition — OmniSurv Guided Imaging" },
      {
        name: "description",
        content:
          "Guided five-stage acquisition workflow: source, verify, image, hash and complete, with read-only imaging of DVR/NVR storage.",
      },
      { property: "og:title", content: "Evidence Acquisition — OmniSurv" },
      {
        property: "og:description",
        content: "Read-only forensic imaging with live progress, throughput and hashing stages.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AcquisitionPage,
});

const STEPS = ["SOURCE", "VERIFY", "IMAGE", "HASH", "COMPLETE"];
const TOTAL_TB = 2;

function AcquisitionPage() {
  const [pct, setPct] = useState(78);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      setPct((p) => {
        if (p >= 100) {
          clearInterval(t);
          setRunning(false);
          return 100;
        }
        return +(p + 0.6).toFixed(1);
      });
    }, 220);
    return () => clearInterval(t);
  }, [running]);

  const step = pct >= 100 ? 4 : pct > 10 ? 2 : 1;
  const processed = ((TOTAL_TB * pct) / 100).toFixed(2);
  const etaMin = Math.max(0, Math.round(((100 - pct) / 100) * 218));

  return (
    <AppShell>
      <PageHeader
        crumb="Forensic Operations / Acquisition"
        title="EVIDENCE ACQUISITION"
        subtitle="Guided read-only imaging workflow"
        actions={
          <Link to="/integrity">
            <Btn>Integrity & hashes</Btn>
          </Link>
        }
      />

      <div className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-hairline bg-hairline md:grid-cols-5">
        {STEPS.map((s, i) => {
          const done = i < step;
          const active = i === step;
          return (
            <div
              key={s}
              className={
                "px-4 py-4 " +
                (active ? "bg-foreground text-background" : done ? "bg-surface" : "bg-card")
              }
            >
              <div
                className={
                  "font-mono text-[10px] uppercase tracking-[0.18em] " +
                  (active ? "text-background/70" : "text-text-tertiary")
                }
              >
                0{i + 1}
              </div>
              <div className="mt-2 font-mono text-[11px] uppercase tracking-[0.14em]">{s}</div>
              <div
                className={
                  "mt-2 font-mono text-[10px] uppercase tracking-[0.14em] " +
                  (active ? "text-background/70" : done ? "text-verified" : "text-text-tertiary")
                }
              >
                {active ? "IN PROGRESS" : done ? "COMPLETE" : "QUEUED"}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <Panel>
          <SectionTitle right={<StatusBadge tone="verified"><Dot /> Write-blocked</StatusBadge>}>
            Acquisition parameters
          </SectionTitle>
          <DefRow label="Source device" value="DVR-001" />
          <DefRow label="Source type" value="DVR/NVR HDD" />
          <DefRow label="Capacity" value="2 TB" />
          <DefRow label="Read-only mode" value="ENABLED" tone="verified" />
          <DefRow label="Destination" value="Forensic Evidence Store" />
          <DefRow label="Image format" value="E01 (segmented, 4 GB)" />
          <DefRow label="Hash on read" value="MD5 + SHA-256" />
          <div className="flex flex-wrap gap-2 border-t border-hairline bg-surface px-4 py-4">
            <Btn variant="solid" onClick={() => setRunning(true)} disabled={running || pct >= 100}>
              Start acquisition
            </Btn>
            <Btn onClick={() => setRunning(false)} disabled={!running}>
              Pause
            </Btn>
            <Btn
              variant="danger"
              onClick={() => {
                setRunning(false);
                setPct(0);
              }}
            >
              Cancel
            </Btn>
          </div>
        </Panel>

        <div className="space-y-8">
          <Panel>
            <SectionTitle
              right={
                <StatusBadge tone={pct >= 100 ? "verified" : "event"}>
                  {pct >= 100 ? "ACQUISITION COMPLETE" : running ? "ACQUISITION IN PROGRESS" : "PAUSED"}
                </StatusBadge>
              }
            >
              Imaging progress
            </SectionTitle>
            <div className="px-4 py-6">
              <div className="flex items-end justify-between">
                <span className="text-5xl font-extrabold tracking-tight tabular-nums">
                  {Math.floor(pct)}%
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-tertiary">
                  Sector-verified copy
                </span>
              </div>
              <Bar className="mt-5 h-2" pct={pct} tone={pct >= 100 ? "verified" : "ink"} />

              <div className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-hairline bg-hairline md:grid-cols-4">
                <div className="bg-card px-4 py-3">
                  <Label>Processed</Label>
                  <div className="mt-2 font-mono text-xs">{processed} TB / 2 TB</div>
                </div>
                <div className="bg-card px-4 py-3">
                  <Label>Speed</Label>
                  <div className="mt-2 font-mono text-xs">145 MB/s</div>
                </div>
                <div className="bg-card px-4 py-3">
                  <Label>Estimated</Label>
                  <div className="mt-2 font-mono text-xs">{etaMin} min</div>
                </div>
                <div className="bg-card px-4 py-3">
                  <Label>Errors</Label>
                  <div className="mt-2 font-mono text-xs">0 bad sectors</div>
                </div>
              </div>
            </div>
          </Panel>

          <Panel>
            <SectionTitle>Acquisition log</SectionTitle>
            <div className="px-4 py-4 font-mono text-[11px] leading-6 text-text-secondary">
              <div>14:25:38 · Write-blocker attached, read-only confirmed</div>
              <div>14:25:41 · Source geometry read — 3,907,029,168 sectors</div>
              <div>14:25:44 · E01 container opened at evidence store</div>
              <div>14:31:02 · Segment 014 written, running hash updated</div>
              <div className="text-foreground">14:42:11 · {Math.floor(pct)}% imaged, no read errors</div>
            </div>
          </Panel>

          <DemoNote>Simulated acquisition — no device is read and no image is written.</DemoNote>
        </div>
      </div>
    </AppShell>
  );
}
