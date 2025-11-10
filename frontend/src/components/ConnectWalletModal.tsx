'use client';

import { useState } from 'react';
import { X, Wallet } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { useSimpleAuth } from '@/hooks/useAuth';

export function ConnectWalletModal() {
  const { isConnectWalletOpen, closeConnectWallet } = useUIStore();
  const { mutate: login, isPending } = useSimpleAuth();
  const [wallet, setWallet] = useState('');

  if (!isConnectWalletOpen) return null;

  const handleConnect = () => {
    if (!wallet.trim()) return;
    login(wallet);
    closeConnectWallet();
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
            Enter your wallet address to start betting
          </p>
        </div>

        {/* Input */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Wallet Address
            </label>
            <input
              type="text"
              value={wallet}
              onChange={(e) => setWallet(e.target.value)}
              placeholder="0x..."
              className="input"
              disabled={isPending}
            />
          </div>

          {/* Demo wallets */}
          <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
            <p className="text-sm text-slate-400 mb-2">Quick demo wallets:</p>
            <div className="flex flex-wrap gap-2">
              {['0x1234...demo1', '0x5678...demo2', '0xabcd...demo3'].map(
                (demo) => (
                  <button
                    key={demo}
                    onClick={() => setWallet(demo)}
                    className="px-3 py-1 rounded bg-slate-700 text-xs font-mono hover:bg-slate-600 transition-colors"
                    disabled={isPending}
                  >
                    {demo}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Connect button */}
          <button
            onClick={handleConnect}
            disabled={!wallet.trim() || isPending}
            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? 'Connecting...' : 'Connect'}
          </button>

          <p className="text-xs text-slate-500 text-center">
            This is a demo. In production, use MetaMask or WalletConnect.
          </p>
        </div>
      </div>
    </div>
  );
}
