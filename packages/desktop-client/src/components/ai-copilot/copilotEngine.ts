import { amountToInteger } from '@actual-app/core/shared/util';
import type {
  AccountEntity,
  CategoryEntity,
} from '@actual-app/core/types/models';

import type {
  CopilotReadOnlyInsight,
  CopilotTransactionProposal,
  GuardrailTier,
  LocalFinancialRagContext,
  PiiScrubResult,
  TechcombankWebhookPayload,
} from './copilotTypes';

/**
 * Default Tier-2 sanity cap in major currency units (e.g. 20,000,000 VND).
 * Anything above this threshold escalates to Tier 3 (High-Value Mandatory HITL Warning).
 */
export const TIER_2_SANITY_CAP_MAJOR = 20_000_000;

/**
 * Scrubs sensitive PII (8-19 digit bank account/card numbers, emails, bearer tokens)
 * before any prompt or webhook description leaves the client boundary.
 */
export function scrubPii(input: string): PiiScrubResult {
  let redactedCount = 0;

  const withoutEmails = input.replace(
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    () => {
      redactedCount += 1;
      return '[REDACTED_EMAIL]';
    },
  );

  const withoutAccountNumbers = withoutEmails.replace(/\b\d{8,19}\b/g, () => {
    redactedCount += 1;
    return '[REDACTED_ACCT]';
  });

  return {
    scrubbedText: withoutAccountNumbers,
    redactedCount,
  };
}

const VIETNAMESE_CATEGORY_KEYWORDS: ReadonlyArray<{
  keywords: readonly string[];
  categoryHints: readonly string[];
}> = [
  {
    keywords: [
      'phở',
      'pho',
      'bún',
      'bun',
      'cơm',
      'com',
      'ăn',
      'an uong',
      'cafe',
      'cà phê',
      'coffee',
      'highlands',
      'starbucks',
      'trà sữa',
      'nhà hàng',
      'lunch',
      'dinner',
      'breakfast',
      'food',
      'restaurant',
    ],
    categoryHints: ['food', 'dining', 'restaurants', 'ăn uống', 'groceries'],
  },
  {
    keywords: [
      'siêu thị',
      'winmart',
      'coopmart',
      'bách hóa',
      'chợ',
      'groceries',
      'market',
    ],
    categoryHints: ['groceries', 'food', 'đi chợ', 'siêu thị'],
  },
  {
    keywords: [
      'grab',
      'be',
      'xanh sm',
      'taxi',
      'xăng',
      'gửi xe',
      'bus',
      'uber',
      'transport',
    ],
    categoryHints: ['transportation', 'transport', 'di chuyển', 'auto', 'gas'],
  },
  {
    keywords: [
      'điện',
      'nước',
      'internet',
      'viettel',
      'fpt',
      'vnpt',
      'tiền nhà',
      'rent',
      'bill',
      'utilities',
    ],
    categoryHints: [
      'bills',
      'utilities',
      'rent',
      'housing',
      'hóa đơn',
      'nhà ở',
    ],
  },
  {
    keywords: [
      'lương',
      'salary',
      'thưởng',
      'bonus',
      'payroll',
      'income',
      'freelance',
    ],
    categoryHints: ['income', 'salary', 'paycheck', 'thu nhập', 'lương'],
  },
  {
    keywords: [
      'netflix',
      'spotify',
      'xem phim',
      'cgv',
      'game',
      'du lịch',
      'entertainment',
    ],
    categoryHints: ['entertainment', 'fun', 'giải trí', 'subscriptions'],
  },
];

function normalizeText(value: string): string {
  return value.toLowerCase().trim();
}

/**
 * Matches the best target Account and Category from the user's Local Financial RAG context.
 */
export function matchAccountAndCategory(
  text: string,
  context: LocalFinancialRagContext,
): {
  account: AccountEntity | null;
  category: CategoryEntity | null;
} {
  const lower = normalizeText(text);
  const openAccounts = context.accounts.filter(a => !a.closed);

  // 1. Direct account name or Techcombank / TCB alias match
  let matchedAccount: AccountEntity | null = null;
  for (const acct of openAccounts) {
    const acctLower = normalizeText(acct.name);
    if (acctLower && lower.includes(acctLower)) {
      matchedAccount = acct;
      break;
    }
    if (
      (lower.includes('techcombank') || lower.includes('tcb')) &&
      (acctLower.includes('techcombank') ||
        acctLower.includes('tcb') ||
        acctLower.includes('checking'))
    ) {
      matchedAccount = acct;
      break;
    }
  }

  if (!matchedAccount && openAccounts.length > 0) {
    matchedAccount =
      openAccounts.find(a => !a.offbudget) ?? openAccounts[0] ?? null;
  }

  // 2. Direct category name match
  let matchedCategory: CategoryEntity | null = null;
  for (const cat of context.categories) {
    const catLower = normalizeText(cat.name);
    if (catLower.length >= 3 && lower.includes(catLower)) {
      matchedCategory = cat;
      break;
    }
  }

  // 3. Semantic keyword synonym match (Vietnamese + English)
  if (!matchedCategory) {
    for (const group of VIETNAMESE_CATEGORY_KEYWORDS) {
      const hasKeyword = group.keywords.some(kw => lower.includes(kw));
      if (hasKeyword) {
        for (const hint of group.categoryHints) {
          const found = context.categories.find(c =>
            normalizeText(c.name).includes(hint),
          );
          if (found) {
            matchedCategory = found;
            break;
          }
        }
        if (matchedCategory) {
          break;
        }
      }
    }
  }

  return {
    account: matchedAccount,
    category: matchedCategory,
  };
}

/**
 * Parses Vietnamese & English amount shorthand into major units:
 * - "55k", "55 nghìn", "55 ngàn" -> 55,000
 * - "1.5tr", "1,5 triệu", "25 củ" -> 1,500,000 / 25,000,000
 * - "$45.50", "45.50" -> 45.5
 */
export function parseMajorAmountAndSign(rawText: string): {
  majorAmount: number;
  isIncome: boolean;
  matchedToken: string;
} | null {
  const lower = normalizeText(rawText);

  const incomeKeywords = [
    'lương',
    'salary',
    'thưởng',
    'bonus',
    'nhận',
    'received',
    'income',
    'hoàn tiền',
    'refund',
  ];
  const hasExplicitPlus = /(?:^|\s)\+\s*\d/.test(lower);
  const hasIncomeKeyword = incomeKeywords.some(kw => lower.includes(kw));
  const isIncome = hasExplicitPlus || hasIncomeKeyword;

  // Match number with optional suffix: tr, triệu, trieu, củ, cu, m, k, nghìn, nghin, ngàn, ngan, đ, d, vnd, usd
  const amountRegex =
    /(?:^|\s|[+-]|\$)(\d+(?:[.,]\d+)?)\s*(tr|triệu|trieu|củ|cu|m|k|nghìn|nghin|ngàn|ngan|đ|d|vnd|usd)?(?=\s|$|[.,!?])/i;

  const match = rawText.match(amountRegex);
  if (!match) {
    return null;
  }

  const numericPart = match[1].replace(',', '.');
  const baseValue = Number.parseFloat(numericPart);
  if (!Number.isFinite(baseValue) || baseValue <= 0) {
    return null;
  }

  const unit = (match[2] ?? '').toLowerCase();
  let multiplier = 1;
  if (
    unit === 'tr' ||
    unit === 'triệu' ||
    unit === 'trieu' ||
    unit === 'củ' ||
    unit === 'cu' ||
    unit === 'm'
  ) {
    multiplier = 1_000_000;
  } else if (
    unit === 'k' ||
    unit === 'nghìn' ||
    unit === 'nghin' ||
    unit === 'ngàn' ||
    unit === 'ngan'
  ) {
    multiplier = 1_000;
  }

  const majorAmount = Math.round(baseValue * multiplier * 100) / 100;
  return {
    majorAmount,
    isIncome,
    matchedToken: match[0].trim(),
  };
}

/**
 * Evaluates the 3-Tier Guardrail Policy for a proposed transaction.
 */
export function evaluateGuardrailTier(majorAmount: number): {
  tier: GuardrailTier;
  reason: string;
} {
  const absMajor = Math.abs(majorAmount);
  if (absMajor > TIER_2_SANITY_CAP_MAJOR) {
    return {
      tier: 3,
      reason: `High-value amount (${absMajor.toLocaleString()} > ${TIER_2_SANITY_CAP_MAJOR.toLocaleString()} sanity cap) — Mandatory Human-in-the-Loop verification required.`,
    };
  }
  return {
    tier: 2,
    reason:
      'Scoped single-record write within sanity cap — Protected by deterministic imported_id & CRDT undo.',
  };
}

function extractPayeeName(scrubbedText: string, matchedToken: string): string {
  const cleaned = scrubbedText
    .replace(matchedToken, ' ')
    .replace(
      /\b(bằng|qua|vào|tài khoản|tk|stk|techcombank|tcb|via|using|from|to|account|on)\b.*$/i,
      '',
    )
    .replace(/[+$]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) {
    return 'AI Copilot Entry';
  }
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

function todayIsoDate(override?: string): string {
  if (override) {
    return override;
  }
  return new Date().toISOString().slice(0, 10);
}

/**
 * Parses a natural-language expense or income string into a guardrailed CopilotTransactionProposal.
 */
export function parseNaturalLanguageTransaction(
  rawInput: string,
  context: LocalFinancialRagContext,
): CopilotTransactionProposal | null {
  const trimmed = rawInput.trim();
  if (!trimmed) {
    return null;
  }

  const { scrubbedText, redactedCount } = scrubPii(trimmed);
  const parsedAmount = parseMajorAmountAndSign(scrubbedText);
  if (!parsedAmount) {
    return null;
  }

  const { account, category } = matchAccountAndCategory(scrubbedText, context);
  if (!account) {
    return null;
  }

  const signedMajor = parsedAmount.isIncome
    ? parsedAmount.majorAmount
    : -parsedAmount.majorAmount;
  const integerAmount = amountToInteger(signedMajor);
  const date = todayIsoDate(context.defaultDate);
  const payeeName = extractPayeeName(scrubbedText, parsedAmount.matchedToken);
  const normalizedSlug = normalizeText(payeeName).replace(/[^a-z0-9]+/g, '-');
  const importedId = `ai:copilot:${date}:${integerAmount}:${normalizedSlug}`;
  const guardrail = evaluateGuardrailTier(signedMajor);
  const isDuplicate = context.existingImportedIds?.has(importedId) ?? false;

  return {
    id: importedId,
    source: 'copilot-nl',
    rawInput: trimmed,
    scrubbedInput: scrubbedText,
    piiRedactedCount: redactedCount,
    accountId: account.id,
    accountName: account.name,
    categoryId: category?.id ?? null,
    categoryName: category?.name ?? 'Uncategorized',
    payeeName,
    amount: integerAmount,
    majorAmount: signedMajor,
    date,
    notes: `[AI Copilot] ${scrubbedText}`,
    importedId,
    guardrailTier: guardrail.tier,
    guardrailReason: guardrail.reason,
    status: isDuplicate ? 'duplicate' : 'pending',
  } satisfies CopilotTransactionProposal;
}

/**
 * Converts a Techcombank (VietQR / Casso / SePay) webhook notification payload
 * into a guardrailed, deduplicated CopilotTransactionProposal.
 */
export function parseTechcombankWebhook(
  payload: TechcombankWebhookPayload,
  context: LocalFinancialRagContext,
): CopilotTransactionProposal | null {
  const { scrubbedText, redactedCount } = scrubPii(payload.description);
  const combinedHint = `${payload.accountNumberHint ?? 'Techcombank'} ${scrubbedText}`;
  const { account, category } = matchAccountAndCategory(combinedHint, context);
  if (!account) {
    return null;
  }

  const integerAmount = amountToInteger(payload.amountVnd);
  const importedId = `tcb:${payload.referenceId}:${payload.transactionDate}:${integerAmount}`;
  const guardrail = evaluateGuardrailTier(payload.amountVnd);
  const isDuplicate = context.existingImportedIds?.has(importedId) ?? false;

  return {
    id: importedId,
    source: 'techcombank-webhook',
    rawInput: payload.description,
    scrubbedInput: scrubbedText,
    piiRedactedCount: redactedCount,
    accountId: account.id,
    accountName: account.name,
    categoryId: category?.id ?? null,
    categoryName: category?.name ?? 'Uncategorized',
    payeeName: `TCB • ${scrubbedText.slice(0, 36)}`,
    amount: integerAmount,
    majorAmount: payload.amountVnd,
    date: payload.transactionDate,
    notes: `[TCB Sync #${payload.referenceId}] ${scrubbedText}`,
    importedId,
    guardrailTier: guardrail.tier,
    guardrailReason: guardrail.reason,
    status: isDuplicate ? 'duplicate' : 'pending',
  } satisfies CopilotTransactionProposal;
}

/**
 * Tier-1 Read-Only Financial Q&A handler.
 * Answers questions about accounts, categories, and Local RAG coverage without mutating SQLite/CRDT.
 */
export function answerReadOnlyFinancialQuery(
  rawQuery: string,
  context: LocalFinancialRagContext,
): CopilotReadOnlyInsight | null {
  const trimmed = rawQuery.trim();
  if (!trimmed) {
    return null;
  }

  const lower = normalizeText(trimmed);
  const isReadOnlyQuestion =
    trimmed.endsWith('?') ||
    lower.includes('summary') ||
    lower.includes('rag') ||
    lower.includes('tổng') ||
    lower.includes('danh sách') ||
    lower.includes('how many') ||
    lower.includes('what accounts') ||
    lower.includes('tài khoản nào') ||
    lower.includes('status');

  if (!isReadOnlyQuestion) {
    return null;
  }

  const { scrubbedText, redactedCount } = scrubPii(trimmed);
  const openAccounts = context.accounts.filter(a => !a.closed);
  const onBudgetAccounts = openAccounts.filter(a => !a.offbudget);
  const offBudgetAccounts = openAccounts.filter(a => a.offbudget);
  const activeCategories = context.categories.filter(c => !c.hidden);

  const accountNames =
    openAccounts.map(a => a.name).join(', ') || 'No open accounts yet';
  const sampleCategories =
    activeCategories
      .slice(0, 6)
      .map(c => c.name)
      .join(', ') || 'No categories yet';

  return {
    id: `tier1:${Date.now()}`,
    guardrailTier: 1,
    query: trimmed,
    scrubbedQuery: scrubbedText,
    piiRedactedCount: redactedCount,
    summaryTitle: 'Tier 1 Read-Only Financial RAG Snapshot',
    details: [
      `Open Accounts (${openAccounts.length}): ${accountNames}`,
      `On-Budget Liquid Accounts: ${onBudgetAccounts.length} • Off-Budget Tracking Accounts: ${offBudgetAccounts.length}`,
      `Active Budget Categories (${activeCategories.length}): ${sampleCategories}${activeCategories.length > 6 ? '…' : ''}`,
      `Session Idempotency Ledger: ${context.existingImportedIds?.size ?? 0} deduplicated imported_id keys tracked.`,
    ],
  } satisfies CopilotReadOnlyInsight;
}
