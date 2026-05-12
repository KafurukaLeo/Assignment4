import { useState } from "react";
import { bookingHeader, searchPriceRange } from "../../data";
import {
  Search,
  SlidersHorizontal,
  ChevronDown,
  CalendarDays,
  MapPin,
  DollarSign,
  Check,
  X,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { toast } from "sonner";

const statusConfig: Record<string, { label: string; class: string }> = {
  confirmed: {
    label: "Confirmed",
    class:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
  pending: {
    label: "Pending",
    class:
      "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  },
  cancelled: {
    label: "Cancelled",
    class: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  },
};

interface Booking {
  id: string;
  guest: {
    name: string;
    email: string;
  };
  listing: {
    title: string;
    location: string;
  };
  checkIn: string;
  checkOut: string;
  status: string;
  totalPrice: number;
}

export default function DashboardBooking() {
  const [searchText, setSearchText] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const { data: response, isLoading } = useQuery({
    queryKey: ["host-bookings"],
    queryFn: async () => {
      const response = await api.get("/bookings");
      return response.data;
    },
  });

  const bookings = response?.data || [];
  const queryClient = useQueryClient();

  const updateBookingMutation = useMutation({
    mutationFn: async ({ bookingId, status }: { bookingId: string; status: string }) => {
      const response = await api.patch(`/bookings/${bookingId}/status`, { status });
      return response.data;
    },
    onSuccess: () => {
      toast.success("Booking status updated successfully");
      queryClient.invalidateQueries({ queryKey: ["host-bookings"] });
    },
    onError: () => {
      toast.error("Failed to update booking status");
    },
  });

  const handleUpdateStatus = (bookingId: string, status: string) => {
    updateBookingMutation.mutate({ bookingId, status });
  };

  const filterOptions = [
    { icon: MapPin, label: "Location" },
    { icon: CalendarDays, label: "Category" },
    ...searchPriceRange.map((price: string) => ({
      icon: DollarSign,
      label: price,
    })),
  ];

  return (
    <div className="relative">
      {/* Toolbar */}
      <div className="py-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-[#EBEBEB] dark:border-[#2A2A2A]">
        <div className="relative w-full sm:w-auto">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="w-4 h-4 text-[#AAAAAA]" />
          </div>
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search bookings…"
            className="block w-full sm:w-72 pl-9 pr-3 py-2 bg-[#F7F7F7] dark:bg-[#222] border border-[#EBEBEB] dark:border-[#2A2A2A] text-[#111] dark:text-white text-sm rounded-xl focus:ring-2 focus:ring-[#111] dark:focus:ring-white focus:border-transparent placeholder:text-[#AAAAAA] outline-none transition-all"
          />
        </div>

        <div className="relative shrink-0">
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-xl border transition-all outline-none ${
              activeFilter
                ? "bg-[#111] dark:bg-white text-white dark:text-[#111] border-[#111] dark:border-white"
                : "bg-[#F7F7F7] dark:bg-[#222] border-[#EBEBEB] dark:border-[#2A2A2A] text-[#717171] hover:text-[#111] dark:hover:text-white hover:bg-[#EBEBEB] dark:hover:bg-[#2A2A2A]"
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            {activeFilter ?? "Filter by"}
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform ${filterOpen ? "rotate-180" : ""}`}
            />
          </button>

          {filterOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setFilterOpen(false)}
              />
              <div className="absolute right-0 top-full mt-2 z-50 bg-white dark:bg-[#1A1A1A] border border-[#EBEBEB] dark:border-[#2A2A2A] rounded-2xl shadow-xl w-52 overflow-hidden">
                <div className="p-1.5">
                  {activeFilter && (
                    <>
                      <button
                        onClick={() => {
                          setActiveFilter(null);
                          setFilterOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-[12px] text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                      >
                        Clear filter
                      </button>
                      <div className="h-px bg-[#EBEBEB] dark:bg-[#2A2A2A] my-1" />
                    </>
                  )}
                  {filterOptions.map(({ icon: Icon, label }) => (
                    <button
                      key={label}
                      onClick={() => {
                        setActiveFilter(label);
                        setFilterOpen(false);
                      }}
                      className={`flex items-center gap-2.5 w-full px-3 py-2.5 text-[13px] rounded-xl transition-colors ${
                        activeFilter === label
                          ? "bg-[#F0F0F0] dark:bg-[#2A2A2A] text-[#111] dark:text-white font-medium"
                          : "text-[#717171] hover:bg-[#F7F7F7] dark:hover:bg-[#222] hover:text-[#111] dark:hover:text-white"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Active filter pill */}
      {activeFilter && (
        <div className="flex items-center gap-2 py-2.5">
          <span className="text-[12px] text-[#AAAAAA]">Filtered by:</span>
          <span className="flex items-center gap-1.5 text-[12px] font-medium px-2.5 py-1 bg-[#F0F0F0] dark:bg-[#2A2A2A] text-[#111] dark:text-white rounded-full">
            {activeFilter}
            <button
              onClick={() => setActiveFilter(null)}
              className="text-[#AAAAAA] hover:text-[#111] dark:hover:text-white ml-0.5"
            >
              ×
            </button>
          </span>
        </div>
      )}

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b border-[#EBEBEB] dark:border-[#2A2A2A]">
              {bookingHeader.map((header: string) => (
                <th
                  key={header}
                  className="px-4 py-3 text-[12px] font-semibold text-[#AAAAAA] uppercase tracking-wide whitespace-nowrap"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td
                  colSpan={bookingHeader.length}
                  className="px-6 py-20 text-center"
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#F7F7F7] dark:bg-[#2A2A2A] flex items-center justify-center">
                      <CalendarDays className="w-5 h-5 text-[#CCCCCC]" />
                    </div>
                    <p className="text-[13px] font-medium text-[#111] dark:text-white">
                      Loading bookings...
                    </p>
                  </div>
                </td>
              </tr>
            ) : bookings && bookings.length > 0 ? (
              bookings.map((booking: Booking) => (
                <tr
                  key={booking.id}
                  className="border-b border-[#EBEBEB] dark:border-[#2A2A2A]"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium">
                          {booking.guest?.name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {booking.guest?.name}
                        </p>
                        <p className="text-xs text-[#AAAAAA]">
                          {booking.guest?.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium text-sm">
                        {booking.listing?.title}
                      </p>
                      <p className="text-xs text-[#AAAAAA]">
                        {booking.listing?.location}
                      </p>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div>
                      <p className="text-sm">
                        {new Date(booking.checkIn).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-[#AAAAAA]">
                        to {new Date(booking.checkOut).toLocaleDateString()}
                      </p>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {booking.status === "pending" && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(booking.id, "confirmed")}
                            className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-md transition-colors"
                            disabled={updateBookingMutation.isPending}
                          >
                            <Check className="w-3 h-3" />
                            Confirm
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(booking.id, "cancelled")}
                            className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-md transition-colors"
                            disabled={updateBookingMutation.isPending}
                          >
                            <X className="w-3 h-3" />
                            Cancel
                          </button>
                        </>
                      )}
                      {booking.status === "confirmed" && (
                        <button
                          onClick={() => handleUpdateStatus(booking.id, "cancelled")}
                          className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-md transition-colors"
                          disabled={updateBookingMutation.isPending}
                        >
                          <X className="w-3 h-3" />
                          Cancel
                        </button>
                      )}
                      {booking.status === "cancelled" && (
                        <span className="text-xs text-gray-500">No actions</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusConfig[booking.status]?.class || "bg-gray-100 text-gray-700"}`}>
                      {statusConfig[booking.status]?.label || booking.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-medium text-sm">${booking.totalPrice}</p>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={bookingHeader.length}
                  className="px-6 py-20 text-center"
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#F7F7F7] dark:bg-[#2A2A2A] flex items-center justify-center">
                      <CalendarDays className="w-5 h-5 text-[#CCCCCC]" />
                    </div>
                    <p className="text-[13px] font-medium text-[#111] dark:text-white">
                      No bookings yet
                    </p>
                    <p className="text-[12px] text-[#AAAAAA]">
                      Bookings will appear here once guests start reserving
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile empty state */}
      <div className="block md:hidden py-20 text-center">
        {isLoading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#F7F7F7] dark:bg-[#2A2A2A] flex items-center justify-center">
              <CalendarDays className="w-5 h-5 text-[#CCCCCC]" />
            </div>
            <p className="text-[13px] font-medium text-[#111] dark:text-white">
              Loading bookings...
            </p>
          </div>
        ) : bookings && bookings.length > 0 ? (
          <div className="space-y-4">
            {bookings.map((booking: Booking) => (
              <div
                key={booking.id}
                className="bg-white dark:bg-[#1A1A1A] border border-[#EBEBEB] dark:border-[#2A2A2A] rounded-2xl p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium">
                        {booking.guest?.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">{booking.guest?.name}</p>
                      <p className="text-xs text-[#AAAAAA]">{booking.guest?.email}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusConfig[booking.status]?.class || "bg-gray-100 text-gray-700"}`}>
                    {statusConfig[booking.status]?.label || booking.status}
                  </span>
                </div>
                <div className="space-y-2">
                  <div>
                    <p className="font-medium text-sm">{booking.listing?.title}</p>
                    <p className="text-xs text-[#AAAAAA]">{booking.listing?.location}</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm">{new Date(booking.checkIn).toLocaleDateString()}</p>
                      <p className="text-xs text-[#AAAAAA]">to {new Date(booking.checkOut).toLocaleDateString()}</p>
                    </div>
                    <p className="font-medium text-sm">${booking.totalPrice}</p>
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    {booking.status === "pending" && (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(booking.id, "confirmed")}
                          className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-md transition-colors"
                          disabled={updateBookingMutation.isPending}
                        >
                          <Check className="w-3 h-3" />
                          Confirm
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(booking.id, "cancelled")}
                          className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-md transition-colors"
                          disabled={updateBookingMutation.isPending}
                        >
                          <X className="w-3 h-3" />
                          Cancel
                        </button>
                      </>
                    )}
                    {booking.status === "confirmed" && (
                      <button
                        onClick={() => handleUpdateStatus(booking.id, "cancelled")}
                        className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-md transition-colors"
                        disabled={updateBookingMutation.isPending}
                      >
                        <X className="w-3 h-3" />
                        Cancel
                      </button>
                    )}
                    {booking.status === "cancelled" && (
                      <span className="text-xs text-gray-500">No actions</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#F7F7F7] dark:bg-[#2A2A2A] flex items-center justify-center">
              <CalendarDays className="w-5 h-5 text-[#CCCCCC]" />
            </div>
            <p className="text-[13px] font-medium text-[#111] dark:text-white">
              No bookings yet
            </p>
            <p className="text-[12px] text-[#AAAAAA]">
              Bookings will appear here once guests start reserving
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="px-4 py-3 flex items-center justify-between border-t border-[#EBEBEB] dark:border-[#2A2A2A]">
        <p className="text-[12px] text-[#AAAAAA]">Showing {bookings?.length || 0} bookings</p>
        <div className="flex items-center gap-1">
          <button
            disabled
            className="text-[12px] px-3 py-1.5 rounded-lg text-[#AAAAAA] disabled:opacity-40 hover:bg-[#F7F7F7] dark:hover:bg-[#222] transition-colors"
          >
            Previous
          </button>
          <span className="text-[12px] text-[#AAAAAA] px-2">1 / 1</span>
          <button
            disabled
            className="text-[12px] px-3 py-1.5 rounded-lg text-[#AAAAAA] disabled:opacity-40 hover:bg-[#F7F7F7] dark:hover:bg-[#222] transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
