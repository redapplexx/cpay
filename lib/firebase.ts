// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCWxp7qdp-6OCTFhBbk775qnK_2Rgx9zN0",
  authDomain: "cpay-f149i.firebaseapp.com",
  projectId: "cpay-f149i",
  storageBucket: "cpay-f149i.appspot.com",
  messagingSenderId: "78405214080",
  appId: "1:78405214080:web:your-app-id-here"
};

// Initialize Firebase for either client or server-side
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app);

export { app, auth, db, functions };
