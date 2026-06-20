import { createSignal, For, Show } from 'solid-js';
import { formatPrice } from '../../lib/format';
import { downloadInvoicePdf } from '../../lib/invoices/download';

interface OrderItem {
  productName: string;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
}

interface Props {
  orderId: number;
  invoiceNumber: string;
  invoiceUrl: string;
  totalCents: number;
  createdAt: string;
  items: OrderItem[];
  newBalanceCents: number;
}

export default function OrderConfirmation(props: Props) {
  const [downloading, setDownloading] = createSignal(false);
  const [downloadError, setDownloadError] = createSignal<string | null>(null);
  const [downloaded, setDownloaded] = createSignal(false);

  async function handleDownload() {
    setDownloading(true);
    setDownloadError(null);
    try {
      await downloadInvoicePdf(
        props.invoiceUrl,
        `${props.invoiceNumber}.pdf`,
      );
      setDownloaded(true);
    } catch (err) {
      setDownloadError(
        err instanceof Error ? err.message : 'Download failed.',
      );
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div class="space-y-8">
      <div class="rounded-2xl border border-accent/30 bg-accent/10 p-6 sm:p-8">
        <p class="text-sm font-medium text-accent">Order confirmed</p>
        <h1 class="mt-2 font-display text-3xl font-bold text-white">Thank you for your purchase</h1>
        <p class="mt-2 text-nest-100/70">
          Invoice <span class="font-mono text-white">{props.invoiceNumber}</span>
          {' · '}
          {new Date(props.createdAt).toLocaleString()}
        </p>
        <p class="mt-4 font-display text-2xl font-semibold text-white">
          Total: {formatPrice(props.totalCents)}
        </p>
        <p class="mt-1 text-sm text-nest-100/60">
          New account balance: {formatPrice(props.newBalanceCents)}
        </p>

        <div class="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={downloading()}
            onClick={handleDownload}
            class="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-nest-950 transition hover:bg-accent/90 disabled:opacity-50"
          >
            {downloading()
              ? 'Preparing PDF…'
              : downloaded()
                ? 'Download PDF again'
                : 'Download PDF invoice'}
          </button>
          <a
            href="/profile"
            class="rounded-full border border-white/20 px-6 py-3 text-sm font-medium text-white transition hover:border-accent/50"
          >
            View order history
          </a>
          <a
            href="/catalog"
            class="rounded-full border border-white/20 px-6 py-3 text-sm font-medium text-white transition hover:border-accent/50"
          >
            Continue shopping
          </a>
        </div>

        <Show when={downloadError()}>
          <p class="mt-4 text-sm text-red-300" role="alert">
            {downloadError()}
          </p>
        </Show>
        <Show when={downloaded() && !downloadError()}>
          <p class="mt-4 text-sm text-accent">
            Invoice downloaded. You can also find it anytime under Profile → Order history.
          </p>
        </Show>
      </div>

      <section class="rounded-2xl border border-white/10 bg-nest-900/50 p-6">
        <h2 class="font-display text-lg font-semibold text-white">Order summary</h2>
        <ul class="mt-4 divide-y divide-white/10">
          <For each={props.items}>
            {(item) => (
              <li class="flex justify-between gap-4 py-3 text-sm">
                <span class="text-nest-100/90">
                  {item.productName} × {item.quantity}
                </span>
                <span class="shrink-0 font-medium text-white">
                  {formatPrice(item.lineTotalCents)}
                </span>
              </li>
            )}
          </For>
        </ul>
      </section>
    </div>
  );
}
