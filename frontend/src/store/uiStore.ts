/**
 * UI Store - Zustand
 * Управление UI состоянием (модалки, сайдбары и тд)
 */

import { create } from 'zustand';
import type { Market, UserBet } from '@/types';

interface UIState {
  // Sidebar
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  openSidebar: () => void;
  closeSidebar: () => void;

  // Bet Modal
  isBetModalOpen: boolean;
  betModalMarket: Market | null;
  openBetModal: (market: Market) => void;
  closeBetModal: () => void;

  // Market Details Modal
  isMarketDetailsOpen: boolean;
  marketDetailsId: string | null;
  openMarketDetails: (marketId: string) => void;
  closeMarketDetails: () => void;

  // Bet Details Modal
  isBetDetailsOpen: boolean;
  betDetails: UserBet | null;
  openBetDetails: (bet: UserBet) => void;
  closeBetDetails: () => void;

  // Connect Wallet Modal
  isConnectWalletOpen: boolean;
  openConnectWallet: () => void;
  closeConnectWallet: () => void;

  // Current Page
  currentPage: string;
  setCurrentPage: (page: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  // Sidebar
  isSidebarOpen: false,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  openSidebar: () => set({ isSidebarOpen: true }),
  closeSidebar: () => set({ isSidebarOpen: false }),

  // Bet Modal
  isBetModalOpen: false,
  betModalMarket: null,
  openBetModal: (market) => set({ isBetModalOpen: true, betModalMarket: market }),
  closeBetModal: () => set({ isBetModalOpen: false, betModalMarket: null }),

  // Market Details Modal
  isMarketDetailsOpen: false,
  marketDetailsId: null,
  openMarketDetails: (marketId) => set({ isMarketDetailsOpen: true, marketDetailsId: marketId }),
  closeMarketDetails: () => set({ isMarketDetailsOpen: false, marketDetailsId: null }),

  // Bet Details Modal
  isBetDetailsOpen: false,
  betDetails: null,
  openBetDetails: (bet) => set({ isBetDetailsOpen: true, betDetails: bet }),
  closeBetDetails: () => set({ isBetDetailsOpen: false, betDetails: null }),

  // Connect Wallet Modal
  isConnectWalletOpen: false,
  openConnectWallet: () => set({ isConnectWalletOpen: true }),
  closeConnectWallet: () => set({ isConnectWalletOpen: false }),

  // Current Page
  currentPage: 'markets',
  setCurrentPage: (page) => set({ currentPage: page }),
}));

export default useUIStore;
