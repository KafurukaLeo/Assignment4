import { useNavigate, useParams } from "react-router-dom";
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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [sliderIndex, setSliderIndex] = useState(0);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");

  // Get favorites to determine if this listing is liked
  const { data: favorites } = useQuery({
    queryKey: ["favorites"],
    queryFn: async () => {
      const res = await api.get("/users/favorites");
      return res.data.favorites as any[];
    },
    enabled: !!user,
  });

  const isSaved = favorites?.some((f) => f.listingId === id) ?? false;

  const toggleFavoriteMutation = useMutation({
    mutationFn: async () => {
      if (isSaved) {
        await api.delete(`/users/favorites/${id}`);
        return { action: "removed", message: "Removed from favorites" };
      } else {
        await api.post(`/users/favorites/${id}`);
        return { action: "added", message: "Added to favorites" };
      }
    },
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
    },
    onError: (error: unknown) => {
      const message = axios.isAxiosError<{ message?: string }>(error)
        ? error.response?.data?.message
        : undefined;
      toast.error(message || "Failed to update favorites");
    },
  });

  const handleToggleFavorite = () => {
    if (!user) {
      toast.error("Please log in to save favorites");
      navigate("/login");
      return;
    }
    toggleFavoriteMutation.mutate();
  };

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
      const message = axios.isAxiosError<{ error?: string }>(error)
        ? error.response?.data?.error
        : undefined;
      toast.error(message || "Failed to create booking");
    },
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

    navigate(`/messages?contact=${listing.hostId}`);
  };

  const nights = getNights(checkIn, checkOut);
  const subtotal = Math.round(nights * listing.pricePerNight);
  const serviceFee = Math.round(subtotal * 0.1); // 10% service fee
  const totalPrice = subtotal + serviceFee;
  const today = new Date().toISOString().split("T")[0];

  const handleReserve = (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      navigate(`/login?redirect=/listings/${id}`);
      return;
    }

    if (user.role === "host") {
      toast.error("Hosts cannot create bookings. Switch to a guest account to book properties.");
      return;
    }

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

  return (
    <div className="min-h-screen pb-24 animate-fade-in">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between gap-4 py-4">
          <button
            onClick={() => navigate(-1)}
            className="button-secondary !py-2 !px-4 !text-[13px] flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to explore
          </button>
          <div className="flex items-center gap-3">
            <button className="w-10 h-10 flex items-center justify-center rounded-full bg-[var(--bg-sub)] border border-[var(--border-main)] text-[var(--text-sub)] hover:text-[var(--text-main)] transition-all">
              <Share2 className="h-4.5 w-4.5" />
            </button>
            <button
              onClick={handleToggleFavorite}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-[var(--bg-sub)] border border-[var(--border-main)] text-[var(--text-sub)] hover:text-[var(--text-main)] transition-all"
            >
              <Heart
                className={`h-4.5 w-4.5 transition-all ${isSaved ? "fill-[var(--color-primary)] text-[var(--color-primary)] scale-110" : ""}`}
              />
            </button>
          </div>
        </div>

        <header className="mb-8">
          <h1 className="font-heading text-3xl font-bold tracking-tight text-[var(--text-main)] md:text-4xl leading-tight">
            {listing.title}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3 text-[14px] font-semibold text-[var(--text-sub)]">
            {listing.rating && (
              <span className="inline-flex items-center gap-1.5 text-[var(--text-main)] bg-[var(--bg-sub)] px-3 py-1 rounded-lg border border-[var(--border-main)]">
                <Star className="h-4 w-4 fill-amber-400 stroke-none" />
                {formatRating(listing.rating)}
              </span>
            )}
            <span className="inline-flex items-center gap-2">
              <MapPin className="h-4.5 w-4.5 text-[var(--color-primary)]" />
              {listing.location}
            </span>
            <span className="inline-flex items-center gap-2 capitalize">
              <Home className="h-4.5 w-4.5 text-[var(--color-primary)]" />
              {listing.type}
            </span>
          </div>
        </header>

        <section className="mb-12">
          <div className="relative overflow-hidden rounded-[2.5rem] bg-[var(--bg-sub)] border border-[var(--border-main)] premium-shadow-lg md:hidden">
            <img
              src={currentImage}
              alt={listing.title}
              className="h-[400px] w-full object-cover"
            />
            {images.length > 1 && (
              <>
                <button
                  onClick={prevSlide}
                  className="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white shadow-xl active:scale-90 transition-all"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={nextSlide}
                  className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white shadow-xl active:scale-90 transition-all"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}
            <div className="absolute bottom-4 right-4 bg-black/40 backdrop-blur-md text-white px-3 py-1.5 rounded-xl text-[11px] font-bold tracking-widest uppercase">
              {sliderIndex + 1} / {images.length}
            </div>
          </div>

          <div className="hidden h-[500px] grid-cols-[minmax(0,1fr)_240px] gap-4 md:grid">
            <div className="overflow-hidden rounded-[2.5rem] bg-[var(--bg-sub)] border border-[var(--border-main)] premium-shadow-lg group">
              <img
                src={currentImage}
                alt={listing.title}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </div>
            <div className="grid grid-rows-3 gap-4">
              {thumbnailImages.map(({ photo, index }) => (
                <button
                  key={`${photo}-${index}`}
                  onClick={() => setSliderIndex(index)}
                  className="overflow-hidden rounded-[2rem] bg-[var(--bg-sub)] border border-[var(--border-main)] premium-shadow hover:premium-shadow-lg transition-all group"
                >
                  <img
                    src={getImageUrl(photo)}
                    alt={`${listing.title} ${index + 1}`}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </button>
              ))}
            </div>
          </div>
        </section>

        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-20">
          <main className="min-w-0">
            <section className="border-b border-[var(--border-main)] pb-8">
              <div className="flex items-center justify-between gap-6">
                <div>
                  <h2 className="font-heading text-2xl font-bold text-[var(--text-main)] capitalize">
                    {listing.type} hosted by {listing.host?.name || "Host"}
                  </h2>
                  <p className="mt-2 text-[15px] font-medium text-[var(--text-sub)]">
                    Up to {listing.guests}{" "}
                    {listing.guests === 1 ? "guest" : "guests"} • {listing.amenities?.length || 0} amenities
                  </p>
                </div>
                <HostAvatar listing={listing} />
              </div>
            </section>

            <section className="grid gap-4 border-b border-[var(--border-main)] py-10 sm:grid-cols-3">
              <Fact icon={Users} label="Guests" value={`${listing.guests}`} />
              <Fact icon={Home} label="Property" value={listing.type} />
              <Fact
                icon={CalendarDays}
                label="Per Night"
                value={`$${listing.pricePerNight}`}
              />
            </section>

            <section className="border-b border-[var(--border-main)] py-10">
              <h2 className="font-heading text-2xl font-bold text-[var(--text-main)]">
                About this place
              </h2>
              <p className="mt-5 max-w-3xl text-[16px] leading-relaxed text-[var(--text-sub)] font-medium">
                {listing.description ||
                  "This stay has the essentials for a comfortable visit."}
              </p>
            </section>

            <section className="border-b border-[var(--border-main)] py-10">
              <h2 className="font-heading text-2xl font-bold text-[var(--text-main)]">
                What this place offers
              </h2>
              <div className="mt-6 grid gap-x-12 gap-y-6 sm:grid-cols-2">
                {(listing.amenities?.length
                  ? listing.amenities
                  : ["Private stay", "Guest ready"]
                ).map((amenity) => {
                  const Icon = amenityIcons[amenity.toLowerCase()] || Check;
                  return (
                    <div
                      key={amenity}
                      className="flex items-center gap-4 text-[15px] font-bold text-[var(--text-main)] group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-[var(--bg-sub)] flex items-center justify-center text-[var(--text-sub)] group-hover:text-[var(--color-primary)] group-hover:bg-[var(--color-primary)]/5 transition-all">
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="capitalize">{amenity}</span>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="py-10">
              <h2 className="font-heading text-2xl font-bold text-[var(--text-main)]">
                Where you'll be
              </h2>
              
              <div className="mt-6 mb-8 grid gap-4 sm:grid-cols-3">
                {(() => {
                  const parts = listing.location.split(',').map(p => p.trim());
                  let street = '', city = '', country = '';
                  
                  if (parts.length === 1) {
                    city = parts[0];
                    country = 'Unknown';
                  } else if (parts.length === 2) {
                    city = parts[0];
                    country = parts[1];
                  } else {
                    street = parts.slice(0, parts.length - 2).join(', ');
                    city = parts[parts.length - 2];
                    country = parts[parts.length - 1];
                  }

                  return (
                    <>
                      {street && (
                        <div className="flex flex-col gap-1.5 rounded-2xl bg-[var(--bg-sub)] p-5 border border-[var(--border-main)]">
                          <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-sub)]">Street / Area</span>
                          <span className="text-[15px] font-bold text-[var(--text-main)]">{street}</span>
                        </div>
                      )}
                      <div className="flex flex-col gap-1.5 rounded-2xl bg-[var(--bg-sub)] p-5 border border-[var(--border-main)]">
                        <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-sub)]">City</span>
                        <span className="text-[15px] font-bold text-[var(--text-main)]">{city}</span>
                      </div>
                      <div className="flex flex-col gap-1.5 rounded-2xl bg-[var(--bg-sub)] p-5 border border-[var(--border-main)]">
                        <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-sub)]">Region</span>
                        <span className="text-[15px] font-bold text-[var(--text-main)]">{country}</span>
                      </div>
                    </>
                  );
                })()}
              </div>

              <div className="mt-6 overflow-hidden rounded-[2.5rem] border-2 border-[var(--border-main)] bg-[var(--bg-sub)] premium-shadow">
                <iframe
                  title="Property location"
                  width="100%"
                  height="400"
                  style={{ border: 0 }}
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                  src={mapUrl}
                />
              </div>
            </section>
          </main>

          <aside className="lg:sticky lg:top-32 lg:self-start">
            <div className="rounded-[2.5rem] border-2 border-[var(--border-main)] bg-[var(--bg-main)] p-8 premium-shadow-lg animate-fade-up">
              <div className="flex items-center justify-between gap-4 mb-8">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-widest text-[var(--text-sub)]">
                    Nightly Rate
                  </p>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-3xl font-black text-[var(--text-main)]">${listing.pricePerNight}</span>
                    <span className="text-[14px] font-bold text-[var(--text-sub)]">/ night</span>
                  </div>
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                  Instant
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-sub)] ml-1">Check-in</label>
                      <input
                        type="date"
                        value={checkIn}
                        min={today}
                        onChange={(e) => setCheckIn(e.target.value)}
                        className="input !py-2.5 !text-[13px]"
                      />
                   </div>
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-sub)] ml-1">Check-out</label>
                      <input
                        type="date"
                        value={checkOut}
                        min={checkIn || today}
                        onChange={(e) => setCheckOut(e.target.value)}
                        className="input !py-2.5 !text-[13px]"
                      />
                   </div>
                </div>
                <div className="space-y-1.5">
                   <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-sub)] ml-1">Guests</label>
                   <div className="input !py-2.5 !text-[13px] flex items-center justify-between">
                     <span>{listing.guests} guests max</span>
                     <Users size={14} className="opacity-40" />
                   </div>
                </div>
              </div>

              {nights > 0 && (
                <div className="space-y-3.5 mb-8 py-6 border-y border-[var(--border-main)] animate-fade-in">
                  <div className="flex justify-between items-center text-[14px] font-bold">
                    <span className="text-[var(--text-sub)]">${listing.pricePerNight} x {nights} nights</span>
                    <span className="text-[var(--text-main)]">${subtotal}</span>
                  </div>
                  <div className="flex justify-between items-center text-[14px] font-bold">
                    <span className="text-[var(--text-sub)]">Service fee (10%)</span>
                    <span className="text-[var(--text-main)]">${serviceFee}</span>
                  </div>
                  <div className="pt-2 flex justify-between items-center text-[18px] font-black">
                    <span className="text-[var(--text-main)]">Total</span>
                    <span className="text-[var(--color-primary)]">${totalPrice}</span>
                  </div>
                </div>
              )}

              {user?.role === "host" ? (
                <div className="mb-4 text-center rounded-2xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/20 p-4 text-[13px] font-bold text-amber-700 dark:text-amber-400">
                  Hosts cannot reserve properties. Switch to a guest account to book stays.
                </div>
              ) : (
                <button
                  onClick={handleReserve}
                  disabled={createBookingMutation.isPending || (nights <= 0 && !!checkIn && !!checkOut)}
                  className="button-primary !w-full !py-4 !text-[16px] mb-4"
                >
                  {createBookingMutation.isPending ? "Reserving..." : "Reserve stay"}
                </button>
              )}
              
              <button
                onClick={handleMessageHost}
                disabled={conversationMutation.isPending}
                className="button-secondary !w-full !py-3 flex items-center justify-center gap-2"
              >
                {conversationMutation.isPending
                  ? "Opening chat..."
                  : "Message host"}
              </button>

              <p className="mt-5 text-center text-[11px] font-bold text-[var(--text-sub)] uppercase tracking-widest">
                No payment needed yet
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function HostAvatar({ listing }: { listing: Listing }) {
  const name = listing.host?.name || "Host";
  if (listing.host?.avatar) {
    return (
      <img
        src={listing.host.avatar}
        alt={name}
        className="h-16 w-16 shrink-0 rounded-2xl object-cover ring-4 ring-[var(--bg-sub)] shadow-lg"
      />
    );
  }

  return (
    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[var(--bg-sub)] border border-[var(--border-main)] text-xl font-black text-[var(--text-main)] shadow-lg">
      {name.charAt(0).toUpperCase()}
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
    <div className="flex items-center gap-4 rounded-2xl bg-[var(--bg-sub)] p-5 border border-[var(--border-main)] transition-all hover:premium-shadow group">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--bg-main)] text-[var(--text-sub)] group-hover:text-[var(--color-primary)] transition-all">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-sub)]">
          {label}
        </p>
        <p className="mt-1 text-[15px] font-bold capitalize text-[var(--text-main)]">
          {value}
        </p>
      </div>
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
