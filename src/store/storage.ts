import type { AppData } from '../types';

const STORAGE_KEY = 'travel-card-advisor-data';

const DEFAULT_DATA: AppData = {
  cards: [],
  trips: [],
  activeTripId: null,
};

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_DATA };
    const parsed = JSON.parse(raw) as Partial<AppData>;
    return {
      cards: parsed.cards ?? [],
      trips: parsed.trips ?? [],
      activeTripId: parsed.activeTripId ?? null,
    };
  } catch {
    return { ...DEFAULT_DATA };
  }
}

export function saveData(data: AppData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
