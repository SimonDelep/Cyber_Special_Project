import Image from "next/image";
import Link from "next/link";
import { getCatalogConnections } from "@/lib/open-api/get-product-connections";

export async function CatalogOpenInsight() {
  const { materialTopic, relatedReading } = await getCatalogConnections();

  if (!materialTopic && !relatedReading) {
    return null;
  }

  return (
    <section className="mt-16 rounded-2xl border border-sage-200/80 bg-sage-50/50 p-8">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-sage-700">
        Open data
      </p>
      <h2 className="mt-2 font-display text-2xl text-sand-900">
        Why our materials matter
      </h2>
      <p className="mt-2 text-sm text-sand-600">
        EverThread connects each product to public knowledge from Wikipedia and
        Open Library so you can explore fibers, sustainability, and related
        reading — powered by open APIs.
      </p>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        {materialTopic ? (
          <div className="flex gap-4 rounded-xl bg-cream-50 p-4">
            {materialTopic.thumbnailUrl ? (
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg">
                <Image
                  src={materialTopic.thumbnailUrl}
                  alt=""
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            ) : null}
            <div>
              <p className="text-xs font-medium text-sage-700">Wikipedia</p>
              <p className="mt-1 font-medium text-sand-900">
                {materialTopic.title}
              </p>
              <p className="mt-1 line-clamp-3 text-sm text-sand-600">
                {materialTopic.extract}
              </p>
              <a
                href={materialTopic.pageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 text-sm text-sage-700 hover:text-sage-900"
              >
                Learn more →
              </a>
            </div>
          </div>
        ) : null}

        {relatedReading && relatedReading.books[0] ? (
          <div className="flex gap-4 rounded-xl bg-cream-50 p-4">
            {relatedReading.books[0].coverUrl ? (
              <div className="relative h-20 w-14 shrink-0 overflow-hidden rounded-lg">
                <Image
                  src={relatedReading.books[0].coverUrl}
                  alt=""
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            ) : null}
            <div>
              <p className="text-xs font-medium text-sage-700">Open Library</p>
              <p className="mt-1 font-medium text-sand-900">
                {relatedReading.books[0].title}
              </p>
              <p className="mt-1 text-sm text-sand-600">
                Explore books on sustainable and slow fashion.
              </p>
              <a
                href={relatedReading.books[0].pageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 text-sm text-sage-700 hover:text-sage-900"
              >
                View book →
              </a>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
