import React, { useState, useEffect, useCallback } from 'react';
import { useGame } from '../context/GameContext';
import { entryLevelJobs, midLevelJobs, seniorJobs, executiveJobs, ownerJobs, skillCategories } from '../data/gameData';
import '../styles/Jobs.css';

const Jobs = () => {
  const { state, dispatch } = useGame();
  const [availableJobs, setAvailableJobs] = useState([]);
  const [pendingJob, setPendingJob] = useState(null);
  const [applicationResult, setApplicationResult] = useState(null);
  
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
  
  // Generate job listings based on player's skills and background
  const generateAvailableJobs = useCallback(() => {
    // Start with entry-level jobs
    let jobPool = [];
    
    // First generation - show all entry jobs regardless of background
    if (state.generation === 1 || !state.playerStatus.background) {
      jobPool = [
        ...entryLevelJobs.poor,
        ...entryLevelJobs.rich
      ];
    } else {
      // After first generation, filter by background
      jobPool = state.playerStatus.background === 'rich'
        ? [...entryLevelJobs.rich]
        : [...entryLevelJobs.poor];
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
        jobPool.push(job);
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
          jobPool.push(job);
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
          jobPool.push(job);
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
          jobPool.push(job);
        }
      });
    }
    
    // If the player doesn't have 3 jobs to choose from, add some random ones
    if (jobPool.length < 3) {
      if (state.playerStatus.background === 'rich') {
        // Add remaining rich entry jobs
        entryLevelJobs.rich.forEach(job => {
          if (!jobPool.some(j => j.id === job.id)) {
            jobPool.push(job);
          }
        });
      } else {
        // Add remaining poor entry jobs
        entryLevelJobs.poor.forEach(job => {
          if (!jobPool.some(j => j.id === job.id)) {
            jobPool.push(job);
          }
        });
      }
    }
    
    // Choose 5 random jobs from the pool, or all if less than 5
    const selectedJobs = [];
    const poolCopy = [...jobPool];
    
    const numJobs = Math.min(5, poolCopy.length);
    
    for (let i = 0; i < numJobs; i++) {
      const randomIndex = Math.floor(Math.random() * poolCopy.length);
      selectedJobs.push(poolCopy[randomIndex]);
      poolCopy.splice(randomIndex, 1);
    }
    
    return selectedJobs;
  }, [state.skills, state.playerStatus.background, getCategorySkillValue, hasBachelorsDegree, state.generation]);
  
  useEffect(() => {
    // Generate available jobs when the component mounts or when skills change
    const jobs = generateAvailableJobs();
    setAvailableJobs(jobs);
  }, [generateAvailableJobs]); 
  
  const applyForJob = (job) => {
    // Set the job as pending
    setPendingJob(job.id);
    
    // Generate a random wait time between 1 and 10 seconds
    const waitTime = Math.floor(Math.random() * 9000) + 1000; // 1000-10000 ms
    
    // After the wait time, process the application
    setTimeout(() => {
      // 1/1000 chance of rejection
      const isRejected = Math.random() < 0.001;
      
      if (isRejected) {
        // Show rejection message
        setApplicationResult({
          jobId: job.id,
          success: false,
          message: "Your application was rejected. Try again or apply for another position."
        });
        
        // Clear the rejection message after 5 seconds
        setTimeout(() => {
          setApplicationResult(null);
          setPendingJob(null);
        }, 5000);
      } else {
        // Application successful
        setApplicationResult({
          jobId: job.id,
          success: true,
          message: "Application successful! You got the job!"
        });
        
        // Clear the success message after 2 seconds and update the job
        setTimeout(() => {
          // Make sure job has hourlyPay property that matches payPerClick
          dispatch({ 
            type: 'GET_JOB', 
            payload: {
              ...job,
              hourlyPay: job.payPerClick
            } 
          });
          
          setApplicationResult(null);
          setPendingJob(null);
        }, 2000);
      }
    }, waitTime);
  };
  
  const isSkillSufficient = (skill, requiredLevel) => {
    return (state.skills[skill] || 0) >= requiredLevel;
  };
  
  // Function to determine job category
  const getJobCategory = (job) => {
    if (ownerJobs.some(j => j.id === job.id)) return 'owner';
    if (executiveJobs.some(j => j.id === job.id)) return 'executive';
    if (seniorJobs.some(j => j.id === job.id)) return 'senior';
    if (midLevelJobs.some(j => j.id === job.id)) return 'mid';
    return 'entry';
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
  
  // Get qualification status with more detail
  const getQualificationStatus = (job) => {
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
  
  return (
    <div className="jobs-container">
      <h2>Jobs</h2>
      
      {state.playerStatus.job && (
        <div className="current-job-banner">
          <div className="current-job-header">
            <div className="job-icon">
              {state.playerStatus.job.image || getJobIcon(getJobCategory(state.playerStatus.job), state.playerStatus.job.category)}
            </div>
            <h3>Current Job: {state.playerStatus.job.title}</h3>
          </div>
          <p>Pay: ${state.playerStatus.job.hourlyPay.toFixed(2)}/hour</p>
          <p>Each click earns ${(state.playerStatus.job.hourlyPay / 60).toFixed(2)} (one minute of work)</p>
        </div>
      )}
      
      <div className="section-header">
        <h3>Available Jobs</h3>
      </div>
      
      <div className="job-listings">
        {availableJobs.length > 0 ? (
          availableJobs.map((job) => {
            const jobCategory = getJobCategory(job);
            const qualificationStatus = getQualificationStatus(job);
            const isPending = pendingJob === job.id;
            const jobResult = applicationResult && applicationResult.jobId === job.id ? applicationResult : null;
            
            return (
              <div key={job.id} className={`job-card ${jobCategory}-level ${isPending ? 'pending' : ''}`}>
                <div className="job-header-top">
                  {jobCategory === 'owner' && <span className="job-badge owner">Owner</span>}
                  {jobCategory === 'executive' && <span className="job-badge executive">Executive</span>}
                  {jobCategory === 'senior' && <span className="job-badge senior">Senior</span>}
                  {jobCategory === 'mid' && <span className="job-badge mid">Mid-Level</span>}
                  {jobCategory === 'entry' && <span className="job-badge entry">Entry-Level</span>}
                </div>
                <div className="job-header">
                  <div className="job-icon">
                    {job.image || getJobIcon(jobCategory, job.category)}
                  </div>
                  <h3>{job.title}</h3>
                </div>
                <p className="job-description">{job.description}</p>
                <p className="job-field">Field: {job.category ? job.category.charAt(0).toUpperCase() + job.category.slice(1) : 'General'}</p>
                <p className="job-pay">Pay: ${job.payPerClick.toFixed(2)} per hour</p>
                <p className="job-click-value">Click value: ${(job.payPerClick / 60).toFixed(2)} per click</p>
                
                {Object.keys(job.requirements).length > 0 && (
                  <div className="job-requirements">
                    <h4>Requirements:</h4>
                    <ul>
                      {Object.entries(job.requirements).map(([skill, level]) => (
                        <li key={skill} className={isSkillSufficient(skill, level) ? 'met' : 'not-met'}>
                          {skill.charAt(0).toUpperCase() + skill.slice(1)}: Level {level}
                          {isSkillSufficient(skill, level) 
                            ? ' ✓' 
                            : ` (You have: ${state.skills[skill] || 0})`}
                        </li>
                      ))}
                    </ul>
                    
                    <div className={`qualification-status ${qualificationStatus.qualified ? 'qualified' : 'not-qualified'}`}>
                      {qualificationStatus.message}
                    </div>
                  </div>
                )}
                
                {jobResult && (
                  <div className={`application-result ${jobResult.success ? 'success' : 'failure'}`}>
                    {jobResult.message}
                  </div>
                )}
                
                <button 
                  className={`apply-button ${isPending ? 'pending' : ''}`}
                  onClick={() => !isPending && applyForJob(job)}
                  disabled={!qualificationStatus.qualified || isPending || pendingJob !== null}
                >
                  {isPending ? 'Pending...' : qualificationStatus.qualified ? 'Apply' : 'Not Qualified'}
                </button>
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