import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useGame } from '../../context/GameContext';

export default function Profile({ onClose }) {
  const { currentUser, logout } = useAuth();
  const { saveGame, resetGame } = useGame();
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    try {
      // First save the game
      await saveGame();
      await logout();
    } catch (error) {
      setError('Failed to log out: ' + error.message);
    }
  }

  async function handleSaveGame() {
    try {
      setLoading(true);
      const success = await saveGame();
      if (success) {
        setMessage('Game saved successfully!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setError('Failed to save game');
      }
    } catch (error) {
      setError('Error saving game: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleNewGame() {
    if (window.confirm('Are you sure you want to start a new game? Your current progress will be lost.')) {
      try {
        await resetGame();
        setMessage('New game started!');
        setTimeout(() => setMessage(''), 3000);
      } catch (error) {
        setError('Error starting new game: ' + error.message);
      }
    }
  }

  return (
    <div className="profile-container p-6 bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Profile</h2>
        <button 
          onClick={onClose} 
          className="text-gray-600 hover:text-gray-900"
        >
          ✕
        </button>
      </div>
      
      {error && <div className="error-message mb-4 p-2 bg-red-100 text-red-700 rounded">{error}</div>}
      {message && <div className="success-message mb-4 p-2 bg-green-100 text-green-700 rounded">{message}</div>}
      
      <div className="user-info mb-6">
        <div className="mb-2">
          <strong>Email:</strong> {currentUser?.email}
        </div>
        <div className="mb-2">
          <strong>Display Name:</strong> {currentUser?.displayName || 'N/A'}
        </div>
      </div>
      
      <div className="profile-actions flex flex-col gap-3">
        <button
          onClick={handleSaveGame}
          disabled={loading}
          className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Game'}
        </button>
        
        <button
          onClick={handleNewGame}
          className="bg-yellow-600 text-white py-2 px-4 rounded hover:bg-yellow-700"
        >
          Start New Game
        </button>
        
        <button
          onClick={handleLogout}
          className="bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 mt-3"
        >
          Logout
        </button>
      </div>
    </div>
  );
} 