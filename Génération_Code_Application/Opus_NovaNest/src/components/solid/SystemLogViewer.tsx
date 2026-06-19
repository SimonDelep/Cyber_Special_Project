import { createSignal, For, onMount, Show } from 'solid-js';
import { EVENT_CATEGORY, EVENT_OUTCOME } from '../../lib/events/constants';

interface SystemEvent {
  id: number;
  category: string;
  action: string;
  outcome: string;
  userId: number | null;
  username: string | null;
  ipAddress: string | null;
  requestPath: string | null;
  requestMethod: string | null;
  message: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

const CATEGORY_OPTIONS = [
  { value: '', label: 'All categories' },
  { value: EVENT_CATEGORY.AUTH, label: 'Authentication' },
  { value: EVENT_CATEGORY.PROFILE, label: 'Profile' },
  { value: EVENT_CATEGORY.TRANSACTION, label: 'Transactions' },
  { value: EVENT_CATEGORY.ADMIN, label: 'Admin' },
];

const OUTCOME_OPTIONS = [
  { value: '', label: 'All outcomes' },
  { value: EVENT_OUTCOME.SUCCESS, label: 'Success' },
  { value: EVENT_OUTCOME.FAILURE, label: 'Failure' },
  { value: EVENT_OUTCOME.DENIED, label: 'Denied' },
];

function outcomeClass(outcome: string): string {
  if (outcome === EVENT_OUTCOME.SUCCESS) return 'bg-accent/20 text-accent';
  if (outcome === EVENT_OUTCOME.DENIED) return 'bg-amber-500/20 text-amber-300';
  return 'bg-red-500/20 text-red-300';
}

export default function SystemLogViewer() {
  const [events, setEvents] = createSignal<SystemEvent[]>([]);
  const [loading, setLoading] = createSignal(true);
  const [category, setCategory] = createSignal('');
  const [outcome, setOutcome] = createSignal('');
  const [limit, setLimit] = createSignal('100');

  async function fetchEvents() {
    setLoading(true);
    const params = new URLSearchParams();
    if (category()) params.set('category', category());
    if (outcome()) params.set('outcome', outcome());
    params.set('limit', limit() || '100');

    try {
      const res = await fetch(`/api/admin/events?${params.toString()}`);
      const json = await res.json();
      if (res.ok) setEvents(json.events);
    } finally {
      setLoading(false);
    }
  }

  onMount(() => fetchEvents());

  const inputClass =
    'rounded-lg border border-white/10 bg-nest-900 px-3 py-2 text-sm text-white focus:border-accent/50 focus:outline-none';

  return (
    <div class="space-y-6">
      <div>
        <h2 class="font-display text-xl font-semibold text-white">System log</h2>
        <p class="mt-1 text-sm text-nest-100/60">
          Internal audit trail for logins, profile changes, checkouts, and admin actions.
        </p>
      </div>

      <form
        class="flex flex-wrap items-end gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          fetchEvents();
        }}
      >
        <label class="space-y-1 text-sm">
          <span class="text-nest-100/70">Category</span>
          <select class={inputClass} value={category()} onChange={(e) => setCategory(e.currentTarget.value)}>
            <For each={CATEGORY_OPTIONS}>{(o) => <option value={o.value}>{o.label}</option>}</For>
          </select>
        </label>
        <label class="space-y-1 text-sm">
          <span class="text-nest-100/70">Outcome</span>
          <select class={inputClass} value={outcome()} onChange={(e) => setOutcome(e.currentTarget.value)}>
            <For each={OUTCOME_OPTIONS}>{(o) => <option value={o.value}>{o.label}</option>}</For>
          </select>
        </label>
        <label class="space-y-1 text-sm">
          <span class="text-nest-100/70">Limit</span>
          <select class={inputClass} value={limit()} onChange={(e) => setLimit(e.currentTarget.value)}>
            <option value="50">50</option>
            <option value="100">100</option>
            <option value="250">250</option>
            <option value="500">500</option>
          </select>
        </label>
        <button
          type="submit"
          class="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-nest-950 hover:bg-accent/90"
        >
          Refresh
        </button>
      </form>

      <Show
        when={!loading()}
        fallback={<p class="text-sm text-nest-100/60">Loading events…</p>}
      >
        <Show
          when={events().length > 0}
          fallback={
            <p class="rounded-xl border border-dashed border-white/20 p-8 text-center text-sm text-nest-100/60">
              No events match the selected filters.
            </p>
          }
        >
          <div class="overflow-x-auto rounded-2xl border border-white/10">
            <table class="w-full min-w-[720px] text-left text-sm">
              <thead class="border-b border-white/10 bg-nest-900/80 text-nest-100/70">
                <tr>
                  <th class="px-3 py-3 font-medium">Time</th>
                  <th class="px-3 py-3 font-medium">Category</th>
                  <th class="px-3 py-3 font-medium">Action</th>
                  <th class="px-3 py-3 font-medium">Outcome</th>
                  <th class="px-3 py-3 font-medium">User</th>
                  <th class="px-3 py-3 font-medium">Message</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-white/10">
                <For each={events()}>
                  {(ev) => (
                    <tr class="bg-nest-900/30 align-top">
                      <td class="whitespace-nowrap px-3 py-3 text-nest-100/60">
                        {new Date(ev.createdAt).toLocaleString()}
                      </td>
                      <td class="px-3 py-3 text-nest-100/80">{ev.category}</td>
                      <td class="px-3 py-3 font-mono text-xs text-nest-100/70">{ev.action}</td>
                      <td class="px-3 py-3">
                        <span
                          class={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${outcomeClass(ev.outcome)}`}
                        >
                          {ev.outcome}
                        </span>
                      </td>
                      <td class="px-3 py-3 text-nest-100/70">
                        {ev.username ? `@${ev.username}` : '—'}
                        <Show when={ev.ipAddress}>
                          <span class="mt-0.5 block text-xs text-nest-100/40">{ev.ipAddress}</span>
                        </Show>
                      </td>
                      <td class="px-3 py-3">
                        <p class="text-nest-100/90">{ev.message}</p>
                        <Show when={ev.requestPath}>
                          <p class="mt-1 font-mono text-xs text-nest-100/40">
                            {ev.requestMethod} {ev.requestPath}
                          </p>
                        </Show>
                        <Show when={ev.metadata && Object.keys(ev.metadata!).length > 0}>
                          <pre class="mt-2 max-h-24 overflow-auto rounded bg-nest-950/80 p-2 text-xs text-nest-100/50">
                            {JSON.stringify(ev.metadata, null, 2)}
                          </pre>
                        </Show>
                      </td>
                    </tr>
                  )}
                </For>
              </tbody>
            </table>
          </div>
        </Show>
      </Show>
    </div>
  );
}
