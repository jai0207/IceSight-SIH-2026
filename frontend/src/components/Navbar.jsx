import { useEffect, useState } from "react";

function Navbar() {
  const [utcTime, setUtcTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const formatted = now.toISOString().slice(11, 19) + " UTC";
      setUtcTime(formatted);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-30 w-full bg-slate-900/50 backdrop-blur-2xl border-b border-cyan-400/10">
      <div className="flex items-center justify-between px-4 md:px-8 py-4">
        <div className="flex items-baseline gap-3">
          <h1
            className="text-xl md:text-2xl font-bold text-white tracking-tight"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Ice<span className="text-cyan-400">Sight</span>
          </h1>
          <span className="hidden sm:inline text-xs uppercase tracking-widest text-slate-400 font-medium">
            Mission Control
          </span>
        </div>

        <div className="flex items-center gap-3 md:gap-5">
          <span className="hidden sm:inline text-sm font-mono text-slate-300 tabular-nums">
            {utcTime}
          </span>

          <span className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium text-emerald-300 border border-emerald-400/30 bg-emerald-400/10">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            System Online
          </span>
        </div>
      </div>
    </header>
  );
}

export default Navbar;