import { ArrowLeft, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-[75vh] items-center justify-center px-4 text-center">
      <div className="max-w-md">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-(--color-primary)/10 text-(--color-primary)">
          <Home className="h-7 w-7" />
        </div>
        <h1
          style={{ fontFamily: "'Playfair Display', serif" }}
          className="mt-6 text-7xl font-semibold tracking-tight text-gray-950 dark:text-white"
        >
          404
        </h1>
        <h2 className="mt-4 text-xl font-semibold text-gray-950 dark:text-white">
          Page not found
        </h2>
        <p className="mt-2 text-[14px] leading-6 text-gray-500 dark:text-gray-400">
          This page does not exist or has been moved.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-5 py-3 text-[13px] font-semibold text-gray-700 transition-colors hover:border-(--color-primary) hover:text-(--color-primary) dark:border-white/[0.08] dark:text-gray-300"
          >
            <ArrowLeft className="h-4 w-4" />
            Go back
          </button>
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-(--color-primary) px-5 py-3 text-[13px] font-semibold text-white transition-colors hover:bg-(--color-primary-dark)"
          >
            <Home className="h-4 w-4" />
            Home
          </button>
        </div>
      </div>
    </div>
  );
}
