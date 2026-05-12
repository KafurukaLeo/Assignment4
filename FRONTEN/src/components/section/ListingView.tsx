import { useEffect, useState } from "react";
import {
  X,
  MapPin,
  Users,
  Home,
  Wifi,
  Coffee,
  Car,
  PawPrint,
  Star,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  CalendarDays,
} from "lucide-react";
import type { Listing } from "../../types";
import { getImageUrl } from "../../lib/utils";

interface ListingViewProps {
  listing: Listing | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ListingView({
  listing,
  isOpen,
  onClose,
}: ListingViewProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  if (!listing || !isOpen) return null;

  const nextImage = () =>
    setCurrentImageIndex((prev) => (prev + 1) % listing.photos.length);
  const prevImage = () =>
    setCurrentImageIndex((prev) =>
      prev === 0 ? listing.photos.length - 1 : prev - 1,
    );

  const getAmenityIcon = (amenity: string) => {
    const a = amenity.toLowerCase();
    if (a.includes("wifi")) return Wifi;
    if (a.includes("kitchen")) return Coffee;
    if (a.includes("parking")) return Car;
    if (a.includes("pet")) return PawPrint;
    return Home;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full sm:max-w-2xl max-h-[95vh] sm:max-h-[90vh] bg-white dark:bg-[#1A1A1A] sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden flex flex-col z-10">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-20 w-8 h-8 bg-white/90 dark:bg-[#2A2A2A]/90 rounded-full flex items-center justify-center shadow hover:bg-white dark:hover:bg-[#333] transition-colors"
        >
          <X className="w-4 h-4 text-[#111] dark:text-white" />
        </button>

        {/* Image Slider */}
        <div className="relative h-56 sm:h-72 shrink-0 bg-[#EBEBEB] dark:bg-[#2A2A2A]">
          {listing.photos?.length > 0 ? (
            <>
              <img
                src={getImageUrl(listing.photos[currentImageIndex])}
                alt={listing.title}
                className="w-full h-full object-cover"
              />
              {listing.photos.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 dark:bg-black/50 rounded-full flex items-center justify-center shadow"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 dark:bg-black/50 rounded-full flex items-center justify-center shadow"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {listing.photos.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentImageIndex(i)}
                        className={`h-1.5 rounded-full transition-all ${
                          i === currentImageIndex
                            ? "w-4 bg-white"
                            : "w-1.5 bg-white/50"
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Home className="w-12 h-12 text-[#CCCCCC]" />
            </div>
          )}

          {/* Type badge */}
          <span className="absolute top-3 left-3 px-2.5 py-1 bg-white/90 dark:bg-[#1A1A1A]/90 rounded-full text-[11px] font-semibold text-[#111] dark:text-white capitalize">
            {listing.type}
          </span>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 p-5">
          {/* Title + Price */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1 min-w-0">
              <h2
                style={{ fontFamily: "'Playfair Display', serif" }}
                className="text-lg font-semibold text-[#111] dark:text-white leading-snug"
              >
                {listing.title}
              </h2>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="flex items-center gap-1 text-[12px] text-[#717171]">
                  <MapPin className="w-3 h-3" /> {listing.location}
                </span>
                {listing.rating && (
                  <>
                    <span className="text-[#CCCCCC]">·</span>
                    <span className="flex items-center gap-1 text-[12px] text-[#717171]">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      {listing.rating.toFixed(1)}
                    </span>
                  </>
                )}
              </div>
            </div>
            <div className="text-right shrink-0">
              <p
                style={{ fontFamily: "'Playfair Display', serif" }}
                className="text-xl font-semibold text-[#111] dark:text-white"
              >
                ${listing.pricePerNight}
              </p>
              <p className="text-[11px] text-[#AAAAAA]">per night</p>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2 mb-5">
            {[
              { icon: Users, label: "Guests", value: listing.guests },
              {
                icon: DollarSign,
                label: "Per Night",
                value: `$${listing.pricePerNight}`,
              },
              {
                icon: CalendarDays,
                label: "Listed",
                value: new Date(listing.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  year: "numeric",
                }),
              },
            ].map(({ icon: Icon, label, value }) => (
              <div
                key={label}
                className="bg-[#F8F8F8] dark:bg-[#2A2A2A] rounded-xl p-3 text-center"
              >
                <Icon className="w-4 h-4 text-[#AAAAAA] mx-auto mb-1" />
                <p className="text-[11px] text-[#AAAAAA]">{label}</p>
                <p className="text-[13px] font-semibold text-[#111] dark:text-white mt-0.5">
                  {value}
                </p>
              </div>
            ))}
          </div>

          {/* Host */}
          {listing.host && (
            <div className="flex items-center gap-3 py-4 border-t border-b border-[#EBEBEB] dark:border-[#2A2A2A] mb-5">
              <img
                src={getImageUrl(listing.host.avatar) || "/default-avatar.png"}
                alt={listing.host.name || "Host"}
                className="w-10 h-10 rounded-full object-cover bg-[#EBEBEB]"
              />
              <div>
                <p className="text-[11px] text-[#AAAAAA]">Hosted by</p>
                <p className="text-[13px] font-semibold text-[#111] dark:text-white">
                  {listing.host.name}
                </p>
              </div>
            </div>
          )}

          {/* Description */}
          <div className="mb-5">
            <p
              style={{ fontFamily: "'Playfair Display', serif" }}
              className="text-sm font-semibold text-[#111] dark:text-white mb-2"
            >
              About this place
            </p>
            <p className="text-[13px] leading-6 text-[#717171] dark:text-[#AAAAAA]">
              {listing.description}
            </p>
          </div>

          {/* Amenities */}
          {listing.amenities?.length > 0 && (
            <div className="mb-5">
              <p
                style={{ fontFamily: "'Playfair Display', serif" }}
                className="text-sm font-semibold text-[#111] dark:text-white mb-3"
              >
                Amenities
              </p>
              <div className="grid grid-cols-2 gap-2">
                {listing.amenities.slice(0, 8).map((amenity, i) => {
                  const Icon = getAmenityIcon(amenity);
                  return (
                    <div
                      key={i}
                      className="flex items-center gap-2 text-[13px] text-[#717171] dark:text-[#AAAAAA] bg-[#F8F8F8] dark:bg-[#2A2A2A] rounded-lg px-3 py-2"
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{amenity}</span>
                    </div>
                  );
                })}
                {listing.amenities.length > 8 && (
                  <div className="flex items-center text-[12px] text-[#AAAAAA] px-3 py-2">
                    +{listing.amenities.length - 8} more
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer ID */}
          <p className="text-center text-[11px] text-[#CCCCCC] dark:text-[#444] pt-2 border-t border-[#EBEBEB] dark:border-[#2A2A2A]">
            ID: {listing.id.slice(0, 8)}...
          </p>
        </div>
      </div>
    </div>
  );
}
