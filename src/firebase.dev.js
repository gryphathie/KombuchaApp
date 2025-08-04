// Development Firebase configuration
// This file should be used in the develop branch

import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Development Firebase configuration
// Replace these with your development Firebase project config
const firebaseConfig = {
  apiKey: "YOUR_DEV_API_KEY",
  authDomain: "your-dev-project.firebaseapp.com",
  projectId: "your-dev-project-id",
  storageBucket: "your-dev-project.firebasestorage.app",
  messagingSenderId: "YOUR_DEV_SENDER_ID",
  appId: "YOUR_DEV_APP_ID",
  measurementId: "YOUR_DEV_MEASUREMENT_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app; 