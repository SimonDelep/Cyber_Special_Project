import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { avatarSrc } from "../api/client";

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-stone-200/80 bg-stone-50/90 backdrop-blur-md">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link
          to="/"
          className="font-display text-2xl font-bold tracking-tight text-brand-700"
        >
          ZestZing
        </Link>
        <ul className="hidden items-center gap-6 text-sm font-medium text-stone-600 sm:flex">
          <li>
            <Link to="/catalog" className="hover:text-brand-600 transition-colors">
              Catalog
            </Link>
          </li>
          {user && (
            <li>
              <Link to="/profile" className="hover:text-brand-600 transition-colors">
                My Profile
              </Link>
            </li>
          )}
          {isAdmin && (
            <li>
              <Link to="/admin" className="hover:text-brand-600 transition-colors">
                Admin
              </Link>
            </li>
          )}
        </ul>
        <div className="flex items-center gap-3">
          <Link
            to="/cart"
            className="relative rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-100 transition-colors"
          >
            Cart
            {itemCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1 text-xs font-bold text-white">
                {itemCount}
              </span>
            )}
          </Link>
          {user ? (
            <>
              {user.profile_picture_url && (
                <img
                  src={avatarSrc(user.profile_picture_url)}
                  alt=""
                  className="h-8 w-8 rounded-full object-cover border border-stone-200"
                />
              )}
              <span className="hidden text-sm text-stone-600 sm:inline">
                {user.username}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-100 transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-100 transition-colors"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 transition-colors"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
