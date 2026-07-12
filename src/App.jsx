import { useState } from "react";
import { AppDataProvider, useAppData } from "./context/AppDataContext";
import GuestSurvey from "./components/GuestSurvey";
import RoomGrid from "./components/RoomGrid";
import CheckIn from "./components/CheckIn";
import CheckOut from "./components/CheckOut";
import Billing from "./components/Billing";
import RoomCharges from "./components/RoomCharges";
import Reports from "./components/Reports";
import Inventory from "./components/Inventory";
import FrontDesk from "./components/FrontDesk";
import Analytics from "./components/Analytics";
import AdminPanel from "./components/admin/AdminPanel";

const GROUPS = [
  {
    label: "Front Desk",
    tabs: [
      { id: "roomgrid", label: "Room Grid" },
      { id: "checkin", label: "Check-In" },
      { id: "checkout", label: "Check-Out" },
    ],
  },
  {
    label: "Billing",
    tabs: [
      { id: "billing", label: "Quick Bill" },
      { id: "roomcharges", label: "Room Charges" },
      { id: "reports", label: "Reports" },
    ],
  },
  {
    label: "Operations",
    tabs: [
      { id: "inventory", label: "Inventory" },
      { id: "feedback", label: "Guest Feedback" },
      { id: "analytics", label: "Analytics" },
    ],
  },
  {
    label: "",
    tabs: [
      { id: "survey", label: "Guest Survey (public)" },
      { id: "admin", label: "Admin" },
    ],
  },
];

function AppShell() {
  const [view, setView] = useState("roomgrid");
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
      <div className="border-b border-line bg-white sticky top-0 z-10 px-3 py-2.5">
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 max-w-4xl mx-auto">
          {GROUPS.map((group) => (
            <div key={group.label || "misc"} className="flex items-center gap-1">
              {group.label && (
                <span className="text-[10px] uppercase tracking-widest text-ink/30 mr-0.5 hidden sm:inline">
                  {group.label}
                </span>
              )}
              {group.tabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setView(t.id)}
                  className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
                    view === t.id ? "bg-plum text-cream" : "text-ink/50 hover:text-ink"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>

      {view === "survey" && <GuestSurvey />}
      {view === "roomgrid" && <RoomGrid />}
      {view === "checkin" && <CheckIn />}
      {view === "checkout" && <CheckOut />}
      {view === "billing" && <Billing />}
      {view === "roomcharges" && <RoomCharges />}
      {view === "reports" && <Reports />}
      {view === "inventory" && <Inventory />}
      {view === "feedback" && <FrontDesk />}
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
