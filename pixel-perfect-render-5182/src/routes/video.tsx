import { createFileRoute, Link } from "@tanstack/react-router";
import { timelineEvents, timelineSegments } from "@/lib/mock-data";
import { useEffect, useRef, useState } from "react";
import {
  Bookmark,
  Camera,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  Scissors,
} from "lucide-react";
import { AppShell } from "@/components/fx/AppShell";
import {
  Btn,
  DefRow,
  Dot,
  Label,
  Modal,
  Panel,
  PageHeader,
  SectionTitle,
  StatusBadge,
  Tabs,
} from "@/components/fx/ui";
import { bookmarks, detectedEvents } from "@/lib/mock-data";

export const Route = createFileRoute("/video")({
  head: () => ({
    meta: [
      { title: "Video Analysis — OmniSurv Forensic Video Viewer" },
      {
        name: "description",
        content:
          "Frame-accurate forensic video review with system-versus-recorded time reconciliation, markers, screenshots and clip export.",
      },
      { property: "og:title", content: "Video Analysis — OmniSurv" },
      {
        property: "og:description",
        content: "Forensic video player with evidence inspector, timeline and marker tooling.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  validateSearch: (s: Record<string, unknown>): { cam?: string; timeline?: boolean } => ({
    ...(typeof s["cam"] === "string" ? { cam: s["cam"] } : {}),
    ...(s["timeline"] === true || s["timeline"] === "true" ? { timeline: true } : {}),
  }),
  component: VideoPage,
});

const DURATION = 24 * 60 + 18; // 00:24:18
const TABS = ["METADATA", "EVENTS", "MARKERS"];

function fmt(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

function clockFrom(sec: number, baseSec: number) {
  const t = baseSec + sec;
  const h = Math.floor(t / 3600) % 24;
  const m = Math.floor((t % 3600) / 60);
  const s = Math.floor(t % 60);
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

function VideoPage() {
  const { cam: camParam, timeline: showTimeline } = Route.useSearch();
  const cam = camParam ?? "CAM-03";
  const [playing, setPlaying] = useState(false);
  const [pos, setPos] = useState(497);
  const [speed, setSpeed] = useState(1);
  const [tab, setTab] = useState(TABS[0]!);
  const [markerOpen, setMarkerOpen] = useState(false);
  const [note, setNote] = useState("");
  const [markers, setMarkers] = useState([497, 1102]);
  const [shot, setShot] = useState(false);
  const [tlExpanded, setTlExpanded] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => {
      setPos((p) => (p + speed >= DURATION ? DURATION : p + speed));
    }, 1000);
    return () => clearInterval(t);
  }, [playing, speed]);

  const systemTime = clockFrom(pos, 14 * 3600 + 23 * 60 + 54 + 257);
  const recordedTime = clockFrom(pos, 14 * 3600 + 19 * 60 + 37);

  return (
    <AppShell>
      <PageHeader
        crumb="Forensic Operations / Video Analysis"
        title="VIDEO ANALYSIS"
        subtitle="EV-00128 · CAM03_SEGMENT_1427.h265"
        actions={
          <>
            <Btn onClick={() => setShot(true)}>
              <Camera className="h-3.5 w-3.5" /> Screenshot
            </Btn>
            <Btn variant="solid" onClick={() => setMarkerOpen(true)}>
              Add evidence marker
            </Btn>
          </>
        }
      />

      {showTimeline ? (
        <Panel className="mt-8">
          <SectionTitle right={<Link to="/timeline"><Btn variant="ghost">Open full timeline →</Btn></Link>}>
            {cam} timeline · 12:00 – 16:00 UTC
          </SectionTitle>
          <div className="px-4 py-5">
            <div className="relative h-10 border border-hairline bg-surface">
              {timelineSegments.filter((x) => x.camera === cam).map((x, i) => (
                <div
                  key={i}
                  title={x.kind}
                  className={"absolute top-2 bottom-2 " + (x.kind === "continuous" ? "bg-foreground" : x.kind === "motion" ? "bg-text-tertiary" : "bg-event")}
                  style={{ left: `${((x.startHour - 12) / 4) * 100}%`, width: `${((x.endHour - x.startHour) / 4) * 100}%` }}
                />
              ))}
              {timelineEvents.filter((e) => e.camera === cam).map((e) => (
                <div key={e.time} title={`${e.time} · ${e.label}`} className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rotate-45 border-2 border-danger bg-card" style={{ left: `${((e.hour - 12) / 4) * 100}%` }} />
              ))}
            </div>
            <div className="mt-1.5 flex justify-between font-mono text-[10px] text-text-tertiary">
              {["12:00", "13:00", "14:00", "15:00", "16:00"].map((t) => <span key={t}>{t}</span>)}
            </div>
            <div className="mt-4">
              {timelineEvents.filter((e) => e.camera === cam).map((e) => (
                <div key={e.time} className="flex gap-4 border-b border-hairline-light py-2 font-mono text-xs last:border-0">
                  <span>{e.time}</span><span className="text-text-secondary">{e.label}</span>
                </div>
              ))}
              {timelineEvents.every((e) => e.camera !== cam) ? <div className="font-mono text-xs text-text-tertiary">No events on this camera.</div> : null}
            </div>
          </div>
        </Panel>
      ) : null}

      <div className="mt-8 grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="space-y-8">
          <Panel>
            <SectionTitle right={<StatusBadge tone="verified"><Dot /> Integrity verified</StatusBadge>}>
              {cam} · channel {cam.slice(-2)}
            </SectionTitle>

            <div ref={stageRef} className="relative aspect-video w-full bg-navy-deep">
              <div
                className="absolute inset-0 opacity-25"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(0deg, rgba(255,255,255,.14) 0 1px, transparent 1px 3px)",
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/40">
                  Surveillance stream feed
                </span>
              </div>
              <div className="absolute top-3 left-3 flex items-center gap-2 border border-white/25 px-2 py-1 font-mono text-[10px] tracking-[0.14em] text-white/80">
                <span className="inline-block h-1.5 w-1.5 !rounded-full bg-danger" /> {cam}
              </div>
              <div className="absolute top-3 right-3 border border-white/25 px-2 py-1 font-mono text-[10px] tracking-[0.14em] text-white/80">
                {recordedTime} · REC TIME
              </div>
              <div className="absolute bottom-3 left-3 border border-white/25 px-2 py-1 font-mono text-[10px] tracking-[0.14em] text-white/80">
                1920 × 1080 · 25 FPS · H.265
              </div>
              <div className="absolute bottom-3 right-3 border border-white/25 px-2 py-1 font-mono text-[10px] tracking-[0.14em] text-white/80">
                {fmt(pos)} / {fmt(DURATION)}
              </div>
            </div>

            {/* forensic timeline */}
            {tlExpanded ? (
              <DetailedTimeline pos={pos} setPos={setPos} markers={markers} onBookmark={() => setMarkers((m) => (m.includes(pos) ? m : [...m, pos].sort((a, b) => a - b)))} onClose={() => setTlExpanded(false)} />
            ) : (
            <div className="border-t border-hairline px-4 py-4">
              <div className="flex items-center justify-between">
                <Label>Forensic timeline</Label>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-tertiary">
                    {fmt(pos)} · frame {Math.floor(pos * 25)}
                  </span>
                  <button onClick={() => setTlExpanded(true)} aria-label="Maximise timeline" title="Open detailed timeline" className="border border-hairline p-1 hover:bg-surface">
                    <Maximize2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <div
                className="relative mt-3 h-12 cursor-crosshair border border-hairline bg-surface"
                onClick={(e) => {
                  const r = e.currentTarget.getBoundingClientRect();
                  setPos(Math.round(((e.clientX - r.left) / r.width) * DURATION));
                }}
              >
                <div className="absolute inset-y-0 left-0 bg-foreground/10" style={{ width: `${(pos / DURATION) * 100}%` }} />
                <div className="absolute inset-x-0 top-1/2 h-px bg-hairline" />
                {/* motion band */}
                <div className="absolute top-2 left-[18%] h-2 w-[22%] bg-text-tertiary" />
                <div className="absolute top-2 left-[52%] h-2 w-[12%] bg-event" />
                <div className="absolute bottom-2 left-0 h-2 w-full bg-foreground/80" />
                {markers.map((m) => (
                  <div
                    key={m}
                    className="absolute inset-y-0 w-px bg-navy"
                    style={{ left: `${(m / DURATION) * 100}%` }}
                  />
                ))}
                <div
                  className="absolute inset-y-0 w-0.5 bg-danger transition-[left] duration-200"
                  style={{ left: `${(pos / DURATION) * 100}%` }}
                />
              </div>
              <div className="mt-2 flex justify-between font-mono text-[10px] text-text-tertiary">
                {["00:00", "06:00", "12:00", "18:00", "24:18"].map((t) => (
                  <span key={t}>{t}</span>
                ))}
              </div>
            </div>
            )}

            {/* controls */}
            <div className="flex flex-wrap items-center gap-2 border-t border-hairline bg-surface px-4 py-3">
              <Btn onClick={() => setPos((p) => Math.max(0, p - 1 / 25))} aria-label="Frame back">
                <ChevronLeft className="h-3.5 w-3.5" /> Frame
              </Btn>
              <Btn variant="solid" onClick={() => setPlaying((p) => !p)}>
                {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                {playing ? "Pause" : "Play"}
              </Btn>
              <Btn onClick={() => setPos((p) => Math.min(DURATION, p + 1 / 25))} aria-label="Frame forward">
                Frame <ChevronRight className="h-3.5 w-3.5" />
              </Btn>
              <div className="flex items-center gap-1 border border-hairline bg-card px-2 py-1">
                <Label>Speed</Label>
                {[0.25, 0.5, 1, 2, 4].map((s) => (
                  <button
                    key={s}
                    onClick={() => setSpeed(s)}
                    className={
                      "px-1.5 py-0.5 font-mono text-[10px] " +
                      (speed === s ? "bg-foreground text-background" : "text-text-secondary hover:text-foreground")
                    }
                  >
                    {s}×
                  </button>
                ))}
              </div>
              <Btn onClick={() => setShot(true)}>
                <Camera className="h-3.5 w-3.5" /> Screenshot
              </Btn>
              <Btn onClick={() => setMarkers((m) => [...m, Math.round(pos)])}>
                <Bookmark className="h-3.5 w-3.5" /> Bookmark
              </Btn>
              <Btn>
                <Scissors className="h-3.5 w-3.5" /> Export clip
              </Btn>
              <Btn onClick={() => stageRef.current?.requestFullscreen?.()}>
                <Maximize2 className="h-3.5 w-3.5" /> Fullscreen
              </Btn>
            </div>
          </Panel>

          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-hairline bg-hairline md:grid-cols-4">
            <div className="bg-card px-4 py-4">
              <Label>System time</Label>
              <div className="mt-2 font-mono text-lg">{systemTime}</div>
            </div>
            <div className="bg-card px-4 py-4">
              <Label>Recorded time</Label>
              <div className="mt-2 font-mono text-lg">{recordedTime}</div>
            </div>
            <div className="bg-card px-4 py-4">
              <Label>Offset</Label>
              <div className="mt-2 font-mono text-lg text-event">+04:17</div>
            </div>
            <div className="bg-card px-4 py-4">
              <Label>Camera</Label>
              <div className="mt-2 font-mono text-lg">{cam}</div>
            </div>
          </div>
        </div>

        <Panel className="h-max">
          <SectionTitle>Evidence inspector</SectionTitle>
          <Tabs tabs={TABS} active={tab} onChange={setTab} />

          {tab === "METADATA" ? (
            <div>
              <DefRow label="Evidence ID" value="EV-00128" />
              <DefRow label="File" value="CAM03_SEGMENT_1427.h265" />
              <DefRow label="Camera" value={cam} />
              <DefRow label="Resolution" value="1920 × 1080" />
              <DefRow label="FPS" value="25" />
              <DefRow label="Codec" value="H.265" />
              <DefRow label="Duration" value="00:24:18" />
              <DefRow label="Bitrate" value="4,096 kbps (VBR)" />
              <DefRow label="Container" value="Proprietary → MP4 remux" />
              <DefRow label="Integrity" value="SHA-256 MATCHED" tone="verified" />
            </div>
          ) : null}

          {tab === "EVENTS" ? (
            <div className="px-4 py-2">
              {detectedEvents.map((e) => (
                <button
                  key={e.time + e.type}
                  onClick={() => setPos(497)}
                  className="grid w-full grid-cols-[76px_minmax(0,1fr)_auto] items-center gap-3 border-b border-hairline-light py-3 text-left last:border-0 hover:bg-surface"
                >
                  <span className="font-mono text-xs">{e.time}</span>
                  <span className="min-w-0">
                    <span className="block truncate text-[13px]">{e.type}</span>
                    <span className="block font-mono text-[10px] uppercase tracking-[0.12em] text-text-tertiary">
                      {e.camera} · conf {e.confidence}
                    </span>
                  </span>
                  <span className="label-mono">Jump</span>
                </button>
              ))}
            </div>
          ) : null}

          {tab === "MARKERS" ? (
            <div className="px-4 py-2">
              {bookmarks.map((b) => (
                <div key={b.id} className="border-b border-hairline-light py-3 last:border-0">
                  <div className="flex items-center justify-between">
                    <span className="label-mono text-foreground">{b.id}</span>
                    <span className="font-mono text-[10px] text-text-tertiary">{b.time}</span>
                  </div>
                  <div className="mt-1.5 text-[13px]">{b.note}</div>
                  <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-text-tertiary">
                    {b.camera}
                  </div>
                </div>
              ))}
              <div className="py-3">
                <Btn className="w-full" onClick={() => setMarkerOpen(true)}>
                  Add evidence marker
                </Btn>
              </div>
            </div>
          ) : null}
        </Panel>
      </div>

      <Modal
        open={markerOpen}
        onClose={() => setMarkerOpen(false)}
        crumb={`Marker / ${fmt(pos)}`}
        title="Add evidence marker"
        footer={
          <>
            <Btn onClick={() => setMarkerOpen(false)}>Cancel</Btn>
            <Btn
              variant="solid"
              onClick={() => {
                setMarkers((m) => [...m, Math.round(pos)]);
                setMarkerOpen(false);
                setNote("");
              }}
            >
              Save marker
            </Btn>
          </>
        }
      >
        <div className="space-y-4">
          <div className="border border-hairline bg-surface px-4 py-3 font-mono text-[11px]">
            <div>RECORDED TIME · {recordedTime}</div>
            <div>SYSTEM TIME · {systemTime}</div>
            <div>CAMERA · {cam}</div>
            <div>FRAME · {Math.floor(pos * 25)}</div>
          </div>
          <div>
            <Label className="mb-2">Analyst note</Label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Person enters the building."
              className="w-full border border-hairline bg-card px-3 py-2 font-mono text-xs outline-none placeholder:text-text-tertiary focus:border-navy"
            />
          </div>
        </div>
      </Modal>

      <Modal
        open={shot}
        onClose={() => setShot(false)}
        crumb="Screenshot / Captured"
        title="Frame captured"
        footer={<Btn variant="solid" onClick={() => setShot(false)}>Close</Btn>}
      >
        <p className="text-sm text-text-secondary">
          Frame {Math.floor(pos * 25)} at recorded time {recordedTime} was captured to the case
          exhibit vault. Cryptographic SHA-256 hash computed and logged to the chain-of-custody ledger.
        </p>
      </Modal>
    </AppShell>
  );
}

const TRACKS: { label: string; cls: string; spans: [number, number][] }[] = [
  { label: "Recording", cls: "bg-foreground", spans: [[0, 1]] },
  { label: "Motion", cls: "bg-text-tertiary", spans: [[0.18, 0.4], [0.7, 0.78]] },
  { label: "Incident", cls: "bg-event", spans: [[0.52, 0.64]] },
];
const DETAIL_EVENTS = [
  { at: 0.2, label: "Motion start" },
  { at: 0.34, label: "Person enters" },
  { at: 0.53, label: "Door forced" },
  { at: 0.6, label: "Person exits" },
  { at: 0.72, label: "Vehicle leaves" },
];

const EV_TYPES = ["Motion", "Person", "Door", "Vehicle"] as const;
const EV_KIND: Record<string, (typeof EV_TYPES)[number]> = {
  "Motion start": "Motion",
  "Person enters": "Person",
  "Door forced": "Door",
  "Person exits": "Person",
  "Vehicle leaves": "Vehicle",
};

function DetailedTimeline({
  pos,
  setPos,
  markers,
  onBookmark,
  onClose,
}: {
  pos: number;
  setPos: (n: number) => void;
  markers: number[];
  onBookmark: () => void;
  onClose: () => void;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState(DURATION / 2);
  const [types, setTypes] = useState<string[]>([...EV_TYPES]);
  const [lanes, setLanes] = useState<string[]>([...TRACKS.map((t) => t.label), "Events", "Markers"]);

  const span = DURATION / zoom;
  const vs = Math.min(Math.max(center - span / 2, 0), DURATION - span);
  const ve = vs + span;
  const pct = (sec: number) => ((sec - vs) / span) * 100;
  const inView = (sec: number) => sec >= vs && sec <= ve;
  const seek = (e: { clientX: number; currentTarget: HTMLElement }) => {
    const r = e.currentTarget.getBoundingClientRect();
    return Math.round(vs + Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)) * span);
  };
  const ticks = Array.from({ length: 9 }, (_, i) => vs + (i / 8) * span);
  const events = DETAIL_EVENTS.filter((e) => types.includes(EV_KIND[e.label]!));
  const toggle = (l: string[], v: string) => (l.includes(v) ? l.filter((x) => x !== v) : [...l, v]);
  const chip = (on: boolean, red = false) =>
    "border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em] " +
    (on ? (red ? "border-danger text-danger" : "border-foreground bg-foreground text-background") : "border-hairline text-text-tertiary line-through");
  const allLanes = [...TRACKS.map((t) => t.label), "Events", "Markers"];

  return (
    <div className="border-t border-hairline bg-card">
      <div className="flex items-center justify-between px-4 pt-4">
        <Label>Detailed forensic timeline</Label>
        <div className="flex items-center gap-2">
          <Btn onClick={onBookmark}>
            <Bookmark className="h-3.5 w-3.5" /> Bookmark {fmt(pos)}
          </Btn>
          <button onClick={onClose} aria-label="Minimise timeline" title="Back to compact timeline" className="border border-hairline p-1.5 hover:bg-surface">
            <Minimize2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* toolbar */}
      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 border-y border-hairline px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Label>Zoom</Label>
          <div className="flex border border-hairline">
            {[1, 2, 4, 8, 16].map((z) => (
              <button key={z} onClick={() => { setZoom(z); setCenter(pos); }} className={"border-r border-hairline px-2 py-0.5 font-mono text-[10px] last:border-0 " + (zoom === z ? "bg-foreground text-background" : "hover:bg-surface")}>×{z}</button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Label>Tracks</Label>
          {allLanes.map((l) => (
            <button key={l} onClick={() => setLanes((s) => toggle(s, l))} className={chip(lanes.includes(l))}>{l}</button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Label>Events</Label>
          {EV_TYPES.map((t) => (
            <button key={t} onClick={() => setTypes((s) => toggle(s, t))} className={chip(types.includes(t), true)}>{t}</button>
          ))}
        </div>
        <div className="ml-auto flex gap-1.5">
          <Btn onClick={() => setCenter(vs + span / 2 - span / 3)}>◀</Btn>
          <Btn onClick={() => setCenter(vs + span / 2 + span / 3)}>▶</Btn>
          <Btn onClick={() => { setZoom(1); setCenter(DURATION / 2); }}>Reset</Btn>
        </div>
      </div>

      {/* overview */}
      <div className="grid grid-cols-[90px_minmax(0,1fr)] items-center gap-3 border-b border-hairline bg-surface px-4 py-2">
        <Label>Overview</Label>
        <div
          className="relative h-5 cursor-pointer border border-hairline bg-card"
          onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); setCenter(((e.clientX - r.left) / r.width) * DURATION); }}
        >
          {DETAIL_EVENTS.map((e) => (
            <div key={e.label} className="absolute inset-y-1 w-px bg-danger" style={{ left: `${e.at * 100}%` }} />
          ))}
          <div className="absolute inset-y-0 w-0.5 bg-danger" style={{ left: `${(pos / DURATION) * 100}%` }} />
          <div className="absolute inset-y-0 border-2 border-navy bg-navy/10" style={{ left: `${(vs / DURATION) * 100}%`, width: `${(span / DURATION) * 100}%` }} />
        </div>
      </div>

      <div className="overflow-x-auto px-4 pt-4 pb-8">
        <div className="min-w-[600px]">
          <div className="grid grid-cols-[90px_minmax(0,1fr)] gap-3">
            <div />
            <div className="relative h-5 border-b border-foreground">
              {ticks.map((t) => (
                <span key={t} className="absolute -translate-x-1/2 font-mono text-[9px] text-text-secondary" style={{ left: `${pct(t)}%` }}>
                  {fmt(t).slice(3)}
                </span>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-[90px_minmax(0,1fr)] gap-3">
            <div>
              {allLanes.filter((l) => lanes.includes(l)).map((l) => (
                <div key={l} className="flex h-9 items-center border-b border-hairline-light font-mono text-[10px] font-bold uppercase tracking-[0.12em]">{l}</div>
              ))}
            </div>
            <div
              className="relative cursor-crosshair select-none overflow-hidden"
              onClick={(e) => setPos(seek(e))}
              onDoubleClick={(e) => { const t = seek(e); setZoom((z) => Math.min(16, z * 2)); setCenter(t); }}
              onMouseMove={(e) => setHover(seek(e))}
              onMouseLeave={() => setHover(null)}
            >
              {ticks.map((t) => (
                <div key={t} className="pointer-events-none absolute inset-y-0 w-px bg-hairline-light" style={{ left: `${pct(t)}%` }} />
              ))}
              {TRACKS.filter((t) => lanes.includes(t.label)).map((t) => (
                <div key={t.label} className="relative h-9 border-b border-hairline-light">
                  {t.spans.map(([a, b]) => {
                    const l = Math.max(0, pct(a * DURATION));
                    const r = Math.min(100, pct(b * DURATION));
                    return r > l ? <div key={a} className={"absolute top-2.5 bottom-2.5 " + t.cls} style={{ left: `${l}%`, width: `${r - l}%` }} /> : null;
                  })}
                </div>
              ))}
              {lanes.includes("Events") ? (
                <div className="relative h-9 border-b border-hairline-light">
                  {events.filter((e) => inView(e.at * DURATION)).map((e) => (
                    <button
                      key={e.label}
                      title={`${fmt(e.at * DURATION)} · ${e.label}`}
                      onClick={(ev) => { ev.stopPropagation(); setPos(Math.round(e.at * DURATION)); }}
                      className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rotate-45 border-2 border-danger bg-card hover:bg-danger"
                      style={{ left: `${pct(e.at * DURATION)}%` }}
                    />
                  ))}
                </div>
              ) : null}
              {lanes.includes("Markers") ? (
                <div className="relative h-9 border-b border-hairline-light">
                  {markers.filter(inView).map((m) => (
                    <button
                      key={m}
                      title={`Bookmark ${fmt(m)}`}
                      onClick={(ev) => { ev.stopPropagation(); setPos(m); }}
                      className="absolute top-2 bottom-2 w-1.5 -translate-x-1/2 bg-navy"
                      style={{ left: `${pct(m)}%` }}
                    />
                  ))}
                </div>
              ) : null}
              {hover !== null ? (
                <div className="pointer-events-none absolute inset-y-0 w-px bg-text-tertiary" style={{ left: `${pct(hover)}%` }}>
                  <span className="absolute top-0 left-1 whitespace-nowrap bg-card px-1 font-mono text-[10px]">{fmt(hover)}</span>
                </div>
              ) : null}
              {inView(pos) ? <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-danger" style={{ left: `${pct(pos)}%` }} /> : null}
            </div>
          </div>
          {inView(pos) ? (
            <div className="grid grid-cols-[90px_minmax(0,1fr)] gap-3">
              <div />
              <div className="relative h-0">
                <span className="absolute top-1 -translate-x-1/2 bg-danger px-1.5 py-0.5 font-mono text-[10px] text-background" style={{ left: `${Math.min(95, Math.max(5, pct(pos)))}%` }}>
                  {fmt(pos)}
                </span>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* legend */}
      <div className="flex flex-wrap items-center gap-4 border-t border-hairline bg-surface px-4 py-2.5">
        {TRACKS.map((t) => (
          <span key={t.label} className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-text-secondary">
            <span className={`inline-block h-2.5 w-4 ${t.cls}`} /> {t.label}
          </span>
        ))}
        <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-text-secondary">
          <span className="inline-block h-2.5 w-2.5 rotate-45 border-2 border-danger" /> Event
        </span>
        <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-text-secondary">
          <span className="inline-block h-2.5 w-1.5 bg-navy" /> Bookmark
        </span>
        <span className="label-mono ml-auto">Click = seek · Double-click = zoom · Click overview to jump</span>
      </div>

      <div className="grid grid-cols-1 gap-px border-t border-hairline bg-hairline sm:grid-cols-2 lg:grid-cols-5">
        {events.map((e) => (
          <button key={e.label} onClick={() => { setPos(Math.round(e.at * DURATION)); setCenter(e.at * DURATION); }} className="bg-card px-3 py-2 text-left hover:bg-surface">
            <div className="font-mono text-[11px]">{fmt(e.at * DURATION)}</div>
            <div className="text-[12px] text-text-secondary">{e.label}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
