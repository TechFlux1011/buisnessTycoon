import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useGame } from '../context/GameContext';
import { useStockMarket } from '../context/StockMarketContext';
import { formatCurrency } from '../data/stockMarketData';
import '../styles/Finance.css';

const Finance = () => {
  const { state, updateMoney } = useGame();
  const { stockMarket, buyStock, sellStock } = useStockMarket();
  const { money } = state;
  
  // Component state
  const [selectedStock, setSelectedStock] = useState(null);
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
  
  // Add state for NOW Average chart data
  const [nowAverageChartData, setNowAverageChartData] = useState([]);
  
  // Add timer state for modal refresh
  const [lastModalRefresh, setLastModalRefresh] = useState(Date.now());
  const [modalRefreshCount, setModalRefreshCount] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showRefreshAnimation, setShowRefreshAnimation] = useState(false);
  
  // Add these state variables near the other state variables
  const [betAmount, setBetAmount] = useState(100);
  const [showBettingUI, setShowBettingUI] = useState(false);
  const [activeBets, setActiveBets] = useState([]);
  const [priceMovementHistory, setPriceMovementHistory] = useState({});
  
  const tickerRef = useRef(null);
  const modalRef = useRef(null);
  const modalRefreshTimer = useRef(null);
  
  const sectors = useMemo(() => {
    const uniqueSectors = new Set(stockMarket.companies.map(company => company.sector));
    return ['all', ...Array.from(uniqueSectors)];
  }, [stockMarket.companies]);
  
  // Extract unique sectors for filter dropdown
  useEffect(() => {
    if (stockMarket.companies) {
      const sectors = [...new Set(stockMarket.companies.map(company => company.sector))];
      setAvailableSectors(sectors);
    }
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
  
  // Render NOW Average display
  const renderNOWAverage = () => {
    const { nowAverage } = stockMarket;
    
    // Ensure we have data
    if (!nowAverage) return null;
    
    // Get color based on trending direction
    const valueColor = nowAverage.trending === 'up' ? 'text-green-500' : 
                       nowAverage.trending === 'down' ? 'text-red-500' : 
                       'text-gray-700';
    
    // Dark mode compatible colors
    const darkValueColor = nowAverage.trending === 'up' ? 'dark:text-green-400' : 
                          nowAverage.trending === 'down' ? 'dark:text-red-400' : 
                          'dark:text-gray-300';
    
    return (
      <div className="now-average-container bg-white dark:bg-gray-800 shadow-md rounded-lg p-4 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center">
              NOW Average
              <span className={`ml-2 text-sm px-2 py-1 rounded ${
                nowAverage.trending === 'up' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 
                nowAverage.trending === 'down' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : 
                'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
              }`}>
                {nowAverage.trending === 'up' ? 'Bullish' : 
                 nowAverage.trending === 'down' ? 'Bearish' : 
                 'Stable'}
              </span>
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {nowAverage.description}
            </p>
          </div>
          
          <div className="mt-2 md:mt-0 flex flex-col items-end">
            <div className={`text-2xl font-bold ${valueColor} ${darkValueColor}`}>
              ${nowAverage.currentValue.toFixed(2)}
            </div>
            <div className={`flex items-center ${nowAverage.percentChange >= 0 ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
              <span>
                {nowAverage.percentChange >= 0 ? '+' : ''}
                {nowAverage.percentChange.toFixed(2)}%
              </span>
              {nowAverage.percentChange > 0 ? (
                <svg className="ml-1 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              ) : nowAverage.percentChange < 0 ? (
                <svg className="ml-1 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              ) : null}
            </div>
          </div>
        </div>
        
        {/* NOW Average Chart */}
        <div className="now-average-chart-container h-32 md:h-48">
          {renderNOWAverageChart()}
        </div>
      </div>
    );
  };
  
  // Render NOW Average chart
  const renderNOWAverageChart = () => {
    if (!stockMarket.nowAverage || !stockMarket.nowAverage.valueHistory) {
      return <div className="flex items-center justify-center h-full">Loading chart data...</div>;
    }
    
    const { valueHistory, percentChange } = stockMarket.nowAverage;
    
    // Chart dimensions
    const chartHeight = 130;
    const chartWidth = '100%';
    
    // Find min and max for scaling
    const minValue = Math.min(...valueHistory);
    const maxValue = Math.max(...valueHistory);
    const valueRange = maxValue - minValue || 1; // Prevent division by zero
    
    // Create points for SVG polyline - using percentage width for responsive scaling
    const points = valueHistory.map((value, index) => {
      const x = `${(index / (valueHistory.length - 1)) * 100}%`;
      // Invert Y coordinate for SVG (0 is top)
      const y = chartHeight - ((value - minValue) / valueRange) * chartHeight;
      return `${x},${y}`;
    }).join(' ');
    
    // Determine line color based on trend
    const lineColor = percentChange >= 0 ? 'var(--accent-green, #22c55e)' : 'var(--accent-red, #ef4444)';
    const fillColor = percentChange >= 0 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)';
    
    // Grid lines
    const gridLines = [];
    for (let i = 1; i < 5; i++) {
      const y = (i * chartHeight) / 5;
      gridLines.push(
        <line
          key={`grid-${i}`}
          x1="0"
          y1={y}
          x2="100%"
          y2={y}
          stroke="var(--chart-grid-color, rgba(0, 0, 0, 0.05))"
          strokeWidth="1"
          strokeDasharray="5,5"
        />
      );
    }
    
    return (
      <div className="w-full h-full relative">
        <svg 
          width={chartWidth} 
          height={chartHeight} 
          className="now-average-chart"
          preserveAspectRatio="none"
        >
          {/* Grid lines */}
          {gridLines}
          
          {/* Area fill under the line */}
          <polygon
            points={`${points} 100%,${chartHeight} 0,${chartHeight}`}
            fill={fillColor}
          />
          
          {/* Line chart */}
          <polyline
            points={points}
            fill="none"
            stroke={lineColor}
            strokeWidth="2"
          />
          
          {/* Only show dot at the end of the line, consistent with stock charts */}
          <circle 
            cx={`100%`}
            cy={chartHeight - ((valueHistory[valueHistory.length - 1] - minValue) / valueRange) * chartHeight}
            r="3" 
            fill={lineColor} 
          />
        </svg>
        
        {/* Value labels */}
        <div className="absolute top-0 right-0 text-xs text-gray-500 dark:text-gray-400">
          ${maxValue.toFixed(2)}
        </div>
        <div className="absolute bottom-0 right-0 text-xs text-gray-500 dark:text-gray-400">
          ${minValue.toFixed(2)}
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
  
  // Listen for window resize to update chart dimensions
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
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
    
    // Reset the betting UI
    setShowBettingUI(false);
  };
  
  // Function to update modal chart data
  const updateModalChartData = (company) => {
    if (!company) return;
    
    // If we already have chart data, just append the latest price
    if (modalChartData && lastSelectedStockId === company.id) {
      // Only add a new point if the price has changed
      const lastPoint = modalChartData[modalChartData.length - 1];
      if (lastPoint !== company.currentPrice) {
        // Append the new price to the existing data
        const updatedData = [...modalChartData, company.currentPrice];
        
        // Keep the last 60 points (representing 30 minutes if each point is 30 seconds)
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
        setModalChartData(company.priceHistory.slice(-historyPoints));
      } else {
        // Start with current price if no history exists
        setModalChartData([company.currentPrice]);
      }
    }
  };
  
  // Update selected stock data every 30 seconds when modal is open
  useEffect(() => {
    if (showTradeModal && selectedStock) {
      // Clear any existing timer
      if (modalRefreshTimer.current) {
        clearInterval(modalRefreshTimer.current);
      }
      
      // Set up a new timer for 30-second refresh
      modalRefreshTimer.current = setInterval(() => {
        // Set refreshing state
        setIsRefreshing(true);
        
        // Find the latest data for the selected stock
        const updatedStock = stockMarket.companies.find(c => c.id === selectedStock.id);
        
        if (updatedStock) {
          // Update the selected stock with fresh data
          setSelectedStock(updatedStock);
          
          // Only add new price point to existing chart data without regenerating entire chart
          if (modalChartData && modalChartData.length > 0) {
            const lastPrice = modalChartData[modalChartData.length - 1];
            if (updatedStock.currentPrice !== lastPrice) {
              const updatedChartData = [...modalChartData, updatedStock.currentPrice];
              // Keep only the last 60 points
              if (updatedChartData.length > 60) {
                setModalChartData(updatedChartData.slice(-60));
              } else {
                setModalChartData(updatedChartData);
              }
            }
          } else {
            // Initialize chart data if it doesn't exist
            setModalChartData([updatedStock.currentPrice]);
          }
          
          // Update refresh count for UI feedback
          setModalRefreshCount(prev => prev + 1);
          setLastModalRefresh(Date.now());
          
          // Show refresh animation
          setShowRefreshAnimation(true);
          setTimeout(() => setShowRefreshAnimation(false), 800);
        }
        
        // Reset refreshing state
        setTimeout(() => setIsRefreshing(false), 500);
      }, 30000); // 30 seconds
      
      // Clean up interval when modal closes or component unmounts
      return () => {
        if (modalRefreshTimer.current) {
          clearInterval(modalRefreshTimer.current);
          modalRefreshTimer.current = null;
        }
      };
    }
  }, [showTradeModal, selectedStock?.id, stockMarket.companies, modalChartData]);
  
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
        
        // Execute buy order
        buyStock(selectedStock.id, tradeQuantity);
        updateMoney(-totalCost);
        setNotification({
          type: 'success',
          message: `Successfully purchased ${tradeQuantity} shares of ${selectedStock.name}`
        });
      } else {
        // Check if player owns enough shares
        if (selectedStock.owned < tradeQuantity) {
          setNotification({
            type: 'error',
            message: 'You don\'t own enough shares to sell'
          });
          return;
        }
        
        // Execute sell order
        const totalValue = selectedStock.currentPrice * tradeQuantity;
        sellStock(selectedStock.id, tradeQuantity);
        updateMoney(totalValue);
        setNotification({
          type: 'success',
          message: `Successfully sold ${tradeQuantity} shares of ${selectedStock.name}`
        });
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
    return (
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-bold text-gray-800 flex items-center">
          <span className="mr-2">📊</span> Stock Market
        </h2>
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
      : company.owned;
    
    // Calculate time since last refresh for display
    const secondsSinceRefresh = Math.floor((Date.now() - lastModalRefresh) / 1000);
    const timeUntilNextRefresh = Math.max(0, 30 - secondsSinceRefresh);
    
    // Function to handle manual refresh
    const handleManualRefresh = () => {
      // Set refreshing state
      setIsRefreshing(true);
      
      // Find the latest data for the selected stock
      const updatedStock = stockMarket.companies.find(c => c.id === selectedStock.id);
      
      if (updatedStock) {
        // Update the selected stock with fresh data
        setSelectedStock(updatedStock);
        
        // Only add new price point to existing chart data
        if (modalChartData && modalChartData.length > 0) {
          const lastPrice = modalChartData[modalChartData.length - 1];
          if (updatedStock.currentPrice !== lastPrice) {
            const updatedChartData = [...modalChartData, updatedStock.currentPrice];
            // Keep only the last 60 points
            if (updatedChartData.length > 60) {
              setModalChartData(updatedChartData.slice(-60));
            } else {
              setModalChartData(updatedChartData);
            }
          }
        } else {
          // Initialize chart data if it doesn't exist
          setModalChartData([updatedStock.currentPrice]);
        }
        
        // Update refresh count for UI feedback
        setModalRefreshCount(prev => prev + 1);
        setLastModalRefresh(Date.now());
        
        // Show refresh animation
        setShowRefreshAnimation(true);
        setTimeout(() => setShowRefreshAnimation(false), 800);
      }
      
      // Reset refreshing state
      setTimeout(() => setIsRefreshing(false), 500);
    };
    
    return (
      <div className="modal-overlay">
        <div 
          ref={modalRef}
          className="modal-content max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        >
          {/* Stock info header */}
          <div className={`bg-gray-800 text-white p-4 flex items-center justify-between ${showRefreshAnimation ? 'data-refreshed' : ''}`}>
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
                <button 
                  onClick={handleManualRefresh}
                  className={`refresh-button p-1 rounded-full hover:bg-gray-700 transition-colors ${isRefreshing ? 'refreshing opacity-100' : ''}`}
                  title="Update current stock price"
                  disabled={isRefreshing}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
              <div className={`text-sm ${company.percentChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {company.percentChange >= 0 ? '+' : ''}{company.percentChange.toFixed(2)}%
              </div>
              <div className="text-xs text-gray-400 mt-1 flex items-center justify-end">
                <span>Price update in {timeUntilNextRefresh}s</span>
                {modalRefreshCount > 0 && (
                  <span className="ml-2 text-gray-500">
                    ({modalRefreshCount} price update{modalRefreshCount !== 1 ? 's' : ''})
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
                onClick={() => setShowBettingUI(false)}
                className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
                  !showBettingUI
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Trade
              </button>
              <button
                type="button"
                onClick={() => setShowBettingUI(true)}
                className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
                  showBettingUI
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Price Betting
              </button>
            </div>
          </div>
          
          {/* Trading or betting UI */}
          {showBettingUI ? (
            <div className="p-4">
              {renderPriceDirectionUI()}
            </div>
          ) : (
            /* Trading controls */
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
                    disabled={company.owned <= 0}
                  >
                    Sell
                  </button>
                </div>
                
                <div className="text-sm text-gray-500">
                  {tradeType === 'buy' 
                    ? `Max: ${maxShares} shares`
                    : `Owned: ${company.owned} shares`}
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
                          (tradeType === 'sell' && company.owned < tradeQuantity)}
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
              
              {tradeType === 'sell' && company.owned > 0 && (
                <div className={`mt-4 text-sm ${showRefreshAnimation ? 'data-refreshed' : ''}`}>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Current Position:</span>
                    <span className="font-medium">{company.owned} shares (${(company.owned * company.currentPrice).toLocaleString()})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Remaining After Sale:</span>
                    <span className="font-medium">
                      {company.owned - tradeQuantity} shares (${((company.owned - tradeQuantity) * company.currentPrice).toLocaleString()})
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
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
      
      // Also update active bets
      const activeBetsList = [];
      stockMarket.companies.forEach(company => {
        if (company.betHistory && company.betHistory.length > 0) {
          company.betHistory
            .filter(bet => !bet.resolved)
            .forEach(bet => {
              activeBetsList.push({
                ...bet,
                companyId: company.id,
                companyName: company.name
              });
            });
        }
      });
      
      setActiveBets(activeBetsList);
    }
  }, [stockMarket.companies, stockMarket.lastPriceRecordTime]);

  // Add handler for placing price direction bets
  const handlePlaceBet = (direction) => {
    if (!selectedStock) return;
    
    const result = stockMarket.placePriceDirectionBet(
      selectedStock.id,
      direction,
      betAmount
    );
    
    if (result.success) {
      setNotification({
        type: 'success',
        message: result.message
      });
    } else {
      setNotification({
        type: 'error',
        message: result.message
      });
    }
  };

  // Add a section to render recent price movements
  const renderRecentPriceMovements = () => {
    if (!selectedStock) return null;

    const movements = priceMovementHistory[selectedStock.id] || [];
    
    return (
      <div className="mb-4">
        <h5 className="text-sm font-medium text-gray-700 mb-2">Recent Price Movements</h5>
        <div className="flex flex-wrap gap-2">
          {movements.length > 0 ? (
            movements.slice().reverse().map((movement, idx) => (
              <div 
                key={`${movement.timestamp}-${idx}`}
                className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                  movement.direction === 'up' 
                    ? 'bg-green-100 text-green-800' 
                    : movement.direction === 'down' 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-gray-100 text-gray-800'
                }`}
              >
                {movement.direction === 'up' ? '↑' : movement.direction === 'down' ? '↓' : '→'}
                ${movement.price.toFixed(2)}
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-400 italic">No recent price movements</p>
          )}
        </div>
      </div>
    );
  };

  // Add price direction betting UI function
  const renderPriceDirectionUI = () => {
    if (!selectedStock) return null;
    
    const activeBet = activeBets.find(bet => bet.stockId === selectedStock.id);
    const canBet = !activeBet && betAmount > 0 && money >= betAmount;
    
    return (
      <div className="mb-4 p-4 bg-indigo-50 border border-indigo-100 rounded-lg">
        <h4 className="font-medium text-indigo-800 mb-2">Price Direction Betting</h4>
        
        {/* Show recent price movements */}
        {renderRecentPriceMovements()}
        
        {!activeBet ? (
          <>
            <p className="text-sm text-gray-600 mb-3">
              Predict whether the price will go up or down in the next 30 seconds.
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bet Amount
              </label>
              <div className="flex">
                <button
                  className="px-3 py-2 bg-gray-200 rounded-l-md"
                  onClick={() => setBetAmount(Math.max(100, betAmount - 100))}
                >
                  -
                </button>
                <input
                  type="number"
                  min="100"
                  step="100"
                  value={betAmount}
                  onChange={(e) => setBetAmount(Math.max(100, parseInt(e.target.value) || 0))}
                  className="block w-full px-3 py-2 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 text-center"
                />
                <button
                  className="px-3 py-2 bg-gray-200 rounded-r-md"
                  onClick={() => setBetAmount(betAmount + 100)}
                >
                  +
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <button
                className="py-2 font-medium rounded-md bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
                disabled={!canBet}
                onClick={() => {
                  if (canBet) {
                    stockMarket.dispatch({
                      type: 'PLACE_PRICE_DIRECTION_BET',
                      payload: {
                        stockId: selectedStock.id,
                        amount: betAmount,
                        direction: 'up'
                      }
                    });
                    
                    // Add the bet to active bets
                    setActiveBets([...activeBets, {
                      stockId: selectedStock.id,
                      amount: betAmount,
                      direction: 'up',
                      startPrice: selectedStock.currentPrice,
                      timestamp: Date.now(),
                      countdown: 30,
                      processed: false
                    }]);
                    
                    // Deduct money
                    updateMoney(-betAmount);
                  }
                }}
              >
                Bet Price Up
              </button>
              
              <button
                className="py-2 font-medium rounded-md bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
                disabled={!canBet}
                onClick={() => {
                  if (canBet) {
                    stockMarket.dispatch({
                      type: 'PLACE_PRICE_DIRECTION_BET',
                      payload: {
                        stockId: selectedStock.id,
                        amount: betAmount,
                        direction: 'down'
                      }
                    });
                    
                    // Add the bet to active bets
                    setActiveBets([...activeBets, {
                      stockId: selectedStock.id,
                      amount: betAmount,
                      direction: 'down',
                      startPrice: selectedStock.currentPrice,
                      timestamp: Date.now(),
                      countdown: 30,
                      processed: false
                    }]);
                    
                    // Deduct money
                    updateMoney(-betAmount);
                  }
                }}
              >
                Bet Price Down
              </button>
            </div>
            
            {money < betAmount && (
              <p className="text-sm text-red-600 mt-2">
                Insufficient funds for this bet amount.
              </p>
            )}
          </>
        ) : (
          <div className="bg-white p-3 rounded-md border border-indigo-200">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Active Bet</span>
              <span className={`text-sm font-medium px-2 py-1 rounded ${
                activeBet.direction === 'up' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {activeBet.direction === 'up' ? 'Price Up' : 'Price Down'}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-sm mb-3">
              <div>
                <p className="text-gray-500">Amount</p>
                <p className="font-semibold">${activeBet.amount}</p>
              </div>
              <div>
                <p className="text-gray-500">Potential Win</p>
                <p className="font-semibold">${(activeBet.amount * 1.8).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-gray-500">Start Price</p>
                <p className="font-semibold">${activeBet.startPrice.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-gray-500">Current Price</p>
                <p className={`font-semibold ${
                  selectedStock.currentPrice > activeBet.startPrice ? 'text-green-600' : 
                  selectedStock.currentPrice < activeBet.startPrice ? 'text-red-600' : 'text-gray-800'
                }`}>
                  ${selectedStock.currentPrice.toFixed(2)}
                </p>
              </div>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
              <div className="h-3 rounded-full bg-indigo-500" style={{
                width: `${Math.min(100, (activeBet.countdown / 30) * 100)}%`
              }}></div>
            </div>
            <p className="text-xs text-center text-gray-500">
              {activeBet.countdown > 0 ? `Result in ${activeBet.countdown} seconds` : 'Processing result...'}
            </p>
          </div>
        )}
      </div>
    );
  };

  // Add an effect to track price movements and update active bets
  useEffect(() => {
    // Only proceed if we have companies data
    if (!stockMarket.companies) return;
    
    // Track price movements for all companies
    const newPriceMovements = { ...priceMovementHistory };
    
    stockMarket.companies.forEach(company => {
      // Switch to a consistent array-based structure for each company's price movements
      if (!newPriceMovements[company.id]) {
        newPriceMovements[company.id] = [];
      }
      
      // Check if the price has changed
      const lastPrice = newPriceMovements[company.id].length > 0 ? 
        newPriceMovements[company.id][newPriceMovements[company.id].length - 1].price : 
        company.currentPrice;
      
      // Only record movements if price is different
      if (company.currentPrice !== lastPrice) {
        const direction = company.currentPrice > lastPrice ? 'up' : 'down';
        
        // Add the new price movement
        newPriceMovements[company.id].push({
          timestamp: Date.now(),
          price: company.currentPrice,
          direction
        });
        
        // Keep history limited to last 10 movements
        if (newPriceMovements[company.id].length > 10) {
          newPriceMovements[company.id].shift();
        }
      }
    });
    
    setPriceMovementHistory(newPriceMovements);
    
    // Update active bets
    if (activeBets.length > 0) {
      const updatedBets = activeBets.map(bet => {
        // Reduce countdown timer
        const countdown = Math.max(0, bet.countdown - 1);
        
        // Check if bet is complete
        if (countdown === 0 && !bet.processed) {
          const company = stockMarket.companies.find(c => c.id === bet.stockId);
          if (company) {
            // Determine if bet won
            const priceChange = company.currentPrice - bet.startPrice;
            const betWon = (bet.direction === 'up' && priceChange > 0) || 
                          (bet.direction === 'down' && priceChange < 0);
            
            // Process the bet result
            if (betWon) {
              // 80% profit on win
              const winAmount = bet.amount * 1.8;
              updateMoney(winAmount);
              
              setNotification({
                type: 'success',
                message: `You won $${winAmount.toFixed(2)} on your ${bet.stockId} price direction bet!`
              });
            } else {
              setNotification({
                type: 'error',
                message: `You lost $${bet.amount.toFixed(2)} on your ${bet.stockId} price direction bet.`
              });
            }
            
            return {
              ...bet,
              processed: true,
              won: betWon,
              finalPrice: company.currentPrice,
              countdown
            };
          }
        }
        
        return {
          ...bet,
          countdown
        };
      });
      
      // Filter out processed bets
      const remainingBets = updatedBets.filter(bet => bet.countdown > 0 || !bet.processed);
      setActiveBets(remainingBets);
    }
    
    // Set interval to one second
    const timer = setTimeout(() => {
      // Force a re-render to update bet countdown
      if (activeBets.length > 0) {
        setActiveBets([...activeBets]);
      }
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [stockMarket.companies, priceMovementHistory, activeBets, updateMoney]);

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
        
        {/* NOW Average */}
        {renderNOWAverage()}
        
        {/* Stock Market Table Section */}
        <div className="mb-8">
          {renderMarketTableHeader()}
          
          {!isMarketTableCollapsed && (
            <>
              {renderTableControls()}
              <div className="bg-white rounded-b-lg shadow border border-gray-200 overflow-hidden">
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
                    ${stockMarket.companies
                      .filter(company => company.owned > 0)
                      .reduce((total, company) => total + (company.owned * company.currentPrice), 0)
                      .toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
                  <p className="text-sm text-gray-500">Total Stocks Owned</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {stockMarket.companies
                      .filter(company => company.owned > 0)
                      .reduce((total, company) => total + company.owned, 0)}
                  </p>
                </div>
                <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
                  <p className="text-sm text-gray-500">Different Companies</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {stockMarket.companies.filter(company => company.owned > 0).length}
                  </p>
                </div>
              </div>
              
              {/* Owned Stocks Table */}
              <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                {stockMarket.companies.filter(company => company.owned > 0).length > 0 ? (
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
                        {stockMarket.companies
                          .filter(company => company.owned > 0)
                          .map(company => {
                            const ownedValue = company.owned * company.currentPrice;
                            const previousValue = company.owned * company.previousPrice;
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
                                <td className="px-2 py-2 font-medium">{company.owned}</td>
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