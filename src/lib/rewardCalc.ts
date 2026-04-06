import type { Card, StoreBonus, Expense } from '../types';

function monthPrefix(date?: string): string {
  const d = date ? new Date(date) : new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function getMonthlySpend(expenses: Expense[], cardId: string, monthStr?: string): number {
  const month = monthStr ?? monthPrefix();
  return expenses
    .filter(e => e.cardId === cardId && e.date.startsWith(month))
    .reduce((sum, e) => sum + e.amount, 0);
}

export function getMonthlyReward(expenses: Expense[], cardId: string, monthStr?: string): number {
  const month = monthStr ?? monthPrefix();
  return expenses
    .filter(e => e.cardId === cardId && e.date.startsWith(month))
    .reduce((sum, e) => sum + e.estimatedReward, 0);
}

export interface CardAdvice {
  card: Card;
  effectiveRate: number;
  isFull: boolean;
  remainingCapDisplay: string;
  remainingAmount: number;
}

/**
 * task 5.2: Find matching StoreBonus for a store name.
 * First tries exact match on storeName, then searches stores[] arrays.
 */
function findStoreBonus(card: Card, storeName: string): StoreBonus | null {
  // Exact category name match
  const byCategory = card.storeBonus.find(b => b.storeName === storeName);
  if (byCategory) return byCategory;
  // Search actual store names in stores[] arrays
  return card.storeBonus.find(b => (b.stores ?? []).includes(storeName)) ?? null;
}

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

  if (rewardLimit !== undefined && monthlyReward >= rewardLimit) {
    return { card, effectiveRate: 0, isFull: true, remainingCapDisplay: 'NT$0 回饋剩餘', remainingAmount: 0 };
  }

  let applicableRate = card.baseRate;
  const spendCapReached = spendLimit !== undefined && monthlySpend >= spendLimit;

  if (!spendCapReached && storeName) {
    const bonus = findStoreBonus(card, storeName);
    if (bonus) {
      // task 5.1: period cap uses all trip expenses; monthly cap uses current month only
      const storeSpend = bonus.capPeriod === 'period'
        ? tripExpenses
            .filter(e => e.cardId === card.id && findStoreBonus(card, e.store ?? '') === bonus)
            .reduce((sum, e) => sum + e.amount, 0)
        : tripExpenses
            .filter(e => e.cardId === card.id && e.store === storeName && e.date.startsWith(month))
            .reduce((sum, e) => sum + e.amount, 0);

      if (bonus.cap === 0 || storeSpend < bonus.cap) {
        applicableRate = bonus.rate;
      }
    }
  }

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

  return { card, effectiveRate: applicableRate, isFull: false, remainingCapDisplay, remainingAmount };
}

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

  if (card.monthlyCap.rewardLimit !== undefined) {
    return Math.min(rawReward, advice.remainingAmount);
  }

  return rawReward;
}

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
 * task 5.3: Returns all unique store names — both category names (storeName)
 * and individual stores from stores[] arrays — sorted alphabetically.
 */
export function getAllStoreNames(cards: Card[]): string[] {
  const names = new Set<string>();
  for (const card of cards) {
    for (const bonus of card.storeBonus) {
      names.add(bonus.storeName);
      for (const store of (bonus.stores ?? [])) {
        names.add(store);
      }
    }
  }
  return Array.from(names).sort();
}
