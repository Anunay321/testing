import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const AppDataContext = createContext(null);

const TABLES = {
  roomTypes: "room_types",
  menuItems: "menu_items",
  banquetHalls: "banquet_halls",
  offers: "offers",
  inventory: "inventory_items",
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
  const [feedback, setFeedback] = useState([]);
  const [taxMaster, setTaxMaster] = useState([]);
  const [bills, setBills] = useState([]); // session-local view for Analytics; source of truth is written to transactions

  useEffect(() => {
    supabase.from("hotel_details").select("*").eq("id", 1).single().then(({ data }) => {
      if (data) setHotelDetailsState(data);
    });
    supabase.from("feedback").select("*").order("created_at", { ascending: false }).then(({ data }) => {
      if (data) setFeedback(data);
    });
    supabase.from("tax_master").select("*").eq("is_active", true).then(({ data }) => {
      if (data) setTaxMaster(data);
    });
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

  async function completeBill({ roomNumber, guestName, paymentMethod, lines }) {
    const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
    const totalTax = lines.reduce((s, l) => s + l.price * l.qty * (l.taxRate / 100), 0);
    const cgstTotal = Math.round(totalTax / 2);
    const sgstTotal = Math.round(totalTax) - cgstTotal;
    const total = subtotal + cgstTotal + sgstTotal;

    const invoiceSeq = hotelDetails?.invoice_seq ?? 1001;
    const invoiceNumber = `${hotelDetails?.invoice_prefix ?? "INV"}/${new Date().getFullYear()}/${invoiceSeq}`;

    // 1. Open + immediately settle a folio for this bill (walk-in/quick-bill style).
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

    // 2. Insert one immutable transaction row per line item, plus its tax split.
    for (const line of lines) {
      const { data: txn } = await supabase
        .from("transactions")
        .insert({
          folio_id: folio?.id,
          invoice_number: invoiceNumber,
          description: line.name,
          source: line.category,
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

    // 3. Record the payment as a credit against the same folio.
    await supabase.from("transactions").insert({
      folio_id: folio?.id,
      invoice_number: invoiceNumber,
      description: `Payment via ${paymentMethod}`,
      source: "Payment",
      amount: total,
      entry_type: "Credit",
    });

    // 4. Advance the invoice sequence for next time.
    await setHotelDetails({ invoice_seq: invoiceSeq + 1 });

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

  async function adjustStock(id, delta) {
    const current = inventory.find((it) => it.id === id);
    if (!current) return;
    const nextQty = Math.max(0, Number(current.quantity) + delta);
    return inventoryActions.update(id, { quantity: nextQty });
  }

  const loading = loadingRooms || loadingMenu || loadingBanquet || loadingOffers || loadingInventory || !hotelDetails;

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
      adjustStock,
      feedback,
      submitFeedback,
      bills,
      completeBill,
    }),
    [loading, hotelDetails, roomTypes, menuItems, banquetHalls, offers, inventory, feedback, bills]
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used within AppDataProvider");
  return ctx;
}
