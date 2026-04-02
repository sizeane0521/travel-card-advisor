import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  type Dispatch,
  type ReactNode,
} from 'react';
import type { AppData, Card, Trip, Expense } from '../types';
import { loadData, saveData } from './storage';

// ── Actions ───────────────────────────────────────────────────────────────────

type Action =
  | { type: 'SET_CARDS'; cards: Card[] }
  | { type: 'ADD_CARD'; card: Card }
  | { type: 'UPDATE_CARD'; card: Card }
  | { type: 'DELETE_CARD'; cardId: string }
  | { type: 'ADD_TRIP'; trip: Trip }
  | { type: 'SET_ACTIVE_TRIP'; tripId: string }
  | { type: 'END_TRIP'; tripId: string; endDate: string }
  | { type: 'ADD_EXPENSE'; tripId: string; expense: Expense }
  | { type: 'DELETE_EXPENSE'; tripId: string; expenseId: string };

// ── Reducer ───────────────────────────────────────────────────────────────────

function reducer(state: AppData, action: Action): AppData {
  switch (action.type) {
    case 'SET_CARDS':
      return { ...state, cards: action.cards };
    case 'ADD_CARD':
      return { ...state, cards: [...state.cards, action.card] };
    case 'UPDATE_CARD':
      return { ...state, cards: state.cards.map(c => c.id === action.card.id ? action.card : c) };
    case 'DELETE_CARD':
      return { ...state, cards: state.cards.filter(c => c.id !== action.cardId) };
    case 'ADD_TRIP':
      return { ...state, trips: [...state.trips, action.trip], activeTripId: action.trip.id };
    case 'SET_ACTIVE_TRIP':
      return { ...state, activeTripId: action.tripId };
    case 'END_TRIP':
      return {
        ...state,
        trips: state.trips.map(t => t.id === action.tripId ? { ...t, endDate: action.endDate } : t),
        activeTripId: state.activeTripId === action.tripId ? null : state.activeTripId,
      };
    case 'ADD_EXPENSE':
      return {
        ...state,
        trips: state.trips.map(t =>
          t.id === action.tripId ? { ...t, expenses: [...t.expenses, action.expense] } : t
        ),
      };
    case 'DELETE_EXPENSE':
      return {
        ...state,
        trips: state.trips.map(t =>
          t.id === action.tripId
            ? { ...t, expenses: t.expenses.filter(e => e.id !== action.expenseId) }
            : t
        ),
      };
    default:
      return state;
  }
}

// ── Context & Hook ────────────────────────────────────────────────────────────

interface StoreContextValue {
  data: AppData;
  dispatch: Dispatch<Action>;
}

export const StoreContext = createContext<StoreContextValue | null>(null);

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, dispatch] = useReducer(reducer, undefined, loadData);

  useEffect(() => {
    saveData(data);
  }, [data]);

  return (
    <StoreContext.Provider value={{ data, dispatch }}>
      {children}
    </StoreContext.Provider>
  );
}
