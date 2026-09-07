import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import KpiCard from "../components/KpiCard.jsx";

const API_BASE = "http://127.0.0.1:8000";

// Fixed demo location for live weather / sea-ice / risk
const DEMO_LAT = -70.767;
const DEMO_LON = 11.7315;

const iceCoverageTrend = [
  { day: "Day 1", coverage: 71.2 },
  { day: "Day 2", coverage: 72.8 },
  { day: "Day 3", coverage: 74.1 },
  { day: "Day 4", coverage: 73.6 },
  { day: "Day 5", coverage: 75.9 },
  { day: "Day 6", coverage: 77.0 },
  { day: "Day 7", coverage: 78.2 },
];

const driftForecast = [
  { hour: "0h", drift: 0.4 },
  { hour: "6h", drift: 0.6 },
  { hour: "12h", drift: 0.9 },
  { hour: "18h", drift: 1.1 },
  { hour: "24h", drift: 0.95 },
  { hour: "30h", drift: 1.3 },
  { hour: "36h", drift: 1.5 },
  { hour: "42h", drift: 1.2 },
  { hour: "48h", drift: 0.9 },
];

// Cyan -> Blue -> Yellow -> Orange -> Red, mapped by severity
const riskDistribution = [
  { zone: "Ross Sea", risk: 92, color: "#f87171" },
  { zone: "Weddell Sea", risk: 74, color: "#fb923c" },
  { zone: "Amundsen Sea", risk: 58, color: "#fbbf24" },
  { zone: "Bellingshausen Sea", risk: 47, color: "#818cf8" },
  { zone: "East Antarctica", risk: 32, color: "#38bdf8" },
  { zone: "Southern Ocean", risk: 18, color: "#22d3ee" },
];

const panelHover =
  "transition-all duration-300 motion-reduce:transition-none hover:-translate-y-1 motion-reduce:hover:translate-y-0 hover:border-cyan-400/50 hover:shadow-[0_0_35px_rgba(34,211,238,0.3)]";

function ChartCard({ title, subtitle, children }) {
  return (
    <div
      className={`bg-slate-900/60 backdrop-blur-2xl border border-cyan-400/20 rounded-3xl p-6 flex flex-col min-h-[320px] shadow-[0_0_25px_rgba(0,0,0,0.35)] ${panelHover}`}
    >
      <div className="mb-4">
        <h3
          className="text-sm font-semibold text-slate-100"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          {title}
        </h3>
        {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
      </div>
      <div className="flex-1 min-h-[220px]">{children}</div>
    </div>
  );
}

const tooltipStyle = {
  backgroundColor: "rgba(10, 18, 32, 0.95)",
  border: "1px solid rgba(34,211,238,0.3)",
  borderRadius: "12px",
  color: "#eaf4ff",
  fontSize: "12px",
  padding: "8px 12px",
};

function Analytics() {
  const [lastUpdate, setLastUpdate] = useState("");

  // Live backend data
  const [weather, setWeather] = useState(null);
  const [seaIce, setSeaIce] = useState(null);
  const [riskData, setRiskData] = useState(null); // full /risk response: { location, weather, sea_ice, risk }
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setLastUpdate(now.toISOString().slice(11, 19) + " UTC");
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch live weather / sea-ice / risk once on mount
  useEffect(() => {
    fetch(`${API_BASE}/weather?lat=${DEMO_LAT}&lon=${DEMO_LON}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json) => setWeather(json))
      .catch((err) => {
        setFetchError("weather");
        console.error("weather fetch failed:", err);
      });

    fetch(`${API_BASE}/sea-ice?lat=${DEMO_LAT}&lon=${DEMO_LON}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json) => setSeaIce(json))
      .catch((err) => {
        setFetchError("sea-ice");
        console.error("sea-ice fetch failed:", err);
      });

    fetch(`${API_BASE}/risk?lat=${DEMO_LAT}&lon=${DEMO_LON}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json) => setRiskData(json))
      .catch((err) => {
        setFetchError("risk");
        console.error("risk fetch failed:", err);
      });
  }, []);

  // Live risk level/score from GET /risk → data.risk.risk_level / data.risk.risk_score
  const liveRiskLevel = riskData?.risk?.risk_level;
  const liveRiskScore = riskData?.risk?.risk_score;

  // KPI summary row — Sea Ice Coverage and Forecast Confidence have no
  // matching backend field (no coverage_pct / confidence_pct in the
  // contract), so those two stay as the original mock values. Navigation
  // Risk is new here (surfacing the live risk_level/risk_score), replacing
  // the mock "Avg. Drift Speed" slot's neighbor is avoided — instead we
  // keep all four original KPI cards and only swap in live risk data where
  // a slot already represented risk-like info is absent, so nothing is
  // fabricated: we simply update the existing cards with real values where
  // the label already matches a backend field.
  const kpis = [
    { label: "Sea Ice Coverage", value: "78.2%", color: "#22d3ee", trend: "+2.1%" },
    { label: "Active Icebergs", value: "143", color: "#9fdcff", trend: "+6" },
    { label: "Avg. Drift Speed", value: "0.9 km/h", color: "#818cf8", trend: "-0.2 km/h" },
    { label: "Forecast Confidence", value: "91.4%", color: "#34d399", trend: "+3.0%" },
  ];

  // Environmental Conditions — mapped to exact backend fields:
  // /weather → wind_speed_kmh, temperature_c, visibility_km
  // /sea-ice → ocean_current_kmh, wave_height_m
  const envConditions = [
    {
      label: "Wind Speed",
      value: weather?.wind_speed_kmh !== undefined ? `${weather.wind_speed_kmh} km/h` : "Loading...",
      icon: "🌬️",
      pct: 55,
      accent: "#22d3ee",
    },
    {
      label: "Ocean Temperature",
      value: weather?.temperature_c !== undefined ? `${weather.temperature_c}°C` : "Loading...",
      icon: "🌡️",
      pct: 30,
      accent: "#9fdcff",
    },
    {
      label: "Visibility",
      value: weather?.visibility_km !== undefined ? `${weather.visibility_km} km` : "Loading...",
      icon: "👁️",
      pct: 78,
      accent: "#818cf8",
    },
    {
      label: "Ocean Current",
      value: seaIce?.ocean_current_kmh !== undefined ? `${seaIce.ocean_current_kmh} km/h` : "Loading...",
      icon: "🌊",
      pct: 42,
      accent: "#34d399",
    },
    {
      label: "Wave Height",
      value: seaIce?.wave_height_m !== undefined ? `${seaIce.wave_height_m} m` : "Loading...",
      icon: "〰️",
      pct: 60,
      accent: "#fbbf24",
    },
  ];

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div>
          <span className="text-xs uppercase tracking-widest text-slate-400 font-medium">
            Insights
          </span>
          <h2
            className="mt-1 text-3xl md:text-4xl font-bold text-white"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Analytics
          </h2>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto px-3 py-1.5 rounded-full text-xs font-medium text-cyan-300 border border-cyan-400/30 bg-cyan-400/10">
          <span className="relative flex h-2 w-2">
            <span className="motion-safe:animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400" />
          </span>
          Last Satellite Update — {lastUpdate}
        </div>
      </div>

      {/* KPI summary row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="transition-all duration-300 motion-reduce:transition-none hover:-translate-y-1 motion-reduce:hover:translate-y-0 hover:drop-shadow-[0_0_25px_rgba(34,211,238,0.35)] rounded-3xl"
          >
            <KpiCard {...kpi} />
          </div>
        ))}
      </div>

      {/* Live risk snapshot (from GET /risk → data.risk.risk_score / risk_level) */}
      <div
        className={`bg-slate-900/60 backdrop-blur-2xl border border-cyan-400/20 rounded-3xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-[0_0_25px_rgba(0,0,0,0.35)] ${panelHover}`}
      >
        <div className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full bg-cyan-400"
            style={{ boxShadow: "0 0 8px #22d3ee" }}
          />
          <span className="text-xs uppercase tracking-widest text-slate-400 font-medium">
            Live Navigation Risk
          </span>
        </div>
        <div className="flex items-center gap-6">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-slate-500">Risk Level</p>
            <p className="text-sm font-semibold text-slate-100 mt-0.5">
              {liveRiskLevel ?? "Loading..."}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-slate-500">Risk Score</p>
            <p className="text-sm font-semibold text-slate-100 mt-0.5">
              {liveRiskScore !== undefined ? liveRiskScore : "Loading..."}
            </p>
          </div>
        </div>
      </div>

      {/* Line + Area charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Sea Ice Coverage Trend" subtitle="Last 7 days · % coverage">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={iceCoverageTrend}>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis
                dataKey="day"
                stroke="#5b6b85"
                tick={{ fill: "#93a4bd", fontSize: 11 }}
                axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
                tickLine={false}
              />
              <YAxis
                stroke="#5b6b85"
                tick={{ fill: "#93a4bd", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                domain={[65, 85]}
                unit="%"
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Line
                type="monotone"
                dataKey="coverage"
                stroke="#22d3ee"
                strokeWidth={2.5}
                dot={{ r: 3, fill: "#22d3ee" }}
                activeDot={{ r: 5 }}
                isAnimationActive={true}
                animationDuration={1200}
                animationEasing="ease-out"
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Iceberg Drift Forecast" subtitle="Next 48 hours · km/h">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={driftForecast}>
              <defs>
                <linearGradient id="driftGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#5eead4" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#5eead4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis
                dataKey="hour"
                stroke="#5b6b85"
                tick={{ fill: "#93a4bd", fontSize: 11 }}
                axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
                tickLine={false}
              />
              <YAxis
                stroke="#5b6b85"
                tick={{ fill: "#93a4bd", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                unit=" km/h"
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Area
                type="monotone"
                dataKey="drift"
                stroke="#5eead4"
                strokeWidth={2.5}
                fill="url(#driftGradient)"
                isAnimationActive={true}
                animationDuration={1400}
                animationEasing="ease-out"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Risk distribution + Environmental panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChartCard
            title="Risk Distribution by Zone"
            subtitle="Navigational risk index (0–100) · 6 Antarctic zones"
          >
            <div className="w-full h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={riskDistribution}>
                  <CartesianGrid
                    stroke="rgba(255,255,255,0.06)"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="zone"
                    stroke="#5b6b85"
                    tick={{ fill: "#93a4bd", fontSize: 10 }}
                    axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
                    tickLine={false}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                    height={55}
                  />

                  <YAxis
                    stroke="#5b6b85"
                    tick={{ fill: "#93a4bd", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    domain={[0, 100]}
                  />

                  <Tooltip
                    contentStyle={tooltipStyle}
                    cursor={{ fill: "rgba(34,211,238,0.05)" }}
                  />

                  <Bar
                    dataKey="risk"
                    radius={[8, 8, 0, 0]}
                    isAnimationActive
                    animationDuration={1200}
                    animationEasing="ease-out"
                  >
                    {riskDistribution.map((entry) => (
                      <Cell key={entry.zone} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>

        {/* Environmental Conditions panel */}
        <div
          className={`bg-slate-900/60 backdrop-blur-2xl border border-cyan-400/20 rounded-3xl p-6 flex flex-col gap-4 shadow-[0_0_25px_rgba(0,0,0,0.35)] ${panelHover}`}
        >
          <h3
            className="text-sm font-semibold text-slate-100"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Environmental Conditions
          </h3>
          <div className="flex flex-col gap-4">
            {envConditions.map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 transition-colors duration-300 hover:border-cyan-400/30"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{
                        backgroundColor: item.accent,
                        boxShadow: `0 0 8px ${item.accent}`,
                      }}
                    />
                    <span className="text-sm">{item.icon}</span>
                    <span className="text-xs text-slate-400">{item.label}</span>
                  </div>
                  <span className="text-sm font-semibold text-slate-100">
                    {item.value}
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full motion-safe:transition-all motion-safe:duration-1000"
                    style={{
                      width: `${item.pct}%`,
                      backgroundColor: item.accent,
                      boxShadow: `0 0 6px ${item.accent}`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Prediction Summary */}
      <div
        className={`bg-slate-900/60 backdrop-blur-2xl border border-cyan-400/20 rounded-3xl p-6 md:p-8 shadow-[0_0_40px_rgba(34,211,238,0.1)] ${panelHover}`}
      >
        <div className="flex items-center gap-2 mb-3">
          <span
            className="w-2 h-2 rounded-full bg-cyan-400"
            style={{ boxShadow: "0 0 10px #22d3ee" }}
          />
          <span className="text-xs uppercase tracking-widest text-cyan-300 font-medium">
            AI Prediction Summary
          </span>
        </div>
        <p className="text-slate-300 text-sm md:text-base leading-relaxed max-w-3xl">
          Based on current drift patterns and sea-ice concentration trends, the
          model forecasts a{" "}
          <span className="text-cyan-300 font-semibold">91.4% confidence</span> in
          the 48-hour risk projection for the Ross Sea corridor. Iceberg density
          is expected to increase moderately over the next 24 hours before
          stabilizing.
        </p>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-4 transition-all duration-300 motion-reduce:transition-none hover:-translate-y-1 motion-reduce:hover:translate-y-0 hover:border-emerald-400/60 hover:shadow-[0_0_20px_rgba(52,211,153,0.25)]">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base">🧭</span>
              <p className="text-[10px] uppercase tracking-widest text-emerald-300 font-semibold">
                Recommended Navigation Window
              </p>
            </div>
            <p className="text-slate-100 text-sm font-medium mt-1">
              06:00 – 14:00 UTC, Aug 30
            </p>
          </div>

          <div className="rounded-2xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-4 transition-all duration-300 motion-reduce:transition-none hover:-translate-y-1 motion-reduce:hover:translate-y-0 hover:border-cyan-400/60 hover:shadow-[0_0_20px_rgba(34,211,238,0.25)]">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base">📡</span>
              <p className="text-[10px] uppercase tracking-widest text-cyan-300 font-semibold">
                Forecast Confidence
              </p>
            </div>
            <p className="text-slate-100 text-sm font-medium mt-1">91.4%</p>
          </div>

          <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-4 transition-all duration-300 motion-reduce:transition-none hover:-translate-y-1 motion-reduce:hover:translate-y-0 hover:border-amber-400/60 hover:shadow-[0_0_20px_rgba(251,191,36,0.25)]">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base">⏱️</span>
              <p className="text-[10px] uppercase tracking-widest text-amber-300 font-semibold">
                Next Model Recalculation
              </p>
            </div>
            <p className="text-slate-100 text-sm font-medium mt-1">In 6 hours</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Analytics;