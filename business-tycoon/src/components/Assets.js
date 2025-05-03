import React, { useState, useRef, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { assets, transportationOptions, housingOptions } from '../data/gameData';
import '../styles/Assets.css';

const Assets = () => {
  const { gameState, gameDispatch: dispatch } = useGame();
  
  // Move all hooks to the top BEFORE any conditional returns
  const [activeTab, setActiveTab] = useState('assets');
  const [descriptionModal, setDescriptionModal] = useState(null);
  const [longPressActive, setLongPressActive] = useState(false);
  const longPressTimer = useRef(null);
  const longPressItem = useRef(null);
  const modalTimeout = useRef(null);
  const [animatingAssets, setAnimatingAssets] = useState({});
  const [pulsatingIcons, setPulsatingIcons] = useState({});
  
  // Add state for housing sorting and filtering
  const [sortOption, setSortOption] = useState('priceAsc');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    minPrice: 0,
    maxPrice: 1000000000,
    minBeds: 0,
    propertyTypes: []
  });
  
  // Clean up any timers when component unmounts
  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
      if (modalTimeout.current) {
        clearTimeout(modalTimeout.current);
      }
    };
  }, []);
  
  // Early return with loading message if gameState or playerStatus is undefined
  if (!gameState || !gameState.playerStatus) {
    return <div className="loading-container">Loading game data...</div>;
  }
  
  // Use gameState instead of state throughout the component
  const state = gameState;
  const { money } = state;
  
  const toggleTab = (tab) => {
    setActiveTab(tab);
  };

  const buyAsset = (asset) => {
    // Check if player already owns this type of asset
    const alreadyOwns = state.assets.some(ownedAsset => ownedAsset.id.split('-')[0] === asset.id);

    // Only proceed with purchase if they don't already own it
    if (!alreadyOwns) {
      dispatch({ 
        type: 'BUY_ASSET', 
        payload: {
          ...asset,
          id: `${asset.id}-${Date.now()}`, // Make each purchased asset unique
          purchasedAt: Date.now(),
        }
      });
    }
  };
  
  const buyHousing = (housing) => {
    dispatch({
      type: 'BUY_HOUSING',
      payload: {
        ...housing,
        purchasedAt: Date.now(),
      }
    });
  };
  
  const buyTransportation = (transportation) => {
    dispatch({
      type: 'BUY_TRANSPORTATION',
      payload: {
        ...transportation,
        purchasedAt: Date.now(),
      }
    });
    
    // After purchase, find and select the transportation with the highest speed multiplier
    setTimeout(() => {
      // Get all transportation options the player owns
      const ownedTransportations = transportationOptions.filter(t => 
        state.playerStatus.transportation && 
        (t.id === state.playerStatus.transportation.id || t.id === transportation.id)
      );
      
      if (ownedTransportations.length > 0) {
        // Sort by clickSpeedMultiplier (descending) and select the best one
        const bestTransportation = [...ownedTransportations].sort(
          (a, b) => b.clickSpeedMultiplier - a.clickSpeedMultiplier
        )[0];
        
        // If the best one isn't already selected, select it
        if (state.playerStatus.transportation.id !== bestTransportation.id) {
          dispatch({
            type: 'SELECT_TRANSPORTATION',
            payload: bestTransportation
          });
        }
      }
    }, 100); // Small delay to ensure the purchase is complete
  };
  
  const showDescription = (item, type) => {
    // Clear any existing timeout
    if (modalTimeout.current) {
      clearTimeout(modalTimeout.current);
      modalTimeout.current = null;
    }
    setDescriptionModal({ item, type });
  };
  
  const closeDescription = () => {
    setDescriptionModal(null);
  };
  
  const startPurchaseAnimation = (id) => {
    setAnimatingAssets({...animatingAssets, [id]: true});
    setTimeout(() => {
      setAnimatingAssets({...animatingAssets, [id]: false});
    }, 700); // Animation duration
  };
  
  const startPulseAnimation = (id) => {
    setPulsatingIcons({...pulsatingIcons, [id]: true});
    setTimeout(() => {
      setPulsatingIcons({...pulsatingIcons, [id]: false});
    }, 700); // Animation duration
  };
  
  const handleButtonClick = (e, action, id = null) => {
    e.stopPropagation(); // Prevent the card's events from firing
    if (id) {
      if (id.includes('bicycle') || id.includes('bus') || id.includes('car') || id.includes('helicopter') || id.includes('jet')) {
        startPulseAnimation(id);
      } else {
        startPurchaseAnimation(id);
      }
      setTimeout(() => {
        action();
      }, 600); // Slight delay to allow animation to finish
    } else {
      action();
    }
  };
  
  const handleTouchStart = (item, type, e) => {
    // For mobile long press
    // Prevent touch events from triggering on buttons inside cards
    if (e.target.tagName === 'BUTTON') {
      return;
    }
    
    longPressItem.current = { item, type };
    longPressTimer.current = setTimeout(() => {
      setLongPressActive(true);
      showDescription(item, type);
    }, 500); // 500ms long press to show info
  };
  
  const handleTouchEnd = (e) => {
    // Clear the timer and reset state
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    
    // Only close the description if it was opened via long press
    if (longPressActive) {
      closeDescription();
      setLongPressActive(false);
    }
    
    // If this was a quick tap (not a long press), and not on a button
    if (!longPressActive && e.target.tagName !== 'BUTTON' && longPressItem.current) {
      // Show the description for the item that was tapped
      showDescription(longPressItem.current.item, longPressItem.current.type);
    }
    
    longPressItem.current = null;
  };
  
  const getAssetIconAndColor = (assetId) => {
    // Return appropriate icon and background color based on asset type
    const assetThemes = {
      'savings': { icon: '💰', color: 'bg-yellow-900' },
      'bonds': { icon: '📜', color: 'bg-amber-900' },
      'stocks': { icon: '📈', color: 'bg-red-900' },
      'crypto': { icon: '₿', color: 'bg-orange-900' },
      'realestate': { icon: '🏢', color: 'bg-indigo-900' },
      'commercial': { icon: '🏬', color: 'bg-blue-900' },
      'reit': { icon: '🏗️', color: 'bg-slate-900' },
      'hedge': { icon: '💹', color: 'bg-green-900' },
      'venture': { icon: '🚀', color: 'bg-purple-900' },
      'island': { icon: '🏝️', color: 'bg-teal-900' },
    };
    
    return assetThemes[assetId] || { icon: '💵', color: 'bg-indigo-900' }; // default
  };
  
  const getHousingIconAndColor = (housingId) => {
    // Return appropriate icon and background color based on housing type
    const housingThemes = {
      'room': { icon: '🛏️', color: 'bg-fuchsia-900' },
      'studio': { icon: '🏠', color: 'bg-teal-900' },
      'apartment': { icon: '🏢', color: 'bg-cyan-900' },
      'condo': { icon: '🏙️', color: 'bg-blue-900' },
      'townhouse': { icon: '🏘️', color: 'bg-emerald-900' },
      'house': { icon: '🏡', color: 'bg-green-900' },
      'luxury_condo': { icon: '⛲', color: 'bg-indigo-900' },
      'luxury_house': { icon: '🏰', color: 'bg-violet-900' },
      'mansion': { icon: '🏛️', color: 'bg-purple-900' },
      'estate': { icon: '🌆', color: 'bg-slate-900' },
      'compound': { icon: '🌃', color: 'bg-zinc-900' },
    };
    
    return housingThemes[housingId] || { icon: '🏠', color: 'bg-teal-900' }; // default
  };
  
  const getTransportationIconAndColor = (transportId) => {
    // Return appropriate icon and background color based on transportation type
    const transportThemes = {
      'bicycle': { icon: '🚲', color: 'bg-teal-900' },
      'bus_pass': { icon: '🚌', color: 'bg-yellow-900' },
      'usedcar_basic': { icon: '🚗', color: 'bg-blue-900' },
      'usedcar_mid': { icon: '🚙', color: 'bg-sky-900' },
      'newcar_economy': { icon: '🚘', color: 'bg-green-900' },
      'newcar_luxury': { icon: '🏎️', color: 'bg-red-900' },
      'luxury_car': { icon: '🚓', color: 'bg-gray-900' },
      'supercar': { icon: '🏎️', color: 'bg-orange-900' },
      'hypercar': { icon: '⚡', color: 'bg-amber-900' },
      'helicopter': { icon: '🚁', color: 'bg-emerald-900' },
      'private_jet': { icon: '✈️', color: 'bg-blue-900' },
    };
    
    return transportThemes[transportId] || { icon: '🚗', color: 'bg-orange-900' }; // default
  };

  // Add witty descriptions for transportation options
  const getWittyTransportDescription = (transportId) => {
    const wittyDescriptions = {
      'bicycle': "Eco-friendly with bonus leg day!",
      'bus_pass': "Public transit without exact change.",
      'usedcar_basic': "Sunday driver special.",
      'usedcar_mid': "Pre-loved but reliable.",
      'newcar_economy': "New car smell included!",
      'newcar_luxury': "Turning heads everywhere.",
      'luxury_car': "Costs more than your first home.",
      'supercar': "Zero to ticket in seconds.",
      'hypercar': "A rocket with cup holders.",
      'helicopter': "Traffic? What traffic?",
      'private_jet': "First class is too public.",
    };
    
    return wittyDescriptions[transportId] || "Stylish A to B transport!";
  };

  // First, let's create a function to get the badge color based on the transportation ID
  const getMultiplierBadgeColors = (transportId) => {
    // Return appropriate background and text colors based on transportation type
    const badgeColors = {
      'bicycle': { bg: 'bg-teal-200', text: 'text-teal-800' },
      'bus_pass': { bg: 'bg-yellow-200', text: 'text-yellow-800' },
      'usedcar_basic': { bg: 'bg-blue-200', text: 'text-blue-800' },
      'usedcar_mid': { bg: 'bg-sky-200', text: 'text-sky-800' },
      'newcar_economy': { bg: 'bg-green-200', text: 'text-green-800' },
      'newcar_luxury': { bg: 'bg-red-200', text: 'text-red-800' },
      'luxury_car': { bg: 'bg-gray-200', text: 'text-gray-800' },
      'supercar': { bg: 'bg-orange-200', text: 'text-orange-800' },
      'hypercar': { bg: 'bg-amber-200', text: 'text-amber-800' },
      'helicopter': { bg: 'bg-emerald-200', text: 'text-emerald-800' },
      'private_jet': { bg: 'bg-blue-200', text: 'text-blue-800' },
    };
    
    return badgeColors[transportId] || { bg: 'bg-orange-200', text: 'text-orange-800' }; // default
  };

  const renderAssets = () => (
    <div className="bg-white rounded-lg p-6 shadow-md">
      <div className="flex items-center justify-between mb-6 border-b border-gray-200 pb-4">
        <div className="flex items-center">
          <span className="text-3xl mr-3">🏦</span>
          <div>
            <h3 className="text-2xl font-bold text-gray-800">Banking</h3>
            <p className="text-gray-500 text-sm">Manage your personal finances</p>
          </div>
        </div>
        <div className="bg-blue-50 px-4 py-2 rounded-lg">
          <p className="text-sm text-gray-600">Available Funds</p>
          <p className="text-xl font-bold text-blue-800">${money.toLocaleString()}</p>
        </div>
      </div>
      
      {/* Accounts Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl p-5 text-white shadow-md">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h4 className="text-sm font-medium opacity-80">CHECKING ACCOUNT</h4>
              <p className="text-2xl font-bold">${money.toLocaleString()}</p>
            </div>
            <span className="text-2xl">💳</span>
          </div>
          <div className="text-sm mb-4 opacity-80">Available for daily transactions</div>
          <div className="mt-auto pt-2 border-t border-white border-opacity-20">
            <p className="text-xs opacity-70">Account Number: **** **** **** {Math.floor(1000 + Math.random() * 9000)}</p>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl p-5 text-white shadow-md">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h4 className="text-sm font-medium opacity-80">SAVINGS ACCOUNT</h4>
              <p className="text-2xl font-bold">
                ${state.assets
                  .filter(asset => asset.id.includes('savings'))
                  .reduce((total, asset) => total + asset.cost, 0)
                  .toLocaleString()}
              </p>
            </div>
            <span className="text-2xl">💰</span>
          </div>
          <div className="text-sm mb-4 opacity-80">
            Earning {state.assets.some(asset => asset.id.includes('savings')) ? '0.5%' : '0%'} APY
          </div>
          <div className="mt-auto pt-2 border-t border-white border-opacity-20">
            <p className="text-xs opacity-70">Grows slowly but steadily</p>
          </div>
        </div>
      </div>
      
      {/* Banking Products */}
      <div className="mb-8">
        <h4 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
          <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mr-2 text-xs">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </span>
          Banking Products
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {assets.filter(asset => asset.id === 'savings').map((asset) => {
            const canAfford = money >= asset.cost;
            const alreadyOwns = state.assets.some(ownedAsset => ownedAsset.id.split('-')[0] === asset.id);
            
            return (
              <div 
                key={asset.id} 
                className={`relative rounded-xl shadow-sm overflow-hidden transition-transform hover:shadow-md hover:scale-102 border ${alreadyOwns ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}
                onClick={() => showDescription(asset, 'asset')}
                onTouchStart={(e) => handleTouchStart(asset, 'asset', e)}
                onTouchEnd={handleTouchEnd}
                onTouchCancel={handleTouchEnd}
              >
                <div className="p-4">
                  <div className="flex items-center mb-3">
                    <div className="w-10 h-10 rounded-full mr-3 flex items-center justify-center bg-blue-100 text-blue-700">
                      <span className="text-xl">💰</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">{asset.name}</h4>
                      <p className="text-xs text-gray-500">Safe, steady returns</p>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-3 mb-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-500">Minimum Deposit</span>
                      <span className="text-sm font-medium text-gray-800">
                        ${asset.cost.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-500">Interest Rate</span>
                      <span className="text-sm font-medium text-green-600">0.5% APY</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Per Second</span>
                      <span className="text-sm font-medium text-blue-600">${asset.income.toFixed(2)}/sec</span>
                    </div>
                  </div>
                  
                  <button 
                    className={`w-full py-2.5 px-4 rounded-lg font-medium transition-colors text-center shadow-sm ${
                      alreadyOwns
                        ? 'bg-green-500 text-white cursor-default'
                        : canAfford 
                          ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                    onClick={(e) => handleButtonClick(e, () => buyAsset(asset), asset.id)}
                    disabled={!canAfford || alreadyOwns}
                  >
                    {alreadyOwns ? 'Account Active' : canAfford ? 'Open Account' : 'Insufficient Funds'}
                  </button>
                </div>
              </div>
            );
          })}
          
          {/* Customizable Debit Card */}
          <div className="relative rounded-xl shadow-sm overflow-hidden transition-transform hover:shadow-md hover:scale-102 border bg-white border-gray-200">
            <div className="p-4">
              <div className="flex items-center mb-3">
                <div className="w-10 h-10 rounded-full mr-3 flex items-center justify-center bg-purple-100 text-purple-700">
                  <span className="text-xl">💳</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">Work Tap Card</h4>
                  <p className="text-xs text-gray-500">Customize your work experience</p>
                </div>
              </div>
              
              <div className="mb-4">
                <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl p-4 shadow-sm mb-3 text-white">
                  <div className="flex justify-between items-start mb-5">
                    <div className="text-xs opacity-80">Business Tycoon Bank</div>
                    <div className="text-lg">💰</div>
                  </div>
                  <div className="mb-5">
                    <div className="inline-block w-10 h-6 bg-gold bg-opacity-50 rounded mr-1"></div>
                    <div className="inline-block w-10 h-6 bg-gold bg-opacity-50 rounded mr-1"></div>
                    <div className="inline-block w-10 h-6 bg-gold bg-opacity-50 rounded mr-1"></div>
                    <div className="inline-block w-10 h-6 bg-gold bg-opacity-50 rounded"></div>
                  </div>
                  <div className="text-xs mb-1 opacity-80">CARD HOLDER</div>
                  <div className="font-medium mb-2">BUSINESS TYCOON</div>
                </div>
                
                <div className="text-sm text-gray-600 mb-3">
                  Your Work Tap Card allows you to earn money faster in the Work tab. Customize it with different designs and bonuses!
                </div>
              </div>
              
              <button 
                className="w-full py-2.5 px-4 rounded-lg font-medium transition-colors text-center shadow-sm bg-purple-600 hover:bg-purple-700 text-white"
                onClick={() => showDescription({
                  id: 'tap_card',
                  name: 'Work Tap Card',
                  description: 'Customize your card to enhance your work experience. Different designs give you different bonuses!',
                  image: '💳'
                }, 'tap_card')}
              >
                Customize Card
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Owned Banking Products */}
      <div className="mt-8">
        <h4 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
          <span className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-green-600 mr-2 text-xs">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </span>
          Your Banking Products
        </h4>
        
        {state.assets.filter(asset => asset.id.includes('savings')).length > 0 ? (
          <div>
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Total Savings</p>
                  <p className="text-xl font-bold text-gray-800">
                    ${state.assets
                        .filter(asset => asset.id.includes('savings'))
                        .reduce((sum, asset) => sum + asset.cost, 0)
                        .toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Interest Income</p>
                  <p className="text-xl font-bold text-green-600">
                    ${state.assets
                        .filter(asset => asset.id.includes('savings'))
                        .reduce((sum, asset) => sum + asset.income, 0)
                        .toFixed(2)}/sec
                  </p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {state.assets.filter(asset => asset.id.includes('savings')).map((asset) => {
                return (
                  <div 
                    key={asset.id} 
                    className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 transition-transform hover:shadow-md hover:scale-102"
                    onClick={() => showDescription(asset, 'asset')}
                    onTouchStart={(e) => handleTouchStart(asset, 'asset', e)}
                    onTouchEnd={handleTouchEnd}
                    onTouchCancel={handleTouchEnd}
                  >
                    <div className="p-4">
                      <div className="flex items-center mb-3">
                        <div className="w-10 h-10 rounded-full mr-3 flex items-center justify-center bg-blue-100 text-blue-700">
                          <span className="text-xl">💰</span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-800">{asset.name}</h4>
                          <p className="text-xs text-green-600">Active Account</p>
                        </div>
                      </div>
                      
                      <div className="rounded-lg p-3 mb-1 bg-gray-50">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500">Balance</span>
                          <span className="text-lg font-semibold text-gray-800">${asset.cost.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500">Interest</span>
                          <span className="text-sm font-semibold text-green-600">${asset.income.toFixed(2)}/sec</span>
                        </div>
                      </div>
                      
                      <div className="text-xs text-gray-500 text-right mt-2">
                        Opened: {new Date(asset.purchasedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg p-6 text-center">
            <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-3 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-gray-600 font-medium">You don't have any banking products yet</p>
            <p className="text-gray-500 text-sm mt-1">Open a savings account to start earning interest</p>
          </div>
        )}
      </div>
    </div>
  );
  
  const renderHousing = () => {
    // Function to get consistent property specs based on housing type
    const getPropertySpecs = (housingId) => {
      // Map housing IDs to consistent bed/bath counts
      const specs = {
        'room': { beds: '1 Room', baths: 'Shared', sqft: '100 sqft' },
        'studio': { beds: 'Studio', baths: '1 Bath', sqft: '350 sqft' },
        'apartment': { beds: '2 Bed', baths: '1 Bath', sqft: '750 sqft' },
        'condo': { beds: '2 Bed', baths: '2 Bath', sqft: '1,200 sqft' },
        'townhouse': { beds: '3 Bed', baths: '2.5 Bath', sqft: '1,800 sqft' },
        'house': { beds: '3 Bed', baths: '2 Bath', sqft: '2,500 sqft' },
        'luxury_condo': { beds: '3 Bed', baths: '3 Bath', sqft: '2,800 sqft' },
        'luxury_house': { beds: '4 Bed', baths: '3.5 Bath', sqft: '4,500 sqft' },
        'mansion': { beds: '5 Bed', baths: '4.5 Bath', sqft: '8,500 sqft' },
        'estate': { beds: '6 Bed', baths: '5.5 Bath', sqft: '12,000 sqft' },
        'compound': { beds: '8 Bed', baths: '8 Bath', sqft: '25,000 sqft' }
      };
      
      return specs[housingId] || { beds: '2 Bed', baths: '2 Bath', sqft: '1,000 sqft' };
    };
    
    // Function to sort housing options based on the current sort option
    const sortHousingOptions = (options) => {
      const sortedOptions = [...options];
      
      switch(sortOption) {
        case 'priceAsc':
          return sortedOptions.sort((a, b) => a.cost - b.cost);
        case 'priceDesc':
          return sortedOptions.sort((a, b) => b.cost - a.cost);
        case 'nameAsc':
          return sortedOptions.sort((a, b) => a.name.localeCompare(b.name));
        case 'nameDesc':
          return sortedOptions.sort((a, b) => b.name.localeCompare(a.name));
        default:
          return sortedOptions;
      }
    };
    
    // Function to filter housing options based on the current filters
    const filterHousingOptions = (options) => {
      return options.filter(housing => {
        // Price filter
        if (housing.cost < filters.minPrice || housing.cost > filters.maxPrice) {
          return false;
        }
        
        // Property type filter
        if (filters.propertyTypes.length > 0 && !filters.propertyTypes.includes(housing.id)) {
          return false;
        }
        
        // Get the number of beds for this property
        const propertySpecs = getPropertySpecs(housing.id);
        let numBeds = 1; // Default to 1
        
        // Extract number of beds from spec
        if (propertySpecs.beds.includes('Bed')) {
          numBeds = parseInt(propertySpecs.beds, 10);
        }
        
        // Apply beds filter
        if (numBeds < filters.minBeds) {
          return false;
        }
        
        return true;
      });
    };
    
    // Get the sorted and filtered housing options
    const sortedAndFilteredOptions = filterHousingOptions(sortHousingOptions(housingOptions));
    
    // Toggle sort option function
    const toggleSortOption = () => {
      const options = ['priceAsc', 'priceDesc', 'nameAsc', 'nameDesc'];
      const currentIndex = options.indexOf(sortOption);
      const nextIndex = (currentIndex + 1) % options.length;
      setSortOption(options[nextIndex]);
    };
    
    // Function to handle filter changes
    const handleFilterChange = (e) => {
      const { name, value, type, checked } = e.target;
      
      if (type === 'checkbox') {
        if (checked) {
          setFilters(prev => ({
            ...prev,
            propertyTypes: [...prev.propertyTypes, name]
          }));
        } else {
          setFilters(prev => ({
            ...prev,
            propertyTypes: prev.propertyTypes.filter(type => type !== name)
          }));
        }
      } else {
        setFilters(prev => ({
          ...prev,
          [name]: type === 'number' ? Number(value) : value
        }));
      }
    };
    
    // Reset filters function
    const resetFilters = () => {
      setFilters({
        minPrice: 0,
        maxPrice: 1000000000,
        minBeds: 0,
        propertyTypes: []
      });
    };
    
    // Get sort button text based on current sort option
    const getSortButtonText = () => {
      switch(sortOption) {
        case 'priceAsc': return 'Price ↑';
        case 'priceDesc': return 'Price ↓';
        case 'nameAsc': return 'A-Z';
        case 'nameDesc': return 'Z-A';
        default: return 'Sort';
      }
    };
    
    return (
    <div className="bg-white rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4 border-b pb-3">
        <div className="flex items-center">
          <span className="text-3xl mr-2">🏠</span>
          <h3 className="text-2xl font-bold text-gray-800">Find Your Next Home</h3>
        </div>
        <div className="flex items-center space-x-2 text-sm">
          <button 
            className={`bg-gray-100 hover:bg-gray-200 rounded-full px-3 py-1.5 text-gray-700 font-medium transition-colors flex items-center justify-center min-w-[90px] ${sortOption !== 'priceAsc' ? 'bg-gray-200' : ''}`}
            onClick={toggleSortOption}
          >
            <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"></path>
            </svg>
            <span>{getSortButtonText()}</span>
          </button>
          <button 
            className={`bg-gray-100 hover:bg-gray-200 rounded-full px-3 py-1.5 text-gray-700 font-medium transition-colors flex items-center justify-center min-w-[90px] ${showFilters ? 'bg-gray-200' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path>
            </svg>
            Filters 
            {(filters.propertyTypes.length > 0 || filters.minPrice > 0 || filters.minBeds > 0) && (
              <span className="ml-1 bg-teal-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                {filters.propertyTypes.length + (filters.minPrice > 0 ? 1 : 0) + (filters.minBeds > 0 ? 1 : 0)}
              </span>
            )}
          </button>
        </div>
      </div>
      
      {/* Filter panel */}
      {showFilters && (
        <div className="bg-gray-50 rounded-lg p-4 mb-4 shadow-sm border border-gray-200 animate-fadeIn">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200">
            <h4 className="font-semibold text-gray-700">Filter Properties</h4>
            <button 
              className="text-sm text-teal-600 hover:text-teal-800 flex items-center"
              onClick={resetFilters}
            >
              <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
              </svg>
              Reset All
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price Range</label>
              <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-2 text-gray-500">$</span>
                  <input
                    type="number"
                    name="minPrice"
                    value={filters.minPrice}
                    onChange={handleFilterChange}
                    placeholder="Min"
                    className="w-full pl-6 p-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>
                <span className="text-gray-400">to</span>
                <div className="relative flex-1">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-2 text-gray-500">$</span>
                  <input
                    type="number"
                    name="maxPrice"
                    value={filters.maxPrice}
                    onChange={handleFilterChange}
                    placeholder="Max"
                    className="w-full pl-6 p-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Bedrooms</label>
              <select
                name="minBeds"
                value={filters.minBeds}
                onChange={handleFilterChange}
                className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
              >
                <option value="0">Any</option>
                <option value="1">1+ Bed</option>
                <option value="2">2+ Beds</option>
                <option value="3">3+ Beds</option>
                <option value="4">4+ Beds</option>
                <option value="5">5+ Beds</option>
              </select>
            </div>
          </div>
          
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Property Type</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {['room', 'studio', 'apartment', 'condo', 'townhouse', 'house', 'luxury_condo', 'luxury_house', 'mansion', 'estate'].map(type => (
                <label key={type} className={`
                  flex items-center justify-center p-2 rounded-md text-sm cursor-pointer 
                  ${filters.propertyTypes.includes(type) 
                    ? 'bg-teal-100 border border-teal-300 text-teal-800' 
                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}
                `}>
                  <input
                    type="checkbox"
                    name={type}
                    checked={filters.propertyTypes.includes(type)}
                    onChange={handleFilterChange}
                    className="sr-only"
                  />
                  <span>
                    {type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  </span>
                </label>
              ))}
            </div>
          </div>
          
          <div className="mt-4 flex justify-end">
            <button 
              className="bg-teal-600 hover:bg-teal-700 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors shadow-sm flex items-center"
              onClick={() => setShowFilters(false)}
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
              Apply Filters
            </button>
          </div>
        </div>
      )}
      
      {state.playerStatus.housing && (
        <div className="mb-6">
          <h4 className="text-xl font-semibold text-gray-800 mb-3">Your Current Home</h4>
          <div 
            className="relative bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:scale-105 border border-gray-200"
            onClick={() => showDescription(state.playerStatus.housing, 'housing')}
            onTouchStart={(e) => handleTouchStart(state.playerStatus.housing, 'housing', e)}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
          >
            <div className="h-48 bg-gray-200 relative overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center opacity-70 bg-gradient-to-br from-teal-500 to-blue-700">
                <span className="text-white text-9xl">{getHousingIconAndColor(state.playerStatus.housing.id).icon}</span>
              </div>
              <div className="absolute top-0 left-0 bg-teal-600 text-white m-2 px-3 py-1 rounded-full text-sm font-semibold">
                CURRENT HOME
              </div>
            </div>
            
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-bold text-xl text-gray-800">{state.playerStatus.housing.name}</h4>
                <div className="text-2xl">{state.playerStatus.housing.image}</div>
              </div>
              
              <div className="flex items-center text-sm text-gray-500 mb-3">
                <span className="mr-3"><span className="text-gray-400 mr-1">📍</span> Business District</span>
                <span className="mr-3"><span className="text-gray-400 mr-1">🛏️</span> {getPropertySpecs(state.playerStatus.housing.id).beds}</span>
                <span><span className="text-gray-400 mr-1">🚿</span> {getPropertySpecs(state.playerStatus.housing.id).baths}</span>
              </div>
              
              <p className="text-gray-600 text-sm mb-3 line-clamp-2">{state.playerStatus.housing.description}</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {sortedAndFilteredOptions.length > 0 ? (
          sortedAndFilteredOptions.map((housing) => {
            const canAfford = money >= housing.cost;
            const alreadyOwned = state.playerStatus.housing && state.playerStatus.housing.id === housing.id;
            const { icon } = getHousingIconAndColor(housing.id);
            
            // Get property specs using the deterministic function
            const { beds, baths, sqft } = getPropertySpecs(housing.id);
            
            return (
              <div 
                key={housing.id} 
                className={`relative bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:shadow-lg ${canAfford ? '' : 'opacity-75'} ${alreadyOwned ? 'ring-2 ring-teal-500' : 'border border-gray-200'}`}
                onClick={() => showDescription(housing, 'housing')}
                onTouchStart={(e) => handleTouchStart(housing, 'housing', e)}
                onTouchEnd={handleTouchEnd}
                onTouchCancel={handleTouchEnd}
              >
                {alreadyOwned && (
                  <div className="absolute top-0 right-0 bg-teal-600 text-white m-2 px-3 py-1 rounded-full text-sm font-semibold z-20">
                    CURRENT
                  </div>
                )}
                
                <div className="h-40 bg-gray-200 relative overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center opacity-70 bg-gradient-to-br from-teal-500 to-blue-700">
                    <span className="text-white text-8xl">{icon}</span>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent h-20 opacity-70"></div>
                  <div className="absolute bottom-2 left-2 text-white font-bold text-xl">
                    ${housing.cost.toLocaleString()}
                  </div>
                </div>
                
                <div className="p-3">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-bold text-gray-800 truncate">{housing.name}</h4>
                    <span className="text-xl">{housing.image}</span>
                  </div>
                  
                  <div className="flex items-center text-xs text-gray-500 mb-2">
                    <span className="mr-2">📍 Business District</span>
                  </div>
                  
                  <div className="flex items-center justify-between mb-3 text-xs text-gray-700">
                    <span className="inline-flex items-center px-2 py-1 bg-gray-100 rounded-full">
                      🛏️ {beds}
                    </span>
                    <span className="inline-flex items-center px-2 py-1 bg-gray-100 rounded-full">
                      🚿 {baths}
                    </span>
                    <span className="inline-flex items-center px-2 py-1 bg-gray-100 rounded-full">
                      📏 {sqft}
                    </span>
                  </div>
                  
                  <div className="mt-auto">
                    <div className="relative w-full pr-20">
                      {animatingAssets[housing.id] ? (
                        <div className="absolute inset-0 bg-gray-400 rounded-full transition-all duration-700 ease-in-out"></div>
                      ) : null}
                      <button 
                        className={`w-[60%] mx-auto py-2 sm:py-3 px-3 sm:px-4 rounded-full font-medium transition-colors text-center shadow-md ${
                          alreadyOwned
                            ? 'bg-green-500 text-white cursor-default'
                            : canAfford 
                              ? 'bg-teal-600 hover:bg-teal-700 hover:shadow-lg text-white' 
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                        onClick={(e) => handleButtonClick(e, () => buyHousing(housing), housing.id)}
                        disabled={!canAfford || alreadyOwned}
                      >
                        <span className="block truncate">
                          {alreadyOwned ? 'Current Home' : canAfford ? 'Buy Property' : 'Can\'t Afford'}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-gray-600 italic">No properties match the current filters.</p>
        )}
      </div>
    </div>
  );
};

const renderTransportation = () => (
  <div className="bg-gradient-to-br from-amber-50 to-orange-100 rounded-lg p-6">
    <div className="flex items-center mb-4">
      <span className="text-3xl mr-2">🚗</span>
      <h3 className="text-2xl font-bold text-orange-800">Transportation Options</h3>
    </div>
    
    {state.playerStatus.transportation && (
      <div className="mb-6">
        <h4 className="text-xl font-semibold text-orange-800 mb-3">Current Transportation</h4>
        <div 
          className={`relative ${getTransportationIconAndColor(state.playerStatus.transportation.id).color} rounded-lg shadow-md overflow-hidden transition-transform hover:scale-105 p-0`}
          onClick={() => showDescription(state.playerStatus.transportation, 'transportation')}
          onTouchStart={(e) => handleTouchStart(state.playerStatus.transportation, 'transportation', e)}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
        >
          <div className="absolute right-0 bottom-0 w-32 h-32 opacity-20 flex items-center justify-center">
            <span className="text-white text-8xl">{getTransportationIconAndColor(state.playerStatus.transportation.id).icon}</span>
          </div>
          
          <div className="relative z-10 p-4">
            <div className="flex justify-between items-start mb-3">
              <div className="bg-black bg-opacity-30 rounded-lg p-2 shadow-sm inline-flex items-center">
                <h4 className="font-semibold text-lg text-white">{state.playerStatus.transportation.name}</h4>
              </div>
              <span className="bg-yellow-500 bg-opacity-30 py-1 px-3 rounded-full text-sm font-medium shadow-sm border border-yellow-400">
                <span className="text-yellow-500 drop-shadow-[0_0_2px_rgba(234,179,8,0.8)]">{state.playerStatus.transportation.clicksPerSecond}x 👆's</span>
              </span>
            </div>
            <p className="text-white text-sm">{state.playerStatus.transportation.description}</p>
          </div>
        </div>
      </div>
    )}
    
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {transportationOptions.map((transportation) => {
        const canAfford = money >= transportation.cost;
        const alreadyOwned = state.playerStatus.transportation && state.playerStatus.transportation.id === transportation.id;
        const { icon, color } = getTransportationIconAndColor(transportation.id);
        
        return (
          <div 
            key={transportation.id} 
            className={`relative ${color} rounded-lg shadow-md overflow-hidden transition-transform hover:scale-105 ${canAfford ? '' : 'opacity-75'} ${alreadyOwned ? 'ring-3 ring-green-400' : ''} w-full h-48 md:h-56 lg:h-64`}
            onClick={() => showDescription(transportation, 'transportation')}
            onTouchStart={(e) => handleTouchStart(transportation, 'transportation', e)}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
          >
            <div className={`absolute right-2 bottom-4 w-20 h-20 opacity-80 flex items-center justify-center transition-all duration-500 z-10 ${pulsatingIcons[transportation.id] ? 'scale-150 opacity-100' : ''}`}>
              <span className="text-white text-6xl drop-shadow-md">{icon}</span>
            </div>
            
            <div className="relative z-0 h-full flex flex-col p-3">
              <div className="bg-black bg-opacity-30 rounded-lg p-2 mb-1 shadow-sm flex items-center">
                <h4 className="font-semibold text-base text-white truncate">{transportation.name}</h4>
              </div>
              
              <div className="flex-grow flex flex-col justify-between">
                <div>
                  <p className="text-white text-xs px-1 mt-1 mb-2">
                    {getWittyTransportDescription(transportation.id)}
                  </p>
                  <span className="bg-yellow-500 bg-opacity-30 py-0.5 px-2 rounded-full text-xs font-medium shadow-sm border border-yellow-400 inline-block">
                    <span className="text-yellow-500 drop-shadow-[0_0_2px_rgba(234,179,8,0.8)]">{transportation.clickSpeedMultiplier}x 👆's</span>
                  </span>
                </div>
                
                <div className="mt-auto">
                  <div className="relative w-full">
                    {animatingAssets[transportation.id] ? (
                      <div className="absolute inset-0 bg-gray-400 rounded-full transition-all duration-700 ease-in-out"></div>
                    ) : null}
                    <button 
                      className={`w-[60%] mx-auto py-2 sm:py-3 px-3 sm:px-4 rounded-full font-bold transition-colors text-center shadow-md ${
                        alreadyOwned
                          ? 'bg-green-500 text-white cursor-default'
                          : canAfford 
                            ? 'bg-green-500 hover:bg-green-600 hover:shadow-lg text-white' 
                            : 'bg-gray-600 text-gray-300 cursor-not-allowed'
                      }`}
                      onClick={(e) => handleButtonClick(e, () => buyTransportation(transportation), transportation.id)}
                      disabled={!canAfford || alreadyOwned}
                    >
                      {alreadyOwned ? 'Owned' : 
                        <span className="text-sm sm:text-base whitespace-nowrap overflow-hidden truncate">
                          ${transportation.cost.toLocaleString()}
                        </span>
                      }
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

return (
  <div className="max-w-6xl mx-auto p-2 bg-white rounded-lg shadow-lg">
    <div className="flex border-b border-gray-200 mb-6">
      <button 
        className={`flex items-center py-3 px-6 font-medium text-lg transition-colors border-b-2 ${
          activeTab === 'assets' 
            ? 'text-indigo-600 border-indigo-600' 
            : 'text-gray-500 border-transparent hover:text-indigo-600'
        }`}
        onClick={() => toggleTab('assets')}
      >
        <span className="mr-2">🏦</span>
        Banking
      </button>
      <button 
        className={`flex items-center py-3 px-6 font-medium text-lg transition-colors border-b-2 ${
          activeTab === 'housing' 
            ? 'text-teal-600 border-teal-600' 
            : 'text-gray-500 border-transparent hover:text-teal-600'
        }`}
        onClick={() => toggleTab('housing')}
      >
        <span className="mr-2">🏠</span>
        Housing
      </button>
      <button 
        className={`flex items-center py-3 px-6 font-medium text-lg transition-colors border-b-2 ${
          activeTab === 'transportation' 
            ? 'text-orange-600 border-orange-600' 
            : 'text-gray-500 border-transparent hover:text-orange-600'
        }`}
        onClick={() => toggleTab('transportation')}
      >
        <span className="mr-2">🚗</span>
        Transportation
      </button>
    </div>
    
    <div>
      {activeTab === 'assets' && renderAssets()}
      {activeTab === 'housing' && renderHousing()}
      {activeTab === 'transportation' && renderTransportation()}
    </div>
    
    {descriptionModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={closeDescription}>
        <div 
          className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full transform transition-all animate-fadeIn" 
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center mb-4">
            <span className="text-4xl mr-3">{descriptionModal.item.image}</span>
            <h4 className="text-xl font-bold">{descriptionModal.item.name}</h4>
          </div>
          
          <p className="text-gray-700 mb-4">{descriptionModal.item.description}</p>
          
          {descriptionModal.type === 'asset' && (
            <div className="bg-indigo-50 rounded-lg p-4 mb-4">
              <p className="flex justify-between py-1"><span className="font-semibold">Cost:</span> ${descriptionModal.item.cost.toLocaleString()}</p>
              <p className="flex justify-between py-1"><span className="font-semibold">Income:</span> ${descriptionModal.item.income.toFixed(2)}/sec</p>
              <p className="flex justify-between py-1"><span className="font-semibold">ROI:</span> {((descriptionModal.item.income * 3600 * 24 * 365 / descriptionModal.item.cost) * 100).toFixed(2)}% annually</p>
            </div>
          )}
          
          {descriptionModal.type === 'housing' && (
            <div className="bg-teal-50 rounded-lg p-4 mb-4">
              <p className="flex justify-between py-1"><span className="font-semibold">Cost:</span> ${descriptionModal.item.cost.toLocaleString()}</p>
            </div>
          )}
          
          {descriptionModal.type === 'transportation' && (
            <div className="bg-orange-50 rounded-lg p-4 mb-4">
              <p className="flex justify-between py-1"><span className="font-semibold">Cost:</span> ${descriptionModal.item.cost.toLocaleString()}</p>
              <p className="flex justify-between py-1">
                <span className="font-semibold">Work Speed:</span> 
                <span className="bg-yellow-500 bg-opacity-30 py-1 px-3 rounded-full text-sm font-medium shadow-sm border border-yellow-400">
                  <span className="text-yellow-500 drop-shadow-[0_0_2px_rgba(234,179,8,0.8)]">{descriptionModal.item.clickSpeedMultiplier}x 👆's</span>
                </span>
              </p>
            </div>
          )}
          
          <button 
            className="w-full py-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition-colors font-medium"
            onClick={closeDescription}
          >
            Close
          </button>
        </div>
      </div>
    )}
  </div>
);
};

export default Assets; 