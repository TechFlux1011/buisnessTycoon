// Stock market data with fake companies based on real-world counterparts

// Market sectors
export const marketSectors = [
  { id: 'tech', name: 'Technology', description: 'Tech companies focusing on software, hardware and digital services.' },
  { id: 'retail', name: 'Retail', description: 'Companies selling products directly to consumers.' },
  { id: 'finance', name: 'Finance', description: 'Banks, payment processors and financial services.' },
  { id: 'auto', name: 'Automotive', description: 'Car manufacturers and automotive technology companies.' },
  { id: 'media', name: 'Media & Entertainment', description: 'Streaming services, social media, and entertainment companies.' },
  { id: 'energy', name: 'Energy', description: 'Traditional and renewable energy companies.' },
  { id: 'health', name: 'Healthcare', description: 'Pharmaceutical and healthcare services.' },
  { id: 'food', name: 'Food & Beverage', description: 'Food and drink manufacturers and chains.' },
  { id: 'telecom', name: 'Telecommunications', description: 'Internet service providers and telecommunications companies.' },
  { id: 'aerospace', name: 'Aerospace', description: 'Aviation and space exploration companies.' },
];

// Stock price volatility factors - refined to match real-world behavior
export const volatilityFactors = {
  MARKET_SENTIMENT: { min: -0.008, max: 0.008 },  // Overall market movement - more conservative
  NEWS_EVENTS: { min: -0.05, max: 0.05 },        // Random major events - slightly reduced
  EARNINGS_IMPACT: { min: -0.10, max: 0.08 },    // Quarterly results - asymmetric impact (missing hurts more than beating helps)
  PLAYER_ACTIONS: { min: -0.02, max: 0.02 },     // Player's game actions
  SECTOR_TRENDS: {                              // Sector-specific trends - adjusted to realistic levels
    tech: { min: -0.015, max: 0.018 },          // Tech tends to be more volatile with upside bias
    retail: { min: -0.010, max: 0.011 },        // Retail is more moderate
    finance: { min: -0.008, max: 0.009 },        // Finance tends to be more stable
    auto: { min: -0.013, max: 0.014 },          // Auto has moderate volatility
    media: { min: -0.014, max: 0.015 },         // Media has higher volatility
    energy: { min: -0.016, max: 0.013 },        // Energy is volatile with slight downside bias
    health: { min: -0.009, max: 0.011 },        // Healthcare is relatively stable with upside potential
    food: { min: -0.007, max: 0.008 },          // Food is most stable, defensive sector
    telecom: { min: -0.008, max: 0.009 },       // Telecom is relatively stable
    aerospace: { min: -0.018, max: 0.015 },     // Aerospace is volatile
  }
};

// Market news that can affect stock prices
export const marketNewsEvents = [
  { headline: "Fed announces surprise interest rate hike", impact: "negative", sectors: ["finance", "retail"], magnitude: 0.03 },
  { headline: "Breakthrough in quantum computing announced", impact: "positive", sectors: ["tech"], magnitude: 0.04 },
  { headline: "Data privacy scandal rocks social media companies", impact: "negative", sectors: ["tech", "media"], magnitude: 0.05 },
  { headline: "New renewable energy tax credits approved", impact: "positive", sectors: ["energy"], magnitude: 0.03 },
  { headline: "Automotive chip shortage worsens", impact: "negative", sectors: ["auto", "tech"], magnitude: 0.035 },
  { headline: "Streaming services see record subscriber growth", impact: "positive", sectors: ["media"], magnitude: 0.04 },
  { headline: "Healthcare reform bill passes", impact: "mixed", sectors: ["health"], magnitude: 0.025 },
  { headline: "Global supply chain disruptions continue", impact: "negative", sectors: ["retail", "auto", "food"], magnitude: 0.03 },
  { headline: "New AI breakthrough announced", impact: "positive", sectors: ["tech"], magnitude: 0.045 },
  { headline: "Consumer spending reaches all-time high", impact: "positive", sectors: ["retail", "food"], magnitude: 0.025 },
  { headline: "Major cybersecurity breach reported", impact: "negative", sectors: ["tech", "finance"], magnitude: 0.04 },
  { headline: "Space tourism takes off", impact: "positive", sectors: ["aerospace"], magnitude: 0.055 },
  { headline: "Fast food workers announce nationwide strike", impact: "negative", sectors: ["food"], magnitude: 0.025 },
  { headline: "Mobile payment usage skyrockets", impact: "positive", sectors: ["finance", "tech"], magnitude: 0.03 },
  { headline: "Self-driving car achieves safety milestone", impact: "positive", sectors: ["auto", "tech"], magnitude: 0.035 },
  { headline: "Streaming price wars intensify", impact: "mixed", sectors: ["media"], magnitude: 0.02 },
  { headline: "Generic drug approvals accelerate", impact: "negative", sectors: ["health"], magnitude: 0.025 },
  { headline: "5G rollout exceeds expectations", impact: "positive", sectors: ["telecom", "tech"], magnitude: 0.03 },
  { headline: "Oil reserves discovery announced", impact: "positive", sectors: ["energy"], magnitude: 0.035 },
  { headline: "Record inflation reported", impact: "negative", sectors: ["retail", "food", "finance"], magnitude: 0.035 },
];

// Stock market companies data - updated with realistic financial metrics
export const companies = [
  // TECH SECTOR
  {
    id: 'MSOFT',
    name: 'MicroWeave',
    fullName: 'MicroWeave Technologies, Inc.',
    sector: 'tech',
    basePrice: 337.50,
    volatility: 0.012,
    description: 'Leading software company known for office productivity tools and operating systems.',
    logo: '🪟',
    marketCap: 2507000000000,
    totalShares: 7428400000,
    pe: 35.8,
    revenue: 211900000000,
    dividendYield: 0.73,
    beta: 0.94,
    events: {
      earnings: { day: 25, month: [1, 4, 7, 10] }, // Quarterly earnings on the 25th
      dividend: { day: 10, month: [2, 5, 8, 11], amount: 0.62 } // Quarterly dividend on the 10th
    },
    news: [
      { headline: "MicroWeave announces new cloud partnership", impact: 0.018, probability: 0.05 },
      { headline: "MicroWeave OS security flaw discovered", impact: -0.025, probability: 0.03 },
      { headline: "MicroWeave acquires AI startup", impact: 0.022, probability: 0.04 }
    ]
  },
  {
    id: 'APLE',
    name: 'Pear',
    fullName: 'Pear Inc.',
    sector: 'tech',
    basePrice: 182.85,
    volatility: 0.014,
    description: 'Consumer electronics, software and services company with a dedicated following.',
    logo: '🍐',
    marketCap: 2876000000000,
    totalShares: 15729000000,
    pe: 30.2,
    revenue: 383300000000,
    dividendYield: 0.52,
    beta: 1.15,
    events: {
      earnings: { day: 15, month: [2, 5, 8, 11] },
      dividend: { day: 5, month: [2, 5, 8, 11], amount: 0.24 }
    },
    news: [
      { headline: "Pear unveils next-gen smartphone", impact: 0.032, probability: 0.05 },
      { headline: "Pear production delays reported", impact: -0.028, probability: 0.03 },
      { headline: "Pear services growth exceeds expectations", impact: 0.024, probability: 0.04 }
    ]
  },
  {
    id: 'GOOG',
    name: 'Boogle',
    fullName: 'Boogle LLC',
    sector: 'tech',
    basePrice: 143.65,
    volatility: 0.013,
    description: 'Search engine and digital advertising giant with diverse technology interests.',
    logo: '🔍',
    marketCap: 1832000000000,
    totalShares: 12754000000,
    pe: 26.3,
    revenue: 282800000000,
    dividendYield: 0,
    beta: 1.08,
    events: {
      earnings: { day: 20, month: [1, 4, 7, 10] },
      dividend: null
    },
    news: [
      { headline: "Boogle facing new antitrust lawsuit", impact: -0.031, probability: 0.035 },
      { headline: "Boogle AI assistant capabilities expanded", impact: 0.027, probability: 0.04 },
      { headline: "Boogle ad revenue hits record high", impact: 0.024, probability: 0.045 }
    ]
  },
  {
    id: 'AMZN',
    name: 'Jungle',
    fullName: 'Jungle Marketplace, Inc.',
    sector: 'retail',
    basePrice: 128.75,
    volatility: 0.016,
    description: 'E-commerce and cloud computing giant with expanding interests in various industries.',
    logo: '📦',
    marketCap: 1324000000000,
    totalShares: 10284000000,
    pe: 59.5,
    revenue: 513900000000,
    dividendYield: 0,
    beta: 1.22,
    events: {
      earnings: { day: 28, month: [1, 4, 7, 10] },
      dividend: null
    },
    news: [
      { headline: "Jungle opens new fulfillment centers", impact: 0.021, probability: 0.04 },
      { headline: "Jungle cloud division reports record growth", impact: 0.032, probability: 0.05 },
      { headline: "Jungle workers plan strike at multiple locations", impact: -0.027, probability: 0.03 }
    ]
  },
  {
    id: 'MTBK',
    name: 'FaceScroll',
    fullName: 'MetaBook, Inc.',
    sector: 'media',
    basePrice: 312.75,
    volatility: 0.018,
    description: 'Social media conglomerate focusing on virtual reality and connectivity.',
    logo: '👥',
    marketCap: 807000000000,
    totalShares: 2581000000,
    pe: 28.1,
    revenue: 134900000000,
    dividendYield: 0,
    beta: 1.35,
    events: {
      earnings: { day: 22, month: [1, 4, 7, 10] },
      dividend: null
    },
    news: [
      { headline: "FaceScroll faces new privacy regulations", impact: -0.024, probability: 0.04 },
      { headline: "FaceScroll virtual reality sales surge", impact: 0.031, probability: 0.035 },
      { headline: "FaceScroll user growth stagnates", impact: -0.022, probability: 0.03 }
    ]
  },
  {
    id: 'NFLX',
    name: 'Webflix',
    fullName: 'Webflix Streaming Services, Inc.',
    sector: 'media',
    basePrice: 417.25,
    volatility: 0.019,
    description: 'Streaming entertainment service with global reach and original content production.',
    logo: '🎬',
    marketCap: 185500000000,
    totalShares: 444600000,
    pe: 44.8,
    revenue: 33700000000,
    dividendYield: 0,
    beta: 1.27,
    events: {
      earnings: { day: 18, month: [1, 4, 7, 10] },
      dividend: null
    },
    news: [
      { headline: "Webflix subscriber numbers exceed expectations", impact: 0.043, probability: 0.04 },
      { headline: "Webflix raises subscription prices", impact: -0.024, probability: 0.045 },
      { headline: "Webflix original series wins major awards", impact: 0.027, probability: 0.035 }
    ]
  },
  {
    id: 'TSLA',
    name: 'Coil',
    fullName: 'Coil Motors, Inc.',
    sector: 'auto',
    basePrice: 235.45,
    volatility: 0.028,
    description: 'Electric vehicle manufacturer also involved in renewable energy and space exploration.',
    logo: '⚡',
    marketCap: 748600000000,
    totalShares: 3179000000,
    pe: 78.4,
    revenue: 96800000000,
    dividendYield: 0,
    beta: 1.92,
    events: {
      earnings: { day: 26, month: [1, 4, 7, 10] },
      dividend: null
    },
    news: [
      { headline: "Coil announces revolutionary new battery technology", impact: 0.052, probability: 0.03 },
      { headline: "Coil production misses targets", impact: -0.046, probability: 0.04 },
      { headline: "Coil expands charging network globally", impact: 0.038, probability: 0.035 }
    ]
  },
  {
    id: 'VZN',
    name: 'Horizon',
    fullName: 'Horizon Communications',
    sector: 'telecom',
    basePrice: 41.30,
    volatility: 0.012,
    description: 'Telecommunications company providing cellular, broadband and digital services.',
    logo: '📡',
    marketCap: 173500000000,
    totalShares: 4200970000,
    events: {
      earnings: { day: 19, month: [1, 4, 7, 10] },
      dividend: { day: 15, month: [2, 5, 8, 11], amount: 0.65 }
    },
    news: [
      { headline: "Horizon completes largest 5G rollout to date", impact: 0.031, probability: 0.04 },
      { headline: "Horizon faces network outage in major markets", impact: -0.028, probability: 0.025 },
      { headline: "Horizon to acquire regional fiber provider", impact: 0.024, probability: 0.03 }
    ]
  },
  {
    id: 'PFE',
    name: 'Fizor',
    fullName: 'Fizor Pharmaceuticals',
    sector: 'health',
    basePrice: 36.85,
    volatility: 0.014,
    description: 'Global pharmaceutical corporation developing vaccines and medications.',
    logo: '💊',
    marketCap: 207500000000,
    totalShares: 5631206000,
    events: {
      earnings: { day: 15, month: [2, 5, 8, 11] },
      dividend: { day: 10, month: [3, 6, 9, 12], amount: 0.40 }
    },
    news: [
      { headline: "Fizor drug receives FDA approval", impact: 0.055, probability: 0.035 },
      { headline: "Fizor recalls treatment after safety concerns", impact: -0.048, probability: 0.02 },
      { headline: "Fizor vaccine shows promising trial results", impact: 0.043, probability: 0.03 }
    ]
  },
  {
    id: 'XOM',
    name: 'PetroCorp',
    fullName: 'PetroCorp Energy',
    sector: 'energy',
    basePrice: 106.40,
    volatility: 0.017,
    description: 'Multinational oil and gas corporation with exploration, production and distribution operations.',
    logo: '⛽',
    marketCap: 432600000000,
    totalShares: 4067670000,
    events: {
      earnings: { day: 28, month: [1, 4, 7, 10] },
      dividend: { day: 10, month: [3, 6, 9, 12], amount: 0.91 }
    },
    news: [
      { headline: "PetroCorp discovers major new oil reserves", impact: 0.042, probability: 0.03 },
      { headline: "PetroCorp faces new environmental regulations", impact: -0.035, probability: 0.045 },
      { headline: "PetroCorp expands renewable energy division", impact: 0.028, probability: 0.035 }
    ]
  },
  {
    id: 'DIS',
    name: 'Kingsley',
    fullName: 'Kingsley Entertainment',
    sector: 'media',
    basePrice: 90.15,
    volatility: 0.018,
    description: 'Entertainment conglomerate operating theme parks, movie studios, and streaming services.',
    logo: '🏰',
    marketCap: 164800000000,
    totalShares: 1828841000,
    events: {
      earnings: { day: 10, month: [2, 5, 8, 11] },
      dividend: { day: 20, month: [1, 4, 7, 10], amount: 0.30 }
    },
    news: [
      { headline: "Kingsley+ streaming subscribers surge", impact: 0.046, probability: 0.04 },
      { headline: "Kingsley announces new theme park expansion", impact: 0.035, probability: 0.035 },
      { headline: "Kingsley movie underperforms at box office", impact: -0.032, probability: 0.03 }
    ]
  },
  {
    id: 'SBUX',
    name: 'MoonDollars',
    fullName: 'MoonDollars Coffee Co.',
    sector: 'food',
    basePrice: 98.70,
    volatility: 0.016,
    description: 'Global coffee chain with locations in hundreds of countries.',
    logo: '☕',
    marketCap: 113100000000,
    totalShares: 1146000000,
    events: {
      earnings: { day: 5, month: [2, 5, 8, 11] },
      dividend: { day: 25, month: [2, 5, 8, 11], amount: 0.53 }
    },
    news: [
      { headline: "MoonDollars launches innovative new beverage line", impact: 0.038, probability: 0.045 },
      { headline: "MoonDollars same-store sales decline", impact: -0.033, probability: 0.03 },
      { headline: "MoonDollars accelerates global expansion", impact: 0.036, probability: 0.035 }
    ]
  },
  {
    id: 'PYPL',
    name: 'BuddyPay',
    fullName: 'BuddyPay Holdings',
    sector: 'finance',
    basePrice: 63.80,
    volatility: 0.019,
    description: 'Digital payment platform enabling online money transfers and purchases.',
    logo: '💸',
    marketCap: 71100000000,
    totalShares: 1114420000,
    events: {
      earnings: { day: 12, month: [2, 5, 8, 11] },
      dividend: null
    },
    news: [
      { headline: "BuddyPay expands cryptocurrency support", impact: 0.048, probability: 0.035 },
      { headline: "BuddyPay transaction volume hits record high", impact: 0.043, probability: 0.04 },
      { headline: "BuddyPay faces new regulatory scrutiny", impact: -0.037, probability: 0.03 }
    ]
  },
  {
    id: 'NKE',
    name: 'Swoosh',
    fullName: 'Swoosh Athletics',
    sector: 'retail',
    basePrice: 102.50,
    volatility: 0.015,
    description: 'Athletic footwear and apparel multinational with iconic branding.',
    logo: '👟',
    marketCap: 157900000000,
    totalShares: 1540480000,
    events: {
      earnings: { day: 28, month: [3, 6, 9, 12] },
      dividend: { day: 15, month: [1, 4, 7, 10], amount: 0.34 }
    },
    news: [
      { headline: "Swoosh signs record-breaking athlete endorsement", impact: 0.041, probability: 0.03 },
      { headline: "Swoosh factory workers strike in Southeast Asia", impact: -0.035, probability: 0.025 },
      { headline: "Swoosh direct-to-consumer sales surge", impact: 0.039, probability: 0.04 }
    ]
  },
  {
    id: 'SONO',
    name: 'AudioWave',
    fullName: 'AudioWave Sound Systems',
    sector: 'tech',
    basePrice: 15.40,
    volatility: 0.022,
    description: 'Premium audio equipment manufacturer specializing in wireless speaker systems.',
    logo: '🔊',
    marketCap: 1970000000,
    totalShares: 127920000,
    events: {
      earnings: { day: 8, month: [2, 5, 8, 11] },
      dividend: null
    },
    news: [
      { headline: "AudioWave releases revolutionary new speaker technology", impact: 0.058, probability: 0.03 },
      { headline: "AudioWave faces component shortage", impact: -0.042, probability: 0.035 },
      { headline: "AudioWave partners with major streaming services", impact: 0.045, probability: 0.03 }
    ]
  },
  {
    id: 'CRPT',
    name: 'CoinDash',
    fullName: 'CoinDash Crypto Exchange',
    sector: 'finance',
    basePrice: 128.65,
    volatility: 0.045,
    description: 'Leading cryptocurrency exchange platform and blockchain technology company.',
    logo: '🪙',
    marketCap: 24200000000,
    totalShares: 188110000,
    events: {
      earnings: { day: 20, month: [2, 5, 8, 11] },
      dividend: null
    },
    news: [
      { headline: "CoinDash adds support for emerging cryptocurrencies", impact: 0.062, probability: 0.04 },
      { headline: "CoinDash faces security breach", impact: -0.075, probability: 0.02 },
      { headline: "CoinDash expands institutional services", impact: 0.054, probability: 0.035 }
    ]
  },
  {
    id: 'RBLX',
    name: 'BlockWorld',
    fullName: 'BlockWorld Interactive',
    sector: 'tech',
    basePrice: 38.70,
    volatility: 0.028,
    description: 'Online gaming platform allowing users to develop and play games in a virtual universe.',
    logo: '🎮',
    marketCap: 23400000000,
    totalShares: 604650000,
    events: {
      earnings: { day: 15, month: [2, 5, 8, 11] },
      dividend: null
    },
    news: [
      { headline: "BlockWorld daily active users reach all-time high", impact: 0.056, probability: 0.04 },
      { headline: "BlockWorld introduces new developer monetization features", impact: 0.042, probability: 0.035 },
      { headline: "BlockWorld faces increased scrutiny over child safety", impact: -0.047, probability: 0.025 }
    ]
  },
  {
    id: 'DASH',
    name: 'SwiftBite',
    fullName: 'SwiftBite Delivery Services',
    sector: 'food',
    basePrice: 82.90,
    volatility: 0.026,
    description: 'Food delivery platform connecting restaurants with customers via mobile app.',
    logo: '🍔',
    marketCap: 32200000000,
    totalShares: 388420000,
    events: {
      earnings: { day: 10, month: [2, 5, 8, 11] },
      dividend: null
    },
    news: [
      { headline: "SwiftBite expands into grocery delivery", impact: 0.047, probability: 0.035 },
      { headline: "SwiftBite driver protests impact major markets", impact: -0.039, probability: 0.03 },
      { headline: "SwiftBite partners with major restaurant chains", impact: 0.043, probability: 0.04 }
    ]
  },
  {
    id: 'RIVN',
    name: 'FlowEV',
    fullName: 'FlowEV Motors',
    sector: 'auto',
    basePrice: 17.30,
    volatility: 0.032,
    description: 'Electric vehicle startup focused on trucks and SUVs with advanced autonomous features.',
    logo: '🚙',
    marketCap: 16300000000,
    totalShares: 942200000,
    events: {
      earnings: { day: 10, month: [3, 6, 9, 12] },
      dividend: null
    },
    news: [
      { headline: "FlowEV production capacity doubles with new factory", impact: 0.065, probability: 0.03 },
      { headline: "FlowEV delays vehicle launch", impact: -0.058, probability: 0.035 },
      { headline: "FlowEV secures major fleet order", impact: 0.072, probability: 0.025 }
    ]
  },
  {
    id: 'ABNB',
    name: 'StayCation',
    fullName: 'StayCation Rentals, Inc.',
    sector: 'retail',
    basePrice: 126.80,
    volatility: 0.023,
    description: 'Online marketplace for short and long-term home and experience rentals worldwide.',
    logo: '🏡',
    marketCap: 81500000000,
    totalShares: 642740000,
    events: {
      earnings: { day: 5, month: [2, 5, 8, 11] },
      dividend: null
    },
    news: [
      { headline: "StayCation bookings surge to record levels", impact: 0.054, probability: 0.04 },
      { headline: "StayCation faces new rental regulations in major cities", impact: -0.046, probability: 0.035 },
      { headline: "StayCation introduces innovative new booking features", impact: 0.038, probability: 0.03 }
    ]
  },
  {
    id: 'SPCE',
    name: 'GalaxyTours',
    fullName: 'GalaxyTours Holdings',
    sector: 'aerospace',
    basePrice: 2.70,
    volatility: 0.038,
    description: 'Space tourism company developing spacecraft for commercial suborbital flights.',
    logo: '🚀',
    marketCap: 990000000,
    totalShares: 366670000,
    events: {
      earnings: { day: 22, month: [2, 5, 8, 11] },
      dividend: null
    },
    news: [
      { headline: "GalaxyTours completes successful test flight", impact: 0.085, probability: 0.03 },
      { headline: "GalaxyTours delays commercial launch schedule", impact: -0.074, probability: 0.035 },
      { headline: "GalaxyTours secures major partnership with aerospace giant", impact: 0.068, probability: 0.025 }
    ]
  }
];

// Market indices
export const marketIndices = [
  {
    id: 'BTTC',
    name: 'BizTycoon Composite',
    description: 'Tracks all stocks in the market',
    companies: companies.map(company => company.id),
    baseValue: 12845.63,
    volatility: 0.01,
    logo: '📊'
  },
  {
    id: 'TECH',
    name: 'Technology Index',
    description: 'Tracks technology sector stocks',
    companies: companies.filter(company => company.sector === 'tech').map(company => company.id),
    baseValue: 15720.48,
    volatility: 0.015,
    logo: '💻'
  },
  {
    id: 'RETA',
    name: 'Retail & Consumer',
    description: 'Tracks retail and consumer goods companies',
    companies: companies.filter(company => company.sector === 'retail').map(company => company.id),
    baseValue: 8652.17,
    volatility: 0.012,
    logo: '🛒'
  },
  {
    id: 'FINS',
    name: 'Financial Services',
    description: 'Tracks financial sector companies',
    companies: companies.filter(company => company.sector === 'finance').map(company => company.id),
    baseValue: 5290.36,
    volatility: 0.011,
    logo: '💰'
  },
  {
    id: 'TRNP',
    name: 'Transportation & Auto',
    description: 'Tracks transportation and automotive companies',
    companies: companies.filter(company => company.sector === 'auto').map(company => company.id),
    baseValue: 4387.92,
    volatility: 0.018,
    logo: '🚗'
  }
];

// Helper functions
export const generateRandomPrice = (basePrice, volatility) => {
  const randomFactor = 1 + (Math.random() * 2 - 1) * volatility;
  return basePrice * randomFactor;
};

export const formatCurrency = (value, minimized = false) => {
  if (minimized) {
    if (value >= 1000000000) {
      return `$${(value / 1000000000).toFixed(2)}B`;
    } else if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(2)}K`;
    }
  }
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

// Generate market status message based on overall market performance
export const getMarketStatusMessage = (percentChange) => {
  if (percentChange >= 2) {
    return "Market Surging: Enthusiastic buying pushes stocks to significant gains";
  } else if (percentChange >= 1) {
    return "Market Up: Positive sentiment drives broad market gains";
  } else if (percentChange >= 0.2) {
    return "Market Positive: Modest gains across most sectors";
  } else if (percentChange > -0.2) {
    return "Market Flat: Sideways trading with minimal movement";
  } else if (percentChange > -1) {
    return "Market Dipping: Slight selling pressure across stocks";
  } else if (percentChange > -2) {
    return "Market Down: Broad selling pushes most stocks lower";
  } else {
    return "Market Plunging: Significant selling pressure across all sectors";
  }
};

// Company actions that can affect stock prices
export const companyActions = [
  { action: "Stock Buyback", description: "Company repurchases shares to return value to shareholders", impact: 0.03 },
  { action: "Dividend Increase", description: "Company raises dividend payout to shareholders", impact: 0.025 },
  { action: "Expansion Announcement", description: "Company announces new markets or products", impact: 0.035 },
  { action: "Cost-Cutting", description: "Company implements efficiency measures to reduce expenses", impact: 0.02 },
  { action: "Layoffs", description: "Company reduces workforce to lower costs", impact: -0.015 },
  { action: "Executive Change", description: "Company announces new leadership", impact: 0.01 },
  { action: "Product Recall", description: "Company recalls product due to defects or safety concerns", impact: -0.04 },
  { action: "Missed Earnings", description: "Company reports earnings below expectations", impact: -0.06 },
  { action: "Earnings Beat", description: "Company reports earnings above expectations", impact: 0.05 },
  { action: "Strategic Partnership", description: "Company forms alliance with another business", impact: 0.03 },
  { action: "Acquisition", description: "Company purchases another business", impact: 0.02 },
  { action: "Legal Settlement", description: "Company resolves legal dispute", impact: 0.015 },
  { action: "Data Breach", description: "Company suffers security incident exposing data", impact: -0.05 },
  { action: "New Patent", description: "Company secures intellectual property protection", impact: 0.025 },
  { action: "Research Breakthrough", description: "Company makes significant technological advancement", impact: 0.045 }
];

// Map fictional companies to real-world stock tickers
export const realWorldMappings = {
  // Tech companies
  "APPL": "AAPL", // Apple
  "GOOG": "GOOGL", // Google/Alphabet
  "MCSF": "MSFT", // Microsoft
  "AMZN": "AMZN", // Amazon
  "FCBK": "META", // Facebook/Meta
  "NFLX": "NFLX", // Netflix
  "TSLA": "TSLA", // Tesla
  
  // Financial companies
  "JPMG": "JPM", // JPMorgan Chase
  "BNKA": "BAC", // Bank of America
  "VISA": "V", // Visa
  "MSTR": "MA", // Mastercard
  
  // Consumer goods
  "COCA": "KO", // Coca-Cola
  "PEPS": "PEP", // Pepsi
  "NIKE": "NKE", // Nike
  "SBUX": "SBUX", // Starbucks
  
  // Retail
  "WLMT": "WMT", // Walmart
  "TARG": "TGT", // Target
  "COST": "COST", // Costco
  
  // Industrial and Manufacturing
  "FORD": "F", // Ford
  "GENM": "GM", // General Motors
  "BOEN": "BA", // Boeing
  "CTRP": "CAT", // Caterpillar
  
  // Energy
  "EXON": "XOM", // ExxonMobil
  "CHVR": "CVX", // Chevron
  
  // Healthcare
  "JNSN": "JNJ", // Johnson & Johnson
  "PFIZ": "PFE", // Pfizer
  "MRCK": "MRK", // Merck
  
  // Default fallbacks for any companies without specific mappings
  "default_tech": "QQQ", // Tech sector (NASDAQ ETF)
  "default_finance": "XLF", // Financial sector ETF
  "default_energy": "XLE", // Energy sector ETF
  "default_healthcare": "XLV", // Healthcare sector ETF
  "default_consumer": "XLP", // Consumer staples ETF
  "default_retail": "XRT", // Retail ETF
  "default_industrial": "XLI", // Industrial ETF
  "default": "SPY" // S&P 500 ETF (general market)
};

// Helper function to get the real-world ticker for a company
export const getRealWorldTicker = (companyId, sector) => {
  if (realWorldMappings[companyId]) {
    return realWorldMappings[companyId];
  }
  
  // If no direct mapping, try to use the sector default
  const sectorKey = `default_${sector?.toLowerCase()}`;
  if (realWorldMappings[sectorKey]) {
    return realWorldMappings[sectorKey];
  }
  
  // Fallback to general market
  return realWorldMappings.default;
}; 