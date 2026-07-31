# Platform / Non-functional — Gate-2 Readiness & Gap Report

> **Jo synthesis (decision-input for Pond).** Consolidates 5 read-only role reviews (DevOps · Tech-Lead · QA · Engineer · BA) + Jo's own lens, run 2026-07-31 on the source-of-truth module package.
> This is a **coordination/report artifact, not a build spec** — every fix below is routed to a Team agent (BA/PO/TL/UX-UI/DevOps). Pond's 2026-07-31 decisions are treated as SETTLED and are **not** re-flagged; what is flagged is where a settled decision has **no spec / no AC / no mockup** to build from.

## Bottom line
**Requirements are build-ready. No business-rule gap blocks the build.** All 5 roles converge on the same picture: the module business logic is locked, but four cross-cutting layers are not yet ready for Stage 3:

- **A. Architecture / ADR layer has drifted** — the ADRs + `architecture/*.html` (dated 2026-07-09) still describe the *old* model and now contradict the 29–31 July module decisions. If Engineer builds from them, RBAC / notification / status enums come out wrong.
- **B. Decided-but-not-specced features** — Pond decided several Platform features, but they exist nowhere as spec text, mockup, or AC yet. Can't be built or tested.
- **C. NFRs are values, not measurable AC** — perf/rate-limit/polling stated as numbers, no test oracle; one file still holds the *old* numbers.
- **D. Ops bootstrap gaps** — a freshly deployed system can't log in, and scheduled jobs won't fire on the planned Cloud Run config.

---

## HIGH — must close before / at the start of Stage 3

### A · Architecture & ADR reconciliation  *(owner: Tech-Lead)*
| # | Gap | Contradiction |
|---|-----|---------------|
| **H-A1** | RBAC enforcement | ADR-007 / `db-schema.html` still model **6-bit permission flags**; spec is now **cumulative level** (R<C<U<D<A<Admin, max over active roles). Every endpoint check built from the ADR would be wrong. |
| **H-A2** | Auth / session vs self-disable | JWT stateless 24h means a **self-disabled account keeps a valid token for up to 24h** (Pond's self-disable decision is defeated). No reset-token store / email path in architecture. |
| **H-A3** | Notification model | ADR-005 / `api-notification` still **14 events, ack = read**; spec is **4 event types + dismiss ≠ read + J8 daily digest**. Architecture index still says "7 scheduled jobs". |
| **H-A4** | Redis boundary | Rate-limit (~30/module) + polling + notification fan-out imply a cache/queue tier; **no ADR** says what Redis is/ isn't used for on GCP. |
| **H-A5** | Architecture docs baseline drift | `architecture/*.html` still show **SHP round prefix, Home module, old DN statuses, no RET prefix, no Goods-Receipt object**. Needs a refresh pass so Engineer's baseline matches the module package. |

### B · Decided-but-not-specced Platform features  *(owner: PO spec + UX-UI mockup + BA AC)*
| # | Gap |
|---|-----|
| **H-B1** | **Forget/Reset password** — Pond decided (email field on user, single-use link, 3-day expiry, email delivery) but there is **zero spec/mockup/AC**: no "ลืมรหัสผ่าน" link on login, no reset page, no email field on the user record, no edge handling (expired / reused link / no-enumeration message). |
| **H-B2** | **Account self-disable + re-enable** — decided, but nothing in spec: no self-service disable flow, no re-enable owner (self vs Admin), no session-kill behavior, no "only-Admin self-disables" edge. |
| **H-B3** | **Enumerate the 4 notification types** — spec still carries an open-ended ~8-event list; QA cannot test "4 types" against 8. Need each type: trigger → recipient set (by Read) → deep-link target → dismiss behavior, on one AC each. |
| **H-B4** | **Global submit-confirm popup rule** — "always confirm except search" exists only piecemeal; need one contract: which action classes confirm, exact copy, cancel = zero mutation / no number consumed / no audit. |

### C · Measurable-AC / test-oracle  *(owner: QA + BA)*
| # | Gap |
|---|-----|
| **H-C1** | **`non-functional.md` §1 still shows OLD perf numbers** (P1 < 2s / 50 concurrent) — directly conflicts with Pond's new targets (read AVG 200ms/MAX 1s, write AVG 1s/MAX 3s, ~30 concurrent/module). Must correct before it's used as an oracle. |
| **H-C2** | NFR values (perf, rate-limit, 15s polling) have **no Given/When/Then** — nothing QA can assert pass/fail against. |

### D · Ops bootstrap  *(owner: DevOps + TL)*
| # | Gap |
|---|-----|
| **H-D1** | **No first-Admin / seed bootstrap** — a freshly deployed system has no account, so **nobody can log in** to create the first user. Need a seed/bootstrap procedure. |
| **H-D2** | **Scheduled jobs won't fire** — designed as an in-app scheduler, but Cloud Run at **min-instances = 0** has no always-on process. Need Cloud Scheduler → HTTP endpoint (or min-instances ≥ 1). |

---

## MEDIUM
- **M-1 (Engineer):** how-to-build contracts need to be written as algorithms, not prose — FIFO + negative-stock + QC-pass retro-link; gapless number-on-save under concurrency (transaction/lock); field-level audit capture; effective-permission computation.
- **M-2 (BA):** logout has no story (session invalidated / back-button after logout → no data). 
- **M-3 (BA):** snackbar/toast never defined vs the H-B4 confirm modal — which outcome uses which.
- **M-4 (BA):** session-expiry mid-action behavior + warning lead-time **unquantified** → needs a Pond number (see below).
- **M-5 (BA):** multi-role "effective = max" and cumulative-RBAC **negative** AC (a U user must NOT reach D/A — hidden AND API 403); disabled/deleted role contributes nothing.
- **M-6 (BA):** disabled *account* (not role) login attempt; notification deep-link after Read revoked → 403 handling.
- **M-7 (DevOps):** UAT/Test env not fully defined — deploy pipeline, secret management, DB migration path.

## LOW
- Global-search measurability (result caps, ordering, 0/1/many deep-link); read-all page filters + per-item dismiss; "notification appears within ≤15s" timing AC; Google-login edge cases (popup cancelled, linked-but-disabled, email changed); first-login forced-change abandonment path.

---

## Two micro-decisions Pond still owes (small, block only their own AC)
1. **Session-expiry warning lead-time** — how many minutes before cut-off does the warning show? (currently "warning ก่อนตัด" with no number)
2. **Password complexity specifics** — Pond said "standard, all character types, not overly strict"; BA needs the concrete rule (min length? the exact char-class set?) to write the policy AC.

Everything else is authorable by the Team from decisions already made.

---

## Recommended Gate-2 sequence
1. **TL — architecture reconciliation pass** (H-A1…A5): update ADR-004/005/007/008 + `architecture/*.html` to the cumulative-RBAC / 4-type-noti+J8 / RET / GR-object / Redis-boundary baseline. *This is the gating item for Stage 3.*
2. **PO + UX-UI — spec & mockup the decided-not-specced features** (H-B1 reset-password, H-B2 self-disable) + fold all 2026-07-31 NFR/Platform decisions into `non-functional.md`/`platform.md`/`settings.md`; fix H-C1 old perf numbers.
3. **BA — author AC** for H-B3/H-B4 + the M-series stories (after Pond's 2 micro-decisions).
4. **DevOps — seed/bootstrap + Cloud Scheduler design** (H-D1/H-D2) and UAT env definition.
5. Pond reviews the assembled Gate-2 package.
