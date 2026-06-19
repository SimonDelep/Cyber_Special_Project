import { createSignal, For, onMount, Show } from 'solid-js';
import { formatPrice } from '../../lib/format';
import { downloadInvoicePdf } from '../../lib/invoices/download';

interface OrderSummary {
  id: number;
  invoiceNumber: string;
  totalCents: number;
  createdAt: string;
}

export default function OrderHistory() {
  const [orders, setOrders] = createSignal<OrderSummary[]>([]);
  const [loading, setLoading] = createSignal(true);
  const [downloadingId, setDownloadingId] = createSignal<number | null>(null);
  const [error, setError] = createSignal<string | null>(null);

  onMount(async () => {
    try {
      const res = await fetch('/api/orders');
      const json = await res.json();
      if (res.ok) setOrders(json.orders);
    } finally {
      setLoading(false);
    }
  });

  async function handleDownload(order: OrderSummary) {
    setDownloadingId(order.id);
    setError(null);
    try {
      await downloadInvoicePdf(
        `/api/orders/${order.id}/invoice`,
        `${order.invoiceNumber}.pdf`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed.');
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <section class="rounded-2xl border border-white/10 bg-nest-900/50 p-6">
      <h2 class="font-display text-lg font-semibold text-white">Order history</h2>
      <p class="mt-1 text-sm text-nest-100/60">Download PDF invoices for past purchases.</p>

      <Show when={error()}>
        <p class="mt-3 text-sm text-red-300" role="alert">
          {error()}
        </p>
      </Show>

      <Show when={loading()}>
        <p class="mt-4 text-sm text-nest-100/60">Loading orders…</p>
      </Show>

      <Show when={!loading()}>
        <Show
          when={orders().length > 0}
          fallback={
            <p class="mt-4 text-sm text-nest-100/60">
              No orders yet. Complete a checkout to get an invoice.
            </p>
          }
        >
          <ul class="mt-4 divide-y divide-white/10">
            <For each={orders()}>
              {(order) => (
                <li class="flex flex-wrap items-center justify-between gap-3 py-4">
                  <div>
                    <p class="font-medium text-white">{order.invoiceNumber}</p>
                    <p class="text-sm text-nest-100/60">
                      {new Date(order.createdAt).toLocaleString()} ·{' '}
                      {formatPrice(order.totalCents)}
                    </p>
                  </div>
                  <div class="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={downloadingId() === order.id}
                      onClick={() => handleDownload(order)}
                      class="rounded-full border border-accent/40 px-4 py-2 text-sm font-medium text-accent transition hover:bg-accent/10 disabled:opacity-50"
                    >
                      {downloadingId() === order.id ? 'Downloading…' : 'Download PDF'}
                    </button>
                    <a
                      href={`/orders/${order.id}/confirmation`}
                      class="rounded-full border border-white/20 px-4 py-2 text-sm text-nest-100/80 transition hover:border-white/40"
                    >
                      View order
                    </a>
                  </div>
                </li>
              )}
            </For>
          </ul>
        </Show>
      </Show>
    </section>
  );
}
