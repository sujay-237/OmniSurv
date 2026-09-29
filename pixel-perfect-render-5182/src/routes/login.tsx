import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Btn, Check, Dot, Field, Label, TextInput } from "@/components/fx/ui";
import logo from "@/assets/omnisurv-logo.png.asset.json";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign In — OmniSurv Workstation" },
      {
        name: "description",
        content:
          "Investigator sign-in for the OmniSurv multi-vendor DVR/NVR forensic analysis workstation.",
      },
      { property: "og:title", content: "Sign In — OmniSurv Workstation" },
      {
        property: "og:description",
        content: "Secure investigator access to the OmniSurv forensic workstation.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [id, setId] = useState("INV-001");
  const [pw, setPw] = useState("forensic-session");
  const [name, setName] = useState("");
  const [pw2, setPw2] = useState("");
  const [remember, setRemember] = useState(true);
  const up = mode === "up";

  return (
    <div className="hairline-grid flex min-h-screen items-center justify-center bg-card px-4 py-8">
        <div className="panel w-full max-w-md bg-background">
          <div className="flex flex-col items-center border-b border-hairline px-6 pt-6 pb-5 text-center">
            <img src={logo?.url || "/omnisurv-logo.png"} alt="OmniSurv — Forensic Analysis Platform" className="h-32 w-auto rounded-xl object-contain mix-blend-multiply dark:mix-blend-normal dark:bg-[oklch(0.95_0.015_85)] dark:p-2" />
            <div className="mt-2 text-sm text-text-secondary">
              Multi-Vendor DVR/NVR Forensic Analysis Platform
            </div>
          </div>
          <div className="border-b border-hairline px-6 py-5">
            <Label>Access</Label>
            <div className="mt-2 text-2xl font-extrabold tracking-tight">{up ? "CREATE ACCOUNT" : "LOGIN"}</div>
            <div className="mt-4 grid grid-cols-2 overflow-hidden rounded-lg border border-hairline">
              {(["in", "up"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={`py-2 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors ${mode === m ? "bg-foreground text-background" : "hover:bg-surface"}`}
                >
                  {m === "in" ? "Sign in" : "Sign up"}
                </button>
              ))}
            </div>
          </div>


          <form
            className="space-y-5 px-6 py-6"
            onSubmit={(e) => {
              e.preventDefault();
              localStorage.setItem("omnisurv-session", "1");
              navigate({ to: "/" });
            }}
          >
            {up ? (
              <Field label="Full name">
                <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Anika Rao" />
              </Field>
            ) : null}
            <Field label={up ? "Email" : "Investigator ID / Email"}>
              <TextInput value={id} onChange={(e) => setId(e.target.value)} placeholder="INV-001" />
            </Field>
            <Field label="Password">
              <TextInput
                type="password"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                placeholder="••••••••••"
              />
            </Field>
            {up ? (
              <Field label="Confirm password">
                <TextInput type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} placeholder="••••••••••" />
              </Field>
            ) : (
              <div className="flex items-center justify-between gap-4">
                <Check checked={remember} onChange={setRemember} label={<span className="text-[13px]">Remember session</span>} />
                <button
                  type="button"
                  className="font-mono text-[10px] uppercase tracking-[0.14em] text-navy underline-offset-4 hover:underline"
                >
                  Forgot password
                </button>
              </div>
            )}

            <Btn variant="solid" className="w-full py-3" type="submit">
              {up ? "Create account" : "Sign in"}
            </Btn>
          </form>

          <div className="border-t border-hairline bg-surface px-6 py-4">
            <Label>System Status</Label>
            <div className="mt-2.5 space-y-1.5">
              <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-verified">
                <Dot /> Forensic workstation ready
              </div>
              <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-verified">
                <Dot /> Secure session
              </div>
            </div>
          </div>
          <div className="border-t border-hairline px-6 py-3 text-center font-mono text-[10px] uppercase tracking-[0.16em] text-text-tertiary">
            Created by team Cyber Synergists
          </div>
        </div>
    </div>

  );
}
