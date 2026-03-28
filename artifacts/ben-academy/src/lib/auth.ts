import { create } from "zustand";

interface AuthState {
  token: string | null;
  setToken: (token: string) => void;
  clearToken: () => void;
  isAuthenticated: boolean;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem("ben_academy_token"),
  isAuthenticated: !!localStorage.getItem("ben_academy_token"),
  setToken: (token: string) => {
    localStorage.setItem("ben_academy_token", token);
    set({ token, isAuthenticated: true });
  },
  clearToken: () => {
    localStorage.removeItem("ben_academy_token");
    set({ token: null, isAuthenticated: false });
  },
}));
