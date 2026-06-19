import { Link } from "react-router-dom";
import { resolveAvatarUrl } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const { itemCount } = useCart();
  const avatar = resolveAvatarUrl(user?.avatar_url ?? null);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-ink/80 backdrop-blur-md">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="font-display text-2xl tracking-wide text-gold">
          VistaCanvas
        </Link>
        <ul className="hidden items-center gap-8 text-sm text-mist/80 md:flex">
          <li>
            <Link to="/catalog" className="transition hover:text-gold">
              Catalog
            </Link>
          </li>
          <li>
            <Link to="/cart" className="transition hover:text-gold">
              Cart
              {itemCount > 0 && (
                <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1.5 text-xs font-medium text-ink">
                  {itemCount}
                </span>
              )}
            </Link>
          </li>
          {user && (
            <li>
              <Link to="/profile" className="transition hover:text-gold">
                My profile
              </Link>
            </li>
          )}
          {isAdmin && (
            <li>
              <Link to="/admin" className="text-xs uppercase tracking-widest text-gold transition hover:text-mist">
                Admin panel
              </Link>
            </li>
          )}
        </ul>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              {avatar ? (
                <img
                  src={avatar}
                  alt=""
                  className="h-8 w-8 rounded-full object-cover ring-1 ring-gold/40"
                />
              ) : (
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-deep text-xs text-gold">
                  {user.username[0]?.toUpperCase()}
                </span>
              )}
              <span className="hidden text-sm text-mist/70 sm:inline">
                {user.username}
              </span>
              <button
                type="button"
                onClick={() => logout()}
                className="rounded-sm border border-mist/30 px-4 py-2 text-sm transition hover:border-mist/60"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-sm border border-mist/30 px-4 py-2 text-sm transition hover:border-mist/60"
              >
                Log in
              </Link>
              <Link
                to="/register"
                className="rounded-sm bg-gold px-4 py-2 text-sm font-medium text-ink transition hover:bg-gold/90"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
