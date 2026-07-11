import { useState } from "react";
import { Plus, Minus, Trash2, Receipt as ReceiptIcon } from "lucide-react";
import { CHARGE_ITEMS, PAYMENT_METHODS } from "../data/billingCatalog";
import { computeBillTotals, formatINR } from "../data/billingEngine";
import Receipt from "./Receipt";

const CATEGORIES = ["Room", "Restaurant", "Services"];

export default function Billing({ onComplete }) {
  const [roomNumber, setRoomNumber] = useState("");
  const [cart, setCart] = useState([]);
  const [step, setStep] = useState("bill"); // bill | payment | receipt
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [completedBill, setCompletedBill] = useState(null);

  const totals = computeBillTotals(cart);

  function addItem(item) {
    setCart((prev) => {
      const existing = prev.find((l) => l.item.id === item.id);
      if (existing) return prev.map((l) => (l.item.id === item.id ? { ...l, qty: l.qty + 1 } : l));
      return [...prev, { item, qty: 1 }];
    });
  }

  function updateQty(id, qty) {
    if (qty <= 0) {
      setCart((prev) => prev.filter((l) => l.item.id !== id));
      return;
    }
    setCart((prev) => prev.map((l) => (l.item.id === id ? { ...l, qty } : l)));
  }

  function completeBill() {
    const bill = {
      id: `B${Date.now()}`,
      date: new Date().toISOString(),
      roomNumber: roomNumber || "—",
      paymentMethod,
      lines: cart.map((l) => ({ name: l.item.name, price: l.item.price, qty: l.qty, taxRate: l.item.taxRate, category: l.item.category })),
      ...totals,
    };
    onComplete(bill);
    setCompletedBill(bill);
    setStep("receipt");
  }

  function startNew() {
    setCart([]);
    setRoomNumber("");
    setPaymentMethod("Cash");
    setStep("bill");
    setCompletedBill(null);
  }

  if (step === "receipt" && completedBill) {
    return (
      <div className="max-w-md mx-auto px-5 py-10">
        <h1 className="font-display text-2xl text-plum mb-4">Bill complete</h1>
        <Receipt bill={completedBill} />
        <button
          onClick={startNew}
          className="w-full mt-4 bg-plum text-cream text-sm font-semibold rounded-xl py-3.5"
        >
          Start new bill
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-5 py-10">
      <h1 className="font-display text-2xl text-plum">Billing</h1>
      <p className="text-ink/55 mt-1 mb-5">Add charges and settle a guest's bill</p>

      <input
        value={roomNumber}
        onChange={(e) => setRoomNumber(e.target.value)}
        placeholder="Room number"
        className="w-full text-sm bg-white border border-line rounded-xl px-3.5 py-2.5 outline-none mb-5"
      />

      {step === "bill" && (
        <>
          {CATEGORIES.map((cat) => (
            <div key={cat} className="mb-4">
              <p className="text-xs uppercase tracking-wide text-ink/40 mb-2">{cat}</p>
              <div className="grid grid-cols-1 gap-2">
                {CHARGE_ITEMS.filter((i) => i.category === cat).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => addItem(item)}
                    className="flex items-center justify-between bg-white border border-line rounded-xl px-4 py-3 text-left hover:border-rose transition-colors"
                  >
                    <span className="text-sm text-ink">{item.name}</span>
                    <span className="text-sm font-medium text-plum">{formatINR(item.price)}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}

          {cart.length > 0 && (
            <div className="mt-6 bg-white border border-line rounded-xl p-4">
              <p className="text-xs uppercase tracking-wide text-ink/40 mb-3">Current bill</p>
              <div className="space-y-2.5">
                {cart.map((l) => (
                  <div key={l.item.id} className="flex items-center justify-between">
                    <span className="text-sm text-ink truncate">{l.item.name}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button onClick={() => updateQty(l.item.id, l.qty - 1)} className="w-6 h-6 rounded border border-line flex items-center justify-center text-ink/60">
                        <Minus size={12} />
                      </button>
                      <span className="text-sm font-mono w-4 text-center">{l.qty}</span>
                      <button onClick={() => updateQty(l.item.id, l.qty + 1)} className="w-6 h-6 rounded border border-line flex items-center justify-center text-ink/60">
                        <Plus size={12} />
                      </button>
                      <button onClick={() => updateQty(l.item.id, 0)} className="w-6 h-6 rounded flex items-center justify-center text-rose/70">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-line mt-3 pt-3 space-y-1 text-sm">
                <div className="flex justify-between text-ink/60">
                  <span>Subtotal</span>
                  <span>{formatINR(totals.subtotal)}</span>
                </div>
                <div className="flex justify-between text-ink/60">
                  <span>CGST + SGST</span>
                  <span>{formatINR(totals.totalTax)}</span>
                </div>
                <div className="flex justify-between font-display text-plum text-base pt-1 border-t border-line mt-1">
                  <span>Total</span>
                  <span>{formatINR(totals.total)}</span>
                </div>
              </div>

              <button
                onClick={() => setStep("payment")}
                className="w-full mt-4 bg-plum text-cream text-sm font-semibold rounded-xl py-3"
              >
                Charge {formatINR(totals.total)}
              </button>
            </div>
          )}
        </>
      )}

      {step === "payment" && (
        <div className="bg-white border border-line rounded-xl p-5">
          <div className="flex items-center gap-2 text-plum mb-3">
            <ReceiptIcon size={16} />
            <p className="text-xs uppercase tracking-wide font-medium">Take payment</p>
          </div>
          <p className="text-sm text-ink/60 mb-4">
            Total due: <span className="font-display text-plum text-lg">{formatINR(totals.total)}</span>
          </p>
          <div className="grid grid-cols-3 gap-2 mb-5">
            {PAYMENT_METHODS.map((m) => (
              <button
                key={m}
                onClick={() => setPaymentMethod(m)}
                className={`text-sm py-2.5 rounded-lg border transition-colors ${
                  paymentMethod === m ? "bg-plum text-cream border-plum" : "border-line text-ink/60"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={() => setStep("bill")} className="flex-1 text-sm font-medium py-3 rounded-xl border border-line text-ink/60">
              Back
            </button>
            <button onClick={completeBill} className="flex-[2] bg-plum text-cream text-sm font-semibold rounded-xl py-3">
              Complete bill
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
