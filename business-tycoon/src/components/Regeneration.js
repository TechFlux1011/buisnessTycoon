import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import '../styles/Regeneration.css';

const Regeneration = () => {
  const { gameState, gameDispatch: dispatch } = useGame();
  const [confirmVisible, setConfirmVisible] = useState(false);
  
  // Early return with loading message if gameState is undefined
  if (!gameState) {
    return <div className="loading-container">Loading game data...</div>;
  }
  
  // Use gameState instead of state throughout the component
  const state = gameState;
  
  const showConfirmation = () => {
    setConfirmVisible(true);
  };
  
  const hideConfirmation = () => {
    setConfirmVisible(false);
  };
  
  const regenerate = () => {
    dispatch({ type: 'REGENERATE' });
  };

  const calcInheritance = () => {
    return Math.floor(state.money * 0.2);
  };
  
  // Calculate skill inheritance (30%)
  const calcSkillInheritance = (skillValue) => {
    return Math.floor(skillValue * 0.3);
  };

  // Determine starting level for next generation
  const getStartingLevel = () => {
    return state.playerStatus.ascensionCount >= 3 ? 5 : "Random (1-3)";
  };
  
  return (
    <div className="regeneration-container">
      {!confirmVisible ? (
        <div className="regeneration-prompt">
          <h3>Maximum Level Reached!</h3>
          <p>You've reached Level 100, the maximum level in the game.</p>
          <p>You can continue to accumulate wealth or start a new generation with inherited advantages.</p>
          <p>Your child will inherit:</p>
          <ul>
            <li>${calcInheritance().toLocaleString()} (20% of your current wealth)</li>
            <li>Business: {calcSkillInheritance(state.skills.business)} points</li>
            <li>Technology: {calcSkillInheritance(state.skills.tech)} points</li>
            <li>Social: {calcSkillInheritance(state.skills.social)} points</li>
            <li>Creativity: {calcSkillInheritance(state.skills.creativity)} points</li>
            <li>Starting Level: {getStartingLevel()}</li>
          </ul>
          <button className="regenerate-button" onClick={showConfirmation}>
            Start New Generation
          </button>
        </div>
      ) : (
        <div className="confirmation-message">
          <h3>Are you sure?</h3>
          <p>You'll lose all your current assets and start fresh as the next generation.</p>
          <div className="confirmation-buttons">
            <button className="confirm-button" onClick={regenerate}>Yes, Start New Generation</button>
            <button className="cancel-button" onClick={hideConfirmation}>No, Continue Playing</button>
          </div>
        </div>
      )}

      <div className="regeneration-details">
        <p>Your wealth: ${Math.floor(state.money).toLocaleString()}</p>
        <p>Inheritance (20%): ${Math.floor(state.money * 0.2).toLocaleString()}</p>
        <p>Skills inherited: 30% of your current skills</p>
        
        <div className="next-gen-info">
          <p className="next-gen-title">Next Generation:</p>
          <p>Your child will have a rich or poor background, depending on your wealth</p>
          <p>Wealthy players (${'>'}$500,000) have a 70% chance of a rich child</p>
          <p>Rich children get 50% more inheritance money and education bonuses</p>
        </div>
        
        {state.playerStatus.ascensionCount >= 3 && (
          <p className="bonus-info">High Ascension Bonus: Your child will start at level 5!</p>
        )}
      </div>
    </div>
  );
};

export default Regeneration; 