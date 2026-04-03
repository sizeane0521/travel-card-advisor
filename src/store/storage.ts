import type { AppData, Card } from '../types';

const STORAGE_KEY = 'travel-card-advisor-data';

const DEFAULT_DATA: AppData = {
  cards: [],
  trips: [],
  activeTripId: null,
};

function migrateCards(cards: unknown[]): Card[] {
  return cards.map((c: unknown) => {
    const card = c as Record<string, unknown>;
    const cap = card.monthlyCap as Record<string, unknown> | undefined;
    if (cap && typeof cap.type === 'string' && typeof cap.amount === 'number') {
      const migrated = { ...card } as Record<string, unknown>;
      migrated.monthlyCap = cap.type === 'reward'
        ? { rewardLimit: cap.amount }
        : { spendLimit: cap.amount };
      return migrated as unknown as Card;
    }
    return c as Card;
  });
}

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_DATA };
    const parsed = JSON.parse(raw) as Partial<AppData>;
    const rawCards = parsed.cards ?? [];
    let cards: Card[];
    try {
      cards = migrateCards(rawCards as unknown[]);
      const needsMigration = (rawCards as unknown[]).some((c: unknown) => {
        const cap = (c as Record<string, unknown>).monthlyCap as Record<string, unknown> | undefined;
        return cap && typeof cap.type === 'string';
      });
      if (needsMigration) {
        const migrated: AppData = { cards, trips: parsed.trips ?? [], activeTripId: parsed.activeTripId ?? null };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
      }
    } catch {
      cards = rawCards as Card[];
    }
    return {
      cards,
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
