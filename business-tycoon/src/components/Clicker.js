import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useGame } from '../context/GameContext';
import '../styles/Clicker.css';
import Regeneration from './Regeneration';

const Clicker = () => {
  const { gameState, gameDispatch: dispatch, jobExperienceNeededForLevel } = useGame();
  
  // Move all hooks to the top BEFORE any conditional returns
  const [income, setIncome] = useState(0);
  const [clickValue, setClickValue] = useState(0.01);
  const [showAscension, setShowAscension] = useState(false);
  const [isHolding, setIsHolding] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState(null);
  const intervalRef = useRef(null);
  const boostsContainerRef = useRef(null);
  const [skillGainIndicator, setSkillGainIndicator] = useState(null);
  const [showPromotionNotification, setShowPromotionNotification] = useState(false);
  
  // Get the click speed multiplier based on transportation
  const getClicksPerSecond = useCallback((playerStatus) => {
    if (!playerStatus?.transportation) {
      return 0; // No transportation means no auto-clicking
    }
    
    // Base rate is 1 click per second for basic transportation (bicycle)
    const baseClickRate = 1;
    // Apply transportation multiplier to get clicks per second
    return baseClickRate * playerStatus.transportation.clickSpeedMultiplier;
  }, []);
  
  // Calculate the interval for auto-clicking in milliseconds
  const getClickInterval = useCallback((playerStatus) => {
    const clicksPerSecond = getClicksPerSecond(playerStatus);
    if (clicksPerSecond <= 0) return 0; // No auto-clicking
    
    // Convert clicks per second to milliseconds between clicks
    return 1000 / clicksPerSecond;
  }, [getClicksPerSecond]);

  // Check if auto-clicking is available
  const canAutoClick = useCallback((playerStatus) => {
    return playerStatus?.transportation !== null;
  }, []);
  
  // Effect to calculate income per second and click value
  useEffect(() => {
    if (!gameState || !gameState.playerStatus) return;
    
    const state = gameState;
    let totalIncome = 0;
    let newClickValue = 0.01; // Default 1 penny
    
    // Job income is only for clicking, not passive
    if (state.playerStatus.job) {
      // Always use hourlyPay divided by 60 to get per-click value
      const hourlyRate = state.playerStatus.job.hourlyPay || (state.playerStatus.job.payPerClick * 60);
      // Calculate click value as 1 minute of work (hourly rate / 60)
      newClickValue = hourlyRate / 60;
    } else {
      // Player has no job, default to 1 penny per click
      newClickValue = 0.01;
    }
    
    // Asset income
    if (state.assets.length > 0) {
      totalIncome += state.assets.reduce((sum, asset) => sum + asset.income, 0);
    }
    
    // Business incomesss
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
  }, [gameState]);
  
  // Auto-click handler when holding down the button
  useEffect(() => {
    if (!gameState || !gameState.playerStatus) return;
    
    if (isHolding && canAutoClick(gameState.playerStatus)) {
      const interval = getClickInterval(gameState.playerStatus);
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
  }, [isHolding, dispatch, getClickInterval, canAutoClick, gameState]);
  
  // Check for level-based ascensions
  useEffect(() => {
    if (!gameState) return;
    
    // Ascension milestone levels
    const milestones = [10, 25, 50, 100];
    
    if (milestones.includes(gameState.level)) {
      setShowAscension(true);
    }
  }, [gameState]);
  
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
  
  // Add an effect to check for promotion readiness
  useEffect(() => {
    if (!gameState || !gameState.playerStatus) return;
    
    if (gameState.playerStatus.job?.readyForPromotion && !showPromotionNotification) {
      setShowPromotionNotification(true);
      
      // Hide after 5 seconds
      const timer = setTimeout(() => {
        setShowPromotionNotification(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    } else if (!gameState.playerStatus.job?.readyForPromotion && showPromotionNotification) {
      // Make sure notification is hidden when not ready for promotion
      setShowPromotionNotification(false);
    }
  }, [gameState, showPromotionNotification]);
  
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
  
  // Early return with loading message if gameState or playerStatus is undefined
  if (!gameState || !gameState.playerStatus) {
    return <div className="loading-container">Loading game data...</div>;
  }
  
  // Use gameState instead of state throughout the component
  const state = gameState;
  
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
    
    // Show skill gain if there's a job
    if (state.playerStatus.job && state.playerStatus.job.category) {
      showSkillGain(e.clientX, e.clientY - 20);
    } else {
      // Show a penny gain if no job
      showPennyGain(e.clientX, e.clientY - 20);
    }
    
    if (canAutoClick(state.playerStatus)) {
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
    
    if (canAutoClick(state.playerStatus)) {
      setIsHolding(true);
    }
  };
  
  const handleTouchEnd = (e) => {
    if (e) e.preventDefault();
    setIsHolding(false);
  };
  
  const handleAscension = () => {
    dispatch({ type: 'ASCEND' });
    setShowAscension(false);
  };

  const dismissAscension = () => {
    setShowAscension(false);
  };
  
  // Format minutes to hours and minutes
  // eslint-disable-next-line no-unused-vars
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
  
  // Add function to show skill gain indicator (add after getBusinesses())
  const showSkillGain = (x, y) => {
    if (!state.playerStatus.job || !state.playerStatus.job.category) return;
    
    // Get the job category to display which skill is gaining
    const jobCategory = state.playerStatus.job.category;
    
    // Add this skill indicator
    setSkillGainIndicator({
      skill: jobCategory.charAt(0).toUpperCase() + jobCategory.slice(1),
      x,
      y
    });
    
    // Clear after animation
    setTimeout(() => {
      setSkillGainIndicator(null);
    }, 600);
  };
  
  // Show a penny gain animation when clicking without a job
  const showPennyGain = (x, y) => {
    const indicator = document.createElement('div');
    indicator.innerText = '+$0.01';
    indicator.className = 'penny-gain-indicator';
    indicator.style.left = `${x}px`;
    indicator.style.top = `${y}px`;
    
    document.body.appendChild(indicator);
    
    // Animate upward and fade out
    setTimeout(() => {
      indicator.style.transform = 'translateY(-50px)';
      indicator.style.opacity = '0';
    }, 50);
    
    // Remove from DOM after animation
    setTimeout(() => {
      if (indicator.parentNode) {
        indicator.parentNode.removeChild(indicator);
      }
    }, 1000);
  };
  
  // Add a dismiss function
  const dismissPromotionNotification = () => {
    setShowPromotionNotification(false);
  };
  
  // Get default job icon if not provided in job data
  const getJobIcon = (jobLevel, category) => {
    // Default icons based on job level and category
    const levelIcons = {
      owner: '👑',
      executive: '🌟',
      senior: '📊',
      mid: '📋',
      entry: '🔰'
    };
    
    // Category-specific icons
    const categoryIcons = {
      technology: '💻',
      technical: '🖥️',
      finance: '💰',
      financial: '💹',
      healthcare: '🏥',
      education: '🎓',
      retail: '🛒',
      hospitality: '🏨',
      service: '🛎️',
      sales: '🏷️',
      legal: '⚖️',
      construction: '🔨',
      creative: '🎨',
      marketing: '📢',
      entertainment: '🎬',
      science: '🔬',
      management: '📋',
      food: '🍳'
    };
    
    // Check if category exists and has a matching icon
    if (category && categoryIcons[category]) {
      return categoryIcons[category];
    }
    
    // Fallback to job level icon
    return levelIcons[jobLevel] || '🔰';
  };
  
  // Function to determine job category
  const getJobCategory = (job) => {
    return job ? job.category : null;
  };
  
  return (
    <div className="clicker-container">
      {/* Top section with player info */}
      <div className="player-info-section">
        <div className="player-name-level">
          <h2>{state.playerStatus.name || "Player"}</h2>
          <div className="player-level">
            <span className="level-badge level-beginner">Level {state.level}</span>
            <div className="xp-bar">
              <div className="xp-progress" style={{ width: `${progressPercentage}%` }}></div>
            </div>
          </div>
        </div>
        
        <div className="job-info-panel">
          {state.playerStatus.job ? (
            <>
              <div className="job-header">
                <div className="job-title-container">
                  <div className="job-title">
                    {state.playerStatus.job.title}
                    {state.playerStatus.job.readyForPromotion && (
                      <span className="badge badge-primary badge-promotion">Ready for Promotion!</span>
                    )}
                  </div>
                  <div className="job-pay">
                    ${(state.playerStatus.job.hourlyPay || state.playerStatus.job.payPerClick * 60).toFixed(2)}/hr | ${clickValue.toFixed(2)}/click
                  </div>
                </div>
                <div className="job-icon">
                  {state.playerStatus.job.image || getJobIcon(getJobCategory(state.playerStatus.job), state.playerStatus.job.category)}
                </div>
              </div>
              
              {/* Job Level Progress Bar */}
              <div className="job-level-progress">
                <div className="level-display">
                  <span className="level-badge level-beginner">Level {state.playerStatus.job.level}</span>
                  {state.playerStatus.job.level < 500 && (
                    <span className="next-job-level">
                      {state.playerStatus.job.readyForPromotion 
                        ? <span className="badge badge-primary badge-promotion">Ready for Promotion!</span> 
                        : `Level ${state.playerStatus.job.level + 1}`}
                    </span>
                  )}
                </div>
                <div className="level-progress-bar">
                  <div 
                    className={`level-progress-filled ${state.playerStatus.job.readyForPromotion ? 'promotion-ready' : ''}`}
                    style={{ 
                      width: `${Math.min(100, (state.playerStatus.jobExperience / jobExperienceNeededForLevel(state.playerStatus.job.level)) * 100)}%` 
                    }}
                  ></div>
                </div>
                <div className="level-experience-text">
                  {state.playerStatus.job.readyForPromotion 
                    ? <span className="promotion-ready-text">Check Jobs tab to apply for promotion!</span> 
                    : <span>XP: {Math.round(state.playerStatus.jobExperience)} / {jobExperienceNeededForLevel(state.playerStatus.job.level)}</span>}
                  {!state.playerStatus.job.readyForPromotion && state.playerStatus.job.level < 500 && (
                    <span>Next promotion at level {Math.ceil(state.playerStatus.job.level / 10) * 10}</span>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="no-job">No job yet! Visit the Jobs tab to apply.</div>
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
                <span className="boost-text">{getClicksPerSecond(state.playerStatus)}x</span>
              </div>
              <div className="boost-tooltip">
                <h4>Transportation Boost</h4>
                <p>Your {state.playerStatus.transportation.name} allows you to work {getClicksPerSecond(state.playerStatus)} clicks/sec when holding down.</p>
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
                <span className="boost-text">+{(state.level - 1)}%</span>
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
                <span className="boost-text">+{state.playerStatus.ascensionBonus}%</span>
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
          className={`tap-pad ${!canAutoClick(state.playerStatus) ? 'no-auto-click' : ''}`}
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
          {!canAutoClick(state.playerStatus) && (
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
      
      {skillGainIndicator && (
        <div 
          className="skill-gain-indicator"
          style={{ 
            left: `${skillGainIndicator.x}px`, 
            top: `${skillGainIndicator.y}px` 
          }}
        >
          +{skillGainIndicator.skill}
        </div>
      )}
      
      {showPromotionNotification && (
        <div className="promotion-notification" onClick={dismissPromotionNotification}>
          <div className="promotion-notification-icon">🎉</div>
          <div className="promotion-notification-content">
            <h4>Ready for Promotion!</h4>
            <p>You've reached level {state.playerStatus.job.level} and can apply for a promotion in the Jobs tab</p>
          </div>
          <button className="promotion-notification-dismiss">×</button>
        </div>
      )}
    </div>
  );
};

export default Clicker; 