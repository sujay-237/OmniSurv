import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/fx/AppShell";
import {
  Btn,
  DemoNote,
  Label,
  Panel,
  PageHeader,
  SectionTitle,
  StatusBadge,
} from "@/components/fx/ui";
import { cameras, timelineEvents, timelineSegments } from "@/lib/mock-data";

export const Route = createFileRoute("/timeline")({
  head: () => ({
    meta: [
      { title: "Timeline Analysis — OmniSurv Multi-Camera Correlation" },
      {
        name: "description",
        content:
          "Correlate every camera channel on one UTC timeline with continuous capture, motion segments, incident intervals and critical events.",
      },
      { property: "og:title", content: "Timeline Analysis — OmniSurv" },
      {
        property: "og:description",
        content: "Zoom, pan and filter camera coverage against a single UTC reference clock.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TimelinePage,
});

const START = 12;
const END = 16;
const TYPES = ["Motion detected", "Person detected", "Vehicle detected", "Recording gap"];
const KIND_CLS = { continuous: "bg-foreground", motion: "bg-text-tertiary", incident: "bg-event" } as const;

const fmt = (h: number, sec = false) => {
  const total = Math.round(h * 3600);
  const hh = Math.floor(total / 3600);
  const mm = Math.floor((total % 3600) / 60);
  const ss = total % 60;
  const p = (n: number) => String(n).padStart(2, "0");
  return sec ? `${p(hh)}:${p(mm)}:${p(ss)}` : `${p(hh)}:${p(mm)}`;
};

function TimelinePage() {
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState(14);
  const [activeCams, setActiveCams] = useState<string[]>(cameras);
  const [activeTypes, setActiveTypes] = useState<string[]>(TYPES);
  const [cursor, setCursor] = useState(14.538);
  const [hover, setHover] = useState<number | null>(null);
  const [selected, setSelected] = useState<string | null>("14:32:18");
  const [bookmarks, setBookmarks] = useState<number[]>([]);
  const laneRef = useRef<HTMLDivElement>(null);

  const span = (END - START) / zoom;
  const viewStart = Math.min(Math.max(center - span / 2, START), END - span);
  const viewEnd = viewStart + span;
  const toPct = (h: number) => ((h - viewStart) / span) * 100;
  const inView = (h: number) => h >= viewStart && h <= viewEnd;

  const ticks = useMemo(() => {
    const steps = [1, 0.5, 0.25, 1 / 6, 1 / 12, 1 / 60];
    const step = steps.find((s) => span / s <= 10) ?? 1 / 60;
    const out: number[] = [];
    for (let t = Math.ceil(viewStart / step) * step; t <= viewEnd + 1e-9; t += step) out.push(t);
    return out;
  }, [viewStart, viewEnd, span]);

  const events = timelineEvents.filter(
    (e) => activeTypes.includes(e.label) && activeCams.includes(e.camera),
  );
  const sel = timelineEvents.find((e) => e.time === selected);

  const hourFromX = (clientX: number) => {
    const r = laneRef.current!.getBoundingClientRect();
    return viewStart + Math.min(1, Math.max(0, (clientX - r.left) / r.width)) * span;
  };

  const zoomTo = (z: number, c = cursor) => {
    setZoom(Math.min(16, Math.max(1, z)));
    setCenter(c);
  };

  const coverage = (cam: string) => {
    const hrs = timelineSegments
      .filter((s) => s.camera === cam)
      .reduce((a, s) => a + (s.endHour - s.startHour), 0);
    return Math.round((hrs / (END - START)) * 100);
  };

  const toggle = (list: string[], v: string) =>
    list.includes(v) ? list.filter((x) => x !== v) : [...list, v];

  return (
    <AppShell>
      <PageHeader
        crumb="Forensic Operations / Timeline"
        title="TIMELINE ANALYSIS"
        subtitle="CASE-2026-014 · all channels normalised to UTC"
        actions={
          <>
            <Btn onClick={() => setBookmarks((b) => [...b, cursor])}>Bookmark cursor</Btn>
            <Link to="/multicam">
              <Btn variant="solid">Open multi-camera</Btn>
            </Link>
          </>
        }
      />

      {/* Summary strip */}
      <div className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-hairline bg-hairline md:grid-cols-4">
        {[
          ["Cursor (UTC)", fmt(cursor, true)],
          ["Visible window", `${fmt(viewStart)} – ${fmt(viewEnd)}`],
          ["Events in view", String(events.filter((e) => inView(e.hour)).length)],
          ["Zoom level", `×${zoom}`],
        ].map(([l, v]) => (
          <div key={l} className="bg-card px-4 py-4">
            <Label>{l}</Label>
            <div className="mt-2 font-mono text-xl font-bold tabular-nums">{v}</div>
          </div>
        ))}
      </div>

      <Panel className="mt-8">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-hairline px-4 py-3">
          <div className="flex items-center gap-2">
            <Label>Zoom</Label>
            <div className="flex border border-hairline">
              {[1, 2, 4, 8, 16].map((z) => (
                <button
                  key={z}
                  onClick={() => zoomTo(z)}
                  className={
                    "border-r border-hairline px-2.5 py-1 font-mono text-[11px] last:border-0 " +
                    (zoom === z ? "bg-foreground text-background" : "hover:bg-surface")
                  }
                >
                  ×{z}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Label>Cameras</Label>
            {cameras.map((c) => (
              <button
                key={c}
                onClick={() => setActiveCams((s) => toggle(s, c))}
                className={
                  "border px-2 py-1 font-mono text-[11px] " +
                  (activeCams.includes(c)
                    ? "border-foreground bg-foreground text-background"
                    : "border-hairline text-text-tertiary")
                }
              >
                {c}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Label>Events</Label>
            {TYPES.map((t) => (
              <button
                key={t}
                onClick={() => setActiveTypes((s) => toggle(s, t))}
                className={
                  "border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.1em] " +
                  (activeTypes.includes(t)
                    ? "border-danger text-danger"
                    : "border-hairline text-text-tertiary line-through")
                }
              >
                {t.replace(" detected", "")}
              </button>
            ))}
          </div>
          <div className="ml-auto flex gap-2">
            <Btn onClick={() => setCenter(viewStart + span / 2 - span / 3)}>◀</Btn>
            <Btn onClick={() => setCenter(viewStart + span / 2 + span / 3)}>▶</Btn>
            <Btn onClick={() => { setZoom(1); setCenter(14); }}>Reset</Btn>
          </div>
        </div>

        {/* Overview / minimap */}
        <div className="border-b border-hairline bg-surface px-4 py-3">
          <div className="grid grid-cols-[120px_minmax(0,1fr)] items-center gap-4">
            <Label>Overview 12–16h</Label>
            <div
              className="relative h-6 cursor-pointer border border-hairline bg-card"
              onClick={(e) => {
                const r = e.currentTarget.getBoundingClientRect();
                setCenter(START + ((e.clientX - r.left) / r.width) * (END - START));
              }}
            >
              {timelineEvents.map((e) => (
                <div
                  key={e.time}
                  className="absolute inset-y-1 w-px bg-danger"
                  style={{ left: `${((e.hour - START) / (END - START)) * 100}%` }}
                />
              ))}
              <div
                className="absolute inset-y-0 border-2 border-navy bg-navy/10"
                style={{
                  left: `${((viewStart - START) / (END - START)) * 100}%`,
                  width: `${(span / (END - START)) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto px-4 py-5">
          <div className="min-w-[760px]">
            {/* Ruler */}
            <div className="grid grid-cols-[120px_minmax(0,1fr)] gap-4">
              <div />
              <div className="relative h-6 border-b border-foreground">
                {ticks.map((t) => (
                  <div key={t} className="absolute bottom-0 -translate-x-1/2" style={{ left: `${toPct(t)}%` }}>
                    <div className="font-mono text-[10px] text-text-secondary">{fmt(t)}</div>
                    <div className="mx-auto h-1.5 w-px bg-foreground" />
                  </div>
                ))}
              </div>
            </div>

            {/* Lanes */}
            <div className="grid grid-cols-[120px_minmax(0,1fr)] gap-4">
              <div>
                {cameras.filter((c) => activeCams.includes(c)).map((cam) => (
                  <div key={cam} className="flex h-14 flex-col justify-center border-b border-hairline-light">
                    <span className="font-mono text-[12px] font-bold tracking-[0.12em]">{cam}</span>
                    <span className="font-mono text-[10px] text-text-tertiary">{coverage(cam)}% coverage</span>
                  </div>
                ))}
              </div>
              <div
                ref={laneRef}
                className="relative cursor-crosshair select-none"
                onMouseMove={(e) => setHover(hourFromX(e.clientX))}
                onMouseLeave={() => setHover(null)}
                onClick={(e) => setCursor(hourFromX(e.clientX))}
                onDoubleClick={(e) => zoomTo(zoom * 2, hourFromX(e.clientX))}
              >
                {/* gridlines */}
                {ticks.map((t) => (
                  <div key={t} className="pointer-events-none absolute inset-y-0 w-px bg-hairline-light" style={{ left: `${toPct(t)}%` }} />
                ))}

                {cameras.filter((c) => activeCams.includes(c)).map((cam) => (
                  <div key={cam} className="relative h-14 border-b border-hairline-light">
                    <div className="absolute inset-x-0 top-1/2 h-px bg-hairline" />
                    {timelineSegments
                      .filter((s) => s.camera === cam && s.endHour > viewStart && s.startHour < viewEnd)
                      .map((s, i) => {
                        const l = Math.max(0, toPct(s.startHour));
                        const r = Math.min(100, toPct(s.endHour));
                        return (
                          <div
                            key={i}
                            title={`${fmt(s.startHour)} – ${fmt(s.endHour)} · ${s.kind}`}
                            className={"absolute top-4 bottom-4 " + KIND_CLS[s.kind]}
                            style={{ left: `${l}%`, width: `${r - l}%` }}
                          />
                        );
                      })}
                    {events
                      .filter((e) => e.camera === cam && inView(e.hour))
                      .map((e) => (
                        <button
                          key={e.time}
                          title={`${e.time} · ${e.label}`}
                          onClick={(ev) => {
                            ev.stopPropagation();
                            setSelected(e.time);
                            setCursor(e.hour);
                          }}
                          className={
                            "absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rotate-45 border-2 " +
                            (selected === e.time ? "border-danger bg-danger" : "border-danger bg-card")
                          }
                          style={{ left: `${toPct(e.hour)}%` }}
                        />
                      ))}
                  </div>
                ))}

                {bookmarks.filter(inView).map((b, i) => (
                  <div key={i} className="pointer-events-none absolute inset-y-0 w-px border-l border-dashed border-navy" style={{ left: `${toPct(b)}%` }} />
                ))}

                {hover !== null ? (
                  <div className="pointer-events-none absolute inset-y-0 w-px bg-text-tertiary" style={{ left: `${toPct(hover)}%` }}>
                    <span className="absolute -top-5 left-1 whitespace-nowrap bg-card px-1 font-mono text-[10px] text-text-secondary">
                      {fmt(hover, true)}
                    </span>
                  </div>
                ) : null}

                {inView(cursor) ? (
                  <div className="pointer-events-none absolute -top-2 bottom-0 w-0.5 bg-danger" style={{ left: `${toPct(cursor)}%` }}>
                    <span className="absolute -bottom-6 -translate-x-1/2 bg-danger px-1.5 py-0.5 font-mono text-[10px] text-background">
                      {fmt(cursor, true)}
                    </span>
                  </div>
                ) : null}
              </div>
            </div>
            <div className="h-6" />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-5 border-t border-hairline bg-surface px-4 py-3">
          {[
            ["bg-foreground", "Continuous"],
            ["bg-text-tertiary", "Motion"],
            ["bg-event", "Incident"],
          ].map(([cls, txt]) => (
            <span key={txt} className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-text-secondary">
              <span className={`inline-block h-2.5 w-4 ${cls}`} /> {txt}
            </span>
          ))}
          <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-text-secondary">
            <span className="inline-block h-2.5 w-2.5 rotate-45 border-2 border-danger" /> Event
          </span>
          <span className="label-mono ml-auto">Click = set cursor · Double-click = zoom in · Click overview to jump</span>
        </div>
      </Panel>

      <div className="mt-8 grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Panel>
          <SectionTitle right={<StatusBadge tone="event">{events.length} shown</StatusBadge>}>
            Correlated events
          </SectionTitle>
          <div>
            {events.length === 0 ? (
              <div className="px-4 py-8 text-center font-mono text-xs text-text-tertiary">No events match the current filters.</div>
            ) : null}
            {events.map((e) => (
              <button
                key={e.time}
                onClick={() => { setSelected(e.time); zoomTo(Math.max(zoom, 8), e.hour); setCursor(e.hour); }}
                className={
                  "grid w-full grid-cols-[84px_76px_minmax(0,1fr)_auto] items-center gap-3 border-b border-hairline-light px-4 py-3 text-left last:border-0 " +
                  (selected === e.time ? "bg-foreground text-background" : "hover:bg-surface")
                }
              >
                <span className="font-mono text-xs">{e.time}</span>
                <span className="font-mono text-[10px] tracking-[0.14em] opacity-70">{e.camera}</span>
                <span className="truncate text-[13px]">{e.label}</span>
                <span className="font-mono text-[10px] opacity-70">FOCUS →</span>
              </button>
            ))}
          </div>
        </Panel>

        <Panel>
          <SectionTitle>Event inspector</SectionTitle>
          {sel ? (
            <div className="space-y-4 px-4 py-4">
              <div className="relative aspect-video bg-navy-deep">
                <div
                  className="absolute inset-0 opacity-20"
                  style={{ backgroundImage: "repeating-linear-gradient(0deg, rgba(255,255,255,.14) 0 1px, transparent 1px 3px)" }}
                />
                <div className="absolute top-[30%] left-[42%] h-[40%] w-[14%] border-2 border-event" />
                <span className="absolute top-2 left-2 font-mono text-[10px] text-background/80">{sel.camera} · {sel.time} UTC</span>
              </div>
              <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-hairline bg-hairline">
                {[["Event", sel.label], ["Camera", sel.camera], ["UTC", sel.time], ["Recorder clock", "+04:17 offset"]].map(([l, v]) => (
                  <div key={l} className="bg-card px-3 py-2.5">
                    <Label>{l}</Label>
                    <div className="mt-1 font-mono text-xs">{v}</div>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                <Link to="/video"><Btn variant="solid">Open footage</Btn></Link>
                <Btn onClick={() => setBookmarks((b) => [...b, sel.hour])}>Bookmark</Btn>
              </div>
            </div>
          ) : (
            <div className="px-4 py-8 text-center font-mono text-xs text-text-tertiary">Select an event marker to inspect it.</div>
          )}
          {bookmarks.length ? (
            <div className="border-t border-hairline px-4 py-3">
              <Label>Session bookmarks</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {bookmarks.map((b, i) => (
                  <button key={i} onClick={() => { setCursor(b); setCenter(b); }} className="border border-navy px-2 py-0.5 font-mono text-[11px] text-navy">
                    {fmt(b, true)}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </Panel>
      </div>

      <div className="mt-8">
        <DemoNote />
      </div>
    </AppShell>
  );
}
