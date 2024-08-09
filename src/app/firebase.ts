// Import the functions you need from the SDKs you need
import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from 'firebase/firestore';
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBCeZlN7irvxgoZMZ8BPTvauN5fScSwCaA",
  authDomain: "auth-a5899.firebaseapp.com",
  projectId: "auth-a5899",
  storageBucket: "auth-a5899.appspot.com",
  messagingSenderId:"134480971898",
  appId: "1:134480971898:web:adf784fc6bcc0cd76813c3",
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

export { app, db, auth, storage };
