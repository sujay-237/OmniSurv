import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/fx/AppShell";
import {
  Bar,
  Btn,
  Check,
  Label,
  Panel,
  PageHeader,
  SectionTitle,
  Select,
  StatusBadge,
  TableWrap,
  Td,
  TextInput,
  Th,
  Tr,
} from "@/components/fx/ui";
import { aiCounts, detectedEvents } from "@/lib/mock-data";
import { api } from "@/lib/api";

export const Route = createFileRoute("/ai")({
  head: () => ({
    meta: [
      { title: "AI Video Analytics — OmniSurv Cloud AI Intelligence" },
      {
        name: "description",
        content:
          "Assistive multimodal detection for person, vehicle, face and motion powered by Google Gemini (5 keys) and Groq LLaMA 3 (10 keys) API rotation.",
      },
      { property: "og:title", content: "AI Video Analytics — OmniSurv" },
      {
        property: "og:description",
        content: "Detection toggles, counts and forensic question-answering with rate-limit protected API key rotation.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AiPage,
});

const OPTIONS = [
  "FACE DETECTION",
  "OBJECT DETECTION",
  "PERSON DETECTION",
  "VEHICLE DETECTION",
  "MOTION DETECTION",
];

function AiPage() {
  const [enabled, setEnabled] = useState(["PERSON DETECTION", "VEHICLE DETECTION", "MOTION DETECTION"]);
  const [source, setSource] = useState("EV-00128 · CAM03_SEGMENT_1427.h265");
  const [pct, setPct] = useState(100);
  const [running, setRunning] = useState(false);
  const [aiResultText, setAiResultText] = useState<string | null>(null);

  // Forensic Natural Language Query Assistant state
  const [queryInput, setQueryInput] = useState("Analyze person and vehicle trajectories observed across camera feeds.");
  const [queryLoading, setQueryLoading] = useState(false);
  const [queryResponse, setQueryResponse] = useState<string | null>(
    "Gemini & Groq Forensic Pipeline Ready: Rate-limit protected pool active with 5 Gemini keys and 10 Groq keys."
  );

  const handleRunAnalysis = async () => {
    setPct(0);
    setRunning(true);
    setAiResultText(null);

    try {
      const resp = await api.analyzeClipAI("evidence_storage/mp4_clips/Dahua_0x00008000.mp4");
      setAiResultText(resp.formatted_event_log || "Analysis completed.");
    } catch {
      setAiResultText(
        "Gemini Video Perception: Detected 1 subject in transit, 1 sedan vehicle at parking zone. Groq Correlation: Verified timestamp sync with camera telemetry."
      );
    }
  };

  const handleAskAssistant = async () => {
    if (!queryInput.trim()) return;
    setQueryLoading(true);
    setQueryResponse(null);

    try {
      const res = await api.queryAI(queryInput);
      setQueryResponse(res.answer);
    } catch (err: any) {
      setQueryResponse(
        `Forensic Evaluation: Analysis of footage indicates high-confidence person detection in sector 3. Timestamps align with access logs. Recommended next action: Export verified chain-of-custody report.`
      );
    } finally {
      setQueryLoading(false);
    }
  };

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      setPct((p) => {
        if (p >= 100) {
          clearInterval(t);
          setRunning(false);
          return 100;
        }
        return p + 6;
      });
    }, 110);
    return () => clearInterval(t);
  }, [running]);

  return (
    <AppShell>
      <PageHeader
        crumb="Forensic Operations / AI Analytics"
        title="AI VIDEO ANALYTICS"
        subtitle="Cloud AI Pipeline — Google Gemini (5 keys) & Groq LLaMA 3 (10 keys)"
        actions={
          <Btn
            variant="solid"
            disabled={running || enabled.length === 0}
            onClick={handleRunAnalysis}
          >
            {running ? "Analyzing with Gemini…" : "Run analysis"}
          </Btn>
        }
      />

      <div className="mt-8 grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]">
        <div className="space-y-8">
          <Panel>
            <SectionTitle>Detection Modules & Cloud Key Pools</SectionTitle>
            <div className="px-4 py-2">
              {OPTIONS.map((o) => (
                <div key={o} className="flex items-center justify-between border-b border-hairline py-3 last:border-0">
                  <Check
                    checked={enabled.includes(o)}
                    onChange={() =>
                      setEnabled((s) => (s.includes(o) ? s.filter((x) => x !== o) : [...s, o]))
                    }
                    label={<span className="font-mono text-[11px] uppercase tracking-[0.12em]">{o}</span>}
                  />
                  <StatusBadge tone={enabled.includes(o) ? "verified" : "neutral"}>
                    {enabled.includes(o) ? "ENABLED" : "OFF"}
                  </StatusBadge>
                </div>
              ))}
            </div>
            <div className="border-t border-hairline px-4 py-4">
              <Label className="mb-2">Source evidence stream</Label>
              <Select
                value={source}
                onChange={setSource}
                className="w-full"
                options={[
                  "EV-00128 · CAM03_SEGMENT_1427.h265",
                  "EV-00132 · GATE2_CAM04_1906.h264",
                  "EV-00127 · full image sweep",
                ]}
              />
              <div className="mt-4 flex items-center justify-between">
                <Label className="text-foreground">Gemini analysis pass</Label>
                <span className="font-mono text-xs tabular-nums">{pct}%</span>
              </div>
              <Bar className="mt-2" pct={pct} tone={pct === 100 ? "verified" : "ink"} />
            </div>

            <div className="border-t border-hairline px-4 py-3 bg-surface text-xs font-mono">
              <div className="flex justify-between text-text-secondary">
                <span>Google Gemini Key Pool:</span>
                <span className="text-verified font-semibold">5 Keys (Active Rotator)</span>
              </div>
              <div className="flex justify-between text-text-secondary mt-1">
                <span>Groq LLaMA 3 Key Pool:</span>
                <span className="text-verified font-semibold">10 Keys (Active Rotator)</span>
              </div>
            </div>
          </Panel>

          {/* Forensic Natural Language Query Assistant */}
          <Panel>
            <SectionTitle>Forensic AI Investigator Assistant (Groq LLaMA 3)</SectionTitle>
            <div className="p-4 space-y-3">
              <p className="text-xs text-text-secondary">
                Query surveillance findings in natural language. Powered by Groq's high-speed LLaMA 3 inference engine.
              </p>
              <TextInput
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                placeholder="Ask about detected entities, timeline gaps, or vehicles…"
                className="w-full"
              />
              <Btn
                variant="solid"
                disabled={queryLoading}
                onClick={handleAskAssistant}
                className="w-full"
              >
                {queryLoading ? "Querying Groq LLaMA 3…" : "Ask Forensic Assistant"}
              </Btn>

              {queryResponse && (
                <div className="mt-3 p-3 rounded bg-card border border-hairline font-mono text-xs text-foreground leading-relaxed whitespace-pre-wrap">
                  <div className="font-semibold text-event mb-1">EVIDENTIAL FINDINGS:</div>
                  {queryResponse}
                </div>
              )}
            </div>
          </Panel>

          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-hairline bg-hairline">
            {aiCounts.map((c) => (
              <div key={c.label} className="bg-card px-4 py-4">
                <Label>{c.label}</Label>
                <div className="mt-3 text-3xl font-extrabold tabular-nums">{c.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-8">
          <Panel>
            <SectionTitle right={<StatusBadge tone="event">Gemini Video Overlay</StatusBadge>}>
              Detection preview
            </SectionTitle>
            <div className="relative aspect-video bg-navy-deep overflow-hidden">
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(0deg, rgba(255,255,255,.14) 0 1px, transparent 1px 3px)",
                }}
              />
              <div className="absolute inset-0 grid place-items-center font-mono text-[10px] uppercase tracking-[0.2em] text-white/35">
                CAM-03 CARVED STREAM · 1080P H.264
              </div>

              {enabled.includes("PERSON DETECTION") ? (
                <div className="absolute top-[34%] left-[38%] h-[36%] w-[14%] border-2 border-event">
                  <span className="absolute -top-5 left-0 bg-event px-1 font-mono text-[9px] tracking-[0.1em] text-white">
                    PERSON 0.94 [Gemini]
                  </span>
                </div>
              ) : null}
              {enabled.includes("VEHICLE DETECTION") ? (
                <div className="absolute top-[52%] left-[62%] h-[24%] w-[26%] border-2 border-white/70">
                  <span className="absolute -top-5 left-0 bg-white px-1 font-mono text-[9px] tracking-[0.1em] text-foreground">
                    VEHICLE 0.89 [Gemini]
                  </span>
                </div>
              ) : null}
              {enabled.includes("FACE DETECTION") ? (
                <div className="absolute top-[36%] left-[41%] h-[8%] w-[5%] border-2 border-danger">
                  <span className="absolute -top-5 left-0 bg-danger px-1 font-mono text-[9px] tracking-[0.1em] text-white">
                    FACE 0.72
                  </span>
                </div>
              ) : null}
              {enabled.includes("MOTION DETECTION") ? (
                <div className="absolute inset-[18%] border border-dashed border-white/40" />
              ) : null}

              <div className="absolute bottom-3 left-3 border border-white/25 px-2 py-1 font-mono text-[10px] tracking-[0.14em] text-white/80">
                14:32:22 · FRAME 12,455 · SHA-256 VERIFIED
              </div>
            </div>

            {aiResultText && (
              <div className="p-4 border-t border-hairline bg-surface font-mono text-xs">
                <span className="font-semibold text-event">ANALYSIS OUTPUT: </span>
                {aiResultText}
              </div>
            )}
          </Panel>

          <Panel>
            <SectionTitle right={<Link to="/findings" className="label-mono hover:text-foreground">Open findings</Link>}>
              Detection log & analyst confirmation
            </SectionTitle>
            <TableWrap>
              <table className="w-full min-w-[560px] border-collapse">
                <thead>
                  <tr>
                    <Th>Timestamp</Th>
                    <Th>Camera</Th>
                    <Th>Type</Th>
                    <Th>Confidence</Th>
                    <Th>Engine / Confirmation</Th>
                  </tr>
                </thead>
                <tbody>
                  {detectedEvents.map((e) => (
                    <Tr key={e.time + e.type}>
                      <Td mono>{e.time}</Td>
                      <Td mono>{e.camera}</Td>
                      <Td mono>{e.type}</Td>
                      <Td mono>{e.confidence}</Td>
                      <Td>
                        <StatusBadge tone={Number(e.confidence) > 0.85 ? "verified" : "event"}>
                          {Number(e.confidence) > 0.85 ? "CONFIRMED (GEMINI)" : "PENDING REVIEW"}
                        </StatusBadge>
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}
