---
description: Pond approves a human gate (gate1 = architecture, gate2 = release)
argument-hint: <slug> <gate1|gate2> [note]
---
$ARGUMENTS

1. Update human_gates for the slug in pipeline/status.json (approved: true, timestamp, note).
2. Commit: pipeline(<slug>): human gate approved by pond
3. gate1 → invoke engineer and qa (phase 1) to work in parallel.
   gate2 → set status DONE, then run the Retro Gate per CLAUDE.md.
