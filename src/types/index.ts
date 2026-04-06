export interface StoreBonus {
  storeName: string;
  stores: string[];           // actual store names (e.g. ["唐吉訶德", "FamilyMart"])
  rate: number;               // percentage, e.g. 5.0 = 5%
  cap: number;                // spend cap in NTD for this store bonus
  capPeriod: 'monthly' | 'period'; // 'monthly' resets each month; 'period' = entire promotion period
}

export interface MonthlyCap {
  rewardLimit?: number;  // NTD: max reward earned per month
  spendLimit?: number;   // NTD: max spend eligible for bonus rate per month
}

export interface Card {
  id: string;
  name: string;
  bankUrl: string;
  baseRate: number;        // percentage, e.g. 3.0 = 3%
  monthlyCap: MonthlyCap;
  storeBonus: StoreBonus[];
  validFrom?: string;      // promotion start date YYYY-MM-DD
  validTo?: string;        // promotion end date YYYY-MM-DD
}

export interface Expense {
  id: string;
  amount: number;          // NTD, positive integer (converted from foreign if applicable)
  cardId: string;
  store: string | null;    // store name or null for general purchase
  date: string;            // ISO date string YYYY-MM-DD
  estimatedReward: number; // NTD reward estimated at time of logging
  foreignAmount?: { currency: string; amount: number }; // original foreign currency amount
}

export interface Trip {
  id: string;
  name: string;
  startDate: string;       // YYYY-MM-DD
  endDate: string | null;  // null = active trip
  expenses: Expense[];
  exchangeRate?: { currency: string; rate: number }; // e.g. { currency: 'JPY', rate: 0.22 }
}

export interface AppData {
  cards: Card[];
  trips: Trip[];
  activeTripId: string | null;
}
