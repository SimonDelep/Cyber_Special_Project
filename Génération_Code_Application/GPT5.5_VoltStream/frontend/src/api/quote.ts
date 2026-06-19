import { apiFetch } from "./client";

export interface Quote {
  quote: string;
  author: string;
  source: string;
}

export function fetchQuote(): Promise<Quote> {
  return apiFetch<Quote>("/api/quote");
}
