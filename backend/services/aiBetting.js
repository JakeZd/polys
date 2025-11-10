import OpenAI from "openai";
import axios from "axios";

export class AIBettingService {
  constructor(prisma) {
    this.prisma = prisma;

    // Make OpenAI optional - app works without AI features
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey && apiKey !== 'sk-demo-key-replace-for-ai-features') {
      this.openai = new OpenAI({ apiKey });
      this.aiEnabled = true;
    } else {
      this.openai = null;
      this.aiEnabled = false;
      console.warn('⚠️  OpenAI API key not configured. AI features disabled. Set OPENAI_API_KEY in .env to enable.');
    }

    this.confidence_threshold = parseFloat(process.env.AI_CONFIDENCE_THRESHOLD) || 0.75;
    this.min_entry_price = parseFloat(process.env.AI_MIN_ENTRY_PRICE) || 0.10;
    this.max_entry_price = parseFloat(process.env.AI_MAX_ENTRY_PRICE) || 0.85;
    this.min_expected_value = parseFloat(process.env.AI_MIN_EXPECTED_VALUE) || 0;
    this.min_edge = parseFloat(process.env.AI_MIN_EDGE) || 0.05;
    this.bets_per_category = parseInt(process.env.AI_BETS_PER_CATEGORY) || 2;
    this.stake_amount = parseInt(process.env.AI_STAKE_AMOUNT) || 100;
    this.categories = (process.env.MARKET_CATEGORIES || "politics,crypto").split(",");
  }

  async analyzeAndBet(markets) {
    // Check if AI is enabled
    if (!this.aiEnabled) {
      console.log('⚠️  AI analysis skipped - OpenAI not configured');
      return [];
    }

    const bets = [];
    const betsByCategory = {};

    this.categories.forEach(cat => {
      betsByCategory[cat] = [];
    });

    const targetTotal = this.categories.length * this.bets_per_category;
    const maxMarketsToAnalyze = parseInt(process.env.AI_MAX_MARKETS_TO_ANALYZE) || 1000;

    console.log(`\n🎯 AI Betting Configuration:`);
    console.log(`   Confidence Threshold: ${this.confidence_threshold * 100}%`);
    console.log(`   Entry Price Range: ${this.min_entry_price * 100}% - ${this.max_entry_price * 100}%`);
    console.log(`   Min Expected Value: ${this.min_expected_value}`);
    console.log(`   Min Edge: ${this.min_edge * 100}%`);
    console.log(`   Target: ${this.bets_per_category} bets per category (${targetTotal} total)`);
    console.log(`   Categories: ${this.categories.join(", ")}`);
    console.log(`   Max markets to analyze: ${maxMarketsToAnalyze}`);
    console.log(`   Stake Amount: ${this.stake_amount} points\n`);

    let marketsAnalyzed = 0;
    
    for (const market of markets) {
      if (marketsAnalyzed >= maxMarketsToAnalyze) {
        console.log(`\n⚠️  Reached max markets limit (${maxMarketsToAnalyze}). Stopping.`);
        break;
      }
      
      const category = market.category;
      
      if (!betsByCategory[category]) {
        continue;
      }
      
      if (betsByCategory[category].length >= this.bets_per_category) {
        continue;
      }
      
      marketsAnalyzed++;
      
      try {
        const existingBet = await this.prisma.aIBet.findFirst({
          where: { marketId: market.id }
        });
        
        if (existingBet) continue;
        
        const prices = await this.getMarketPrices(market);
        if (!prices) {
          console.log(`❌ No prices for: ${market.question.substring(0, 60)}...`);
          continue;
        }
        
        const yesPrice = prices.yesPrice;
        const noPrice = prices.noPrice;
        
        if (yesPrice < this.min_entry_price || yesPrice > this.max_entry_price) {
          if (noPrice < this.min_entry_price || noPrice > this.max_entry_price) {
            console.log(`⏭️  Price out of range [${this.min_entry_price}-${this.max_entry_price}]: ${market.question.substring(0, 50)}... (YES: ${yesPrice.toFixed(3)}, NO: ${noPrice.toFixed(3)})`);
            continue;
          }
        }
        
        const context = await this.gatherContext(market);
        const analysis = await this.analyzeMarket(market, prices, context);
        
        if (!analysis) continue;
        
        const entryPrice = analysis.side === "YES" ? prices.yesPrice : prices.noPrice;
        
        if (entryPrice < this.min_entry_price || entryPrice > this.max_entry_price) {
          console.log(`⏭️  Entry price ${entryPrice.toFixed(3)} out of range: ${market.question.substring(0, 50)}...`);
          continue;
        }
        
        if (analysis.confidence < this.confidence_threshold) {
          console.log(`⏭️  Low confidence ${(analysis.confidence * 100).toFixed(1)}%: ${market.question.substring(0, 50)}...`);
          continue;
        }
        
        if (analysis.expectedValue < this.min_expected_value) {
          console.log(`⏭️  Negative EV ${analysis.expectedValue.toFixed(2)}: ${market.question.substring(0, 50)}...`);
          continue;
        }
        
        if (analysis.edge < this.min_edge) {
          console.log(`⏭️  Low edge ${(analysis.edge * 100).toFixed(2)}%: ${market.question.substring(0, 50)}...`);
          continue;
        }
        
        const bet = await this.prisma.aIBet.create({
          data: {
            marketId: market.id,
            side: analysis.side,
            stake: this.stake_amount,
            entryPrice: entryPrice,
            confidence: analysis.confidence,
            reasoning: analysis.reasoning,
            expectedValue: analysis.expectedValue,
            edge: analysis.edge
          }
        });
        
        betsByCategory[category].push(bet);
        bets.push(bet);
        
        console.log(`✅ AI BET [${category.toUpperCase()}] #${betsByCategory[category].length}: ${market.question.substring(0, 50)}...`);
        console.log(`   Side: ${analysis.side} | Price: ${entryPrice.toFixed(3)} | Confidence: ${(analysis.confidence * 100).toFixed(1)}% | EV: ${analysis.expectedValue.toFixed(2)} | Edge: ${(analysis.edge * 100).toFixed(2)}%`);
        
        const allCategoriesFilled = this.categories.every(cat => 
          betsByCategory[cat] && betsByCategory[cat].length >= this.bets_per_category
        );
        
        if (allCategoriesFilled) {
          console.log(`\n🎉 Target reached! Got ${this.bets_per_category} bets from each category.`);
          break;
        }
        
      } catch (error) {
        console.error(`Error analyzing market ${market.id}:`, error.message);
      }
    }
    
    console.log(`\n📊 Analysis Statistics:`);
    console.log(`   Markets analyzed: ${marketsAnalyzed}`);
    console.log(`   Total bets placed: ${bets.length}/${targetTotal}`);
    
    console.log(`\n📊 Bets Summary by Category:`);
    this.categories.forEach(cat => {
      const count = betsByCategory[cat] ? betsByCategory[cat].length : 0;
      const emoji = count >= this.bets_per_category ? "✅" : "⚠️";
      console.log(`   ${emoji} ${cat}: ${count}/${this.bets_per_category} bets`);
    });
    
    return bets;
  }

  async getMarketPrices(market) {
    try {
      const response = await axios.get(
        `https://clob.polymarket.com/midpoint?token_id=${market.yesTokenId}`,
        { timeout: 10000 }
      );
      
      const yesPrice = parseFloat(response.data?.mid);
      
      if (!yesPrice || yesPrice <= 0 || yesPrice >= 1) {
        return null;
      }
      
      return {
        yesPrice: yesPrice,
        noPrice: 1 - yesPrice
      };
    } catch (error) {
      return null;
    }
  }

  async gatherContext(market) {
    const context = {
      question: market.question,
      description: market.description || "",
      category: market.category,
      endTime: market.endTime,
      currentTime: new Date()
    };
    
    return context;
  }

  async analyzeMarket(market, prices, context) {
    try {
      const prompt = this.buildAnalysisPrompt(market, prices, context);
      
      const response = await this.openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: `You are an expert prediction market analyst. Analyze the given market and provide:
1. Your prediction (YES or NO)
2. Confidence level (0.0 to 1.0)
3. Your estimated probability for YES outcome (0.0 to 1.0)
4. Brief reasoning (2-3 sentences in English)

Be objective and data-driven. Only recommend bets with strong edge and positive expected value.
Response format: JSON with fields: side, confidence, probability, reasoning`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 500
      });
      
      const analysis = JSON.parse(response.choices[0].message.content);
      
      if (!analysis.side || !["YES", "NO"].includes(analysis.side)) {
        return null;
      }
      
      const stake = this.stake_amount;
      const aiProb = analysis.side === "YES" ? (analysis.probability || 0.5) : (1 - (analysis.probability || 0.5));
      const marketProb = analysis.side === "YES" ? prices.yesPrice : prices.noPrice;
      const payout = stake / marketProb;
      const expectedValue = (aiProb * payout) - ((1 - aiProb) * stake);
      const edge = aiProb - marketProb;
      
      return {
        side: analysis.side,
        confidence: Math.min(Math.max(analysis.confidence || 0.5, 0), 1),
        expectedValue: expectedValue,
        edge: edge,
        reasoning: analysis.reasoning || `AI predicts ${analysis.side} based on available data and market analysis.`,
        probability: aiProb
      };
      
    } catch (error) {
      console.error("AI analysis error:", error.message);
      return null;
    }
  }

  buildAnalysisPrompt(market, prices, context) {
    const daysUntilEnd = Math.ceil((new Date(market.endTime) - new Date()) / (1000 * 60 * 60 * 24));
    
    return `
Market Question: ${market.question}
Category: ${market.category}
Description: ${market.description || "N/A"}

Current Market Prices:
- YES: ${(prices.yesPrice * 100).toFixed(1)}%
- NO: ${(prices.noPrice * 100).toFixed(1)}%

Market closes in: ${daysUntilEnd} days
Close date: ${market.endTime}

Analyze this prediction market. What is the most likely outcome?
Consider base rates, market efficiency, and time until resolution.
Provide your true probability estimate for the YES outcome.
`;
  }
}