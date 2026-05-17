import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
// Firebase Storage removed — files are stored as base64 in Firestore (works on Spark plan)
import { logger } from './logger';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Validate that required Firebase config values are present
const missingKeys = Object.entries(firebaseConfig)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missingKeys.length > 0) {
  logger.error(
    `Firebase config is missing required values: ${missingKeys.join(', ')}. ` +
    'Check your .env.local file.'
  );
}

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
// storage export removed — no longer using Firebase Storage

// Set auth persistence explicitly to prevent stale token refresh issues.
// This ensures Firebase uses localStorage and gracefully handles invalid cached tokens.
setPersistence(auth, browserLocalPersistence).catch((err) => {
  logger.error('Failed to set auth persistence:', err);
});

export default app;
