import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { api } from "../lib/api";
import { toast } from "sonner";
import { Building2, CheckCircle2, ChevronRight, ShieldCheck, Star } from "lucide-react";
import { useAuthStore } from "../store/auth.store";

export default function BecomeHost() {
  const navigate = useNavigate();
  const { user, fetchUser } = useAuthStore();
  const mutation = useMutation({
    mutationFn: async () => {
      const res = await api.post("/users/become-host");
      return res.data;
    },
    onSuccess: async () => {
      await fetchUser();
      toast.success("Application submitted successfully!");
      navigate("/dashboard");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to submit application");
    }
  });

  if (user?.role === "host") {
    return (
       <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
         <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center text-emerald-500 mb-6">
           <ShieldCheck className="w-8 h-8" />
         </div>
         <h1 className="text-2xl font-bold mb-2">You're already a host!</h1>
         <p className="text-[#717171] mb-8">Go to your dashboard to manage your listings.</p>
         <button onClick={() => navigate("/dashboard")} className="px-6 py-3 bg-[#111] dark:bg-white text-white dark:text-[#111] rounded-xl font-bold">
           Go to Dashboard
         </button>
       </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', serif" }} className="text-4xl lg:text-5xl font-bold leading-tight mb-6">
            Open your door to hosting
          </h1>
          <p className="text-lg text-[#717171] mb-8">
            Join a community of millions of hosts on Airbnb. We'll help you get started with tools, tips, and support.
          </p>

          <div className="space-y-6 mb-10">
             {[
               { title: "One-to-one guidance", desc: "We'll match you with a Superhost in your area.", icon: Star },
               { title: "An experienced guest for your first booking", desc: "For your first booking, you can choose to welcome an experienced guest.", icon: CheckCircle2 },
               { title: "Specialized support from Airbnb", desc: "New hosts get one-tap access to specially trained Community Support agents.", icon: ShieldCheck }
             ].map((item, i) => (
               <div key={i} className="flex gap-4">
                 <div className="shrink-0 w-6 h-6 text-(--color-primary)">
                   <item.icon className="w-full h-full" />
                 </div>
                 <div>
                   <h3 className="font-semibold text-[15px]">{item.title}</h3>
                   <p className="text-[14px] text-[#717171]">{item.desc}</p>
                 </div>
               </div>
             ))}
          </div>

          <button 
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="w-full sm:w-auto px-8 py-4 bg-(--color-primary) text-white font-bold rounded-xl shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            {mutation.isPending ? "Submitting..." : "Apply Now"}
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="relative">
          <div className="aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl">
             <img 
               src="https://images.unsplash.com/photo-1556912177-f502092672a5?auto=format&fit=crop&q=80&w=1000" 
               className="w-full h-full object-cover" 
               alt="Hosting"
             />
          </div>
          <div className="absolute -bottom-6 -left-6 bg-white dark:bg-[#1A1A1A] p-6 rounded-2xl shadow-xl border border-gray-100 dark:border-white/[0.05] max-w-[240px]">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                <Building2 className="w-5 h-5" />
              </div>
              <p className="text-[14px] font-bold">Host Guarantee</p>
            </div>
            <p className="text-[12px] text-[#717171]">Up to $1M in damage protection and liability insurance for every host.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
