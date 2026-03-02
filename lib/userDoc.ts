import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  type Timestamp,
} from 'firebase/firestore';
import { getFirebaseDb } from './firebase';
import type { Learning } from '@/types/learning';

export interface UserData {
  solvedCount: number;
  learnings: Learning[];
  updatedAt: Timestamp;
}

export async function getUserData(uid: string): Promise<UserData | null> {
  const ref = doc(getFirebaseDb(), 'users', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data() as UserData;
}

export async function saveUserData(
  uid: string,
  data: Pick<UserData, 'solvedCount' | 'learnings'>,
): Promise<void> {
  const ref = doc(getFirebaseDb(), 'users', uid);
  await setDoc(ref, { ...data, updatedAt: serverTimestamp() });
}
