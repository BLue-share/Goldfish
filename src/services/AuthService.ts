import {
  onAuthStateChanged,
  signInAnonymously,
  type Auth,
  type User,
} from 'firebase/auth';
import { getFirebaseAuth, isFirebaseConfigured } from '../firebase';

let currentUser: User | null = null;
let authReady: Promise<User | null> | null = null;

export function getCurrentUser(): User | null {
  return currentUser;
}

/**
 * 匿名ログインを保証し、Firestore が request.auth を認識できるよう
 * ID トークンも取得してから User を返す。
 */
export async function ensureSignedIn(): Promise<User | null> {
  if (!isFirebaseConfigured()) {
    return Promise.resolve(null);
  }

  if (currentUser) {
    try {
      await currentUser.getIdToken();
      return currentUser;
    } catch {
      currentUser = null;
      authReady = null;
    }
  }

  if (authReady) {
    return authReady;
  }

  authReady = (async () => {
    const auth = getFirebaseAuth();

    try {
      await auth.authStateReady();

      let user = auth.currentUser;
      if (!user) {
        const existing = await waitForAuthUser(auth, 2000);
        user = existing;
      }

      if (!user) {
        const credential = await signInAnonymously(auth);
        user = credential.user;
      }

      // Firestore ルールの request.auth に載るようトークンを確定
      await user.getIdToken(true);
      await auth.authStateReady();

      if (!auth.currentUser) {
        throw new Error('Auth currentUser is null after sign-in');
      }

      currentUser = auth.currentUser;
      return currentUser;
    } catch (error) {
      console.error('[AuthService] ensureSignedIn failed:', error);
      authReady = null;
      currentUser = null;
      return null;
    }
  })();

  return authReady.then((user) => {
    if (!user) {
      authReady = null;
    }
    return user;
  });
}

function waitForAuthUser(auth: Auth, timeoutMs: number): Promise<User | null> {
  if (auth.currentUser) {
    return Promise.resolve(auth.currentUser);
  }

  return new Promise((resolve) => {
    let settled = false;

    const finish = (user: User | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      unsubscribe();
      resolve(user);
    };

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      finish(user);
    });

    const timer = setTimeout(() => {
      finish(auth.currentUser);
    }, timeoutMs);
  });
}
