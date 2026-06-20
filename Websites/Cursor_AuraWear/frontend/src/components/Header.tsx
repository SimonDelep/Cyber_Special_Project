import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

const navLinks = [
  { label: "Shop", to: "/#shop" },
  { label: "Catalog", to: "/catalog" },
  { label: "About", to: "/#about" },
];

export default function Header() {
  const { user, isAuthenticated, isAdmin, logout, loading } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/");
  }

  return (
    <header className="sticky top-0 z-50 border-b border-aura-200/80 bg-aura-50/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="font-display text-xl font-semibold tracking-tight text-aura-950 sm:text-2xl">
          AuraWear
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Main">
          {navLinks.map((link) =>
            link.to.startsWith("/#") ? (
              <a
                key={link.to}
                href={link.to}
                className="text-sm font-medium text-aura-700 transition-colors hover:text-aura-950"
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.to}
                to={link.to}
                className="text-sm font-medium text-aura-700 transition-colors hover:text-aura-950"
              >
                {link.label}
              </Link>
            ),
          )}
          {isAdmin && (
            <Link
              to="/admin"
              className="text-sm font-medium text-aura-700 transition-colors hover:text-aura-950"
            >
              Admin
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-3 sm:gap-4">
          {loading ? (
            <span className="text-sm text-aura-500">…</span>
          ) : isAuthenticated && user ? (
            <>
              <Link
                to="/profile"
                className="hidden text-sm font-medium text-aura-700 transition-colors hover:text-aura-950 sm:inline"
              >
                {user.first_name || user.username}
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="hidden text-sm font-medium text-aura-600 transition-colors hover:text-aura-950 sm:inline"
              >
                Logout
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="hidden text-sm font-medium text-aura-700 transition-colors hover:text-aura-950 sm:inline"
            >
              Sign in
            </Link>
          )}
          <Link
            to="/cart"
            className="relative rounded-full border border-aura-300 px-4 py-2 text-sm font-medium text-aura-800 transition hover:border-aura-400 hover:bg-white"
          >
            Cart
            {itemCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-aura-950 px-1 text-xs font-semibold text-aura-50">
                {itemCount > 99 ? "99+" : itemCount}
              </span>
            )}
          </Link>
          <Link
            to={isAuthenticated ? "/profile" : "/register"}
            className="rounded-full bg-aura-950 px-4 py-2 text-sm font-medium text-aura-50 transition hover:bg-aura-800"
          >
            {isAuthenticated ? "Profile" : "Join"}
          </Link>
        </div>
      </div>
    </header>
  );
}
