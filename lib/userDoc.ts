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
  { id: 'dp-1', content: '謎解きの答えは大抵一般名詞である', createdAt: 0 },
  { id: 'dp-2', content: '問題文の言葉を字義通りに受け取らず、複数の意味・解釈を検討する', createdAt: 0 },
  { id: 'dp-3', content: '最初の解釈が行き詰まったら前提を疑い、別の視点から見直す', createdAt: 0 },
  { id: 'dp-4', content: '問題文に不自然な言い回しがある場合、そこに操作のヒントが隠れている', createdAt: 0 },
  { id: 'dp-5', content: '答えは必ず問題文の中に全ての根拠が含まれている', createdAt: 0 },
  { id: 'dp-6', content: '先入観を排除し、問題の言葉をできる限り客観的に分解する', createdAt: 0 },
  { id: 'dp-7', content: '「ない」「除く」「消す」などの否定・除去語は文字操作の指示であることが多い', createdAt: 0 },
  { id: 'dp-8', content: '記号・句読点・スペースの位置や存在自体が意味を持つことがある', createdAt: 0 },
  { id: 'dp-9', content: '問題が短いほど一語一語の意味が重要になる', createdAt: 0 },
  { id: 'dp-10', content: '「〇〇したら何になる？」という問いは文字・音・形の変換操作を指していることが多い', createdAt: 0 },
];

export const DEFAULT_LOGICS: Learning[] = [
  { id: 'dl-1', content: 'ある文字列から文字を取り除く操作は、一文字だけ取り除く場合と全て取り除く場合がある', createdAt: 0 },
  { id: 'dl-2', content: '文字を取り除いた後の言葉に、取り除く前にない文字が含まれることはない', createdAt: 0 },
  { id: 'dl-3', content: '単語を逆から読むと別の単語や意味になることがある（逆読み）', createdAt: 0 },
  { id: 'dl-4', content: '漢字のへん・つくり・部首を分解すると別の文字や単語が現れることがある', createdAt: 0 },
  { id: 'dl-5', content: 'ひらがな・カタカナ・ローマ字・英語に読み替えると意味が変わることがある', createdAt: 0 },
  { id: 'dl-6', content: '文の区切り位置を変える（分かち書きを変える）と別の意味になることがある', createdAt: 0 },
  { id: 'dl-7', content: '各単語の語頭・語末・特定位置の文字だけを取り出すと別の単語になることがある', createdAt: 0 },
  { id: 'dl-8', content: '濁点・半濁点を加えたり除いたりすると別の音・単語になることがある', createdAt: 0 },
  { id: 'dl-9', content: '複数の単語を組み合わせる（合成）と答えが現れることがある', createdAt: 0 },
  { id: 'dl-10', content: '単語の中に隠れている別の単語を見つけると解けることがある（内包語）', createdAt: 0 },
  { id: 'dl-11', content: '同音異義語・同訓異字の可能性を常に考慮する', createdAt: 0 },
  { id: 'dl-12', content: '五十音表の行・段・位置に規則性が隠れていることがある', createdAt: 0 },
  { id: 'dl-13', content: '数字を漢字・大字（壱弐参）・別の単位に読み替えると意味が変わることがある', createdAt: 0 },
  { id: 'dl-14', content: '特定のキーワードが別の概念の比喩・換喩になっていることがある（色→感情、季節→時代 など）', createdAt: 0 },
  { id: 'dl-15', content: '文字の形・見た目の類似性（「夕」と「タ」、「土」と「士」など）が操作のヒントになることがある', createdAt: 0 },
  { id: 'dl-16', content: 'カタカナ語を日本語に翻訳（または逆）すると答えが見つかることがある', createdAt: 0 },
  { id: 'dl-17', content: '送り仮名・ふりがなを変えると別の読み方・意味になることがある', createdAt: 0 },
  { id: 'dl-18', content: '言葉の一部に別の言葉を足すと（前後に付け加えると）新しい単語になることがある', createdAt: 0 },
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
