const POKEAPI_BASE = 'https://pokeapi.co/api/v2';

/** Iconic starters and fan favorites for the landing showcase */
export const SHOWCASE_POKEMON_IDS = [1, 4, 7, 25, 39, 52, 94, 133, 143, 150, 151, 6] as const;

export type PokemonCard = {
  id: number;
  name: string;
  displayName: string;
  image: string;
  types: string[];
  heightDm: number;
  weightHg: number;
};

type PokeApiPokemon = {
  id: number;
  name: string;
  height: number;
  weight: number;
  sprites?: {
    front_default?: string | null;
    other?: {
      home?: { front_default?: string | null };
      'official-artwork'?: { front_default?: string | null };
    };
  };
  types?: { type: { name: string } }[];
};

function capitalizeName(slug: string): string {
  return slug
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function pickSprite(data: PokeApiPokemon): string {
  return (
    data.sprites?.other?.['official-artwork']?.front_default ??
    data.sprites?.other?.home?.front_default ??
    data.sprites?.front_default ??
    ''
  );
}

function mapPokemon(data: PokeApiPokemon): PokemonCard | null {
  const image = pickSprite(data);
  if (!image) return null;

  return {
    id: data.id,
    name: data.name,
    displayName: capitalizeName(data.name),
    image,
    types: (data.types ?? []).map((t) => t.type.name),
    heightDm: data.height,
    weightHg: data.weight,
  };
}

export async function fetchPokemonById(id: number): Promise<PokemonCard | null> {
  const res = await fetch(`${POKEAPI_BASE}/pokemon/${id}`, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as PokeApiPokemon;
  return mapPokemon(data);
}

export async function fetchPokemonShowcase(
  ids: readonly number[] = SHOWCASE_POKEMON_IDS,
): Promise<PokemonCard[]> {
  const cards = await Promise.all(ids.map((id) => fetchPokemonById(id)));
  return cards.filter((c): c is PokemonCard => c !== null);
}

export function formatHeight(dm: number): string {
  const m = dm / 10;
  return m >= 1 ? `${m.toFixed(1)} m` : `${dm * 10} cm`;
}

export function formatWeight(hg: number): string {
  const kg = hg / 10;
  return kg >= 1 ? `${kg.toFixed(1)} kg` : `${hg * 10} g`;
}
