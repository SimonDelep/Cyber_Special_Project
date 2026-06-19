import { Link } from "react-router-dom";
import { formatPrice } from "../api/products";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";

const navLinks = [
  { href: "/catalog", label: "Catalog", router: true },
  { href: "/#categories", label: "Categories" },
  { href: "/#products", label: "Products" },
  { href: "/#about", label: "About" },
];

export default function Header() {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();

  return (
    <header className="sticky top-0 z-50 border-b border-grid-border/80 bg-grid-dark/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Link to="/" className="font-display text-xl font-bold tracking-wider text-white">
          Gamer<span className="text-grid-cyan">Grid</span>
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) =>
            "router" in link && link.router ? (
              <Link
                key={link.href}
                to={link.href}
                className="text-sm font-medium text-grid-muted transition-colors hover:text-grid-cyan"
              >
                {link.label}
              </Link>
            ) : (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-grid-muted transition-colors hover:text-grid-cyan"
              >
                {link.label}
              </a>
            )
          )}
        </nav>
        <div className="flex items-center gap-3">
          {user && (
            <Link
              to="/orders"
              className="hidden text-sm font-medium text-grid-muted hover:text-grid-cyan sm:inline"
            >
              Orders
            </Link>
          )}
          <Link
            to="/cart"
            className="relative rounded-lg border border-grid-border px-3 py-2 text-sm font-medium text-white transition-colors hover:border-grid-cyan/50"
          >
            Cart
            {itemCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-grid-purple px-1 text-xs font-bold text-white">
                {itemCount > 99 ? "99+" : itemCount}
              </span>
            )}
          </Link>
          {user ? (
            <>
              <span className="hidden text-sm text-grid-muted lg:inline">
                Balance: {formatPrice(user.balance_cents ?? 0)}
              </span>
              {user.is_admin && (
                <Link
                  to="/admin"
                  className="text-sm font-medium text-grid-purple hover:text-grid-cyan"
                >
                  Admin Panel
                </Link>
              )}
              <span className="hidden text-sm text-grid-muted sm:inline">
                Hi, {user.full_name.split(" ")[0]}
                {user.is_admin && (
                  <span className="ml-2 rounded bg-grid-purple/30 px-2 py-0.5 text-xs font-semibold text-grid-purple">
                    Admin
                  </span>
                )}
              </span>
              <button
                type="button"
                onClick={logout}
                className="text-sm font-medium text-grid-muted hover:text-white"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm font-medium text-grid-muted hover:text-grid-cyan"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className="rounded-lg bg-gradient-to-r from-grid-cyan to-grid-purple px-4 py-2 text-sm font-semibold text-grid-dark transition-opacity hover:opacity-90"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
