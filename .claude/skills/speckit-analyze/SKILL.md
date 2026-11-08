---
name: 'speckit-analyze'
description: 'Perform a non-destructive cross-artifact consistency and quality analysis across spec.md, plan.md, and tasks.md after task generation.'
compatibility: 'Requires spec-kit project structure with .specify/ directory'
metadata:
  author: 'github-spec-kit'
  source: 'templates/commands/analyze.md'
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Goal

Identify inconsistencies, duplications, ambiguities, and underspecified items across the three core artifacts (`spec.md`, `plan.md`, `tasks.md`) before implementation. **STRICTLY READ-ONLY**: Do not modify any files.

## Execution Steps

1. Run `.specify/scripts/bash/check-prerequisites.sh --json --require-spec --require-tasks --include-tasks` from repo root and parse JSON for `FEATURE_DIR` and `AVAILABLE_DOCS`.
2. Load `spec.md`, `plan.md`, `tasks.md`, and `.specify/memory/constitution.md`.
3. Run Detection Passes:
   - A. Duplication Detection
   - B. Ambiguity Detection
   - C. Underspecification
   - D. Constitution Alignment
   - E. Coverage Gaps
   - F. Inconsistency
4. Output the Markdown **Specification Analysis Report**, Coverage Summary Table, and Metrics.
