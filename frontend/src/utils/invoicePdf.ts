import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

type InvoicePdfItem = {
  productName: string;
  sku?: string;
  quantity: number;
  boxQty?: number | null;
  unitPrice: number;
  lineTotal: number;
};

export type InvoicePdfData = {
  invoiceNo: string;
  invoiceDate: string;
  customerName: string;
  subtotal: number;
  discount: number;
  total: number;
  items: InvoicePdfItem[];
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function pkr(value: number) {
  return `PKR ${value.toLocaleString()}`;
}

let logoDataUrlCache: string | null = null;

async function getLogoDataUrl() {
  if (logoDataUrlCache) return logoDataUrlCache;

  const res = await fetch("/logo.png");
  if (!res.ok) {
    throw new Error("Failed to load logo");
  }

  const blob = await res.blob();
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Failed to read logo"));
    reader.readAsDataURL(blob);
  });

  logoDataUrlCache = dataUrl;
  return dataUrl;
}

function fitText(doc: jsPDF, text: string, maxWidth: number) {
  if (doc.getTextWidth(text) <= maxWidth) return text;

  let out = text;
  while (out.length > 0 && doc.getTextWidth(`${out}…`) > maxWidth) {
    out = out.slice(0, -1);
  }
  return `${out}…`;
}

export async function downloadInvoicePdf(data: InvoicePdfData) {
  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 22;
  const blue: [number, number, number] = [30, 44, 140];
  const grayBg: [number, number, number] = [242, 243, 248];
  const textDark: [number, number, number] = [22, 30, 56];
  const contentWidth = pageWidth - margin * 2;

  // Top badges
  doc.setFillColor(...grayBg);
  doc.roundedRect(margin, 20, 52, 52, 6, 6, "F");
  doc.roundedRect(pageWidth - margin - 52, 20, 52, 52, 6, 6, "F");

  try {
    const logoData = await getLogoDataUrl();
    doc.addImage(logoData, "PNG", margin + 6, 26, 40, 40);
    doc.addImage(logoData, "PNG", pageWidth - margin - 46, 26, 40, 40);
  } catch {
    // Fallback initials if logo is unavailable
  }

  doc.setTextColor(130, 137, 164);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("SRC", margin + 26, 50, { align: "center" });
  doc.text("NON", pageWidth - margin - 26, 50, { align: "center" });

  // Company block
  doc.setTextColor(220, 25, 38);
  doc.setFontSize(24);
  doc.text("JAVED", pageWidth / 2, 38, { align: "center" });

  doc.setTextColor(...textDark);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("T   R   A   D   E   R   S", pageWidth / 2, 54, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setTextColor(88, 96, 126);
  doc.setFontSize(9);
  doc.text("Shafiq Ur Rehman   WhatsApp 0333-8998646", pageWidth / 2, 68, {
    align: "center",
  });

  // Red separator
  doc.setDrawColor(220, 25, 38);
  doc.setLineWidth(2);
  doc.line(margin, 84, pageWidth - margin, 84);

  // Bill info strip
  doc.setFillColor(236, 238, 247);
  doc.rect(margin, 90, contentWidth, 46, "F");

  doc.setFont("helvetica", "bold");
  doc.setTextColor(120, 127, 156);
  doc.setFontSize(8);
  doc.text("BILL NO.", margin + 14, 106);
  doc.text("CUSTOMER", pageWidth / 2, 106, { align: "center" });
  doc.text("DATE", pageWidth - margin - 14, 106, { align: "right" });

  doc.setTextColor(...textDark);
  doc.setFontSize(16);
  doc.text(fitText(doc, data.invoiceNo, 140), margin + 14, 126);
  doc.text(fitText(doc, data.customerName, 210), pageWidth / 2, 126, {
    align: "center",
  });
  doc.text(
    fitText(doc, formatDate(data.invoiceDate), 130),
    pageWidth - margin - 14,
    126,
    {
      align: "right",
    },
  );

  const tableY = 150;

  autoTable(doc, {
    startY: tableY,
    margin: { left: margin, right: margin },
    head: [["NO.", "ITEM / MODEL", "QTY", "BOXES", "UNIT PRICE", "AMOUNT"]],
    body: data.items.map((item, idx) => [
      String(idx + 1),
      `${item.productName}${item.sku ? ` — ${item.sku}` : ""}`,
      String(item.quantity),
      item.boxQty === null || item.boxQty === undefined
        ? "—"
        : String(item.boxQty),
      pkr(item.unitPrice),
      pkr(item.lineTotal),
    ]),
    theme: "grid",
    styles: {
      font: "helvetica",
      fontSize: 10,
      cellPadding: 6,
      lineColor: [220, 223, 236],
      lineWidth: 0.6,
      textColor: textDark,
    },
    headStyles: {
      fillColor: blue,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 9,
      halign: "center",
    },
    alternateRowStyles: {
      fillColor: [242, 243, 248],
    },
    columnStyles: {
      0: { cellWidth: 32, halign: "center" },
      1: { cellWidth: 245 },
      2: { cellWidth: 44, halign: "center" },
      3: { cellWidth: 56, halign: "center" },
      4: { cellWidth: 92, halign: "right" },
      5: { cellWidth: 95, halign: "right", fontStyle: "bold" },
    },
    didParseCell: (hookData) => {
      if (hookData.section === "head") {
        if (hookData.column.index === 1) {
          hookData.cell.styles.halign = "left";
        } else if (hookData.column.index === 4 || hookData.column.index === 5) {
          hookData.cell.styles.halign = "right";
        } else {
          hookData.cell.styles.halign = "center";
        }
      }
    },
  });

  const finalY = (doc as any).lastAutoTable?.finalY ?? tableY + 100;

  // Right-side totals
  const rightX = pageWidth - margin - 210;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(115, 123, 153);
  doc.text("List Total", rightX, finalY + 28);
  doc.setTextColor(...textDark);
  doc.text(pkr(data.subtotal), pageWidth - margin - 4, finalY + 28, {
    align: "right",
  });

  doc.setTextColor(115, 123, 153);
  doc.text("Discount", rightX, finalY + 52);
  doc.setTextColor(220, 25, 38);
  doc.text(`- ${pkr(data.discount)}`, pageWidth - margin - 4, finalY + 52, {
    align: "right",
  });

  // Net total bar
  const netY = finalY + 66;
  doc.setFillColor(...blue);
  doc.roundedRect(margin, netY, pageWidth - margin * 2, 48, 5, 5, "F");

  doc.setTextColor(186, 201, 255);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("NET TOTAL", margin + 12, netY + 29);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.text(pkr(data.total), pageWidth - margin - 12, netY + 30, {
    align: "right",
  });

  // Signatures
  const signY = Math.min(netY + 72, pageHeight - 70);
  doc.setDrawColor(165, 173, 201);
  doc.setLineWidth(1);
  doc.line(margin, signY, margin + 285, signY);
  doc.line(pageWidth - margin - 285, signY, pageWidth - margin, signY);

  doc.setFontSize(10);
  doc.setTextColor(145, 153, 184);
  doc.text("CUSTOMER SIGNATURE", margin, signY + 16);
  doc.text("AUTHORISED SIGNATURE", pageWidth - margin, signY + 16, {
    align: "right",
  });

  doc.save(`invoice-${data.invoiceNo}.pdf`);
}
