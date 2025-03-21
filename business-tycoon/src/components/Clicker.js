import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useGame } from '../context/GameContext';
import '../styles/Clicker.css';
import Regeneration from './Regeneration';

const Clicker = () => {
  const { state, dispatch } = useGame();
  const [income, setIncome] = useState(0);
  const [clickValue, setClickValue] = useState(0.01);
  const [showAscension, setShowAscension] = useState(false);
  const [isHolding, setIsHolding] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState(null);
  const intervalRef = useRef(null);
  const boostsContainerRef = useRef(null);
  
  // Get the click speed multiplier based on transportation
  const getClicksPerSecond = useCallback(() => {
    if (!state.playerStatus.transportation) {
      return 0; // No transportation means no auto-clicking
    }
    
    // Base rate is 1 click per second for basic transportation (bicycle)
    const baseClickRate = 1;
    // Apply transportation multiplier to get clicks per second
    return baseClickRate * state.playerStatus.transportation.clickSpeedMultiplier;
  }, [state.playerStatus.transportation]);
  
  // Calculate the interval for auto-clicking in milliseconds
  const getClickInterval = useCallback(() => {
    const clicksPerSecond = getClicksPerSecond();
    if (clicksPerSecond <= 0) return 0; // No auto-clicking
    
    // Convert clicks per second to milliseconds between clicks
    return 1000 / clicksPerSecond;
  }, [getClicksPerSecond]);

  // Check if auto-clicking is available
  const canAutoClick = useCallback(() => {
    return state.playerStatus.transportation !== null;
  }, [state.playerStatus.transportation]);
  
  // Calculate income per second and click value
  useEffect(() => {
    let totalIncome = 0;
    let newClickValue = 0.01; // Default 1 penny
    
    // Job income is only for clicking, not passive
    if (state.playerStatus.job) {
      // Use hourlyPay property, falling back to payPerClick if needed
      const hourlyRate = state.playerStatus.job.hourlyPay || state.playerStatus.job.payPerClick;
      // Calculate click value as 1 minute of work (hourly rate / 60)
      newClickValue = hourlyRate / 60;
    }
    
    // Asset income
    if (state.assets.length > 0) {
      totalIncome += state.assets.reduce((sum, asset) => sum + asset.income, 0);
    }
    
    // Business income
    if (state.playerStatus.business) {
      totalIncome += state.playerStatus.business.income;
    }
    
    // Apply level bonus (1% per level)
    totalIncome *= (1 + (state.level - 1) * 0.01);
    
    // Apply ascension bonus (if any)
    if (state.playerStatus.ascensionBonus > 0) {
      totalIncome *= (1 + (state.playerStatus.ascensionBonus / 100));
    }
    
    setIncome(totalIncome);
    setClickValue(newClickValue);
  }, [state.playerStatus.job, state.assets, state.playerStatus.business, state.level, state.playerStatus.ascensionBonus]);
  
  // Auto-click handler when holding down the button
  useEffect(() => {
    if (isHolding && canAutoClick()) {
      const interval = getClickInterval();
      if (interval > 0) {
        // Start auto-clicking at the rate determined by transportation
        intervalRef.current = setInterval(() => {
          dispatch({ type: 'CLICK' });
        }, interval);
      }
      
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }
  }, [isHolding, dispatch, getClickInterval, canAutoClick]);
  
  // Check for level-based ascensions
  useEffect(() => {
    // Ascension milestone levels
    const milestones = [10, 25, 50, 100];
    
    if (milestones.includes(state.level)) {
      setShowAscension(true);
    }
  }, [state.level]);
  
  // Calculate progress percentage to next level
  const experienceNeededForLevel = (level) => {
    return Math.floor(100 * Math.pow(1.5, level - 1));
  };
  
  const nextLevelXP = experienceNeededForLevel(state.level);
  const progressPercentage = (state.experience / nextLevelXP) * 100;

  // Max level for the game
  const MAX_LEVEL = 100;
  
  // Handle single click
  const handleClick = (e) => {
    // We don't need this anymore since mouseDown already fires a click
    // This prevents double clicks
    return;
  };
  
  const handleMouseDown = (e) => {
    // Prevent any default browser behaviors
    e.preventDefault();
    
    // Always do a single click immediately on mouse down
    dispatch({ type: 'CLICK' });
    
    if (canAutoClick()) {
      setIsHolding(true);
    }
  };
  
  const handleMouseUp = (e) => {
    if (e) e.preventDefault();
    setIsHolding(false);
  };
  
  const handleTouchStart = (e) => {
    // Only prevent default on the button to allow scrolling elsewhere
    if (e.currentTarget === e.target || e.currentTarget.contains(e.target)) {
      e.preventDefault();
    }
    
    // Always do a single click immediately on touch
    dispatch({ type: 'CLICK' });
    
    if (canAutoClick()) {
      setIsHolding(true);
    }
  };
  
  const handleTouchEnd = (e) => {
    if (e) e.preventDefault();
    setIsHolding(false);
  };
  
  // Add effect to ensure cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);
  
  // Add a listener for touch/mouse cancellation
  useEffect(() => {
    const handleCancelEvents = () => {
      setIsHolding(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
    
    window.addEventListener('blur', handleCancelEvents);
    return () => {
      window.removeEventListener('blur', handleCancelEvents);
    };
  }, []);
  
  const handleAscension = () => {
    dispatch({ type: 'ASCEND' });
    setShowAscension(false);
  };

  const dismissAscension = () => {
    setShowAscension(false);
  };
  
  // Format minutes to hours and minutes
  const formatWorkTime = (minutes) => {
    if (minutes < 60) {
      return `${minutes} min`;
    } else {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
  };
  
  // Handle tooltip toggle for touch devices
  const handleTooltipToggle = (tooltipId) => {
    if (activeTooltip === tooltipId) {
      setActiveTooltip(null);
    } else {
      setActiveTooltip(tooltipId);
    }
  };
  
  // Close tooltip when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (boostsContainerRef.current && 
          !boostsContainerRef.current.contains(event.target) && 
          activeTooltip !== null) {
        setActiveTooltip(null);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [activeTooltip]);
  
  // Count total businesses
  const countBusinesses = () => {
    let count = 0;
    if (state.assets) {
      count += state.assets.filter(asset => asset.type === 'business').length;
    }
    if (state.playerStatus.business) {
      count += 1;
    }
    return count;
  };
  
  return (
    <div className="clicker-container">
      {/* Top section with player info */}
      <div className="player-info-section">
        <div className="player-name-level">
          <h2>{state.playerStatus.name || "Player"}</h2>
          <div className="player-level">
            <span>Level {state.level}</span>
            <div className="xp-bar">
              <div className="xp-progress" style={{ width: `${progressPercentage}%` }}></div>
            </div>
          </div>
        </div>
        
        <div className="job-info-panel">
          {state.playerStatus.job ? (
            <>
              <div className="job-title-wrapper">
                <h3>{state.playerStatus.job.title}</h3>
                <span className="job-level">{state.playerStatus.job.level}</span>
              </div>
              <div className="job-pay">
                <div className="hourly-rate">${(state.playerStatus.job.hourlyPay || state.playerStatus.job.payPerClick).toFixed(2)}/hr</div>
                <div className="minute-rate">${clickValue.toFixed(2)}<span>/min</span></div>
              </div>
            </>
          ) : (
            <div className="no-job-message">No current job</div>
          )}
        </div>
        
        <div className="business-stats">
          <div className="stat-box">
            <div className="stat-label">Businesses</div>
            <div className="stat-value">{countBusinesses()}</div>
          </div>
          <div className="stat-box">
            <div className="stat-label">Passive Income</div>
            <div className="stat-value">${(income * 60).toFixed(2)}/min</div>
          </div>
          <div className="stat-box">
            <div className="stat-label">Ascension</div>
            <div className="stat-value">{state.generation}</div>
          </div>
        </div>
        
        <div className="money-display">
          <span className="money-value">${state.money.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
      </div>
      
      {/* Bottom tap pad section */}
      <div className="tap-pad-section">
        {/* Boost icons on the left */}
        <div className="boost-icons-column" ref={boostsContainerRef}>
          {state.playerStatus.transportation && (
            <div 
              className={`boost-icon-wrapper ${activeTooltip === 'transportation' ? 'tooltip-active' : ''}`}
              onClick={() => handleTooltipToggle('transportation')}
            >
              <div className="boost-icon transportation-boost">
                <span>{state.playerStatus.transportation.image}</span>
                <span className="boost-value">{getClicksPerSecond()}x</span>
              </div>
              <div className="boost-tooltip">
                <h4>Transportation Boost</h4>
                <p>Your {state.playerStatus.transportation.name} allows you to work {getClicksPerSecond()} clicks/sec when holding down.</p>
                <button className="tooltip-close" onClick={(e) => {
                  e.stopPropagation();
                  setActiveTooltip(null);
                }}>✕</button>
              </div>
            </div>
          )}
          
          {state.level > 1 && (
            <div 
              className={`boost-icon-wrapper ${activeTooltip === 'level' ? 'tooltip-active' : ''}`}
              onClick={() => handleTooltipToggle('level')}
            >
              <div className="boost-icon level-boost">
                <span>⭐</span>
                <span className="boost-value">+{(state.level - 1)}%</span>
              </div>
              <div className="boost-tooltip">
                <h4>Level Bonus</h4>
                <p>+{(state.level - 1)}% to all passive income</p>
                <button className="tooltip-close" onClick={(e) => {
                  e.stopPropagation();
                  setActiveTooltip(null);
                }}>✕</button>
              </div>
            </div>
          )}
          
          {state.playerStatus.ascensionBonus > 0 && (
            <div 
              className={`boost-icon-wrapper ${activeTooltip === 'ascension' ? 'tooltip-active' : ''}`}
              onClick={() => handleTooltipToggle('ascension')}
            >
              <div className="boost-icon ascension-boost">
                <span>🔄</span>
                <span className="boost-value">+{state.playerStatus.ascensionBonus}%</span>
              </div>
              <div className="boost-tooltip">
                <h4>Ascension Bonus</h4>
                <p>+{state.playerStatus.ascensionBonus}% to all passive income</p>
                <button className="tooltip-close" onClick={(e) => {
                  e.stopPropagation();
                  setActiveTooltip(null);
                }}>✕</button>
              </div>
            </div>
          )}
        </div>
        
        {/* The tap pad area */}
        <div 
          className={`tap-pad ${!canAutoClick() ? 'no-auto-click' : ''}`}
          onClick={handleClick}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          role="button"
          aria-label="Work button"
        >
          {!canAutoClick() && (
            <div className="auto-click-info">
              <span>🚲 Buy transportation to enable auto-clicking</span>
            </div>
          )}
          <div className="tap-pad-content">
            <div className="tap-icon">💼</div>
            <div className="tap-text">Tap to work</div>
            <div className="tap-value">+${clickValue.toFixed(2)}</div>
          </div>
        </div>
      </div>
      
      {/* Ascension prompt */}
      {showAscension && (
        <div className="ascension-prompt">
          <h3>Ascension Available!</h3>
          <p>You've reached level {state.level}, which is an ascension milestone!</p>
          <p>Ascending will add 1 year to your age and grant a permanent 5% income bonus.</p>
          <div className="ascension-buttons">
            <button className="ascend-button" onClick={handleAscension}>Ascend</button>
            <button className="decline-button" onClick={dismissAscension}>Continue Playing</button>
          </div>
        </div>
      )}
      
      {state.level >= MAX_LEVEL && <Regeneration />}
    </div>
  );
};

export default Clicker; 