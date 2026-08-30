import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import MapPage from "./pages/MapPage.jsx";
import Analytics from "./pages/Analytics.jsx";
import Alerts from "./pages/Alerts.jsx";
import MissionIntel from "./pages/MissionIntel.jsx";


function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/Analytics" element={<Analytics />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/mission-intelligence" element={<MissionIntel />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;