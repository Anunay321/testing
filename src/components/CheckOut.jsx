import { useEffect, useState } from "react";
import { LogOut } from "lucide-react";
import { useAppData } from "../context/AppDataContext";
import { formatINR } from "../data/billingEngine";

const PAY_METHODS = ["Cash", "UPI", "Card"];

export default function CheckOut() {
  const { activeFolios, checkOut, folioBalance } = useAppData();
  const [folioId, setFolioId] = useState("");
  const [balance, setBalance] = useState(null);
  const [payMethod, setPayMethod] = useState("Cash");
  const [settlement, setSettlement] = useState("pay");
  const [done, setDone] = useState(false);

  const folio = activeFolios.find((f) => f.id === folioId);

  useEffect(() => {
    if (folioId) folioBalance(folioId).then(setBalance);
    else setBalance(null);
  }, [folioId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleCheckOut() {
    await checkOut(folioId, { settlement, paymentMode: settlement === "pay" ? payMethod : "Corporate Billing" });
    setDone(true);
    setTimeout(() => {
      setDone(false);
      setFolioId("");
      setBalance(null);
    }, 1800);
  }

  return (
    <div className="max-w-md mx-auto px-5 py-10">
      <div className="flex items-center gap-2 text-plum mb-1">
        <LogOut size={20} />
        <h1 className="font-display text-2xl">Check-Out</h1>
      </div>
      <p className="text-ink/55 mb-5">Settle a folio and close out the stay</p>

      {done ? (
        <div className="bg-sage-soft border border-sage rounded-xl p-6 text-center text-sage font-medium">
          Checked out — folio settled, room marked Dirty for housekeeping.
        </div>
      ) : (
        <>
          <select
            value={folioId}
            onChange={(e) => setFolioId(e.target.value)}
            className="w-full text-sm bg-white border border-line rounded-xl px-3.5 py-2.5 outline-none mb-4"
          >
            <option value="">Select an in-house guest</option>
            {activeFolios.map((f) => (
              <option key={f.id} value={f.id}>Room {f.room_number} — {f.guest_name}</option>
            ))}
          </select>

          {folio && (
            <div className="space-y-4">
              <div className="bg-white border border-line rounded-xl p-4">
                <p className="text-sm font-medium text-ink">{folio.guest_name}</p>
                <p className="text-xs text-ink/50 mb-2">
                  Room {folio.room_number} · Since {new Date(folio.check_in_date).toLocaleDateString("en-IN")}
                </p>
                <p className="text-xs text-ink/50">Outstanding balance</p>
                <p className="font-display text-2xl text-plum">{balance === null ? "…" : formatINR(balance)}</p>
              </div>

              <div>
                <label className="text-xs font-medium text-ink/60 uppercase tracking-wide">Settle by</label>
                <div className="grid grid-cols-2 gap-2 mt-1.5">
                  <button
                    onClick={() => setSettlement("pay")}
                    className={`text-sm py-2.5 rounded-lg border transition-colors ${
                      settlement === "pay" ? "bg-plum text-cream border-plum" : "border-line text-ink/60"
                    }`}
                  >
                    Direct payment
                  </button>
                  <button
                    disabled={!folio.company_id}
                    onClick={() => setSettlement("city_ledger")}
                    className={`text-sm py-2.5 rounded-lg border transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                      settlement === "city_ledger" ? "bg-plum text-cream border-plum" : "border-line text-ink/60"
                    }`}
                  >
                    Bill to City Ledger
                  </button>
                </div>
                {!folio.company_id && (
                  <p className="text-xs text-ink/40 mt-1">No corporate account attached to this folio.</p>
                )}
              </div>

              {settlement === "pay" && (
                <div className="grid grid-cols-3 gap-2">
                  {PAY_METHODS.map((m) => (
                    <button
                      key={m}
                      onClick={() => setPayMethod(m)}
                      className={`text-sm py-2.5 rounded-lg border transition-colors ${
                        payMethod === m ? "bg-plum text-cream border-plum" : "border-line text-ink/60"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              )}

              {settlement === "city_ledger" && (
                <p className="text-xs text-ink/50 bg-cream-dim rounded-lg p-3">
                  {formatINR(balance || 0)} will be transferred to {folio.companies?.company_name}'s City Ledger
                  as accounts receivable, and the guest's folio will settle to zero.
                </p>
              )}

              <button
                onClick={handleCheckOut}
                className="w-full bg-plum text-cream text-sm font-semibold rounded-xl py-3.5"
              >
                Complete check-out
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
