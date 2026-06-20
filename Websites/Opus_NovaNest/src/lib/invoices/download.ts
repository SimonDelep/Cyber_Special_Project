/** Download a PDF invoice via fetch (keeps user on the current page). */
export async function downloadInvoicePdf(
  invoiceUrl: string,
  filename: string,
): Promise<void> {
  const res = await fetch(invoiceUrl, { credentials: 'include' });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(
      (json as { error?: string }).error ?? 'Could not download the invoice.',
    );
  }

  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}
