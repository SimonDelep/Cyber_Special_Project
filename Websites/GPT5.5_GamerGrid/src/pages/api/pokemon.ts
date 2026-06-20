import type { APIRoute } from 'astro';
import { fetchPokemonShowcase, SHOWCASE_POKEMON_IDS } from '@/lib/pokemon';

export const GET: APIRoute = async ({ url }) => {
  const idsParam = url.searchParams.get('ids');
  let ids: number[] = [...SHOWCASE_POKEMON_IDS];

  if (idsParam) {
    const parsed = idsParam
      .split(',')
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => Number.isFinite(n) && n > 0 && n <= 1025);
    if (parsed.length > 0) {
      ids = parsed.slice(0, 24);
    }
  }

  try {
    const pokemon = await fetchPokemonShowcase(ids);
    return new Response(JSON.stringify({ pokemon, source: 'pokeapi.co' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Failed to load Pokémon data' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
