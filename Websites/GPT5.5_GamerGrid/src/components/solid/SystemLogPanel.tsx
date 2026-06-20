import { createSignal, For, Show } from 'solid-js';
import type { SystemEventDTO } from '@/lib/monitoring/types';

type Filters = {
  category: string;
  severity: string;
  status: string;
  q: string;
};

const emptyFilters = (): Filters => ({
  category: '',
  severity: '',
  status: '',
  q: '',
});

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString();
}

function severityClass(severity: string): string {
  if (severity === 'error') return 'text-red-300 bg-red-950/50 border-red-500/30';
  if (severity === 'warning') return 'text-amber-200 bg-amber-950/40 border-amber-500/30';
  return 'text-stream-300 bg-stream-500/10 border-stream-500/30';
}

export default function SystemLogPanel() {
  const [events, setEvents] = createSignal<SystemEventDTO[]>([]);
  const [total, setTotal] = createSignal(0);
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal<string | null>(null);
  const [filters, setFilters] = createSignal<Filters>(emptyFilters());
  const [offset, setOffset] = createSignal(0);
  const pageSize = 30;

  const loadEvents = async (nextOffset = 0, override?: Filters) => {
    setLoading(true);
    setError(null);
    const f = override ?? filters();
    const params = new URLSearchParams({
      limit: String(pageSize),
      offset: String(nextOffset),
    });
    if (f.category) params.set('category', f.category);
    if (f.severity) params.set('severity', f.severity);
    if (f.status) params.set('status', f.status);
    if (f.q.trim()) params.set('q', f.q.trim());

    try {
      const res = await fetch(`/api/admin/events?${params}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Failed to load events.');
      setEvents(json.events);
      setTotal(json.total);
      setOffset(nextOffset);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load events.');
    } finally {
      setLoading(false);
    }
  };

  loadEvents(0);

  const applyFilters = (e: Event) => {
    e.preventDefault();
    loadEvents(0);
  };

  const clearFilters = () => {
    const cleared = emptyFilters();
    setFilters(cleared);
    loadEvents(0, cleared);
  };

  const pageStart = () => offset() + 1;
  const pageEnd = () => Math.min(offset() + events().length, total());

  return (
    <div class="space-y-6">
      <form
        class="grid gap-4 rounded-2xl border border-white/10 bg-slate-900/50 p-4 sm:grid-cols-2 lg:grid-cols-5"
        onSubmit={applyFilters}
      >
        <label class="block text-sm">
          <span class="text-slate-400">Category</span>
          <select
            class="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-white"
            value={filters().category}
            onChange={(e) => setFilters((f) => ({ ...f, category: e.currentTarget.value }))}
          >
            <option value="">All</option>
            <option value="auth">Auth</option>
            <option value="profile">Profile</option>
            <option value="transaction">Transaction</option>
            <option value="admin">Admin</option>
          </select>
        </label>
        <label class="block text-sm">
          <span class="text-slate-400">Severity</span>
          <select
            class="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-white"
            value={filters().severity}
            onChange={(e) => setFilters((f) => ({ ...f, severity: e.currentTarget.value }))}
          >
            <option value="">All</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
          </select>
        </label>
        <label class="block text-sm">
          <span class="text-slate-400">Status</span>
          <select
            class="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-white"
            value={filters().status}
            onChange={(e) => setFilters((f) => ({ ...f, status: e.currentTarget.value }))}
          >
            <option value="">All</option>
            <option value="success">Success</option>
            <option value="failure">Failure</option>
          </select>
        </label>
        <label class="block text-sm lg:col-span-2">
          <span class="text-slate-400">Search</span>
          <input
            type="search"
            placeholder="Message, user, or action…"
            class="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-white"
            value={filters().q}
            onInput={(e) => setFilters((f) => ({ ...f, q: e.currentTarget.value }))}
          />
        </label>
        <div class="flex items-end gap-2 sm:col-span-2 lg:col-span-5">
          <button
            type="submit"
            class="rounded-full bg-volt-600 px-4 py-2 text-sm font-medium text-white hover:bg-volt-500"
          >
            Apply filters
          </button>
          <button
            type="button"
            class="rounded-full border border-white/15 px-4 py-2 text-sm text-slate-300 hover:bg-white/5"
            onClick={clearFilters}
          >
            Clear
          </button>
          <button
            type="button"
            class="rounded-full border border-white/15 px-4 py-2 text-sm text-slate-300 hover:bg-white/5"
            onClick={() => loadEvents(offset())}
          >
            Refresh
          </button>
        </div>
      </form>

      <Show when={error()}>
        <p class="rounded-lg border border-red-500/30 bg-red-950/40 px-4 py-3 text-sm text-red-200">
          {error()}
        </p>
      </Show>

      <p class="text-sm text-slate-500">
        {total() === 0
          ? 'No events recorded yet.'
          : `Showing ${pageStart()}–${pageEnd()} of ${total()} events`}
      </p>

      <Show when={loading() && events().length === 0}>
        <p class="text-slate-400">Loading system log…</p>
      </Show>

      <div class="overflow-x-auto rounded-2xl border border-white/10 bg-slate-900/50">
        <table class="w-full min-w-[900px] text-left text-sm">
          <thead class="border-b border-white/10 bg-slate-900/80 text-slate-400">
            <tr>
              <th class="px-4 py-3 font-medium">Time</th>
              <th class="px-4 py-3 font-medium">Category</th>
              <th class="px-4 py-3 font-medium">Action</th>
              <th class="px-4 py-3 font-medium">User</th>
              <th class="px-4 py-3 font-medium">Message</th>
              <th class="px-4 py-3 font-medium">IP</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/5">
            <For each={events()}>
              {(event) => (
                <tr class="align-top hover:bg-white/5">
                  <td class="whitespace-nowrap px-4 py-3 text-xs text-slate-400">
                    {formatTime(event.createdAt)}
                  </td>
                  <td class="px-4 py-3 capitalize text-slate-300">{event.category}</td>
                  <td class="px-4 py-3">
                    <span
                      class:list={[
                        'inline-block rounded-full border px-2 py-0.5 text-xs font-medium capitalize',
                        severityClass(event.severity),
                      ]}
                    >
                      {event.status}
                    </span>
                    <p class="mt-1 font-mono text-xs text-slate-500">{event.action}</p>
                  </td>
                  <td class="px-4 py-3 text-slate-300">
                    {event.username ? (
                      <>
                        <span class="text-white">@{event.username}</span>
                        <Show when={event.userId}>
                          <p class="font-mono text-xs text-slate-600">{event.userId}</p>
                        </Show>
                      </>
                    ) : (
                      <span class="text-slate-600">—</span>
                    )}
                  </td>
                  <td class="max-w-xs px-4 py-3 text-slate-200">
                    <p>{event.message}</p>
                    <Show when={event.metadata && Object.keys(event.metadata).length > 0}>
                      <pre class="mt-2 max-h-24 overflow-auto rounded bg-black/30 p-2 font-mono text-xs text-slate-500">
                        {JSON.stringify(event.metadata, null, 2)}
                      </pre>
                    </Show>
                  </td>
                  <td class="px-4 py-3 font-mono text-xs text-slate-500">
                    {event.ipAddress ?? '—'}
                  </td>
                </tr>
              )}
            </For>
          </tbody>
        </table>
      </div>

      <div class="flex justify-between gap-4">
        <button
          type="button"
          disabled={offset() === 0 || loading()}
          class="rounded-full border border-white/15 px-4 py-2 text-sm text-slate-300 hover:bg-white/5 disabled:opacity-40"
          onClick={() => loadEvents(Math.max(0, offset() - pageSize))}
        >
          ← Previous
        </button>
        <button
          type="button"
          disabled={offset() + pageSize >= total() || loading()}
          class="rounded-full border border-white/15 px-4 py-2 text-sm text-slate-300 hover:bg-white/5 disabled:opacity-40"
          onClick={() => loadEvents(offset() + pageSize)}
        >
          Next →
        </button>
      </div>
    </div>
  );
}
