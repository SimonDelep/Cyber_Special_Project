interface StatsBarProps {
  productCount: number;
}

export function StatsBar({ productCount }: StatsBarProps) {
  const stats = [
    { value: `${productCount}+`, label: "Products in catalog" },
    { value: "24h", label: "Average ship time" },
    { value: "4.9", label: "Customer rating" },
    { value: "100%", label: "Secure payments" },
  ];

  return (
    <section className="border-y border-zinc-800/80 bg-zinc-900/30 px-4 py-10 sm:px-6">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 sm:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="text-center sm:text-left">
            <p className="text-2xl font-bold text-zinc-50 sm:text-3xl">{stat.value}</p>
            <p className="mt-1 text-sm text-zinc-500">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
