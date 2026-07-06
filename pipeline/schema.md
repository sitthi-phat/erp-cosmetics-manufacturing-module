# pipeline/status.json — Schema

Single source of truth for the pipeline. Every agent reads/writes this file.
The dashboard reads only this file.

## Structure

```json
{
  "features": {
    "<slug>": {
      "title": "Human-readable feature name",
      "created_at": "2026-07-06T09:00:00+07:00",
      "current_agent": "ba",
      "status": "READY_FOR_TECHLEAD",
      "human_gates": {
        "gate1_architecture": {"approved": false, "approved_at": null, "note": null},
        "gate2_release": {"approved": false, "approved_at": null, "note": null}
      },
      "history": [
        {
          "agent": "po",
          "status": "READY_FOR_BA",
          "gate_checklist": [
            {"item": "Business Key Value is measurable", "pass": true, "missing": null},
            {"item": "Definition of Done complete", "pass": true, "missing": null}
          ],
          "output_files": ["docs/requirements/<slug>/brief.md"],
          "questions_for_pond": [],
          "summary": "Refined requirement into a brief; scope is clear",
          "overridden_by": null,
          "updated_at": "2026-07-06T09:30:00+07:00"
        }
      ]
    }
  }
}
```

## Allowed values

**status** (feature-level = latest history entry):
| Value | Meaning | Dispatcher action |
|---|---|---|
| `IN_PROGRESS` | agent working | wait |
| `READY_FOR_BA` / `READY_FOR_TECHLEAD` / `READY_FOR_QA_VERIFY` / `READY_FOR_DEVOPS` | gate passed | auto-chain to next agent |
| `BLOCKED_NEED_INPUT` | missing input | stop; show questions_for_pond (Thai) |
| `WAITING_HUMAN_GATE` | awaiting Pond's approval | stop; summarize decision for Pond (Thai) |
| `FAILED` | QA found defects / gate failed | hand back to prior agent with feedback |
| `ON_HOLD` | paused by Pond | do nothing until resumed |
| `DONE` | passed gate 2 | run retro |

**Write rules**
- An agent appends only its own entry to `history`, then updates the feature-level
  `current_agent` / `status`.
- Never delete or edit past history (append-only) — this is the audit trail.
- Each item in `questions_for_pond`: `{"q": "... (Thai)", "options": ["...", "..."], "answer": null}`.
  When Pond answers, the dispatcher fills `answer` and passes it to the agent's next run.
