import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail,
  type User 
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import firebaseConfigJson from '../../firebase-applet-config.json';
import { 
  UserProfile, 
  UserProgress, 
  PaperPortfolio, 
  TradeOrder, 
  JournalEntry, 
  UserSettings 
} from '../types';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfigJson) : getApp();

// Firebase Authentication (real cloud authentication)
export const auth = getAuth(app);

// Cloud Firestore Database (real persistent database)
export const db = firebaseConfigJson.firestoreDatabaseId && firebaseConfigJson.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firebaseConfigJson.firestoreDatabaseId)
  : getFirestore(app);

// Google OAuth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Firestore Error Handling Interface conforming to AI Studio Firebase Skill
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      providerInfo: auth.currentUser?.providerData?.map((p) => ({
        providerId: p.providerId,
        email: p.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.warn('Firestore Error Notice:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Track whether Firestore backend is provisioned and reachable
let firestoreOnline = true;

// Test connection on boot to verify Firestore availability
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await Promise.race([
      getDocFromServer(doc(db, 'test', 'connection')),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('the client is offline')), 1500)
      ),
    ]);
    firestoreOnline = true;
    return true;
  } catch (error: any) {
    if (error?.code === 'permission-denied') {
      // Security rules are active and properly rejecting unauthenticated probe
      firestoreOnline = true;
      return true;
    }
    const errMsg = (error?.message || String(error)).toLowerCase();
    if (errMsg.includes('offline') || errMsg.includes('not-found') || errMsg.includes('unavailable')) {
      firestoreOnline = false;
      console.warn('Firebase connection: Client is offline.');
      return false;
    }
    return true;
  }
}
void testFirestoreConnection();

// Auth session user interface for backward compatibility
export interface AuthSessionUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
}

// Default initial values
export const DEFAULT_VIRTUAL_CASH = 100000; // ₹1,00,000

export const DEFAULT_PROGRESS: UserProgress = {
  overallProgress: 0,
  currentModuleId: 'mod_1',
  currentLessonId: 'les_1_1',
  completedLessons: [],
  completedModules: [],
  quizScores: {},
  quizAnswers: {},
  lastVisitedAt: new Date().toISOString(),
  learningStreakDays: 1,
  lastStreakDate: new Date().toISOString().split('T')[0],
  currentStreak: 0,
  longestStreak: 0,
  lastActiveDate: new Date().toISOString().split('T')[0],
  todayCompleted: false,
  totalActiveDays: 0,
  weeklyActivity: {},
};

export const DEFAULT_PORTFOLIO: PaperPortfolio = {
  virtualCash: DEFAULT_VIRTUAL_CASH,
  realizedPnL: 0,
  positions: {},
  lastUpdated: new Date().toISOString(),
};

export const DEFAULT_SETTINGS: UserSettings = {
  theme: 'royal_blue',
  defaultExplanationMode: 'eli15',
  soundEffects: true,
  notifications: true,
  audioFeedback: false,
};

// Real Firebase Auth state listener (Source of Truth)
export function onAuthStateChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, (firebaseUser) => {
    callback(firebaseUser);
  });
}

// Real Sign Out from Firebase
export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

/**
 * Sign In with Email and Password
 * Uses real Firebase Authentication.
 */
export async function authenticateSignIn(email: string, pass: string): Promise<User> {
  const cleanEmail = email.trim().toLowerCase();
  const password = pass.trim();

  if (!cleanEmail || !password) {
    throw new Error('Please enter both email and password.');
  }

  try {
    const cred = await signInWithEmailAndPassword(auth, cleanEmail, password);
    return cred.user;
  } catch (err: any) {
    const code = (err?.code || '').toLowerCase();
    const msg = (err?.message || '').toLowerCase();

    if (code === 'auth/operation-not-allowed' || msg.includes('operation-not-allowed')) {
      throw new Error(
        'Email/Password sign-in is not yet enabled in the Firebase Console. Please enable Email/Password under Authentication > Sign-in method in the Firebase Console, or use Google Sign-In.'
      );
    }

    if (
      code === 'auth/invalid-credential' ||
      code === 'auth/wrong-password' ||
      code === 'auth/user-not-found' ||
      code === 'auth/invalid-login-credentials' ||
      msg.includes('invalid-credential') ||
      msg.includes('wrong-password') ||
      msg.includes('user-not-found')
    ) {
      throw new Error('Email or password is incorrect');
    }

    if (code === 'auth/invalid-email' || msg.includes('invalid-email')) {
      throw new Error('Please enter a valid email address.');
    }

    if (code === 'auth/too-many-requests' || msg.includes('too-many-requests')) {
      throw new Error('Too many failed login attempts. Please wait a few moments or reset your password.');
    }

    throw new Error(err.message || 'Email or password is incorrect');
  }
}

/**
 * Sign Up with Email and Password
 * Creates Firebase Auth account and initializes Firestore user profile.
 */
export async function authenticateSignUp(email: string, pass: string): Promise<User> {
  const cleanEmail = email.trim().toLowerCase();
  const password = pass.trim();

  if (!cleanEmail) {
    throw new Error('Please enter a valid email address.');
  }

  if (password.length < 6) {
    throw new Error('Password should be at least 6 characters.');
  }

  try {
    const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
    const uid = cred.user.uid;

    // Create the initial user profile in cache and Firestore
    const initialProfile: UserProfile = {
      uid,
      displayName: cleanEmail.split('@')[0],
      email: cleanEmail,
      avatarId: 'avatar_investor',
      currency: 'INR',
      theme: 'royal_blue',
      onboardingCompleted: false,
      appIntroductionCompleted: false,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };

    setCachedUserProfile(uid, initialProfile);

    if (firestoreOnline) {
      void Promise.allSettled([
        setDoc(doc(db, 'users', uid), sanitizeForFirestore(initialProfile), { merge: true }),
        setDoc(doc(db, 'users', uid, 'data', 'progress'), sanitizeForFirestore(DEFAULT_PROGRESS), { merge: true }),
        setDoc(doc(db, 'users', uid, 'data', 'portfolio'), sanitizeForFirestore(DEFAULT_PORTFOLIO), { merge: true }),
        setDoc(doc(db, 'users', uid, 'data', 'settings'), sanitizeForFirestore(DEFAULT_SETTINGS), { merge: true }),
      ]);
    }

    return cred.user;
  } catch (err: any) {
    const code = (err?.code || '').toLowerCase();
    const msg = (err?.message || '').toLowerCase();

    if (
      code === 'auth/email-already-in-use' ||
      msg.includes('email-already-in-use') ||
      msg.includes('email_exists')
    ) {
      throw new Error('User already exists. Please sign in');
    }

    if (code === 'auth/operation-not-allowed' || msg.includes('operation-not-allowed')) {
      throw new Error(
        'Email/Password sign-up is not yet enabled in the Firebase Console. Please enable Email/Password under Authentication > Sign-in method in the Firebase Console, or use Google Sign-In.'
      );
    }

    if (code === 'auth/weak-password' || msg.includes('weak-password')) {
      throw new Error('Password should be at least 6 characters.');
    }

    if (code === 'auth/invalid-email' || msg.includes('invalid-email')) {
      throw new Error('Please enter a valid email address.');
    }

    throw new Error(err.message || 'Registration failed. Please try again.');
  }
}

/**
 * Sign In with Google Provider
 * Authenticates via popup, checks Firestore profile, and bootstraps if new.
 */
export async function authenticateGoogle(): Promise<{ user: User; isNewUser: boolean }> {
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;
  const uid = user.uid;

  let isNewUser = false;
  try {
    const userDocRef = doc(db, 'users', uid);
    const snap = await getDoc(userDocRef);

    if (!snap.exists()) {
      isNewUser = true;
      const initialProfile: UserProfile = {
        uid,
        displayName: user.displayName || (user.email ? user.email.split('@')[0] : 'Learner'),
        email: user.email || '',
        photoURL: user.photoURL || undefined,
        avatarId: 'avatar_investor',
        currency: 'INR',
        theme: 'royal_blue',
        onboardingCompleted: false,
        appIntroductionCompleted: false,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };
      await setDoc(userDocRef, initialProfile);
      await setDoc(doc(db, 'users', uid, 'data', 'progress'), DEFAULT_PROGRESS);
      await setDoc(doc(db, 'users', uid, 'data', 'portfolio'), DEFAULT_PORTFOLIO);
      await setDoc(doc(db, 'users', uid, 'data', 'settings'), DEFAULT_SETTINGS);
    } else {
      const data = snap.data() as UserProfile;
      isNewUser = !data.onboardingCompleted;
      await setDoc(userDocRef, { lastLoginAt: new Date().toISOString() }, { merge: true });
    }
  } catch (e) {
    console.warn('Google sign-in profile sync note:', e);
  }

  return { user, isNewUser };
}

// -------------------------------------------------------------
// Firestore User Profile & Data Services with User-Scoped Cache
// -------------------------------------------------------------
function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined || typeof data !== 'object') {
    return data;
  }
  if (Array.isArray(data)) {
    return data.map((item) => sanitizeForFirestore(item)) as unknown as T;
  }
  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(data as Record<string, any>)) {
    if (value !== undefined) {
      clean[key] = sanitizeForFirestore(value);
    }
  }
  return clean as T;
}

const memoryStorage = new Map<string, string>();

function getStorageItem(key: string): string | null {
  try {
    if (typeof localStorage !== 'undefined') {
      const val = localStorage.getItem(key);
      if (val !== null) return val;
    }
  } catch {
    // Ignore storage access errors
  }
  return memoryStorage.get(key) ?? null;
}

function setStorageItem(key: string, value: string): void {
  memoryStorage.set(key, value);
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, value);
    }
  } catch {
    // Ignore storage quota errors
  }
}

function removeStorageItem(key: string): void {
  memoryStorage.delete(key);
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(key);
    }
  } catch {
    // Ignore storage errors
  }
}

function isOfflineOrUnprovisionedError(error: any): boolean {
  const errMsg = (error?.message || String(error)).toLowerCase();
  const code = (error?.code || '').toLowerCase();
  return (
    errMsg.includes('not-found') ||
    errMsg.includes('timed out') ||
    errMsg.includes('unavailable') ||
    errMsg.includes('offline') ||
    code.includes('not-found') ||
    code.includes('unavailable')
  );
}

export function getCachedUserProfile(uid: string): UserProfile | null {
  try {
    const raw = getStorageItem(`smll_user_profile_${uid}`);
    if (raw) return JSON.parse(raw);
  } catch {
    // Ignore storage parse error
  }
  return null;
}

export function setCachedUserProfile(uid: string, profile: UserProfile): void {
  try {
    setStorageItem(`smll_user_profile_${uid}`, JSON.stringify(profile));
  } catch {
    // Ignore storage quota error
  }
}

export async function fetchUserProfile(uid: string): Promise<UserProfile | null> {
  const path = `users/${uid}`;
  const cached = getCachedUserProfile(uid);

  if (!firestoreOnline) {
    return cached;
  }

  try {
    const snap = await Promise.race([
      getDoc(doc(db, 'users', uid)),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Firestore connection timed out.')), 1800)
      ),
    ]);

    if (snap.exists()) {
      const data = snap.data() as UserProfile;
      setCachedUserProfile(uid, data);
      return data;
    }

    return cached;
  } catch (error: any) {
    if (isOfflineOrUnprovisionedError(error)) {
      firestoreOnline = false;
      return cached;
    }
    if (cached) {
      return cached;
    }
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function saveUserProfile(uid: string, profile: Partial<UserProfile>): Promise<void> {
  const existing = getCachedUserProfile(uid);
  const updated = sanitizeForFirestore({ ...(existing || {}), ...profile, uid } as UserProfile);
  setCachedUserProfile(uid, updated);

  if (!firestoreOnline) {
    return;
  }

  try {
    await Promise.race([
      setDoc(doc(db, 'users', uid), sanitizeForFirestore({ ...profile, uid }), { merge: true }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Firestore save timed out.')), 1800)
      ),
    ]);
  } catch (error: any) {
    if (isOfflineOrUnprovisionedError(error)) {
      firestoreOnline = false;
      return;
    }
    console.warn('Firestore save notice:', error?.message || error);
  }
}

export async function checkUsernameAvailability(
  username: string, 
  currentUid?: string
): Promise<{ available: boolean; reason?: string }> {
  const normalized = username.trim().toLowerCase();
  if (!normalized) {
    return { available: false, reason: 'Username cannot be empty.' };
  }

  if (!firestoreOnline) {
    return { available: true };
  }

  try {
    const snap = await Promise.race([
      getDoc(doc(db, 'usernames', normalized)),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Check timed out')), 1500)
      ),
    ]);
    if (!snap.exists()) {
      return { available: true };
    }
    const data = snap.data();
    if (currentUid && data?.uid === currentUid) {
      return { available: true };
    }
    return { available: false, reason: 'This username is already taken. Please choose another.' };
  } catch (error: any) {
    if (isOfflineOrUnprovisionedError(error)) {
      firestoreOnline = false;
    }
    return { available: true };
  }
}

export async function saveUserProfileWithUsername(
  uid: string, 
  updatedProfile: UserProfile, 
  previousUsername?: string
): Promise<{ success: boolean; error?: string }> {
  const cleanProfile = sanitizeForFirestore(updatedProfile);
  setCachedUserProfile(uid, cleanProfile);

  if (!firestoreOnline) {
    return { success: true };
  }

  try {
    const batch = writeBatch(db);

    // 1. Update user profile document
    const userDocRef = doc(db, 'users', uid);
    batch.set(userDocRef, cleanProfile, { merge: true });

    // 2. Update username registry if username is provided
    const newUsername = updatedProfile.username ? updatedProfile.username.trim().toLowerCase() : '';
    const oldUsername = previousUsername ? previousUsername.trim().toLowerCase() : '';

    if (newUsername && newUsername !== oldUsername) {
      const newUsernameRef = doc(db, 'usernames', newUsername);
      batch.set(newUsernameRef, {
        uid,
        username: updatedProfile.username,
        updatedAt: new Date().toISOString(),
      });

      if (oldUsername) {
        const oldUsernameRef = doc(db, 'usernames', oldUsername);
        batch.delete(oldUsernameRef);
      }
    }

    await Promise.race([
      batch.commit(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Batch commit timed out')), 1800)
      ),
    ]);
    return { success: true };
  } catch (error: any) {
    if (isOfflineOrUnprovisionedError(error)) {
      firestoreOnline = false;
    }
    return { success: true };
  }
}

// -------------------------------------------------------------
// Firestore User Progress Service
// -------------------------------------------------------------
export async function fetchUserProgress(uid: string): Promise<UserProgress> {
  const path = `users/${uid}/data/progress`;
  const cachedRaw = getStorageItem(`smll_user_progress_${uid}`);
  const cached: UserProgress | null = cachedRaw ? JSON.parse(cachedRaw) : null;

  if (!firestoreOnline) {
    return cached || DEFAULT_PROGRESS;
  }

  try {
    const snap = await Promise.race([
      getDoc(doc(db, 'users', uid, 'data', 'progress')),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Firestore progress read timed out')), 1500)
      ),
    ]);
    if (snap.exists()) {
      const data = snap.data() as UserProgress;
      setStorageItem(`smll_user_progress_${uid}`, JSON.stringify(data));
      return data;
    }
    return cached || DEFAULT_PROGRESS;
  } catch (error: any) {
    if (isOfflineOrUnprovisionedError(error)) {
      firestoreOnline = false;
      return cached || DEFAULT_PROGRESS;
    }
    if (cached) return cached;
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function saveUserProgress(uid: string, progress: UserProgress): Promise<void> {
  const path = `users/${uid}/data/progress`;
  setStorageItem(`smll_user_progress_${uid}`, JSON.stringify(progress));

  if (!firestoreOnline) {
    return;
  }

  try {
    await Promise.race([
      setDoc(doc(db, 'users', uid, 'data', 'progress'), sanitizeForFirestore(progress), { merge: true }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Firestore progress write timed out')), 1500)
      ),
    ]);
  } catch (error: any) {
    if (isOfflineOrUnprovisionedError(error)) {
      firestoreOnline = false;
      return;
    }
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// -------------------------------------------------------------
// Firestore Paper Portfolio Service
// -------------------------------------------------------------
export async function fetchPaperPortfolio(uid: string): Promise<PaperPortfolio> {
  const path = `users/${uid}/data/portfolio`;
  const cachedRaw = getStorageItem(`smll_user_portfolio_${uid}`);
  const cached: PaperPortfolio | null = cachedRaw ? JSON.parse(cachedRaw) : null;

  if (!firestoreOnline) {
    return cached || DEFAULT_PORTFOLIO;
  }

  try {
    const snap = await Promise.race([
      getDoc(doc(db, 'users', uid, 'data', 'portfolio')),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Firestore portfolio read timed out')), 1500)
      ),
    ]);
    if (snap.exists()) {
      const data = snap.data() as PaperPortfolio;
      setStorageItem(`smll_user_portfolio_${uid}`, JSON.stringify(data));
      return data;
    }
    return cached || DEFAULT_PORTFOLIO;
  } catch (error: any) {
    if (isOfflineOrUnprovisionedError(error)) {
      firestoreOnline = false;
      return cached || DEFAULT_PORTFOLIO;
    }
    if (cached) return cached;
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function savePaperPortfolio(uid: string, portfolio: PaperPortfolio): Promise<void> {
  const path = `users/${uid}/data/portfolio`;
  setStorageItem(`smll_user_portfolio_${uid}`, JSON.stringify(portfolio));

  if (!firestoreOnline) {
    return;
  }

  try {
    await Promise.race([
      setDoc(doc(db, 'users', uid, 'data', 'portfolio'), sanitizeForFirestore(portfolio), { merge: true }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Firestore portfolio write timed out')), 1500)
      ),
    ]);
  } catch (error: any) {
    if (isOfflineOrUnprovisionedError(error)) {
      firestoreOnline = false;
      return;
    }
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// -------------------------------------------------------------
// Firestore Trade History Service
// -------------------------------------------------------------
export async function fetchTradeHistory(uid: string): Promise<TradeOrder[]> {
  const path = `users/${uid}/trades`;
  const cachedRaw = getStorageItem(`smll_user_trades_${uid}`);
  const cached: TradeOrder[] = cachedRaw ? JSON.parse(cachedRaw) : [];

  if (!firestoreOnline) {
    return cached;
  }

  try {
    const snap = await Promise.race([
      getDocs(collection(db, 'users', uid, 'trades')),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Firestore trades read timed out')), 1500)
      ),
    ]);
    const trades: TradeOrder[] = [];
    snap.forEach((docSnap) => {
      trades.push(docSnap.data() as TradeOrder);
    });
    trades.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    setStorageItem(`smll_user_trades_${uid}`, JSON.stringify(trades));
    return trades;
  } catch (error: any) {
    if (isOfflineOrUnprovisionedError(error)) {
      firestoreOnline = false;
      return cached;
    }
    if (cached.length > 0) return cached;
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function saveTradeOrder(uid: string, order: TradeOrder): Promise<void> {
  const path = `users/${uid}/trades/${order.id}`;
  const cachedRaw = getStorageItem(`smll_user_trades_${uid}`);
  const cached: TradeOrder[] = cachedRaw ? JSON.parse(cachedRaw) : [];
  const updated = [order, ...cached.filter((t) => t.id !== order.id)];
  setStorageItem(`smll_user_trades_${uid}`, JSON.stringify(updated));

  if (!firestoreOnline) {
    return;
  }

  try {
    await Promise.race([
      setDoc(doc(db, 'users', uid, 'trades', order.id), sanitizeForFirestore(order)),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Firestore trade write timed out')), 1500)
      ),
    ]);
  } catch (error: any) {
    if (isOfflineOrUnprovisionedError(error)) {
      firestoreOnline = false;
      return;
    }
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// -------------------------------------------------------------
// Firestore Journal Service
// -------------------------------------------------------------
export async function fetchJournalEntries(uid: string): Promise<JournalEntry[]> {
  const path = `users/${uid}/journal`;
  const cachedRaw = getStorageItem(`smll_user_journal_${uid}`);
  const cached: JournalEntry[] = cachedRaw ? JSON.parse(cachedRaw) : [];

  if (!firestoreOnline) {
    return cached;
  }

  try {
    const snap = await Promise.race([
      getDocs(collection(db, 'users', uid, 'journal')),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Firestore journal read timed out')), 1500)
      ),
    ]);
    const entries: JournalEntry[] = [];
    snap.forEach((docSnap) => {
      entries.push(docSnap.data() as JournalEntry);
    });
    entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    setStorageItem(`smll_user_journal_${uid}`, JSON.stringify(entries));
    return entries;
  } catch (error: any) {
    if (isOfflineOrUnprovisionedError(error)) {
      firestoreOnline = false;
      return cached;
    }
    if (cached.length > 0) return cached;
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function saveJournalEntry(uid: string, entry: JournalEntry): Promise<void> {
  const path = `users/${uid}/journal/${entry.id}`;
  const cachedRaw = getStorageItem(`smll_user_journal_${uid}`);
  const cached: JournalEntry[] = cachedRaw ? JSON.parse(cachedRaw) : [];
  const updated = [entry, ...cached.filter((e) => e.id !== entry.id)];
  setStorageItem(`smll_user_journal_${uid}`, JSON.stringify(updated));

  if (!firestoreOnline) {
    return;
  }

  try {
    await Promise.race([
      setDoc(doc(db, 'users', uid, 'journal', entry.id), sanitizeForFirestore(entry)),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Firestore journal write timed out')), 1500)
      ),
    ]);
  } catch (error: any) {
    if (isOfflineOrUnprovisionedError(error)) {
      firestoreOnline = false;
      return;
    }
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// -------------------------------------------------------------
// Firestore User Settings Service
// -------------------------------------------------------------
export async function fetchUserSettings(uid: string): Promise<UserSettings> {
  const path = `users/${uid}/data/settings`;
  const cachedRaw = getStorageItem(`smll_user_settings_${uid}`);
  const cached: UserSettings | null = cachedRaw ? JSON.parse(cachedRaw) : null;

  if (!firestoreOnline) {
    return cached || DEFAULT_SETTINGS;
  }

  try {
    const snap = await Promise.race([
      getDoc(doc(db, 'users', uid, 'data', 'settings')),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Firestore settings read timed out')), 1500)
      ),
    ]);
    if (snap.exists()) {
      const data = snap.data() as UserSettings;
      setStorageItem(`smll_user_settings_${uid}`, JSON.stringify(data));
      return data;
    }
    return cached || DEFAULT_SETTINGS;
  } catch (error: any) {
    if (isOfflineOrUnprovisionedError(error)) {
      firestoreOnline = false;
      return cached || DEFAULT_SETTINGS;
    }
    if (cached) return cached;
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function saveUserSettings(uid: string, settings: UserSettings): Promise<void> {
  const path = `users/${uid}/data/settings`;
  setStorageItem(`smll_user_settings_${uid}`, JSON.stringify(settings));

  if (!firestoreOnline) {
    return;
  }

  try {
    await Promise.race([
      setDoc(doc(db, 'users', uid, 'data', 'settings'), sanitizeForFirestore(settings), { merge: true }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Firestore settings write timed out')), 1500)
      ),
    ]);
  } catch (error: any) {
    if (isOfflineOrUnprovisionedError(error)) {
      firestoreOnline = false;
      return;
    }
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// -------------------------------------------------------------
// Reset User Data in Firestore
// -------------------------------------------------------------
export async function resetUserData(uid: string): Promise<void> {
  setStorageItem(`smll_user_progress_${uid}`, JSON.stringify(DEFAULT_PROGRESS));
  setStorageItem(`smll_user_portfolio_${uid}`, JSON.stringify(DEFAULT_PORTFOLIO));
  removeStorageItem(`smll_user_trades_${uid}`);
  removeStorageItem(`smll_user_journal_${uid}`);

  if (!firestoreOnline) {
    return;
  }

  try {
    await Promise.race([
      (async () => {
        await setDoc(doc(db, 'users', uid, 'data', 'progress'), DEFAULT_PROGRESS);
        await setDoc(doc(db, 'users', uid, 'data', 'portfolio'), DEFAULT_PORTFOLIO);

        const tradesSnap = await getDocs(collection(db, 'users', uid, 'trades'));
        const batch = writeBatch(db);
        tradesSnap.forEach((d) => batch.delete(d.ref));

        const journalSnap = await getDocs(collection(db, 'users', uid, 'journal'));
        journalSnap.forEach((d) => batch.delete(d.ref));

        await batch.commit();
      })(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Firestore reset timed out')), 2000)
      ),
    ]);
  } catch (error: any) {
    if (isOfflineOrUnprovisionedError(error)) {
      firestoreOnline = false;
      return;
    }
    handleFirestoreError(error, OperationType.WRITE, `users/${uid}`);
  }
}
