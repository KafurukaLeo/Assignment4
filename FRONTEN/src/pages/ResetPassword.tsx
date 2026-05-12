import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import axios from "axios";
import { CheckCircle2, Lock } from "lucide-react";
import { api } from "../lib/api";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState(searchParams.get("token") || "");
  const [newPassword, setNewPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const getErrorMessage = (error: unknown, fallback: string) =>
    axios.isAxiosError<{ message?: string }>(error)
      ? error.response?.data?.message || fallback
      : fallback;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setIsLoading(true);
    try {
      await api.post("/auth/reset-password", { token, newPassword });
      toast.success("Password reset successfully");
      navigate("/login");
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to reset password"));
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
            <CheckCircle2 className="h-5 w-5" />
          </span>
          <p className="mt-6 text-[12px] font-semibold uppercase tracking-widest text-gray-400">
            Reset password
          </p>
          <h1
            style={{ fontFamily: "'Playfair Display', serif" }}
            className="mt-2 text-3xl font-semibold text-gray-950 dark:text-white"
          >
            Create new password
          </h1>
          <p className="mt-3 text-[14px] leading-6 text-gray-500 dark:text-gray-400">
            Choose a new password for your account.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          {!searchParams.get("token") && (
            <AuthField label="Reset token" icon={<Lock className="h-4 w-4" />}>
              <input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="w-full bg-transparent text-[14px] text-gray-950 outline-none placeholder:text-gray-300 dark:text-white"
                placeholder="Reset token"
                required
              />
            </AuthField>
          )}
          <AuthField label="New password" icon={<Lock className="h-4 w-4" />}>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-transparent text-[14px] text-gray-950 outline-none placeholder:text-gray-300 dark:text-white"
              placeholder="New password"
              required
            />
          </AuthField>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-xl bg-(--color-primary) px-5 py-3.5 text-[14px] font-semibold text-white transition-colors hover:bg-(--color-primary-dark) disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "Resetting..." : "Reset password"}
          </button>
        </form>

        <p className="mt-6 text-center text-[14px] text-gray-500 dark:text-gray-400">
          Remember your password?{" "}
          <Link
            to="/login"
            className="font-semibold text-(--color-primary) hover:underline"
          >
            Sign in
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
