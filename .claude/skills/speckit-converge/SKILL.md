---
name: 'speckit-converge'
description: "Assess the current codebase against the feature's spec, plan, and tasks, then append any remaining unbuilt work as new tasks to tasks.md so implement can complete it."
compatibility: 'Requires spec-kit project structure with .specify/ directory'
metadata:
  author: 'github-spec-kit'
  source: 'templates/commands/converge.md'
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Goal

Close the gap between what a feature's specification, plan, and tasks call for and what the codebase currently implements. Read `spec.md`, `plan.md`, and `tasks.md` as the **sole source of intent** (with `.specify/memory/constitution.md` as governing constraints), assess the current state of the code, determine which requirements, acceptance criteria, plan decisions, and existing tasks are unmet, incomplete, or only partially satisfied, and **append each piece of remaining work as a new, traceable task** at the bottom of `tasks.md` so that `/speckit-implement` can complete it.

## Execution Steps

1. Run `.specify/scripts/bash/check-prerequisites.sh --json --require-spec --require-tasks --include-tasks` from repo root and parse JSON for `FEATURE_DIR` and `AVAILABLE_DOCS`.
2. Load `spec.md`, `plan.md`, `tasks.md`, and `.specify/memory/constitution.md`.
3. Build the Intent Inventory (`FR-###`, `SC-###`, user-story acceptance scenarios, plan decisions, constitution principles).
4. Assess the codebase in scope and classify findings (`missing`, `partial`, `contradicts`, `unrequested`) and severity (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`).
5. Present the In-Session Findings Summary table.
6. If actionable findings exist, append a new `## Phase N: Convergence` section at the bottom of `tasks.md`. If 0 findings remain, leave `tasks.md` unchanged and report **"✅ Converged — the implementation satisfies the spec, plan, and tasks."**
