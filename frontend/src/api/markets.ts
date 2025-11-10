/**
 * Markets API - Методы работы с рынками
 */

import apiClient from './client';
import type {
  Market,
  MarketFilters,
  MarketsResponse,
  CategoriesResponse,
  PriceSnapshot,
  ChartPeriod,
} from '@/types';

export const marketsApi = {
  /**
   * Получение списка рынков с фильтрами
   */
  getMarkets: async (filters?: MarketFilters): Promise<MarketsResponse> => {
    const response = await apiClient.get<MarketsResponse>('/markets', {
      params: filters,
    });
    return response.data;
  },

  /**
   * Получение одного рынка по ID
   */
  getMarketById: async (id: string): Promise<{ success: boolean; market: Market }> => {
    const response = await apiClient.get(`/markets/${id}`);
    return response.data;
  },

  /**
   * Получение истории цен для графика
   */
  getMarketPrices: async (
    id: string,
    period: ChartPeriod = '24h'
  ): Promise<{ success: boolean; prices: PriceSnapshot[] }> => {
    const response = await apiClient.get(`/markets/${id}/prices`, {
      params: { period },
    });
    return response.data;
  },

  /**
   * Получение категорий с количеством рынков
   */
  getCategories: async (): Promise<CategoriesResponse> => {
    const response = await apiClient.get<CategoriesResponse>('/markets/categories');
    return response.data;
  },

  /**
   * Поиск рынков
   */
  searchMarkets: async (query: string, limit = 20): Promise<MarketsResponse> => {
    const response = await apiClient.get<MarketsResponse>('/markets', {
      params: { search: query, limit },
    });
    return response.data;
  },

  /**
   * Получение рынков по категории
   */
  getMarketsByCategory: async (
    category: string,
    limit = 50,
    offset = 0
  ): Promise<MarketsResponse> => {
    const response = await apiClient.get<MarketsResponse>('/markets', {
      params: { category, limit, offset },
    });
    return response.data;
  },

  /**
   * Получение активных рынков
   */
  getActiveMarkets: async (limit = 50): Promise<MarketsResponse> => {
    const response = await apiClient.get<MarketsResponse>('/markets', {
      params: { resolved: false, limit },
    });
    return response.data;
  },

  /**
   * Получение завершенных рынков
   */
  getResolvedMarkets: async (limit = 50, offset = 0): Promise<MarketsResponse> => {
    const response = await apiClient.get<MarketsResponse>('/markets', {
      params: { resolved: true, limit, offset },
    });
    return response.data;
  },
};

export default marketsApi;
