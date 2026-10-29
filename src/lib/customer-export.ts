import type { Customer } from "@/lib/customers.schema";

export type CustomerRow = Customer & { serialNo: number };

export function withSerialNumbers(customers: Customer[]): CustomerRow[] {
  return customers.map((c, i) => ({
    ...c,
    serialNo: typeof c.serialNo === "number" ? c.serialNo : i + 1,
  }));
}

export function exportCustomersCsv(rows: CustomerRow[]) {
  const headers = ["Serial No", "Name", "VC No", "Address", "Phone"];
  const escape = (v: string) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [
    headers.join(","),
    ...rows.map((r) =>
      [r.serialNo, r.name, r.vcNo, r.address, r.phone].map((v) => escape(String(v))).join(","),
    ),
  ];
  const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
  triggerDownload(blob, `srinivasa-customers-${dateStamp()}.csv`);
}

export function exportCustomersJson(rows: CustomerRow[]) {
  const payload = rows.map((r) => ({
    serialNo: r.serialNo,
    name: r.name,
    vcNo: r.vcNo,
    address: r.address,
    phone: r.phone,
    image: r.image || "",
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }));
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  triggerDownload(blob, `srinivasa-customers-${dateStamp()}.json`);
}




export async function exportCustomersPdf(rows: CustomerRow[]) {
  const { default: jsPDF } = await import("jspdf");
  const autoTableMod = await import("jspdf-autotable");
  const autoTable = (autoTableMod as any).default ?? (autoTableMod as any).autoTable;

  const doc = new jsPDF({ unit: "pt", format: "a4", orientation: "landscape" });
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Srinivasa Cable Network", 40, 40);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Customer list • ${rows.length} records • ${new Date().toLocaleString()}`, 40, 58);
  doc.setTextColor(0);

  autoTable(doc, {
    startY: 78,
    head: [["S. No", "Name", "VC No", "Address", "Phone", "Photo"]],
    body: rows.map((r) => [
      String(r.serialNo),
      r.name,
      r.vcNo,
      r.address,
      r.phone,
      r.image ? "" : "-",
    ]),
    styles: { fontSize: 9, cellPadding: 6, valign: "middle", minCellHeight: 40 },
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    columnStyles: {
      0: { cellWidth: 40, halign: "center" },
      1: { cellWidth: 130 },
      2: { cellWidth: 100 },
      3: { cellWidth: 240 },
      4: { cellWidth: 90 },
      5: { cellWidth: 60, halign: "center" },
    },
    margin: { left: 40, right: 40 },
    didDrawCell: (data: any) => {
      if (data.section === "body" && data.column.index === 5) {
        const img = rows[data.row.index]?.image;
        if (img && img.startsWith("data:image/")) {
          const mime = img.slice(5, img.indexOf(";")).toLowerCase();
          const format = mime === "image/png"
            ? "PNG"
            : mime === "image/jpeg" || mime === "image/jpg"
              ? "JPEG"
              : null;
          if (!format) return; // skip unsupported (webp/svg/etc.) instead of corrupting the PDF
          const size = 32;
          const x = data.cell.x + (data.cell.width - size) / 2;
          const y = data.cell.y + (data.cell.height - size) / 2;
          try {
            doc.addImage(img, format, x, y, size, size);
          } catch {
            // ignore individual image render errors
          }
        }
      }
    },
  });

  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth - 40,
      doc.internal.pageSize.getHeight() - 20,
      { align: "right" },
    );
  }

  // Use blob output + our own download trigger. `doc.save()` relies on
  // internal FileSaver behavior that can produce truncated/corrupt files on
  // some browsers; a blob download is reliable everywhere.
  const blob = doc.output("blob");
  triggerDownload(blob, `srinivasa-customers-${dateStamp()}.pdf`);
}

function dateStamp() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
