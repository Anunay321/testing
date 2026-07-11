export function formatINR(n) {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

// cart: [{ id, name, sac, qty, price, taxRate }]
export function computeBillTotals(cart) {
  const subtotal = cart.reduce((sum, l) => sum + l.price * l.qty, 0);

  const totalTax = cart.reduce((sum, l) => sum + l.price * l.qty * (l.taxRate / 100), 0);
  const cgst = Math.round(totalTax / 2);
  const sgst = Math.round(totalTax) - cgst;
  const total = subtotal + cgst + sgst;

  return { subtotal, cgst, sgst, totalTax: cgst + sgst, total };
}
