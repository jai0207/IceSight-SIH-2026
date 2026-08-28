import KpiCard from "../components/kpicard.jsx";

const kpis = [
  { label: "Sea Ice Coverage", value: "78.2%", color: "#22d3ee", trend: "+2.1%" },
  { label: "Active Icebergs", value: "143", color: "#9fdcff", trend: "+6" },
  { label: "Navigation Risk", value: "HIGH", color: "#f87171", trend: "up" },
  { label: "Estimated Fuel Savings", value: "18.4%", color: "#34d399", trend: "+1.3%" },
];

const statusStrip = [
  { label: "Wind Speed", value: "42 km/h" },
  { label: "Visibility", value: "6.2 km" },
  { label: "Ocean Temp", value: "-1.8°C" },
  { label: "Ice Drift", value: "0.9 km/h" },
];

const alerts = [
  {
    text: "Large iceberg detected near Ross Sea.",
    severity: "High",
    color: "text-red-400 border-red-400/30 bg-red-400/10",
  },
  {
    text: "Sea-ice concentration increased 12%.",
    severity: "Medium",
    color: "text-amber-300 border-amber-400/30 bg-amber-400/10",
  },
  {
    text: "Route optimization available.",
    severity: "Info",
    color: "text-cyan-300 border-cyan-400/30 bg-cyan-400/10",
  },
];

function Dashboard() {
  return (
    <div className="flex flex-col gap-6 md:gap-8">
      {/* Hero mission status */}
      <div className="bg-slate-900/60 backdrop-blur-2xl border border-cyan-400/20 rounded-3xl p-6 md:p-10 shadow-[0_0_40px_rgba(34,211,238,0.1)]">
        <span className="text-xs uppercase tracking-widest text-slate-400 font-medium">
          Mission Status
        </span>
        <h2
          className="mt-2 text-2xl md:text-4xl font-bold text-white"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          RV Polar Star
        </h2>

        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          <div>
            <p className="text-xs uppercase tracking-widest text-slate-500">Region</p>
            <p className="mt-1 text-lg font-semibold text-sky-200">Ross Sea</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-slate-500">Risk Level</p>
            <p className="mt-1 text-lg font-semibold text-red-400">HIGH</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-slate-500">Forecast Window</p>
            <p className="mt-1 text-lg font-semibold text-cyan-300">72 Hours</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-slate-500">Status</p>
            <p className="mt-1 text-lg font-semibold text-emerald-400">Active</p>
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 md:gap-6">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.label} {...kpi} />
        ))}
      </div>

      {/* Mission status strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
        {statusStrip.map((item) => (
          <div
            key={item.label}
            className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl px-4 py-4 text-center"
          >
            <p className="text-xs uppercase tracking-widest text-slate-500">
              {item.label}
            </p>
            <p className="mt-1 text-lg font-semibold text-slate-100">
              {item.value}
            </p>
          </div>
        ))}
      </div>

      {/* Map preview + Alerts preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 relative overflow-hidden bg-slate-900/60 backdrop-blur-2xl border border-cyan-400/20 rounded-3xl min-h-[280px] flex items-center justify-center">
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                "linear-gradient(rgba(34,211,238,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.15) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />
          <p className="relative z-10 text-slate-300 text-sm md:text-base font-medium px-6 text-center">
            Interactive Antarctica Map — Coming Day 4
          </p>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-2xl border border-cyan-400/20 rounded-3xl p-6 flex flex-col gap-4">
          <h3
            className="text-sm uppercase tracking-widest text-slate-400 font-medium"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Recent Alerts
          </h3>
          <div className="flex flex-col gap-3">
            {alerts.map((alert, i) => (
              <div
                key={i}
                className={`rounded-2xl border px-4 py-3 text-sm ${alert.color}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] uppercase tracking-widest font-semibold">
                    {alert.severity}
                  </span>
                </div>
                <p className="text-slate-200 text-sm leading-snug">{alert.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;