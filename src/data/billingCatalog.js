// Simplified but realistic GST slabs for a small hotel:
// - Room tariff: 12% (typical budget/3-star band)
// - Restaurant / room service (F&B): 5% (standard restaurant rate)
// - Services (laundry): 18%
// - Retail-type items (mini bar): 18%
// A full HSN/SAC-compliant mapping is a later, more advanced phase — this
// keeps the common cases realistic without over-building the demo.
export const CHARGE_ITEMS = [
  { id: "c1", name: "Room Stay (per night)", category: "Room", price: 2400, taxRate: 12 },
  { id: "c2", name: "Extra Bed", category: "Room", price: 500, taxRate: 12 },
  { id: "c3", name: "Restaurant Order", category: "Restaurant", price: 350, taxRate: 5 },
  { id: "c4", name: "Room Service", category: "Restaurant", price: 300, taxRate: 5 },
  { id: "c5", name: "Breakfast Buffet (per guest)", category: "Restaurant", price: 250, taxRate: 5 },
  { id: "c6", name: "Laundry Service", category: "Services", price: 200, taxRate: 18 },
  { id: "c7", name: "Mini Bar Item", category: "Services", price: 150, taxRate: 18 },
];

export const PAYMENT_METHODS = ["Cash", "UPI", "Card"];
