import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Eye, EyeOff, Lock, Mail, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
    if (isLoading) return;
    setIsLoading(true);

    try {
      const data = await login(email.trim(), password);
      setIsLoading(false);
      toast.success("Login successful");

      const { user } = data;

      setTimeout(() => {
        if (redirect) {
          navigate(redirect);
        } else if (user.role === "admin") {
          navigate("/admin");
        } else if (user.role === "host") {
          navigate("/dashboard");
        } else {
          navigate("/");
        }
      }, 100);
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
    <div className="relative min-h-screen flex items-center justify-center p-4 md:p-6 overflow-hidden bg-[#0a0a0b]">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src="/auth_bg.png" 
          alt="Background" 
          className="w-full h-full object-cover scale-105 blur-[3px]"
        />
        <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 w-full max-w-[460px]"
      >
        <div className="bg-white/80 backdrop-blur-xl p-7 md:p-12 rounded-[2.5rem] border border-white/40 premium-shadow-lg relative overflow-hidden group">
          {/* Decorative Gradient Glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-[var(--color-primary)]/10 blur-[80px] rounded-full" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-500/10 blur-[80px] rounded-full" />

          <div className="flex flex-col items-center text-center relative z-10">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Logo className="scale-[1.35] mb-10" />
            </motion.div>
            
            <div className="space-y-3">
              <h1 className="font-heading text-4xl font-black text-gray-900 tracking-tight">
                Welcome back
              </h1>
              <p className="text-[15px] font-medium text-gray-600 max-w-[280px] mx-auto leading-relaxed">
                Unlock unique stays and manage your experiences.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-12 space-y-6 relative z-10">
            <div className="space-y-2.5">
              <label className="text-[11px] font-black uppercase tracking-[0.15em] text-gray-500 ml-1">
                Email Address
              </label>
              <div className="relative group/field">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within/field:text-[var(--color-primary)] transition-all duration-300" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full h-15 pl-14 pr-5 bg-black/[0.03] hover:bg-black/[0.05] border border-gray-200 rounded-[1.25rem] text-[15px] text-gray-900 outline-none focus:border-[var(--color-primary)]/50 focus:bg-white focus:ring-4 focus:ring-[var(--color-primary)]/10 transition-all duration-300 placeholder:text-gray-400"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between px-1">
                <label className="text-[11px] font-black uppercase tracking-[0.15em] text-gray-500">
                  Password
                </label>
              </div>
              <div className="relative group/field">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within/field:text-[var(--color-primary)] transition-all duration-300" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full h-15 pl-14 pr-14 bg-black/[0.03] hover:bg-black/[0.05] border border-gray-200 rounded-[1.25rem] text-[15px] text-gray-900 outline-none focus:border-[var(--color-primary)]/50 focus:bg-white focus:ring-4 focus:ring-[var(--color-primary)]/10 transition-all duration-300 placeholder:text-gray-400"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-900 transition-all duration-300"
                >
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={showPassword ? "eye-off" : "eye"}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.15 }}
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </motion.div>
                  </AnimatePresence>
                </button>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className="group/btn relative w-full h-15 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-bold rounded-[1.25rem] mt-6 flex items-center justify-center gap-2.5 premium-shadow overflow-hidden transition-all duration-300 disabled:opacity-70"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:animate-shimmer" />
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-[3px] border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign in to account</span>
                  <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                </>
              )}
            </motion.button>

            <div className="flex justify-center">
              <Link
                to="/forgot-password"
                className="text-[13px] font-bold text-gray-400 hover:text-[var(--color-primary)] transition-colors"
              >
                Forgot your password?
              </Link>
            </div>
          </form>

          <div className="mt-8 flex flex-col items-center gap-4 relative z-10">
            <p className="text-[14px] font-medium text-gray-500">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="font-black text-[var(--color-primary)] hover:text-gray-900 transition-all underline-offset-4 hover:underline"
              >
                Join Airbnb
              </Link>
            </p>
          </div>
        </div>
        
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ delay: 1, duration: 1 }}
          className="mt-10 text-center text-[11px] font-bold text-white uppercase tracking-[0.3em] drop-shadow-md"
        >
          Premium Experience • © {new Date().getFullYear()}
        </motion.p>
      </motion.div>
    </div>
  );
}

