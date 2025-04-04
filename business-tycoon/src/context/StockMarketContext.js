import React, { createContext, useContext, useReducer, useEffect, useState, useRef } from 'react';
import { useGame } from './GameContext';
import { 
  companies, 
  marketIndices, 
  volatilityFactors, 
  marketNewsEvents,
  companyActions,
  getMarketStatusMessage,
  generateCompanies,
  newsEvents,
  marketSectors,
  getRealWorldTicker
} from '../data/stockMarketData';

// Initialize stock data with current prices and history
const initializeStockData = () => {
  const initializedCompanies = companies.map(company => ({
    ...company,
    currentPrice: company.basePrice,
    previousPrice: company.basePrice,
    priceHistory: Array(50).fill(company.basePrice).map(price => 
      price * (1 + (Math.random() * 0.1 - 0.05))
    ),
    percentChange: 0,
    volume: Math.floor(Math.random() * 10000000),
    dayHigh: company.basePrice * 1.01,
    dayLow: company.basePrice * 0.99,
    weekHigh: company.basePrice * 1.05,
    weekLow: company.basePrice * 0.95,
    trending: 'neutral',
    owned: 0,
    transactions: [],
    companyOwned: false,
    recentNews: null,
    // Add new fields for price tracking and betting
    lastRecordedPrice: company.basePrice,
    priceDirection: 'neutral',
    priceChangeTime: Date.now(),
    bets: { up: 0, down: 0 },
    betHistory: [],
    // Supply/demand factors
    buyPressure: 0,
    sellPressure: 0,
    priceTrend: 0 // Value between -1 and 1 indicating trend
  }));

  const initializedIndices = marketIndices.map(index => ({
    ...index,
    currentValue: index.baseValue,
    previousValue: index.baseValue,
    valueHistory: Array(50).fill(index.baseValue).map(value => 
      value * (1 + (Math.random() * 0.08 - 0.04))
    ),
    percentChange: 0,
    trending: 'neutral'
  }));

  // Calculate initial NOW Average value
  const initialAverage = calculateNOWAverage(initializedCompanies);

  return {
    companies: initializedCompanies,
    indices: initializedIndices,
    news: [],
    marketStatus: "Market Opening: Trading begins for the day",
    lastUpdate: new Date().toLocaleTimeString(),
    playerOwnedStocks: [],
    transactionHistory: [],
    watchlist: [],
    marketDay: 1,
    marketHour: 9,
    marketMinute: 30,
    marketOpen: true,
    marketTrend: 'neutral',
    marketMood: 0, // Range from -10 (bearish) to +10 (bullish)
    nowAverage: {
      currentValue: initialAverage,
      previousValue: initialAverage,
      valueHistory: Array(50).fill(initialAverage).map(value => 
        value * (1 + (Math.random() * 0.05 - 0.025))
      ),
      percentChange: 0,
      trending: 'neutral',
      name: 'NOW Average',
      description: 'Average of all stocks currently trading on the market'
    },
    // Add field to track when last 30-sec price record was made
    lastPriceRecordTime: Date.now()
  };
};

// Function to calculate the NOW Average - average price of all stocks
const calculateNOWAverage = (companies) => {
  if (!companies || companies.length === 0) return 0;
  const sum = companies.reduce((total, company) => total + company.currentPrice, 0);
  return sum / companies.length;
};

// Add a cache to store real-world data
const realWorldDataCache = {};

// Function to fetch real-world price history
export const fetchRealWorldPriceHistory = async (ticker, days = 30) => {
  // Check if we have cached data and it's not too old (less than 1 hour old)
  const cacheKey = `${ticker}_${days}`;
  const cachedData = realWorldDataCache[cacheKey];
  
  if (cachedData && (Date.now() - cachedData.timestamp < 3600000)) {
    return cachedData.data;
  }
  
  try {
    // Use Alpha Vantage free API for demo, but in a real app you'd want to use a better provider
    // Note: Alpha Vantage has rate limits (5 API requests per minute and 500 per day)
    const response = await fetch(
      `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${ticker}&apikey=demo`
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Handle API error responses
    if (data['Error Message']) {
      throw new Error(data['Error Message']);
    }
    
    // Process the data - Alpha Vantage returns most recent first
    const timeSeries = data['Time Series (Daily)'];
    
    if (!timeSeries) {
      // If we hit API limits or another issue, generate fallback data
      return generateFallbackPriceData(ticker);
    }
    
    // Convert to array of prices (closing prices)
    const priceHistory = Object.keys(timeSeries)
      .slice(0, days) // Take only the days we need
      .map(date => parseFloat(timeSeries[date]['4. close']))
      .reverse(); // Reverse so oldest is first
    
    // Cache the data
    realWorldDataCache[cacheKey] = {
      data: priceHistory,
      timestamp: Date.now()
    };
    
    return priceHistory;
  } catch (error) {
    console.error(`Error fetching real-world data for ${ticker}:`, error);
    // On error, generate fallback data
    return generateFallbackPriceData(ticker);
  }
};

// Generate fallback data that looks realistic when API calls fail
const generateFallbackPriceData = (ticker) => {
  // Start with a base price based on ticker length (just for variety)
  const basePrice = 50 + (ticker.length * 10);
  const volatility = 0.01 + (Math.random() * 0.02);
  
  // Generate 30 days of somewhat realistic-looking price data
  let currentPrice = basePrice;
  const priceHistory = [currentPrice];
  
  for (let i = 1; i < 30; i++) {
    // Use a random walk with some trend
    const trend = Math.sin(i / 5) * 0.003; // Slight sine wave trend
    const randomComponent = (Math.random() - 0.5) * volatility * currentPrice;
    
    // Calculate next price
    currentPrice = currentPrice * (1 + trend) + randomComponent;
    currentPrice = Math.max(currentPrice, basePrice * 0.5); // Prevent going too low
    
    priceHistory.push(currentPrice);
  }
  
  return priceHistory;
};

// Stock market reducer
const stockMarketReducer = (state, action) => {
  switch (action.type) {
    case 'UPDATE_STOCK_PRICES':
      return {
        ...state,
        companies: action.payload.companies,
        indices: action.payload.indices,
        nowAverage: action.payload.nowAverage,
        lastUpdate: new Date().toLocaleTimeString(),
        marketStatus: action.payload.marketStatus,
        marketTrend: action.payload.marketTrend,
        marketMood: action.payload.marketMood
      };

    case 'ADD_NEWS':
      return {
        ...state,
        news: [action.payload, ...state.news].slice(0, 15)
      };

    case 'BUY_STOCK':
      const buyStockAction = action.payload;
      
      // Update company ownership and add buy pressure to affect price
      const updatedCompanies = state.companies.map(company => {
        if (company.id === buyStockAction.stockId) {
          const newOwnedAmount = company.owned + buyStockAction.shares;
          
          // Calculate buy pressure based on volume relative to total shares
          const relativeBuyVolume = buyStockAction.shares / company.totalShares;
          const newBuyPressure = company.buyPressure + (relativeBuyVolume * 5);
          
          return {
            ...company,
            owned: newOwnedAmount,
            transactions: [
              { 
                type: 'buy', 
                shares: buyStockAction.shares, 
                price: buyStockAction.price, 
                total: buyStockAction.total, 
                date: new Date().toISOString() 
              },
              ...company.transactions
            ],
            // If player owns more than 51% of shares, they control the company
            companyOwned: newOwnedAmount > (company.totalShares * 0.51),
            // Add buy pressure to affect future price calculations
            buyPressure: newBuyPressure,
            // Reduce sell pressure as stock is being bought
            sellPressure: Math.max(0, company.sellPressure - (relativeBuyVolume * 2))
          };
        }
        return company;
      });
      
      // Add to transaction history
      const newTransaction = {
        id: Date.now(),
        type: 'buy',
        stockId: buyStockAction.stockId,
        shares: buyStockAction.shares,
        price: buyStockAction.price,
        total: buyStockAction.total,
        date: new Date().toISOString()
      };
      
      // Update player owned stocks list
      let updatedOwnedStocks = [...state.playerOwnedStocks];
      const existingIndex = updatedOwnedStocks.findIndex(s => s.stockId === buyStockAction.stockId);
      
      if (existingIndex >= 0) {
        // Update existing holding
        updatedOwnedStocks[existingIndex] = {
          ...updatedOwnedStocks[existingIndex],
          shares: updatedOwnedStocks[existingIndex].shares + buyStockAction.shares,
          averagePrice: (updatedOwnedStocks[existingIndex].totalInvested + buyStockAction.total) / 
                       (updatedOwnedStocks[existingIndex].shares + buyStockAction.shares),
          totalInvested: updatedOwnedStocks[existingIndex].totalInvested + buyStockAction.total
        };
      } else {
        // Add new holding
        updatedOwnedStocks.push({
          stockId: buyStockAction.stockId,
          shares: buyStockAction.shares,
          averagePrice: buyStockAction.price,
          totalInvested: buyStockAction.total,
          purchaseDate: new Date().toISOString()
        });
      }
      
      return {
        ...state,
        companies: updatedCompanies,
        transactionHistory: [newTransaction, ...state.transactionHistory],
        playerOwnedStocks: updatedOwnedStocks
      };

    case 'SELL_STOCK':
      const sellDetails = action.payload;
      
      // Update company ownership and add sell pressure
      const companiesAfterSell = state.companies.map(company => {
        if (company.id === sellDetails.stockId) {
          const newOwnedAmount = company.owned - sellDetails.shares;
          
          // Calculate sell pressure based on volume relative to total shares
          const relativeSellVolume = sellDetails.shares / company.totalShares;
          const newSellPressure = company.sellPressure + (relativeSellVolume * 5);
          
          return {
            ...company,
            owned: newOwnedAmount,
            transactions: [
              { 
                type: 'sell', 
                shares: sellDetails.shares, 
                price: sellDetails.price, 
                total: sellDetails.total, 
                date: new Date().toISOString() 
              },
              ...company.transactions
            ],
            companyOwned: newOwnedAmount > (company.totalShares * 0.51),
            // Add sell pressure to affect future price calculations
            sellPressure: newSellPressure,
            // Reduce buy pressure as stock is being sold
            buyPressure: Math.max(0, company.buyPressure - (relativeSellVolume * 2))
          };
        }
        return company;
      });
      
      // Add to transaction history
      const sellTransaction = {
        id: Date.now(),
        type: 'sell',
        stockId: sellDetails.stockId,
        shares: sellDetails.shares,
        price: sellDetails.price,
        total: sellDetails.total,
        date: new Date().toISOString()
      };
      
      // Update player owned stocks list
      let ownedStocksAfterSell = [...state.playerOwnedStocks];
      const stockIndex = ownedStocksAfterSell.findIndex(s => s.stockId === sellDetails.stockId);
      
      if (stockIndex >= 0) {
        if (ownedStocksAfterSell[stockIndex].shares === sellDetails.shares) {
          // Remove the stock entirely if all shares sold
          ownedStocksAfterSell = ownedStocksAfterSell.filter((_, i) => i !== stockIndex);
        } else {
          // Update holding with remaining shares
          ownedStocksAfterSell[stockIndex] = {
            ...ownedStocksAfterSell[stockIndex],
            shares: ownedStocksAfterSell[stockIndex].shares - sellDetails.shares,
            // Keep average price the same
            totalInvested: ownedStocksAfterSell[stockIndex].totalInvested - 
                          (ownedStocksAfterSell[stockIndex].averagePrice * sellDetails.shares)
          };
        }
      }
      
      return {
        ...state,
        companies: companiesAfterSell,
        transactionHistory: [sellTransaction, ...state.transactionHistory],
        playerOwnedStocks: ownedStocksAfterSell
      };

    case 'ADD_TO_WATCHLIST':
      if (!state.watchlist.includes(action.payload)) {
        return {
          ...state,
          watchlist: [...state.watchlist, action.payload]
        };
      }
      return state;

    case 'REMOVE_FROM_WATCHLIST':
      return {
        ...state,
        watchlist: state.watchlist.filter(id => id !== action.payload)
      };

    case 'COMPANY_ACTION':
      const { companyId, action: companyAction, impact } = action.payload;
      
      // Add news about the company action
      const actionNews = {
        id: Date.now(),
        headline: `${state.companies.find(c => c.id === companyId).name} ${companyAction.action}`,
        content: companyAction.description,
        impact: impact > 0 ? 'positive' : 'negative',
        timestamp: new Date().toISOString(),
        companyId
      };
      
      return {
        ...state,
        news: [actionNews, ...state.news].slice(0, 15),
        companies: state.companies.map(company => {
          if (company.id === companyId) {
            const newPrice = company.currentPrice * (1 + impact);
            return {
              ...company,
              previousPrice: company.currentPrice,
              currentPrice: newPrice,
              priceHistory: [...company.priceHistory, newPrice].slice(-50),
              percentChange: ((newPrice / company.previousPrice) - 1) * 100,
              trending: impact > 0 ? 'up' : 'down',
              recentNews: actionNews
            };
          }
          return company;
        })
      };

    case 'ADVANCE_MARKET_TIME':
      const { newHour, newMinute, newDay, isOpen } = action.payload;
      return {
        ...state,
        marketHour: newHour,
        marketMinute: newMinute,
        marketDay: newDay || state.marketDay,
        marketOpen: isOpen
      };

    case 'SET_REAL_WORLD_PRICE_HISTORY':
      return {
        ...state,
        companies: state.companies.map(company => 
          company.id === action.payload.id 
            ? { 
                ...company, 
                realWorldPriceHistory: action.payload.priceHistory,
                lastRealWorldUpdate: Date.now()
              } 
            : company
        )
      };

    case 'RECORD_PRICE_CHANGES':
      return {
        ...state,
        companies: action.payload.companies,
        lastPriceRecordTime: action.payload.timestamp
      };

    case 'PLACE_PRICE_DIRECTION_BET': {
      const { stockId, amount, direction } = action.payload;
      
      // Find the company
      const company = state.companies.find(company => company.id === stockId);
      if (!company) return state;
      
      // Update company's bet counts
      const updatedCompany = {
        ...company,
        bets: {
          ...company.bets || {},
          [direction]: ((company.bets && company.bets[direction]) || 0) + 1
        },
        // Add pressure in the bet direction (small impact)
        buyPressure: direction === 'up' 
          ? Math.min(1, (company.buyPressure || 0) + 0.02)
          : company.buyPressure || 0,
        sellPressure: direction === 'down'
          ? Math.min(1, (company.sellPressure || 0) + 0.02)
          : company.sellPressure || 0,
      };
      
      // Update the companies array
      const companiesWithBets = state.companies.map(c => 
        c.id === stockId ? updatedCompany : c
      );
      
      return {
        ...state,
        companies: companiesWithBets
      };
    }

    case 'RESOLVE_PRICE_BETS':
      const { resolvedCompanyId, winDirection } = action.payload;
      return {
        ...state,
        companies: state.companies.map(company => {
          if (company.id === resolvedCompanyId) {
            // Mark bets as resolved and set win/loss status
            const resolvedBets = company.betHistory.map(bet => {
              if (!bet.resolved) {
                return {
                  ...bet,
                  resolved: true,
                  won: bet.direction === winDirection
                };
              }
              return bet;
            });
            
            // Reset betting counters
            return {
              ...company,
              betHistory: resolvedBets,
              bets: { up: 0, down: 0 }
            };
          }
          return company;
        })
      };

    default:
      return state;
  }
};

// Create context
const StockMarketContext = createContext();

// Provider component
export const StockMarketProvider = ({ children }) => {
  const [stockMarket, dispatch] = useReducer(stockMarketReducer, initializeStockData());
  const { state: gameState, dispatch: gameDispatch } = useGame();
  const [tickInterval, setTickInterval] = useState(null);
  const [timer, setTimer] = useState(null);
  // Add ref to track last price record time
  const lastPriceRecordRef = useRef(Date.now());
  const thirtySecInterval = useRef(null);

  // Separate function to record price changes every 30 seconds
  const recordPriceChanges = () => {
    if (!stockMarket.marketOpen) return;
    
    const now = Date.now();
    const updatedCompanies = stockMarket.companies.map(company => {
      // Calculate direction compared to last recorded price
      const priceDirection = company.currentPrice > company.lastRecordedPrice 
        ? 'up' 
        : company.currentPrice < company.lastRecordedPrice 
          ? 'down' 
          : 'neutral';
          
      // Return updated company
      return {
        ...company,
        lastRecordedPrice: company.currentPrice,
        priceDirection,
        priceChangeTime: now
      };
    });
    
    // Resolve any outstanding price direction bets
    updatedCompanies.forEach(company => {
      if (company.bets.up > 0 || company.bets.down > 0) {
        // Determine winning direction
        const winDirection = company.priceDirection === 'neutral' 
          ? null 
          : company.priceDirection;
        
        if (winDirection) {
          // Resolve bets
          dispatch({
            type: 'RESOLVE_PRICE_BETS',
            payload: {
              resolvedCompanyId: company.id,
              winDirection
            }
          });
          
          // Payout winning bets
          const winnings = winDirection === 'up' ? company.bets.up * 1.8 : company.bets.down * 1.8;
          
          // Add winnings to game money
          if (winnings > 0) {
            gameDispatch({
              type: 'ADD_MONEY',
              payload: winnings
            });
            
            // Add news item about winnings
            dispatch({
              type: 'ADD_NEWS',
              payload: {
                id: Date.now(),
                headline: `You won $${winnings.toFixed(2)} from ${company.name} price direction bet`,
                content: `Your bet that ${company.name} would go ${winDirection} was correct!`,
                impact: 'positive',
                timestamp: new Date().toISOString(),
                companyId: company.id,
                isPersonal: true
              }
            });
          }
        }
      }
    });
    
    // Dispatch record price changes action
    dispatch({
      type: 'RECORD_PRICE_CHANGES',
      payload: {
        companies: updatedCompanies,
        timestamp: now
      }
    });
    
    // Update ref for next check
    lastPriceRecordRef.current = now;
  };

  // Modify the updateStockPrices function to include supply/demand effects
  const updateStockPrices = () => {
    dispatch({ type: 'UPDATE_PRICES_START' });
    
    if (!stockMarket.marketOpen) return; // Don't update when market is closed
    
    // Calculate market sentiment (overall market direction) - more conservative scale
    const marketSentiment = Math.random() * 
      (volatilityFactors.MARKET_SENTIMENT.max - volatilityFactors.MARKET_SENTIMENT.min) + 
      volatilityFactors.MARKET_SENTIMENT.min;
    
    // Apply market momentum (markets tend to continue their trend)
    let marketMomentum = stockMarket.marketMood / 100; // Convert market mood to small percentage
    
    // Combine market sentiment with momentum (weighted towards new sentiment)
    const marketTrendFactor = (marketSentiment * 0.7) + (marketMomentum * 0.3);
    
    // Determine if news event should happen (5% chance)
    const newsEvent = Math.random() < 0.05 ? 
      marketNewsEvents[Math.floor(Math.random() * marketNewsEvents.length)] : null;
    
    // Calculate sector impacts - sectors often move together
    const sectorImpacts = {};
    Object.keys(volatilityFactors.SECTOR_TRENDS).forEach(sector => {
      // Base sector movement combines market trend with sector-specific factors
      const sectorTrend = volatilityFactors.SECTOR_TRENDS[sector];
      const sectorRandomFactor = Math.random() * (sectorTrend.max - sectorTrend.min) + sectorTrend.min;
      
      // Sectors have some correlation with overall market, but maintain their characteristics
      sectorImpacts[sector] = (marketTrendFactor * 0.6) + (sectorRandomFactor * 0.4);
      
      // Apply news event if it affects this sector
      if (newsEvent && newsEvent.sectors.includes(sector)) {
        const impactDirection = newsEvent.impact === 'positive' ? 1 : 
                               newsEvent.impact === 'negative' ? -1 : 
                               Math.random() > 0.5 ? 1 : -1;
        sectorImpacts[sector] += impactDirection * newsEvent.magnitude;
      }
    });
      
    // Update each company's stock price
    const updatedCompanies = stockMarket.companies.map(company => {
      // Start with the sector impact for this company
      let priceChange = sectorImpacts[company.sector] || 0;
      
      // Add company-specific volatility - weighted by company beta if available
      const companyBeta = company.beta || 1.0;
      const companySpecificFactor = (Math.random() * 2 - 1) * company.volatility * companyBeta;
      priceChange += companySpecificFactor * 0.4; // Reduce weight of random movements
      
      // Calculate price trend based on historical movement (smoother transitions)
      let priceTrend = company.priceTrend || 0;
      // Gradually shift trend based on recent price change, with mean reversion
      priceTrend = priceTrend * 0.95 + priceChange * 0.05;
      // Clamp price trend to reasonable range
      priceTrend = Math.max(-0.5, Math.min(0.5, priceTrend));
      
      // Apply supply and demand pressure to price change
      const supplyDemandFactor = (company.buyPressure - company.sellPressure) * 0.1;
      priceChange += supplyDemandFactor;
      
      // Apply more weight to the established trend for continuity
      priceChange = (priceChange * 0.6) + (priceTrend * 0.4);
      
      // Apply company-specific random news (1% chance per company)
      if (Math.random() < 0.01 && company.news && company.news.length > 0) {
        const randomNews = company.news[Math.floor(Math.random() * company.news.length)];
        if (Math.random() < randomNews.probability) {
          priceChange += randomNews.impact;
          
          dispatch({
            type: 'ADD_NEWS',
            payload: {
              id: Date.now(),
              headline: randomNews.headline,
              content: `News specific to ${company.name}.`,
              impact: randomNews.impact > 0 ? 'positive' : 'negative',
              timestamp: new Date().toISOString(),
              companyId: company.id
            }
          });
        }
      }
      
      // Apply special events based on company's earnings/dividend schedule
      const now = new Date();
      const currentDay = now.getDate();
      const currentMonth = now.getMonth() + 1;
      
      // Earnings announcement effect
      if (company.events.earnings && 
          company.events.earnings.day === currentDay && 
          company.events.earnings.month.includes(currentMonth)) {
        // Random earnings result (beat, miss, or meet expectations)
        const earningsResult = Math.random();
        let earningsImpact = 0;
        let earningsHeadline = '';
        
        // PE ratio affects earnings impact - high PE companies are punished more for misses
        const peMultiplier = company.pe ? Math.min(Math.sqrt(company.pe / 20), 1.5) : 1.0;
        
        if (earningsResult > 0.6) {  // 40% chance of beating
          earningsImpact = (Math.random() * 0.05 + 0.02) / peMultiplier; // Lower impact for high PE
          earningsHeadline = `${company.name} beats earnings expectations`;
        } else if (earningsResult > 0.25) { // 35% chance of meeting
          earningsImpact = Math.random() * 0.02 - 0.01; // -1 to 1% change
          earningsHeadline = `${company.name} meets earnings expectations`;
        } else { // 25% chance of missing
          earningsImpact = -(Math.random() * 0.06 + 0.03) * peMultiplier; // Higher impact for high PE
          earningsHeadline = `${company.name} misses earnings expectations`;
        }
        
        priceChange += earningsImpact;
        
        dispatch({
          type: 'ADD_NEWS',
          payload: {
            id: Date.now(),
            headline: earningsHeadline,
            content: `${company.name} reported quarterly earnings.`,
            impact: earningsImpact > 0 ? 'positive' : earningsImpact < 0 ? 'negative' : 'neutral',
            timestamp: new Date().toISOString(),
            companyId: company.id
          }
        });
      }
      
      // Dividend payment effect
      if (company.events.dividend && 
          company.events.dividend.day === currentDay && 
          company.events.dividend.month.includes(currentMonth)) {
        // Small positive effect on dividend payment day
        priceChange += 0.003; // 0.3% increase
        
        dispatch({
          type: 'ADD_NEWS',
          payload: {
            id: Date.now(),
            headline: `${company.name} pays quarterly dividend of $${company.events.dividend.amount} per share`,
            content: `Shareholders of record received dividends today.`,
            impact: 'positive',
            timestamp: new Date().toISOString(),
            companyId: company.id
          }
        });
        
        // Pay dividends to the player if they own shares
        const playerShares = company.owned;
        if (playerShares > 0) {
          const dividendAmount = playerShares * company.events.dividend.amount;
          gameDispatch({
            type: 'ADD_MONEY',
            payload: dividendAmount
          });
          
          // Add transaction record
          dispatch({
            type: 'ADD_NEWS',
            payload: {
              id: Date.now(),
              headline: `You received $${dividendAmount.toFixed(2)} in dividends from ${company.name}`,
              content: `Dividend payment for ${playerShares} shares at $${company.events.dividend.amount} per share.`,
              impact: 'positive',
              timestamp: new Date().toISOString(),
              companyId: company.id,
              isPersonal: true
            }
          });
        }
      }
      
      // Gradually decay buy/sell pressure over time
      const newBuyPressure = company.buyPressure * 0.995;
      const newSellPressure = company.sellPressure * 0.995;
      
      // Limit extreme price changes (circuit breaker)
      priceChange = Math.max(Math.min(priceChange, 0.09), -0.09);
      
      // Calculate new price with all factors
      const newPrice = company.currentPrice * (1 + priceChange);
      
      // Calculate new trending direction
      let trending = 'neutral';
      if (priceChange > 0.0025) trending = 'up';
      else if (priceChange < -0.0025) trending = 'down';
      
      // Update volume based on price change magnitude (higher price change = higher volume)
      const volumeChange = Math.abs(priceChange) * company.totalShares * 0.05;
      // Add some randomness to volume
      const volumeRandomFactor = 0.75 + (Math.random() * 0.5);
      const newVolume = Math.floor(company.volume + volumeChange * volumeRandomFactor);
      
      // Update price history - don't allow negative prices
      const safePriceValue = Math.max(0.01, newPrice);
      const updatedHistory = [...company.priceHistory, safePriceValue].slice(-50);
      
      // Calculate new day high/low
      const newDayHigh = Math.max(company.dayHigh, safePriceValue);
      const newDayLow = Math.min(company.dayLow, safePriceValue);
      
      // Updated week high/low
      const newWeekHigh = Math.max(company.weekHigh, safePriceValue);
      const newWeekLow = Math.min(company.weekLow, safePriceValue);
      
      // Record price in history (limited to last 60 points, one per 30 seconds = 30 minutes of data)
      const updatedPriceHistory = [...(company.priceHistory || []), safePriceValue];
      const limitedPriceHistory = updatedPriceHistory.slice(-60);
      
      return {
        ...company,
        previousPrice: company.currentPrice,
        currentPrice: safePriceValue,
        priceHistory: limitedPriceHistory, // Store limited price history
        percentChange: ((safePriceValue / company.previousPrice) - 1) * 100,
        trending,
        volume: newVolume,
        dayHigh: newDayHigh,
        dayLow: newDayLow,
        weekHigh: newWeekHigh,
        weekLow: newWeekLow,
        // Update the price trend and supply/demand factors
        priceTrend,
        buyPressure: newBuyPressure,
        sellPressure: newSellPressure
      };
    });
    
    // Calculate index values based on component stocks
    const updatedIndices = stockMarket.indices.map(index => {
      // Get the current prices of all component stocks
      const componentPrices = updatedCompanies
        .filter(company => index.companies.includes(company.id))
        .map(company => ({
          id: company.id,
          price: company.currentPrice,
          prevPrice: company.previousPrice
        }));
      
      // Calculate new index value (simplified calculation)
      const newValue = componentPrices.reduce((sum, stock) => sum + stock.price, 0) / componentPrices.length * index.baseValue / 100;
      const prevValue = componentPrices.reduce((sum, stock) => sum + stock.prevPrice, 0) / componentPrices.length * index.baseValue / 100;
      
      // Determine trend direction
      let indexTrend = 'neutral';
      const indexChange = (newValue / prevValue) - 1;
      if (indexChange > 0.001) indexTrend = 'up';
      else if (indexChange < -0.001) indexTrend = 'down';
      
      return {
        ...index,
        previousValue: index.currentValue,
        currentValue: newValue,
        valueHistory: [...index.valueHistory, newValue].slice(-50),
        percentChange: ((newValue / index.previousValue) - 1) * 100,
        trending: indexTrend
      };
    });
    
    // Calculate updated NOW Average (market cap weighted)
    const totalMarketCap = updatedCompanies.reduce((sum, company) => sum + company.marketCap, 0);
    
    // Weight each company by market cap for more realistic index
    const nowAverageValue = updatedCompanies.reduce((sum, company) => {
      const weight = company.marketCap / totalMarketCap;
      return sum + (company.currentPrice * weight);
    }, 0) * 100; // Scale factor to make the number more readable
    
    const previousNOWAverage = stockMarket.nowAverage.currentValue;
    
    // Calculate percent change for NOW Average
    const nowPercentChange = ((nowAverageValue / previousNOWAverage) - 1) * 100;
    
    // Determine trending direction
    let nowTrending = 'neutral';
    if (nowPercentChange > 0.08) nowTrending = 'up';
    else if (nowPercentChange < -0.08) nowTrending = 'down';
    
    // Update NOW Average history
    const updatedNOWHistory = [...stockMarket.nowAverage.valueHistory, nowAverageValue].slice(-50);
    
    // Create updated NOW Average object
    const updatedNOWAverage = {
      ...stockMarket.nowAverage,
      previousValue: previousNOWAverage,
      currentValue: nowAverageValue,
      valueHistory: updatedNOWHistory,
      percentChange: nowPercentChange,
      trending: nowTrending,
      description: getMarketStatusMessage(nowPercentChange)
    };
    
    // Calculate overall market mood (-10 to +10 scale)
    // Market mood is a slowly changing variable that adds momentum
    let marketMood = stockMarket.marketMood;
    
    // Adjust market mood based on current index performance
    if (nowPercentChange > 0.5) {
      marketMood += 0.5; // Strong positive day
    } else if (nowPercentChange > 0.1) {
      marketMood += 0.2; // Modest positive day
    } else if (nowPercentChange < -0.5) {
      marketMood -= 0.5; // Strong negative day
    } else if (nowPercentChange < -0.1) {
      marketMood -= 0.2; // Modest negative day
    }
    
    // Apply slow reversion to mean
    marketMood *= 0.95;
    
    // Clamp market mood to range
    marketMood = Math.max(-10, Math.min(10, marketMood));
    
    // Determine market trend description
    let marketTrend = 'neutral';
    if (marketMood > 3) marketTrend = 'bullish';
    else if (marketMood > 1) marketTrend = 'positive';
    else if (marketMood < -3) marketTrend = 'bearish';
    else if (marketMood < -1) marketTrend = 'negative';
    
    // Create news for significant market moves
    if (Math.abs(nowPercentChange) > 1.5) {
      const marketMoveNews = {
        id: Date.now(),
        headline: nowPercentChange > 0 
          ? `Markets surge ${nowPercentChange.toFixed(1)}% on strong buying pressure` 
          : `Markets plunge ${Math.abs(nowPercentChange).toFixed(1)}% amid broad selling`,
        content: getMarketStatusMessage(nowPercentChange),
        impact: nowPercentChange > 0 ? 'positive' : 'negative',
        timestamp: new Date().toISOString(),
        isMarketWide: true
      };
      
      dispatch({
        type: 'ADD_NEWS',
        payload: marketMoveNews
      });
    }
    
    // Add news from major events that affected sectors
    if (newsEvent) {
      // Only announce news events if they have a meaningful impact
      dispatch({
        type: 'ADD_NEWS',
        payload: {
          id: Date.now(),
          headline: newsEvent.headline,
          content: `This event is affecting ${newsEvent.sectors.join(', ')} sectors.`,
          impact: newsEvent.impact,
          timestamp: new Date().toISOString(),
          sectors: newsEvent.sectors
        }
      });
    }
    
    // Get market status message based on performance
    const marketStatus = getMarketStatusMessage(nowPercentChange);

    // Dispatch the update
    dispatch({
      type: 'UPDATE_STOCK_PRICES',
      payload: {
        companies: updatedCompanies,
        indices: updatedIndices,
        nowAverage: updatedNOWAverage,
        marketStatus,
        marketTrend,
        marketMood: marketMood
      }
    });
    
    // Check if we need to record the 30-second price snapshot
    const now = Date.now();
    if (now - lastPriceRecordRef.current >= 30000) {
      recordPriceChanges();
    }
    
    // Advance market time
    advanceMarketTime();
  };
  
  // Function to advance market time
  const advanceMarketTime = () => {
    let newHour = stockMarket.marketHour;
    let newMinute = stockMarket.marketMinute + 1;
    let newDay = stockMarket.marketDay;
    let isOpen = true;
    
    // Handle time advancement
    if (newMinute >= 60) {
      newMinute = 0;
      newHour++;
    }
    
    // Check if market should close
    if (newHour >= 16) { // Market closes at 4pm
      isOpen = false;
      
      // Reset for next day
      if (newHour >= 24) {
        newHour = 9;
        newMinute = 30;
        newDay++;
        isOpen = true;
      }
    } else if (newHour < 9 || (newHour === 9 && newMinute < 30)) {
      // Market opens at 9:30am
      isOpen = false;
    }
    
    dispatch({
      type: 'ADVANCE_MARKET_TIME',
      payload: { newHour, newMinute, newDay, isOpen }
    });
  };
  
  // Set up 30-second interval for price recording
  useEffect(() => {
    // Set up 30-second interval
    thirtySecInterval.current = setInterval(() => {
      if (stockMarket.marketOpen) {
        recordPriceChanges();
      }
    }, 30000);
    
    return () => {
      if (thirtySecInterval.current) {
        clearInterval(thirtySecInterval.current);
      }
    };
  }, []);

  // Start market simulation when component mounts
  useEffect(() => {
    // Start market simulation with 1 second intervals
    const interval = setInterval(() => {
      updateStockPrices();
    }, 1000);
    
    setTickInterval(interval);
    
    // Clean up interval on unmount
    return () => clearInterval(interval);
  }, []);
  
  // Buy stock function
  const buyStock = (stockId, shares) => {
    const company = stockMarket.companies.find(c => c.id === stockId);
    
    if (!company) {
      throw new Error(`Company with ID ${stockId} not found`);
    }
    
    if (shares <= 0) {
      throw new Error('Cannot buy zero or negative shares');
    }
    
    const price = company.currentPrice;
    const total = price * shares;
    
    // Check if player has enough money
    if (gameState.money < total) {
      return { success: false, message: "Insufficient funds" };
    }
    
    // Reduce player's money
    gameDispatch({
      type: 'SPEND_MONEY',
      payload: total
    });
    
    // Dispatch the buy action
    dispatch({
      type: 'BUY_STOCK',
      payload: { stockId, shares, price, total }
    });
    
    return { 
      success: true, 
      message: `Successfully purchased ${shares} shares of ${company.name} for $${total.toFixed(2)}` 
    };
  };
  
  // Sell stock function
  const sellStock = (stockId, shares) => {
    const company = stockMarket.companies.find(c => c.id === stockId);
    
    if (!company) {
      throw new Error(`Company with ID ${stockId} not found`);
    }
    
    if (shares <= 0) {
      throw new Error('Cannot sell zero or negative shares');
    }
    
    if (company.owned < shares) {
      throw new Error(`You only own ${company.owned} shares of ${company.name}`);
    }
    
    const price = company.currentPrice;
    const total = price * shares;
    
    // Add money to player's account
    gameDispatch({
      type: 'ADD_MONEY',
      payload: total
    });
    
    // Dispatch the sell action
    dispatch({
      type: 'SELL_STOCK',
      payload: { stockId, shares, price, total }
    });
    
    return { 
      success: true, 
      message: `Successfully sold ${shares} shares of ${company.name} for $${total.toFixed(2)}` 
    };
  };
  
  const toggleWatchlist = (stockId) => {
    if (stockMarket.watchlist.includes(stockId)) {
      dispatch({
        type: 'REMOVE_FROM_WATCHLIST',
        payload: stockId
      });
    } else {
      dispatch({
        type: 'ADD_TO_WATCHLIST',
        payload: stockId
      });
    }
  };
  
  const takeCompanyAction = (companyId) => {
    // Check if player owns the company
    const company = stockMarket.companies.find(c => c.id === companyId);
    if (!company || !company.companyOwned) {
      return { success: false, message: "You don't control this company" };
    }
    
    // Select a random action
    const action = companyActions[Math.floor(Math.random() * companyActions.length)];
    
    // Apply the action
    dispatch({
      type: 'COMPANY_ACTION',
      payload: {
        companyId,
        action,
        impact: action.impact
      }
    });
    
    return { success: true, message: `Successfully executed ${action.action}` };
  };
  
  // Add a new useEffect to fetch real-world data for companies
  useEffect(() => {
    const fetchRealWorldData = async () => {
      if (stockMarket.companies && stockMarket.companies.length > 0) {
        // Process companies in batches to avoid hitting API limits
        const batchSize = 5;
        
        for (let i = 0; i < stockMarket.companies.length; i += batchSize) {
          const batch = stockMarket.companies.slice(i, i + batchSize);
          
          // Process each company in the batch
          const promises = batch.map(async (company) => {
            // Only update if we haven't recently (within the last hour)
            if (!company.lastRealWorldUpdate || 
                (Date.now() - company.lastRealWorldUpdate > 3600000)) {
              
              // Get corresponding real-world ticker
              const realTicker = getRealWorldTicker(company.id, company.sector);
              
              // Fetch price history
              const priceHistory = await fetchRealWorldPriceHistory(realTicker);
              
              // Update the company's price history
              if (priceHistory && priceHistory.length > 0) {
                dispatch({
                  type: 'SET_REAL_WORLD_PRICE_HISTORY',
                  payload: {
                    id: company.id,
                    priceHistory
                  }
                });
              }
            }
          });
          
          // Wait for this batch to complete before starting the next one
          await Promise.all(promises);
          
          // Add a small delay between batches to avoid hitting API rate limits
          if (i + batchSize < stockMarket.companies.length) {
            await new Promise(resolve => setTimeout(resolve, 1500));
          }
        }
      }
    };
    
    fetchRealWorldData();
    
    // Periodically refresh data (every hour)
    const intervalId = setInterval(fetchRealWorldData, 3600000);
    
    return () => clearInterval(intervalId);
  }, [stockMarket.companies?.length]);
  
  // Add new function to place a price direction bet
  const placePriceDirectionBet = (stockId, direction, amount) => {
    if (amount <= 0) {
      return { success: false, message: "Bet amount must be positive" };
    }
    
    if (direction !== 'up' && direction !== 'down') {
      return { success: false, message: "Direction must be 'up' or 'down'" };
    }
    
    const company = stockMarket.companies.find(c => c.id === stockId);
    if (!company) {
      return { success: false, message: "Invalid stock selected" };
    }
    
    // Check if player has enough money
    if (gameState.money < amount) {
      return { success: false, message: "Insufficient funds for this bet" };
    }
    
    // Reduce player's money
    gameDispatch({
      type: 'SPEND_MONEY',
      payload: amount
    });
    
    // Dispatch bet placement
    const betId = Date.now();
    dispatch({
      type: 'PLACE_PRICE_DIRECTION_BET',
      payload: { stockId, direction, amount, betId }
    });
    
    // Add news about bet
    dispatch({
      type: 'ADD_NEWS',
      payload: {
        id: Date.now(),
        headline: `You placed a $${amount.toFixed(2)} bet that ${company.name} will go ${direction}`,
        content: `Bet placed at $${company.currentPrice.toFixed(2)}. Result will be determined in 30 seconds.`,
        impact: 'neutral',
        timestamp: new Date().toISOString(),
        companyId: company.id,
        isPersonal: true
      }
    });
    
    return { 
      success: true, 
      message: `Successfully placed a $${amount.toFixed(2)} bet that ${company.name} will go ${direction}`,
      betId
    };
  };
  
  // Provide context value
  const value = {
    stockMarket,
    buyStock,
    sellStock,
    toggleWatchlist,
    takeCompanyAction,
    placePriceDirectionBet
  };
  
  return (
    <StockMarketContext.Provider value={value}>
      {children}
    </StockMarketContext.Provider>
  );
};

// Custom hook to use stock market context
export const useStockMarket = () => {
  const context = useContext(StockMarketContext);
  if (context === undefined) {
    throw new Error('useStockMarket must be used within a StockMarketProvider');
  }
  return context;
}; 