import { createSignal, For, onMount, Show } from "solid-js";
import type { SystemEventView } from "@/lib/monitoring/types";
import { eventStatuses, eventTypes } from "@/lib/monitoring/types";

const statusStyles: Record<string, string> = {
  success: "bg-brand-100 text-brand-800",
  failure: "bg-red-50 text-red-800",
  info: "bg-slate-100 text-slate-700",
};

function formatMeta(meta: Record<string, unknown> | null): string {
  if (!meta || Object.keys(meta).length === 0) return "—";
  return JSON.stringify(meta);
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function AdminEventsPanel() {
  const [events, setEvents] = createSignal<SystemEventView[]>([]);
  const [total, setTotal] = createSignal(0);
  const [failures24h, setFailures24h] = createSignal(0);
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal("");

  const [eventType, setEventType] = createSignal("");
  const [status, setStatus] = createSignal("");
  const [userId, setUserId] = createSignal("");

  async function loadEvents() {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      params.set("limit", "100");
      if (eventType()) params.set("eventType", eventType());
      if (status()) params.set("status", status());
      if (userId().trim()) params.set("userId", userId().trim());

      const res = await fetch(`/api/admin/events?${params}`);
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Failed to load events.");
        return;
      }
      setEvents(json.events ?? []);
      setTotal(json.total ?? 0);
      setFailures24h(json.stats?.failures24h ?? 0);
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }

  onMount(loadEvents);

  return (
    <div>
      <div class="grid gap-4 sm:grid-cols-3">
        <div class="rounded-xl border border-brand-100 bg-brand-50/50 p-4">
          <p class="text-sm text-muted">Events (filtered)</p>
          <p class="mt-1 font-display text-2xl font-semibold text-ink">
            {total()}
          </p>
        </div>
        <div class="rounded-xl border border-brand-100 bg-white p-4">
          <p class="text-sm text-muted">Failures (last 24h)</p>
          <p class="mt-1 font-display text-2xl font-semibold text-red-700">
            {failures24h()}
          </p>
        </div>
        <div class="rounded-xl border border-brand-100 bg-white p-4">
          <p class="text-sm text-muted">Showing</p>
          <p class="mt-1 font-display text-2xl font-semibold text-ink">
            {events().length}
          </p>
        </div>
      </div>

      <form
        class="mt-6 flex flex-wrap items-end gap-3 rounded-xl border border-brand-100 bg-white p-4"
        onSubmit={(e) => {
          e.preventDefault();
          loadEvents();
        }}
      >
        <label class="flex flex-col gap-1 text-sm">
          <span class="font-medium text-ink">Event type</span>
          <select
            class="rounded-lg border border-brand-200 px-3 py-2"
            value={eventType()}
            onChange={(e) => setEventType(e.currentTarget.value)}
          >
            <option value="">All types</option>
            <For each={[...eventTypes]}>
              {(t) => <option value={t}>{t}</option>}
            </For>
          </select>
        </label>
        <label class="flex flex-col gap-1 text-sm">
          <span class="font-medium text-ink">Status</span>
          <select
            class="rounded-lg border border-brand-200 px-3 py-2"
            value={status()}
            onChange={(e) => setStatus(e.currentTarget.value)}
          >
            <option value="">All statuses</option>
            <For each={[...eventStatuses]}>
              {(s) => <option value={s}>{s}</option>}
            </For>
          </select>
        </label>
        <label class="flex flex-col gap-1 text-sm">
          <span class="font-medium text-ink">User ID</span>
          <input
            type="number"
            min="1"
            class="w-28 rounded-lg border border-brand-200 px-3 py-2"
            placeholder="Any"
            value={userId()}
            onInput={(e) => setUserId(e.currentTarget.value)}
          />
        </label>
        <button
          type="submit"
          class="rounded-full bg-brand-700 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60"
          disabled={loading()}
        >
          {loading() ? "Loading…" : "Apply filters"}
        </button>
        <button
          type="button"
          class="rounded-full border border-brand-200 px-5 py-2 text-sm font-semibold text-brand-800 hover:bg-brand-50"
          onClick={async () => {
            setEventType("");
            setStatus("");
            setUserId("");
            setLoading(true);
            setError("");
            try {
              const res = await fetch("/api/admin/events?limit=100");
              const json = await res.json();
              if (!res.ok) {
                setError(json.error ?? "Failed to load events.");
                return;
              }
              setEvents(json.events ?? []);
              setTotal(json.total ?? 0);
              setFailures24h(json.stats?.failures24h ?? 0);
            } catch {
              setError("Network error.");
            } finally {
              setLoading(false);
            }
          }}
        >
          Reset
        </button>
      </form>

      <Show when={error()}>
        <p class="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error()}
        </p>
      </Show>

      <div class="mt-6 overflow-x-auto rounded-xl border border-brand-100 bg-white">
        <table class="min-w-full text-left text-sm">
          <thead class="border-b border-brand-100 bg-brand-50/80 text-xs uppercase tracking-wide text-muted">
            <tr>
              <th class="px-4 py-3">Time</th>
              <th class="px-4 py-3">Type</th>
              <th class="px-4 py-3">Status</th>
              <th class="px-4 py-3">Actor</th>
              <th class="px-4 py-3">Message</th>
              <th class="px-4 py-3">IP</th>
              <th class="px-4 py-3">Details</th>
            </tr>
          </thead>
          <tbody>
            <Show
              when={!loading() && events().length > 0}
              fallback={
                <tr>
                  <td class="px-4 py-8 text-muted" colSpan={7}>
                    {loading() ? "Loading events…" : "No events match these filters."}
                  </td>
                </tr>
              }
            >
              <For each={events()}>
                {(ev) => (
                  <tr class="border-b border-brand-50 align-top hover:bg-brand-50/30">
                    <td class="whitespace-nowrap px-4 py-3 text-muted">
                      {formatTime(ev.createdAt)}
                    </td>
                    <td class="px-4 py-3 font-mono text-xs text-brand-800">
                      {ev.eventType}
                    </td>
                    <td class="px-4 py-3">
                      <span
                        class={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${statusStyles[ev.status] ?? ""}`}
                      >
                        {ev.status}
                      </span>
                    </td>
                    <td class="px-4 py-3">
                      {ev.actorLabel ?? "—"}
                      <Show when={ev.userId}>
                        <span class="block text-xs text-muted">id {ev.userId}</span>
                      </Show>
                    </td>
                    <td class="max-w-xs px-4 py-3 text-ink">{ev.message}</td>
                    <td class="px-4 py-3 font-mono text-xs text-muted">
                      {ev.ipAddress ?? "—"}
                    </td>
                    <td class="max-w-[12rem] truncate px-4 py-3 font-mono text-xs text-muted" title={formatMeta(ev.metadata)}>
                      {formatMeta(ev.metadata)}
                    </td>
                  </tr>
                )}
              </For>
            </Show>
          </tbody>
        </table>
      </div>
    </div>
  );
}
