import { useState } from "react";
import { AlertTriangle, ArrowDownCircle, ArrowUpCircle, Settings2 } from "lucide-react";
import { useAppData } from "../context/AppDataContext";

const MOVEMENT_TYPES = [
  { code: "IN", label: "Stock In", icon: ArrowUpCircle, refTypes: ["Purchase", "Opening Balance", "Transfer In"] },
  { code: "OUT", label: "Stock Out", icon: ArrowDownCircle, refTypes: ["Consumption", "Wastage", "Transfer Out"] },
  { code: "ADJUSTMENT", label: "Adjustment", icon: Settings2, refTypes: ["Manual Adjustment", "Stock Count Correction"] },
];

export default function Inventory() {
  const { inventoryBalances, recordStockMovement } = useAppData();
  const [itemId, setItemId] = useState("");
  const [movementType, setMovementType] = useState("IN");
  const [quantity, setQuantity] = useState("");
  const [referenceType, setReferenceType] = useState("Purchase");
  const [reason, setReason] = useState("");
  const [done, setDone] = useState(false);

  const lowStock = inventoryBalances.filter((i) => Number(i.current_stock) <= Number(i.reorder_level));

  async function handleSubmit() {
    if (!itemId || !quantity) return;
    await recordStockMovement({ itemId, movementType, quantity: Number(quantity), reason, referenceType });
    setQuantity("");
    setReason("");
    setDone(true);
    setTimeout(() => setDone(false), 1500);
  }

  return (
    <div className="max-w-3xl mx-auto px-5 py-10">
      <h1 className="font-display text-2xl text-plum">Inventory Ledger</h1>
      <p className="text-ink/55 mt-1 mb-5">Stock is never overwritten — every change is a logged movement</p>

      {lowStock.length > 0 && (
        <div className="bg-amber/10 border border-amber rounded-xl p-4 mb-5">
          <div className="flex items-center gap-2 text-amber mb-2">
            <AlertTriangle size={16} />
            <p className="text-sm font-medium">{lowStock.length} item{lowStock.length === 1 ? "" : "s"} at or below reorder level</p>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink/60">
            {lowStock.map((i) => (
              <span key={i.item_id}>{i.name}: {i.current_stock} {i.unit}</span>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white border border-line rounded-xl p-5 mb-6">
        <p className="text-sm font-medium text-ink mb-3">Record a stock movement</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <select value={itemId} onChange={(e) => setItemId(e.target.value)} className="text-sm border border-line rounded-lg px-3 py-2 outline-none">
            <option value="">Select item</option>
            {inventoryBalances.map((i) => (
              <option key={i.item_id} value={i.item_id}>{i.name} ({i.current_stock} {i.unit})</option>
            ))}
          </select>

          <div className="flex gap-1.5">
            {MOVEMENT_TYPES.map((m) => (
              <button
                key={m.code}
                onClick={() => { setMovementType(m.code); setReferenceType(m.refTypes[0]); }}
                className={`flex-1 flex items-center justify-center gap-1 text-xs py-2 rounded-lg border transition-colors ${
                  movementType === m.code ? "bg-plum text-cream border-plum" : "border-line text-ink/60"
                }`}
              >
                <m.icon size={13} /> {m.label}
              </button>
            ))}
          </div>

          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="Quantity"
            className="text-sm border border-line rounded-lg px-3 py-2 outline-none"
          />

          <select value={referenceType} onChange={(e) => setReferenceType(e.target.value)} className="text-sm border border-line rounded-lg px-3 py-2 outline-none">
            {MOVEMENT_TYPES.find((m) => m.code === movementType)?.refTypes.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>

          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Note (optional)"
            className="text-sm border border-line rounded-lg px-3 py-2 outline-none sm:col-span-2"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={!itemId || !quantity}
          className="w-full mt-3 bg-plum text-cream text-sm font-semibold rounded-lg py-2.5 disabled:opacity-30"
        >
          {done ? "Recorded ✓" : "Record movement"}
        </button>
      </div>

      <div className="bg-white border border-line rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line bg-cream-dim text-left">
              <th className="px-4 py-2.5 text-xs uppercase tracking-wide text-ink/50">Item</th>
              <th className="px-4 py-2.5 text-xs uppercase tracking-wide text-ink/50">Category</th>
              <th className="px-4 py-2.5 text-xs uppercase tracking-wide text-ink/50 text-right">Current Stock</th>
              <th className="px-4 py-2.5 text-xs uppercase tracking-wide text-ink/50 text-right">Reorder At</th>
            </tr>
          </thead>
          <tbody>
            {inventoryBalances.map((i) => (
              <tr key={i.item_id} className="border-b border-line last:border-0">
                <td className="px-4 py-2.5">{i.name}</td>
                <td className="px-4 py-2.5 text-ink/60">{i.category}</td>
                <td className={`px-4 py-2.5 text-right font-medium ${Number(i.current_stock) <= Number(i.reorder_level) ? "text-amber" : "text-ink"}`}>
                  {i.current_stock} {i.unit}
                </td>
                <td className="px-4 py-2.5 text-right text-ink/50">{i.reorder_level}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
