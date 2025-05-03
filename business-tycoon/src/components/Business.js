import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { businessTypes, getBusinessCost, getBusinessUpgradeMultiplier } from '../data/gameData';
import '../styles/Business.css';

const Business = () => {
  const { gameState, gameDispatch: dispatch } = useGame();
  const [priceFilter, setPriceFilter] = useState('all');
  
  // Early return with loading message if gameState or playerStatus is undefined
  if (!gameState || !gameState.playerStatus) {
    return <div className="loading-container">Loading game data...</div>;
  }
  
  // Use gameState instead of state throughout the component
  const state = gameState;
  
  const startBusiness = (business) => {
    const cost = getBusinessCost(business, state.playerStatus.background);
    
    if (state.money >= cost) {
      dispatch({
        type: 'START_BUSINESS',
        payload: {
          id: business.id,
          name: business.name,
          income: business.baseIncome,
          cost: cost,
          level: 1,
          image: business.image,
          description: business.description,
          upgrades: business.upgrades,
          purchasedAt: Date.now(),
        }
      });
    }
  };
  
  const upgradeBusiness = (upgrade) => {
    if (!state.playerStatus.business) return;
    
    const business = state.playerStatus.business;
    const multiplier = getBusinessUpgradeMultiplier(
      upgrade.incomeMultiplier, 
      state.playerStatus.background
    );
    
    const incomeBoost = business.income * multiplier;
    
    dispatch({
      type: 'UPGRADE_BUSINESS',
      payload: {
        business,
        upgrade: {
          ...upgrade,
          incomeBoost,
        }
      }
    });
  };
  
  // Check if player has enough money for business
  const canAffordBusiness = (business) => {
    const cost = getBusinessCost(business, state.playerStatus.background);
    return state.money >= cost;
  };
  
  // Check if player can afford upgrade
  const canAffordUpgrade = (upgrade) => {
    return state.money >= upgrade.cost;
  };
  
  // Get the next upgrade for the current business based on its level
  const getNextUpgrade = () => {
    if (!state.playerStatus.business) return null;
    
    const business = state.playerStatus.business;
    const businessType = businessTypes.find(type => type.id === business.id);
    
    if (!businessType) return null;
    
    const nextUpgradeLevel = business.level + 1;
    return businessType.upgrades.find(upgrade => upgrade.level === nextUpgradeLevel);
  };
  
  const getFilteredBusinesses = () => {
    switch (priceFilter) {
      case 'affordable':
        return businessTypes.filter(business => getBusinessCost(business, state.playerStatus.background) <= state.money);
      case 'low':
        return businessTypes.filter(business => getBusinessCost(business, state.playerStatus.background) < 100000);
      case 'medium':
        return businessTypes.filter(business => {
          const cost = getBusinessCost(business, state.playerStatus.background);
          return cost >= 100000 && cost < 1000000;
        });
      case 'high':
        return businessTypes.filter(business => getBusinessCost(business, state.playerStatus.background) >= 1000000);
      default:
        return businessTypes;
    }
  };
  
  return (
    <div className="business-container">
      <h2>Business Ventures</h2>
      
      {state.playerStatus.business ? (
        <div className="owned-businesses">
          <h3>Your Business</h3>
          <div className="business-card owned">
            <div className="business-header">
              <div className="business-icon">{state.playerStatus.business.image}</div>
              <h3>{state.playerStatus.business.name} <span className="level-badge level-intermediate">Level {state.playerStatus.business.level}</span></h3>
            </div>
            <p className="business-description">{state.playerStatus.business.description}</p>
            <p className="business-income">Income: ${state.playerStatus.business.income.toFixed(2)}/sec</p>
            
            {getNextUpgrade() ? (
              <div className="upgrade-section">
                <h4>Available Upgrade: {getNextUpgrade().name}</h4>
                <p>Cost: ${getNextUpgrade().cost.toLocaleString()}</p>
                <p>Income Boost: <span className="boost-text">+{(getNextUpgrade().incomeMultiplier * 100).toFixed(0)}%</span></p>
                {state.playerStatus.background === 'poor' && (
                  <p className="bonus">Poor Background Bonus: <span className="boost-text">+10% income</span></p>
                )}
                <button 
                  className="upgrade-button"
                  onClick={() => upgradeBusiness(getNextUpgrade())}
                  disabled={!canAffordUpgrade(getNextUpgrade())}
                >
                  {canAffordUpgrade(getNextUpgrade()) ? 'Upgrade' : 'Not enough money'}
                </button>
              </div>
            ) : (
              <div className="max-level">
                <p><span className="badge badge-warning">Max Level Reached!</span></p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="no-businesses">
          <p>You don't own any businesses yet. Purchase one below to start generating serious income!</p>
        </div>
      )}
      
      <div className="filter-controls">
        <span className="filter-label">Filter by price:</span>
        <div className="filter-buttons">
          <button 
            className={priceFilter === 'all' ? 'active' : ''} 
            onClick={() => setPriceFilter('all')}
          >
            <span className="price-badge price-all">All</span>
          </button>
          <button 
            className={priceFilter === 'affordable' ? 'active' : ''} 
            onClick={() => setPriceFilter('affordable')}
          >
            <span className="price-badge price-affordable">Affordable</span>
          </button>
          <button 
            className={priceFilter === 'low' ? 'active' : ''} 
            onClick={() => setPriceFilter('low')}
          >
            <span className="price-badge price-low">Low (&lt;$100k)</span>
          </button>
          <button 
            className={priceFilter === 'medium' ? 'active' : ''} 
            onClick={() => setPriceFilter('medium')}
          >
            <span className="price-badge price-medium">Medium ($100k-$1M)</span>
          </button>
          <button 
            className={priceFilter === 'high' ? 'active' : ''} 
            onClick={() => setPriceFilter('high')}
          >
            <span className="price-badge price-high">High (&gt;$1M)</span>
          </button>
        </div>
      </div>
      
      <h3>Available Businesses</h3>
      <div className="available-businesses">
        {getFilteredBusinesses().map((business) => {
          const cost = getBusinessCost(business, state.playerStatus.background);
          const alreadyOwned = state.playerStatus.business && state.playerStatus.business.id === business.id;
          
          return (
            <div 
              key={business.id} 
              className={`business-card ${canAffordBusiness(business) ? '' : 'cannot-afford'} ${alreadyOwned ? 'already-owned' : ''}`}
            >
              <div className="business-header">
                <div className="business-icon">{business.image}</div>
                <h3>{business.name}</h3>
              </div>
              <p className="business-description">{business.description}</p>
              <div className="business-details">
                <p>Cost: ${cost.toLocaleString()}</p>
                <p>Income: ${business.baseIncome.toFixed(2)}/sec</p>
                <p className="roi">ROI: <span className="boost-text">{((business.baseIncome * 3600 * 24 * 365 / cost) * 100).toFixed(2)}% annually</span></p>
                {state.playerStatus.background === 'poor' && (
                  <p className="discount">Poor Background Discount: <span className="boost-text">20% off</span></p>
                )}
              </div>
              <button 
                className="buy-button"
                onClick={() => startBusiness(business)}
                disabled={!canAffordBusiness(business) || alreadyOwned}
              >
                {alreadyOwned ? 'Already Owned' : canAffordBusiness(business) ? 'Start Business' : 'Not enough money'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Business; 