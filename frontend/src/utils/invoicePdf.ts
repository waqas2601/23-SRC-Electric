type InvoicePdfItem = {
  productName: string;
  sku?: string;
  modelLabel?: string | null;
  quantity: number;
  boxQty?: number | null;
  unitPrice: number;
  lineTotal: number;
  type?: "direct" | "model";
};

export type InvoicePdfData = {
  invoiceNo: string;
  invoiceDate: string;
  customerName: string;
  subtotal: number;
  discount: number;
  total: number;
  paidAmount?: number;
  remainingAmount?: number;
  notes?: string;
  items: InvoicePdfItem[];
};

// ── Logo caching ─────────────────────────────────────────────────────────────

let logo1Cache: string | null = null;
let logo2Cache: string | null = null;

async function fetchDataUrl(path: string): Promise<string> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load ${path}`);
  const blob = await res.blob();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error(`Failed to read ${path}`));
    reader.readAsDataURL(blob);
  });
}

async function getLogos(): Promise<[string | null, string | null]> {
  const [l1, l2] = await Promise.all([
    logo1Cache ? Promise.resolve(logo1Cache) : fetchDataUrl("/logo.png").catch(() => null),
    logo2Cache ? Promise.resolve(logo2Cache) : fetchDataUrl("/logo2.png").catch(() => null),
  ]);
  logo1Cache = l1;
  logo2Cache = l2;
  return [l1, l2];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function modelDisplayName(sku: string | undefined): string {
  if (!sku) return "—";
  const prefix = sku.split("-")[0].toUpperCase();
  switch (prefix) {
    case "AS": return "A Series";
    case "KS": return "K Series";
    case "RS": return "R Series";
    case "US": return "Unique Series";
    default:   return sku;
  }
}

function formatMoney(value: number): string {
  return `PKR ${value.toLocaleString()}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-PK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ── HTML builder ──────────────────────────────────────────────────────────────

function buildHtml(
  data: InvoicePdfData,
  logo1: string | null,
  logo2: string | null,
): string {
  const date = data.invoiceDate ? formatDate(data.invoiceDate) : "";
  const discount = data.discount ?? 0;
  const paidAmount = data.paidAmount ?? 0;

  const logoImg = (src: string | null, alt: string) =>
    src
      ? `<img src="${src}" alt="${alt}" class="logo-img" />`
      : `<div class="logo-placeholder">${alt}</div>`;

  // Split items by type — infer from type field, fall back to sku presence
  const modelItems = data.items.filter((i) => (i.type ?? (i.sku ? "model" : "direct")) === "model");
  const directItems = data.items.filter((i) => (i.type ?? (i.sku ? "model" : "direct")) === "direct");
  const hasBoth = modelItems.length > 0 && directItems.length > 0;
  const modelSubtotal = modelItems.reduce((s, i) => s + i.lineTotal, 0);
  const directSubtotal = directItems.reduce((s, i) => s + i.lineTotal, 0);
  const modelNet = modelSubtotal - discount;

  const renderRows = (items: InvoicePdfItem[], startIdx: number) =>
    items.map((item, i) => `
      <tr class="${(startIdx + i) % 2 === 1 ? "row-alt" : ""}">
        <td class="center">${startIdx + i + 1}</td>
        <td>${item.productName}</td>
        <td>${item.type === "direct" ? "—" : (item.modelLabel ?? modelDisplayName(item.sku))}</td>
        <td class="center">${item.boxQty != null ? item.boxQty : "—"}</td>
        <td class="center">${item.quantity}</td>
        <td class="right">${formatMoney(item.unitPrice)}</td>
        <td class="right bold">${formatMoney(item.lineTotal)}</td>
      </tr>`).join("");

  // Single-section layout (no direct items — same as before)
  const singleSectionTable = !hasBoth ? `
  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th class="center" style="width:34px">S.No</th>
          <th>Item</th>
          <th>Model</th>
          <th class="center" style="width:54px">Box Qty</th>
          <th class="center" style="width:44px">Qty</th>
          <th class="right" style="width:108px">Unit Price</th>
          <th class="right" style="width:108px">Amount</th>
        </tr>
      </thead>
      <tbody>${renderRows(data.items, 0)}</tbody>
      <tbody>
        <tr><td colspan="7" style="padding:0;border:none;height:6px;"></td></tr>
        <tr class="sum-row sum-row-divider">
          <td class="center">${data.items.length + 1}</td>
          <td colspan="5" class="sum-label-left">List Total</td>
          <td class="right bold">${formatMoney(data.subtotal)}</td>
        </tr>
        ${discount > 0 ? `<tr class="sum-row">
          <td class="center">${data.items.length + 2}</td>
          <td colspan="5" class="sum-label-left">Discount</td>
          <td class="right red bold">&minus; ${formatMoney(discount)}</td>
        </tr>` : ""}
      </tbody>
    </table>
  </div>` : "";

  // Two-section layout (model items + direct items)
  // directStartIdx: continues S.No after model items + subtotal + discount? + net rows
  const directStartIdx = modelItems.length + 2 + (discount > 0 ? 1 : 0);
  const directTotalRowNo = directStartIdx + directItems.length + 1;

  const twoSectionTable = hasBoth ? `
  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th class="center" style="width:34px">S.No</th>
          <th>Item</th>
          <th>Model</th>
          <th class="center" style="width:54px">Box Qty</th>
          <th class="center" style="width:44px">Qty</th>
          <th class="right" style="width:108px">Unit Price</th>
          <th class="right" style="width:108px">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${renderRows(modelItems, 0)}
        <tr><td colspan="7" style="padding:0;border:none;height:4px;"></td></tr>
        <tr class="sum-row sum-row-divider">
          <td class="center">${modelItems.length + 1}</td>
          <td colspan="5" class="sum-label-left">Subtotal</td>
          <td class="right bold">${formatMoney(modelSubtotal)}</td>
        </tr>
        ${discount > 0 ? `<tr class="sum-row">
          <td class="center">${modelItems.length + 2}</td>
          <td colspan="5" class="sum-label-left">Discount</td>
          <td class="right red bold">&minus; ${formatMoney(discount)}</td>
        </tr>` : ""}
        <tr class="sum-row">
          <td class="center">${modelItems.length + (discount > 0 ? 3 : 2)}</td>
          <td colspan="5" class="sum-label-left" style="font-weight:700;color:#1a237e;">Net</td>
          <td class="right bold" style="color:#1a237e;">${formatMoney(modelNet)}</td>
        </tr>
      </tbody>
      <tbody>
        <tr><td colspan="7" style="padding:0;border:none;height:10px;"></td></tr>
        ${renderRows(directItems, directStartIdx)}
        <tr><td colspan="7" style="padding:0;border:none;height:4px;"></td></tr>
        <tr class="sum-row sum-row-divider">
          <td class="center">${directTotalRowNo}</td>
          <td colspan="5" class="sum-label-left" style="font-weight:700;color:#1a237e;">Direct Total</td>
          <td class="right bold" style="color:#1a237e;">${formatMoney(directSubtotal)}</td>
        </tr>
      </tbody>
    </table>
  </div>` : "";

  const notesSection = data.notes?.trim()
    ? `<div class="notes-box"><span class="notes-label">Notes</span> ${data.notes.trim()}</div>`
    : "";

  const paymentRows =
    paidAmount > 0
      ? `<div class="payment-rows">
          <div class="pay-row">
            <span class="pay-row-label">Paid</span>
            <span class="bold green">${formatMoney(paidAmount)}</span>
          </div>
          <div class="pay-row">
            <span class="pay-row-label">Remaining</span>
            <span class="bold ${(data.remainingAmount ?? 0) > 0 ? "red" : "green"}">${formatMoney(data.remainingAmount ?? 0)}</span>
          </div>
        </div>`
      : "";

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: Arial, sans-serif;
    font-size: 12px;
    color: #1a1a2e;
    background: #fff;
  }

  /* ─── Header Band ─── */
  .header-band {
    background: #ffffff;
    padding: 16px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 2px solid #eeeeee;
  }
  .logo-img {
    width: 130px;
    height: 130px;
    object-fit: contain;
    border-radius: 6px;
  }
  .logo-placeholder {
    width: 130px;
    height: 130px;
    background: #f5f5f5;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #999;
    font-size: 9px;
    font-weight: 700;
  }
  .header-center {
    flex: 1;
    text-align: center;
    padding: 0 14px;
  }
  .brand {
    font-size: 38px;
    font-weight: 900;
    color: #e8141c;
    letter-spacing: 4px;
    line-height: 1;
  }
  .traders {
    font-size: 12px;
    font-weight: 700;
    color: #333;
    letter-spacing: 8px;
    margin-top: 3px;
  }
  .contact {
    font-size: 11px;
    color: #555;
    margin-top: 8px;
  }
  .wa-icon { vertical-align: middle; margin-right: 3px; }

  /* ─── Red accent line ─── */
  .accent-line {
    height: 4px;
    background: linear-gradient(to right, #e8141c, #ff6b35, #e8141c);
  }

  /* ─── Meta Strip ─── */
  .meta-strip {
    background: #e8eaf6;
    padding: 10px 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 2px solid #c5cae9;
  }
  .meta-item { display: flex; flex-direction: column; gap: 1px; }
  .meta-label {
    font-size: 8px;
    font-weight: 700;
    color: #5c6bc0;
    letter-spacing: 0.8px;
    text-transform: uppercase;
  }
  .meta-value { font-size: 14px; font-weight: 800; color: #1a237e; }

  /* ─── Table ─── */
  .table-wrap { padding: 0 24px; margin-top: 0; }
  table { width: 100%; border-collapse: collapse; margin-top: 14px; }
  thead tr { background: #1a237e; }
  th {
    padding: 9px 10px;
    font-size: 10px;
    font-weight: 700;
    color: #fff;
    text-align: left;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }
  th.center, td.center { text-align: center; }
  th.right,  td.right  { text-align: right; }
  td {
    padding: 8px 10px;
    font-size: 12px;
    border-bottom: 1px solid #e8eaf6;
    color: #1a1a2e;
  }
  .row-alt td { background: #e8eaf6; }
  .bold { font-weight: 700; }

  /* ─── Summary section ─── */
  .sum-row td { border: none; padding: 8px 10px; }
  .sum-row-divider td { border-bottom: 1px solid #c5cae9; }
  .sum-label {
    text-align: right;
    font-size: 11px;
    font-weight: 600;
    color: #5c6bc0;
  }
  .sum-label-left {
    text-align: left;
    font-size: 11px;
    font-weight: 600;
    color: #5c6bc0;
  }

  .total-band {
    background: #1a237e;
    margin: 6px 24px 0;
    border-radius: 6px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 16px;
  }
  .total-label { font-size: 13px; font-weight: 700; color: #90caf9; letter-spacing: 0.5px; }
  .total-value { font-size: 20px; font-weight: 900; color: #fff; }

  /* ─── Payment rows ─── */
  .payment-rows { padding: 6px 24px 0; }
  .pay-row {
    display: flex;
    justify-content: space-between;
    padding: 3px 0;
    font-size: 12px;
  }
  .pay-row-label { color: #5c6bc0; font-weight: 600; }

  /* ─── Colors ─── */
  .red   { color: #c62828; }
  .green { color: #2e7d32; }

  /* ─── Notes ─── */
  .notes-box {
    margin: 14px 24px 0;
    padding: 10px 14px;
    background: #fff8e1;
    border-left: 3px solid #ffb300;
    border-radius: 4px;
    font-size: 11px;
    color: #555;
    line-height: 1.6;
  }
  .notes-label {
    font-weight: 700;
    color: #f57f17;
    text-transform: uppercase;
    font-size: 9px;
    letter-spacing: 0.5px;
    display: block;
    margin-bottom: 3px;
  }

  /* ─── Signature ─── */
  .sig-row {
    display: flex;
    justify-content: space-between;
    margin: 36px 24px 0;
  }
  .sig-box {
    width: 40%;
    padding-top: 6px;
    border-top: 1.5px solid #9fa8da;
    font-size: 9px;
    font-weight: 700;
    color: #7986cb;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }
  .sig-box.right { text-align: right; }

  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style>
</head>
<body>

  <!-- Header -->
  <div class="header-band">
    ${logoImg(logo1, "SRC")}
    <div class="header-center">
      <div class="brand">JAVED</div>
      <div class="traders">T R A D E R S</div>
      <div class="contact">Shafiq Ur Rehman &nbsp;<svg class="wa-icon" xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24"><path fill="#25D366" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>&nbsp;0333-8998646</div>
    </div>
    ${logoImg(logo2, "NON")}
  </div>
  <div class="accent-line"></div>

  <!-- Invoice meta -->
  <div class="meta-strip">
    <div class="meta-item">
      <span class="meta-label">Bill No.</span>
      <span class="meta-value">${data.invoiceNo}</span>
    </div>
    <div class="meta-item" style="text-align:center">
      <span class="meta-label">Customer</span>
      <span class="meta-value">${data.customerName}</span>
    </div>
    <div class="meta-item" style="text-align:right">
      <span class="meta-label">Date</span>
      <span class="meta-value">${date}</span>
    </div>
  </div>

  <!-- Line items -->
  ${singleSectionTable}
  ${twoSectionTable}

  <!-- Total band -->
  <div class="total-band">
    <span class="total-label">${hasBoth ? "GRAND TOTAL" : "NET TOTAL"}</span>
    <span class="total-value">${formatMoney(data.total)}</span>
  </div>

  ${paymentRows}

  ${notesSection}

  <!-- Signatures -->
  <div class="sig-row">
    <div class="sig-box">Customer Signature</div>
    <div class="sig-box right">Authorised Signature</div>
  </div>

</body>
</html>`;
}

// ── Public export ─────────────────────────────────────────────────────────────

export async function downloadInvoicePdf(data: InvoicePdfData): Promise<void> {
  const [logo1, logo2] = await getLogos();
  const html = buildHtml(data, logo1, logo2);

  const win = window.open("", "_blank", "width=900,height=700");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  win.onload = () => {
    win.print();
  };
  // Fallback — onload may have already fired by the time we assign it
  setTimeout(() => {
    try { win.print(); } catch { /* already printed */ }
  }, 800);
}
