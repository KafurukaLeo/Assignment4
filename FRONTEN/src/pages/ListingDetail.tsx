import { Link, useNavigate, useParams } from "react-router-dom";
import {
  CalendarDays,
  Car,
  Check,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Heart,
  Home,
  MapPin,
  Share2,
  Star,
  Users,
  Utensils,
  Waves,
  Wifi,
  Wind,
} from "lucide-react";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { Listing } from "../types";
import Spinner from "../components/Spinner";
import { useAuthStore } from "../store/auth.store";
import { toast } from "sonner";
import axios from "axios";
import { getImageUrl } from "../lib/utils";

const amenityIcons: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  wifi: Wifi,
  parking: Car,
  kitchen: Utensils,
  gym: Dumbbell,
  pool: Waves,
  ac: Wind,
};

export default function ListingDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [isSaved, setIsSaved] = useState(false);
  const [sliderIndex, setSliderIndex] = useState(0);

  const {
    data: listing,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["listing", id],
    queryFn: async () => {
      const res = await api.get(`/listings/${id}`);
      return (res.data.listing ?? res.data) as Listing;
    },
    enabled: !!id,
  });

  const conversationMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post("/conversations", { listingId: id });
      return response.data as { conversation: { id: string } };
    },
    onSuccess: (data) => {
      navigate(`/messages/${data.conversation.id}`);
    },
    onError: (error: unknown) => {
      const message = axios.isAxiosError<{ message?: string }>(error)
        ? error.response?.data?.message
        : undefined;
      toast.error(message || "Could not start conversation");
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-red-500">Failed to load listing.</p>
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

  const images = listing.photos?.length
    ? listing.photos
    : ["/image/hero-background.jpg"];
  const currentImage = getImageUrl(images[sliderIndex % images.length]);
  const thumbnailImages = images
    .map((photo, index) => ({ photo, index }))
    .filter((item) => item.index !== sliderIndex)
    .slice(0, 3);
  const mapUrl = getMapUrl(listing.location);

  const prevSlide = () =>
    setSliderIndex((index) => (index === 0 ? images.length - 1 : index - 1));
  const nextSlide = () =>
    setSliderIndex((index) => (index === images.length - 1 ? 0 : index + 1));
  const handleMessageHost = () => {
    if (!user) {
      navigate(`/login?redirect=/listings/${id}`);
      return;
    }

    if (user.id === listing.hostId) {
      toast.error("You cannot message yourself");
      return;
    }

    navigate(`/messages/${listing.hostId}`);
  };

  return (
    <div className="min-h-screen pb-14">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-5 flex items-center justify-between gap-4">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-[13px] font-semibold text-gray-600 transition-colors hover:text-gray-950 dark:text-gray-300 dark:hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </button>
          <div className="flex items-center gap-2">
            <button className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-700 transition-colors hover:bg-gray-50 dark:border-white/[0.08] dark:text-gray-300 dark:hover:bg-white/[0.04]">
              <Share2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setIsSaved((value) => !value)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-700 transition-colors hover:bg-gray-50 dark:border-white/[0.08] dark:text-gray-300 dark:hover:bg-white/[0.04]"
            >
              <Heart
                className={`h-4 w-4 ${isSaved ? "fill-(--color-primary) text-(--color-primary)" : ""}`}
              />
            </button>
          </div>
        </div>

        <header className="mb-5">
          <h1 className="max-w-4xl text-2xl font-semibold tracking-tight text-gray-950 dark:text-white md:text-3xl">
            {listing.title}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[14px] text-gray-500 dark:text-gray-400">
            {listing.rating && (
              <span className="inline-flex items-center gap-1 font-semibold text-gray-950 dark:text-white">
                <Star className="h-4 w-4 fill-gray-900 stroke-none dark:fill-white" />
                {formatRating(listing.rating)}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              {listing.location}
            </span>
            <span className="inline-flex items-center gap-1.5 capitalize">
              <Home className="h-4 w-4" />
              {listing.type}
            </span>
          </div>
        </header>

        <section className="mb-8">
          <div className="relative overflow-hidden rounded-xl bg-gray-100 dark:bg-white/[0.05] md:hidden">
            <img
              src={currentImage}
              alt={listing.title}
              className="h-80 w-full object-cover"
            />
            {images.length > 1 && (
              <>
                <button
                  onClick={prevSlide}
                  className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-950 shadow-sm"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={nextSlide}
                  className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-950 shadow-sm"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </>
            )}
          </div>

          {thumbnailImages.length > 0 && (
            <div className="mt-2 grid grid-cols-3 gap-2 md:hidden">
              {thumbnailImages.map(({ photo, index }) => (
                <button
                  key={`${photo}-${index}`}
                  onClick={() => setSliderIndex(index)}
                  className="aspect-[4/3] overflow-hidden rounded-lg bg-gray-100 dark:bg-white/[0.05]"
                >
                  <img
                    src={getImageUrl(photo)}
                    alt={`${listing.title} ${index + 1}`}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          <div className="hidden h-[430px] grid-cols-[minmax(0,1fr)_180px] gap-2 md:grid">
            <div className="overflow-hidden rounded-xl bg-gray-100 dark:bg-white/[0.05]">
              <img
                src={currentImage}
                alt={listing.title}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="grid grid-rows-3 gap-2">
              {thumbnailImages.map(({ photo, index }) => (
                <button
                  key={`${photo}-${index}`}
                  onClick={() => setSliderIndex(index)}
                  className="overflow-hidden rounded-xl bg-gray-100 dark:bg-white/[0.05]"
                >
                  <img
                    src={getImageUrl(photo)}
                    alt={`${listing.title} ${index + 1}`}
                    className="h-full w-full object-cover transition-transform duration-200 hover:scale-105"
                  />
                </button>
              ))}
            </div>
          </div>
        </section>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_330px] lg:gap-12">
          <main className="min-w-0">
            <section className="border-b border-gray-200 pb-6 dark:border-white/[0.08]">
              <div className="flex items-start justify-between gap-5">
                <div>
                  <h2 className="text-xl capitalize font-semibold text-gray-950 dark:text-white">
                    {listing.type}
                  </h2>
                  <p className="mt-2 text-[14px] text-gray-500 dark:text-gray-400">
                    Up to {listing.guests}{" "}
                    {listing.guests === 1 ? "guest" : "guests"}
                  </p>
                </div>
                <HostAvatar listing={listing} />
              </div>
            </section>

            <section className="grid gap-3 border-b border-gray-200 py-6 dark:border-white/[0.08] sm:grid-cols-3">
              <Fact icon={Users} label="Guests" value={`${listing.guests}`} />
              <Fact icon={Home} label="Type" value={listing.type} />
              <Fact
                icon={CalendarDays}
                label="Nightly"
                value={`$${listing.pricePerNight}`}
              />
            </section>

            <section className="border-b border-gray-200 py-7 dark:border-white/[0.08]">
              <h2 className="text-xl font-semibold text-gray-950 dark:text-white">
                About this place
              </h2>
              <p className="mt-4 max-w-3xl text-[15px] leading-7 text-gray-600 dark:text-gray-300">
                {listing.description ||
                  "This stay has the essentials for a comfortable visit."}
              </p>
            </section>

            <section className="border-b border-gray-200 py-7 dark:border-white/[0.08]">
              <h2 className="text-xl font-semibold text-gray-950 dark:text-white">
                What this place offers
              </h2>
              <div className="mt-5 grid gap-x-8 gap-y-4 sm:grid-cols-2">
                {(listing.amenities?.length
                  ? listing.amenities
                  : ["Private stay", "Guest ready"]
                ).map((amenity) => {
                  const Icon = amenityIcons[amenity.toLowerCase()] || Check;
                  return (
                    <div
                      key={amenity}
                      className="flex items-center gap-3 text-[14px] text-gray-700 dark:text-gray-300"
                    >
                      <Icon className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                      <span className="capitalize">{amenity}</span>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="border-b border-gray-200 py-7 dark:border-white/[0.08]">
              <h2 className="text-xl font-semibold text-gray-950 dark:text-white">
                Location
              </h2>
              <p className="mt-2 flex items-center gap-1.5 text-[14px] text-gray-500 dark:text-gray-400">
                <MapPin className="h-4 w-4" />
                {listing.location}
              </p>
              <div className="mt-5 overflow-hidden rounded-xl border border-gray-200 bg-gray-100 dark:border-white/[0.08] dark:bg-white/[0.05]">
                <iframe
                  title="Property location"
                  width="100%"
                  height="300"
                  style={{ border: 0 }}
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                  src={mapUrl}
                />
              </div>
            </section>
          </main>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/[0.08] dark:bg-[#111827]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-2xl font-semibold text-gray-950 dark:text-white">
                    ${listing.pricePerNight}
                    <span className="text-[14px] font-normal text-gray-500">
                      {" "}
                      night
                    </span>
                  </p>
                  <p className="mt-1 text-[13px] text-gray-500 dark:text-gray-400">
                    Taxes and fees calculated during booking.
                  </p>
                </div>
                {listing.rating && (
                  <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-gray-950 dark:text-white">
                    <Star className="h-3.5 w-3.5 fill-gray-900 stroke-none dark:fill-white" />
                    {formatRating(listing.rating)}
                  </span>
                )}
              </div>

              <button
                onClick={() => navigate(`/bookings/${id}`)}
                className="mt-5 h-11 w-full rounded-lg bg-(--color-primary) px-5 text-[14px] font-semibold text-white transition-colors hover:bg-(--color-primary-dark)"
              >
                Reserve
              </button>
              <button
                onClick={handleMessageHost}
                disabled={conversationMutation.isPending}
                className="mt-3 h-10 w-full rounded-lg border border-gray-200 px-4 text-[13px] font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-white/[0.08] dark:text-gray-300 dark:hover:bg-white/[0.04]"
              >
                {conversationMutation.isPending
                  ? "Opening chat..."
                  : "Message host"}
              </button>
              <p className="mt-3 text-center text-[12px] text-gray-500 dark:text-gray-400">
                You will choose dates on the next step.
              </p>

              <div className="mt-5 space-y-3 border-t border-gray-200 pt-5 text-[14px] dark:border-white/[0.08]">
                <InfoLine label="Max guests" value={`${listing.guests}`} />
                <InfoLine label="Property type" value={listing.type} />
                <InfoLine
                  label="Host"
                  value={listing.host?.name || "Verified"}
                />
              </div>

              <Link
                to={`/listings/${id}/reviews`}
                className="mt-5 inline-flex h-10 w-full items-center justify-center rounded-lg border border-gray-200 px-4 text-[13px] font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:border-white/[0.08] dark:text-gray-300 dark:hover:bg-white/[0.04]"
              >
                Read reviews
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function HostAvatar({ listing }: { listing: Listing }) {
  if (listing.host?.avatar) {
    return (
      <img
        src={listing.host.avatar}
        alt={listing.host.name || "Host"}
        className="h-12 w-12 shrink-0 rounded-full object-cover"
      />
    );
  }

  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gray-100 text-base font-semibold text-gray-700 dark:bg-white/[0.08] dark:text-gray-200">
      {(listing.host?.name || "H").charAt(0).toUpperCase()}
    </div>
  );
}

function Fact({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-gray-50 px-4 py-3 dark:bg-white/[0.04]">
      <Icon className="h-4 w-4 text-gray-700 dark:text-gray-300" />
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">
          {label}
        </p>
        <p className="mt-0.5 text-[14px] font-semibold capitalize text-gray-950 dark:text-white">
          {value}
        </p>
      </div>
    </div>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-gray-500 dark:text-gray-400">{label}</span>
      <span className="font-medium capitalize text-gray-950 dark:text-white">
        {value}
      </span>
    </div>
  );
}

function formatRating(rating: number) {
  return rating.toFixed(2).replace(/0$/, "");
}

function getMapUrl(location: string) {
  const encodedLocation = encodeURIComponent(location);
  return `https://www.google.com/maps?q=${encodedLocation}&output=embed`;
}
