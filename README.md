# ERP Cosmetics Factory — AI Team Starter Kit

A 6-role AI team (PO, BA, Tech-Lead, Engineer, QA, DevOps) running on Claude Code.
The only human on the team: **Pond (ปอนด์)**.

Language policy: prompts/code/docs in English for token efficiency;
all interaction with Pond (questions, approvals, summaries) stays in **Thai**.

## Structure

```
├── CLAUDE.md               Team charter + dispatcher rules (auto-loaded by the main session)
├── .claude/
│   ├── agents/             The 6-role AI team (edit these files = tune the team)
│   └── commands/           Pond's commands: /new-feature /status /continue /rerun /approve /retro
├── pipeline/
│   ├── status.json         Central state (the dashboard reads this)
│   └── schema.md           Schema + status meanings
├── docs/
│   ├── requirements/       brief, stories, design, tasks (per feature)
│   ├── adr/                Architecture Decision Records
│   ├── test-plans/         Test plans + defect logs
│   └── infra/              Runbook
├── inbox/                  Drop raw requirements as files
├── evals/                  Golden test set for agent regression testing (tuning layer 3)
└── src/                    Source code
```

## Getting started (Phase 1)

```bash
cd erp-ai-team
git init && git add -A && git commit -m "chore: AI team starter kit"
claude
```

Then inside Claude Code:

1. Type `/agents` — verify all 6 appear (po, ba, tech-lead, engineer, qa, devops).
2. Test the pipeline with a first requirement — recommended: have the team build its own dashboard:

```
/new-feature pipeline-dashboard — a single-page HTML app that reads pipeline/status.json
and shows a kanban of which agent holds each feature, its status, gate checklist
pass/fail items, questions awaiting Pond, and links to output files.
Must open directly from the file, no server required.
```

3. Watch the flow: PO will come back with questions (expected!) → answer with
   `/continue pipeline-dashboard <answers>` → at Human Gate 1 →
   `/approve pipeline-dashboard gate1` → at the end → `/approve pipeline-dashboard gate2`
4. Then run `/retro pipeline-dashboard` for the first tuning proposals.

This tests every handoff AND produces a real dashboard you'll keep using.

## Pond's Cheat Sheet

| Goal | Command |
|---|---|
| Submit new work | `/new-feature <details>` |
| Check status | `/status` or open the dashboard |
| Answer pending questions | `/continue <slug> <answers>` |
| Bounce work back | `/rerun <slug> <agent> <feedback>` |
| Approve | `/approve <slug> gate1` / `gate2` |
| Pause work | Tell the dispatcher: "พัก <slug> ไว้ก่อน (ON_HOLD)" |
| Tune the team | Edit `.claude/agents/<role>.md` + commit, or run `/retro <slug>` |

## Phase notes

- **Phase 1 (now)**: test the team + dashboard, all local
- **Phase 2**: real ERP requirements (recommended first module: Inventory / Lot traceability)
- **Phase 3**: grant the devops agent gcloud/Terraform access + CI/CD on GCP
  (the devops agent is already prompt-locked away from cloud work — unlock when the phase arrives)
