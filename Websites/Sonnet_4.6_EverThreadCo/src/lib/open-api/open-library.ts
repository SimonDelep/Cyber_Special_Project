import type { OpenLibraryBook, OpenLibraryInsight } from "@/lib/open-api/types";

const OPEN_LIBRARY_SEARCH = "https://openlibrary.org/search.json";
const REVALIDATE_SECONDS = 60 * 60 * 24;

type OpenLibraryDoc = {
  title?: string;
  author_name?: string[];
  first_publish_year?: number;
  cover_i?: number;
  key?: string;
};

type OpenLibrarySearchResponse = {
  docs?: OpenLibraryDoc[];
};

export async function fetchOpenLibraryBooks(
  query: string,
  limit = 3,
): Promise<OpenLibraryInsight | null> {
  const q = query.trim();
  if (!q) return null;

  try {
    const url = new URL(OPEN_LIBRARY_SEARCH);
    url.searchParams.set("q", q);
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("fields", "title,author_name,first_publish_year,cover_i,key");

    const res = await fetch(url.toString(), {
      next: { revalidate: REVALIDATE_SECONDS },
    });

    if (!res.ok) return null;

    const data = (await res.json()) as OpenLibrarySearchResponse;
    const docs = data.docs ?? [];

    const books: OpenLibraryBook[] = docs
      .filter((doc) => doc.title && doc.key)
      .map((doc) => ({
        title: doc.title!,
        author: doc.author_name?.[0] ?? null,
        year: doc.first_publish_year ? String(doc.first_publish_year) : null,
        coverUrl: doc.cover_i
          ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
          : null,
        pageUrl: `https://openlibrary.org${doc.key}`,
      }));

    if (books.length === 0) return null;

    return {
      source: "open-library",
      query: q,
      books,
    };
  } catch {
    return null;
  }
}
