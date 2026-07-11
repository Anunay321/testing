export function formatINR(n) {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

export function computeBillTotals(cart) {
  const subtotal = cart.reduce((sum, l) => sum + l.item.price * l.qty, 0);

  // Each line is taxed at its own item's rate (room vs F&B vs services differ),
  // then the combined tax is split evenly into CGST/SGST per intra-state rules.
  const totalTax = cart.reduce(
    (sum, l) => sum + l.item.price * l.qty * (l.item.taxRate / 100),
    0
  );
  const cgst = Math.round(totalTax / 2);
  const sgst = Math.round(totalTax) - cgst;
  const total = subtotal + cgst + sgst;

  // Tax broken down by rate, useful for the GST summary line on the receipt.
  const byRate = {};
  cart.forEach((l) => {
    const key = l.item.taxRate;
    const lineTax = l.item.price * l.qty * (l.item.taxRate / 100);
    byRate[key] = (byRate[key] || 0) + lineTax;
  });

  return { subtotal, cgst, sgst, totalTax: cgst + sgst, total, byRate };
}
