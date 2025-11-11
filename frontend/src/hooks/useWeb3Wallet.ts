'use client';

/**
 * useWeb3Wallet - Custom hook for Web3 wallet operations
 * Handles wallet connection, signing, and integration with our auth system
 */

import { useWeb3Modal, useWeb3ModalAccount, useWeb3ModalProvider } from '@web3modal/ethers/react';
import { BrowserProvider } from 'ethers';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { authApi } from '@/api';
import { useAuthStore } from '@/store/authStore';

export function useWeb3Wallet() {
  const { open } = useWeb3Modal();
  const { address, isConnected } = useWeb3ModalAccount();
  const { walletProvider } = useWeb3ModalProvider();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const login = useAuthStore((state) => state.login);

  /**
   * Connect wallet and authenticate with backend
   */
  const connectAndAuth = async () => {
    try {
      setIsAuthenticating(true);

      // Step 1: Open Web3Modal to connect wallet if not connected
      if (!isConnected) {
        toast.loading('Opening wallet selector...', { id: 'auth' });
        await open();
        // Wait for connection to establish
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      // Step 2: Verify we have the connected address and provider
      // We need to get fresh values after connection
      let currentAddress = address;
      let currentProvider = walletProvider;

      // If still no address after connecting, wait a bit more
      if (!currentAddress && isConnected) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        currentAddress = address;
        currentProvider = walletProvider;
      }

      if (!currentAddress) {
        throw new Error('No wallet address found. Please make sure your wallet is connected.');
      }

      if (!currentProvider) {
        throw new Error('No wallet provider found. Please reconnect your wallet.');
      }

      // Step 3: Request message to sign from backend
      toast.loading('Requesting signature...', { id: 'auth' });
      const { message } = await authApi.generateMessage(currentAddress);

      // Step 4: Sign the message with the wallet
      toast.loading('Please sign the message in your wallet...', { id: 'auth' });

      // Create provider without making RPC calls
      const ethersProvider = new BrowserProvider(currentProvider, 'any');
      const signer = await ethersProvider.getSigner();
      const signature = await signer.signMessage(message);

      // Step 5: Verify signature with backend
      toast.loading('Verifying signature...', { id: 'auth' });
      const response = await authApi.verifySignature(currentAddress, signature, message);

      // Step 6: Store auth data
      login(response.token, response.user);

      toast.success(
        response.user.isNew ? 'Welcome to PolySynapse!' : 'Welcome back!',
        { id: 'auth' }
      );

      return response;
    } catch (error: any) {
      console.error('Auth error:', error);

      // Handle user rejection
      if (error.code === 'ACTION_REJECTED' || error.code === 4001) {
        toast.error('Signature rejected. Click the button to try again.', { id: 'auth' });
      } else if (error.code === 'UNKNOWN_ERROR' || error.code === -32603) {
        toast.error('Network error. Please try again or switch networks.', { id: 'auth' });
      } else if (error.message?.includes('could not coalesce error')) {
        toast.error('Network connection issue. Please try again.', { id: 'auth' });
      } else {
        toast.error(error.message || 'Authentication failed. Please try again.', { id: 'auth' });
      }

      throw error;
    } finally {
      setIsAuthenticating(false);
    }
  };

  /**
   * Just open the wallet modal without auth
   */
  const openWalletModal = async () => {
    try {
      await open();
    } catch (error) {
      console.error('Failed to open wallet modal:', error);
      toast.error('Failed to open wallet selector');
    }
  };

  /**
   * Sign a message for check-in
   */
  const signCheckin = async () => {
    try {
      if (!address || !isConnected) {
        throw new Error('Wallet not connected');
      }

      if (!walletProvider) {
        throw new Error('No wallet provider found');
      }

      // Create check-in message
      const message = `PolySynapse Daily Check-in\nDate: ${new Date().toISOString().split('T')[0]}\nWallet: ${address}`;

      // Sign the message
      const ethersProvider = new BrowserProvider(walletProvider, 'any');
      const signer = await ethersProvider.getSigner();
      const signature = await signer.signMessage(message);

      return { message, signature };
    } catch (error: any) {
      console.error('Check-in signature error:', error);

      // Handle user rejection
      if (error.code === 'ACTION_REJECTED' || error.code === 4001) {
        toast.error('Signature rejected');
      } else {
        toast.error(error.message || 'Failed to sign check-in message');
      }

      throw error;
    }
  };

  /**
   * Disconnect wallet and logout
   */
  const disconnect = async () => {
    try {
      const { logout } = useAuthStore.getState();

      // Logout from our auth system
      logout();

      // Disconnect from Web3Modal
      await open({ view: 'Account' });

      toast.success('Wallet disconnected');
    } catch (error) {
      console.error('Failed to disconnect:', error);
      toast.error('Failed to disconnect wallet');
    }
  };

  return {
    // State
    address,
    isConnected,
    isAuthenticating,

    // Actions
    connectAndAuth,
    openWalletModal,
    open: openWalletModal,
    signCheckin,
    disconnect,
  };
}
