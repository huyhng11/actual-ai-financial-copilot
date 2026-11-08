---
name: 'speckit-taskstoissues'
description: 'Convert existing tasks into actionable, dependency-ordered GitHub issues for the feature based on available design artifacts.'
compatibility: 'Requires spec-kit project structure with .specify/ directory'
metadata:
  author: 'github-spec-kit'
  source: 'templates/commands/taskstoissues.md'
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Outline

1. Run `.specify/scripts/bash/check-prerequisites.sh --json --require-tasks --include-tasks` from repo root and parse `FEATURE_DIR` and `AVAILABLE_DOCS`.
2. Load `.specify/memory/constitution.md` and `FEATURE_DIR/tasks.md`.
3. Verify the Git remote (`git config --get remote.origin.url`) is a GitHub URL, deduplicate against existing issues by Task ID (`\bT\d{3,}\b`), and create issues formatted as `T001: <description>`.
