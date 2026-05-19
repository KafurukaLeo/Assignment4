import { Link, useLocation } from "react-router-dom";
import { ChevronLeft, X, ShieldCheck, User as UserIcon } from "lucide-react";
import { motion } from "framer-motion";
import { AdminLinks, DashboardLinks } from "../../data";
import { useAuthStore } from "../../store/auth.store";
import type { User as AuthUser } from "../../store/auth.store";
import Logo from "./Logo";

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
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
        <UserIcon style={{ width: size * 0.5, height: size * 0.5 }} />
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


interface NavLinksProps {
  activeLink: string;
  collapsed: boolean;
  role?: string;
  onClickLink?: () => void;
}

const NavLinks = ({ activeLink, collapsed, role, onClickLink }: NavLinksProps) => {
  let links = role === "admin" ? AdminLinks : DashboardLinks;

  if (role === "guest") {
    links = links.filter(link => link.url !== "/dashboard/listings");
    links.push({
      title: "Become a Host",
      url: "/become-a-host",
      icon: ShieldCheck,
    });
  }

  return (
    <div className="flex flex-col gap-1.5 px-3">
      {links.map((link, index) => {
        const Icon = link.icon;
        const isActive =
          link.url === "/dashboard"
            ? activeLink === link.url
            : activeLink === link.url || activeLink.startsWith(`${link.url}/`);
        return (
          <Link
            to={link.url}
            key={index}
            onClick={onClickLink}
            title={collapsed ? link.title : ""}
            className={`group relative flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all duration-300 ${
              isActive
                ? "bg-white dark:bg-white/[0.08] text-[var(--color-primary)] premium-shadow"
                : "text-[var(--text-sub)] hover:bg-[var(--bg-sub)] hover:text-[var(--text-main)]"
            } ${collapsed ? "justify-center px-0" : ""}`}
          >
            {isActive && (
              <motion.div
                layoutId="active-nav"
                className="absolute left-0 w-1 h-5 bg-[var(--color-primary)] rounded-r-full"
              />
            )}
            <Icon className={`w-4.5 h-4.5 shrink-0 transition-colors ${isActive ? "text-[var(--color-primary)]" : "group-hover:text-[var(--text-main)]"}`} />
            {!collapsed && (
              <span className={`text-[13px] font-medium truncate ${isActive ? "font-bold" : ""}`}>
                {link.title}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
};

export default function Sidebar({
  collapsed,
  setCollapsed,
  setIsOpen,
  isOpen,
}: SidebarProps) {
  const location = useLocation();
  const { user } = useAuthStore();

  return (
    <>
      <div
        className={`h-screen fixed top-0 left-0 bg-[var(--bg-main)] border-r border-[var(--border-main)] transition-all duration-500 hidden md:flex flex-col z-20 ${
          collapsed ? "w-20" : "w-64"
        }`}
      >
        <div
          className={`flex items-center h-[72px] px-5 border-b border-[var(--border-main)] shrink-0 ${
            collapsed ? "justify-center" : "justify-between"
          }`}
        >
          <Logo 
            className={`${collapsed ? "scale-75" : "scale-90"} transition-all`} 
            showText={!collapsed} 
          />
          {!collapsed && (
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-[var(--bg-sub)] text-[var(--text-sub)] hover:text-[var(--text-main)] transition-all"
            >
              <ChevronLeft
                className={`w-4 h-4 transition-transform duration-300 ${
                  collapsed ? "rotate-180" : ""
                }`}
              />
            </button>
          )}
        </div>
        <nav className="flex-1 py-6 overflow-y-auto custom-scrollbar">
          <NavLinks
            activeLink={location.pathname}
            collapsed={collapsed}
            role={user?.role}
          />
        </nav>
        
        {user && !collapsed && (
          <div className="mx-4 mb-4 p-4 rounded-2xl bg-[var(--bg-sub)] border border-[var(--border-main)]">
            <div className="flex items-center gap-3">
              <Avatar user={user} size={32} />
              <div className="min-w-0">
                <p className="text-[12px] font-bold text-[var(--text-main)] truncate">{user.name}</p>
                <p className="text-[10px] text-[var(--text-sub)] truncate capitalize">{user.role}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div
        className={`fixed top-0 left-0 h-screen bg-[var(--bg-main)] border-r border-[var(--border-main)] z-40 transition-transform duration-500 md:hidden w-64 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between h-[72px] px-5 border-b border-[var(--border-main)]">
          <Logo className="scale-90" />
          <button
            onClick={() => setIsOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-[var(--bg-sub)] text-[var(--text-sub)] transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex-1 py-6 overflow-y-auto">
          <NavLinks
            activeLink={location.pathname}
            collapsed={false}
            role={user?.role}
            onClickLink={() => setIsOpen(false)}
          />
        </nav>

        <div className="p-6 border-t border-[var(--border-main)]">
           <div className="flex items-center gap-3">
              <Avatar user={user} size={36} />
              <div className="min-w-0">
                <p className="text-[13px] font-bold text-[var(--text-main)] truncate">{user?.name}</p>
                <p className="text-[11px] text-[var(--text-sub)] truncate capitalize">{user?.role}</p>
              </div>
            </div>
        </div>
      </div>
      
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}

