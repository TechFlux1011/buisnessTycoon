import React, { useState, useEffect, useCallback } from 'react';
import { useGame } from '../context/GameContext';
import { entryLevelJobs, midLevelJobs, seniorJobs, executiveJobs, ownerJobs, skillCategories } from '../data/gameData';
import '../styles/Jobs.css';

const Jobs = () => {
  const { gameState, gameDispatch: dispatch, jobExperienceNeededForLevel, getJobTitleForLevel } = useGame();
  
  const [availableJobs, setAvailableJobs] = useState([]);
  const [pendingJob, setPendingJob] = useState(null);
  const [applicationResult, setApplicationResult] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [skillGainFeedback, setSkillGainFeedback] = useState(null);
  const [showLevelUpMessage, setShowLevelUpMessage] = useState(false);
  const [levelUpDetails, setLevelUpDetails] = useState(null);
  const [showPromotionBanner, setShowPromotionBanner] = useState(false);
  const [lastJobRefresh, setLastJobRefresh] = useState(Date.now());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const prevLevelRef = React.useRef(1);
  const [applicationTimers, setApplicationTimers] = useState({});
  const [refreshTimer, setRefreshTimer] = useState(30);
  
  // Calculate skill value for a category (sum of related skills)
  const getCategorySkillValue = useCallback((category, skills) => {
    if (!category || !skillCategories[category]) return 0;
    
    const relatedSkills = skillCategories[category];
    return relatedSkills.reduce((sum, skill) => sum + (skills[skill] || 0), 0);
  }, []);
  
  // Check if player has a bachelor's degree (required for tier 2 jobs)
  const hasBachelorsDegree = useCallback((skills) => {
    return skills['education'] && skills['education'] >= 4;
  }, []);
  
  // Function to check if a job is a promotion opportunity
  const isPromotionOpportunity = useCallback((job) => {
    if (!gameState || !gameState.playerStatus || !gameState.playerStatus.job) return false;
    
    // Check if the job shares the same category as current job
    return job.category === gameState.playerStatus.job.category;
  }, [gameState]);
  
  // Calculate pay for job level
  const calculatePayForLevel = (basePay, level) => {
    return basePay * (1 + (level * 0.05));
  };
  
  // Check if player's skills meet a specific requirement
  const isSkillSufficient = (skill, requiredLevel) => {
    if (!gameState || !gameState.skills) return false;
    return gameState.skills[skill] >= requiredLevel;
  };
  
  // Get a category for a job
  const getJobCategory = (job) => {
    return job.category || 'general';
  };
  
  // Get an icon for a job based on its category
  const getJobIcon = (category, jobCategory) => {
    const icons = {
      'general': '💼',
      'labor': '🔨',
      'service': '🛎️',
      'office': '🖥️',
      'creative': '🎨',
      'technology': '💻',
      'finance': '💰',
      'healthcare': '⚕️',
      'education': '🎓',
      'management': '📊',
      'executive': '👔',
      'owner': '🏢'
    };
    
    return icons[jobCategory] || icons[category] || '💼';
  };
  
  // Get qualification status for a job
  const getQualificationStatus = (job) => {
    if (!gameState || !gameState.skills) {
      return { qualified: false, percentQualified: 0, missingSkills: [] };
    }
    
    const missingSkills = [];
    let totalSkillsNeeded = 0;
    let playerTotalSkill = 0;
    
    // Check each required skill
    for (const [skill, level] of Object.entries(job.requirements || {})) {
      totalSkillsNeeded += level;
      playerTotalSkill += Math.min(gameState.skills[skill] || 0, level);
      
      if (!gameState.skills[skill] || gameState.skills[skill] < level) {
        missingSkills.push(skill);
      }
    }
    
    const qualified = missingSkills.length === 0;
    const percentQualified = totalSkillsNeeded > 0 ? (playerTotalSkill / totalSkillsNeeded) * 100 : 100;
    
    return { qualified, percentQualified, missingSkills };
  };
  
  // Handle click on work event notification
  const handleEventNotificationClick = () => {
    if (gameState.workEvents.pendingEvent) {
      setShowEventModal(true);
    }
  };
  
  // Dismiss a work event
  const dismissEvent = () => {
    setShowEventModal(false);
    dispatch({ type: 'DISMISS_WORK_EVENT' });
  };
  
  // Handle event choice selection
  const handleEventChoice = (choiceIndex, e) => {
    e.stopPropagation();
    
    if (!gameState.workEvents.pendingEvent) return;
    
    const choice = gameState.workEvents.pendingEvent.choices[choiceIndex];
    
    dispatch({
      type: 'RESOLVE_WORK_EVENT',
      payload: { choiceIndex }
    });
    
    setShowEventModal(false);
  };
  
  // Cancel a job application
  const cancelApplication = (jobId) => {
    if (pendingJob === jobId) {
      setPendingJob(null);
    }
  };
  
  // Select a job to apply for
  const selectJob = (job) => {
    if (pendingJob) return;
    applyForJob(job);
  };
  
  // Generate job listings based on player's skills and background
  const generateAvailableJobs = useCallback(() => {
    if (!gameState || !gameState.skills) return [];
    
    // Start with entry-level jobs
    let jobPool = [];
    
    // First generation - show all entry jobs regardless of background
    if (gameState.generation === 1 || !gameState.playerStatus.background) {
      jobPool = [
        ...entryLevelJobs.poor.map(job => ({
          ...job,
          hourlyPay: job.hourlyPay || job.payPerClick * 60,
          payPerClick: job.hourlyPay ? job.hourlyPay / 60 : job.payPerClick
        })),
        ...entryLevelJobs.rich.map(job => ({
          ...job,
          hourlyPay: job.hourlyPay || job.payPerClick * 60,
          payPerClick: job.hourlyPay ? job.hourlyPay / 60 : job.payPerClick
        }))
      ];
    } else {
      // After first generation, filter by background
      jobPool = gameState.playerStatus.background === 'rich'
        ? [...entryLevelJobs.rich.map(job => ({
            ...job,
            hourlyPay: job.hourlyPay || job.payPerClick * 60,
            payPerClick: job.hourlyPay ? job.hourlyPay / 60 : job.payPerClick
          }))]
        : [...entryLevelJobs.poor.map(job => ({
            ...job,
            hourlyPay: job.hourlyPay || job.payPerClick * 60,
            payPerClick: job.hourlyPay ? job.hourlyPay / 60 : job.payPerClick
          }))];
    }
    
    // Check if player is ready for promotion
    if (gameState.playerStatus.job?.readyForPromotion) {
      // Generate a promotion job listing
      const currentJob = gameState.playerStatus.job;
      const nextJobLevel = Math.ceil(currentJob.level / 10) * 10;
      const nextJobTitle = getJobTitleForLevel(currentJob.category, nextJobLevel);
      
      // Create a promotion job listing
      const basePayValue = currentJob.hourlyPay || (currentJob.payPerClick * 60) || 300; // Default to $5/hr
      const promotionJob = {
        id: `promotion-${Date.now()}`, // Ensure unique ID
        title: nextJobTitle,
        category: currentJob.category,
        hourlyPay: calculatePayForLevel(basePayValue, nextJobLevel),
        payPerClick: calculatePayForLevel(basePayValue, nextJobLevel) / 60,
        requirements: {
          [currentJob.category]: currentJob.level * 0.2 // Requires some skill in this category
        },
        description: `A promotion opportunity at ${nextJobTitle} position. This is the next step in your career path.`,
        isPromotion: true,
        level: nextJobLevel
      };
      
      // Add to the top of the job pool
      jobPool.unshift(promotionJob);
    }
    
    // Add mid-level jobs if player has required skills
    midLevelJobs.forEach(job => {
      let qualified = true;
      
      for (const [skill, level] of Object.entries(job.requirements)) {
        if (!gameState.skills[skill] || gameState.skills[skill] < level) {
          qualified = false;
          break;
        }
      }
      
      // Check if player has related category skills
      if (!qualified && job.category) {
        const categorySkillValue = getCategorySkillValue(job.category, gameState.skills);
        // If they have sufficient total skills in the category, still qualify
        if (categorySkillValue >= 2) {
          qualified = true;
        }
      }
      
      if (qualified) {
        jobPool.push({
          ...job,
          hourlyPay: job.hourlyPay || job.payPerClick * 60,
          payPerClick: job.hourlyPay ? job.hourlyPay / 60 : job.payPerClick
        });
      }
    });
    
    // Only add senior and executive jobs if player has a bachelor's degree
    if (hasBachelorsDegree(gameState.skills)) {
      // Add senior-level jobs if player has required skills
      seniorJobs.forEach(job => {
        let qualified = true;
        
        for (const [skill, level] of Object.entries(job.requirements)) {
          if (!gameState.skills[skill] || gameState.skills[skill] < level) {
            qualified = false;
            break;
          }
        }
        
        // Special case for jobs that need skill combinations
        if (!qualified && Object.keys(job.requirements).length >= 2) {
          // Get the total skills across all requirements
          const totalRequiredSkills = Object.values(job.requirements).reduce((sum, level) => sum + level, 0);
          const playerTotalSkills = Object.entries(job.requirements)
            .reduce((sum, [skill, _]) => sum + (gameState.skills[skill] || 0), 0);
            
          // If player has 75% of the required total skills, qualify them
          if (playerTotalSkills >= totalRequiredSkills * 0.75) {
            qualified = true;
          }
        }
        
        if (qualified) {
          jobPool.push({
            ...job,
            hourlyPay: job.hourlyPay || job.payPerClick * 60,
            payPerClick: job.hourlyPay ? job.hourlyPay / 60 : job.payPerClick
          });
        }
      });
      
      // Add executive-level jobs if player has high skills
      executiveJobs.forEach(job => {
        let qualified = true;
        
        for (const [skill, level] of Object.entries(job.requirements)) {
          if (!gameState.skills[skill] || gameState.skills[skill] < level) {
            qualified = false;
            break;
          }
        }
        
        if (qualified) {
          jobPool.push({
            ...job,
            hourlyPay: job.hourlyPay || job.payPerClick * 60,
            payPerClick: job.hourlyPay ? job.hourlyPay / 60 : job.payPerClick
          });
        }
      });
      
      // Add owner-level jobs if player has extremely high skills
      ownerJobs.forEach(job => {
        let qualified = true;
        
        for (const [skill, level] of Object.entries(job.requirements)) {
          if (!gameState.skills[skill] || gameState.skills[skill] < level) {
            qualified = false;
            break;
          }
        }
        
        if (qualified) {
          jobPool.push({
            ...job,
            hourlyPay: job.hourlyPay || job.payPerClick * 60,
            payPerClick: job.hourlyPay ? job.hourlyPay / 60 : job.payPerClick
          });
        }
      });
    }
    
    return jobPool;
  }, [gameState, getCategorySkillValue, hasBachelorsDegree, getJobTitleForLevel]);
  
  // Function to manually refresh the job listings
  const handleManualRefresh = () => {
    // Only allow refresh if not already refreshing
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    const jobs = generateAvailableJobs();
    setAvailableJobs(jobs);
    setLastJobRefresh(Date.now());
    setRefreshTimer(30); // Reset the timer
    
    // Reset refreshing state after animation
    setTimeout(() => {
      setIsRefreshing(false);
    }, 500);
  };
  
  // Add effect to show promotion banner when ready
  useEffect(() => {
    if (!gameState || !gameState.playerStatus) return;
    
    if (gameState.playerStatus.job?.readyForPromotion) {
      setShowPromotionBanner(true);
    } else {
      setShowPromotionBanner(false);
    }
  }, [gameState]);
  
  // Generate job listings on first load and when skills change
  useEffect(() => {
    if (!gameState || !gameState.skills) return;
    
    const jobs = generateAvailableJobs();
    setAvailableJobs(jobs);
  }, [generateAvailableJobs, gameState]);
  
  // Effect to check if player leveled up
  useEffect(() => {
    if (!gameState || !gameState.playerStatus || !gameState.playerStatus.job) return;
    
    const currentJobLevel = gameState.playerStatus.job.level;
    const previousLevel = prevLevelRef.current;
    
    if (currentJobLevel > previousLevel) {
      // Player gained a level, show notification
      setLevelUpDetails({
        oldLevel: previousLevel,
        newLevel: currentJobLevel,
        job: gameState.playerStatus.job.title
      });
      setShowLevelUpMessage(true);
      
      // Hide after 5 seconds
      setTimeout(() => {
        setShowLevelUpMessage(false);
      }, 5000);
    }
    
    prevLevelRef.current = currentJobLevel;
  }, [gameState]);
  
  // Check for expiring application timers and refresh the available jobs
  useEffect(() => {
    if (!gameState) return;
    
    // Timer to update refresh countdown
    const timerInterval = setInterval(() => {
      setRefreshTimer(prev => {
        if (prev <= 1) {
          // Time to refresh the job listings
          const jobs = generateAvailableJobs();
          setAvailableJobs(jobs);
          setLastJobRefresh(Date.now());
          setIsRefreshing(true);
          
          // Reset refreshing state after animation
          setTimeout(() => {
            setIsRefreshing(false);
          }, 500);
          
          return 30; // Reset timer to 30 seconds
        }
        return prev - 1;
      });
      
      // Check application timers and remove expired ones
      setApplicationTimers(prev => {
        const now = Date.now();
        const expired = Object.keys(prev).filter(jobId => prev[jobId] < now);
        
        if (expired.length > 0) {
          const newTimers = {...prev};
          expired.forEach(jobId => {
            delete newTimers[jobId];
          });
          return newTimers;
        }
        
        return prev;
      });
    }, 1000);
    
    return () => clearInterval(timerInterval);
  }, [gameState, generateAvailableJobs]);
  
  // Early return with loading message if gameState or skills is undefined
  if (!gameState || !gameState.skills) {
    return <div className="loading-container">Loading game data...</div>;
  }
  
  // Use gameState instead of state throughout the component
  const state = gameState;
  
  // Apply for job function
  const applyForJob = (job) => {
    // Check if already applied to this job
    if (applicationTimers[job.id]) {
      return;
    }
    
    // Check if currently applying to a job
    if (pendingJob) {
      return;
    }
    
    // Set this job as pending
    setPendingJob(job);
    
    // Determine if player qualifies for the job
    const qualificationResult = getQualificationStatus(job);
    const isQualified = qualificationResult.qualified;
    
    // If it's a promotion opportunity, immediate success
    const isPromotion = job.isPromotion;
    
    // Calculate chance of application success
    let successChance = isQualified ? 0.85 : qualificationResult.percentQualified / 100 * 0.5;
    
    // Apply modifiers based on job type
    if (job.level && job.level >= 50) {
      // High-level jobs are harder to get
      successChance *= 0.85;
    }
    
    // Promotions are guaranteed if you're ready
    if (isPromotion && state.playerStatus.job?.readyForPromotion) {
      successChance = 1.0;
    }
    
    // Roll for success
    const roll = Math.random();
    const success = roll <= successChance;
    
    // Process application result after a delay
    setTimeout(() => {
      if (success) {
        // Application successful!
        if (isPromotion) {
          // Handle promotion differently
          dispatch({
            type: 'APPLY_FOR_PROMOTION',
            payload: { job }
          });
          
          setApplicationResult({
            success: true,
            message: `Congratulations! You've been promoted to ${job.title}!`,
            job: job
          });
        } else {
          // Set the new job
          dispatch({
            type: 'SET_JOB',
            payload: {
              id: job.id,
              title: job.title,
              hourlyPay: job.hourlyPay,
              payPerClick: job.payPerClick,
              category: job.category,
              level: job.level || 1,
              image: job.image,
              baseTitle: job.title
            }
          });
          
          setApplicationResult({
            success: true,
            message: `Congratulations! You got the ${job.title} job!`,
            job: job
          });
        }
      } else {
        // Application failed
        setApplicationResult({
          success: false,
          message: `Sorry, your application for ${job.title} was rejected.${qualificationResult.missingSkills.length > 0 ? ' You need more experience in ' + qualificationResult.missingSkills.join(', ') + '.' : ''}`,
          job: job
        });
      }
      
      // Set a cooldown timer for this specific job (30 seconds)
      const cooldownTime = Date.now() + 30000; // 30 seconds cooldown
      setApplicationTimers(prev => ({
        ...prev,
        [job.id]: cooldownTime
      }));
      
      // Clear pending job
      setPendingJob(null);
    }, 2000); // 2 second processing time
  };
  
  return (
    <div className="jobs-container">
      <h2>Jobs & Career</h2>
      
      <div className="jobs-info-panel">
        <p className="wage-info-note">Wages shown are hourly rates. Each click represents one minute of work and earns 1/60th of the hourly wage.</p>
      </div>
      
      {/* Promotion Banner */}
      {showPromotionBanner && state.playerStatus.job?.readyForPromotion && (
        <div className="promotion-banner">
          <div className="promotion-icon">🎉</div>
          <div className="promotion-message">
            <h4>Promotion Available!</h4>
            <p>You've reached level {state.playerStatus.job.level} and qualify for a promotion to a higher position.</p>
          </div>
        </div>
      )}
      
      {/* Work Event Notification */}
      {state.workEvents.pendingEvent && state.workEvents.notificationVisible && (
        <div className="work-event-notification" onClick={handleEventNotificationClick}>
          <div className="notification-icon">!</div>
          <div className="notification-text">Work event: {state.workEvents.pendingEvent.title}</div>
        </div>
      )}
      
      {/* Job Level Up Notification */}
      {showLevelUpMessage && levelUpDetails && (
        <div className="level-up-notification">
          <div className="level-up-icon">🎉</div>
          <div className="level-up-text">
            <div className="level-up-title">Promotion!</div>
            <div className="level-up-details">
              You've been promoted to Level {levelUpDetails.newLevel}: {levelUpDetails.title}
            </div>
          </div>
        </div>
      )}
      
      {/* Skill Gain Feedback Animation */}
      {skillGainFeedback && (
        <div 
          className="skill-gain-animation"
          style={{ 
            left: `${skillGainFeedback.x}px`, 
            top: `${skillGainFeedback.y}px` 
          }}
        >
          {skillGainFeedback.skill} {skillGainFeedback.amount}
        </div>
      )}
      
      {/* Work Event Modal */}
      {showEventModal && state.workEvents.pendingEvent && (
        <div className="modal-overlay" onClick={dismissEvent}>
          <div className="event-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{state.workEvents.pendingEvent.title}</h3>
            <p className="event-description">{state.workEvents.pendingEvent.description}</p>
            
            <div className="event-choices">
              {state.workEvents.pendingEvent.choices.map((choice, index) => (
                <button 
                  key={index} 
                  className="event-choice-button"
                  onClick={(e) => handleEventChoice(index, e)}
                >
                  {choice.text}
                </button>
              ))}
            </div>
            
            <button className="dismiss-event-button" onClick={dismissEvent}>
              Ignore this situation
            </button>
          </div>
        </div>
      )}
      
      {state.playerStatus.job && (
        <div className="current-job-banner">
          <div className="current-job-header">
            <div className="job-icon">
              {state.playerStatus.job.image || getJobIcon(getJobCategory(state.playerStatus.job), state.playerStatus.job.category)}
            </div>
            <div className="job-title">
              <div className="title-level-container">
                <h3>{state.playerStatus.job.title}</h3>
                {state.playerStatus.job.level && <span className="level-badge level-beginner">Level {state.playerStatus.job.level}</span>}
              </div>
              <div className="job-category">
                {state.playerStatus.job.category && 
                  <span className={`category-badge category-${state.playerStatus.job.category.toLowerCase()}`}>
                    {state.playerStatus.job.category.charAt(0).toUpperCase() + state.playerStatus.job.category.slice(1)}
                  </span>
                }
              </div>
            </div>
            <div className="job-pay">${((state.playerStatus.job.hourlyPay || state.playerStatus.job.payPerClick * 60) || 0).toFixed(2)}/hr</div>
          </div>
          <p>Each click earns ${(state.playerStatus.job.payPerClick || 0).toFixed(2)} (representing one minute of work)</p>
          
          {/* Job Level Progress Bar - For All Jobs */}
          <div className="job-level-progress">
            <div className="level-display">
              <span className="current-job-level">Level {state.playerStatus.job.level}</span>
              {state.playerStatus.job.level < 500 && (
                <span className="next-job-level">Level {state.playerStatus.job.level + 1}</span>
              )}
            </div>
            <div className="level-progress-bar">
              <div 
                className="level-progress-filled"
                style={{ 
                  width: `${(state.playerStatus.jobExperience / jobExperienceNeededForLevel(state.playerStatus.job.level)) * 100}%` 
                }}
              ></div>
            </div>
            <div className="level-experience-text">
              <span>XP: {Math.round(state.playerStatus.jobExperience)} / {jobExperienceNeededForLevel(state.playerStatus.job.level)}</span>
              {state.playerStatus.job.level < 500 && (
                <span>Next promotion at level {Math.ceil(state.playerStatus.job.level / 10) * 10}</span>
              )}
            </div>
          </div>
        </div>
      )}
      
      {state.playerStatus.job && state.playerStatus.job.category === 'management' && (
        <div className="management-progression">
          <h4>Management Class Progression</h4>
          <div className="progression-info">
            <div className="current-level">
              <span className="level-number">Level {state.playerStatus.job.level}</span>
              <span className="class-title">{state.playerStatus.job.title}</span>
            </div>
            
            {state.playerStatus.job.level < 300 && (
              <div className="next-promotion">
                <div className="promotion-bar">
                  <div 
                    className="promotion-progress" 
                    style={{ 
                      width: `${(state.playerStatus.jobExperience / jobExperienceNeededForLevel(state.playerStatus.job.level)) * 100}%` 
                    }}
                  ></div>
                </div>
                <div className="promotion-info">
                  <span className="next-level">Level {state.playerStatus.job.level + 10}</span>
                  <span className="next-title">
                    {(() => {
                      // Get the next title (10 levels up)
                      const category = 'management';
                      const nextLevel = state.playerStatus.job.level + 10;
                      // Import the getJobTitleForLevel function from context
                      const nextTitle = getJobTitleForLevel(category, nextLevel);
                      return nextTitle;
                    })()}
                  </span>
                </div>
              </div>
            )}
          </div>
          
          <div className="management-tiers">
            <div className={`tier ${state.playerStatus.job.level <= 100 ? 'current' : 'completed'}`}>
              <h5>Entry Level (1-100)</h5>
              <p>Progress from Associate to Junior Supervisor</p>
            </div>
            <div className={`tier ${state.playerStatus.job.level > 100 && state.playerStatus.job.level <= 200 ? 'current' : (state.playerStatus.job.level > 200 ? 'completed' : '')}`}>
              <h5>Tier 1: Mid-Management (101-200)</h5>
              <p>Progress from Supervisor to Regional Manager</p>
              {state.playerStatus.job.level <= 100 && !hasBachelorsDegree(state.skills) && (
                <div className="tier-requirement">
                  <span>Requires Bachelor's Degree</span>
                </div>
              )}
            </div>
            <div className={`tier ${state.playerStatus.job.level > 200 && state.playerStatus.job.level <= 400 ? 'current' : (state.playerStatus.job.level > 400 ? 'completed' : '')}`}>
              <h5>Tier 2: Upper Management (201-400)</h5>
              <p>Progress from Director to Managing Partner</p>
              {state.playerStatus.job.level <= 200 && !hasBachelorsDegree(state.skills) && (
                <div className="tier-requirement">
                  <span>Requires Master's Degree</span>
                </div>
              )}
            </div>
            <div className={`tier ${state.playerStatus.job.level > 400 ? 'current' : ''}`}>
              <h5>Tier 3: Corporate Elite (401-500)</h5>
              <p>Progress from Entrepreneur to Tycoon</p>
              {state.playerStatus.job.level <= 400 && (
                <div className="tier-requirement">
                  <span>Requires Exceptional Performance</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Job listings section */}
      <div className="section-header">
        <h3>Available Jobs</h3>
        <div className="job-refresh-indicator" onClick={handleManualRefresh} style={{ cursor: 'pointer' }}>
          {isRefreshing ? (
            <span className="refresh-icon">⟳</span>
          ) : (
            <span>Refreshing in <span className="refresh-timer">{refreshTimer}</span>s</span>
          )}
        </div>
      </div>
      
      <div className={`job-listings ${isRefreshing ? 'refreshing-jobs' : ''}`}>
        {availableJobs.length > 0 ? (
          availableJobs.map((job, index) => {
            const isPending = pendingJob === job.id;
            const jobResult = applicationResult && applicationResult.jobId === job.id ? applicationResult : null;
            
            return (
              <div 
                key={job.id || index} 
                className={`job-listing ${isPending ? 'pending' : ''} ${job.isPromotion ? 'promotion-job' : ''}`}
              >
                {job.isPromotion && <div className="level-badge level-promotion">PROMOTION</div>}
                <div className="job-header">
                  <div className="job-icon">{getJobIcon(getJobCategory(job), job.category)}</div>
                  <div className="job-title">
                    <div className="title-level-container">
                      <h3>{job.title}</h3>
                      {job.level && (
                        <span className={`level-badge ${job.isPromotion ? 'level-promotion' : 'level-beginner'}`}>
                          Level {job.level}
                        </span>
                      )}
                    </div>
                    <div className="job-category">
                      {job.category && 
                        <span className={`category-badge category-${job.category.toLowerCase()}`}>
                          {job.category.charAt(0).toUpperCase() + job.category.slice(1)}
                        </span>
                      }
                    </div>
                  </div>
                  <div className="job-pay">${((job.hourlyPay || job.payPerClick * 60) || 0).toFixed(2)}/hr</div>
                </div>
                <div className="job-description">{job.description}</div>
                <div className="job-requirements">
                  {job.isPromotion ? (
                    <div className="promotion-requirements">
                      <p>This promotion is available because you've reached the next milestone in your current career path.</p>
                    </div>
                  ) : (
                    <ul>
                      {Object.entries(job.requirements || {}).map(([skill, level]) => (
                        <li key={skill} className={isSkillSufficient(skill, level) ? 'met' : 'not-met'}>
                          {skill}: {Math.round(level)} {isSkillSufficient(skill, level) ? '✓' : '✗'}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                
                {/* Application Result Message */}
                {jobResult && (
                  <div className={`application-result ${jobResult.success ? 'success' : 'failure'}`}>
                    {jobResult.message}
                  </div>
                )}
                
                {/* Action Buttons */}
                <div className="job-action-buttons">
                  {isPending ? (
                    <>
                      <div className="application-pending">
                        <div className="loading-bar"></div>
                        <div className="pending-text">Application in progress...</div>
                        <button 
                          className="cancel-application-button" 
                          onClick={(e) => {
                            e.stopPropagation();
                            cancelApplication(job.id);
                          }}
                        >
                          Cancel Application
                        </button>
                      </div>
                    </>
                  ) : (
                    <button 
                      className="apply-job-button" 
                      onClick={(e) => {
                        e.stopPropagation();
                        selectJob(job);
                      }}
                      disabled={pendingJob !== null}
                    >
                      {job.isPromotion ? 'Apply for Promotion' : 'Apply for Job'}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <p>No jobs available.</p>
        )}
      </div>
    </div>
  );
};

export default Jobs; 