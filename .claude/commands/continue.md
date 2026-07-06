---
description: Resume from a stop after Pond answers questions
argument-hint: <slug> <Pond's answers>
---
Feature: $ARGUMENTS

1. Read pipeline/status.json for this slug; find questions with answer == null.
2. Fill in Pond's answers on each question.
3. Invoke the agent named in current_agent to resume, including all answers in its prompt.
4. Continue per the Dispatcher Rules in CLAUDE.md.
