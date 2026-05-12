import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { toast } from "sonner";
import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleDashed,
  Home,
  MapPin,
  Search,
  X,
  XCircle,
} from "lucide-react";
import { useAuthStore } from "../store/auth.store";

interface Booking {
  id: string;
  checkIn: string;
  checkOut: string;
  totalPrice: number;
  status: "pending" | "confirmed" | "cancelled";
  createdAt: string;
  listing: {
    id: string;
    title: string;
    location: string;
    photos: string[];
    pricePerNight?: number;
  };
  guest: { name: string };
}

interface BookingsResponse {
  data: Booking[];
}

const tabs = ["upcoming", "past", "cancelled"] as const;
type Tab = (typeof tabs)[number];

const tabLabels: Record<Tab, string> = {
  upcoming: "Upcoming",
  past: "Past",
  cancelled: "Cancelled",
};

const statusStyle = {
  confirmed: {
    label: "Confirmed",
    icon: CheckCircle2,
    className:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
  },
  pending: {
    label: "Pending",
    icon: CircleDashed,
    className:
      "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
  },
  cancelled: {
    label: "Cancelled",
    icon: XCircle,
    className: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300",
  },
};

const emptyText: Record<Tab, string> = {
  upcoming: "Your next reservations will appear here after you book a stay.",
  past: "Completed stays will appear here after checkout.",
  cancelled: "Cancelled reservations will appear here.",
};

export default function Bookings() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>("upcoming");

  const { data: bookings, isLoading } = useQuery({
    queryKey: ["guest-bookings", activeTab],
    queryFn: async () => {
      const response = await api.get(`/bookings?status=${activeTab}`);
      return response.data as BookingsResponse;
    },
    enabled: !!user,
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/bookings/${id}`);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Booking cancelled");
      queryClient.invalidateQueries({ queryKey: ["guest-bookings"] });
    },
    onError: () => toast.error("Failed to cancel booking"),
  });

  const bookingList = useMemo(() => (Array.isArray(bookings?.data) ? bookings.data : []), [bookings?.data]);
  const totalNights = bookingList.reduce(
    (sum, booking) => sum + calcNights(booking.checkIn, booking.checkOut),
    0,
  );

  const handleCancel = (id: string) => {
    if (window.confirm("Cancel this reservation?")) {
      cancelMutation.mutate(id);
    }
  };

  if (!user) {
    return <GuestLoginPrompt />;
  }

  return (
    <div className="min-h-screen py-8">
      <div className="mx-auto w-full max-w-5xl">
        <header className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-gray-950 dark:text-white">
              Bookings
            </h1>
            <p className="mt-2 text-[14px] text-gray-500 dark:text-gray-400">
              {bookingList.length}{" "}
              {bookingList.length === 1 ? "reservation" : "reservations"} ·{" "}
              {totalNights} {totalNights === 1 ? "night" : "nights"}
            </p>
          </div>
          <Link
            to="/all-listings"
            className="inline-flex h-10 w-fit items-center justify-center gap-2 rounded-lg border border-gray-200 px-3.5 text-[13px] font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:border-white/[0.08] dark:text-gray-300 dark:hover:bg-white/[0.04]"
          >
            <Search className="h-4 w-4" />
            Find stays
          </Link>
        </header>

        <div className="mb-5 border-b border-gray-200 dark:border-white/[0.08]">
          <div className="flex gap-7 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`border-b-2 px-0.5 pb-3 text-[14px] font-semibold transition-colors ${
                  activeTab === tab
                    ? "border-gray-950 text-gray-950 dark:border-white dark:text-white"
                    : "border-transparent text-gray-500 hover:text-gray-950 dark:text-gray-400 dark:hover:text-white"
                }`}
              >
                {tabLabels[tab]}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <BookingSkeleton />
        ) : bookingList.length === 0 ? (
          <EmptyState activeTab={activeTab} />
        ) : (
          <div className="divide-y divide-gray-200 rounded-xl border border-gray-200 bg-white dark:divide-white/[0.08] dark:border-white/[0.08] dark:bg-[#111827]">
            {bookingList.map((booking) => (
              <BookingRow
                key={booking.id}
                booking={booking}
                onCancel={handleCancel}
                isCancelling={cancelMutation.isPending}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function GuestLoginPrompt() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-7 text-center dark:border-white/[0.08] dark:bg-[#111827]">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-(--color-primary)/10 text-(--color-primary)">
          <CalendarDays className="h-5 w-5" />
        </div>
        <h1 className="mt-5 text-lg font-semibold text-gray-950 dark:text-white">
          Sign in to view bookings
        </h1>
        <p className="mt-2 text-[14px] leading-6 text-gray-500 dark:text-gray-400">
          Your guest reservations are saved to your account.
        </p>
        <Link
          to="/login?redirect=/bookings"
          className="mt-6 inline-flex h-10 items-center justify-center rounded-lg bg-(--color-primary) px-5 text-[13px] font-semibold text-white transition-colors hover:bg-(--color-primary-dark)"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}

function BookingRow({
  booking,
  onCancel,
  isCancelling,
}: {
  booking: Booking;
  onCancel: (id: string) => void;
  isCancelling: boolean;
}) {
  const status = statusStyle[booking.status];
  const StatusIcon = status.icon;
  const nights = calcNights(booking.checkIn, booking.checkOut);

  return (
    <article className="grid gap-4 p-4 sm:grid-cols-[112px_minmax(0,1fr)] sm:p-5">
      <Link
        to={`/listings/${booking.listing.id}`}
        className="relative block aspect-[4/3] overflow-hidden rounded-lg bg-gray-100 dark:bg-white/[0.05] sm:aspect-square"
      >
        {booking.listing.photos?.[0] ? (
          <img
            src={booking.listing.photos[0]}
            alt={booking.listing.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gray-400">
            <Home className="h-5 w-5" />
          </div>
        )}
      </Link>

      <div className="min-w-0">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${status.className}`}
              >
                <StatusIcon className="h-3 w-3" />
                {status.label}
              </span>
              <span className="text-[12px] text-gray-400">
                Booked {formatDate(booking.createdAt)}
              </span>
            </div>
            <h2 className="mt-2 truncate text-[16px] font-semibold text-gray-950 dark:text-white">
              {booking.listing.title}
            </h2>
            <p className="mt-1 flex items-center gap-1.5 text-[13px] text-gray-500 dark:text-gray-400">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-(--color-primary)" />
              <span className="truncate">{booking.listing.location}</span>
            </p>
          </div>

          <div className="shrink-0 lg:text-right">
            <p className="text-[17px] font-semibold text-gray-950 dark:text-white">
              ${Math.round(booking.totalPrice)}
            </p>
            <p className="mt-0.5 text-[12px] text-gray-500 dark:text-gray-400">
              {nights} {nights === 1 ? "night" : "nights"}
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 border-t border-gray-100 pt-4 dark:border-white/[0.06] md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-gray-600 dark:text-gray-300">
            <span>
              <span className="text-gray-400">Check-in</span>{" "}
              {formatDate(booking.checkIn)}
            </span>
            <span>
              <span className="text-gray-400">Checkout</span>{" "}
              {formatDate(booking.checkOut)}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {booking.status === "pending" && (
              <button
                onClick={() => onCancel(booking.id)}
                disabled={isCancelling}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-red-200 px-3 text-[12px] font-semibold text-red-500 transition-colors hover:bg-red-50 disabled:opacity-50 dark:border-red-500/30 dark:hover:bg-red-500/10"
              >
                <X className="h-3.5 w-3.5" />
                {isCancelling ? "Cancelling" : "Cancel"}
              </button>
            )}
            <Link
              to={`/listings/${booking.listing.id}`}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-gray-950 px-3 text-[12px] font-semibold text-white transition-colors hover:bg-gray-800 dark:bg-white dark:text-gray-950"
            >
              View
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

function EmptyState({ activeTab }: { activeTab: Tab }) {
  return (
    <div className="flex min-h-[300px] items-center justify-center rounded-xl border border-gray-200 bg-white px-6 text-center dark:border-white/[0.08] dark:bg-[#111827]">
      <div className="max-w-sm">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-(--color-primary)/10 text-(--color-primary)">
          <CalendarDays className="h-5 w-5" />
        </div>
        <h2 className="mt-5 text-lg font-semibold text-gray-950 dark:text-white">
          No {tabLabels[activeTab].toLowerCase()} bookings
        </h2>
        <p className="mt-2 text-[14px] leading-6 text-gray-500 dark:text-gray-400">
          {emptyText[activeTab]}
        </p>
        <Link
          to="/all-listings"
          className="mt-6 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-(--color-primary) px-4 text-[13px] font-semibold text-white transition-colors hover:bg-(--color-primary-dark)"
        >
          <Search className="h-4 w-4" />
          Browse stays
        </Link>
      </div>
    </div>
  );
}

function BookingSkeleton() {
  return (
    <div className="divide-y divide-gray-200 rounded-xl border border-gray-200 bg-white dark:divide-white/[0.08] dark:border-white/[0.08] dark:bg-[#111827]">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="grid gap-4 p-4 sm:grid-cols-[112px_minmax(0,1fr)] sm:p-5"
        >
          <div className="aspect-[4/3] rounded-lg bg-gray-100 dark:bg-white/[0.05] animate-pulse sm:aspect-square" />
          <div className="space-y-4">
            <div className="h-5 w-28 rounded bg-gray-100 dark:bg-white/[0.05] animate-pulse" />
            <div className="h-5 w-2/3 rounded bg-gray-100 dark:bg-white/[0.05] animate-pulse" />
            <div className="h-4 w-1/2 rounded bg-gray-100 dark:bg-white/[0.05] animate-pulse" />
            <div className="h-10 rounded bg-gray-100 dark:bg-white/[0.05] animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function calcNights(checkIn: string, checkOut: string) {
  return Math.max(
    0,
    Math.ceil(
      (new Date(checkOut).getTime() - new Date(checkIn).getTime()) /
        (1000 * 60 * 60 * 24),
    ),
  );
}
