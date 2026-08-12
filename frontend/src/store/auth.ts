import { create } from "zustand";
import { User } from "@/types";
import { getToken, setToken, clearToken } from "@/services/api";

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: getToken(),
  setAuth: (user, token) => {
    setToken(token);
    set({ user, token });
  },
  setUser: (user) => set({ user }),
  logout: () => {
    clearToken();
    set({ user: null, token: null });
  },
  isAuthenticated: () => Boolean(get().token),
}));