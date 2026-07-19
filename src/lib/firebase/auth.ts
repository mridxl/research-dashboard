import type { RecaptchaVerifier } from 'firebase/auth';
import {
  type ConfirmationResult,
  signInWithPhoneNumber,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth';

import { auth } from './config';

/**
 * Ensures Firebase is signed out before starting a new login flow.
 * This prevents reusing old sessions when switching between users.
 */
export const ensureSignedOut = async (): Promise<void> => {
  try {
    if (auth.currentUser) {
      await firebaseSignOut(auth);
    }
  } catch (error) {
    // Ignore errors - user might not be signed in
    console.warn('Firebase ensureSignedOut error (ignored):', error);
  }
};

export const sendOTP = async (
  phoneNumber: string,
  verifier: RecaptchaVerifier
): Promise<ConfirmationResult> => {
  const formatted = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
  return await signInWithPhoneNumber(auth, formatted, verifier);
};

export const verifyOTP = async (
  confirmationResult: ConfirmationResult,
  code: string
): Promise<User> => {
  const result = await confirmationResult.confirm(code);
  return result.user;
};

interface FirebaseError {
  code?: string;
  message?: string;
}

export const signOut = async (): Promise<void> => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    // Ignore errors - user might not be signed in
    console.warn('Firebase signOut error (ignored):', error);
  }
};

export const getFirebaseError = (error: unknown): string => {
  const firebaseError = error as FirebaseError;
  const errorCode = firebaseError?.code;
  const errorMessages: Record<string, string> = {
    'auth/invalid-phone-number': 'Invalid phone number format',
    'auth/too-many-requests': 'Too many requests. Please try again later',
    'auth/code-expired': 'OTP code has expired. Please request a new one',
    'auth/invalid-verification-code': 'Invalid OTP code. Please try again',
    'auth/session-expired': 'Session expired. Please try again',
  };

  return (errorCode && errorMessages[errorCode]) || firebaseError?.message || 'An error occurred';
};
