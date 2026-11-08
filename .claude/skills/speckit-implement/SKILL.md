---
name: 'speckit-implement'
description: 'Execute the implementation plan by processing and executing all tasks defined in tasks.md'
compatibility: 'Requires spec-kit project structure with .specify/ directory'
metadata:
  author: 'github-spec-kit'
  source: 'templates/commands/implement.md'
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Outline

1. Run `.specify/scripts/bash/check-prerequisites.sh --json --require-tasks --include-tasks` from repo root and parse `FEATURE_DIR` and `AVAILABLE_DOCS`.

2. **Check checklists status** (if `FEATURE_DIR/checklists/` exists):
   - Scan all checklist files in `checklists/` and verify status before proceeding.

3. Load and analyze the implementation context:
   - Read `tasks.md`, `plan.md`, `data-model.md`, `contracts/`, `research.md`, `quickstart.md`, and `.specify/memory/constitution.md`.

4. Execute implementation following `tasks.md` phase-by-phase:
   - Respect dependencies and file-based coordination.
   - Adhere strictly to `.specify/memory/constitution.md` (local-first CRDT mutators, `IntegerAmount` + `FinancialText`/`styles.tnum`, `theme.*` semantic tokens, `<Trans>`/`t()`, zero `@ts-strict-ignore`).
   - Mark completed tasks as `[X]` in `tasks.md`.

5. **Mandatory 4-Step Verification Gate** (from repo root):
   - `yarn typecheck`
   - `yarn lint:fix`
   - `yarn test`
   - Self-review against Constitution principles.
