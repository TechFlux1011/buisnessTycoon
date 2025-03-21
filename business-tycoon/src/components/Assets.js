import React, { useState, useRef, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { assets, transportationOptions, housingOptions } from '../data/gameData';
import '../styles/Assets.css';

const Assets = () => {
  const { state, dispatch } = useGame();
  const { money } = state;
  
  const [activeTab, setActiveTab] = useState('assets');
  const [descriptionModal, setDescriptionModal] = useState(null);
  const [longPressActive, setLongPressActive] = useState(false);
  const longPressTimer = useRef(null);
  const longPressItem = useRef(null);
  const modalTimeout = useRef(null);

  const toggleTab = (tab) => {
    setActiveTab(tab);
  };

  const buyAsset = (asset) => {
    dispatch({ 
      type: 'BUY_ASSET', 
      payload: {
        ...asset,
        id: `${asset.id}-${Date.now()}`, // Make each purchased asset unique
        purchasedAt: Date.now(),
      }
    });
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
  
  // Handle button clicks separately to prevent event propagation issues
  const handleButtonClick = (e, action) => {
    e.stopPropagation(); // Prevent the card's events from firing
    action();
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
  
  const renderAssets = () => (
    <div className="assets-section">
      <div className="section-header">
        <h3>Assets</h3>
      </div>
      
      <div className="assets-grid">
        {assets.map((asset) => {
          const canAfford = money >= asset.cost;
          
          return (
            <div 
              key={asset.id} 
              className={`asset-card ${canAfford ? '' : 'cannot-afford'}`}
              onClick={() => showDescription(asset, 'asset')}
              onTouchStart={(e) => handleTouchStart(asset, 'asset', e)}
              onTouchEnd={handleTouchEnd}
              onTouchCancel={handleTouchEnd}
            >
              <div className="asset-icon">{asset.image}</div>
              <h4>{asset.name}</h4>
              <p className="asset-boost">${asset.income.toFixed(2)}/sec</p>
              <button 
                className="buy-button" 
                onClick={(e) => handleButtonClick(e, () => buyAsset(asset))}
                disabled={!canAfford}
              >
                {canAfford ? `Buy $${asset.cost.toLocaleString()}` : `$${asset.cost.toLocaleString()}`}
              </button>
            </div>
          );
        })}
      </div>
      
      <h3>Owned Assets</h3>
      <div className="owned-assets">
        {state.assets.length > 0 ? (
          <div className="owned-assets-grid">
            {state.assets.map((asset) => (
              <div 
                key={asset.id} 
                className="owned-asset-card"
                onClick={() => showDescription(asset, 'asset')}
                onTouchStart={(e) => handleTouchStart(asset, 'asset', e)}
                onTouchEnd={handleTouchEnd}
                onTouchCancel={handleTouchEnd}
              >
                <div className="asset-icon">{asset.image}</div>
                <h4>{asset.name}</h4>
                <p className="asset-boost">Generating ${asset.income.toFixed(2)}/sec</p>
              </div>
            ))}
          </div>
        ) : (
          <p>You don't own any assets yet.</p>
        )}
      </div>
    </div>
  );
  
  const renderHousing = () => (
    <div className="housing-section">
      <div className="section-header">
        <h3>Housing Options</h3>
      </div>
      
      {state.playerStatus.housing && (
        <div className="current-housing">
          <h4>Current Housing</h4>
          <div 
            className="current-housing-card"
            onClick={() => showDescription(state.playerStatus.housing, 'housing')}
            onTouchStart={(e) => handleTouchStart(state.playerStatus.housing, 'housing', e)}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
          >
            <div className="housing-icon">{state.playerStatus.housing.image}</div>
            <h4>{state.playerStatus.housing.name}</h4>
            <p>{state.playerStatus.housing.description}</p>
          </div>
        </div>
      )}
      
      <div className="housing-grid">
        {housingOptions.map((housing) => {
          const canAfford = money >= housing.cost;
          const alreadyOwned = state.playerStatus.housing && state.playerStatus.housing.id === housing.id;
          
          return (
            <div 
              key={housing.id} 
              className={`housing-card ${canAfford ? '' : 'cannot-afford'} ${alreadyOwned ? 'owned' : ''}`}
              onClick={() => showDescription(housing, 'housing')}
              onTouchStart={(e) => handleTouchStart(housing, 'housing', e)}
              onTouchEnd={handleTouchEnd}
              onTouchCancel={handleTouchEnd}
            >
              <div className="housing-icon">{housing.image}</div>
              <h4>{housing.name}</h4>
              <button 
                className="buy-button" 
                onClick={(e) => handleButtonClick(e, () => buyHousing(housing))}
                disabled={!canAfford || alreadyOwned}
              >
                {alreadyOwned ? 'Owned' : canAfford ? `Buy $${housing.cost.toLocaleString()}` : `$${housing.cost.toLocaleString()}`}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
  
  const renderTransportation = () => (
    <div className="transportation-section">
      <div className="section-header">
        <h3>Transportation Options</h3>
      </div>
      
      {state.playerStatus.transportation && (
        <div className="current-transportation">
          <h4>Current Transportation</h4>
          <div 
            className="current-transportation-card"
            onClick={() => showDescription(state.playerStatus.transportation, 'transportation')}
            onTouchStart={(e) => handleTouchStart(state.playerStatus.transportation, 'transportation', e)}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
          >
            <div className="transportation-icon">{state.playerStatus.transportation.image}</div>
            <h4>{state.playerStatus.transportation.name}</h4>
            <p>{state.playerStatus.transportation.description}</p>
            <p className="speed-multiplier">Work Speed: <span className="highlight">{state.playerStatus.transportation.clickSpeedMultiplier} clicks/sec</span></p>
          </div>
        </div>
      )}
      
      <div className="transportation-grid">
        {transportationOptions.map((transportation) => {
          const canAfford = money >= transportation.cost;
          const alreadyOwned = state.playerStatus.transportation && state.playerStatus.transportation.id === transportation.id;
          
          return (
            <div 
              key={transportation.id} 
              className={`transportation-card ${canAfford ? '' : 'cannot-afford'} ${alreadyOwned ? 'owned' : ''}`}
              onClick={() => showDescription(transportation, 'transportation')}
              onTouchStart={(e) => handleTouchStart(transportation, 'transportation', e)}
              onTouchEnd={handleTouchEnd}
              onTouchCancel={handleTouchEnd}
            >
              <div className="transportation-icon">{transportation.image}</div>
              <h4>{transportation.name}</h4>
              <p className="speed-multiplier">{transportation.clickSpeedMultiplier} clicks/sec</p>
              <button 
                className="buy-button" 
                onClick={(e) => handleButtonClick(e, () => buyTransportation(transportation))}
                disabled={!canAfford || alreadyOwned}
              >
                {alreadyOwned ? 'Owned' : canAfford ? `Buy $${transportation.cost.toLocaleString()}` : `$${transportation.cost.toLocaleString()}`}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
  
  return (
    <div className="assets-container">
      <div className="assets-tabs">
        <button 
          className={activeTab === 'assets' ? 'active' : ''} 
          onClick={() => toggleTab('assets')}
        >
          Assets
        </button>
        <button 
          className={activeTab === 'housing' ? 'active' : ''} 
          onClick={() => toggleTab('housing')}
        >
          Housing
        </button>
        <button 
          className={activeTab === 'transportation' ? 'active' : ''} 
          onClick={() => toggleTab('transportation')}
        >
          Transportation
        </button>
      </div>
      
      <div className="assets-content">
        {activeTab === 'assets' && renderAssets()}
        {activeTab === 'housing' && renderHousing()}
        {activeTab === 'transportation' && renderTransportation()}
      </div>
      
      {descriptionModal && (
        <div className="description-full" onClick={closeDescription}>
          <div className="description-modal" onClick={(e) => e.stopPropagation()}>
            <h4>{descriptionModal.item.name}</h4>
            <p>{descriptionModal.item.description}</p>
            
            {descriptionModal.type === 'asset' && (
              <div className="modal-details">
                <p><strong>Cost:</strong> ${descriptionModal.item.cost.toLocaleString()}</p>
                <p><strong>Income:</strong> ${descriptionModal.item.income.toFixed(2)}/sec</p>
                <p><strong>ROI:</strong> {((descriptionModal.item.income * 3600 * 24 * 365 / descriptionModal.item.cost) * 100).toFixed(2)}% annually</p>
              </div>
            )}
            
            {descriptionModal.type === 'housing' && (
              <div className="modal-details">
                <p><strong>Cost:</strong> ${descriptionModal.item.cost.toLocaleString()}</p>
              </div>
            )}
            
            {descriptionModal.type === 'transportation' && (
              <div className="modal-details">
                <p><strong>Cost:</strong> ${descriptionModal.item.cost.toLocaleString()}</p>
                <p className="speed-multiplier">
                  <strong>Work Speed:</strong> <span className="highlight">{descriptionModal.item.clickSpeedMultiplier} clicks/sec</span>
                </p>
              </div>
            )}
            
            <button onClick={closeDescription}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Assets; 