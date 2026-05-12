import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  Search,
  SlidersHorizontal,
  ChevronDown,
  Plus,
  Pen,
  Trash,
  Eye,
  MapPin,
  DollarSign,
  Users,
  Home,
} from "lucide-react";
import ListingForm from "../../components/form/ListingForm";
import { api } from "../../lib/api";
import type { Listing } from "../../types";
import Spinner from "../../components/Spinner";
import { AMENITIES } from "../../data";
import ListingView from "../../components/section/ListingView";

const listingHeader = [
  "Title",
  "Location",
  "Price",
  "Guests",
  "Type",
  "Actions",
];

const typeConfig: Record<string, string> = {
  apartment: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  house:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  villa:
    "bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  cabin: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
};

export default function DashboardListing() {
  const queryClient = useQueryClient();

  const [searchText, setSearchText] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [isForm, setIsForm] = useState(false);
  const [editingListing, setEditingListing] = useState<Listing | null>(null);
  const [viewListing, setViewListing] = useState<Listing | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });

  const {
    data: listingsData,
    isLoading,
    error,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["listings", "me", pagination.page, pagination.limit],
    queryFn: async () => {
      const res = await api.get(
        `/listings/me?page=${pagination.page}&limit=${pagination.limit}`,
      );
      return {
        listings: res.data.data || [],
        meta: res.data.meta || { total: 0, totalPages: 0 },
      };
    },
    placeholderData: (previousData) => previousData,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
  });

  const listings = listingsData?.listings || [];
  const total = listingsData?.meta?.total || 0;
  const totalPages = listingsData?.meta?.totalPages || 0;

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/listings/${id}`);
      return id;
    },
    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({
        queryKey: ["listings", "me", pagination.page, pagination.limit],
      });
      const previousData = queryClient.getQueryData([
        "listings",
        "me",
        pagination.page,
        pagination.limit,
      ]);
      queryClient.setQueryData(
        ["listings", "me", pagination.page, pagination.limit],
        (old: any) => {
          if (!old) return old;
          return {
            ...old,
            listings: old.listings.filter((l: Listing) => l.id !== deletedId),
            meta: { ...old.meta, total: old.meta.total - 1 },
          };
        },
      );
      return { previousData };
    },
    onError: (_, __, context) => {
      queryClient.setQueryData(
        ["listings", "me", pagination.page, pagination.limit],
        context?.previousData,
      );
      alert("Failed to delete listing. Please try again.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["listings", "me", pagination.page, pagination.limit],
      });
    },
  });

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this listing?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleEdit = (listing: Listing) => {
    setEditingListing(listing);
    setIsForm(true);
  };

  const handleView = (listing: Listing) => {
    setViewListing(listing);
    setIsViewOpen(true);
  };

  const handleFormSuccess = () => {
    refetch();
    setIsForm(false);
    setEditingListing(null);
  };

  const filteredListings = Array.isArray(listings)
    ? listings.filter((listing) =>
        listing.title?.toLowerCase().includes(searchText.toLowerCase()),
      )
    : [];

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <p className="text-red-500 text-sm">
          {error instanceof Error ? error.message : "Failed to load listings"}
        </p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-[#111] dark:bg-white text-white dark:text-[#111] rounded-xl text-sm hover:opacity-80 transition-all"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Toolbar */}
      <div className="py-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-[#EBEBEB] dark:border-[#2A2A2A]">
        <div className="relative w-full sm:w-auto">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="w-4 h-4 text-[#AAAAAA]" />
          </div>
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search listings…"
            className="block w-full sm:w-72 pl-9 pr-3 py-2 bg-[#F7F7F7] dark:bg-[#222] border border-[#EBEBEB] dark:border-[#2A2A2A] text-[#111] dark:text-white text-sm rounded-xl focus:ring-2 focus:ring-[#111] dark:focus:ring-white focus:border-transparent placeholder:text-[#AAAAAA] outline-none transition-all"
          />
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
          {isFetching && !isLoading && (
            <span className="text-[12px] text-[#AAAAAA] animate-pulse">
              Updating...
            </span>
          )}

          {/* Filter */}
          <div className="relative">
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-xl border transition-all outline-none ${
                activeFilter
                  ? "bg-[#111] dark:bg-white text-white dark:text-[#111] border-[#111] dark:border-white"
                  : "bg-[#F7F7F7] dark:bg-[#222] border-[#EBEBEB] dark:border-[#2A2A2A] text-[#717171] hover:text-[#111] dark:hover:text-white hover:bg-[#EBEBEB] dark:hover:bg-[#2A2A2A]"
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="hidden sm:inline">
                {activeFilter ?? "Filter by"}
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform ${filterOpen ? "rotate-180" : ""}`}
              />
            </button>

            {filterOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setFilterOpen(false)}
                />
                <div className="absolute top-full mt-2 right-0 z-50 bg-white dark:bg-[#1A1A1A] border border-[#EBEBEB] dark:border-[#2A2A2A] rounded-2xl shadow-xl w-52 overflow-hidden">
                  <div className="p-1.5">
                    {activeFilter && (
                      <>
                        <button
                          onClick={() => {
                            setActiveFilter(null);
                            setFilterOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 text-[12px] text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                        >
                          Clear filter
                        </button>
                        <div className="h-px bg-[#EBEBEB] dark:bg-[#2A2A2A] my-1" />
                      </>
                    )}
                    {AMENITIES.map((amenity) => (
                      <button
                        key={amenity.key}
                        onClick={() => {
                          setActiveFilter(amenity.label);
                          setFilterOpen(false);
                        }}
                        className={`flex items-center w-full px-3 py-2.5 text-[13px] rounded-xl transition-colors ${
                          activeFilter === amenity.label
                            ? "bg-[#F0F0F0] dark:bg-[#2A2A2A] text-[#111] dark:text-white font-medium"
                            : "text-[#717171] hover:bg-[#F7F7F7] dark:hover:bg-[#222] hover:text-[#111] dark:hover:text-white"
                        }`}
                      >
                        {amenity.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          <button
            onClick={() => {
              setEditingListing(null);
              setIsForm(true);
            }}
            className="inline-flex items-center gap-2 px-3 py-2 bg-[#111] dark:bg-white text-white dark:text-[#111] text-sm font-medium rounded-xl hover:opacity-80 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Listing</span>
          </button>
        </div>
      </div>

      {/* Active filter pill */}
      {activeFilter && (
        <div className="flex items-center gap-2 py-2.5">
          <span className="text-[12px] text-[#AAAAAA]">Filtered by:</span>
          <span className="flex items-center gap-1.5 text-[12px] font-medium px-2.5 py-1 bg-[#F0F0F0] dark:bg-[#2A2A2A] text-[#111] dark:text-white rounded-full">
            {activeFilter}
            <button
              onClick={() => setActiveFilter(null)}
              className="text-[#AAAAAA] hover:text-[#111] dark:hover:text-white ml-0.5"
            >
              ×
            </button>
          </span>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-[#EBEBEB] dark:border-[#2A2A2A]">
                  {listingHeader.map((header) => (
                    <th
                      key={header}
                      className="px-4 py-3 text-[12px] font-semibold text-[#AAAAAA] uppercase tracking-wide whitespace-nowrap"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5F5F5] dark:divide-[#2A2A2A]">
                {filteredListings.length === 0 ? (
                  <tr>
                    <td
                      colSpan={listingHeader.length}
                      className="px-6 py-20 text-center"
                    >
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-[#F7F7F7] dark:bg-[#2A2A2A] flex items-center justify-center">
                          <Home className="w-5 h-5 text-[#CCCCCC]" />
                        </div>
                        <p className="text-[13px] font-medium text-[#111] dark:text-white">
                          No listings found
                        </p>
                        {searchText && (
                          <button
                            onClick={() => setSearchText("")}
                            className="text-[12px] text-(--color-primary) underline"
                          >
                            Clear search
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredListings.map((listing) => (
                    <tr
                      key={listing.id}
                      className={`hover:bg-[#FAFAFA] dark:hover:bg-[#222] transition-colors ${
                        deleteMutation.isPending &&
                        deleteMutation.variables === listing.id
                          ? "opacity-40 pointer-events-none"
                          : ""
                      }`}
                    >
                      <td className="px-4 py-3.5 font-medium text-[#111] dark:text-white max-w-[180px] truncate">
                        {listing.title || "Untitled"}
                      </td>
                      <td className="px-4 py-3.5 text-[#717171]">
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-3 h-3 shrink-0" />
                          {listing.location}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-[#717171]">
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3 shrink-0" />
                          {listing.pricePerNight || 0}
                          <span className="text-[11px] text-[#CCCCCC]">
                            /night
                          </span>
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-[#717171]">
                        <span className="flex items-center gap-1.5">
                          <Users className="w-3 h-3 shrink-0" />
                          {listing.guests}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold capitalize ${
                            typeConfig[listing.type?.toLowerCase()] ??
                            "bg-[#F0F0F0] text-[#717171]"
                          }`}
                        >
                          {listing.type}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleView(listing)}
                            disabled={deleteMutation.isPending}
                            className="p-1.5 hover:bg-[#F0F0F0] dark:hover:bg-[#2A2A2A] rounded-lg transition-colors"
                            title="View"
                          >
                            <Eye className="w-3.5 h-3.5 text-[#717171]" />
                          </button>
                          <button
                            onClick={() => handleEdit(listing)}
                            disabled={deleteMutation.isPending}
                            className="p-1.5 hover:bg-[#F0F0F0] dark:hover:bg-[#2A2A2A] rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Pen className="w-3.5 h-3.5 text-[#717171]" />
                          </button>
                          <button
                            onClick={() => handleDelete(listing.id)}
                            disabled={deleteMutation.isPending}
                            className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash className="w-3.5 h-3.5 text-red-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="block md:hidden space-y-3 mt-4">
            {filteredListings.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-16">
                <div className="w-12 h-12 rounded-2xl bg-[#F7F7F7] dark:bg-[#2A2A2A] flex items-center justify-center">
                  <Home className="w-5 h-5 text-[#CCCCCC]" />
                </div>
                <p className="text-[13px] font-medium text-[#111] dark:text-white">
                  No listings found
                </p>
                {searchText && (
                  <button
                    onClick={() => setSearchText("")}
                    className="text-[12px] text-(--color-primary) underline"
                  >
                    Clear search
                  </button>
                )}
              </div>
            ) : (
              filteredListings.map((listing) => (
                <div
                  key={listing.id}
                  className={`bg-white dark:bg-[#1A1A1A] border border-[#EBEBEB] dark:border-[#2A2A2A] rounded-2xl p-4 transition-all ${
                    deleteMutation.isPending &&
                    deleteMutation.variables === listing.id
                      ? "opacity-40 pointer-events-none"
                      : ""
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 min-w-0 pr-2">
                      <h3 className="font-semibold text-[#111] dark:text-white text-[14px] truncate">
                        {listing.title || "Untitled"}
                      </h3>
                      <span
                        className={`inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${
                          typeConfig[listing.type?.toLowerCase()] ??
                          "bg-[#F0F0F0] text-[#717171]"
                        }`}
                      >
                        {listing.type}
                      </span>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => handleView(listing)}
                        className="p-1.5 hover:bg-[#F0F0F0] dark:hover:bg-[#2A2A2A] rounded-lg transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#717171]" />
                      </button>
                      <button
                        onClick={() => handleEdit(listing)}
                        className="p-1.5 hover:bg-[#F0F0F0] dark:hover:bg-[#2A2A2A] rounded-lg transition-colors"
                      >
                        <Pen className="w-3.5 h-3.5 text-[#717171]" />
                      </button>
                      <button
                        onClick={() => handleDelete(listing.id)}
                        className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        <Trash className="w-3.5 h-3.5 text-red-500" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { icon: MapPin, value: listing.location },
                      {
                        icon: DollarSign,
                        value: `$${listing.pricePerNight || 0}/night`,
                      },
                      { icon: Users, value: `${listing.guests} guests` },
                      { icon: Home, value: listing.type },
                    ].map(({ icon: Icon, value }) => (
                      <div
                        key={value}
                        className="flex items-center gap-1.5 text-[12px] text-[#717171]"
                      >
                        <Icon className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate capitalize">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          <div className="px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#EBEBEB] dark:border-[#2A2A2A]">
            <p className="text-[12px] text-[#AAAAAA]">
              Showing {filteredListings.length} of {total} listings
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() =>
                  setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
                }
                disabled={pagination.page === 1 || isFetching}
                className="text-[12px] px-3 py-1.5 rounded-lg text-[#717171] hover:bg-[#F7F7F7] dark:hover:bg-[#222] hover:text-[#111] dark:hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-[12px] text-[#AAAAAA] px-2">
                {pagination.page} / {totalPages || 1}
              </span>
              <button
                onClick={() =>
                  setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
                }
                disabled={pagination.page === totalPages || isFetching}
                className="text-[12px] px-3 py-1.5 rounded-lg text-[#717171] hover:bg-[#F7F7F7] dark:hover:bg-[#222] hover:text-[#111] dark:hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}

      {isForm && (
        <ListingForm
          listing={editingListing}
          onClose={() => {
            setIsForm(false);
            setEditingListing(null);
          }}
          onSuccess={handleFormSuccess}
        />
      )}

      {isViewOpen && (
        <ListingView
          listing={viewListing}
          isOpen={isViewOpen}
          onClose={() => {
            setIsViewOpen(false);
            setViewListing(null);
          }}
        />
      )}
    </div>
  );
}
