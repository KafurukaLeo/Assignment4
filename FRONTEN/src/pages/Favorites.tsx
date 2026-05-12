import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { useAuthStore } from "../store/auth.store";
import { Heart, MapPin, Star, Users } from "lucide-react";
import { toast } from "sonner";
import type { Listing } from "../types";

export default function Favorites() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: favorites = [], isLoading } = useQuery({
    queryKey: ["favorites"],
    queryFn: async () => {
      const response = await api.get("/users/favorites");
      return response.data as Listing[];
    },
    enabled: !!user,
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: async (listingId: string) => {
      const response = await api.post(`/users/favorites/${listingId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
    },
    onError: () => {
      toast.error("Failed to update favorites");
    },
  });

  if (!user) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-(--color-primary)/10 text-(--color-primary)">
            <Heart className="h-6 w-6" />
          </div>
          <h1 className="mt-5 text-xl font-semibold text-gray-950 dark:text-white">
            Log in to view saved stays
          </h1>
          <p className="mt-2 text-[14px] leading-6 text-gray-500 dark:text-gray-400">
            Your saved homes are connected to your account.
          </p>
          <Link
            to="/login?redirect=/favorites"
            className="mt-6 inline-flex rounded-xl bg-(--color-primary) px-5 py-3 text-[13px] font-semibold text-white transition-colors hover:bg-(--color-primary-dark)"
          >
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-widest text-gray-400">
            Saved
          </p>
          <h1
            style={{ fontFamily: "'Playfair Display', serif" }}
            className="mt-1 text-3xl font-semibold text-gray-950 dark:text-white"
          >
            Favorite stays
          </h1>
          <p className="mt-2 text-[14px] text-gray-500 dark:text-gray-400">
            Places you saved for later.
          </p>
        </div>
        <Link
          to="/all-listings"
          className="inline-flex w-fit rounded-xl border border-gray-200 px-4 py-2.5 text-[13px] font-semibold text-gray-700 transition-colors hover:border-(--color-primary) hover:text-(--color-primary) dark:border-white/[0.08] dark:text-gray-300"
        >
          Explore more
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[4/3] rounded-2xl bg-gray-100 dark:bg-white/[0.05] animate-pulse"
            />
          ))}
        </div>
      ) : favorites.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[2rem] border border-gray-200 bg-white px-6 py-24 text-center dark:border-white/[0.08] dark:bg-[#111827]">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-(--color-primary)/10 text-(--color-primary)">
            <Heart className="h-6 w-6" />
          </div>
          <h2 className="mt-5 text-lg font-semibold text-gray-950 dark:text-white">
            No favorites yet
          </h2>
          <p className="mt-2 max-w-sm text-[14px] leading-6 text-gray-500 dark:text-gray-400">
            Save homes while browsing and they will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {favorites.map((listing) => (
            <article
              key={listing.id}
              className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-white/[0.08] dark:bg-[#111827]"
            >
              <div className="relative aspect-[4/3] bg-gray-100 dark:bg-white/[0.05]">
                {listing.photos?.[0] ? (
                  <img
                    src={listing.photos[0]}
                    alt={listing.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-gray-400">
                    <MapPin className="h-6 w-6" />
                  </div>
                )}
                <button
                  onClick={() => toggleFavoriteMutation.mutate(listing.id)}
                  className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-(--color-primary) shadow-sm backdrop-blur-md transition-transform active:scale-95"
                  aria-label="Remove from favorites"
                >
                  <Heart className="h-4 w-4 fill-current" />
                </button>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate text-[15px] font-semibold text-gray-950 dark:text-white">
                      {listing.title}
                    </h2>
                    <p className="mt-1 flex items-center gap-1 text-[12px] text-gray-500 dark:text-gray-400">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span className="truncate">{listing.location}</span>
                    </p>
                  </div>
                  {listing.rating && (
                    <span className="flex items-center gap-1 text-[12px] font-semibold text-gray-950 dark:text-white">
                      <Star className="h-3 w-3 fill-amber-400 stroke-none" />
                      {listing.rating.toFixed(1)}
                    </span>
                  )}
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[12px] text-gray-500 dark:text-gray-400">
                    <Users className="h-3.5 w-3.5" />
                    {listing.guests} guests
                  </span>
                  <span className="text-[14px] font-semibold text-gray-950 dark:text-white">
                    ${listing.pricePerNight}
                    <span className="font-normal text-gray-400">/night</span>
                  </span>
                </div>
                <Link
                  to={`/listings/${listing.id}`}
                  className="mt-4 inline-flex w-full justify-center rounded-xl bg-(--color-primary) px-4 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-(--color-primary-dark)"
                >
                  View stay
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
