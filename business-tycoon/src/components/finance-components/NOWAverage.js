import React, { useState, useEffect } from 'react';
import { useStockMarket } from '../../context/StockMarketContext';
import '../../styles/Finance.css';

const NOWAverage = () => {
  const { stockMarket } = useStockMarket();
  const [nowAverageHistory, setNowAverageHistory] = useState([]);

  // Update NOW Average history when the value changes
  useEffect(() => {
    if (stockMarket.nowAverage) {
      setNowAverageHistory(stockMarket.nowAverage.valueHistory);
    }
  }, [stockMarket.nowAverage]);

  const renderNOWAverage = () => {
    if (!stockMarket.nowAverage) return null;

    const nowValue = stockMarket.nowAverage.value;
    const previousClose = stockMarket.nowAverage.previousClose;
    const percentChange = ((nowValue - previousClose) / previousClose) * 100;
    const isPositive = percentChange >= 0;

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md mb-4">
        <div className="flex justify-between items-center mb-2">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">NOW Average</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Market Index</p>
          </div>
          <div className="flex items-center">
            <div className="text-right">
              <p className="text-xl font-bold text-gray-800 dark:text-gray-200">
                ${nowValue.toFixed(2)}
              </p>
              <p className={`text-sm font-medium flex items-center ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {isPositive ? '▲' : '▼'} {Math.abs(percentChange).toFixed(2)}%
              </p>
            </div>
          </div>
        </div>
        {renderNOWAverageChart()}
      </div>
    );
  };

  const renderNOWAverageChart = () => {
    if (!stockMarket.nowAverage || !stockMarket.nowAverage.valueHistory || stockMarket.nowAverage.valueHistory.length === 0) {
      return <div className="flex items-center justify-center h-full">Loading chart data...</div>;
    }
    
    // Use the entire price history for the day
    const valueHistory = stockMarket.nowAverage.valueHistory;
    
    // Determine if the market is up or down for the day
    const marketUp = valueHistory[valueHistory.length - 1] >= valueHistory[0];
    const lineColor = marketUp ? '#00C853' : '#FF3D00'; // Brighter green/red
    const fillColor = marketUp ? 'rgba(0, 200, 83, 0.15)' : 'rgba(255, 61, 0, 0.15)';
    
    // Ensure we have at least 2 data points for the chart
    if (valueHistory.length < 2) {
      return <div className="flex items-center justify-center h-full">Collecting market data...</div>;
    }
    
    // Chart dimensions
    const chartHeight = 160;
    const chartWidth = '100%';
    
    // Find min and max for scaling with some padding
    const minValue = Math.min(...valueHistory) * 0.995;
    const maxValue = Math.max(...valueHistory) * 1.005;
    const valueRange = maxValue - minValue || 1; // Prevent division by zero
    
    // Create SVG path
    const pathData = valueHistory.map((value, index) => {
      const x = (index / (valueHistory.length - 1)) * 100;
      const y = chartHeight - ((value - minValue) / valueRange) * chartHeight;
      return `${index === 0 ? 'M' : 'L'} ${x}% ${y}`;
    }).join(' ');
    
    // Create polygon for area fill
    const polygonPoints = valueHistory.map((value, index) => {
      const x = `${(index / (valueHistory.length - 1)) * 100}%`;
      const y = chartHeight - ((value - minValue) / valueRange) * chartHeight;
      return `${x},${y}`;
    }).join(' ') + ` 100%,${chartHeight} 0,${chartHeight}`;
    
    // Create simple time labels
    const timeLabels = ['9:30', '11:00', '12:30', '14:00', '15:30'];
    
    return (
      <div className="w-full h-full relative bg-white dark:bg-gray-800 rounded-md overflow-hidden">
        {/* Min/Max labels */}
        <div className="absolute top-2 right-2 text-xs font-medium text-gray-600 dark:text-gray-300">
          ${maxValue.toFixed(2)}
        </div>
        <div className="absolute bottom-2 right-2 text-xs font-medium text-gray-600 dark:text-gray-300">
          ${minValue.toFixed(2)}
        </div>
        
        <svg 
          width={chartWidth} 
          height={chartHeight} 
          className="now-average-chart"
          preserveAspectRatio="none"
        >
          {/* Grid lines */}
          <line 
            x1="0" 
            y1={chartHeight/2} 
            x2="100%" 
            y2={chartHeight/2} 
            stroke="rgba(0,0,0,0.1)" 
            strokeWidth="1"
            strokeDasharray="5,5"
          />
          
          {/* Area fill */}
          <polygon
            points={polygonPoints}
            fill={fillColor}
          />
          
          {/* Base line */}
          <line 
            x1="0" 
            y1={chartHeight} 
            x2="100%" 
            y2={chartHeight} 
            stroke="rgba(0,0,0,0.1)" 
            strokeWidth="1"
          />
          
          {/* Price line */}
          <path
            d={pathData}
            fill="none"
            stroke={lineColor}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* End dot */}
          <circle
            cx="100%"
            cy={chartHeight - ((valueHistory[valueHistory.length - 1] - minValue) / valueRange) * chartHeight}
            r="4"
            fill={lineColor}
          />
          
          {/* Time labels */}
          {timeLabels.map((label, index) => {
            const x = (index / (timeLabels.length - 1)) * 100;
            return (
              <text 
                key={index} 
                x={`${x}%`} 
                y={chartHeight - 5} 
                textAnchor={index === 0 ? "start" : index === timeLabels.length - 1 ? "end" : "middle"}
                fill="rgba(0,0,0,0.5)"
                fontSize="10"
                className="chart-label"
              >
                {label}
              </text>
            );
          })}
        </svg>
      </div>
    );
  };

  return renderNOWAverage();
};

export default NOWAverage; 