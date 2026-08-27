function Badge({ children }) {
  return (
    <span className="px-4 py-1.5 rounded-full text-sm font-medium text-cyan-300 border border-cyan-400/30 bg-cyan-400/5 backdrop-blur-sm">
      {children}
    </span>
  );
}

function KpiCard({ label, value, valueColor, accent }) {
  return (
    <div className="bg-slate-900/60 backdrop-blur-2xl border border-cyan-400/20 rounded-3xl p-6 md:p-7 flex flex-col gap-3 shadow-[0_0_25px_rgba(0,0,0,0.35)] hover:border-cyan-400/50 hover:shadow-[0_0_35px_rgba(34,211,238,0.35)] transition-all duration-300">
      <div className="flex items-center justify-between">
        <span className="text-xs md:text-sm uppercase tracking-widest text-slate-400 font-medium">
          {label}
        </span>
        <span
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: accent, boxShadow: `0 0 10px ${accent}` }}
        />
      </div>
      <span
        className={`text-3xl md:text-4xl font-bold ${valueColor}`}
        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
      >
        {value}
      </span>
    </div>
  );
}

function App() {
  const kpis = [
    {
      label: "Sea Ice Coverage",
      value: "78.2%",
      valueColor: "text-cyan-300",
      accent: "#22d3ee",
    },
    {
      label: "Active Icebergs",
      value: "143",
      valueColor: "text-sky-200",
      accent: "#9fdcff",
    },
    {
      label: "Navigation Risk",
      value: "HIGH",
      valueColor: "text-red-400",
      accent: "#f87171",
    },
    {
      label: "Fuel Savings",
      value: "18.4%",
      valueColor: "text-emerald-400",
      accent: "#34d399",
    },
  ];

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center px-6 py-16 overflow-hidden relative bg-slate-950"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Background gradient */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#0a1220_0%,_#050a14_45%,_#03060d_100%)]" />

      {/* Background glow accents */}
      <div className="pointer-events-none absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-cyan-400/10 rounded-full blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 right-0 w-[400px] h-[400px] bg-sky-300/5 rounded-full blur-[100px]" />
      <div className="pointer-events-none absolute top-0 left-0 w-[350px] h-[350px] bg-teal-300/5 rounded-full blur-[100px]" />

      <div className="relative w-full max-w-5xl flex flex-col items-center">
        {/* Hero card */}
        <div className="bg-slate-900/60 backdrop-blur-2xl border border-cyan-400/20 rounded-3xl w-full max-w-3xl p-10 md:p-16 flex flex-col items-center text-center shadow-[0_0_60px_rgba(34,211,238,0.15)]">
          <span className="mb-6 px-4 py-1.5 rounded-full text-xs md:text-sm tracking-widest uppercase font-medium text-sky-200 border border-white/10 bg-white/5">
            Smart India Hackathon 2026
          </span>

          <h1
            className="font-bold text-5xl md:text-7xl text-white tracking-tight drop-shadow-[0_0_25px_rgba(34,211,238,0.55)]"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Ice<span className="text-cyan-400">Sight</span>
          </h1>

          <p className="mt-6 max-w-xl text-base md:text-lg text-slate-400 leading-relaxed">
            An AI-powered Antarctic monitoring platform for real-time iceberg
            tracking, drift forecasting, and navigational risk intelligence.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Badge>React</Badge>
            <Badge>Tailwind CSS</Badge>
            <Badge>Antarctic AI Platform</Badge>
          </div>
        </div>

        {/* KPI grid */}
        <div className="mt-10 w-full grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
          {kpis.map((kpi) => (
            <KpiCard key={kpi.label} {...kpi} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;