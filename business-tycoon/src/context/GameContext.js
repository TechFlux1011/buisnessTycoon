import React, { createContext, useContext, useReducer, useEffect } from 'react';

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

const experienceNeededForLevel = (level) => {
  // Exponential growth formula
  return Math.floor(100 * Math.pow(1.5, level - 1));
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
      
      let newExperience = state.experience + clickXP;
      let newLevel = state.level;
      
      // Check for level up (cap at 100)
      const MAX_LEVEL = 100;
      if (newExperience >= experienceNeededForLevel(state.level) && state.level < MAX_LEVEL) {
        newExperience -= experienceNeededForLevel(state.level);
        newLevel++;
      }
      
      return {
        ...state,
        money: state.money + clickValue, // Add click value
        experience: newExperience,
        level: newLevel,
      };
    }
    
    case 'UPDATE_INCOME': {
      const now = Date.now();
      const income = calcIncome(state);
      
      // Calculate elapsed time in seconds
      const elapsed = (now - state.lastUpdate) / 1000;
      
      // Apply income for elapsed time (only passive income from assets/business)
      const newMoney = state.money + income * elapsed;
      
      // Earn experience based on income
      const incomeXP = income * elapsed * 0.1; // 1 XP per $10 earned
      
      let newExperience = state.experience + incomeXP;
      let newLevel = state.level;
      
      // Check for level up (cap at 100)
      const MAX_LEVEL = 100;
      if (newExperience >= experienceNeededForLevel(state.level) && state.level < MAX_LEVEL) {
        newExperience -= experienceNeededForLevel(state.level);
        newLevel++;
      }
      
      return {
        ...state,
        money: newMoney,
        lastUpdate: now,
        experience: newExperience,
        level: newLevel,
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
      // Ensure job has both payPerClick and hourlyPay properties
      const jobPayload = {
        ...action.payload,
        // Make sure hourlyPay exists if only payPerClick was provided
        hourlyPay: action.payload.hourlyPay || action.payload.payPerClick,
        // Make sure payPerClick exists if only hourlyPay was provided
        payPerClick: action.payload.payPerClick || action.payload.hourlyPay
      };
      
      return {
        ...state,
        playerStatus: {
          ...state.playerStatus,
          job: jobPayload,
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
    
    default:
      return state;
  }
}

// Create the context
const GameContext = createContext();

// Context provider component
export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  
  // Passive income generator - just check once per second
  useEffect(() => {
    const intervalId = setInterval(() => {
      dispatch({ type: 'UPDATE_INCOME' });
    }, 1000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  // Initialize player background on first render
  useEffect(() => {
    if (!state.playerStatus.background || Object.keys(state.skills).length === 0) {
      dispatch({ type: 'INIT_PLAYER' });
    }
  }, [state.playerStatus.background, state.skills]);
  
  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
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