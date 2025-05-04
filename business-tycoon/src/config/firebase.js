// Mock Firebase implementation for GitHub Pages deployment
// This file replaces actual Firebase calls with local storage implementations

// Mock authentication state
let currentUser = JSON.parse(localStorage.getItem('mockUser')) || null;
let listeners = [];

// Mock Firebase app
const app = {
  name: 'mock-firebase-app',
  options: {}
};

// Mock auth object
const auth = {
  currentUser,
  onAuthStateChanged: (callback) => {
    // Add listener
    listeners.push(callback);
    // Call immediately with current state
    setTimeout(() => callback(currentUser), 0);
    // Return unsubscribe function
    return () => {
      listeners = listeners.filter(listener => listener !== callback);
    };
  }
};

// Mock database
const db = {
  name: 'mock-firestore'
};

// Mock providers
const googleProvider = { id: 'google.com' };
const appleProvider = { id: 'apple.com' };

// Mock authentication functions
function signInWithPopup(auth, provider) {
  const user = {
    uid: 'mock-uid-' + Date.now(),
    email: 'mock@example.com',
    displayName: 'Mock User',
    photoURL: null,
    providerId: provider.id
  };
  localStorage.setItem('mockUser', JSON.stringify(user));
  currentUser = user;
  
  // Notify listeners
  listeners.forEach(callback => callback(user));
  
  return Promise.resolve({ user });
}

function createUserWithEmailAndPassword(auth, email, password) {
  const user = {
    uid: 'mock-email-uid-' + Date.now(),
    email,
    displayName: email.split('@')[0],
    photoURL: null
  };
  localStorage.setItem('mockUser', JSON.stringify(user));
  currentUser = user;
  
  // Notify listeners
  listeners.forEach(callback => callback(user));
  
  return Promise.resolve({ user });
}

function signInWithEmailAndPassword(auth, email, password) {
  return createUserWithEmailAndPassword(auth, email, password);
}

function signOut(auth) {
  localStorage.removeItem('mockUser');
  currentUser = null;
  
  // Notify listeners
  listeners.forEach(callback => callback(null));
  
  return Promise.resolve();
}

function updateProfile(user, profileData) {
  if (currentUser) {
    const updatedUser = { ...currentUser, ...profileData };
    localStorage.setItem('mockUser', JSON.stringify(updatedUser));
    currentUser = updatedUser;
    
    // Notify listeners
    listeners.forEach(callback => callback(updatedUser));
  }
  
  return Promise.resolve();
}

function sendPasswordResetEmail() {
  console.log("Password reset email would be sent in a real implementation");
  return Promise.resolve();
}

function signInAnonymously() {
  const user = {
    uid: 'anon-' + Date.now(),
    isAnonymous: true
  };
  localStorage.setItem('mockUser', JSON.stringify(user));
  currentUser = user;
  
  // Notify listeners
  listeners.forEach(callback => callback(user));
  
  return Promise.resolve({ user });
}

function getRedirectResult() {
  return Promise.resolve(null);
}

function onAuthStateChanged(auth, callback) {
  return auth.onAuthStateChanged(callback);
}

// Mock Firestore functions
function getFirestore() {
  return db;
}

function getAuth() {
  return auth;
}

function doc(db, collection, docId) {
  return { path: `${collection}/${docId}` };
}

function getDoc(docRef) {
  const data = localStorage.getItem(docRef.path);
  return Promise.resolve({
    exists: !!data,
    data: () => data ? JSON.parse(data) : null
  });
}

function setDoc(docRef, data) {
  localStorage.setItem(docRef.path, JSON.stringify(data));
  return Promise.resolve();
}

function updateDoc(docRef, data) {
  const existing = localStorage.getItem(docRef.path);
  let newData;
  
  if (existing) {
    newData = { ...JSON.parse(existing), ...data };
  } else {
    newData = data;
  }
  
  localStorage.setItem(docRef.path, JSON.stringify(newData));
  return Promise.resolve();
}

// Mock initializeApp function
function initializeApp() {
  return app;
}

// Export mocked functions
export { 
  auth, 
  db, 
  googleProvider, 
  appleProvider, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  signInAnonymously,
  getRedirectResult,
  initializeApp,
  getAuth,
  getFirestore
}; 