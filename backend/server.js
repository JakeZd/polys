import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import cron from "node-cron";
import rateLimit from "express-rate-limit";
import { PrismaClient } from "@prisma/client";

import authRouter from "./routes/auth.js";
import marketsRouter from "./routes/markets.js";
import betsRouter from "./routes/bets.js";
import pointsRouter from "./routes/points.js";
import leaderboardRouter from "./routes/leaderboard.js";
import adminRouter from "./routes/admin.js";
import profileRouter from "./routes/profile.js";

import { AIBettingService } from "./services/aiBetting.js";
import { MarketService } from "./services/market.js";
import { SettlementService } from "./services/settlement.js";

dotenv.config();

const app = express();
const prisma = new PrismaClient();

const isDevelopment = process.env.NODE_ENV !== 'production';

app.use(helmet({
  contentSecurityPolicy: isDevelopment ? false : undefined,
  crossOriginEmbedderPolicy: false
}));

const allowedOrigins = process.env.FRONTEND_URL 
  ? process.env.FRONTEND_URL.split(',')
  : ['http://localhost:3000', 'http://127.0.0.1:3000'];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || isDevelopment) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static('public'));

const globalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    return req.path === '/health';
  }
});

app.use(globalLimiter);

app.get("/health", (req, res) => {
  res.json({
    service: "PolySynapse",
    status: "healthy",
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || "development"
  });
});

app.use("/api/auth", authRouter);
app.use("/api/markets", marketsRouter);
app.use("/api/bets", betsRouter);
app.use("/api/points", pointsRouter);
app.use("/api/leaderboard", leaderboardRouter);
app.use("/api/admin", adminRouter);
app.use("/api/profile", profileRouter);

const aiBettingService = new AIBettingService(prisma);
const marketService = new MarketService(prisma);
const settlementService = new SettlementService(prisma);

async function runAIBettingCycle() {
  try {
    console.log("\n" + "=".repeat(60));
    console.log("🤖 Starting AI betting cycle...");
    console.log("⏰ Time:", new Date().toLocaleString());
    console.log("=".repeat(60));
    
    const markets = await marketService.getActiveMarkets();
    console.log(`📊 Found ${markets.length} active markets matching criteria`);
    
    if (markets.length === 0) {
      console.log("⚠️  No markets available for betting");
      return [];
    }
    
    const aiBets = await aiBettingService.analyzeAndBet(markets);
    
    console.log("\n" + "=".repeat(60));
    console.log(`✅ AI betting cycle completed`);
    console.log(`📈 Total bets placed: ${aiBets.length}`);
    console.log("=".repeat(60) + "\n");
    
    await updateAIStats();
    
    return aiBets;
  } catch (error) {
    console.error("❌ AI betting cycle error:", error);
    return [];
  }
}

async function runSettlementCycle() {
  try {
    console.log("\n⚖️  Starting settlement cycle...");
    
    const marketsToSettle = await marketService.getMarketsToSettle();
    console.log(`📋 Found ${marketsToSettle.length} markets to settle`);
    
    for (const market of marketsToSettle) {
      await settlementService.settleMarket(market.id);
    }
    
    await updateUserStats();
    
    console.log("✅ Settlement cycle completed\n");
  } catch (error) {
    console.error("❌ Settlement cycle error:", error);
  }
}

async function updateAIStats() {
  const stats = await prisma.aIBet.aggregate({
    where: { settled: true },
    _count: true,
    _sum: { payout: true }
  });
  
  const wins = await prisma.aIBet.count({
    where: { settled: true, won: true }
  });
  
  const winRate = stats._count > 0 ? (wins / stats._count) * 100 : 0;
  
  await prisma.systemStats.upsert({
    where: { id: "main" },
    update: {
      aiWinRate: winRate,
      aiTotalBets: stats._count,
      aiTotalWins: wins
    },
    create: {
      id: "main",
      aiWinRate: winRate,
      aiTotalBets: stats._count,
      aiTotalWins: wins
    }
  });
}

async function updateUserStats() {
  const users = await prisma.user.findMany();
  
  for (const user of users) {
    const stats = await prisma.userBet.aggregate({
      where: { userId: user.id, settled: true },
      _count: true
    });
    
    const wins = await prisma.userBet.count({
      where: { userId: user.id, settled: true, won: true }
    });
    
    const winRate = stats._count > 0 ? (wins / stats._count * 100) : 0;
    
    await prisma.user.update({
      where: { id: user.id },
      data: {
        totalBets: stats._count,
        totalWins: wins,
        winRate: winRate
      }
    });
  }
}

async function checkExpiredMarkets() {
  try {
    console.log("\n🔍 Checking for expired markets...");
    
    const expiredMarkets = await prisma.market.findMany({
      where: {
        resolved: false,
        endTime: {
          lte: new Date()
        }
      },
      include: {
        aiBets: {
          where: { settled: false }
        }
      }
    });
    
    if (expiredMarkets.length > 0) {
      console.log(`⚠️  Found ${expiredMarkets.length} expired markets requiring settlement:`);
      
      for (const market of expiredMarkets) {
        const daysExpired = Math.floor((Date.now() - new Date(market.endTime).getTime()) / (1000 * 60 * 60 * 24));
        console.log(`   - ${market.question.substring(0, 60)}... (expired ${daysExpired} days ago)`);
        console.log(`     AI bets: ${market.aiBets.length} | User bets: waiting...`);
      }
      
      console.log("\n💡 To settle these markets, run:");
      console.log("   curl -X POST http://localhost:4000/api/admin/settlement/run \\");
      console.log("        -H 'x-admin-key: zdonuk'");
      console.log("");
    } else {
      console.log("✅ No expired markets found");
    }
    
  } catch (error) {
    console.error("❌ Error checking expired markets:", error);
  }
}

// Cron Jobs
cron.schedule("0 */2 * * *", runAIBettingCycle);

cron.schedule("*/30 * * * *", runSettlementCycle);

cron.schedule("*/5 * * * *", async () => {
  try {
    console.log("\n💹 Updating current prices for active bets...");
    await settlementService.updateCurrentPricesForActiveBets();
  } catch (error) {
    console.error("❌ Price update error:", error);
  }
});

cron.schedule("0 * * * *", checkExpiredMarkets);

cron.schedule("0 0 * * *", async () => {
  console.log("🔄 Daily reset...");
});

const PORT = process.env.PORT || 4000;
const server = app.listen(PORT, async () => {
  console.log(`
╔═══════════════════════════════════════════════╗
║      🧠 PolySynapse Server Started           ║
║         Neural Prediction Network            ║
║     Port: ${PORT}                         ║
║     Environment: ${process.env.NODE_ENV || 'development'}           ║
╚═══════════════════════════════════════════════╝
  `);
  
  console.log("📊 AI Configuration:");
  console.log(`   Confidence Threshold: ${process.env.AI_CONFIDENCE_THRESHOLD || '0.75'}`);
  console.log(`   Entry Price Range: ${process.env.AI_MIN_ENTRY_PRICE || '0.10'} - ${process.env.AI_MAX_ENTRY_PRICE || '0.85'}`);
  console.log(`   Min Expected Value: ${process.env.AI_MIN_EXPECTED_VALUE || '0'}`);
  console.log(`   Min Edge: ${process.env.AI_MIN_EDGE || '0.05'}`);
  console.log(`   Bets Per Category: ${process.env.AI_BETS_PER_CATEGORY || '2'}`);
  console.log(`   Max Market Days: ${process.env.AI_MAX_MARKET_DAYS || '7'}`);
  console.log(`   Categories: ${process.env.MARKET_CATEGORIES || 'politics,crypto,sports,finance,world,tech,science,pop-culture'}\n`);
  
  console.log("⏰ Scheduled Tasks:");
  console.log("   AI Betting: Every 2 hours");
  console.log("   Settlement: Every 30 minutes");
  console.log("   Price Update: Every 5 minutes ⚡");
  console.log("   Expired Markets Check: Every hour 🔍\n");
  
  if (process.env.RUN_AI_ON_START === "true") {
    console.log("⏰ Scheduling initial AI cycle in 5 seconds...");
    setTimeout(async () => {
      await runAIBettingCycle();
    }, 5000);
  } else {
    console.log("⚠️  AI auto-start disabled. Set RUN_AI_ON_START=true in .env to enable.");
    console.log("💡 Manual trigger: curl -X POST http://localhost:4000/api/admin/ai/run -H 'x-admin-key: zdonuk'\n");
  }
  
  // Запускаем проверку expired markets при старте
  console.log("🔍 Running initial expired markets check...");
  setTimeout(checkExpiredMarkets, 2000);
});

process.on("SIGINT", async () => {
  console.log("\n👋 Shutting down gracefully...");
  await prisma.$disconnect();
  process.exit(0);
});

export default app;