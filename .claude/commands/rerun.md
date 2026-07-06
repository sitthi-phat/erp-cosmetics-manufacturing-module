---
description: Force a specific agent to redo its work, with feedback
argument-hint: <slug> <agent> <feedback / what to fix>
---
$ARGUMENTS

1. Invoke the named agent to redo its work for this slug, including Pond's feedback
   in the prompt along with all original input/output file paths.
2. Record in status.json history that this is a re-run and why.
3. Continue per the Dispatcher Rules.
