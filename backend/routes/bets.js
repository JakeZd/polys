import express from "express";
import rateLimit from "express-rate-limit";
import { PrismaClient } from "@prisma/client";
import { authMiddleware } from "./auth.js";
import { MarketService } from "../services/market.js";

const router = express.Router();
const prisma = new PrismaClient();
const marketService = new MarketService(prisma);

const betLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: 'Too many bet requests, please slow down.',
  standardHeaders: true,
  legacyHeaders: false,
});

const validateBetInput = (body) => {
  const { marketId, side, agreeWithAI, stake } = body;
  
  if (!marketId || typeof marketId !== 'string') {
    return { valid: false, error: "Invalid marketId" };
  }
  
  if (!side || !["YES", "NO"].includes(side)) {
    return { valid: false, error: "Side must be YES or NO" };
  }
  
  if (typeof agreeWithAI !== 'boolean') {
    return { valid: false, error: "agreeWithAI must be boolean" };
  }
  
  if (typeof stake !== 'number' || !Number.isFinite(stake) || !Number.isInteger(stake)) {
    return { valid: false, error: "Stake must be an integer" };
  }
  
  if (stake < 10 || stake > 10000) {
    return { valid: false, error: "Stake must be between 10 and 10000 points" };
  }
  
  return { valid: true };
};

router.post("/place", authMiddleware, betLimiter, async (req, res) => {
  try {
    const validation = validateBetInput(req.body);
    
    if (!validation.valid) {
      return res.status(400).json({
        error: validation.error
      });
    }
    
    const { marketId, side, agreeWithAI, stake, entryPrice } = req.body;
    const userId = req.userId;
    
    if (!entryPrice || entryPrice < 0.01 || entryPrice > 0.99) {
      return res.status(400).json({
        error: "Invalid entry price"
      });
    }
    
    const market = await prisma.market.findUnique({
      where: { id: marketId },
      include: {
        aiBets: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });
    
    if (!market) {
      return res.status(404).json({
        error: "Market not found"
      });
    }
    
    if (market.resolved) {
      return res.status(400).json({
        error: "Market already resolved"
      });
    }
    
    if (new Date() >= market.endTime) {
      return res.status(400).json({
        error: "Market closed for betting"
      });
    }
    
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (user.points < stake) {
      return res.status(400).json({
        error: "Insufficient points balance"
      });
    }
    
    const aiBet = market.aiBets[0];
    if (!aiBet) {
      return res.status(400).json({
        error: "AI hasn't analyzed this market yet"
      });
    }
    
    const result = await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          points: { decrement: stake },
          totalBets: { increment: 1 }
        }
      });
      
      const bet = await tx.userBet.create({
        data: {
          userId: userId,
          marketId: marketId,
          side: side,
          agreeWithAI: agreeWithAI,
          stake: stake,
          entryPrice: entryPrice,
          currentPrice: entryPrice
        }
      });
      
      await tx.pointsLedger.create({
        data: {
          userId: userId,
          wallet: user.wallet,
          amount: -stake,
          type: "bet_placed",
          reason: `Bet on ${market.question.substring(0, 50)}...`
        }
      });
      
      return bet;
    });
    
    res.json({
      success: true,
      bet: {
        id: result.id,
        marketId: result.marketId,
        side: result.side,
        agreeWithAI: result.agreeWithAI,
        stake: result.stake,
        entryPrice: result.entryPrice,
        potentialPayout: Math.round(stake / entryPrice),
        placedAt: result.placedAt
      },
      newBalance: user.points - stake
    });
    
  } catch (error) {
    console.error("Bet placement error:", error);
    res.status(500).json({
      error: "Failed to place bet"
    });
  }
});

router.get("/my", authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const { status = "all", limit = 50, offset = 0 } = req.query;
    
    let where = { userId };
    
    if (status === "active") {
      where.settled = false;
    } else if (status === "settled") {
      where.settled = true;
    }
    
    const bets = await prisma.userBet.findMany({
      where,
      include: {
        market: {
          include: {
            aiBets: {
              orderBy: { createdAt: 'desc' },
              take: 1
            }
          }
        }
      },
      orderBy: { placedAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset)
    });
    
    const formattedBets = bets.map((bet) => {
      const aiBet = bet.market.aiBets[0];
      
      return {
        id: bet.id,
        market: {
          id: bet.market.id,
          question: bet.market.question,
          category: bet.market.category,
          endTime: bet.market.endTime,
          resolved: bet.market.resolved,
          outcome: bet.market.outcome
        },
        side: bet.side,
        agreeWithAI: bet.agreeWithAI,
        aiSide: aiBet?.side || null,
        stake: bet.stake,
        entryPrice: bet.entryPrice,
        currentPrice: bet.currentPrice,
        profit: bet.currentPrice ? 
          Math.round((bet.currentPrice - bet.entryPrice) * bet.stake / bet.entryPrice) : 
          null,
        settled: bet.settled,
        won: bet.won,
        payout: bet.payout,
        placedAt: bet.placedAt,
        settledAt: bet.settledAt
      };
    });
    
    const stats = await prisma.userBet.aggregate({
      where: { userId },
      _sum: {
        stake: true,
        payout: true
      },
      _count: true
    });
    
    const wonBets = await prisma.userBet.count({
      where: { userId, settled: true, won: true }
    });
    
    res.json({
      success: true,
      bets: formattedBets,
      stats: {
        totalBets: stats._count,
        totalStake: stats._sum.stake || 0,
        totalPayout: stats._sum.payout || 0,
        wonBets: wonBets,
        winRate: stats._count > 0 ? (wonBets / stats._count * 100) : 0,
        profit: (stats._sum.payout || 0) - (stats._sum.stake || 0)
      }
    });
    
  } catch (error) {
    console.error("Error fetching user bets:", error);
    res.status(500).json({
      error: "Failed to fetch bets"
    });
  }
});

router.get("/ai", async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    
    const aiBets = await prisma.aIBet.findMany({
      include: {
        market: true
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset)
    });
    
    const formatted = await Promise.all(aiBets.map(async (bet) => {
      const userBetsStats = await prisma.userBet.aggregate({
        where: { marketId: bet.market.id },
        _count: true,
        _sum: { stake: true }
      });
      
      return {
        id: bet.id,
        market: {
          id: bet.market.id,
          question: bet.market.question,
          category: bet.market.category,
          endTime: bet.market.endTime,
          resolved: bet.market.resolved,
          outcome: bet.market.outcome,
          userBetsCount: userBetsStats._count || 0,
          totalUserVolume: userBetsStats._sum.stake || 0
        },
        side: bet.side,
        stake: bet.stake,
        entryPrice: bet.entryPrice,
        currentPrice: bet.currentPrice,
        confidence: bet.confidence,
        reasoning: bet.reasoning,
        expectedValue: bet.expectedValue,
        edge: bet.edge,
        settled: bet.settled,
        won: bet.won,
        payout: bet.payout,
        placedAt: bet.createdAt,
        updatedAt: bet.updatedAt
      };
    }));
    
    const stats = await prisma.aIBet.aggregate({
      where: { settled: true },
      _count: true,
      _sum: {
        stake: true,
        payout: true
      }
    });
    
    const wonBets = await prisma.aIBet.count({
      where: { settled: true, won: true }
    });
    
    res.json({
      success: true,
      bets: formatted,
      stats: {
        totalBets: stats._count,
        totalStake: stats._sum.stake || 0,
        totalPayout: stats._sum.payout || 0,
        wonBets: wonBets,
        winRate: stats._count > 0 ? (wonBets / stats._count * 100) : 0,
        profit: (stats._sum.payout || 0) - (stats._sum.stake || 0)
      }
    });
    
  } catch (error) {
    console.error("Error fetching AI bets:", error);
    res.status(500).json({
      error: "Failed to fetch AI bets"
    });
  }
});

router.get("/stats", authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;

    // Get total bets count
    const totalBets = await prisma.userBet.count({
      where: { userId }
    });

    // Get active bets count
    const activeBets = await prisma.userBet.count({
      where: { userId, settled: false }
    });

    // Get settled bets count
    const settledBets = await prisma.userBet.count({
      where: { userId, settled: true }
    });

    // Get won bets count
    const wonBets = await prisma.userBet.count({
      where: { userId, settled: true, won: true }
    });

    // Get lost bets count
    const lostBets = await prisma.userBet.count({
      where: { userId, settled: true, won: false }
    });

    // Get aggregated stats
    const aggregateStats = await prisma.userBet.aggregate({
      where: { userId },
      _sum: {
        stake: true,
        payout: true
      }
    });

    const totalStaked = aggregateStats._sum.stake || 0;
    const totalWon = aggregateStats._sum.payout || 0;
    const profit = totalWon - totalStaked;
    const winRate = settledBets > 0 ? (wonBets / settledBets * 100) : 0;
    const roi = totalStaked > 0 ? (profit / totalStaked * 100) : 0;

    res.json({
      success: true,
      stats: {
        total: totalBets,
        active: activeBets,
        settled: settledBets,
        won: wonBets,
        lost: lostBets,
        winRate: parseFloat(winRate.toFixed(2)),
        totalStaked: totalStaked,
        totalWon: totalWon,
        profit: profit,
        roi: parseFloat(roi.toFixed(2))
      }
    });

  } catch (error) {
    console.error("Error fetching bet stats:", error);
    res.status(500).json({
      error: "Failed to fetch bet stats"
    });
  }
});

router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const bet = await prisma.userBet.findUnique({
      where: { id: req.params.id },
      include: {
        market: {
          include: {
            aiBets: true
          }
        },
        user: {
          select: {
            id: true,
            wallet: true
          }
        }
      }
    });
    
    if (!bet) {
      return res.status(404).json({
        error: "Bet not found"
      });
    }
    
    if (bet.userId !== req.userId) {
      return res.status(403).json({
        error: "Access denied"
      });
    }
    
    res.json({
      success: true,
      bet: bet
    });
    
  } catch (error) {
    console.error("Error fetching bet:", error);
    res.status(500).json({
      error: "Failed to fetch bet"
    });
  }
});

export default router;