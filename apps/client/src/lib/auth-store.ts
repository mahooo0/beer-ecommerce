"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthUser {
  email: string;
  name?: string;
}

interface AuthState {
  user: AuthUser | null;
  signIn: (email: string, name?: string) => void;
  signOut: () => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      signIn: (email, name) => set({ user: { email, name } }),
      signOut: () => set({ user: null }),
    }),
    { name: "taranka-auth" }
  )
);
