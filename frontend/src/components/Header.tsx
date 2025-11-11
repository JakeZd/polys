'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Brain, TrendingUp, Trophy, User, Coins, LogOut, ChevronDown } from 'lucide-react';
import { useUser, useIsAuthenticated } from '@/store/authStore.hooks';
import { useUIStore } from '@/store/uiStore';
import { useWeb3Wallet } from '@/hooks/useWeb3Wallet';

export function Header() {
  const pathname = usePathname();
  const user = useUser();
  const isAuthenticated = useIsAuthenticated();
  const { openConnectWallet } = useUIStore();
  const { disconnect } = useWeb3Wallet();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleDisconnect = async () => {
    setIsDropdownOpen(false);
    await disconnect();
  };

  const navItems = [
    { href: '/', label: 'Markets', icon: TrendingUp },
    { href: '/bets', label: 'My Bets', icon: Brain },
    { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
    { href: '/profile', label: 'Profile', icon: User },
  ];

  return (
    <header className="relative z-20 border-b border-slate-800/50 backdrop-blur-xl bg-slate-950/80">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gradient">PolySynapse</h1>
              <p className="text-xs text-slate-400">AI-Powered Predictions</p>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="flex items-center gap-4">
            {isAuthenticated && user ? (
              <>
                {/* Points */}
                <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-slate-800/50 rounded-lg border border-slate-700">
                  <Coins className="w-4 h-4 text-yellow-400" />
                  <span className="font-bold">{user.points.toLocaleString()}</span>
                  <span className="text-xs text-slate-400">pts</span>
                </div>

                {/* Wallet Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 rounded-lg border border-slate-700 hover:border-indigo-500 transition-colors"
                  >
                    <div className="w-2 h-2 rounded-full bg-green-400"></div>
                    <span className="font-mono text-sm hidden sm:inline">
                      {user.wallet.slice(0, 6)}...{user.wallet.slice(-4)}
                    </span>
                    <User className="w-4 h-4 sm:hidden" />
                    <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Menu */}
                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 rounded-lg bg-slate-800 border border-slate-700 shadow-xl overflow-hidden z-50">
                      <Link
                        href="/profile"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-slate-700 transition-colors"
                      >
                        <User className="w-4 h-4 text-indigo-400" />
                        <span>Profile</span>
                      </Link>
                      <button
                        onClick={handleDisconnect}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700 transition-colors text-red-400"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Disconnect</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <button
                onClick={openConnectWallet}
                className="btn-primary"
              >
                Connect Wallet
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        <nav className="md:hidden mt-4 flex gap-2 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
