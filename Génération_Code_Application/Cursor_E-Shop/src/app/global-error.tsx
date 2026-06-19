"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-full flex flex-col items-center justify-center bg-zinc-950 px-4 py-16 text-zinc-100 antialiased">
        <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8 text-center">
          <p className="text-sm font-medium uppercase tracking-wider text-red-400">
            Application error
          </p>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-zinc-50">
            E-Shop is temporarily unavailable
          </h1>
          <p className="mt-3 text-sm text-zinc-400">
            A critical error occurred. Please reload the page or try again
            later.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            className="mt-8 inline-flex items-center justify-center rounded-full bg-cyan-500 px-6 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-cyan-400"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
