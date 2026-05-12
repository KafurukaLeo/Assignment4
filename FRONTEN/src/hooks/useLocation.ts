import { useEffect, useState } from "react";

export function useLocation() {
  const [location, setLocation] = useState("Kigali");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;

          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
          );

          const data = await res.json();

          const city =
            data.address?.city ||
            data.address?.town ||
            data.address?.village ||
            "your area";

          setLocation(city);
        } catch (err: unknown) {
          if (err instanceof Error) {
            setError(err.message);
          } else {
            setError("Failed to fetch location");
          }
        } finally {
          setLoading(false);
        }
      },
      () => {
        setError("Permission denied");
        setLoading(false);
      },
    );
  }, []);

  return { location, loading, error };
}
