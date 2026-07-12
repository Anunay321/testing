import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAppData } from "../context/AppDataContext";
import { formatINR } from "../data/billingEngine";

const SECTIONS = ["Daily Sales", "Tax Summary", "Sales by Room Type", "Receipt Register", "Daybook", "Closed Bills", "High Bill", "Meal Plan List", "City Ledger"];
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

function TaxSummary() {
  const [rows, setRows] = useState(null);
  const [totals, setTotals] = useState(null);

  useEffect(() => {
    async function load() {
      const { data: txns } = await supabase
        .from("transactions")
        .select("id, amount")
        .eq("entry_type", "Debit")
        .order("created_at", { ascending: false })
        .limit(500);
      const ids = (txns || []).map((t) => t.id);
      if (ids.length === 0) { setRows([]); setTotals({ taxable: 0, cgst: 0, sgst: 0 }); return; }

      const { data: taxes } = await supabase
        .from("transaction_taxes")
        .select("transaction_id, tax_amount, tax_master(tax_name, tax_rate)")
        .in("transaction_id", ids);

      const byTxn = {};
      (taxes || []).forEach((t) => {
        byTxn[t.transaction_id] = byTxn[t.transaction_id] || { cgst: 0, sgst: 0 };
        if (t.tax_master?.tax_name?.startsWith("CGST")) byTxn[t.transaction_id].cgst += Number(t.tax_amount);
        if (t.tax_master?.tax_name?.startsWith("SGST")) byTxn[t.transaction_id].sgst += Number(t.tax_amount);
      });

      const byRate = {};
      let grand = { taxable: 0, cgst: 0, sgst: 0 };
      (txns || []).forEach((t) => {
        const tax = byTxn[t.id] || { cgst: 0, sgst: 0 };
        const rate = t.amount > 0 ? Math.round(((tax.cgst + tax.sgst) / t.amount) * 100) : 0;
        byRate[rate] = byRate[rate] || { taxable: 0, cgst: 0, sgst: 0 };
        byRate[rate].taxable += Number(t.amount);
        byRate[rate].cgst += tax.cgst;
        byRate[rate].sgst += tax.sgst;
        grand.taxable += Number(t.amount);
        grand.cgst += tax.cgst;
        grand.sgst += tax.sgst;
      });
      setRows(Object.entries(byRate).sort((a, b) => Number(a[0]) - Number(b[0])));
      setTotals(grand);
    }
    load();
  }, []);

  if (!rows) return <p className="text-sm text-ink/40">Loading…</p>;

  return (
    <div className="bg-white border border-line rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line bg-cream-dim text-left">
            <th className="px-4 py-2.5 text-xs uppercase tracking-wide text-ink/50">GST Rate</th>
            <th className="px-4 py-2.5 text-xs uppercase tracking-wide text-ink/50 text-right">Taxable Value</th>
            <th className="px-4 py-2.5 text-xs uppercase tracking-wide text-ink/50 text-right">CGST</th>
            <th className="px-4 py-2.5 text-xs uppercase tracking-wide text-ink/50 text-right">SGST</th>
            <th className="px-4 py-2.5 text-xs uppercase tracking-wide text-ink/50 text-right">Total Tax</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([rate, v]) => (
            <tr key={rate} className="border-b border-line last:border-0">
              <td className="px-4 py-2.5">{rate}%</td>
              <td className="px-4 py-2.5 text-right">{formatINR(v.taxable)}</td>
              <td className="px-4 py-2.5 text-right text-ink/70">{formatINR(v.cgst)}</td>
              <td className="px-4 py-2.5 text-right text-ink/70">{formatINR(v.sgst)}</td>
              <td className="px-4 py-2.5 text-right font-medium text-plum">{formatINR(v.cgst + v.sgst)}</td>
            </tr>
          ))}
          {totals && (
            <tr className="bg-cream-dim font-semibold">
              <td className="px-4 py-2.5">Grand Total</td>
              <td className="px-4 py-2.5 text-right">{formatINR(totals.taxable)}</td>
              <td className="px-4 py-2.5 text-right">{formatINR(totals.cgst)}</td>
              <td className="px-4 py-2.5 text-right">{formatINR(totals.sgst)}</td>
              <td className="px-4 py-2.5 text-right text-plum">{formatINR(totals.cgst + totals.sgst)}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function SalesByRoomType() {
  const [rows, setRows] = useState(null);

  useEffect(() => {
    supabase
      .from("transactions")
      .select("amount, folios(room_type_id, room_types(name))")
      .eq("entry_type", "Debit")
      .eq("source", "Room")
      .then(({ data }) => {
        const byType = {};
        (data || []).forEach((t) => {
          const name = t.folios?.room_types?.name || "Unassigned";
          byType[name] = (byType[name] || 0) + Number(t.amount);
        });
        setRows(Object.entries(byType).sort((a, b) => b[1] - a[1]));
      });
  }, []);

  if (!rows) return <p className="text-sm text-ink/40">Loading…</p>;
  if (rows.length === 0) return <p className="text-sm text-ink/40">No room revenue posted yet.</p>;

  const max = Math.max(...rows.map(([, v]) => v));

  return (
    <div className="bg-white border border-line rounded-xl p-5 space-y-3">
      {rows.map(([name, val]) => (
        <div key={name}>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-ink/70">{name}</span>
            <span className="font-medium text-ink">{formatINR(val)}</span>
          </div>
          <div className="h-2 bg-cream-dim rounded-full overflow-hidden">
            <div className="h-full bg-rose rounded-full" style={{ width: `${(val / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function Daybook() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [rows, setRows] = useState(null);

  useEffect(() => {
    const startISO = new Date(date + "T00:00:00").toISOString();
    const endISO = new Date(date + "T23:59:59").toISOString();
    supabase
      .from("transactions")
      .select("created_at, description, source, amount, entry_type, payment_mode, invoice_number")
      .gte("created_at", startISO)
      .lte("created_at", endISO)
      .order("created_at", { ascending: true })
      .then(({ data }) => setRows(data || []));
  }, [date]);

  return (
    <div>
      <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="text-sm border border-line rounded-lg px-3 py-2 outline-none mb-3" />
      {!rows ? (
        <p className="text-sm text-ink/40">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-ink/40">No transactions on this date.</p>
      ) : (
        <div className="bg-white border border-line rounded-xl divide-y divide-line">
          {rows.map((t, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-2.5 text-sm">
              <div>
                <span className="text-ink/40 font-mono text-xs mr-2">
                  {new Date(t.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                </span>
                <span className="text-ink">{t.description}</span>
                <span className="text-ink/40 text-xs ml-2">({t.source})</span>
              </div>
              <span className={t.entry_type === "Debit" ? "text-ink/70" : "text-sage font-medium"}>
                {t.entry_type === "Credit" ? "+" : "−"}{formatINR(t.amount)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ClosedBills() {
  const [rows, setRows] = useState(null);

  useEffect(() => {
    async function load() {
      const { data: folios } = await supabase
        .from("folios")
        .select("id, guest_name, room_number, check_out_date")
        .eq("status", "Settled")
        .order("check_out_date", { ascending: false })
        .limit(50);

      const results = await Promise.all(
        (folios || []).map(async (f) => {
          const { data: txns } = await supabase.from("transactions").select("amount, entry_type").eq("folio_id", f.id);
          const total = (txns || []).filter((t) => t.entry_type === "Debit").reduce((s, t) => s + Number(t.amount), 0);
          return { ...f, total };
        })
      );
      setRows(results);
    }
    load();
  }, []);

  if (!rows) return <p className="text-sm text-ink/40">Loading…</p>;
  if (rows.length === 0) return <p className="text-sm text-ink/40">No closed bills yet.</p>;

  return (
    <div className="bg-white border border-line rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line bg-cream-dim text-left">
            <th className="px-4 py-2.5 text-xs uppercase tracking-wide text-ink/50">Checked Out</th>
            <th className="px-4 py-2.5 text-xs uppercase tracking-wide text-ink/50">Guest</th>
            <th className="px-4 py-2.5 text-xs uppercase tracking-wide text-ink/50">Room</th>
            <th className="px-4 py-2.5 text-xs uppercase tracking-wide text-ink/50 text-right">Bill Total</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((f) => (
            <tr key={f.id} className="border-b border-line last:border-0">
              <td className="px-4 py-2.5">{new Date(f.check_out_date).toLocaleDateString("en-IN")}</td>
              <td className="px-4 py-2.5">{f.guest_name}</td>
              <td className="px-4 py-2.5">{f.room_number}</td>
              <td className="px-4 py-2.5 text-right font-medium text-plum">{formatINR(f.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function HighBill() {
  const [threshold, setThreshold] = useState(5000);
  const [rows, setRows] = useState(null);

  useEffect(() => {
    async function load() {
      const { data: folios } = await supabase.from("folios").select("id, guest_name, room_number, status, check_in_date").limit(100);
      const results = await Promise.all(
        (folios || []).map(async (f) => {
          const { data: txns } = await supabase.from("transactions").select("amount, entry_type").eq("folio_id", f.id);
          const total = (txns || []).reduce((s, t) => s + (t.entry_type === "Debit" ? Number(t.amount) : -Number(t.amount)), 0);
          return { ...f, total };
        })
      );
      setRows(results);
    }
    load();
  }, []);

  const filtered = (rows || []).filter((f) => f.total >= Number(threshold)).sort((a, b) => b.total - a.total);

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <label className="text-xs text-ink/50">Flag bills at or above</label>
        <input type="number" value={threshold} onChange={(e) => setThreshold(e.target.value)} className="text-sm border border-line rounded-lg px-3 py-1.5 outline-none w-28" />
      </div>
      {!rows ? (
        <p className="text-sm text-ink/40">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-ink/40">No bills at or above this threshold.</p>
      ) : (
        <div className="bg-white border border-line rounded-xl divide-y divide-line">
          {filtered.map((f) => (
            <div key={f.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
              <div>
                <span className="text-ink">{f.guest_name}</span>
                <span className="text-ink/40 text-xs ml-2">Room {f.room_number} · {f.status}</span>
              </div>
              <span className="font-medium text-rose">{formatINR(f.total)}</span>
            </div>
          ))}
        </div>
      )}
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
      {section === "Tax Summary" && <TaxSummary />}
      {section === "Sales by Room Type" && <SalesByRoomType />}
      {section === "Receipt Register" && <ReceiptRegister />}
      {section === "Daybook" && <Daybook />}
      {section === "Closed Bills" && <ClosedBills />}
      {section === "High Bill" && <HighBill />}
      {section === "Meal Plan List" && <MealPlanList />}
      {section === "City Ledger" && <CityLedger />}
    </div>
  );
}
