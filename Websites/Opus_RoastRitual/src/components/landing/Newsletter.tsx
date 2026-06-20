import { Button } from "@/components/ui/Button";

export function Newsletter() {
  return (
    <section className="px-6 pb-20" aria-labelledby="newsletter-heading">
      <div className="mx-auto max-w-3xl rounded-3xl bg-espresso px-8 py-12 text-center text-cream md:px-16">
        <h2 id="newsletter-heading" className="font-display text-2xl md:text-3xl">
          Join the ritual
        </h2>
        <p className="mx-auto mt-4 max-w-md text-sm text-cream/80">
          Get brew tips, origin stories, and early access to limited releases.
        </p>
        <form
          className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row"
          action="#"
        >
          <label htmlFor="email" className="sr-only">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="you@example.com"
            className="flex-1 rounded-full border border-cream/20 bg-cream/10 px-5 py-3 text-sm text-cream placeholder:text-cream/50 focus:border-sage focus:outline-none"
          />
          <Button type="submit" variant="secondary" className="shrink-0">
            Subscribe
          </Button>
        </form>
      </div>
    </section>
  );
}
