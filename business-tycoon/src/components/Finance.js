import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useGame } from '../context/GameContext';
import { useStockMarket } from '../context/StockMarketContext';
import { formatCurrency } from '../data/stockMarketData';
import '../styles/Finance.css';

const Finance = () => {
  const { stockMarket, buyStock, sellStock, toggleWatchlist, dispatch: stockMarketDispatch } = useStockMarket();
  const { gameState, gameDispatch } = useGame();
  
  // Move all hooks to the top BEFORE any conditional returns
  // Add state for net worth tracking
  const [netWorth, setNetWorth] = useState(0);
  const [netWorthHistory, setNetWorthHistory] = useState([]);
  const [lastNetWorthUpdate, setLastNetWorthUpdate] = useState(Date.now());
  
  const [selectedStock, setSelectedStock] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tradeAction, setTradeAction] = useState('buy');
  const [shareCount, setShareCount] = useState(0);
  const [priceMovementHistory, setPriceMovementHistory] = useState({});
  const [chartHoverData, setChartHoverData] = useState(null);
  const [detailedChartHoverData, setDetailedChartHoverData] = useState(null);
  
  // Component state
  const [tradeQuantity, setTradeQuantity] = useState(1);
  const [tradeType, setTradeType] = useState('buy');
  const [notification, setNotification] = useState(null);
  const [showTradeModal, setShowTradeModal] = useState(false);
  
  // Filter, sort, search state
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'ascending' });
  const [filterSector, setFilterSector] = useState('all');
  const [availableSectors, setAvailableSectors] = useState([]);
  
  // Collapsible state
  const [isMarketTableCollapsed, setIsMarketTableCollapsed] = useState(false);
  const [isPortfolioTableCollapsed, setIsPortfolioTableCollapsed] = useState(false);
  
  // Add state to store generated chart data for consistency
  const [modalChartData, setModalChartData] = useState(null);
  const [lastSelectedStockId, setLastSelectedStockId] = useState(null);
  
  // Add state to store chart data for all companies
  const [companyChartDataCache, setCompanyChartDataCache] = useState({});
  
  // Add state to track window size for responsive charts
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  
  // Add timer state for modal refresh
  const [lastModalRefresh, setLastModalRefresh] = useState(Date.now());
  const [modalRefreshCount, setModalRefreshCount] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showRefreshAnimation, setShowRefreshAnimation] = useState(false);
  
  // Add new state variable for global price refresh
  const [lastGlobalRefresh, setLastGlobalRefresh] = useState(Date.now());
  const [isGlobalRefreshing, setIsGlobalRefreshing] = useState(false);
  const globalRefreshTimer = useRef(null);
  
  const tickerRef = useRef(null);
  const modalRef = useRef(null);
  const modalRefreshTimer = useRef(null);
  
  const sectors = useMemo(() => {
    if (!stockMarket.companies) return ['all'];
    const uniqueSectors = new Set(stockMarket.companies.map(company => company.sector));
    return ['all', ...Array.from(uniqueSectors)];
  }, [stockMarket.companies]);
  
  // Reset trade quantity when selected stock changes
  useEffect(() => {
    setTradeQuantity(1);
  }, [selectedStock]);
  
  // Show notification for 3 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);
  
  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setShowTradeModal(false);
      }
    };
    
    if (showTradeModal) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showTradeModal]);
  
  // Window resize handler for charts
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  // Effect for modal refresh timer
  useEffect(() => {
    if (selectedStock && showTradeModal) {
      // Set up refresh timer for modal data
      modalRefreshTimer.current = setInterval(() => {
        setLastModalRefresh(Date.now());
        setModalRefreshCount(prev => prev + 1);
        
        // Show brief animation
        setShowRefreshAnimation(true);
        setTimeout(() => {
          setShowRefreshAnimation(false);
        }, 500);
        
      }, 30000); // Refresh every 30 seconds
      
      return () => {
        if (modalRefreshTimer.current) {
          clearInterval(modalRefreshTimer.current);
        }
      };
    }
  }, [selectedStock, showTradeModal]);
  
  // Effect to update modal chart data when stock is selected or changes
  useEffect(() => {
    if (selectedStock && selectedStock.id !== lastSelectedStockId) {
      updateModalChartData(selectedStock);
      setLastSelectedStockId(selectedStock.id);
    }
  }, [selectedStock, lastSelectedStockId]);
  
  // Effect to update net worth calculations
  useEffect(() => {
    if (!gameState) return;
    
    // Only update every minute to avoid excessive calculations
    const now = Date.now();
    if (now - lastNetWorthUpdate < 60000) return;
    
    // Calculate current portfolio value
    const portfolioValue = stockMarket.playerOwnedStocks.reduce((total, holding) => {
      const stock = stockMarket.companies.find(c => c.id === holding.stockId);
      if (stock) {
        return total + (stock.currentPrice * holding.shares);
      }
      return total;
    }, 0);
    
    // Total net worth = cash + portfolio
    const totalNetWorth = gameState.money + portfolioValue;
    setNetWorth(totalNetWorth);
    
    // Track net worth history for chart
    setNetWorthHistory(prev => {
      // Limit history to 100 points to avoid performance issues
      const newHistory = [...prev, { timestamp: now, value: totalNetWorth }];
      if (newHistory.length > 100) {
        return newHistory.slice(-100);
      }
      return newHistory;
    });
    
    setLastNetWorthUpdate(now);
  }, [stockMarket, gameState, lastNetWorthUpdate]);
  
  // Global price refresh timer
  useEffect(() => {
    const autoRefreshTimer = setInterval(() => {
      // Only refresh if it's been more than 5 minutes
      if (Date.now() - lastGlobalRefresh > 300000) {
        setIsGlobalRefreshing(true);
        stockMarketDispatch({ type: 'REFRESH_PRICES' });
        setLastGlobalRefresh(Date.now());
        
        // Reset refreshing status after a delay
        setTimeout(() => {
          setIsGlobalRefreshing(false);
        }, 1000);
      }
    }, 60000); // Check every minute
    
    return () => {
      clearInterval(autoRefreshTimer);
    };
  }, [lastGlobalRefresh, stockMarketDispatch]);
  
  // Calculate time until next refresh
  const getTimeUntilNextGlobalRefresh = useCallback(() => {
    if (!lastGlobalRefresh) return '5:00';
    
    const elapsedMs = Date.now() - lastGlobalRefresh;
    const remainingMs = Math.max(0, 300000 - elapsedMs); // 5 minutes (300000ms)
    
    const minutes = Math.floor(remainingMs / 60000);
    const seconds = Math.floor((remainingMs % 60000) / 1000);
    
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  }, [lastGlobalRefresh]);
  
  // Early return with loading message if gameState is undefined
  if (!gameState) {
    return <div className="loading-container">Loading game data...</div>;
  }
  
  // Use gameState instead of state throughout the component
  const state = gameState;
  const { money } = state;
  
  // Sort function
  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  // Filter and sort companies
  const getFilteredAndSortedCompanies = () => {
    if (!stockMarket.companies) return [];
    
    // First filter
    let filteredCompanies = stockMarket.companies.filter(company =>
      (filterSector === 'all' || company.sector === filterSector) &&
      (company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
       company.id.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    
    // Then sort
    const sortedCompanies = [...filteredCompanies].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });
    
    return sortedCompanies;
  };
  
  // Render sort arrow
  const renderSortArrow = (columnKey) => {
    if (sortConfig.key !== columnKey) return null;
    
    return (
      <span className="ml-1">
        {sortConfig.direction === 'ascending' ? '↑' : '↓'}
      </span>
    );
  };
  
  // Render stock ticker
  const renderStockTicker = () => {
    return (
      <div className="bg-gray-900 overflow-hidden rounded-lg mb-6">
        <div className="ticker-wrapper">
          <div className="ticker" ref={tickerRef}>
            {stockMarket.companies.map(company => (
              <div key={company.id} className="ticker-item">
                <span className="ticker-symbol">{company.id}</span>
                <span className={`ticker-price ${company.trending === 'up' ? 'text-green-400' : company.trending === 'down' ? 'text-red-400' : 'text-gray-300'}`}>
                  ${company.currentPrice.toFixed(2)}
                </span>
                <span className={`ticker-change ${company.percentChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {company.percentChange >= 0 ? '+' : ''}{company.percentChange.toFixed(2)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };
  
  // Render filter, sort, search controls
  const renderTableControls = () => {
    return (
      <div className="bg-white p-4 rounded-t-lg border border-gray-200 border-b-0">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-3 md:space-y-0">
          {/* Search */}
          <div className="relative w-full md:w-64">
            <input
              type="text"
              placeholder="Search by name or ticker..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md pl-10"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          
          {/* Sector filter */}
          <div className="flex space-x-2 items-center">
            <label className="text-gray-600 text-sm">Sector:</label>
            <select 
              value={filterSector}
              onChange={(e) => setFilterSector(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="all">All Sectors</option>
              {availableSectors.map(sector => (
                <option key={sector} value={sector}>
                  {sector.charAt(0).toUpperCase() + sector.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    );
  };
  
  // Use effect to generate and cache chart data when companies change
  useEffect(() => {
    const newCache = { ...companyChartDataCache };
    let cacheUpdated = false;
    
    stockMarket.companies.forEach(company => {
      // Only generate if we don't have data for this company yet
      if (!companyChartDataCache[company.id]) {
        cacheUpdated = true;
        // Use only last hour worth of data points (20 points)
        const lastHourPoints = 20;
        let chartData;
        
        if (company.realWorldPriceHistory && company.realWorldPriceHistory.length > 0) {
          // Use real-world data - take only the most recent points to simulate last hour
          chartData = company.realWorldPriceHistory.slice(-lastHourPoints);
        } else {
          // Generate data if needed - using only last hour of points
          chartData = company.priceHistory.length >= lastHourPoints 
            ? company.priceHistory.slice(-lastHourPoints) 
            : generateLastHourPriceData(company, lastHourPoints);
        }
        
        newCache[company.id] = chartData;
      }
    });
    
    // Only update state if we actually changed something
    if (cacheUpdated) {
      setCompanyChartDataCache(newCache);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stockMarket.companies.length]); // Only re-run when company list changes
  
  // Generate realistic last hour of price data
  const generateLastHourPriceData = (company, totalPoints) => {
    // Parameters for a realistic last hour price model
    const currentPrice = company.currentPrice;
    const volatility = (company.volatility || 0.02) * 0.5; // Lower volatility for hourly data
    
    // Start with current price and work backwards
    let priceData = [currentPrice];
    
    // Generate previous points with realistic minute-by-minute fluctuations
    for (let i = 1; i < totalPoints; i++) {
      // Calculate previous price with small random variations
      const minuteVolatility = volatility * (Math.random() * 0.8 + 0.6); // Vary the volatility
      const randomWalk = (Math.random() - 0.5) * 2 * minuteVolatility * priceData[0];
      
      // Add tiny trend based on overall daily trend
      const minuteTrend = (company.percentChange / 100) * currentPrice * (0.01 / totalPoints);
      
      // Each step back in time (working backwards from current price)
      const prevPrice = priceData[0] - minuteTrend + randomWalk;
      
      // Ensure no negative prices
      priceData.unshift(Math.max(prevPrice, currentPrice * 0.9));
    }
    
    return priceData;
  };
  
  // Render simple price chart for a stock
  const renderPriceChart = (company) => {
    const chartHeight = 50;
    // Use dynamic width calculation based on container rather than fixed width
    const chartWidth = 180;
    
    // Use cached data instead of generating on each render
    let priceData;
    
    if (companyChartDataCache[company.id]) {
      // Use cached data
      priceData = companyChartDataCache[company.id];
    } else {
      // Fallback to generating data if cache isn't ready yet
      const lastHourPoints = 20;
      if (company.realWorldPriceHistory && company.realWorldPriceHistory.length > 0) {
        priceData = company.realWorldPriceHistory.slice(-lastHourPoints);
      } else {
        priceData = company.priceHistory.length >= lastHourPoints 
          ? company.priceHistory.slice(-lastHourPoints)
          : generateLastHourPriceData(company, lastHourPoints);
      }
      
      // Cache it for future renders
      setCompanyChartDataCache(prev => ({
        ...prev,
        [company.id]: priceData
      }));
    }
    
    // Find min and max for scaling
    const minPrice = Math.min(...priceData);
    const maxPrice = Math.max(...priceData);
    const priceRange = maxPrice - minPrice || 1; // Prevent division by zero
    
    // Create points for SVG polyline
    const points = priceData.map((price, index) => {
      const x = (index / (priceData.length - 1)) * chartWidth;
      // Invert Y coordinate for SVG (0 is top)
      const y = chartHeight - ((price - minPrice) / priceRange) * chartHeight;
      return `${x},${y}`;
    }).join(' ');
    
    // Determine line color based on price trend
    const lineColor = company.percentChange >= 0 ? '#10B981' : '#EF4444';
    
    // Calculate position for the end point
    const endX = chartWidth;
    const endY = chartHeight - ((priceData[priceData.length - 1] - minPrice) / priceRange) * chartHeight;
    
    return (
      <svg 
        width="100%" 
        height={chartHeight} 
        className="stock-chart"
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        preserveAspectRatio="xMidYMid meet"
        data-company-id={company.id}
      >
        {/* Add area fill under the line for better visualization */}
        <polygon
          points={points + ` ${chartWidth},${chartHeight} 0,${chartHeight}`}
          fill={company.percentChange >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'}
        />
        <polyline
          points={points}
          fill="none"
          stroke={lineColor}
          strokeWidth="2"
        />
        
        {/* Only show dot at the end of the line */}
        <circle 
          cx={endX} 
          cy={endY} 
          r="3" 
          fill={lineColor} 
        />
        
        {/* Invisible overlay to capture mouse events */}
        <rect 
          x="0" 
          y="0" 
          width={chartWidth} 
          height={chartHeight} 
          fill="transparent" 
          className="chart-hover-area"
          data-points={points}
          data-color={lineColor}
          data-min-price={minPrice}
          data-price-range={priceRange}
        />
      </svg>
    );
  };
  
  // Handle stock selection for trading
  const handleSelectStock = (company) => {
    setSelectedStock(company);
    setTradeQuantity(1);
    setTradeType('buy');
    setShowTradeModal(true);
    
    // Store the stock ID to track changes
    setLastSelectedStockId(company.id);
    
    // Reset refresh timer
    setLastModalRefresh(Date.now());
    setModalRefreshCount(0);
    
    // Initialize chart data using actual price history if available
    if (company.priceHistory && company.priceHistory.length > 0) {
      // Use actual historical data, limiting to 60 points
      const historyPoints = Math.min(60, company.priceHistory.length);
      setModalChartData(company.priceHistory.slice(-historyPoints));
    } else {
      // Start with current price if no history exists
      setModalChartData([company.currentPrice]);
    }
  };
  
  // Function to update modal chart data
  const updateModalChartData = (company) => {
    if (!company) return;
    
    // Always get fresh price data from the company
    const currentPrice = company.currentPrice;
    
    // If we already have chart data, append the latest price
    if (modalChartData && modalChartData.length > 0 && lastSelectedStockId === company.id) {
      // Only add a new point if the price has changed or if it's time for a refresh
      const lastPoint = modalChartData[modalChartData.length - 1];
      if (lastPoint !== currentPrice) {
        // Append the new price to the existing data
        const updatedData = [...modalChartData, currentPrice];
        
        // Keep the last 60 points (representing 5 minutes if each point is 5 seconds)
        if (updatedData.length > 60) {
          setModalChartData(updatedData.slice(-60));
        } else {
          setModalChartData(updatedData);
        }
      }
    } else {
      // Initialize with historical data if available, or create a starting point
      if (company.priceHistory && company.priceHistory.length > 0) {
        // Use actual historical data, limiting to 60 points
        const historyPoints = Math.min(60, company.priceHistory.length);
        setModalChartData([...company.priceHistory.slice(-historyPoints), currentPrice]);
      } else {
        // Start with current price if no history exists
        setModalChartData([currentPrice]);
      }
    }
  };
  
  // Handle trade execution
  const executeTrade = () => {
    if (!selectedStock || tradeQuantity <= 0) return;
    
    try {
      if (tradeType === 'buy') {
        const totalCost = selectedStock.currentPrice * tradeQuantity;
        
        // Check if player has enough money
        if (totalCost > money) {
          setNotification({
            type: 'error',
            message: 'Insufficient funds for this purchase'
          });
          return;
        }
        
        // Execute buy order using the buyStock function from context
        const result = buyStock(selectedStock.id, tradeQuantity);
        
        if (result.success) {
          setNotification({
            type: 'success',
            message: result.message
          });
        } else {
          setNotification({
            type: 'error',
            message: result.message || 'Transaction failed'
          });
          return;
        }
      } else {
        // Check if player owns enough shares
        const ownedStock = stockMarket.playerOwnedStocks.find(s => s.stockId === selectedStock.id);
        if (!ownedStock || ownedStock.shares < tradeQuantity) {
          setNotification({
            type: 'error',
            message: 'You don\'t own enough shares to sell'
          });
          return;
        }
        
        // Execute sell order using the sellStock function from context
        const result = sellStock(selectedStock.id, tradeQuantity);
        
        if (result.success) {
          setNotification({
            type: 'success',
            message: result.message
          });
        } else {
          setNotification({
            type: 'error',
            message: result.message || 'Transaction failed'
          });
          return;
        }
      }
      
      // Reset quantity after trade and close modal
      setTradeQuantity(1);
      setShowTradeModal(false);
    } catch (error) {
      setNotification({
        type: 'error',
        message: 'Transaction failed: ' + error.message
      });
    }
  };
  
  // Render detailed price chart for the modal (last hour data)
  const renderDetailedPriceChart = (company) => {
    if (!company) return null;
    
    // Make chart responsive to container width using current window width
    const chartHeight = 200;
    // Use percentage-based width instead of fixed width for responsiveness
    const chartWidth = Math.min(450, windowWidth - 60); // Adjust for mobile
    
    // Use stored chart data for consistency between renders
    let priceData;
    
    // If we don't have modal chart data yet, initialize it
    if (lastSelectedStockId !== company.id || !modalChartData || modalChartData.length === 0) {
      // Initialize modal chart data if needed
      updateModalChartData(company);
      priceData = [company.currentPrice]; // Start with at least one point
    } else {
      // Use the existing historical data
      priceData = modalChartData;
    }
    
    // Ensure we have at least two points for drawing a line
    if (priceData.length === 1) {
      priceData = [priceData[0], priceData[0]];
    }
    
    // Find min and max for scaling
    const minPrice = Math.min(...priceData);
    const maxPrice = Math.max(...priceData);
    const priceRange = maxPrice - minPrice || 1; // Prevent division by zero
    
    // Round min and max for better readability in axes
    const roundedMin = Math.floor(minPrice * 0.998);
    const roundedMax = Math.ceil(maxPrice * 1.002);
    
    // Create points for SVG polyline
    const points = priceData.map((price, index) => {
      const x = (index / (priceData.length - 1)) * chartWidth;
      // Invert Y coordinate for SVG (0 is top)
      const y = chartHeight - ((price - minPrice) / priceRange) * chartHeight;
      return `${x},${y}`;
    }).join(' ');
    
    // Determine line color based on trend direction (first to last point)
    const isPositiveTrend = priceData[priceData.length - 1] >= priceData[0];
    const lineColor = isPositiveTrend ? '#10B981' : '#EF4444';
    const fillColor = isPositiveTrend ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)';
    
    // Generate price area
    const areaPoints = points + ` ${chartWidth},${chartHeight} 0,${chartHeight}`;
    
    // Calculate position for the end point
    const endX = chartWidth;
    const endY = chartHeight - ((priceData[priceData.length - 1] - minPrice) / priceRange) * chartHeight;
    
    // Generate time labels based on actual data points
    let timeLabels = [];
    
    // Generate time labels for points in the chart
    const numLabels = 6; // Show 6 time points
    for (let i = 0; i < numLabels; i++) {
      const dataIndex = Math.floor(i * (priceData.length - 1) / (numLabels - 1));
      const minutesAgo = Math.floor((priceData.length - 1 - dataIndex) * 0.5); // Each point is 30 seconds
      
      // Current market time
      const currentMinute = stockMarket.marketMinute;
      const currentHour = stockMarket.marketHour;
      
      // Calculate the label time (minutes ago)
      let labelMinute = (currentMinute - minutesAgo + 60) % 60;
      let labelHour = currentHour;
      
      if (minutesAgo > currentMinute) {
        labelHour = (currentHour - Math.ceil(minutesAgo / 60) + 24) % 24;
        labelMinute = (labelMinute + 60) % 60;
      }
      
      // Format the time label
      const formattedMinute = labelMinute.toString().padStart(2, '0');
      timeLabels.push(`${labelHour}:${formattedMinute}`);
    }
    
    return (
      <div className="bg-white p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">
          Price History
        </h3>
        <div className="relative chart-container">
          <svg 
            width="100%" 
            height={chartHeight + 30} 
            className="detailed-stock-chart"
            id="detailed-chart"
            viewBox={`0 0 ${chartWidth} ${chartHeight + 30}`}
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Price area fill */}
            <polygon
              points={areaPoints}
              fill={fillColor}
            />
            
            {/* Price line */}
            <polyline
              points={points}
              fill="none"
              stroke={lineColor}
              strokeWidth="2"
              className="price-line"
            />
            
            {/* Only show the end point, not all points */}
            <circle 
              cx={endX} 
              cy={endY} 
              r="4" 
              fill={lineColor}
              className="end-point" 
            />
            
            {/* Interactive hover dot (invisible until hover) */}
            <circle 
              cx="0" 
              cy="0" 
              r="0" 
              fill={lineColor}
              className="hover-point" 
              opacity="0"
            />
            
            {/* Invisible tooltip display */}
            <g className="price-tooltip" opacity="0" transform="translate(0,0)">
              <rect x="-40" y="-30" width="80" height="22" rx="4" fill="rgba(0,0,0,0.7)" />
              <text x="0" y="-15" fill="white" text-anchor="middle" font-size="12" className="tooltip-text">$0.00</text>
            </g>
            
            {/* X-axis */}
            <line 
              x1="0" 
              y1={chartHeight} 
              x2={chartWidth} 
              y2={chartHeight} 
              stroke="#e5e7eb" 
              strokeWidth="1"
            />
            
            {/* X-axis labels */}
            {timeLabels.map((label, index) => {
              const x = (index / (timeLabels.length - 1)) * chartWidth;
              return (
                <text 
                  key={index} 
                  x={x} 
                  y={chartHeight + 20} 
                  textAnchor={index === 0 ? "start" : index === timeLabels.length - 1 ? "end" : "middle"}
                  fill="#6b7280"
                  fontSize="12"
                >
                  {label}
                </text>
              );
            })}
            
            {/* Y-axis labels */}
            <text 
              x="5" 
              y="15" 
              textAnchor="start" 
              fill="#6b7280" 
              fontSize="12"
            >
              ${roundedMax.toFixed(2)}
            </text>
            
            <text 
              x="5" 
              y={chartHeight - 5} 
              textAnchor="start" 
              fill="#6b7280" 
              fontSize="12"
            >
              ${roundedMin.toFixed(2)}
            </text>
            
            {/* Current price marker */}
            <line 
              x1="0" 
              y1={chartHeight - ((company.currentPrice - minPrice) / priceRange) * chartHeight} 
              x2={chartWidth} 
              y2={chartHeight - ((company.currentPrice - minPrice) / priceRange) * chartHeight} 
              stroke={lineColor} 
              strokeWidth="1"
              strokeDasharray="2,2"
            />
            
            {/* Invisible overlay to capture mouse events */}
            <rect 
              x="0" 
              y="0" 
              width={chartWidth} 
              height={chartHeight} 
              fill="transparent" 
              className="detailed-chart-hover-area"
              data-points={points}
              data-color={lineColor}
              data-min-price={minPrice}
              data-price-range={priceRange}
              data-price-data={JSON.stringify(priceData)}
            />
          </svg>
          
          {/* Current price label */}
          <div className="absolute top-1/2 right-2 transform -translate-y-1/2">
            <div className={`px-2 py-1 rounded ${isPositiveTrend ? 'bg-green-100' : 'bg-red-100'}`}>
              <span className={`text-sm font-medium ${isPositiveTrend ? 'text-green-700' : 'text-red-700'}`}>
                ${company.currentPrice.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
        
        {/* Price stats - updated to be more responsive */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mt-4 text-sm">
          <div className="bg-gray-50 p-2 rounded">
            <span className="block text-gray-500">First Point</span>
            <span className="font-medium">${priceData[0].toFixed(2)}</span>
          </div>
          <div className="bg-gray-50 p-2 rounded">
            <span className="block text-gray-500">Current</span>
            <span className="font-medium">${company.currentPrice.toFixed(2)}</span>
          </div>
          <div className="bg-gray-50 p-2 rounded">
            <span className="block text-gray-500">High</span>
            <span className="font-medium">${maxPrice.toFixed(2)}</span>
          </div>
          <div className="bg-gray-50 p-2 rounded">
            <span className="block text-gray-500">Low</span>
            <span className="font-medium">${minPrice.toFixed(2)}</span>
          </div>
        </div>
      </div>
    );
  };
  
  // Notification component
  const renderNotification = () => {
    if (!notification) return null;
    
    const bgColor = notification.type === 'success' ? 'bg-green-100 border-green-400' : 'bg-red-100 border-red-400';
    const textColor = notification.type === 'success' ? 'text-green-700' : 'text-red-700';
    
    return (
      <div className={`fixed bottom-4 right-4 px-4 py-3 rounded border ${bgColor} ${textColor} max-w-md`}>
        <div className="flex items-center">
          <span className="mr-2">
            {notification.type === 'success' ? '✅' : '❌'}
          </span>
          <p>{notification.message}</p>
        </div>
      </div>
    );
  };
  
  // Render Stock Table Header
  const renderMarketTableHeader = () => {
    const timeUntilNextRefresh = getTimeUntilNextGlobalRefresh();
    
    return (
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center">
          <h2 className="text-xl font-bold text-gray-800 flex items-center">
            <span className="mr-2">📊</span> Stock Market
          </h2>
          <span className="ml-4 text-sm text-gray-500">
            {isGlobalRefreshing ? 
              <span className="text-blue-500">Refreshing...</span> : 
              <span>Next update in <span className="font-semibold">{timeUntilNextRefresh}</span>s (5 min in-game)</span>
            }
          </span>
        </div>
        <button 
          onClick={() => setIsMarketTableCollapsed(!isMarketTableCollapsed)}
          className="text-gray-500 hover:text-gray-700 focus:outline-none"
        >
          {isMarketTableCollapsed ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          )}
        </button>
      </div>
    );
  };
  
  // Render Portfolio Table Header
  const renderPortfolioTableHeader = () => {
    return (
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-bold text-gray-800 flex items-center">
          <span className="mr-2">💼</span> Your Portfolio
        </h2>
        <button 
          onClick={() => setIsPortfolioTableCollapsed(!isPortfolioTableCollapsed)}
          className="text-gray-500 hover:text-gray-700 focus:outline-none"
        >
          {isPortfolioTableCollapsed ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          )}
        </button>
      </div>
    );
  };
  
  // Render trade modal
  const renderTradeModal = () => {
    if (!showTradeModal || !selectedStock) return null;
    
    const company = selectedStock;
    const tradeValue = company.currentPrice * tradeQuantity;
    const maxShares = tradeType === 'buy' 
      ? Math.floor(money / company.currentPrice)
      : (() => {
        const ownedStock = stockMarket.playerOwnedStocks.find(s => s.stockId === selectedStock.id);
        return ownedStock ? ownedStock.shares : 0;
      })();
    
    // Calculate time since last refresh for display
    const now = Date.now();
    const millisSinceRefresh = now - lastModalRefresh;
    const timeUntilNextRefresh = Math.max(0, Math.ceil((5000 - millisSinceRefresh) / 1000));
    
    return (
      <div className="modal-overlay">
        <div 
          ref={modalRef}
          className="modal-content max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        >
          {/* Stock info header */}
          <div className="bg-gray-800 text-white p-4 flex items-center justify-between ${showRefreshAnimation ? 'data-refreshed' : ''}">
            <div className="flex items-center">
              <span className="text-2xl mr-3">{company.logo}</span>
              <div>
                <h3 className="font-bold text-lg">{company.name}</h3>
                <div className="text-sm text-gray-300 flex items-center">
                  <span className="font-mono">{company.id}</span>
                  <span className="mx-2">•</span>
                  <span>{company.sector.toUpperCase()}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center justify-end gap-2">
                <div className="text-2xl font-bold">${company.currentPrice.toFixed(2)}</div>
              </div>
              <div className={`text-sm ${company.percentChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {company.percentChange >= 0 ? '+' : ''}{company.percentChange.toFixed(2)}%
              </div>
              <div className="text-xs text-gray-400 mt-1 flex items-center justify-end">
                <span>
                  {timeUntilNextRefresh > 0 ? 
                    `Next update in ${timeUntilNextRefresh}s` :
                    `Updating...`
                  }
                </span>
                {modalRefreshCount > 0 && (
                  <span className="ml-2 text-gray-500">
                    ({modalRefreshCount} update{modalRefreshCount !== 1 ? 's' : ''})
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {/* Detailed price chart */}
          <div className={`p-4 border-b border-gray-200 ${showRefreshAnimation ? 'data-refreshed' : ''}`}>
            {renderDetailedPriceChart(company)}
          </div>
          
          {/* Mode toggle buttons */}
          <div className="px-4 pt-4 pb-2 flex justify-center">
            <div className="inline-flex rounded-md shadow-sm" role="group">
              <button
                type="button"
                onClick={() => setShowTradeModal(false)}
                className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
                  !showTradeModal
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Cancel
              </button>
              <button 
                onClick={() => executeTrade()}
                className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
                  showTradeModal
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {tradeType === 'buy' ? 'Buy' : 'Sell'} {tradeQuantity} Shares
              </button>
            </div>
          </div>
          
          {/* Trading controls */}
          <div className={`p-4 ${showRefreshAnimation ? 'data-refreshed' : ''}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex">
                <button 
                  className={`px-4 py-2 rounded-l-lg ${tradeType === 'buy' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-200 text-gray-700'}`}
                  onClick={() => setTradeType('buy')}
                >
                  Buy
                </button>
                <button 
                  className={`px-4 py-2 rounded-r-lg ${tradeType === 'sell' 
                    ? 'bg-red-600 text-white' 
                    : 'bg-gray-200 text-gray-700'}`}
                  onClick={() => setTradeType('sell')}
                  disabled={(() => {
                    const ownedStock = stockMarket.playerOwnedStocks.find(s => s.stockId === selectedStock.id);
                    return !ownedStock || ownedStock.shares <= 0;
                  })()}
                >
                  Sell
                </button>
              </div>
              
              <div className="text-sm text-gray-500">
                {tradeType === 'buy' 
                  ? `Max: ${maxShares} shares`
                  : `Owned: ${(() => {
                    const ownedStock = stockMarket.playerOwnedStocks.find(s => s.stockId === selectedStock.id);
                    return ownedStock ? ownedStock.shares : 0;
                  })()} shares`}
              </div>
            </div>
            
            {/* Quantity input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
              <div className="quantity-input">
                <button 
                  className="quantity-button"
                  onClick={() => setTradeQuantity(Math.max(1, tradeQuantity - 1))}
                >
                  −
                </button>
                <input 
                  type="number" 
                  min="1" 
                  max={maxShares}
                  value={tradeQuantity}
                  onChange={(e) => setTradeQuantity(Math.min(maxShares, Math.max(1, parseInt(e.target.value) || 1)))}
                  className="flex-1 min-w-0 block w-full px-3 py-2 border border-gray-300 text-center"
                />
                <button 
                  className="quantity-button"
                  onClick={() => setTradeQuantity(Math.min(maxShares, tradeQuantity + 1))}
                >
                  +
                </button>
              </div>
            </div>
            
            {/* Trade details */}
            <div className={`bg-gray-50 p-3 rounded-md mb-4 ${showRefreshAnimation ? 'data-refreshed' : ''}`}>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Share Price:</span>
                <span className="font-medium">${company.currentPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Quantity:</span>
                <span className="font-medium">{tradeQuantity}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-200">
                <span className="text-gray-700 font-medium">Total Value:</span>
                <span className="font-bold">${tradeValue.toFixed(2)}</span>
              </div>
            </div>
            
            {/* Execute button */}
            <div className="flex space-x-3">
              <button 
                className="flex-1 py-2 px-4 rounded-md font-medium bg-gray-300 hover:bg-gray-400 text-gray-800 cancel-button"
                onClick={() => setShowTradeModal(false)}
              >
                Cancel
              </button>
              <button 
                className={`flex-1 py-2 px-4 rounded-md font-medium ${
                  tradeType === 'buy' 
                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
                onClick={executeTrade}
                disabled={(tradeType === 'buy' && tradeValue > money) || 
                        (tradeType === 'sell' && (() => {
                          const ownedStock = stockMarket.playerOwnedStocks.find(s => s.stockId === selectedStock.id);
                          return !ownedStock || ownedStock.shares < tradeQuantity;
                        })())}
              >
                {tradeType === 'buy' ? 'Buy' : 'Sell'} {tradeQuantity} Shares
              </button>
            </div>
            
            {/* Additional info */}
            {tradeType === 'buy' && (
              <div className={`mt-4 text-sm ${showRefreshAnimation ? 'data-refreshed' : ''}`}>
                <div className="flex justify-between">
                  <span className="text-gray-600">Available Cash:</span>
                  <span className="font-medium">${money.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Remaining After Purchase:</span>
                  <span className={`font-medium ${money - tradeValue < 0 ? 'text-red-600' : ''}`}>
                    ${(money - tradeValue).toLocaleString()}
                  </span>
                </div>
              </div>
            )}
            
            {tradeType === 'sell' && (() => {
              const ownedStock = stockMarket.playerOwnedStocks.find(s => s.stockId === selectedStock.id);
              return ownedStock && ownedStock.shares > 0;
            })() && (
              <div className={`mt-4 text-sm ${showRefreshAnimation ? 'data-refreshed' : ''}`}>
                <div className="flex justify-between">
                  <span className="text-gray-600">Current Position:</span>
                  <span className="font-medium">
                    {(() => {
                      const ownedStock = stockMarket.playerOwnedStocks.find(s => s.stockId === selectedStock.id);
                      const shares = ownedStock ? ownedStock.shares : 0;
                      return `${shares} shares (${(shares * company.currentPrice).toLocaleString()})`;
                    })()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Remaining After Sale:</span>
                  <span className="font-medium">
                    {(() => {
                      const ownedStock = stockMarket.playerOwnedStocks.find(s => s.stockId === selectedStock.id);
                      const shares = ownedStock ? ownedStock.shares : 0;
                      const remainingShares = shares - tradeQuantity;
                      return `${remainingShares} shares (${(remainingShares * company.currentPrice).toLocaleString()})`;
                    })()}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };
  
  // Setup mouse tracking for chart hover effects
  useEffect(() => {
    // Helper to find closest point on a path to mouse position
    const findClosestPoint = (points, mouseX) => {
      if (!points || points.length === 0) return null;
      
      const pointsArray = points.split(' ').map(point => {
        const [x, y] = point.split(',').map(parseFloat);
        return { x, y };
      });
      
      // Find the point with x value closest to mouseX
      let closestPoint = null;
      let minDistance = Infinity;
      
      pointsArray.forEach(point => {
        const distance = Math.abs(point.x - mouseX);
        if (distance < minDistance) {
          minDistance = distance;
          closestPoint = point;
        }
      });
      
      return closestPoint;
    };
    
    // Add mouse event listeners to small charts
    const handleSmallChartHover = (event) => {
      const rect = event.currentTarget;
      const svg = rect.parentNode;
      
      // Get chart data from rect attributes
      const points = rect.getAttribute('data-points');
      const color = rect.getAttribute('data-color');
      
      // Create hover dot if it doesn't exist
      let hoverDot = svg.querySelector('.hover-dot');
      if (!hoverDot) {
        hoverDot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        hoverDot.setAttribute('class', 'hover-dot');
        hoverDot.setAttribute('r', '3');
        hoverDot.setAttribute('fill', color);
        svg.appendChild(hoverDot);
      }
      
      // Calculate position relative to SVG
      const svgRect = svg.getBoundingClientRect();
      const mouseX = event.clientX - svgRect.left;
      
      // Find closest point on line
      const closestPoint = findClosestPoint(points, mouseX);
      if (closestPoint) {
        hoverDot.setAttribute('cx', closestPoint.x);
        hoverDot.setAttribute('cy', closestPoint.y);
        hoverDot.style.opacity = '1';
      }
    };
    
    const handleSmallChartLeave = (event) => {
      const svg = event.currentTarget.parentNode;
      const hoverDot = svg.querySelector('.hover-dot');
      if (hoverDot) {
        hoverDot.style.opacity = '0';
      }
    };
    
    // Add mouse event listeners to detailed chart
    const handleDetailedChartHover = (event) => {
      const rect = event.currentTarget;
      const svg = rect.parentNode;
      
      // Get chart data
      const points = rect.getAttribute('data-points');
      const minPrice = parseFloat(rect.getAttribute('data-min-price'));
      const priceRange = parseFloat(rect.getAttribute('data-price-range'));
      const priceData = JSON.parse(rect.getAttribute('data-price-data'));
      
      // Get elements
      const hoverPoint = svg.querySelector('.hover-point');
      const tooltip = svg.querySelector('.price-tooltip');
      const tooltipText = svg.querySelector('.tooltip-text');
      
      // Calculate position relative to SVG
      const svgRect = svg.getBoundingClientRect();
      const mouseX = event.clientX - svgRect.left;
      
      // Find closest point on line
      const closestPoint = findClosestPoint(points, mouseX);
      if (closestPoint) {
        // Update hover point position
        hoverPoint.setAttribute('cx', closestPoint.x);
        hoverPoint.setAttribute('cy', closestPoint.y);
        hoverPoint.setAttribute('r', '5');
        hoverPoint.style.opacity = '1';
        
        // Calculate the price at this point
        const xRatio = closestPoint.x / svgRect.width;
        const dataIndex = Math.round(xRatio * (priceData.length - 1));
        const price = priceData[dataIndex];
        
        // Calculate time at this point (minutes ago from current time)
        const minutesAgo = Math.round((priceData.length - 1 - dataIndex) * (60 / priceData.length));
        
        // Calculate the tooltip time (minutes ago)
        const currentMinute = stockMarket.marketMinute;
        const currentHour = stockMarket.marketHour;
        
        // Calculate the tooltip time (minutes ago)
        let tooltipMinute = (currentMinute - minutesAgo + 60) % 60;
        let tooltipHour = currentHour;
        
        if (currentMinute < minutesAgo) {
          tooltipHour = (currentHour - 1 + 24) % 24; // Go back an hour
        }
        
        // Format the time
        const formattedMinute = tooltipMinute.toString().padStart(2, '0');
        const timeStr = `${tooltipHour}:${formattedMinute}`;
        
        // Update tooltip
        tooltipText.textContent = `$${price.toFixed(2)} @ ${timeStr}`;
        tooltip.setAttribute('transform', `translate(${closestPoint.x},${closestPoint.y - 5})`);
        tooltip.style.opacity = '1';
        
        // Update tooltip rectangle size based on text length
        const tooltipRect = tooltip.querySelector('rect');
        if (tooltipRect) {
          tooltipRect.setAttribute('width', '120');
          tooltipRect.setAttribute('x', '-60');
        }
      }
    };
    
    const handleDetailedChartLeave = (event) => {
      const svg = event.currentTarget.parentNode;
      const hoverPoint = svg.querySelector('.hover-point');
      const tooltip = svg.querySelector('.price-tooltip');
      
      if (hoverPoint) hoverPoint.style.opacity = '0';
      if (tooltip) tooltip.style.opacity = '0';
    };
    
    // Attach event listeners
    const smallChartAreas = document.querySelectorAll('.chart-hover-area');
    smallChartAreas.forEach(area => {
      area.addEventListener('mousemove', handleSmallChartHover);
      area.addEventListener('mouseleave', handleSmallChartLeave);
    });
    
    const detailedChartArea = document.querySelector('.detailed-chart-hover-area');
    if (detailedChartArea) {
      detailedChartArea.addEventListener('mousemove', handleDetailedChartHover);
      detailedChartArea.addEventListener('mouseleave', handleDetailedChartLeave);
    }
    
    // Cleanup
    return () => {
      smallChartAreas.forEach(area => {
        area.removeEventListener('mousemove', handleSmallChartHover);
        area.removeEventListener('mouseleave', handleSmallChartLeave);
      });
      
      if (detailedChartArea) {
        detailedChartArea.removeEventListener('mousemove', handleDetailedChartHover);
        detailedChartArea.removeEventListener('mouseleave', handleDetailedChartLeave);
      }
    };
  }, [showTradeModal, getFilteredAndSortedCompanies().length, stockMarket.marketHour, stockMarket.marketMinute]);
  
  // Add an effect to track price movement history when price changes are recorded
  useEffect(() => {
    if (stockMarket.companies) {
      // Create a mapping of company price movements for display
      const newPriceHistory = {};
      
      stockMarket.companies.forEach(company => {
        if (!priceMovementHistory[company.id]) {
          // Initialize with an array, not an object with history
          newPriceHistory[company.id] = [];
        } else {
          // Make sure we're using the array correctly
          newPriceHistory[company.id] = Array.isArray(priceMovementHistory[company.id]) ? 
            [...priceMovementHistory[company.id]] : [];
        }
        
        // Only add new entry if price direction has been recorded
        if (company.priceDirection && company.priceChangeTime) {
          const existingEntry = newPriceHistory[company.id].find(
            entry => entry.timestamp === company.priceChangeTime
          );
          
          if (!existingEntry) {
            newPriceHistory[company.id].push({
              price: company.lastRecordedPrice,
              direction: company.priceDirection,
              timestamp: company.priceChangeTime
            });
            
            // Keep only the last 10 entries
            if (newPriceHistory[company.id].length > 10) {
              newPriceHistory[company.id] = newPriceHistory[company.id].slice(-10);
            }
          }
        }
      });
      
      setPriceMovementHistory(newPriceHistory);
    }
  }, [stockMarket.companies, stockMarket.lastPriceRecordTime]);

  // Add a useEffect to update the countdown timer every second
  useEffect(() => {
    if (!showTradeModal) return;
    
    // Set up a timer to update the countdown every second
    const countdownTimer = setInterval(() => {
      // Force a re-render to update the timeUntilNextRefresh calculation
      setLastModalRefresh(prevTime => prevTime);
    }, 1000);
    
    return () => clearInterval(countdownTimer);
  }, [showTradeModal]);

  // Add a useEffect to refresh all stock prices every 30 seconds
  useEffect(() => {
    // Clear any existing timer
    if (globalRefreshTimer.current) {
      clearInterval(globalRefreshTimer.current);
    }
    
    // Set up a new timer for 30-second global refresh
    globalRefreshTimer.current = setInterval(() => {
      // Set refreshing state
      setIsGlobalRefreshing(true);
      
      // Trigger refresh of price data and charts
      stockMarketDispatch({ type: 'REFRESH_PRICES' });
      
      // Update last refresh time
      setLastGlobalRefresh(Date.now());
      
      // Reset refreshing state after a delay
      setTimeout(() => setIsGlobalRefreshing(false), 800);
      
    }, 5000); // 5 seconds instead of 30000
    
    // Clean up interval when component unmounts
    return () => {
      if (globalRefreshTimer.current) {
        clearInterval(globalRefreshTimer.current);
        globalRefreshTimer.current = null;
      }
    };
  }, [stockMarketDispatch]);

  // This function is now defined earlier in the component with useCallback

  // Add a useEffect to update the countdown timer for global refresh
  useEffect(() => {
    // Set up a timer to update the countdown every second
    const globalCountdownTimer = setInterval(() => {
      // Force a re-render to update the timeUntilNextRefresh calculation
      setLastGlobalRefresh(prevTime => prevTime);
    }, 1000);
    
    return () => clearInterval(globalCountdownTimer);
  }, []);

  // Calculate total net worth (cash + stocks + other assets)
  const calculateNetWorth = useCallback(() => {
    // Cash value
    let totalWorth = money;
    
    // Add stock portfolio value
    const stockValue = stockMarket.playerOwnedStocks.reduce((total, stock) => {
      const company = stockMarket.companies.find(c => c.id === stock.stockId);
      if (company) {
        return total + (stock.shares * company.currentPrice);
      }
      return total;
    }, 0);
    
    totalWorth += stockValue;
    
    // Add other assets value (in a full implementation, this would include properties, businesses, etc.)
    // This could be expanded later as more asset types are added
    
    return totalWorth;
  }, [money, stockMarket.playerOwnedStocks, stockMarket.companies]);
  
  // Update net worth history when values change
  useEffect(() => {
    const now = Date.now();
    // Only update every second to avoid too frequent updates
    if (now - lastNetWorthUpdate > 1000) {
      const currentNetWorth = calculateNetWorth();
      
      // Check if net worth has changed to trigger animation
      if (currentNetWorth !== netWorth) {
        setNetWorth(currentNetWorth);
        
        // Add animation class to net worth value
        const netWorthElement = document.querySelector('.net-worth-value');
        if (netWorthElement) {
          netWorthElement.classList.add('net-worth-pulse');
          setTimeout(() => {
            netWorthElement.classList.remove('net-worth-pulse');
          }, 500);
        }
        
        // Add to history with timestamp
        setNetWorthHistory(prevHistory => {
          // Keep only the last 100 points to avoid memory issues
          const newHistory = [...prevHistory, { value: currentNetWorth, timestamp: now }];
          if (newHistory.length > 100) {
            return newHistory.slice(-100);
          }
          return newHistory;
        });
      }
      
      setLastNetWorthUpdate(now);
    }
  }, [money, stockMarket.playerOwnedStocks, stockMarket.companies, calculateNetWorth, lastNetWorthUpdate, netWorth]);

  // Render net worth chart
  const renderNetWorthChart = () => {
    const chartHeight = 60;
    const chartWidth = 300;
    
    // Need at least 2 points to draw a chart
    const chartData = netWorthHistory.length > 1 ? netWorthHistory : 
      netWorthHistory.length === 1 ? [...netWorthHistory, ...netWorthHistory] : 
      [{ value: money, timestamp: Date.now() - 10000 }, { value: money, timestamp: Date.now() }];
    
    // Extract just the values for min/max calculation
    const values = chartData.map(point => point.value);
    
    // Find min and max for scaling
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    // Add padding to prevent chart from touching edges
    const valueRange = (maxValue - minValue) || 1; // Prevent division by zero
    
    // Create points for SVG polyline
    const points = chartData.map((point, index) => {
      const x = (index / (chartData.length - 1)) * chartWidth;
      // Invert Y coordinate for SVG (0 is top)
      const y = chartHeight - ((point.value - minValue) / valueRange) * chartHeight * 0.8 + (chartHeight * 0.1);
      return `${x},${y}`;
    }).join(' ');
    
    // Determine if trend is positive by comparing first and last values
    const isPositiveTrend = chartData[chartData.length - 1].value >= chartData[0].value;
    const lineColor = isPositiveTrend ? '#10B981' : '#EF4444';
    const fillColor = isPositiveTrend ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)';
    
    // Generate area under the line
    const areaPoints = points + ` ${chartWidth},${chartHeight} 0,${chartHeight}`;
    
    return (
      <svg 
        width="100%" 
        height={chartHeight} 
        className="net-worth-chart"
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Add area fill under the line for better visualization */}
        <polygon
          points={areaPoints}
          fill={fillColor}
        />
        <polyline
          points={points}
          fill="none"
          stroke={lineColor}
          strokeWidth="2"
        />
      </svg>
    );
  };

  // Render Net Worth Card
  const renderNetWorthCard = () => {
    // Calculate daily change (compare with value from 24 data points ago, or start if not enough history)
    const currentNetWorth = netWorth;
    const previousNetWorth = netWorthHistory.length > 24 ? 
      netWorthHistory[netWorthHistory.length - 25].value : 
      netWorthHistory.length > 0 ? netWorthHistory[0].value : currentNetWorth;
    
    const netWorthChange = currentNetWorth - previousNetWorth;
    const percentChange = previousNetWorth !== 0 ? (netWorthChange / previousNetWorth) * 100 : 0;
    
    // Determine gradient color based on trend
    const isPositiveTrend = netWorthChange >= 0;
    const gradientClasses = isPositiveTrend ? 
      'from-green-500/10 to-blue-500/5' : 
      'from-red-500/10 to-orange-500/5';
    
    const iconClass = isPositiveTrend ? 'text-green-500' : 'text-red-500';
    const icon = isPositiveTrend ? '📈' : '📉';
    
    return (
      <div className={`bg-gradient-to-br ${gradientClasses} rounded-lg shadow-md overflow-hidden border border-gray-200 mb-6 relative transition-all duration-500`}>
        <div className="absolute inset-0 opacity-30">
          {renderNetWorthChart()}
        </div>
        <div className="p-4 relative z-10">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center mb-1">
                <span className={`mr-2 ${iconClass}`}>{icon}</span>
                <p className="text-sm font-medium text-gray-500">Net Worth</p>
              </div>
              <p className="text-2xl font-bold text-gray-800 net-worth-value">${currentNetWorth.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
            </div>
            <div className="flex flex-col items-end">
              <div className={`text-sm font-medium ${netWorthChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {netWorthChange >= 0 ? '+' : '-'}${Math.abs(netWorthChange).toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </div>
              <div className={`text-xs ${netWorthChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ({netWorthChange >= 0 ? '+' : ''}{percentChange.toFixed(2)}%)
              </div>
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500 flex items-center justify-between">
            <span>Includes cash, stocks, and other assets</span>
            <span className="text-xs text-gray-400">{new Date().toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    );
  };

  // *** NEW NOW AVERAGE CHART FUNCTION ***
  const NOWAverageChart = () => {
    const { nowAverage } = stockMarket;
  
    if (!nowAverage || !nowAverage.valueHistory || nowAverage.valueHistory.length < 2) {
      return (
        <div className="flex items-center justify-center h-full text-xs text-gray-400">
          Collecting market data...
        </div>
      );
    }
  
    // Filter out any non-finite values to prevent SVG errors
    const filteredHistory = nowAverage.valueHistory.filter(value => Number.isFinite(value));
  
    // Need at least two valid points to draw a line
    if (filteredHistory.length < 2) {
      return (
        <div className="flex items-center justify-center h-full text-xs text-gray-400">
          Waiting for valid data...
        </div>
      );
    }
    
    const valueHistory = filteredHistory; // Use the filtered history
    const chartHeight = 60; // Smaller chart height for embedding
  
    const minValue = Math.min(...valueHistory);
    const maxValue = Math.max(...valueHistory);
    const valueRange = maxValue - minValue || 1;
  
    const pathData = valueHistory.map((value, index) => {
      const x = (index / (valueHistory.length - 1)) * 100;
      // Ensure y is also a finite number before adding to path
      let yCoord = chartHeight - ((value - minValue) / valueRange) * chartHeight;
      if (!Number.isFinite(yCoord)) {
        yCoord = chartHeight / 2; // Default to middle if calculation fails
      }
      return `${index === 0 ? 'M' : 'L'} ${x}% ${yCoord.toFixed(2)}`;
    }).join(' ');
  
    const marketUp = valueHistory[valueHistory.length - 1] >= valueHistory[0];
    const lineColor = marketUp ? '#22c55e' : '#ef4444';
  
    return (
      <svg 
        width="100%" 
        height={chartHeight} 
        preserveAspectRatio="none" 
        className="overflow-visible"
      >
        {/* Simplified line without fill */}
        <path
          d={pathData}
          fill="none"
          stroke={lineColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  };

  // *** NEW NOW AVERAGE DISPLAY FUNCTION ***
  const NOWAverageDisplay = () => {
    const { nowAverage } = stockMarket;

    if (!nowAverage || typeof nowAverage.currentValue === 'undefined') {
      return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 text-center text-gray-500">
          Loading Market Data...
        </div>
      );
    }

    const formattedValue = nowAverage.currentValue.toFixed(2);
    const formattedChange = (nowAverage.percentChange >= 0 ? '+' : '') + nowAverage.percentChange.toFixed(2);
    const isUp = nowAverage.percentChange >= 0;
    const changeColor = isUp ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden mb-6 border border-gray-200 dark:border-gray-700">
        <div className="p-5">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">NOW Average</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Overall Market Indicator</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{formattedValue}</p>
              <p className={`text-sm font-medium ${changeColor} flex items-center justify-end`}>
                {formattedChange}%
                {isUp ? (
                  <svg className="ml-1 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                ) : (
                  <svg className="ml-1 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                )}
              </p>
            </div>
          </div>
          {/* Embedded Chart */}
          <div className="h-16 -mx-5 -mb-5 mt-2 opacity-80">
            <NOWAverageChart />
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="bg-gray-50 min-h-screen p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header with account balance */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Stock Market</h1>
            <p className="text-gray-600">Invest in companies and build your portfolio</p>
          </div>
          <div className="mt-4 md:mt-0 bg-white px-4 py-3 rounded-lg shadow border border-gray-200">
            <p className="text-gray-500 text-sm">Available Funds</p>
            <p className="text-2xl font-bold text-green-600">${money.toLocaleString()}</p>
          </div>
        </div>
        
        {/* Stock ticker */}
        {renderStockTicker()}
        
        {/* ADD THE NEW NOWAverageDisplay CALL BELOW */}
        <NOWAverageDisplay />
        
        {/* Net Worth Card */}
        {renderNetWorthCard()}
        
        {/* Stock Market Table Section */}
        <div className="mb-8">
          {renderMarketTableHeader()}
          
          {!isMarketTableCollapsed && (
            <>
              {renderTableControls()}
              <div className={`bg-white rounded-b-lg shadow border border-gray-200 overflow-hidden ${isGlobalRefreshing ? 'data-refreshed' : ''}`}>
                <div className="overflow-x-auto max-w-full mobile-table-container">
                  <table className="w-full min-w-[640px] stock-table">
                    <thead>
                      <tr className="bg-gray-50 text-left">
                        <th 
                          className="px-2 py-2 text-gray-500 font-medium text-sm cursor-pointer w-[15%]"
                          onClick={() => handleSort('id')}
                        >
                          Ticker {renderSortArrow('id')}
                        </th>
                        <th 
                          className="px-2 py-2 text-gray-500 font-medium text-sm cursor-pointer w-[30%]"
                          onClick={() => handleSort('name')}
                        >
                          Name {renderSortArrow('name')}
                        </th>
                        <th 
                          className="px-2 py-2 text-gray-500 font-medium text-sm cursor-pointer w-[15%]"
                          onClick={() => handleSort('currentPrice')}
                        >
                          Price {renderSortArrow('currentPrice')}
                        </th>
                        <th 
                          className="px-2 py-2 text-gray-500 font-medium text-sm cursor-pointer w-[15%]"
                          onClick={() => handleSort('percentChange')}
                        >
                          Change {renderSortArrow('percentChange')}
                        </th>
                        <th className="px-2 py-2 text-gray-500 font-medium text-sm w-[25%]">Last Day</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getFilteredAndSortedCompanies().map(company => (
                        <tr 
                          key={company.id} 
                          className="border-t border-gray-100 hover:bg-gray-50 cursor-pointer"
                          onClick={() => handleSelectStock(company)}
                        >
                          <td className="px-2 py-2 font-medium">{company.id}</td>
                          <td className="px-2 py-2">
                            <div className="flex items-center">
                              <span className="text-xl mr-2">{company.logo}</span>
                              <span className="truncate">{company.name}</span>
                            </div>
                          </td>
                          <td className="px-2 py-2 font-medium">
                            <span className="bg-green-500 text-white px-3 py-1 rounded-full inline-block">
                              ${company.currentPrice.toFixed(2)}
                            </span>
                          </td>
                          <td className={`px-2 py-2 font-medium ${company.percentChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {company.percentChange >= 0 ? '+' : ''}{company.percentChange.toFixed(2)}%
                          </td>
                          <td className="px-2 py-2">{renderPriceChart(company)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
        
        {/* Portfolio Section */}
        <div className="mt-8">
          {renderPortfolioTableHeader()}
          
          {!isPortfolioTableCollapsed && (
            <>
              {/* Portfolio Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
                  <p className="text-sm text-gray-500">Total Holdings</p>
                  <p className="text-2xl font-bold text-gray-800">
                    ${stockMarket.playerOwnedStocks
                      .reduce((total, stock) => {
                        const company = stockMarket.companies.find(c => c.id === stock.stockId);
                        return total + (stock.shares * company.currentPrice);
                      }, 0)
                      .toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
                  <p className="text-sm text-gray-500">Total Stocks Owned</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {stockMarket.playerOwnedStocks
                      .reduce((total, stock) => total + stock.shares, 0)}
                  </p>
                </div>
                <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
                  <p className="text-sm text-gray-500">Different Companies</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {stockMarket.playerOwnedStocks.length}
                  </p>
                </div>
              </div>
              
              {/* Owned Stocks Table */}
              <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                {stockMarket.playerOwnedStocks.length > 0 ? (
                  <div className="overflow-x-auto max-w-full mobile-table-container">
                    <table className="w-full min-w-[640px] stock-table">
                      <thead>
                        <tr className="bg-gray-50 text-left">
                          <th className="px-2 py-2 text-gray-500 font-medium text-sm w-[25%]">Company</th>
                          <th className="px-2 py-2 text-gray-500 font-medium text-sm w-[10%]">Shares</th>
                          <th className="px-2 py-2 text-gray-500 font-medium text-sm w-[15%]">Current Value</th>
                          <th className="px-2 py-2 text-gray-500 font-medium text-sm w-[20%]">Daily Change</th>
                          <th className="px-2 py-2 text-gray-500 font-medium text-sm w-[20%]">Chart</th>
                          <th className="px-2 py-2 text-gray-500 font-medium text-sm w-[10%]">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stockMarket.playerOwnedStocks.map(ownedStock => {
                            const company = stockMarket.companies.find(c => c.id === ownedStock.stockId);
                            const ownedValue = ownedStock.shares * company.currentPrice;
                            const previousValue = ownedStock.shares * company.previousPrice;
                            const valueDiff = ownedValue - previousValue;
                            const percentChange = (valueDiff / previousValue) * 100;
                            
                            return (
                              <tr key={company.id} className="border-t border-gray-100 hover:bg-gray-50 cursor-pointer" onClick={() => handleSelectStock(company)}>
                                <td className="px-2 py-2">
                                  <div className="flex items-center">
                                    <span className="text-xl mr-2">{company.logo}</span>
                                    <div>
                                      <span className="font-medium block">{company.name}</span>
                                      <span className="text-xs text-gray-500">{company.id}</span>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-2 py-2 font-medium">{ownedStock.shares}</td>
                                <td className="px-2 py-2 font-medium">
                                  <span className="bg-green-500 text-white px-3 py-1 rounded-full inline-block">
                                    ${ownedValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                  </span>
                                </td>
                                <td className={`px-2 py-2 font-medium ${valueDiff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {valueDiff >= 0 ? '+' : ''}${Math.abs(valueDiff).toLocaleString(undefined, { maximumFractionDigits: 2 })} 
                                  ({percentChange >= 0 ? '+' : ''}{percentChange.toFixed(2)}%)
                                </td>
                                <td className="px-2 py-2">{renderPriceChart(company)}</td>
                                <td className="px-2 py-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSelectStock(company);
                                      setTradeType('sell');
                                    }}
                                    className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                                  >
                                    Sell
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <span className="text-2xl text-gray-400">📈</span>
                    </div>
                    <h3 className="text-lg font-medium text-gray-700 mb-2">No Stocks Owned Yet</h3>
                    <p className="text-gray-500 max-w-md mx-auto">
                      Start building your portfolio by investing in companies from the market list above.
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
        
        {/* Market details footer */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Market Day: {stockMarket.marketDay} | Time: {stockMarket.marketHour}:{stockMarket.marketMinute.toString().padStart(2, '0')}</p>
          <p className="mt-2">
            {stockMarket.marketOpen 
              ? <span className="text-green-600">Market Open</span> 
              : <span className="text-red-600">Market Closed</span>}
          </p>
        </div>
      </div>
      
      {/* Floating notification */}
      {renderNotification()}
      
      {/* Trading modal */}
      {renderTradeModal()}
    </div>
  );
};

export default Finance;