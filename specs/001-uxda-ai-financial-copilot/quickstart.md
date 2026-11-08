# Quickstart & Verification Guide: UXDA Financial Workspace & AI Copilot

**Feature**: `001-uxda-ai-financial-copilot`

## 1. Prerequisites & Running Servers

Both development servers run from the repository root:

```bash
# Start Web UI (Port 3001)
yarn start

# Start Sync Server (Port 5006)
yarn start:server
```

## 2. End-to-End Verification Scenarios

### Scenario 1: Verify UXDA Executive Financial Pulse & Envelope Micro-Progress Bars (US1)

1. Open `http://localhost:3001/` in your browser.
2. If on the setup screen, click **"Don't use a server"** → **"View demo"** (or open your existing budget).
3. At the top of the **Budget** screen, verify the **Executive Financial Pulse** bar displays:
   - **Net Worth** (live `allAccountBalance` with tabular numerals)
   - **Liquid Cash (On-Budget)** (live `onBudgetAccountBalance`)
   - **Month Utilization** progress bar & percentage
   - **AI Copilot (`⌘J`)** launch button
4. In the Envelope Budget category rows below, verify each category with a budgeted amount shows a subtle 3px utilization bar (`theme.noticeTextLight` for `<85%`, `theme.warningText` for `85%–100%`, `theme.errorText` for `>100%`).

### Scenario 2: Verify AI Financial Copilot, Local RAG, PII Scrubber & Guardrails (US2)

1. Press `Cmd + J` (Mac) or `Ctrl + J` (Windows/Linux), or click the **AI Copilot** button in the Executive Pulse header.
2. Click one of the quick-test chips or type:
   - `"Ăn phở 55k bằng Techcombank STK 19038475629102"`
3. Verify:
   - The **PII Scrubber** automatically redacts `19038475629102` to `[REDACTED_ACCT]` and displays a PII Protected badge.
   - The **Local RAG Engine** matches your local account and food/dining category.
   - The **Transaction Preview Card** shows the exact amount, date, payee, category, and **Tier 2 Guardrail** badge.
4. Click **Confirm & Record** and verify the transaction appears immediately in your account register and updates the budget balances. Press `Cmd/Ctrl + Z` to verify instant undo!

### Scenario 3: Verify High-Value Tier 3 HITL Guardrail & Techcombank Webhook Simulator (US3)

1. In the AI Copilot drawer, switch to the **Techcombank & Bot Sync** tab (or enter `"Mua Macbook 45tr bằng Techcombank"`).
2. Verify that amounts exceeding `20,000,000` trigger the **Tier 3 — High-Value Guardrail (Mandatory HITL Confirmation)** warning banner.
3. Click **Simulate Techcombank VietQR / Casso Webhook** to test instant bank notification ingestion with deterministic `imported_id` deduplication.

## 3. Mandatory 4-Step Code Quality Gate

Run from the repository root:

```bash
yarn typecheck
yarn lint:fix
yarn test
```
