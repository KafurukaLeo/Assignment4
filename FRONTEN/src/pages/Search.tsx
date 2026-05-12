import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import {
  Search as SearchIcon,
  Filter,
  MapPin,
  Users,
  DollarSign,
  Star,
} from "lucide-react";

interface Listing {
  id: string;
  title: string;
  description: string;
  location: string;
  pricePerNight: number;
  guests: number;
  type: string;
  photos: string[];
  rating?: number;
}

interface SearchResponse {
  data: Listing[];
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface SearchFilters {
  location: string;
  type: string;
  minPrice: number;
  maxPrice: number;
  guests: number;
}

export default function Search() {
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState<SearchFilters>({
    location: searchParams.get("location") || "",
    type: searchParams.get("type") || "",
    minPrice: Number(searchParams.get("minPrice")) || 0,
    maxPrice: Number(searchParams.get("maxPrice")) || 1000,
    guests: Number(searchParams.get("guests")) || 1,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const limit = 12;

  const { data: searchResults, isLoading } = useQuery({
    queryKey: ["search", filters, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.location) params.append("location", filters.location);
      if (filters.type) params.append("type", filters.type);
      if (filters.minPrice > 0) {
        params.append("minPrice", filters.minPrice.toString());
      }
      if (filters.maxPrice < 1000) {
        params.append("maxPrice", filters.maxPrice.toString());
      }
      if (filters.guests > 1) {
        params.append("guests", filters.guests.toString());
      }
      params.append("page", page.toString());
      params.append("limit", limit.toString());

      const response = await api.get(`/listings/search?${params.toString()}`);
      return response.data as SearchResponse;
    },
  });

  const results = searchResults?.data ?? [];
  const totalPages =
    searchResults?.meta?.totalPages || Math.max(1, Math.ceil(results.length / limit));

  const handleFilterChange = (
    key: keyof SearchFilters,
    value: string | number,
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({
      location: "",
      type: "",
      minPrice: 0,
      maxPrice: 1000,
      guests: 1,
    });
    setPage(1);
  };

  return (
    <div className="min-h-screen py-8">
      <div className="mb-8">
        <p className="text-[12px] font-semibold uppercase tracking-widest text-gray-400">
          Search
        </p>
        <h1
          style={{ fontFamily: "'Playfair Display', serif" }}
          className="mt-1 text-3xl font-semibold text-gray-950 dark:text-white"
        >
          Find properties
        </h1>
      </div>

      <section className="mb-6 rounded-[1.5rem] border border-gray-200 bg-white p-4 dark:border-white/[0.08] dark:bg-[#111827]">
        <div className="flex flex-col gap-3 lg:flex-row">
          <label className="flex flex-1 items-center gap-3 rounded-xl bg-gray-50 px-4 py-3 dark:bg-white/[0.04]">
            <SearchIcon className="h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by location"
              value={filters.location}
              onChange={(e) => handleFilterChange("location", e.target.value)}
              className="w-full bg-transparent text-[14px] text-gray-950 outline-none placeholder:text-gray-300 dark:text-white"
            />
          </label>
          <button
            onClick={() => setShowFilters((value) => !value)}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-[13px] font-semibold text-gray-700 transition-colors hover:border-(--color-primary) hover:text-(--color-primary) dark:border-white/[0.08] dark:text-gray-300"
          >
            <Filter className="h-4 w-4" />
            Filters
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 grid gap-3 border-t border-gray-100 pt-4 dark:border-white/[0.06] md:grid-cols-4">
            <FilterField label="Property type">
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange("type", e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-[14px] text-gray-950 outline-none transition-colors focus:border-(--color-primary) dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white"
              >
                <option value="">All types</option>
                <option value="apartment">Apartment</option>
                <option value="house">House</option>
                <option value="villa">Villa</option>
                <option value="cabin">Cabin</option>
              </select>
            </FilterField>
            <FilterField label="Min price" icon={DollarSign}>
              <input
                type="number"
                value={filters.minPrice}
                onChange={(e) =>
                  handleFilterChange("minPrice", Number(e.target.value))
                }
                className="w-full rounded-xl border border-gray-200 bg-white px-8 py-2.5 text-[14px] text-gray-950 outline-none transition-colors focus:border-(--color-primary) dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white"
              />
            </FilterField>
            <FilterField label="Max price" icon={DollarSign}>
              <input
                type="number"
                value={filters.maxPrice}
                onChange={(e) =>
                  handleFilterChange("maxPrice", Number(e.target.value))
                }
                className="w-full rounded-xl border border-gray-200 bg-white px-8 py-2.5 text-[14px] text-gray-950 outline-none transition-colors focus:border-(--color-primary) dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white"
              />
            </FilterField>
            <FilterField label="Guests" icon={Users}>
              <select
                value={filters.guests}
                onChange={(e) =>
                  handleFilterChange("guests", Number(e.target.value))
                }
                className="w-full rounded-xl border border-gray-200 bg-white px-8 py-2.5 text-[14px] text-gray-950 outline-none transition-colors focus:border-(--color-primary) dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                  <option key={num} value={num}>
                    {num} {num === 1 ? "guest" : "guests"}
                  </option>
                ))}
              </select>
            </FilterField>
            <button
              onClick={clearFilters}
              className="w-fit rounded-xl border border-gray-200 px-4 py-2.5 text-[13px] font-semibold text-gray-700 transition-colors hover:border-(--color-primary) hover:text-(--color-primary) dark:border-white/[0.08] dark:text-gray-300 md:col-span-4"
            >
              Clear filters
            </button>
          </div>
        )}
      </section>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[4/3] rounded-2xl bg-gray-100 dark:bg-white/[0.05] animate-pulse"
            />
          ))}
        </div>
      ) : (
        <>
          <p className="mb-4 text-[14px] text-gray-500 dark:text-gray-400">
            {results.length} properties found
          </p>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
            {results.map((listing) => (
              <article
                key={listing.id}
                className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-white/[0.08] dark:bg-[#111827]"
              >
                <div className="aspect-[4/3] bg-gray-100 dark:bg-white/[0.05]">
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
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="line-clamp-1 text-[15px] font-semibold text-gray-950 dark:text-white">
                      {listing.title}
                    </h2>
                    {listing.rating && (
                      <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-gray-950 dark:text-white">
                        <Star className="h-3 w-3 fill-amber-400 stroke-none" />
                        {listing.rating.toFixed(1)}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 flex items-center gap-1 text-[12px] text-gray-500 dark:text-gray-400">
                    <MapPin className="h-3.5 w-3.5" />
                    <span className="truncate">{listing.location}</span>
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="flex items-center gap-1 text-[12px] text-gray-500 dark:text-gray-400">
                      <Users className="h-3.5 w-3.5" />
                      {listing.guests} guests
                    </span>
                    <span className="text-[14px] font-semibold text-gray-950 dark:text-white">
                      ${listing.pricePerNight}
                    </span>
                  </div>
                  <Link
                    to={`/listings/${listing.id}`}
                    className="mt-4 inline-flex w-full justify-center rounded-xl bg-(--color-primary) px-4 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-(--color-primary-dark)"
                  >
                    View details
                  </Link>
                </div>
              </article>
            ))}
          </div>

          {results.length === 0 && (
            <div className="rounded-[1.5rem] border border-gray-200 bg-white px-6 py-16 text-center dark:border-white/[0.08] dark:bg-[#111827]">
              <p className="text-lg font-semibold text-gray-950 dark:text-white">
                No properties found
              </p>
              <p className="mt-2 text-[14px] text-gray-500 dark:text-gray-400">
                Try adjusting your filters or search criteria.
              </p>
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-3">
              <button
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page === 1}
                className="rounded-xl border border-gray-200 px-4 py-2 text-[13px] font-semibold text-gray-700 disabled:opacity-50 dark:border-white/[0.08] dark:text-gray-300"
              >
                Previous
              </button>
              <span className="text-[13px] text-gray-500">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={page === totalPages}
                className="rounded-xl border border-gray-200 px-4 py-2 text-[13px] font-semibold text-gray-700 disabled:opacity-50 dark:border-white/[0.08] dark:text-gray-300"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function FilterField({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
        {label}
      </span>
      <span className="relative block">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        )}
        {children}
      </span>
    </label>
  );
}
