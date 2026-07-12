import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { useAppData } from "../context/AppDataContext";
import { formatINR } from "../data/billingEngine";

const SOURCES = ["Restaurant", "Banquet", "Offers"];

export default function RoomCharges() {
  const { activeFolios, menuItems, banquetHalls, offers, postCharge, folioBalance } = useAppData();
  const [folioId, setFolioId] = useState("");
  const [source, setSource] = useState("Restaurant");
  const [cart, setCart] = useState([]);
  const [balance, setBalance] = useState(null);
  const [refreshTick, setRefreshTick] = useState(0);
  const [showPosted, setShowPosted] = useState(false);

  const catalogFor = { Restaurant: menuItems, Banquet: banquetHalls, Offers: offers };
  const activeCatalog = catalogFor[source];
  const folio = activeFolios.find((f) => f.id === folioId);

  useEffect(() => {
    if (folioId) folioBalance(folioId).then(setBalance);
    else setBalance(null);
  }, [folioId, refreshTick]); // eslint-disable-line react-hooks/exhaustive-deps

  function addItem(item) {
    setShowPosted(false);
    setCart((prev) => {
      const existing = prev.find((l) => l.id === item.id);
      if (existing) return prev.map((l) => (l.id === item.id ? { ...l, qty: l.qty + 1 } : l));
      return [...prev, { id: item.id, name: item.name, sac: item.sac, price: Number(item.price), taxRate: Number(item.tax_rate), qty: 1, category: source }];
    });
  }

  const cartTotal = cart.reduce((s, l) => s + l.price * l.qty, 0);

  async function handlePost() {
    await postCharge(folioId, cart);
    setCart([]);
    setRefreshTick((t) => t + 1);
    setShowPosted(true);
  }

  return (
    <div className="max-w-2xl mx-auto px-5 py-10">
      <h1 className="font-display text-2xl text-plum">Room Charges</h1>
      <p className="text-ink/55 mt-1 mb-5">Post restaurant, banquet, or package charges to an in-house guest's folio</p>

      <select
        value={folioId}
        onChange={(e) => setFolioId(e.target.value)}
        className="w-full text-sm bg-white border border-line rounded-xl px-3.5 py-2.5 outline-none mb-4"
      >
        <option value="">Select an in-house guest</option>
        {activeFolios.map((f) => (
          <option key={f.id} value={f.id}>
            Room {f.room_number} — {f.guest_name}
          </option>
        ))}
      </select>

      {folio && (
        <>
          <div className="bg-white border border-line rounded-xl p-4 mb-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-ink">{folio.guest_name}</p>
              <p className="text-xs text-ink/50">Room {folio.room_number} · {folio.meal_plan}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-ink/50">Current balance</p>
              <p className="font-display text-lg text-plum">{balance === null ? "…" : formatINR(balance)}</p>
            </div>
          </div>

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

          <div className="space-y-2 mb-4">
            {activeCatalog.map((item) => (
              <button
                key={item.id}
                onClick={() => addItem(item)}
                className="w-full flex items-center justify-between bg-white border border-line rounded-xl px-4 py-3 text-left hover:border-rose transition-colors"
              >
                <span className="text-sm text-ink">{item.name}</span>
                <span className="text-sm font-medium text-plum">{formatINR(item.price)}</span>
              </button>
            ))}
          </div>

          {cart.length > 0 && (
            <div className="bg-white border border-line rounded-xl p-4">
              <p className="text-xs uppercase tracking-wide text-ink/40 mb-2">To post</p>
              {cart.map((l) => (
                <div key={l.id} className="flex justify-between text-sm py-1">
                  <span>{l.qty}× {l.name}</span>
                  <span>{formatINR(l.price * l.qty)}</span>
                </div>
              ))}
              <div className="flex justify-between font-display text-plum text-base pt-2 mt-2 border-t border-line">
                <span>Total</span>
                <span>{formatINR(cartTotal)}</span>
              </div>
              <button
                onClick={handlePost}
                className="w-full mt-3 bg-plum text-cream text-sm font-semibold rounded-xl py-2.5"
              >
                Post to folio
              </button>
            </div>
          )}

          {showPosted && cart.length === 0 && (
            <div className="flex items-center gap-2 text-sage text-sm mt-3">
              <CheckCircle2 size={16} /> Posted — balance updated above.
            </div>
          )}
        </>
      )}
    </div>
  );
}
