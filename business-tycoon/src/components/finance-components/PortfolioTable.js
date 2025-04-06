import React, { useState } from 'react';
import { useStockMarket } from '../../context/StockMarketContext';
import { useGame } from '../../context/GameContext';
import '../../styles/Finance.css';

const PortfolioTable = ({ onSelectStock }) => {
  const { stockMarket } = useStockMarket();
  const { player } = useGame();
  
  // Collapsible state
  const [isPortfolioTableCollapsed, setIsPortfolioTableCollapsed] = useState(false);

  // Sort state
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'ascending' });

  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const renderSortArrow = (columnKey) => {
    if (sortConfig.key !== columnKey) return null;
    
    return (
      <span className="ml-1">
        {sortConfig.direction === 'ascending' ? '▲' : '▼'}
      </span>
    );
  };

  const getPortfolioStocks = () => {
    if (!player.portfolio || !stockMarket.companies) return [];
    
    const portfolioStocks = Object.entries(player.portfolio)
      .filter(([_, shares]) => shares > 0)
      .map(([stockId, shares]) => {
        const stock = stockMarket.companies.find(c => c.id === stockId);
        if (!stock) return null;
        
        const currentValue = stock.price * shares;
        const averageCost = player.portfolioAverageCost[stockId] || stock.price;
        const totalCost = averageCost * shares;
        const profit = currentValue - totalCost;
        const profitPercent = (profit / totalCost) * 100;
        
        return {
          ...stock,
          shares,
          currentValue,
          averageCost,
          totalCost,
          profit,
          profitPercent
        };
      })
      .filter(stock => stock !== null);
    
    // Apply sorting
    portfolioStocks.sort((a, b) => {
      if (sortConfig.key === 'profit') {
        return sortConfig.direction === 'ascending' 
          ? a.profit - b.profit
          : b.profit - a.profit;
      }
      if (sortConfig.key === 'profitPercent') {
        return sortConfig.direction === 'ascending' 
          ? a.profitPercent - b.profitPercent
          : b.profitPercent - a.profitPercent;
      }
      if (sortConfig.key === 'currentValue') {
        return sortConfig.direction === 'ascending' 
          ? a.currentValue - b.currentValue
          : b.currentValue - a.currentValue;
      }
      if (sortConfig.key === 'shares') {
        return sortConfig.direction === 'ascending' 
          ? a.shares - b.shares
          : b.shares - a.shares;
      }
      
      // Handle default sorting
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });
    
    return portfolioStocks;
  };

  const renderPortfolioTableHeader = () => {
    const portfolioStocks = getPortfolioStocks();
    const totalValue = portfolioStocks.reduce((sum, stock) => sum + stock.currentValue, 0);
    const totalCost = portfolioStocks.reduce((sum, stock) => sum + stock.totalCost, 0);
    const totalProfit = totalValue - totalCost;
    const totalProfitPercent = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md mb-4">
        <div
          className="px-4 py-3 flex justify-between items-center border-b border-gray-200 dark:border-gray-700 cursor-pointer"
          onClick={() => setIsPortfolioTableCollapsed(!isPortfolioTableCollapsed)}
        >
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Your Portfolio</h3>
            <div className="text-sm">
              <span className="text-gray-600 dark:text-gray-400">Total: </span>
              <span className="font-medium text-gray-800 dark:text-gray-200">${totalValue.toFixed(2)}</span>
              <span className={`ml-2 ${totalProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {totalProfit >= 0 ? '+' : ''}{totalProfit.toFixed(2)} ({totalProfitPercent.toFixed(2)}%)
              </span>
            </div>
          </div>
          <span>{isPortfolioTableCollapsed ? '▼' : '▲'}</span>
        </div>
        
        {!isPortfolioTableCollapsed && (
          <div className="p-4">
            {portfolioStocks.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead>
                    <tr>
                      <th 
                        className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort('symbol')}
                      >
                        Symbol {renderSortArrow('symbol')}
                      </th>
                      <th 
                        className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort('name')}
                      >
                        Company {renderSortArrow('name')}
                      </th>
                      <th 
                        className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort('shares')}
                      >
                        Shares {renderSortArrow('shares')}
                      </th>
                      <th 
                        className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort('price')}
                      >
                        Price {renderSortArrow('price')}
                      </th>
                      <th 
                        className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort('currentValue')}
                      >
                        Value {renderSortArrow('currentValue')}
                      </th>
                      <th 
                        className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort('profitPercent')}
                      >
                        P/L {renderSortArrow('profitPercent')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {portfolioStocks.map((stock) => (
                      <tr 
                        key={stock.id} 
                        className="hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                        onClick={() => onSelectStock(stock)}
                      >
                        <td className="px-4 py-2 whitespace-nowrap">{stock.symbol}</td>
                        <td className="px-4 py-2">{stock.name}</td>
                        <td className="px-4 py-2 text-right">{stock.shares}</td>
                        <td className="px-4 py-2 text-right">${stock.price.toFixed(2)}</td>
                        <td className="px-4 py-2 text-right">${stock.currentValue.toFixed(2)}</td>
                        <td className={`px-4 py-2 text-right ${stock.profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {stock.profit >= 0 ? '+' : ''}{stock.profit.toFixed(2)} ({stock.profitPercent.toFixed(2)}%)
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                You don't own any stocks yet. Buy some stocks to build your portfolio!
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return renderPortfolioTableHeader();
};

export default PortfolioTable; 