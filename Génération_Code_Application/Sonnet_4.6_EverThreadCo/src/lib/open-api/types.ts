export type WikipediaInsight = {
  source: "wikipedia";
  title: string;
  extract: string;
  pageUrl: string;
  thumbnailUrl: string | null;
};

export type OpenLibraryBook = {
  title: string;
  author: string | null;
  year: string | null;
  coverUrl: string | null;
  pageUrl: string;
};

export type OpenLibraryInsight = {
  source: "open-library";
  query: string;
  books: OpenLibraryBook[];
};

export type ProductConnections = {
  materialTopic: WikipediaInsight | null;
  relatedReading: OpenLibraryInsight | null;
};
