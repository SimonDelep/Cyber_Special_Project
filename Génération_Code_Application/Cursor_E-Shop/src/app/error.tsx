"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
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
    <div className="flex min-h-full flex-col items-center justify-center bg-zinc-950 px-4 py-16 text-zinc-100">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8 text-center">
        <p className="text-sm font-medium uppercase tracking-wider text-red-400">
          Something went wrong
        </p>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-zinc-50">
          We hit an unexpected error
        </h1>
        <p className="mt-3 text-sm text-zinc-400">
          Please try again. If the problem continues, return to the shop or
          contact support.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center justify-center rounded-full bg-cyan-500 px-6 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-cyan-400"
          >
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-zinc-600 px-6 py-3 text-sm font-medium text-zinc-200 transition hover:border-zinc-400"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
