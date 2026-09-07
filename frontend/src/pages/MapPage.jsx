import { useEffect, useMemo, useState, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  Rectangle,
  ZoomControl,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/* ---------------------------------------------------------
   Backend config
--------------------------------------------------------- */

const API_BASE = "http://127.0.0.1:8000";

// Fixed demo location for iceberg map requests
const ICEBERG_LAT = -75.250973;
const ICEBERG_LON = -0.071389;
const ICEBERGS_ENDPOINT = `${API_BASE}/icebergs?lat=${ICEBERG_LAT}&lon=${ICEBERG_LON}`;

/* ---------------------------------------------------------
   Static mock data (ship + routes + overlays stay local —
   no backend endpoint covers these)
--------------------------------------------------------- */

const SHIP = {
  name: "RV Polar Star",
  lat: -74.9,
  lon: -170.1,
  heading: "047° NE",
  speed: "14.2 knots",
  destination: "McMurdo Station",
  eta: "18 hrs 40 min",
  fuel: "+18.4% predicted savings",
  status: "SAFE ROUTE ACTIVE",
};

const ROUTES = {
  safe: [
    [-74.9, -170.1],
    [-73.8, -165.4],
    [-72.6, -158.2],
    [-70.9, -150.6],
    [-68.5, -140.3],
  ],
  dangerous: [
    [-74.9, -170.1],
    [-76.5, -175.8],
    [-77.6, 178.4],
    [-76.9, 165.2],
  ],
};

const EVENT_ICONS = {
  detection: "🧊",
  model: "🛰️",
  fracture: "❗",
  route: "🧭",
  risk: "⚠️",
  satellite: "📡",
};

const EVENTS = [
  { id: 1, type: "detection", severity: "warning", text: "Iceberg IS-204 entered Ross Sea shipping corridor.", minsAgo: 3, utc: "07:15 UTC" },
  { id: 2, type: "model", severity: "info", text: "Drift model updated with latest ocean current data.", minsAgo: 14, utc: "07:04 UTC" },
  { id: 3, type: "fracture", severity: "critical", text: "Satellite Sentinel-1 captured new fracture near IS-104.", minsAgo: 27, utc: "06:51 UTC" },
  { id: 4, type: "route", severity: "info", text: "Route optimization recalculated for RV Polar Star.", minsAgo: 40, utc: "06:38 UTC" },
  { id: 5, type: "risk", severity: "critical", text: "Iceberg IS-116 risk score escalated to Critical.", minsAgo: 55, utc: "06:23 UTC" },
  { id: 6, type: "satellite", severity: "info", text: "New satellite pass completed over Weddell Sea.", minsAgo: 68, utc: "06:10 UTC" },
  { id: 7, type: "detection", severity: "warning", text: "Iceberg IS-107 drift speed increased 0.3 km/h.", minsAgo: 82, utc: "05:56 UTC" },
  { id: 8, type: "model", severity: "info", text: "AI collision-probability model retrained on latest telemetry.", minsAgo: 96, utc: "05:42 UTC" },
];

const SEVERITY_COLOR = {
  critical: { text: "text-red-300", border: "border-red-400/30", bg: "bg-red-400/10", dot: "#f87171" },
  warning: { text: "text-amber-300", border: "border-amber-400/30", bg: "bg-amber-400/10", dot: "#fbbf24" },
  info: { text: "text-cyan-300", border: "border-cyan-400/30", bg: "bg-cyan-400/10", dot: "#22d3ee" },
};

function relativeTime(minsAgo) {
  if (minsAgo < 1) return "just now";
  if (minsAgo < 60) return `${minsAgo}m ago`;
  const h = Math.floor(minsAgo / 60);
  const m = minsAgo % 60;
  return `${h}h ${m}m ago`;
}

function riskColor(risk) {
  if (risk > 75) return "#f87171";
  if (risk > 50) return "#fb923c";
  if (risk > 25) return "#fbbf24";
  return "#34d399";
}

function riskLabel(risk) {
  if (risk > 75) return "Critical";
  if (risk > 50) return "High";
  if (risk > 25) return "Medium";
  return "Safe";
}

/* Backend risk is a free-text label ("HIGH", "Moderate", etc.), but the
   existing marker/popup styling (riskColor/riskLabel/icebergIcon) is built
   around a 0–100 numeric score. This maps the label to a representative
   score so the existing color/label logic keeps working unchanged. */
function backendRiskToScore(risk) {
  const normalized = (risk || "").toString().toLowerCase();
  if (normalized === "critical") return 90;
  if (normalized === "high") return 65;
  if (normalized === "moderate" || normalized === "medium") return 40;
  if (normalized === "low" || normalized === "safe") return 15;
  return 15;
}

function icebergIcon(risk) {
  const color = riskColor(risk);
  return L.divIcon({
    className: "",
    html: `
      <div class="icesight-marker" style="--m-color:${color}">
        <div class="icesight-marker-core"></div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

function shipIcon() {
  return L.divIcon({
    className: "",
    html: `<div class="icesight-ship"><div class="icesight-ship-core"></div></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

function windArrowIcon(angle) {
  return L.divIcon({
    className: "",
    html: `<div class="icesight-wind" style="transform: rotate(${angle}deg)">➤</div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

/* Wind arrow field — lightweight mock grid */
const WIND_POINTS = [
  { lat: -75, lon: -160, angle: 40 },
  { lat: -72, lon: -140, angle: 55 },
  { lat: -69, lon: -110, angle: 70 },
  { lat: -70, lon: -70, angle: 20 },
  { lat: -66, lon: -30, angle: 350 },
  { lat: -63, lon: 10, angle: 300 },
  { lat: -65, lon: 60, angle: 280 },
  { lat: -68, lon: 100, angle: 250 },
  { lat: -74, lon: -20, angle: 15 },
  { lat: -77, lon: 140, angle: 200 },
];

/* Sea ice patches (mock, drawn as rectangles) */
const SEA_ICE_ZONES = [
  [[-78, -180], [-70, -140]],
  [[-76, -60], [-68, -20]],
  [[-70, 40], [-60, 100]],
  [[-79, 150], [-72, 179]],
];

/* Ocean temperature bands (mock gradient rectangles, cold->warm as lat increases) */
const TEMP_ZONES = [
  { bounds: [[-90, -180], [-75, 180]], color: "#1e3a8a" },
  { bounds: [[-75, -180], [-65, 180]], color: "#3730a3" },
  { bounds: [[-65, -180], [-55, 180]], color: "#6d28d9" },
];

function FitOnMount() {
  const map = useMap();
  useEffect(() => {
    map.attributionControl.setPrefix(false);
  }, [map]);
  return null;
}

/* Normalizes the /icebergs response into an array of iceberg objects,
   regardless of whether the backend returns a wrapper { count, icebergs },
   a plain array, or a single object. */
function normalizeIcebergResponse(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.icebergs)) return data.icebergs;
  if (data && typeof data === "object" && ("latitude" in data || "id" in data)) {
    return [data];
  }
  return [];
}

/* ---------------------------------------------------------
   Component
--------------------------------------------------------- */

function MapPage() {
  const [utcTime, setUtcTime] = useState("");
  const [mounted, setMounted] = useState(false);
  const [overlay, setOverlay] = useState("icebergs");

  const [icebergs, setIcebergs] = useState([]);
  const [loadingIcebergs, setLoadingIcebergs] = useState(true);
  const [icebergError, setIcebergError] = useState(null);

  useEffect(() => {
    const tick = () => setUtcTime(new Date().toISOString().slice(11, 19) + " UTC");
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Fetch live iceberg data once on mount
  useEffect(() => {
    setLoadingIcebergs(true);
    setIcebergError(null);
    fetch(ICEBERGS_ENDPOINT)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json) => setIcebergs(normalizeIcebergResponse(json)))
      .catch((err) => {
        setIcebergError(err.message || "Unable to reach satellite feed.");
        console.error("icebergs fetch failed:", err);
      })
      .finally(() => setLoadingIcebergs(false));
  }, []);

  const stats = useMemo(() => {
    const highRisk = icebergs.filter((i) => {
      const score = backendRiskToScore(i.risk);
      return score > 50;
    }).length;
    return {
      active: icebergs.length,
      highRisk,
      routeStatus: "Safe Route Active",
      timeSaved: "4.2 hrs",
    };
  }, [icebergs]);

  const fade = (delay = "") =>
    `transition-all duration-700 motion-reduce:transition-none ease-out ${delay} ${
      mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
    }`;

  const overlayBtns = [
    { key: "icebergs", label: "Icebergs" },
    { key: "seaice", label: "Sea Ice" },
    { key: "wind", label: "Wind" },
    { key: "temp", label: "Ocean Temp" },
  ];

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      {/* Leaflet + marker theming (scoped to this page's rendered DOM) */}
      <style>{`
        .icesight-marker {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 9999px;
          cursor: pointer;
          position: relative;
        }

        .icesight-marker::before {
          content: "";
          width: 14px;
          height: 14px;
          border-radius: 9999px;
          background: var(--m-color);
          border: 2px solid rgba(255,255,255,0.85);
          box-shadow:
            0 0 10px var(--m-color),
            0 0 20px var(--m-color),
            0 0 30px rgba(255,255,255,0.15);
          pointer-events: none;
          transition: transform 0.2s ease;
        }

        .icesight-marker:hover::before {
          transform: scale(1.35);
        }

        @media (prefers-reduced-motion: no-preference) {
          .icesight-marker::before {
            animation: icesight-pop 2.4s ease-in-out infinite;
          }
        }
        @keyframes icesight-pop {
          0% { box-shadow: 0 0 6px var(--m-color); opacity: 0.85; }
          50% { box-shadow: 0 0 18px var(--m-color); opacity: 1; }
          100% { box-shadow: 0 0 6px var(--m-color); opacity: 0.85; }
        }
        .icesight-ship {
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 9999px;
          background: rgba(34,211,238,0.15);
          border: 2px solid #22d3ee;
          box-shadow: 0 0 18px rgba(34,211,238,0.75);
        }
        .icesight-ship-core {
          width: 8px;
          height: 8px;
          background: #22d3ee;
          border-radius: 2px;
          transform: rotate(45deg);
        }
        .icesight-wind {
          color: rgba(94,234,212,0.85);
          font-size: 14px;
          text-shadow: 0 0 6px rgba(94,234,212,0.8);
        }
        @media (prefers-reduced-motion: no-preference) {
          .icesight-wind {
            animation: icesight-drift 2.8s ease-in-out infinite;
          }
        }
        @keyframes icesight-drift {
          0%, 100% { opacity: 0.55; }
          50% { opacity: 1; }
        }
        .icesight-popup .leaflet-popup-content-wrapper {
          background: rgba(10, 18, 32, 0.97);
          color: #eaf4ff;
          border: 1px solid rgba(34,211,238,0.3);
          border-radius: 16px;
          box-shadow: 0 0 30px rgba(34,211,238,0.18);
        }
        .icesight-popup .leaflet-popup-content {
          margin: 12px 14px;
        }
        .icesight-popup .leaflet-popup-tip {
          background: rgba(10, 18, 32, 0.97);
          border: 1px solid rgba(34,211,238,0.3);
        }
        .icesight-popup a.leaflet-popup-close-button {
          color: #93a4bd;
        }
        @media (prefers-reduced-motion: no-preference) {
          .leaflet-popup {
            animation: icesight-popup-in 0.22s ease-out;
          }
        }
        @keyframes icesight-popup-in {
          from { opacity: 0; transform: translateY(4px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .leaflet-control-zoom a {
          background: rgba(10, 18, 32, 0.85) !important;
          color: #22d3ee !important;
          border-color: rgba(34,211,238,0.25) !important;
        }
        .leaflet-control-attribution {
          background: rgba(10, 18, 32, 0.6) !important;
          color: #5b6b85 !important;
          font-size: 10px !important;
        }
        .leaflet-control-attribution a {
          color: #93a4bd !important;
        }
        @media (prefers-reduced-motion: no-preference) {
          .icesight-refresh-spin {
            animation: icesight-spin 0.9s linear infinite;
          }
        }
        @keyframes icesight-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Header */}
      <div className={`flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 ${fade()}`}>
        <div>
          <span className="text-xs uppercase tracking-widest text-slate-400 font-medium">
            Navigation
          </span>
          <h2
            className="mt-1 text-3xl md:text-4xl font-bold text-white"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Antarctica Mission Map
          </h2>
          <p className="mt-2 text-sm text-slate-400 max-w-xl">
            Real-time iceberg tracking and navigation intelligence across the
            Southern Ocean.
          </p>
        </div>

        <div className="flex flex-col items-start sm:items-end gap-2">
          <span className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium text-emerald-300 border border-emerald-400/30 bg-emerald-400/10">
            <span className="relative flex h-2 w-2">
              <span className="motion-safe:animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            LIVE SATELLITE FEED
          </span>
          <span className="text-xs font-mono text-slate-400 tabular-nums">
            {utcTime}
          </span>
        </div>
      </div>

      {/* Main grid: map + side panel */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        {/* Map */}
        <div className={`lg:col-span-7 ${fade("delay-100")}`}>
          <div className="relative rounded-3xl overflow-hidden border border-cyan-400/20 shadow-[0_0_35px_rgba(0,0,0,0.4)] h-[480px] md:h-[640px]">
            {/* Loading state */}
            {loadingIcebergs && (
              <div className="absolute inset-0 z-[1200] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
                <div className="flex flex-col items-center gap-4 bg-slate-900/70 border border-cyan-400/30 rounded-3xl px-8 py-8 shadow-[0_0_35px_rgba(34,211,238,0.25)]">
                  <span className="relative flex h-10 w-10">
                    <span className="motion-safe:animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-40" />
                    <span className="relative inline-flex rounded-full h-10 w-10 bg-cyan-400/20 border border-cyan-400/60 items-center justify-center">
                      <span className="text-lg">🛰️</span>
                    </span>
                  </span>
                  <p className="text-sm text-cyan-200 font-medium tracking-wide text-center">
                    Connecting to IceSight Satellite Feed...
                  </p>
                </div>
              </div>
            )}

            {/* Error state */}
            {!loadingIcebergs && icebergError && (
              <div className="absolute inset-0 z-[1200] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm px-6">
                <div className="flex flex-col items-center gap-3 bg-slate-900/80 border border-red-400/30 rounded-3xl px-8 py-8 shadow-[0_0_30px_rgba(248,113,113,0.2)] text-center max-w-sm">
                  <span className="text-2xl">📡</span>
                  <p className="text-sm text-red-300 font-semibold">
                    Satellite feed unavailable.
                  </p>
                  <p className="text-xs text-slate-400">{icebergError}</p>
                </div>
              </div>
            )}

            {/* Overlay toggle control */}
            <div className="absolute top-4 right-4 z-[1000] bg-slate-900/85 backdrop-blur-xl border border-cyan-400/20 rounded-2xl p-1.5 flex gap-1 shadow-[0_0_20px_rgba(0,0,0,0.4)] transition-all duration-300 hover:border-cyan-400/50">
              {overlayBtns.map((btn) => (
                <button
                  key={btn.key}
                  onClick={() => setOverlay(btn.key)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-medium transition-all duration-300 ${
                    overlay === btn.key
                      ? "bg-cyan-400/20 text-cyan-300 border border-cyan-400/40 shadow-[0_0_12px_rgba(34,211,238,0.25)]"
                      : "text-slate-400 border border-transparent hover:text-slate-200 hover:bg-white/5"
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>

            <MapContainer
              center={[-75, 0]}
              zoom={3}
              minZoom={2}
              maxZoom={6}
              maxBounds={[
                [-90, -180],
                [-50, 180],
              ]}
              maxBoundsViscosity={1.0}
              worldCopyJump={false}
              className="h-full w-full rounded-3xl"
            >
              <TileLayer
                url="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"
                attribution="© Stadia Maps © OpenMapTiles © OpenStreetMap contributors"
              />

              <Polyline
                positions={ROUTES.safe}
                pathOptions={{ color: "#22d3ee", weight: 3, opacity: 0.85 }}
                className="motion-safe:animate-pulse"
              />
              <Polyline
                positions={ROUTES.dangerous}
                pathOptions={{
                  color: "#f87171",
                  weight: 3,
                  opacity: 0.8,
                  dashArray: "8 8",
                }}
              />

              {/* Sea ice overlay */}
              {overlay === "seaice" &&
                SEA_ICE_ZONES.map((bounds, i) => (
                  <Rectangle
                    key={i}
                    bounds={bounds}
                    pathOptions={{
                      color: "#5eead4",
                      weight: 1,
                      fillColor: "#5eead4",
                      fillOpacity: 0.18,
                    }}
                  />
                ))}

              {/* Ocean temperature overlay */}
              {overlay === "temp" &&
                TEMP_ZONES.map((zone, i) => (
                  <Rectangle
                    key={i}
                    bounds={zone.bounds}
                    pathOptions={{
                      color: zone.color,
                      weight: 0,
                      fillColor: zone.color,
                      fillOpacity: 0.28,
                    }}
                  />
                ))}

              {/* Wind overlay */}
              {overlay === "wind" &&
                WIND_POINTS.map((p, i) => (
                  <Marker
                    key={i}
                    position={[p.lat, p.lon]}
                    icon={windArrowIcon(p.angle)}
                    interactive={false}
                  />
                ))}

              {/* Iceberg markers — from GET /icebergs */}
              {overlay === "icebergs" &&
                !loadingIcebergs &&
                !icebergError &&
                icebergs.map((iceberg, idx) => {
                  const score = backendRiskToScore(iceberg.risk);
                  const lat = iceberg.latitude;
                  const lon = iceberg.longitude;
                  const id = iceberg.id || iceberg.name || `Iceberg-${idx}`;
                  if (lat === undefined || lon === undefined) return null;
                  return (
                    <Marker
                      key={id}
                      position={[lat, lon]}
                      icon={icebergIcon(score)}
                    >
                      <Popup className="icesight-popup" autoPan={true}>
                        <div
                          className="min-w-[220px] font-sans rounded-xl p-1"
                          style={{
                            borderLeft: `3px solid ${riskColor(score)}`,
                            paddingLeft: "10px",
                          }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <p
                              className="text-sm font-bold text-cyan-300"
                              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                            >
                              {id}
                            </p>
                            <span
                              className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                              style={{
                                color: riskColor(score),
                                backgroundColor: `${riskColor(score)}22`,
                                border: `1px solid ${riskColor(score)}55`,
                                boxShadow: `0 0 8px ${riskColor(score)}55`,
                              }}
                            >
                              {iceberg.risk ?? riskLabel(score)}
                            </span>
                          </div>
                          <div className="flex flex-col gap-1 text-xs text-slate-300">
                            <span>Size: {iceberg.size ?? "—"}</span>
                            <span>
                              Drift Speed:{" "}
                              {iceberg.drift_speed !== undefined ? `${iceberg.drift_speed} km/h` : "—"}
                            </span>
                            <span>
                              Distance from Lane:{" "}
                              {iceberg.distance_km !== undefined ? `${iceberg.distance_km} km` : "—"}
                            </span>
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}

              {/* Ship marker (always visible) */}
              <Marker position={[SHIP.lat, SHIP.lon]} icon={shipIcon()}>
                <Popup className="icesight-popup" autoPan={true}>
                  <div className="min-w-[220px] font-sans">
                    <div className="flex items-center justify-between mb-2">
                      <p
                        className="text-sm font-bold text-cyan-300"
                        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                      >
                        🚢 {SHIP.name}
                      </p>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold text-emerald-300 bg-emerald-400/10 border border-emerald-400/30">
                        {SHIP.status}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1 text-xs text-slate-300">
                      <span>
                        Coordinates: {SHIP.lat.toFixed(1)}, {SHIP.lon.toFixed(1)}
                      </span>
                      <span>Heading: {SHIP.heading}</span>
                      <span>Speed: {SHIP.speed}</span>
                      <span>Destination: {SHIP.destination}</span>
                      <span>Estimated Arrival: {SHIP.eta}</span>
                      <span>Fuel Efficiency: {SHIP.fuel}</span>
                    </div>
                  </div>
                </Popup>
              </Marker>
            </MapContainer>

            {/* Floating legend */}
            <div className="absolute top-4 left-4 z-[1000] bg-slate-900/85 backdrop-blur-xl border border-cyan-400/20 rounded-2xl px-4 py-3 shadow-[0_0_20px_rgba(0,0,0,0.4)] transition-all duration-300 hover:border-cyan-400/50 hover:-translate-y-0.5 max-w-[180px]">
              <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold mb-2">
                Mission Legend
              </p>
              <div className="flex flex-col gap-1.5 text-xs text-slate-300">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
                  Safe Iceberg
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_6px_#fbbf24]" />
                  Medium Risk
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-400 shadow-[0_0_6px_#fb923c]" />
                  High Risk
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400 shadow-[0_0_6px_#f87171]" />
                  Critical
                </span>
                <span className="flex items-center gap-2 pt-1 border-t border-white/10 mt-1">
                  <span className="w-2.5 h-2.5 rounded-sm bg-cyan-400 rotate-45 shadow-[0_0_6px_#22d3ee]" />
                  RV Polar Star
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-4 h-0.5 bg-cyan-400" />
                  Safe Route
                </span>
                <span className="flex items-center gap-2">
                  <span
                    className="w-4 h-0.5"
                    style={{
                      backgroundImage:
                        "repeating-linear-gradient(90deg, #f87171 0 4px, transparent 4px 7px)",
                    }}
                  />
                  Dangerous Route
                </span>
                <span className="pt-1 border-t border-white/10 mt-1 text-[10px] text-slate-500">
                  Overlays: Sea Ice (cyan wash), Wind (arrows), Ocean Temp (heat bands)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Mission side panel */}
        <div className={`lg:col-span-3 flex flex-col gap-4 ${fade("delay-200")}`}>
          <div className="bg-slate-900/60 backdrop-blur-2xl border border-cyan-400/20 rounded-3xl p-5 shadow-[0_0_25px_rgba(0,0,0,0.35)] transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400/50 hover:shadow-[0_0_30px_rgba(34,211,238,0.25)]">
            <p className="text-xs uppercase tracking-widest text-slate-400 font-medium">
              Active Icebergs
            </p>
            <p
              className="mt-2 text-3xl font-bold text-cyan-300"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              {loadingIcebergs ? "—" : stats.active}
            </p>
          </div>

          <div className="bg-slate-900/60 backdrop-blur-2xl border border-cyan-400/20 rounded-3xl p-5 shadow-[0_0_25px_rgba(0,0,0,0.35)] transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400/50 hover:shadow-[0_0_30px_rgba(34,211,238,0.25)]">
            <p className="text-xs uppercase tracking-widest text-slate-400 font-medium">
              High Risk Zones
            </p>
            <p
              className="mt-2 text-3xl font-bold text-red-400"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              {loadingIcebergs ? "—" : stats.highRisk}
            </p>
          </div>

          <div className="bg-slate-900/60 backdrop-blur-2xl border border-cyan-400/20 rounded-3xl p-5 shadow-[0_0_25px_rgba(0,0,0,0.35)] transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400/50 hover:shadow-[0_0_30px_rgba(34,211,238,0.25)]">
            <p className="text-xs uppercase tracking-widest text-slate-400 font-medium">
              Recommended Route Status
            </p>
            <p className="mt-2 text-lg font-semibold text-emerald-400">
              {stats.routeStatus}
            </p>
          </div>

          <div className="bg-slate-900/60 backdrop-blur-2xl border border-cyan-400/20 rounded-3xl p-5 shadow-[0_0_25px_rgba(0,0,0,0.35)] transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400/50 hover:shadow-[0_0_30px_rgba(34,211,238,0.25)]">
            <p className="text-xs uppercase tracking-widest text-slate-400 font-medium">
              Estimated Time Saved
            </p>
            <p
              className="mt-2 text-3xl font-bold"
              style={{ fontFamily: "'Space Grotesk', sans-serif", color: "#9fdcff" }}
            >
              {stats.timeSaved}
            </p>
          </div>
        </div>
      </div>

      {/* Event feed */}
      <div
        className={`bg-slate-900/60 backdrop-blur-2xl border border-cyan-400/20 rounded-3xl p-6 shadow-[0_0_25px_rgba(0,0,0,0.35)] transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400/50 hover:shadow-[0_0_30px_rgba(34,211,238,0.25)] ${fade(
          "delay-300"
        )}`}
      >
        <h3
          className="text-sm font-semibold text-slate-100 mb-4"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          Recent Satellite Events
        </h3>
        <div className="flex flex-col gap-3 max-h-72 overflow-y-auto pr-1">
          {EVENTS.map((event, i) => {
            const sev = SEVERITY_COLOR[event.severity];
            return (
              <div
                key={event.id}
                className={`flex items-start gap-3 rounded-2xl border ${sev.border} bg-slate-950/40 px-4 py-3 transition-all duration-300 hover:border-cyan-400/40 hover:bg-slate-950/60`}
              >
                <span className="text-base leading-none mt-0.5">
                  {EVENT_ICONS[event.type] || "📡"}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm text-slate-200">{event.text}</p>
                    {i === 0 && (
                      <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold text-cyan-300 bg-cyan-400/15 border border-cyan-400/30">
                        NEW
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[10px] font-semibold uppercase tracking-wide ${sev.text}`}>
                      {event.severity}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      {relativeTime(event.minsAgo)} · {event.utc}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default MapPage;