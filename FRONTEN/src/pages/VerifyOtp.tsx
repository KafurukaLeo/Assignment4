import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import axios from "axios";
import { Mail, ShieldCheck } from "lucide-react";
import { api } from "../lib/api";

export default function VerifyOtp() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const getErrorMessage = (error: unknown, fallback: string) =>
    axios.isAxiosError<{ message?: string }>(error)
      ? error.response?.data?.message || fallback
      : fallback;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await api.post("/auth/verify-otp", { email, otp });
      toast.success("OTP verified");
      navigate(
        `/reset-password?token=${encodeURIComponent(response.data.resetToken)}`,
      );
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Invalid OTP"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4 py-10 dark:bg-[#0f1117]">
      <div className="w-full max-w-[420px]">
        <Link
          to="/"
          className="inline-flex text-2xl font-bold text-gray-950 dark:text-white"
        >
          Air<span className="text-(--color-primary)">b</span>nb
        </Link>

        <div className="mt-10">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-(--color-primary)/10 text-(--color-primary)">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <p className="mt-6 text-[12px] font-semibold uppercase tracking-widest text-gray-400">
            Verify OTP
          </p>
          <h1
            style={{ fontFamily: "'Playfair Display', serif" }}
            className="mt-2 text-3xl font-semibold text-gray-950 dark:text-white"
          >
            Check your email
          </h1>
          <p className="mt-3 text-[14px] leading-6 text-gray-500 dark:text-gray-400">
            Enter the code sent to your email to continue.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <AuthField label="Email" icon={<Mail className="h-4 w-4" />}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-transparent text-[14px] text-gray-950 outline-none placeholder:text-gray-300 dark:text-white"
              placeholder="you@example.com"
              required
            />
          </AuthField>
          <AuthField
            label="OTP code"
            icon={<ShieldCheck className="h-4 w-4" />}
          >
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full bg-transparent text-[14px] text-gray-950 outline-none placeholder:text-gray-300 dark:text-white"
              placeholder="6 digit code"
              required
            />
          </AuthField>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-xl bg-(--color-primary) px-5 py-3.5 text-[14px] font-semibold text-white transition-colors hover:bg-(--color-primary-dark) disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "Verifying..." : "Verify OTP"}
          </button>
        </form>

        <p className="mt-6 text-center text-[14px] text-gray-500 dark:text-gray-400">
          Need a new code?{" "}
          <Link
            to="/forgot-password"
            className="font-semibold text-(--color-primary) hover:underline"
          >
            Send again
          </Link>
        </p>
      </div>
    </div>
  );
}

function AuthField({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[12px] font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
        {label}
      </span>
      <span className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-400 transition-colors focus-within:border-(--color-primary) dark:border-white/[0.08] dark:bg-white/[0.04]">
        {icon}
        {children}
      </span>
    </label>
  );
}
