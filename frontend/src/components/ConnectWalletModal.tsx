'use client';

import { useEffect } from 'react';
import { X, Wallet, CheckCircle2 } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { useWeb3Wallet } from '@/hooks/useWeb3Wallet';

export function ConnectWalletModal() {
  const { isConnectWalletOpen, closeConnectWallet } = useUIStore();
  const { address, isConnected, isAuthenticating, connectAndAuth } = useWeb3Wallet();

  if (!isConnectWalletOpen) return null;

  // Close modal after successful authentication
  useEffect(() => {
    if (isConnected && !isAuthenticating && address) {
      // Small delay for better UX
      const timer = setTimeout(() => {
        closeConnectWallet();
      }, 500);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isConnected, isAuthenticating, address, closeConnectWallet]);

  const handleConnect = async () => {
    try {
      await connectAndAuth();
    } catch (error) {
      console.error('Connection error:', error);
      // Error handling is done in the hook
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={closeConnectWallet}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md p-6 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl">
        {/* Close button */}
        <button
          onClick={closeConnectWallet}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white transition-colors"
          disabled={isAuthenticating}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold">Connect Wallet</h2>
          </div>
          <p className="text-slate-400">
            Connect your Web3 wallet to start betting
          </p>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {/* Connection Status */}
          {isConnected && address && (
            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
              <div className="flex items-center gap-2 text-green-400 mb-1">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-sm font-medium">Wallet Connected</span>
              </div>
              <p className="text-xs text-slate-400 font-mono truncate">
                {address}
              </p>
            </div>
          )}

          {/* Connect Button */}
          <button
            onClick={handleConnect}
            disabled={isAuthenticating}
            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isAuthenticating ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Authenticating...
              </>
            ) : isConnected ? (
              'Sign Message to Continue'
            ) : (
              'Connect Wallet'
            )}
          </button>

          {/* Info */}
          <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
            <p className="text-sm text-slate-400 mb-3">Supported wallets:</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                'MetaMask',
                'WalletConnect',
                'Coinbase Wallet',
                'Rabby Wallet',
              ].map((name) => (
                <div
                  key={name}
                  className="px-3 py-2 rounded bg-slate-700/50 text-xs text-center text-slate-300"
                >
                  {name}
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-slate-500 text-center">
            You'll need to sign a message to verify your wallet ownership.
            This is free and doesn't send a transaction.
          </p>
        </div>
      </div>
    </div>
  );
}
