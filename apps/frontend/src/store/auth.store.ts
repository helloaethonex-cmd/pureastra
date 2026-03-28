import { create } from "zustand";
import type { Session, User } from "@/lib/auth-client";

type SessionData = {
  user: User;
  session: Session["session"];
};

interface AuthState {
  user: User | null;
  session: Session["session"] | null;
  isLoading: boolean;
  setSession: (data: SessionData) => void;
  clearSession: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  isLoading: true,
  setSession: (data: SessionData) =>
    set({ session: data.session, user: data.user, isLoading: false }),
  clearSession: () =>
    set({ session: null, user: null, isLoading: false }),
  setLoading: (loading) => set({ isLoading: loading }),
}));
