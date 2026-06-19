"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { importProductsCsvAction } from "@/actions/admin/products";
import type { ActionState } from "@/lib/action-state";
import { Alert } from "@/components/ui/Alert";
import { SubmitButton } from "@/components/ui/SubmitButton";
import {
  PRODUCT_CSV_HELP,
  PRODUCT_CSV_MAX_ROWS,
} from "@/lib/csv/products";

const initialState: ActionState = {};

function CsvHelpButton() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-7 w-7 items-center justify-center rounded-full border border-zinc-600 bg-zinc-800 text-sm font-semibold text-zinc-300 transition hover:border-cyan-500/50 hover:text-cyan-300"
        aria-expanded={open}
        aria-label="How CSV import works"
        title="How CSV import works"
      >
        ?
      </button>
      {open ? (
        <div
          role="dialog"
          aria-label="CSV import instructions"
          className="absolute right-0 z-20 mt-2 w-[min(100vw-2rem,22rem)] rounded-xl border border-zinc-700 bg-zinc-900 p-4 text-left text-sm shadow-xl"
        >
          <p className="font-semibold text-zinc-100">{PRODUCT_CSV_HELP.title}</p>
          <ul className="mt-3 list-disc space-y-2 pl-4 text-zinc-400">
            {PRODUCT_CSV_HELP.rules.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
          <p className="mt-4 text-xs font-medium uppercase tracking-wide text-zinc-500">
            Example
          </p>
          <pre className="mt-2 overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950/80 p-2 font-mono text-xs text-cyan-200/90">
            {PRODUCT_CSV_HELP.exampleHeader}
            {"\n"}
            {PRODUCT_CSV_HELP.exampleRow}
          </pre>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mt-3 text-xs text-cyan-400 hover:text-cyan-300"
          >
            Close
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function ProductCsvImport() {
  const [state, formAction] = useActionState(importProductsCsvAction, initialState);

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-zinc-100">
            Import products from CSV
          </h3>
          <p className="mt-1 text-sm text-zinc-500">
            Upload a .csv file to create multiple products at once.
          </p>
        </div>
        <CsvHelpButton />
      </div>

      <form action={formAction} className="mt-5 space-y-4" encType="multipart/form-data">
        {state.error ? <Alert>{state.error}</Alert> : null}
        {state.success && state.message ? (
          <Alert variant="success">{state.message}</Alert>
        ) : null}

        <div className="space-y-1.5">
          <label
            htmlFor="csvFile"
            className="block text-sm font-medium text-zinc-300"
          >
            CSV file
          </label>
          <input
            id="csvFile"
            name="csvFile"
            type="file"
            accept=".csv,text/csv"
            required
            className="block w-full text-sm text-zinc-400 file:mr-4 file:rounded-full file:border-0 file:bg-cyan-500 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-zinc-950 hover:file:bg-cyan-400"
          />
          <p className="text-xs text-zinc-500">
            Max {PRODUCT_CSV_MAX_ROWS} products per file, 512 KB. Separator:{" "}
            <strong className="font-medium text-zinc-400">comma (,)</strong>.
            Click ? for column format.
          </p>
          <p className="text-xs text-zinc-500">
            Sample file in the project:{" "}
            <code className="text-zinc-400">data/sample-products-import.csv</code>
            {" · "}
            <Link
              href="/sample-products-import.csv"
              download
              className="text-cyan-400 hover:text-cyan-300"
            >
              Download sample CSV
            </Link>
          </p>
        </div>

        {state.importErrors && state.importErrors.length > 0 ? (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            <p className="font-medium">Skipped rows</p>
            <ul className="mt-2 max-h-40 list-disc space-y-1 overflow-y-auto pl-4 text-amber-200/90">
              {state.importErrors.map((err) => (
                <li key={err}>{err}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <SubmitButton pendingLabel="Importing…">Import CSV</SubmitButton>
      </form>
    </div>
  );
}
