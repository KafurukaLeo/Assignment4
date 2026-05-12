import { Menu, User, LogOut } from "lucide-react";
import type { UserProps } from "../../types";
import ThemeToggle from "../ThemeToggle";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useAuthStore, type User as AuthUser } from "../../store/auth.store";

interface HeaderProps {
  setIsOpen: (isOpen: boolean) => void;
  user: UserProps & Pick<AuthUser, "role">;
}

export default function Header({ setIsOpen, user }: HeaderProps) {
  const [profileOpen, setProfileOpen] = useState(false);
  const { logout } = useAuthStore();
  const profilePath = user.role === "admin" ? "/admin" : "/dashboard/profile";

  return (
    <div className="flex items-center justify-between h-14 px-4 bg-white dark:bg-[#1A1A1A] border-b border-[#EBEBEB] dark:border-[#2A2A2A] sticky top-0 z-10">
      {/* Left */}
      <button
        onClick={() => setIsOpen(true)}
        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F5F5F5] dark:hover:bg-[#2A2A2A] transition-colors md:hidden"
      >
        <Menu className="w-4 h-4 text-[#717171]" />
      </button>

      {/* Right */}
      <div className="flex items-center gap-2 ml-auto">
        <ThemeToggle />

        <div className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl hover:bg-[#F5F5F5] dark:hover:bg-[#2A2A2A] transition-colors"
          >
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name || ""}
                className="w-7 h-7 rounded-full object-cover"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-(--color-primary) flex items-center justify-center text-white text-[12px] font-semibold shrink-0">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="text-[13px] font-medium text-[#111] dark:text-white hidden sm:block capitalize">
              {user?.name}
            </span>
          </button>

          {profileOpen && (
            <>
              <div
                className="fixed inset-0 z-20"
                onClick={() => setProfileOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#1A1A1A] border border-[#EBEBEB] dark:border-[#2A2A2A] rounded-2xl shadow-lg overflow-hidden z-30">
                <div className="p-1.5">
                  <Link
                    to={profilePath}
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2.5 text-[13px] text-[#717171] dark:text-[#AAAAAA] hover:bg-[#F5F5F5] dark:hover:bg-[#2A2A2A] hover:text-[#111] dark:hover:text-white rounded-xl transition-colors"
                  >
                    <User className="w-4 h-4" />
                    Profile
                  </Link>
                  <div className="h-px bg-[#EBEBEB] dark:bg-[#2A2A2A] my-1" />
                  <button
                    onClick={logout}
                    className="flex items-center gap-2.5 w-full px-3 py-2.5 text-[13px] text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
