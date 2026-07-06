---
description: Register a new requirement and start the pipeline
argument-hint: <requirement details, or a filename in inbox/>
---
Pond submitted a new requirement: $ARGUMENTS

Steps:
1. Create a slug (kebab-case English, short, descriptive).
2. If $ARGUMENTS references a file in inbox/, read it as the raw requirement;
   otherwise save this text to inbox/<slug>.md.
3. Register the feature in pipeline/status.json (status: IN_PROGRESS, current_agent: po).
4. Commit: pipeline(<slug>): registered
5. Invoke the po subagent with the slug and the requirement file path.
6. Continue per the Dispatcher Rules in CLAUDE.md (auto-chain / stop on BLOCKED).
