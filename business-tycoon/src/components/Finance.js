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
  
  const tickerRef = useRef(null);
  const modalRef = useRef(null);
  
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
    
    // Generate chart data for only the last hour and store in state
    if (company.realWorldPriceHistory && company.realWorldPriceHistory.length > 0) {
      // Use real-world data, but limit to points that would represent the last hour
      const lastHourPoints = 60; // More detailed for the modal - one point per minute
      setModalChartData(company.realWorldPriceHistory.slice(-lastHourPoints));
    } else {
      // Generate detailed data for the last hour only
      const lastHourPoints = 60; // One point per minute
      
      const generatedData = company.priceHistory.length >= lastHourPoints 
        ? company.priceHistory.slice(-lastHourPoints) 
        : generateLastHourPriceData(company, lastHourPoints);
        
      setModalChartData(generatedData);
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
    let hourlyPriceData;
    
    // If the selected stock changed or we don't have data yet, update modal chart data
    if (lastSelectedStockId !== company.id || !modalChartData) {
      if (company.realWorldPriceHistory && company.realWorldPriceHistory.length > 0) {
        const lastHourPoints = 60; // One point per minute
        hourlyPriceData = company.realWorldPriceHistory.slice(-lastHourPoints);
      } else {
        const lastHourPoints = 60; // One point per minute
        
        hourlyPriceData = company.priceHistory.length >= lastHourPoints 
          ? company.priceHistory.slice(-lastHourPoints) 
          : generateLastHourPriceData(company, lastHourPoints);
      }
      
      // Update state for next render
      setModalChartData(hourlyPriceData);
      setLastSelectedStockId(company.id);
    } else {
      // Use the cached data
      hourlyPriceData = modalChartData;
    }
    
    // Find min and max for scaling
    const minPrice = Math.min(...hourlyPriceData);
    const maxPrice = Math.max(...hourlyPriceData);
    const priceRange = maxPrice - minPrice;
    
    // Round min and max for better readability in axes
    const roundedMin = Math.floor(minPrice * 0.998);
    const roundedMax = Math.ceil(maxPrice * 1.002);
    
    // Create points for SVG polyline
    const points = hourlyPriceData.map((price, index) => {
      const x = (index / (hourlyPriceData.length - 1)) * chartWidth;
      // Invert Y coordinate for SVG (0 is top)
      const y = chartHeight - ((price - minPrice) / priceRange) * chartHeight;
      return `${x},${y}`;
    }).join(' ');
    
    // Determine line color based on price trend
    const isPositiveTrend = hourlyPriceData[hourlyPriceData.length - 1] >= hourlyPriceData[0];
    const lineColor = isPositiveTrend ? '#10B981' : '#EF4444';
    const fillColor = isPositiveTrend ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)';
    
    // Generate price area
    const areaPoints = points + ` ${chartWidth},${chartHeight} 0,${chartHeight}`;
    
    // Calculate position for the end point
    const endX = chartWidth;
    const endY = chartHeight - ((hourlyPriceData[hourlyPriceData.length - 1] - minPrice) / priceRange) * chartHeight;
    
    // Generate minute labels for the x-axis
    const isRealWorldData = company.realWorldPriceHistory && company.realWorldPriceHistory.length > 0;
    let timeLabels = [];
    
    // Generate minute markers for the last hour
    const numLabels = 6; // Show 6 time points
    for (let i = 0; i < numLabels; i++) {
      const minutesAgo = Math.floor((numLabels - 1 - i) * (60 / (numLabels - 1)));
      const currentMinute = stockMarket.marketMinute;
      const currentHour = stockMarket.marketHour;
      
      // Calculate the label time (minutes ago)
      let labelMinute = (currentMinute - minutesAgo + 60) % 60;
      let labelHour = currentHour;
      
      if (currentMinute < minutesAgo) {
        labelHour = (currentHour - 1 + 24) % 24; // Go back an hour
      }
      
      // Format the time label
      const formattedMinute = labelMinute.toString().padStart(2, '0');
      timeLabels.push(`${labelHour}:${formattedMinute}`);
    }
    
    return (
      <div className="bg-white p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">
          Last Hour Price Movement
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
              data-price-data={JSON.stringify(hourlyPriceData)}
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
            <span className="block text-gray-500">Open</span>
            <span className="font-medium">${hourlyPriceData[0].toFixed(2)}</span>
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
    
    return (
      <div className="modal-overlay">
        <div 
          ref={modalRef}
          className="modal-content max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        >
          {/* Stock info header */}
          <div className="bg-gray-800 text-white p-4 flex items-center justify-between">
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
              <div className="text-2xl font-bold">${company.currentPrice.toFixed(2)}</div>
              <div className={`text-sm ${company.percentChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {company.percentChange >= 0 ? '+' : ''}{company.percentChange.toFixed(2)}%
              </div>
            </div>
          </div>
          
          {/* Detailed price chart */}
          <div className="p-4 border-b border-gray-200">
            {renderDetailedPriceChart(company)}
          </div>
          
          {/* Trading controls */}
          <div className="p-4">
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
            <div className="bg-gray-50 p-3 rounded-md mb-4">
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
              <div className="mt-4 text-sm">
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
              <div className="mt-4 text-sm">
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
  
  // Main component render
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