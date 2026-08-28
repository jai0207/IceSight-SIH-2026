const alerts = [
  {
    title: "Large iceberg detected near Ross Sea.",
    severity: "Critical",
    time: "2026-08-28 06:12 UTC",
    color: "text-red-300 border-red-400/30 bg-red-400/10",
    dot: "#f87171",
  },
  {
    title: "Sea-ice concentration increased 12% over 24h.",
    severity: "Warning",
    time: "2026-08-28 04:47 UTC",
    color: "text-amber-300 border-amber-400/30 bg-amber-400/10",
    dot: "#fbbf24",
  },
  {
    title: "Route optimization available for RV Polar Star.",
    severity: "Info",
    time: "2026-08-28 03:02 UTC",
    color: "text-cyan-300 border-cyan-400/30 bg-cyan-400/10",
    dot: "#22d3ee",
  },
  {
    title: "Iceberg drift speed exceeded forecast threshold.",
    severity: "Warning",
    time: "2026-08-27 22:15 UTC",
    color: "text-amber-300 border-amber-400/30 bg-amber-400/10",
    dot: "#fbbf24",
  },
  {
    title: "New satellite pass completed, imagery updated.",
    severity: "Info",
    time: "2026-08-27 19:40 UTC",
    color: "text-cyan-300 border-cyan-400/30 bg-cyan-400/10",
    dot: "#22d3ee",
  },
];

function Alerts() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <span className="text-xs uppercase tracking-widest text-slate-400 font-medium">
          Monitoring
        </span>
        <h2
          className="mt-1 text-3xl md:text-4xl font-bold text-white"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          Alerts
        </h2>
      </div>

      <div className="flex flex-col gap-4">
        {alerts.map((alert, i) => (
          <div
            key={i}
            className="bg-slate-900/60 backdrop-blur-2xl border border-cyan-400/20 rounded-3xl p-5 md:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
          >
            <div className="flex items-start gap-3">
              <span
                className="mt-1.5 w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: alert.dot, boxShadow: `0 0 10px ${alert.dot}` }}
              />
              <div>
                <p className="text-slate-100 font-medium">{alert.title}</p>
                <p className="text-xs text-slate-500 mt-1 font-mono">{alert.time}</p>
              </div>
            </div>

            <span
              className={`self-start sm:self-center shrink-0 px-3 py-1 rounded-full text-xs font-semibold border ${alert.color}`}
            >
              {alert.severity}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Alerts;