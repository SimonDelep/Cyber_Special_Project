"use client";

type InvoiceDownloadProps = {
  orderId: string;
  orderNumber: string;
};

export function InvoiceDownload({ orderId, orderNumber }: InvoiceDownloadProps) {
  function handleDownload() {
    window.open(`/api/orders/${orderId}/invoice`, "_blank");
  }

  return (
    <div className="rounded-2xl border border-accent/30 bg-accent/5 p-6">
      <p className="font-semibold text-accent">Order confirmed</p>
      <p className="mt-1 text-sm text-muted">
        Invoice <span className="font-mono">{orderNumber}</span>
      </p>
      <button
        type="button"
        onClick={handleDownload}
        className="mt-4 inline-flex items-center gap-2 rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-dark"
      >
        <span aria-hidden>📄</span>
        Download invoice (PDF)
      </button>
    </div>
  );
}
