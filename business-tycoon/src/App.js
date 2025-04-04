import React, { useState } from 'react';
import './tailwind.css';
import './styles/App.css';
import Clicker from './components/Clicker';
import Jobs from './components/Jobs';
import Assets from './components/Assets';
import Business from './components/Business';
import Education from './components/Education';
import Finance from './components/Finance';
import ThemeToggle from './components/ThemeToggle';
import { GameProvider } from './context/GameContext';
import { StockMarketProvider } from './context/StockMarketContext';
import { ThemeProvider } from './context/ThemeContext';

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
      case 'finance':
        return <Finance />;
      default:
        return <Clicker />;
    }
  };
  
  return (
    <ThemeProvider>
      <GameProvider>
        <StockMarketProvider>
          <div className="app-container">
            <div className="app-content">
              <div className="theme-toggle-container">
                <ThemeToggle />
              </div>
              {renderTabContent()}
            </div>
            <nav className="app-navigation">
              <ul className="nav-list">
                <li className={`nav-item ${activeTab === 'clicker' ? 'active' : ''}`}>
                  <button onClick={() => setActiveTab('clicker')} className="nav-button">
                    <span role="img" aria-label="Work">💼</span>
                    <span className="nav-text">Work</span>
                  </button>
                </li>
                <li className={`nav-item ${activeTab === 'jobs' ? 'active' : ''}`}>
                  <button onClick={() => setActiveTab('jobs')} className="nav-button">
                    <span role="img" aria-label="Jobs">🔍</span>
                    <span className="nav-text">Jobs</span>
                  </button>
                </li>
                <li className={`nav-item ${activeTab === 'assets' ? 'active' : ''}`}>
                  <button onClick={() => setActiveTab('assets')} className="nav-button">
                    <span role="img" aria-label="Banking">🏦</span>
                    <span className="nav-text">Banking</span>
                  </button>
                </li>
                <li className={`nav-item ${activeTab === 'finance' ? 'active' : ''}`}>
                  <button onClick={() => setActiveTab('finance')} className="nav-button">
                    <span role="img" aria-label="Invest">📈</span>
                    <span className="nav-text">Invest</span>
                  </button>
                </li>
                <li className={`nav-item ${activeTab === 'business' ? 'active' : ''}`}>
                  <button onClick={() => setActiveTab('business')} className="nav-button">
                    <span role="img" aria-label="Business">🏢</span>
                    <span className="nav-text">Business</span>
                  </button>
                </li>
                <li className={`nav-item ${activeTab === 'education' ? 'active' : ''}`}>
                  <button onClick={() => setActiveTab('education')} className="nav-button">
                    <span role="img" aria-label="Education">🎓</span>
                    <span className="nav-text">Education</span>
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </StockMarketProvider>
      </GameProvider>
    </ThemeProvider>
  );
}

export default App;
