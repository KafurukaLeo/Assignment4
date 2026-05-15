import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import {
  Building2,
  CalendarCheck,
  DollarSign,
  Star,
  Users,
  TrendingUp,
  Clock,
  MapPin,
  ChevronRight,
  Wallet,
} from "lucide-react";
import { useAuthStore } from "../../store/auth.store";
import { Link } from "react-router-dom";

interface Booking {
  id: string;
  totalPrice: number;
  status: string;
  listing?: { title: string; location?: string; photos?: string[] };
  guest?: { name: string };
  createdAt: string;
}

interface Listing {
  id: string;
  title: string;
  location: string;
  pricePerNight: number;
  _count?: { bookings: number };
}

interface DashboardStats {
  // Common / Host
  totalListings?: number;
  totalBookings?: number;
  totalRevenue?: number;
  averageRating?: number;
  pendingBookings?: number;
  
  // Admin specific
  totalUsers?: number;
  
  // Guest specific
  totalSpent?: number;
  totalReviews?: number;
  
  recentBookings: Booking[];
  topListings?: Listing[];
}

const getDashboardStats = async (): Promise<DashboardStats> => {
  const response = await api.get("/stats/dashboard");
  return response.data;
};

const statusConfig: Record<string, { label: string; class: string }> = {
  confirmed: {
    label: "Confirmed",
    class: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
  pending: {
    label: "Pending",
    class: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  },
  cancelled: {
    label: "Cancelled",
    class: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  },
};

export default function Dashboard() {
  const { user } = useAuthStore();
  const [dashboardMode, setDashboardMode] = useState<"hosting" | "traveling">("hosting");
  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: getDashboardStats,
  });

  if (isLoading) {
    return <DashboardLoadingSkeleton />;
  }

  const role = user?.role || "guest";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[13px] text-[#AAAAAA] mb-0.5 capitalize">{role} Dashboard</p>
          <h1
            style={{ fontFamily: "'Playfair Display', serif" }}
            className="text-2xl font-semibold text-[#111] dark:text-white"
          >
            Welcome back, {user?.name}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {role === "host" && (
            <div className="flex p-1 bg-gray-100 dark:bg-white/[0.05] rounded-xl mr-4">
              <button
                onClick={() => setDashboardMode("hosting")}
                className={`px-4 py-1.5 text-[12px] font-semibold rounded-lg transition-all ${
                  dashboardMode === "hosting"
                    ? "bg-white dark:bg-[#1A1A1A] text-(--color-primary) shadow-sm"
                    : "text-[#AAAAAA] hover:text-[#717171]"
                }`}
              >
                Hosting
              </button>
              <button
                onClick={() => setDashboardMode("traveling")}
                className={`px-4 py-1.5 text-[12px] font-semibold rounded-lg transition-all ${
                  dashboardMode === "traveling"
                    ? "bg-white dark:bg-[#1A1A1A] text-(--color-primary) shadow-sm"
                    : "text-[#AAAAAA] hover:text-[#717171]"
                }`}
              >
                Traveling
              </button>
            </div>
          )}
          <div className="hidden sm:block text-right">
            <p className="text-[12px] text-[#AAAAAA]">Last updated</p>
            <p className="text-[13px] font-medium text-[#111] dark:text-white">
              {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {role === "admin" && <AdminStats stats={stats} />}
        {role === "host" && (
          dashboardMode === "hosting" ? (
            <HostStats stats={stats} />
          ) : (
            <GuestStats stats={{
              ...stats,
              totalBookings: (stats as any).guestStats?.totalBookings,
              totalSpent: (stats as any).guestStats?.totalSpent,
              recentBookings: (stats as any).recentGuestBookings
            }} />
          )
        )}
        {role === "guest" && <GuestStats stats={stats} />}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentBookings 
          role={dashboardMode === "traveling" ? "guest" : role} 
          bookings={(dashboardMode === "traveling" ? (stats as any).recentGuestBookings : stats?.recentBookings) || []} 
        />
        {dashboardMode === "hosting" && role !== "guest" ? (
          <TopListings listings={stats?.topListings || []} />
        ) : (
          <GuestQuickActions />
        )}
      </div>
    </div>
  );
}

function AdminStats({ stats }: { stats?: DashboardStats }) {
  const items = [
    { label: "Total Users", value: stats?.totalUsers, icon: Users, accent: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20" },
    { label: "Total Listings", value: stats?.totalListings, icon: Building2, accent: "text-violet-500", bg: "bg-violet-50 dark:bg-violet-900/20" },
    { label: "Total Bookings", value: stats?.totalBookings, icon: CalendarCheck, accent: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
    { label: "Platform Revenue", value: `$${stats?.totalRevenue?.toLocaleString()}`, icon: DollarSign, accent: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-900/20" },
  ];

  return <>{items.map((item, i) => <StatCard key={i} {...item} />)}</>;
}

function HostStats({ stats }: { stats?: DashboardStats }) {
  const items = [
    { label: "My Revenue", value: `$${stats?.totalRevenue?.toLocaleString()}`, icon: DollarSign, accent: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
    { label: "Total Bookings", value: stats?.totalBookings, icon: CalendarCheck, accent: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20" },
    { label: "My Listings", value: stats?.totalListings, icon: Building2, accent: "text-violet-500", bg: "bg-violet-50 dark:bg-violet-900/20" },
    { label: "Avg Rating", value: stats?.averageRating?.toFixed(1) || "0.0", icon: Star, accent: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-900/20" },
  ];

  return <>{items.map((item, i) => <StatCard key={i} {...item} />)}</>;
}

function GuestStats({ stats }: { stats?: DashboardStats }) {
  const items = [
    { label: "Total Trips", value: stats?.totalBookings, icon: CalendarCheck, accent: "text-indigo-500", bg: "bg-indigo-50 dark:bg-indigo-900/20" },
    { label: "Total Spent", value: `$${stats?.totalSpent?.toLocaleString()}`, icon: Wallet, accent: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
    { label: "Reviews Written", value: stats?.totalReviews, icon: Star, accent: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-900/20" },
    { label: "Upcoming", value: stats?.recentBookings?.filter(b => b.status === "confirmed").length, icon: Clock, accent: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20" },
  ];

  return <>{items.map((item, i) => <StatCard key={i} {...item} />)}</>;
}

function StatCard({ label, value, icon: Icon, accent, bg }: any) {
  return (
    <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl p-4 border border-[#F0F0F0] dark:border-[#2A2A2A] flex flex-col gap-3">
      <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center`}>
        <Icon className={`w-4 h-4 ${accent}`} />
      </div>
      <div>
        <p className="text-[11px] text-[#AAAAAA] mb-0.5">{label}</p>
        <p className="text-xl font-semibold text-[#111] dark:text-white">{value ?? 0}</p>
      </div>
    </div>
  );
}

function RecentBookings({ role, bookings }: { role: string; bookings: Booking[] }) {
  return (
    <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-[#F0F0F0] dark:border-[#2A2A2A] overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#F0F0F0] dark:border-[#2A2A2A]">
        <h2 style={{ fontFamily: "'Playfair Display', serif" }} className="text-base font-semibold text-[#111] dark:text-white">
          {role === "guest" ? "Your Recent Trips" : "Recent Bookings"}
        </h2>
        <Link to="/dashboard/bookings" className="flex items-center gap-1 text-[12px] text-(--color-primary) hover:underline">
          View all <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="divide-y divide-[#F5F5F5] dark:divide-[#2A2A2A]">
        {bookings.length > 0 ? (
          bookings.map((booking) => {
            const s = statusConfig[booking.status?.toLowerCase()] || { label: booking.status, class: "bg-gray-100 text-gray-600" };
            return (
              <div key={booking.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-[#FAFAFA] dark:hover:bg-[#222] transition-colors">
                <div className="flex items-center gap-3">
                   {role === "guest" && booking.listing?.photos?.[0] ? (
                     <img src={booking.listing.photos[0]} className="w-10 h-10 rounded-lg object-cover" />
                   ) : (
                     <div className="w-10 h-10 rounded-lg bg-gray-50 dark:bg-white/[0.05] flex items-center justify-center">
                       <CalendarCheck className="w-4 h-4 text-gray-400" />
                     </div>
                   )}
                  <div>
                    <p className="text-[13px] font-medium text-[#111] dark:text-white truncate max-w-[160px]">
                      {booking.listing?.title || "Unknown Listing"}
                    </p>
                    <p className="text-[12px] text-[#AAAAAA] mt-0.5">
                      {role === "guest" ? booking.listing?.location : booking.guest?.name}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <p className="text-[13px] font-semibold text-[#111] dark:text-white">
                    ${booking.totalPrice}
                  </p>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${s.class}`}>
                    {s.label}
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-[13px] text-[#AAAAAA] px-5 py-8 text-center">No bookings found</p>
        )}
      </div>
    </div>
  );
}

function TopListings({ listings }: { listings: Listing[] }) {
  return (
    <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-[#F0F0F0] dark:border-[#2A2A2A] overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#F0F0F0] dark:border-[#2A2A2A]">
        <h2 style={{ fontFamily: "'Playfair Display', serif" }} className="text-base font-semibold text-[#111] dark:text-white">
          Top Performing Listings
        </h2>
        <Link to="/dashboard/listings" className="flex items-center gap-1 text-[12px] text-(--color-primary) hover:underline">
          View all <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="divide-y divide-[#F5F5F5] dark:divide-[#2A2A2A]">
        {listings.length > 0 ? (
          listings.map((listing, i) => (
            <div key={listing.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-[#FAFAFA] dark:hover:bg-[#222] transition-colors">
              <span className="text-[12px] font-bold text-[#CCCCCC] dark:text-[#555] w-4 shrink-0">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-[#111] dark:text-white truncate">{listing.title}</p>
                <p className="text-[12px] text-[#AAAAAA] mt-0.5 flex items-center gap-1">
                  <MapPin className="w-3 h-3 shrink-0" /> {listing.location}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[13px] font-semibold text-[#111] dark:text-white">${listing.pricePerNight}<span className="text-[11px] font-normal text-[#AAAAAA]">/night</span></p>
                <p className="text-[12px] text-[#AAAAAA] mt-0.5">{listing._count?.bookings ?? 0} bookings</p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-[13px] text-[#AAAAAA] px-5 py-8 text-center">No listings found</p>
        )}
      </div>
    </div>
  );
}

function GuestQuickActions() {
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-[#F0F0F0] dark:border-[#2A2A2A] p-5">
        <h2 style={{ fontFamily: "'Playfair Display', serif" }} className="text-base font-semibold text-[#111] dark:text-white mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <Link to="/" className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-100 dark:border-white/[0.05] hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
            <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-500">
               <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-[12px] font-medium text-gray-700 dark:text-gray-300">Book Again</span>
          </Link>
          <Link to="/profile" className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-100 dark:border-white/[0.05] hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
            <div className="w-10 h-10 rounded-full bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-500">
               <Users className="w-5 h-5" />
            </div>
            <span className="text-[12px] font-medium text-gray-700 dark:text-gray-300">Edit Profile</span>
          </Link>
        </div>
      </div>
      
      <div className="bg-(--color-primary) rounded-2xl p-6 text-white overflow-hidden relative group">
        <div className="relative z-10">
          <h3 className="text-lg font-bold mb-1">Become a Host</h3>
          <p className="text-[13px] opacity-90 mb-4 max-w-[200px]">Earn money by sharing your extra space with travelers.</p>
          <Link to="/become-a-host" className="inline-flex items-center gap-2 px-4 py-2 bg-white text-(--color-primary) text-[12px] font-bold rounded-lg hover:bg-opacity-90 transition-all">
             Start Hosting <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <Building2 className="absolute -bottom-4 -right-4 w-32 h-32 opacity-10 group-hover:scale-110 transition-transform duration-500" />
      </div>
    </div>
  );
}

function DashboardLoadingSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div className="h-8 w-56 bg-[#EBEBEB] dark:bg-[#2A2A2A] rounded-lg animate-pulse" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 rounded-2xl bg-[#EBEBEB] dark:bg-[#2A2A2A] animate-pulse" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-96 rounded-2xl bg-[#EBEBEB] dark:bg-[#2A2A2A] animate-pulse" />
        <div className="h-96 rounded-2xl bg-[#EBEBEB] dark:bg-[#2A2A2A] animate-pulse" />
      </div>
    </div>
  );
}
