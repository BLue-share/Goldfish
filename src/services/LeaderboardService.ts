import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { getFirestoreDb, isFirebaseConfigured } from '../firebase';
import { getCurrentUser } from './AuthService';

export interface LeaderboardEntry {
  rank: number;
  uid: string;
  displayName: string;
  bestScore: number;
}

const DISPLAY_NAME_KEY = 'slashBurst_displayName';

export function getDisplayName(): string {
  return localStorage.getItem(DISPLAY_NAME_KEY) || '';
}

export function setDisplayName(name: string): void {
  localStorage.setItem(DISPLAY_NAME_KEY, name.trim());
}

export async function submitBestScore(score: number): Promise<boolean> {
  if (!isFirebaseConfigured() || score <= 0) {
    return false;
  }

  const user = getCurrentUser();
  const displayName = getDisplayName();
  if (!user || !displayName) {
    return false;
  }

  const db = getFirestoreDb();
  const ref = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);
  const previousBest = snap.data()?.bestScore ?? 0;
  if (score <= previousBest) {
    return false;
  }

  await setDoc(
    ref,
    {
      displayName,
      bestScore: score,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  return true;
}

export async function fetchLeaderboard(limitCount = 20): Promise<LeaderboardEntry[]> {
  if (!isFirebaseConfigured()) {
    return [];
  }

  const db = getFirestoreDb();
  const q = query(collection(db, 'users'), orderBy('bestScore', 'desc'), limit(limitCount));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((entry, index) => ({
    rank: index + 1,
    uid: entry.id,
    displayName: (entry.data().displayName as string) || '名無し',
    bestScore: (entry.data().bestScore as number) ?? 0,
  }));
}
