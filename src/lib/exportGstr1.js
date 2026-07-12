import * as XLSX from "xlsx";
import { supabase } from "./supabaseClient";
import { stateNameFromGstin } from "../data/gstStateCodes";

// Fetches all Debit (revenue) transactions in a date range, plus their tax splits.
async function fetchPeriodData(startISO, endISO) {
  const { data: txns } = await supabase
    .from("transactions")
    .select("id, invoice_number, description, source, hsn_sac, qty, amount, created_at")
    .eq("entry_type", "Debit")
    .gte("created_at", startISO)
    .lte("created_at", endISO)
    .order("created_at", { ascending: true });

  const ids = (txns || []).map((t) => t.id);
  if (ids.length === 0) return { txns: [], taxByTxn: {} };

  const { data: taxes } = await supabase
    .from("transaction_taxes")
    .select("transaction_id, tax_amount, tax_master(tax_name, tax_rate)")
    .in("transaction_id", ids);

  const taxByTxn = {};
  (taxes || []).forEach((t) => {
    taxByTxn[t.transaction_id] = taxByTxn[t.transaction_id] || { cgst: 0, sgst: 0 };
    if (t.tax_master?.tax_name?.startsWith("CGST")) taxByTxn[t.transaction_id].cgst += Number(t.tax_amount);
    if (t.tax_master?.tax_name?.startsWith("SGST")) taxByTxn[t.transaction_id].sgst += Number(t.tax_amount);
  });

  return { txns: txns || [], taxByTxn };
}

function buildSheetWithHeaderRows(headerLabels, dataRows, titleRow) {
  const aoa = [
    [titleRow, "Please do not delete this sheet. if you don't have any data for this sheet please leave it blank."],
    headerLabels.map((_, i) => i + 1),
    [],
    headerLabels,
    ...dataRows,
  ];
  return XLSX.utils.aoa_to_sheet(aoa);
}

export async function exportGstr1Excel({ hotelDetails, startDate, endDate }) {
  const startISO = new Date(startDate + "T00:00:00").toISOString();
  const endISO = new Date(endDate + "T23:59:59").toISOString();
  const { txns, taxByTxn } = await fetchPeriodData(startISO, endISO);
  const placeOfSupply = stateNameFromGstin(hotelDetails?.gstin);

  // --- B2CS: group by total tax rate, since these are consumer (B2C) sales ---
  const b2csByRate = {};
  txns.forEach((t) => {
    const tax = taxByTxn[t.id] || { cgst: 0, sgst: 0 };
    const rate = t.amount > 0 ? Math.round(((tax.cgst + tax.sgst) / t.amount) * 100) : 0;
    b2csByRate[rate] = (b2csByRate[rate] || 0) + Number(t.amount);
  });
  const b2csRows = Object.entries(b2csByRate).map(([rate, taxable]) => [
    "OE", placeOfSupply, Number(taxable.toFixed(2)), Number(rate), 0, "", "",
  ]);

  // --- HSN summary: group by SAC code ---
  const hsnGroups = {};
  txns.forEach((t) => {
    const tax = taxByTxn[t.id] || { cgst: 0, sgst: 0 };
    const key = t.hsn_sac || "996311";
    hsnGroups[key] = hsnGroups[key] || { desc: t.description, qty: 0, taxable: 0, cgst: 0, sgst: 0 };
    hsnGroups[key].qty += Number(t.qty || 1);
    hsnGroups[key].taxable += Number(t.amount);
    hsnGroups[key].cgst += tax.cgst;
    hsnGroups[key].sgst += tax.sgst;
  });
  const hsnRows = Object.entries(hsnGroups).map(([sac, g]) => {
    const rate = g.taxable > 0 ? Math.round(((g.cgst + g.sgst) / g.taxable) * 100) : 0;
    return [
      sac, g.desc, "", "NOS-NUMBERS", g.qty, Number((g.taxable + g.cgst + g.sgst).toFixed(2)),
      rate, Number(g.taxable.toFixed(2)), 0, Number(g.cgst.toFixed(2)), Number(g.sgst.toFixed(2)), 0,
    ];
  });

  // --- DOCS: invoice number range issued in this period ---
  const invoiceNumbers = [...new Set(txns.map((t) => t.invoice_number).filter(Boolean))].sort();
  const docsRows = invoiceNumbers.length
    ? [["Invoice for outward supply", invoiceNumbers[0], invoiceNumbers[invoiceNumbers.length - 1], invoiceNumbers.length, 0]]
    : [];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    wb,
    buildSheetWithHeaderRows(["Type", "Place Of Supply", "Taxable Value", "Rate", "Cess Amount", "Applicable % of Tax Rate", "E-Commerce GSTIN"], b2csRows, "B2CS"),
    "B2CS"
  );
  XLSX.utils.book_append_sheet(
    wb,
    buildSheetWithHeaderRows(["HSN", "Description", "User Description", "UQC", "Total Quantity", "Total Value", "Rate", "Taxable Value", "Integrated Tax Amount", "Central Tax Amount", "State/UT Tax Amount", "Cess Amount"], hsnRows, "HSN summary"),
    "HSN"
  );
  XLSX.utils.book_append_sheet(
    wb,
    buildSheetWithHeaderRows(["Nature  of Document", "Sr. No. From", "Sr. No. To", "Total Number", "Cancelled"], docsRows, "documents issued"),
    "DOCS"
  );

  XLSX.writeFile(wb, `GSTR1_${startDate}_to_${endDate}.xlsx`);
}
