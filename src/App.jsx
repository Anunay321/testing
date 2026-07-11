import { useState } from "react";
import { AppDataProvider, useAppData } from "./context/AppDataContext";
import GuestSurvey from "./components/GuestSurvey";
import FrontDesk from "./components/FrontDesk";
import Billing from "./components/Billing";
import Analytics from "./components/Analytics";
import AdminPanel from "./components/admin/AdminPanel";

const TABS = [
  { id: "survey", label: "Guest Survey" },
  { id: "desk", label: "Front Desk" },
  { id: "billing", label: "Billing" },
  { id: "analytics", label: "Analytics" },
  { id: "admin", label: "Admin" },
];

function AppShell() {
  const [view, setView] = useState("survey");
  const { loading } = useAppData();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-ink/40 text-sm">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="flex flex-wrap justify-center gap-1 border-b border-line bg-white py-3 px-3 sticky top-0 z-10">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setView(t.id)}
            className={`text-sm font-medium px-4 py-1.5 rounded-full transition-colors ${
              view === t.id ? "bg-plum text-cream" : "text-ink/50"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {view === "survey" && <GuestSurvey />}
      {view === "desk" && <FrontDesk />}
      {view === "billing" && <Billing />}
      {view === "analytics" && <Analytics />}
      {view === "admin" && <AdminPanel />}
    </div>
  );
}

export default function App() {
  return (
    <AppDataProvider>
      <AppShell />
    </AppDataProvider>
  );
}
