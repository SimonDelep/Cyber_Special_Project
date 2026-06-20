export default function ProfessionalsCTA() {
  return (
    <section
      id="professionals"
      class="bg-brand-800 py-20 text-white"
    >
      <div class="mx-auto max-w-6xl px-4 sm:px-6">
        <div class="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 class="font-display text-3xl font-semibold sm:text-4xl">
              From home office to high-rise
            </h2>
            <p class="mt-4 text-lg leading-relaxed text-brand-100">
              PrepPro Aesthetic is for consultants, clinicians, founders, and
              anyone whose lunch break is twenty minutes and non-negotiable.
              Invest once in a system that respects your time and your desk.
            </p>
          </div>
          <ul class="space-y-4 text-brand-100">
            <li class="flex gap-3 rounded-xl border border-brand-600/50 bg-brand-700/40 px-4 py-3">
              <span class="font-semibold text-white">01</span>
              <span>Sunday batch prep with consistent container sizes</span>
            </li>
            <li class="flex gap-3 rounded-xl border border-brand-600/50 bg-brand-700/40 px-4 py-3">
              <span class="font-semibold text-white">02</span>
              <span>Leak-proof carry for transit and client sites</span>
            </li>
            <li class="flex gap-3 rounded-xl border border-brand-600/50 bg-brand-700/40 px-4 py-3">
              <span class="font-semibold text-white">03</span>
              <span>Glass presentation that fits a professional environment</span>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
