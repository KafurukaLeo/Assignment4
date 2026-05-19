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

  const { user } = useAuthStore();

  const { data: homeBookings } = useQuery({
    queryKey: ["home-bookings"],
    queryFn: async () => {
      const endpoint = user?.role === "host" ? "/bookings" : "/bookings";
      const res = await api.get(endpoint);
      const list = res.data?.data || res.data || [];
      return Array.isArray(list) ? list.filter((b: any) => b.status !== "cancelled").slice(0, 3) : [];
    },
    enabled: !!user,
  });

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-red-500">{error.message}</p>
      </div>
    );
  }

  const rows = buildRows(listings);

  return (
    <main className="pb-24 pt-0">
      {/* Category Bar at the Top */}
      <div className="sticky top-[72px] z-20 glass py-5 border-b border-[var(--border-main)] -mx-4 px-4 sm:-mx-[6vw] sm:px-[6vw] lg:-mx-[9vw] lg:px-[9vw]">
        <div className="flex items-center gap-6 overflow-x-auto pb-1 no-scrollbar scroll-smooth">
          {Categories.map((category) => {
            const Icon = category.icon;
            const isActive = selectedType === category.title.toLowerCase();
            return (
              <button
                key={category.title}
                onClick={() => setSelectedType(category.title.toLowerCase())}
                className={`flex flex-col items-center gap-2.5 shrink-0 group transition-all duration-300 ${
                  isActive ? "scale-105" : ""
                }`}
              >
                <div className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center transition-all duration-300 ${
                  isActive 
                    ? "bg-[var(--color-primary)] border-[var(--color-primary)] premium-shadow-lg scale-110" 
                    : "bg-[var(--bg-main)] border-[var(--border-main)] group-hover:border-[var(--color-primary)]/50 group-hover:premium-shadow group-hover:-translate-y-1"
                }`}>
                  <Icon className={`w-6 h-6 transition-colors ${
                    isActive ? "text-white" : "text-[var(--text-sub)] group-hover:text-[var(--color-primary)]"
                  }`} />
                </div>
                <span className={`text-[12px] font-bold tracking-tight transition-colors ${
                  isActive ? "text-[var(--color-primary)]" : "text-[var(--text-sub)] group-hover:text-[var(--text-main)]"
                }`}>
                  {category.title}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {selectedType === "all" && (
        <div className="mt-10 animate-fade-up">
          <Hero />
        </div>
      )}

      {/* Premium Active Trips / Bookings Section */}
      {user && homeBookings && homeBookings.length > 0 && selectedType === "all" && (
        <section className="mt-12 animate-fade-up">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="font-heading text-[22px] font-bold tracking-tight text-[var(--text-main)]">
                {user.role === "host" ? "Your Properties' Bookings" : "Your Upcoming Trips"}
              </h2>
              <p className="mt-1 text-[13px] font-medium text-[var(--text-sub)]">
                Quickly access and manage your active reservations.
              </p>
            </div>
            <Link
              to={user.role === "host" ? "/dashboard/bookings" : "/bookings"}
              className="text-[13px] font-bold text-[var(--color-primary)] hover:underline flex items-center gap-1"
            >
              View all bookings <ChevronRight size={14} />
            </Link>
          </div>
          
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {homeBookings.map((booking: any) => {
              const checkInStr = new Date(booking.checkIn).toLocaleDateString("en-US", { month: "short", day: "numeric" });
              const checkOutStr = new Date(booking.checkOut).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
              const photo = booking.listing?.photos?.[0];
              
              return (
                <Link
                  key={booking.id}
                  to={user.role === "host" ? "/dashboard/bookings" : `/bookings`}
                  className="flex gap-4 p-4 rounded-3xl border border-[var(--border-main)] bg-[var(--bg-sub)] premium-shadow hover:premium-shadow-lg transition-all group"
                >
                  <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-white/[0.05] shrink-0 overflow-hidden">
                    {photo ? (
                      <img
                        src={getImageUrl(photo)}
                        alt={booking.listing?.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-gray-400">
                        <HomeIcon className="h-5 w-5" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="text-[14px] font-bold text-[var(--text-main)] truncate group-hover:text-[var(--color-primary)] transition-colors">
                        {booking.listing?.title || "Stay Booking"}
                      </h4>
                      <p className="text-[12px] font-semibold text-[var(--text-sub)] truncate mt-0.5">
                        {booking.listing?.location}
                      </p>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-2">
                      <span className="text-[11px] font-black uppercase tracking-wider text-[var(--color-primary)]">
                        {checkInStr} - {checkOutStr}
                      </span>
                      <span className="capitalize px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        {booking.status}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {isLoading ? (
        <div className="space-y-16 mt-16">
          {Array.from({ length: 5 }).map((_, i) => (
            <ListingRowSkeleton key={i} />
          ))}
        </div>
      ) : filteredListings.length === 0 ? (
        <EmptyHome />
      ) : selectedType !== "all" ? (
        <div className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mt-12 animate-fade-up">
          {filteredListings.map((listing) => (
            <HomeListingCard key={listing.id} listing={listing} wide />
          ))}
        </div>
      ) : (
        <div className="space-y-20 mt-20">
          {rows.map((row, idx) => (
            <div key={row.title} className="animate-fade-up" style={{ animationDelay: `${idx * 100}ms` }}>
              <ListingRow row={row} />
            </div>
          ))}
        </div>
      )}
      
      <div className="mt-32 animate-fade-up">
        <ContactSection />
      </div>
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
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <Link
            to={row.to}
            className="inline-flex items-center gap-3"
          >
            <h2 className="font-heading text-[26px] font-bold tracking-tight text-[var(--text-main)] hover:text-[var(--color-primary)] transition-colors">
              {row.title}
            </h2>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--bg-sub)] text-[var(--text-sub)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/5 transition-all">
              <ArrowRight className="h-4 w-4" />
            </div>
          </Link>
          {row.subtitle && (
            <p className="mt-1.5 text-[14px] text-[var(--text-sub)] font-medium max-w-2xl leading-relaxed">
              {row.subtitle}
            </p>
          )}
        </div>
        <div className="hidden items-center gap-3 md:flex">
          <button
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--bg-sub)] border border-[var(--border-main)] text-[var(--text-sub)] hover:text-[var(--text-main)] transition-all active:scale-95 disabled:opacity-30"
            aria-label="Previous"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--bg-sub)] border border-[var(--border-main)] text-[var(--text-sub)] hover:text-[var(--text-main)] transition-all active:scale-95 shadow-sm"
            aria-label="Next"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="flex gap-5 overflow-x-auto pb-4 no-scrollbar scroll-smooth">
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
    <Link to={`/listings/${listing.id}`} className={`group block shrink-0 ${wide ? "w-full" : "w-[220px] sm:w-[240px]"}`}>
      <div className={`relative overflow-hidden rounded-[1.5rem] bg-[var(--bg-sub)] border border-[var(--border-main)] premium-shadow group-hover:premium-shadow-lg transition-all duration-500 ${wide ? "aspect-[16/10]" : "aspect-square"}`}>
        {photo ? (
          <img
            src={getImageUrl(photo)}
            alt={listing.title}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[var(--text-sub)]">
            <HomeIcon className="h-10 w-10 opacity-20" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <span className="absolute left-3 top-3 rounded-full bg-white/90 backdrop-blur-md px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-[var(--text-main)] shadow-xl ring-1 ring-black/5">
          Guest favorite
        </span>
        
        <button
          type="button"
          onClick={handleToggleFavorite}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white hover:bg-white/40 transition-all active:scale-90"
          aria-label={isLiked ? "Remove from favorites" : "Save to favorites"}
        >
          <Heart className={`h-4.5 w-4.5 transition-all ${isLiked ? "fill-[var(--color-primary)] stroke-[var(--color-primary)] scale-110" : "stroke-white stroke-[2.5]"}`} />
        </button>

        <div className="absolute bottom-3 right-3 translate-y-1 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
           <div className="bg-[var(--color-primary)] text-white text-[12px] font-bold px-3 py-1.5 rounded-xl shadow-xl flex items-center gap-1.5">
             Book now <ArrowRight size={12} strokeWidth={3} />
           </div>
        </div>
      </div>
      <div className="mt-3.5 px-0.5">
        <div className="flex items-start justify-between gap-2">
           <div className="min-w-0">
              <h3 className="truncate font-heading text-[15px] font-bold text-[var(--text-main)] group-hover:text-[var(--color-primary)] transition-colors">
                {listing.title || locationName(listing.location)}
              </h3>
              <p className="mt-1 truncate text-[12px] font-semibold text-[var(--text-sub)]">
                {locationName(listing.location)}
              </p>
           </div>
           {listing.rating && (
              <div className="flex items-center gap-1 bg-[var(--bg-sub)] px-2 py-0.5 rounded-lg border border-[var(--border-main)] shrink-0">
                <Star className="h-3 w-3 fill-amber-400 stroke-none" />
                <span className="text-[12px] font-bold text-[var(--text-main)]">{listing.rating.toFixed(1)}</span>
              </div>
           )}
        </div>
        <div className="mt-2.5 flex items-center justify-between">
           <div className="flex flex-col">
              <span className="text-[15px] font-black text-[var(--text-main)]">${totalPrice}</span>
              <span className="text-[10px] font-bold text-[var(--text-sub)] uppercase tracking-wider">{nights} nights total</span>
           </div>
           <div className="flex items-center gap-2 text-[11px] font-bold text-[var(--text-sub)] bg-[var(--bg-sub)] px-2.5 py-1.5 rounded-xl border border-[var(--border-main)]">
              <BedDouble className="h-3.5 w-3.5 opacity-60" />
              {listing.guests}
           </div>
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
      className="flex aspect-square w-[220px] sm:w-[240px] shrink-0 flex-col items-center justify-center rounded-[1.5rem] border-2 border-dashed border-[var(--border-main)] bg-[var(--bg-sub)] p-6 text-center transition-all duration-300 hover:border-[var(--color-primary)]/50 hover:bg-[var(--color-primary)]/[0.02] hover:-translate-y-1 group"
    >
      <div className="relative h-20 w-32 mb-4">
        {photos.map((photo, index) => (
          <img
            key={photo}
            src={getImageUrl(photo)}
            alt="Listing preview"
            loading="lazy"
            decoding="async"
            className="absolute h-18 w-18 rounded-2xl border-2 border-white dark:border-[#1A1A1D] object-cover premium-shadow transition-transform duration-500 group-hover:scale-110"
            style={{
              left: `${index * 32}px`,
              top: `${index % 2 === 0 ? 8 : 0}px`,
              transform: `rotate(${index === 0 ? -10 : index === 1 ? 8 : -4}deg)`,
              zIndex: 3 - index
            }}
          />
        ))}
      </div>
      <span className="text-[14px] font-black text-[var(--text-main)] group-hover:text-[var(--color-primary)] transition-colors">
        See all listings
      </span>
      <p className="text-[11px] font-bold text-[var(--text-sub)] mt-1 uppercase tracking-widest">
        {listings.length} places found
      </p>
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
      className="scroll-mt-32 overflow-hidden rounded-[2.5rem] border-2 border-[var(--border-main)] bg-[var(--bg-main)] premium-shadow-lg"
    >
      <div className="grid gap-0 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="bg-[var(--bg-sub)] p-8 sm:p-12 lg:border-r border-[var(--border-main)]">
          <div className="inline-flex px-3 py-1 rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-[10px] font-black uppercase tracking-widest mb-6">
            Contact
          </div>
          <h2 className="font-heading text-4xl font-bold tracking-tight text-[var(--text-main)] leading-tight">
            Need help finding the right stay?
          </h2>
          <p className="mt-6 text-[15px] font-medium leading-relaxed text-[var(--text-sub)]">
            Reach out about bookings, saved places, host questions, or listing
            details. We will help you move from browsing to booking.
          </p>

          <div className="mt-12 space-y-4">
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

        <form onSubmit={handleSubmit} className="grid gap-6 p-8 sm:p-12 bg-[var(--bg-main)]">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-widest text-[var(--text-sub)] ml-1">
                Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="Your name"
                className="input"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-widest text-[var(--text-sub)] ml-1">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                required
                placeholder="you@example.com"
                className="input"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-black uppercase tracking-widest text-[var(--text-sub)] ml-1">
              Topic
            </label>
            <select 
              value={formData.topic}
              onChange={e => setFormData({ ...formData, topic: e.target.value })}
              className="input appearance-none">
              <option>Booking help</option>
              <option>Listing details</option>
              <option>Host support</option>
              <option>Account support</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-black uppercase tracking-widest text-[var(--text-sub)] ml-1">
              Message
            </label>
            <textarea
              rows={5}
              value={formData.message}
              onChange={e => setFormData({ ...formData, message: e.target.value })}
              required
              placeholder="Tell us what you need"
              className="input min-h-32 resize-none"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="button-primary !w-full sm:!w-fit flex items-center justify-center gap-2.5"
          >
            <Send className={`h-4 w-4 ${isSubmitting ? 'animate-pulse' : ''}`} />
            {isSubmitting ? "Sending message..." : "Send message"}
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
    <div className="flex items-center gap-4 p-4 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-main)] premium-shadow transition-all hover:border-[var(--color-primary)]/30 group">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--bg-sub)] text-[var(--text-sub)] group-hover:bg-[var(--color-primary)] group-hover:text-white transition-all duration-300">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <span className="block text-[10px] font-black uppercase tracking-widest text-[var(--text-sub)]">
          {label}
        </span>
        <span className="mt-0.5 block text-[15px] font-bold text-[var(--text-main)] truncate">
          {value}
        </span>
      </div>
    </div>
  );
}

function locationName(location: string) {
  return location.split(",")[0]?.trim() || location;
}
