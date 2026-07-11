import { useState } from "react";
import GuestSurvey from "./components/GuestSurvey";
import FrontDesk from "./components/FrontDesk";
import Billing from "./components/Billing";
import Analytics from "./components/Analytics";
import { SAMPLE_FEEDBACK } from "./data/sampleFeedback";

const TABS = [
  { id: "survey", label: "Guest Survey" },
  { id: "desk", label: "Front Desk" },
  { id: "billing", label: "Billing" },
  { id: "analytics", label: "Analytics" },
];

export default function App() {
  const [view, setView] = useState("survey");
  const [feedback, setFeedback] = useState(SAMPLE_FEEDBACK);
  const [bills, setBills] = useState([]);

  function handleFeedbackSubmit(entry) {
    setFeedback((prev) => [entry, ...prev]);
  }

  function handleBillComplete(bill) {
    setBills((prev) => [bill, ...prev]);
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

      {view === "survey" && <GuestSurvey onSubmit={handleFeedbackSubmit} />}
      {view === "desk" && <FrontDesk feedback={feedback} />}
      {view === "billing" && <Billing onComplete={handleBillComplete} />}
      {view === "analytics" && <Analytics feedback={feedback} bills={bills} />}
    </div>
  );
}
