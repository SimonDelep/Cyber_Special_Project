export default function LogoutButton() {
  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/';
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      class="rounded-full border border-white/15 px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
    >
      Log out
    </button>
  );
}
