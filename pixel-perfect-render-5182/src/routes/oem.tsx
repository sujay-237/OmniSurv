import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/fx/AppShell";
import {
  Btn,
  DemoNote,
  Label,
  Panel,
  PageHeader,
  SectionTitle,
  Select,
  StatusBadge,
  TableWrap,
  Td,
  Th,
  Tr,
  toneForStatus,
} from "@/components/fx/ui";
import { oemMatrix } from "@/lib/mock-data";

export const Route = createFileRoute("/oem")({
  head: () => ({
    meta: [
      { title: "OEM Support Matrix — OmniSurv DVR/NVR Vendor Coverage" },
      {
        name: "description",
        content:
          "Vendor-by-vendor support matrix for DVR/NVR device detection, file system parsing, video formats, metadata and recovery.",
      },
      { property: "og:title", content: "DVR/NVR OEM Support — OmniSurv" },
      {
        property: "og:description",
        content: "Compare supported, partial and unknown capability coverage across recorder vendors.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OemPage,
});

function OemPage() {
  const [filter, setFilter] = useState("ALL STATUSES");
  const rows = oemMatrix.filter((o) => (filter === "ALL STATUSES" ? true : o.status === filter));

  const counts = {
    SUPPORTED: oemMatrix.filter((o) => o.status === "SUPPORTED").length,
    PARTIAL: oemMatrix.filter((o) => o.status === "PARTIAL").length,
    UNKNOWN: oemMatrix.filter((o) => o.status === "UNKNOWN").length,
  };

  return (
    <AppShell>
      <PageHeader
        crumb="Output / OEM Support"
        title="DVR/NVR OEM SUPPORT"
        subtitle="Vendor capability matrix"
        actions={<Btn>Export matrix</Btn>}
      />

      <div className="mt-8 grid grid-cols-3 gap-px overflow-hidden rounded-lg border border-hairline bg-hairline">
        {(["SUPPORTED", "PARTIAL", "UNKNOWN"] as const).map((k) => (
          <div key={k} className="bg-card px-4 py-4">
            <Label>{k} VENDORS</Label>
            <div className="mt-3 text-3xl font-extrabold tabular-nums">{counts[k]}</div>
          </div>
        ))}
      </div>

      <Panel className="mt-8">
        <div className="flex flex-wrap items-center gap-3 border-b border-hairline px-4 py-3">
          <Label>Status filter</Label>
          <Select
            value={filter}
            onChange={setFilter}
            options={["ALL STATUSES", "SUPPORTED", "PARTIAL", "UNKNOWN"]}
          />
          <span className="label-mono ml-auto">{rows.length} vendors</span>
        </div>
        <TableWrap>
          <table className="w-full min-w-[940px] border-collapse">
            <thead>
              <tr>
                <Th>OEM</Th>
                <Th>Device Detection</Th>
                <Th>File System</Th>
                <Th>Video Format</Th>
                <Th>Metadata</Th>
                <Th>Recovery</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((o) => (
                <Tr key={o.oem}>
                  <Td className="font-semibold">{o.oem}</Td>
                  {[o.detection, o.fileSystem, o.videoFormat, o.metadata, o.recovery].map((v, i) => (
                    <Td key={i}>
                      <StatusBadge tone={toneForStatus(v)}>{v}</StatusBadge>
                    </Td>
                  ))}
                  <Td>
                    <StatusBadge tone={toneForStatus(o.status)}>{o.status}</StatusBadge>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      </Panel>

      <Panel className="mt-8">
        <SectionTitle>Interpretation</SectionTitle>
        <div className="grid grid-cols-1 gap-px bg-hairline md:grid-cols-3">
          {([
            ["SUPPORTED", "Capability is represented end to end in this prototype's interface."],
            ["PARTIAL", "Interface exists but coverage is incomplete for some models or firmware."],
            ["UNKNOWN", "No verified coverage claimed. Treat results as unconfirmed."],
          ] as const).map(([k, v]) => (
            <div key={k} className="bg-card px-4 py-4">
              <StatusBadge tone={toneForStatus(k)}>{k}</StatusBadge>
              <p className="mt-3 text-sm leading-6 text-text-secondary">{v}</p>
            </div>
          ))}
        </div>
      </Panel>

      <div className="mt-8">
        <DemoNote>
          Coverage shown is illustrative for UI review only — no technical support is claimed.
        </DemoNote>
      </div>
    </AppShell>
  );
}
