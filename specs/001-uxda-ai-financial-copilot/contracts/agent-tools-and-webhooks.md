# Interface Contracts: Agent Tools, Guardrails & Techcombank Webhook Bridge

**Feature**: `001-uxda-ai-financial-copilot`
**Date**: 2026-11-07

## 1. Agent-to-System Tool Contracts

All AI Copilot operations are strictly constrained to 3 typed tool contracts:

### Tool 1: `query_financial_summary` (Tier 1 — Auto-Approved Read-Only)

- **Purpose**: Answer natural language questions about current Net Worth, On-Budget Liquid Cash, and top category spending using local state.
- **Input**: `{ query: string }`
- **Guardrails**: Read-only; never mutates SQLite or CRDT state.

### Tool 2: `propose_transaction` (Tier 2 / Tier 3 — Guardrailed Write Proposal)

- **Purpose**: Parse natural language expense/income input into a `CopilotTransactionProposal`.
- **Validation Rules**:
  1. `scrubPii(rawInput)` MUST execute first and replace any `\b\d{8,19}\b` sequences with `[REDACTED_ACCT]`.
  2. Amount MUST be converted to exact `IntegerAmount` via `amountToInteger()`.
  3. `importedId` MUST be deterministically computed as `ai:copilot:${date}:${amount}:${normalizedPayee}` so identical submissions in the same session are flagged as duplicates.
  4. If `Math.abs(majorAmount) > 20_000_000`, `guardrailTier` MUST be escalated to `3` with a mandatory high-value confirmation warning.

### Tool 3: `commit_transaction_proposal` (Human-in-the-Loop Execution)

- **Purpose**: Commit an approved `CopilotTransactionProposal` into Actual Budget's local SQLite & CRDT log.
- **IPC Contract**:
  ```ts
  // 1. Resolve or create payee ID via loot-core IPC:
  const payeeId = await send('payee-create', { name: proposal.payeeName });

  // 2. Dispatch batch transaction update (preserves CRDT sync + Cmd/Ctrl+Z undo):
  await send('transactions-batch-update', {
    added: [
      {
        account: proposal.accountId,
        date: proposal.date,
        amount: proposal.amount,
        payee: payeeId,
        category: proposal.categoryId ?? undefined,
        notes: proposal.notes,
        imported_id: proposal.importedId,
        cleared: true,
      },
    ],
  });
  ```

## 2. Techcombank / Social Chatbot Webhook Contract

### Endpoint Specification (for Sync Server / Webhook Relay)

- **Path**: `POST /webhooks/v1/techcombank`
- **Headers**:
  - `Content-Type: application/json`
  - `X-Actual-Signature: sha256=<hmac_hex>`
- **Request Payload**:
  ```json
  {
    "referenceId": "FT26311982341",
    "transactionDate": "2026-11-07",
    "amountVnd": -55000,
    "description": "PHAM MINH TUAN chuyen tien an pho 19038475629102",
    "accountNumberHint": "Techcombank"
  }
  ```
- **Idempotency Guarantee**:
  - Computed `imported_id`: `tcb:FT26311982341:2026-11-07:-5500000`
  - Duplicate requests with the same `imported_id` are ignored without creating duplicate ledger rows.
