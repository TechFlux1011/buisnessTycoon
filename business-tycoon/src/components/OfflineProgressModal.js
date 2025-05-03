import React from 'react';
import { formatCurrency } from '../utils/formatters';

const OfflineProgressModal = ({ offlineEarnings, offlineTime, onClose }) => {
  // Format time display (convert milliseconds to hours, minutes, seconds)
  const formatTime = (ms) => {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    
    let timeString = '';
    if (days > 0) timeString += `${days} day${days > 1 ? 's' : ''} `;
    if (hours > 0) timeString += `${hours} hour${hours > 1 ? 's' : ''} `;
    if (minutes > 0) timeString += `${minutes} minute${minutes > 1 ? 's' : ''} `;
    if (seconds > 0 && days === 0) timeString += `${seconds} second${seconds > 1 ? 's' : ''} `;
    
    return timeString.trim();
  };
  
  // Format money with commas
  const formattedEarnings = formatCurrency(offlineEarnings);
  const formattedTime = formatTime(offlineTime);
  
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50">
      <div className="bg-gradient-to-br from-blue-900 to-purple-900 text-white p-6 rounded-xl shadow-2xl max-w-md mx-4 w-full border border-blue-500">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Welcome Back!</h2>
          <p className="text-blue-200 mb-6">You've been away for {formattedTime}</p>
          
          <div className="bg-blue-800 bg-opacity-50 rounded-lg p-5 mb-6">
            <div className="flex flex-col items-center">
              <div className="text-xl mb-1">While you were away, you earned:</div>
              <div className="text-3xl font-bold text-green-400">{formattedEarnings}</div>
            </div>
          </div>
          
          <div className="text-sm opacity-80 mb-6">
            Your businesses, investments, and assets continued to generate income while you were away.
          </div>
          
          <button
            onClick={onClose}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition duration-200 transform hover:scale-105"
          >
            Claim Rewards
          </button>
        </div>
      </div>
    </div>
  );
};

export default OfflineProgressModal; 