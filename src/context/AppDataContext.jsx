import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const AppDataContext = createContext(null);

const TABLES = {
  roomTypes: "room_types",
  menuItems: "menu_items",
  banquetHalls: "banquet_halls",
  offers: "offers",
  inventory: "inventory_items",
  companies: "companies",
};

function useSupabaseCollection(table) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    const { data, error } = await supabase.from(table).select("*").order("created_at", { ascending: true });
    if (!error) setItems(data || []);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function add(item) {
    const { data, error } = await supabase.from(table).insert(item).select().single();
    if (!error && data) setItems((prev) => [...prev, data]);
    return { data, error };
  }

  async function update(id, patch) {
    const { data, error } = await supabase.from(table).update(patch).eq("id", id).select().single();
    if (!error && data) setItems((prev) => prev.map((it) => (it.id === id ? data : it)));
    return { data, error };
  }

  async function remove(id) {
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (!error) setItems((prev) => prev.filter((it) => it.id !== id));
    return { error };
  }

  return [items, { add, update, remove, refresh }, loading];
}

export function AppDataProvider({ children }) {
  const [hotelDetails, setHotelDetailsState] = useState(null);
  const [roomTypes, roomTypeActions, loadingRooms] = useSupabaseCollection(TABLES.roomTypes);
  const [menuItems, menuActions, loadingMenu] = useSupabaseCollection(TABLES.menuItems);
  const [banquetHalls, banquetActions, loadingBanquet] = useSupabaseCollection(TABLES.banquetHalls);
  const [offers, offerActions, loadingOffers] = useSupabaseCollection(TABLES.offers);
  const [inventory, inventoryActions, loadingInventory] = useSupabaseCollection(TABLES.inventory);
  const [companies, companyActions, loadingCompanies] = useSupabaseCollection(TABLES.companies);
  const [feedback, setFeedback] = useState([]);
  const [taxMaster, setTaxMaster] = useState([]);
  const [bills, setBills] = useState([]); // session-local view for Analytics; source of truth is written to transactions
  const [rooms, setRooms] = useState([]);
  const [activeFolios, setActiveFolios] = useState([]);
  const [inventoryBalances, setInventoryBalances] = useState([]);
  const [loadingOps, setLoadingOps] = useState(true);

  async function refreshRooms() {
    const { data } = await supabase
      .from("rooms")
      .select("*, room_types(name, price, capacity)")
      .order("room_number", { ascending: true });
    setRooms(data || []);
  }

  async function refreshActiveFolios() {
    const { data } = await supabase
      .from("folios")
      .select("*, companies(company_name)")
      .eq("status", "Active")
      .order("check_in_date", { ascending: true });
    setActiveFolios(data || []);
  }

  async function refreshInventoryBalances() {
    const { data } = await supabase.from("inventory_balances").select("*").order("name");
    setInventoryBalances(data || []);
  }

  useEffect(() => {
    async function loadAll() {
      await Promise.all([
        supabase.from("rooms").select("*, room_types(name, price, capacity)").order("room_number").then(({ data }) => setRooms(data || [])),
        refreshActiveFolios(),
        refreshInventoryBalances(),
        supabase.from("hotel_details").select("*").eq("id", 1).single().then(({ data }) => { if (data) setHotelDetailsState(data); }),
        supabase.from("feedback").select("*").order("created_at", { ascending: false }).then(({ data }) => setFeedback(data || [])),
        supabase.from("tax_master").select("*").eq("is_active", true).then(({ data }) => setTaxMaster(data || [])),
      ]);
      setLoadingOps(false);
    }
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function setHotelDetails(details) {
    const { data, error } = await supabase.from("hotel_details").update(details).eq("id", 1).select().single();
    if (!error && data) setHotelDetailsState(data);
    return { data, error };
  }

  async function submitFeedback(entry) {
    const { data, error } = await supabase
      .from("feedback")
      .insert({ ratings: entry.ratings, comment: entry.comment })
      .select()
      .single();
    if (!error && data) setFeedback((prev) => [data, ...prev]);
    return { data, error };
  }

  // Finds the CGST/SGST tax_master rows matching an item's total tax rate
  // (e.g. 12% total -> two 6% rows; 18% -> two 9% rows; 5% -> two 2.5% rows).
  function matchTaxRows(totalRate) {
    const half = totalRate / 2;
    const matches = taxMaster.filter((t) => Number(t.tax_rate) === half);
    const cgst = matches.find((t) => t.tax_name.startsWith("CGST"));
    const sgst = matches.find((t) => t.tax_name.startsWith("SGST"));
    return { cgst, sgst };
  }

  function nextInvoiceNumber() {
    const seq = hotelDetails?.invoice_seq ?? 1001;
    return `${hotelDetails?.invoice_prefix ?? "INV"}/${new Date().getFullYear()}/${seq}`;
  }

  function nextReceiptNumber() {
    const seq = hotelDetails?.invoice_seq ?? 1001;
    return `${hotelDetails?.invoice_prefix ?? "INV"}-RCPT/${seq}`;
  }

  // Shared by quick bills and room-folio charges: posts one Debit transaction
  // per line item, plus its CGST/SGST split, and deducts linked inventory.
  async function postLineItems(folioId, invoiceNumber, lines) {
    for (const line of lines) {
      const { data: txn } = await supabase
        .from("transactions")
        .insert({
          folio_id: folioId,
          invoice_number: invoiceNumber,
          description: line.name,
          source: line.category,
          hsn_sac: line.sac,
          qty: line.qty,
          amount: line.price * line.qty,
          entry_type: "Debit",
        })
        .select()
        .single();

      if (txn) {
        const lineTax = line.price * line.qty * (line.taxRate / 100);
        const { cgst, sgst } = matchTaxRows(line.taxRate);
        const taxRows = [];
        if (cgst) taxRows.push({ transaction_id: txn.id, tax_master_id: cgst.id, tax_amount: lineTax / 2 });
        if (sgst) taxRows.push({ transaction_id: txn.id, tax_master_id: sgst.id, tax_amount: lineTax / 2 });
        if (taxRows.length) await supabase.from("transaction_taxes").insert(taxRows);
      }
    }
  }

  function billTotals(lines) {
    const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
    const totalTax = lines.reduce((s, l) => s + l.price * l.qty * (l.taxRate / 100), 0);
    const cgstTotal = Math.round(totalTax / 2);
    const sgstTotal = Math.round(totalTax) - cgstTotal;
    return { subtotal, cgstTotal, sgstTotal, total: subtotal + cgstTotal + sgstTotal };
  }

  // --- Check-in / room-folio lifecycle -------------------------------------

  async function checkIn({ roomId, guestName, mealPlan, adults, children, companyId }) {
    const { data: folio } = await supabase
      .from("folios")
      .insert({
        guest_name: guestName,
        room_number: rooms.find((r) => r.id === roomId)?.room_number,
        status: "Active",
        meal_plan: mealPlan,
        adults,
        children,
        company_id: companyId || null,
        room_type_id: rooms.find((r) => r.id === roomId)?.room_type_id,
      })
      .select()
      .single();

    if (roomId) await supabase.from("rooms").update({ status: "Occupied" }).eq("id", roomId);
    await Promise.all([refreshRooms(), refreshActiveFolios()]);
    return folio;
  }

  // Post charges (restaurant, banquet, etc.) to an already-active room folio.
  async function postCharge(folioId, lines) {
    const invoiceNumber = nextInvoiceNumber();
    await postLineItems(folioId, invoiceNumber, lines);
    await setHotelDetails({ invoice_seq: (hotelDetails?.invoice_seq ?? 1001) + 1 });
    await refreshActiveFolios();
  }

  async function folioBalance(folioId) {
    const { data } = await supabase.from("transactions").select("amount, entry_type").eq("folio_id", folioId);
    if (!data) return 0;
    return data.reduce((bal, t) => bal + (t.entry_type === "Debit" ? Number(t.amount) : -Number(t.amount)), 0);
  }

  // Settle a folio at checkout: either direct payment, or transfer to the
  // company's City Ledger (Accounts Receivable) for later corporate billing.
  async function checkOut(folioId, { settlement, paymentMode }) {
    const balance = await folioBalance(folioId);
    const folio = activeFolios.find((f) => f.id === folioId);
    const invoiceNumber = nextInvoiceNumber();
    const receiptNumber = nextReceiptNumber();

    if (settlement === "pay" && balance > 0) {
      await supabase.from("transactions").insert({
        folio_id: folioId,
        invoice_number: invoiceNumber,
        description: `Checkout payment via ${paymentMode}`,
        source: "Payment",
        amount: balance,
        entry_type: "Credit",
        payment_mode: paymentMode,
        receipt_number: receiptNumber,
      });
    } else if (settlement === "city_ledger" && folio?.company_id && balance > 0) {
      await supabase.from("transactions").insert({
        folio_id: folioId,
        invoice_number: invoiceNumber,
        description: "Transferred to City Ledger",
        source: "City Ledger Transfer",
        amount: balance,
        entry_type: "Credit",
        payment_mode: "Corporate Billing",
        receipt_number: receiptNumber,
      });
      await supabase.from("city_ledger_transactions").insert({
        company_id: folio.company_id,
        reference_folio_id: folioId,
        description: `Transfer from Folio (${folio.guest_name}, Room ${folio.room_number})`,
        amount: balance,
        entry_type: "Debit",
      });
    }

    await supabase.from("folios").update({ status: "Settled", check_out_date: new Date().toISOString() }).eq("id", folioId);
    const room = rooms.find((r) => r.room_number === folio?.room_number);
    if (room) await supabase.from("rooms").update({ status: "Dirty" }).eq("id", room.id);
    await setHotelDetails({ invoice_seq: (hotelDetails?.invoice_seq ?? 1001) + 1 });
    await Promise.all([refreshRooms(), refreshActiveFolios()]);
  }

  async function markRoomStatus(roomId, status) {
    await supabase.from("rooms").update({ status }).eq("id", roomId);
    await refreshRooms();
  }

  async function recordCityLedgerPayment(companyId, amount, description) {
    await supabase.from("city_ledger_transactions").insert({
      company_id: companyId,
      description: description || "Payment received",
      amount,
      entry_type: "Credit",
    });
  }

  // --- Inventory ledger ------------------------------------------------------

  async function recordStockMovement({ itemId, movementType, quantity, reason, referenceType }) {
    await supabase.from("inventory_ledger").insert({
      item_id: itemId,
      movement_type: movementType,
      quantity,
      reason,
      reference_type: referenceType || "Manual Adjustment",
    });
    await refreshInventoryBalances();
  }

  async function completeBill({ roomNumber, guestName, paymentMethod, lines }) {
    const { subtotal, cgstTotal, sgstTotal, total } = billTotals(lines);
    const invoiceNumber = nextInvoiceNumber();

    // Open + immediately settle a folio for this bill (walk-in/quick-bill style).
    const { data: folio } = await supabase
      .from("folios")
      .insert({
        guest_name: guestName || "Walk-in Guest",
        room_number: roomNumber || null,
        status: "Settled",
        check_out_date: new Date().toISOString(),
      })
      .select()
      .single();

    // Insert one immutable transaction row per line item, plus its tax split.
    await postLineItems(folio?.id, invoiceNumber, lines);

    // Record the payment as a credit against the same folio, with a receipt number.
    const receiptNumber = nextReceiptNumber();
    await supabase.from("transactions").insert({
      folio_id: folio?.id,
      invoice_number: invoiceNumber,
      description: `Payment via ${paymentMethod}`,
      source: "Payment",
      amount: total,
      entry_type: "Credit",
      payment_mode: paymentMethod,
      receipt_number: receiptNumber,
    });

    // Advance the invoice sequence for next time.
    await setHotelDetails({ invoice_seq: (hotelDetails?.invoice_seq ?? 1001) + 1 });

    const bill = {
      id: folio?.id || `B${Date.now()}`,
      invoiceNumber,
      date: new Date().toISOString(),
      roomNumber: roomNumber || "—",
      guestName: guestName || "Walk-in Guest",
      paymentMethod,
      lines,
      subtotal,
      cgst: cgstTotal,
      sgst: sgstTotal,
      totalTax: cgstTotal + sgstTotal,
      total,
    };
    setBills((prev) => [bill, ...prev]);
    return bill;
  }

  const loading = loadingRooms || loadingMenu || loadingBanquet || loadingOffers || loadingInventory || loadingCompanies || loadingOps || !hotelDetails;

  const value = useMemo(
    () => ({
      loading,
      hotelDetails,
      setHotelDetails,
      roomTypes,
      roomTypeActions,
      menuItems,
      menuActions,
      banquetHalls,
      banquetActions,
      offers,
      offerActions,
      inventory,
      inventoryActions,
      inventoryBalances,
      recordStockMovement,
      companies,
      companyActions,
      recordCityLedgerPayment,
      rooms,
      markRoomStatus,
      activeFolios,
      checkIn,
      postCharge,
      checkOut,
      folioBalance,
      feedback,
      submitFeedback,
      bills,
      completeBill,
      taxMaster,
    }),
    [loading, hotelDetails, roomTypes, menuItems, banquetHalls, offers, inventory, inventoryBalances, companies, rooms, activeFolios, feedback, bills, taxMaster]
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used within AppDataProvider");
  return ctx;
}
