import type { WikipediaInsight } from "@/lib/open-api/types";

const WIKI_SUMMARY_BASE = "https://en.wikipedia.org/api/rest_v1/page/summary";
const REVALIDATE_SECONDS = 60 * 60 * 24;

type WikipediaSummaryResponse = {
  title?: string;
  extract?: string;
  thumbnail?: { source?: string };
  content_urls?: { desktop?: { page?: string } };
};

export async function fetchWikipediaSummary(
  topic: string,
): Promise<WikipediaInsight | null> {
  const title = topic.trim().replace(/ /g, "_");
  if (!title) return null;

  try {
    const res = await fetch(`${WIKI_SUMMARY_BASE}/${encodeURIComponent(title)}`, {
      headers: { Accept: "application/json" },
      next: { revalidate: REVALIDATE_SECONDS },
    });

    if (!res.ok) return null;

    const data = (await res.json()) as WikipediaSummaryResponse;

    if (!data.title || !data.extract || !data.content_urls?.desktop?.page) {
      return null;
    }

    return {
      source: "wikipedia",
      title: data.title,
      extract: data.extract,
      pageUrl: data.content_urls.desktop.page,
      thumbnailUrl: data.thumbnail?.source ?? null,
    };
  } catch {
    return null;
  }
}
