import {
  signInWithPhoneNumber,
  RecaptchaVerifier,
  ConfirmationResult,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { auth } from './firebase';
import { logger } from './logger';

let confirmationResult: ConfirmationResult | null = null;
let recaptchaVerifier: RecaptchaVerifier | null = null;

/**
 * Initialize the invisible reCAPTCHA verifier.
 * Must be called before sendOtp, and the container element must exist in the DOM.
 */
export const initRecaptcha = (containerId: string = 'recaptcha-container'): void => {
  if (recaptchaVerifier) return;

  recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
    size: 'invisible',
    callback: () => {
      logger.info('reCAPTCHA solved');
    },
    'expired-callback': () => {
      logger.warn('reCAPTCHA expired, re-rendering');
      recaptchaVerifier = null;
    },
  });
};

/**
 * Send an OTP to the given phone number.
 * Phone number must be in E.164 format, e.g., +919876543210
 */
export const sendOtp = async (phoneNumber: string): Promise<boolean> => {
  try {
    if (!recaptchaVerifier) {
      initRecaptcha();
    }
    confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier!);
    return true;
  } catch (error: unknown) {
    const firebaseError = error as { code?: string; message?: string };
    logger.error('Failed to send OTP:', firebaseError.message);
    throw new Error(
      firebaseError.code === 'auth/invalid-phone-number'
        ? 'Invalid phone number. Use format: +91XXXXXXXXXX'
        : firebaseError.code === 'auth/too-many-requests'
        ? 'Too many requests. Please try again later.'
        : 'Failed to send OTP. Please try again.'
    );
  }
};

/**
 * Verify the OTP code entered by the user.
 * Returns the Firebase User on success.
 */
export const verifyOtp = async (code: string): Promise<User> => {
  if (!confirmationResult) {
    throw new Error('No OTP was sent. Please request a new one.');
  }

  try {
    const result = await confirmationResult.confirm(code);
    confirmationResult = null;
    return result.user;
  } catch (error: unknown) {
    const firebaseError = error as { code?: string; message?: string };
    logger.error('OTP verification failed:', firebaseError.message);
    throw new Error(
      firebaseError.code === 'auth/invalid-verification-code'
        ? 'Invalid code. Please check and try again.'
        : firebaseError.code === 'auth/code-expired'
        ? 'Code expired. Please request a new OTP.'
        : 'Verification failed. Please try again.'
    );
  }
};

/**
 * Sign out the current user.
 */
export const signOutUser = async (): Promise<void> => {
  await firebaseSignOut(auth);
  confirmationResult = null;
  recaptchaVerifier = null;
};

/**
 * Listen for auth state changes.
 * Returns an unsubscribe function.
 */
export const onAuthChange = (callback: (user: User | null) => void): (() => void) => {
  return onAuthStateChanged(auth, callback);
};
