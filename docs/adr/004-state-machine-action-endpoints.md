# ADR-004: State-Machine Action Endpoints + Response Envelope + Pagination

- **Status**: Accepted
- **Date**: 2026-07-09
- **Deciders**: Tech-Lead
- **Scope**: All REST APIs in `erp-v2-ui-first`

## Context

`status-journeys.md` and `entity-status-map.md` define strict lifecycles for Customer, PO
(2-track), PRD, Batch, Lot, PR, GR, Shipment, DN, Invoice — every transition must: be legal for
the current state + actor's RUCDAA rights, capture a (sometimes mandatory) comment, write audit +
status-history, and fire cross-module cascades/notifications **in one transaction**. The UI must
not show raw enums, must paginate every list, and must support dashboard drill-down and
notification deep-links. We need one consistent API shape so BA use-cases map 1:1 to endpoints.

## Decision

### 1. Transitions are explicit action endpoints, not `PATCH {status}`
`POST /api/{module}/{id}/{action}` (e.g. `POST /po/{id}/confirm`, `/po/{id}/cancel`,
`/po/{id}/reopen`, `/production/{prdId}/accept`, `/production/{prdId}/start`,
`/qc/{batchId}/pass`, `/qc/{batchId}/fail`, `/shipping/{dnId}/deliver|reject|postpone`).

- The server owns the state machine: it validates `from → to` legality, checks RUCDAA
  (incl. `Admin` bit for force-override), enforces mandatory `reason`, then executes the
  transition + cascades + audit + outbox events **inside one `$transaction`**.
- Generic `PATCH` cannot express "which transition + which rights + which cascade" and would let
  the client set illegal states — forbidden.

### 2. Standard response envelope
```json
{ "data": <payload|null>,
  "meta": { "page": 1, "pageSize": 20, "total": 1204 },   // lists only
  "error": null }
```
On error: `{ "data": null, "error": { "code": "PO_INVALID_TRANSITION", "message": "<Thai>",
"details": {...} } }`. `code` is a stable machine string; `message` is human Thai for direct UI
display (no raw enum). A global Nest interceptor wraps all responses.

### 3. Pagination & search
- Every list endpoint: `?page&pageSize&sort&q&<filters>`; `meta.total` for the pager shown in
  mockups. Trace/audit (up to ~1.2M rows) uses **keyset/seek pagination** on `(at, id)` to stay
  <2s (hard cap 3s) — offset paging only for small module lists.
- Multi-field search matches the mockups (e.g. PO search by 3 date types; shipping search by PO
  ID or customer name/company/contact phone/contact name).

### 4. Dashboard drill-down & notification deep-link
- Each KPI tile has a **summary** endpoint (counts) and a **list** endpoint that accepts the same
  filter context, so clicking a tile opens the list pre-filtered and each row deep-links into the
  owning module with context (auto-refresh 15s keeps the current view via query params, not
  server state).
- Notification items carry `deepLink` (route + params) so the bell → item → work screen path is
  data-driven (ADR-005).

### 5. Concurrency
- Mutable-by-many entities (PO, PRD, stock balance) carry a `version` (optimistic lock); a stale
  write returns `409 CONFLICT_STALE`. Gapless number issuance uses `SELECT ... FOR UPDATE`
  (ADR-008). Stock consume needs neither (ADR-001).

## Alternatives considered

- **REST `PATCH /status`**: rejected (illegal-state risk, no per-transition rights/cascade).
- **GraphQL**: unnecessary; REST + envelope maps cleanly to per-screen use-cases and is simpler
  for the team and for the static API spec pages.
- **RPC-style single endpoint**: harder to document per screen and to secure per action.

## Consequences

- BA use-cases map 1:1 to action endpoints (documented per module in `api-<module>.html`).
- All transition rules, rights, mandatory comments, cascades, audit, and events live behind one
  pattern — testable uniformly (QA writes one transition-matrix test per entity).
- UI never receives raw enums; errors are display-ready Thai.
- Keyset pagination keeps trace search within the performance NFR.
