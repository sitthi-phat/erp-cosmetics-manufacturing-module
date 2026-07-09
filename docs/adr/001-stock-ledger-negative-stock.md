# ADR-001: Stock as an Append-Only Ledger + Negative Stock (FIFO retro-link)

- **Status**: Accepted
- **Date**: 2026-07-09
- **Deciders**: Tech-Lead (proposed), Pond (confirmed negative-stock + FIFO retro-link, r4.1)
- **Scope**: All inventory/material movement in ESSENCE Hub System (`erp-v2-ui-first`)
- **Supersedes / relates to**: ADR-000 (stack). Directly addresses the DEF-09 defect class from prototype-v1 (stock oversell race).

## Context

Cosmetics manufacturing is GMP-regulated: every finished Batch must be traceable to the
raw-material Lots it consumed (raw Lot → Batch → FG). Two business rules from Pond (r4.1,
`entity-status-map.md` §1.6) shape the inventory model:

1. **Material shortage never blocks production.** A Batch may start ("เริ่มผลิต") and consume
   material even when on-hand is insufficient — because the physical goods may already be on
   the floor before the Goods Receipt (GR) is entered. **On-hand may go negative.**
2. When the GR is later entered, the system must **add stock back**, compensate the negative
   first, and **show clearly that it went negative** (red badge on `stock.html`, notice on
   `goods-receipt.html`).

The prototype stored on-hand as a single mutable scalar and did a *check-then-decrement*
("is there enough? then subtract"). This produced **DEF-09**: concurrent decrements raced and
corrupted the balance. It also could not answer the GMP question "which movement drove the
balance negative, by which Batch, when".

NFR constraints (Pond-answered): ≤50 concurrent users, >200 PO/day + >50 GR/day (light for a
single MySQL instance), page response <2s (hard cap 3s).

## Decision

**Model inventory as an append-only ledger. On-hand is derived, never mutated in place.**

### 1. `stock_movement` — the source of truth (append-only, never UPDATE/DELETE)
Every quantity change is one immutable row:

| column | note |
|---|---|
| `id` | PK |
| `material_id` | FK |
| `lot_id` | **nullable** — null = "unallocated" consumption before the lot exists (see §3) |
| `qty` | signed decimal; **negative = consume**, positive = receive/return-in |
| `reason` | enum: `production_consume`, `goods_receipt`, `return_out`, `adjust`, `retro_alloc` |
| `ref_type` / `ref_id` | Batch / GR / Return / adjustment that caused it |
| `caused_negative` | boolean flag set at insert time if this movement drove the running balance below 0 (for fast reporting/trace) |
| `created_by`, `created_at` | who/when (UTC) |
| `note` | free text (mandatory on `adjust`/`return_out`) |

- **No `CHECK(qty >= 0)` and no pre-read balance check on consume.** Consumption simply appends
  a negative row. This is what makes negative stock legal *and* removes the DEF-09 race — there
  is no check-then-act window to lose.

### 2. Derived on-hand + a materialized balance for speed
- Truth = `SUM(qty)` over the ledger per `(material_id, lot_id)`.
- For read performance we keep a materialized `stock_balance(material_id, lot_id, qty_on_hand,
  updated_at)` updated **in the same transaction** as the movement insert using an **atomic
  relative delta**: `UPDATE stock_balance SET qty_on_hand = qty_on_hand + :delta ...`.
  A relative update is safe under InnoDB row locking and needs **no prior read** — so negatives
  are naturally allowed and there is still no race. `stock_balance` is a cache: it can always be
  rebuilt from `stock_movement`.
- Material-level on-hand for the `stock.html` grid = `SUM(qty_on_hand)` across that material's
  lots (may be negative → render red + "ติดลบ (รอรับเข้า)" badge).

### 3. Negative stock and GMP lot linkage — FIFO retro-link (Pond confirmed)
When a Batch consumes a material for which **no receivable Lot exists yet**, the consume
movement is written with `lot_id = NULL` (an *unallocated* consumption).

- When a **Goods Receipt** later creates the real Lot, a **retro-allocation** step runs in the
  GR transaction: it finds open unallocated consumptions for that material (oldest first) and
  writes paired `retro_alloc` movements that move the consumption onto the new Lot (FIFO),
  restoring the raw-Lot → Batch link that GMP requires. The original unallocated rows are kept
  (append-only) and marked reconciled; the retro-link is visible in `trace.html`.
- The "this receipt compensates X negative units" notice on `goods-receipt.html` is simply
  computed from the pre-GR material balance being < 0 — it is **not special logic**, it is the
  natural netting of a summing ledger.

### 4. Costing is out of scope (quantity-only ledger)
The ledger tracks **quantity only**. Product cost comes from the **BOM cost snapshot**
(ADR-linked, `status-journeys.md` §11). No FIFO/moving-average inventory valuation or COGS is
computed — negative stock would otherwise make consumed-cost ambiguous, and no requirement asks
for it. (Confirmed direction; if COGS enters scope later it is a superseding ADR.)

## Alternatives considered

- **A. Keep a scalar on-hand + `CHECK >= 0`, block on shortage.** Rejected: violates Pond's
  "never block production" rule and cannot represent negative stock.
- **B. Scalar on-hand, allow negative, no ledger.** Rejected: cannot answer GMP "which
  Batch/when drove it negative" nor reconstruct history; still races on concurrent updates.
- **C. Ledger + pessimistic `SELECT ... FOR UPDATE` before every consume.** Rejected as
  unnecessary: since we *allow* negative there is nothing to guard, and the lock would
  reintroduce the DEF-09 contention point for no benefit at this load.
- **D. Provisional/expected lot chosen by operator at production start.** Considered for §3;
  rejected as the default because it forces data entry the operator often cannot provide
  (the lot truly does not exist yet). FIFO retro-link at GR is automatic and lower-friction.
  (Kept as a possible future opt-in.)

## Consequences

- **DEF-09 class eliminated by design** — no check-then-decrement window; appends and relative
  deltas are atomic.
- **Full GMP traceability** — every gram in/out is an immutable row with Batch/Lot/reason/user.
- Reports and the stock grid **must render negative balances** (red + badge), never clamp to 0.
- `stock_balance` is a derived cache → an integrity job can periodically assert
  `stock_balance.qty_on_hand == SUM(stock_movement.qty)` and rebuild on mismatch.
- **Retro-allocation** is a real background/GR-time step that must be covered by integration
  tests (unallocated consume → GR → FIFO retro-link → trace shows raw-Lot→Batch).
- Phase 2 (local PC) → Phase 3 (GCP) unaffected: pure relational design, no engine-specific
  features beyond InnoDB row locking (available in Cloud SQL for MySQL).
- Engineer/QA: the "compensate negative" behaviour is emergent from summation — test it as an
  invariant, not as bespoke branching code.
