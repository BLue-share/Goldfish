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

  authReady = new Promise((resolve) => {
    const auth = getFirebaseAuth();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        currentUser = user;
        unsubscribe();
        resolve(user);
        return;
      }

      try {
        const credential = await signInAnonymously(auth);
        currentUser = credential.user;
        unsubscribe();
        resolve(credential.user);
      } catch (error) {
        console.error('[AuthService] signInAnonymously failed:', error);
        unsubscribe();
        resolve(null);
      }
    });
  });

  return authReady;
}
