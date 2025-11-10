/**
 * Auth Store - Zustand
 * Управление состоянием авторизации
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { setAuthToken } from '@/api';
import type { User } from '@/types';
import { useEffect, useState } from 'react';

interface AuthState {
  // State
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;

  // Actions
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  login: (token: string, user: Partial<User> & { id: string; wallet: string; points: number }) => void;
  logout: () => void;
  updatePoints: (points: number) => void;
  updateUser: (updates: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      token: null,
      isAuthenticated: false,

      // Set user
      setUser: (user) =>
        set({
          user,
          isAuthenticated: true,
        }),

      // Set token
      setToken: (token) => {
        setAuthToken(token);
        set({ token, isAuthenticated: true });
      },

      // Login
      login: (token, user) => {
        setAuthToken(token);
        // Fill in missing fields with defaults
        const fullUser: User = {
          id: user.id,
          wallet: user.wallet,
          points: user.points,
          createdAt: user.createdAt || new Date().toISOString(),
          lastCheckin: user.lastCheckin || null,
          streakDays: user.streakDays || 0,
          stats: user.stats,
        };
        set({
          token,
          user: fullUser,
          isAuthenticated: true,
        });
      },

      // Logout
      logout: () => {
        setAuthToken(null);
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },

      // Update points
      updatePoints: (points) => {
        const user = get().user;
        if (user) {
          set({
            user: { ...user, points },
          });
        }
      },

      // Update user
      updateUser: (updates) => {
        const user = get().user;
        if (user) {
          set({
            user: { ...user, ...updates },
          });
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Hook to check if store is hydrated (fixes SSR issues)
const useHydration = () => {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  return hydrated;
};

// Selectors with SSR safety (для оптимизации)
export const useUser = () => {
  const hydrated = useHydration();
  const user = useAuthStore((state) => state.user);
  return hydrated ? user : null;
};

export const useToken = () => {
  const hydrated = useHydration();
  const token = useAuthStore((state) => state.token);
  return hydrated ? token : null;
};

export const useIsAuthenticated = () => {
  const hydrated = useHydration();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return hydrated ? isAuthenticated : false;
};

export const useUserPoints = () => {
  const hydrated = useHydration();
  const points = useAuthStore((state) => state.user?.points ?? 0);
  return hydrated ? points : 0;
};

export default useAuthStore;
