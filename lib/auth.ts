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
    // Send verification email
    await sendEmailVerification(credential.user);
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
      // Resend verification email
      await sendEmailVerification(credential.user);
      await firebaseSignOut(auth);
      throw new Error('EMAIL_NOT_VERIFIED');
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
 * Returns an unsubscribe function.
 */
export const onAuthChange = (callback: (user: User | null) => void): (() => void) => {
  return onAuthStateChanged(auth, callback);
};
