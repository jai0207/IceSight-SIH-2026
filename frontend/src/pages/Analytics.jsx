const charts = [
  "Sea Ice Concentration",
  "Iceberg Drift Speed",
  "Weather Forecast Trends",
];

function Analytics() {
  return (
    <div className="flex flex-col gap-6">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {charts.map((title) => (
          <div
            key={title}
            className="bg-slate-900/60 backdrop-blur-2xl border border-cyan-400/20 rounded-3xl p-6 min-h-[260px] flex flex-col"
          >
            <h3
              className="text-sm font-semibold text-slate-200 mb-4"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              {title}
            </h3>
            <div className="flex-1 rounded-2xl border border-dashed border-cyan-400/20 bg-slate-950/40 flex items-center justify-center">
              <span className="text-slate-500 text-sm">Chart placeholder</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Analytics;