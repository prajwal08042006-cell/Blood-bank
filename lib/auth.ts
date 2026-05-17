import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { auth } from './firebase';
import { logger } from './logger';

/**
 * Sign up a new user with email and password.
 * Sends a verification email after account creation.
 * Returns the Firebase User (emailVerified will be false until they click the link).
 */
export const signUp = async (email: string, password: string): Promise<User> => {
  try {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    // Send verification email — wrapped in try/catch so a verification
    // failure doesn't block the entire sign-up flow.
    try {
      await sendEmailVerification(credential.user);
    } catch (verifyErr) {
      logger.error('Verification email failed (non-blocking):', verifyErr);
    }
    return credential.user;
  } catch (error: unknown) {
    const firebaseError = error as { code?: string; message?: string };
    logger.error('Sign up failed:', firebaseError.message);
    throw new Error(
      firebaseError.code === 'auth/email-already-in-use'
        ? 'This email is already registered. Please log in instead.'
        : firebaseError.code === 'auth/invalid-email'
        ? 'Invalid email address.'
        : firebaseError.code === 'auth/weak-password'
        ? 'Password must be at least 6 characters.'
        : firebaseError.code === 'auth/configuration-not-found'
        ? 'Firebase Auth is not configured. Enable Email/Password sign-in in your Firebase Console.'
        : 'Sign up failed. Please try again.'
    );
  }
};

/**
 * Log in an existing user with email and password.
 * Checks if email is verified before allowing access.
 */
export const logIn = async (email: string, password: string): Promise<User> => {
  try {
    const credential = await signInWithEmailAndPassword(auth, email, password);

    if (!credential.user.emailVerified) {
      // Check if this is a seed/demo account that can skip email verification
      const { getDoc, doc } = await import('firebase/firestore');
      const { db } = await import('./firebase');
      const profileDoc = await getDoc(doc(db, 'users', credential.user.uid));
      const isSeedAccount = profileDoc.exists() && profileDoc.data()?.seedAccount === true;

      if (!isSeedAccount) {
        // Resend verification email
        try {
          await sendEmailVerification(credential.user);
        } catch (verifyErr) {
          logger.error('Re-send verification email failed (non-blocking):', verifyErr);
        }
        await firebaseSignOut(auth);
        throw new Error('EMAIL_NOT_VERIFIED');
      }
    }

    return credential.user;
  } catch (error: unknown) {
    const firebaseError = error as { code?: string; message?: string };

    if (firebaseError.message === 'EMAIL_NOT_VERIFIED') {
      throw new Error('Please verify your email first. A new verification link has been sent to your inbox.');
    }
    
    logger.error('Login failed:', firebaseError.message);
    throw new Error(
      firebaseError.code === 'auth/user-not-found'
        ? 'No account found with this email. Please sign up.'
        : firebaseError.code === 'auth/wrong-password'
        ? 'Incorrect password. Please try again.'
        : firebaseError.code === 'auth/invalid-credential'
        ? 'Invalid email or password.'
        : firebaseError.code === 'auth/too-many-requests'
        ? 'Too many failed attempts. Please try again later.'
        : firebaseError.code === 'auth/configuration-not-found'
        ? 'Firebase Auth is not configured. Enable Email/Password sign-in in your Firebase Console.'
        : 'Login failed. Please try again.'
    );
  }
};

/**
 * Resend verification email to the current user.
 */
export const resendVerification = async (): Promise<void> => {
  const user = auth.currentUser;
  if (user && !user.emailVerified) {
    await sendEmailVerification(user);
  }
};

/**
 * Sign out the current user.
 */
export const signOutUser = async (): Promise<void> => {
  await firebaseSignOut(auth);
};

/**
 * Listen for auth state changes.
 * Includes an error callback to gracefully handle token refresh failures
 * (the 400 errors from identitytoolkit.googleapis.com).
 * Returns an unsubscribe function.
 */
export const onAuthChange = (callback: (user: User | null) => void): (() => void) => {
  return onAuthStateChanged(
    auth,
    callback,
    (error) => {
      // This error handler catches token refresh failures and other
      // auth-state errors that would otherwise show as uncaught 400s.
      logger.error('Auth state error (likely stale token):', error);
      // Treat the error as "no user" — the login screen will show.
      callback(null);
    }
  );
};
