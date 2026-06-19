import { createSignal, createEffect, Show, For } from 'solid-js';
import type { PublicSystemLog } from '@/lib/monitoring/types';

const inputClass =
  'mt-1 w-full rounded-lg border border-cork-300 bg-white px-3 py-2 text-sm text-cork-900 focus:border-cork-600 focus:outline-none focus:ring-1 focus:ring-cork-600';

const severityClass: Record<string, string> = {
  info: 'bg-cork-100 text-cork-700',
  warning: 'bg-amber-100 text-amber-800',
  error: 'bg-red-100 text-red-800',
};

const statusClass: Record<string, string> = {
  success: 'text-sage-600',
  failure: 'text-red-700',
};

export default function AdminSystemLogs() {
  const [logs, setLogs] = createSignal<PublicSystemLog[]>([]);
  const [total, setTotal] = createSignal(0);
  const [category, setCategory] = createSignal('all');
  const [status, setStatus] = createSignal('all');
  const [action, setAction] = createSignal('');
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal('');
  const [expandedId, setExpandedId] = createSignal<number | null>(null);

  async function load() {
    setLoading(true);
    setError('');
    const params = new URLSearchParams({ limit: '100', offset: '0' });
    if (category() !== 'all') params.set('category', category());
    if (status() !== 'all') params.set('status', status());
    if (action().trim()) params.set('action', action().trim());

    try {
      const res = await fetch(`/api/admin/logs?${params}`, {
        credentials: 'same-origin',
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed to load logs.');
        return;
      }
      setLogs(data.logs ?? []);
      setTotal(data.total ?? 0);
    } catch {
      setError('Could not load system logs.');
    } finally {
      setLoading(false);
    }
  }

  createEffect(() => {
    category();
    status();
    action();
    load();
  });

  return (
    <div class="space-y-6">
      <p class="text-sm text-cork-600">
        Internal audit trail for authentication, profile changes, checkout transactions, and admin actions.
      </p>

      <form
        class="rounded-2xl border border-cork-200 bg-cork-50/60 p-5"
        onSubmit={(e) => {
          e.preventDefault();
          load();
        }}
      >
        <div class="grid gap-4 sm:grid-cols-3">
          <div>
            <label for="log-category" class="text-xs font-medium text-cork-700">
              Category
            </label>
            <select
              id="log-category"
              class={inputClass}
              value={category()}
              onChange={(e) => setCategory(e.currentTarget.value)}
            >
              <option value="all">All</option>
              <option value="auth">Auth</option>
              <option value="profile">Profile</option>
              <option value="transaction">Transaction</option>
              <option value="admin">Admin</option>
              <option value="review">Review</option>
            </select>
          </div>
          <div>
            <label for="log-status" class="text-xs font-medium text-cork-700">
              Status
            </label>
            <select
              id="log-status"
              class={inputClass}
              value={status()}
              onChange={(e) => setStatus(e.currentTarget.value)}
            >
              <option value="all">All</option>
              <option value="success">Success</option>
              <option value="failure">Failure</option>
            </select>
          </div>
          <div>
            <label for="log-action" class="text-xs font-medium text-cork-700">
              Action contains
            </label>
            <input
              id="log-action"
              type="search"
              placeholder="e.g. login, checkout"
              class={inputClass}
              value={action()}
              onInput={(e) => setAction(e.currentTarget.value)}
            />
          </div>
        </div>
      </form>

      <Show when={loading()}>
        <p class="text-sm text-cork-500">Loading events…</p>
      </Show>

      <Show when={error()}>
        <p class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error()}</p>
      </Show>

      <Show when={!loading() && !error()}>
        <p class="text-xs text-cork-500">
          Showing {logs().length} of {total()} events (newest first)
        </p>

        <div class="overflow-x-auto rounded-2xl border border-cork-200 bg-white">
          <table class="w-full min-w-[720px] text-left text-sm">
            <thead class="border-b border-cork-200 bg-cork-50">
              <tr>
                <th class="px-4 py-3 font-medium">Time</th>
                <th class="px-4 py-3 font-medium">Action</th>
                <th class="px-4 py-3 font-medium">User</th>
                <th class="px-4 py-3 font-medium">Severity</th>
                <th class="px-4 py-3 font-medium">Status</th>
                <th class="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              <For each={logs()}>
                {(log) => (
                  <>
                    <tr class="border-b border-cork-100 hover:bg-cork-50/50">
                      <td class="whitespace-nowrap px-4 py-3 text-cork-600">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td class="px-4 py-3">
                        <span class="font-mono text-xs text-cork-800">{log.action}</span>
                        <p class="mt-0.5 max-w-xs truncate text-cork-600">{log.message}</p>
                      </td>
                      <td class="px-4 py-3 text-cork-700">
                        {log.username ?? '—'}
                      </td>
                      <td class="px-4 py-3">
                        <span
                          class={`inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize ${severityClass[log.severity] ?? ''}`}
                        >
                          {log.severity}
                        </span>
                      </td>
                      <td class={`px-4 py-3 font-medium capitalize ${statusClass[log.status] ?? ''}`}>
                        {log.status}
                      </td>
                      <td class="px-4 py-3 text-right">
                        <button
                          type="button"
                          class="text-xs font-medium text-cork-800 hover:underline"
                          onClick={() =>
                            setExpandedId(expandedId() === log.id ? null : log.id)
                          }
                        >
                          {expandedId() === log.id ? 'Hide' : 'Details'}
                        </button>
                      </td>
                    </tr>
                    <Show when={expandedId() === log.id}>
                      <tr class="border-b border-cork-100 bg-cork-50/80">
                        <td colspan="6" class="px-4 py-3 text-xs text-cork-600">
                          <dl class="grid gap-2 sm:grid-cols-2">
                            <div>
                              <dt class="font-medium text-cork-800">IP</dt>
                              <dd>{log.ipAddress ?? '—'}</dd>
                            </div>
                            <div>
                              <dt class="font-medium text-cork-800">User agent</dt>
                              <dd class="break-all">{log.userAgent ?? '—'}</dd>
                            </div>
                            <div class="sm:col-span-2">
                              <dt class="font-medium text-cork-800">Metadata</dt>
                              <dd>
                                <pre class="mt-1 overflow-x-auto rounded bg-white p-2 text-[11px]">
                                  {JSON.stringify(log.metadata ?? {}, null, 2)}
                                </pre>
                              </dd>
                            </div>
                          </dl>
                        </td>
                      </tr>
                    </Show>
                  </>
                )}
              </For>
            </tbody>
          </table>
        </div>

        <Show when={logs().length === 0}>
          <p class="py-8 text-center text-sm text-cork-500">No events match your filters.</p>
        </Show>
      </Show>
    </div>
  );
}
