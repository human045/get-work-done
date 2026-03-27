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
