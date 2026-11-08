# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]

**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

[Extract from feature spec: primary requirement + technical approach from research]

## Technical Context

**Language/Version**: TypeScript 5.x (Strict mode via `typescript-strict-plugin`)

**Primary Dependencies**: React 19 (`babel-plugin-react-compiler`), `@actual-app/core`, `@actual-app/components`, Express (`sync-server`)

**Storage**: Local SQLite (`better-sqlite3` / `absurd-sql`) + CRDT Sync (`@actual-app/crdt`)

**Testing**: Vitest (`yarn test`) + Playwright E2E/VRT (`yarn e2e` / `yarn vrt:docker`)

**Target Platform**: Web Browser (Vite), Electron Desktop, Node.js Sync Server

**Project Type**: Yarn 4 Monorepo (`loot-core`, `desktop-client`, `component-library`, `sync-server`, `api`, `crdt`)

**Performance Goals**: 60fps UI rendering, <50ms local AQL query latency, <1.5s AI Copilot response

**Constraints**: Local-first CRDT integrity, exact integer currency math (`IntegerAmount`), semantic theme tokens (`theme.*` only), zero `@ts-strict-ignore`

**Scale/Scope**: Personal finance & wealth workspace with multi-account sync, envelope/tracking budgets, and AI Copilot

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- [ ] **I. Local-First & CRDT Integrity**: All mutations go through `loot-core` handlers (`send(...)`) or `@actual-app/api` — never raw SQL bypassing CRDT.
- [ ] **II. Exact Integer Math & Tabular Typography**: All currency values use `IntegerAmount` (`amountToInteger` / `integerToAmount`) and render inside `FinancialText` or `styles.tnum`.
- [ ] **III. Strict TypeScript & Zero Suppressions**: No `@ts-strict-ignore`, `eslint-disable`, or `oxlint-disable`; use `satisfies` over `as`.
- [ ] **IV. Semantic Theme Token Architecture**: 100% `theme.*` tokens across all 5 themes; all user-facing strings wrapped in `<Trans>` or `t()`.
- [ ] **V. Agent-to-System Guardrails & Local RAG**: 3-tier permission model enforced, deterministic `imported_id` idempotency, PII scrubbed before any external LLM call.
- [ ] **VI. Anti-Overengineering (KISS / YAGNI)**: Zero external vector databases, zero heavy agent frameworks, minimal dependencies.
- [ ] **VII. 4-Step Verification Gate**: Passes `yarn typecheck`, `yarn lint:fix`, `yarn test`, and self-review checklist.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
packages/
├── loot-core/           # Core business logic, AQL, SQLite, IPC handlers
├── desktop-client/      # React web/desktop UI (@actual-app/web)
├── component-library/   # Shared UI primitives & icons (@actual-app/components)
├── sync-server/         # Express sync & webhook bridge (@actual-app/sync-server)
└── api/                 # Headless Node.js SDK (@actual-app/api)
```

**Structure Decision**: [Document the selected structure and reference the real directories captured above]

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --------- | ---------- | ------------------------------------ |
