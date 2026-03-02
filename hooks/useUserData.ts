'use client';

import { useReducer, useEffect, useCallback } from 'react';
import { getLevelByCount } from '@/prompts/constants';
import { getUserData, saveUserData } from '@/lib/userDoc';
import { MAX_LEARNINGS, MAX_CONTENT_LENGTH } from '@/hooks/useLearnings';
import type { Learning } from '@/types/learning';

interface State {
  solvedCount: number;
  learnings: Learning[];
  dataLoading: boolean;
}

type Action =
  | { type: 'LOAD'; solvedCount: number; learnings: Learning[] }
  | { type: 'INCREMENT_SOLVED' }
  | { type: 'ADD_LEARNING'; content: string }
  | { type: 'REMOVE_LEARNING'; id: string }
  | { type: 'UPDATE_LEARNING'; id: string; content: string }
  | { type: 'CLEAR_LEARNINGS' };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'LOAD':
      return { solvedCount: action.solvedCount, learnings: action.learnings, dataLoading: false };
    case 'INCREMENT_SOLVED':
      return { ...state, solvedCount: state.solvedCount + 1 };
    case 'ADD_LEARNING': {
      const trimmed = action.content.trim().slice(0, MAX_CONTENT_LENGTH);
      if (!trimmed) return state;
      const newItem: Learning = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        content: trimmed,
        createdAt: Date.now(),
      };
      const base = state.learnings.length >= MAX_LEARNINGS ? state.learnings.slice(1) : state.learnings;
      return { ...state, learnings: [...base, newItem] };
    }
    case 'REMOVE_LEARNING':
      return { ...state, learnings: state.learnings.filter((l) => l.id !== action.id) };
    case 'UPDATE_LEARNING': {
      const trimmed = action.content.trim().slice(0, MAX_CONTENT_LENGTH);
      if (!trimmed) return state;
      return {
        ...state,
        learnings: state.learnings.map((l) => (l.id === action.id ? { ...l, content: trimmed } : l)),
      };
    }
    case 'CLEAR_LEARNINGS':
      return { ...state, learnings: [] };
    default:
      return state;
  }
}

export interface UseUserDataReturn {
  solvedCount: number;
  learnings: Learning[];
  dataLoading: boolean;
  incrementSolved: () => void;
  addLearning: (content: string) => void;
  removeLearning: (id: string) => void;
  updateLearning: (id: string, content: string) => void;
  clearLearnings: () => void;
}

export function useUserData(uid: string | null): UseUserDataReturn {
  const [state, dispatch] = useReducer(reducer, {
    solvedCount: 0,
    learnings: [],
    dataLoading: true,
  });

  // Firestore から初回ロード
  useEffect(() => {
    if (!uid) {
      dispatch({ type: 'LOAD', solvedCount: 0, learnings: [] });
      return;
    }
    getUserData(uid).then((data) => {
      dispatch({
        type: 'LOAD',
        solvedCount: data?.solvedCount ?? 0,
        learnings: data?.learnings ?? [],
      });
    });
  }, [uid]);

  // state 変化時に Firestore に保存（楽観的更新）
  useEffect(() => {
    if (!uid || state.dataLoading) return;
    saveUserData(uid, { solvedCount: state.solvedCount, learnings: state.learnings });
  }, [uid, state.solvedCount, state.learnings, state.dataLoading]);

  const incrementSolved = useCallback(() => dispatch({ type: 'INCREMENT_SOLVED' }), []);
  const addLearning = useCallback((content: string) => dispatch({ type: 'ADD_LEARNING', content }), []);
  const removeLearning = useCallback((id: string) => dispatch({ type: 'REMOVE_LEARNING', id }), []);
  const updateLearning = useCallback(
    (id: string, content: string) => dispatch({ type: 'UPDATE_LEARNING', id, content }),
    [],
  );
  const clearLearnings = useCallback(() => dispatch({ type: 'CLEAR_LEARNINGS' }), []);

  // レベルアップ検出は ChatPage 側で行うため、ここでは返さない
  return {
    solvedCount: state.solvedCount,
    learnings: state.learnings,
    dataLoading: state.dataLoading,
    incrementSolved,
    addLearning,
    removeLearning,
    updateLearning,
    clearLearnings,
  };
}

// 外部からも参照できるようにエクスポート
export { getLevelByCount };
