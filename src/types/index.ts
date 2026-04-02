export interface StoreBonus {
  storeName: string;
  rate: number;      // percentage, e.g. 5.0 = 5%
  cap: number;       // spend amount cap in NTD for this store bonus
}

export interface MonthlyCap {
  type: 'reward' | 'spend';
  amount: number;    // NTD: max reward earned (reward) or max spend (spend)
}

export interface Card {
  id: string;
  name: string;
  bankUrl: string;
  baseRate: number;        // percentage, e.g. 3.0 = 3%
  monthlyCap: MonthlyCap;
  storeBonus: StoreBonus[];
}

export interface Expense {
  id: string;
  amount: number;          // NTD, positive integer
  cardId: string;
  store: string | null;    // store name or null for general purchase
  date: string;            // ISO date string YYYY-MM-DD
  estimatedReward: number; // NTD reward estimated at time of logging
}

export interface Trip {
  id: string;
  name: string;
  startDate: string;       // YYYY-MM-DD
  endDate: string | null;  // null = active trip
  expenses: Expense[];
}

export interface AppData {
  cards: Card[];
  trips: Trip[];
  activeTripId: string | null;
}
