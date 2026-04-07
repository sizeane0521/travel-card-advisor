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

export interface CapProgress {
  type: 'reward' | 'spend' | 'store_bonus' | 'payment_method';
  label: string;
  current: number;
  total: number;
  percentage: number;
}

export interface RewardBreakdown {
  base: number;          // NT$ from base rate
  store: number;         // NT$ from store bonus (after proportional cap truncation)
  paymentMethod: number; // NT$ from payment method bonus
  storeCapped: boolean;  // true if store bonus was truncated by cap
  storeCapRemaining: number; // actual store bonus reward applied when truncated (0 if not capped)
}

export interface CardAdvice {
  card: Card;
  effectiveRate: number;
  isFull: boolean;
  remainingCapDisplay: string;
  remainingAmount: number;
  paymentMethodBadge?: 'apple_pay' | 'google_pay';
  caps: CapProgress[];
  rateBreakdown: {
    base: number;
    paymentMethod: number;
    store: number;
  };
  // Exposes matched store bonus info for proportional truncation in calcExpenseReward
  storeBonusInfo?: { bonus: StoreBonus; storeSpend: number } | null;
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
  tierProgress: CapProgress[];
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
    return { bonusRate: 0, bonusReward: 0, tierProgress: [] };
  }
  if (!card.paymentMethodBonus.methods.includes(paymentMethod)) {
    return { bonusRate: 0, bonusReward: 0, tierProgress: [] };
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
  const tierProgress: CapProgress[] = [];

  for (const [tierIdx, tier] of card.paymentMethodBonus.tiers.entries()) {
    // Skip tiers with unmet prerequisites; per-expense override takes precedence over card setting
    const prereqMet = prerequisiteOverrides !== undefined && tierIdx in prerequisiteOverrides
      ? prerequisiteOverrides[tierIdx]
      : tier.prerequisiteMet;
    if (tier.prerequisite !== undefined && prereqMet !== true) continue;

    const tierUsed = Math.min(remainingAccrued, tier.monthlyCap);
    remainingAccrued = Math.max(0, remainingAccrued - tierUsed);
    const tierRemaining = tier.monthlyCap - tierUsed;

    tierProgress.push({
      type: 'payment_method',
      label: tier.prerequisite ?? `行動支付加碼 Tier ${tierIdx + 1}`,
      current: tierUsed,
      total: tier.monthlyCap,
      percentage: (tierUsed / tier.monthlyCap) * 100,
    });

    if (tierRemaining <= 0) continue; // tier exhausted

    totalBonusRate += tier.rate;
    if (amount > 0) {
      totalBonusReward += Math.min(Math.floor(amount * tier.rate / 100), tierRemaining);
    }
  }

  return { bonusRate: totalBonusRate, bonusReward: totalBonusReward, tierProgress };
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
    return { card, effectiveRate: 0, isFull: true, remainingCapDisplay: 'NT$0 回饋剩餘', remainingAmount: 0, caps: [], rateBreakdown: { base: 0, paymentMethod: 0, store: 0 }, storeBonusInfo: null };
  }

  let applicableRate = card.baseRate;
  let storeAppliedRate = 0;
  const spendCapReached = spendLimit !== undefined && monthlySpend >= spendLimit;
  const caps: CapProgress[] = [];
  let storeBonusInfo: CardAdvice['storeBonusInfo'] = null;

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

      const remainingCap = bonus.cap === 0 ? Infinity : Math.max(0, bonus.cap - storeSpend);

      if (remainingCap > 0) {
        applicableRate += bonus.rate;
        storeAppliedRate = bonus.rate;
        // Expose bonus info for proportional reward calculation in calcExpenseReward
        storeBonusInfo = { bonus, storeSpend };
      }

      if (bonus.cap > 0) {
        caps.push({
          type: 'store_bonus',
          label: `${bonus.storeName} 加碼`,
          current: storeSpend,
          total: bonus.cap,
          percentage: (storeSpend / bonus.cap) * 100,
        });
      }
    }
  }

  let remainingCapDisplay = '';
  let remainingAmount = 0;

  if (rewardLimit !== undefined) {
    remainingAmount = Math.max(0, rewardLimit - monthlyReward);
    remainingCapDisplay = `NT$${remainingAmount.toLocaleString()} 回饋剩餘`;
    caps.push({
      type: 'reward',
      label: '月回饋上限',
      current: monthlyReward,
      total: rewardLimit,
      percentage: (monthlyReward / rewardLimit) * 100,
    });
  } else if (spendLimit !== undefined) {
    remainingAmount = Math.max(0, spendLimit - monthlySpend);
    remainingCapDisplay = spendCapReached
      ? `NT$0 消費額度剩餘（基本 ${card.baseRate}%）`
      : `NT$${remainingAmount.toLocaleString()} 消費額度剩餘`;
    caps.push({
      type: 'spend',
      label: '月消費額度',
      current: monthlySpend,
      total: spendLimit,
      percentage: (monthlySpend / spendLimit) * 100,
    });
  }

  // Payment method bonus
  const pm = paymentMethod ?? 'physical';
  const pmBonus = calcPaymentMethodBonus(card, pm, 0, tripExpenses, month, prerequisiteOverrides);

  caps.push(...pmBonus.tierProgress);

  const paymentMethodBadge: CardAdvice['paymentMethodBadge'] =
    pmBonus.bonusRate > 0 && (pm === 'apple_pay' || pm === 'google_pay') ? pm : undefined;

  return {
    card,
    effectiveRate: applicableRate + pmBonus.bonusRate,
    isFull: false,
    remainingCapDisplay,
    remainingAmount,
    paymentMethodBadge,
    caps,
    rateBreakdown: { base: card.baseRate, paymentMethod: pmBonus.bonusRate, store: storeAppliedRate },
    storeBonusInfo,
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
): { estimatedReward: number; paymentMethodReward: number; breakdown: RewardBreakdown } {
  const advice = calcCardAdvice(card, storeName, tripExpenses, paymentMethod, monthStr, prerequisiteOverrides);
  if (advice.isFull) {
    return {
      estimatedReward: 0,
      paymentMethodReward: 0,
      breakdown: { base: 0, store: 0, paymentMethod: 0, storeCapped: false, storeCapRemaining: 0 },
    };
  }

  const pm = paymentMethod ?? 'physical';
  const pmBonus = calcPaymentMethodBonus(card, pm, amount, tripExpenses, monthStr, prerequisiteOverrides);

  // Base reward (no cap)
  const baseReward = Math.floor(amount * advice.rateBreakdown.base / 100);

  // Store bonus reward: proportional truncation when approaching cap
  let storeBonusReward = 0;
  let storeCapped = false;
  let storeCapRemaining = 0;

  if (advice.storeBonusInfo) {
    const { bonus, storeSpend } = advice.storeBonusInfo;
    if (bonus.cap === 0) {
      // Unlimited store bonus
      storeBonusReward = Math.floor(amount * bonus.rate / 100);
    } else {
      const remainingSpendCap = Math.max(0, bonus.cap - storeSpend);
      const eligibleAmount = Math.min(amount, remainingSpendCap);
      storeBonusReward = Math.floor(eligibleAmount * bonus.rate / 100);
      storeCapped = amount > remainingSpendCap;
      storeCapRemaining = storeCapped ? storeBonusReward : 0;
    }
  }

  // Apply overall rewardLimit cap to base + store combined
  const baseAndStore = baseReward + storeBonusReward;
  const cappedBaseAndStore = card.monthlyCap.rewardLimit !== undefined
    ? Math.min(baseAndStore, advice.remainingAmount)
    : baseAndStore;

  const estimatedReward = cappedBaseAndStore + pmBonus.bonusReward;

  // For breakdown: distribute cap reduction proportionally (store absorbs first, then base)
  const cappedStore = Math.min(storeBonusReward, cappedBaseAndStore);
  const cappedBase = cappedBaseAndStore - cappedStore;

  return {
    estimatedReward,
    paymentMethodReward: pmBonus.bonusReward,
    breakdown: {
      base: cappedBase,
      store: cappedStore,
      paymentMethod: pmBonus.bonusReward,
      storeCapped,
      storeCapRemaining,
    },
  };
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
 * Returns all unique physical store names from stores[] arrays, sorted alphabetically.
 * StoreBonus.storeName (category label) is excluded — only actual store names are returned.
 */
export function getAllStoreNames(cards: Card[]): string[] {
  const names = new Set<string>();
  for (const card of cards) {
    for (const bonus of card.storeBonus) {
      for (const store of (bonus.stores ?? [])) {
        names.add(store);
      }
    }
  }
  return Array.from(names).sort();
}
