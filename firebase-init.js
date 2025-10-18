// firebase-init.js
// Initialize Firebase and expose auth/firestore helpers on window.
// Replace the firebaseConfig values with your project's config from the Firebase console.

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import { getFirestore, collection, addDoc, serverTimestamp, getDocs, doc, deleteDoc, updateDoc, query, where } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

// Your Firebase project configuration (from Firebase Console -> Project settings)
const firebaseConfig = {
  apiKey: "AIzaSyBbywf6xbjQBEpCbieORb344yQ_tEWEzNI",
  authDomain: "leave-request-form-cd8ae.firebaseapp.com",
  projectId: "leave-request-form-cd8ae",
  storageBucket: "leave-request-form-cd8ae.firebasestorage.app",
  messagingSenderId: "600397575153",
  appId: "1:600397575153:web:0a0b9cc67d3dad96744a50"
};

// Optional list of admin emails (used when Firebase Auth is available).
// You can also implement role-based claims in Firebase for production.
const adminEmails = ["admin@example.com"];

try {
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  // Expose convenient handles and functions to non-module scripts
  window.firebaseApp = app;
  window.firebaseAuth = auth;
  window.firebaseDb = db;
  window.firebaseAuthFns = { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut };
  window.firebaseDbFns = { collection, addDoc, serverTimestamp, getDocs, doc, deleteDoc, updateDoc, query, where };
  window.isAdminEmail = (email) => adminEmails.includes(email);
  console.log('Firebase initialized (check config values).');
} catch (e) {
  console.warn('Firebase init failed (likely placeholder config).', e);
}

