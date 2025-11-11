'use client';

/**
 * Hydration Provider - Manual hydration for Zustand persist
 * Ensures proper SSR hydration for auth store
 */

import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore.base';

export function HydrationProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Manually trigger hydration on client mount
    useAuthStore.persist.rehydrate();
  }, []);

  return <>{children}</>;
}
