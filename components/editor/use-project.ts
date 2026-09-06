'use client';
import { useCallback, useReducer } from 'react';
import { createProject } from '@/lib/defaults';
import type { Project } from '@/types/project';
type State = { past: Project[]; present: Project; future: Project[] };
type Action = { type: 'edit'; update: (project: Project) => Project } | { type: 'undo' } | { type: 'redo' } | { type: 'replace'; project: Project };
function reducer(state: State, action: Action): State {
  if (action.type === 'undo') {
    if (!state.past.length) return state;
    return { past: state.past.slice(0, -1), present: state.past.at(-1)!, future: [state.present, ...state.future] };
  }
  if (action.type === 'redo') {
    if (!state.future.length) return state;
    return { past: [...state.past, state.present], present: state.future[0], future: state.future.slice(1) };
  }
  const next = action.type === 'replace' ? action.project : action.update(state.present);
  if (next === state.present) return state;
  return { past: [...state.past.slice(-39), state.present], present: action.type === 'replace' ? next : { ...next, updatedAt: new Date().toISOString() }, future: [] };
}
export type EditProject = (update: (project: Project) => Project) => void;
export function useProject() {
  const [state, dispatch] = useReducer(reducer, undefined, () => ({ past: [], present: createProject(), future: [] }));
  const edit = useCallback<EditProject>((update) => dispatch({ type: 'edit', update }), []);
  return { project: state.present, edit, canUndo: !!state.past.length, canRedo: !!state.future.length, undo: () => dispatch({ type: 'undo' }), redo: () => dispatch({ type: 'redo' }), replace: (project: Project) => dispatch({ type: 'replace', project }) };
}

