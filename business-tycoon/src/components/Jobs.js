import React, { useState, useEffect, useCallback } from 'react';
import { useGame } from '../context/GameContext';
import { entryLevelJobs, midLevelJobs, seniorJobs, executiveJobs, ownerJobs, skillCategories } from '../data/gameData';
import '../styles/Jobs.css';

const Jobs = () => {
  const { state, dispatch, jobExperienceNeededForLevel, getJobTitleForLevel } = useGame();
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
  
  // Calculate skill value for a category (sum of related skills)
  const getCategorySkillValue = useCallback((category) => {
    if (!category || !skillCategories[category]) return 0;
    
    const relatedSkills = skillCategories[category];
    return relatedSkills.reduce((sum, skill) => sum + (state.skills[skill] || 0), 0);
  }, [state.skills]);
  
  // Check if player has a bachelor's degree (required for tier 2 jobs)
  const hasBachelorsDegree = useCallback(() => {
    return state.skills['education'] && state.skills['education'] >= 4;
  }, [state.skills]);
  
  // Function to check if a job is a promotion opportunity
  // eslint-disable-next-line no-unused-vars
  const isPromotionOpportunity = (job) => {
    // If no current job, can't have a promotion
    if (!state.playerStatus.job) return false;
    
    // Check if the job shares the same category as current job
    return job.category === state.playerStatus.job.category;
  };
  
  // Add effect to show promotion banner when ready
  useEffect(() => {
    if (state.playerStatus.job?.readyForPromotion) {
      setShowPromotionBanner(true);
    } else {
      setShowPromotionBanner(false);
    }
  }, [state.playerStatus.job?.readyForPromotion]);
  
  // Generate job listings based on player's skills and background
  const generateAvailableJobs = useCallback(() => {
    // Start with entry-level jobs
    let jobPool = [];
    
    // First generation - show all entry jobs regardless of background
    if (state.generation === 1 || !state.playerStatus.background) {
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
      jobPool = state.playerStatus.background === 'rich'
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
    if (state.playerStatus.job?.readyForPromotion) {
      // Generate a promotion job listing
      const currentJob = state.playerStatus.job;
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
      
      // Show promotion banner if not already showing
      if (!showPromotionBanner) {
        setShowPromotionBanner(true);
        // Hide after 10 seconds
        setTimeout(() => setShowPromotionBanner(false), 10000);
      }
    }
    
    // Add mid-level jobs if player has required skills
    midLevelJobs.forEach(job => {
      let qualified = true;
      
      for (const [skill, level] of Object.entries(job.requirements)) {
        if (!state.skills[skill] || state.skills[skill] < level) {
          qualified = false;
          break;
        }
      }
      
      // Check if player has related category skills
      if (!qualified && job.category) {
        const categorySkillValue = getCategorySkillValue(job.category);
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
    if (hasBachelorsDegree()) {
      // Add senior-level jobs if player has required skills
      seniorJobs.forEach(job => {
        let qualified = true;
        
        for (const [skill, level] of Object.entries(job.requirements)) {
          if (!state.skills[skill] || state.skills[skill] < level) {
            qualified = false;
            break;
          }
        }
        
        // Special case for jobs that need skill combinations
        if (!qualified && Object.keys(job.requirements).length >= 2) {
          // Get the total skills across all requirements
          const totalRequiredSkills = Object.values(job.requirements).reduce((sum, level) => sum + level, 0);
          const playerTotalSkills = Object.entries(job.requirements)
            .reduce((sum, [skill, _]) => sum + (state.skills[skill] || 0), 0);
            
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
      
      // Add executive-level jobs if player has required skills
      executiveJobs.forEach(job => {
        let qualified = true;
        
        for (const [skill, level] of Object.entries(job.requirements)) {
          if (!state.skills[skill] || state.skills[skill] < level) {
            qualified = false;
            break;
          }
        }
        
        // Special case for jobs that need skill combinations
        if (!qualified && Object.keys(job.requirements).length >= 3) {
          // Get the total skills across all requirements
          const totalRequiredSkills = Object.values(job.requirements).reduce((sum, level) => sum + level, 0);
          const playerTotalSkills = Object.entries(job.requirements)
            .reduce((sum, [skill, _]) => sum + (state.skills[skill] || 0), 0);
            
          // For executive jobs, need 80% of required skills
          if (playerTotalSkills >= totalRequiredSkills * 0.8) {
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
    }
    
    // Add company owner jobs if player has required skills and a bachelor's degree
    if (hasBachelorsDegree()) {
      ownerJobs.forEach(job => {
        let qualified = true;
        
        for (const [skill, level] of Object.entries(job.requirements)) {
          if (!state.skills[skill] || state.skills[skill] < level) {
            qualified = false;
            break;
          }
        }
        
        // Special case for jobs that need skill combinations
        if (!qualified && Object.keys(job.requirements).length >= 4) {
          // Get the total skills across all requirements
          const totalRequiredSkills = Object.values(job.requirements).reduce((sum, level) => sum + level, 0);
          const playerTotalSkills = Object.entries(job.requirements)
            .reduce((sum, [skill, _]) => sum + (state.skills[skill] || 0), 0);
            
          // For owner jobs, need 85% of required skills
          if (playerTotalSkills >= totalRequiredSkills * 0.85) {
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
    }
    
    // ALWAYS ensure there's at least one job in the pool
    if (jobPool.length === 0) {
      // Find entry-level jobs that match player's skills
      const playerSkills = Object.keys(state.skills || {});
      
      // First try to find jobs that match player's skills from their background pool
      const backgroundJobs = state.playerStatus.background === 'rich' 
        ? entryLevelJobs.rich 
        : entryLevelJobs.poor;
      
      // Find jobs matching player skills
      let matchingJobs = backgroundJobs.filter(job => {
        if (!job.requirements) return true; // No requirements means always a match
        
        // Check if the job requires any skill the player has
        return Object.keys(job.requirements).some(skill => 
          playerSkills.includes(skill) && state.skills[skill] >= job.requirements[skill]
        );
      });
      
      // If no matching jobs from background, check both pools
      if (matchingJobs.length === 0) {
        const allEntryJobs = [...entryLevelJobs.poor, ...entryLevelJobs.rich];
        matchingJobs = allEntryJobs.filter(job => {
          if (!job.requirements) return true;
          
          return Object.keys(job.requirements).some(skill => 
            playerSkills.includes(skill) && state.skills[skill] >= job.requirements[skill]
          );
        });
      }
      
      // If we found matching jobs, add one to the pool
      if (matchingJobs.length > 0) {
        // Add a random matching job
        const randomJob = matchingJobs[Math.floor(Math.random() * matchingJobs.length)];
        jobPool.push({
          ...randomJob,
          hourlyPay: randomJob.hourlyPay || randomJob.payPerClick * 60,
          payPerClick: randomJob.hourlyPay ? randomJob.hourlyPay / 60 : randomJob.payPerClick
        });
      } else {
        // If somehow no matching jobs were found, add a fallback entry job based on background
        const fallbackJob = state.playerStatus.background === 'rich' 
          ? {
              id: 'intern-fallback',
              title: 'Corporate Intern',
              hourlyPay: 19.80,
              payPerClick: 19.80 / 60,
              category: 'management',
              description: 'Getting coffee and making copies - always available entry position',
              requirements: {}
            }
          : {
              id: 'fastfood-fallback',
              title: 'Fast Food Worker',
              hourlyPay: 15,
              payPerClick: 15 / 60,
              category: 'food',
              description: 'Flipping burgers for minimum wage - always available entry position',
              requirements: {}
            };
            
        jobPool.push(fallbackJob);
      }
    }
    
    // If the player doesn't have 3 jobs to choose from, add some random ones
    if (jobPool.length < 3) {
      if (state.playerStatus.background === 'rich') {
        // Add remaining rich entry jobs
        entryLevelJobs.rich.forEach(job => {
          if (!jobPool.some(j => j.id === job.id)) {
            jobPool.push({
              ...job,
              hourlyPay: job.hourlyPay || job.payPerClick * 60,
              payPerClick: job.hourlyPay ? job.hourlyPay / 60 : job.payPerClick
            });
          }
        });
      } else {
        // Add remaining poor entry jobs
        entryLevelJobs.poor.forEach(job => {
          if (!jobPool.some(j => j.id === job.id)) {
            jobPool.push({
              ...job,
              hourlyPay: job.hourlyPay || job.payPerClick * 60,
              payPerClick: job.hourlyPay ? job.hourlyPay / 60 : job.payPerClick
            });
          }
        });
      }
    }
    
    // Limit to 10 jobs, but keep promotion at the top if exists
    const hasPromotion = jobPool.length > 0 && jobPool[0].isPromotion;
    const regularJobs = hasPromotion ? jobPool.slice(1) : jobPool;
    const shuffledRegularJobs = regularJobs.sort(() => Math.random() - 0.5).slice(0, hasPromotion ? 9 : 10);
    
    // Make sure all jobs have hourlyPay properly calculated
    const jobsWithHourlyPay = jobPool.map(job => {
      if (!job.hourlyPay && job.payPerClick) {
        return {
          ...job,
          hourlyPay: job.payPerClick * 60
        };
      } else if (job.hourlyPay && !job.payPerClick) {
        return {
          ...job,
          payPerClick: job.hourlyPay / 60
        };
      }
      return job;
    });
    
    return hasPromotion ? [jobsWithHourlyPay[0], ...shuffledRegularJobs] : shuffledRegularJobs;
  }, [state.generation, state.playerStatus.background, state.skills, hasBachelorsDegree, getCategorySkillValue, state.playerStatus.job, getJobTitleForLevel, showPromotionBanner]);
  
  useEffect(() => {
    // Generate available jobs when the component mounts or when skills change
    const jobs = generateAvailableJobs();
    setAvailableJobs(jobs);
    setLastJobRefresh(Date.now());
  }, [generateAvailableJobs]); 
  
  // Add job refresh timer - refresh every 30 seconds
  useEffect(() => {
    const jobRefreshInterval = setInterval(() => {
      // Generate new job listings
      setIsRefreshing(true);
      const jobs = generateAvailableJobs();
      setAvailableJobs(jobs);
      setLastJobRefresh(Date.now());
      
      // Reset refreshing status after a short delay to allow for animation
      setTimeout(() => {
        setIsRefreshing(false);
      }, 300);
    }, 30000); // 30 seconds
    
    // Clean up interval on unmount
    return () => clearInterval(jobRefreshInterval);
  }, [generateAvailableJobs]);
  
  const applyForJob = (job) => {
    // If there's already a pending application, don't allow another one
    if (pendingJob !== null) {
      return;
    }
    
    // Check if this is a promotion job
    const isPromotion = job.isPromotion;
    
    // Set the job as pending
    setPendingJob(job.id);
    
    // Generate a random wait time - shorter for promotions
    const waitTime = isPromotion 
      ? Math.floor(Math.random() * 2000) + 1000 // 1-3 seconds for promotions
      : Math.floor(Math.random() * 9000) + 1000; // 1-10 seconds for regular jobs
    
    // Store the timer reference so it can be cleared if canceled
    const applicationTimer = setTimeout(() => {
      // Promotions always succeed, but regular jobs have a small chance of rejection
      const isRejected = !isPromotion && Math.random() < 0.001;
      
      if (isRejected) {
        // Show rejection message
        setApplicationResult({
          jobId: job.id,
          success: false,
          message: "Your application was rejected. Try again or apply for another position."
        });
        
        // Clear the rejection message after 5 seconds
        const rejectionTimer = setTimeout(() => {
          setApplicationResult(null);
          setPendingJob(null);
          
          // Remove timer reference
          setApplicationTimers(prevTimers => {
            const newTimers = {...prevTimers};
            delete newTimers[job.id];
            return newTimers;
          });
        }, 5000);
        
        // Store the rejection timer reference
        setApplicationTimers(prevTimers => ({
          ...prevTimers,
          [job.id]: rejectionTimer
        }));
      } else {
        // Application successful
        setApplicationResult({
          jobId: job.id,
          success: true,
          message: isPromotion ? "Promotion approved! Congratulations on your career advancement!" : "Application successful! You got the job!"
        });
        
        // Show level up message for promotions
        if (isPromotion) {
          setLevelUpDetails({
            newLevel: job.level,
            title: job.title
          });
          setShowLevelUpMessage(true);
          
          // Hide level up message after 5 seconds
          setTimeout(() => {
            setShowLevelUpMessage(false);
          }, 5000);
        }
        
        // Clear the success message after 2 seconds and update the job
        const successTimer = setTimeout(() => {
          // Get the job object ready with hourlyPay as the source of truth
          const hourlyPay = job.hourlyPay || (job.payPerClick * 60) || 300; // Default to $5/hr if no pay is defined
          const jobToAssign = {
            ...job,
            hourlyPay: hourlyPay,
            payPerClick: hourlyPay / 60,
            basePayPerClick: hourlyPay / 60,
            readyForPromotion: false // Reset promotion flag
          };
          
          // Assign the job
          dispatch({ type: 'GET_JOB', payload: jobToAssign });
          
          setApplicationResult(null);
          setPendingJob(null);
          
          // Remove timer reference
          setApplicationTimers(prevTimers => {
            const newTimers = {...prevTimers};
            delete newTimers[job.id];
            return newTimers;
          });
        }, 2000);
        
        // Store the success timer reference
        setApplicationTimers(prevTimers => ({
          ...prevTimers,
          [job.id]: successTimer
        }));
      }
    }, waitTime);
    
    // Store the timer reference
    setApplicationTimers(prevTimers => ({
      ...prevTimers,
      [job.id]: applicationTimer
    }));
  };
  
  // Add a function to cancel an application
  const cancelApplication = (jobId) => {
    // Clear any timers associated with this job application
    if (applicationTimers[jobId]) {
      clearTimeout(applicationTimers[jobId]);
      
      // Remove the timer reference
      setApplicationTimers(prevTimers => {
        const newTimers = {...prevTimers};
        delete newTimers[jobId];
        return newTimers;
      });
    }
    
    // Clear the pending job state
    setPendingJob(null);
  };
  
  const isSkillSufficient = (skill, requiredLevel) => {
    return (state.skills[skill] || 0) >= requiredLevel;
  };
  
  // Function to determine job category
  const getJobCategory = (job) => {
    return job ? job.category : null;
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
  
  // eslint-disable-next-line no-unused-vars
  const getQualificationStatus = (job) => {
    // If no job is provided, return null
    if (!job) return null;
    
    // First check if bachelor's degree is required for senior/executive/owner jobs
    const isTier2OrHigher = seniorJobs.some(j => j.id === job.id) || 
                           executiveJobs.some(j => j.id === job.id) ||
                           ownerJobs.some(j => j.id === job.id);
    
    if (isTier2OrHigher && !hasBachelorsDegree()) {
      return {
        qualified: false,
        message: "Bachelor's Degree Required"
      };
    }
    
    // No requirements means qualified
    if (!job.requirements || Object.keys(job.requirements).length === 0) {
      return { qualified: true, message: 'No requirements' };
    }
    
    // Then check skill requirements
    const missingSkills = [];
    let totalNeeded = 0;
    let totalHave = 0;
    
    for (const [skill, level] of Object.entries(job.requirements)) {
      totalNeeded += level;
      totalHave += Math.min(level, state.skills[skill] || 0);
      
      if (!isSkillSufficient(skill, level)) {
        missingSkills.push({
          skill,
          have: state.skills[skill] || 0,
          need: level
        });
      }
    }
    
    // Qualified if no missing skills
    if (missingSkills.length === 0) {
      return { qualified: true, message: 'Fully qualified' };
    }
    
    // Check if they qualify by combined skills
    const percentQualified = (totalHave / totalNeeded) * 100;
    const jobLevel = getJobCategory(job);
    
    if (
      (jobLevel === 'mid' && percentQualified >= 70) ||
      (jobLevel === 'senior' && percentQualified >= 75) ||
      (jobLevel === 'executive' && percentQualified >= 80)
    ) {
      return {
        qualified: true,
        message: `Qualified by combined skills (${Math.round(percentQualified)}%)` 
      };
    }
    
    // Not qualified
    return {
      qualified: false,
      message: `Missing requirements (${Math.round(percentQualified)}% qualified)`,
      missingSkills
    };
  };
  
  // Helper function to format skill name
  const formatSkillName = (skill) => {
    return skill.charAt(0).toUpperCase() + skill.slice(1);
  };
  
  // Handle work event notification click
  const handleEventNotificationClick = () => {
    dispatch({ type: 'HIDE_WORK_EVENT_NOTIFICATION' });
    setShowEventModal(true);
  };
  
  // Show skill gain feedback animation
  const showSkillGainFeedback = (skill, amount, x, y) => {
    setSkillGainFeedback({
      skill: formatSkillName(skill),
      amount: `+${amount.toFixed(1)}`,
      x,
      y,
    });
    
    // Clear the feedback after animation
    setTimeout(() => {
      setSkillGainFeedback(null);
    }, 1500);
  };
  
  // Handle work event choice selection
  const handleEventChoice = (choiceIndex, event) => {
    if (!state.workEvents.pendingEvent) return;
    
    const choice = state.workEvents.pendingEvent.choices[choiceIndex];
    
    if (choice && choice.outcome) {
      // Show feedback animation near the clicked button
      if (event) {
        const rect = event.currentTarget.getBoundingClientRect();
        showSkillGainFeedback(
          choice.outcome.skill,
          choice.outcome.gain,
          rect.left + (rect.width / 2),
          rect.top
        );
      }
    }
    
    // Dispatch the choice to the reducer
    dispatch({ 
      type: 'HANDLE_WORK_EVENT_CHOICE', 
      payload: { choiceIndex } 
    });
    
    setShowEventModal(false);
  };
  
  // Dismiss work event
  const dismissEvent = () => {
    dispatch({ type: 'DISMISS_WORK_EVENT' });
    setShowEventModal(false);
  };
  
  // Check for new work events to auto-show modal
  useEffect(() => {
    if (state.workEvents.pendingEvent && !showEventModal) {
      setShowEventModal(true);
    }
  }, [state.workEvents.pendingEvent, showEventModal]);
  
  // Add this useEffect to detect job level changes
  useEffect(() => {
    if (state.playerStatus.job && state.playerStatus.job.level > 1) {
      // If level increased, show level up message
      if (prevLevelRef.current < state.playerStatus.job.level) {
        setLevelUpDetails({
          newLevel: state.playerStatus.job.level,
          title: state.playerStatus.job.title,
        });
        setShowLevelUpMessage(true);
        
        // Hide after 5 seconds
        setTimeout(() => {
          setShowLevelUpMessage(false);
        }, 5000);
      }
      
      // Update ref for next check
      prevLevelRef.current = state.playerStatus.job.level;
    }
  }, [state.playerStatus.job]);
  
  // Calculate pay based on job level
  const calculatePayForLevel = (basePay, level) => {
    if (!basePay || isNaN(basePay)) return 300; // Default to $5/hr if no base pay
    if (!level || isNaN(level)) level = 1; // Default to level 1
    
    // Each level increases pay by 5%
    return basePay * (1 + (level - 1) * 0.05);
  };
  
  // Add after the helper functions
  const selectJob = (job) => {
    // If another job is pending, don't allow selection
    if (pendingJob !== null) return;
    
    // Apply for the job directly
    applyForJob(job);
  };
  
  // Add a formatted time remaining function
  const getRefreshTimeRemaining = () => {
    const now = Date.now();
    const timeSinceLastRefresh = now - lastJobRefresh;
    const timeRemaining = Math.max(0, 30000 - timeSinceLastRefresh);
    
    // Format as seconds
    return Math.ceil(timeRemaining / 1000);
  };
  
  // Manually refresh job listings
  const handleManualRefresh = () => {
    // Don't allow refresh if already refreshing or if less than 5 seconds since last refresh
    if (isRefreshing || (Date.now() - lastJobRefresh) < 5000) return;
    
    setIsRefreshing(true);
    const jobs = generateAvailableJobs();
    setAvailableJobs(jobs);
    setLastJobRefresh(Date.now());
    
    // Reset refreshing status after a short delay
    setTimeout(() => {
      setIsRefreshing(false);
    }, 300);
  };
  
  // Add a timer to update the display of seconds remaining
  const [refreshTimer, setRefreshTimer] = useState(30);
  
  useEffect(() => {
    const timerInterval = setInterval(() => {
      setRefreshTimer(getRefreshTimeRemaining());
    }, 1000);
    
    return () => clearInterval(timerInterval);
  }, [lastJobRefresh]);
  
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
              {state.playerStatus.job.level <= 100 && !hasBachelorsDegree() && (
                <div className="tier-requirement">
                  <span>Requires Bachelor's Degree</span>
                </div>
              )}
            </div>
            <div className={`tier ${state.playerStatus.job.level > 200 && state.playerStatus.job.level <= 400 ? 'current' : (state.playerStatus.job.level > 400 ? 'completed' : '')}`}>
              <h5>Tier 2: Upper Management (201-400)</h5>
              <p>Progress from Director to Managing Partner</p>
              {state.playerStatus.job.level <= 200 && !hasBachelorsDegree() && (
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