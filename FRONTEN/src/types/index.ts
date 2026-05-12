export interface Listing {
  id: string;
  title: string;
  description: string;
  location: string;
  pricePerNight: number;
  guests: number;
  type: ListingType;
  amenities: string[];
  photos: string[];
  rating?: number;
  hostId: string;
  host: UserProps;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProps {
  id: string;
  email?: string | null;
  name: string | null;
  avatar?: string | null;
  phone?: string | null;
}

export interface CategoryProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  value: number;
}

export type ListingType = "apartment" | "house" | "villa" | "cabin";

export type AIFilters = {
  location: string | null;
  type: ListingType | null;
  minPrice: number | null;
  maxPrice: number | null;
  guests: number | null;
};

export type AISearchResponse = {
  filters: AIFilters;
  data: Listing[];
  message?: string;
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};
