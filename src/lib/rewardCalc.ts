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
  paymentMethodBadge?: 'apple_pay' | 'google_pay';
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

interface PaymentMethodBonusResult {
  bonusRate: number;   // sum of eligible tier rates with remaining cap (for display)
  bonusReward: number; // actual reward amount for a given spend amount (capped per tier)
}

/**
 * Calculates payment method bonus for a card given a specific amount.
 * Tiers are consumed in order; each tier has its own monthly cap tracked via
 * tripExpenses[].paymentMethodReward totals.
 * amount=0 returns bonusRate only (for display without a specific transaction).
 */
export function calcPaymentMethodBonus(
  card: Card,
  paymentMethod: 'apple_pay' | 'google_pay' | 'physical',
  amount: number,
  tripExpenses: Expense[],
  monthStr?: string,
  prerequisiteOverrides?: Record<number, boolean>
): PaymentMethodBonusResult {
  if (!card.paymentMethodBonus || paymentMethod === 'physical') {
    return { bonusRate: 0, bonusReward: 0 };
  }
  if (!card.paymentMethodBonus.methods.includes(paymentMethod)) {
    return { bonusRate: 0, bonusReward: 0 };
  }

  const month = monthStr ?? monthPrefix();

  // Sum all paymentMethodReward accrued this month for this card
  const totalAccrued = tripExpenses
    .filter(e => e.cardId === card.id && e.date.startsWith(month))
    .reduce((sum, e) => sum + (e.paymentMethodReward ?? 0), 0);

  // Distribute accrued rewards across tiers in order (tier 1 fills first)
  let remainingAccrued = totalAccrued;
  let totalBonusRate = 0;
  let totalBonusReward = 0;

  for (const [tierIdx, tier] of card.paymentMethodBonus.tiers.entries()) {
    // Skip tiers with unmet prerequisites; per-expense override takes precedence over card setting
    const prereqMet = prerequisiteOverrides !== undefined && tierIdx in prerequisiteOverrides
      ? prerequisiteOverrides[tierIdx]
      : tier.prerequisiteMet;
    if (tier.prerequisite !== undefined && prereqMet !== true) continue;

    const tierUsed = Math.min(remainingAccrued, tier.monthlyCap);
    remainingAccrued = Math.max(0, remainingAccrued - tierUsed);
    const tierRemaining = tier.monthlyCap - tierUsed;

    if (tierRemaining <= 0) continue; // tier exhausted

    totalBonusRate += tier.rate;
    if (amount > 0) {
      totalBonusReward += Math.min(Math.floor(amount * tier.rate / 100), tierRemaining);
    }
  }

  return { bonusRate: totalBonusRate, bonusReward: totalBonusReward };
}

export function calcCardAdvice(
  card: Card,
  storeName: string | null,
  tripExpenses: Expense[],
  paymentMethod?: 'apple_pay' | 'google_pay' | 'physical',
  monthStr?: string,
  prerequisiteOverrides?: Record<number, boolean>
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

  // Payment method bonus
  const pm = paymentMethod ?? 'physical';
  const pmBonus = calcPaymentMethodBonus(card, pm, 0, tripExpenses, month, prerequisiteOverrides);

  const paymentMethodBadge: CardAdvice['paymentMethodBadge'] =
    pmBonus.bonusRate > 0 && (pm === 'apple_pay' || pm === 'google_pay') ? pm : undefined;

  return {
    card,
    effectiveRate: applicableRate + pmBonus.bonusRate,
    isFull: false,
    remainingCapDisplay,
    remainingAmount,
    paymentMethodBadge,
  };
}

export function calcExpenseReward(
  card: Card,
  amount: number,
  storeName: string | null,
  tripExpenses: Expense[],
  paymentMethod?: 'apple_pay' | 'google_pay' | 'physical',
  monthStr?: string,
  prerequisiteOverrides?: Record<number, boolean>
): { estimatedReward: number; paymentMethodReward: number } {
  const advice = calcCardAdvice(card, storeName, tripExpenses, paymentMethod, monthStr, prerequisiteOverrides);
  if (advice.isFull) return { estimatedReward: 0, paymentMethodReward: 0 };

  const pm = paymentMethod ?? 'physical';
  const pmBonus = calcPaymentMethodBonus(card, pm, amount, tripExpenses, monthStr, prerequisiteOverrides);

  const baseAndStoreReward = Math.floor((amount * (advice.effectiveRate - pmBonus.bonusRate)) / 100);
  let cappedBaseReward = baseAndStoreReward;

  if (card.monthlyCap.rewardLimit !== undefined) {
    cappedBaseReward = Math.min(baseAndStoreReward, advice.remainingAmount);
  }

  const estimatedReward = cappedBaseReward + pmBonus.bonusReward;

  return { estimatedReward, paymentMethodReward: pmBonus.bonusReward };
}

export function getSortedRecommendations(
  cards: Card[],
  storeName: string | null,
  tripExpenses: Expense[],
  paymentMethod?: 'apple_pay' | 'google_pay' | 'physical',
  monthStr?: string,
  allPrereqOverrides?: Record<string, Record<number, boolean>>
): CardAdvice[] {
  const advices = cards.map(card => calcCardAdvice(
    card, storeName, tripExpenses, paymentMethod, monthStr,
    allPrereqOverrides?.[card.id]
  ));
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
