/**
 * Maps Firebase Auth error codes to helpful, user-friendly messages.
 * Prevents raw technical exceptions or cryptic codes from confusing learners.
 */
export function isOperationNotAllowed(error: any): boolean {
  if (!error) return false;
  const code = (error.code || '').toLowerCase();
  const message = (error.message || '').toLowerCase();
  return (
    code === 'auth/operation-not-allowed' || 
    message.includes('operation-not-allowed') ||
    message.includes('not yet enabled')
  );
}

export function isUnauthorizedDomain(error: any): boolean {
  if (!error) return false;
  const code = (error.code || '').toLowerCase();
  const message = (error.message || '').toLowerCase();
  return code === 'auth/unauthorized-domain' || message.includes('unauthorized-domain');
}

export const FIREBASE_AUTH_PROVIDERS_URL = 
  'https://console.firebase.google.com/project/sharemarket-b8832/authentication/providers';

export const FIREBASE_AUTH_SETTINGS_URL = 
  'https://console.firebase.google.com/project/sharemarket-b8832/authentication/settings';

export function getFriendlyAuthErrorMessage(error: any, mode: 'login' | 'signup' = 'login'): string {
  if (!error) return 'An unexpected error occurred. Please try again.';

  const code = (error.code || '').toLowerCase();
  const message = (error.message || '').toLowerCase();

  // Explicit check for domain authorization
  if (code === 'auth/unauthorized-domain' || message.includes('unauthorized-domain')) {
    const domain = typeof window !== 'undefined' ? window.location.hostname : 'current preview domain';
    return `Google Sign-In domain authorization needed: "${domain}" is not listed under Authorized Domains in your Firebase project.`;
  }

  // Explicit check for disabled operation
  if (code === 'auth/operation-not-allowed' || message.includes('operation-not-allowed')) {
    return 'Email/Password sign-in is not yet enabled in the Firebase Console. Please click "Get started" / enable Email/Password under Authentication > Sign-in method.';
  }

  const rawMsg = error.message || '';
  if (
    rawMsg.startsWith('Email/Password sign-in is not yet enabled') ||
    rawMsg.startsWith('Email/Password sign-up is not yet enabled') ||
    rawMsg === 'User already exists. Please sign in' ||
    rawMsg === 'Email or password is incorrect' ||
    rawMsg === 'Please enter a valid email address.' ||
    rawMsg === 'Password should be at least 6 characters.'
  ) {
    return rawMsg;
  }

  // If email already exists on sign-up
  if (
    code === 'auth/email-already-in-use' ||
    message.includes('email-already-in-use') ||
    message.includes('email_exists')
  ) {
    return 'User already exists. Please sign in';
  }

  // If credentials are incorrect during sign-in
  if (
    code === 'auth/invalid-credential' ||
    code === 'auth/wrong-password' ||
    code === 'auth/user-not-found' ||
    code === 'auth/invalid-login-credentials' ||
    message.includes('invalid-credential') ||
    message.includes('wrong-password') ||
    message.includes('user-not-found') ||
    message.includes('invalid_login_credentials') ||
    (mode === 'login' && (code === 'auth/invalid-email' || message.includes('invalid-email')))
  ) {
    return 'Email or password is incorrect';
  }

  switch (code) {
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';

    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support.';

    case 'auth/weak-password':
      return 'Your password is too weak. Please use at least 6 characters.';

    case 'auth/popup-blocked':
      return 'The sign-in popup was blocked by your browser. Please allow popups for this site or use email & password.';

    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'The sign-in window was closed before completion. Please try again.';

    case 'auth/account-exists-with-different-credential':
      return 'An account already exists with the same email using a different sign-in method (e.g. Google or Password).';

    case 'auth/network-request-failed':
      return 'Network connection error. Please check your internet connection and try again.';

    case 'auth/too-many-requests':
      return 'Access to this account has been temporarily disabled due to many failed login attempts. Please wait a few minutes or reset your password.';

    case 'auth/requires-recent-login':
      return 'For security reasons, this action requires you to log in again.';

    default: {
      if (mode === 'login' && !message.includes('firebase')) {
        return 'Email or password is incorrect';
      }
      // Clean up common Firebase prefix if present
      if (rawMsg.includes('Firebase:')) {
        return rawMsg.replace(/^Firebase:\s*/, '').replace(/\s*\([^)]*\)\.?$/, '');
      }
      return rawMsg || 'Authentication failed. Please try again.';
    }
  }
}
