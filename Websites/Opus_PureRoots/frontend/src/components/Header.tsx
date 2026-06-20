import { Link, NavLink, useNavigate } from "react-router-dom";
import { avatarSrc } from "../api/auth";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import WeatherChicoutimi from "./WeatherChicoutimi";

const navClass = ({ isActive }: { isActive: boolean }) =>
  `transition hover:text-forest-600 ${isActive ? "text-forest-700 font-semibold" : ""}`;

export default function Header() {
  const { user, logout, isAdmin, loading } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const avatar = user ? avatarSrc(user.avatar_url) : null;

  async function handleLogout() {
    await logout();
    navigate("/", { replace: true });
  }

  return (
    <header className="sticky top-0 z-50 border-b border-forest-200/60 bg-cream/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2">
          <img src="/leaf.svg" alt="" className="h-8 w-8" aria-hidden />
          <span className="font-display text-xl font-semibold tracking-tight text-forest-700">
            PureRoots
          </span>
        </Link>
        <div className="hidden lg:block">
          <WeatherChicoutimi compact />
        </div>
        <nav className="flex items-center gap-4 text-sm font-medium text-stone-600 sm:gap-8">
          <NavLink to="/" className={navClass} end>
            Home
          </NavLink>
          <NavLink to="/catalog" className={navClass}>
            Catalog
          </NavLink>
          <NavLink to="/cart" className="relative transition hover:text-forest-600">
            Cart
            {itemCount > 0 && (
              <span className="absolute -right-3 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-forest-600 px-1 text-[10px] font-bold text-white">
                {itemCount > 99 ? "99+" : itemCount}
              </span>
            )}
          </NavLink>
          {!loading && (
            <>
              {user ? (
                <>
                  {isAdmin && (
                    <NavLink to="/admin" className={navClass}>
                      Admin
                    </NavLink>
                  )}
                  <NavLink
                    to="/profile"
                    className={({ isActive }) =>
                      `flex items-center gap-2 transition hover:text-forest-600 ${isActive ? "text-forest-700 font-semibold" : ""}`
                    }
                  >
                    <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-forest-100 text-xs font-semibold text-forest-600">
                      {avatar ? (
                        <img src={avatar} alt="" className="h-full w-full object-cover" />
                      ) : (
                        user.username.slice(0, 2).toUpperCase()
                      )}
                    </span>
                    <span className="hidden sm:inline">Profile</span>
                  </NavLink>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="rounded-full border border-forest-200 px-4 py-2 transition hover:border-forest-300"
                  >
                    Log out
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="transition hover:text-forest-600">
                    Sign in
                  </Link>
                  <Link
                    to="/register"
                    className="rounded-full bg-forest-600 px-5 py-2 text-white transition hover:bg-forest-700"
                  >
                    Register
                  </Link>
                </>
              )}
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
