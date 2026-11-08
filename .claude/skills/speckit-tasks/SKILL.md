---
name: 'speckit-tasks'
description: 'Generate an actionable, dependency-ordered tasks.md for the feature based on available design artifacts.'
compatibility: 'Requires spec-kit project structure with .specify/ directory'
metadata:
  author: 'github-spec-kit'
  source: 'templates/commands/tasks.md'
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Outline

1. **Setup**: Run `.specify/scripts/bash/setup-tasks.sh --json` from repo root and parse `FEATURE_DIR`, `TASKS_TEMPLATE_CONTENT`, `TASKS_TEMPLATE`, and `AVAILABLE_DOCS`.

2. **Load design documents**: Read from `FEATURE_DIR`:
   - **Required**: `plan.md` (tech stack, libraries, structure), `spec.md` (user stories with priorities `P1`, `P2`, `P3`)
   - **Optional**: `data-model.md`, `contracts/`, `research.md`, `quickstart.md`
   - **Constitution**: Load `.specify/memory/constitution.md`

3. **Generate `tasks.md`**:
   - Phase 1: Setup tasks
   - Phase 2: Foundational tasks (blocking prerequisites)
   - Phase 3+: One phase per User Story in priority order (`[US1]`, `[US2]`, `[US3]`)
   - Final Phase: Polish & Mandatory 4-Step Verification Gate (`yarn typecheck`, `yarn lint:fix`, `yarn test`, self-review audit)
   - Every task MUST strictly follow the format: `- [ ] [TaskID] [P?] [Story?] Description with exact file path`

## Completion Report

Output path to generated `tasks.md` and summary (total task count, task count per story, parallel opportunities, and suggested MVP scope).
