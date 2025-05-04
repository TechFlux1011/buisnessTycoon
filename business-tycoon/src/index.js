import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { auth, onAuthStateChanged } from './config/firebase';

// Firebase initialization wrapper component
function FirebaseInitWrapper() {
  const [firebaseInitialized, setFirebaseInitialized] = useState(false);
  const [initError, setInitError] = useState(null);

  useEffect(() => {
    const initFirebase = async () => {
      try {
        console.log("Initializing Firebase and waiting for auth state...");
        // Check if auth is ready by subscribing to auth state changes
        const unsubscribe = onAuthStateChanged(auth, 
          () => {
            console.log("Firebase auth initialized successfully");
            setFirebaseInitialized(true);
          },
          (error) => {
            console.error("Firebase auth initialization error:", error);
            setInitError(error.message);
          }
        );

        // Clean up subscription on unmount
        return () => unsubscribe();
      } catch (error) {
        console.error("Error during Firebase initialization:", error);
        setInitError(error.message);
      }
    };

    initFirebase();
  }, []);

  if (initError) {
    return (
      <div className="firebase-error-container" style={{
        padding: '20px',
        margin: '20px',
        backgroundColor: '#fee2e2',
        color: '#b91c1c',
        borderRadius: '8px',
        textAlign: 'center'
      }}>
        <h2>Firebase Initialization Error</h2>
        <p>{initError}</p>
        <p>Please refresh the page or check your connection.</p>
      </div>
    );
  }

  if (!firebaseInitialized) {
    return (
      <div className="firebase-loading" style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        width: '100vw'
      }}>
        <div className="loading-spinner" style={{
          width: '50px',
          height: '50px',
          border: '5px solid #f3f3f3',
          borderTop: '5px solid #3498db',
          borderRadius: '50%',
          animation: 'spin 2s linear infinite',
          marginBottom: '20px'
        }}></div>
        <style>
          {`@keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }`}
        </style>
        <p>Initializing Firebase...</p>
      </div>
    );
  }

  return <App />;
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <FirebaseInitWrapper />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
