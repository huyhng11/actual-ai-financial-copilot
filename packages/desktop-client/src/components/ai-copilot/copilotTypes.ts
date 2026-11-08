import type { IntegerAmount } from '@actual-app/core/shared/util';
import type {
  AccountEntity,
  CategoryEntity,
} from '@actual-app/core/types/models';

export type GuardrailTier = 1 | 2 | 3;

export type CopilotTransactionSource = 'copilot-nl' | 'techcombank-webhook';

export type CopilotProposalStatus =
  | 'pending'
  | 'confirmed'
  | 'rejected'
  | 'duplicate';

export type CopilotTransactionProposal = {
  id: string;
  source: CopilotTransactionSource;
  rawInput: string;
  scrubbedInput: string;
  piiRedactedCount: number;
  accountId: AccountEntity['id'];
  accountName: string;
  categoryId: CategoryEntity['id'] | null;
  categoryName: string;
  payeeName: string;
  amount: IntegerAmount;
  majorAmount: number;
  date: string;
  notes: string;
  importedId: string;
  guardrailTier: GuardrailTier;
  guardrailReason: string;
  status: CopilotProposalStatus;
};

export type TechcombankWebhookPayload = {
  referenceId: string;
  transactionDate: string;
  amountVnd: number;
  description: string;
  accountNumberHint?: string;
};

export type PiiScrubResult = {
  scrubbedText: string;
  redactedCount: number;
};

export type LocalFinancialRagContext = {
  accounts: readonly AccountEntity[];
  categories: readonly CategoryEntity[];
  defaultDate?: string;
  existingImportedIds?: ReadonlySet<string>;
};

export type CopilotReadOnlyInsight = {
  id: string;
  guardrailTier: 1;
  query: string;
  scrubbedQuery: string;
  piiRedactedCount: number;
  summaryTitle: string;
  details: readonly string[];
};
