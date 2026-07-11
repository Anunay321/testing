import { useState } from "react";
import { Plus, Minus, Trash2, FileText } from "lucide-react";
import { useAppData } from "../context/AppDataContext";
import { formatINR } from "../data/billingEngine";
import { PAYMENT_METHODS } from "../data/hotelConfig";
import Invoice from "./Invoice";

const SOURCES = ["Room", "Restaurant", "Banquet", "Offers"];

export default function Billing() {
  const { roomTypes, menuItems, banquetHalls, offers, completeBill } = useAppData();

  const [source, setSource] = useState("Room");
  const [roomNumber, setRoomNumber] = useState("");
  const [guestName, setGuestName] = useState("");
  const [cart, setCart] = useState([]); // [{ id, name, sac, price, taxRate, qty }]
  const [step, setStep] = useState("bill"); // bill | payment | invoice
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [completedBill, setCompletedBill] = useState(null);

  const catalogFor = { Room: roomTypes, Restaurant: menuItems, Banquet: banquetHalls, Offers: offers };
  const activeCatalog = catalogFor[source];

  const subtotal = cart.reduce((s, l) => s + l.price * l.qty, 0);
  const tax = cart.reduce((s, l) => s + l.price * l.qty * (l.taxRate / 100), 0);
  const total = subtotal + tax;

  function addItem(item) {
    setCart((prev) => {
      const existing = prev.find((l) => l.id === item.id);
      if (existing) return prev.map((l) => (l.id === item.id ? { ...l, qty: l.qty + 1 } : l));
      return [...prev, { id: item.id, name: item.name, sac: item.sac, price: Number(item.price), taxRate: Number(item.tax_rate), qty: 1, category: source }];
    });
  }

  function updateQty(id, qty) {
    if (qty <= 0) {
      setCart((prev) => prev.filter((l) => l.id !== id));
      return;
    }
    setCart((prev) => prev.map((l) => (l.id === id ? { ...l, qty } : l)));
  }

  function handleComplete() {
    const bill = completeBill({ roomNumber, guestName, paymentMethod, lines: cart });
    setCompletedBill(bill);
    setStep("invoice");
  }

  function startNew() {
    setCart([]);
    setRoomNumber("");
    setGuestName("");
    setPaymentMethod("Cash");
    setStep("bill");
    setCompletedBill(null);
  }

  if (step === "invoice" && completedBill) {
    return (
      <div className="max-w-2xl mx-auto px-5 py-10">
        <div className="flex items-center gap-2 text-plum mb-4">
          <FileText size={18} />
          <h1 className="font-display text-2xl">Invoice generated</h1>
        </div>
        <Invoice bill={completedBill} />
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
    <div className="max-w-2xl mx-auto px-5 py-10">
      <h1 className="font-display text-2xl text-plum">Billing</h1>
      <p className="text-ink/55 mt-1 mb-5">Room, restaurant, banquet, and offer charges — one invoice</p>

      <div className="grid grid-cols-2 gap-2 mb-5">
        <input
          value={guestName}
          onChange={(e) => setGuestName(e.target.value)}
          placeholder="Guest name"
          className="text-sm bg-white border border-line rounded-xl px-3.5 py-2.5 outline-none"
        />
        <input
          value={roomNumber}
          onChange={(e) => setRoomNumber(e.target.value)}
          placeholder="Room number"
          className="text-sm bg-white border border-line rounded-xl px-3.5 py-2.5 outline-none"
        />
      </div>

      {step === "bill" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {SOURCES.map((s) => (
                <button
                  key={s}
                  onClick={() => setSource(s)}
                  className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                    source === s ? "bg-plum text-cream border-plum" : "border-line text-ink/60"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="space-y-2">
              {activeCatalog.map((item) => (
                <button
                  key={item.id}
                  onClick={() => addItem(item)}
                  className="w-full flex items-center justify-between bg-white border border-line rounded-xl px-4 py-3 text-left hover:border-rose transition-colors"
                >
                  <div>
                    <p className="text-sm text-ink">{item.name}</p>
                    {item.description && <p className="text-xs text-ink/40 mt-0.5">{item.description}</p>}
                  </div>
                  <span className="text-sm font-medium text-plum shrink-0 ml-2">{formatINR(item.price)}</span>
                </button>
              ))}
              {activeCatalog.length === 0 && (
                <p className="text-sm text-ink/40 py-6 text-center">
                  Nothing set up here yet — add items in the Admin panel.
                </p>
              )}
            </div>
          </div>

          <div className="bg-white border border-line rounded-xl p-4 h-fit lg:sticky lg:top-20">
            <p className="text-xs uppercase tracking-wide text-ink/40 mb-3">Current bill</p>
            {cart.length === 0 ? (
              <p className="text-sm text-ink/40">Tap an item on the left to add it.</p>
            ) : (
              <>
                <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                  {cart.map((l) => (
                    <div key={l.id} className="flex items-center justify-between gap-2">
                      <span className="text-sm text-ink truncate">{l.name}</span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button onClick={() => updateQty(l.id, l.qty - 1)} className="w-6 h-6 rounded border border-line flex items-center justify-center text-ink/60">
                          <Minus size={12} />
                        </button>
                        <span className="text-sm font-mono w-4 text-center">{l.qty}</span>
                        <button onClick={() => updateQty(l.id, l.qty + 1)} className="w-6 h-6 rounded border border-line flex items-center justify-center text-ink/60">
                          <Plus size={12} />
                        </button>
                        <button onClick={() => updateQty(l.id, 0)} className="w-6 h-6 rounded flex items-center justify-center text-rose/70">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-line mt-3 pt-3 space-y-1 text-sm">
                  <div className="flex justify-between text-ink/60">
                    <span>Subtotal</span>
                    <span>{formatINR(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-ink/60">
                    <span>CGST + SGST</span>
                    <span>{formatINR(tax)}</span>
                  </div>
                  <div className="flex justify-between font-display text-plum text-base pt-1 border-t border-line mt-1">
                    <span>Total</span>
                    <span>{formatINR(total)}</span>
                  </div>
                </div>

                <button
                  onClick={() => setStep("payment")}
                  className="w-full mt-4 bg-plum text-cream text-sm font-semibold rounded-xl py-3"
                >
                  Charge {formatINR(total)}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {step === "payment" && (
        <div className="max-w-md bg-white border border-line rounded-xl p-5">
          <p className="text-xs uppercase tracking-wide font-medium text-plum mb-3">Take payment</p>
          <p className="text-sm text-ink/60 mb-4">
            Total due: <span className="font-display text-plum text-lg">{formatINR(total)}</span>
          </p>
          <div className="grid grid-cols-2 gap-2 mb-5">
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
            <button onClick={handleComplete} className="flex-[2] bg-plum text-cream text-sm font-semibold rounded-xl py-3">
              Generate invoice
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
