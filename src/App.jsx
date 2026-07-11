import { useState } from "react";
import GuestSurvey from "./components/GuestSurvey";
import FrontDesk from "./components/FrontDesk";
import { SAMPLE_FEEDBACK } from "./data/sampleFeedback";

export default function App() {
  const [view, setView] = useState("survey");
  const [feedback, setFeedback] = useState(SAMPLE_FEEDBACK);

  function handleSubmit(entry) {
    setFeedback((prev) => [entry, ...prev]);
  }

  return (
    <div className="min-h-screen">
      <div className="flex justify-center gap-1 border-b border-line bg-white py-3 sticky top-0 z-10">
        <button
          onClick={() => setView("survey")}
          className={`text-sm font-medium px-4 py-1.5 rounded-full transition-colors ${
            view === "survey" ? "bg-plum text-cream" : "text-ink/50"
          }`}
        >
          Guest Survey
        </button>
        <button
          onClick={() => setView("desk")}
          className={`text-sm font-medium px-4 py-1.5 rounded-full transition-colors ${
            view === "desk" ? "bg-plum text-cream" : "text-ink/50"
          }`}
        >
          Front Desk
        </button>
      </div>

      {view === "survey" ? (
        <GuestSurvey onSubmit={handleSubmit} />
      ) : (
        <FrontDesk feedback={feedback} />
      )}
    </div>
  );
}
