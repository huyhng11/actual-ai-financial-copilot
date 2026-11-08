# Phase 0 Research: UXDA Financial Workspace Revamp, In-App AI Copilot & Techcombank Bridge

**Feature**: `001-uxda-ai-financial-copilot`
**Date**: 2026-11-07

## 1. UXDA Financial UI/UX Patterns Mapped to Actual Budget's `DESIGN.md`

- **Decision**: Implement an **Executive Financial Pulse** bar (`ExecutivePulseBar.tsx`) at the top of the Budget workspace and **3px Contextual Micro-Progress Bars** inside `EnvelopeBudgetComponents.tsx` (`ExpenseCategoryMonth`), plus a `Cmd/Ctrl + J` **AI Financial Copilot Drawer** (`AICopilotDrawer.tsx`).
- **Rationale**:
  - UXDA's _Finera Core Banking_ and _Private Wealth Concierge_ case studies emphasize immediate executive visibility into Net Worth, Liquid Cash, and Burn Rate at the top of the workspace.
  - UXDA's _Liv X_ and _AI Spatial Banking_ case studies showcase visual envelope progress indicators and conversational AI copilots embedded directly into the financial workflow.
  - Actual Budget's `DESIGN.md` mandates keeping the dense spreadsheet grid as the hero element, using semantic `theme.*` tokens exclusively, and wrapping all numbers in `FinancialText` / `styles.tnum`.
- **Alternatives Considered**:
  - _Full-screen glassmorphism overhaul_: Rejected because `DESIGN.md` explicitly prohibits decorative glassmorphism/neon gradients that break Actual's 5 themes (Light, Dark, Midnight, Nord, Development) or reduce spreadsheet row density.

## 2. Local Financial RAG vs. External Vector Database

- **Decision**: Use a deterministic **In-Memory Local Financial RAG Engine** (`copilotRag.ts`) powered by Redux/AQL state (`useAccounts()`, `useCategories()`) and bilingual Vietnamese/English keyword synonyms.
- **Rationale**:
  - A personal finance budget has ~5–20 accounts and ~15–60 categories. Matching `"Techcombank"`, `"TCB"`, `"Ăn phở"`, `"Cafe"`, or `"Groceries"` against active accounts and categories takes `<1ms` locally in TypeScript with zero network latency and zero privacy leakage.
- **Alternatives Considered**:
  - _External Vector DB (Pinecone / Qdrant / Chroma)_: Rejected per Constitution Principle VI (Anti-Overengineering) — adds unnecessary infrastructure, latency, and privacy risk.

## 3. Agent-to-System Mutation Path & Undoability

- **Decision**: Dispatch all Copilot and simulated Techcombank webhook transactions via `send('transactions-batch-update', { added: [...] })` and create missing payees via `send('payee-create', { name })`.
- **Rationale**:
  - `transactions-batch-update` in `packages/loot-core/src/server/transactions/app.ts` automatically wraps mutations in `withUndo()`, generates CRDT messages, updates account/category balances reactively, and supports `imported_id` deduplication.
- **Alternatives Considered**:
  - _Direct SQLite `INSERT`_: Rejected per Constitution Principle I (violates CRDT sync and breaks undo).

## 4. Techcombank (Vietnam) Auto-Sync Architecture

- **Decision**: Support VietQR / Casso / SePay / iOS Shortcuts webhook payload formats with deterministic `imported_id` (`tcb:<reference>:<date>:<amount>`) and provide an interactive **Techcombank Webhook Simulator & Config Guide** inside the AI Copilot drawer.
- **Rationale**:
  - Techcombank does not offer public retail OAuth2 read APIs for individuals, but Casso.vn, SePay.vn, and Techcombank mobile notifications emit structured transaction alerts (`+/- VND`, `FT...` reference code, description). Using deterministic `imported_id` guarantees zero duplicates even if a webhook retries.
