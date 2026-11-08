---
name: 'speckit-specify'
description: 'Create or update the feature specification from a natural language feature description.'
compatibility: 'Requires spec-kit project structure with .specify/ directory'
metadata:
  author: 'github-spec-kit'
  source: 'templates/commands/specify.md'
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Outline

The text the user typed after `/speckit-specify` in the triggering message **is** the feature description.

Given that feature description, do this:

1. **Generate a concise short name** (2-4 words) for the feature (e.g., `uxda-ai-financial-copilot`).

2. **Create the spec feature directory**:
   - Run `.specify/scripts/bash/create-new-feature.sh --json --short-name "<short-name>" "<feature_description>"` from the repository root, or resolve `SPECIFY_FEATURE_DIRECTORY` under `specs/<NNN>-<short-name>` and persist it to `.specify/feature.json`:
     ```json
     {
       "feature_directory": "specs/<NNN>-<short-name>"
     }
     ```
   - Set `SPEC_FILE` to `SPECIFY_FEATURE_DIRECTORY/spec.md`.

3. Load `.specify/templates/spec-template.md` to understand required sections, and load `.specify/memory/constitution.md` for project principles and governance constraints.

4. Follow this execution flow:
   1. Parse user description from arguments.
   2. Extract key concepts: actors, actions, data, constraints.
   3. Fill **User Scenarios & Testing** section with independently testable, prioritized User Stories (`P1`, `P2`, `P3`).
   4. Generate testable **Functional Requirements** (`FR-001`, `FR-002`, ...).
   5. Define measurable, technology-agnostic **Success Criteria** (`SC-001`, `SC-002`, ...).
   6. Identify **Key Entities** and **Edge Cases**.

5. Write the specification to `SPEC_FILE`.

6. **Specification Quality Validation**:
   - Create `SPECIFY_FEATURE_DIRECTORY/checklists/requirements.md` and validate all Content Quality, Requirement Completeness, and Feature Readiness criteria.

7. Report completion with `SPECIFY_FEATURE_DIRECTORY`, `SPEC_FILE`, checklist results summary, and readiness for `/speckit-clarify` or `/speckit-plan`.
