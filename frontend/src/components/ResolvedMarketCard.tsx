'use client';

import Link from 'next/link';
import { Brain, TrendingUp, TrendingDown, CheckCircle, XCircle, DollarSign } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface AIBetResult {
  id: string;
  marketId: string;
  question: string;
  category: string;
  side: 'YES' | 'NO';
  confidence: number;
  reasoning: string;
  entryPrice: number;
  stake: number;
  settled: boolean;
  won: boolean;
  payout: number;
  profit: number;
  profitPercentage: string | number;
  expectedValue: number;
  edge: number;
  placedAt: string;
  settledAt: string;
  outcome: string | null;
  marketResolved: boolean;
  endTime: string;
}

interface ResolvedMarketCardProps {
  result: AIBetResult;
}

export function ResolvedMarketCard({ result }: ResolvedMarketCardProps) {
  const settledTime = formatDistanceToNow(new Date(result.settledAt), { addSuffix: true });
  const isProfit = result.profit > 0;

  return (
    <Link href={`/market/${result.marketId}`}>
      <div className="group p-6 rounded-xl bg-slate-800/50 backdrop-blur-sm border border-slate-700 hover:border-indigo-500/50 transition-all hover:shadow-xl hover:shadow-indigo-500/10 cursor-pointer h-full flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-1 rounded text-xs font-semibold bg-indigo-500/20 text-indigo-400">
                {result.category}
              </span>
              {result.settled && (
                <span className={`px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 ${
                  result.won
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  {result.won ? (
                    <>
                      <CheckCircle className="w-3 h-3" />
                      Won
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3 h-3" />
                      Lost
                    </>
                  )}
                </span>
              )}
            </div>
            <h3 className="font-semibold text-lg leading-tight group-hover:text-indigo-400 transition-colors line-clamp-2">
              {result.question}
            </h3>
          </div>
        </div>

        {/* AI Prediction Summary */}
        <div className="mb-4 p-3 rounded-lg bg-gradient-to-br from-cyan-950/50 to-blue-950/50 border border-cyan-500/30">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-semibold text-cyan-400">
              AI Predicted: {result.side}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-slate-400">Confidence:</span>
              <span className="ml-1 font-bold text-cyan-400">
                {result.confidence.toFixed(1)}%
              </span>
            </div>
            <div>
              <span className="text-slate-400">Outcome:</span>
              <span className="ml-1 font-bold">
                {result.outcome || 'Pending'}
              </span>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="mb-4 p-4 rounded-lg bg-slate-900/50 border border-slate-700">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-slate-400 mb-1">Stake</p>
              <p className="font-bold">{result.stake.toLocaleString()} pts</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1">Payout</p>
              <p className="font-bold">{result.payout.toLocaleString()} pts</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-slate-400 mb-1">Profit/Loss</p>
              <p className={`text-lg font-bold ${
                isProfit ? 'text-green-400' : 'text-red-400'
              }`}>
                {isProfit ? '+' : ''}{result.profit.toLocaleString()} pts
                <span className="ml-2 text-sm">
                  ({isProfit ? '+' : ''}{result.profitPercentage}%)
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto pt-4 border-t border-slate-700 text-sm text-slate-400">
          <p>Settled {settledTime}</p>
        </div>
      </div>
    </Link>
  );
}
