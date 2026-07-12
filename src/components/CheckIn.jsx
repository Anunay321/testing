import { useState } from "react";
import { UserPlus } from "lucide-react";
import { useAppData } from "../context/AppDataContext";
import { formatINR } from "../data/billingEngine";

const MEAL_PLANS = [
  { code: "EP", label: "EP — Room only" },
  { code: "CP", label: "CP — Breakfast included" },
  { code: "MAP", label: "MAP — Breakfast + one meal" },
  { code: "AP", label: "AP — All meals" },
];

export default function CheckIn() {
  const { rooms, companies, checkIn } = useAppData();
  const availableRooms = rooms.filter((r) => r.status === "Available");

  const [roomId, setRoomId] = useState("");
  const [guestName, setGuestName] = useState("");
  const [mealPlan, setMealPlan] = useState("EP");
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [companyId, setCompanyId] = useState("");
  const [securityDeposit, setSecurityDeposit] = useState("");
  const [done, setDone] = useState(false);

  async function handleCheckIn() {
    await checkIn({ roomId, guestName, mealPlan, adults: Number(adults), children: Number(children), companyId: companyId || null, securityDeposit: Number(securityDeposit) || 0 });
    setDone(true);
    setTimeout(() => {
      setDone(false);
      setRoomId("");
      setGuestName("");
      setMealPlan("EP");
      setAdults(1);
      setChildren(0);
      setCompanyId("");
      setSecurityDeposit("");
    }, 1600);
  }

  return (
    <div className="max-w-md mx-auto px-5 py-10">
      <div className="flex items-center gap-2 text-plum mb-1">
        <UserPlus size={20} />
        <h1 className="font-display text-2xl">Check-In</h1>
      </div>
      <p className="text-ink/55 mb-5">Open a folio for a guest's stay</p>

      {done ? (
        <div className="bg-sage-soft border border-sage rounded-xl p-6 text-center text-sage font-medium">
          Checked in — room folio is now active.
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-ink/60 uppercase tracking-wide">Room</label>
            <select
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="w-full mt-1.5 text-sm bg-white border border-line rounded-xl px-3 py-2.5 outline-none"
            >
              <option value="">Select an available room</option>
              {availableRooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.room_number} — {r.room_types?.name} ({formatINR(r.room_types?.price || 0)}/night)
                </option>
              ))}
            </select>
            {availableRooms.length === 0 && (
              <p className="text-xs text-rose mt-1">No available rooms right now.</p>
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-ink/60 uppercase tracking-wide">Guest name</label>
            <input
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              className="w-full mt-1.5 text-sm bg-white border border-line rounded-xl px-3 py-2.5 outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-ink/60 uppercase tracking-wide">Meal plan</label>
            <div className="grid grid-cols-2 gap-2 mt-1.5">
              {MEAL_PLANS.map((m) => (
                <button
                  key={m.code}
                  onClick={() => setMealPlan(m.code)}
                  className={`text-xs py-2.5 rounded-lg border transition-colors ${
                    mealPlan === m.code ? "bg-plum text-cream border-plum" : "border-line text-ink/60"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-ink/60 uppercase tracking-wide">Adults</label>
              <input
                type="number"
                min={1}
                value={adults}
                onChange={(e) => setAdults(e.target.value)}
                className="w-full mt-1.5 text-sm bg-white border border-line rounded-xl px-3 py-2.5 outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-ink/60 uppercase tracking-wide">Children</label>
              <input
                type="number"
                min={0}
                value={children}
                onChange={(e) => setChildren(e.target.value)}
                className="w-full mt-1.5 text-sm bg-white border border-line rounded-xl px-3 py-2.5 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-ink/60 uppercase tracking-wide">
              Corporate account (optional — for City Ledger billing)
            </label>
            <select
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              className="w-full mt-1.5 text-sm bg-white border border-line rounded-xl px-3 py-2.5 outline-none"
            >
              <option value="">Guest pays own way</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>{c.company_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-ink/60 uppercase tracking-wide">
              Security deposit (optional)
            </label>
            <input
              type="number"
              value={securityDeposit}
              onChange={(e) => setSecurityDeposit(e.target.value)}
              placeholder="₹0"
              className="w-full mt-1.5 text-sm bg-white border border-line rounded-xl px-3 py-2.5 outline-none"
            />
          </div>

          <button
            disabled={!roomId || !guestName}
            onClick={handleCheckIn}
            className="w-full bg-plum text-cream text-sm font-semibold rounded-xl py-3.5 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Check in
          </button>
        </div>
      )}
    </div>
  );
}
