import { useEffect, useRef, useState } from "react";
import {
  X,
  Search,
  Home,
  MapPin,
  Phone,
  Heart,
  CalendarDays,
  User,
  LogOut,
  Compass,
  MessageCircle,
  ChevronDown,
  DollarSign,
  Users,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { api } from "../../lib/api";
import ThemeToggle from "../ThemeToggle";
import { useAuthStore } from "../../store/auth.store";
import type { User as AuthUser } from "../../store/auth.store";

type Favorite = {
  id: string;
  listing: {
    id: string;
    title: string;
    location: string;
    price: number;
    image: string;
  };
};

const NAV_ITEMS = [
  { label: "Homes", to: "/", icon: Home },
  { label: "Stays", to: "/all-listings", icon: MapPin },
  { label: "Contact", to: "/#contact", icon: Phone },
];

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const [where, setWhere] = useState(
    () => new URLSearchParams(location.search).get("location") || "",
  );
  const [maxPrice, setMaxPrice] = useState(
    () => new URLSearchParams(location.search).get("maxPrice") || "",
  );
  const [guests, setGuests] = useState(
    () => new URLSearchParams(location.search).get("guests") || "",
  );
  const profileRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const isHome = location.pathname === "/";

  const { data: favorites } = useQuery({
    queryKey: ["favorites"],
    queryFn: async () => {
      try {
        const response = await api.get("/users/favorites");
        return response.data.favorites as Favorite[];
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          return [];
        }
        throw error;
      }
    },
    enabled: !!user,
    retry: false,
  });

  const favoritesCount = favorites?.length || 0;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(e.target as Node)
      ) {
        setIsProfileOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchExpanded(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsMobileMenuOpen(false);
        setIsProfileOpen(false);
        setIsSearchExpanded(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (location.hash === "#contact") {
      window.setTimeout(() => {
        document.getElementById("contact")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 50);
    }
  }, [location.hash]);

  const runSearch = () => {
    const params = new URLSearchParams();
    if (where.trim()) params.set("location", where.trim());
    const price = Number(maxPrice);
    if (Number.isFinite(price) && price > 0)
      params.set("maxPrice", String(price));
    const guestsCount = Number(guests);
    if (Number.isFinite(guestsCount) && guestsCount > 0)
      params.set("guests", String(guestsCount));
    navigate(`/all-listings${params.toString() ? `?${params}` : ""}`);
    setIsMobileMenuOpen(false);
    setIsSearchExpanded(false);
  };

  const navBg =
    scrolled || !isHome
      ? "bg-white/90 dark:bg-[#0a0a0f]/90 backdrop-blur-xl"
      : "bg-transparent";

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${navBg}`}
      >
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="flex h-[68px] items-center justify-between gap-4">
            {/* Logo */}
            <Link
              to="/"
              className="group flex items-center gap-2.5 shrink-0"
              aria-label="Home"
            >
              <div className="relative w-9 h-9 rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark,#c0392b)] flex items-center justify-center shadow-md shadow-[var(--color-primary)]/30 group-hover:scale-105 group-hover:shadow-lg group-hover:shadow-[var(--color-primary)]/40 transition-all duration-300">
                <Compass className="w-4.5 h-4.5 text-white" strokeWidth={2.2} />
              </div>
              <span className="hidden sm:block text-[16px] font-bold tracking-tight text-gray-900 dark:text-white">
                air<span className="text-[var(--color-primary)]">bnb</span>
              </span>
            </Link>

            {/* Desktop nav pills */}
            <nav className="hidden md:flex items-center gap-1 bg-gray-100/70 dark:bg-white/[0.06] rounded-full px-1.5 py-1.5">
              {NAV_ITEMS.map((item) => {
                const isActive =
                  location.pathname === item.to && item.to !== "/#contact";
                return (
                  <Link
                    key={item.label}
                    to={item.to}
                    className={[
                      "relative px-4 py-1.5 rounded-full text-[13px] font-semibold transition-all duration-200",
                      isActive
                        ? "bg-white dark:bg-white/[0.1] text-gray-900 dark:text-white shadow-sm"
                        : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200",
                    ].join(" ")}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Expandable search pill */}
            <div
              ref={searchRef}
              className="relative hidden md:block flex-1 max-w-[360px]"
            >
              <button
                onClick={() => setIsSearchExpanded((value) => !value)}
                className={[
                  "group w-full flex items-center gap-3 px-4 py-2.5 rounded-full border bg-white dark:bg-white/[0.05] transition-all duration-200 text-left",
                  isSearchExpanded
                    ? "border-[var(--color-primary)] shadow-lg shadow-black/10"
                    : "border-gray-200 dark:border-white/[0.1] hover:shadow-md",
                ].join(" ")}
              >
                <Search className="h-3.5 w-3.5 text-gray-400 group-hover:text-[var(--color-primary)] transition-colors" />
                <span className="flex-1 text-[13px] text-gray-500 dark:text-gray-400 truncate">
                  {getSearchSummary(where, maxPrice, guests)}
                </span>
                {(where || maxPrice || guests) && (
                  <span className="w-2 h-2 rounded-full bg-[var(--color-primary)] shrink-0" />
                )}
                <ChevronDown
                  className={`h-3.5 w-3.5 text-gray-400 transition-transform ${
                    isSearchExpanded ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isSearchExpanded && (
                <DesktopSearchPanel
                  where={where}
                  setWhere={setWhere}
                  maxPrice={maxPrice}
                  setMaxPrice={setMaxPrice}
                  guests={guests}
                  setGuests={setGuests}
                  onSearch={runSearch}
                  onClose={() => setIsSearchExpanded(false)}
                />
              )}
            </div>

            {/* Right side actions */}
            <div className="flex items-center gap-2">
              <ThemeToggle />

              {/* Favorites pill (desktop) */}
              {user && (
                <Link
                  to="/favorites"
                  className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-full text-[13px] font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/[0.07] transition-colors"
                >
                  <Heart
                    className={`h-4 w-4 ${favoritesCount > 0 ? "fill-[var(--color-primary)] text-[var(--color-primary)]" : ""}`}
                  />
                  {favoritesCount > 0 && (
                    <span className="text-[var(--color-primary)] font-semibold">
                      {favoritesCount}
                    </span>
                  )}
                </Link>
              )}

              {/* Profile menu */}
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setIsProfileOpen((v) => !v)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-full border border-gray-200 dark:border-white/[0.1] bg-white dark:bg-white/[0.05] hover:shadow-md transition-all duration-200"
                  aria-expanded={isProfileOpen}
                  aria-haspopup="true"
                >
                  <Avatar user={user} size={24} />
                  <span className="hidden sm:block text-[13px] font-semibold text-gray-800 dark:text-gray-200 max-w-[80px] truncate">
                    {user?.name?.split(" ")[0] || "Menu"}
                  </span>
                  <ChevronDown
                    className={`h-3.5 w-3.5 text-gray-400 transition-transform duration-200 ${isProfileOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {isProfileOpen && (
                  <ProfileMenu
                    user={user}
                    favoritesCount={favoritesCount}
                    logout={logout}
                    navigate={navigate}
                    close={() => setIsProfileOpen(false)}
                  />
                )}
              </div>

              {/* Mobile hamburger */}
              <button
                onClick={() => setIsMobileMenuOpen((v) => !v)}
                aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
                className="md:hidden flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 dark:border-white/[0.1] bg-white dark:bg-white/[0.05] text-gray-700 dark:text-gray-200 transition-colors hover:shadow-md"
              >
                {isMobileMenuOpen ? (
                  <X className="h-4 w-4" />
                ) : (
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 16 16"
                    stroke="currentColor"
                    strokeWidth={1.8}
                  >
                    <line x1="2" y1="5" x2="14" y2="5" />
                    <line x1="2" y1="11" x2="14" y2="11" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Mobile search bar (always visible on mobile) */}
          <div className="md:hidden pb-3">
            <MobileSearchBar
              where={where}
              setWhere={setWhere}
              maxPrice={maxPrice}
              setMaxPrice={setMaxPrice}
              guests={guests}
              setGuests={setGuests}
              onSearch={runSearch}
            />
          </div>
        </div>
      </header>

      {/* Mobile slide-down menu */}
      {isMobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="fixed inset-x-4 top-[76px] z-50 rounded-3xl border border-gray-100 dark:border-white/[0.08] bg-white dark:bg-[#0e0e16] shadow-2xl shadow-black/20 overflow-hidden md:hidden">
            <MobileMenu
              user={user}
              favoritesCount={favoritesCount}
              logout={logout}
              navigate={navigate}
              close={() => setIsMobileMenuOpen(false)}
            />
          </div>
        </>
      )}

      {/* Spacer */}
      <div className="h-[68px] md:h-[68px]" />
    </>
  );
}

function MobileSearchBar({
  where,
  setWhere,
  maxPrice,
  setMaxPrice,
  guests,
  setGuests,
  onSearch,
}: {
  where: string;
  setWhere: (v: string) => void;
  maxPrice: string;
  setMaxPrice: (v: string) => void;
  guests: string;
  setGuests: (v: string) => void;
  onSearch: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="flex flex-col gap-1.5 rounded-2xl border border-gray-200 dark:border-white/[0.1] bg-white dark:bg-white/[0.04] overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2.5">
        <Search className="h-4 w-4 text-gray-400 shrink-0" />
        <input
          value={where}
          onChange={(e) => setWhere(e.target.value)}
          onFocus={() => setExpanded(true)}
          onKeyDown={(e) => e.key === "Enter" && onSearch()}
          placeholder="Where are you going?"
          className="flex-1 bg-transparent text-sm text-gray-800 dark:text-gray-100 outline-none placeholder:text-gray-400"
        />
        <button
          onClick={onSearch}
          className="h-8 w-8 flex items-center justify-center rounded-xl bg-[var(--color-primary)] text-white shrink-0"
        >
          <Search className="h-3.5 w-3.5" />
        </button>
      </div>
      {expanded && (
        <div className="flex border-t border-gray-100 dark:border-white/[0.06]">
          <label className="flex flex-col px-3 py-2 flex-1 border-r border-gray-100 dark:border-white/[0.06]">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">
              Max price
            </span>
            <input
              type="number"
              min={1}
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder="Any"
              className="bg-transparent text-sm text-gray-800 dark:text-gray-100 outline-none placeholder:text-gray-400 w-full"
            />
          </label>
          <label className="flex flex-col px-3 py-2 flex-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">
              Guests
            </span>
            <input
              type="number"
              min={1}
              value={guests}
              onChange={(e) => setGuests(e.target.value)}
              placeholder="Any"
              className="bg-transparent text-sm text-gray-800 dark:text-gray-100 outline-none placeholder:text-gray-400 w-full"
            />
          </label>
        </div>
      )}
    </div>
  );
}

function DesktopSearchPanel({
  where,
  setWhere,
  maxPrice,
  setMaxPrice,
  guests,
  setGuests,
  onSearch,
  onClose,
}: {
  where: string;
  setWhere: (value: string) => void;
  maxPrice: string;
  setMaxPrice: (value: string) => void;
  guests: string;
  setGuests: (value: string) => void;
  onSearch: () => void;
  onClose: () => void;
}) {
  const clearSearch = () => {
    setWhere("");
    setMaxPrice("");
    setGuests("");
  };

  return (
    <div className="absolute right-0 top-full mt-2 w-[360px] overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl shadow-black/10 dark:border-white/[0.08] dark:bg-[#0e0e16]">
      <div className="flex items-center justify-between border-b border-gray-100 px-3.5 py-2.5 dark:border-white/[0.06]">
        <p className="text-[13px] font-semibold text-gray-950 dark:text-white">
          Search
        </p>
        <button
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/[0.06] dark:hover:text-white"
          aria-label="Close search"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="space-y-2 p-3">
        <SearchField
          icon={MapPin}
          label="Where"
          description="City or destination"
        >
          <input
            autoFocus
            value={where}
            onChange={(e) => setWhere(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSearch()}
            placeholder="Search destinations"
            className="mt-1 w-full bg-transparent text-[13px] font-medium text-gray-950 outline-none placeholder:text-gray-400 dark:text-white"
          />
        </SearchField>

        <SearchField icon={DollarSign} label="Price" description="Max price">
          <input
            type="number"
            min={1}
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSearch()}
            placeholder="Any price"
            className="mt-1 w-full bg-transparent text-[13px] font-medium text-gray-950 outline-none placeholder:text-gray-400 dark:text-white"
          />
        </SearchField>

        <SearchField icon={Users} label="Guests" description="How many people">
          <input
            type="number"
            min={1}
            value={guests}
            onChange={(e) => setGuests(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSearch()}
            placeholder="Any guests"
            className="mt-1 w-full bg-transparent text-[13px] font-medium text-gray-950 outline-none placeholder:text-gray-400 dark:text-white"
          />
        </SearchField>
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-gray-100 px-3 py-2.5 dark:border-white/[0.06]">
        <button
          onClick={clearSearch}
          className="rounded-lg px-3 py-2 text-[12px] font-semibold text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-950 dark:hover:bg-white/[0.06] dark:hover:text-white"
        >
          Clear
        </button>
        <button
          onClick={onSearch}
          className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 text-[12px] font-semibold text-white transition-colors hover:bg-[var(--color-primary-dark)]"
        >
          <Search className="h-3.5 w-3.5" />
          Search
        </button>
      </div>
    </div>
  );
}

function SearchField({
  icon: Icon,
  label,
  description,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5 transition-colors focus-within:border-[var(--color-primary)] focus-within:bg-white dark:border-white/[0.06] dark:bg-white/[0.04] dark:focus-within:bg-white/[0.06]">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-[var(--color-primary)] dark:bg-white/[0.06]">
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-bold uppercase tracking-widest text-gray-950 dark:text-white">
            {label}
          </span>
          <span className="text-[11px] text-gray-400">{description}</span>
        </span>
        {children}
      </span>
    </label>
  );
}

function getSearchSummary(where: string, maxPrice: string, guests: string) {
  const parts = [
    where.trim() || "Anywhere",
    maxPrice ? `Up to $${maxPrice}` : "Any price",
    guests ? `${guests} guests` : "Any guests",
  ];

  return parts.join(" · ");
}

function ProfileMenu({
  user,
  favoritesCount,
  logout,
  navigate,
  close,
}: {
  user: AuthUser | null;
  favoritesCount: number;
  logout: () => Promise<void>;
  navigate: ReturnType<typeof useNavigate>;
  close: () => void;
}) {
  return (
    <div className="absolute right-0 mt-3 w-60 rounded-2xl border border-gray-100 dark:border-white/[0.08] bg-white dark:bg-[#0e0e16] shadow-2xl shadow-black/10 overflow-hidden py-1.5">
      {user ? (
        <>
          <div className="px-4 py-3 flex items-center gap-3 border-b border-gray-50 dark:border-white/[0.05] mb-1">
            <Avatar user={user} size={36} />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {user.name}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                {user.email}
              </p>
            </div>
          </div>
          <DropItem to="/profile" close={close} icon={User} label="Profile" />
          <DropItem
            to="/bookings"
            close={close}
            icon={CalendarDays}
            label="My bookings"
          />
          <DropItem
            to="/messages"
            close={close}
            icon={MessageCircle}
            label="Messages"
          />
          <DropItem
            to="/favorites"
            close={close}
            icon={Heart}
            label={`Saved places${favoritesCount ? ` · ${favoritesCount}` : ""}`}
          />
          <div className="my-1.5 h-px bg-gray-50 dark:bg-white/[0.05]" />
          <button
            onClick={async () => {
              await logout();
              close();
              navigate("/");
            }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors text-left"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </>
      ) : (
        <>
          <DropItem to="/login" close={close} icon={User} label="Sign in" />
          <DropItem
            to="/register"
            close={close}
            icon={CalendarDays}
            label="Create account"
          />
        </>
      )}
    </div>
  );
}

function MobileMenu({
  user,
  favoritesCount,
  logout,
  navigate,
  close,
}: {
  user: AuthUser | null;
  favoritesCount: number;
  logout: () => Promise<void>;
  navigate: ReturnType<typeof useNavigate>;
  close: () => void;
}) {
  return (
    <div>
      {user && (
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-50 dark:border-white/[0.06]">
          <Avatar user={user} size={40} />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {user.name}
            </p>
            <p className="text-xs text-gray-400 truncate">{user.email}</p>
          </div>
        </div>
      )}
      <div className="p-2">
        <MobileItem
          to="/all-listings"
          close={close}
          icon={Home}
          label="Homes"
          desc="Browse all listings"
        />
        <MobileItem
          to="/bookings"
          close={close}
          icon={CalendarDays}
          label="Bookings"
          desc="Your reservations"
        />
        <MobileItem
          to="/messages"
          close={close}
          icon={MessageCircle}
          label="Messages"
          desc="Your conversations"
        />
        <MobileItem
          to="/favorites"
          close={close}
          icon={Heart}
          label="Saved places"
          desc={favoritesCount ? `${favoritesCount} saved` : "None saved yet"}
        />
        {!user && (
          <>
            <div className="my-2 h-px bg-gray-100 dark:bg-white/[0.06]" />
            <MobileItem
              to="/login"
              close={close}
              icon={User}
              label="Sign in"
              desc="Access your account"
            />
            <MobileItem
              to="/register"
              close={close}
              icon={CalendarDays}
              label="Create account"
              desc="Join for free"
            />
          </>
        )}
        {user && (
          <>
            <div className="my-2 h-px bg-gray-100 dark:bg-white/[0.06]" />
            <button
              onClick={async () => {
                await logout();
                close();
                navigate("/");
              }}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
            >
              <span className="w-9 h-9 flex items-center justify-center rounded-xl bg-red-50 dark:bg-red-500/10">
                <LogOut className="h-4 w-4 text-red-500" />
              </span>
              <div>
                <p className="text-sm font-semibold">Sign out</p>
              </div>
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function DropItem({
  to,
  icon: Icon,
  label,
  close,
}: {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  close: () => void;
}) {
  return (
    <Link
      to={to}
      onClick={close}
      className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors"
    >
      <Icon className="h-4 w-4 text-gray-400" />
      {label}
    </Link>
  );
}

function MobileItem({
  to,
  icon: Icon,
  label,
  desc,
  close,
}: {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  desc: string;
  close: () => void;
}) {
  return (
    <Link
      to={to}
      onClick={close}
      className="flex items-center gap-3 px-3 py-3 rounded-xl text-left hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors group"
    >
      <span className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-white/[0.07] group-hover:bg-[var(--color-primary)]/10 transition-colors">
        <Icon className="h-4 w-4 text-gray-500 dark:text-gray-400 group-hover:text-[var(--color-primary)] transition-colors" />
      </span>
      <div>
        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
          {label}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500">{desc}</p>
      </div>
    </Link>
  );
}

function Avatar({ user, size }: { user: AuthUser | null; size: number }) {
  if (user?.avatar) {
    return (
      <img
        src={user.avatar}
        alt={user.name}
        style={{ width: size, height: size }}
        className="shrink-0 rounded-full object-cover ring-2 ring-white dark:ring-white/10"
      />
    );
  }
  if (!user) {
    return (
      <span
        style={{ width: size, height: size }}
        className="flex shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-white/[0.07] text-gray-500 dark:text-gray-400"
      >
        <User style={{ width: size * 0.5, height: size * 0.5 }} />
      </span>
    );
  }
  return (
    <span
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      className="flex shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/15 font-bold uppercase text-[var(--color-primary)]"
    >
      {user.name?.charAt(0) || "U"}
    </span>
  );
}
