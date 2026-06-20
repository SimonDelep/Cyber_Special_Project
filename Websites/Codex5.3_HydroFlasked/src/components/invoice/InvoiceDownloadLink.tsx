type InvoiceDownloadLinkProps = {
  orderId: string;
  invoiceNumber: string;
  className?: string;
};

export function InvoiceDownloadLink({
  orderId,
  invoiceNumber,
  className = "",
}: InvoiceDownloadLinkProps) {
  return (
    <a
      href={`/api/invoices/${orderId}/pdf`}
      download={`invoice-${invoiceNumber}.pdf`}
      className={
        className ||
        "inline-flex items-center justify-center rounded-full border border-brand-500/40 bg-brand-500/10 px-5 py-2.5 text-sm font-semibold text-brand-300 transition hover:bg-brand-500/20 hover:text-brand-200"
      }
    >
      Download invoice (PDF)
    </a>
  );
}
