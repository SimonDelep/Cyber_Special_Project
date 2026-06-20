import { useEffect, useState } from "react";

import { Link } from "react-router-dom";

import { fetchProducts } from "../api/products";

import ProductCard from "./ProductCard";

import type { Product } from "../types/product";



export default function FeaturedProducts() {

  const [products, setProducts] = useState<Product[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");



  useEffect(() => {

    fetchProducts()

      .then((items) => setProducts(items.slice(0, 6)))

      .catch(() => setError("Could not load products. Please try again later."))

      .finally(() => setLoading(false));

  }, []);



  return (

    <section id="shop" className="py-16 sm:py-24">

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">

        <div className="mb-12 text-center sm:mb-16">

          <h2 className="font-display text-3xl font-semibold text-aura-950 sm:text-4xl">

            New arrivals

          </h2>

          <p className="mx-auto mt-3 max-w-xl text-aura-600">

            Hand-picked pieces from our latest collection — quality fabrics, timeless silhouettes.

          </p>

        </div>



        {loading && (

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">

            {[1, 2, 3, 4, 5].map((n) => (

              <div

                key={n}

                className="aspect-[4/5] animate-pulse rounded-2xl bg-aura-200/60 sm:col-span-1"

              />

            ))}

          </div>

        )}



        {error && (

          <p className="rounded-lg bg-red-50 px-4 py-3 text-center text-sm text-red-700" role="alert">

            {error}

          </p>

        )}



        {!loading && !error && products.length > 0 && (

          <>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">

              {products.map((product) => (

                <ProductCard key={product.id} product={product} />

              ))}

            </div>

            <p className="mt-10 text-center text-sm text-aura-600">

              <Link to="/catalog" className="font-semibold text-aura-800 hover:text-aura-950">

                Browse full catalog →

              </Link>

              {" · "}

              <Link to="/cart" className="font-semibold text-aura-800 hover:text-aura-950">

                View cart →

              </Link>

            </p>

          </>

        )}



        {!loading && !error && products.length === 0 && (

          <p className="text-center text-sm text-aura-600">No products available yet.</p>

        )}

      </div>

    </section>

  );

}

