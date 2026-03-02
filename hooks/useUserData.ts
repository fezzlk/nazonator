'use client';

import { useReducer, useEffect, useCallback } from 'react';
import { getLevelByCount } from '@/prompts/constants';
import { getUserData, saveUserData, DEFAULT_PRINCIPLES, DEFAULT_LOGICS } from '@/lib/userDoc';
import { MAX_LEARNINGS, MAX_CONTENT_LENGTH } from '@/hooks/useLearnings';
import type { Learning } from '@/types/learning';

interface State {
  solvedCount: number;
  learnings: Learning[];
  principles: Learning[];
  logics: Learning[];
  dataLoading: boolean;
}

type Action =
  | { type: 'LOAD'; solvedCount: number; learnings: Learning[]; principles: Learning[]; logics: Learning[] }
  | { type: 'INCREMENT_SOLVED' }
  | { type: 'ADD_LEARNING'; content: string }
  | { type: 'REMOVE_LEARNING'; id: string }
  | { type: 'UPDATE_LEARNING'; id: string; content: string }
  | { type: 'CLEAR_LEARNINGS' }
  | { type: 'ADD_PRINCIPLE'; content: string }
  | { type: 'REMOVE_PRINCIPLE'; id: string }
  | { type: 'UPDATE_PRINCIPLE'; id: string; content: string }
  | { type: 'ADD_LOGIC'; content: string }
  | { type: 'REMOVE_LOGIC'; id: string }
  | { type: 'UPDATE_LOGIC'; id: string; content: string };

function makeItem(content: string): Learning {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    content: content.trim().slice(0, MAX_CONTENT_LENGTH),
    createdAt: Date.now(),
  };
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'LOAD':
      return {
        solvedCount: action.solvedCount,
        learnings: action.learnings,
        principles: action.principles,
        logics: action.logics,
        dataLoading: false,
      };
    case 'INCREMENT_SOLVED':
      return { ...state, solvedCount: state.solvedCount + 1 };
    case 'ADD_LEARNING': {
      const trimmed = action.content.trim().slice(0, MAX_CONTENT_LENGTH);
      if (!trimmed) return state;
      const base = state.learnings.length >= MAX_LEARNINGS ? state.learnings.slice(1) : state.learnings;
      return { ...state, learnings: [...base, makeItem(action.content)] };
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
    case 'ADD_PRINCIPLE': {
      const trimmed = action.content.trim().slice(0, MAX_CONTENT_LENGTH);
      if (!trimmed) return state;
      return { ...state, principles: [...state.principles, makeItem(action.content)] };
    }
    case 'REMOVE_PRINCIPLE':
      return { ...state, principles: state.principles.filter((l) => l.id !== action.id) };
    case 'UPDATE_PRINCIPLE': {
      const trimmed = action.content.trim().slice(0, MAX_CONTENT_LENGTH);
      if (!trimmed) return state;
      return {
        ...state,
        principles: state.principles.map((l) => (l.id === action.id ? { ...l, content: trimmed } : l)),
      };
    }
    case 'ADD_LOGIC': {
      const trimmed = action.content.trim().slice(0, MAX_CONTENT_LENGTH);
      if (!trimmed) return state;
      return { ...state, logics: [...state.logics, makeItem(action.content)] };
    }
    case 'REMOVE_LOGIC':
      return { ...state, logics: state.logics.filter((l) => l.id !== action.id) };
    case 'UPDATE_LOGIC': {
      const trimmed = action.content.trim().slice(0, MAX_CONTENT_LENGTH);
      if (!trimmed) return state;
      return {
        ...state,
        logics: state.logics.map((l) => (l.id === action.id ? { ...l, content: trimmed } : l)),
      };
    }
    default:
      return state;
  }
}

export interface UseUserDataReturn {
  solvedCount: number;
  learnings: Learning[];
  principles: Learning[];
  logics: Learning[];
  dataLoading: boolean;
  incrementSolved: () => void;
  addLearning: (content: string) => void;
  removeLearning: (id: string) => void;
  updateLearning: (id: string, content: string) => void;
  clearLearnings: () => void;
  addPrinciple: (content: string) => void;
  removePrinciple: (id: string) => void;
  updatePrinciple: (id: string, content: string) => void;
  addLogic: (content: string) => void;
  removeLogic: (id: string) => void;
  updateLogic: (id: string, content: string) => void;
}

export function useUserData(uid: string | null): UseUserDataReturn {
  const [state, dispatch] = useReducer(reducer, {
    solvedCount: 0,
    learnings: [],
    principles: DEFAULT_PRINCIPLES,
    logics: DEFAULT_LOGICS,
    dataLoading: true,
  });

  // Firestore から初回ロード
  useEffect(() => {
    if (!uid) {
      dispatch({ type: 'LOAD', solvedCount: 0, learnings: [], principles: DEFAULT_PRINCIPLES, logics: DEFAULT_LOGICS });
      return;
    }
    getUserData(uid).then((data) => {
      dispatch({
        type: 'LOAD',
        solvedCount: data?.solvedCount ?? 0,
        learnings: data?.learnings ?? [],
        principles: data?.principles?.length ? data.principles : DEFAULT_PRINCIPLES,
        logics: data?.logics?.length ? data.logics : DEFAULT_LOGICS,
      });
    });
  }, [uid]);

  // state 変化時に Firestore に保存（楽観的更新）
  useEffect(() => {
    if (!uid || state.dataLoading) return;
    saveUserData(uid, {
      solvedCount: state.solvedCount,
      learnings: state.learnings,
      principles: state.principles,
      logics: state.logics,
    });
  }, [uid, state.solvedCount, state.learnings, state.principles, state.logics, state.dataLoading]);

  const incrementSolved = useCallback(() => dispatch({ type: 'INCREMENT_SOLVED' }), []);
  const addLearning = useCallback((content: string) => dispatch({ type: 'ADD_LEARNING', content }), []);
  const removeLearning = useCallback((id: string) => dispatch({ type: 'REMOVE_LEARNING', id }), []);
  const updateLearning = useCallback(
    (id: string, content: string) => dispatch({ type: 'UPDATE_LEARNING', id, content }),
    [],
  );
  const clearLearnings = useCallback(() => dispatch({ type: 'CLEAR_LEARNINGS' }), []);
  const addPrinciple = useCallback((content: string) => dispatch({ type: 'ADD_PRINCIPLE', content }), []);
  const removePrinciple = useCallback((id: string) => dispatch({ type: 'REMOVE_PRINCIPLE', id }), []);
  const updatePrinciple = useCallback(
    (id: string, content: string) => dispatch({ type: 'UPDATE_PRINCIPLE', id, content }),
    [],
  );
  const addLogic = useCallback((content: string) => dispatch({ type: 'ADD_LOGIC', content }), []);
  const removeLogic = useCallback((id: string) => dispatch({ type: 'REMOVE_LOGIC', id }), []);
  const updateLogic = useCallback(
    (id: string, content: string) => dispatch({ type: 'UPDATE_LOGIC', id, content }),
    [],
  );

  return {
    solvedCount: state.solvedCount,
    learnings: state.learnings,
    principles: state.principles,
    logics: state.logics,
    dataLoading: state.dataLoading,
    incrementSolved,
    addLearning,
    removeLearning,
    updateLearning,
    clearLearnings,
    addPrinciple,
    removePrinciple,
    updatePrinciple,
    addLogic,
    removeLogic,
    updateLogic,
  };
}

// 外部からも参照できるようにエクスポート
export { getLevelByCount };
