import express from "express";
import { PrismaClient } from "@prisma/client";
import { authMiddleware } from "./auth.js";

const router = express.Router();
const prisma = new PrismaClient();

router.get("/", authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userBets: {
          include: {
            market: {
              select: {
                id: true,
                question: true,
                category: true,
                endTime: true,
                resolved: true,
                outcome: true
              }
            }
          },
          orderBy: { placedAt: 'desc' },
          take: 50
        },
        pointsLedger: {
          orderBy: { createdAt: 'desc' },
          take: 50
        }
      }
    });
    
    if (!user) {
      return res.status(404).json({
        error: "User not found"
      });
    }
    
    const bets = user.userBets || [];
    
    const betsStats = {
      total: bets.length,
      settled: bets.filter(b => b.settled).length,
      active: bets.filter(b => !b.settled).length,
      won: bets.filter(b => b.settled && b.won).length,
      lost: bets.filter(b => b.settled && !b.won).length
    };
    
    const agreementStats = {
      agreedWithAI: bets.filter(b => b.agreeWithAI).length,
      disagreedWithAI: bets.filter(b => !b.agreeWithAI).length,
      agreedAndWon: bets.filter(b => b.agreeWithAI && b.settled && b.won).length,
      disagreedAndWon: bets.filter(b => !b.agreeWithAI && b.settled && b.won).length
    };
    
    const totalStaked = bets.reduce((sum, bet) => sum + (bet.stake || 0), 0);
    const totalPayout = bets
      .filter(b => b.settled)
      .reduce((sum, bet) => sum + (bet.payout || 0), 0);
    
    const settledStake = bets
      .filter(b => b.settled)
      .reduce((sum, bet) => sum + (bet.stake || 0), 0);
    
    const profitLoss = totalPayout - settledStake;
    
    const activeBetsValue = bets
      .filter(b => !b.settled && b.currentPrice && b.entryPrice)
      .reduce((sum, bet) => {
        const shares = bet.stake / bet.entryPrice;
        return sum + (shares * bet.currentPrice);
      }, 0);
    
    const activeBetsStake = bets
      .filter(b => !b.settled)
      .reduce((sum, bet) => sum + (bet.stake || 0), 0);
    
    const unrealizedPnL = activeBetsValue - activeBetsStake;
    
    const winRate = betsStats.settled > 0 
      ? (betsStats.won / betsStats.settled * 100) 
      : 0;
    
    const agreeWinRate = agreementStats.agreedWithAI > 0
      ? (agreementStats.agreedAndWon / agreementStats.agreedWithAI * 100)
      : 0;
    
    const disagreeWinRate = agreementStats.disagreedWithAI > 0
      ? (agreementStats.disagreedAndWon / agreementStats.disagreedWithAI * 100)
      : 0;
    
    res.json({
      success: true,
      profile: {
        user: {
          id: user.id,
          wallet: user.wallet,
          points: user.points || 0,
          streakDays: user.streakDays || 0,
          lastCheckin: user.lastCheckin,
          createdAt: user.createdAt
        },
        stats: {
          bets: betsStats,
          agreement: agreementStats,
          financial: {
            totalStaked,
            totalPayout,
            profitLoss,
            activeBetsValue: Math.round(activeBetsValue),
            activeBetsStake,
            unrealizedPnL: Math.round(unrealizedPnL)
          },
          performance: {
            winRate: winRate.toFixed(1),
            agreeWinRate: agreeWinRate.toFixed(1),
            disagreeWinRate: disagreeWinRate.toFixed(1)
          }
        },
        recentBets: bets.slice(0, 10).map(bet => ({
          id: bet.id,
          market: bet.market,
          side: bet.side,
          stake: bet.stake || 0,
          entryPrice: bet.entryPrice || 0,
          currentPrice: bet.currentPrice,
          agreeWithAI: bet.agreeWithAI,
          settled: bet.settled,
          won: bet.won,
          payout: bet.payout || 0,
          placedAt: bet.placedAt
        })),
        pointsHistory: user.pointsLedger || []
      }
    });
    
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({
      error: "Failed to fetch profile",
      details: error.message
    });
  }
});

router.get("/bets", authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const { limit = 50, offset = 0, status } = req.query;
    
    let where = { userId };
    
    if (status === 'active') {
      where.settled = false;
    } else if (status === 'settled') {
      where.settled = true;
    }
    
    const bets = await prisma.userBet.findMany({
      where,
      include: {
        market: {
          select: {
            id: true,
            question: true,
            category: true,
            endTime: true,
            resolved: true,
            outcome: true
          }
        }
      },
      orderBy: { placedAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset)
    });
    
    res.json({
      success: true,
      bets: bets
    });
    
  } catch (error) {
    console.error("Error fetching user bets:", error);
    res.status(500).json({
      error: "Failed to fetch bets"
    });
  }
});

export default router;