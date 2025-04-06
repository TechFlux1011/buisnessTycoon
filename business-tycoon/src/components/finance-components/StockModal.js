import React, { useState, useEffect, useRef } from 'react';
import { useStockMarket } from '../../context/StockMarketContext';
import { useGame } from '../../context/GameContext';
import StockChart from './StockChart';
import '../../styles/Finance.css';

const StockModal = ({ selectedStock, onClose }) => {
  const { stockMarket, buyStock, sellStock } = useStockMarket();
  const { player } = useGame();
  
  // Trade state
  const [tradeQuantity, setTradeQuantity] = useState(1);
  const [tradeType, setTradeType] = useState('buy');
  const [notification, setNotification] = useState(null);
  
  // Refs
  const modalRef = useRef(null);
  
  // Handle click outside to close modal
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);
  
  // Reset trade quantity when stock changes
  useEffect(() => {
    setTradeQuantity(1);
  }, [selectedStock]);
  
  const executeTrade = () => {
    if (!selectedStock) return;
    
    const totalCost = selectedStock.price * tradeQuantity;
    const currentShares = player.portfolio[selectedStock.id] || 0;
    
    if (tradeType === 'buy') {
      if (player.money < totalCost) {
        setNotification({
          type: 'error',
          message: 'Not enough money to complete this purchase'
        });
        return;
      }
      
      buyStock(selectedStock.id, tradeQuantity);
      setNotification({
        type: 'success',
        message: `Successfully bought ${tradeQuantity} shares of ${selectedStock.symbol}`
      });
    } else {
      if (currentShares < tradeQuantity) {
        setNotification({
          type: 'error',
          message: `You only own ${currentShares} shares of ${selectedStock.symbol}`
        });
        return;
      }
      
      sellStock(selectedStock.id, tradeQuantity);
      setNotification({
        type: 'success',
        message: `Successfully sold ${tradeQuantity} shares of ${selectedStock.symbol}`
      });
    }
    
    // Clear notification after 3 seconds
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };
  
  const renderNotification = () => {
    if (!notification) return null;
    
    return (
      <div className={`px-4 py-2 rounded mb-4 ${notification.type === 'success' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200'}`}>
        {notification.message}
      </div>
    );
  };
  
  if (!selectedStock) return null;
  
  // Calculate position size and ownership data
  const sharesOwned = player.portfolio[selectedStock.id] || 0;
  const positionValue = sharesOwned * selectedStock.price;
  const averageCost = player.portfolioAverageCost[selectedStock.id] || 0;
  const totalCost = averageCost * sharesOwned;
  const profit = positionValue - totalCost;
  const profitPercent = totalCost > 0 ? (profit / totalCost) * 100 : 0;
  
  // Calculate trade preview
  const tradeTotal = selectedStock.price * tradeQuantity;
  const canAfford = player.money >= tradeTotal;
  const canSell = sharesOwned >= tradeQuantity;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div 
        ref={modalRef}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200">{selectedStock.name}</h3>
              <p className="text-gray-600 dark:text-gray-400">{selectedStock.symbol} • {selectedStock.sector}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Price and Change */}
          <div className="flex items-center mb-6">
            <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">${selectedStock.price.toFixed(2)}</div>
            <div className={`ml-4 px-2 py-1 rounded-md text-sm font-medium ${selectedStock.priceChangePercent >= 0 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
              {selectedStock.priceChangePercent >= 0 ? '+' : ''}{selectedStock.priceChangePercent.toFixed(2)}%
            </div>
          </div>
          
          {/* Chart */}
          <div className="h-60 mb-6">
            <StockChart company={selectedStock} isDetailed={true} />
          </div>
          
          {/* Position Information */}
          {sharesOwned > 0 && (
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 mb-6">
              <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">Your Position</h4>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Shares</p>
                  <p className="text-lg font-medium text-gray-800 dark:text-gray-200">{sharesOwned}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Value</p>
                  <p className="text-lg font-medium text-gray-800 dark:text-gray-200">${positionValue.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Avg Cost</p>
                  <p className="text-lg font-medium text-gray-800 dark:text-gray-200">${averageCost.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">P/L</p>
                  <p className={`text-lg font-medium ${profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {profit >= 0 ? '+' : ''}{profit.toFixed(2)} ({profitPercent.toFixed(2)}%)
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Trading Interface */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Trade</h4>
            
            {renderNotification()}
            
            <div className="flex flex-col gap-4 sm:flex-row">
              {/* Trade Type Selection */}
              <div className="flex-1">
                <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                  <button
                    className={`flex-1 py-2 transition-colors ${tradeType === 'buy' ? 'bg-blue-600 text-white' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                    onClick={() => setTradeType('buy')}
                  >
                    Buy
                  </button>
                  <button
                    className={`flex-1 py-2 transition-colors ${tradeType === 'sell' ? 'bg-blue-600 text-white' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                    onClick={() => setTradeType('sell')}
                  >
                    Sell
                  </button>
                </div>
              </div>
              
              {/* Quantity Input */}
              <div className="flex-1">
                <div className="flex rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
                  <button
                    className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    onClick={() => setTradeQuantity(prev => Math.max(1, prev - 1))}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    className="flex-1 px-3 py-2 text-center bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none"
                    value={tradeQuantity}
                    onChange={(e) => setTradeQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    min="1"
                  />
                  <button
                    className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    onClick={() => setTradeQuantity(prev => prev + 1)}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
            
            {/* Trade Preview */}
            <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600 dark:text-gray-400">Price per share:</span>
                <span className="text-gray-800 dark:text-gray-200 font-medium">${selectedStock.price.toFixed(2)}</span>
              </div>
              <div className="flex justify-between mb-4">
                <span className="text-gray-600 dark:text-gray-400">Quantity:</span>
                <span className="text-gray-800 dark:text-gray-200 font-medium">{tradeQuantity}</span>
              </div>
              <div className="flex justify-between pb-4 border-b border-gray-300 dark:border-gray-600">
                <span className="text-gray-600 dark:text-gray-400">Total {tradeType === 'buy' ? 'Cost' : 'Proceeds'}:</span>
                <span className="text-gray-800 dark:text-gray-200 font-medium">${tradeTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between mt-4">
                <span className="text-gray-600 dark:text-gray-400">{tradeType === 'buy' ? 'Balance after purchase:' : 'Balance after sale:'}</span>
                <span className="text-gray-800 dark:text-gray-200 font-medium">
                  ${(tradeType === 'buy' ? player.money - tradeTotal : player.money + tradeTotal).toFixed(2)}
                </span>
              </div>
            </div>
            
            {/* Trade Button */}
            <button
              className={`w-full mt-4 py-3 rounded-lg font-medium text-white transition-colors ${
                (tradeType === 'buy' && canAfford) || (tradeType === 'sell' && canSell)
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
              onClick={executeTrade}
              disabled={!(tradeType === 'buy' ? canAfford : canSell)}
            >
              {tradeType === 'buy'
                ? canAfford
                  ? `Buy ${tradeQuantity} Shares`
                  : 'Insufficient Funds'
                : canSell
                  ? `Sell ${tradeQuantity} Shares`
                  : `You only own ${sharesOwned} shares`
              }
            </button>
          </div>
          
          {/* Company Information */}
          <div>
            <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">About {selectedStock.name}</h4>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {selectedStock.description || `${selectedStock.name} is a company in the ${selectedStock.sector} sector.`}
            </p>
            
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Market Cap</p>
                <p className="text-base font-medium text-gray-800 dark:text-gray-200">
                  ${(selectedStock.price * selectedStock.outstandingShares).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Volatility</p>
                <p className="text-base font-medium text-gray-800 dark:text-gray-200">
                  {selectedStock.volatility ? `${(selectedStock.volatility * 100).toFixed(1)}%` : 'Moderate'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Volume</p>
                <p className="text-base font-medium text-gray-800 dark:text-gray-200">
                  {(selectedStock.volume || Math.floor(Math.random() * 500000 + 100000)).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockModal; 