import { useState } from "react";

/* ---------------------------------------------------------
   Shared UI bits
--------------------------------------------------------- */

const panelHover =
  "transition-all duration-300 motion-reduce:transition-none hover:-translate-y-1 motion-reduce:hover:translate-y-0 hover:border-cyan-400/50 hover:shadow-[0_0_30px_rgba(34,211,238,0.25)]";

function Card({ title, subtitle, children, className = "" }) {
  return (
    <div
      className={`bg-slate-900/60 backdrop-blur-2xl border border-cyan-400/20 rounded-3xl p-6 shadow-[0_0_25px_rgba(0,0,0,0.35)] ${panelHover} ${className}`}
    >
      {title && (
        <div className="mb-5">
          <h3
            className="text-sm font-semibold text-slate-100"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            {title}
          </h3>
          {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  );
}

function Toggle({ label, checked, onChange, description }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 transition-colors duration-300 hover:border-cyan-400/30">
      <div>
        <p className="text-sm text-slate-200 font-medium">{label}</p>
        {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative shrink-0 w-12 h-6 rounded-full transition-colors duration-300 motion-reduce:transition-none ${
          checked ? "bg-cyan-400/80" : "bg-white/10"
        }`}
        style={checked ? { boxShadow: "0 0 12px rgba(34,211,238,0.5)" } : undefined}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-slate-950 transition-transform duration-300 motion-reduce:transition-none ${
            checked ? "translate-x-6" : "translate-x-0"
          }`}
        />
      </button>
      <span
        className={`text-[10px] font-bold uppercase tracking-widest w-7 text-right ${
          checked ? "text-cyan-300" : "text-slate-500"
        }`}
      >
        {checked ? "ON" : "OFF"}
      </span>
    </div>
  );
}

function Select({ label, value, options, onChange }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs uppercase tracking-widest text-slate-500 font-semibold">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-slate-950/60 border border-cyan-400/20 rounded-xl px-3 py-2 text-sm text-slate-100 outline-none transition-all duration-300 focus:border-cyan-400/50 focus:shadow-[0_0_14px_rgba(34,211,238,0.2)]"
      >
        {options.map((opt) => (
          <option key={opt} value={opt} className="bg-slate-900">
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}

function StatusDot({ status }) {
  const color = status === "healthy" ? "#34d399" : status === "warning" ? "#fbbf24" : "#f87171";
  return (
    <span className="relative flex h-2.5 w-2.5">
      <span
        className="motion-safe:animate-ping absolute inline-flex h-full w-full rounded-full opacity-60"
        style={{ backgroundColor: color }}
      />
      <span
        className="relative inline-flex rounded-full h-2.5 w-2.5"
        style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }}
      />
    </span>
  );
}

/* ---------------------------------------------------------
   Component
--------------------------------------------------------- */

function Settings() {
  const [aiModels, setAiModels] = useState({
    iceberg: true,
    route: true,
    weather: true,
    fracture: false,
    autoRisk: true,
  });

  const [primaryFeed, setPrimaryFeed] = useState("Sentinel-1");
  const [refreshInterval, setRefreshInterval] = useState("30 min");
  const [regionPriority, setRegionPriority] = useState("Ross Sea");

  const [notifications, setNotifications] = useState({
    critical: true,
    high: true,
    route: false,
    weather: true,
    summary: false,
  });
  const [quietHours, setQuietHours] = useState(false);

  const [mapLayers, setMapLayers] = useState({
    iceberg: true,
    route: true,
    current: false,
    wind: false,
    seaIce: true,
    grid: false,
  });
  const [colorTheme, setColorTheme] = useState("IceSight Cyan");

  const [cacheMsg, setCacheMsg] = useState("");

  const toggleAi = (key) => setAiModels((prev) => ({ ...prev, [key]: !prev[key] }));
  const toggleNotif = (key) => setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  const toggleLayer = (key) => setMapLayers((prev) => ({ ...prev, [key]: !prev[key] }));

  const flashMsg = (msg) => {
    setCacheMsg(msg);
    setTimeout(() => setCacheMsg(""), 2200);
  };

  const systemHealth = [
    { label: "API Status", status: "healthy", detail: "Operational" },
    { label: "AI Engine", status: "healthy", detail: "Running v1.0.0" },
    { label: "Satellite Feed", status: "healthy", detail: "Connected" },
    { label: "Navigation Engine", status: "warning", detail: "Degraded — recalibrating" },
    { label: "Database Sync", status: "healthy", detail: "Synced" },
    { label: "Last Update", status: "healthy", detail: "2 minutes ago" },
  ];

  const themeColors = {
    "IceSight Cyan": "#22d3ee",
    "Polar Blue": "#60a5fa",
    "Aurora Green": "#34d399",
  };

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      {/* Hero header */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-widest text-slate-400 font-medium">
            Settings
          </span>
          <h2
            className="mt-1 text-3xl md:text-4xl font-bold text-white"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            System Control Center
          </h2>
          <p className="mt-2 text-sm text-slate-400 max-w-xl">
            Configure AI monitoring, satellite feeds, mission preferences and
            system behavior.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium text-emerald-300 border border-emerald-400/30 bg-emerald-400/10">
            <span className="relative flex h-2 w-2">
              <span className="motion-safe:animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            SYSTEM ONLINE
          </span>
          <span className="px-3 py-1.5 rounded-full text-xs font-medium text-cyan-300 border border-cyan-400/30 bg-cyan-400/10">
            SATELLITE LINK ACTIVE
          </span>
          <span className="px-3 py-1.5 rounded-full text-xs font-medium text-slate-300 border border-white/15 bg-white/5">
            VERSION v1.0.0 MVP
          </span>
        </div>
      </div>

      {/* Section 1 — User profile */}
      <Card className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="flex items-center gap-5">
          <div
            className="w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center text-2xl md:text-3xl font-bold text-cyan-950 shrink-0"
            style={{ background: "linear-gradient(135deg, #5eead4, #22d3ee)", boxShadow: "0 0 24px rgba(34,211,238,0.35)" }}
          >
            JC
          </div>
          <div>
            <p
              className="text-lg md:text-xl font-bold text-white"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Captain Jai
            </p>
            <p className="text-sm text-slate-400 mt-0.5">Navigation Commander</p>
            <p className="text-xs text-slate-500 mt-0.5">Smart India Hackathon Team</p>
            <span className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full text-[10px] font-bold text-cyan-300 bg-cyan-400/10 border border-cyan-400/30">
              Polar Clearance Level — Alpha
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button className="px-4 py-2 rounded-2xl text-sm font-medium text-cyan-300 border border-cyan-400/30 bg-cyan-400/5 transition-all duration-200 active:scale-95 hover:bg-cyan-400/15 hover:shadow-[0_0_16px_rgba(34,211,238,0.3)]">
            Edit Profile
          </button>
          <button className="px-4 py-2 rounded-2xl text-sm font-medium text-slate-200 border border-white/15 bg-white/5 transition-all duration-200 active:scale-95 hover:bg-white/10">
            Export Mission Config
          </button>
        </div>
      </Card>

      {/* Section 2 — AI model settings */}
      <Card title="AI Model Settings" subtitle="Toggle individual AI subsystems on or off">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Toggle label="Iceberg Detection AI" checked={aiModels.iceberg} onChange={() => toggleAi("iceberg")} />
          <Toggle label="Route Optimization AI" checked={aiModels.route} onChange={() => toggleAi("route")} />
          <Toggle label="Weather Prediction AI" checked={aiModels.weather} onChange={() => toggleAi("weather")} />
          <Toggle label="Satellite Fracture Detection" checked={aiModels.fracture} onChange={() => toggleAi("fracture")} />
          <Toggle label="Auto Risk Scoring" checked={aiModels.autoRisk} onChange={() => toggleAi("autoRisk")} />
        </div>
      </Card>

      {/* Section 3 — Satellite feed settings */}
      <Card title="Satellite Feed Settings" subtitle="Configure primary data source and refresh cadence">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Select
            label="Primary Feed"
            value={primaryFeed}
            options={["Sentinel-1", "Sentinel-2", "NOAA", "Copernicus Marine"]}
            onChange={setPrimaryFeed}
          />
          <Select
            label="Refresh Interval"
            value={refreshInterval}
            options={["15 min", "30 min", "1 hour", "6 hours"]}
            onChange={setRefreshInterval}
          />
          <Select
            label="Region Priority"
            value={regionPriority}
            options={["Ross Sea", "Weddell Sea", "Amundsen Sea", "Bellingshausen Sea", "East Antarctica"]}
            onChange={setRegionPriority}
          />
        </div>
        <div className="mt-4 rounded-2xl border border-cyan-400/20 bg-cyan-400/5 px-4 py-3 text-xs text-slate-300">
          Active configuration:{" "}
          <span className="text-cyan-300 font-semibold">{primaryFeed}</span> · refreshing every{" "}
          <span className="text-cyan-300 font-semibold">{refreshInterval}</span> · prioritizing{" "}
          <span className="text-cyan-300 font-semibold">{regionPriority}</span>
        </div>
      </Card>

      {/* Section 4 — Notification settings */}
      <Card title="Notification Settings" subtitle="Choose what mission control alerts you about">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Toggle label="Critical Alerts" checked={notifications.critical} onChange={() => toggleNotif("critical")} />
          <Toggle label="High Priority Alerts" checked={notifications.high} onChange={() => toggleNotif("high")} />
          <Toggle label="Route Recalculation" checked={notifications.route} onChange={() => toggleNotif("route")} />
          <Toggle label="Weather Warnings" checked={notifications.weather} onChange={() => toggleNotif("weather")} />
          <Toggle label="Daily Mission Summary" checked={notifications.summary} onChange={() => toggleNotif("summary")} />
          <Toggle
            label="Quiet Hours"
            checked={quietHours}
            onChange={() => setQuietHours((v) => !v)}
            description={quietHours ? "22:00 — 06:00 UTC" : "Disabled"}
          />
        </div>
      </Card>

      {/* Section 5 — Map preferences */}
      <Card title="Map Preferences" subtitle="Control which layers render on the Antarctica map">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Toggle label="Iceberg Layer" checked={mapLayers.iceberg} onChange={() => toggleLayer("iceberg")} />
          <Toggle label="Route Layer" checked={mapLayers.route} onChange={() => toggleLayer("route")} />
          <Toggle label="Ocean Current Layer" checked={mapLayers.current} onChange={() => toggleLayer("current")} />
          <Toggle label="Wind Layer" checked={mapLayers.wind} onChange={() => toggleLayer("wind")} />
          <Toggle label="Sea Ice Layer" checked={mapLayers.seaIce} onChange={() => toggleLayer("seaIce")} />
          <Toggle label="Grid Overlay" checked={mapLayers.grid} onChange={() => toggleLayer("grid")} />
        </div>

        <div className="mt-5">
          <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-2">
            Color Theme
          </p>
          <div className="flex flex-wrap gap-3">
            {Object.entries(themeColors).map(([name, color]) => (
              <button
                key={name}
                onClick={() => setColorTheme(name)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-all duration-300 ${
                  colorTheme === name
                    ? "border-cyan-400/50 bg-cyan-400/10 text-slate-100 shadow-[0_0_14px_rgba(34,211,238,0.25)]"
                    : "border-white/10 bg-white/5 text-slate-400 hover:border-white/20"
                }`}
              >
                <span
                  className="w-3.5 h-3.5 rounded-full"
                  style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }}
                />
                {name}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Section 6 — System health */}
      <Card title="System Health" subtitle="Live status across IceSight subsystems">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {systemHealth.map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 flex items-center justify-between transition-colors duration-300 hover:border-cyan-400/30"
            >
              <div>
                <p className="text-sm text-slate-200 font-medium">{item.label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{item.detail}</p>
              </div>
              <StatusDot status={item.status} />
            </div>
          ))}
        </div>
      </Card>

      {/* Section 7 — Storage & cache */}
      <Card title="Storage & Cache" subtitle="Manage locally cached mission data">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
          <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-center">
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">
              Cached Satellite Tiles
            </p>
            <p className="mt-1 text-lg font-semibold text-cyan-300">312 MB</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-center">
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">
              Stored Alerts
            </p>
            <p className="mt-1 text-lg font-semibold text-amber-300">86 records</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-center">
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">
              AI Prediction Cache
            </p>
            <p className="mt-1 text-lg font-semibold text-emerald-400">54 MB</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => flashMsg("Cache cleared.")}
            className="px-4 py-2 rounded-2xl text-sm font-medium text-red-300 border border-red-400/30 bg-red-400/5 transition-all duration-200 active:scale-95 hover:bg-red-400/15 hover:shadow-[0_0_16px_rgba(248,113,113,0.25)]"
          >
            Clear Cache
          </button>
          <button
            onClick={() => flashMsg("Satellite cache refreshed.")}
            className="px-4 py-2 rounded-2xl text-sm font-medium text-cyan-300 border border-cyan-400/30 bg-cyan-400/5 transition-all duration-200 active:scale-95 hover:bg-cyan-400/15 hover:shadow-[0_0_16px_rgba(34,211,238,0.3)]"
          >
            Refresh Satellite Cache
          </button>
          <button
            onClick={() => flashMsg("Preferences reset to default.")}
            className="px-4 py-2 rounded-2xl text-sm font-medium text-slate-200 border border-white/15 bg-white/5 transition-all duration-200 active:scale-95 hover:bg-white/10"
          >
            Reset Preferences
          </button>
          {cacheMsg && (
            <span className="self-center text-xs text-emerald-300 transition-opacity duration-300">
              {cacheMsg}
            </span>
          )}
        </div>
      </Card>

      {/* Section 8 — About IceSight */}
      <Card title="About IceSight">
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold">Version</p>
            <p className="text-sm text-slate-200 mt-1">v1.0.0 — MVP Build</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold">
              Project Description
            </p>
            <p className="text-sm text-slate-300 mt-1 leading-relaxed max-w-2xl">
              IceSight is an AI-powered Antarctic monitoring platform providing
              real-time iceberg tracking, drift forecasting, and navigational
              risk intelligence for research and commercial vessels operating
              in the Southern Ocean.
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-2">
              Tech Stack
            </p>
            <div className="flex flex-wrap gap-2">
              {["React", "Tailwind", "Leaflet", "Recharts", "FastAPI (Coming)", "AI Models (Coming)"].map((t) => (
                <span
                  key={t}
                  className="px-3 py-1 rounded-full text-xs font-medium text-slate-300 border border-white/10 bg-white/5"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-2">
              Roadmap
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold text-emerald-300 border border-emerald-400/30 bg-emerald-400/10">
                Frontend ✓
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold text-cyan-300 border border-cyan-400/30 bg-cyan-400/10">
                Backend Next
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold text-cyan-300 border border-cyan-400/30 bg-cyan-400/10">
                AI Integration Next
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold text-slate-400 border border-white/15 bg-white/5">
                Deployment Pending
              </span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default Settings;