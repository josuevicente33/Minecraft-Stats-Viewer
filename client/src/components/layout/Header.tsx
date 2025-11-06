import * as React from "react";
import { NavLink } from "react-router-dom";
import { Dialog, DialogPanel, Transition, TransitionChild } from "@headlessui/react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import Logo from "../../assets/MCLogo.png";
import { ThemeToggle } from "../ui/ThemeToggle";

const linkBase =
  "inline-flex items-center rounded-lg border border-transparent px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap";
const linkIdle =
  "text-gray-700 hover:border-gray-200 hover:bg-gray-100 dark:text-gray-300 dark:hover:border-gray-800 dark:hover:bg-gray-900";
const linkActive =
  "text-gray-900 bg-gray-100 border-gray-200 dark:text-gray-100 dark:bg-gray-900 dark:border-gray-800";

export default function Header() {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const NavItems = ({ onNavigate }: { onNavigate?: () => void }) => (
    <>
      <NavLink
        to="/"
        end
        className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkIdle}`}
        onClick={onNavigate}
      >
        Home
      </NavLink>
      <NavLink
        to="/world"
        className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkIdle}`}
        onClick={onNavigate}
      >
        World
      </NavLink>
      <NavLink
        to="/players"
        className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkIdle}`}
        onClick={onNavigate}
      >
        Players
      </NavLink>
      <NavLink
        to="/leaderboard"
        className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkIdle}`}
        onClick={onNavigate}
      >
        Leaderboard
      </NavLink>
    </>
  );

  return (
    <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/85 backdrop-blur supports-backdrop-filter:bg-white/65 dark:border-gray-800 dark:bg-gray-950/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 py-2 sm:px-4 sm:py-3">
        {/* Left: brand + mobile menu */}
        <div className="flex min-w-0 items-center gap-2">
          {/* Mobile hamburger */}
          <button
            type="button"
            className="-ml-1 inline-flex h-9 w-9 items-center justify-center rounded-md text-gray-600 hover:bg-gray-100 focus:outline-none focus-visible:ring dark:text-gray-300 dark:hover:bg-gray-900 sm:hidden"
            aria-label="Open navigation menu"
            onClick={() => setMobileOpen(true)}
          >
            <Bars3Icon className="h-5 w-5" />
          </button>

          {/* Brand */}
          <NavLink to="/" className="flex min-w-0 items-center gap-2">
            <img src={Logo} alt="Logo" className="h-6 w-6 shrink-0 rounded" />
            <span className="truncate text-base font-semibold tracking-tight text-black dark:text-white sm:hidden">
              MC Stats
            </span>
            <span className="hidden truncate text-lg font-semibold tracking-tight text-black dark:text-white sm:inline">
              Minecraft Stats Viewer
            </span>
          </NavLink>
        </div>

        {/* Right: desktop nav + theme toggle */}
        <div className="flex items-center gap-2">
          <nav className="hidden items-center gap-2 sm:flex">
            <NavItems />
          </nav>
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      <Transition show={mobileOpen} as={React.Fragment}>
        <Dialog as="div" className="relative z-60 sm:hidden" onClose={setMobileOpen}>
          <TransitionChild
            as={React.Fragment}
            enter="transition-opacity duration-150"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/40" />
          </TransitionChild>

          <div className="fixed inset-0 overflow-hidden">
            <div className="absolute inset-0 flex">
              <TransitionChild
                as={React.Fragment}
                enter="transition duration-200 ease-out"
                enterFrom="-translate-x-full opacity-0"
                enterTo="translate-x-0 opacity-100"
                leave="transition duration-150 ease-in"
                leaveFrom="translate-x-0 opacity-100"
                leaveTo="-translate-x-full opacity-0"
              >
                <DialogPanel className="relative flex h-full w-[85vw] max-w-sm flex-col bg-white shadow-xl dark:bg-gray-950">
                  <div className="flex items-center justify-between px-4 pt-4 pb-2">
                    <div className="flex items-center gap-2">
                      <img src={Logo} alt="Logo" className="h-6 w-6 rounded" />
                      <Dialog.Title className="text-base font-semibold">Minecraft Stats Viewer</Dialog.Title>
                    </div>
                    <button
                      type="button"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-md text-gray-600 hover:bg-gray-100 focus:outline-none focus-visible:ring dark:text-gray-300 dark:hover:bg-gray-900"
                      onClick={() => setMobileOpen(false)}
                      aria-label="Close navigation menu"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>

                  <nav className="px-3 pb-3">
                    <div className="flex flex-col gap-1">
                      <NavItems onNavigate={() => setMobileOpen(false)} />
                    </div>

                    {/* Theme toggle lives in the drawer on mobile */}
                    <div className="mt-3 rounded-lg border border-gray-200 p-2 dark:border-gray-800">
                      <div className="mb-1 text-xs text-gray-500 dark:text-gray-400">Theme</div>
                      <ThemeToggle />
                    </div>
                  </nav>
                </DialogPanel>
              </TransitionChild>
            </div>
          </div>
        </Dialog>
      </Transition>
    </header>
  );
}
