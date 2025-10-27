import { NavLink } from "react-router-dom";
import Logo from "../../assets/MCLogo.png";

const linkBase =
  "inline-flex items-center rounded-lg border border-transparent px-3 py-1.5 text-sm font-medium transition-colors";
const linkIdle =
  "text-gray-700 hover:border-gray-200 hover:bg-gray-100 dark:text-gray-300 dark:hover:border-gray-800 dark:hover:bg-gray-900";
const linkActive =
  "text-gray-900 bg-gray-100 border-gray-200 dark:text-gray-100 dark:bg-gray-900 dark:border-gray-800";

export default function Header() {
  return (
    <header className="sticky top-0 z-20 border-b bg-white/90 backdrop-blur supports-backdrop-filter:bg-white/60 dark:border-gray-800 dark:bg-gray-950/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <NavLink to="/" className="flex items-center gap-2">
          <img src={Logo} alt="Logo" className="h-6 w-6 rounded" />
          <h1 className="text-lg font-semibold tracking-tight">Minecraft Stats Viewer</h1>
        </NavLink>

        <nav className="flex items-center gap-2">
          <NavLink to="/" end className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkIdle}`}>
            Home
          </NavLink>

          <NavLink to="/world" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkIdle}`}>
            World
          </NavLink>

          <NavLink to="/players" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkIdle}`}>   
            Players
          </NavLink>

          <NavLink to="/leaderboard" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkIdle}`}>
            Leaderboard
          </NavLink>

          {/* quick theme toggle for dev */}
          <button
            onClick={() => document.documentElement.classList.toggle("dark")}
            className="ml-2 inline-flex items-center rounded-lg border px-2.5 py-1.5 text-sm font-medium hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-900"
            aria-label="Toggle theme"
            title="Toggle theme"
          >
            ☾
          </button>
        </nav>
      </div>
    </header>
  );
}
