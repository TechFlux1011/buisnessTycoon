import React from 'react';
import { useStockMarket } from '../../context/StockMarketContext';
import '../../styles/Finance.css';

const StockTicker = ({ onSelectStock }) => {
  const { stockMarket } = useStockMarket();

  const renderStockTicker = () => {
    if (!stockMarket.companies || stockMarket.companies.length === 0) {
      return (
        <div className="ticker-container bg-gray-100 dark:bg-gray-800 p-2 rounded-md mb-4">
          <div className="text-center text-gray-500 dark:text-gray-400">Loading market data...</div>
        </div>
      );
    }
    
    // Sort by absolute price change percentage to show most active stocks first
    const sortedCompanies = [...stockMarket.companies].sort((a, b) => {
      return Math.abs(b.priceChangePercent) - Math.abs(a.priceChangePercent);
    });
    
    return (
      <div className="ticker-container bg-gray-100 dark:bg-gray-800 p-2 rounded-md mb-4 overflow-hidden">
        <div className="ticker-track">
          {sortedCompanies.map((company) => (
            <div 
              key={company.id} 
              className="ticker-item cursor-pointer"
              onClick={() => onSelectStock(company)}
            >
              <span className="ticker-symbol font-medium">{company.symbol}</span>
              <span className={`ticker-price ml-2 ${company.priceChangePercent >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                ${company.price.toFixed(2)} {company.priceChangePercent >= 0 ? '▲' : '▼'} {Math.abs(company.priceChangePercent).toFixed(2)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return renderStockTicker();
};

export default StockTicker; 