import { create } from "zustand";
import { api } from "../api/client";
import type { User } from "../types";

export interface AuthState {
  user: User | null;
  isAuthChecked: boolean;
  login: (loginStr: string, pass: string) => Promise<void>;
  register: (name: string, loginStr: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthChecked: false,

  checkAuth: async () => {
    try {
      const userData = await api.post<User>("/api/auth/checkAuth", {});
      if (userData.message !== "User not found") {
        set({ user: userData });
      } else {
        set({ user: null });
      }
    } catch {
      set({ user: null });
    } finally {
      set({ isAuthChecked: true });
    }
  },

  login: async (loginStr: string, pass: string) => {
    const res = await api.post<User>("/api/auth/login", {
      login: loginStr,
      password: pass,
    });
    set({ user: res });
  },

  register: async (name: string, loginStr: string, pass: string) => {
    await api.post<User>("/api/auth/register", {
      userName: name,
      login: loginStr,
      password: pass,
    });
    const res = await api.post<User>("/api/auth/login", {
      login: loginStr,
      password: pass,
    });
    set({ user: res });
  },

  logout: async () => {
    try {
      await api.post("/api/auth/logout", {});
    } finally {
      set({ user: null });
    }
  },
}));
