import { fetchOpenLibraryBooks } from "@/lib/open-api/open-library";
import {
  CATALOG_INSIGHT_TOPIC,
  getProductConnectionConfig,
} from "@/lib/open-api/product-connections";
import type { ProductConnections } from "@/lib/open-api/types";
import { fetchWikipediaSummary } from "@/lib/open-api/wikipedia";

export async function getProductConnections(
  productSlug: string,
): Promise<ProductConnections & { topicLabel: string }> {
  const config = getProductConnectionConfig(productSlug);

  const [materialTopic, relatedReading] = await Promise.all([
    fetchWikipediaSummary(config.wikipediaTitle),
    fetchOpenLibraryBooks(config.libraryQuery, 3),
  ]);

  return {
    topicLabel: config.label,
    materialTopic,
    relatedReading,
  };
}

export async function getCatalogConnections() {
  const [materialTopic, relatedReading] = await Promise.all([
    fetchWikipediaSummary(CATALOG_INSIGHT_TOPIC.wikipediaTitle),
    fetchOpenLibraryBooks(CATALOG_INSIGHT_TOPIC.libraryQuery, 2),
  ]);

  return { materialTopic, relatedReading };
}
