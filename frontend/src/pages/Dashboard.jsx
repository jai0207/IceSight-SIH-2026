import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import KpiCard from "../components/KpiCard.jsx";

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

/* --- Mission overview map mock data --- */
const SHIP = { lat: -74.9, lon: -170.1 };

const ICEBERGS = [
  { id: "IS-104", lat: -77.4, lon: -178.9, risk: "critical", color: "#f87171" },
  { id: "IS-102", lat: -75.9, lon: -173.5, risk: "medium", color: "#fbbf24" },
  { id: "IS-109", lat: -73.9, lon: -103.7, risk: "high", color: "#fb923c" },
];

const SAFE_ROUTE = [
  [-74.9, -170.1],
  [-73.8, -165.4],
  [-72.6, -158.2],
  [-70.9, -150.6],
  [-68.5, -140.3],
];

function icebergDotIcon(color, critical = false) {
  return L.divIcon({
    className: "",
    html: `<div style="
      width:12px;height:12px;border-radius:9999px;
      background:${color};
      border:2px solid rgba(255,255,255,0.85);
      box-shadow:0 0 ${critical ? "14px" : "8px"} ${color};
    "></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  });
}

function shipDotIcon() {
  return L.divIcon({
    className: "",
    html: `<div style="
      width:18px;height:18px;border-radius:9999px;
      background:rgba(34,211,238,0.15);
      border:2px solid #22d3ee;
      box-shadow:0 0 14px rgba(34,211,238,0.75);
      display:flex;align-items:center;justify-content:center;
    "><div style="width:6px;height:6px;background:#22d3ee;border-radius:2px;transform:rotate(45deg);"></div></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

function Dashboard() {
  const navigate = useNavigate();

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
        <div className="lg:col-span-2 relative overflow-hidden bg-slate-900/60 backdrop-blur-2xl border border-cyan-400/20 rounded-3xl min-h-[280px]">
          <MapContainer
            center={[-73, -140]}
            zoom={3}
            minZoom={2}
            maxZoom={6}
            zoomControl={false}
            scrollWheelZoom={false}
            dragging={false}
            doubleClickZoom={false}
            touchZoom={false}
            boxZoom={false}
            keyboard={false}
            attributionControl={false}
            style={{ height: "100%", width: "100%", minHeight: "280px", background: "#050a14" }}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              subdomains={["a", "b", "c", "d"]}
            />

            <Polyline
              positions={SAFE_ROUTE}
              pathOptions={{ color: "#22d3ee", weight: 2.5, opacity: 0.8 }}
            />

            {ICEBERGS.map((iceberg) => (
              <Marker
                key={iceberg.id}
                position={[iceberg.lat, iceberg.lon]}
                icon={icebergDotIcon(iceberg.color, iceberg.risk === "critical")}
              >
                <Popup>{iceberg.id}</Popup>
              </Marker>
            ))}

            <Marker position={[SHIP.lat, SHIP.lon]} icon={shipDotIcon()}>
              <Popup>RV Polar Star</Popup>
            </Marker>
          </MapContainer>

          {/* Open Mission Map button */}
          <button
            onClick={() => navigate("/map")}
            className="absolute top-4 right-4 z-[1000] px-3 py-1.5 rounded-full text-xs font-medium text-cyan-300 border border-cyan-400/30 bg-slate-900/80 backdrop-blur-xl transition-all duration-300 hover:border-cyan-400/60 hover:bg-cyan-400/10 hover:shadow-[0_0_16px_rgba(34,211,238,0.3)]"
          >
            Open Mission Map →
          </button>

          {/* Label */}
          <div className="absolute bottom-4 left-4 z-[1000] pointer-events-none">
            <span className="text-[10px] uppercase tracking-widest text-slate-400 bg-slate-900/70 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10">
              Mission Overview · Read-only
            </span>
          </div>
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