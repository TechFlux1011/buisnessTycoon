import React, { useState } from 'react';
import { GameProvider } from './context/GameContext';
import Clicker from './components/Clicker';
import Jobs from './components/Jobs';
import Assets from './components/Assets';
import Business from './components/Business';
import Education from './components/Education';
import './styles/App.css';

function App() {
  const [activeTab, setActiveTab] = useState('clicker');
  
  const renderTabContent = () => {
    switch (activeTab) {
      case 'clicker':
        return <Clicker />;
      case 'jobs':
        return <Jobs />;
      case 'assets':
        return <Assets />;
      case 'business':
        return <Business />;
      case 'education':
        return <Education />;
      default:
        return <Clicker />;
    }
  };
  
  return (
    <GameProvider>
      <div className="app-container">
        <header className="app-header">
          <h1 className="app-title">Business Tycoon</h1>
          <p className="app-subtitle">Click your way from rags to riches</p>
        </header>
        
        <div className="tabs-container">
          <button 
            className={`tab-button ${activeTab === 'clicker' ? 'active' : ''}`} 
            onClick={() => setActiveTab('clicker')}
          >
            Work
          </button>
          <button 
            className={`tab-button ${activeTab === 'jobs' ? 'active' : ''}`} 
            onClick={() => setActiveTab('jobs')}
          >
            Jobs
          </button>
          <button 
            className={`tab-button ${activeTab === 'assets' ? 'active' : ''}`} 
            onClick={() => setActiveTab('assets')}
          >
            Assets
          </button>
          <button 
            className={`tab-button ${activeTab === 'business' ? 'active' : ''}`} 
            onClick={() => setActiveTab('business')}
          >
            Business
          </button>
          <button 
            className={`tab-button ${activeTab === 'education' ? 'active' : ''}`} 
            onClick={() => setActiveTab('education')}
          >
            Education
          </button>
        </div>
        
        <div className="tab-content">
          {renderTabContent()}
        </div>
        
        <footer className="app-footer">
          <p>Business Tycoon Clicker Game &copy; 2024</p>
        </footer>
      </div>
    </GameProvider>
  );
}

export default App;
