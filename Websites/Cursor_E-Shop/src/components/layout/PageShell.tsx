import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import type { ReactNode } from "react";

interface PageShellProps {
  children: ReactNode;
  narrow?: boolean;
}

export function PageShell({ children, narrow = false }: PageShellProps) {
  return (
    <div className="flex min-h-full flex-col bg-zinc-950 text-zinc-100">
      <Header />
      <main
        className={`mx-auto w-full flex-1 px-4 py-12 sm:px-6 ${
          narrow ? "max-w-lg" : "max-w-6xl"
        }`}
      >
        {children}
      </main>
      <Footer />
    </div>
  );
}
