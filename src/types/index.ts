export interface PaymentMethodBonusTier {
  rate: number;            // additional reward % (e.g. 1.5 = 1.5%)
  monthlyCap: number;      // max NT$ reward this tier can contribute per month
  prerequisite?: string;   // human-readable condition (e.g. "前月帳單達3萬元")
  prerequisiteMet?: boolean; // user-declared; when false/absent, tier is skipped
}

export interface PaymentMethodBonus {
  methods: ('apple_pay' | 'google_pay')[];
  tiers: PaymentMethodBonusTier[];
}

export interface StoreBonus {
  storeName: string;
  stores: string[];           // actual store names (e.g. ["唐吉訶德", "FamilyMart"])
  subCategories?: { label: string; stores: string[] }[]; // grouped store names (e.g. { label: "便利商店", stores: ["7-ELEVEN"] })
  rate: number;               // percentage, e.g. 5.0 = 5%
  cap: number;                // reward cap in NTD for this store bonus (max reward amount, not spend)
  capPeriod: 'monthly' | 'period'; // 'monthly' resets each month; 'period' = entire promotion period
  prerequisite?: string;      // human-readable condition (e.g. "限新戶", "需登錄")
  prerequisiteMet?: boolean;  // user-declared; when false/absent and prerequisite exists, bonus is skipped
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
  newUserBonus?: StoreBonus[];
  paymentMethodBonus?: PaymentMethodBonus;
  validFrom?: string;      // promotion start date YYYY-MM-DD
  validTo?: string;        // promotion end date YYYY-MM-DD
  operationWarnings?: { paymentMethod: 'apple_pay' | 'google_pay'; message: string }[];
}

export interface Expense {
  id: string;
  amount: number;          // NTD, positive integer (converted from foreign if applicable)
  cardId: string;
  store: string | null;    // store name or null for general purchase
  date: string;            // ISO date string YYYY-MM-DD
  estimatedReward: number; // NTD reward estimated at time of logging
  foreignAmount?: { currency: string; amount: number }; // original foreign currency amount
  paymentMethod?: 'apple_pay' | 'google_pay' | 'physical';
  paymentMethodReward?: number; // NT$ from mobile pay bonus tiers (for monthly cap tracking)
  rewardBreakdown?: { base: number; store: number; paymentMethod: number; effectiveRate: number }; // saved breakdown at time of logging
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
