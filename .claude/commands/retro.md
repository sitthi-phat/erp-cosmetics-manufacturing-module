---
description: Run a retrospective on a DONE feature to propose agent tuning
argument-hint: <slug>
---
Run the Retro Gate for feature: $ARGUMENTS per CLAUDE.md.

Read the history in pipeline/status.json + git log for this slug, then analyze:
1. Which agent went BLOCKED most, and which question patterns repeat →
   propose additions to Shared Domain Knowledge in CLAUDE.md
2. Which handoffs FAILED / were re-run → propose tightening the source agent's exit gate
3. Where did Pond override → propose prompt/automation adjustments

Output: proposed diffs to the affected files (.claude/agents/*.md or CLAUDE.md).
Do NOT apply them — wait for Pond's approval before committing. Present the summary in Thai.
