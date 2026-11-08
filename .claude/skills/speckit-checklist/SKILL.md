---
name: 'speckit-checklist'
description: 'Generate a custom checklist for the current feature based on user requirements.'
compatibility: 'Requires spec-kit project structure with .specify/ directory'
metadata:
  author: 'github-spec-kit'
  source: 'templates/commands/checklist.md'
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Execution Steps

1. Run `.specify/scripts/bash/check-prerequisites.sh --json --template checklist-template` from repo root and parse `FEATURE_DIR`, `AVAILABLE_DOCS`, and `TEMPLATE_CONTENT`.
2. Load `.specify/memory/constitution.md`, `spec.md`, `plan.md`, and `tasks.md`.
3. Generate a domain-specific requirements-quality checklist in `FEATURE_DIR/checklists/[domain].md` using `CHK001`, `CHK002`, ... items that evaluate Completeness, Clarity, Consistency, Measurability, and Coverage.
