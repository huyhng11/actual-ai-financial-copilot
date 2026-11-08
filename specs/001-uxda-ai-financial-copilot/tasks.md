---
description: 'Task list for UXDA Financial Workspace Revamp, In-App AI Copilot & Techcombank Bridge'
---

# Tasks: UXDA Financial Workspace Revamp, In-App AI Copilot & Techcombank Bridge

**Input**: Design documents from `/specs/001-uxda-ai-financial-copilot/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/agent-tools-and-webhooks.md`

**Tests**: Unit tests included for the AI Copilot Guardrail, PII Scrubber, and Natural Language Parser engine (`copilotEngine.test.ts`).

**Organization**: Tasks are grouped by user story (`US1`, `US2`, `US3`) to enable independent implementation and verification.

## Phase 1: Setup (Spec Kit Infrastructure & Constitution)

**Purpose**: Initialize official GitHub Spec Kit structure (`.specify/` + `.claude/skills/speckit-*` + `.agents/skills/speckit-*`) and ratify the project constitution.

- [x] T001 Initialize `.specify/` configuration, bash scripts (`.specify/scripts/bash/*.sh`), and templates (`.specify/templates/*.md`)
- [x] T002 [P] Install Spec Kit agent skills in `.claude/skills/speckit-*/SKILL.md` and symlink in `.agents/skills/speckit-*`
- [x] T003 Ratify `.specify/memory/constitution.md` v1.0.0 with 7 Core Principles and 4-Step Verification Gate

---

## Phase 2: Foundational (AI Copilot Types, PII Scrubber, Local RAG & Guardrail Engine)

**Purpose**: Core pure-TypeScript engine (`copilotTypes.ts` and `copilotEngine.ts`) that powers both the In-App AI Copilot (`US2`) and the Techcombank Webhook Simulator (`US3`).

- [x] T004 Create strict TypeScript data models in `packages/desktop-client/src/components/ai-copilot/copilotTypes.ts`
- [x] T005 Implement PII Scrubber (`scrubPii`), Local Financial RAG matcher (`matchAccountAndCategory`), bilingual Vietnamese/English natural language parser (`parseNaturalLanguageTransaction`), and 3-Tier Guardrail Policy Engine (`evaluateGuardrailTier`) in `packages/desktop-client/src/components/ai-copilot/copilotEngine.ts`
- [x] T006 [P] Add unit tests for PII redaction, Vietnamese/English amount parsing (`55k`, `1.5tr`, `$45.50`), deterministic `imported_id`, and Tier 2/Tier 3 guardrail escalation in `packages/desktop-client/src/components/ai-copilot/copilotEngine.test.ts`

---

## Phase 3: User Story 1 - UXDA Executive Financial Pulse & Envelope Micro-Progress Revamp (Priority: P1) 🎯 MVP

**Goal**: Surface executive-level Net Worth, On-Budget Liquid Cash, Monthly Utilization, and per-category 3px semantic utilization bars on the Budget workspace using 100% `theme.*` tokens and `FinancialText` / `styles.tnum`.

**Independent Test**: Load the Budget page on `http://localhost:3001/` and verify the Executive Financial Pulse bar and category micro-progress bars render and adapt across themes.

- [x] T007 [P] [US1] Create `ExecutivePulseBar` component in `packages/desktop-client/src/components/budget/ExecutivePulseBar.tsx` displaying Net Worth (`allAccountBalance`), On-Budget Liquid Cash (`onBudgetAccountBalance`), Month Utilization gauge, and `AI Copilot (⌘J)` button
- [x] T008 [P] [US1] Add 3px contextual utilization micro-progress bar (`<85%` `theme.noticeTextLight`, `85%–100%` `theme.warningText`, `>100%` `theme.errorText`) to `ExpenseCategoryMonth` in `packages/desktop-client/src/components/budget/envelope/EnvelopeBudgetComponents.tsx`
- [x] T009 [US1] Integrate `ExecutivePulseBar` into the Budget workspace header in `packages/desktop-client/src/components/budget/index.tsx`

---

## Phase 4: User Story 2 - In-App AI Financial Copilot with Local RAG & 3-Tier Guardrails (Priority: P1)

**Goal**: Provide a global `Cmd/Ctrl + J` slide-over AI Financial Copilot drawer that parses natural language expenses/income, shows a HITL **Transaction Preview Card** with PII protection and guardrail tier badges, and commits via `send('transactions-batch-update', ...)`.

**Independent Test**: Open the AI Copilot via `Cmd/Ctrl + J` or the Executive Pulse button, test `"Ăn phở 55k bằng Techcombank"`, confirm the preview card, and verify the transaction is recorded and undoable via `Cmd/Ctrl + Z`.

- [x] T010 [US2] Create `AICopilotDrawer` component in `packages/desktop-client/src/components/ai-copilot/AICopilotDrawer.tsx` with Natural Language input, quick-prompt chips, Tier 1 Read-Only Financial RAG Q&A (`answerReadOnlyFinancialQuery`), Local RAG status badges, HITL Transaction Preview Card, and `send('transactions-batch-update', ...)` execution
- [x] T011 [US2] Mount `AICopilotDrawer` and register the global `Cmd/Ctrl + J` keyboard shortcut and custom `actual:open-ai-copilot` event listener in `packages/desktop-client/src/components/FinancesApp.tsx` and quick-launch button in `packages/desktop-client/src/components/sidebar/Sidebar.tsx`

---

## Phase 5: User Story 3 - Techcombank Auto-Sync & Omni-Channel Social Chatbot Bridge (Priority: P2)

**Goal**: Enable 1-click simulation of Techcombank VietQR / Casso / SePay webhook notifications and live Sync Server (`:5006`) webhook ingestion (`POST /webhooks/v1/techcombank`, `POST /webhooks/v1/social-chat`, `GET /webhooks/v1/queue`, `POST /webhooks/v1/queue/ack`) with deterministic `imported_id` deduplication.

**Independent Test**: Open the **Techcombank & Bot Sync** tab in `AICopilotDrawer`, click a simulated Techcombank webhook preset or pull from `http://localhost:5006/webhooks/v1/queue`, verify idempotent transaction creation, and verify duplicate protection on second click.

- [x] T012 [US3] Implement `parseTechcombankWebhook` and interactive Techcombank / Social Chatbot Webhook Simulator & Live Sync Server Queue Puller inside `packages/desktop-client/src/components/ai-copilot/AICopilotDrawer.tsx`
- [x] T012b [US3] Implement Express webhook endpoints (`POST /webhooks/v1/techcombank`, `POST /webhooks/v1/social-chat`, `GET /webhooks/v1/queue`, `POST /webhooks/v1/queue/ack`) in `packages/sync-server/src/app-webhooks.ts` and mount in `packages/sync-server/src/app.ts`

---

## Phase 6: Polish & Mandatory 4-Step Verification Gate

**Purpose**: Run the full Constitution Principle VII verification loop from the repository root.

- [x] T013 Run `yarn typecheck` from repository root and verify 0 TypeScript errors
- [x] T014 Run `yarn lint:fix` from repository root and verify 0 `oxlint` / `oxfmt` / `actual/*` errors
- [x] T015 Run Vitest unit tests (`yarn workspace @actual-app/core run test` / `copilotEngine.test.ts`) and verify all tests pass
