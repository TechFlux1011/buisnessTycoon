import React from 'react';
import { useGame } from '../../context/GameContext';
import '../../styles/Finance.css';

const NetWorthChart = () => {
  const { player } = useGame();
  
  const renderNetWorthChart = () => {
    if (!player.netWorthHistory || player.netWorthHistory.length < 2) {
      return <div className="flex items-center justify-center h-full">Collecting data...</div>;
    }
    
    // Take the last 30 days of net worth data or all if less than 30
    const historyData = player.netWorthHistory.slice(-30);
    
    // Chart dimensions
    const chartHeight = 120;
    const chartWidth = '100%';
    
    // Find min and max for scaling with some padding
    const values = historyData.map(point => point.amount);
    const minValue = Math.min(...values) * 0.95;
    const maxValue = Math.max(...values) * 1.05;
    const valueRange = maxValue - minValue || 1; // Prevent division by zero
    
    // Determine if net worth is growing
    const isPositive = historyData[historyData.length - 1].amount >= historyData[0].amount;
    
    // Chart styling
    const lineColor = isPositive ? '#22c55e' : '#ef4444';
    const fillColor = isPositive ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)';
    
    // Create SVG path
    const pathData = historyData.map((point, index) => {
      const x = (index / (historyData.length - 1)) * 100;
      const y = chartHeight - ((point.amount - minValue) / valueRange) * chartHeight;
      return `${index === 0 ? 'M' : 'L'} ${x}% ${y}`;
    }).join(' ');
    
    // Create polygon for area fill
    const polygonPoints = historyData.map((point, index) => {
      const x = `${(index / (historyData.length - 1)) * 100}%`;
      const y = chartHeight - ((point.amount - minValue) / valueRange) * chartHeight;
      return `${x},${y}`;
    }).join(' ') + ` 100%,${chartHeight} 0,${chartHeight}`;
    
    return (
      <div className="w-full h-full relative">
        <svg 
          width={chartWidth} 
          height={chartHeight} 
          className="net-worth-chart"
          preserveAspectRatio="none"
        >
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
          
          {/* Net worth line */}
          <path
            d={pathData}
            fill="none"
            stroke={lineColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* End circle */}
          <circle 
            cx="100%" 
            cy={chartHeight - ((historyData[historyData.length - 1].amount - minValue) / valueRange) * chartHeight}
            r="3"
            fill={lineColor}
          />
        </svg>
      </div>
    );
  };

  const renderNetWorthCard = () => {
    if (!player.netWorthHistory || player.netWorthHistory.length === 0) {
      return null;
    }
    
    const currentNetWorth = player.netWorth || player.money;
    
    // Calculate change if we have history
    let changeAmount = 0;
    let changePercent = 0;
    
    if (player.netWorthHistory.length >= 2) {
      const previousNetWorth = player.netWorthHistory[player.netWorthHistory.length - 2].amount;
      changeAmount = currentNetWorth - previousNetWorth;
      changePercent = (changeAmount / previousNetWorth) * 100;
    }
    
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md mb-4">
        <div className="flex flex-col">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-1">Net Worth</h3>
          <div className="flex items-baseline">
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">${currentNetWorth.toFixed(2)}</p>
            {changeAmount !== 0 && (
              <p className={`ml-2 text-sm font-medium ${changeAmount >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {changeAmount >= 0 ? '+' : ''}{changeAmount.toFixed(2)} ({changePercent.toFixed(2)}%)
              </p>
            )}
          </div>
        </div>
        <div className="mt-4 h-32">
          {renderNetWorthChart()}
        </div>
      </div>
    );
  };

  return renderNetWorthCard();
};

export default NetWorthChart; 