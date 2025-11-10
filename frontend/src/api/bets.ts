/**
 * Bets API - Методы работы со ставками
 */

import apiClient from './client';
import type { PlaceBetRequest, UserBet, BetsResponse, BetStats } from '@/types';

export const betsApi = {
  /**
   * Размещение ставки
   */
  placeBet: async (data: PlaceBetRequest): Promise<{ success: boolean; message: string; bet: UserBet }> => {
    const response = await apiClient.post('/bets/place', data);
    return response.data;
  },

  /**
   * Получение ставок текущего пользователя
   */
  getMyBets: async (
    status?: 'active' | 'settled' | 'won' | 'lost',
    limit = 50,
    offset = 0
  ): Promise<BetsResponse> => {
    const response = await apiClient.get<BetsResponse>('/bets/my', {
      params: { status, limit, offset },
    });
    return response.data;
  },

  /**
   * Получение активных ставок
   */
  getActiveBets: async (): Promise<BetsResponse> => {
    const response = await apiClient.get<BetsResponse>('/bets/my', {
      params: { status: 'active' },
    });
    return response.data;
  },

  /**
   * Получение завершенных ставок
   */
  getSettledBets: async (limit = 50, offset = 0): Promise<BetsResponse> => {
    const response = await apiClient.get<BetsResponse>('/bets/my', {
      params: { status: 'settled', limit, offset },
    });
    return response.data;
  },

  /**
   * Получение выигрышных ставок
   */
  getWonBets: async (limit = 50): Promise<BetsResponse> => {
    const response = await apiClient.get<BetsResponse>('/bets/my', {
      params: { status: 'won', limit },
    });
    return response.data;
  },

  /**
   * Получение проигрышных ставок
   */
  getLostBets: async (limit = 50): Promise<BetsResponse> => {
    const response = await apiClient.get<BetsResponse>('/bets/my', {
      params: { status: 'lost', limit },
    });
    return response.data;
  },

  /**
   * Получение одной ставки по ID
   */
  getBetById: async (id: string): Promise<{ success: boolean; bet: UserBet }> => {
    const response = await apiClient.get(`/bets/${id}`);
    return response.data;
  },

  /**
   * Получение статистики ставок пользователя
   */
  getBetStats: async (): Promise<{ success: boolean; stats: BetStats }> => {
    const response = await apiClient.get('/bets/stats');
    return response.data;
  },
};

export default betsApi;
