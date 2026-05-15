import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import axios from "axios";
import { useAuthStore } from "../store/auth.store";
import Logo from "../components/layout/Logo";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get("redirect");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const data = await login(email, password);
      toast.success("Login successful");

      const { user } = data;

      if (redirect) {
        navigate(redirect);
      } else if (user.role === "admin") {
        navigate("/admin");
      } else if (user.role === "host") {
        navigate("/dashboard");
      } else {
        navigate("/");
      }
    } catch (error: unknown) {
      const message = axios.isAxiosError<{ message?: string; error?: string }>(error)
        ? error.response?.data?.message || error.response?.data?.error
        : error instanceof Error
          ? error.message
          : "Login failed";
      toast.error(message || "Login failed");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4 py-10 dark:bg-[#0f1117]">
      <div className="w-full max-w-[420px]">
        <Logo />


        <div className="mt-10">
          <p className="text-[12px] font-semibold uppercase tracking-widest text-gray-400">
            Sign in
          </p>
          <h1
            style={{ fontFamily: "'Playfair Display', serif" }}
            className="mt-2 text-3xl font-semibold text-gray-950 dark:text-white"
          >
            Welcome back
          </h1>
          <p className="mt-3 text-[14px] leading-6 text-gray-500 dark:text-gray-400">
            Sign in to manage bookings, saved homes, and your account.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <label className="block">
            <span className="mb-2 block text-[12px] font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
              Email
            </span>
            <span className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 transition-colors focus-within:border-(--color-primary) dark:border-white/[0.08] dark:bg-white/[0.04]">
              <Mail className="h-4 w-4 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-transparent text-[14px] text-gray-950 outline-none placeholder:text-gray-300 dark:text-white"
                placeholder="you@example.com"
              />
            </span>
          </label>

          <label className="block">
            <span className="mb-2 block text-[12px] font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
              Password
            </span>
            <span className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 transition-colors focus-within:border-(--color-primary) dark:border-white/[0.08] dark:bg-white/[0.04]">
              <Lock className="h-4 w-4 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-transparent text-[14px] text-gray-950 outline-none placeholder:text-gray-300 dark:text-white"
                placeholder="Your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="text-gray-400 transition-colors hover:text-gray-700 dark:hover:text-white"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </span>
          </label>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-xl bg-(--color-primary) px-5 py-3.5 text-[14px] font-semibold text-white transition-colors hover:bg-(--color-primary-dark) disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="mt-4 text-center">
          <Link
            to="/forgot-password"
            className="text-[13px] font-semibold text-(--color-primary) hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        <p className="mt-6 text-center text-[14px] text-gray-500 dark:text-gray-400">
          New to Airbnb?{" "}
          <Link
            to="/register"
            className="font-semibold text-(--color-primary) hover:underline"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
