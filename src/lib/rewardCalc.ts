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
 * Supports dual-cap model: rewardLimit (hard ceiling on reward earned) and
 * spendLimit (spend threshold beyond which rate falls back to baseRate).
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
  const { rewardLimit, spendLimit } = card.monthlyCap;

  // Check rewardLimit (hard ceiling) — takes priority
  if (rewardLimit !== undefined && monthlyReward >= rewardLimit) {
    return {
      card,
      effectiveRate: 0,
      isFull: true,
      remainingCapDisplay: 'NT$0 回饋剩餘',
      remainingAmount: 0,
    };
  }

  // Determine applicable rate, factoring in spendLimit and store bonus
  let applicableRate = card.baseRate;
  const spendCapReached = spendLimit !== undefined && monthlySpend >= spendLimit;

  if (!spendCapReached) {
    const bonus = storeName
      ? card.storeBonus.find(b => b.storeName === storeName)
      : null;
    if (bonus) {
      const storeSpend = tripExpenses
        .filter(e => e.cardId === card.id && e.store === storeName && e.date.startsWith(month))
        .reduce((sum, e) => sum + e.amount, 0);
      if (storeSpend < bonus.cap) {
        applicableRate = bonus.rate;
      }
    }
  }

  // Build remainingCapDisplay — rewardLimit takes priority when both are set
  let remainingCapDisplay = '';
  let remainingAmount = 0;

  if (rewardLimit !== undefined) {
    remainingAmount = Math.max(0, rewardLimit - monthlyReward);
    remainingCapDisplay = `NT$${remainingAmount.toLocaleString()} 回饋剩餘`;
  } else if (spendLimit !== undefined) {
    remainingAmount = Math.max(0, spendLimit - monthlySpend);
    remainingCapDisplay = spendCapReached
      ? `NT$0 消費額度剩餘（基本 ${card.baseRate}%）`
      : `NT$${remainingAmount.toLocaleString()} 消費額度剩餘`;
  }

  return {
    card,
    effectiveRate: applicableRate,
    isFull: false,
    remainingCapDisplay,
    remainingAmount,
  };
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

  // Cap earned reward if rewardLimit is set
  if (card.monthlyCap.rewardLimit !== undefined) {
    return Math.min(rawReward, advice.remainingAmount);
  }

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
