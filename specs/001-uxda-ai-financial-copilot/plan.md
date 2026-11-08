# Implementation Plan: UXDA Financial Workspace Revamp, In-App AI Copilot & Techcombank Omni-Channel Bridge

**Branch**: `001-uxda-ai-financial-copilot` | **Date**: 2026-11-07 | **Spec**: [spec.md](file:///Users/hoangnguyengiahuy/Documents/VinUni Hub/github/actual/specs/001-uxda-ai-financial-copilot/spec.md)

**Input**: Feature specification from `/specs/001-uxda-ai-financial-copilot/spec.md`

## Summary

Deliver an executive-grade UX/UI revamp for Actual Budget inspired by UXDA's financial design case studies (_Finera Core Banking_, _Private Wealth Concierge_, _Liv X_, _AI Spatial Banking_) paired with a local-first **AI Financial Copilot** and **Techcombank Webhook Simulator**. All components strictly obey `.specify/memory/constitution.md` v1.0.0: zero raw hex colors (`theme.*` only), exact integer currency math (`IntegerAmount` + `FinancialText`/`styles.tnum`), Local Financial RAG without external vector databases, regex PII scrubbing, 3-Tier Guardrail enforcement, and CRDT-safe `send('transactions-batch-update', ...)` mutations.

## Technical Context

**Language/Version**: TypeScript 5.x (Strict mode via `typescript-strict-plugin`, zero `@ts-strict-ignore`)

**Primary Dependencies**: React 19 (`babel-plugin-react-compiler`), `@actual-app/core`, `@actual-app/components`, `react-i18next` (`<Trans>`, `useTranslation`)

**Storage**: Local SQLite + CRDT Sync via `loot-core` IPC handlers (`transactions-batch-update`, `payee-create`)

**Testing**: Vitest (`yarn workspace @actual-app/web run test`) + `yarn typecheck` + `yarn lint:fix`

**Target Platform**: Web Browser (`http://localhost:3001`) & Electron Desktop

**Project Type**: Yarn 4 Monorepo (`packages/desktop-client`)

**Performance Goals**: `<1ms` local RAG parsing & PII scrubbing, 60fps budget table rendering

**Constraints**: 100% semantic `theme.*` tokens, `<FinancialText>` / `styles.tnum` on all numbers, `<Trans>` / `t()` on all user-facing strings, full `Cmd/Ctrl + Z` undo compatibility

**Scale/Scope**: 5 focused modules in `packages/desktop-client/src/components/` + unit tests

## Constitution Check

_GATE: Passed before Phase 0 research and re-verified after Phase 1 design._

- [x] **I. Local-First & CRDT Integrity**: Uses `send('transactions-batch-update', ...)` and `send('payee-create', ...)`; zero raw SQL.
- [x] **II. Exact Integer Math & Tabular Typography**: Uses `amountToInteger` / `integerToAmount` and wraps all financial figures in `<FinancialText>` or `styles.tnum`.
- [x] **III. Strict TypeScript & Zero Suppressions**: All new files are 100% strict TypeScript with `satisfies` and zero `@ts-strict-ignore` or `oxlint-disable` directives.
- [x] **IV. Semantic Theme Token Architecture**: Exclusively uses `theme.*` tokens from `@actual-app/components/theme`; all user-facing text wrapped in `<Trans>` or `t()`.
- [x] **V. Agent-to-System Guardrails & Local RAG**: Implements PII Scrubber (`\b\d{8,19}\b`), Local RAG matcher, deterministic `imported_id` idempotency, and Tier 1/2/3 HITL confirmation.
- [x] **VI. Anti-Overengineering (KISS / YAGNI)**: Zero external vector DBs, zero heavy agent frameworks; clean, self-contained TypeScript modules.
- [x] **VII. 4-Step Verification Gate**: Verified via `yarn typecheck`, `yarn lint:fix`, and Vitest unit tests.

## Project Structure

### Documentation (this feature)

```text
specs/001-uxda-ai-financial-copilot/
├── spec.md                              # Feature specification (US1, US2, US3)
├── plan.md                              # This implementation plan
├── research.md                          # Phase 0 architectural decisions
├── data-model.md                        # Phase 1 TypeScript entities & state machine
├── quickstart.md                        # Phase 1 verification guide
├── checklists/
│   └── requirements.md                  # Validated specification quality checklist
├── contracts/
│   └── agent-tools-and-webhooks.md      # Agent tool schemas & Techcombank webhook contract
└── tasks.md                             # Phase 2 dependency-ordered task list
```

### Source Code (repository root)

```text
packages/desktop-client/src/components/
├── ai-copilot/
│   ├── copilotTypes.ts                  # Strict TypeScript interfaces for RAG, Guardrails & TCB Webhooks
│   ├── copilotEngine.ts                 # PII Scrubber, Local Financial RAG, NL Parser (VN/EN), Guardrail Policy
│   ├── copilotEngine.test.ts            # Unit tests for PII scrubbing, integer parsing, idempotency & guardrails
│   └── AICopilotDrawer.tsx              # Slide-over Copilot UI, HITL Preview Card & Techcombank Webhook Simulator
├── budget/
│   ├── ExecutivePulseBar.tsx            # UXDA Finera/Private Wealth Executive Pulse bar on Budget header
│   ├── index.tsx                        # Mounts ExecutivePulseBar at top of Budget page
│   └── envelope/
│       └── EnvelopeBudgetComponents.tsx # Adds 3px semantic utilization micro-progress bar to ExpenseCategoryMonth
└── FinancesApp.tsx                      # Registers global Cmd/Ctrl+J shortcut & mounts AICopilotDrawer
```

**Structure Decision**: Keep all new UI and Local RAG / Guardrail engine logic cleanly encapsulated in `packages/desktop-client/src/components/ai-copilot/` and `packages/desktop-client/src/components/budget/`, integrating with `loot-core` through the existing typed `send()` IPC bridge.

## Complexity Tracking

Zero Constitution violations. No complexity exemptions needed.
