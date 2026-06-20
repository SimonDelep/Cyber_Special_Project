import Image from "next/image";
import Link from "next/link";
import { getProductConnections } from "@/lib/open-api/get-product-connections";

type ProductConnectionsProps = {
  productSlug: string;
  productName: string;
};

export async function ProductConnections({
  productSlug,
  productName,
}: ProductConnectionsProps) {
  const { topicLabel, materialTopic, relatedReading } =
    await getProductConnections(productSlug);

  if (!materialTopic && !relatedReading) {
    return null;
  }

  return (
    <section className="mt-16 border-t border-sand-200 pt-16">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-sage-700">
        Connected knowledge
      </p>
      <h2 className="mt-3 font-display text-3xl text-sand-900">
        Learn about {topicLabel}
      </h2>
      <p className="mt-2 max-w-2xl text-sm text-sand-600">
        Context for <span className="font-medium text-sand-800">{productName}</span>{" "}
        from open data sources — Wikipedia and Open Library (no API keys required).
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {materialTopic ? (
          <article className="overflow-hidden rounded-2xl border border-sand-200 bg-cream-50">
            {materialTopic.thumbnailUrl ? (
              <div className="relative aspect-[16/9] bg-sand-100">
                <Image
                  src={materialTopic.thumbnailUrl}
                  alt=""
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            ) : null}
            <div className="p-6">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-display text-xl text-sand-900">
                  {materialTopic.title}
                </h3>
                <span className="shrink-0 rounded-full bg-cream-100 px-2.5 py-0.5 text-xs font-medium text-sand-600">
                  Wikipedia
                </span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-sand-700 line-clamp-6">
                {materialTopic.extract}
              </p>
              <a
                href={materialTopic.pageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-block text-sm font-medium text-sage-700 hover:text-sage-900"
              >
                Read on Wikipedia →
              </a>
            </div>
          </article>
        ) : null}

        {relatedReading ? (
          <article className="rounded-2xl border border-sand-200 bg-cream-50 p-6">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-display text-xl text-sand-900">
                Related reading
              </h3>
              <span className="shrink-0 rounded-full bg-cream-100 px-2.5 py-0.5 text-xs font-medium text-sand-600">
                Open Library
              </span>
            </div>
            <p className="mt-2 text-xs text-sand-500">
              Books matching “{relatedReading.query}”
            </p>
            <ul className="mt-5 space-y-4">
              {relatedReading.books.map((book) => (
                <li key={book.pageUrl} className="flex gap-4">
                  {book.coverUrl ? (
                    <div className="relative h-20 w-14 shrink-0 overflow-hidden rounded-md bg-sand-100">
                      <Image
                        src={book.coverUrl}
                        alt=""
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="flex h-20 w-14 shrink-0 items-center justify-center rounded-md bg-sand-200 text-xs text-sand-500">
                      Book
                    </div>
                  )}
                  <div className="min-w-0">
                    <a
                      href={book.pageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-sand-900 hover:text-sage-800"
                    >
                      {book.title}
                    </a>
                    <p className="text-xs text-sand-600">
                      {[book.author, book.year].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            <Link
              href={`https://openlibrary.org/search?q=${encodeURIComponent(relatedReading.query)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block text-sm font-medium text-sage-700 hover:text-sage-900"
            >
              Search Open Library →
            </Link>
          </article>
        ) : null}
      </div>
    </section>
  );
}
