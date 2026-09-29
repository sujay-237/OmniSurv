import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/fx/AppShell";
import {
  Btn,
  DemoNote,
  Label,
  Panel,
  PageHeader,
  StatusBadge,
} from "@/components/fx/ui";
import { sopSteps } from "@/lib/mock-data";

export const Route = createFileRoute("/sop")({
  head: () => ({
    meta: [
      { title: "Standard Forensic Workflow — OmniSurv SOP" },
      {
        name: "description",
        content:
          "The ten-step standard operating procedure from device identification through acquisition, validation and report generation.",
      },
      { property: "og:title", content: "Standard Forensic Workflow — OmniSurv" },
      {
        property: "og:description",
        content: "Ten procedural stages governing surveillance evidence handling.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SopPage,
});

function SopPage() {
  const [open, setOpen] = useState("01");

  return (
    <AppShell>
      <PageHeader
        crumb="Output / SOP"
        title="STANDARD FORENSIC WORKFLOW"
        subtitle="Ten-stage procedure for surveillance evidence"
        actions={<Btn>Print SOP</Btn>}
      />

      <Panel className="mt-8">
        {sopSteps.map((s, i) => {
          const active = open === s.no;
          return (
            <div key={s.no} className="border-b border-hairline last:border-0">
              <button
                onClick={() => setOpen(active ? "" : s.no)}
                className={
                  "grid w-full grid-cols-[70px_minmax(0,1fr)_auto] items-center gap-4 px-4 py-4 text-left transition-colors " +
                  (active ? "bg-foreground text-background" : "hover:bg-surface")
                }
              >
                <span
                  className={
                    "font-mono text-2xl font-bold tabular-nums " +
                    (active ? "text-background/60" : "text-text-tertiary")
                  }
                >
                  {s.no}
                </span>
                <span className="min-w-0 truncate font-mono text-[12px] uppercase tracking-[0.16em]">
                  {s.title}
                </span>
                <span className={"font-mono text-[10px] tracking-[0.14em] " + (active ? "text-background/60" : "text-text-tertiary")}>
                  {active ? "CLOSE" : "OPEN"}
                </span>
              </button>
              {active ? (
                <div className="grid grid-cols-1 gap-6 border-t border-hairline bg-surface px-4 py-5 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
                  <p className="text-sm leading-6 text-foreground">{s.detail}</p>
                  <div className="space-y-3">
                    <div>
                      <Label>Stage</Label>
                      <div className="mt-1.5 font-mono text-xs">
                        {s.no} of 10 · {i < 5 ? "ACQUISITION PHASE" : "ANALYSIS PHASE"}
                      </div>
                    </div>
                    <div>
                      <Label>Custody impact</Label>
                      <div className="mt-1.5">
                        <StatusBadge tone="verified">LEDGER ENTRY CREATED</StatusBadge>
                      </div>
                    </div>
                    <div>
                      <Label>Halt condition</Label>
                      <div className="mt-1.5 font-mono text-[11px] text-danger">
                        HASH MISMATCH · WRITE ATTEMPT · UNSUPPORTED OEM
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </Panel>

      <div className="mt-8">
        <DemoNote>
          Standard Operating Procedures: Aligned with ISO/IEC 27037 standards for digital evidence handling and Section 63 of Bharatiya Sakshya Adhiniyam, 2023 (BSA Sec 63 / IEA Sec 65B).
        </DemoNote>
      </div>
    </AppShell>
  );
}
