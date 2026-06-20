import { createSignal, createEffect, Show, For } from 'solid-js';
import type { YogaLevel, YogaPose } from '@/lib/yoga-api/types';

const inputClass =
  'mt-1 w-full rounded-lg border border-cork-300 bg-white px-3 py-2 text-sm text-cork-900 focus:border-cork-600 focus:outline-none focus:ring-1 focus:ring-cork-600';

export default function YogaPoseExplorer() {
  const [level, setLevel] = createSignal<YogaLevel>('beginner');
  const [search, setSearch] = createSignal('');
  const [poses, setPoses] = createSignal<YogaPose[]>([]);
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal('');
  const [expandedId, setExpandedId] = createSignal<number | null>(null);

  async function load() {
    setLoading(true);
    setError('');
    const params = new URLSearchParams({ limit: '18' });
    if (search().trim()) {
      params.set('q', search().trim());
    } else {
      params.set('level', level());
    }

    try {
      const res = await fetch(`/api/yoga/poses?${params}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed to load poses.');
        setPoses([]);
        return;
      }
      setPoses(data.poses ?? []);
    } catch {
      setError('Could not load poses. The external API may be waking up — try again in a moment.');
      setPoses([]);
    } finally {
      setLoading(false);
    }
  }

  createEffect(() => {
    level();
    search();
    load();
  });

  return (
    <div class="space-y-8">
      <form
        class="rounded-2xl border border-cork-200 bg-cork-50/60 p-5"
        onSubmit={(e) => {
          e.preventDefault();
          load();
        }}
      >
        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label for="pose-search" class="text-xs font-medium text-cork-700">
              Search poses
            </label>
            <input
              id="pose-search"
              type="search"
              placeholder="Name, sanskrit, or keyword…"
              class={inputClass}
              value={search()}
              onInput={(e) => setSearch(e.currentTarget.value)}
            />
          </div>
          <div>
            <label for="pose-level" class="text-xs font-medium text-cork-700">
              Difficulty
            </label>
            <select
              id="pose-level"
              class={inputClass}
              value={level()}
              disabled={!!search().trim()}
              onChange={(e) => setLevel(e.currentTarget.value as YogaLevel)}
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="expert">Expert</option>
            </select>
          </div>
        </div>
        <p class="mt-3 text-xs text-cork-500">
          Data from the open{' '}
          <a
            href="https://github.com/alexcumplido/yoga-api"
            class="underline hover:text-cork-800"
            target="_blank"
            rel="noopener noreferrer"
          >
            Yoga API
          </a>{' '}
          — illustrations and pose guides for your practice.
        </p>
      </form>

      <Show when={loading()}>
        <p class="text-sm text-cork-500">Loading yoga poses…</p>
      </Show>

      <Show when={error()}>
        <p class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {error()}
        </p>
      </Show>

      <Show when={!loading() && !error() && poses().length === 0}>
        <p class="text-center text-sm text-cork-600">No poses found. Try another search or level.</p>
      </Show>

      <Show when={!loading() && poses().length > 0}>
        <ul class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <For each={poses()}>
            {(pose) => (
              <li class="flex flex-col overflow-hidden rounded-2xl border border-cork-200 bg-white shadow-sm">
                <div class="flex aspect-square items-center justify-center bg-cork-50 p-4">
                  <img
                    src={pose.url_png}
                    alt={`Illustration of ${pose.english_name} yoga pose`}
                    class="max-h-full max-w-full object-contain"
                    loading="lazy"
                  />
                </div>
                <div class="flex flex-1 flex-col p-5">
                  <p class="text-xs uppercase tracking-wider text-sage-600">
                    {pose.category_name ?? pose.difficulty_level ?? 'Yoga pose'}
                  </p>
                  <h3 class="mt-1 font-serif text-lg text-cork-900">{pose.english_name}</h3>
                  <p class="text-sm italic text-cork-500">{pose.sanskrit_name_adapted}</p>
                  <button
                    type="button"
                    class="mt-3 text-left text-sm font-medium text-cork-800 hover:underline"
                    onClick={() =>
                      setExpandedId(expandedId() === pose.id ? null : pose.id)
                    }
                  >
                    {expandedId() === pose.id ? 'Hide details' : 'View details'}
                  </button>
                  <Show when={expandedId() === pose.id}>
                    <p class="mt-2 text-sm leading-relaxed text-cork-600 line-clamp-6">
                      {pose.pose_description}
                    </p>
                    <p class="mt-2 text-xs leading-relaxed text-cork-500">
                      <span class="font-medium text-cork-700">Benefits: </span>
                      {pose.pose_benefits}
                    </p>
                  </Show>
                </div>
              </li>
            )}
          </For>
        </ul>
      </Show>
    </div>
  );
}
