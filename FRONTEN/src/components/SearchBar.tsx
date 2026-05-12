import { Search, MapPin, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { searchLocation, searchPriceRange } from "../data";

interface SearchBarProps {
  onSearch?: (params: {
    query: string;
    location: string;
    price: string;
  }) => void;
}

export default function SearchBar({ onSearch }: SearchBarProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [price, setPrice] = useState("");

  const handleSearch = () => {
    onSearch?.({ query, location, price });
    const params = new URLSearchParams();
    if (location) params.set("location", location);
    if (query) params.set("q", query);
    if (price) params.set("price", price);
    navigate(`/all-listings${params.toString() ? `?${params}` : ""}`);
  };

  return (
    <div className="w-full rounded-2xl border border-gray-200 bg-white p-2 shadow-xl shadow-black/[0.08] dark:border-white/[0.08] dark:bg-[#1a1f2b] dark:shadow-black/30">
      <div className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_1fr_1fr_auto]">
        <label className="flex items-center gap-3 rounded-xl px-4 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.04]">
          <Search className="h-4 w-4 shrink-0 text-gray-400" />
          <span className="min-w-0 flex-1">
            <span className="block text-[10px] font-semibold uppercase tracking-widest text-gray-400">
              Search
            </span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Landmark or stay"
              className="mt-0.5 w-full bg-transparent text-[13px] font-medium text-gray-950 outline-none placeholder:text-gray-300 dark:text-white dark:placeholder:text-gray-600"
            />
          </span>
        </label>

        <label className="flex items-center gap-3 rounded-xl px-4 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.04]">
          <MapPin className="h-4 w-4 shrink-0 text-gray-400" />
          <span className="min-w-0 flex-1">
            <span className="block text-[10px] font-semibold uppercase tracking-widest text-gray-400">
              Location
            </span>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="mt-0.5 w-full cursor-pointer appearance-none bg-transparent text-[13px] font-medium text-gray-950 outline-none dark:text-white"
            >
              <option value="">Anywhere</option>
              {searchLocation.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </span>
        </label>

        <label className="flex items-center gap-3 rounded-xl px-4 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.04]">
          <SlidersHorizontal className="h-4 w-4 shrink-0 text-gray-400" />
          <span className="min-w-0 flex-1">
            <span className="block text-[10px] font-semibold uppercase tracking-widest text-gray-400">
              Budget
            </span>
            <select
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="mt-0.5 w-full cursor-pointer appearance-none bg-transparent text-[13px] font-medium text-gray-950 outline-none dark:text-white"
            >
              <option value="">Any price</option>
              {searchPriceRange.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </span>
        </label>

        <button
          onClick={handleSearch}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-(--color-primary) px-6 py-3 text-[13px] font-semibold text-white transition-all hover:bg-(--color-primary-dark) active:scale-[0.98]"
        >
          <Search className="h-4 w-4" />
          Search
        </button>
      </div>
    </div>
  );
}
