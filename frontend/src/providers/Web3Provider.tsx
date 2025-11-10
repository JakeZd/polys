'use client';

/**
 * Web3Provider - Configuration for Web3Modal wallet connection
 * Supports MetaMask, WalletConnect, Coinbase Wallet, and more
 */

import { createWeb3Modal, defaultConfig } from '@web3modal/ethers/react';
import { ReactNode } from 'react';

// 1. Get projectId from https://cloud.walletconnect.com
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID';

// 2. Set chains - Ethereum Mainnet and Polygon
const mainnet = {
  chainId: 1,
  name: 'Ethereum',
  currency: 'ETH',
  explorerUrl: 'https://etherscan.io',
  rpcUrl: 'https://eth.llamarpc.com' // Free public RPC
};

const polygon = {
  chainId: 137,
  name: 'Polygon',
  currency: 'MATIC',
  explorerUrl: 'https://polygonscan.com',
  rpcUrl: 'https://polygon.llamarpc.com' // Free public RPC
};

// 3. Create a metadata object
const metadata = {
  name: 'PolySynapse',
  description: 'AI-Powered Prediction Markets on Polymarket',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://polysynapse.ai',
  icons: ['https://avatars.githubusercontent.com/u/37784886']
};

// 4. Create Ethers config
const ethersConfig = defaultConfig({
  metadata,
  enableEIP6963: true, // Enable EIP-6963 for better wallet detection
  enableInjected: true, // Enable injected wallets (MetaMask, Rabby, etc.)
  enableCoinbase: true, // Enable Coinbase Wallet
  rpcUrl: 'https://eth.llamarpc.com', // Free public RPC for read-only operations
  defaultChainId: 1,
});

// 5. Create a Web3Modal instance
createWeb3Modal({
  ethersConfig,
  chains: [mainnet, polygon],
  projectId,
  enableAnalytics: false, // Optional - defaults to your Cloud configuration
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': '#6366f1', // Indigo color matching your UI
    '--w3m-border-radius-master': '4px',
  }
});

export function Web3Provider({ children }: { children: ReactNode }) {
  return children;
}
