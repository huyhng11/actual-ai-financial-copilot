---
name: 'speckit-plan'
description: 'Execute the implementation planning workflow using the plan template to generate design artifacts.'
compatibility: 'Requires spec-kit project structure with .specify/ directory'
metadata:
  author: 'github-spec-kit'
  source: 'templates/commands/plan.md'
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Outline

1. **Setup**: Run `.specify/scripts/bash/setup-plan.sh --json` from repo root and parse JSON for `FEATURE_SPEC`, `IMPL_PLAN`, `FEATURE_DIR`, `BRANCH`.

2. **Load context**: Read `FEATURE_SPEC` and `.specify/memory/constitution.md`. Load `IMPL_PLAN` template (already copied).

3. **Execute plan workflow**: Follow the structure in `IMPL_PLAN` template to:
   - Fill Technical Context
   - Fill Constitution Check section from `.specify/memory/constitution.md`
   - Evaluate gates (ERROR if violations unjustified)
   - **Phase 0**: Generate `research.md` (resolve all technical decisions, rationale, and alternatives considered)
   - **Phase 1**: Generate `data-model.md`, `contracts/`, and `quickstart.md`
   - Re-evaluate Constitution Check post-design

## Completion Report

Command ends after Phase 1 design. Report branch, `IMPL_PLAN` path, and generated artifacts (`research.md`, `data-model.md`, `contracts/`, `quickstart.md`).
