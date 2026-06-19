import type { InspirationQuote } from "@/types";

const FALLBACK_QUOTES: InspirationQuote[] = [
  {
    content: "In the midst of movement and chaos, keep stillness inside of you.",
    author: "Deepak Chopra",
    source: "AuraAsh",
  },
  {
    content: "The home should be the treasure chest of living.",
    author: "Le Corbusier",
    source: "AuraAsh",
  },
  {
    content: "Wherever you are, be there totally.",
    author: "Eckhart Tolle",
    source: "AuraAsh",
  },
];

const QUOTABLE_URL =
  "https://api.quotable.io/quotes/random?tags=wisdom|life|happiness&maxLength=140";

function pickFallback(): InspirationQuote {
  const index = Math.floor(Math.random() * FALLBACK_QUOTES.length);
  return FALLBACK_QUOTES[index]!;
}

export async function getDailyInspiration(): Promise<InspirationQuote> {
  try {
    const response = await fetch(QUOTABLE_URL, {
      next: { revalidate: 3600 },
    });

    if (!response.ok) return pickFallback();

    const data = (await response.json()) as {
      content?: string;
      author?: string;
    };

    if (!data.content || !data.author) return pickFallback();

    return {
      content: data.content,
      author: data.author,
      source: "Quotable",
    };
  } catch {
    return pickFallback();
  }
}
