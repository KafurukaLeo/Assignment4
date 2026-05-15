import { Heart, Star, MapPin, BadgeCheck, ArrowRight } from "lucide-react";
import type { Listing } from "../../types";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { toast } from "sonner";
import axios from "axios";
import { useAuthStore } from "../../store/auth.store";
import { getImageUrl } from "../../lib/utils";

interface ListingCardProps {
  listing: Listing;
  type: "grid" | "list";
}

export default function ListingCard({ listing, type }: ListingCardProps) {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [imgLoaded, setImgLoaded] = useState(false);

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

  if (type === "list") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="group flex rounded-2xl overflow-hidden border border-gray-100 dark:border-white/[0.07] bg-white dark:bg-[#1a1f2b] hover:border-gray-200 dark:hover:border-white/[0.12] hover:shadow-md hover:shadow-black/[0.05] transition-all duration-200"
      >
        <Link
          to={`/listings/${listing.id}`}
          className="relative shrink-0 w-44 sm:w-56 overflow-hidden"
        >
          <div
            className={`absolute inset-0 bg-gray-100 dark:bg-white/[0.05] transition-opacity duration-500 pointer-events-none ${imgLoaded ? "opacity-0" : "opacity-100"}`}
          />
          <img
            src={getImageUrl(listing.photos?.[0])}
            alt={listing.title}
            loading="lazy"
            decoding="async"
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgLoaded(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 pointer-events-none" />
        </Link>

        <div className="flex flex-col justify-between flex-1 p-5 min-w-0">
          <div>
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                    {listing.type ?? "Stay"}
                  </span>
                  {listing.host && (
                    <BadgeCheck className="w-3.5 h-3.5 text-emerald-500" />
                  )}
                </div>
                <h2 className="text-[15px] font-semibold text-gray-900 dark:text-white truncate">
                  {listing.title}
                </h2>
              </div>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.85 }}
                onClick={handleToggleFavorite}
                className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full border border-gray-200 dark:border-white/[0.1] hover:border-red-200 dark:hover:border-red-500/30 transition-colors"
                aria-label={
                  isLiked ? "Remove from favorites" : "Save to favorites"
                }
              >
                <Heart
                  className={`w-3.5 h-3.5 transition-colors ${
                    isLiked ? "fill-red-500 stroke-red-500" : "text-gray-400"
                  }`}
                />
              </motion.button>
            </div>

            <p className="flex items-center gap-1.5 text-[12px] text-gray-400 mb-3">
              <MapPin className="w-3 h-3 shrink-0" />
              {listing.location}
            </p>

            <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2">
              {listing.description ??
                "A wonderful place to stay, carefully curated for a comfortable experience."}
            </p>
          </div>

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-white/[0.06]">
            <div className="flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 fill-amber-400 stroke-none" />
              <span className="text-[13px] font-semibold text-gray-900 dark:text-white">
                {listing.rating}
              </span>
              <span className="text-[12px] text-gray-400">rating</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-[15px] font-bold text-gray-900 dark:text-white">
                  ${listing.pricePerNight}
                </span>
                <span className="text-[12px] text-gray-400"> /night</span>
              </div>
              <Link
                to={`/listings/${listing.id}`}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-(--color-primary) text-white text-[12px] font-semibold rounded-xl hover:opacity-90 active:scale-95 transition-all duration-150"
              >
                View
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="group flex flex-col"
    >
      <Link
        to={`/listings/${listing.id}`}
        className="relative rounded-2xl overflow-hidden aspect-[4/3] block"
      >
        <div
          className={`absolute inset-0 bg-gray-100 dark:bg-white/[0.05] transition-opacity duration-500 pointer-events-none ${imgLoaded ? "opacity-0" : "opacity-100 animate-pulse"}`}
        />

        <img
          src={getImageUrl(listing.photos?.[0])}
          alt={listing.title}
          loading="lazy"
          decoding="async"
          onLoad={() => setImgLoaded(true)}
          onError={() => setImgLoaded(true)}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/30 to-transparent" />

        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/40 to-transparent" />

        <div className="absolute top-3 left-3">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-white/90 bg-black/30 backdrop-blur-sm border border-white/20 rounded-full px-2.5 py-1">
            {listing.type ?? "Stay"}
          </span>
        </div>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.85 }}
          onClick={handleToggleFavorite}
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-sm border border-white/20 hover:bg-white/40 transition-colors"
          aria-label={isLiked ? "Remove from favorites" : "Save to favorites"}
        >
          <Heart
            className={`w-3.5 h-3.5 transition-all ${
              isLiked ? "fill-red-500 stroke-red-500 scale-110" : "text-white"
            }`}
          />
        </motion.button>

        <div className="absolute bottom-3 right-3">
          <span className="text-[12px] font-bold text-white bg-black/40 backdrop-blur-sm rounded-lg px-2.5 py-1">
            ${listing.pricePerNight}
            <span className="font-normal opacity-80">/night</span>
          </span>
        </div>
      </Link>

      <div className="pt-3 px-0.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="text-[14px] font-semibold text-gray-900 dark:text-white truncate leading-snug">
              {listing.title}
            </h2>
            <p className="flex items-center gap-1 text-[12px] text-gray-400 mt-0.5">
              <MapPin className="w-3 h-3 shrink-0" />
              <span className="truncate">{listing.location}</span>
            </p>
          </div>

          <div className="flex items-center gap-1 shrink-0 mt-0.5">
            <Star className="w-3.5 h-3.5 fill-amber-400 stroke-none" />
            <span className="text-[13px] font-semibold text-gray-900 dark:text-white">
              {listing.rating}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
