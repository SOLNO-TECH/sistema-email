import { create } from "zustand";
import { apiClient, type User } from "@/lib/api";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email: string, password: string) => {
    try {
      const response = await apiClient.login({ email, password });
      console.log("🔍 Auth Store - Login response:", response);
      console.log("🔍 Auth Store - Login user.role:", response.user?.role);
      if (typeof window !== "undefined") {
        localStorage.setItem("token", response.token);
      }
      // Normalizar el role a minúsculas
      const userWithRole = {
        ...response.user,
        role: (response.user?.role || "user").toLowerCase(),
      };
      console.log("🔍 Auth Store - Login userWithRole.role:", userWithRole.role);
      set({
        user: userWithRole,
        token: response.token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (name: string, email: string, password: string) => {
    try {
      const response = await apiClient.register({ name, email, password });
      if (typeof window !== "undefined") {
        localStorage.setItem("token", response.token);
      }
      set({
        user: response.user,
        token: response.token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
    }
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  checkAuth: async () => {
    try {
      if (typeof window === "undefined") {
        set({ isLoading: false, isAuthenticated: false });
        return;
      }

      const token = localStorage.getItem("token");
      if (!token) {
        set({ isLoading: false, isAuthenticated: false });
        return;
      }

      const response = await apiClient.getMe();
      console.log("🔍 Auth Store - getMe response:", JSON.stringify(response, null, 2));
      console.log("🔍 Auth Store - response.user:", response.user);
      console.log("🔍 Auth Store - response.user.role:", response.user?.role);
      console.log("🔍 Auth Store - typeof response.user.role:", typeof response.user?.role);
      
      // Asegurarse de que el role esté presente y normalizado a minúsculas
      const userRole = (response.user?.role || "user").toLowerCase();
      const userWithRole = {
        ...response.user,
        role: userRole,
      };
      console.log("🔍 Auth Store - userWithRole:", userWithRole);
      console.log("🔍 Auth Store - userWithRole.role:", userWithRole.role);
      console.log("🔍 Auth Store - userWithRole.role === 'admin':", userWithRole.role === "admin");
      
      set({
        user: userWithRole,
        token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
      }
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  setUser: (user: User) => {
    set({ user });
  },
}));

