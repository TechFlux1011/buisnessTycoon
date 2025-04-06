import React, { useState, useEffect, useRef } from 'react';
import { useStockMarket } from '../../context/StockMarketContext';
import '../../styles/Finance.css';

const StockChart = ({ company, isDetailed = false }) => {
  const { stockMarket } = useStockMarket();
  const [chartData, setChartData] = useState([]);
  const [chartHoverData, setChartHoverData] = useState(null);
  const chartRef = useRef(null);

  // Generate chart data when component mounts or when company changes
  useEffect(() => {
    if (company) {
      generateChartData(company);
    }
  }, [company]);

  // Update chart data when stock prices change
  useEffect(() => {
    if (company && stockMarket.lastUpdated) {
      generateChartData(company);
    }
  }, [company, stockMarket.lastUpdated]);

  const generateChartData = (company) => {
    const totalPoints = isDetailed ? 120 : 60;
    const points = [];
    
    // Get price history or generate synthetic data if not available
    if (company.priceHistory && company.priceHistory.length > 0) {
      const history = [...company.priceHistory];
      const startIndex = Math.max(0, history.length - totalPoints);
      
      for (let i = startIndex; i < history.length; i++) {
        points.push({
          price: history[i],
          time: i - startIndex
        });
      }
    } else {
      // Generate synthetic data for visualization
      const initialPrice = company.price;
      const volatility = company.volatility || 0.02;
      
      let currentPrice = initialPrice;
      for (let i = 0; i < totalPoints; i++) {
        const randomChange = (Math.random() - 0.5) * volatility * currentPrice;
        currentPrice = Math.max(0.01, currentPrice + randomChange);
        
        points.push({
          price: currentPrice,
          time: i
        });
      }
    }
    
    setChartData(points);
  };

  const renderPriceChart = () => {
    if (!company || chartData.length === 0) {
      return <div className="flex items-center justify-center h-full">Loading chart data...</div>;
    }
    
    // Chart dimensions
    const chartHeight = isDetailed ? 240 : 120;
    const chartWidth = "100%";
    
    // Find min and max for scaling
    const prices = chartData.map(point => point.price);
    const minPrice = Math.min(...prices) * 0.995;
    const maxPrice = Math.max(...prices) * 1.005;
    const priceRange = maxPrice - minPrice;
    
    // Determine if the chart shows a price increase
    const startPrice = chartData[0].price;
    const endPrice = chartData[chartData.length - 1].price;
    const isPositive = endPrice >= startPrice;
    
    // Chart styling
    const lineColor = isPositive ? '#22c55e' : '#ef4444';
    const fillColor = isPositive ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)';
    
    // Create SVG path
    const pathData = chartData.map((point, index) => {
      const x = (index / (chartData.length - 1)) * 100;
      const y = chartHeight - ((point.price - minPrice) / priceRange) * chartHeight;
      return `${index === 0 ? 'M' : 'L'} ${x}% ${y}`;
    }).join(' ');
    
    // Create area fill (if detailed chart)
    const areaPathData = isDetailed ? chartData.map((point, index) => {
      const x = (index / (chartData.length - 1)) * 100;
      const y = chartHeight - ((point.price - minPrice) / priceRange) * chartHeight;
      return `${index === 0 ? 'M' : 'L'} ${x}% ${y}`;
    }).join(' ') + ` L 100% ${chartHeight} L 0 ${chartHeight} Z` : null;
    
    // Handle mouse interactions for detailed chart
    const handleChartHover = (event) => {
      if (!isDetailed || !chartRef.current) return;
      
      const rect = chartRef.current.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const chartWidth = rect.width;
      
      // Find closest data point
      const pointIndex = Math.min(
        chartData.length - 1,
        Math.max(0, Math.floor((mouseX / chartWidth) * chartData.length))
      );
      
      setChartHoverData({
        x: (pointIndex / (chartData.length - 1)) * 100,
        price: chartData[pointIndex].price,
        pointIndex
      });
    };
    
    const handleChartLeave = () => {
      if (isDetailed) {
        setChartHoverData(null);
      }
    };
    
    return (
      <div 
        className="w-full h-full relative"
        ref={chartRef}
        onMouseMove={handleChartHover}
        onMouseLeave={handleChartLeave}
      >
        {isDetailed && (
          <>
            <div className="absolute top-2 left-2 text-xs font-medium text-gray-600 dark:text-gray-300">
              ${maxPrice.toFixed(2)}
            </div>
            <div className="absolute bottom-2 left-2 text-xs font-medium text-gray-600 dark:text-gray-300">
              ${minPrice.toFixed(2)}
            </div>
          </>
        )}
        
        <svg 
          width={chartWidth} 
          height={chartHeight} 
          className="stock-chart"
          preserveAspectRatio="none"
        >
          {/* Grid lines for detailed chart */}
          {isDetailed && (
            <>
              <line 
                x1="0" 
                y1={chartHeight/2} 
                x2="100%" 
                y2={chartHeight/2} 
                stroke="rgba(0,0,0,0.1)" 
                strokeWidth="1"
                strokeDasharray="5,5"
              />
              <line 
                x1="0" 
                y1={chartHeight/4} 
                x2="100%" 
                y2={chartHeight/4} 
                stroke="rgba(0,0,0,0.1)" 
                strokeWidth="1"
                strokeDasharray="5,5"
              />
              <line 
                x1="0" 
                y1={chartHeight*3/4} 
                x2="100%" 
                y2={chartHeight*3/4} 
                stroke="rgba(0,0,0,0.1)" 
                strokeWidth="1"
                strokeDasharray="5,5"
              />
              <line 
                x1="25%" 
                y1="0" 
                x2="25%" 
                y2={chartHeight} 
                stroke="rgba(0,0,0,0.1)" 
                strokeWidth="1"
                strokeDasharray="5,5"
              />
              <line 
                x1="50%" 
                y1="0" 
                x2="50%" 
                y2={chartHeight} 
                stroke="rgba(0,0,0,0.1)" 
                strokeWidth="1"
                strokeDasharray="5,5"
              />
              <line 
                x1="75%" 
                y1="0" 
                x2="75%" 
                y2={chartHeight} 
                stroke="rgba(0,0,0,0.1)" 
                strokeWidth="1"
                strokeDasharray="5,5"
              />
            </>
          )}
          
          {/* Area fill for detailed chart */}
          {isDetailed && areaPathData && (
            <path 
              d={areaPathData}
              fill={fillColor}
            />
          )}
          
          {/* Price line */}
          <path
            d={pathData}
            fill="none"
            stroke={lineColor}
            strokeWidth={isDetailed ? "2" : "1.5"}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Hover indicator for detailed chart */}
          {isDetailed && chartHoverData && (
            <>
              <line 
                x1={`${chartHoverData.x}%`} 
                y1="0" 
                x2={`${chartHoverData.x}%`} 
                y2={chartHeight} 
                stroke={lineColor} 
                strokeWidth="1"
                strokeDasharray="5,5"
              />
              <circle
                cx={`${chartHoverData.x}%`}
                cy={chartHeight - ((chartHoverData.price - minPrice) / priceRange) * chartHeight}
                r="4"
                fill={lineColor}
                stroke="#fff"
                strokeWidth="1"
              />
            </>
          )}
        </svg>
        
        {/* Price overlay for detailed chart */}
        {isDetailed && chartHoverData && (
          <div 
            className="absolute px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-sm text-sm"
            style={{ 
              top: '10px', 
              right: '10px',
            }}
          >
            <div className="font-medium text-gray-800 dark:text-gray-200">
              ${chartHoverData.price.toFixed(2)}
            </div>
            <div className={`text-xs ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {isPositive ? '+' : '-'}${Math.abs(chartHoverData.price - startPrice).toFixed(2)} ({((chartHoverData.price - startPrice) / startPrice * 100).toFixed(2)}%)
            </div>
          </div>
        )}
      </div>
    );
  };

  return renderPriceChart();
};

export default StockChart; 