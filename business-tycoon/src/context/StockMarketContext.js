import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';
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
    recentNews: null
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
    marketMood: 0 // Range from -10 (bearish) to +10 (bullish)
  };
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
      const { stockId, shares, price, total } = action.payload;
      
      // Update company ownership
      const updatedCompanies = state.companies.map(company => {
        if (company.id === stockId) {
          const newOwnedAmount = company.owned + shares;
          return {
            ...company,
            owned: newOwnedAmount,
            transactions: [
              { 
                type: 'buy', 
                shares, 
                price, 
                total, 
                date: new Date().toISOString() 
              },
              ...company.transactions
            ],
            // If player owns more than 51% of shares, they control the company
            companyOwned: newOwnedAmount > (company.totalShares * 0.51)
          };
        }
        return company;
      });
      
      // Add to transaction history
      const newTransaction = {
        id: Date.now(),
        type: 'buy',
        stockId,
        shares,
        price,
        total,
        date: new Date().toISOString()
      };
      
      // Update player owned stocks list
      let updatedOwnedStocks = [...state.playerOwnedStocks];
      const existingIndex = updatedOwnedStocks.findIndex(s => s.stockId === stockId);
      
      if (existingIndex >= 0) {
        // Update existing holding
        updatedOwnedStocks[existingIndex] = {
          ...updatedOwnedStocks[existingIndex],
          shares: updatedOwnedStocks[existingIndex].shares + shares,
          averagePrice: (updatedOwnedStocks[existingIndex].totalInvested + total) / 
                        (updatedOwnedStocks[existingIndex].shares + shares),
          totalInvested: updatedOwnedStocks[existingIndex].totalInvested + total
        };
      } else {
        // Add new holding
        updatedOwnedStocks.push({
          stockId,
          shares,
          averagePrice: price,
          totalInvested: total,
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
      
      // Update company ownership
      const companiesAfterSell = state.companies.map(company => {
        if (company.id === sellDetails.stockId) {
          const newOwnedAmount = company.owned - sellDetails.shares;
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
            companyOwned: newOwnedAmount > (company.totalShares * 0.51)
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

  // Function to generate random stock price movements
  const updateStockPrices = () => {
    if (!stockMarket.marketOpen) return; // Don't update when market is closed
    
    // Calculate market sentiment (overall market direction)
    const marketSentiment = Math.random() * 
      (volatilityFactors.MARKET_SENTIMENT.max - volatilityFactors.MARKET_SENTIMENT.min) + 
      volatilityFactors.MARKET_SENTIMENT.min;
    
    // Determine if news event should happen (5% chance)
    const newsEvent = Math.random() < 0.05 ? 
      marketNewsEvents[Math.floor(Math.random() * marketNewsEvents.length)] : null;
      
    // Update each company's stock price
    const updatedCompanies = stockMarket.companies.map(company => {
      // Base factors affecting price
      let priceChange = marketSentiment; // Start with market sentiment
      
      // Add sector trend
      const sectorTrend = volatilityFactors.SECTOR_TRENDS[company.sector];
      priceChange += Math.random() * (sectorTrend.max - sectorTrend.min) + sectorTrend.min;
      
      // Add company-specific volatility
      priceChange += (Math.random() * 2 - 1) * company.volatility;
      
      // Apply news event if it affects this company's sector
      if (newsEvent && newsEvent.sectors.includes(company.sector)) {
        const impactDirection = newsEvent.impact === 'positive' ? 1 : 
                               newsEvent.impact === 'negative' ? -1 : 
                               Math.random() > 0.5 ? 1 : -1;
        priceChange += impactDirection * newsEvent.magnitude;
        
        // Add news to feed if it's significant
        if (Math.abs(priceChange) > 0.02) {
          dispatch({
            type: 'ADD_NEWS',
            payload: {
              id: Date.now(),
              headline: newsEvent.headline,
              content: `This event is affecting ${company.name} and other ${company.sector} sector companies.`,
              impact: impactDirection > 0 ? 'positive' : 'negative',
              timestamp: new Date().toISOString(),
              sector: company.sector
            }
          });
        }
      }
      
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
        
        if (earningsResult > 0.6) {  // 40% chance of beating
          earningsImpact = Math.random() * 0.08 + 0.02; // 2-10% increase
          earningsHeadline = `${company.name} beats earnings expectations`;
        } else if (earningsResult > 0.25) { // 35% chance of meeting
          earningsImpact = Math.random() * 0.02 - 0.01; // -1 to 1% change
          earningsHeadline = `${company.name} meets earnings expectations`;
        } else { // 25% chance of missing
          earningsImpact = -(Math.random() * 0.08 + 0.02); // 2-10% decrease
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
        priceChange += 0.005; // 0.5% increase
        
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
      
      // Calculate new price with all factors
      const newPrice = company.currentPrice * (1 + priceChange);
      
      // Calculate new trending direction
      let trending = 'neutral';
      if (priceChange > 0.005) trending = 'up';
      else if (priceChange < -0.005) trending = 'down';
      
      // Update volume based on price change magnitude
      const volumeChange = Math.abs(priceChange) * company.totalShares * 0.05;
      const newVolume = Math.floor(company.volume + volumeChange * (Math.random() * 0.5 + 0.75));
      
      // Update price history
      const updatedHistory = [...company.priceHistory, newPrice].slice(-50);
      
      // Calculate new day high/low
      const newDayHigh = Math.max(company.dayHigh, newPrice);
      const newDayLow = Math.min(company.dayLow, newPrice);
      
      // Updated week high/low (simplified - in a real app we'd track actual weekly data)
      const newWeekHigh = Math.max(company.weekHigh, newPrice);
      const newWeekLow = Math.min(company.weekLow, newPrice);
      
      return {
        ...company,
        previousPrice: company.currentPrice,
        currentPrice: newPrice,
        priceHistory: updatedHistory,
        percentChange: ((newPrice / company.previousPrice) - 1) * 100,
        trending,
        volume: newVolume,
        dayHigh: newDayHigh,
        dayLow: newDayLow,
        weekHigh: newWeekHigh,
        weekLow: newWeekLow
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
    
    // Calculate overall market mood change
    const overallMarketChange = updatedIndices[0].percentChange; // Use the composite index
    let newMarketMood = stockMarket.marketMood;
    
    if (overallMarketChange > 0.5) newMarketMood += 1;
    else if (overallMarketChange > 0.1) newMarketMood += 0.5;
    else if (overallMarketChange < -0.5) newMarketMood -= 1;
    else if (overallMarketChange < -0.1) newMarketMood -= 0.5;
    
    // Keep market mood within bounds
    newMarketMood = Math.max(-10, Math.min(10, newMarketMood));
    
    // Determine market trend
    let marketTrend = 'neutral';
    if (overallMarketChange > 0.2) marketTrend = 'up';
    else if (overallMarketChange < -0.2) marketTrend = 'down';
    
    // Get status message
    const marketStatus = getMarketStatusMessage(overallMarketChange);
    
    // Update state with new prices
    dispatch({
      type: 'UPDATE_STOCK_PRICES',
      payload: {
        companies: updatedCompanies,
        indices: updatedIndices,
        marketStatus,
        marketTrend,
        marketMood: newMarketMood
      }
    });
    
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
  
  // Provide context value
  const value = {
    stockMarket,
    buyStock,
    sellStock,
    toggleWatchlist,
    takeCompanyAction
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