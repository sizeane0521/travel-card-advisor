import type { Card, Expense } from '../types';

/**
 * Returns YYYY-MM prefix for a date string or today.
 */
function monthPrefix(date?: string): string {
  const d = date ? new Date(date) : new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Sum of expenses for a card in the current calendar month (within a trip's expenses).
 */
export function getMonthlySpend(expenses: Expense[], cardId: string, monthStr?: string): number {
  const month = monthStr ?? monthPrefix();
  return expenses
    .filter(e => e.cardId === cardId && e.date.startsWith(month))
    .reduce((sum, e) => sum + e.amount, 0);
}

/**
 * Sum of estimated rewards for a card in the current calendar month.
 */
export function getMonthlyReward(expenses: Expense[], cardId: string, monthStr?: string): number {
  const month = monthStr ?? monthPrefix();
  return expenses
    .filter(e => e.cardId === cardId && e.date.startsWith(month))
    .reduce((sum, e) => sum + e.estimatedReward, 0);
}

export interface CardAdvice {
  card: Card;
  effectiveRate: number;    // 0–100 (percentage)
  isFull: boolean;          // monthly cap reached
  remainingCapDisplay: string; // human-readable remaining
  remainingAmount: number;  // NTD remaining before cap
}

/**
 * Calculate effective reward rate for a card given a store and current month expenses.
 * Implements the reward calculation logic from design.md.
 */
export function calcCardAdvice(
  card: Card,
  storeName: string | null,
  tripExpenses: Expense[],
  monthStr?: string
): CardAdvice {
  const month = monthStr ?? monthPrefix();
  const monthlySpend = getMonthlySpend(tripExpenses, card.id, month);
  const monthlyReward = getMonthlyReward(tripExpenses, card.id, month);

  // Find store bonus if applicable
  const bonus = storeName
    ? card.storeBonus.find(b => b.storeName === storeName)
    : null;

  if (card.monthlyCap.type === 'reward') {
    // Cap is on total reward earned
    const capAmount = card.monthlyCap.amount;
    const remaining = Math.max(0, capAmount - monthlyReward);

    if (remaining === 0) {
      return {
        card,
        effectiveRate: 0,
        isFull: true,
        remainingCapDisplay: 'NT$0 回饋剩餘',
        remainingAmount: 0,
      };
    }

    // Determine applicable rate
    let applicableRate = card.baseRate;
    if (bonus) {
      // Check if store spend cap is reached
      const storeSpend = tripExpenses
        .filter(e => e.cardId === card.id && e.store === storeName && e.date.startsWith(month))
        .reduce((sum, e) => sum + e.amount, 0);
      if (storeSpend < bonus.cap) {
        applicableRate = bonus.rate;
      }
    }

    return {
      card,
      effectiveRate: applicableRate,
      isFull: false,
      remainingCapDisplay: `NT$${remaining.toLocaleString()} 回饋剩餘`,
      remainingAmount: remaining,
    };
  } else {
    // Cap is on total spend amount
    const capAmount = card.monthlyCap.amount;
    const remainingSpend = Math.max(0, capAmount - monthlySpend);

    if (remainingSpend === 0) {
      return {
        card,
        effectiveRate: card.baseRate, // base rate still applies beyond cap
        isFull: false,
        remainingCapDisplay: `NT$0 加碼額度剩餘（基本 ${card.baseRate}%）`,
        remainingAmount: 0,
      };
    }

    let applicableRate = card.baseRate;
    if (bonus) {
      const storeSpend = tripExpenses
        .filter(e => e.cardId === card.id && e.store === storeName && e.date.startsWith(month))
        .reduce((sum, e) => sum + e.amount, 0);
      if (storeSpend < bonus.cap) {
        applicableRate = bonus.rate;
      }
    }

    return {
      card,
      effectiveRate: applicableRate,
      isFull: false,
      remainingCapDisplay: `NT$${remainingSpend.toLocaleString()} 消費額度剩餘`,
      remainingAmount: remainingSpend,
    };
  }
}

/**
 * Calculate estimated reward for a single expense amount on a card/store,
 * capped by remaining monthly cap.
 */
export function calcExpenseReward(
  card: Card,
  amount: number,
  storeName: string | null,
  tripExpenses: Expense[],
  monthStr?: string
): number {
  const advice = calcCardAdvice(card, storeName, tripExpenses, monthStr);
  if (advice.isFull) return 0;

  const rawReward = Math.floor((amount * advice.effectiveRate) / 100);

  if (card.monthlyCap.type === 'reward') {
    return Math.min(rawReward, advice.remainingAmount);
  }

  // For spend-type cap, reward calculation is straightforward
  return rawReward;
}

/**
 * Get sorted card recommendations for a store.
 * Returns cards sorted by effectiveRate descending, full cards at bottom.
 */
export function getSortedRecommendations(
  cards: Card[],
  storeName: string | null,
  tripExpenses: Expense[],
  monthStr?: string
): CardAdvice[] {
  const advices = cards.map(card => calcCardAdvice(card, storeName, tripExpenses, monthStr));
  return advices.sort((a, b) => {
    if (a.isFull && !b.isFull) return 1;
    if (!a.isFull && b.isFull) return -1;
    return b.effectiveRate - a.effectiveRate;
  });
}

/**
 * Get all unique store names from all cards' store bonus rules.
 */
export function getAllStoreNames(cards: Card[]): string[] {
  const names = new Set<string>();
  for (const card of cards) {
    for (const bonus of card.storeBonus) {
      names.add(bonus.storeName);
    }
  }
  return Array.from(names).sort();
}
