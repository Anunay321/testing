import { formatINR } from "../data/billingEngine";

function fmtDateTime(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "2-digit" }) +
    " · " + d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

export default function Receipt({ bill }) {
  return (
    <div className="bg-white border border-line rounded-xl p-5">
      <div className="text-center mb-3">
        <p className="font-display text-lg text-plum">The Northgate Inn</p>
        <p className="text-xs text-ink/40 mt-1">
          Bill #{bill.id.slice(-6)} · {fmtDateTime(bill.date)} · Room {bill.roomNumber}
        </p>
      </div>

      <div className="border-t border-dashed border-line pt-3 space-y-1.5 text-sm">
        {bill.lines.map((l, i) => (
          <div key={i} className="flex justify-between gap-2">
            <span className="text-ink/80">
              {l.qty}× {l.name} <span className="text-ink/35">({l.taxRate}% GST)</span>
            </span>
            <span className="text-ink/80 shrink-0">{formatINR(l.price * l.qty)}</span>
          </div>
        ))}
      </div>

      <div className="border-t border-dashed border-line mt-3 pt-3 space-y-1 text-sm">
        <div className="flex justify-between text-ink/60">
          <span>Subtotal</span>
          <span>{formatINR(bill.subtotal)}</span>
        </div>
        <div className="flex justify-between text-ink/60">
          <span>CGST</span>
          <span>{formatINR(bill.cgst)}</span>
        </div>
        <div className="flex justify-between text-ink/60">
          <span>SGST</span>
          <span>{formatINR(bill.sgst)}</span>
        </div>
      </div>

      <div className="border-t border-line mt-3 pt-3 flex justify-between items-center">
        <span className="font-display text-plum">Total</span>
        <span className="font-display text-xl text-plum">{formatINR(bill.total)}</span>
      </div>

      <p className="text-xs text-ink/40 mt-3 pt-3 border-t border-dashed border-line">
        Paid via {bill.paymentMethod}
      </p>
    </div>
  );
}
