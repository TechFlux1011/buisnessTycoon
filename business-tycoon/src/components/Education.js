import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { educationOptions } from '../data/gameData';
import { entryLevelJobs, midLevelJobs, seniorJobs, executiveJobs, ownerJobs } from '../data/gameData';
import '../styles/Education.css';

const Education = () => {
  const { gameState, gameDispatch: dispatch } = useGame();
  const [selectedJobPath, setSelectedJobPath] = useState(null);
  const [expandedTier, setExpandedTier] = useState(null);
  
  // Move the education progress update useEffect to the top, before conditional returns
  useEffect(() => {
    if (gameState && gameState.currentEducation) {
      const timer = setInterval(() => {
        dispatch({ type: 'UPDATE_EDUCATION_PROGRESS' });
      }, 1000); // Update every second
      
      return () => clearInterval(timer);
    }
  }, [gameState?.currentEducation, dispatch]);
  
  // Early return with loading message if gameState or skills is undefined
  if (!gameState || !gameState.skills) {
    return <div className="loading-container">Loading game data...</div>;
  }
  
  // Use gameState instead of state throughout the component
  const state = gameState;
  
  // Start education
  const startEducation = (education) => {
    dispatch({
      type: 'START_EDUCATION',
      payload: education
    });
  };
  
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
  // eslint-disable-next-line no-unused-vars
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
    setExpandedTier(null);
  };

  // Toggle expanded tier view
  const toggleExpandedTier = (tier) => {
    if (expandedTier === tier) {
      setExpandedTier(null);
    } else {
      setExpandedTier(tier);
    }
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

  // Generate job title based on level for a given category
  const getJobTitleForLevel = (category, level) => {
    if (!category) return "Job";

    // Default structure for most categories
    const defaultStructure = {
      1: "Associate 1",
      10: "Associate 2",
      20: "Senior Associate",
      30: "Team Lead",
      40: "Supervisor",
      50: "Assistant Manager",
      60: "Manager",
      70: "Senior Manager",
      80: "Department Head",
      90: "Director",
      100: "Senior Director"
    };

    // Special cases for different job categories
    const categoryStructures = {
      food: {
        1: "Cook 1",
        10: "Cook 2",
        20: "Head Chef",
        30: "Sous Chef",
        40: "Chef de Partie",
        50: "Kitchen Manager",
        60: "Executive Chef",
        70: "Culinary Director",
        80: "Restaurant Manager",
        90: "General Manager",
        100: "Regional Director"
      },
      retail: {
        1: "Cashier 1",
        10: "Cashier 2",
        20: "Supervisor",
        30: "Shift Lead",
        40: "Department Manager",
        50: "Assistant Store Manager",
        60: "Store Manager",
        70: "Multi-Store Manager",
        80: "District Manager",
        90: "Regional Manager",
        100: "Operations Director"
      },
      technical: {
        1: "Junior Developer",
        10: "Developer",
        20: "Senior Developer",
        30: "Team Lead",
        40: "Project Manager",
        50: "Development Manager",
        60: "Director of Engineering",
        70: "VP of Engineering",
        80: "CTO",
        90: "Chief Architect",
        100: "Technology Director"
      },
      financial: {
        1: "Financial Analyst",
        10: "Senior Analyst",
        20: "Finance Manager",
        30: "Senior Finance Manager",
        40: "Controller",
        50: "Finance Director",
        60: "VP of Finance",
        70: "Chief Financial Officer",
        80: "Investment Director",
        90: "Treasury Director",
        100: "Finance Executive"
      },
      healthcare: {
        1: "Nurse Assistant",
        10: "Registered Nurse",
        20: "Charge Nurse",
        30: "Nurse Manager",
        40: "Nurse Practitioner",
        50: "Department Head",
        60: "Clinical Director",
        70: "Chief Nursing Officer",
        80: "Medical Director",
        90: "Hospital Administrator",
        100: "Healthcare Executive"
      },
      management: {
        1: "Management Trainee",
        10: "Junior Manager",
        20: "Manager",
        30: "Senior Manager",
        40: "Department Head",
        50: "Director",
        60: "Senior Director",
        70: "Vice President",
        80: "Senior VP",
        90: "Executive VP",
        100: "Chief Operating Officer"
      },
      legal: {
        1: "Legal Assistant",
        10: "Paralegal",
        20: "Junior Attorney",
        30: "Associate Attorney",
        40: "Senior Associate",
        50: "Managing Attorney",
        60: "Partner",
        70: "Senior Partner",
        80: "Managing Partner",
        90: "Practice Head",
        100: "Chief Legal Officer"
      }
    };

    // Get appropriate structure for this category
    const structure = categoryStructures[category] || defaultStructure;
    
    // Find the highest title level that is less than or equal to the current level
    const possibleLevels = Object.keys(structure).map(Number).sort((a, b) => a - b);
    let titleLevel = possibleLevels[0];
    
    for (const possibleLevel of possibleLevels) {
      if (possibleLevel <= level) {
        titleLevel = possibleLevel;
      } else {
        break;
      }
    }
    
    // For levels above the defined key levels, add a numeric level indicator
    if (level > titleLevel) {
      const levelDifference = Math.floor((level - titleLevel) / 10) + 1;
      return `${structure[titleLevel]} ${levelDifference}`;
    }
    
    return structure[titleLevel];
  };

  // Get next promotion level
  const getNextPromotionLevel = (currentLevel) => {
    if (currentLevel < 100) {
      return Math.ceil(currentLevel / 10) * 10;
    } else if (currentLevel < 300) {
      return Math.ceil(currentLevel / 10) * 10;
    }
    return null;
  };
  
  // Calculate pay for a given level
  const calculatePayForLevel = (basePayPerClick, level) => {
    // Each level increases pay by 5%
    const multiplier = 1 + (level * 0.05);
    return Math.round(basePayPerClick * multiplier);
  };

  // Generate progression milestones for a job category
  const generateProgressionPath = (category, basePay) => {
    if (!category) return [];

    const path = [];
    // Tier 1: Levels 1-100
    for (let level = 1; level <= 100; level += 10) {
      path.push({
        level,
        title: getJobTitleForLevel(category, level),
        pay: calculatePayForLevel(basePay, level),
        tier: 1
      });
    }
    
    // Tier 2: Levels 101-300 (requires bachelor's degree)
    for (let level = 110; level <= 300; level += 10) {
      path.push({
        level,
        title: getJobTitleForLevel(category, level),
        pay: calculatePayForLevel(basePay * 2, level - 100), // Higher base pay for tier 2
        tier: 2,
        requiresDegree: true
      });
    }
    
    return path;
  };

  // Get the current career level (based on job experience)
  const getCurrentCareerLevel = () => {
    return state.playerStatus.job?.level || 1;
  };
  
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6 pb-2 border-b border-gray-200">Education & Skills</h2>
      
      {state.currentEducation && (
        <div className="bg-blue-50 rounded-lg p-4 mb-6 shadow border border-blue-200">
          <h3 className="text-center text-blue-700 font-medium mb-3">Currently Learning: {state.currentEducation.name}</h3>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden border border-gray-300">
            <div 
              className="h-full bg-green-500 rounded-full animate-progress-bar"
              style={{ width: `${state.educationProgress * 100}%` }}
            ></div>
          </div>
          <div className="flex justify-between flex-wrap mt-2">
            <p className="text-sm text-gray-700 m-1">Skill: {formatSkillName(state.currentEducation.skill)}</p>
            <p className="text-sm text-gray-700 m-1">Progress: {Math.round(state.educationProgress * 100)}%</p>
            <p className="text-sm font-bold text-blue-700 m-1">{getTimeRemaining()}</p>
          </div>
        </div>
      )}
      
      <div className="bg-white rounded-lg p-5 mb-8 shadow-md">
        <h3 className="text-lg font-medium text-gray-800 mb-4">Your Skills</h3>
        <div className="flex flex-wrap gap-4 p-2">
          {Object.keys(state.skills).length > 0 ? (
            Object.entries(state.skills).map(([skill, level]) => (
              <div key={skill} className="bg-blue-50 rounded-full py-2 px-4 text-sm flex items-center border-l-3 border-green-500">
                <span className="font-bold text-gray-800 mr-2">{formatSkillName(skill)}:</span>
                <span className="text-green-600 font-bold">Level {getSkillLevel(skill)}</span>
              </div>
            ))
          ) : (
            <p className="text-gray-500">You don't have any skills yet. Get some education!</p>
          )}
        </div>
      </div>

      {/* Job Training Section */}
      <div className="mb-6 border-b border-gray-200">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Job Training & Career Path</h3>
      </div>

      <div className="bg-white rounded-lg p-5 mb-8 shadow-md">
        {!state.playerStatus.job ? (
          <div className="text-center p-6 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-gray-600">You don't have a job yet. Visit the Jobs tab to find one first!</p>
          </div>
        ) : (
          <>
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-lg text-gray-800 mb-2">Current Position: {state.playerStatus.job.title}</h4>
              <p className="text-gray-700 mb-1">Career: {formatSkillName(state.playerStatus.job.category)}</p>
              <p className="text-gray-700 mb-1">Current Level: {getCurrentCareerLevel()}</p>
              <p className="text-gray-700 mb-2">Tier: {getCurrentJobTier()}</p>
              
              {/* Show promotion information */}
              {getNextPromotionLevel(getCurrentCareerLevel()) && (
                <div className="mt-4">
                  <p className="text-gray-700">Next promotion at level {getNextPromotionLevel(getCurrentCareerLevel())}: 
                    <span className="font-medium text-blue-600 ml-1">{getJobTitleForLevel(state.playerStatus.job.category, getNextPromotionLevel(getCurrentCareerLevel()))}</span>
                  </p>
                  <div className="h-2 bg-gray-200 rounded-full mt-2 overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${(Math.floor(getCurrentCareerLevel() - 1) % 10) * 10}%` }}
                    ></div>
                  </div>
                </div>
              )}
              
              {getCurrentCareerLevel() < 100 && !hasBachelorsDegree() && (
                <p className="mt-3 text-sm text-amber-700 bg-amber-50 p-2 rounded-md">
                  You need a Bachelor's Degree to advance to Tier 2 (Corporate Management)
                </p>
              )}
            </div>

            <div className="mb-6">
              <h4 className="font-medium text-gray-800 mb-3">Explore Career Paths</h4>
              <div className="flex flex-wrap gap-2 mb-4">
                {getJobCategories().map(category => (
                  <button 
                    key={category} 
                    className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                      category === selectedJobPath 
                        ? 'bg-primary-600 text-white' 
                        : category === getCurrentJobCategory()
                          ? 'bg-primary-100 text-primary-800 border border-primary-300'
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                    onClick={() => handleSelectJobPath(category)}
                  >
                    {formatSkillName(category)}
                  </button>
                ))}
              </div>
            </div>

            {selectedJobPath && (
              <div className="career-progression">
                <h4>{formatSkillName(selectedJobPath)} Career Progression</h4>
                
                {/* Tier 1 Career Path: Level 1-100 */}
                <div 
                  className="tier-container expandable"
                  onClick={() => toggleExpandedTier('tier1')}
                >
                  <div className="tier-header">
                    <h5>
                      <span className="level-badge level-beginner">Tier 1</span> Entry Level to Management (Levels 1-100)
                    </h5>
                    <div className="tier-expand-icon">{expandedTier === 'tier1' ? '▼' : '▶'}</div>
                  </div>
                  
                  {expandedTier === 'tier1' && (
                    <div className="career-progression-path">
                      {generateProgressionPath(selectedJobPath, 10).filter(item => item.tier === 1).map(item => (
                        <div 
                          key={item.level}
                          className={`progression-item ${getCurrentCareerLevel() === item.level ? 'current-level' : ''} ${getCurrentCareerLevel() > item.level ? 'completed-level' : ''}`}
                        >
                          <div className="progression-level">
                            <span className="level-badge level-beginner">Level {item.level}</span>
                          </div>
                          <div className="progression-title">{item.title}</div>
                          <div className="progression-pay">${item.pay}/hr</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {!expandedTier && getCurrentJobCategory() === selectedJobPath && (
                    <div className="tier-current-status">
                      <p>Current Level: {getCurrentCareerLevel()}/100</p>
                      <div className="tier-progress-container">
                        <div 
                          className="tier-progress-bar"
                          style={{ width: `${Math.floor((getCurrentCareerLevel() - 1) / 10) * 10}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Tier 2 Career Path: Level 101-300 */}
                <div 
                  className={`tier-container expandable ${!hasBachelorsDegree() ? 'locked-tier' : ''}`}
                  onClick={() => hasBachelorsDegree() && toggleExpandedTier('tier2')}
                >
                  <div className="tier-header">
                    <h5>
                      <span className="level-badge level-intermediate">Tier 2</span> Corporate Management (Levels 101-300)
                    </h5>
                    {!hasBachelorsDegree() ? (
                      <div className="tier-requirement">
                        <span className="badge badge-warning badge-sm">Requires Bachelor's Degree</span>
                      </div>
                    ) : (
                      <div className="tier-expand-icon">{expandedTier === 'tier2' ? '▼' : '▶'}</div>
                    )}
                  </div>
                  
                  {expandedTier === 'tier2' && hasBachelorsDegree() && (
                    <div className="career-progression-path">
                      {generateProgressionPath(selectedJobPath, 20).filter(item => item.tier === 2).map(item => (
                        <div 
                          key={item.level}
                          className={`progression-item ${getCurrentCareerLevel() === item.level ? 'current-level' : ''} ${getCurrentCareerLevel() > item.level ? 'completed-level' : ''}`}
                        >
                          <div className="progression-level">
                            <span className="level-badge level-intermediate">Level {item.level}</span>
                          </div>
                          <div className="progression-title">{item.title}</div>
                          <div className="progression-pay">${item.pay}/hr</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {!expandedTier && hasBachelorsDegree() && getCurrentJobCategory() === selectedJobPath && getCurrentCareerLevel() > 100 && (
                    <div className="tier-current-status">
                      <p>Current Level: {getCurrentCareerLevel()}/300</p>
                      <div className="tier-progress-container">
                        <div 
                          className="tier-progress-bar"
                          style={{ width: `${Math.floor((getCurrentCareerLevel() - 101) / 20) * 10}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Tier 3 */}
                <div className="tier-container">
                  <div className="tier-header">
                    <h5>
                      <span className="level-badge level-advanced">Tier 3</span> Company Ownership (Level 300+)
                    </h5>
                  </div>
                  <div className="tier-description">
                    <p>After reaching level 300 in your career path, you can become a company owner in the {formatSkillName(selectedJobPath)} industry.</p>
                  </div>
                </div>

                <div className="career-tips">
                  <h5>Career Progression Tips:</h5>
                  <ul>
                    <li>Gain job experience by working to advance levels</li>
                    <li>Every 10 levels earns you a promotion with higher pay</li>
                    <li>You need a Bachelor's Degree to advance to Tier 2 (Level 100+)</li>
                    <li>Tier 1 spans levels 1-100 (Entry level to Management)</li>
                    <li>Tier 2 spans levels 101-300 (Corporate positions)</li>
                    <li>Tier 3 begins at level 300+ (Company Ownership)</li>
                  </ul>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      
      <div className="mb-6 border-b border-gray-200">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Available Education</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              className={`bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:-translate-y-1 hover:shadow-lg ${
                !canAfford ? 'opacity-60' : ''
              } ${state.currentEducation ? 'opacity-50' : ''} ${
                isBachelorsDegree ? 'border-2 border-blue-400' : ''
              }`}
            >
              <div className="flex items-start p-4 bg-gray-50 border-b border-gray-200">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">{education.image}</div>
                  <div>
                    <h3 className="font-semibold text-gray-800 text-lg">{education.name}</h3>
                    {education.difficulty && (
                      <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${
                        education.difficulty.toLowerCase() === 'beginner' ? 'bg-green-100 text-green-800' :
                        education.difficulty.toLowerCase() === 'intermediate' ? 'bg-blue-100 text-blue-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {education.difficulty}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="p-4">
                <p className="text-gray-600 text-sm mb-4">{education.description}</p>
                <div className="flex justify-between items-end">
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-700">Cost: ${education.cost.toLocaleString()}</p>
                    <p className="text-gray-700">
                      Skill: 
                      <span className="inline-block ml-1 px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                        {formatSkillName(education.skill)}
                      </span>
                    </p>
                    <p className="text-gray-700">Skill gain: +{(education.value * multiplier).toFixed(1)} points</p>
                    <p className="text-gray-700">Duration: {adjustedDuration} seconds</p>
                    {getSkillLevel(education.skill) > 0 && (
                      <p className="text-xs text-gray-500 italic">
                        Duration increased due to current skill level
                      </p>
                    )}
                    {state.playerStatus.background === 'rich' && (
                      <p className="text-green-600 text-xs font-medium">Rich Background Bonus: +50% skill gain</p>
                    )}
                    {isBachelorsDegree && (
                      <p className="bg-blue-50 text-blue-700 p-2 rounded-md text-xs mt-2">Required for management positions</p>
                    )}
                  </div>
                  
                  <button 
                    className={`px-4 py-1.5 rounded-lg font-medium text-sm transition ml-4 flex-shrink-0 ${
                      !canAfford || state.currentEducation 
                        ? 'bg-gray-300 text-gray-600 cursor-not-allowed' 
                        : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow'
                    }`}
                    onClick={() => startEducation(education)}
                    disabled={!canAfford || state.currentEducation !== null}
                  >
                    {!canAfford ? 'Not enough money' : 
                     state.currentEducation ? 'Already in education' : 'Enroll'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Education; 