import { NavLink } from "react-router-dom";

const navItems = [
  { label: "Dashboard", icon: "❄️", path: "/dashboard" },
  { label: "Antarctica Map", icon: "🌍", path: "/map" },
  { label: "Analytics", icon: "📊", path: "/Analytics" },
  { label: "Alerts", icon: "🚨", path: "/alerts" },
  { label: "Settings", icon: "⚙️", path: "/settings" },
];

function Sidebar() {
  return (
    <aside className="sticky top-0 h-screen w-16 md:w-56 shrink-0 bg-slate-900/50 backdrop-blur-2xl border-r border-cyan-400/10 flex flex-col">
      <div className="hidden md:flex items-center gap-2 px-6 py-6">
        <span className="text-2xl">🧊</span>
        <span
          className="text-lg font-bold text-white"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          IceSight
        </span>
      </div>
      <div className="md:hidden flex items-center justify-center py-6 text-2xl">
        🧊
      </div>

      <nav className="flex-1 flex flex-col gap-1 px-2 md:px-3">
        {navItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 md:gap-3 justify-center md:justify-start px-3 py-3 rounded-2xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-cyan-400/10 text-cyan-300 border border-cyan-400/30 shadow-[0_0_20px_rgba(34,211,238,0.15)]"
                  : "text-slate-400 border border-transparent hover:text-slate-200 hover:bg-white/5"
              }`
            }
          >
            <span className="text-lg">{item.icon}</span>
            <span className="hidden md:inline">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="hidden md:block px-6 py-6 text-xs text-slate-500">
        SIH 2026 · Tech Titans
      </div>
    </aside>
  );
}

export default Sidebar;