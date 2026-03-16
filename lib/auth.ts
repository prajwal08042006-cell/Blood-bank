import {
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
  ActionCodeSettings,
} from 'firebase/auth';
import { auth } from './firebase';
import { logger } from './logger';

const EMAIL_KEY = 'bloodlife_signin_email';

/**
 * Get the action code settings for email link sign-in.
 * The URL must be whitelisted in Firebase Console → Authentication → Settings → Authorized domains.
 */
const getActionCodeSettings = (): ActionCodeSettings => ({
  url: window.location.origin + '/#/login',
  handleCodeInApp: true,
});

/**
 * Send a sign-in link to the user's email.
 */
export const sendSignInLink = async (email: string): Promise<boolean> => {
  try {
    await sendSignInLinkToEmail(auth, email, getActionCodeSettings());
    // Save the email locally so we can complete sign-in when user clicks the link
    window.localStorage.setItem(EMAIL_KEY, email);
    return true;
  } catch (error: unknown) {
    const firebaseError = error as { code?: string; message?: string };
    logger.error('Failed to send sign-in link:', firebaseError.message);
    throw new Error(
      firebaseError.code === 'auth/invalid-email'
        ? 'Invalid email address. Please check and try again.'
        : firebaseError.code === 'auth/missing-email'
        ? 'Please enter your email address.'
        : 'Failed to send verification email. Please try again.'
    );
  }
};

/**
 * Complete email link sign-in.
 * Call this when the app loads to check if user arrived via an email link.
 * Returns the authenticated User on success, null if not an email link.
 */
export const completeSignIn = async (url: string): Promise<User | null> => {
  if (!isSignInWithEmailLink(auth, url)) {
    return null;
  }

  // Get the email from localStorage (saved when we sent the link)
  let email = window.localStorage.getItem(EMAIL_KEY);

  // If no email in storage (e.g., different device), prompt the user
  if (!email) {
    email = window.prompt('Please enter the email you used to sign in:');
  }

  if (!email) {
    throw new Error('Email is required to complete sign-in.');
  }

  try {
    const result = await signInWithEmailLink(auth, email, url);
    // Clear the stored email
    window.localStorage.removeItem(EMAIL_KEY);
    return result.user;
  } catch (error: unknown) {
    const firebaseError = error as { code?: string; message?: string };
    logger.error('Email link sign-in failed:', firebaseError.message);
    throw new Error(
      firebaseError.code === 'auth/invalid-action-code'
        ? 'This link has expired or already been used. Please request a new one.'
        : firebaseError.code === 'auth/invalid-email'
        ? 'Email mismatch. Please use the same email you signed in with.'
        : 'Sign-in failed. Please try again.'
    );
  }
};

/**
 * Check if the current URL is a sign-in link.
 */
export const isEmailSignInLink = (url: string): boolean => {
  return isSignInWithEmailLink(auth, url);
};

/**
 * Sign out the current user.
 */
export const signOutUser = async (): Promise<void> => {
  await firebaseSignOut(auth);
};

/**
 * Listen for auth state changes.
 * Returns an unsubscribe function.
 */
export const onAuthChange = (callback: (user: User | null) => void): (() => void) => {
  return onAuthStateChanged(auth, callback);
};
