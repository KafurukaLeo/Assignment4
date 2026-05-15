import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BedDouble,
  ChevronLeft,
  ChevronRight,
  Heart,
  Home as HomeIcon,
  Mail,
  MapPin,
  Phone,
  Send,
  Star,
} from "lucide-react";
import { toast } from "sonner";
import Hero from "../components/section/Hero";
import { Categories } from "../data";
import { api } from "../lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useAuthStore } from "../store/auth.store";
import type { Listing, ListingType } from "../types";
import { getImageUrl } from "../lib/utils";

const getListing = async () => {
  const res = await api.get("/listings");
  return (res.data.data ?? res.data) as Listing[];
};

const typeLabels: Record<ListingType, string> = {
  apartment: "Apartments",
  house: "Homes",
  villa: "Villas",
  cabin: "Cabins",
};

export default function Home() {
  const [selectedType, setSelectedType] = useState<string>("all");
  const { data: listings = [], isLoading, error } = useQuery<Listing[]>({
    queryKey: ["listing"],
    queryFn: getListing,
  });

  const filteredListings = listings.filter((l) => 
    selectedType === "all" ? true : l.type.toLowerCase() === selectedType.toLowerCase()
  );


  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-red-500">{error.message}</p>
      </div>
    );
  }

  const rows = buildRows(listings);

  return (
    <main className="pb-16 pt-0">
      {/* Category Bar at the Top */}
      <div className="sticky top-[0px] z-20 bg-white/80 dark:bg-[#030712]/80 backdrop-blur-md py-6 border-b border-gray-100 dark:border-white/[0.08] -mx-4 px-4 sm:-mx-[6vw] sm:px-[6vw] lg:-mx-[9vw] lg:px-[9vw]">
        <div className="flex items-center gap-8 overflow-x-auto pb-2 no-scrollbar">
          {Categories.map((category) => {
            const Icon = category.icon;
            const isActive = selectedType === category.title.toLowerCase();
            return (
              <button
                key={category.title}
                onClick={() => setSelectedType(category.title.toLowerCase())}
                className={`flex flex-col items-center gap-3 shrink-0 group transition-all duration-300 ${
                  isActive ? "scale-105" : ""
                }`}
              >
                <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center transition-all duration-300 ${
                  isActive 
                    ? "bg-(--color-primary) border-(--color-primary) shadow-lg shadow-(--color-primary)/20" 
                    : "bg-white dark:bg-white/[0.04] border-gray-100 dark:border-white/[0.08] group-hover:border-(--color-primary) group-hover:shadow-lg group-hover:shadow-(--color-primary)/10 group-hover:-translate-y-1"
                }`}>
                  <Icon className={`w-6 h-6 transition-colors ${
                    isActive ? "text-white" : "text-gray-400 group-hover:text-(--color-primary)"
                  }`} />
                </div>
                <span className={`text-[13px] font-semibold transition-colors ${
                  isActive ? "text-(--color-primary)" : "text-gray-500 group-hover:text-gray-950 dark:group-hover:text-white"
                }`}>
                  {category.title}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {selectedType === "all" && (
        <div className="mt-8">
          <Hero />
        </div>
      )}
      {isLoading ? (
        <div className="space-y-12">
          {Array.from({ length: 5 }).map((_, i) => (
            <ListingRowSkeleton key={i} />
          ))}
        </div>
      ) : filteredListings.length === 0 ? (
        <EmptyHome />
      ) : selectedType !== "all" ? (
        <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredListings.map((listing) => (
            <HomeListingCard key={listing.id} listing={listing} wide />
          ))}
        </div>
      ) : (
        <div className="space-y-12">
          {rows.map((row) => (
            <ListingRow key={row.title} row={row} />
          ))}
        </div>
      )}
      <ContactSection />
    </main>
  );
}

function buildRows(listings: Listing[]) {
  if (!Array.isArray(listings)) return [];
  const rows: Array<{
    title: string;
    subtitle?: string;
    listings: Listing[];
    to: string;
    showSeeAll?: boolean;
  }> = [];

  rows.push({
    title: "Recently viewed",
    listings: listings.slice(0, 5),
    to: "/all-listings",
    showSeeAll: true,
  });

  const byLocation = listings.reduce<Record<string, Listing[]>>((acc, listing) => {
    const location = locationName(listing.location);
    acc[location] = [...(acc[location] || []), listing];
    return acc;
  }, {});

  Object.entries(byLocation)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 5)
    .forEach(([location, locationListings], index) => {
      rows.push({
        title:
          index === 0
            ? `Popular homes in ${location}`
            : index === 1
              ? `Stay in ${location}`
              : `Homes in ${location}`,
        listings: rotateListings(locationListings, index),
        to: `/all-listings?location=${encodeURIComponent(location)}`,
      });
    });

  const byType = listings.reduce<Record<string, { label: string, listings: Listing[] }>>((acc, listing) => {
    const typeKey = listing.type;
    const label = typeLabels[typeKey] || "Places";
    if (!acc[typeKey]) {
      acc[typeKey] = { label, listings: [] };
    }
    acc[typeKey].listings.push(listing);
    return acc;
  }, {});

  Object.entries(byType)
    .filter(([, data]) => data.listings.length > 0)
    .forEach(([typeKey, data]) => {
      const { label, listings: typeListings } = data;
      rows.push({
        title: label === "Apartments" ? "Great deals on apartments" : `Popular ${label.toLowerCase()}`,
        subtitle:
          label === "Apartments"
            ? "Plus, get Airbnb credit when you stay at a featured place."
            : undefined,
        listings: typeListings,
        to: `/all-listings?type=${encodeURIComponent(typeKey)}`,
      });
    });

  return rows.filter((row) => row.listings.length > 0);
}

function rotateListings(listings: Listing[], offset: number) {
  if (listings.length < 2) return listings;
  const start = offset % listings.length;
  return [...listings.slice(start), ...listings.slice(0, start)];
}

function ListingRow({
  row,
}: {
  row: {
    title: string;
    subtitle?: string;
    listings: Listing[];
    to: string;
    showSeeAll?: boolean;
  };
}) {
  return (
    <section>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <Link
            to={row.to}
            className="inline-flex items-center gap-2 text-[22px] font-semibold tracking-tight text-gray-950 transition-colors hover:text-(--color-primary) dark:text-white"
          >
            {row.title}
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-gray-600 dark:bg-white/[0.08] dark:text-gray-300">
              <ArrowRight className="h-4 w-4" />
            </span>
          </Link>
          {row.subtitle && (
            <p className="mt-1 text-[14px] text-gray-500 dark:text-gray-400">
              {row.subtitle}
            </p>
          )}
        </div>
        <div className="hidden items-center gap-2 md:flex">
          <button
            className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-300 dark:bg-white/[0.06]"
            aria-label="Previous"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-700 transition-colors hover:bg-gray-200 dark:bg-white/[0.08] dark:text-white dark:hover:bg-white/[0.14]"
            aria-label="Next"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {row.listings.slice(0, 8).map((listing) => (
          <HomeListingCard key={listing.id} listing={listing} />
        ))}
        {row.showSeeAll && <SeeAllCard listings={row.listings} to={row.to} />}
      </div>
    </section>
  );
}

function HomeListingCard({ 
  listing, 
  wide 
}: { 
  listing: Listing; 
  wide?: boolean;
}) {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const photo = listing.photos?.[0];
  const nights = 2;
  const totalPrice = Math.round(listing.pricePerNight * nights);

  // Get favorites to determine if this listing is liked
  const { data: favorites } = useQuery({
    queryKey: ["favorites"],
    queryFn: async () => {
      const res = await api.get("/users/favorites");
      return res.data.favorites as any[];
    },
    enabled: !!user,
  });

  const isLiked = favorites?.some((f) => f.listingId === listing.id) ?? false;

  const toggleFavoriteMutation = useMutation({
    mutationFn: async (listingId: string) => {
      if (isLiked) {
        await api.delete(`/users/favorites/${listingId}`);
        return { action: "removed", message: "Removed from favorites" };
      } else {
        await api.post(`/users/favorites/${listingId}`);
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

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.error("Please log in to save favorites");
      navigate("/login");
      return;
    }
    toggleFavoriteMutation.mutate(listing.id);
  };

  return (
    <Link to={`/listings/${listing.id}`} className={`group block shrink-0 ${wide ? "w-full" : "w-[160px] sm:w-[180px]"}`}>
      <div className={`relative overflow-hidden rounded-2xl bg-gray-100 dark:bg-white/[0.05] ${wide ? "aspect-[4/3]" : "aspect-square"}`}>
        {photo ? (
          <img
            src={getImageUrl(photo)}
            alt={listing.title}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gray-400">
            <HomeIcon className="h-7 w-7" />
          </div>
        )}
        <span className="absolute left-2 top-2 rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-gray-700 shadow-sm">
          Guest favorite
        </span>
        <button
          type="button"
          onClick={handleToggleFavorite}
          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/20 backdrop-blur-sm text-white drop-shadow hover:bg-black/40 transition-colors"
          aria-label={isLiked ? "Remove from favorites" : "Save to favorites"}
        >
          <Heart className={`h-5 w-5 transition-all ${isLiked ? "fill-red-500 stroke-red-500 scale-110" : "fill-black/25 stroke-white stroke-[2.5]"}`} />
        </button>
      </div>
      <div className="mt-2 min-w-0">
        <h3 className="truncate text-[13px] font-semibold leading-tight text-gray-950 dark:text-white">
          {listing.title || locationName(listing.location)}
        </h3>
        <p className="mt-0.5 truncate text-[12px] font-medium text-gray-600 dark:text-gray-300">
          {locationName(listing.location)}
        </p>
        <div className="mt-0.5 flex items-center gap-1 text-[12px] text-gray-500 dark:text-gray-400">
          <span>${totalPrice} for {nights} nights</span>
          <span>-</span>
          {listing.rating ? (
            <span className="inline-flex items-center gap-0.5">
              <Star className="h-3 w-3 fill-gray-700 stroke-none dark:fill-gray-300" />
              {listing.rating.toFixed(2).replace(/0$/, "")}
            </span>
          ) : (
            <span>New</span>
          )}
        </div>
        <div className="mt-0.5 flex items-center gap-1 text-[12px] text-gray-400">
          <BedDouble className="h-3 w-3" />
          {listing.guests} {listing.guests === 1 ? "guest" : "guests"} - {listing.type}
        </div>
      </div>
    </Link>
  );
}

function SeeAllCard({ listings, to }: { listings: Listing[]; to: string }) {
  const photos = listings.flatMap((listing) => listing.photos || []).slice(0, 3);

  return (
    <Link
      to={to}
      className="flex aspect-square w-[160px] shrink-0 flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white p-4 text-center shadow-lg shadow-black/[0.08] transition-transform hover:-translate-y-0.5 dark:border-white/[0.08] dark:bg-[#111827] sm:w-[180px]"
    >
      <div className="relative h-20 w-28">
        {photos.map((photo, index) => (
          <img
            key={photo}
            src={photo}
            alt="Listing preview"
            loading="lazy"
            decoding="async"
            className="absolute h-16 w-16 rounded-xl border-2 border-white object-cover shadow-sm dark:border-[#111827]"
            style={{
              left: `${index * 26}px`,
              top: `${index % 2 === 0 ? 10 : 0}px`,
              transform: `rotate(${index === 0 ? -7 : index === 1 ? 5 : -2}deg)`,
            }}
          />
        ))}
      </div>
      <span className="mt-2 text-[13px] font-semibold text-gray-950 dark:text-white">
        See all
      </span>
    </Link>
  );
}

function ListingRowSkeleton() {
  return (
    <section>
      <div className="mb-4 h-8 w-64 rounded-full bg-gray-100 dark:bg-white/[0.05] animate-pulse" />
      <div className="flex gap-4 overflow-hidden">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="w-[160px] shrink-0 sm:w-[180px]">
            <div className="aspect-square rounded-2xl bg-gray-100 dark:bg-white/[0.05] animate-pulse" />
            <div className="mt-3 h-3 w-3/4 rounded bg-gray-100 dark:bg-white/[0.05] animate-pulse" />
            <div className="mt-2 h-3 w-1/2 rounded bg-gray-100 dark:bg-white/[0.05] animate-pulse" />
          </div>
        ))}
      </div>
    </section>
  );
}

function EmptyHome() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="max-w-md text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-(--color-primary)/10 text-(--color-primary)">
          <MapPin className="h-6 w-6" />
        </div>
        <h1 className="mt-5 text-xl font-semibold text-gray-950 dark:text-white">
          No listings yet
        </h1>
        <p className="mt-2 text-[14px] leading-6 text-gray-500 dark:text-gray-400">
          When hosts add places from the backend, they will appear here.
        </p>
      </div>
    </div>
  );
}

function ContactSection() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuthStore();
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    topic: "Booking help",
    message: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.message.trim()) {
      toast.error("Please enter a message");
      return;
    }
    
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      toast.success("Message sent successfully! We'll get back to you soon.");
      setFormData(prev => ({ ...prev, message: "" }));
      setIsSubmitting(false);
    }, 1000);
  };

  return (
    <section
      id="contact"
      className="mt-16 scroll-mt-28 overflow-hidden rounded-[2rem] border border-gray-200 bg-white dark:border-white/[0.08] dark:bg-[#111827]"
    >
      <div className="grid gap-0 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="border-b border-gray-200 p-6 dark:border-white/[0.08] sm:p-8 lg:border-b-0 lg:border-r">
          <p className="text-[12px] font-semibold uppercase tracking-widest text-(--color-primary)">
            Contact
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-gray-950 dark:text-white">
            Need help finding the right stay?
          </h2>
          <p className="mt-4 max-w-md text-[14px] leading-7 text-gray-500 dark:text-gray-400">
            Reach out about bookings, saved places, host questions, or listing
            details. We will help you move from browsing to booking.
          </p>

          <div className="mt-8 space-y-3">
            <ContactLine
              icon={Mail}
              label="Email"
              value="support@airbnb.local"
            />
            <ContactLine icon={Phone} label="Phone" value="+250 788 000 000" />
            <ContactLine
              icon={MapPin}
              label="Location"
              value="Kigali, Rwanda"
            />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4 p-6 sm:p-8">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-[12px] font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                Name
              </span>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="Your name"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-[14px] text-gray-950 outline-none transition-colors focus:border-(--color-primary) dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-[12px] font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                Email
              </span>
              <input
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                required
                placeholder="you@example.com"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-[14px] text-gray-950 outline-none transition-colors focus:border-(--color-primary) dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white"
              />
            </label>
          </div>
          <label className="block">
            <span className="mb-2 block text-[12px] font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
              Topic
            </span>
            <select 
              value={formData.topic}
              onChange={e => setFormData({ ...formData, topic: e.target.value })}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-[14px] text-gray-950 outline-none transition-colors focus:border-(--color-primary) dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white">
              <option>Booking help</option>
              <option>Listing details</option>
              <option>Host support</option>
              <option>Account support</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-2 block text-[12px] font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
              Message
            </span>
            <textarea
              rows={5}
              value={formData.message}
              onChange={e => setFormData({ ...formData, message: e.target.value })}
              required
              placeholder="Tell us what you need"
              className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-[14px] text-gray-950 outline-none transition-colors focus:border-(--color-primary) dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white"
            />
          </label>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex w-fit items-center gap-2 rounded-xl bg-(--color-primary) px-5 py-3 text-[13px] font-semibold text-white transition-colors hover:bg-(--color-primary-dark) disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <Send className={`h-4 w-4 ${isSubmitting ? 'animate-pulse' : ''}`} />
            {isSubmitting ? "Sending..." : "Send message"}
          </button>
        </form>
      </div>
    </section>
  );
}

function ContactLine({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-gray-50 p-4 dark:bg-white/[0.04]">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-(--color-primary)/10 text-(--color-primary)">
        <Icon className="h-4 w-4" />
      </span>
      <span>
        <span className="block text-[11px] font-semibold uppercase tracking-widest text-gray-400">
          {label}
        </span>
        <span className="mt-0.5 block text-[14px] font-semibold text-gray-950 dark:text-white">
          {value}
        </span>
      </span>
    </div>
  );
}

function locationName(location: string) {
  return location.split(",")[0]?.trim() || location;
}
