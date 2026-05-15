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
  MessageCircle,
  ChevronDown,
  DollarSign,
  Users,
  LayoutDashboard,
  Bell,
  Check,
  ShieldCheck
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { api } from "../../lib/api";
import ThemeToggle from "../ThemeToggle";
import { useAuthStore } from "../../store/auth.store";
import type { User as AuthUser } from "../../store/auth.store";
import Logo from "./Logo";

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

  const { data: notificationsData, refetch: refetchNotifications } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await api.get("/notifications");
      return res.data as { notifications: any[], unreadCount: number };
    },
    enabled: !!user,
    refetchInterval: 5000
  });

  const unreadCount = notificationsData?.unreadCount || 0;
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

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
      if (notificationRef.current && !notificationRef.current.contains(e.target as Node)) {
        setIsNotificationsOpen(false);
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
      // Use a longer delay to ensure the Home page has fully rendered its ContactSection
      const timer = window.setTimeout(() => {
        const el = document.getElementById("contact");
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [location.hash, location.pathname]);

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
            <Logo />


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

              {/* Notifications */}
              {user && (
                <div className="relative" ref={notificationRef}>
                  <button
                    onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                    className="relative flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 dark:border-white/[0.1] bg-white dark:bg-white/[0.05] text-gray-700 dark:text-gray-200 transition-all hover:shadow-md"
                  >
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--color-primary)] text-[9px] font-bold text-white ring-2 ring-white dark:ring-[#0a0a0f]">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </button>

                  {isNotificationsOpen && (
                    <NotificationDropdown 
                      notifications={notificationsData?.notifications || []} 
                      unreadCount={unreadCount}
                      onClose={() => setIsNotificationsOpen(false)}
                      onRead={refetchNotifications}
                    />
                  )}
                </div>
              )}

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

              {/* Become a Host / Host Dashboard link */}
              {user && user.role !== "admin" && (
                <Link
                  to={user.role === "host" ? "/dashboard" : "/become-a-host"}
                  className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-all"
                >
                  {user.role === "host" ? "Switch to Hosting" : "Become a Host"}
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
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  {user.name}
                </p>
                <span className="shrink-0 px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-white/[0.1] text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-white/[0.05]">
                  {user.role}
                </span>
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                {user.email}
              </p>
            </div>
          </div>
          <DropItem to="/profile" close={close} icon={User} label="Profile" />
          {user.role === "admin" && (
            <DropItem to="/admin" close={close} icon={LayoutDashboard} label="Admin Dashboard" />
          )}
          {user.role === "host" && (
            <DropItem to="/dashboard" close={close} icon={LayoutDashboard} label="Host Dashboard" />
          )}
          {user.role === "guest" && (
            <DropItem to="/become-a-host" close={close} icon={ShieldCheck} label="Become a Host" />
          )}
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
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {user.name}
              </p>
              <span className="shrink-0 px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-white/[0.1] text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-white/[0.05]">
                {user.role}
              </span>
            </div>
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
        {user?.role === "admin" && (
          <MobileItem
            to="/admin"
            close={close}
            icon={LayoutDashboard}
            label="Admin Dashboard"
            desc="Manage the whole system"
          />
        )}
        {user?.role === "host" && (
          <MobileItem
            to="/dashboard"
            close={close}
            icon={LayoutDashboard}
            label="Host Dashboard"
            desc="Manage your listings"
          />
        )}
        {user?.role === "guest" && (
          <MobileItem
            to="/become-a-host"
            close={close}
            icon={ShieldCheck}
            label="Become a Host"
            desc="Start earning today"
          />
        )}
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

function NotificationDropdown({ 
  notifications, 
  unreadCount, 
  onClose, 
  onRead 
}: { 
  notifications: any[], 
  unreadCount: number, 
  onClose: () => void,
  onRead: () => void
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const markReadMutation = useMutation({
    mutationFn: () => api.patch("/notifications/read"),
    onSuccess: () => {
      onRead();
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }
  });

  return (
    <div className="absolute right-0 mt-3 w-[320px] rounded-2xl border border-gray-100 dark:border-white/[0.08] bg-white dark:bg-[#0e0e16] shadow-2xl shadow-black/10 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-50 dark:border-white/[0.05] flex items-center justify-between">
        <h3 className="text-sm font-bold">Notifications</h3>
        {unreadCount > 0 && (
          <button 
            onClick={() => markReadMutation.mutate()}
            className="text-[11px] font-semibold text-[var(--color-primary)] hover:underline flex items-center gap-1"
          >
            <Check size={12} />
            Mark all read
          </button>
        )}
      </div>
      <div className="max-h-[360px] overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-8 text-center">
            <Bell className="mx-auto h-8 w-8 text-gray-200 mb-2" />
            <p className="text-xs text-gray-400">No notifications yet</p>
          </div>
        ) : (
          notifications.map((n: any) => (
            <button
              key={n.id}
              onClick={() => {
                if (n.link) navigate(n.link);
                onClose();
              }}
              className={`w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors flex gap-3 border-b border-gray-50 dark:border-white/[0.03] last:border-0 ${!n.isRead ? 'bg-gray-50/50 dark:bg-white/[0.02]' : ''}`}
            >
              <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${n.type === 'message' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>
                {n.type === 'message' ? <MessageCircle size={14} /> : <CalendarDays size={14} />}
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-[13px] leading-tight mb-1 ${!n.isRead ? 'font-bold' : 'font-medium'}`}>{n.title}</p>
                <p className="text-[12px] text-gray-500 dark:text-gray-400 line-clamp-2">{n.content}</p>
                <p className="text-[10px] text-gray-400 mt-1.5">
                  {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(n.createdAt))}
                </p>
              </div>
              {!n.isRead && <div className="w-2 h-2 rounded-full bg-[var(--color-primary)] mt-1 shrink-0" />}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
