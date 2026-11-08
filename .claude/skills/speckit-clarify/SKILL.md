---
name: 'speckit-clarify'
description: 'Identify underspecified areas in the current feature spec by asking up to 5 highly targeted clarification questions and encoding answers back into the spec.'
compatibility: 'Requires spec-kit project structure with .specify/ directory'
metadata:
  author: 'github-spec-kit'
  source: 'templates/commands/clarify.md'
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Outline

Goal: Detect and reduce ambiguity or missing decision points in the active feature specification and record the clarifications directly in the spec file.

1. Run `.specify/scripts/bash/check-prerequisites.sh --json --paths-only` from repo root and parse `FEATURE_DIR` and `FEATURE_SPEC`.
2. Load `.specify/memory/constitution.md` and `FEATURE_SPEC`.
3. Perform a structured ambiguity & coverage scan across Functional Scope, Domain & Data Model, Interaction & UX Flow, Non-Functional Quality Attributes, Integration, and Edge Cases.
4. Present up to 5 high-impact clarification questions sequentially (with a recommended option for each) and integrate accepted answers under `## Clarifications` and the corresponding spec sections.
5. Re-validate `FEATURE_DIR/checklists/requirements.md` and report completion.
