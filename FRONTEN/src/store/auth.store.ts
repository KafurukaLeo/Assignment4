import { create } from "zustand";
import { api } from "../lib/api";

export type User = {
  id: string;
  name: string;
  email: string;
  username: string;
  phone?: string;
  role: string;
  hostStatus?: "pending" | "approved" | "restricted";
  avatar?: string;
  bio?: string;
  createdAt?: string;
};

type AuthState = {
  user: User | null;
  loading: boolean;
  fetchUser: () => Promise<void>;
  login: (email: string, password: string) => Promise<{ token: string; user: User }>;
  logout: () => Promise<void>;
  register: (
    name: string,
    username: string,
    email: string,
    password: string,
    role?: "guest" | "host" | "admin",
  ) => Promise<{ token: string; user: User }>;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  fetchUser: async () => {
    set({ loading: true });
    try {
      const res = await api.get("/auth/me");
      // res.data is the user object directly from our backend
      set({ user: res.data, loading: false });
    } catch {
      localStorage.removeItem("token");
      set({ user: null, loading: false });
    }
  },
  register: async (name, username, email, password, role = "guest") => {
    const { fetchUser } = useAuthStore.getState();
    const res = await api.post("/auth/register", { name, username, email, password, role });
    if (res.data.token) {
      localStorage.setItem("token", res.data.token);
      await fetchUser();
    }
    return res.data;
  },
  logout: async () => {
    localStorage.removeItem("token");
    set({ user: null });
  },
  login: async (email, password) => {
    const { fetchUser } = useAuthStore.getState();
    const res = await api.post("/auth/login", { email, password });
    if (res.data.token) {
      localStorage.setItem("token", res.data.token);
      await fetchUser();
    }
    return res.data;
  },
}));
