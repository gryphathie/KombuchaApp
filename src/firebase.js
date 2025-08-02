// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBj3yBju4j5BNyCsngprs1l7XpeuLlzxAU",
  authDomain: "kombuchaapp.firebaseapp.com",
  projectId: "kombuchaapp",
  storageBucket: "kombuchaapp.firebasestorage.app",
  messagingSenderId: "267416022207",
  appId: "1:267416022207:web:1407cd0c5f9f6f445e2a0a",
  measurementId: "G-BG580BH7XJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;