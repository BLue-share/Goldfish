import { onAuthStateChanged, signInAnonymously, type User } from 'firebase/auth';
import { getFirebaseAuth, isFirebaseConfigured } from '../firebase';

let currentUser: User | null = null;
let authReady: Promise<User | null> | null = null;

export function getCurrentUser(): User | null {
  return currentUser;
}

export function ensureSignedIn(): Promise<User | null> {
  if (!isFirebaseConfigured()) {
    return Promise.resolve(null);
  }

  if (currentUser) {
    return Promise.resolve(currentUser);
  }

  if (authReady) {
    return authReady;
  }

  authReady = (async () => {
    const auth = getFirebaseAuth();

    try {
      // 既存セッションがあれば待つ（最大数秒）
      const existing = await waitForAuthUser(auth, 2500);
      if (existing) {
        currentUser = existing;
        return existing;
      }

      const credential = await signInAnonymously(auth);
      currentUser = credential.user;
      return credential.user;
    } catch (error) {
      console.error('[AuthService] ensureSignedIn failed:', error);
      // 次回呼べるように失敗キャッシュをクリア
      authReady = null;
      currentUser = null;
      return null;
    }
  })();

  // 成功時も authReady は残してよい（currentUser があれば短縮される）
  // 失敗時は上で null に戻す
  return authReady.then((user) => {
    if (!user) {
      authReady = null;
    }
    return user;
  });
}

function waitForAuthUser(
  auth: ReturnType<typeof getFirebaseAuth>,
  timeoutMs: number
): Promise<User | null> {
  return new Promise((resolve) => {
    let settled = false;

    const finish = (user: User | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      unsubscribe();
      resolve(user);
    };

    // 初回コールバックで現在の認証状態が分かる（user または null）
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      finish(user);
    });

    const timer = setTimeout(() => {
      finish(null);
    }, timeoutMs);
  });
}
