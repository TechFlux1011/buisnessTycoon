import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';

const GameClock = () => {
  const { gameState, getGameTime } = useGame();
  const [gameTime, setGameTime] = useState(getGameTime());
  
  // Update the displayed time every second
  useEffect(() => {
    const intervalId = setInterval(() => {
      setGameTime(getGameTime());
    }, 1000);
    
    return () => clearInterval(intervalId);
  }, [getGameTime]);
  
  // Format strings for display
  const formattedDate = gameTime.fullDate;
  const formattedTime = gameTime.shortTime;
  const timeRatioText = gameState.timeSettings.gameTimeRatio === 60 
    ? "1 real second = 1 game minute"
    : `1 real second = ${gameState.timeSettings.gameTimeRatio} game seconds`;
  
  return (
    <div className="game-clock bg-gradient-to-r from-slate-800 to-slate-700 text-white px-3 py-2 rounded-lg shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <div className="text-sm opacity-80">{formattedDate}</div>
          <div className="text-xl font-bold">{formattedTime}</div>
          <div className="text-xs opacity-60 mt-1">{timeRatioText}</div>
        </div>
      </div>
    </div>
  );
};

export default GameClock; 