function TrendArrow({ trend }) {
  if (!trend) return null;
  const isUp = trend.startsWith("+") || trend.toLowerCase().includes("up");
  const isDown = trend.startsWith("-") || trend.toLowerCase().includes("down");
  const colorClass = isUp
    ? "text-emerald-400"
    : isDown
    ? "text-red-400"
    : "text-slate-400";
  const arrow = isUp ? "▲" : isDown ? "▼" : "●";

  return (
    <span className={`text-xs font-semibold ${colorClass} flex items-center gap-1`}>
      <span>{arrow}</span>
      <span>{trend}</span>
    </span>
  );
}

function KpiCard({ label, value, color = "#22d3ee", trend }) {
  return (
    <div
      className="bg-slate-900/60 backdrop-blur-2xl border border-cyan-400/20 rounded-3xl p-6 flex flex-col gap-3 shadow-[0_0_25px_rgba(0,0,0,0.35)] transition-all duration-300 hover:border-cyan-400/50"
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow =
          "0 0 35px rgba(34,211,238,0.35), 0 0 25px rgba(0,0,0,0.35)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "0 0 25px rgba(0,0,0,0.35)";
      }}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs md:text-sm uppercase tracking-widest text-slate-400 font-medium">
          {label}
        </span>
        <span
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}` }}
        />
      </div>

      <div className="flex items-end justify-between">
        <span
          className="text-3xl md:text-4xl font-bold"
          style={{ fontFamily: "'Space Grotesk', sans-serif", color }}
        >
          {value}
        </span>
        <TrendArrow trend={trend} />
      </div>
    </div>
  );
}

export default KpiCard;