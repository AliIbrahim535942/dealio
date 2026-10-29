import { create } from 'zustand';

type AuthState = {
  isAuthenticated: boolean;
  setAuthenticated: (isAuthenticated: boolean) => void;
  reset: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
  reset: () => set({ isAuthenticated: false }),
}));
