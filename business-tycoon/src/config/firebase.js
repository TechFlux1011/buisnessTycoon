import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, OAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyBVdUPrYBGbaBZzD0A6q3ncMsVL2-0ccSs",
    authDomain: "business-tycoon-dac45.firebaseapp.com",
    projectId: "business-tycoon-dac45",
    storageBucket: "business-tycoon-dac45.firebasestorage.app",
    messagingSenderId: "909777324740",
    appId: "1:909777324740:web:af6d9624f3d409321d1791"
  };

// Initialize Firebase first
const app = initializeApp(firebaseConfig);

// Then initialize services
const auth = getAuth(app);
const db = getFirestore(app);

// Initialize providers after auth is ready
const googleProvider = new GoogleAuthProvider();
const appleProvider = new OAuthProvider('apple.com');

// Configure providers
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Ensure everything is initialized before exporting
export { auth, db, googleProvider, appleProvider }; 