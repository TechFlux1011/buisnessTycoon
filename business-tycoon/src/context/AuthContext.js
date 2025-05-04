import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  auth, 
  db, 
  googleProvider, 
  appleProvider,
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  sendPasswordResetEmail,
  updateProfile,
  signInWithPopup,
  getRedirectResult,
  signInAnonymously,
  doc,
  setDoc
} from '../config/firebase';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);

  // Use an effect to confirm when auth is ready
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, () => {
      setAuthInitialized(true);
    });
    return unsubscribe;
  }, []);

  async function signup(email, password, displayName) {
    try {
      if (!authInitialized) {
        throw new Error("Authentication not initialized yet. Please try again.");
      }
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Update profile with display name
      await updateProfile(userCredential.user, { displayName });
      // Create user document in Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email,
        displayName,
        createdAt: new Date(),
        lastLogin: new Date(),
      });
      return userCredential;
    } catch (error) {
      console.error("Signup error:", error);
      throw error;
    }
  }

  async function login(email, password) {
    try {
      if (!authInitialized) {
        throw new Error("Authentication not initialized yet. Please try again.");
      }
      return await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  }

  async function signInWithGoogle() {
    try {
      if (!authInitialized) {
        throw new Error("Authentication not initialized yet. Please try again.");
      }
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Create or update user document
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        displayName: user.displayName,
        lastLogin: new Date(),
      }, { merge: true });
      
      return result;
    } catch (error) {
      console.error("Google sign-in error:", error);
      throw error;
    }
  }

  async function signInWithApple() {
    try {
      if (!authInitialized) {
        throw new Error("Authentication not initialized yet. Please try again.");
      }
      const result = await signInWithPopup(auth, appleProvider);
      const user = result.user;
      
      // Create or update user document
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        displayName: user.displayName || user.email.split('@')[0], // Apple might not provide display name
        lastLogin: new Date(),
      }, { merge: true });
      
      return result;
    } catch (error) {
      console.error("Apple sign-in error:", error);
      throw error;
    }
  }

  async function signInAsGuest() {
    try {
      if (!authInitialized) {
        throw new Error("Authentication not initialized yet. Please try again.");
      }
      
      console.log("Starting guest sign in...");
      // Sign in anonymously to Firebase
      const result = await signInAnonymously(auth);
      console.log("Anonymous auth completed:", result);
      
      const user = result.user;
      
      // Generate a consistent display name for guest users
      const displayName = "Guest User";
      
      console.log("Creating user document...");
      // Create or update user document
      await setDoc(doc(db, 'users', user.uid), {
        isGuest: true,
        displayName: displayName,
        lastLogin: new Date(),
      }, { merge: true });
      
      console.log("Updating profile...");
      // Update profile with display name
      await updateProfile(user, { displayName });
      
      console.log("Guest sign in completed successfully");
      return result;
    } catch (error) {
      console.error("Guest sign-in error:", error);
      throw error;
    }
  }

  async function logout() {
    try {
      if (!authInitialized) {
        throw new Error("Authentication not initialized yet. Please try again.");
      }
      return await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  }

  async function resetPassword(email) {
    try {
      if (!authInitialized) {
        throw new Error("Authentication not initialized yet. Please try again.");
      }
      return await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error("Password reset error:", error);
      throw error;
    }
  }

  // Check for redirect results (especially useful for mobile)
  useEffect(() => {
    async function checkRedirectResult() {
      try {
        if (!authInitialized) return;
        
        const result = await getRedirectResult(auth);
        if (result?.user) {
          // User just signed in with a redirect
          await setDoc(doc(db, 'users', result.user.uid), {
            email: result.user.email,
            displayName: result.user.displayName || result.user.email.split('@')[0],
            lastLogin: new Date(),
          }, { merge: true });
        }
      } catch (error) {
        console.error("Error checking redirect result:", error);
      }
    }
    
    if (authInitialized) {
      checkRedirectResult();
    }
  }, [authInitialized]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Update user's last login time
          await setDoc(doc(db, 'users', user.uid), {
            lastLogin: new Date()
          }, { merge: true });
        } catch (error) {
          console.error("Error updating last login:", error);
        }
      }
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    signup,
    login,
    signInWithGoogle,
    signInWithApple,
    signInAsGuest,
    logout,
    resetPassword,
    authInitialized
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
} 