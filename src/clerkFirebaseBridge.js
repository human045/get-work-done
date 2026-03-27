import { signInAnonymously } from 'firebase/auth';
import { auth } from './firebase';

/**
 * After Clerk signs in, also create a Firebase anonymous session.
 * This satisfies Firestore security rules that require request.auth != null.
 * Data paths use Clerk's user.id, not the anonymous Firebase UID.
 */
export async function bridgeToFirebase() {
  try {
    await signInAnonymously(auth);
  } catch (e) {
    console.warn('[ClerkFirebaseBridge] Anonymous sign-in failed:', e.message);
  }
}

/**
 * Reads the pre-migration Firebase user id from persisted auth state, if one exists.
 * We use this to recover data that was stored under the legacy Firebase Auth uid.
 */
export async function getLegacyFirebaseUid() {
  try {
    if (typeof auth.authStateReady === 'function') {
      await auth.authStateReady();
    }
    const user = auth.currentUser;
    if (!user || user.isAnonymous) return null;
    return user.uid || null;
  } catch (e) {
    console.warn('[ClerkFirebaseBridge] Could not read legacy Firebase uid:', e.message);
    return null;
  }
}
