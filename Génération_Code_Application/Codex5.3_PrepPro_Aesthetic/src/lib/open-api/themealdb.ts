const MEALDB_RANDOM = "https://www.themealdb.com/api/json/v1/1/random.php";
const INSTRUCTION_PREVIEW_LEN = 220;

export type MealPreview = {
  id: string;
  name: string;
  category: string;
  area: string;
  thumb: string;
  tags: string[];
  instructionsPreview: string;
  youtube: string | null;
  source: string | null;
};

type RawMeal = {
  idMeal?: string;
  strMeal?: string;
  strCategory?: string;
  strArea?: string;
  strMealThumb?: string;
  strTags?: string | null;
  strInstructions?: string;
  strYoutube?: string | null;
  strSource?: string | null;
};

function trimInstructions(text: string): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= INSTRUCTION_PREVIEW_LEN) return normalized;
  return `${normalized.slice(0, INSTRUCTION_PREVIEW_LEN).trimEnd()}…`;
}

function parseMeal(raw: RawMeal): MealPreview | null {
  const id = raw.idMeal?.trim();
  const name = raw.strMeal?.trim();
  const thumb = raw.strMealThumb?.trim();
  if (!id || !name || !thumb) return null;

  const tags = (raw.strTags ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  return {
    id,
    name,
    category: raw.strCategory?.trim() || "Meal",
    area: raw.strArea?.trim() || "International",
    thumb,
    tags,
    instructionsPreview: trimInstructions(raw.strInstructions ?? ""),
    youtube: raw.strYoutube?.trim() || null,
    source: raw.strSource?.trim() || null,
  };
}

export async function fetchRandomMeal(): Promise<MealPreview | null> {
  const res = await fetch(MEALDB_RANDOM, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) return null;

  const data = (await res.json()) as { meals?: RawMeal[] | null };
  const raw = data.meals?.[0];
  if (!raw) return null;

  return parseMeal(raw);
}
