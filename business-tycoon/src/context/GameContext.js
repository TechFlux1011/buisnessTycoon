import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';
import SaveDataService from '../services/SaveDataService';
import { useAuth } from './AuthContext';

// Initial game state
const initialState = {
  money: 1000, // Starting money for all players
  lastUpdate: Date.now(),
  generation: 1,
  assets: [],
  skills: {},
  experience: 0,
  level: 1,
  playerStatus: {
    job: null,
    jobExperience: 0, // Job experience points
    housing: null,
    transportation: null,
    business: null,
    age: 18,
    background: null, // No background initially
    ascensionBonus: 0,
    ascensionCount: 0,
  },
  milestones: [],
  currentEducation: null,
  educationProgress: 0,
  workEvents: {
    pendingEvent: null,
    lastEventTime: null,
    notificationVisible: false,
  },
  // Game clock settings
  timeSettings: {
    gameTimeRatio: 60, // 1 real second = 60 game seconds (1 minute real = 60 minutes game)
    lastRealTime: Date.now(), // Last real-world timestamp
    gameTime: Date.now(), // Current game time
    totalOfflineTime: 0, // Total time spent offline in milliseconds
  }
};

// Functions for game time calculations
const calculateGameTimePassed = (realTimeElapsed, gameTimeRatio) => {
  return realTimeElapsed * gameTimeRatio;
};

const calculateRealTimePassed = (gameTimeElapsed, gameTimeRatio) => {
  return gameTimeElapsed / gameTimeRatio;
};

const getCurrentGameTime = (state) => {
  const realTimeNow = Date.now();
  const realTimeElapsed = realTimeNow - state.timeSettings.lastRealTime;
  const gameTimeElapsed = calculateGameTimePassed(realTimeElapsed, state.timeSettings.gameTimeRatio);
  
  return state.timeSettings.gameTime + gameTimeElapsed;
};

// Calculate how much game time has passed since last update
const getElapsedGameTime = (state) => {
  const currentGameTime = getCurrentGameTime(state);
  return (currentGameTime - state.timeSettings.gameTime) / 1000; // in seconds
};

// Format game time for display
const formatGameTime = (timestamp) => {
  const date = new Date(timestamp);
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
    hour: date.getHours(),
    minute: date.getMinutes(),
    second: date.getSeconds(),
    fullDate: date.toLocaleDateString(),
    fullTime: date.toLocaleTimeString(),
    shortTime: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    fullDateTime: date.toLocaleString()
  };
};

const calcIncome = (state) => {
  let income = 0;
  
  // Income from assets
  if (state.assets.length > 0) {
    income += state.assets.reduce((total, asset) => total + asset.income, 0);
  }
  
  // Income from business
  if (state.playerStatus.business) {
    income += state.playerStatus.business.income;
  }
  
  // Apply level bonus (1% per level)
  income *= (1 + (state.level - 1) * 0.01);
  
  // Apply ascension bonus (5% per ascension)
  income *= (1 + (state.playerStatus.ascensionBonus / 100));
  
  return income;
};

// Experience needed for next job level
const jobExperienceNeededForLevel = (level) => {
  if (level <= 0) return 0;
  
  // Base experience needed for level 1
  const baseExperience = 100;
  
  // Experience scales with level across different tiers
  if (level <= 100) {
    // Entry Level (1-100): Linear growth
    return baseExperience * level;
  } else if (level <= 200) {
    // Tier 1 (101-200): Moderate growth
    return baseExperience * level * 1.5;
  } else if (level <= 400) {
    // Tier 2 (201-400): Faster growth
    return baseExperience * level * 2.0;
  } else {
    // Tier 3 (401+): Exponential growth
    return baseExperience * level * 2.5;
  }
};

const experienceNeededForLevel = (level) => {
  // Exponential growth formula
  return Math.floor(100 * Math.pow(1.5, level - 1));
};

// Get job title based on level and category
const getJobTitleForLevel = (category, level) => {
  // Define title progression by category
  const titlesByCategory = {
    food: [
      "Cook I", "Cook II", "Cook III", 
      "Chef de Partie", "Sous Chef", "Head Chef", 
      "Executive Chef", "Master Chef", "Celebrity Chef", "Michelin Star Chef"
    ],
    retail: [
      "Cashier I", "Cashier II", "Cashier III", 
      "Shift Lead", "Department Lead", "Assistant Manager", 
      "Store Manager", "District Manager", "Regional Director", "VP of Operations"
    ],
    technical: [
      "Junior Developer", "Developer", "Senior Developer", 
      "Lead Developer", "Architect", "Development Manager", 
      "Director of Engineering", "VP of Engineering", "CTO", "Chief Innovation Officer"
    ],
    financial: [
      "Accountant I", "Accountant II", "Accountant III", 
      "Senior Accountant", "Financial Analyst", "Finance Manager", 
      "Controller", "Finance Director", "CFO", "Chief Investment Officer"
    ],
    healthcare: [
      "Nurse I", "Nurse II", "Nurse III", 
      "Charge Nurse", "Nurse Practitioner", "Department Head", 
      "Director of Nursing", "Chief Nursing Officer", "VP of Patient Care", "Chief Medical Officer"
    ],
    legal: [
      "Paralegal I", "Paralegal II", "Paralegal III", 
      "Junior Associate", "Associate", "Senior Associate", 
      "Junior Partner", "Partner", "Senior Partner", "Managing Partner"
    ],
    management: [
      // Entry level (1-100)
      "Associate I", // Level 1
      "Associate II", // Level 10
      "Associate III", // Level 20
      "Senior Associate I", // Level 30
      "Senior Associate II", // Level 40
      "Senior Associate III", // Level 50
      "Team Lead I", // Level 60
      "Team Lead II", // Level 70
      "Team Lead III", // Level 80
      "Assistant Supervisor", // Level 90
      "Junior Supervisor", // Level 100
      
      // Tier 1: Supervisory/Mid-level (101-200)
      "Supervisor", // Level 110
      "Senior Supervisor", // Level 120
      "Project Supervisor", // Level 130
      "Assistant Manager", // Level 140
      "Department Manager", // Level 150
      "Senior Manager", // Level 160
      "Division Manager", // Level 170
      "General Manager", // Level 180
      "Operations Manager", // Level 190
      "Regional Manager", // Level 200
      
      // Tier 2: Upper Management (201-400)
      "Director", // Level 210
      "Senior Director", // Level 220
      "Executive Director", // Level 230
      "Regional Director", // Level 240
      "Divisional Director", // Level 250
      "Vice President", // Level 260
      "Senior Vice President", // Level 270
      "Executive Vice President", // Level 280
      "Chief Operating Officer", // Level 290
      "President", // Level 300
      "Chief Executive Officer", // Level 310
      "Managing Director", // Level 320
      "Executive Chairman", // Level 330
      "Chairman of the Board", // Level 340
      "Group Chairman", // Level 350
      "Global Chairman", // Level 360
      "Chief Principal", // Level 370
      "Principal Partner", // Level 380
      "Executive Partner", // Level 390
      "Managing Partner", // Level 400
      
      // Tier 3: Corporate Elite
      "Entrepreneur", // Level 410
      "Venture Capitalist", // Level 420
      "Angel Investor", // Level 430
      "Business Magnate", // Level 440
      "Industry Titan", // Level 450
      "Corporate Overlord", // Level 460
      "Market Dominator", // Level 470
      "Finance Mogul", // Level 480
      "Business Emperor", // Level 490
      "Tycoon" // Level 500
    ]
  };
  
  // Get titles for the requested category (default to general if not found)
  const titles = titlesByCategory[category] || [
    "Associate I", "Associate II", "Associate III", 
    "Senior Associate", "Team Lead", "Supervisor", 
    "Manager", "Senior Manager", "Director", "Executive"
  ];
  
  // Calculate which title to use based on level (every 10 levels is a new title)
  // For levels beyond the defined titles, use the highest title
  let titleIndex = Math.min(Math.floor((level - 1) / 10), titles.length - 1);
  
  return titles[titleIndex];
};

// Calculate pay based on job level
const calculatePayForLevel = (basePay, level) => {
  // Each level increases pay by 5%
  return basePay * (1 + (level - 1) * 0.05);
};

// Random work event generator
const generateWorkEvent = (job) => {
  if (!job) return null;
  
  const jobCategory = job.category || 'general';
  const events = workEvents[jobCategory] || workEvents.general;
  
  // Randomly select an event
  const randomEvent = events[Math.floor(Math.random() * events.length)];
  
  return {
    id: `event_${Date.now()}`,
    title: randomEvent.title,
    description: randomEvent.description,
    choices: randomEvent.choices,
    timestamp: Date.now(),
  };
};

// Check if it's time for a work event (random, but ~every 5-10 minutes)
const shouldTriggerWorkEvent = (lastEventTime) => {
  if (!lastEventTime) return Math.random() < 0.05; // 5% chance on first check
  
  const now = Date.now();
  const timeSinceLastEvent = now - lastEventTime;
  
  // Minimum time between events: 5 minutes
  if (timeSinceLastEvent < 5 * 60 * 1000) return false;
  
  // Random chance increases the longer it's been since last event
  const baseChance = 0.01; // 1% chance per minute after minimum time
  const minutesSinceMin = (timeSinceLastEvent - (5 * 60 * 1000)) / (60 * 1000);
  const chance = Math.min(0.25, baseChance * minutesSinceMin); // Cap at 25%
  
  return Math.random() < chance;
};

// Work events by job category
const workEvents = {
  general: [
    {
      title: "Team Project",
      description: "Your manager has assigned a challenging team project. How will you approach it?",
      choices: [
        { 
          text: "Take the lead and organize everyone", 
          outcome: { skill: "leadership", gain: 0.5, description: "You demonstrated strong leadership skills!" }
        },
        { 
          text: "Focus on communication and teamwork", 
          outcome: { skill: "communication", gain: 0.5, description: "Your communication skills have improved!" }
        },
        { 
          text: "Work independently on your tasks", 
          outcome: { skill: "technical", gain: 0.3, description: "You completed your tasks efficiently." }
        }
      ]
    },
    {
      title: "Office Conflict",
      description: "Two coworkers are arguing about a project approach. What do you do?",
      choices: [
        { 
          text: "Mediate the conflict", 
          outcome: { skill: "leadership", gain: 0.4, description: "You successfully resolved the conflict!" }
        },
        { 
          text: "Suggest a compromise", 
          outcome: { skill: "communication", gain: 0.4, description: "Your diplomatic approach was appreciated." }
        },
        { 
          text: "Stay out of it", 
          outcome: { skill: "ethics", gain: 0.2, description: "You focused on your own work." }
        }
      ]
    }
  ],
  food: [
    {
      title: "Kitchen Emergency",
      description: "The restaurant is packed and one of the chefs called in sick. What's your move?",
      choices: [
        { 
          text: "Step up and cover multiple stations", 
          outcome: { skill: "food", gain: 0.6, description: "You mastered multiple cooking stations!" }
        },
        { 
          text: "Reorganize the kitchen workflow", 
          outcome: { skill: "management", gain: 0.5, description: "Your management skills improved." }
        },
        { 
          text: "Focus on quality over speed", 
          outcome: { skill: "food", gain: 0.4, description: "Your attention to detail was noticed." }
        }
      ]
    },
    {
      title: "Customer Complaint",
      description: "A customer is unhappy with their meal. How do you handle it?",
      choices: [
        { 
          text: "Personally apologize and remake it", 
          outcome: { skill: "food", gain: 0.5, description: "You created a perfect dish!" }
        },
        { 
          text: "Offer a complimentary dessert", 
          outcome: { skill: "communication", gain: 0.4, description: "Your customer service skills improved." }
        },
        { 
          text: "Ask the manager to handle it", 
          outcome: { skill: "ethics", gain: 0.2, description: "You learned from watching the manager." }
        }
      ]
    }
  ],
  retail: [
    {
      title: "Busy Sale Day",
      description: "It's the biggest sale of the year and the store is understaffed. What do you do?",
      choices: [
        { 
          text: "Work the register and direct customers", 
          outcome: { skill: "communication", gain: 0.5, description: "You handled customer interactions expertly!" }
        },
        { 
          text: "Help organize the stockroom", 
          outcome: { skill: "management", gain: 0.4, description: "Your organizational skills improved." }
        },
        { 
          text: "Focus on keeping displays neat", 
          outcome: { skill: "retail", gain: 0.3, description: "You maintained store presentation perfectly." }
        }
      ]
    },
    {
      title: "Inventory Discrepancy",
      description: "You've discovered a significant inventory error. What's your approach?",
      choices: [
        { 
          text: "Investigate and document the issue", 
          outcome: { skill: "technical", gain: 0.4, description: "Your analytical skills improved!" }
        },
        { 
          text: "Report it to your supervisor", 
          outcome: { skill: "ethics", gain: 0.4, description: "Your integrity was noted." }
        },
        { 
          text: "Develop a new tracking system", 
          outcome: { skill: "retail", gain: 0.5, description: "You created an improved inventory process!" }
        }
      ]
    }
  ],
  technical: [
    {
      title: "System Outage",
      description: "The main system has crashed and everyone is looking to you for a solution. What do you do?",
      choices: [
        { 
          text: "Analyze logs and debug methodically", 
          outcome: { skill: "technical", gain: 0.6, description: "Your debugging skills leveled up!" }
        },
        { 
          text: "Implement the emergency backup", 
          outcome: { skill: "management", gain: 0.4, description: "Your quick thinking saved the day." }
        },
        { 
          text: "Coordinate the response team", 
          outcome: { skill: "leadership", gain: 0.5, description: "You led the team through the crisis." }
        }
      ]
    },
    {
      title: "Project Deadline",
      description: "Your team is behind on an important project deadline. How do you respond?",
      choices: [
        { 
          text: "Work extra hours to finish", 
          outcome: { skill: "technical", gain: 0.5, description: "Your coding endurance improved!" }
        },
        { 
          text: "Optimize the most critical features", 
          outcome: { skill: "technical", gain: 0.4, description: "You learned to prioritize effectively." }
        },
        { 
          text: "Negotiate for a deadline extension", 
          outcome: { skill: "communication", gain: 0.4, description: "Your negotiation skills improved." }
        }
      ]
    }
  ],
  financial: [
    {
      title: "Audit Preparation",
      description: "The annual audit is approaching and there are discrepancies in the accounts. What's your approach?",
      choices: [
        { 
          text: "Review all transactions methodically", 
          outcome: { skill: "financial", gain: 0.5, description: "Your attention to detail improved!" }
        },
        { 
          text: "Develop a reconciliation strategy", 
          outcome: { skill: "technical", gain: 0.4, description: "Your systematic approach was effective." }
        },
        { 
          text: "Work with the team to fix issues", 
          outcome: { skill: "leadership", gain: 0.4, description: "You guided the team successfully." }
        }
      ]
    },
    {
      title: "Investment Opportunity",
      description: "You've identified a potential investment opportunity for a client. What do you do?",
      choices: [
        { 
          text: "Conduct thorough risk analysis", 
          outcome: { skill: "financial", gain: 0.6, description: "Your analytical skills improved significantly!" }
        },
        { 
          text: "Present a balanced recommendation", 
          outcome: { skill: "communication", gain: 0.4, description: "Your presentation skills improved." }
        },
        { 
          text: "Consult with senior advisors", 
          outcome: { skill: "financial", gain: 0.3, description: "You learned from experienced colleagues." }
        }
      ]
    }
  ],
  healthcare: [
    {
      title: "Patient Emergency",
      description: "A patient's condition is deteriorating rapidly. What do you do?",
      choices: [
        { 
          text: "Follow emergency protocols precisely", 
          outcome: { skill: "healthcare", gain: 0.5, description: "Your clinical skills were impeccable!" }
        },
        { 
          text: "Call for additional support", 
          outcome: { skill: "management", gain: 0.4, description: "Your resource management was effective." }
        },
        { 
          text: "Comfort the patient while treating", 
          outcome: { skill: "communication", gain: 0.4, description: "Your bedside manner improved." }
        }
      ]
    },
    {
      title: "Staff Shortage",
      description: "Your unit is understaffed during a busy shift. How do you handle it?",
      choices: [
        { 
          text: "Prioritize patients by acuity", 
          outcome: { skill: "healthcare", gain: 0.5, description: "Your triage skills improved!" }
        },
        { 
          text: "Coordinate with other departments", 
          outcome: { skill: "leadership", gain: 0.4, description: "Your leadership in crisis improved." }
        },
        { 
          text: "Focus on efficiency and workflow", 
          outcome: { skill: "management", gain: 0.4, description: "Your efficiency skills developed." }
        }
      ]
    }
  ],
  legal: [
    {
      title: "Challenging Case",
      description: "You've been assigned a complex case with conflicting precedents. How do you approach it?",
      choices: [
        { 
          text: "Research extensively", 
          outcome: { skill: "legal", gain: 0.6, description: "Your legal research skills improved!" }
        },
        { 
          text: "Consult with senior partners", 
          outcome: { skill: "communication", gain: 0.3, description: "You learned from experienced colleagues." }
        },
        { 
          text: "Develop a novel legal strategy", 
          outcome: { skill: "legal", gain: 0.5, description: "Your legal creativity was impressive." }
        }
      ]
    },
    {
      title: "Ethical Dilemma",
      description: "You've discovered potentially problematic information about a client. What do you do?",
      choices: [
        { 
          text: "Address it directly with the client", 
          outcome: { skill: "ethics", gain: 0.5, description: "Your ethical judgment improved!" }
        },
        { 
          text: "Consult the ethics committee", 
          outcome: { skill: "legal", gain: 0.4, description: "You navigated a complex ethical situation." }
        },
        { 
          text: "Research relevant precedents", 
          outcome: { skill: "legal", gain: 0.3, description: "You deepened your understanding of legal ethics." }
        }
      ]
    }
  ]
};

// Game reducer to handle all game actions
function gameReducer(state, action) {
  switch (action.type) {
    case 'CLICK': {
      // Calculate click value (1 penny or 1 minute of work)
      const clickValue = state.playerStatus.job 
        ? state.playerStatus.job.payPerClick / 60 // One minute of hourly pay
        : 0.01; // One penny if no job
      
      // Add click XP (consistent amount regardless of job)
      const clickXP = 1 + (state.level * 0.1); // Base XP + 10% per level
      
      // Update job experience if player has a job
      if (state.playerStatus.job) {
        // Add base experience for this job level
        const expGain = 1;
        const newJobExperience = state.playerStatus.jobExperience + expGain;
        
        // Check if player reached next level of experience
        const expNeeded = jobExperienceNeededForLevel(state.playerStatus.job.level);
        let updatedJobLevel = state.playerStatus.job.level;
        let updatedJobTitle = state.playerStatus.job.title;
        let updatedJobPay = state.playerStatus.job.payPerClick;
        let updatedJobReadyForPromotion = state.playerStatus.job.readyForPromotion || false;
        
        // If we gained enough experience for a level-up
        if (newJobExperience >= expNeeded) {
          // Increase job level
          updatedJobLevel += 1;
          
          // Reset job experience for next level
          const newJobExperience = 0;
          
          // Check if this is a promotion milestone (every 10 levels)
          if (updatedJobLevel % 10 === 0) {
            // Mark as ready for promotion rather than auto-promoting
            updatedJobReadyForPromotion = true;
          } else {
            // Just a regular level up, update title and pay
            updatedJobTitle = getJobTitleForLevel(state.playerStatus.job.category, updatedJobLevel);
            updatedJobPay = calculatePayForLevel(state.playerStatus.job.basePayPerClick || state.playerStatus.job.payPerClick, updatedJobLevel);
          }
          
          return {
            ...state,
            money: state.money + clickValue,
            playerStatus: {
              ...state.playerStatus,
              jobExperience: newJobExperience,
              job: {
                ...state.playerStatus.job,
                level: updatedJobLevel,
                title: updatedJobTitle,
                payPerClick: updatedJobPay,
                readyForPromotion: updatedJobReadyForPromotion
              }
            }
          };
        }
        
        // No level up, just update experience
        return {
          ...state,
          money: state.money + clickValue,
          playerStatus: {
            ...state.playerStatus,
            jobExperience: newJobExperience,
            job: {
              ...state.playerStatus.job,
              readyForPromotion: updatedJobReadyForPromotion
            }
          }
        };
      }
      
      // If no job, just add money
      return {
        ...state,
        money: state.money + clickValue
      };
    }
    
    case 'UPDATE_INCOME': {
      const now = Date.now();
      const income = calcIncome(state);
      
      // Get elapsed game time in seconds (using game clock)
      const elapsed = getElapsedGameTime(state);
      
      // Apply income for elapsed time (only passive income from assets/business)
      const newMoney = state.money + income * elapsed;
      
      // Earn experience based on income
      const incomeXP = income * elapsed * 0.1; // 1 XP per $10 earned
      
      // Add passive job experience based on time if employed
      let jobExperience = state.playerStatus.jobExperience || 0;
      let currentJobLevel = state.playerStatus.job?.level || 1;
      let updatedJob = state.playerStatus.job;
      
      if (state.playerStatus.job) {
        // Passive job experience gain (much slower than active clicking)
        const passiveJobXP = elapsed * 0.1; // 0.1 XP per second
        jobExperience += passiveJobXP;
        
        // Check for job level up
        const experienceNeeded = jobExperienceNeededForLevel(currentJobLevel);
        if (jobExperience >= experienceNeeded) {
          jobExperience -= experienceNeeded;
          currentJobLevel += 1;
          
          // Update job title and pay based on new level
          updatedJob = {
            ...state.playerStatus.job,
            level: currentJobLevel,
            title: state.playerStatus.job.baseTitle || state.playerStatus.job.title,
            payPerClick: calculatePayForLevel(state.playerStatus.job.basePayPerClick, currentJobLevel)
          };
          
          // Update job title based on level and category
          if (state.playerStatus.job.category) {
            updatedJob.title = getJobTitleForLevel(state.playerStatus.job.category, currentJobLevel);
          }
        }
      }
      
      let newExperience = state.experience + incomeXP;
      let newLevel = state.level;
      
      // Check for level up (cap at 100)
      const MAX_LEVEL = 100;
      if (newExperience >= experienceNeededForLevel(state.level) && state.level < MAX_LEVEL) {
        newExperience -= experienceNeededForLevel(state.level);
        newLevel++;
      }
      
      // Update game time based on real time passed
      const currentGameTime = getCurrentGameTime(state);
      
      return {
        ...state,
        money: newMoney,
        lastUpdate: now,
        experience: newExperience,
        level: newLevel,
        playerStatus: {
          ...state.playerStatus,
          job: updatedJob,
          jobExperience: jobExperience
        },
        timeSettings: {
          ...state.timeSettings,
          lastRealTime: now,
          gameTime: currentGameTime
        }
      };
    }
    
    case 'ASCEND': {
      // Each ascension adds 1 year to age and gives 5% permanent income boost
      const newAge = state.playerStatus.age + 1;
      const newAscensionBonus = state.playerStatus.ascensionBonus + 5;
      const newAscensionCount = state.playerStatus.ascensionCount + 1;
      
      return {
        ...state,
        playerStatus: {
          ...state.playerStatus,
          age: newAge,
          ascensionBonus: newAscensionBonus,
          ascensionCount: newAscensionCount,
        }
      };
    }
    
    case 'INIT_PLAYER': {
      // Assign a random background (rich or poor)
      const background = action.payload || (Math.random() > 0.7 ? 'rich' : 'poor');
      
      // Define all possible skills
      const allSkills = [
        'management', 'leadership', 'communication', 'technical', 'education',
        'financial', 'business', 'healthcare', 'legal', 'ethics', 'food', 'creativity'
      ];
      
      // Select 3 random skills
      const randomSkills = {};
      const shuffled = [...allSkills].sort(() => 0.5 - Math.random());
      const selectedSkills = shuffled.slice(0, 3);
      
      // Assign level 1 to each skill
      selectedSkills.forEach(skill => {
        randomSkills[skill] = 1;
      });
      
      return {
        ...state,
        playerStatus: {
          ...state.playerStatus,
          background: background,
          jobExperience: 0,
          job: null // No starter job - player starts unemployed
        },
        skills: randomSkills
      };
    }
    
    case 'REGENERATE': {
      // Calculate inheritance based on wealth
      const inheritance = state.money * 0.2; // 20% inheritance
      
      // Skills passed down to next generation (partial)
      const inheritedSkills = {};
      Object.entries(state.skills).forEach(([skill, level]) => {
        inheritedSkills[skill] = Math.floor(level * 0.3);
      });
      
      // Determine starting level (random if ascensions less than 3, otherwise level 5)
      const startingLevel = state.playerStatus.ascensionCount >= 3 ? 5 : Math.floor(Math.random() * 3) + 1;
      
      // Determine background for new generation (random, but weighted by previous wealth)
      const background = state.money >= 500000 ? 
        (Math.random() < 0.7 ? 'rich' : 'poor') : // 70% chance for rich if wealthy
        (Math.random() < 0.3 ? 'rich' : 'poor');  // 30% chance for rich if not wealthy
      
      // Adjust starting money based on new background
      const startingMoney = background === 'rich' ? 
        inheritance * 1.5 : // Rich kids get a 50% bonus on inheritance
        inheritance;        // Poor kids just get the base inheritance
      
      // Preserve milestone achievements
      const newMilestones = [...state.milestones, 
        { 
          generation: state.generation, 
          wealth: state.money, 
          level: state.level,
          ascensions: state.playerStatus.ascensionCount
        }
      ];
      
      // Reset with inheritance
      return {
        ...initialState,
        money: startingMoney,
        generation: state.generation + 1,
        skills: inheritedSkills,
        level: startingLevel,
        playerStatus: {
          ...initialState.playerStatus,
          background: background, // Assign background for next generation
        },
        milestones: newMilestones,
        lastUpdate: Date.now(),
      };
    }
    
    case 'GET_JOB': {
      // Extract basic details from the provided job
      const { title, category, hourlyPay, payPerClick, level = 1, basePayPerClick } = action.payload;
      
      // Use hourlyPay if provided, otherwise use payPerClick
      const jobPayPerClick = hourlyPay || payPerClick;
      const jobBasePayPerClick = basePayPerClick || jobPayPerClick;
      
      return {
        ...state,
        playerStatus: {
          ...state.playerStatus,
          jobExperience: 0, // Reset job experience when getting a new job
          job: {
            title,
            category,
            payPerClick: jobPayPerClick,
            basePayPerClick: jobBasePayPerClick,
            level: level || 1,
            readyForPromotion: false // Reset promotion status
          }
        }
      };
    }
    
    case 'ADD_JOB_EXPERIENCE': {
      if (!state.playerStatus.job) return state;
      
      // Add job experience
      const experienceToAdd = action.payload || 1;
      let jobExperience = (state.playerStatus.jobExperience || 0) + experienceToAdd;
      let currentJobLevel = state.playerStatus.job.level || 1;
      let updatedJob = state.playerStatus.job;
      
      // Check for job level up
      const experienceNeeded = jobExperienceNeededForLevel(currentJobLevel);
      if (jobExperience >= experienceNeeded) {
        jobExperience -= experienceNeeded;
        currentJobLevel += 1;
        
        // Update job title and pay based on new level
        updatedJob = {
          ...state.playerStatus.job,
          level: currentJobLevel,
          title: state.playerStatus.job.baseTitle || state.playerStatus.job.title,
          payPerClick: calculatePayForLevel(state.playerStatus.job.basePayPerClick, currentJobLevel)
        };
        
        // Update job title based on level and category
        if (state.playerStatus.job.category) {
          updatedJob.title = getJobTitleForLevel(state.playerStatus.job.category, currentJobLevel);
        }
      }
      
      return {
        ...state,
        playerStatus: {
          ...state.playerStatus,
          job: updatedJob,
          jobExperience: jobExperience
        }
      };
    }
    
    case 'BUY_ASSET': {
      if (state.money < action.payload.cost) {
        return state;
      }
      
      return {
        ...state,
        money: state.money - action.payload.cost,
        assets: [...state.assets, action.payload],
        experience: state.experience + 5, // Bonus XP for buying assets
      };
    }
    
    case 'BUY_HOUSING': {
      if (state.money < action.payload.cost) {
        return state;
      }
      
      return {
        ...state,
        money: state.money - action.payload.cost,
        playerStatus: {
          ...state.playerStatus,
          housing: action.payload,
        },
        experience: state.experience + 10, // Bonus XP for upgrading housing
      };
    }
    
    case 'BUY_TRANSPORTATION': {
      if (state.money < action.payload.cost) {
        return state;
      }
      
      return {
        ...state,
        money: state.money - action.payload.cost,
        playerStatus: {
          ...state.playerStatus,
          transportation: action.payload,
        },
        experience: state.experience + 10, // Bonus XP for upgrading transportation
      };
    }
    
    case 'START_BUSINESS': {
      if (state.money < action.payload.cost) {
        return state;
      }
      
      return {
        ...state,
        money: state.money - action.payload.cost,
        playerStatus: {
          ...state.playerStatus,
          business: action.payload,
        },
        experience: state.experience + 20, // Bonus XP for starting a business
      };
    }
    
    case 'UPGRADE_BUSINESS': {
      const { business, upgrade } = action.payload;
      
      if (state.money < upgrade.cost) {
        return state;
      }
      
      const updatedBusiness = {
        ...business,
        income: business.income + upgrade.incomeBoost,
        level: business.level + 1,
      };
      
      return {
        ...state,
        money: state.money - upgrade.cost,
        playerStatus: {
          ...state.playerStatus,
          business: updatedBusiness,
        },
        experience: state.experience + 15, // Bonus XP for upgrading business
      };
    }
    
    case 'START_EDUCATION': {
      const education = action.payload;
      
      if (state.money < education.cost) {
        return state;
      }
      
      // Calculate education duration based on skill level
      // Higher levels take longer
      let durationMultiplier = 1;
      if (state.skills[education.skill]) {
        // Each level adds 20% to education time
        durationMultiplier = 1 + (state.skills[education.skill] * 0.2);
      }
      
      // Base duration is 60 seconds (60000 ms)
      const educationDuration = 60000 * durationMultiplier;
      
      // Set multiplier based on background (if any)
      let skillMultiplier = 1; // Default for first generation
      if (state.playerStatus.background) {
        skillMultiplier = state.playerStatus.background === 'rich' 
          ? education.skillMultiplier.rich 
          : education.skillMultiplier.poor;
      }
      
      return {
        ...state,
        money: state.money - education.cost,
        currentEducation: {
          ...education,
          startTime: Date.now(),
          duration: educationDuration, // Now directly in milliseconds
          multiplier: skillMultiplier,
        },
        educationProgress: 0,
      };
    }
    
    case 'UPDATE_EDUCATION_PROGRESS': {
      if (!state.currentEducation) {
        return state;
      }
      
      const now = Date.now();
      const elapsed = now - state.currentEducation.startTime;
      const progress = Math.min(1, elapsed / state.currentEducation.duration);
      
      // Education complete
      if (progress >= 1) {
        // Calculate skill gain
        const skillGain = state.currentEducation.value * state.currentEducation.multiplier;
        
        // Current skill level
        const currentSkillLevel = state.skills[state.currentEducation.skill] || 0;
        
        return {
          ...state,
          skills: {
            ...state.skills,
            [state.currentEducation.skill]: currentSkillLevel + skillGain,
          },
          currentEducation: null,
          educationProgress: 0,
          experience: state.experience + 5, // Bonus XP for completing education
        };
      }
      
      return {
        ...state,
        educationProgress: progress,
      };
    }
    
    case 'GAIN_SKILL': {
      const { skill, amount } = action.payload;
      const currentLevel = state.skills[skill] || 0;
      
      return {
        ...state,
        skills: {
          ...state.skills,
          [skill]: currentLevel + amount,
        }
      };
    }
    
    case 'SHOW_WORK_EVENT_NOTIFICATION': {
      return {
        ...state,
        workEvents: {
          ...state.workEvents,
          notificationVisible: true
        }
      };
    }
    
    case 'HIDE_WORK_EVENT_NOTIFICATION': {
      return {
        ...state,
        workEvents: {
          ...state.workEvents,
          notificationVisible: false
        }
      };
    }
    
    case 'HANDLE_WORK_EVENT_CHOICE': {
      if (!state.workEvents.pendingEvent) return state;
      
      const { choiceIndex } = action.payload;
      const event = state.workEvents.pendingEvent;
      const choice = event.choices[choiceIndex];
      
      if (!choice || !choice.outcome) return state;
      
      // Apply the outcome
      const outcome = choice.outcome;
      const skillName = outcome.skill;
      const skillGain = outcome.gain;
      
      // Add the skill gain
      return {
        ...state,
        skills: {
          ...state.skills,
          [skillName]: (state.skills[skillName] || 0) + skillGain
        },
        workEvents: {
          ...state.workEvents,
          pendingEvent: null,
          notificationVisible: false
        }
      };
    }
    
    case 'DISMISS_WORK_EVENT': {
      return {
        ...state,
        workEvents: {
          ...state.workEvents,
          pendingEvent: null,
          notificationVisible: false
        }
      };
    }
    
    case 'APPLY_FOR_PROMOTION': {
      const { job } = action.payload;
      const currentJob = state.playerStatus.job;
      
      // Make sure the player has a job and is ready for promotion
      if (!currentJob || !currentJob.readyForPromotion) {
        return state;
      }
      
      // Ensure the new job is actually a promotion (same category, higher level)
      if (job.category !== currentJob.category || job.level <= currentJob.level) {
        return state;
      }
      
      // Apply the promotion
      return {
        ...state,
        playerStatus: {
          ...state.playerStatus,
          job: {
            ...job,
            level: currentJob.level + 1, // Increment level by 1 for the promotion
            basePayPerClick: job.payPerClick,
            payPerClick: job.payPerClick, // Use the new job's pay
            baseTitle: job.title, // Store the base title
            readyForPromotion: false
          }
        }
      };
    }
    
    case 'SELECT_TRANSPORTATION': {
      return {
        ...state,
        playerStatus: {
          ...state.playerStatus,
          transportation: action.payload
        }
      };
    }
    
    case 'UPDATE_MONEY':
      return {
        ...state,
        money: Math.max(0, state.money + action.payload)
      };
    
    case 'LOAD_GAME': {
      return {
        ...state,
        ...action.payload
      };
    }
    
    case 'RESET_GAME': {
      return {
        ...initialState
      };
    }
    
    case 'CALCULATE_OFFLINE_PROGRESS': {
      const now = Date.now();
      
      // Calculate time passed while offline
      const offlineRealTime = now - state.timeSettings.lastRealTime;
      const offlineGameTime = calculateGameTimePassed(offlineRealTime, state.timeSettings.gameTimeRatio);
      
      // Cap max offline time to prevent excessive gains (e.g., max 24 hours of progress)
      const maxOfflineTimeInMs = 24 * 60 * 60 * 1000; // 24 hours in ms
      const cappedOfflineGameTime = Math.min(offlineGameTime, maxOfflineTimeInMs);
      
      // Calculate income earned during offline time
      const income = calcIncome(state);
      const offlineIncome = income * (cappedOfflineGameTime / 1000); // Convert to seconds
      
      return {
        ...state,
        money: state.money + offlineIncome,
        timeSettings: {
          ...state.timeSettings,
          lastRealTime: now,
          gameTime: state.timeSettings.gameTime + cappedOfflineGameTime,
          totalOfflineTime: state.timeSettings.totalOfflineTime + offlineRealTime
        }
      };
    }
    
    default:
      return state;
  }
}

// Create the context
const GameContext = createContext();

// Context provider component
export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const { currentUser, authInitialized } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showOfflineProgress, setShowOfflineProgress] = useState(false);
  const [offlineData, setOfflineData] = useState({ 
    offlineTime: 0, 
    offlineEarnings: 0 
  });

  // Load game state when user logs in
  useEffect(() => {
    async function loadSavedGameState() {
      try {
        if (currentUser && authInitialized) {
          console.log("Loading saved game state for user:", currentUser.uid);
          setIsLoading(true);
          const savedState = await SaveDataService.loadGameState(currentUser.uid);
          if (savedState) {
            // If saved state exists, load it
            console.log("Saved state found, loading into game state");
            dispatch({ type: 'LOAD_GAME', payload: savedState });
            
            // Get current time and last time user was playing
            const now = Date.now();
            const lastRealTime = savedState.timeSettings?.lastRealTime || now;
            const offlineTime = now - lastRealTime;
            
            // If significant time has passed (more than 1 minute)
            if (offlineTime > 60000) {
              // Calculate offline progress and prepare to show the modal
              const oldMoney = savedState.money;
              
              // Calculate offline progress
              dispatch({ type: 'CALCULATE_OFFLINE_PROGRESS' });
              
              // Wait for state update to complete
              setTimeout(() => {
                // Calculate how much money was earned offline
                const offlineEarnings = state.money - oldMoney;
                
                // Only show modal if player earned something
                if (offlineEarnings > 0) {
                  setOfflineData({
                    offlineTime,
                    offlineEarnings
                  });
                  setShowOfflineProgress(true);
                }
              }, 100);
            }
          } else {
            console.log("No saved state found, using initial state");
            // Initialize player state for new users
            dispatch({ type: 'INIT_PLAYER' });
          }
          setIsLoading(false);
        } else if (authInitialized && !currentUser) {
          console.log("No user logged in, using default state");
          // Reset to initial state if no user is logged in
          dispatch({ type: 'RESET_GAME' });
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Error loading game state:", err);
        setError(err.message);
        setIsLoading(false);
      }
    }

    loadSavedGameState();
  }, [currentUser, authInitialized]);

  // Auto-save game state periodically
  useEffect(() => {
    if (!currentUser || isLoading || !authInitialized) return;

    console.log("Setting up auto-save interval");
    const saveInterval = setInterval(async () => {
      try {
        console.log("Auto-saving game state...");
        await SaveDataService.autoSaveGameState(currentUser.uid, state);
        console.log("Auto-save completed");
      } catch (err) {
        console.error("Error during auto-save:", err);
      }
    }, 60000); // Auto-save every minute

    return () => {
      console.log("Clearing auto-save interval");
      clearInterval(saveInterval);
    };
  }, [currentUser, state, isLoading, authInitialized]);

  // Manual save function
  const saveGame = async () => {
    if (!currentUser) {
      console.warn("Attempting to save game without user authentication");
      return false;
    }
    
    try {
      const result = await SaveDataService.saveGameState(currentUser.uid, state);
      return result;
    } catch (err) {
      console.error("Error saving game state:", err);
      setError("Failed to save game: " + err.message);
      return false;
    }
  };

  // Reset game state (start new game)
  const resetGame = async () => {
    try {
      if (currentUser) {
        await SaveDataService.deleteSaveData(currentUser.uid);
      }
      dispatch({ type: 'RESET_GAME' });
      // Re-initialize player after reset
      dispatch({ type: 'INIT_PLAYER' });
      return true;
    } catch (err) {
      console.error("Error resetting game:", err);
      setError("Failed to reset game: " + err.message);
      return false;
    }
  };

  // Update money function
  const updateMoney = (amount) => {
    dispatch({ type: 'UPDATE_MONEY', payload: amount });
  };

  // Passive income generator - just check once per second
  useEffect(() => {
    if (isLoading) return;
    
    const intervalId = setInterval(() => {
      dispatch({ type: 'UPDATE_INCOME' });
    }, 1000);
    
    return () => clearInterval(intervalId);
  }, [isLoading]);
  
  // Initialize player background on first render if not already set
  useEffect(() => {
    if (!isLoading && (!state.playerStatus.background || Object.keys(state.skills).length === 0)) {
      console.log("Initializing player background and skills");
      dispatch({ type: 'INIT_PLAYER' });
    }
  }, [isLoading, state.playerStatus.background, state.skills]);
  
  // If there's an error, show it in the UI
  if (error) {
    return (
      <div className="game-error-container p-6 bg-red-100 text-red-800 rounded-lg m-4">
        <h3 className="text-lg font-bold mb-2">Game Error</h3>
        <p>{error}</p>
        <button 
          onClick={() => setError(null)}
          className="mt-4 bg-red-600 text-white px-4 py-2 rounded"
        >
          Dismiss Error
        </button>
      </div>
    );
  }
  
  // Show loading indicator
  if (isLoading) {
    return (
      <div className="game-loading-container p-6 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-lg">Loading Game Data...</p>
      </div>
    );
  }
  
  // Game time functions
  const getGameTime = () => {
    return formatGameTime(getCurrentGameTime(state));
  };
  
  // Function to close the offline progress modal
  const handleCloseOfflineProgress = () => {
    setShowOfflineProgress(false);
  };
  
  // Import and use the offline progress modal
  const OfflineProgressModal = React.lazy(() => import('../components/OfflineProgressModal'));
  
  return (
    <GameContext.Provider 
      value={{ 
        gameState: state, 
        gameDispatch: dispatch,
        jobExperienceNeededForLevel, 
        getJobTitleForLevel,
        updateMoney,
        saveGame,
        resetGame,
        isLoading,
        getGameTime,
      }}
    >
      {children}
      
      {showOfflineProgress && (
        <React.Suspense fallback={<div>Loading...</div>}>
          <OfflineProgressModal 
            offlineEarnings={offlineData.offlineEarnings}
            offlineTime={offlineData.offlineTime}
            onClose={handleCloseOfflineProgress}
          />
        </React.Suspense>
      )}
    </GameContext.Provider>
  );
}

// Custom hook to use the game context
export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
} 