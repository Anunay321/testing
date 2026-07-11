import { AlertCircle } from "lucide-react";
import { useAppData } from "../context/AppDataContext";
import { CATEGORIES } from "../data/sampleFeedback";

function average(entries, cat) {
  if (!entries.length) return 0;
  return entries.reduce((sum, e) => sum + e.ratings[cat], 0) / entries.length;
}

function overall(entry) {
  const vals = Object.values(entry.ratings);
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

function fmtDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) +
    " · " + d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

export default function FrontDesk() {
  const { feedback } = useAppData();
  const overallAvg = feedback.length
    ? (feedback.reduce((sum, e) => sum + overall(e), 0) / feedback.length).toFixed(1)
    : "–";

  const needsAttention = feedback.filter((e) => overall(e) <= 2.5);

  return (
    <div className="max-w-2xl mx-auto px-5 py-10">
      <h1 className="font-display text-2xl text-plum">Front Desk</h1>
      <p className="text-ink/55 mt-1">Recent guest feedback, at a glance</p>

      <div className="grid grid-cols-2 gap-3 mt-6">
        <div className="bg-white border border-line rounded-xl p-4">
          <p className="text-xs text-ink/50">Average rating</p>
          <p className="font-display text-3xl text-plum mt-1">{overallAvg} / 5</p>
        </div>
        <div className="bg-white border border-line rounded-xl p-4">
          <p className="text-xs text-ink/50">Needs attention</p>
          <p className="font-display text-3xl text-plum mt-1">{needsAttention.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
        {CATEGORIES.map((cat) => (
          <div key={cat} className="bg-cream-dim rounded-lg px-3 py-2 flex justify-between text-sm">
            <span className="text-ink/60">{cat}</span>
            <span className="font-medium text-ink">{average(feedback, cat).toFixed(1)}</span>
          </div>
        ))}
      </div>

      <p className="text-xs uppercase tracking-wide text-ink/40 mt-8 mb-2">Recent feedback</p>
      <div className="space-y-3">
        {feedback.map((e) => {
          const isLow = overall(e) <= 2.5;
          return (
            <div
              key={e.id}
              className={`bg-white border rounded-xl p-4 ${isLow ? "border-rose/50" : "border-line"}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-ink/40">{fmtDate(e.created_at)}</span>
                <span className="font-display text-plum">{overall(e).toFixed(1)} / 5</span>
              </div>
              <p className="text-sm text-ink mt-2 leading-snug">{e.comment}</p>
              {isLow && (
                <div className="flex items-center gap-1.5 text-xs text-rose mt-2">
                  <AlertCircle size={13} />
                  Consider following up with this guest
                </div>
              )}
            </div>
          );
        })}
        {feedback.length === 0 && (
          <p className="text-sm text-ink/45 text-center py-10">No feedback submitted yet.</p>
        )}
      </div>
    </div>
  );
}
