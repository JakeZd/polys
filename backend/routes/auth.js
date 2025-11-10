import express from "express";
import rateLimit from "express-rate-limit";
import { ethers } from "ethers";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const router = express.Router();
const prisma = new PrismaClient();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const checkinLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 3,
  message: 'Too many checkin attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const generateNonce = () => {
  return Math.floor(Math.random() * 1000000).toString();
};

export const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    
    if (!token) {
      return res.status(401).json({ 
        error: "No token provided" 
      });
    }
    
    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || "your-secret-key"
    );
    
    req.userId = decoded.userId;
    req.wallet = decoded.wallet;
    
    next();
  } catch (error) {
    res.status(401).json({ 
      error: "Invalid token" 
    });
  }
};

router.get("/nonce/:wallet", authLimiter, async (req, res) => {
  try {
    const wallet = req.params.wallet.toLowerCase();
    
    if (!ethers.isAddress(wallet)) {
      return res.status(400).json({ 
        error: "Invalid wallet address" 
      });
    }
    
    const nonce = generateNonce();
    const message = `Welcome to PolySynapse!\n\nSign this message to authenticate with the Neural Prediction Network.\n\nNonce: ${nonce}`;
    
    global.nonceCache = global.nonceCache || {};
    global.nonceCache[wallet] = {
      nonce,
      message,
      timestamp: Date.now()
    };
    
    res.json({ message, nonce });
  } catch (error) {
    console.error("Nonce generation error:", error);
    res.status(500).json({ error: "Failed to generate nonce" });
  }
});

router.post("/verify", authLimiter, async (req, res) => {
  try {
    const { wallet, signature, message } = req.body;
    
    if (!wallet || !signature || !message) {
      return res.status(400).json({ 
        error: "Missing required fields" 
      });
    }
    
    const walletLower = wallet.toLowerCase();
    
    if (!global.nonceCache || !global.nonceCache[walletLower]) {
      return res.status(400).json({ 
        error: "Invalid or expired nonce" 
      });
    }
    
    const cachedData = global.nonceCache[walletLower];
    
    if (Date.now() - cachedData.timestamp > 5 * 60 * 1000) {
      delete global.nonceCache[walletLower];
      return res.status(400).json({ 
        error: "Nonce expired" 
      });
    }
    
    const recoveredAddress = ethers.verifyMessage(message, signature);
    
    if (recoveredAddress.toLowerCase() !== walletLower) {
      return res.status(401).json({ 
        error: "Invalid signature" 
      });
    }
    
    delete global.nonceCache[walletLower];
    
    let user = await prisma.user.findUnique({
      where: { wallet: walletLower }
    });
    
    let isNewUser = false;
    
    if (!user) {
      user = await prisma.user.create({
        data: {
          wallet: walletLower,
          points: 1000
        }
      });
      
      await prisma.pointsLedger.create({
        data: {
          userId: user.id,
          wallet: walletLower,
          amount: 1000,
          type: "signup",
          reason: "Welcome bonus"
        }
      });
      
      isNewUser = true;
    }
    
    const token = jwt.sign(
      {
        userId: user.id,
        wallet: user.wallet
      },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "7d" }
    );
    
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        wallet: user.wallet,
        points: user.points,
        winRate: user.winRate,
        totalBets: user.totalBets,
        totalWins: user.totalWins,
        streakDays: user.streakDays,
        isNewUser
      }
    });
    
  } catch (error) {
    console.error("Verification error:", error);
    res.status(500).json({ 
      error: "Authentication failed" 
    });
  }
});

// NEW: Проверка токена
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId }
    });
    
    if (!user) {
      return res.status(404).json({
        error: "User not found"
      });
    }
    
    res.json({
      success: true,
      user: {
        id: user.id,
        wallet: user.wallet,
        points: user.points,
        winRate: user.winRate,
        totalBets: user.totalBets,
        totalWins: user.totalWins,
        streakDays: user.streakDays
      }
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({
      error: "Failed to get user data"
    });
  }
});

router.post("/checkin", checkinLimiter, async (req, res) => {
  try {
    const { userId, signature } = req.body;
    
    if (!userId || !signature) {
      return res.status(400).json({ 
        error: "Missing required fields" 
      });
    }
    
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user) {
      return res.status(404).json({ 
        error: "User not found" 
      });
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (user.lastCheckin) {
      const lastCheckin = new Date(user.lastCheckin);
      lastCheckin.setHours(0, 0, 0, 0);
      
      if (lastCheckin.getTime() === today.getTime()) {
        return res.status(400).json({ 
          error: "Already checked in today" 
        });
      }
    }
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    let streakDays = 1;
    
    if (user.lastCheckin) {
      const lastCheckin = new Date(user.lastCheckin);
      lastCheckin.setHours(0, 0, 0, 0);
      
      if (lastCheckin.getTime() === yesterday.getTime()) {
        streakDays = (user.streakDays || 0) + 1;
      }
    }
    
    const streakRewards = [
      10, 15, 20, 25, 30, 40, 50, 60, 70, 100,
      110, 120, 130, 140, 150, 175, 200, 225, 250, 300,
      350, 400, 450, 500, 600, 700, 800, 950, 1000, 1500
    ];
    
    const rewardIndex = Math.min(streakDays - 1, streakRewards.length - 1);
    const points = streakRewards[rewardIndex];
    
    await prisma.$transaction([
      prisma.checkin.create({
        data: {
          userId: userId,
          wallet: user.wallet,
          day: streakDays,
          points: points,
          signature: signature
        }
      }),
      
      prisma.user.update({
        where: { id: userId },
        data: {
          points: { increment: points },
          streakDays: streakDays,
          lastCheckin: new Date()
        }
      }),
      
      prisma.pointsLedger.create({
        data: {
          userId: userId,
          wallet: user.wallet,
          amount: points,
          type: "checkin",
          reason: `Daily check-in - Day ${streakDays}`
        }
      })
    ]);
    
    res.json({
      success: true,
      streakDays: streakDays,
      points: points,
      message: `Day ${streakDays} check-in complete!`
    });
    
  } catch (error) {
    console.error("Check-in error:", error);
    res.status(500).json({ 
      error: "Check-in failed" 
    });
  }
});

export default router;