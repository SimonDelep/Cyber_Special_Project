interface InvoiceDownloadLinkProps {
  orderId: string;
  className?: string;
}

export function InvoiceDownloadLink({
  orderId,
  className = "",
}: InvoiceDownloadLinkProps) {
  return (
    <a
      href={`/api/orders/${orderId}/invoice`}
      download
      className={`inline-flex items-center justify-center rounded-full border border-zinc-600 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:border-cyan-500/50 hover:text-cyan-300 ${className}`}
    >
      Download invoice (PDF)
    </a>
  );
}
