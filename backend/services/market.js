import axios from "axios";

export class MarketService {
  constructor(prisma) {
    this.prisma = prisma;
    this.gammaAPI = "https://gamma-api.polymarket.com";
    this.clobAPI = "https://clob.polymarket.com";
    
    this.maxMarketDays = parseInt(process.env.AI_MAX_MARKET_DAYS) || 7;
    this.minVolume = parseFloat(process.env.AI_MIN_VOLUME) || 1000;
    this.categories = (process.env.MARKET_CATEGORIES || "politics,crypto").split(",");
    this.marketsPerCategory = parseInt(process.env.MARKETS_PER_CATEGORY) || 5;
  }

  async getActiveMarkets(limit = 100) {
    try {
      const markets = await this.fetchMarketsFromPolymarket();

      for (const market of markets) {
        await this.prisma.market.upsert({
          where: { polymarketId: market.id },
          update: {
            volume: market.volume,
            liquidity: market.liquidity,
            updatedAt: new Date()
          },
          create: {
            polymarketId: market.id,
            question: market.question,
            description: market.description || "",
            category: market.category || "general",
            yesTokenId: market.yesTokenId,
            noTokenId: market.noTokenId,
            endTime: market.endTime,
            volume: market.volume,
            liquidity: market.liquidity
          }
        });
      }

      const now = new Date();
      const maxEndDate = new Date();
      maxEndDate.setDate(maxEndDate.getDate() + this.maxMarketDays);

      const activeMarkets = await this.prisma.market.findMany({
        where: {
          resolved: false,
          endTime: { 
            gt: now,
            lte: maxEndDate
          },
          volume: {
            gte: this.minVolume
          }
        },
        orderBy: [
          { volume: 'desc' },
          { createdAt: 'desc' }
        ]
      });
      
      console.log(`\n📊 Market Filters Applied:`);
      console.log(`   Max days until end: ${this.maxMarketDays}`);
      console.log(`   Min volume: $${this.minVolume}`);
      console.log(`   Categories: ${this.categories.join(", ")}`);
      console.log(`   Markets per category: ${this.marketsPerCategory}`);
      console.log(`   Total active markets: ${activeMarkets.length}\n`);
      
      return activeMarkets;
    } catch (error) {
      console.error("Error fetching active markets:", error);
      return [];
    }
  }

  async fetchMarketsFromPolymarket() {
    const allMarkets = [];

    for (const category of this.categories) {
      try {
        const response = await axios.get(
            `${this.gammaAPI}/events/pagination`,
            {
              params: {
                tag_slug: category,
                closed: false,
                active: true,
                archived: false,
                limit: this.marketsPerCategory,
                order: "volume24hr",
                ascending: false
              },
              timeout: 15000
            }
        );

        if (response.data && response.data.data && Array.isArray(response.data.data)) {
          for (const event of response.data.data) {
            if (event.markets && Array.isArray(event.markets)) {
              for (const market of event.markets) {
                const parsed = this.parseMarket(market, category);
                if (parsed) {
                  allMarkets.push(parsed);
                }
              }
            }
          }
        }
      } catch (error) {
        console.error(`Error fetching ${category} markets:`, error.message);
      }
    }

    return allMarkets;
  }

  parseMarket(raw, category) {
    try {
      if (!raw.id || !raw.question) return null;

      let outcomes = raw.outcomes;
      if (typeof outcomes === "string") {
        try {
          outcomes = JSON.parse(outcomes);
        } catch {
          return null;
        }
      }

      let tokenIds = raw.clobTokenIds;
      if (typeof tokenIds === "string") {
        try {
          tokenIds = JSON.parse(tokenIds);
        } catch {
          return null;
        }
      }

      if (!Array.isArray(outcomes) || outcomes.length !== 2) return null;
      if (!Array.isArray(tokenIds) || tokenIds.length !== 2) return null;

      const yesIndex = outcomes.findIndex(o =>
          o.toString().toUpperCase() === "YES"
      );
      const noIndex = outcomes.findIndex(o =>
          o.toString().toUpperCase() === "NO"
      );

      if (yesIndex === -1 || noIndex === -1) return null;

      const endDateRaw = raw.endDate || raw.end_date || raw.closeDate;
      if (!endDateRaw) {
        return null;
      }

      const endDate = new Date(endDateRaw);
      if (isNaN(endDate.getTime())) {
        return null;
      }

      const now = new Date();
      if (endDate <= now) {
        return null;
      }
      
      const daysUntilEnd = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
      const maxDays = parseInt(process.env.AI_MAX_MARKET_DAYS) || 7;
      
      if (daysUntilEnd > maxDays) {
        return null;
      }
      
      const volume = parseFloat(raw.volumeNum || raw.volume || 0);
      const minVolume = parseFloat(process.env.AI_MIN_VOLUME) || 1000;
      
      if (volume < minVolume) {
        return null;
      }

      return {
        id: raw.id,
        question: raw.question || raw.title,
        description: raw.description || "",
        category: category,
        yesTokenId: tokenIds[yesIndex],
        noTokenId: tokenIds[noIndex],
        endTime: endDate,
        volume: volume,
        liquidity: parseFloat(raw.liquidityNum || raw.liquidity || 0)
      };
    } catch (error) {
      return null;
    }
  }

  async getMarketById(marketId) {
    return await this.prisma.market.findUnique({
      where: { id: marketId },
      include: {
        aiBets: {
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        priceHistory: {
          orderBy: { timestamp: 'desc' },
          take: 100
        }
      }
    });
  }

  async getMarketsToSettle() {
    return await this.prisma.market.findMany({
      where: {
        resolved: false,
        endTime: { lt: new Date() }
      }
    });
  }

  async updateMarketPrices(marketId) {
    const market = await this.prisma.market.findUnique({
      where: { id: marketId }
    });

    if (!market) return null;

    try {
      const yesResponse = await axios.get(
          `${this.clobAPI}/midpoint?token_id=${market.yesTokenId}`,
          { timeout: 10000 }
      );

      const yesPrice = parseFloat(yesResponse.data?.mid);

      if (yesPrice && yesPrice > 0 && yesPrice < 1) {
        await this.prisma.priceSnapshot.create({
          data: {
            marketId: marketId,
            yesPrice: yesPrice,
            noPrice: 1 - yesPrice
          }
        });

        return {
          yesPrice,
          noPrice: 1 - yesPrice
        };
      }
    } catch (error) {
    }

    return null;
  }

  async searchMarkets(query) {
    return await this.prisma.market.findMany({
      where: {
        OR: [
          { question: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { category: { contains: query, mode: 'insensitive' } }
        ],
        resolved: false,
        endTime: { gt: new Date() }
      },
      orderBy: { volume: 'desc' },
      take: 20
    });
  }
}