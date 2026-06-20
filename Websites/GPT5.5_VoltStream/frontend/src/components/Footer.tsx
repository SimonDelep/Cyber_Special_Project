export default function Footer() {
  return (
    <footer id="about" className="border-t border-grid-border px-6 py-12">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 md:flex-row">
        <div className="text-center md:text-left">
          <p className="font-display text-lg font-bold text-white">
            Gamer<span className="text-grid-cyan">Grid</span>
          </p>
          <p className="mt-1 text-sm text-grid-muted">
            Ergonomic gear for gamers who refuse to compromise.
          </p>
        </div>
        <p className="text-sm text-grid-muted">
          © {new Date().getFullYear()} GamerGrid. Built with FastAPI, React & PostgreSQL.
        </p>
      </div>
    </footer>
  );
}
