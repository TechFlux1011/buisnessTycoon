import React, { useState } from 'react';
import Login from './Login';
import Register from './Register';

export default function AuthContainer({ onAuthSuccess }) {
  const [showRegister, setShowRegister] = useState(false);

  const handleLoginSuccess = () => {
    onAuthSuccess();
  };

  const handleRegisterSuccess = () => {
    onAuthSuccess();
  };

  return (
    <div className="auth-container p-6 max-w-md mx-auto bg-white rounded-lg shadow-md">
      {showRegister ? (
        <Register 
          setShowRegister={setShowRegister} 
          onRegisterSuccess={handleRegisterSuccess} 
        />
      ) : (
        <Login 
          setShowRegister={setShowRegister} 
          onLoginSuccess={handleLoginSuccess} 
        />
      )}
    </div>
  );
} 