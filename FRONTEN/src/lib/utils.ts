import { API_BASE_URL } from "./api";

export function getImageUrl(path: string | undefined | null) {
  if (!path) return "/image/hero-background.jpg";
  if (path.startsWith("http")) return path;
  if (path.startsWith("data:")) return path;
  if (path.startsWith("/")) return path;
  
  // Assuming relative paths are from the backend uploads
  return `${API_BASE_URL}/${path}`;
}

export function formatPrice(price: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price);
}
