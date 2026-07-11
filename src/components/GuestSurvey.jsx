import { useState } from "react";
import { Flower2 } from "lucide-react";
import StarRating from "./StarRating";
import { CATEGORIES } from "../data/sampleFeedback";

export default function GuestSurvey({ onSubmit }) {
  const [ratings, setRatings] = useState(Object.fromEntries(CATEGORIES.map((c) => [c, 0])));
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const allRated = CATEGORIES.every((c) => ratings[c] > 0);

  function handleSubmit() {
    onSubmit({
      id: `f${Date.now()}`,
      date: new Date().toISOString(),
      ratings,
      comment: comment.trim() || "No written comment provided.",
    });
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="max-w-md mx-auto text-center py-16 px-6">
        <Flower2 className="mx-auto text-rose" size={36} />
        <p className="font-display text-2xl text-plum mt-4">Thank you</p>
        <p className="text-ink/60 mt-2 leading-relaxed">
          Your feedback helps us take better care of every guest who stays with us.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-5 py-10">
      <div className="text-center mb-8">
        <Flower2 className="mx-auto text-rose" size={28} />
        <h1 className="font-display text-2xl text-plum mt-2">The Northgate Inn</h1>
        <p className="text-ink/55 mt-1">How was your stay with us?</p>
      </div>

      <div className="space-y-6">
        {CATEGORIES.map((cat) => (
          <div key={cat} className="bg-white border border-line rounded-xl p-4">
            <p className="text-sm font-medium text-ink mb-2">{cat}</p>
            <StarRating value={ratings[cat]} onChange={(v) => setRatings((p) => ({ ...p, [cat]: v }))} />
          </div>
        ))}

        <div>
          <label className="text-sm font-medium text-ink">Anything you'd like to add?</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            placeholder="Optional comment..."
            className="w-full mt-2 text-sm bg-white border border-line rounded-xl px-3 py-2.5 outline-none resize-none"
          />
        </div>

        <button
          disabled={!allRated}
          onClick={handleSubmit}
          className="w-full bg-plum text-cream text-sm font-semibold rounded-xl py-3.5 disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
        >
          Submit feedback
        </button>
        {!allRated && (
          <p className="text-xs text-ink/40 text-center -mt-3">
            Please rate all five to submit.
          </p>
        )}
      </div>
    </div>
  );
}
