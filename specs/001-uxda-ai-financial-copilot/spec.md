# Feature Specification: UXDA Financial Workspace Revamp, In-App AI Copilot & Techcombank Omni-Channel Bridge

**Feature Branch**: `001-uxda-ai-financial-copilot`

**Created**: 2026-11-07

**Status**: Approved

**Input**: User request: "Setup a Spec Kit for this project with detailed requirements/components, clean code standard, anti-overengineering, 4-step review loop, detailed agent-to-system standard, guardrails, RAG, protect my app and data, Techcombank auto-sync + social chatbot natural language entry, and UX/UI revamp referencing https://theuxda.com/blog/10-most-interesting-financial-ui-ux-designs"

## User Scenarios & Testing _(mandatory)_

### User Story 1 - UXDA Executive Financial Pulse & Envelope Micro-Progress Revamp (Priority: P1)

As a personal finance user opening the Actual Budget workspace, I want an executive-grade financial summary header (inspired by UXDA's _Finera Core Banking_ and _Private Wealth Concierge_) and inline micro-progress bars inside my envelope budget categories (inspired by UXDA's _Liv X_), so that I can immediately see my Net Worth, On-Budget Liquid Cash, overall Monthly Utilization, and per-category burn rate at a glance without losing Actual's fast spreadsheet density.

**Why this priority**: Delivers immediate visual and analytical value on the primary screen (`Budget`) every time the user opens the app, while strictly honoring `DESIGN.md` semantic theme tokens (`theme.*`) and tabular numeral alignment (`FinancialText` / `styles.tnum`).

**Independent Test**: Open `http://localhost:3001/` on any budget (or "View demo"), navigate to the Budget view, and verify the **Executive Financial Pulse** bar displays live Net Worth, Liquid Cash, Monthly Utilization percentage, and an AI Copilot trigger, while each Expense Category row displays a 3px semantic utilization bar underneath the budgeted cell.

**Acceptance Scenarios**:

1. **Given** a loaded budget with accounts and categories, **When** the user views the Budget screen, **Then** the Executive Financial Pulse bar renders at the top displaying Net Worth (`allAccountBalance`), On-Budget Liquid Cash (`onBudgetAccountBalance`), Monthly Budgeted vs. Spent utilization gauge, and a 1-click `AI Copilot (⌘J)` action button.
2. **Given** an expense category with a positive budgeted amount in a month, **When** spending occurs in that category, **Then** a subtle 3px progress bar renders inside the category's month cell using semantic status colors (`theme.noticeTextLight` when `<85%`, `theme.warningText` when `85%–100%`, `theme.errorText` when `>100%` or negative balance).
3. **Given** the user switches between Light, Dark, Midnight, or Nord themes, **When** viewing the Budget page, **Then** all Executive Pulse cards and category micro-progress bars adapt automatically with zero hardcoded hex colors.

---

### User Story 2 - In-App AI Financial Copilot with Local RAG & 3-Tier Guardrails (Priority: P1)

As a user managing daily expenses in Vietnamese or English, I want to press `Cmd/Ctrl + J` (or click the **AI Copilot** button in the Executive Pulse bar) to open a slide-over AI Financial Copilot where I can type natural language commands (e.g., _"Ăn phở 55k bằng Techcombank"_, _"Cafe Highlands 65k"_, _"Lương về +25tr vào Techcombank"_, or _"How much have I spent this month?"_), inspect a guarded **Transaction Preview Card** with matched account and category from Local RAG, and record the transaction with one click (with full `Cmd/Ctrl + Z` undo support).

**Why this priority**: Eliminates manual multi-column data entry friction while protecting user financial data with Local RAG, PII scrubbing, idempotency (`imported_id`), sanity caps (`20,000,000 VND`), and Human-in-the-Loop (HITL) confirmation.

**Independent Test**: Press `Cmd+J` or click `AI Copilot` on the Budget header, enter `"Ăn phở 55k bằng Techcombank"` or click a quick-prompt chip, verify the parsed preview card shows the exact integer amount (`-55,000`), matched account, matched category, and guardrail tier badge, and click **Confirm & Record** to insert the transaction into Actual's SQLite/CRDT ledger.

**Acceptance Scenarios**:

1. **Given** the user is anywhere in the authenticated app, **When** they press `Cmd/Ctrl + J` or click the **AI Copilot** button, **Then** the AI Financial Copilot slide-over drawer opens showing live Local RAG context (active accounts, categories, and guardrail status).
2. **Given** the user enters a natural language expense or income (supporting Vietnamese shorthand like `55k`, `1.5tr`, `25 củ` and English shorthand like `$45.50`, `120k`), **When** the Copilot parses the input, **Then** it matches the best local account and category via Local Financial RAG, Scrubs any raw account/card numbers (`\b\d{8,19}\b`), evaluates the 3-Tier Guardrail Policy, and renders a **Transaction Preview Card**.
3. **Given** a parsed transaction exceeds the Tier 2 sanity cap (`20,000,000 VND` / `$1,000`), **When** the preview card renders, **Then** it flags the action as **Tier 3 — High-Value Guardrail (Mandatory HITL Confirmation)** with a prominent warning banner before allowing execution.
4. **Given** the user confirms a transaction in the Copilot, **When** the transaction is saved via `send('transactions-batch-update', ...)`, **Then** it is assigned a deterministic `imported_id` (`ai:copilot:<hash>`) to prevent duplicates and can be undone immediately via `Cmd/Ctrl + Z`.

---

### User Story 3 - Techcombank Auto-Sync & Omni-Channel Social Chatbot Bridge (Priority: P2)

As a user in Vietnam using **Techcombank** and messaging apps (Messenger, Instagram, Telegram), I want a standardized webhook contract and configuration guide inside the AI Copilot so that incoming VietQR / Casso / SePay bank notifications from Techcombank and social chat messages are verified with `HMAC-SHA256`, deduplicated via `imported_id`, and synced into Actual Budget automatically.

**Why this priority**: Connects the local-first workspace to real-world Vietnamese banking (Techcombank) and mobile messaging without fragile screen-scraping or storing bank passwords.

**Independent Test**: Switch to the **Techcombank & Bot Sync** tab inside the AI Copilot drawer to inspect the live webhook payload tester, simulate a Techcombank credit/debit webhook notification, and verify it parses and records idempotently into the Techcombank account.

**Acceptance Scenarios**:

1. **Given** a Techcombank transaction notification payload (via Casso/SePay or iOS Shortcuts/Notification Forwarder), **When** simulated or received, **Then** the parser extracts the exact integer VND amount, reference code (`FT...`), payee description, and deterministic `imported_id` (`tcb:<ref_id>:<date>:<amount>`).
2. **Given** the same Techcombank notification payload is submitted twice, **When** processed, **Then** the deterministic `imported_id` prevents duplicate insertion.

---

### Edge Cases

- **Duplicate Webhook / Double Click**: Handled via deterministic `imported_id` (`tcb:<ref>:<date>:<amount>` or `ai:copilot:<hash>`) checked before insertion.
- **PII in User Prompt or Bank SMS**: Raw 8–19 digit account/card numbers (e.g., `19038475629102`), emails, and phone numbers are masked (`[REDACTED_ACCT]`) by the PII Scrubber before any external prompt leaves the client.
- **Unmatched Account or Category**: Falls back gracefully to the first open on-budget account (or prompts the user to select an account in the preview card) and leaves category optional if no match is found.
- **Zero Budgeted Amount on Category Row**: Micro-progress bar hides cleanly when budgeted is `0` and spent is `0`, or shows `100%` error state (`theme.errorText`) if unbudgeted spending occurs.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST render an **Executive Financial Pulse** bar at the top of the Budget workspace displaying live Net Worth, On-Budget Liquid Cash, Monthly Spent/Budgeted Utilization percentage, and an AI Copilot launch button.
- **FR-002**: System MUST render a 3px contextual utilization micro-progress bar inside each `ExpenseCategoryMonth` budgeted cell on the Envelope Budget table with semantic color states (`<85%` healthy, `85%–100%` warning, `>100%` or negative balance error).
- **FR-003**: System MUST provide a global **AI Financial Copilot** drawer accessible via `Cmd/Ctrl + J` and the Executive Pulse header button.
- **FR-004**: System MUST implement a **Local Financial RAG** context builder that indexes active accounts and categories in-memory without any external vector database.
- **FR-005**: System MUST implement a **PII Scrubber** that redacts bank account/card numbers (`\b\d{8,19}\b`), emails, and phone numbers from natural language strings.
- **FR-006**: System MUST parse natural language expense and income expressions in both Vietnamese (`k`, `ngàn`, `nghìn`, `tr`, `triệu`, `củ`, `đ`, `vnd`) and English (`$`, `k`) into exact `IntegerAmount` minor units.
- **FR-007**: System MUST enforce a **3-Tier Guardrail Policy Engine**:
  - **Tier 1**: Read-only budget/account queries execute immediately.
  - **Tier 2**: Single transactions within the sanity cap (`<= 20,000,000 VND`) require preview confirmation and carry a deterministic `imported_id`.
  - **Tier 3**: High-value transactions (`> 20,000,000 VND`) display an explicit high-value warning badge requiring deliberate Human-in-the-Loop confirmation.
- **FR-008**: System MUST persist confirmed Copilot and simulated Techcombank webhook transactions through Actual's native `send('transactions-batch-update', ...)` handler so CRDT sync and `Cmd/Ctrl + Z` undo work out of the box.
- **FR-009**: System MUST include a built-in **Techcombank Webhook Simulator & Setup Guide** inside the Copilot drawer so users can test real Techcombank SMS/VietQR/Casso payloads in one click and copy their webhook schema.

### Key Entities

- **`CopilotTransactionProposal`**: Structured representation of a natural-language or webhook transaction (`accountId`, `accountName`, `categoryId`, `categoryName`, `payeeName`, `amount: IntegerAmount`, `date: string`, `notes: string`, `importedId: string`, `guardrailTier: 1 | 2 | 3`, `guardrailWarning?: string`, `scrubbedInput: string`).
- **`LocalFinancialRagContext`**: Lightweight in-memory snapshot of open `AccountEntity[]` and `CategoryEntity[]` used for deterministic fuzzy matching of accounts (e.g., `"Techcombank"`, `"Checking"`) and categories (e.g., `"Food"`, `"Ăn uống"`, `"Rent"`).

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Users can view Net Worth, Liquid Cash, and Monthly Utilization within `<1 second` of opening the Budget page.
- **SC-002**: Users can log a natural language transaction (e.g., _"Ăn phở 55k bằng Techcombank"_) in under `5 seconds` (2 interactions: type/click prompt → click Confirm).
- **SC-003**: 100% of sensitive account/card numbers (8–19 digits) are redacted by the PII Scrubber before external transmission.
- **SC-004**: 100% of new TypeScript/React files pass `yarn typecheck` and `yarn lint:fix` with zero suppressions and zero raw hex colors.

## Assumptions

- Users in Vietnam either use a zero-decimal VND budget or the standard demo budget; the parser supports both shorthand VND (`55k` → `55,000`) and standard decimal amounts (`$45.50`).
- Techcombank real-time sync uses official VietQR / Casso / SePay webhook forwarding or mobile notification forwarding rather than brittle credential scraping.
