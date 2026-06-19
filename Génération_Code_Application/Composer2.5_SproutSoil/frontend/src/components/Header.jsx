import { Link, useNavigate } from "react-router-dom";
import { avatarSrc } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

const navLinks = [
  { label: "Catalog", to: "/catalog" },
  { label: "Garden insights", href: "/#garden-insights" },
  { label: "Why SproutSoil", href: "/#features" },
];

export default function Header() {
  const { user, loading, logout, isAdmin } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-soil-200/60 bg-soil-50/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2 group">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sprout-500 text-white text-lg font-bold shadow-sm">
            S
          </span>
          <span className="font-display text-xl font-bold text-soil-900 tracking-tight">
            SproutSoil
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) =>
            link.to ? (
              <Link
                key={link.to}
                to={link.to}
                className="text-sm font-medium text-soil-600 hover:text-sprout-600 transition-colors"
              >
                {link.label}
              </Link>
            ) : (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-soil-600 hover:text-sprout-600 transition-colors"
              >
                {link.label}
              </a>
            )
          )}
          {isAdmin && (
            <Link
              to="/admin"
              className="text-sm font-medium text-amber-700 hover:text-amber-800 transition-colors"
            >
              Admin
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            to="/cart"
            className="relative rounded-full p-2 text-soil-600 hover:bg-soil-100 hover:text-sprout-600 transition-colors"
            aria-label={`Cart, ${itemCount} items`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            {itemCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-sprout-500 px-1 text-[10px] font-bold text-white">
                {itemCount > 99 ? "99+" : itemCount}
              </span>
            )}
          </Link>

          {!loading && (
            <>
              {user ? (
                <>
                  <Link
                    to="/profile"
                    className="flex items-center gap-2 rounded-full py-1 pl-1 pr-3 hover:bg-soil-100 transition-colors"
                  >
                    {avatarSrc(user.profile_picture_url) ? (
                      <img
                        src={avatarSrc(user.profile_picture_url)}
                        alt=""
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sprout-500 text-xs font-bold text-white">
                        {user.username.charAt(0).toUpperCase()}
                      </span>
                    )}
                    <span className="hidden sm:inline text-sm font-medium text-soil-700">
                      {user.username}
                    </span>
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="rounded-full border border-soil-200 px-4 py-2 text-sm font-medium text-soil-700 hover:bg-soil-100 transition-colors"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-sm font-medium text-soil-600 hover:text-sprout-600 transition-colors"
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/register"
                    className="rounded-full bg-soil-800 px-5 py-2 text-sm font-medium text-white hover:bg-soil-700 transition-colors"
                  >
                    Register
                  </Link>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
}
