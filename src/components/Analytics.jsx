import { AlertTriangle } from "lucide-react";
import { useAppData } from "../context/AppDataContext";
import { formatINR } from "../data/billingEngine";
import { CATEGORIES as FEEDBACK_CATEGORIES } from "../data/sampleFeedback";

function BarRow({ label, value, max, formatValue, color = "bg-rose" }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="mb-3">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-ink/70">{label}</span>
        <span className="font-medium text-ink">{formatValue(value)}</span>
      </div>
      <div className="h-2 bg-cream-dim rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function overallFeedback(entry) {
  const vals = Object.values(entry.ratings);
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

export default function Analytics() {
  const { bills, feedback, inventory } = useAppData();

  const totalRevenue = bills.reduce((sum, b) => sum + b.total, 0);
  const totalTax = bills.reduce((sum, b) => sum + b.totalTax, 0);
  const avgBill = bills.length ? totalRevenue / bills.length : 0;

  const revenueByCategory = {};
  bills.forEach((b) =>
    b.lines.forEach((l) => {
      revenueByCategory[l.category || "Other"] = (revenueByCategory[l.category || "Other"] || 0) + l.price * l.qty;
    })
  );
  const maxCategoryRevenue = Math.max(1, ...Object.values(revenueByCategory));

  const revenueByPayment = {};
  bills.forEach((b) => {
    revenueByPayment[b.paymentMethod] = (revenueByPayment[b.paymentMethod] || 0) + b.total;
  });
  const maxPaymentRevenue = Math.max(1, ...Object.values(revenueByPayment));

  const avgRating = feedback.length
    ? feedback.reduce((sum, e) => sum + overallFeedback(e), 0) / feedback.length
    : 0;

  const categoryAverages = FEEDBACK_CATEGORIES.map((cat) => ({
    category: cat,
    average: feedback.length
      ? feedback.reduce((sum, e) => sum + e.ratings[cat], 0) / feedback.length
      : 0,
  }));

  const lowStock = inventory.filter((i) => Number(i.quantity) <= Number(i.reorder_level));

  return (
    <div className="max-w-2xl mx-auto px-5 py-10">
      <h1 className="font-display text-2xl text-plum">Analytics</h1>
      <p className="text-ink/55 mt-1 mb-6">Revenue, guest experience, and stock — at a glance</p>

      <div className="grid grid-cols-3 gap-3 mb-8">
        <div className="bg-white border border-line rounded-xl p-4">
          <p className="text-xs text-ink/50">Revenue</p>
          <p className="font-display text-xl text-plum mt-1">{formatINR(totalRevenue)}</p>
        </div>
        <div className="bg-white border border-line rounded-xl p-4">
          <p className="text-xs text-ink/50">GST collected</p>
          <p className="font-display text-xl text-plum mt-1">{formatINR(totalTax)}</p>
        </div>
        <div className="bg-white border border-line rounded-xl p-4">
          <p className="text-xs text-ink/50">Avg. bill</p>
          <p className="font-display text-xl text-plum mt-1">{formatINR(avgBill)}</p>
        </div>
      </div>

      <div className="bg-white border border-line rounded-xl p-5 mb-6">
        <p className="text-sm font-medium text-ink mb-4">Revenue by department</p>
        {Object.keys(revenueByCategory).length === 0 ? (
          <p className="text-sm text-ink/40">No bills yet — complete a bill to see the split.</p>
        ) : (
          Object.entries(revenueByCategory).map(([cat, val]) => (
            <BarRow key={cat} label={cat} value={val} max={maxCategoryRevenue} formatValue={formatINR} color="bg-rose" />
          ))
        )}
      </div>

      <div className="bg-white border border-line rounded-xl p-5 mb-6">
        <p className="text-sm font-medium text-ink mb-4">Revenue by payment method</p>
        {Object.keys(revenueByPayment).length === 0 ? (
          <p className="text-sm text-ink/40">No bills yet.</p>
        ) : (
          Object.entries(revenueByPayment).map(([method, val]) => (
            <BarRow key={method} label={method} value={val} max={maxPaymentRevenue} formatValue={formatINR} color="bg-amber" />
          ))
        )}
      </div>

      <div className="bg-white border border-line rounded-xl p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium text-ink">Guest feedback by category</p>
          <span className="font-display text-plum">{avgRating.toFixed(1)} / 5 overall</span>
        </div>
        {categoryAverages.map((c) => (
          <BarRow
            key={c.category}
            label={c.category}
            value={c.average}
            max={5}
            formatValue={(v) => `${v.toFixed(1)} / 5`}
            color="bg-sage"
          />
        ))}
      </div>

      <div className="bg-white border border-line rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle size={16} className="text-amber" />
          <p className="text-sm font-medium text-ink">Low stock ({lowStock.length})</p>
        </div>
        {lowStock.length === 0 ? (
          <p className="text-sm text-ink/40">Everything is above its reorder level.</p>
        ) : (
          <div className="space-y-2">
            {lowStock.map((i) => (
              <div key={i.id} className="flex justify-between text-sm">
                <span className="text-ink/70">{i.name} <span className="text-ink/35">({i.category})</span></span>
                <span className="text-amber font-medium">{i.quantity} {i.unit} left</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
