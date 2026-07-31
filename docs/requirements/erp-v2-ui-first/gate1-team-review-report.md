# Gate-1 FINAL TEAM REVIEW — Consolidated Findings

> **Jo synthesis (decision-input for Pond).** Read-only review by 6 reviewers — PO · UX/UI · BA · Tech-Lead · QA · Jo — 2026-07-31, over the ESSENCE Hub doc + `modules/*.md` requirements + `mockups/*.html`. This is a **report of concerns, not spec** — every fix routes to a Team agent. Gate-2 build work (TL architecture / BA AC / DevOps) stays held.

## Verdict
**The "look" is clean and ready.** UX/UI found **no HIGH look defect**: every spec module has a mockup, zero broken links, uniform shell/nav, product name everywhere, and r16 (cumulative RBAC) / r17 (reset-password, self-disable, session banner, patterns) / r18–r19 (read-driven notification + event set) all render correctly on the canonical screens. **No finding blocks the look approval.**

The findings are **requirement-consistency + notification-semantics** issues — and they cluster heavily around the **notifications** area, which changed rapidly this session (r18 read-driven → r19 event set → r19.1 corrections). Recommend one reconciliation pass to settle them, gated by two Pond decisions.

---

## ⚡ Needs a Pond decision (2 — everything else the Team can resolve with defaults)

**D1 — Customer Follow-up notification trigger.** (raised by QA H4, TL H1/H2, PO #2 — convergent)
The r19.1 decision "near-real-time only, drop the daily due-check" + `customer.md` has **no follow-up due-date field**, yet `platform.md` §4 and the mockup say **"ครบกำหนดติดตาม (due)"**. As written the "due" trigger can never fire, and auto-raised flags (Invoice-Overdue, PO-edit) double-notify.
- **(A) Fire on flag-set only** — drop "ครบกำหนด/due" wording; notify when the follow-up flag is raised (manual or cascade), with a de-dup rule. *Simplest — Jo recommends.*
- **(B) Add a `follow_up_due_date` field** to customer + restore a light daily sweep so it fires on the due date.

**D2 — Own-Brand (ก) sell-from-stock when FG is insufficient.** (BA H1 — `so.md` §5 vs §8 contradict)
§5 implies "must be in stock"; §8 says "warn-not-block (mirror RM)". Mutually exclusive.
- **(A) Hard block if FG Available < qty** — you cannot dispatch stock you don't hold. *Jo recommends.*
- **(B) Warn-not-block** (allow negative FG reserve).

---

## Cluster A — Notification reconciliation (dominant theme; convergent across 5 reviewers)
| # | Finding | Raised by | Fix |
|---|---------|-----------|-----|
| A1 | Follow-up trigger contradiction (no due-date field vs "ครบกำหนด") + double-notify | QA·TL·PO | per **D1** + de-dup rule |
| A2 | "Route ส่งสำเร็จ" & "เอกสารถูกยกเลิก" trigger/scope undefined for multi-Sale routes: "delivered" wording vs mixed DN outcomes; owning-Sale fan-out may expose other customers' orders; Route-cancel → storm (1 RT + N×DN-void) | QA·TL·PO·BA | PO: fire on Route "เสร็จสิ้น" (generic) **scoped to each Sale's own DN**; Route-cancel = single RT notification (suppress derived DN-void); state whether "ลูกค้ายกเลิก" DN status fires doc-cancelled |
| A3 | Fan-out rule inconsistent: "all users with Read" vs owner-scoped parentheticals (Follow-up "Sale ที่ดูแล", Invoice-Overdue "Finance+Sale") | TL M1 | PO: state ONE rule, apply uniformly |
| A4 | Missing handoff events + stale C-codes: old **C5 (Ready-to-Ship→Shipping)** and **C10 (DN-delivered→Finance)** absent from r19; stale `C5/C6/C10/C15/C17/C18` refs persist in qc/production/shipping/pr/return/invoice | BA H2 | PO: decide add-event vs queue-discovered; purge/replace C-code citations |
| A5 | Inner-page bells (32 pages) are flat 6-item, **no 4-category r19 grouping / new events** — older than dashboard.html + notifications.html | UX/UI M1 | UX/UI: regenerate shared inner-page bell to mirror dashboard's 4-category read-driven panel |
| A6 | Badge/read timing: mockup marks read immediately on click; spec says "clears on next poll ≤15s" — no single expected value | QA H1 | PO/UX: state optimistic-immediate vs poll-deferred + P5 tolerance |

## Cluster B — Requirement consistency tidy (quick, low-risk)
- **B1** `permission-matrix.md` §3: add **PO-print / SO-print** rows (R) [PO #3, QA M2]; normalize dual-suffix `(D)/(A)` → single **min-level (D)** with "higher also allowed" note [QA M2]; add **Return void (D) + RET create** rows [PO #4].
- **B2** `README.md` §9: 2 "non-blocking flags" now CLOSED in `non-functional.md §12` — sync the advisory box.
- **B3** `gate1-delta.html`: add **po-print / so-print** cards (known).
- **B4** `return.md` §12: stale "RT→RET" UX note — mockup already RET; mark DONE.
- **B5** `supply-planning.md` §5.1: pin the daily-summary deep-link param (mockup hard-codes `?filter=low-overstock`).
- **B6** `mockups/index.html` gallery: customers card "6 สถานะ" → **5 + ⚑ flag** (page itself is correct).
- **B7** Pin three ambiguous keys: rollup **"latest active DN"** ordering key (recommend most-recent DN status-change among non-void) [QA H5]; **"only Admin" definition** under per-module RBAC (recommend: ≥1 other Active user with effective Settings level = Admin) [QA H6]; **J8 vs J1** ~06:00 ordering/window [QA M1].

## Cluster C — Flow completeness (BA)
- **C1** Own-Brand (ก) FG shortage → per **D2**.
- **C2** SO(ข) produce-to-stock has no clean terminal status — inherits "พร้อมจัดส่ง" (wrong; no customer/DN). Fix: distinct "ผลิตเข้าคลังแล้ว/Completed" + exclude from Route candidates [BA M1].
- **C3** Order cancel while a DN/Route is already active — precedence undefined. Fix: block direct PO/SO cancel while a non-void DN is active (handle via Route/DN) [BA M2].
- **C4** OEM held/cancelled goods disposition (no stock bucket between พร้อมส่ง↔dispatch) [BA M3] + OEM-surplus FG resale path [BA M4] — clarify tracking + whether surplus is sellable.

## Cluster D — Gate-2 (defer; note only)
- Gapless-under-concurrency **test oracle** [QA H3]; measurable NFR AC (i18n/error-state checklists) [QA M6]; **architecture/ADR reconciliation** — already **STALE-marked** in Hub §4, TL reconciles at Gate 2. These are correctly Gate-2, not Gate-1 blockers.

## Cluster E — LOW polish (backlog / optional)
- Mobile bottom-bar is a PO-only template on every page [UX/UI L3]; snackbar+shake demoed on ~3 pages [UX/UI L4]; `notifications.html` bell button navigates to dashboard.html [QA L1]; notifications pager shows 15/20 rows [QA L2].

---

## Recommended plan
1. **Pond decides D1 + D2.**
2. **One PO reconciliation pass** — Cluster A (spec) + B + C, using Pond's D1/D2 + Jo-recommended defaults for the pins (flag any as non-blocking).
3. **One UX/UI pass** — inner-page bell 4-category (A5), Follow-up wording (D1), gallery fixes (B3/B6), + optional polish (E).
4. Re-verify req↔mockup, then **Pond approves the Gate-1 look**.
- Gate-2 (Cluster D) stays held until Gate 1 is approved.

**Confirmed clean (no action)** — per reviewers: DN 6-status enum (identical across modules), Route RT / RET de-collision, numbering-on-save G8, cumulative RBAC ladder + G9 map, read-driven notification mechanics, reserve/consume points, per-invoice override snapshot, GR→QC-gated stock-in + FIFO retro-link, hard-block Disabled/Blacklist customer, inactive-BOM blocks sales, DN-unify one-active invoice, r17 platform screens, r16 role editor.
