import { useState } from "react";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";
import { Mail, User, Lock, AtSign, Home, Briefcase, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import axios from "axios";
import { useAuthStore } from "../store/auth.store";
import Logo from "../components/layout/Logo";

export default function Register() {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"guest" | "host" | "admin">("guest");
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await register(name, username, email, password, role);
      toast.success("Account has been created");
      setTimeout(() => {
        if (role === "host") navigate("/dashboard");
        else if (role === "admin") navigate("/admin");
        else navigate("/");
      }, 2000);
    } catch (error: unknown) {
      const message = axios.isAxiosError<{ message?: string; error?: string }>(error)
        ? error.response?.data?.message || error.response?.data?.error
        : error instanceof Error
          ? error.message
          : "Registration failed";
      toast.error(message || "Registration failed");
    } finally {
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
        className="relative z-10 w-full max-w-[520px]"
      >
        <div className="bg-white/80 backdrop-blur-xl p-7 md:p-12 rounded-[2.5rem] border border-white/40 premium-shadow-lg relative overflow-hidden group">
          {/* Decorative Glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-[var(--color-primary)]/10 blur-[80px] rounded-full" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-500/10 blur-[80px] rounded-full" />

          <div className="flex flex-col items-center text-center relative z-10">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Logo className="scale-125 mb-8" />
            </motion.div>
            
            <div className="space-y-3">
              <h1 className="font-heading text-4xl font-black text-gray-900 tracking-tight">
                Create account
              </h1>
              <p className="text-[15px] font-medium text-gray-600 max-w-[320px] mx-auto leading-relaxed">
                Join a global community of curious travelers and hosts.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-10 space-y-5 relative z-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <AuthInput
                icon={User}
                label="Full Name"
                value={name}
                onChange={setName}
                placeholder="John Doe"
              />
              <AuthInput
                icon={AtSign}
                label="Username"
                value={username}
                onChange={setUsername}
                placeholder="johndoe"
              />
            </div>

            <AuthInput
              icon={Mail}
              label="Email Address"
              value={email}
              onChange={setEmail}
              type="email"
              placeholder="name@example.com"
            />
            
            <AuthInput
              icon={Lock}
              label="Secret Password"
              value={password}
              onChange={setPassword}
              type="password"
              placeholder="••••••••"
            />

            <div className="space-y-3">
              <span className="text-[11px] font-black uppercase tracking-[0.15em] text-gray-500 ml-1">
                I am signing up as a
              </span>
              <div className="grid grid-cols-2 gap-3 p-1.5 bg-black/[0.03] border border-gray-200 rounded-[1.25rem]">
                {[
                  { value: "guest", label: "Guest", icon: Briefcase },
                  { value: "host", label: "Host", icon: Home },
                ].map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRole(value as any)}
                    className={`flex items-center justify-center gap-2.5 rounded-xl py-3.5 text-[14px] font-bold transition-all duration-300 ${
                      role === value
                        ? "bg-[var(--color-primary)] text-white shadow-lg premium-shadow"
                        : "text-gray-500 hover:text-gray-900 hover:bg-black/5"
                    }`}
                  >
                    <Icon size={16} />
                    {label}
                  </button>
                ))}
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
                  <span>Creating account...</span>
                </>
              ) : (
                <>
                  <span>Join the community</span>
                  <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                </>
              )}
            </motion.button>
          </form>

          <div className="mt-10 flex flex-col items-center gap-4 relative z-10">
            <p className="text-[14px] font-medium text-gray-500">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-black text-[var(--color-primary)] hover:text-gray-900 transition-all underline-offset-4 hover:underline"
              >
                Sign in
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
          Join the community • © {new Date().getFullYear()}
        </motion.p>
      </motion.div>
    </div>
  );
}

function AuthInput({
  icon: Icon,
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  icon: React.ComponentType<{ className?: string; size?: number }>;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder: string;
}) {
  return (
    <div className="space-y-2.5 w-full">
      <label className="text-[11px] font-black uppercase tracking-[0.15em] text-gray-500 ml-1">
        {label}
      </label>
      <div className="relative group/field">
        <Icon className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within/field:text-[var(--color-primary)] transition-all duration-300" />
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
          className="w-full h-15 pl-14 pr-5 bg-black/[0.03] hover:bg-black/[0.05] border border-gray-200 rounded-[1.25rem] text-[15px] text-gray-900 outline-none focus:border-[var(--color-primary)]/50 focus:bg-white focus:ring-4 focus:ring-[var(--color-primary)]/10 transition-all duration-300 placeholder:text-gray-400"
          placeholder={placeholder}
        />
      </div>
    </div>
  );
}

