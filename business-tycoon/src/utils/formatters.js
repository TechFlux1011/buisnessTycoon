/**
 * Format a number as currency with dollar sign
 * @param {number} amount - The amount to format
 * @param {boolean} showCents - Whether to show cents
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, showCents = true) => {
  // Handle null/undefined/NaN
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '$0.00';
  }
  
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: showCents ? 2 : 0,
    maximumFractionDigits: showCents ? 2 : 0,
  });
  
  return formatter.format(amount);
};

/**
 * Format a number with commas for thousands
 * @param {number} num - The number to format
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted number
 */
export const formatNumber = (num, decimals = 0) => {
  if (num === null || num === undefined || isNaN(num)) {
    return '0';
  }
  
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
};

/**
 * Format a percentage value
 * @param {number} value - The decimal value (e.g., 0.05 for 5%)
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted percentage
 */
export const formatPercent = (value, decimals = 1) => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0%';
  }
  
  return `${(value * 100).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })}%`;
};

/**
 * Format a time duration in seconds to a human-readable string
 * @param {number} seconds - The duration in seconds
 * @returns {string} Formatted time string
 */
export const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds)) return '0s';
  
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  let result = '';
  if (days > 0) result += `${days}d `;
  if (hours > 0) result += `${hours}h `;
  if (minutes > 0) result += `${minutes}m `;
  if (secs > 0 && days === 0) result += `${secs}s`;
  
  return result.trim();
};

/**
 * Adds ordinal suffix to a number (1st, 2nd, 3rd, etc)
 * @param {number} number - The number to format
 * @returns {string} Number with ordinal suffix
 */
export const ordinalSuffix = (number) => {
  const j = number % 10;
  const k = number % 100;
  
  if (j === 1 && k !== 11) {
    return number + "st";
  }
  if (j === 2 && k !== 12) {
    return number + "nd";
  }
  if (j === 3 && k !== 13) {
    return number + "rd";
  }
  return number + "th";
}; 