# Actual Budget — UXDA Financial Workspace & AI Copilot Constitution

## Core Principles

### I. Local-First & CRDT Integrity (NON-NEGOTIABLE)

Every state mutation in Actual Budget MUST flow through `loot-core` mutators (`send('transactions-batch-update', ...)`, `send('budget/budget-amount', ...)`, etc.) or `@actual-app/api` methods so that Merkle-trie CRDT messages (`messages_crdt`) and local undo snapshots (`withUndo`) are preserved.

- NEVER issue raw `INSERT`, `UPDATE`, or `DELETE` SQL queries against user financial tables (`transactions`, `accounts`, `categories`, `zero_budgets`) outside `loot-core`'s sync layer.
- NEVER hard-delete rows; all removals MUST set `tombstone = 1` via standard domain handlers.
- Every AI-initiated or webhook-initiated write MUST be 100% undoable with `Cmd/Ctrl + Z` in the web/desktop UI.

### II. Exact Integer Financial Math & Tabular Typography (NON-NEGOTIABLE)

Currency values MUST be stored, transmitted, and calculated as exact integers in minor units (`IntegerAmount`, e.g., `$12.34` = `1234`, `55,000 VND` = `5500000` in Actual's internal 2-decimal integer representation via `amountToInteger` / `integerToAmount`).

- NEVER use IEEE-754 floating-point arithmetic (`parseFloat(a) + parseFloat(b)`) for financial totals, balances, or budget allocations.
- Every standalone financial figure in the UI MUST be wrapped in `<FinancialText>` or styled with `styles.tnum` (`font-variant-numeric: tabular-nums`) so digits align vertically across tables, executive cards, and progress indicators.

### III. Strict TypeScript, Functional React & Zero Suppressions

All new and modified files MUST pass `typescript-strict-plugin` without suppression comments.

- NEVER add `// @ts-strict-ignore`, `// @ts-ignore`, `// @ts-expect-error`, `// eslint-disable`, or `// oxlint-disable`.
- Prefer `satisfies` over type assertions (`as`, `!`) for type narrowing.
- Write functional, declarative React components using named imports (`import { useState } from 'react'`). Because `babel-plugin-react-compiler` is active across `desktop-client` and `component-library`, omit manual `useMemo`, `useCallback`, and `React.memo` unless a stable reference is strictly required by an external effect.

### IV. Semantic Theme Token Architecture & UXDA Financial Craft

All visual styling MUST use semantic tokens from `@actual-app/components/theme` (`theme.pageBackground`, `theme.cardBackground`, `theme.tableBackground`, `theme.pageText`, `theme.pageTextSubdued`, `theme.noticeTextLight`, `theme.warningText`, `theme.errorText`, `theme.pillBackground`, `theme.tableBorder`).

- NEVER hardcode raw hex/RGB colors in application components; every component MUST adapt automatically across Light, Dark, Midnight, Nord, and Development themes.
- Follow the UXDA-inspired design hierarchy (referencing _Finera Core Banking_, _Private Wealth Concierge_, and _Liv X_):
  1. **Executive Financial Pulse**: Surface Net Worth, On-Budget Liquid Cash, and Monthly Utilization at the top of the workspace without hiding the core spreadsheet grid.
  2. **Contextual Micro-Visualizations**: Enhance envelope budget rows with 3px semantic utilization bars (healthy `<85%`, warning `85%–100%`, overspent `>100%`) that preserve row height and keyboard navigation.
  3. **Internationalization**: Wrap all user-facing strings in `<Trans>` or `t()`.

### V. Agent-to-System Security Guardrails, Local RAG & Data Protection

All AI Copilot, natural language entry, and bank/chatbot webhook integrations MUST enforce a strict 3-Tier Permission & Guardrail Model:

- **Tier 1 (Read-Only Analytics — Auto-Approved)**: Bounded AQL queries (`limit <= 100`) for balances, category spending, and net worth.
- **Tier 2 (Scoped Single-Record Writes — Guardrailed)**: Adding a single transaction or budget adjustment requires schema validation, a sanity cap (`|amount| <= 20,000,000 VND` / `$1,000` default threshold), and a deterministic `imported_id` (`ai:<channel>:<msg_id>` or `tcb:<ref_id>:<date>:<amount>`) to guarantee idempotency and prevent duplicates.
- **Tier 3 (High-Value or Bulk Mutations — Mandatory Human-in-the-Loop [HITL])**: Any transaction exceeding the sanity cap, bulk edits (`> 3` records), account deletions, or budget resets MUST pause and present a **Transaction Preview Confirmation Card** requiring explicit user approval before committing.
- **Local Financial RAG & Privacy**: Context retrieval (active accounts, categories, top payees, current month summary) runs 100% locally in-memory/SQLite (<1,200 tokens). Before calling any external LLM API, the **PII Scrubber** MUST redact bank account numbers (`\b\d{8,19}\b`), card numbers, phone numbers, emails, and authentication tokens.

### VI. Anti-Overengineering (KISS & YAGNI)

Build the simplest, cleanest architecture that solves the user's real problem:

- **No external Vector DB** (no Pinecone, Qdrant, Chroma, or pgvector): Actual's categories, accounts, and payees fit in a fast, deterministic local context window + SQLite lookup.
- **No heavy agent frameworks** (no LangChain, LlamaIndex, or AutoGen): Use a lightweight, strictly typed TypeScript tool-calling / intent parser (~250 LOC) with deterministic fallback.
- **No settings bloat**: Ship sensible defaults that work immediately out of the box.

### VII. Mandatory 4-Step Review & Convergence Gate

Every implementation task MUST pass the 4-Step Verification Loop executed from the repository root before completion:

1. `yarn typecheck` — 0 TypeScript or strictness errors across all workspaces.
2. `yarn lint:fix` — 0 `oxlint` / `oxfmt` / `actual/*` rule violations.
3. `yarn test` — Unit and integration tests pass.
4. **Self-Review Audit**: Verify zero raw hex colors, `<FinancialText>` / `styles.tnum` on all numbers, `<Trans>` / `t()` on all strings, and full CRDT undoability.

## Architectural & Security Standards

| Boundary                    | Standard                                                          | Enforcement Mechanism                                                             |
| :-------------------------- | :---------------------------------------------------------------- | :-------------------------------------------------------------------------------- |
| **UI <-> Core**             | Typed IPC via `send(name, args)` in `desktop-client`              | `ServerHandlers` type definitions in `packages/loot-core/src/types/handlers.d.ts` |
| **Webhook <-> Sync Server** | `HMAC-SHA256` signature verification + rate limiting (30 req/min) | Express middleware in `packages/sync-server`                                      |
| **LLM <-> User Data**       | Structured JSON output schema + regex PII redaction               | Guardrail validator in `packages/desktop-client/src/components/ai-copilot/`       |
| **Idempotency**             | Deterministic `imported_id` deduplication                         | `loot-core` transaction reconciliation engine                                     |

## Development Workflow & Quality Gates

All features follow the **GitHub Spec Kit** workflow (`/speckit-constitution` → `/speckit-specify` → `/speckit-plan` → `/speckit-tasks` → `/speckit-implement` → `/speckit-converge`):

1. Specifications live in `specs/<NNN>-<feature-name>/spec.md` with independently testable, prioritized User Stories (`P1`, `P2`, `P3`).
2. Implementation plans (`plan.md`), data models (`data-model.md`), and contracts (`contracts/`) must pass the **Constitution Check** before coding begins.
3. Every task in `tasks.md` maps to a specific User Story (`[US1]`, `[US2]`, `[US3]`) and file path.

## Governance

This Constitution supersedes ad-hoc implementation shortcuts. Any amendment to these principles requires updating `.specify/memory/constitution.md`, incrementing the semantic version, and verifying alignment with `AGENTS.md` and `DESIGN.md`.

**Version**: 1.0.0 | **Ratified**: 2026-11-07 | **Last Amended**: 2026-11-07
