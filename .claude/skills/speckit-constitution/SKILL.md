---
name: 'speckit-constitution'
description: 'Create or update the project constitution from interactive or provided principle inputs.'
compatibility: 'Requires spec-kit project structure with .specify/ directory'
metadata:
  author: 'github-spec-kit'
  source: 'templates/commands/constitution.md'
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Scope Guard

This command's own work is limited to updating the project constitution itself. Dependent templates
and commands read the constitution at runtime and are not modified here.

- Classify every part of the user input as either constitution content or a separate,
  non-governance intent.
- If the input includes feature implementation, code generation, refactoring, building, or
  deployment requests, you **MUST NOT** execute them. Extract them as deferred intents instead.
- You **MUST NOT** create, modify, or delete application source files, feature routes,
  components, tests, deployment files, or other artifacts unrelated to the constitution
  workflow.
- If it is unclear whether an instruction is constitution content, ask for clarification before
  making changes.
- After completing the constitution update, include a `Next Actions` section for each deferred
  intent. List the original intent and suggest the appropriate follow-up Spec Kit command, such
  as `/speckit-specify`, without invoking it.
- If there are no non-governance intents, omit the `Next Actions` section.

## Outline

You are updating the project constitution at `.specify/memory/constitution.md`. The active
constitution scaffold is resolved at command time from `constitution-template` through the Spec Kit
preset/template resolution stack.

Follow this execution flow:

1. Run `.specify/scripts/bash/resolve-template.sh constitution-template --json` from the repository root and parse `TEMPLATE_CONTENT` as the active template.
   - If `.specify/memory/constitution.md` exists, load it as the source of current project-specific
     values and amendments. Preserve information that is still applicable when applying the newly
     resolved scaffold.
   - If it does not exist, use the resolved template as the initial document.
   - Do not write back to any versioned template layer.
   - Identify every placeholder token of the form `[ALL_CAPS_IDENTIFIER]`.

2. Collect/derive values for placeholders:
   - If user input (conversation) supplies a value, use it.
   - Otherwise infer from existing repo context (`AGENTS.md`, `DESIGN.md`, `PRODUCT.md`, `CODE_REVIEW_GUIDELINES.md`, prior constitution versions).
   - `CONSTITUTION_VERSION` must increment according to semantic versioning rules (MAJOR / MINOR / PATCH).

3. Draft the updated constitution content using the resolved template as the required structure:
   - Replace every placeholder with concrete text.
   - Ensure each Principle section captures non-negotiable rules and explicit rationale.
   - Ensure Governance section lists amendment procedure, versioning policy, and compliance review expectations.

4. Validation before final output:
   - No remaining unexplained bracket tokens.
   - Dates ISO format YYYY-MM-DD.
   - Principles are declarative, testable, and use MUST/NEVER normative language.

5. Write the completed constitution back to `.specify/memory/constitution.md` (overwrite).

6. Output a final summary to the user with new version, bump rationale, and suggested commit message.
