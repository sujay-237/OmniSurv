import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/fx/AppShell";
import {
  Bar,
  Btn,
  DefRow,
  DemoNote,
  Label,
  Modal,
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
import { devices, oemMatrix } from "@/lib/mock-data";

export const Route = createFileRoute("/devices")({
  head: () => ({
    meta: [
      { title: "Device Identification — OmniSurv DVR/NVR Recognition" },
      {
        name: "description",
        content:
          "Identify DVR and NVR recorders by manufacturer, model, firmware, storage, channels and file system before acquisition begins.",
      },
      { property: "og:title", content: "Device Identification — OmniSurv" },
      {
        property: "og:description",
        content: "Multi-vendor recorder recognition with OEM support indicators.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DevicesPage,
});

const SOURCES = ["DVR/NVR IMAGE", "HARD DRIVE", "USB STORAGE", "NETWORK DEVICE"];

function DevicesPage() {
  const [selected, setSelected] = useState(devices[0]!);
  const [scanOpen, setScanOpen] = useState(false);
  const [source, setSource] = useState(SOURCES[0]!);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<"idle" | "scanning" | "done">("idle");
  const [detectedProfile, setDetectedProfile] = useState<any>(null);

  const startScan = async () => {
    setProgress(15);
    setPhase("scanning");
    try {
      const result = await api.identifyDevice();
      setDetectedProfile(result);
    } catch {
      // Keep local defaults
    }
  };

  useEffect(() => {
    if (phase !== "scanning") return;
    const t = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(t);
          setPhase("done");
          return 100;
        }
        return p + 12;
      });
    }, 100);
    return () => clearInterval(t);
  }, [phase]);

  return (
    <AppShell>
      <PageHeader
        crumb="Investigation / Devices"
        title="DEVICE IDENTIFICATION"
        subtitle="Multi-vendor recorder recognition"
        actions={
          <Btn
            variant="solid"
            onClick={() => {
              setScanOpen(true);
              setPhase("idle");
              setProgress(0);
            }}
          >
            + Identify device
          </Btn>
        }
      />

      <div className="mt-8 grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <Panel>
          <SectionTitle right={<span className="label-mono">{devices.length} records</span>}>
            Identified devices
          </SectionTitle>
          <TableWrap>
            <table className="w-full min-w-[760px] border-collapse">
              <thead>
                <tr>
                  <Th>Device ID</Th>
                  <Th>Manufacturer</Th>
                  <Th>Model</Th>
                  <Th>Channels</Th>
                  <Th>Storage</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {devices.map((d) => (
                  <Tr
                    key={d.id}
                    onClick={() => setSelected(d)}
                    className={selected.id === d.id ? "bg-surface-container" : undefined}
                  >
                    <Td mono className="font-medium">{d.id}</Td>
                    <Td>{d.manufacturer}</Td>
                    <Td mono className="text-text-secondary">{d.model}</Td>
                    <Td mono>{d.channels}</Td>
                    <Td mono>{d.storage}</Td>
                    <Td>
                      <StatusBadge tone={toneForStatus(d.status)}>{d.status}</StatusBadge>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        </Panel>

        <div className="space-y-8">
          <Panel>
            <SectionTitle right={<StatusBadge tone={toneForStatus(selected.status)}>{selected.status}</StatusBadge>}>
              {selected.id} · device profile
            </SectionTitle>
            <DefRow label="Manufacturer" value={selected.manufacturer} />
            <DefRow label="Model" value={selected.model} />
            <DefRow label="Serial number" value={selected.serial} />
            <DefRow label="Firmware" value={selected.firmware} />
            <DefRow label="Storage" value={selected.storage} />
            <DefRow label="Channels" value={selected.channels} />
            <DefRow label="MAC address" value={selected.mac} />
            <DefRow label="IP address" value={selected.ip} />
            <DefRow label="File system" value={selected.fileSystem} />
            <DefRow label="Video format" value={selected.videoFormat} />
          </Panel>

          <Panel>
            <SectionTitle>OEM support indicator</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2">
              {oemMatrix.map((o) => (
                <div
                  key={o.oem}
                  className="flex items-center justify-between gap-3 border-b border-r border-hairline-light px-4 py-2.5"
                >
                  <span className="truncate font-mono text-[11px] uppercase tracking-[0.1em]">{o.oem}</span>
                  <StatusBadge tone={toneForStatus(o.status)}>{o.status}</StatusBadge>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>

      <div className="mt-8">
        <DemoNote>
          Automated Device & Filesystem Profiler: detects proprietary storage structures for Dahua DHFS, Hikvision HIKFS, CP Plus CPDH, Honeywell MAXPRO, TP-Link VIGI, Godrej SeeThru, Uniview UBV, and Matrix SATATYA.
        </DemoNote>
      </div>

      <Modal
        open={scanOpen}
        onClose={() => setScanOpen(false)}
        crumb="Devices / Identify"
        title="Device scan"
        footer={
          <>
            <Btn onClick={() => setScanOpen(false)}>Close</Btn>
            {phase === "done" ? (
              <Btn variant="solid" onClick={() => setScanOpen(false)}>
                Accept profile
              </Btn>
            ) : (
              <Btn variant="solid" onClick={startScan} disabled={phase === "scanning"}>
                {phase === "scanning" ? "Scanning…" : "Start scan"}
              </Btn>
            )}
          </>
        }
      >
        <Label className="mb-2">Source type</Label>
        <div className="grid grid-cols-2 gap-2">
          {SOURCES.map((s) => (
            <button
              key={s}
              onClick={() => setSource(s)}
              className={
                "border px-3 py-2.5 font-mono text-[10px] uppercase tracking-[0.14em] transition-colors " +
                (source === s
                  ? "border-foreground bg-foreground text-background"
                  : "border-hairline bg-card text-foreground hover:bg-background")
              }
            >
              {s}
            </button>
          ))}
        </div>

        <div className="mt-6 border border-hairline bg-surface px-4 py-4">
          <div className="flex items-center justify-between">
            <Label className="text-foreground">
              {phase === "idle" ? "Awaiting scan" : phase === "scanning" ? "Analyzing source…" : "Source identified"}
            </Label>
            <span className="font-mono text-xs tabular-nums">{progress}%</span>
          </div>
          <Bar className="mt-3" pct={progress} tone={phase === "done" ? "verified" : "ink"} />
          {phase === "done" ? (
            <div className="mt-4 space-y-1.5 font-mono text-[11px]">
              <div>MANUFACTURER · Hikvision</div>
              <div>MODEL · DS-7616NI-K2</div>
              <div>CHANNELS · 16</div>
              <div>STORAGE · 2 TB</div>
              <div>FILE SYSTEM · Proprietary</div>
              <div>VIDEO · H.264 / H.265</div>
              <div className="pt-1 text-verified">STATUS · SUPPORTED</div>
            </div>
          ) : null}
        </div>
      </Modal>
    </AppShell>
  );
}
