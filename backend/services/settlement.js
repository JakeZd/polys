import axios from "axios";

export class SettlementService {
  constructor(prisma) {
    this.prisma = prisma;
    this.clobAPI = "https://clob.polymarket.com";
  }

  async updateCurrentPricesForActiveBets() {
    try {
      console.log("\n🔄 Updating current prices for active bets...");
      
      const activeBets = await this.prisma.aIBet.findMany({
        where: { settled: false },
        include: { market: true }
      });
      
      console.log(`📊 Found ${activeBets.length} active AI bets to update`);
      
      const uniqueMarkets = new Map();
      activeBets.forEach(bet => {
        uniqueMarkets.set(bet.market.id, bet.market);
      });
      
      console.log(`📊 Unique markets: ${uniqueMarkets.size}`);
      
      const pricePromises = [];
      const batchSize = 10;
      const markets = Array.from(uniqueMarkets.values());
      
      for (let i = 0; i < markets.length; i += batchSize) {
        const batch = markets.slice(i, i + batchSize);
        const batchPromises = batch.map(async (market) => {
          try {
            const yesResponse = await axios.get(
              `${this.clobAPI}/midpoint?token_id=${market.yesTokenId}`,
              { timeout: 3000 }
            );
            
            const yesPrice = parseFloat(yesResponse.data?.mid);
            
            if (yesPrice && yesPrice > 0 && yesPrice < 1) {
              return {
                marketId: market.id,
                yesPrice,
                noPrice: 1 - yesPrice
              };
            }
          } catch (error) {
            return null;
          }
          return null;
        });
        
        pricePromises.push(...batchPromises);
        
        if (i + batchSize < markets.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      const prices = await Promise.all(pricePromises);
      const validPrices = prices.filter(p => p !== null);
      
      console.log(`✅ Got ${validPrices.length} valid prices out of ${uniqueMarkets.size}`);
      
      const priceMap = new Map();
      validPrices.forEach(p => {
        priceMap.set(p.marketId, p);
      });
      
      let updated = 0;
      let failed = 0;
      
      for (const bet of activeBets) {
        const marketPrices = priceMap.get(bet.market.id);
        
        if (marketPrices) {
          try {
            const currentPrice = bet.side === "YES" ? marketPrices.yesPrice : marketPrices.noPrice;
            
            await this.prisma.aIBet.update({
              where: { id: bet.id },
              data: {
                currentPrice: currentPrice,
                updatedAt: new Date()
              }
            });
            
            updated++;
          } catch (error) {
            failed++;
          }
        } else {
          failed++;
        }
      }
      
      for (const [marketId, prices] of priceMap) {
        try {
          await this.prisma.priceSnapshot.create({
            data: {
              marketId: marketId,
              yesPrice: prices.yesPrice,
              noPrice: prices.noPrice
            }
          });
        } catch (error) {
        }
      }
      
      const userBets = await this.prisma.userBet.findMany({
        where: { settled: false },
        include: { market: true }
      });
      
      console.log(`📊 Found ${userBets.length} active user bets to update`);
      
      for (const bet of userBets) {
        const marketPrices = priceMap.get(bet.market.id);
        
        if (marketPrices) {
          try {
            const currentPrice = bet.side === "YES" ? marketPrices.yesPrice : marketPrices.noPrice;
            
            await this.prisma.userBet.update({
              where: { id: bet.id },
              data: {
                currentPrice: currentPrice,
                updatedAt: new Date()
              }
            });
            updated++;
          } catch (error) {
            failed++;
          }
        }
      }
      
      console.log(`✅ Updated ${updated} prices, ${failed} failed\n`);
      return { updated, failed };
    } catch (error) {
      console.error("Error updating current prices:", error);
      return { updated: 0, failed: 0 };
    }
  }

  async settleMarket(marketId) {
    try {
      const market = await this.prisma.market.findUnique({
        where: { id: marketId }
      });
      
      if (!market || market.resolved) {
        return false;
      }
      
      const outcome = await this.getMarketOutcome(market.polymarketId);
      
      if (!outcome) {
        console.log(`Market ${marketId} not resolved yet`);
        return false;
      }
      
      await this.prisma.market.update({
        where: { id: marketId },
        data: {
          resolved: true,
          outcome: outcome
        }
      });
      
      if (outcome === "CANCELLED") {
        await this.refundBets(marketId);
      } else {
        await this.settleAIBets(marketId, outcome);
        await this.settleUserBets(marketId, outcome);
      }
      
      console.log(`✅ Market ${marketId} settled with outcome: ${outcome}`);
      
      return true;
    } catch (error) {
      console.error(`Error settling market ${marketId}:`, error);
      return false;
    }
  }

  async refundBets(marketId) {
    const aiBets = await this.prisma.aIBet.findMany({
      where: {
        marketId: marketId,
        settled: false
      }
    });
    
    for (const bet of aiBets) {
      await this.prisma.aIBet.update({
        where: { id: bet.id },
        data: {
          settled: true,
          won: null,
          payout: bet.stake
        }
      });
    }
    
    const userBets = await this.prisma.userBet.findMany({
      where: {
        marketId: marketId,
        settled: false
      }
    });
    
    for (const bet of userBets) {
      const user = await this.prisma.user.findUnique({
        where: { id: bet.userId }
      });
      
      await this.prisma.$transaction([
        this.prisma.userBet.update({
          where: { id: bet.id },
          data: {
            settled: true,
            won: null,
            payout: bet.stake,
            settledAt: new Date()
          }
        }),
        
        this.prisma.user.update({
          where: { id: bet.userId },
          data: {
            points: { increment: bet.stake }
          }
        }),
        
        this.prisma.pointsLedger.create({
          data: {
            userId: bet.userId,
            wallet: user.wallet,
            amount: bet.stake,
            type: "bet_refunded",
            reason: `Market ${marketId} cancelled - refund`
          }
        })
      ]);
    }
  }

  async getMarketOutcome(polymarketId) {
    try {
      const response = await axios.get(
        `https://gamma-api.polymarket.com/markets/${polymarketId}`,
        { timeout: 10000 }
      );
      
      const market = response.data;
      
      if (market.resolved && market.outcome !== null && market.outcome !== undefined) {
        const outcomeIndex = parseInt(market.outcome);
        const outcomes = JSON.parse(market.outcomes || "[]");
        
        if (outcomes[outcomeIndex]) {
          const outcome = outcomes[outcomeIndex].toUpperCase();
          if (outcome === "YES" || outcome === "NO") {
            return outcome;
          }
        }
        
        return "CANCELLED";
      }
      
      return null;
    } catch (error) {
      console.error("Error getting market outcome:", error.message);
      return null;
    }
  }

  async settleAIBets(marketId, outcome) {
    const aiBets = await this.prisma.aIBet.findMany({
      where: {
        marketId: marketId,
        settled: false
      }
    });
    
    for (const bet of aiBets) {
      const won = bet.side === outcome;
      const payout = won ? Math.round(bet.stake / bet.entryPrice) : 0;
      
      await this.prisma.aIBet.update({
        where: { id: bet.id },
        data: {
          settled: true,
          won: won,
          payout: payout
        }
      });
    }
  }

  async settleUserBets(marketId, outcome) {
    const userBets = await this.prisma.userBet.findMany({
      where: {
        marketId: marketId,
        settled: false
      },
      include: {
        market: {
          include: {
            aiBets: {
              orderBy: { createdAt: 'asc' },
              take: 1
            }
          }
        }
      }
    });
    
    for (const bet of userBets) {
      const won = (bet.side === outcome);
      const payout = won ? Math.round(bet.stake / bet.entryPrice) : 0;
      
      await this.prisma.userBet.update({
        where: { id: bet.id },
        data: {
          settled: true,
          won: won,
          payout: payout,
          settledAt: new Date()
        }
      });
      
      if (won && payout > 0) {
        const user = await this.prisma.user.findUnique({
          where: { id: bet.userId }
        });
        
        await this.prisma.$transaction([
          this.prisma.user.update({
            where: { id: bet.userId },
            data: {
              points: { increment: payout },
              totalWins: { increment: 1 }
            }
          }),
          
          this.prisma.pointsLedger.create({
            data: {
              userId: bet.userId,
              wallet: user.wallet,
              amount: payout,
              type: "bet_won",
              reason: `Won bet on market ${marketId}`
            }
          })
        ]);
      } else {
        await this.prisma.user.update({
          where: { id: bet.userId },
          data: {
            totalBets: { increment: 1 }
          }
        });
      }
    }
  }

  async getUnsettledBets(userId = null) {
    const where = { settled: false };
    if (userId) {
      where.userId = userId;
    }
    
    return await this.prisma.userBet.findMany({
      where,
      include: {
        market: true,
        user: true
      },
      orderBy: { placedAt: 'desc' }
    });
  }

  async getSettledBets(userId = null, limit = 50) {
    const where = { settled: true };
    if (userId) {
      where.userId = userId;
    }
    
    return await this.prisma.userBet.findMany({
      where,
      include: {
        market: true,
        user: true
      },
      orderBy: { settledAt: 'desc' },
      take: limit
    });
  }
}