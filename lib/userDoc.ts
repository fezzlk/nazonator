import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  type Timestamp,
} from 'firebase/firestore';
import { getFirebaseDb } from './firebase';
import type { Learning } from '@/types/learning';

export const DEFAULT_PRINCIPLES: Learning[] = [
  { id: 'default-principle-1', content: '謎解きの答えは大抵一般名詞である', createdAt: 0 },
];

export const DEFAULT_LOGICS: Learning[] = [
  {
    id: 'default-logic-1',
    content: 'ある文字列から文字を取り除く操作は、一文字分だけ取り除く場合と全て取り除く場合がある',
    createdAt: 0,
  },
  {
    id: 'default-logic-2',
    content:
      '文字を取り除いた後の言葉に、取り除く前にない文字が含まれることはない（例: 「かたたたき」から「た」を除いても「あ」は出現しない）',
    createdAt: 0,
  },
];

export interface UserData {
  solvedCount: number;
  learnings: Learning[];
  principles: Learning[];
  logics: Learning[];
  updatedAt: Timestamp;
}

export async function getUserData(uid: string): Promise<UserData | null> {
  const ref = doc(getFirebaseDb(), 'users', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data() as Partial<UserData> & { updatedAt: Timestamp };
  return {
    solvedCount: data.solvedCount ?? 0,
    learnings: data.learnings ?? [],
    principles: data.principles?.length ? data.principles : DEFAULT_PRINCIPLES,
    logics: data.logics?.length ? data.logics : DEFAULT_LOGICS,
    updatedAt: data.updatedAt,
  };
}

export async function saveUserData(
  uid: string,
  data: Pick<UserData, 'solvedCount' | 'learnings' | 'principles' | 'logics'>,
): Promise<void> {
  const ref = doc(getFirebaseDb(), 'users', uid);
  await setDoc(ref, { ...data, updatedAt: serverTimestamp() });
}
