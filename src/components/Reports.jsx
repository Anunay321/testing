import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAppData } from "../context/AppDataContext";
import { formatINR } from "../data/billingEngine";

const SECTIONS = ["Daily Sales", "Receipt Register", "Meal Plan List", "City Ledger"];
const DEPARTMENTS = ["Room", "Restaurant", "Banquet", "Offers"];
const PAY_MODES = ["Cash", "UPI", "Card", "Corporate Billing"];

function dateKey(iso) {
  return new Date(iso).toISOString().slice(0, 10);
}

function DailySales() {
  const [rows, setRows] = useState(null);

  useEffect(() => {
    supabase
      .from("transactions")
      .select("amount, source, created_at")
      .eq("entry_type", "Debit")
      .order("created_at", { ascending: false })
      .limit(500)
      .then(({ data }) => {
        const byDate = {};
        (data || []).forEach((t) => {
          const key = dateKey(t.created_at);
          byDate[key] = byDate[key] || Object.fromEntries(DEPARTMENTS.map((d) => [d, 0]));
          if (DEPARTMENTS.includes(t.source)) byDate[key][t.source] += Number(t.amount);
        });
        setRows(Object.entries(byDate).sort((a, b) => (a[0] < b[0] ? 1 : -1)));
      });
  }, []);

  if (!rows) return <p className="text-sm text-ink/40">Loading…</p>;
  if (rows.length === 0) return <p className="text-sm text-ink/40">No revenue posted yet.</p>;

  return (
    <div className="bg-white border border-line rounded-xl overflow-x-auto">
      <table className="w-full text-sm min-w-[520px]">
        <thead>
          <tr className="border-b border-line bg-cream-dim text-left">
            <th className="px-4 py-2.5 text-xs uppercase tracking-wide text-ink/50">Date</th>
            {DEPARTMENTS.map((d) => (
              <th key={d} className="px-4 py-2.5 text-xs uppercase tracking-wide text-ink/50 text-right">{d}</th>
            ))}
            <th className="px-4 py-2.5 text-xs uppercase tracking-wide text-ink/50 text-right">Net Total</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([date, vals]) => {
            const total = DEPARTMENTS.reduce((s, d) => s + vals[d], 0);
            return (
              <tr key={date} className="border-b border-line last:border-0">
                <td className="px-4 py-2.5">{date}</td>
                {DEPARTMENTS.map((d) => (
                  <td key={d} className="px-4 py-2.5 text-right text-ink/70">{vals[d] ? formatINR(vals[d]) : "—"}</td>
                ))}
                <td className="px-4 py-2.5 text-right font-medium text-plum">{formatINR(total)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ReceiptRegister() {
  const [rows, setRows] = useState(null);

  useEffect(() => {
    supabase
      .from("transactions")
      .select("amount, payment_mode, created_at, receipt_number")
      .eq("entry_type", "Credit")
      .not("payment_mode", "is", null)
      .order("created_at", { ascending: false })
      .limit(500)
      .then(({ data }) => {
        const byDate = {};
        (data || []).forEach((t) => {
          const key = dateKey(t.created_at);
          byDate[key] = byDate[key] || Object.fromEntries(PAY_MODES.map((m) => [m, 0]));
          if (PAY_MODES.includes(t.payment_mode)) byDate[key][t.payment_mode] += Number(t.amount);
        });
        setRows(Object.entries(byDate).sort((a, b) => (a[0] < b[0] ? 1 : -1)));
      });
  }, []);

  if (!rows) return <p className="text-sm text-ink/40">Loading…</p>;
  if (rows.length === 0) return <p className="text-sm text-ink/40">No payments recorded yet.</p>;

  return (
    <div className="bg-white border border-line rounded-xl overflow-x-auto">
      <table className="w-full text-sm min-w-[560px]">
        <thead>
          <tr className="border-b border-line bg-cream-dim text-left">
            <th className="px-4 py-2.5 text-xs uppercase tracking-wide text-ink/50">Date</th>
            {PAY_MODES.map((m) => (
              <th key={m} className="px-4 py-2.5 text-xs uppercase tracking-wide text-ink/50 text-right">{m}</th>
            ))}
            <th className="px-4 py-2.5 text-xs uppercase tracking-wide text-ink/50 text-right">Daily Total</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([date, vals]) => {
            const total = PAY_MODES.reduce((s, m) => s + vals[m], 0);
            return (
              <tr key={date} className="border-b border-line last:border-0">
                <td className="px-4 py-2.5">{date}</td>
                {PAY_MODES.map((m) => (
                  <td key={m} className="px-4 py-2.5 text-right text-ink/70">{vals[m] ? formatINR(vals[m]) : "—"}</td>
                ))}
                <td className="px-4 py-2.5 text-right font-medium text-plum">{formatINR(total)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function MealPlanList() {
  const { activeFolios } = useAppData();
  const guestsEating = activeFolios
    .filter((f) => ["CP", "MAP", "AP"].includes(f.meal_plan))
    .sort((a, b) => a.room_number.localeCompare(b.room_number));

  return (
    <div className="bg-white border border-line rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-line bg-cream-dim">
        <p className="text-sm font-medium text-ink">Breakfast / meal list for kitchen</p>
        <p className="text-xs text-ink/50">EP (room-only) guests are excluded — they pay separately.</p>
      </div>
      <div className="divide-y divide-line">
        {guestsEating.length === 0 ? (
          <p className="text-sm text-ink/40 p-4">No in-house guests on a meal plan right now.</p>
        ) : (
          guestsEating.map((f) => (
            <div key={f.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium text-ink">Room {f.room_number} — {f.guest_name}</p>
                <p className="text-xs text-ink/50">{f.adults} adult{f.adults === 1 ? "" : "s"}{f.children ? `, ${f.children} child` : ""}</p>
              </div>
              <span className="text-xs font-mono bg-plum text-cream px-2 py-1 rounded">{f.meal_plan}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function CityLedger() {
  const { companies, companyActions, recordCityLedgerPayment } = useAppData();
  const [balances, setBalances] = useState({});
  const [payingId, setPayingId] = useState(null);
  const [payAmount, setPayAmount] = useState("");
  const [newCompany, setNewCompany] = useState({ company_name: "", billing_email: "", credit_limit: 0 });
  const [adding, setAdding] = useState(false);

  async function loadBalances() {
    const { data } = await supabase.from("city_ledger_transactions").select("company_id, amount, entry_type");
    const bal = {};
    (data || []).forEach((t) => {
      bal[t.company_id] = (bal[t.company_id] || 0) + (t.entry_type === "Debit" ? Number(t.amount) : -Number(t.amount));
    });
    setBalances(bal);
  }

  useEffect(() => { loadBalances(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handlePayment(companyId) {
    await recordCityLedgerPayment(companyId, Number(payAmount), "Payment received");
    setPayingId(null);
    setPayAmount("");
    loadBalances();
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button onClick={() => setAdding(true)} className="text-xs font-medium text-plum">+ Add company</button>
      </div>
      {adding && (
        <div className="bg-cream-dim border border-line rounded-xl p-3 flex flex-wrap gap-2 items-center">
          <input placeholder="Company name" value={newCompany.company_name} onChange={(e) => setNewCompany((p) => ({ ...p, company_name: e.target.value }))} className="text-sm border border-line rounded-lg px-2 py-1.5" />
          <input placeholder="Billing email" value={newCompany.billing_email} onChange={(e) => setNewCompany((p) => ({ ...p, billing_email: e.target.value }))} className="text-sm border border-line rounded-lg px-2 py-1.5" />
          <input type="number" placeholder="Credit limit" value={newCompany.credit_limit} onChange={(e) => setNewCompany((p) => ({ ...p, credit_limit: Number(e.target.value) }))} className="text-sm border border-line rounded-lg px-2 py-1.5 w-28" />
          <button onClick={async () => { await companyActions.add(newCompany); setAdding(false); setNewCompany({ company_name: "", billing_email: "", credit_limit: 0 }); }} className="text-xs bg-plum text-cream px-3 py-1.5 rounded-lg">Save</button>
        </div>
      )}

      {companies.map((c) => {
        const balance = balances[c.id] || 0;
        const overLimit = balance > Number(c.credit_limit);
        return (
          <div key={c.id} className="bg-white border border-line rounded-xl p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-ink">{c.company_name}</p>
                <p className="text-xs text-ink/50">{c.billing_email} · Credit limit {formatINR(c.credit_limit)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-ink/50">Outstanding</p>
                <p className={`font-display text-lg ${overLimit ? "text-rose" : "text-plum"}`}>{formatINR(balance)}</p>
              </div>
            </div>
            {overLimit && <p className="text-xs text-rose mt-1">Over credit limit</p>}

            {payingId === c.id ? (
              <div className="flex items-center gap-2 mt-3">
                <input type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} placeholder="Amount received" className="text-sm border border-line rounded-lg px-2 py-1.5 flex-1" />
                <button onClick={() => handlePayment(c.id)} className="text-xs bg-plum text-cream px-3 py-1.5 rounded-lg">Record</button>
                <button onClick={() => setPayingId(null)} className="text-xs text-ink/40">Cancel</button>
              </div>
            ) : (
              <button onClick={() => setPayingId(c.id)} className="text-xs font-medium text-sage mt-2">Record a payment received →</button>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function Reports() {
  const [section, setSection] = useState("Daily Sales");

  return (
    <div className="max-w-3xl mx-auto px-5 py-10">
      <h1 className="font-display text-2xl text-plum">Reports</h1>
      <p className="text-ink/55 mt-1 mb-5">Daily sales, cash reconciliation, meal counts, and corporate accounts</p>

      <div className="flex flex-wrap gap-1.5 mb-5">
        {SECTIONS.map((s) => (
          <button
            key={s}
            onClick={() => setSection(s)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
              section === s ? "bg-plum text-cream border-plum" : "border-line text-ink/60"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {section === "Daily Sales" && <DailySales />}
      {section === "Receipt Register" && <ReceiptRegister />}
      {section === "Meal Plan List" && <MealPlanList />}
      {section === "City Ledger" && <CityLedger />}
    </div>
  );
}
