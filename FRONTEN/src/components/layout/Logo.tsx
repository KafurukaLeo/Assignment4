import { Compass } from "lucide-react";
import { Link } from "react-router-dom";

interface LogoProps {
  className?: string;
  showText?: boolean;
}

export default function Logo({ className = "", showText = true }: LogoProps) {
  return (
    <Link
      to="/"
      className={`group flex items-center gap-2.5 shrink-0 ${className}`}
      aria-label="Home"
    >
      <div className="relative w-9 h-9 rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark,#c0392b)] flex items-center justify-center shadow-md shadow-[var(--color-primary)]/30 group-hover:scale-105 group-hover:shadow-lg group-hover:shadow-[var(--color-primary)]/40 transition-all duration-300">
        <Compass className="w-4.5 h-4.5 text-white" strokeWidth={2.2} />
      </div>
      {showText && (
        <span className="text-[16px] font-bold tracking-tight text-gray-900 dark:text-white">
          air<span className="text-[var(--color-primary)]">bnb</span>
        </span>
      )}
    </Link>
  );
}
