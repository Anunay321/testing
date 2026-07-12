import { supabase } from "./supabaseClient";

function csvEscape(val) {
  const s = String(val ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function exportTransactionsCsv(startDate, endDate) {
  const startISO = new Date(startDate + "T00:00:00").toISOString();
  const endISO = new Date(endDate + "T23:59:59").toISOString();

  const { data } = await supabase
    .from("transactions")
    .select("created_at, invoice_number, description, source, hsn_sac, qty, amount, entry_type, payment_mode, receipt_number")
    .gte("created_at", startISO)
    .lte("created_at", endISO)
    .order("created_at", { ascending: true });

  const headers = ["Date", "Invoice No", "Description", "Department", "HSN/SAC", "Qty", "Amount", "Type", "Payment Mode", "Receipt No"];
  const rows = (data || []).map((t) => [
    new Date(t.created_at).toLocaleString("en-IN"),
    t.invoice_number, t.description, t.source, t.hsn_sac, t.qty, t.amount, t.entry_type, t.payment_mode, t.receipt_number,
  ]);

  const csv = [headers, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Transactions_${startDate}_to_${endDate}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
