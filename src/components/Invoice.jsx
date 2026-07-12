import { Download } from "lucide-react";
import { formatINR } from "../data/billingEngine";
import { numberToWordsINR } from "../data/numberToWords";
import { useAppData } from "../context/AppDataContext";
import { exportInvoicePdf } from "../lib/exportInvoicePdf";

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function Invoice({ bill }) {
  const { hotelDetails } = useAppData();

  return (
    <div className="bg-white border border-line rounded-xl p-6 text-sm">
      <div className="flex justify-end mb-2">
        <button
          onClick={() => exportInvoicePdf(bill, hotelDetails)}
          className="flex items-center gap-1.5 text-xs font-medium text-plum border border-plum/30 rounded-lg px-3 py-1.5 hover:bg-plum/5"
        >
          <Download size={13} /> Download PDF
        </button>
      </div>
      <div className="text-center border-b border-line pb-4 mb-4">
        <p className="font-display text-xl text-plum">{hotelDetails.name}</p>
        <p className="text-xs text-ink/55 mt-1">{hotelDetails.address}</p>
        <p className="text-xs text-ink/55">
          GSTIN: {hotelDetails.gstin} · {hotelDetails.phone} · {hotelDetails.email}
        </p>
        <p className="text-xs font-semibold text-ink tracking-widest mt-2">TAX INVOICE</p>
      </div>

      <div className="flex justify-between text-xs text-ink/70 mb-4">
        <div>
          <p><span className="text-ink/45">Invoice No: </span>{bill.invoiceNumber}</p>
          <p><span className="text-ink/45">Date: </span>{fmtDate(bill.date)}</p>
        </div>
        <div className="text-right">
          <p><span className="text-ink/45">Billed to: </span>{bill.guestName}</p>
          <p><span className="text-ink/45">Room: </span>{bill.roomNumber}</p>
        </div>
      </div>

      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="border-y border-line text-ink/50">
            <th className="text-left py-1.5 font-medium">Description</th>
            <th className="text-left py-1.5 font-medium">SAC</th>
            <th className="text-right py-1.5 font-medium">Qty</th>
            <th className="text-right py-1.5 font-medium">Rate</th>
            <th className="text-right py-1.5 font-medium">Taxable</th>
            <th className="text-right py-1.5 font-medium">CGST</th>
            <th className="text-right py-1.5 font-medium">SGST</th>
            <th className="text-right py-1.5 font-medium">Total</th>
          </tr>
        </thead>
        <tbody>
          {bill.lines.map((l, i) => {
            const taxable = l.price * l.qty;
            const tax = taxable * (l.taxRate / 100);
            const cgst = tax / 2;
            const sgst = tax / 2;
            return (
              <tr key={i} className="border-b border-line/60">
                <td className="py-1.5 text-ink">{l.name}</td>
                <td className="py-1.5 text-ink/60">{l.sac}</td>
                <td className="py-1.5 text-right text-ink/60">{l.qty}</td>
                <td className="py-1.5 text-right text-ink/60">{formatINR(l.price)}</td>
                <td className="py-1.5 text-right text-ink/60">{formatINR(taxable)}</td>
                <td className="py-1.5 text-right text-ink/60">
                  {formatINR(cgst)} <span className="text-ink/35">({(l.taxRate / 2).toFixed(1)}%)</span>
                </td>
                <td className="py-1.5 text-right text-ink/60">
                  {formatINR(sgst)} <span className="text-ink/35">({(l.taxRate / 2).toFixed(1)}%)</span>
                </td>
                <td className="py-1.5 text-right text-ink font-medium">{formatINR(taxable + tax)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="flex justify-end mt-3">
        <div className="w-56 space-y-1">
          <div className="flex justify-between text-ink/60">
            <span>Subtotal</span>
            <span>{formatINR(bill.subtotal)}</span>
          </div>
          <div className="flex justify-between text-ink/60">
            <span>Total CGST</span>
            <span>{formatINR(bill.cgst)}</span>
          </div>
          <div className="flex justify-between text-ink/60">
            <span>Total SGST</span>
            <span>{formatINR(bill.sgst)}</span>
          </div>
          <div className="flex justify-between font-display text-plum text-base pt-1.5 border-t border-line">
            <span>Grand Total</span>
            <span>{formatINR(bill.total)}</span>
          </div>
        </div>
      </div>

      <p className="text-xs text-ink/50 italic mt-4 pt-3 border-t border-dashed border-line">
        {numberToWordsINR(bill.total)}
      </p>
      <p className="text-xs text-ink/40 mt-2">
        Payment received via {bill.paymentMethod}. This is a computer-generated tax invoice.
      </p>
    </div>
  );
}
