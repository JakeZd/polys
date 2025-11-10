/**
 * Points API - Методы работы с системой поинтов
 */

import apiClient from './client';
import type {
  CheckinResult,
  PointsHistoryResponse,
  LeaderboardResponse,
  PointsTransactionType,
} from '@/types';

export const pointsApi = {
  /**
   * Ежедневный check-in
   */
  dailyCheckin: async (signature?: string, message?: string): Promise<CheckinResult> => {
    const response = await apiClient.post<CheckinResult>('/points/checkin', {
      signature,
      message,
    });
    return response.data;
  },

  /**
   * Получение истории поинтов
   */
  getPointsHistory: async (
    type?: PointsTransactionType,
    limit = 50,
    offset = 0
  ): Promise<PointsHistoryResponse> => {
    const response = await apiClient.get<PointsHistoryResponse>('/points/history', {
      params: { type, limit, offset },
    });
    return response.data;
  },

  /**
   * Получение таблицы лидеров
   */
  getLeaderboard: async (limit = 100): Promise<LeaderboardResponse> => {
    const response = await apiClient.get<LeaderboardResponse>('/points/leaderboard', {
      params: { limit },
    });
    return response.data;
  },

  /**
   * Получение топ 10 лидеров
   */
  getTopLeaders: async (): Promise<LeaderboardResponse> => {
    const response = await apiClient.get<LeaderboardResponse>('/points/leaderboard', {
      params: { limit: 10 },
    });
    return response.data;
  },
};

export default pointsApi;
