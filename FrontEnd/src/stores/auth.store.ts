import { create } from 'zustand';
import type { UserProfile } from '../shared/types/auth.types';

type AuthState = {
  accessToken: string | null;
  user: UserProfile | null;
  isInitializing: boolean;
  isAuthenticated: boolean;
  setAccessToken: (accessToken: string) => void;
  setUser: (user: UserProfile | null) => void;
  setInitializing: (isInitializing: boolean) => void;
  setSession: (accessToken: string, user: UserProfile) => void;
  reset: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  isInitializing: true,
  isAuthenticated: false,
  setAccessToken: (accessToken) => set({ accessToken, isAuthenticated: true }),
  setUser: (user) => set({ user }),
  setInitializing: (isInitializing) => set({ isInitializing }),
  setSession: (accessToken, user) =>
    set({ accessToken, user, isAuthenticated: true }),
  reset: () => set({ accessToken: null, user: null, isAuthenticated: false }),
}));
