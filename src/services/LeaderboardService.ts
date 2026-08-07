import {
  collection,
  doc,
  getDoc,
  getDocsFromServer,
  limit,
  orderBy,
  query,
  setDoc,
} from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { getFirebaseAuth, getFirestoreDb, isFirebaseConfigured } from '../firebase';

export interface LeaderboardEntry {
  rank: number;
  uid: string;
  displayName: string;
  bestScore: number;
}

export type SubmitScoreStatus =
  | 'updated'
  | 'unchanged'
  | 'not-configured'
  | 'no-user'
  | 'no-name'
  | 'invalid-score';

export interface SubmitScoreResult {
  ok: boolean;
  status: SubmitScoreStatus;
}

const DISPLAY_NAME_KEY = 'slashBurst_displayName';

export function getDisplayName(): string {
  return localStorage.getItem(DISPLAY_NAME_KEY) || '';
}

export function setDisplayName(name: string): void {
  localStorage.setItem(DISPLAY_NAME_KEY, name.trim());
}

/**
 * ローカルの表示名を更新し、Firestore に記録があれば displayName も更新する。
 */
export async function updateDisplayName(name: string): Promise<boolean> {
  const trimmed = name.trim();
  if (!trimmed || trimmed.length > 20) {
    return false;
  }

  setDisplayName(trimmed);

  if (!isFirebaseConfigured()) {
    return true;
  }

  const auth = getFirebaseAuth();
  await auth.authStateReady();
  const user = auth.currentUser;
  if (!user) {
    return true; // ローカルだけ更新（未ログイン時）
  }

  try {
    await user.getIdToken(true);
    const db = getFirestoreDb();
    const ref = doc(db, 'users', user.uid);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      return true;
    }

    await setDoc(
      ref,
      {
        displayName: trimmed,
        updatedAt: Date.now(),
      },
      { merge: true }
    );
    return true;
  } catch (error) {
    console.error('[LeaderboardService] updateDisplayName failed:', error);
    return false;
  }
}

export async function submitBestScore(
  score: number,
  user: User | null
): Promise<SubmitScoreResult> {
  if (!isFirebaseConfigured()) {
    return { ok: false, status: 'not-configured' };
  }

  if (!Number.isFinite(score) || score <= 0) {
    return { ok: false, status: 'invalid-score' };
  }

  const displayName = getDisplayName().trim();
  if (!displayName) {
    return { ok: false, status: 'no-name' };
  }

  // ルールは request.auth を見るため、渡された user ではなく Auth の currentUser を使う
  const auth = getFirebaseAuth();
  await auth.authStateReady();
  let authed = auth.currentUser ?? user;
  if (!authed) {
    return { ok: false, status: 'no-user' };
  }

  try {
    await authed.getIdToken(true);
  } catch (error) {
    console.error('[LeaderboardService] getIdToken failed:', error);
    return { ok: false, status: 'no-user' };
  }

  authed = auth.currentUser;
  if (!authed) {
    return { ok: false, status: 'no-user' };
  }

  const db = getFirestoreDb();
  const ref = doc(db, 'users', authed.uid);

  let previousBest = 0;
  try {
    const snap = await getDoc(ref);
    previousBest = Number(snap.data()?.bestScore ?? 0);
  } catch (error) {
    console.warn('[LeaderboardService] getDoc failed, treat as new:', error);
  }

  const nextScore = Math.floor(Number(score));

  if (nextScore <= previousBest) {
    return { ok: true, status: 'unchanged' };
  }

  const payload = {
    displayName,
    bestScore: nextScore,
    updatedAt: Date.now(),
  };

  try {
    await setDoc(ref, payload, { merge: true });
  } catch (error) {
    console.error('[LeaderboardService] setDoc failed:', {
      uid: authed.uid,
      authUid: auth.currentUser?.uid,
      payload,
      error,
    });
    throw error;
  }

  return { ok: true, status: 'updated' };
}

export async function fetchLeaderboard(limitCount = 20): Promise<LeaderboardEntry[]> {
  if (!isFirebaseConfigured()) {
    return [];
  }

  const db = getFirestoreDb();
  const q = query(collection(db, 'users'), orderBy('bestScore', 'desc'), limit(limitCount));
  const snapshot = await getDocsFromServer(q);

  return snapshot.docs.map((entry, index) => ({
    rank: index + 1,
    uid: entry.id,
    displayName: (entry.data().displayName as string) || '名無し',
    bestScore: (entry.data().bestScore as number) ?? 0,
  }));
}
