"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Select } from "@/components/ui/Select";

type CatalogFiltersProps = {
  roastLevels: string[];
  defaults: {
    q: string;
    category: string;
    roastLevel: string;
    ethical: string;
    minPrice: string;
    maxPrice: string;
    sort: string;
  };
};

export function CatalogFilters({ roastLevels, defaults }: CatalogFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const applyFilters = useCallback(
    (form: HTMLFormElement) => {
      const data = new FormData(form);
      const params = new URLSearchParams();

      const fields = [
        "q",
        "category",
        "roastLevel",
        "ethical",
        "minPrice",
        "maxPrice",
        "sort",
      ] as const;

      for (const field of fields) {
        const value = String(data.get(field) ?? "").trim();
        if (value && value !== "ALL" && value !== "") {
          params.set(field, value);
        }
      }

      startTransition(() => {
        router.push(`/catalog?${params.toString()}`);
      });
    },
    [router],
  );

  function clearFilters() {
    startTransition(() => {
      router.push("/catalog");
    });
  }

  return (
    <form
      className="rounded-3xl border border-sage/25 bg-linen p-6"
      onSubmit={(e) => {
        e.preventDefault();
        applyFilters(e.currentTarget);
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="catalog-q">Search</Label>
          <Input
            id="catalog-q"
            name="q"
            defaultValue={defaults.q}
            placeholder="Name, origin, description…"
          />
        </div>
        <Select label="Category" name="category" defaultValue={defaults.category}>
          <option value="ALL">All products</option>
          <option value="COFFEE">Coffee</option>
          <option value="TEA">Tea</option>
        </Select>
        <Select label="Sort by" name="sort" defaultValue={defaults.sort || "name"}>
          <option value="name">Name (A–Z)</option>
          <option value="price_asc">Price (low to high)</option>
          <option value="price_desc">Price (high to low)</option>
        </Select>
        <Select
          label="Roast level"
          name="roastLevel"
          defaultValue={defaults.roastLevel}
        >
          <option value="">Any roast</option>
          {roastLevels.map((level) => (
            <option key={level} value={level}>
              {level}
            </option>
          ))}
        </Select>
        <Select label="Ethical sourcing" name="ethical" defaultValue={defaults.ethical}>
          <option value="">Any</option>
          <option value="true">Ethical only</option>
          <option value="false">Standard</option>
        </Select>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="catalog-min-price">Min price ($)</Label>
            <Input
              id="catalog-min-price"
              name="minPrice"
              type="number"
              min={0}
              step={0.01}
              defaultValue={defaults.minPrice}
              placeholder="0"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="catalog-max-price">Max price ($)</Label>
            <Input
              id="catalog-max-price"
              name="maxPrice"
              type="number"
              min={0}
              step={0.01}
              defaultValue={defaults.maxPrice}
              placeholder="99"
            />
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Applying…" : "Apply filters"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={clearFilters}
          disabled={isPending || searchParams.toString() === ""}
        >
          Clear all
        </Button>
      </div>
    </form>
  );
}
