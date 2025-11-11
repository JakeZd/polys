'use client';

/**
 * Auth Store - Main export file
 * Ре-экспортирует всё для обратной совместимости
 */

// Re-export base store
export { useAuthStore } from './authStore.base';

// Re-export client hooks
export { useUser, useToken, useIsAuthenticated, useUserPoints, useHasHydrated } from './authStore.hooks';

// Default export
export { default } from './authStore.base';
