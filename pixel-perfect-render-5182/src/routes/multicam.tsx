import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Pause, Play } from "lucide-react";
import { AppShell } from "@/components/fx/AppShell";
import {
  Btn,
  Check,
  DemoNote,
  Label,
  Panel,
  PageHeader,
  SectionTitle,
  Select,
  StatusBadge,
} from "@/components/fx/ui";
import { cameras, timelineEvents } from "@/lib/mock-data";

export const Route = createFileRoute("/multicam")({
  head: () => ({
    meta: [
      { title: "Multi-Camera Correlation — OmniSurv Synchronised Review" },
      {
        name: "description",
        content:
          "Review multiple camera channels on one synchronised timeline to correlate motion, person and vehicle events across viewpoints.",
      },
      { property: "og:title", content: "Multi-Camera Event Correlation — OmniSurv" },
      {
        property: "og:description",
        content: "Synchronised playback of three camera channels against a shared clock.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MultiCamPage,
});

const SPAN = 600; // seconds across the shared timeline

function clock(sec: number) {
  const base = 14 * 3600 + 28 * 60;
  const t = base + sec;
  return [Math.floor(t / 3600) % 24, Math.floor((t % 3600) / 60), Math.floor(t % 60)]
    .map((n) => String(n).padStart(2, "0"))
    .join(":");
}

function MultiCamPage() {
  const navigate = useNavigate();
  const [playing, setPlaying] = useState(false);
  const [pos, setPos] = useState(258);
  const [synced, setSynced] = useState(true);
  const [active, setActive] = useState(["CAM-01", "CAM-02", "CAM-03"]);
  const [eventType, setEventType] = useState("ALL EVENTS");
  const [range, setRange] = useState("14:28 – 14:38 UTC");

  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => setPos((p) => (p >= SPAN ? SPAN : p + 1)), 1000);
    return () => clearInterval(t);
  }, [playing]);

  const events = timelineEvents.filter(
    (e) => (eventType === "ALL EVENTS" || e.label === eventType) && active.includes(e.camera),
  );

  return (
    <AppShell>
      <PageHeader
        crumb="Forensic Operations / Multi-Camera"
        title="MULTI-CAMERA EVENT CORRELATION"
        subtitle="CASE-2026-014 · synchronised channel review"
        actions={
          <>
            <Btn variant={synced ? "solid" : "outline"} onClick={() => setSynced((s) => !s)}>
              {synced ? "Cameras synced" : "Sync cameras"}
            </Btn>
            <Link to="/timeline">
              <Btn>Full timeline</Btn>
            </Link>
          </>
        }
      />

      <Panel className="mt-8">
        <div className="grid grid-cols-1 gap-3 border-b border-hairline px-4 py-3 lg:grid-cols-[auto_auto_minmax(0,1fr)]">
          <Select value={range} onChange={setRange} options={["14:28 – 14:38 UTC", "14:00 – 15:00 UTC", "12:00 – 16:00 UTC"]} />
          <Select
            value={eventType}
            onChange={setEventType}
            options={["ALL EVENTS", "Motion detected", "Person detected", "Vehicle detected", "Recording gap"]}
          />
          <div className="flex flex-wrap items-center gap-4 px-1">
            <Label>Camera filter</Label>
            {cameras.map((c) => (
              <Check
                key={c}
                checked={active.includes(c)}
                onChange={() => setActive((s) => (s.includes(c) ? s.filter((x) => x !== c) : [...s, c]))}
                label={<span className="font-mono text-[11px]">{c}</span>}
              />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-px bg-hairline md:grid-cols-2 xl:grid-cols-3">
          {active.map((cam) => (
            <div
              key={cam}
              className="cursor-pointer bg-card hover:outline hover:outline-2 hover:outline-navy"
              title="Double-click to open in Video Analysis with timeline"
              onDoubleClick={() => navigate({ to: "/video", search: { cam, timeline: true } })}
            >
              <div className="flex items-center justify-between border-b border-hairline px-3 py-2">
                <span className="font-mono text-[11px] uppercase tracking-[0.14em]">{cam}</span>
                <span className="font-mono text-[10px] text-text-tertiary">{clock(pos)}</span>
              </div>
              <div className="relative aspect-video bg-navy-deep">
                <div
                  className="absolute inset-0 opacity-20"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(0deg, rgba(255,255,255,.14) 0 1px, transparent 1px 3px)",
                  }}
                />
                <div className="absolute inset-0 grid place-items-center font-mono text-[10px] uppercase tracking-[0.2em] text-white/35">
                  {cam} live video stream
                </div>
                {cam === "CAM-03" && pos > 250 ? (
                  <div className="absolute top-[38%] left-[42%] h-[30%] w-[16%] border-2 border-event" />
                ) : null}
              </div>
            </div>
          ))}
          {active.length === 0 ? (
            <div className="bg-card px-4 py-14 text-center label-mono">No cameras selected</div>
          ) : null}
        </div>

        <div className="border-t border-hairline px-4 py-4">
          <div className="flex items-center justify-between">
            <Label>Shared timeline</Label>
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-tertiary">
              {clock(pos)} UTC · {synced ? "all channels locked" : "channels independent"}
            </span>
          </div>
          <div
            className="relative mt-3 h-10 cursor-crosshair border border-hairline bg-surface"
            onClick={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              setPos(Math.round(((e.clientX - r.left) / r.width) * SPAN));
            }}
          >
            <div className="absolute inset-y-2 left-0 bg-foreground/80" style={{ width: "100%", height: 6, top: 8 }} />
            <div className="absolute left-[38%] w-[10%] bg-event" style={{ top: 22, height: 6 }} />
            {events.map((e, i) => (
              <div key={e.time} className="absolute inset-y-0 w-px bg-danger" style={{ left: `${30 + i * 9}%` }} />
            ))}
            <div className="absolute inset-y-0 w-0.5 bg-danger" style={{ left: `${(pos / SPAN) * 100}%` }} />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Btn variant="solid" onClick={() => setPlaying((p) => !p)}>
              {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              {playing ? "Pause all" : "Play all"}
            </Btn>
            <Btn onClick={() => setPos(0)}>Rewind</Btn>
            <Btn onClick={() => setPos(258)}>Jump to incident</Btn>
          </div>
        </div>
      </Panel>

      <Panel className="mt-8">
        <SectionTitle right={<StatusBadge tone="event">{events.length} correlated</StatusBadge>}>
          Event correlation
        </SectionTitle>
        <div className="px-4 py-2">
          {events.map((e) => (
            <div
              key={e.time}
              className="grid grid-cols-[86px_86px_minmax(0,1fr)_auto] items-center gap-3 border-b border-hairline-light py-3 last:border-0"
            >
              <span className="font-mono text-xs">{e.time}</span>
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-tertiary">{e.camera}</span>
              <span className="truncate text-[13px]">{e.label}</span>
              <Link to="/video">
                <Btn variant="ghost">Open footage</Btn>
              </Link>
            </div>
          ))}
        </div>
      </Panel>

      <div className="mt-8">
        <DemoNote>
          Synchronized Multi-Channel Playback: presentation timestamps (PTS) normalized to UTC. Automated cross-camera timeline correlation across Dahua, Hikvision, CP Plus, and multi-vendor streams.
        </DemoNote>
      </div>
    </AppShell>
  );
}
