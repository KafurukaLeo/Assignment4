import {
  CalendarCheck,
  Home,
  LayoutDashboard,
  Building2,
  Building,
  TreePine,
  MessageCircle,
  ShieldCheck,
  UserCog,
  Grid,
} from "lucide-react";
import type { CategoryProps } from "../types";

export const DashboardLinks = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Booking",
    url: "/dashboard/bookings",
    badge: null,
    icon: CalendarCheck,
  },
  { title: "Listing", url: "/dashboard/listings", badge: null, icon: Home },
  {
    title: "Messages",
    url: "/messages",
    badge: null,
    icon: MessageCircle,
  },
];

export const AdminLinks = [
  {
    title: "Dashboard",
    url: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Host approvals",
    url: "/admin/approvals",
    icon: ShieldCheck,
  },
  {
    title: "User management",
    url: "/admin/users",
    icon: UserCog,
  },
];

export const Categories: CategoryProps[] = [
  {
    icon: Grid,
    title: "All",
    value: 0,
  },
  {
    icon: Building2,
    title: "Villa",
    value: 3,
  },
  {
    icon: Building,
    title: "Apartment",
    value: 5,
  },
  {
    icon: Home,
    title: "House",
    value: 2,
  },
  {
    icon: TreePine,
    title: "Cabin",
    value: 4,
  },
];

export const searchLocation = [
  "Kigali, Rwanda",
  "Nairobi, Kenya",
  "Kampala, Uganda",
  "Dar es Salaam, TZ",
  "Addis Ababa, ET",
];

export const searchPriceRange = [
  "Under $25",
  "$25 – $50",
  "$50 – $100",
  "$100+",
];

export const bookingHeader = [
  "Check-in",
  "Check-out",
  "Guest",
  "Listing",
  "total price",
  "status",
];

export const listingHeader = [
  "Title",
  "Location",
  "Price per night",
  "guests",
  "type",
  "Actions",
];

export const AMENITIES = [
  { key: "wifi", label: "WiFi" },
  { key: "parking", label: "Parking" },
  { key: "kitchen", label: "Kitchen" },
  { key: "ac", label: "Air Conditioning" },
  { key: "pool", label: "Pool" },
  { key: "gym", label: "Gym" },
];
