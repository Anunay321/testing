import { useEffect, useState } from "react";
import { useAppData } from "../../context/AppDataContext";
import EditableTable from "./EditableTable";
import { formatINR } from "../../data/billingEngine";
import { INVENTORY_CATEGORIES } from "../../data/hotelConfig";

const SECTIONS = ["Hotel Details", "Room Types", "Restaurant Menu", "Banquet Halls", "Offers", "Inventory"];

function priceField(width = 90) {
  return { key: "price", label: "Price (₹)", type: "number", width };
}
function taxField() {
  return { key: "tax_rate", label: "GST %", type: "number", width: 70 };
}
function sacField() {
  return { key: "sac", label: "SAC code", type: "text", width: 90 };
}
function nameField(width = 200) {
  return { key: "name", label: "Name", type: "text", width };
}

export default function AdminPanel() {
  const {
    hotelDetails, setHotelDetails,
    roomTypes, roomTypeActions,
    menuItems, menuActions,
    banquetHalls, banquetActions,
    offers, offerActions,
    inventory, inventoryActions,
  } = useAppData();

  const [section, setSection] = useState("Hotel Details");
  const [details, setDetails] = useState(hotelDetails || {});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (hotelDetails) setDetails(hotelDetails);
  }, [hotelDetails]);

  function saveDetails() {
    setHotelDetails(details);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  const priceFmt = { price: formatINR };

  return (
    <div className="max-w-3xl mx-auto px-5 py-10">
      <h1 className="font-display text-2xl text-plum">Admin</h1>
      <p className="text-ink/55 mt-1 mb-6">Everything here is editable — changes save to the database immediately.</p>

      <div className="flex flex-wrap gap-1.5 mb-6">
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

      {section === "Hotel Details" && (
        <div className="bg-white border border-line rounded-xl p-5 space-y-3">
          <p className="text-sm font-medium text-ink mb-1">Used on every invoice</p>
          {[
            { key: "name", label: "Hotel name" },
            { key: "address", label: "Address" },
            { key: "gstin", label: "GSTIN" },
            { key: "phone", label: "Phone" },
            { key: "email", label: "Email" },
            { key: "invoice_prefix", label: "Invoice number prefix" },
          ].map((f) => (
            <div key={f.key}>
              <label className="text-xs text-ink/50">{f.label}</label>
              <input
                value={details[f.key] || ""}
                onChange={(e) => setDetails((p) => ({ ...p, [f.key]: e.target.value }))}
                className="w-full mt-1 text-sm border border-line rounded-lg px-3 py-2 outline-none"
              />
            </div>
          ))}
          <button
            onClick={saveDetails}
            className="bg-plum text-cream text-sm font-semibold rounded-lg px-4 py-2 mt-2"
          >
            {saved ? "Saved ✓" : "Save details"}
          </button>
        </div>
      )}

      {section === "Room Types" && (
        <EditableTable
          title="Room types & rates"
          items={roomTypes}
          actions={roomTypeActions}
          fields={[nameField(180), priceField(), taxField(), sacField(), { key: "capacity", label: "Capacity", type: "number", width: 70 }]}
          formatters={priceFmt}
        />
      )}

      {section === "Restaurant Menu" && (
        <EditableTable
          title="Restaurant & room service menu"
          items={menuItems}
          actions={menuActions}
          fields={[nameField(200), { key: "category", label: "Category", type: "text", width: 110 }, priceField(), taxField(), sacField()]}
          formatters={priceFmt}
        />
      )}

      {section === "Banquet Halls" && (
        <EditableTable
          title="Banquet halls & event spaces"
          items={banquetHalls}
          actions={banquetActions}
          fields={[nameField(220), priceField(100), taxField(), sacField(), { key: "capacity", label: "Capacity", type: "number", width: 80 }]}
          formatters={priceFmt}
        />
      )}

      {section === "Offers" && (
        <EditableTable
          title="Packages & offers with room booking"
          items={offers}
          actions={offerActions}
          fields={[nameField(180), { key: "description", label: "Description", type: "text", width: 220 }, priceField(), taxField(), sacField()]}
          formatters={priceFmt}
        />
      )}

      {section === "Inventory" && (
        <>
          <p className="text-xs text-ink/45 mb-3">
            Categories in use: {INVENTORY_CATEGORIES.join(", ")}
          </p>
          <EditableTable
            title="Inventory & stock"
            items={inventory}
            actions={inventoryActions}
            fields={[
              nameField(180),
              { key: "category", label: "Category", type: "text", width: 110 },
              { key: "unit", label: "Unit", type: "text", width: 70 },
              { key: "quantity", label: "Quantity", type: "number", width: 80 },
              { key: "reorder_level", label: "Reorder at", type: "number", width: 90 },
            ]}
          />
        </>
      )}
    </div>
  );
}
