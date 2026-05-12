import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { useAuthStore } from "../../store/auth.store";
import { Clock3, ShieldAlert } from "lucide-react";

export default function DashboardLayout() {
  const [isOpen, setIsOpen] = useState(false);
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const { user } = useAuthStore();
  const isBlockedHost =
    user?.role === "host" && user.hostStatus && user.hostStatus !== "approved";

  return (
    <div className="flex min-h-screen bg-[#F7F7F7] dark:bg-[#111]">
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        isOpen={isOpen}
        setIsOpen={setIsOpen}
      />

      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out ${
          collapsed ? "md:ml-16" : "md:ml-60"
        }`}
      >
        {user && <Header setIsOpen={setIsOpen} user={user} />}
        <main className="p-4 lg:p-6">
          {isBlockedHost ? (
            <HostStatusNotice
              status={user.hostStatus as "pending" | "restricted"}
            />
          ) : (
            <Outlet />
          )}
        </main>
      </div>
    </div>
  );
}

function HostStatusNotice({ status }: { status: "pending" | "restricted" }) {
  const isPending = status === "pending";
  const Icon = isPending ? Clock3 : ShieldAlert;

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-md rounded-lg border border-[#EBEBEB] bg-white p-6 text-center dark:border-[#2A2A2A] dark:bg-[#1A1A1A]">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-[#F7F7F7] dark:bg-[#2A2A2A]">
          <Icon className="h-5 w-5 text-(--color-primary)" />
        </div>
        <h1
          style={{ fontFamily: "'Playfair Display', serif" }}
          className="mt-4 text-xl font-semibold text-[#111] dark:text-white"
        >
          {isPending ? "Host account pending" : "Host account restricted"}
        </h1>
        <p className="mt-2 text-[14px] leading-6 text-[#717171] dark:text-[#AAAAAA]">
          {isPending
            ? "An admin needs to approve your host account before you can manage listings and bookings."
            : "Your host account is currently restricted. Listing and booking management are disabled."}
        </p>
      </div>
    </div>
  );
}
