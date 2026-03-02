import {
  collection,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
  type Timestamp,
} from 'firebase/firestore';
import { getFirebaseDb } from './firebase';

export interface SessionSummary {
  id: string;
  title: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  messageCount: number;
}

export interface Session extends SessionSummary {
  messages: { role: string; content: string }[];
}

export async function upsertSession(
  uid: string,
  sessionId: string,
  data: { title: string; messages: { role: string; content: string }[] },
): Promise<void> {
  const ref = doc(getFirebaseDb(), 'users', uid, 'sessions', sessionId);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, {
      title: data.title,
      messages: data.messages,
      messageCount: data.messages.length,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } else {
    await setDoc(ref, {
      title: snap.data().title,
      messages: data.messages,
      messageCount: data.messages.length,
      createdAt: snap.data().createdAt,
      updatedAt: serverTimestamp(),
    });
  }
}

export async function listSessions(uid: string): Promise<SessionSummary[]> {
  const col = collection(getFirebaseDb(), 'users', uid, 'sessions');
  const q = query(col, orderBy('updatedAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      title: data.title ?? 'セッション',
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      messageCount: data.messageCount ?? 0,
    };
  });
}

export async function getSession(uid: string, sessionId: string): Promise<Session | null> {
  const ref = doc(getFirebaseDb(), 'users', uid, 'sessions', sessionId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    id: snap.id,
    title: data.title ?? 'セッション',
    messages: data.messages ?? [],
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    messageCount: data.messageCount ?? 0,
  };
}

export async function deleteSession(uid: string, sessionId: string): Promise<void> {
  const ref = doc(getFirebaseDb(), 'users', uid, 'sessions', sessionId);
  await deleteDoc(ref);
}
