import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { educationOptions } from '../data/gameData';
import { entryLevelJobs, midLevelJobs, seniorJobs, executiveJobs, ownerJobs } from '../data/gameData';
import '../styles/Education.css';

const Education = () => {
  const { state, dispatch } = useGame();
  const [selectedJobPath, setSelectedJobPath] = useState(null);

  // Start education
  const startEducation = (education) => {
    dispatch({
      type: 'START_EDUCATION',
      payload: education
    });
  };
  
  // Update education progress
  useEffect(() => {
    if (state.currentEducation) {
      const timer = setInterval(() => {
        dispatch({ type: 'UPDATE_EDUCATION_PROGRESS' });
      }, 1000); // Update every second
      
      return () => clearInterval(timer);
    }
  }, [state.currentEducation, dispatch]);
  
  // Calculate how much time is left for education
  const getTimeRemaining = () => {
    if (!state.currentEducation) return null;
    
    const now = Date.now();
    const elapsed = now - state.currentEducation.startTime;
    const remaining = state.currentEducation.duration - elapsed;
    
    if (remaining <= 0) return "Completing...";
    
    // Convert to seconds
    const seconds = Math.ceil(remaining / 1000);
    
    return `${seconds} seconds remaining`;
  };
  
  const canAffordEducation = (education) => {
    return state.money >= education.cost;
  };
  
  // Format skill name
  const formatSkillName = (skill) => {
    return skill.charAt(0).toUpperCase() + skill.slice(1);
  };
  
  // Calculate skill level with decimals
  const getSkillLevel = (skill) => {
    if (!state.skills[skill] && state.skills[skill] !== 0) return 0;
    return parseFloat(state.skills[skill].toFixed(1));
  };
  
  // Calculate skill gain multiplier based on background (if any)
  const getSkillMultiplier = (education) => {
    // First generation gets standard multiplier 
    if (!state.playerStatus.background) {
      return 1;
    }
    
    // After first generation, apply background bonus
    return state.playerStatus.background === 'rich' 
      ? education.skillMultiplier.rich 
      : education.skillMultiplier.poor;
  };

  // Check if player has a bachelor's degree
  const hasBachelorsDegree = () => {
    // Check if player has completed the university education (bachelor's degree)
    return state.skills['education'] && state.skills['education'] >= 4;
  };

  // Determine current job tier based on job ID
  const getCurrentJobTier = () => {
    if (!state.playerStatus.job) return 0;
    const jobId = state.playerStatus.job.id;

    if (ownerJobs.some(job => job.id === jobId)) return 3;
    if (executiveJobs.some(job => job.id === jobId)) return 2;
    if (seniorJobs.some(job => job.id === jobId)) return 2;
    if (midLevelJobs.some(job => job.id === jobId)) return 1;
    return 1; // Entry level jobs
  };

  // Get jobs in the current career path
  const getCareerPathJobs = (category) => {
    if (!category) return [];
    
    const entryJobs = [...entryLevelJobs.poor, ...entryLevelJobs.rich]
      .filter(job => job.category === category);
    
    const midJobs = midLevelJobs.filter(job => job.category === category);
    const seniorJobs2 = seniorJobs.filter(job => job.category === category);
    const executiveJobs2 = executiveJobs.filter(job => job.category === category);
    const ownerJobs2 = ownerJobs.filter(job => job.category === category);
    
    return {
      tier1: [...entryJobs, ...midJobs],
      tier2: [...seniorJobs2, ...executiveJobs2],
      tier3: ownerJobs2
    };
  };

  // Get current job category
  const getCurrentJobCategory = () => {
    return state.playerStatus.job ? state.playerStatus.job.category : null;
  };

  // Handle selecting a job path
  const handleSelectJobPath = (category) => {
    setSelectedJobPath(category);
  };

  // Get all unique job categories
  const getJobCategories = () => {
    const categories = new Set();
    
    [...entryLevelJobs.poor, ...entryLevelJobs.rich, ...midLevelJobs, 
     ...seniorJobs, ...executiveJobs, ...ownerJobs].forEach(job => {
      if (job.category) categories.add(job.category);
    });
    
    return Array.from(categories);
  };
  
  return (
    <div className="education-container">
      <h2>Education & Skills</h2>
      
      {state.currentEducation && (
        <div className="current-education">
          <h3>Currently Learning: {state.currentEducation.name}</h3>
          <div className="education-progress-container">
            <div 
              className="education-progress-bar" 
              style={{ width: `${state.educationProgress * 100}%` }}
            ></div>
          </div>
          <div className="education-progress-details">
            <p>Skill: {formatSkillName(state.currentEducation.skill)}</p>
            <p>Progress: {Math.round(state.educationProgress * 100)}%</p>
            <p className="time-remaining">{getTimeRemaining()}</p>
          </div>
        </div>
      )}
      
      <div className="skills-overview">
        <h3>Your Skills</h3>
        <div className="skills-list">
          {Object.keys(state.skills).length > 0 ? (
            Object.entries(state.skills).map(([skill, level]) => (
              <div key={skill} className="skill-item">
                <span className="skill-name">{formatSkillName(skill)}:</span>
                <span className="skill-level">Level {getSkillLevel(skill)}</span>
              </div>
            ))
          ) : (
            <p>You don't have any skills yet. Get some education!</p>
          )}
        </div>
      </div>

      {/* Job Training Section */}
      <div className="section-header">
        <h3>Job Training & Career Path</h3>
      </div>

      <div className="job-training-container">
        {!state.playerStatus.job ? (
          <div className="no-job-message">
            <p>You don't have a job yet. Visit the Jobs tab to find one first!</p>
          </div>
        ) : (
          <>
            <div className="current-job-info">
              <h4>Current Position: {state.playerStatus.job.title}</h4>
              <p>Career: {state.playerStatus.job.category}</p>
              <p>Tier: {getCurrentJobTier()}</p>
              {getCurrentJobTier() === 1 && !hasBachelorsDegree() && (
                <p className="promotion-requirement">
                  You need a Bachelor's Degree to advance to Tier 2 (Corporate Management)
                </p>
              )}
              {getCurrentJobTier() === 2 && (
                <p className="promotion-requirement">
                  Continue developing your skills to reach Tier 3 (Company Ownership)
                </p>
              )}
            </div>

            <div className="career-path-selector">
              <h4>Explore Career Paths</h4>
              <div className="career-buttons">
                {getJobCategories().map(category => (
                  <button 
                    key={category} 
                    className={`career-button ${category === getCurrentJobCategory() ? 'current' : ''} ${category === selectedJobPath ? 'selected' : ''}`}
                    onClick={() => handleSelectJobPath(category)}
                  >
                    {formatSkillName(category)}
                  </button>
                ))}
              </div>
            </div>

            {selectedJobPath && (
              <div className="career-progression">
                <h4>{formatSkillName(selectedJobPath)} Career Path</h4>
                
                <div className="tier-container">
                  <div className="tier-header">
                    <h5>Tier 1: Entry Level</h5>
                  </div>
                  <div className="jobs-list">
                    {getCareerPathJobs(selectedJobPath).tier1.map(job => (
                      <div 
                        key={job.id} 
                        className={`job-item ${state.playerStatus.job && state.playerStatus.job.id === job.id ? 'current-job' : ''}`}
                      >
                        <span className="job-title">{job.title}</span>
                        <span className="job-pay">${job.payPerClick}/hr</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={`tier-container ${!hasBachelorsDegree() ? 'locked-tier' : ''}`}>
                  <div className="tier-header">
                    <h5>Tier 2: Corporate Management</h5>
                    {!hasBachelorsDegree() && (
                      <div className="tier-requirement">Requires Bachelor's Degree</div>
                    )}
                  </div>
                  <div className="jobs-list">
                    {getCareerPathJobs(selectedJobPath).tier2.map(job => (
                      <div 
                        key={job.id} 
                        className={`job-item ${state.playerStatus.job && state.playerStatus.job.id === job.id ? 'current-job' : ''} ${!hasBachelorsDegree() ? 'locked-job' : ''}`}
                      >
                        <span className="job-title">{job.title}</span>
                        <span className="job-pay">${job.payPerClick}/hr</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="tier-container">
                  <div className="tier-header">
                    <h5>Tier 3: Company Ownership</h5>
                  </div>
                  <div className="jobs-list">
                    {getCareerPathJobs(selectedJobPath).tier3.map(job => (
                      <div 
                        key={job.id} 
                        className={`job-item ${state.playerStatus.job && state.playerStatus.job.id === job.id ? 'current-job' : ''}`}
                      >
                        <span className="job-title">{job.title}</span>
                        <span className="job-pay">${job.payPerClick}/hr</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="career-tips">
                  <h5>Tips for Advancement:</h5>
                  <ul>
                    <li>Complete relevant education to improve skills</li>
                    <li>Earn a Bachelor's Degree to unlock Tier 2</li>
                    <li>Continue gaining skills to qualify for higher positions</li>
                    <li>Check the Jobs tab regularly for new opportunities</li>
                  </ul>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      
      <div className="section-header">
        <h3>Available Education</h3>
      </div>
      
      <div className="education-grid">
        {educationOptions.map((education) => {
          const canAfford = canAffordEducation(education);
          const multiplier = getSkillMultiplier(education);
          
          // Calculate duration based on current skill level
          let durationMultiplier = 1;
          if (state.skills[education.skill]) {
            durationMultiplier = 1 + (getSkillLevel(education.skill) * 0.2);
          }
          const adjustedDuration = Math.round(60 * durationMultiplier);
          
          // Highlight bachelor's degree with special styling
          const isBachelorsDegree = education.id === 'university';
          
          return (
            <div 
              key={education.id} 
              className={`education-card ${canAfford ? '' : 'cannot-afford'} ${state.currentEducation ? 'disabled' : ''} ${isBachelorsDegree ? 'bachelors-degree' : ''}`}
            >
              <div className="education-header">
                <div className="education-icon">{education.image}</div>
                <h3>{education.name}</h3>
              </div>
              <p className="education-description">{education.description}</p>
              <div className="education-details">
                <p>Cost: ${education.cost.toLocaleString()}</p>
                <p>Skill: {formatSkillName(education.skill)}</p>
                <p>Skill gain: +{(education.value * multiplier).toFixed(1)} points</p>
                <p>Duration: {adjustedDuration} seconds</p>
                {getSkillLevel(education.skill) > 0 && (
                  <p className="duration-note">
                    Duration increased due to current skill level
                  </p>
                )}
                {state.playerStatus.background === 'rich' && (
                  <p className="bonus">Rich Background Bonus: +50% skill gain</p>
                )}
                {isBachelorsDegree && (
                  <p className="key-education">Required for management positions</p>
                )}
              </div>
              <button 
                className="education-button"
                onClick={() => startEducation(education)}
                disabled={!canAfford || state.currentEducation !== null}
              >
                {!canAfford ? 'Not enough money' : 
                 state.currentEducation ? 'Already in education' : 'Enroll'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Education; 