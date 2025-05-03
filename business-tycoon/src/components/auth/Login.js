import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function Login({ setShowRegister, onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, signInWithGoogle, signInWithApple, signInAsGuest, authInitialized } = useAuth();

  // Reset error when auth initialization changes
  useEffect(() => {
    if (authInitialized && error.includes("not initialized")) {
      setError('');
    }
  }, [authInitialized, error]);

  async function handleSubmit(e) {
    e.preventDefault();
    
    if (!authInitialized) {
      setError('Authentication is still initializing. Please wait a moment and try again.');
      return;
    }
    
    try {
      setError('');
      setLoading(true);
      await login(email, password);
      onLoginSuccess();
    } catch (error) {
      setError('Failed to log in: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    if (!authInitialized) {
      setError('Authentication is still initializing. Please wait a moment and try again.');
      return;
    }
    
    try {
      setError('');
      setLoading(true);
      await signInWithGoogle();
      onLoginSuccess();
    } catch (error) {
      setError('Failed to sign in with Google: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAppleSignIn() {
    if (!authInitialized) {
      setError('Authentication is still initializing. Please wait a moment and try again.');
      return;
    }
    
    try {
      setError('');
      setLoading(true);
      await signInWithApple();
      onLoginSuccess();
    } catch (error) {
      setError('Failed to sign in with Apple: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGuestSignIn() {
    if (!authInitialized) {
      setError('Authentication is still initializing. Please wait a moment and try again.');
      return;
    }
    
    try {
      setError('');
      setLoading(true);
      console.log("Login component: Starting guest sign in...");
      await signInAsGuest();
      console.log("Login component: Guest sign in completed");
      onLoginSuccess();
    } catch (error) {
      console.error("Guest sign-in error in Login component:", error);
      setError('Failed to sign in as guest: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-form-container">
      <h2 className="text-2xl font-bold mb-4">Login</h2>
      
      {!authInitialized && (
        <div className="info-message mb-4 p-2 bg-blue-100 text-blue-700 rounded">
          Initializing authentication... Please wait.
        </div>
      )}
      
      {error && <div className="error-message mb-4 p-2 bg-red-100 text-red-700 rounded">{error}</div>}
      
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={!authInitialized || loading}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={!authInitialized || loading}
          />
        </div>
        
        <button
          type="submit"
          disabled={!authInitialized || loading}
          className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      
      <div className="social-login-divider my-6 flex items-center">
        <div className="flex-grow border-t border-gray-300"></div>
        <span className="px-4 text-gray-500 text-sm">OR</span>
        <div className="flex-grow border-t border-gray-300"></div>
      </div>
      
      <div className="social-login-buttons flex flex-col gap-3">
        <button
          onClick={handleGoogleSignIn}
          disabled={!authInitialized || loading}
          className="bg-white border border-gray-300 py-2 px-4 rounded hover:bg-gray-50 flex items-center justify-center disabled:opacity-50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 48 48" className="mr-2">
            <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
            <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
            <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
            <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
          </svg>
          Sign in with Google
        </button>
        
        <button
          onClick={handleAppleSignIn}
          disabled={!authInitialized || loading}
          className="bg-black text-white py-2 px-4 rounded hover:bg-gray-900 flex items-center justify-center disabled:opacity-50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="white" className="mr-2">
            <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.53 4.08zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.26 2.31-2.15 4.2-3.74 4.25z" />
          </svg>
          Sign in with Apple
        </button>
        
        {/* Guest login button for development */}
        <button
          onClick={handleGuestSignIn}
          disabled={!authInitialized || loading}
          className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 flex items-center justify-center disabled:opacity-50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="white" className="mr-2">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
          Continue as Guest
        </button>
      </div>
      
      <div className="mt-6 text-center">
        <p>
          Don't have an account?{' '}
          <button
            onClick={() => setShowRegister(true)}
            className="text-blue-600 hover:underline"
            disabled={!authInitialized || loading}
          >
            Register
          </button>
        </p>
      </div>
    </div>
  );
} 