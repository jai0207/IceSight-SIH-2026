import { useEffect, useMemo, useState } from "react";

/* ---------------------------------------------------------
   Mock data
--------------------------------------------------------- */

const INITIAL_ALERTS = [
  {
    id: "AL-001",
    severity: "Critical",
    title: "Large iceberg detected near Ross Sea corridor.",
    iceberg: "IS-204",
    region: "Ross Sea",
    time: "07:15 UTC",
    desc: "Sentinel-1 detected a large tabular iceberg drifting into the primary shipping corridor.",
    confidence: 94,
    status: "New",
    source: "Sentinel-1",
    drift: "North-East, 1.2 km/h",
    radius: "8.4 km",
    collision: 71,
    action: "Reroute RV Polar Star via Safe Corridor B immediately.",
  },
  {
    id: "AL-002",
    severity: "High",
    title: "Sea-ice concentration increased 12% over 24h.",
    iceberg: "IS-116",
    region: "Weddell Sea",
    time: "06:51 UTC",
    desc: "Rapid concentration growth detected, raising navigational risk for nearby vessels.",
    confidence: 87,
    status: "New",
    source: "Sentinel-2",
    drift: "North, 0.8 km/h",
    radius: "5.1 km",
    collision: 59,
    action: "Monitor closely; prepare alternate route if trend continues.",
  },
  {
    id: "AL-003",
    severity: "Medium",
    title: "Iceberg drift speed exceeded forecast threshold.",
    iceberg: "IS-107",
    region: "Amundsen Sea",
    time: "06:38 UTC",
    desc: "Drift model predicted 0.6 km/h; observed speed now 0.9 km/h.",
    confidence: 76,
    status: "New",
    source: "NOAA",
    drift: "North-East, 0.9 km/h",
    radius: "6.7 km",
    collision: 48,
    action: "Update drift model weighting for this zone.",
  },
  {
    id: "AL-004",
    severity: "Low",
    title: "Route optimization available for RV Polar Star.",
    iceberg: "—",
    region: "Ross Sea",
    time: "06:23 UTC",
    desc: "AI model identified a fuel-efficient alternate route with lower iceberg density.",
    confidence: 91,
    status: "New",
    source: "AI Route Engine",
    drift: "N/A",
    radius: "N/A",
    collision: 4,
    action: "Approve suggested route to save estimated 18.4% fuel.",
  },
  {
    id: "AL-005",
    severity: "Critical",
    title: "Iceberg IS-104 fracture detected — debris field expanding.",
    iceberg: "IS-104",
    region: "Ross Sea",
    time: "06:10 UTC",
    desc: "New fracture increases the number of smaller, harder-to-track ice fragments.",
    confidence: 96,
    status: "New",
    source: "Sentinel-1",
    drift: "East, 0.5 km/h",
    radius: "9.8 km",
    collision: 68,
    action: "Issue navigation warning to all vessels within 15 km.",
  },
  {
    id: "AL-006",
    severity: "High",
    title: "Iceberg IS-109 approaching shipping lane.",
    iceberg: "IS-109",
    region: "Amundsen Sea",
    time: "05:56 UTC",
    desc: "Projected to cross active shipping lane within 6 hours at current drift rate.",
    confidence: 83,
    status: "New",
    source: "Sentinel-2",
    drift: "North, 0.7 km/h",
    radius: "3.9 km",
    collision: 55,
    action: "Notify vessels transiting Amundsen Sea corridor.",
  },
  {
    id: "AL-007",
    severity: "Medium",
    title: "Ocean current shift detected near Bellingshausen Sea.",
    iceberg: "IS-108",
    region: "Bellingshausen Sea",
    time: "05:42 UTC",
    desc: "Current shift may accelerate drift of nearby medium-risk icebergs.",
    confidence: 71,
    status: "New",
    source: "NOAA",
    drift: "East, 1.3 km/h",
    radius: "15.1 km",
    collision: 19,
    action: "Re-run drift simulation with updated current vectors.",
  },
  {
    id: "AL-008",
    severity: "Low",
    title: "New satellite pass completed over Weddell Sea.",
    iceberg: "—",
    region: "Weddell Sea",
    time: "05:28 UTC",
    desc: "Fresh imagery ingested and queued for AI risk analysis.",
    confidence: 99,
    status: "New",
    source: "Sentinel-1",
    drift: "N/A",
    radius: "N/A",
    collision: 2,
    action: "No action required — analysis pipeline running automatically.",
  },
  {
    id: "AL-009",
    severity: "Resolved",
    title: "Iceberg IS-090 cleared shipping corridor.",
    iceberg: "IS-090",
    region: "Ross Sea",
    time: "04:55 UTC",
    desc: "Iceberg drifted clear of the corridor; risk downgraded to negligible.",
    confidence: 98,
    status: "Resolved",
    source: "Sentinel-2",
    drift: "South-West, 1.6 km/h",
    radius: "0 km",
    collision: 1,
    action: "Close alert — no further tracking required.",
  },
  {
    id: "AL-010",
    severity: "High",
    title: "AI collision probability rising for IS-113.",
    iceberg: "IS-113",
    region: "Amundsen Sea",
    time: "04:40 UTC",
    desc: "Collision probability increased from 32% to 41% over the last 6 hours.",
    confidence: 88,
    status: "New",
    source: "AI Route Engine",
    drift: "East, 0.6 km/h",
    radius: "7.2 km",
    collision: 41,
    action: "Flag for manual review by navigation officer.",
  },
  {
    id: "AL-011",
    severity: "Critical",
    title: "Warning escalated to Critical for IS-116.",
    iceberg: "IS-116",
    region: "Weddell Sea",
    time: "04:22 UTC",
    desc: "Risk score crossed the critical threshold following rapid drift acceleration.",
    confidence: 92,
    status: "New",
    source: "AI Route Engine",
    drift: "North, 0.8 km/h",
    radius: "4.4 km",
    collision: 59,
    action: "Immediate route deviation advised for all nearby vessels.",
  },
  {
    id: "AL-012",
    severity: "Resolved",
    title: "Sea-ice concentration alert closed for Davis Sea.",
    iceberg: "—",
    region: "Davis Sea",
    time: "03:58 UTC",
    desc: "Concentration levels returned to seasonal baseline.",
    confidence: 95,
    status: "Resolved",
    source: "NOAA",
    drift: "N/A",
    radius: "N/A",
    collision: 1,
    action: "Close alert — condition normalized.",
  },
];

const TIMELINE = [
  { time: "06:12 UTC", text: "Satellite detected new fracture near IS-104." },
  { time: "06:28 UTC", text: "Iceberg IS-204 entered Ross Sea corridor." },
  { time: "06:41 UTC", text: "AI route recalculated for RV Polar Star." },
  { time: "07:02 UTC", text: "Warning escalated to Critical for IS-116." },
];

const SEVERITY_STYLES = {
  Critical: { text: "text-red-300", border: "border-red-400/30", bg: "bg-red-400/10", dot: "#f87171" },
  High: { text: "text-orange-300", border: "border-orange-400/30", bg: "bg-orange-400/10", dot: "#fb923c" },
  Medium: { text: "text-amber-300", border: "border-amber-400/30", bg: "bg-amber-400/10", dot: "#fbbf24" },
  Low: { text: "text-cyan-300", border: "border-cyan-400/30", bg: "bg-cyan-400/10", dot: "#22d3ee" },
  Resolved: { text: "text-emerald-300", border: "border-emerald-400/30", bg: "bg-emerald-400/10", dot: "#34d399" },
};

const STATUS_STYLES = {
  New: "text-slate-300 border-white/15 bg-white/5",
  Acknowledged: "text-cyan-300 border-cyan-400/30 bg-cyan-400/10",
  Resolved: "text-emerald-300 border-emerald-400/30 bg-emerald-400/10",
};

const FILTERS = ["All", "Critical", "High", "Medium", "Low", "Resolved"];

function severityStyle(sev) {
  return SEVERITY_STYLES[sev] || SEVERITY_STYLES.Low;
}

/* ---------------------------------------------------------
   Component
--------------------------------------------------------- */

function Alerts() {
  const [alerts, setAlerts] = useState(INITIAL_ALERTS);
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [utcTime, setUtcTime] = useState("");
  const [mounted, setMounted] = useState(false);
  const [recalculating, setRecalculating] = useState(false);

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

  const summary = useMemo(() => {
    const active = alerts.filter((a) => a.status !== "Resolved");
    return {
      total: active.length,
      critical: alerts.filter((a) => a.severity === "Critical" && a.status !== "Resolved").length,
      high: alerts.filter((a) => a.severity === "High" && a.status !== "Resolved").length,
      resolvedToday: alerts.filter((a) => a.status === "Resolved").length,
    };
  }, [alerts]);

  const visibleAlerts = useMemo(() => {
    let list = alerts;
    if (filter !== "All") {
      list = list.filter((a) =>
        filter === "Resolved" ? a.status === "Resolved" : a.severity === filter
      );
    }
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.iceberg.toLowerCase().includes(q) ||
          a.region.toLowerCase().includes(q) ||
          a.source.toLowerCase().includes(q)
      );
    }
    return list;
  }, [alerts, filter, query]);

  const handleAcknowledge = (id) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: "Acknowledged" } : a))
    );
  };

  const handleResolve = (id) => {
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, status: "Resolved", severity: "Resolved" } : a
      )
    );
  };

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleRecalculate = () => {
    setRecalculating(true);
    setTimeout(() => setRecalculating(false), 1400);
  };

  const fade = (delay = "") =>
    `transition-all duration-700 motion-reduce:transition-none ease-out ${delay} ${
      mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
    }`;

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      {/* Hero header */}
      <div className={`flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 ${fade()}`}>
        <div>
          <span className="text-xs uppercase tracking-widest text-slate-400 font-medium">
            Alerts
          </span>
          <h2
            className="mt-1 text-3xl md:text-4xl font-bold text-white"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            AI Alerts Command Center
          </h2>
          <p className="mt-2 text-sm text-slate-400 max-w-xl">
            Monitor iceberg threats, navigation hazards, satellite detections
            and AI-generated recommendations.
          </p>
        </div>

        <div className="flex flex-col items-start sm:items-end gap-2">
          <span className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium text-emerald-300 border border-emerald-400/30 bg-emerald-400/10">
            <span className="relative flex h-2 w-2">
              <span className="motion-safe:animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            LIVE ALERT STREAM
          </span>
          <span className="text-xs font-mono text-slate-400 tabular-nums">
            {utcTime}
          </span>
        </div>
      </div>

      {/* Summary strip */}
      <div className={`grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 ${fade("delay-100")}`}>
        {[
          { label: "Total Active Alerts", value: summary.total, icon: "🛰️", color: "#22d3ee" },
          { label: "Critical Alerts", value: summary.critical, icon: "🚨", color: "#f87171" },
          { label: "High Priority Alerts", value: summary.high, icon: "⚠️", color: "#fb923c" },
          { label: "Alerts Resolved Today", value: summary.resolvedToday, icon: "✅", color: "#34d399" },
        ].map((card) => (
          <div
            key={card.label}
            className="bg-slate-900/60 backdrop-blur-2xl border border-cyan-400/20 rounded-3xl p-5 flex flex-col gap-3 shadow-[0_0_25px_rgba(0,0,0,0.35)] transition-all duration-300 motion-reduce:transition-none hover:-translate-y-1 hover:border-cyan-400/50 hover:shadow-[0_0_30px_rgba(34,211,238,0.25)]"
          >
            <div className="flex items-center justify-between">
              <span
                className="text-lg"
                style={{ filter: `drop-shadow(0 0 6px ${card.color})` }}
              >
                {card.icon}
              </span>
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: card.color, boxShadow: `0 0 8px ${card.color}` }}
              />
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-400 font-medium">
                {card.label}
              </p>
              <p
                className="mt-1 text-2xl md:text-3xl font-bold transition-all duration-500"
                style={{ fontFamily: "'Space Grotesk', sans-serif", color: card.color }}
              >
                {card.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters + search */}
      <div className={`flex flex-col md:flex-row md:items-center gap-4 ${fade("delay-150")}`}>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-all duration-300 ${
                filter === f
                  ? "text-cyan-300 border-cyan-400/50 bg-cyan-400/10 shadow-[0_0_16px_rgba(34,211,238,0.3)]"
                  : "text-slate-400 border-white/10 bg-white/5 hover:text-slate-200 hover:border-white/20"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="flex-1 min-w-[220px]">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search alerts, iceberg ID, region, or satellite event..."
            className="w-full bg-slate-900/60 backdrop-blur-2xl border border-cyan-400/20 rounded-2xl px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition-all duration-300 focus:border-cyan-400/50 focus:shadow-[0_0_20px_rgba(34,211,238,0.2)]"
          />
        </div>
      </div>

      {/* Main grid: feed + recommendation panel */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        {/* Alert feed */}
        <div className={`lg:col-span-7 flex flex-col gap-4 ${fade("delay-200")}`}>
          <div className="flex flex-col gap-4 max-h-[720px] overflow-y-auto pr-1">
            {visibleAlerts.length === 0 && (
              <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-8 text-center text-sm text-slate-500">
                No alerts match your filters.
              </div>
            )}

            {visibleAlerts.map((alert, i) => {
              const sev = severityStyle(alert.severity);
              const isExpanded = expandedId === alert.id;
              return (
                <div
                  key={alert.id}
                  className={`bg-slate-900/60 backdrop-blur-2xl border ${sev.border} rounded-3xl p-5 shadow-[0_0_20px_rgba(0,0,0,0.3)] transition-all duration-300 motion-reduce:transition-none hover:border-cyan-400/50 hover:shadow-[0_0_28px_rgba(34,211,238,0.2)] ${fade(
                    `delay-[${Math.min(i, 6) * 60}ms]`
                  )}`}
                >
                  <button
                    onClick={() => toggleExpand(alert.id)}
                    className="w-full text-left flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${sev.text} ${sev.bg} border ${sev.border}`}
                        >
                          {alert.severity}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                            STATUS_STYLES[alert.status] || STATUS_STYLES.New
                          }`}
                        >
                          {alert.status.toUpperCase()}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500 font-mono">{alert.time}</span>
                    </div>

                    <p className="text-sm md:text-base font-medium text-slate-100">
                      {alert.title}
                    </p>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                      <span>Iceberg: {alert.iceberg}</span>
                      <span>Region: {alert.region}</span>
                      <span>AI Confidence: {alert.confidence}%</span>
                    </div>

                    <p className="text-xs text-slate-500 leading-relaxed">{alert.desc}</p>
                  </button>

                  {/* Expandable details */}
                  <div
                    className={`grid transition-all duration-300 motion-reduce:transition-none ease-out ${
                      isExpanded ? "grid-rows-[1fr] opacity-100 mt-4" : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 flex flex-col gap-2 text-xs text-slate-300">
                        <span>Satellite Source: {alert.source}</span>
                        <span>Estimated Drift Direction: {alert.drift}</span>
                        <span>Risk Radius: {alert.radius}</span>
                        <span>Collision Probability: {alert.collision}%</span>
                        <span className="text-slate-200 font-medium mt-1">
                          Suggested Action: {alert.action}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quick actions */}
                  <div className="mt-4 flex items-center gap-3">
                    <button
                      onClick={() => handleAcknowledge(alert.id)}
                      disabled={alert.status !== "New"}
                      className="px-3 py-1.5 rounded-xl text-xs font-medium border border-cyan-400/30 text-cyan-300 bg-cyan-400/5 transition-all duration-200 active:scale-95 hover:bg-cyan-400/15 hover:shadow-[0_0_14px_rgba(34,211,238,0.3)] disabled:opacity-30 disabled:pointer-events-none"
                    >
                      Acknowledge
                    </button>
                    <button
                      onClick={() => handleResolve(alert.id)}
                      disabled={alert.status === "Resolved"}
                      className="px-3 py-1.5 rounded-xl text-xs font-medium border border-emerald-400/30 text-emerald-300 bg-emerald-400/5 transition-all duration-200 active:scale-95 hover:bg-emerald-400/15 hover:shadow-[0_0_14px_rgba(52,211,153,0.3)] disabled:opacity-30 disabled:pointer-events-none"
                    >
                      Resolve
                    </button>
                    <button
                      onClick={() => toggleExpand(alert.id)}
                      className="ml-auto text-xs text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {isExpanded ? "Hide details ▲" : "View details ▼"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* AI recommendation panel */}
        <div className={`lg:col-span-3 ${fade("delay-250")}`}>
          <div className="lg:sticky lg:top-24 bg-slate-900/60 backdrop-blur-2xl border border-cyan-400/20 rounded-3xl p-6 shadow-[0_0_30px_rgba(34,211,238,0.1)] flex flex-col gap-4 transition-all duration-300 hover:border-cyan-400/50">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400" style={{ boxShadow: "0 0 10px #22d3ee" }} />
              <span className="text-xs uppercase tracking-widest text-cyan-300 font-medium">
                AI Recommendation
              </span>
            </div>

            <p className="text-sm text-slate-200 leading-relaxed">
              Immediate route adjustment recommended for the{" "}
              <span className="text-cyan-300 font-semibold">Ross Sea Corridor</span> to
              avoid escalating iceberg risk.
            </p>

            <div className="flex flex-col gap-3">
              <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3">
                <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">
                  Recommended Action
                </p>
                <p className="text-sm text-slate-100 mt-1">
                  Reroute via Safe Corridor B
                </p>
              </div>
              <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3">
                <p className="text-[10px] uppercase tracking-widest text-emerald-300 font-semibold">
                  Estimated Fuel Savings
                </p>
                <p className="text-sm text-slate-100 mt-1">18.4%</p>
              </div>
              <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-3">
                <p className="text-[10px] uppercase tracking-widest text-amber-300 font-semibold">
                  ETA Impact
                </p>
                <p className="text-sm text-slate-100 mt-1">+42 minutes</p>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">
                  Confidence Meter
                </p>
                <p className="text-xs text-cyan-300 font-semibold">91%</p>
              </div>
              <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-cyan-400 motion-safe:transition-all motion-safe:duration-1000"
                  style={{ width: "91%", boxShadow: "0 0 8px #22d3ee" }}
                />
              </div>
            </div>

            <button
              onClick={handleRecalculate}
              disabled={recalculating}
              className="mt-1 w-full px-4 py-2.5 rounded-2xl text-sm font-medium text-cyan-950 bg-cyan-400 transition-all duration-200 active:scale-95 hover:bg-cyan-300 hover:shadow-[0_0_20px_rgba(34,211,238,0.4)] disabled:opacity-60"
            >
              {recalculating ? "Recalculating…" : "Recalculate Route"}
            </button>
          </div>
        </div>
      </div>

      {/* Alert timeline */}
      <div
        className={`bg-slate-900/60 backdrop-blur-2xl border border-cyan-400/20 rounded-3xl p-6 shadow-[0_0_25px_rgba(0,0,0,0.35)] transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400/50 hover:shadow-[0_0_30px_rgba(34,211,238,0.25)] ${fade(
          "delay-300"
        )}`}
      >
        <h3
          className="text-sm font-semibold text-slate-100 mb-5"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          Alert Timeline
        </h3>
        <div className="relative pl-6 flex flex-col gap-6">
          <div className="absolute left-[7px] top-1 bottom-1 w-px bg-white/10" />
          {TIMELINE.map((event, i) => (
            <div key={i} className="relative flex items-start gap-3">
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
  );
}

export default Alerts;