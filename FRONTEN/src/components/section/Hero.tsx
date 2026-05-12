import { Link } from "react-router-dom";
import { MapPin, Search, ShieldCheck, Star } from "lucide-react";
import SearchBar from "../SearchBar";

export default function Hero() {
  return (
    <section className="pt-4">
      <div className="grid min-h-[620px] grid-cols-1 overflow-hidden rounded-[2rem] border border-gray-200 bg-white dark:border-white/[0.08] dark:bg-[#111827] lg:grid-cols-[1.03fr_0.97fr]">
        <div className="flex flex-col justify-between px-5 py-7 sm:px-8 lg:px-10 lg:py-10">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-gray-200 px-3 py-1.5 text-[12px] font-medium text-gray-600 dark:border-white/[0.1] dark:text-gray-300">
            <ShieldCheck className="h-3.5 w-3.5 text-(--color-primary)" />
            Verified stays from local hosts
          </div>

          <div className="max-w-2xl py-12 lg:py-16">
            <h1
              style={{ fontFamily: "'Playfair Display', serif" }}
              className="text-4xl font-semibold leading-[1.05] tracking-tight text-gray-950 dark:text-white sm:text-5xl lg:text-7xl"
            >
              Find a stay that feels made for the trip.
            </h1>
            <p className="mt-5 max-w-xl text-[15px] leading-7 text-gray-500 dark:text-gray-400 sm:text-base">
              Search real homes, compare locations, and book guest-ready places
              with clean details from the backend.
            </p>
          </div>

          <div className="space-y-5">
            <SearchBar />
            <div className="flex flex-wrap gap-3 text-[13px] text-gray-500 dark:text-gray-400">
              <span className="inline-flex items-center gap-1.5">
                <Star className="h-3.5 w-3.5 fill-amber-400 stroke-none" />
                Guest favorites
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-(--color-primary)" />
                Kigali, Nairobi, Kampala and more
              </span>
            </div>
          </div>
        </div>

        <div className="relative min-h-[360px] bg-gray-100 dark:bg-white/[0.04] lg:min-h-full">
          <img
            src="/image/hero-background.jpg"
            alt="Beautiful guest stay"
            className="h-full w-full object-cover"
          />
          <div className="absolute bottom-5 left-5 right-5 rounded-2xl border border-white/30 bg-white/90 p-4 shadow-xl shadow-black/10 backdrop-blur-md dark:border-white/[0.08] dark:bg-[#111827]/90">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">
                  Featured area
                </p>
                <p className="mt-1 text-[15px] font-semibold text-gray-950 dark:text-white">
                  Handpicked stays near landmarks
                </p>
              </div>
              <Link
                to="/all-listings"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-(--color-primary) text-white transition-opacity hover:opacity-90"
                aria-label="Explore listings"
              >
                <Search className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
