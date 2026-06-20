import { Link } from "react-router-dom";
import Navbar from "./Navbar";

export default function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-ink text-mist">
      <Navbar />
      <main className="mx-auto flex max-w-md flex-col px-6 pb-16 pt-28">
        <h1 className="font-display text-3xl text-mist">{title}</h1>
        {subtitle && <p className="mt-2 text-sm text-mist/60">{subtitle}</p>}
        <div className="mt-8 rounded-sm border border-white/5 bg-deep/50 p-6">
          {children}
        </div>
        <p className="mt-6 text-center text-sm text-mist/50">
          <Link to="/" className="text-gold hover:underline">
            ← Back to home
          </Link>
        </p>
      </main>
    </div>
  );
}
