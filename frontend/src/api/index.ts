/**
 * API Index - Экспорт всех API методов
 * 
 * Использование:
 * import { authApi, marketsApi, betsApi, pointsApi } from '@/api';
 */

export { default as apiClient, setAuthToken, getAuthToken, hasAuthToken, checkApiHealth, getApiError, withRetry } from './client';
export { default as authApi } from './auth';
export { default as marketsApi } from './markets';
export { default as betsApi } from './bets';
export { default as pointsApi } from './points';

// Re-export types
export type { ApiError } from './client';
