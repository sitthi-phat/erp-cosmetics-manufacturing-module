# ADR-003: Generic Field-Level Audit (app-layer interceptor, not per-table triggers)

- **Status**: Accepted
- **Date**: 2026-07-09
- **Deciders**: Tech-Lead
- **Scope**: Every mutable entity in `erp-v2-ui-first`

## Context

Pond requires field-level audit **everywhere** (`pond-gate1-r2-feedback.md` §12, brief §5):
"ใครทำอะไร ค่าไหนเปลี่ยน จากอะไรเป็นอะไร". `trace.html` already renders it as
`timestamp | user | entity | field | old → new` (verified in mockup). Many state transitions
also require a **mandatory comment/reason** (QC fail, Hold, Follow-up, cancel, return, override,
delete). Audit must be retained **online 1 year, then Super-User manual purge/archive to text
file — no auto-purge** (Pond NFR). Writing audit code per table would be large and error-prone
(the R1 risk).

## Decision

**One central audit mechanism at the application (ORM) layer — never per-table DB triggers.**

- A Prisma **middleware/extension** wraps every `create/update/delete`. For updates it diffs the
  before-image against the after-image and, for each changed field, appends a row to `audit_log`.
- `audit_log` columns: `id`, `entity_type`, `entity_id`, `field` (null for create/delete/action),
  `old_value` (JSON/text), `new_value` (JSON/text), `action` (`create|update|delete|transition`),
  `reason` (nullable; **required** where the transition mandates a comment), `actor_id`, `at` (UTC),
  `request_id` (correlates all field-rows from one save).
- **Status transitions** are also audited here (old status → new status, with reason) so the
  status-history view and the field-audit view come from the same table (avoids "two truths").
- Sensitive fields (password hash, tokens) are on an **audit-exclude list**; only "changed"
  (boolean) is recorded, never the value.
- A `reason` is enforced by the **service/action endpoint** (ADR-004), passed into the audit
  context, so mandatory-comment rules live in one place.

### Retention & archive
- No auto-purge. Rows stay online ≥1 year.
- A **Super-User-only** archive/purge action exports a date range to a text file via the storage
  abstraction (ADR-006, GCS-ready) and then may purge those exported rows. Both the export and the
  purge are themselves audited.
- Index `(entity_type, entity_id, at)` and `(at)` for trace search by entity + date-range/time.

## Alternatives considered

- **Per-table DB triggers**: rejected — dozens of triggers to write/maintain, no access to the
  acting user or the mandatory reason, and MySQL trigger portability/debuggability is poor.
- **CDC / binlog capture**: overkill for this scale, and still lacks user + reason context;
  operationally heavy for a local-PC phase.
- **Per-service manual audit calls**: rejected — the R1 problem; authors will forget fields.
- **Temporal/system-versioned tables**: not needed; we want a queryable field-diff stream and a
  simple archive story, which `audit_log` gives directly.

## Consequences

- Adding a new entity gets audit "for free" — no per-table work (mitigates R1).
- `trace.html` and the Settings → Audit-log screen read one table; status-history is a filtered
  view of it.
- The diff runs inside the write transaction, so audit is atomic with the change (no lost/partial
  audit). At >200 PO/day this is well within budget.
- Archive/purge is a deliberate Super-User action with its own audit trail — satisfies GMP +
  Pond's retention answer.
