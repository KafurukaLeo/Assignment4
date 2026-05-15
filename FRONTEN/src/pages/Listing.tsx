import {
  Grid,
  List,
  MapPin,
  SlidersHorizontal,
  Home,
  DollarSign,
  Users,
  Sparkles,
  Lightbulb,
  X,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { useSearchParams } from "react-router-dom";
import { Categories } from "../data";
import ListingCard from "../components/card/ListingCard";
import { useState, useEffect } from "react";
import { api } from "../lib/api";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { AIFilters, Listing, ListingType } from "../types";

interface AISearchResult {
  feedback: string;
  confidence: "high" | "medium" | "low";
  suggestion: string | null;
  filters: AIFilters;
  data: Listing[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

interface ListingsSearchResponse {
  data: Listing[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export default function Listing() {
  const [viewType, setViewType] = useState<"grid" | "list">("grid");
  const [searchParams, setSearchParams] = useSearchParams();
  const locationParam = searchParams.get("location");
  const guestsParam = searchParams.get("guests");
  const maxPriceParam = searchParams.get("maxPrice");
  const [priceRange, setPriceRange] = useState(
    () => Number(maxPriceParam) || 1000,
  );
  const typeParam = searchParams.get("type");
  const [selectedCategories, setSelectedCategories] = useState<string[]>(() => {
    if (typeParam) {
      return typeParam.split(",").map(t => t.charAt(0).toUpperCase() + t.slice(1));
    }
    return [];
  });

  useEffect(() => {
    if (typeParam) {
      setSelectedCategories(typeParam.split(",").map(t => t.charAt(0).toUpperCase() + t.slice(1)));
    } else {
      setSelectedCategories([]);
    }
  }, [typeParam]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchWish, setSearchWish] = useState("");
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [aiFilters, setAiFilters] = useState<AIFilters | null>(null);
  const [aiSearchMessage, setAiSearchMessage] = useState<string | null>(null);
  const [aiFeedback, setAiFeedback] = useState<string | null>(null);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [aiResults, setAiResults] = useState<Listing[] | null>(null);
  const [page, setPage] = useState(1);
  const limit = 12;

  const {
    data: listingsResponse,
    error,
    isFetching,
    isLoading,
  } = useQuery<ListingsSearchResponse>({
    queryKey: [
      "listings",
      "search",
      locationParam,
      guestsParam,
      priceRange,
      selectedCategories,
      page,
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (locationParam) params.set("location", locationParam);
      if (guestsParam) params.set("guests", guestsParam);
      if (priceRange < 1000) params.set("maxPrice", String(priceRange));
      if (selectedCategories.length > 0) {
        params.set(
          "type",
          selectedCategories
            .map((category) => category.toLowerCase())
            .join(","),
        );
      }
      params.set("page", String(page));
      params.set("limit", String(limit));

      const res = await api.get(`/listings?${params.toString()}`);
      return res.data;
    },
    placeholderData: keepPreviousData,
  });

  const handleAISearch = async () => {
    if (!searchWish.trim()) {
      setAiSearchMessage("Please enter a search query");
      return;
    }
    setIsAiSearching(true);
    setAiSearchMessage(null);
    setAiFeedback(null);
    setAiSuggestion(null);
    setAiResults(null);

    try {
      const res = await api.post<AISearchResult>("/ai/search", {
        query: searchWish,
      });
      const { filters, feedback, suggestion, data } = res.data;

      setAiFeedback(feedback);
      setAiSuggestion(suggestion ?? null);
      setAiFilters(filters);
      setAiResults(data);
      setAiSearchMessage(null);

      if (filters.location) setSearchParams({ location: filters.location });
      if (filters.maxPrice) setPriceRange(filters.maxPrice);
      if (filters.type) {
        const categoryMap: Record<ListingType, string> = {
          apartment: "Apartment",
          house: "House",
          villa: "Villa",
          cabin: "Cabin",
        };
        setSelectedCategories([categoryMap[filters.type]]);
      }
    } catch (error: unknown) {
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as {
          response?: {
            data?: { message?: string; feedback?: string; suggestion?: string };
          };
        };
        const errData = axiosError.response?.data;
        setAiSearchMessage(
          errData?.message || "Smart search failed. Please try again.",
        );
        if (errData?.feedback) setAiFeedback(errData.feedback);
        if (errData?.suggestion) setAiSuggestion(errData.suggestion);
      } else {
        setAiSearchMessage("Smart search failed. Please try again.");
      }
      setAiResults(null);
    } finally {
      setIsAiSearching(false);
    }
  };

  const toggleCategory = (title: string) => {
    const newCategories = selectedCategories.includes(title)
      ? selectedCategories.filter((c) => c !== title)
      : [...selectedCategories, title];
    
    setSelectedCategories(newCategories);
    
    const newParams = new URLSearchParams(searchParams);
    if (newCategories.length > 0) {
      newParams.set("type", newCategories.map(c => c.toLowerCase()).join(","));
    } else {
      newParams.delete("type");
    }
    setSearchParams(newParams);
    setPage(1);
  };

  const listings = Array.isArray(listingsResponse?.data) 
    ? listingsResponse.data 
    : (Array.isArray(listingsResponse) ? listingsResponse : []);
    
  const totalListings = listingsResponse?.meta?.total ?? listings.length;
  const displayListings = aiResults ?? listings;
  const displayTotal = aiResults ? aiResults.length : totalListings;

  const hasActiveFilters =
    selectedCategories.length > 0 ||
    priceRange < 1000 ||
    !!locationParam ||
    !!guestsParam ||
    !!aiResults;

  const clearAllFilters = () => {
    setSelectedCategories([]);
    setPriceRange(1000);
    setSearchParams({});
    setSearchWish("");
    setAiFilters(null);
    setAiSearchMessage(null);
    setAiFeedback(null);
    setAiSuggestion(null);
    setAiResults(null);
    setPage(1);
  };

  const renderSidebarContent = () => (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">
          Smart Search
        </p>
        <div className="relative mb-2">
          <textarea
            placeholder="e.g. Beach house under $300 for 4 guests in Miami..."
            value={searchWish}
            onChange={(e) => setSearchWish(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleAISearch();
              }
            }}
            rows={3}
            className="w-full bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] rounded-xl px-3.5 py-3 text-[13px] text-gray-800 dark:text-gray-200 placeholder-gray-300 dark:placeholder-gray-600 outline-none resize-none focus:border-[var(--color-primary)] transition-colors"
          />
        </div>
        <button
          onClick={handleAISearch}
          disabled={isAiSearching || !searchWish.trim()}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-(--color-primary) text-white rounded-xl text-[12px] font-semibold disabled:opacity-40 hover:opacity-90 active:scale-[0.98] transition-all"
        >
          <Sparkles className="w-3.5 h-3.5" />
          {isAiSearching ? "Searching..." : "Search"}
        </button>

        {aiFeedback && (
          <div className="mt-3 p-3 bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06] rounded-xl">
            <div className="flex items-start gap-2">
              <Sparkles className="w-3 h-3 text-(--color-primary) mt-0.5 shrink-0" />
              <p className="text-[12px] text-gray-600 dark:text-gray-400 leading-relaxed">
                {aiFeedback}
              </p>
            </div>
            {aiSuggestion && (
              <p className="text-[11px] text-gray-400 mt-2 pl-5 flex items-center gap-1.5">
                <Lightbulb className="w-3 h-3 shrink-0" /> {aiSuggestion}
              </p>
            )}
          </div>
        )}

        {aiSearchMessage && (
          <div className="mt-3 p-3 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-xl text-[12px] text-red-600 dark:text-red-400">
            {aiSearchMessage}
          </div>
        )}

        {aiFilters && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {aiFilters.location && (
              <span className="flex items-center gap-1 bg-gray-100 dark:bg-white/[0.06] px-2.5 py-1 rounded-lg text-[11px] text-gray-500 dark:text-gray-400">
                <MapPin className="w-3 h-3" /> {aiFilters.location}
              </span>
            )}
            {aiFilters.type && (
              <span className="flex items-center gap-1 bg-gray-100 dark:bg-white/[0.06] px-2.5 py-1 rounded-lg text-[11px] text-gray-500 dark:text-gray-400">
                <Home className="w-3 h-3" /> {aiFilters.type}
              </span>
            )}
            {aiFilters.maxPrice && (
              <span className="flex items-center gap-1 bg-gray-100 dark:bg-white/[0.06] px-2.5 py-1 rounded-lg text-[11px] text-gray-500 dark:text-gray-400">
                <DollarSign className="w-3 h-3" /> ${aiFilters.maxPrice}
              </span>
            )}
            {aiFilters.guests && (
              <span className="flex items-center gap-1 bg-gray-100 dark:bg-white/[0.06] px-2.5 py-1 rounded-lg text-[11px] text-gray-500 dark:text-gray-400">
                <Users className="w-3 h-3" /> {aiFilters.guests} guests
              </span>
            )}
          </div>
        )}
      </div>

      <div className="h-px bg-gray-100 dark:bg-white/[0.06]" />

      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
            Max price
          </p>
          <span className="text-[13px] font-semibold text-(--color-primary)">
            ${priceRange}
          </span>
        </div>
        <input
          type="range"
          min={10}
          max={1000}
          step={10}
          value={priceRange}
          onChange={(e) => setPriceRange(Number(e.target.value))}
          className="w-full accent-(--color-primary) h-1 cursor-pointer"
        />
        <div className="flex justify-between text-[11px] text-gray-300 dark:text-gray-600 mt-1.5">
          <span>$10</span>
          <span>$1,000</span>
        </div>
      </div>

      <div className="h-px bg-gray-100 dark:bg-white/[0.06]" />

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-4">
          Property type
        </p>
        <div className="grid grid-cols-2 gap-2">
          {Categories.map((category) => {
            const checked = selectedCategories.includes(category.title);
            const Icon = category.icon;
            return (
              <button
                key={category.title}
                onClick={() => toggleCategory(category.title)}
                className={[
                  "flex flex-col items-start gap-1.5 px-3 py-2.5 rounded-xl border text-left transition-all duration-150",
                  checked
                    ? "border-(--color-primary) bg-(--color-primary)/5 dark:bg-(--color-primary)/10"
                    : "border-gray-200 dark:border-white/[0.08] hover:border-gray-300 dark:hover:border-white/20 bg-white dark:bg-white/[0.02]",
                ].join(" ")}
              >
                <Icon
                  className={[
                    "w-4 h-4",
                    checked
                      ? "text-(--color-primary)"
                      : "text-gray-400 dark:text-gray-500",
                  ].join(" ")}
                />
                <span
                  className={[
                    "text-[12px] font-medium",
                    checked
                      ? "text-(--color-primary)"
                      : "text-gray-600 dark:text-gray-400",
                  ].join(" ")}
                >
                  {category.title}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {hasActiveFilters && (
        <button
          onClick={clearAllFilters}
          className="w-full py-2.5 text-[12px] font-medium text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-white/[0.08] rounded-xl hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors"
        >
          Clear all filters
        </button>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <div className="max-w-screen-xl mx-auto px-5 sm:px-8 py-8">
        <div className="lg:grid lg:grid-cols-[260px_1fr] lg:gap-10">
          <div className="hidden lg:block">
            <div className="h-8 w-24 bg-gray-100 dark:bg-white/[0.06] rounded-lg animate-pulse mb-6" />
            <div className="space-y-3">
              {[80, 60, 70, 55].map((w, i) => (
                <div
                  key={i}
                  className={`h-4 bg-gray-100 dark:bg-white/[0.06] rounded animate-pulse`}
                  style={{ width: `${w}%` }}
                />
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="aspect-[4/3] rounded-2xl bg-gray-100 dark:bg-white/[0.05] animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-red-500 text-sm">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="max-w-screen-xl mx-auto px-5 sm:px-8 py-8 min-h-screen">
      <div className="lg:grid lg:grid-cols-[260px_1fr] lg:gap-10">
        <aside className="hidden lg:block">
          <div className="sticky top-20">
            <div className="flex items-center gap-2 mb-6">
              <SlidersHorizontal className="w-4 h-4 text-(--color-primary)" />
              <h2 className="text-[15px] font-semibold text-gray-900 dark:text-white">
                Filters
              </h2>
            </div>
            {renderSidebarContent()}
          </div>
        </aside>

        {isFilterOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setIsFilterOpen(false)}
            />
            <div className="fixed inset-y-0 left-0 w-[300px] max-w-full z-50 bg-white dark:bg-[#0f1117] overflow-y-auto lg:hidden shadow-2xl">
              <div className="p-5">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-(--color-primary)" />
                    <h2 className="text-[15px] font-semibold text-gray-900 dark:text-white">
                      Filters
                    </h2>
                  </div>
                  <button
                    onClick={() => setIsFilterOpen(false)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
                {renderSidebarContent()}
              </div>
            </div>
          </>
        )}

        <div>
          <div className="flex items-center justify-between gap-4 mb-7">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsFilterOpen(true)}
                className="lg:hidden flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 dark:border-white/[0.1] text-[13px] font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.05] transition-colors"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Filters
                {hasActiveFilters && (
                  <span className="w-4 h-4 bg-(--color-primary) text-white rounded-full text-[9px] font-bold flex items-center justify-center">
                    {selectedCategories.length +
                      (locationParam ? 1 : 0) +
                      (guestsParam ? 1 : 0) +
                      (priceRange < 1000 ? 1 : 0)}
                  </span>
                )}
              </button>

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-[15px] font-semibold text-gray-900 dark:text-white">
                    {displayTotal}{" "}
                    <span className="font-normal text-gray-400">
                      {displayTotal === 1 ? "listing" : "listings"}
                    </span>
                  </h1>
                  {isFetching && !isLoading && (
                    <span className="text-[11px] font-medium text-gray-400">
                      Updating...
                    </span>
                  )}
                </div>
                {locationParam && (
                  <p className="text-[12px] text-gray-400 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3" /> {locationParam}
                  </p>
                )}
                {guestsParam && (
                  <p className="text-[12px] text-gray-400 flex items-center gap-1 mt-0.5">
                    <Users className="w-3 h-3" /> {guestsParam} guests
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-white/[0.05] rounded-xl">
              <button
                onClick={() => setViewType("grid")}
                className={[
                  "p-2 rounded-lg transition-all duration-150",
                  viewType === "grid"
                    ? "bg-white dark:bg-white/[0.1] text-gray-900 dark:text-white shadow-sm"
                    : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300",
                ].join(" ")}
                aria-label="Grid view"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewType("list")}
                className={[
                  "p-2 rounded-lg transition-all duration-150",
                  viewType === "list"
                    ? "bg-white dark:bg-white/[0.1] text-gray-900 dark:text-white shadow-sm"
                    : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300",
                ].join(" ")}
                aria-label="List view"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 mb-5">
              {locationParam && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-white/[0.06] rounded-lg text-[12px] text-gray-600 dark:text-gray-400">
                  <MapPin className="w-3 h-3" /> {locationParam}
                </span>
              )}
              {selectedCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => toggleCategory(cat)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-white/[0.06] rounded-lg text-[12px] text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/[0.1] transition-colors"
                >
                  {cat} <X className="w-2.5 h-2.5" />
                </button>
              ))}
              {priceRange < 1000 && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-white/[0.06] rounded-lg text-[12px] text-gray-600 dark:text-gray-400">
                  Up to ${priceRange}
                </span>
              )}
              {guestsParam && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-white/[0.06] rounded-lg text-[12px] text-gray-600 dark:text-gray-400">
                  <Users className="w-3 h-3" /> {guestsParam} guests
                </span>
              )}
              <button
                onClick={clearAllFilters}
                className="px-3 py-1.5 text-[12px] text-(--color-primary) hover:underline"
              >
                Clear all
              </button>
            </div>
          )}

          {displayListings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-white/[0.05] flex items-center justify-center">
                <Search className="w-6 h-6 text-gray-300 dark:text-gray-600" />
              </div>
              <div className="text-center">
                <p className="text-[14px] font-medium text-gray-900 dark:text-white mb-1">
                  No listings found
                </p>
                <p className="text-[13px] text-gray-400">
                  Try adjusting your filters or search differently
                </p>
              </div>
              <button
                onClick={clearAllFilters}
                className="mt-2 px-5 py-2 text-[13px] font-medium bg-(--color-primary) text-white rounded-xl hover:opacity-90 transition-opacity"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div
              className={
                viewType === "grid"
                  ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5"
                  : "flex flex-col gap-4"
              }
            >
              {displayListings.map((listing: Listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  type={viewType}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {!aiResults && listingsResponse?.meta && listingsResponse.meta.totalPages > 1 && (
            <div className="mt-12 flex flex-col items-center gap-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setPage((p) => Math.max(1, p - 1));
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  disabled={page === 1}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 transition-all hover:bg-gray-50 disabled:opacity-40 dark:border-white/[0.08] dark:bg-white/[0.02] dark:text-gray-400"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                <div className="flex items-center gap-1.5 px-4 py-2 bg-gray-50 dark:bg-white/[0.04] rounded-xl border border-gray-100 dark:border-white/[0.06]">
                  <span className="text-[13px] font-semibold text-gray-900 dark:text-white">
                    {page}
                  </span>
                  <span className="text-[12px] text-gray-400">/</span>
                  <span className="text-[13px] font-medium text-gray-500">
                    {listingsResponse.meta.totalPages}
                  </span>
                </div>

                <button
                  onClick={() => {
                    setPage((p) => Math.min(listingsResponse.meta.totalPages, p + 1));
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  disabled={page === listingsResponse.meta.totalPages}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 transition-all hover:bg-gray-50 disabled:opacity-40 dark:border-white/[0.08] dark:bg-white/[0.02] dark:text-gray-400"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
              <p className="text-[11px] text-gray-400 font-medium uppercase tracking-widest">
                Showing {listings.length} of {listingsResponse.meta.total} properties
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
