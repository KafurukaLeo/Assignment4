import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import axios from "axios";
import { api } from "../lib/api";
import { toast } from "sonner";
import {
  BadgeCheck,
  CalendarDays,
  Check,
  Clock3,
  Home,
  MapPin,
  ShieldCheck,
  Star,
  Users,
} from "lucide-react";
import type { Listing } from "../types";
import { useAuthStore } from "../store/auth.store";

export default function BookingForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");

  const { data: listing, isLoading } = useQuery({
    queryKey: ["listing", id],
    queryFn: async () => {
      const response = await api.get(`/listings/${id}`);
      return (response.data.listing ?? response.data) as Listing;
    },
    enabled: !!id,
  });

  const createBookingMutation = useMutation({
    mutationFn: async (bookingData: {
      listingId: string | undefined;
      checkIn: string;
      checkOut: string;
    }) => {
      const response = await api.post("/bookings", bookingData);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Booking request created");
      navigate("/bookings");
    },
    onError: (error: unknown) => {
      const message = axios.isAxiosError<{ message?: string }>(error)
        ? error.response?.data?.message
        : undefined;
      toast.error(message || "Failed to create booking");
    },
  });

  const nights = getNights(checkIn, checkOut);
  const subtotal = listing ? Math.round(nights * listing.pricePerNight) : 0;
  const serviceFee = nights > 0 ? 0 : 0;
  const totalPrice = subtotal + serviceFee;
  const today = new Date().toISOString().split("T")[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!checkIn || !checkOut) {
      toast.error("Please select check-in and check-out dates");
      return;
    }

    if (new Date(checkIn) >= new Date(checkOut)) {
      toast.error("Check-out must be after check-in");
      return;
    }

    createBookingMutation.mutate({ listingId: id, checkIn, checkOut });
  };

  if (!user) {
    return (
      <div className="flex min-h-[72vh] items-center justify-center px-4">
        <div className="max-w-md rounded-[2rem] border border-gray-200 bg-white p-8 text-center shadow-sm dark:border-white/[0.08] dark:bg-[#111827]">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-(--color-primary)/10 text-(--color-primary)">
            <CalendarDays className="h-6 w-6" />
          </div>
          <h1 className="mt-5 text-xl font-semibold text-gray-950 dark:text-white">
            Log in to reserve
          </h1>
          <p className="mt-2 text-[14px] leading-6 text-gray-500 dark:text-gray-400">
            Sign in to choose dates and create a booking request.
          </p>
          <Link
            to={`/login?redirect=/bookings/${id}`}
            className="mt-6 inline-flex rounded-xl bg-(--color-primary) px-5 py-3 text-[13px] font-semibold text-white transition-colors hover:bg-(--color-primary-dark)"
          >
            Continue to login
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <BookingFormSkeleton />;
  }

  if (!listing) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-gray-500">Listing not found.</p>
      </div>
    );
  }

  const photo = listing.photos?.[0];

  return (
    <div className="min-h-screen py-8">
      <div className="mb-8">
        <p className="text-[12px] font-semibold uppercase tracking-widest text-(--color-primary)">
          Reservation
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-gray-950 dark:text-white">
          Confirm your stay
        </h1>
        <p className="mt-2 max-w-2xl text-[14px] leading-6 text-gray-500 dark:text-gray-400">
          Review your trip dates, stay details, and estimated total before
          sending your booking request.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]"
      >
        <main className="space-y-6">
          <section className="overflow-hidden rounded-[1.75rem] border border-gray-200 bg-white dark:border-white/[0.08] dark:bg-[#111827]">
            <div className="grid md:grid-cols-[220px_1fr]">
              <div className="h-64 bg-gray-100 dark:bg-white/[0.05] md:h-full">
                {photo ? (
                  <img
                    src={photo}
                    alt={listing.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-gray-400">
                    <Home className="h-7 w-7" />
                  </div>
                )}
              </div>
              <div className="p-5 sm:p-6">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">
                      {listing.type}
                    </p>
                    <h2 className="mt-1 text-xl font-semibold text-gray-950 dark:text-white">
                      {listing.title}
                    </h2>
                    <p className="mt-2 flex items-center gap-1.5 text-[13px] text-gray-500 dark:text-gray-400">
                      <MapPin className="h-3.5 w-3.5 text-(--color-primary)" />
                      {listing.location}
                    </p>
                  </div>
                  {listing.rating && (
                    <span className="inline-flex w-fit items-center gap-1 rounded-full bg-gray-50 px-3 py-1.5 text-[13px] font-semibold text-gray-950 dark:bg-white/[0.06] dark:text-white">
                      <Star className="h-3.5 w-3.5 fill-gray-900 stroke-none dark:fill-white" />
                      {listing.rating.toFixed(2).replace(/0$/, "")}
                    </span>
                  )}
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <StayFact
                    icon={Users}
                    label="Guests"
                    value={`Up to ${listing.guests}`}
                  />
                  <StayFact
                    icon={Home}
                    label="Stay type"
                    value={listing.type}
                  />
                  <StayFact
                    icon={BadgeCheck}
                    label="Host"
                    value={listing.host?.name || "Verified"}
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[1.75rem] border border-gray-200 bg-white p-5 dark:border-white/[0.08] dark:bg-[#111827] sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-950 dark:text-white">
                  Choose dates
                </h2>
                <p className="mt-1 text-[14px] text-gray-500 dark:text-gray-400">
                  Your checkout date must be after check-in.
                </p>
              </div>
              <CalendarDays className="h-5 w-5 text-(--color-primary)" />
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <DateInput
                label="Check-in"
                value={checkIn}
                min={today}
                onChange={setCheckIn}
              />
              <DateInput
                label="Check-out"
                value={checkOut}
                min={checkIn || today}
                onChange={setCheckOut}
              />
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <TripDetail
                icon={CalendarDays}
                label="Check-in"
                value={checkIn ? formatDate(checkIn) : "Not selected"}
              />
              <TripDetail
                icon={CalendarDays}
                label="Check-out"
                value={checkOut ? formatDate(checkOut) : "Not selected"}
              />
              <TripDetail
                icon={Clock3}
                label="Duration"
                value={`${nights} ${nights === 1 ? "night" : "nights"}`}
              />
            </div>
          </section>

          <section className="rounded-[1.75rem] border border-gray-200 bg-white p-5 dark:border-white/[0.08] dark:bg-[#111827] sm:p-6">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 text-(--color-primary)" />
              <div>
                <h2 className="text-lg font-semibold text-gray-950 dark:text-white">
                  Request protected by Airbnb
                </h2>
                <p className="mt-1 text-[14px] leading-6 text-gray-500 dark:text-gray-400">
                  The backend creates this booking with pending status first.
                  Your host can then confirm or cancel it from their dashboard.
                </p>
              </div>
            </div>
          </section>

          {listing.amenities?.length > 0 && (
            <section className="rounded-[1.75rem] border border-gray-200 bg-white p-5 dark:border-white/[0.08] dark:bg-[#111827] sm:p-6">
              <h2 className="text-lg font-semibold text-gray-950 dark:text-white">
                Included with this stay
              </h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {listing.amenities.slice(0, 6).map((amenity) => (
                  <div
                    key={amenity}
                    className="flex items-center gap-3 text-[14px] text-gray-700 dark:text-gray-300"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-(--color-primary)/10 text-(--color-primary)">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                    {amenity}
                  </div>
                ))}
              </div>
            </section>
          )}
        </main>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-[1.75rem] border border-gray-200 bg-white p-5 shadow-lg shadow-black/[0.05] dark:border-white/[0.08] dark:bg-[#111827] dark:shadow-black/25">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[13px] text-gray-500 dark:text-gray-400">
                  Price
                </p>
                <p className="mt-1 text-2xl font-semibold text-gray-950 dark:text-white">
                  ${listing.pricePerNight}
                  <span className="text-[14px] font-normal text-gray-500">
                    {" "}
                    night
                  </span>
                </p>
              </div>
              <span className="rounded-full bg-(--color-primary)/10 px-3 py-1.5 text-[12px] font-semibold text-(--color-primary)">
                Pending request
              </span>
            </div>

            <div className="mt-5 overflow-hidden rounded-2xl border border-gray-200 dark:border-white/[0.08]">
              <SummaryField
                label="Check-in"
                value={checkIn ? formatDate(checkIn) : "Add date"}
              />
              <SummaryField
                label="Check-out"
                value={checkOut ? formatDate(checkOut) : "Add date"}
              />
              <SummaryField
                label="Guests"
                value={`Up to ${listing.guests} guests`}
              />
            </div>

            <div className="mt-5 space-y-3 text-[14px]">
              <PriceLine
                label={`$${listing.pricePerNight} x ${nights} nights`}
                value={`$${subtotal}`}
              />
              <PriceLine label="Service fee" value={`$${serviceFee}`} />
              <div className="border-t border-gray-200 pt-3 dark:border-white/[0.08]">
                <PriceLine label="Total" value={`$${totalPrice}`} strong />
              </div>
            </div>

            <button
              type="submit"
              disabled={createBookingMutation.isPending || nights <= 0}
              className="mt-5 w-full rounded-xl bg-(--color-primary) px-5 py-3.5 text-[14px] font-semibold text-white transition-colors hover:bg-(--color-primary-dark) disabled:cursor-not-allowed disabled:opacity-60"
            >
              {createBookingMutation.isPending
                ? "Creating request..."
                : "Reserve"}
            </button>
            <p className="mt-3 text-center text-[12px] text-gray-500 dark:text-gray-400">
              You will not be charged yet.
            </p>
          </div>
        </aside>
      </form>
    </div>
  );
}

function DateInput({
  label,
  value,
  min,
  onChange,
}: {
  label: string;
  value: string;
  min: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
        {label}
      </span>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        min={min}
        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-[14px] text-gray-950 outline-none transition-colors focus:border-(--color-primary) dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white"
      />
    </label>
  );
}

function StayFact({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-gray-50 p-4 dark:bg-white/[0.04]">
      <Icon className="h-4 w-4 text-(--color-primary)" />
      <p className="mt-3 text-[11px] font-semibold uppercase tracking-widest text-gray-400">
        {label}
      </p>
      <p className="mt-1 truncate text-[14px] font-semibold capitalize text-gray-950 dark:text-white">
        {value}
      </p>
    </div>
  );
}

function TripDetail({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 p-4 dark:border-white/[0.08]">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-gray-400">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className="mt-2 text-[14px] font-semibold text-gray-950 dark:text-white">
        {value}
      </p>
    </div>
  );
}

function SummaryField({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-gray-200 p-3 last:border-b-0 dark:border-white/[0.08]">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
        {label}
      </p>
      <p className="mt-1 text-[13px] font-semibold text-gray-950 dark:text-white">
        {value}
      </p>
    </div>
  );
}

function PriceLine({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div
      className={`flex justify-between gap-4 ${
        strong
          ? "text-[16px] font-semibold text-gray-950 dark:text-white"
          : "text-gray-600 dark:text-gray-300"
      }`}
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function BookingFormSkeleton() {
  return (
    <div className="min-h-screen py-8">
      <div className="mb-8 h-10 w-64 rounded-xl bg-gray-100 dark:bg-white/[0.05] animate-pulse" />
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          <div className="h-72 rounded-[1.75rem] bg-gray-100 dark:bg-white/[0.05] animate-pulse" />
          <div className="h-64 rounded-[1.75rem] bg-gray-100 dark:bg-white/[0.05] animate-pulse" />
        </div>
        <div className="h-96 rounded-[1.75rem] bg-gray-100 dark:bg-white/[0.05] animate-pulse" />
      </div>
    </div>
  );
}

function getNights(checkIn: string, checkOut: string) {
  if (!checkIn || !checkOut) return 0;
  return Math.max(
    0,
    Math.ceil(
      (new Date(checkOut).getTime() - new Date(checkIn).getTime()) /
        (1000 * 60 * 60 * 24),
    ),
  );
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
