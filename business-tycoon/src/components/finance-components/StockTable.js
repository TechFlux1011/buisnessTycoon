import React, { useState, useEffect } from 'react';
import { useStockMarket } from '../../context/StockMarketContext';
import { useGame } from '../../context/GameContext';
import '../../styles/Finance.css';

const StockTable = ({ onSelectStock }) => {
  const { stockMarket } = useStockMarket();
  const { player } = useGame();
  
  // Filter, sort, search state
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'ascending' });
  const [filterSector, setFilterSector] = useState('all');
  const [availableSectors, setAvailableSectors] = useState([]);
  
  // Collapsible state
  const [isMarketTableCollapsed, setIsMarketTableCollapsed] = useState(false);

  // Market sectors
  useEffect(() => {
    if (stockMarket.companies && stockMarket.companies.length > 0) {
      const sectors = [...new Set(stockMarket.companies.map(company => company.sector))];
      setAvailableSectors(sectors);
    }
  }, [stockMarket.companies]);

  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getFilteredAndSortedCompanies = () => {
    if (!stockMarket.companies) return [];
    
    let filteredCompanies = [...stockMarket.companies];
    
    // Apply sector filter
    if (filterSector !== 'all') {
      filteredCompanies = filteredCompanies.filter(company => company.sector === filterSector);
    }
    
    // Apply search
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      filteredCompanies = filteredCompanies.filter(company => 
        company.name.toLowerCase().includes(lowerSearchTerm) || 
        company.symbol.toLowerCase().includes(lowerSearchTerm)
      );
    }
    
    // Apply sorting
    filteredCompanies.sort((a, b) => {
      if (sortConfig.key === 'priceChange') {
        return sortConfig.direction === 'ascending' 
          ? a.priceChangePercent - b.priceChangePercent
          : b.priceChangePercent - a.priceChangePercent;
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
    
    return filteredCompanies;
  };

  const renderSortArrow = (columnKey) => {
    if (sortConfig.key !== columnKey) return null;
    
    return (
      <span className="ml-1">
        {sortConfig.direction === 'ascending' ? '▲' : '▼'}
      </span>
    );
  };

  const renderTableControls = () => {
    return (
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input
          type="text"
          className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 flex-grow"
          placeholder="Search stocks..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        
        <select
          className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
          value={filterSector}
          onChange={(e) => setFilterSector(e.target.value)}
        >
          <option value="all">All Sectors</option>
          {availableSectors.map(sector => (
            <option key={sector} value={sector}>{sector}</option>
          ))}
        </select>
      </div>
    );
  };

  const renderMarketTableHeader = () => {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md mb-4">
        <div
          className="px-4 py-3 flex justify-between items-center border-b border-gray-200 dark:border-gray-700 cursor-pointer"
          onClick={() => setIsMarketTableCollapsed(!isMarketTableCollapsed)}
        >
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Stock Market</h3>
          <span>{isMarketTableCollapsed ? '▼' : '▲'}</span>
        </div>
        
        {!isMarketTableCollapsed && (
          <div className="p-4">
            {renderTableControls()}
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
                      onClick={() => handleSort('price')}
                    >
                      Price {renderSortArrow('price')}
                    </th>
                    <th 
                      className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('priceChange')}
                    >
                      Change {renderSortArrow('priceChange')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {getFilteredAndSortedCompanies().map((company) => (
                    <tr 
                      key={company.id} 
                      className="hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                      onClick={() => onSelectStock(company)}
                    >
                      <td className="px-4 py-2 whitespace-nowrap">{company.symbol}</td>
                      <td className="px-4 py-2">{company.name}</td>
                      <td className="px-4 py-2 text-right">${company.price.toFixed(2)}</td>
                      <td className={`px-4 py-2 text-right ${company.priceChangePercent >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {company.priceChangePercent >= 0 ? '+' : ''}{company.priceChangePercent.toFixed(2)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  return renderMarketTableHeader();
};

export default StockTable; 