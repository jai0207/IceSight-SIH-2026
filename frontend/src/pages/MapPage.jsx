function MapPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <span className="text-xs uppercase tracking-widest text-slate-400 font-medium">
          Navigation
        </span>
        <h2
          className="mt-1 text-3xl md:text-4xl font-bold text-white"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          Antarctica Map
        </h2>
      </div>

      <div className="relative overflow-hidden bg-slate-900/60 backdrop-blur-2xl border border-cyan-400/20 rounded-3xl min-h-[420px] flex items-center justify-center">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "linear-gradient(rgba(34,211,238,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.15) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        <p className="relative z-10 text-slate-300 text-base md:text-lg font-medium px-6 text-center">
          React Leaflet integration starts on Day 4.
        </p>
      </div>
    </div>
  );
}

export default MapPage;