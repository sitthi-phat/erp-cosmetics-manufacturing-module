# ADR-005: Notification via Transactional Outbox + Read-bit Fan-out

- **Status**: Accepted
- **Date**: 2026-07-09
- **Deciders**: Tech-Lead
- **Scope**: Cross-module Notification/Inbox in `erp-v2-ui-first`

## Context

Every cross-module hand-off must raise a notification (`status-journeys.md` §10, brief). Rules:
recipients = **all users whose role has the `Read` bit on the destination module** (RUCDAA);
the bell (top-right) shows a total badge → expand list → click item = **deep-link to the work
screen + acknowledge** (badge counted per user). Events are produced inside the same transaction
as the state transition that caused them (they must not be lost if that tx commits, nor sent if
it rolls back). Load is light (≤50 users, >200 PO/day). Must be portable Phase 2 (local) → Phase
3 (GCP).

## Decision

### 1. Transactional outbox
- Each state transition (ADR-004) writes its domain event into an **`outbox`** table **in the
  same `$transaction`** as the change + audit. No event is emitted directly during the request.
- A lightweight **dispatcher** (in-process polling loop, ~1s) reads unsent `outbox` rows and
  materializes notifications. This guarantees exactly-once-effect coupling with the state change
  and needs **no external broker** in Phase 2. In Phase 3 the dispatcher can be swapped for
  Pub/Sub without touching producers (they only write `outbox`).

### 2. Read-bit fan-out, per-user acknowledge
- `notification` table = the event (type, `entity_ref`, `deep_link`, `module`, `created_at`).
- Recipients are **not** copied per user at write time (avoids fan-out storms). Instead a user's
  inbox = notifications for modules where the user's role has `Read`, **minus** the rows that user
  has acknowledged, tracked in `notification_ack(notification_id, user_id, ack_at)`.
- Badge count per user = `count(matching notifications) - count(acks)`; opening an item inserts an
  ack (idempotent) → badge decrements (mockup: 5 → click one → 4).
- Optional per-module left-menu badges reuse the same query filtered by module.

### 3. Delivery to the browser
- Phase 2: the bell polls a `GET /notifications?unacknowledged` endpoint (aligned with the 15s
  dashboard cadence). WebSocket/SSE is **not** required for this load and is deferred (keeps the
  local deployment simple and portable). If real-time is later wanted, add SSE without schema
  change.

## Alternatives considered

- **Emit notifications directly in the request handler**: rejected — lost on rollback / sent on
  failure; the outbox makes it atomic.
- **Copy a notification row per recipient at write time**: rejected — recomputing recipients when
  roles change is messy and fan-out is wasteful; Read-bit-at-read-time is always correct.
- **External broker (Kafka/RabbitMQ) now**: rejected — operational weight unjustified at ≤50
  users on a local PC; outbox + Pub/Sub-later keeps the Phase 3 door open.
- **WebSocket push now**: deferred — polling meets the need; revisit if UX demands instant.

## Consequences

- Notifications are atomic with the state change (no ghosts, no losses).
- Role changes instantly and correctly change who sees what (no backfill).
- No broker to run in Phase 2; a clean seam (`outbox` → dispatcher) to adopt Pub/Sub in Phase 3.
- QA tests: transition → exactly one outbox row → recipients = Read-bit holders → ack decrements
  that user's badge only.
