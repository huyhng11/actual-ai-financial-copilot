import type {
  AccountEntity,
  CategoryEntity,
} from '@actual-app/core/types/models';
import { describe, expect, it } from 'vitest';

import {
  answerReadOnlyFinancialQuery,
  evaluateGuardrailTier,
  parseNaturalLanguageTransaction,
  parseTechcombankWebhook,
  scrubPii,
} from './copilotEngine';
import type { LocalFinancialRagContext } from './copilotTypes';

const mockAccounts: AccountEntity[] = [
  {
    id: 'acct-tcb',
    name: 'Techcombank Checking',
    offbudget: 0,
    closed: 0,
    sort_order: 1,
    last_reconciled: null,
    tombstone: 0,
    account_id: null,
    bank: null,
    bankName: null,
    bankId: null,
    mask: null,
    official_name: null,
    balance_current: null,
    balance_available: null,
    balance_limit: null,
    account_sync_source: null,
    last_sync: null,
    account_group_id: null,
    bank_sync_status: null,
  },
];

const mockCategories: CategoryEntity[] = [
  {
    id: 'cat-food',
    name: 'Food',
    is_income: false,
    group: 'grp-living',
  },
  {
    id: 'cat-income',
    name: 'Income',
    is_income: true,
    group: 'grp-income',
  },
];

const mockContext: LocalFinancialRagContext = {
  accounts: mockAccounts,
  categories: mockCategories,
  defaultDate: '2026-11-07',
};

describe('copilotEngine', () => {
  it('scrubs 8-19 digit bank account numbers and emails in scrubPii', () => {
    const result = scrubPii(
      'Chuyển tiền ăn phở STK 19038475629102 email test@example.com',
    );
    expect(result.redactedCount).toBe(2);
    expect(result.scrubbedText).toContain('[REDACTED_ACCT]');
    expect(result.scrubbedText).toContain('[REDACTED_EMAIL]');
    expect(result.scrubbedText).not.toContain('19038475629102');
  });

  it('parses Vietnamese shorthand expense and matches Local RAG account & category', () => {
    const proposal = parseNaturalLanguageTransaction(
      'Ăn phở 55k bằng Techcombank STK 19038475629102',
      mockContext,
    );

    expect(proposal).not.toBeNull();
    expect(proposal?.accountId).toBe('acct-tcb');
    expect(proposal?.categoryId).toBe('cat-food');
    expect(proposal?.majorAmount).toBe(-55_000);
    expect(proposal?.amount).toBe(-5_500_000);
    expect(proposal?.piiRedactedCount).toBe(1);
    expect(proposal?.guardrailTier).toBe(2);
  });

  it('escalates high-value transactions (> 20M VND) to Tier 3 HITL guardrail', () => {
    const proposal = parseNaturalLanguageTransaction(
      'Lương thưởng +25tr vào Techcombank',
      mockContext,
    );

    expect(proposal).not.toBeNull();
    expect(proposal?.majorAmount).toBe(25_000_000);
    expect(proposal?.guardrailTier).toBe(3);
    expect(evaluateGuardrailTier(25_000_000).tier).toBe(3);
  });

  it('enforces deterministic imported_id deduplication on Techcombank webhooks', () => {
    const existing = new Set<string>(['tcb:FT26311982341:2026-11-07:-5500000']);
    const proposal = parseTechcombankWebhook(
      {
        referenceId: 'FT26311982341',
        transactionDate: '2026-11-07',
        amountVnd: -55_000,
        description: 'PHAM MINH TUAN an pho 19038475629102',
      },
      {
        ...mockContext,
        existingImportedIds: existing,
      },
    );

    expect(proposal).not.toBeNull();
    expect(proposal?.importedId).toBe('tcb:FT26311982341:2026-11-07:-5500000');
    expect(proposal?.status).toBe('duplicate');
  });

  it('answers Tier 1 read-only Local RAG questions without mutating state', () => {
    const insight = answerReadOnlyFinancialQuery(
      'Tổng danh sách tài khoản nào đang mở cho STK 19038475629102?',
      mockContext,
    );

    expect(insight).not.toBeNull();
    expect(insight?.guardrailTier).toBe(1);
    expect(insight?.piiRedactedCount).toBe(1);
    expect(insight?.details[0]).toContain('Techcombank Checking');
  });
});
