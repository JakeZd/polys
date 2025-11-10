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
  _hasHydrated: boolean;

  // Actions
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  login: (token: string, user: Partial<User> & { id: string; wallet: string; points: number }) => void;
  logout: () => void;
  updatePoints: (points: number) => void;
  updateUser: (updates: Partial<User>) => void;
  setHasHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      token: null,
      isAuthenticated: false,
      _hasHydrated: false,

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

      // Set hydration state
      setHasHydrated: (state) => {
        set({
          _hasHydrated: state,
        });
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
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

// Selectors with SSR safety - use client-side only with hydration check
export const useUser = () => {
  const [hydrated, setHydrated] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Wait for hydration
    const checkHydration = () => {
      try {
        const state = useAuthStore.getState();
        if (state && state._hasHydrated) {
          setHydrated(true);
          setUser(state.user);

          // Subscribe to changes
          const unsubscribe = useAuthStore.subscribe((newState) => {
            setUser(newState.user);
          });

          return unsubscribe;
        }
      } catch (error) {
        console.error('Error in useUser hydration:', error);
      }
    };

    const timer = setTimeout(checkHydration, 0);
    return () => clearTimeout(timer);
  }, []);

  if (typeof window === 'undefined' || !hydrated) return null;
  return user;
};

export const useToken = () => {
  const [hydrated, setHydrated] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const checkHydration = () => {
      try {
        const state = useAuthStore.getState();
        if (state && state._hasHydrated) {
          setHydrated(true);
          setToken(state.token);

          const unsubscribe = useAuthStore.subscribe((newState) => {
            setToken(newState.token);
          });

          return unsubscribe;
        }
      } catch (error) {
        console.error('Error in useToken hydration:', error);
      }
    };

    const timer = setTimeout(checkHydration, 0);
    return () => clearTimeout(timer);
  }, []);

  if (typeof window === 'undefined' || !hydrated) return null;
  return token;
};

export const useIsAuthenticated = () => {
  const [hydrated, setHydrated] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkHydration = () => {
      try {
        const state = useAuthStore.getState();
        if (state && state._hasHydrated) {
          setHydrated(true);
          setIsAuthenticated(state.isAuthenticated);

          const unsubscribe = useAuthStore.subscribe((newState) => {
            setIsAuthenticated(newState.isAuthenticated);
          });

          return unsubscribe;
        }
      } catch (error) {
        console.error('Error in useIsAuthenticated hydration:', error);
      }
    };

    const timer = setTimeout(checkHydration, 0);
    return () => clearTimeout(timer);
  }, []);

  if (typeof window === 'undefined' || !hydrated) return false;
  return isAuthenticated;
};

export const useUserPoints = () => {
  const [hydrated, setHydrated] = useState(false);
  const [points, setPoints] = useState(0);

  useEffect(() => {
    const checkHydration = () => {
      try {
        const state = useAuthStore.getState();
        if (state && state._hasHydrated) {
          setHydrated(true);
          setPoints(state.user?.points ?? 0);

          const unsubscribe = useAuthStore.subscribe((newState) => {
            setPoints(newState.user?.points ?? 0);
          });

          return unsubscribe;
        }
      } catch (error) {
        console.error('Error in useUserPoints hydration:', error);
      }
    };

    const timer = setTimeout(checkHydration, 0);
    return () => clearTimeout(timer);
  }, []);

  if (typeof window === 'undefined' || !hydrated) return 0;
  return points;
};

export default useAuthStore;
