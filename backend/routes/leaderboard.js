import express from "express";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

// Функция для маскировки кошелька
const maskWallet = (wallet) => {
  if (!wallet || wallet.length < 10) return wallet;
  return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
};

// GET /api/leaderboard - Общий лидерборд
router.get("/", async (req, res) => {
  try {
    const { limit = 100, offset = 0 } = req.query;
    
    const users = await prisma.user.findMany({
      orderBy: [
        { points: 'desc' },
        { winRate: 'desc' }
      ],
      select: {
        id: true,
        wallet: true,
        points: true,
        winRate: true,
        totalBets: true,
        totalWins: true,
        streakDays: true,
        createdAt: true
      },
      take: parseInt(limit),
      skip: parseInt(offset)
    });
    
    const total = await prisma.user.count();
    
    const leaderboard = users.map((user, index) => ({
      rank: parseInt(offset) + index + 1,
      id: user.id,
      wallet: maskWallet(user.wallet),
      points: user.points,
      winRate: user.winRate,
      totalBets: user.totalBets,
      totalWins: user.totalWins,
      streakDays: user.streakDays,
      joinDate: user.createdAt
    }));
    
    res.json({
      success: true,
      leaderboard,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    res.status(500).json({
      error: "Failed to fetch leaderboard"
    });
  }
});

// GET /api/leaderboard/top - Топ игроков
router.get("/top", async (req, res) => {
  try {
    const { period = "all" } = req.query;
    
    let since = null;
    
    switch (period) {
      case "today":
        since = new Date();
        since.setUTCHours(0, 0, 0, 0);
        break;
      case "week":
        since = new Date();
        since.setDate(since.getDate() - 7);
        break;
      case "month":
        since = new Date();
        since.setMonth(since.getMonth() - 1);
        break;
    }
    
    // Топ по поинтам
    const topByPoints = await prisma.user.findMany({
      orderBy: { points: 'desc' },
      select: {
        id: true,
        wallet: true,
        points: true,
        winRate: true
      },
      take: 10
    });
    
    // Топ по винрейту (минимум 10 ставок)
    const topByWinRate = await prisma.user.findMany({
      where: { totalBets: { gte: 10 } },
      orderBy: { winRate: 'desc' },
      select: {
        id: true,
        wallet: true,
        points: true,
        winRate: true,
        totalBets: true
      },
      take: 10
    });
    
    // Топ по стрику
    const topByStreak = await prisma.user.findMany({
      orderBy: { streakDays: 'desc' },
      select: {
        id: true,
        wallet: true,
        points: true,
        streakDays: true
      },
      take: 10
    });
    
    // Топ по объему ставок за период
    let topByVolume = [];
    if (since) {
      const volumeData = await prisma.userBet.groupBy({
        by: ['userId'],
        where: {
          placedAt: { gte: since }
        },
        _sum: { stake: true },
        orderBy: {
          _sum: {
            stake: 'desc'
          }
        },
        take: 10
      });
      
      const userIds = volumeData.map(d => d.userId);
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: {
          id: true,
          wallet: true,
          points: true
        }
      });
      
      const userMap = new Map(users.map(u => [u.id, u]));
      
      topByVolume = volumeData.map(d => ({
        ...userMap.get(d.userId),
        volume: d._sum.stake
      }));
    }
    
    res.json({
      success: true,
      topByPoints: topByPoints.map((u, i) => ({
        rank: i + 1,
        wallet: maskWallet(u.wallet),
        points: u.points,
        winRate: u.winRate
      })),
      topByWinRate: topByWinRate.map((u, i) => ({
        rank: i + 1,
        wallet: maskWallet(u.wallet),
        winRate: u.winRate,
        totalBets: u.totalBets,
        points: u.points
      })),
      topByStreak: topByStreak.map((u, i) => ({
        rank: i + 1,
        wallet: maskWallet(u.wallet),
        streakDays: u.streakDays,
        points: u.points
      })),
      topByVolume: topByVolume.map((u, i) => ({
        rank: i + 1,
        wallet: maskWallet(u.wallet),
        volume: u.volume,
        points: u.points
      }))
    });
    
  } catch (error) {
    console.error("Error fetching top players:", error);
    res.status(500).json({
      error: "Failed to fetch top players"
    });
  }
});

// GET /api/leaderboard/ai-vs-humans - Статистика AI vs Humans
router.get("/ai-vs-humans", async (req, res) => {
  try {
    // Статистика AI
    const aiStats = await prisma.aIBet.aggregate({
      where: { settled: true },
      _count: true,
      _sum: {
        stake: true,
        payout: true
      }
    });
    
    const aiWins = await prisma.aIBet.count({
      where: { settled: true, won: true }
    });
    
    // Статистика людей
    const humanStats = await prisma.userBet.aggregate({
      where: { settled: true },
      _count: true,
      _sum: {
        stake: true,
        payout: true
      }
    });
    
    const humanWins = await prisma.userBet.count({
      where: { settled: true, won: true }
    });
    
    // Статистика согласия с AI
    const agreeWithAI = await prisma.userBet.aggregate({
      where: { agreeWithAI: true, settled: true },
      _count: true
    });
    
    const agreeWithAIWins = await prisma.userBet.count({
      where: { agreeWithAI: true, settled: true, won: true }
    });
    
    const disagreeWithAI = await prisma.userBet.aggregate({
      where: { agreeWithAI: false, settled: true },
      _count: true
    });
    
    const disagreeWithAIWins = await prisma.userBet.count({
      where: { agreeWithAI: false, settled: true, won: true }
    });
    
    res.json({
      success: true,
      ai: {
        totalBets: aiStats._count,
        totalWins: aiWins,
        winRate: aiStats._count > 0 ? (aiWins / aiStats._count * 100) : 0,
        totalStake: aiStats._sum.stake || 0,
        totalPayout: aiStats._sum.payout || 0,
        profit: (aiStats._sum.payout || 0) - (aiStats._sum.stake || 0)
      },
      humans: {
        totalBets: humanStats._count,
        totalWins: humanWins,
        winRate: humanStats._count > 0 ? (humanWins / humanStats._count * 100) : 0,
        totalStake: humanStats._sum.stake || 0,
        totalPayout: humanStats._sum.payout || 0,
        profit: (humanStats._sum.payout || 0) - (humanStats._sum.stake || 0)
      },
      agreeWithAI: {
        total: agreeWithAI._count,
        wins: agreeWithAIWins,
        winRate: agreeWithAI._count > 0 ? (agreeWithAIWins / agreeWithAI._count * 100) : 0
      },
      disagreeWithAI: {
        total: disagreeWithAI._count,
        wins: disagreeWithAIWins,
        winRate: disagreeWithAI._count > 0 ? (disagreeWithAIWins / disagreeWithAI._count * 100) : 0
      }
    });
    
  } catch (error) {
    console.error("Error fetching AI vs Humans stats:", error);
    res.status(500).json({
      error: "Failed to fetch stats"
    });
  }
});

export default router;
