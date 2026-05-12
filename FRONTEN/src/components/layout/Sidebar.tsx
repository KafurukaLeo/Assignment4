import { Link, useLocation } from "react-router-dom";
import { ChevronLeft, X } from "lucide-react";
import { AdminLinks, DashboardLinks } from "../../data";
import { useAuthStore } from "../../store/auth.store";

interface NavLinksProps {
  activeLink: string;
  collapsed: boolean;
  role?: string;
  onClickLink?: () => void;
}

const NavLinks = ({ activeLink, collapsed, role, onClickLink }: NavLinksProps) => {
  const links = role === "admin" ? AdminLinks : DashboardLinks;

  return (
    <div className="flex flex-col gap-1 px-3">
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
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
            isActive
              ? "bg-(--color-primary) text-white"
              : "text-[#717171] dark:text-[#AAAAAA] hover:bg-[#F5F5F5] dark:hover:bg-[#2A2A2A] hover:text-[#111] dark:hover:text-white"
          } ${collapsed ? "justify-center px-0" : ""}`}
        >
          <Icon className="w-4.5 h-4.5 shrink-0" />
          {!collapsed && (
            <span className="text-[13px] font-medium truncate">
              {link.title}
            </span>
          )}
        </Link>
      );
    })}
    </div>
  );
};

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export default function Sidebar({
  collapsed,
  setCollapsed,
  setIsOpen,
  isOpen,
}: SidebarProps) {
  const location = useLocation();
  const { user } = useAuthStore();
  const title = user?.role === "admin" ? "Admin" : "Dashboard";

  return (
    <>
      <div
        className={`h-screen fixed top-0 left-0 bg-white dark:bg-[#1A1A1A] border-r border-[#EBEBEB] dark:border-[#2A2A2A] transition-all duration-300 hidden md:flex flex-col z-20 ${
          collapsed ? "w-16" : "w-60"
        }`}
      >
        <div
          className={`flex items-center h-14 px-4 border-b border-[#EBEBEB] dark:border-[#2A2A2A] shrink-0 ${
            collapsed ? "justify-center" : "justify-between"
          }`}
        >
          {!collapsed && (
            <span
              style={{ fontFamily: "'Playfair Display', serif" }}
              className="text-[16px] font-semibold text-[#111] dark:text-white"
            >
              {title}
            </span>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#F5F5F5] dark:hover:bg-[#2A2A2A] transition-colors"
          >
            <ChevronLeft
              className={`w-4 h-4 text-[#AAAAAA] transition-transform duration-300 ${
                collapsed ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>
        <nav className="flex-1 py-4 overflow-y-auto">
          <NavLinks
            activeLink={location.pathname}
            collapsed={collapsed}
            role={user?.role}
          />
        </nav>
        {!collapsed && (
          <div className="px-5 py-4 border-t border-[#EBEBEB] dark:border-[#2A2A2A]">
            <p className="text-[11px] text-[#CCCCCC] dark:text-[#555]">
              © {new Date().getFullYear()} Airbnb
            </p>
          </div>
        )}
      </div>
      <div
        className={`fixed top-0 left-0 h-screen bg-white dark:bg-[#1A1A1A] border-r border-[#EBEBEB] dark:border-[#2A2A2A] z-30 transition-transform duration-300 md:hidden w-60 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between h-14 px-4 border-b border-[#EBEBEB] dark:border-[#2A2A2A]">
          <span
            style={{ fontFamily: "'Playfair Display', serif" }}
            className="text-[16px] font-semibold text-[#111] dark:text-white"
          >
            {title}
          </span>
          <button
            onClick={() => setIsOpen(false)}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#F5F5F5] dark:hover:bg-[#2A2A2A] transition-colors"
          >
            <X className="w-4 h-4 text-[#AAAAAA]" />
          </button>
        </div>

        <nav className="flex-1 py-4 overflow-y-auto">
          <NavLinks
            activeLink={location.pathname}
            collapsed={false}
            role={user?.role}
            onClickLink={() => setIsOpen(false)}
          />
        </nav>

        <div className="px-5 py-4 border-t border-[#EBEBEB] dark:border-[#2A2A2A]">
          <p className="text-[11px] text-[#CCCCCC] dark:text-[#555]">
            © {new Date().getFullYear()} Airbnb
          </p>
        </div>
      </div>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-20 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
