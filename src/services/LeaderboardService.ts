import {
  collection,
  doc,
  getDocFromServer,
  getDocsFromServer,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { getFirestoreDb, isFirebaseConfigured } from '../firebase';

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

  if (!user) {
    return { ok: false, status: 'no-user' };
  }

  const displayName = getDisplayName();
  if (!displayName) {
    return { ok: false, status: 'no-name' };
  }

  const db = getFirestoreDb();
  const ref = doc(db, 'users', user.uid);
  const snap = await getDocFromServer(ref);
  const previousBest = Number(snap.data()?.bestScore ?? 0);
  const nextScore = Math.floor(score);

  if (nextScore <= previousBest) {
    return { ok: true, status: 'unchanged' };
  }

  await setDoc(
    ref,
    {
      displayName,
      bestScore: nextScore,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  return { ok: true, status: 'updated' };
}

export async function fetchLeaderboard(limitCount = 20): Promise<LeaderboardEntry[]> {
  if (!isFirebaseConfigured()) {
    return [];
  }

  const db = getFirestoreDb();
  const q = query(collection(db, 'users'), orderBy('bestScore', 'desc'), limit(limitCount));
  // キャッシュではなくサーバーから取得して他端末の更新をすぐ反映
  const snapshot = await getDocsFromServer(q);

  return snapshot.docs.map((entry, index) => ({
    rank: index + 1,
    uid: entry.id,
    displayName: (entry.data().displayName as string) || '名無し',
    bestScore: (entry.data().bestScore as number) ?? 0,
  }));
}
