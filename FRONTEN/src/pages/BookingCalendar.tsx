import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import Calendar from "../components/Calendar";
import { toast } from "sonner";
import { CalendarDays, MapPin, Users } from "lucide-react";
import type { Listing } from "../types";

export default function BookingCalendar() {
  const { id } = useParams<{ id: string }>();
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [checkIn, setCheckIn] = useState<Date | null>(null);
  const [checkOut, setCheckOut] = useState<Date | null>(null);
  const [guests, setGuests] = useState(1);

  const { data: listing, isLoading } = useQuery({
    queryKey: ["listing", id],
    queryFn: async () => {
      const response = await api.get(`/listings/${id}`);
      return (response.data.listing ?? response.data) as Listing;
    },
    enabled: !!id,
  });

  const handleDateSelect = (date: Date) => {
    if (!checkIn) {
      setCheckIn(date);
      setSelectedDates([date]);
    } else if (!checkOut && date > checkIn) {
      setCheckOut(date);
      const dates = [];
      const current = new Date(checkIn);
      while (current <= date) {
        dates.push(new Date(current));
        current.setDate(current.getDate() + 1);
      }
      setSelectedDates(dates);
    } else {
      setCheckIn(date);
      setCheckOut(null);
      setSelectedDates([date]);
    }
  };

  const handleDateRemove = (date: Date) => {
    if (date.toDateString() === checkIn?.toDateString()) {
      setCheckIn(null);
      setCheckOut(null);
      setSelectedDates([]);
    } else if (date.toDateString() === checkOut?.toDateString()) {
      setCheckOut(null);
      const dates = checkIn ? [checkIn] : [];
      const current = new Date(checkIn || date);
      current.setDate(current.getDate() + 1);
      while (current < date) {
        dates.push(new Date(current));
        current.setDate(current.getDate() + 1);
      }
      setSelectedDates(dates);
    }
  };

  const nights =
    checkIn && checkOut
      ? Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
      : 0;
  const totalPrice = listing ? nights * listing.pricePerNight * guests : 0;

  const handleBooking = async () => {
    if (!checkIn || !checkOut || !listing) {
      toast.error("Please select check-in and check-out dates");
      return;
    }

    try {
      await api.post("/bookings", {
        listingId: listing.id,
        checkIn: checkIn.toISOString(),
        checkOut: checkOut.toISOString(),
      });
      toast.success("Booking request sent successfully");
      setCheckIn(null);
      setCheckOut(null);
      setSelectedDates([]);
    } catch {
      toast.error("Failed to create booking");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] py-8">
        <div className="h-96 rounded-2xl bg-gray-100 dark:bg-white/[0.05] animate-pulse" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-gray-500">Listing not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="mb-8">
        <p className="text-[12px] font-semibold uppercase tracking-widest text-gray-400">
          Calendar
        </p>
        <h1
          style={{ fontFamily: "'Playfair Display', serif" }}
          className="mt-1 text-3xl font-semibold text-gray-950 dark:text-white"
        >
          Select dates
        </h1>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <main className="space-y-6">
          <div className="overflow-hidden rounded-[1.5rem] border border-gray-200 bg-white dark:border-white/[0.08] dark:bg-[#111827]">
            {listing.photos?.[0] && (
              <img
                src={listing.photos[0]}
                alt={listing.title}
                className="h-72 w-full object-cover"
              />
            )}
            <div className="p-5">
              <h2 className="text-xl font-semibold text-gray-950 dark:text-white">
                {listing.title}
              </h2>
              <p className="mt-2 flex items-center gap-1.5 text-[14px] text-gray-500 dark:text-gray-400">
                <MapPin className="h-4 w-4 text-(--color-primary)" />
                {listing.location}
              </p>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-gray-200 bg-white p-4 dark:border-white/[0.08] dark:bg-[#111827]">
            <Calendar
              selectedDates={selectedDates}
              onDateSelect={handleDateSelect}
              onDateRemove={handleDateRemove}
            />
          </div>
        </main>

        <aside className="lg:sticky lg:top-24">
          <div className="rounded-[1.5rem] border border-gray-200 bg-white p-5 shadow-xl shadow-black/[0.06] dark:border-white/[0.08] dark:bg-[#111827]">
            <h2 className="text-lg font-semibold text-gray-950 dark:text-white">
              Booking details
            </h2>
            <div className="mt-5 space-y-3">
              <DetailRow
                icon={CalendarDays}
                label="Check-in"
                value={checkIn ? checkIn.toLocaleDateString() : "Select a date"}
              />
              <DetailRow
                icon={CalendarDays}
                label="Check-out"
                value={checkOut ? checkOut.toLocaleDateString() : "Select a date"}
              />
              <label className="block rounded-xl bg-gray-50 p-3 dark:bg-white/[0.04]">
                <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-gray-400">
                  <Users className="h-3 w-3" />
                  Guests
                </span>
                <select
                  value={guests}
                  onChange={(e) => setGuests(Number(e.target.value))}
                  className="mt-2 w-full bg-transparent text-[14px] font-semibold text-gray-950 outline-none dark:text-white"
                >
                  {Array.from({ length: Math.max(1, listing.guests) }).map((_, i) => {
                    const num = i + 1;
                    return (
                      <option key={num} value={num}>
                        {num} {num === 1 ? "guest" : "guests"}
                      </option>
                    );
                  })}
                </select>
              </label>
            </div>

            <div className="mt-5 border-t border-gray-200 pt-5 dark:border-white/[0.08]">
              <div className="flex justify-between text-[14px] text-gray-600 dark:text-gray-300">
                <span>
                  ${listing.pricePerNight} x {nights} nights
                </span>
                <span>${totalPrice}</span>
              </div>
              <div className="mt-3 flex justify-between text-lg font-semibold text-gray-950 dark:text-white">
                <span>Total</span>
                <span>${totalPrice}</span>
              </div>
            </div>

            <button
              onClick={handleBooking}
              disabled={!checkIn || !checkOut}
              className="mt-5 w-full rounded-xl bg-(--color-primary) px-5 py-3.5 text-[14px] font-semibold text-white transition-colors hover:bg-(--color-primary-dark) disabled:cursor-not-allowed disabled:opacity-60"
            >
              Book now
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-gray-50 p-3 dark:bg-white/[0.04]">
      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-gray-400">
        <Icon className="h-3 w-3" />
        {label}
      </p>
      <p className="mt-2 text-[14px] font-semibold text-gray-950 dark:text-white">
        {value}
      </p>
    </div>
  );
}
