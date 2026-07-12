import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatINR } from "../data/billingEngine";
import { numberToWordsINR } from "../data/numberToWords";

export function exportInvoicePdf(bill, hotelDetails) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(hotelDetails.name, pageWidth / 2, 50, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(hotelDetails.address || "", pageWidth / 2, 66, { align: "center" });
  doc.text(`GSTIN: ${hotelDetails.gstin} | ${hotelDetails.phone} | ${hotelDetails.email}`, pageWidth / 2, 80, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("TAX INVOICE", pageWidth / 2, 100, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Invoice No: ${bill.invoiceNumber}`, 40, 125);
  doc.text(`Date: ${new Date(bill.date).toLocaleDateString("en-IN")}`, 40, 138);
  doc.text(`Billed to: ${bill.guestName}`, pageWidth - 40, 125, { align: "right" });
  doc.text(`Room: ${bill.roomNumber}`, pageWidth - 40, 138, { align: "right" });

  const body = bill.lines.map((l) => {
    const taxable = l.price * l.qty;
    const tax = taxable * (l.taxRate / 100);
    return [
      l.name, l.sac, String(l.qty), formatINR(l.price), formatINR(taxable),
      `${formatINR(tax / 2)} (${(l.taxRate / 2).toFixed(1)}%)`,
      `${formatINR(tax / 2)} (${(l.taxRate / 2).toFixed(1)}%)`,
      formatINR(taxable + tax),
    ];
  });

  autoTable(doc, {
    startY: 155,
    head: [["Description", "SAC", "Qty", "Rate", "Taxable", "CGST", "SGST", "Total"]],
    body,
    styles: { fontSize: 8, cellPadding: 5 },
    headStyles: { fillColor: [92, 42, 58] },
    theme: "grid",
  });

  const finalY = doc.lastAutoTable.finalY + 15;
  doc.setFontSize(9);
  doc.text(`Subtotal: ${formatINR(bill.subtotal)}`, pageWidth - 40, finalY, { align: "right" });
  doc.text(`CGST: ${formatINR(bill.cgst)}`, pageWidth - 40, finalY + 13, { align: "right" });
  doc.text(`SGST: ${formatINR(bill.sgst)}`, pageWidth - 40, finalY + 26, { align: "right" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(`Grand Total: ${formatINR(bill.total)}`, pageWidth - 40, finalY + 44, { align: "right" });

  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.text(numberToWordsINR(bill.total), 40, finalY + 44);

  doc.setFont("helvetica", "normal");
  doc.text(`Paid via ${bill.paymentMethod}. This is a computer-generated tax invoice.`, 40, finalY + 62);

  doc.save(`Invoice_${bill.invoiceNumber.replace(/\//g, "-")}.pdf`);
}
