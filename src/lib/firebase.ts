import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCcNWqfYbC5Nyy5eoPynZRQYxzxTzuhu60",
  authDomain: "tuned-storm-js7sz.firebaseapp.com",
  projectId: "tuned-storm-js7sz",
  storageBucket: "tuned-storm-js7sz.firebasestorage.app",
  messagingSenderId: "314843328950",
  appId: "1:314843328950:web:91bca60cb1b49ac7179117"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

// Use the exact firestore database ID from our firebase-applet-config.json
export const db = getFirestore(app, "ai-studio-grammarwizardmcq-adfff1d7-6817-4ec8-842c-2d79700391fe");
