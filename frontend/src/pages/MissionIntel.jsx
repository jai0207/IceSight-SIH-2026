import { useEffect, useMemo, useState } from "react";

/* ---------------------------------------------------------
   Mock data — keyed by region
--------------------------------------------------------- */

const REGIONS = ["Ross Sea", "Weddell Sea", "Amundsen Sea", "Bellingshausen Sea", "East Antarctica"];

const REGION_DATA = {
  "Ross Sea": {
    icebergCountChange: "+9",
    seaIceChange: "+3.4%",
    fractures: 4,
    detected: 143,
    newFractures: 4,
    risk: "HIGH",
    riskColor: "#f87171",
    confidence: "94.1%",
    icebergs: [
      { id: "IS-101", size: "Large", risk: 88, drift: "1.2 km/h", coords: "-76.8, -168.2", dir: "North-East", collision: 62, eta: "9 hrs", rec: "Reroute via Corridor B immediately." },
      { id: "IS-104", size: "Large", risk: 91, drift: "0.5 km/h", coords: "-77.4, -178.9", dir: "East", collision: 71, eta: "6 hrs", rec: "Issue navigation warning to nearby vessels." },
      { id: "IS-102", size: "Medium", risk: 62, drift: "0.8 km/h", coords: "-75.9, -173.5", dir: "North", collision: 34, eta: "18 hrs", rec: "Monitor drift closely, no action yet." },
      { id: "IS-103", size: "Small", risk: 34, drift: "1.6 km/h", coords: "-74.6, -161.4", dir: "North-West", collision: 12, eta: "36 hrs", rec: "Low priority — continue routine tracking." },
      { id: "IS-107", size: "Large", risk: 79, drift: "0.9 km/h", coords: "-74.2, -41.6", dir: "North-East", collision: 48, eta: "14 hrs", rec: "Flag for manual review." },
      { id: "IS-108", size: "Medium", risk: 45, drift: "1.3 km/h", coords: "-72.5, -35.9", dir: "East", collision: 19, eta: "27 hrs", rec: "No immediate action required." },
    ],
    timeline: [
      { time: "07:12 UTC", text: "Satellite pass completed over Ross Sea." },
      { time: "07:15 UTC", text: "AI inference completed — 143 icebergs classified." },
      { time: "06:41 UTC", text: "Route recalculated for RV Polar Star." },
      { time: "06:23 UTC", text: "Critical alert issued for IS-104." },
      { time: "05:58 UTC", text: "Weather model updated with latest current data." },
    ],
    briefing: {
      situation: "Elevated iceberg density detected across the Ross Sea shipping corridor following a fracture event near IS-104. Drift patterns indicate two large icebergs converging toward the primary route within 9–14 hours.",
      actions: [
        "Reroute RV Polar Star via Safe Corridor B.",
        "Increase satellite revisit frequency to every 4 hours.",
        "Notify all vessels transiting the Ross Sea corridor.",
      ],
      fuel: "18.4%",
      eta: "+42 min",
      confidencePct: 94,
    },
    env: [
      { label: "Wind", value: "42 km/h", icon: "🌬️", trend: "up", accent: "#22d3ee" },
      { label: "Ocean Temp", value: "-1.8°C", icon: "🌡️", trend: "down", accent: "#9fdcff" },
      { label: "Visibility", value: "6.2 km", icon: "👁️", trend: "flat", accent: "#818cf8" },
      { label: "Wave Height", value: "2.6 m", icon: "〰️", trend: "up", accent: "#fbbf24" },
      { label: "Ocean Current", value: "1.4 knots", icon: "🌊", trend: "flat", accent: "#34d399" },
      { label: "Ice Drift", value: "0.9 km/h", icon: "🧊", trend: "up", accent: "#f87171" },
    ],
    zones: {
      highestRisk: "Ross Sea Corridor",
      stableRoute: "Corridor B (Bellingshausen bypass)",
      refreshEta: "3 hrs 40 min",
    },
  },
};

// Generate lightweight variants for the remaining regions so the selector feels alive
const BASE = REGION_DATA["Ross Sea"];
["Weddell Sea", "Amundsen Sea", "Bellingshausen Sea", "East Antarctica"].forEach((region, idx) => {
  const shift = (idx + 1) * 7;
  REGION_DATA[region] = {
    ...BASE,
    icebergCountChange: idx % 2 === 0 ? `+${4 + idx}` : `-${2 + idx}`,
    seaIceChange: idx % 2 === 0 ? `+${1.2 + idx}%` : `-${0.8 + idx}%`,
    fractures: Math.max(1, BASE.fractures - idx),
    detected: BASE.detected - shift,
    newFractures: Math.max(1, BASE.newFractures - idx),
    risk: idx % 2 === 0 ? "MEDIUM" : "HIGH",
    riskColor: idx % 2 === 0 ? "#fbbf24" : "#fb923c",
    confidence: `${(91 - idx).toFixed(1)}%`,
    icebergs: BASE.icebergs.map((b, i) => ({
      ...b,
      id: b.id.replace("IS-1", `IS-${2 + idx}`),
      risk: Math.max(10, b.risk - (idx * 5 - i)),
      collision: Math.max(2, b.collision - idx * 4),
    })),
    timeline: BASE.timeline.map((t) => ({ ...t })),
    briefing: {
      ...BASE.briefing,
      situation: `Moderate iceberg activity observed across ${region}. Drift models show gradual movement toward regional shipping lanes with manageable risk over the next 24 hours.`,
      confidencePct: Math.max(70, BASE.briefing.confidencePct - idx * 3),
    },
    env: BASE.env,
    zones: {
      highestRisk: `${region} Corridor`,
      stableRoute: `Alternate Route ${String.fromCharCode(67 + idx)}`,
      refreshEta: `${2 + idx} hrs ${10 + idx * 5} min`,
    },
  };
});

const TREND_ARROW = { up: "▲", down: "▼", flat: "●" };
const TREND_COLOR = { up: "text-emerald-400", down: "text-red-400", flat: "text-slate-400" };

function riskBadgeColor(risk) {
  if (risk > 75) return "#f87171";
  if (risk > 50) return "#fb923c";
  if (risk > 25) return "#fbbf24";
  return "#34d399";
}

function riskLabel(risk) {
  if (risk > 75) return "Critical";
  if (risk > 50) return "High";
  if (risk > 25) return "Medium";
  return "Low";
}

/* AI detection overlay positions on the "current pass" image (percentages) */
const DETECTION_OVERLAYS = [
  { label: "IS-204", top: "22%", left: "28%", tone: "cyan" },
  { label: "New Fracture", top: "58%", left: "68%", tone: "cyan" },
  { label: "Drift +0.9 km/h", top: "74%", left: "20%", tone: "cyan" },
  { label: "High Risk", top: "38%", left: "62%", tone: "red" },
  { label: "Sea Ice -2.4%", top: "12%", left: "70%", tone: "cyan" },
];

/* ---------------------------------------------------------
   Component
--------------------------------------------------------- */

function MissionIntel() {
  const [region, setRegion] = useState("Ross Sea");
  const [utcTime, setUtcTime] = useState("");
  const [mounted, setMounted] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [counters, setCounters] = useState({ detected: 0, fractures: 0, confidence: 0 });

  const data = useMemo(() => REGION_DATA[region], [region]);

  useEffect(() => {
    const tick = () => setUtcTime(new Date().toISOString().slice(11, 19) + " UTC");
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Animated counters whenever the region changes
  useEffect(() => {
    const targetDetected = data.detected;
    const targetFractures = data.newFractures;
    const targetConfidence = parseFloat(data.confidence);
    let frame = 0;
    const totalFrames = 24;
    setCounters({ detected: 0, fractures: 0, confidence: 0 });
    const interval = setInterval(() => {
      frame += 1;
      const progress = Math.min(1, frame / totalFrames);
      setCounters({
        detected: Math.round(targetDetected * progress),
        fractures: Math.round(targetFractures * progress),
        confidence: parseFloat((targetConfidence * progress).toFixed(1)),
      });
      if (progress === 1) clearInterval(interval);
    }, 20);
    return () => clearInterval(interval);
  }, [data]);

  const fade = (delay = "") =>
    `transition-all duration-700 motion-reduce:transition-none ease-out ${delay} ${
      mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
    }`;

  const panelHover =
    "transition-all duration-300 motion-reduce:transition-none hover:-translate-y-1 motion-reduce:hover:translate-y-0 hover:border-cyan-400/50 hover:shadow-[0_0_30px_rgba(34,211,238,0.25)]";

  const toggleExpand = (id) => setExpandedId((prev) => (prev === id ? null : id));

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      {/* Scoped styles for the satellite console */}
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          .sat-float {
            animation: sat-float-anim 4.5s ease-in-out infinite;
          }
          .sat-scan-dot {
            animation: sat-scan-pulse 1.8s ease-in-out infinite;
          }
          .sat-verified {
            animation: sat-verified-pulse 2.2s ease-in-out infinite;
          }
        }
        @keyframes sat-float-anim {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-4px); }
        }
        @keyframes sat-scan-pulse {
          0% { box-shadow: 0 0 4px currentColor; opacity: 0.6; }
          50% { box-shadow: 0 0 12px currentColor; opacity: 1; }
          100% { box-shadow: 0 0 4px currentColor; opacity: 0.6; }
        }
        @keyframes sat-verified-pulse {
          0%, 100% { opacity: 0.75; }
          50% { opacity: 1; }
        }
        .sat-overlay {
          transition: transform 0.2s ease;
        }
        .sat-overlay:hover {
          transform: scale(1.08);
        }
      `}</style>

      {/* Hero header */}
      <div className={`flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 ${fade()}`}>
        <div>
          <span className="text-xs uppercase tracking-widest text-slate-400 font-medium">
            Mission Intelligence
          </span>
          <h2
            className="mt-1 text-3xl md:text-4xl font-bold text-white"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Mission Intelligence Center
          </h2>
          <p className="mt-2 text-sm text-slate-400 max-w-xl">
            AI-powered situational awareness across Antarctic shipping corridors.
          </p>
        </div>

        <div className="flex flex-col items-start lg:items-end gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium text-emerald-300 border border-emerald-400/30 bg-emerald-400/10">
              <span className="relative flex h-2 w-2">
                <span className="motion-safe:animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
              LIVE SATELLITE FEED
            </span>
            <span className="px-3 py-1.5 rounded-full text-xs font-medium text-cyan-300 border border-cyan-400/30 bg-cyan-400/10">
              Forecast Confidence: 98.2%
            </span>
          </div>
          <span className="text-xs font-mono text-slate-400 tabular-nums">{utcTime}</span>
        </div>
      </div>

      {/* Region selector */}
      <div className={`flex flex-wrap gap-2 ${fade("delay-100")}`}>
        {REGIONS.map((r) => (
          <button
            key={r}
            onClick={() => setRegion(r)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-all duration-300 ${
              region === r
                ? "text-cyan-300 border-cyan-400/50 bg-cyan-400/10 shadow-[0_0_16px_rgba(34,211,238,0.3)]"
                : "text-slate-400 border-white/10 bg-white/5 hover:text-slate-200 hover:border-white/20"
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      {/* Satellite comparison panel */}
      <div className={`bg-slate-900/60 backdrop-blur-2xl border border-cyan-400/20 rounded-3xl p-6 shadow-[0_0_25px_rgba(0,0,0,0.35)] ${panelHover} ${fade("delay-150")}`}>
        <h3
          className="text-sm font-semibold text-slate-100 mb-4"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          Satellite Comparison — {region}
        </h3>

        <div className="relative grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* BEFORE image */}
          <div
            className="relative rounded-2xl overflow-hidden border border-white/10 h-64 md:h-80"
            style={{
              background:
                "radial-gradient(circle at 22% 30%, rgba(148,163,184,0.35), transparent 40%), radial-gradient(circle at 70% 65%, rgba(100,116,139,0.3), transparent 45%), linear-gradient(160deg, #0f1c2e 0%, #060c16 55%, #03060d 100%)",
            }}
          >
            {/* coastline-ish streaks */}
            <div
              className="absolute inset-0 opacity-50"
              style={{
                backgroundImage:
                  "linear-gradient(115deg, transparent 42%, rgba(203,213,225,0.18) 43%, rgba(203,213,225,0.1) 46%, transparent 47%), linear-gradient(70deg, transparent 60%, rgba(148,163,184,0.12) 61%, transparent 64%)",
              }}
            />
            {/* grayscale ice texture grid */}
            <div
              className="absolute inset-0 opacity-25"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(226,232,240,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(226,232,240,0.12) 1px, transparent 1px)",
                backgroundSize: "18px 18px",
              }}
            />
            {/* a few faint fracture lines */}
            <svg className="absolute inset-0 w-full h-full opacity-40" preserveAspectRatio="none" viewBox="0 0 100 100">
              <path d="M10,20 L30,25 L28,40" stroke="rgba(226,232,240,0.5)" strokeWidth="0.4" fill="none" />
              <path d="M55,60 L68,55 L75,68" stroke="rgba(226,232,240,0.4)" strokeWidth="0.4" fill="none" />
            </svg>

            <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-semibold text-slate-300 bg-slate-950/70 border border-white/10">
              Sentinel-1 • 24 Hours Ago
            </span>
          </div>

          {/* AFTER image */}
          <div
            className="relative rounded-2xl overflow-hidden border border-cyan-400/30 h-64 md:h-80"
            style={{
              background:
                "radial-gradient(circle at 35% 25%, rgba(34,211,238,0.22), transparent 40%), radial-gradient(circle at 65% 70%, rgba(94,234,212,0.18), transparent 45%), linear-gradient(160deg, #0a1a2c 0%, #050d18 55%, #03060d 100%)",
            }}
          >
            <div
              className="absolute inset-0 opacity-50"
              style={{
                backgroundImage:
                  "linear-gradient(115deg, transparent 40%, rgba(165,243,252,0.16) 41%, rgba(165,243,252,0.08) 45%, transparent 46%), linear-gradient(70deg, transparent 58%, rgba(103,232,249,0.1) 59%, transparent 63%)",
              }}
            />
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(165,243,252,0.14) 1px, transparent 1px), linear-gradient(90deg, rgba(165,243,252,0.14) 1px, transparent 1px)",
                backgroundSize: "18px 18px",
              }}
            />
            {/* more fractures + iceberg signatures than "before" */}
            <svg className="absolute inset-0 w-full h-full opacity-55" preserveAspectRatio="none" viewBox="0 0 100 100">
              <path d="M8,18 L27,24 L24,38 L33,44" stroke="rgba(165,243,252,0.6)" strokeWidth="0.4" fill="none" />
              <path d="M52,58 L66,52 L74,66 L82,60" stroke="rgba(165,243,252,0.55)" strokeWidth="0.4" fill="none" />
              <path d="M20,70 L30,66 L35,76" stroke="rgba(248,113,113,0.5)" strokeWidth="0.4" fill="none" />
              <circle cx="28" cy="22" r="1.4" fill="rgba(165,243,252,0.8)" />
              <circle cx="63" cy="38" r="1.1" fill="rgba(165,243,252,0.7)" />
              <circle cx="70" cy="66" r="1.6" fill="rgba(248,113,113,0.75)" />
              <circle cx="18" cy="66" r="1" fill="rgba(165,243,252,0.6)" />
            </svg>

            <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-semibold text-cyan-300 bg-slate-950/70 border border-cyan-400/30 z-10">
              Sentinel-1 • Current Pass
            </span>

            {/* AI detection overlays */}
            {DETECTION_OVERLAYS.map((ov, i) => {
              const isRed = ov.tone === "red";
              const color = isRed ? "#f87171" : "#22d3ee";
              return (
                <div
                  key={ov.label}
                  className="sat-float absolute z-10"
                  style={{
                    top: ov.top,
                    left: ov.left,
                    animationDelay: `${i * 0.3}s`,
                  }}
                  
                >

                  {/* connector line */}
                  <span
                    className="absolute w-6 h-px"
                    style={{
                      background: `linear-gradient(90deg, ${color}, transparent)`,
                      top: "50%",
                      left: "-24px",
                    }}
                  />
                  {/* scan dot */}
                  <span
                    className="sat-scan-dot absolute w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: color, color, top: "50%", left: "-4px", transform: "translateY(-50%)" }}
                  />
                  <span
                    className={`sat-overlay inline-block px-2 py-1 rounded-lg text-[9px] md:text-[10px] font-semibold whitespace-nowrap border backdrop-blur-sm ${
                      isRed
                        ? "text-red-200 bg-red-500/20 border-red-400/50"
                        : "text-cyan-200 bg-cyan-500/15 border-cyan-400/40"
                    }`}
                    style={{ boxShadow: `0 0 10px ${color}55` }}
                  >
                    {ov.label}
                  </span>
                </div>
              );
            })}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="scan-line" />
            </div>
          </div>
        </div>

        {/* Mobile: analysis panel stacked below images (no overlap on small screens) */}
        <div className="md:hidden mt-4 bg-slate-950/90 backdrop-blur-2xl border border-cyan-400/40 rounded-2xl p-4 shadow-[0_0_25px_rgba(34,211,238,0.25)]">
          <div className="flex items-center justify-between mb-2">
            <span
              className="text-[10px] uppercase tracking-widest font-bold text-cyan-300"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              AI Change Analysis
            </span>
            <span className="sat-verified flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8px] font-bold text-emerald-300 bg-emerald-400/15 border border-emerald-400/40">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" style={{ boxShadow: "0 0 6px #34d399" }} />
              AI VERIFIED
            </span>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-slate-300">
            <div className="flex items-center justify-between">
              <span>Icebergs</span>
              <span className="font-semibold text-cyan-300">+10</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Sea Ice</span>
              <span className="font-semibold text-amber-300">-2.4%</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Fractures</span>
              <span className="font-semibold text-cyan-300">4</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Collision Risk</span>
              <span className="font-semibold text-red-400">+18%</span>
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] uppercase tracking-widest text-slate-500 font-semibold">
                Model Confidence
              </span>
              <span className="text-[10px] text-cyan-300 font-semibold">98.2%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full rounded-full bg-cyan-400 motion-safe:transition-all motion-safe:duration-1000"
                style={{ width: "98.2%", boxShadow: "0 0 8px #22d3ee" }}
              />
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-center">
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">
              Iceberg Count Change
            </p>
            <p className="mt-1 text-lg font-semibold text-cyan-300">{data.icebergCountChange}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-center">
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">
              Sea Ice Change
            </p>
            <p className="mt-1 text-lg font-semibold text-sky-200">{data.seaIceChange}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-center">
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">
              AI Detected Fractures
            </p>
            <p className="mt-1 text-lg font-semibold text-amber-300">{data.fractures}</p>
          </div>
        </div>
      </div>

      {/* AI detection summary */}
      <div className={`grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 ${fade("delay-200")}`}>
        {[
          { label: "Icebergs Detected", value: counters.detected, accent: "#22d3ee" },
          { label: "New Ice Fractures", value: counters.fractures, accent: "#fbbf24" },
          { label: "Navigation Risk", value: data.risk, accent: data.riskColor },
          { label: "Model Confidence", value: `${counters.confidence}%`, accent: "#34d399" },
        ].map((card) => (
          <div
            key={card.label}
            className={`bg-slate-900/60 backdrop-blur-2xl border border-cyan-400/20 rounded-3xl p-5 flex flex-col gap-2 shadow-[0_0_25px_rgba(0,0,0,0.35)] ${panelHover}`}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-widest text-slate-400 font-medium">
                {card.label}
              </p>
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: card.accent, boxShadow: `0 0 8px ${card.accent}` }}
              />
            </div>
            <p
              className="text-2xl md:text-3xl font-bold"
              style={{ fontFamily: "'Space Grotesk', sans-serif", color: card.accent }}
            >
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Two-column: iceberg drawer + timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Iceberg intelligence drawer */}
        <div className={`bg-slate-900/60 backdrop-blur-2xl border border-cyan-400/20 rounded-3xl p-6 shadow-[0_0_25px_rgba(0,0,0,0.35)] ${panelHover} ${fade("delay-250")}`}>
          <h3
            className="text-sm font-semibold text-slate-100 mb-4"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Iceberg Intelligence — {region}
          </h3>
          <div className="flex flex-col gap-3">
            {data.icebergs.map((b) => {
              const color = riskBadgeColor(b.risk);
              const isExpanded = expandedId === b.id;
              return (
                <div
                  key={b.id}
                  className="rounded-2xl border border-white/10 bg-slate-950/40 transition-all duration-300 hover:border-cyan-400/30"
                >
                  <button
                    onClick={() => toggleExpand(b.id)}
                    className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }}
                      />
                      <span className="text-sm font-semibold text-slate-100">{b.id}</span>
                      <span className="text-xs text-slate-500">{b.size}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                        style={{ color, backgroundColor: `${color}22`, border: `1px solid ${color}55` }}
                      >
                        {b.risk} · {riskLabel(b.risk)}
                      </span>
                      <span className="text-xs text-slate-400 hidden sm:inline">{b.drift}</span>
                      <span className="text-xs text-slate-500">{isExpanded ? "▲" : "▼"}</span>
                    </div>
                  </button>

                  <div
                    className={`grid transition-all duration-300 motion-reduce:transition-none ease-out ${
                      isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="px-4 pb-4 flex flex-col gap-1.5 text-xs text-slate-300 border-t border-white/10 pt-3 mx-0">
                        <span>Coordinates: {b.coords}</span>
                        <span>Drift Direction: {b.dir}</span>
                        <span>Collision Probability: {b.collision}%</span>
                        <span>Est. Arrival Near Lane: {b.eta}</span>
                        <span className="text-slate-200 font-medium mt-1">
                          AI Recommendation: {b.rec}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mission timeline */}
        <div className={`bg-slate-900/60 backdrop-blur-2xl border border-cyan-400/20 rounded-3xl p-6 shadow-[0_0_25px_rgba(0,0,0,0.35)] ${panelHover} ${fade("delay-300")}`}>
          <h3
            className="text-sm font-semibold text-slate-100 mb-5"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Mission Timeline
          </h3>
          <div className="relative pl-6 flex flex-col gap-6">
            <div className="absolute left-[7px] top-1 bottom-1 w-px bg-white/10" />
            {data.timeline.map((event, i) => (
              <div
                key={i}
                className={`relative flex items-start gap-3 ${fade(`delay-[${i * 80}ms]`)}`}
              >
                <span
                  className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-cyan-400 border-2 border-slate-950"
                  style={{ boxShadow: "0 0 10px #22d3ee" }}
                />
                <div>
                  <p className="text-xs text-slate-500 font-mono">{event.time}</p>
                  <p className="text-sm text-slate-200 mt-0.5">{event.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Mission Briefing */}
      <div className={`bg-slate-900/60 backdrop-blur-2xl border border-cyan-400/20 rounded-3xl p-6 md:p-8 shadow-[0_0_40px_rgba(34,211,238,0.1)] ${panelHover} ${fade("delay-350")}`}>
        <div className="flex items-center gap-2 mb-4">
          <span className="w-2 h-2 rounded-full bg-cyan-400" style={{ boxShadow: "0 0 10px #22d3ee" }} />
          <span className="text-xs uppercase tracking-widest text-cyan-300 font-medium">
            AI Mission Briefing
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-1">
              Situation
            </p>
            <p className="text-sm text-slate-300 leading-relaxed">{data.briefing.situation}</p>

            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mt-4 mb-2">
              Recommended Action
            </p>
            <ul className="flex flex-col gap-1.5">
              {data.briefing.actions.map((a, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                  <span className="text-cyan-400 mt-0.5">▹</span>
                  {a}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3">
                <p className="text-[10px] uppercase tracking-widest text-emerald-300 font-semibold">
                  Expected Fuel Savings
                </p>
                <p className="text-slate-100 text-sm font-medium mt-1">{data.briefing.fuel}</p>
              </div>
              <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-3">
                <p className="text-[10px] uppercase tracking-widest text-amber-300 font-semibold">
                  ETA Improvement
                </p>
                <p className="text-slate-100 text-sm font-medium mt-1">{data.briefing.eta}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-4">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">
                  Risk Assessment Confidence
                </p>
                <p className="text-xs text-cyan-300 font-semibold">{data.briefing.confidencePct}%</p>
              </div>
              <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-cyan-400 motion-safe:transition-all motion-safe:duration-1000"
                  style={{ width: `${data.briefing.confidencePct}%`, boxShadow: "0 0 8px #22d3ee" }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Environmental snapshot */}
      <div className={`${fade("delay-400")}`}>
        <h3
          className="text-sm font-semibold text-slate-100 mb-4"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          Environmental Snapshot
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {data.env.map((item) => (
            <div
              key={item.label}
              className={`bg-slate-900/60 backdrop-blur-2xl border border-cyan-400/20 rounded-2xl p-4 flex flex-col gap-2 shadow-[0_0_20px_rgba(0,0,0,0.3)] ${panelHover}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-lg">{item.icon}</span>
                <span className={`text-xs font-semibold ${TREND_COLOR[item.trend]}`}>
                  {TREND_ARROW[item.trend]}
                </span>
              </div>
              <p className="text-[10px] uppercase tracking-widest text-slate-500">{item.label}</p>
              <p className="text-sm font-semibold text-slate-100">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Priority zones */}
      <div className={`grid grid-cols-1 md:grid-cols-3 gap-5 ${fade("delay-450")}`}>
        <div className={`bg-slate-900/60 backdrop-blur-2xl border border-red-400/20 rounded-3xl p-5 ${panelHover}`}>
          <p className="text-[10px] uppercase tracking-widest text-red-300 font-semibold">
            Highest Risk Zone
          </p>
          <p className="mt-2 text-lg font-semibold text-slate-100">{data.zones.highestRisk}</p>
        </div>
        <div className={`bg-slate-900/60 backdrop-blur-2xl border border-emerald-400/20 rounded-3xl p-5 ${panelHover}`}>
          <p className="text-[10px] uppercase tracking-widest text-emerald-300 font-semibold">
            Most Stable Route
          </p>
          <p className="mt-2 text-lg font-semibold text-slate-100">{data.zones.stableRoute}</p>
        </div>
        <div className={`bg-slate-900/60 backdrop-blur-2xl border border-cyan-400/20 rounded-3xl p-5 ${panelHover}`}>
          <p className="text-[10px] uppercase tracking-widest text-cyan-300 font-semibold">
            Satellite Refresh ETA
          </p>
          <p className="mt-2 text-lg font-semibold text-slate-100">{data.zones.refreshEta}</p>
        </div>
      </div>
    </div>
  );
}

export default MissionIntel;