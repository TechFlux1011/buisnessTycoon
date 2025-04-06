// Game data - Jobs, Assets, Businesses, etc.

// Skill categories for jobs
export const skillCategories = {
  management: ['management', 'leadership', 'communication'],
  technical: ['technical', 'education'],
  financial: ['financial', 'business'],
  healthcare: ['healthcare', 'education'],
  legal: ['legal', 'ethics', 'communication'],
  food: ['food', 'creativity', 'communication']
};

// Entry-level job options
export const entryLevelJobs = {
  poor: [
    { id: 'fastfood', title: 'Fast Food Worker', hourlyPay: 15, payPerClick: 15 / 60, category: 'food', description: 'Flipping burgers for minimum wage', requirements: { food: 1 } },
    { id: 'retail', title: 'Retail Associate', hourlyPay: 16.20, payPerClick: 16.20 / 60, category: 'sales', description: 'Helping customers and stocking shelves', requirements: { communication: 1 } },
    { id: 'delivery', title: 'Delivery Driver', hourlyPay: 19.80, payPerClick: 19.80 / 60, category: 'service', description: 'Delivering packages around town', requirements: { management: 1 } },
  ],
  rich: [
    { id: 'intern', title: 'Corporate Intern', hourlyPay: 19.80, payPerClick: 19.80 / 60, category: 'management', description: 'Getting coffee and making copies', requirements: { management: 1 } },
    { id: 'assistant', title: 'Executive Assistant', hourlyPay: 25.20, payPerClick: 25.20 / 60, category: 'management', description: 'Managing schedules and emails', requirements: { communication: 1 } },
    { id: 'sales', title: 'Junior Sales Rep', hourlyPay: 30, payPerClick: 30 / 60, category: 'sales', description: 'Making cold calls and following up leads', requirements: { business: 1 } },
  ]
};

// Mid-level jobs
export const midLevelJobs = [
  { id: 'manager', title: 'Shift Manager', hourlyPay: 40.20, payPerClick: 40.20 / 60, category: 'management', description: 'Managing a team of workers', requirements: { management: 2 } },
  { id: 'technician', title: 'IT Technician', hourlyPay: 45, payPerClick: 45 / 60, category: 'technical', description: 'Troubleshooting tech issues', requirements: { technical: 2 } },
  { id: 'accountant', title: 'Junior Accountant', hourlyPay: 49.80, payPerClick: 49.80 / 60, category: 'financial', description: 'Balancing the books', requirements: { financial: 2 } },
  { id: 'teacher', title: 'Teaching Assistant', hourlyPay: 34.80, payPerClick: 34.80 / 60, category: 'education', description: 'Helping to educate the next generation', requirements: { education: 2 } },
  { id: 'nurse', title: 'Nursing Assistant', hourlyPay: 42.60, payPerClick: 42.60 / 60, category: 'healthcare', description: 'Helping patients in healthcare facilities', requirements: { healthcare: 2 } },
  { id: 'chef', title: 'Line Cook', hourlyPay: 36, payPerClick: 36 / 60, category: 'food', description: 'Preparing meals in a restaurant kitchen', requirements: { food: 2 } },
];

// Senior jobs
export const seniorJobs = [
  { id: 'director', title: 'Department Director', hourlyPay: 109.80, payPerClick: 109.80 / 60, category: 'management', description: 'Leading an entire department', requirements: { management: 4, leadership: 2 } },
  { id: 'developer', title: 'Senior Developer', hourlyPay: 120, payPerClick: 120 / 60, category: 'technical', description: 'Building complex software systems', requirements: { technical: 4, education: 1 } },
  { id: 'financial_advisor', title: 'Financial Advisor', hourlyPay: 100.20, payPerClick: 100.20 / 60, category: 'financial', description: 'Advising clients on financial matters', requirements: { financial: 4, business: 1 } },
  { id: 'physician', title: 'Physician', hourlyPay: 229.80, payPerClick: 229.80 / 60, category: 'healthcare', description: 'Diagnosing and treating patients', requirements: { healthcare: 5, education: 2 } },
  { id: 'lawyer', title: 'Attorney', hourlyPay: 199.80, payPerClick: 199.80 / 60, category: 'legal', description: 'Providing legal counsel', requirements: { legal: 5, communication: 3 } },
  { id: 'stockbroker', title: 'Stock Broker', hourlyPay: 160.20, payPerClick: 160.20 / 60, category: 'financial', description: 'Trading stocks and securities for clients', requirements: { financial: 3, management: 2 } },
  { id: 'product_manager', title: 'Product Manager', hourlyPay: 150, payPerClick: 150 / 60, category: 'management', description: 'Overseeing product development and launches', requirements: { management: 3, technical: 2 } },
  { id: 'executive_chef', title: 'Executive Chef', hourlyPay: 105, payPerClick: 105 / 60, category: 'food', description: 'Running restaurant kitchens and creating menus', requirements: { food: 4, management: 2 } },
];

// Executive jobs (added for late-game)
export const executiveJobs = [
  { id: 'ceo', title: 'CEO', hourlyPay: 499.80, payPerClick: 499.80 / 60, category: 'management', description: 'Chief Executive Officer running an entire company', requirements: { management: 8, leadership: 6, business: 5 } },
  { id: 'cto', title: 'CTO', hourlyPay: 424.80, payPerClick: 424.80 / 60, category: 'technical', description: 'Chief Technology Officer overseeing all tech operations', requirements: { technical: 8, leadership: 4 } },
  { id: 'cfo', title: 'CFO', hourlyPay: 450, payPerClick: 450 / 60, category: 'financial', description: 'Chief Financial Officer managing company finances', requirements: { financial: 8, management: 3 } },
  { id: 'surgeon', title: 'Neurosurgeon', hourlyPay: 649.80, payPerClick: 649.80 / 60, category: 'healthcare', description: 'Performing complex brain surgeries', requirements: { healthcare: 10, education: 6 } },
  { id: 'judge', title: 'Federal Judge', hourlyPay: 400.20, payPerClick: 400.20 / 60, category: 'legal', description: 'Presiding over important federal cases', requirements: { legal: 10, ethics: 5 } },
  { id: 'investment_banker', title: 'Investment Banker', hourlyPay: 529.80, payPerClick: 529.80 / 60, category: 'financial', description: 'Managing high-profile financial transactions and mergers', requirements: { financial: 7, management: 5 } },
  { id: 'tech_entrepreneur', title: 'Tech Entrepreneur', hourlyPay: 450, payPerClick: 450 / 60, category: 'technical', description: 'Founding and leading innovative tech companies', requirements: { technical: 6, leadership: 4, business: 5 } },
  { id: 'hedge_fund_manager', title: 'Hedge Fund Manager', hourlyPay: 850.20, payPerClick: 850.20 / 60, category: 'financial', description: 'Managing a portfolio of high-risk, high-reward investments', requirements: { financial: 8, business: 6 } },
  { id: 'celebrity_chef', title: 'Celebrity Chef', hourlyPay: 300, payPerClick: 300 / 60, category: 'food', description: 'Running multiple restaurants and media enterprises', requirements: { food: 8, communication: 5, business: 4 } },
];

// Company owner jobs (top level of career path)
export const ownerJobs = [
  { id: 'company_chairman', title: 'Company Chairman', hourlyPay: 1999.80, payPerClick: 1999.80 / 60, category: 'management', description: 'Chairman of the Board with controlling interest in multiple corporations', requirements: { management: 10, leadership: 8, business: 7, ethics: 3 } },
  { id: 'tech_mogul', title: 'Tech Mogul', hourlyPay: 2500.20, payPerClick: 2500.20 / 60, category: 'technical', description: 'Owner of multiple technology companies and venture capital funds', requirements: { technical: 10, business: 8, leadership: 6, education: 4 } },
  { id: 'finance_tycoon', title: 'Finance Tycoon', hourlyPay: 3499.80, payPerClick: 3499.80 / 60, category: 'financial', description: 'Controlling shareholder in major financial institutions and investment firms', requirements: { financial: 10, business: 8, ethics: 4, management: 6 } },
  { id: 'hospital_owner', title: 'Healthcare Magnate', hourlyPay: 2500.20, payPerClick: 2500.20 / 60, category: 'healthcare', description: 'Owner of a network of hospitals and medical research facilities', requirements: { healthcare: 12, education: 8, management: 6, ethics: 5 } },
  { id: 'law_firm_founder', title: 'Law Firm Founder', hourlyPay: 3000, payPerClick: 3000 / 60, category: 'legal', description: 'Founding partner of a prestigious international law firm', requirements: { legal: 12, ethics: 8, communication: 6, business: 5 } },
  { id: 'restaurant_mogul', title: 'Restaurant Mogul', hourlyPay: 1999.80, payPerClick: 1999.80 / 60, category: 'food', description: 'Owner of a global restaurant empire and food production companies', requirements: { food: 10, business: 8, creativity: 6, management: 7 } },
];

// Assets that generate passive income
export const assets = [
  { id: 'savings', name: 'Savings Account', cost: 1000, income: 0.05, description: 'A basic savings account that generates small interest', image: '💰' },
  { id: 'bonds', name: 'Government Bonds', cost: 5000, income: 0.5, description: 'Safe government bonds with steady returns', image: '📜' },
  { id: 'stocks', name: 'Stock Portfolio', cost: 10000, income: 2, description: 'Invest in the stock market', image: '📈' },
  { id: 'crypto', name: 'Cryptocurrency', cost: 20000, income: 8, description: 'High risk, high reward digital assets', image: '₿' },
  { id: 'realestate', name: 'Rental Property', cost: 150000, income: 25, description: 'Generate income from tenants', image: '🏢' },
  { id: 'commercial', name: 'Commercial Property', cost: 500000, income: 80, description: 'Prime commercial real estate with long-term leases', image: '🏬' },
  { id: 'reit', name: 'Real Estate Fund', cost: 1000000, income: 150, description: 'A diversified real estate investment trust', image: '🏗️' },
  { id: 'hedge', name: 'Hedge Fund', cost: 5000000, income: 500, description: 'Exclusive high-return investment vehicle', image: '💹' },
  { id: 'venture', name: 'Venture Capital Fund', cost: 10000000, income: 1200, description: 'Invest in promising startups', image: '🚀' },
  { id: 'island', name: 'Private Island', cost: 50000000, income: 5000, description: 'Your own luxury paradise that generates tourism revenue', image: '🏝️' },
];

// Business types that can be purchased
export const businessTypes = [
  {
    id: 'cafe',
    name: 'Coffee Shop',
    baseCost: 50000,
    baseIncome: 15,
    image: '☕',
    description: 'A cozy spot for coffee lovers',
    upgrades: [
      { level: 1, name: 'Better Equipment', cost: 20000, incomeMultiplier: 0.3 },
      { level: 2, name: 'Expanded Menu', cost: 50000, incomeMultiplier: 0.5 },
      { level: 3, name: 'Second Location', cost: 150000, incomeMultiplier: 1.0 },
    ]
  },
  {
    id: 'store',
    name: 'Convenience Store',
    baseCost: 75000,
    baseIncome: 20,
    image: '🏪',
    description: 'A local store selling everyday necessities',
    upgrades: [
      { level: 1, name: 'More Inventory', cost: 30000, incomeMultiplier: 0.4 },
      { level: 2, name: 'Self-Checkout', cost: 70000, incomeMultiplier: 0.6 },
      { level: 3, name: 'Expand to Supermarket', cost: 200000, incomeMultiplier: 1.2 },
    ]
  },
  {
    id: 'tech',
    name: 'Tech Startup',
    baseCost: 200000,
    baseIncome: 40,
    image: '💻',
    description: 'A small company developing innovative software',
    upgrades: [
      { level: 1, name: 'Cloud Infrastructure', cost: 50000, incomeMultiplier: 0.5 },
      { level: 2, name: 'Marketing Campaign', cost: 100000, incomeMultiplier: 0.8 },
      { level: 3, name: 'Venture Capital', cost: 300000, incomeMultiplier: 1.5 },
    ]
  },
  {
    id: 'restaurant',
    name: 'Restaurant',
    baseCost: 250000,
    baseIncome: 50,
    image: '🍽️',
    description: 'A mid-sized restaurant serving delicious food',
    upgrades: [
      { level: 1, name: 'Chef Upgrade', cost: 80000, incomeMultiplier: 0.6 },
      { level: 2, name: 'Expanded Dining', cost: 150000, incomeMultiplier: 0.9 },
      { level: 3, name: 'Franchise License', cost: 400000, incomeMultiplier: 2.0 },
    ]
  },
  {
    id: 'factory',
    name: 'Small Factory',
    baseCost: 1000000,
    baseIncome: 200,
    image: '🏭',
    description: 'A manufacturing facility producing goods',
    upgrades: [
      { level: 1, name: 'Automation', cost: 250000, incomeMultiplier: 0.7 },
      { level: 2, name: 'Supply Chain Optimization', cost: 500000, incomeMultiplier: 1.0 },
      { level: 3, name: 'International Expansion', cost: 1500000, incomeMultiplier: 2.5 },
    ]
  },
  // Added more expensive late-game businesses
  {
    id: 'airline',
    name: 'Regional Airline',
    baseCost: 5000000,
    baseIncome: 800,
    image: '✈️',
    description: 'A small airline operating regional flights',
    upgrades: [
      { level: 1, name: 'Fleet Expansion', cost: 1000000, incomeMultiplier: 0.8 },
      { level: 2, name: 'International Routes', cost: 3000000, incomeMultiplier: 1.2 },
      { level: 3, name: 'Premium Service', cost: 8000000, incomeMultiplier: 2.0 },
    ]
  },
  {
    id: 'tech_giant',
    name: 'Tech Corporation',
    baseCost: 10000000,
    baseIncome: 1500,
    image: '🖥️',
    description: 'A large technology corporation with multiple product lines',
    upgrades: [
      { level: 1, name: 'R&D Department', cost: 2000000, incomeMultiplier: 0.9 },
      { level: 2, name: 'Global Expansion', cost: 5000000, incomeMultiplier: 1.5 },
      { level: 3, name: 'Acquire Competitors', cost: 15000000, incomeMultiplier: 3.0 },
    ]
  },
  {
    id: 'media',
    name: 'Media Conglomerate',
    baseCost: 25000000, 
    baseIncome: 3000,
    image: '📺',
    description: 'A massive media company owning TV networks, film studios, and streaming platforms',
    upgrades: [
      { level: 1, name: 'Streaming Platform', cost: 5000000, incomeMultiplier: 1.0 },
      { level: 2, name: 'Original Content', cost: 10000000, incomeMultiplier: 1.8 },
      { level: 3, name: 'Global Media Empire', cost: 30000000, incomeMultiplier: 3.5 },
    ]
  },
  {
    id: 'space',
    name: 'Aerospace Company',
    baseCost: 50000000,
    baseIncome: 6000,
    image: '🚀',
    description: 'A company developing cutting-edge aerospace technology and space exploration',
    upgrades: [
      { level: 1, name: 'Satellite Network', cost: 10000000, incomeMultiplier: 1.2 },
      { level: 2, name: 'Space Tourism', cost: 25000000, incomeMultiplier: 2.0 },
      { level: 3, name: 'Interplanetary Missions', cost: 60000000, incomeMultiplier: 4.0 },
    ]
  },
];

// Calculate business cost based on player background
export const getBusinessCost = (business, background) => {
  const discount = background === 'poor' ? 0.2 : 0;
  return business.baseCost * (1 - discount);
};

// Calculate business upgrade multiplier based on player background
export const getBusinessUpgradeMultiplier = (baseMultiplier, background) => {
  const bonus = background === 'poor' ? 0.1 : 0;
  return baseMultiplier + bonus;
};

// Educational opportunities
export const educationOptions = [
  {
    id: 'online_course',
    name: 'Online Course',
    cost: 500,
    skill: 'technical',
    value: 1,
    image: '💻',
    description: 'Learn programming or IT skills from the comfort of your home',
    skillMultiplier: { rich: 1.5, poor: 1 }
  },
  {
    id: 'management_seminar',
    name: 'Management Seminar',
    cost: 1000,
    skill: 'management',
    value: 1,
    image: '📊',
    description: 'Learn essential management skills in this intensive seminar',
    skillMultiplier: { rich: 1.5, poor: 1 }
  },
  {
    id: 'financial_workshop',
    name: 'Financial Workshop',
    cost: 800,
    skill: 'financial',
    value: 1,
    image: '💹',
    description: 'Learn about investments, accounting, and financial planning',
    skillMultiplier: { rich: 1.5, poor: 1 }
  },
  {
    id: 'communication_course',
    name: 'Communication Workshop',
    cost: 600,
    skill: 'communication',
    value: 1,
    image: '🗣️',
    description: 'Improve your communication and negotiation skills',
    skillMultiplier: { rich: 1.5, poor: 1 }
  },
  {
    id: 'legal_seminar',
    name: 'Legal Basics Seminar',
    cost: 1200,
    skill: 'legal',
    value: 1,
    image: '⚖️',
    description: 'Learn the fundamentals of business and personal law',
    skillMultiplier: { rich: 1.5, poor: 1 }
  },
  {
    id: 'healthcare_course',
    name: 'Healthcare Fundamentals',
    cost: 1500,
    skill: 'healthcare',
    value: 1,
    image: '🏥',
    description: 'Learn basic healthcare and medical knowledge',
    skillMultiplier: { rich: 1.5, poor: 1 }
  },
  {
    id: 'culinary_workshop',
    name: 'Culinary Workshop',
    cost: 700,
    skill: 'food',
    value: 1,
    image: '🍳',
    description: 'Learn essential cooking techniques and food preparation',
    skillMultiplier: { rich: 1.5, poor: 1 }
  },
  {
    id: 'leadership_retreat',
    name: 'Leadership Retreat',
    cost: 2000,
    skill: 'leadership',
    value: 1,
    image: '👑',
    description: 'Develop your leadership and team-building abilities',
    skillMultiplier: { rich: 1.5, poor: 1 }
  },
  {
    id: 'ethics_course',
    name: 'Ethics Course',
    cost: 900,
    skill: 'ethics',
    value: 1,
    image: '🧠',
    description: 'Learn about business ethics and moral decision making',
    skillMultiplier: { rich: 1.5, poor: 1 }
  },
  {
    id: 'business_101',
    name: 'Business 101',
    cost: 1200,
    skill: 'business',
    value: 1,
    image: '📈',
    description: 'Learn the basics of running a business',
    skillMultiplier: { rich: 1.5, poor: 1 }
  },
  {
    id: 'creativity_workshop',
    name: 'Creativity Workshop',
    cost: 800,
    skill: 'creativity',
    value: 1,
    image: '🎨',
    description: 'Develop your creative thinking and problem-solving skills',
    skillMultiplier: { rich: 1.5, poor: 1 }
  },
  {
    id: 'community_college',
    name: 'Community College',
    cost: 5000,
    skill: 'education',
    value: 2,
    image: '🏫',
    description: 'Get an associate degree or certification in your field of choice',
    skillMultiplier: { rich: 1.5, poor: 1 }
  },
  {
    id: 'university',
    name: 'University',
    cost: 25000,
    skill: 'education',
    value: 4,
    image: '🎓',
    description: 'Obtain a bachelor\'s degree in your field of choice',
    skillMultiplier: { rich: 1.5, poor: 1 }
  },
  {
    id: 'graduate_school',
    name: 'Graduate School',
    cost: 50000,
    skill: 'education',
    value: 5,
    image: '📚',
    description: 'Get an advanced degree for high-level positions',
    skillMultiplier: { rich: 1.5, poor: 1 }
  },
  {
    id: 'executive_mba',
    name: 'Executive MBA',
    cost: 100000,
    skill: 'business',
    value: 5,
    image: '💼',
    description: 'Prestigious business degree for executives',
    skillMultiplier: { rich: 1.5, poor: 1 }
  },
  {
    id: 'medical_school',
    name: 'Medical School',
    cost: 200000,
    skill: 'healthcare',
    value: 8,
    image: '🩺',
    description: 'Comprehensive medical education',
    skillMultiplier: { rich: 1.5, poor: 1 }
  },
  {
    id: 'law_school',
    name: 'Law School',
    cost: 150000,
    skill: 'legal',
    value: 8,
    image: '⚖️',
    description: 'Professional legal education',
    skillMultiplier: { rich: 1.5, poor: 1 }
  },
  {
    id: 'culinary_school',
    name: 'Culinary School',
    cost: 80000,
    skill: 'food',
    value: 7,
    image: '👨‍🍳',
    description: 'Professional culinary education and technique training',
    skillMultiplier: { rich: 1.5, poor: 1 }
  },
  {
    id: 'phd_program',
    name: 'PhD Program',
    cost: 120000,
    skill: 'education',
    value: 8,
    image: '🎓',
    description: 'The highest level of academic achievement',
    skillMultiplier: { rich: 1.5, poor: 1 }
  },
  {
    id: 'leadership_institute',
    name: 'Leadership Institute',
    cost: 90000,
    skill: 'leadership',
    value: 6,
    image: '👔',
    description: 'Elite training for executive leadership positions',
    skillMultiplier: { rich: 1.5, poor: 1 }
  },
];

// Transportation options
export const transportationOptions = [
  { id: 'bicycle', name: 'Bicycle', cost: 200, image: '🚲', description: 'A basic means of transportation - enables auto-clicking at 1 click/sec', clickSpeedMultiplier: 1.0 },
  { id: 'bus_pass', name: 'Bus Pass', cost: 300, image: '🚌', description: 'Monthly public transportation pass - 1.5 clicks/sec', clickSpeedMultiplier: 1.5 },
  { id: 'usedcar_basic', name: 'Basic Used Car', cost: 5000, image: '🚗', description: 'An affordable vehicle - 2 clicks/sec', clickSpeedMultiplier: 2.0 },
  { id: 'usedcar_mid', name: 'Mid-Range Used Car', cost: 15000, image: '🚙', description: 'A reliable used vehicle - 3 clicks/sec', clickSpeedMultiplier: 3.0 },
  { id: 'newcar_economy', name: 'New Economy Car', cost: 30000, image: '🚘', description: 'A brand new basic vehicle - 4 clicks/sec', clickSpeedMultiplier: 4.0 },
  { id: 'newcar_luxury', name: 'New Luxury Car', cost: 80000, image: '🏎️', description: 'A premium new vehicle - 5 clicks/sec', clickSpeedMultiplier: 5.0 },
  { id: 'luxury_car', name: 'High-End Luxury Car', cost: 200000, image: '🏎️', description: 'A statement of your success - 7 clicks/sec', clickSpeedMultiplier: 7.0 },
  { id: 'supercar', name: 'Supercar', cost: 500000, image: '🏎️', description: 'An ultra-high performance vehicle - 10 clicks/sec', clickSpeedMultiplier: 10.0 },
  { id: 'hypercar', name: 'Hypercar', cost: 2000000, image: '🏎️', description: 'The pinnacle of automotive engineering - 15 clicks/sec', clickSpeedMultiplier: 15.0 },
  { id: 'helicopter', name: 'Helicopter', cost: 5000000, image: '🚁', description: 'Beat the traffic with your personal helicopter - 20 clicks/sec', clickSpeedMultiplier: 20.0 },
  { id: 'private_jet', name: 'Private Jet', cost: 20000000, image: '✈️', description: 'Travel anywhere in style and comfort - 30 clicks/sec', clickSpeedMultiplier: 30.0 },
];

// Housing options
export const housingOptions = [
  { id: 'room', name: 'Shared Room', cost: 1000, image: '🛏️', description: 'A room in a shared apartment' },
  { id: 'studio', name: 'Studio Apartment', cost: 5000, image: '🏢', description: 'A small studio apartment' },
  { id: 'apartment', name: 'One-Bedroom Apartment', cost: 15000, image: '🏢', description: 'Your own small apartment' },
  { id: 'condo', name: 'Condominium', cost: 50000, image: '🏙️', description: 'A modern condominium with amenities' },
  { id: 'townhouse', name: 'Townhouse', cost: 150000, image: '🏠', description: 'A modest townhouse' },
  { id: 'house', name: 'Single Family Home', cost: 350000, image: '🏠', description: 'A nice house in the suburbs' },
  { id: 'luxury_condo', name: 'Luxury Condominium', cost: 800000, image: '🏙️', description: 'A high-end condo in a prime location' },
  { id: 'luxury_house', name: 'Luxury Home', cost: 1500000, image: '🏡', description: 'A spacious luxury home' },
  { id: 'mansion', name: 'Mansion', cost: 5000000, image: '🏰', description: 'A luxurious mansion with extensive grounds' },
  { id: 'estate', name: 'Private Estate', cost: 15000000, image: '🏰', description: 'A vast estate with multiple buildings' },
  { id: 'compound', name: 'Luxury Compound', cost: 50000000, image: '🏯', description: 'An exclusive compound with ultimate privacy and security' },
]; 