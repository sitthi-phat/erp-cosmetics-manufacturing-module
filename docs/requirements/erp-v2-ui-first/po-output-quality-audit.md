# PO Output — Independent Quality Audit (Requirement Package)

slug: `erp-v2-ui-first` · reviewer: Tech-Lead (independent lens, NOT the authoring PO) · 2026-07-31
scope reviewed: `modules/*.md` (all ~25 + `flows/`, `permission-matrix`, `non-functional`, `deletion-policy`, `comment-convention`, `numbering-on-save`), `entity-status-map.md`, `scope-oem-ownbrand-supply-planning.md` (D1–D18), cross-checked vs `mockups/` and the HTML render plumbing (`functional-spec/modules/_render.js` + `index.html`).
mandate: is the PO's output detailed enough, are flows complete, has business logic been dropped/contradicted, are docs consistent across modules? **Findings only — no spec was edited.**

## สรุปภาษาไทย (สำหรับปอนด์)
ตรวจสอบคุณภาพงาน requirement ของ PO แบบอิสระ (คนละสายตากับคนเขียน). **ภาพรวม: ชุดเอกสาร "แข็งแรงจริง พร้อมสร้างเป็นส่วนใหญ่"** — ราย module ลึกมาก (ฟิลด์มีชนิด/บังคับ/validation, สถานะ+ทางเปลี่ยน, สิทธิ์ต่อปุ่ม+รหัส G9, flow, formula, cross-link). business logic สำคัญครบและสอดคล้องกัน (reserve/consume Option A, QC-gate เข้าสต็อก + ติดลบ/FIFO retro-link ตอน QC ผ่าน, surplus ตอนพร้อมส่ง, DN 6 สถานะ + PO/SO สะท้อน DN, 1 DN=1 order + rollup, BOM/RM สร้างแล้วล็อกรหัส, Inactive block, 1 ใบ active + per-invoice override + DN-unify, เครดิต 60, VAT ตามวันออกใบ, GMP trace, RUCDAA+G9, audit non-read+login). **ไม่พบ "ตัวบล็อก" ที่ทำให้สร้างไม่ได้.** ปัญหาที่เจอเป็นขอบ ๆ: **(1) ไฟล์ flow 2 ใบยังใช้สถานะเก่า (In Delivery/ส่งถึง) ขัดกับโมเดล DN ที่เป็นทางการ** — ต้องแก้ก่อน QA เขียน e2e. **(2) รหัส "RT" ชนกัน (Route vs ใบคืน Return) และเลขเอกสารใบคืนไม่ถูกนิยามใน numbering.** **(3) มี tag แปลกปลอม `</content>`/`</invoke>` หลุดค้างใน .md 4 ไฟล์.** **(4) เอกสาร scope (อ้างเป็น locked ref) ยังมีสถานะใบเสนอราคาเก่า Sent/Agreed.** ที่เหลือเป็นเรื่องเล็ก/ให้ยืนยัน. รวม: **Critical 1 · Major 3 · Minor 4.**

---

## Overall quality verdict

**Build-ready: YES, with a short reconciliation pass.** This is a high-quality, unusually detailed requirement package. The per-module `.md` files consistently carry: typed/required/validated fields, full status lifecycles with transitions, per-action permissions with G9 suffix codes, screen inventories, user-stories with happy/edge/error AC, formulas, and dense cross-links. The **authoritative core** (`po` · `so` · `invoice` · `delivery-note` · `shipping` · `stock` · `qc` · `goods-receipt` · `production` · `bom` · `supply-planning` · `customer` · `entity-status-map` · `permission-matrix` · `non-functional`) is internally consistent, and the hardest business rules are specified with real rigor:

- Reservation/consume **Option A** (confirm=reserve, start-production/dispatch=consume) — present in po/so/stock/production/entity-status-map.
- **QC-gated stock-in** with negative-stock compensation + **FIFO retro-link deferred to QC-pass** — fully reconciled across `goods-receipt.md` §9 / `qc.md` §4.1 / `stock.md` §6 / entity-status-map §1.8, including the "credit trigger moved from GR→QC-pass, mechanism unchanged" note.
- **Surplus @ Ready-to-Ship (D13)**, over/under-production (actual ≥ ordered; under = edit-PO first → follow-up + field-audit).
- **DN 6-status model** + **PO/SO delivery status = mirror of active DN** + rollup = latest active DN — identical wording in delivery-note/shipping/po/so/entity-status-map/dashboard.
- **1 DN = 1 order**, Route cancel → DN void → order requeues to "พร้อมจัดส่ง".
- **BOM/RM/FG code = user-entered + unique + create-only-lock (D11 v2)**; Inactive-BOM hard-blocks new QT/PO/SO and is excluded from Supply Planning.
- **Invoice: multiple-but-one-active + per-invoice override (snapshot, master untouched) + DN-unify**, void-only, credit 30/60/90 default 60, **VAT by invoice date**, overdue counted from DN "ส่งสำเร็จ".
- **RUCDAA + Admin → 6 public codes R/C/U/D/A/Ad (G9)**; **audit = all non-read + login/logout**, Admin-only viewer.
- **G8 number-on-save** (gapless, on-save, popup, NS7 multi-number for GR+Lot and RT+DN) is a clean cross-cutting spec.

**Strongest modules:** `goods-receipt` + `qc` + `stock` (QC-gate chain), `production`, `bom`, `invoice`, `delivery-note`/`shipping` (Route/DN rewrite), `permission-matrix`. **Weakest artifacts:** the two `flows/*.md` files — they were **not** refreshed to the DN-mirror model and are the only place the old terminal statuses survive inside the canonical set. Flow-branch coverage itself (reject→Rework, cancel→release, partial→new PR, void, postpone/awaiting-new-date, Route-cancel requeue) is actually **strong — but it lives in the modules, not in the thin flow files.**

Counts: **Critical = 1 · Major = 3 · Minor = 4.** None force the Engineer to guess a *core* requirement; the RT/numbering gap (Major #1) is the one place a peripheral requirement is genuinely undefined.

---

## CRITICAL

### C1 — The two end-to-end flow files carry stale terminal delivery statuses that contradict the authoritative DN-mirror model
- **Where:** `modules/flows/oem-flow.md` §4 (`PO fulfilment: Draft→Confirmed→In Production→Ready→In Delivery→Delivered`) and step 10 (`ออก DN … → ส่งถึง`); `modules/flows/ownbrand-flow.md` §1/§5 (`SO (ก): ร่าง → พร้อมส่ง → กำลังจัดส่ง → ส่งถึง → billing`) and step 4 (`ออก DN … → ส่งถึง`).
- **What's wrong:** These directly contradict the now-authoritative rule that PO/SO delivery status is **not an independent enum** after "พร้อมจัดส่ง" but **mirrors the DN's 6 statuses** (`po.md` §4b, `so.md` §4, `delivery-note.md` §7/§8, `entity-status-map.md` §1.2/§1.10). `po.md` §4b/§7 explicitly says *"ห้าม hardcode enum In Delivery/Delivered เดิม"* and the dashboard delta forbids "In Delivery / ส่งถึงแล้ว". The flow files still use exactly those retired terms (`In Delivery`, `Delivered`, `ส่งถึง`, `กำลังจัดส่ง→ส่งถึง`).
- **Why it matters for build:** `flows/*.md` are the named "end-to-end flow" reference — the artifact QA/BA use to write e2e test oracles and the UI status enum. A builder taking the flow as truth would encode the wrong terminal states, producing a status model that conflicts with every other module. README precedence ("module package wins") resolves the conflict *in principle*, but leaving a live contradiction inside the canonical set is a doc-quality defect on the single most cross-cutting rule.
- **Suggested fix:** Refresh both flow files' §Status-touchpoints and DN steps to the DN-mirror wording: `พร้อมจัดส่ง → [mirror DN] อยู่ระหว่างการเตรียม → อยู่ระหว่างจัดส่ง → ส่งสำเร็จ / ลูกค้าเลื่อนส่ง / ลูกค้ายกเลิก / ลูกค้ายังไม่กำหนดวันรับใหม่`, and replace "ส่งถึง" with "ส่งสำเร็จ". One-paragraph edit each; no logic change.

---

## MAJOR

### M1 — "RT" prefix collision (Route vs Return) + Return document number is undefined in the numbering authority
- **Where:** `shipping.md` §3 / `non-functional.md` D-F5 / `numbering-on-save.md` define **Route = `RT-{YYYYMMDD}-{NNNN}`**. Meanwhile `return.md` §3 labels the Return document **"เลขใบคืน (RT)"**, and `stock.md` §6, `return.md` §4/§10, `traceability.md` (Return topic) all reference the return-ledger source as **"Lot + RM + Supplier + RT"**.
- **What's wrong:** (a) **`RT` is overloaded** — it is both the Route prefix (shipping) and the token used for the Return document across stock/return/traceability. In the return-ledger `source = …/RT`, a reader cannot tell whether `RT` means the Route or the Return doc. (b) The **Return document number format is not listed** in `numbering-on-save.md` §4 or `non-functional.md` D-F5 (which enumerate PO/QT/SO/PR/GR/PRD/Batch/DN/INV/RT-route — but no Return). Return is a commercial doc (void-only, gapless per deletion-policy) yet has no defined number pattern.
- **Why it matters for build:** The Engineer must implement the Return document identifier and its ledger source ref with **no numbering spec and a colliding abbreviation** — i.e. forced to guess (violates the exit-gate "no task forces the Engineer to guess"). Trace/audit queries keyed on "RT" would ambiguously match Route and Return.
- **Suggested fix:** Give the Return document its own prefix (e.g. `RET-{YYYYMM}-{NNNNNN}` or `RN-…`) and add it to `numbering-on-save.md` §4 + `non-functional.md` D-F5; update the return-ledger source token in `stock.md`/`return.md`/`traceability.md` from `RT` to the new prefix. Keep Route = `RT-…`.

### M2 — Stray tool-wrapper closing tags leaked into 4 authoritative `.md` files
- **Where:** `customer.md:177` (`</content>`), `invoice.md:142-143` (`</content>` + `</invoke>`), `numbering-on-save.md:68` (`</content>`), `permission-matrix.md:185` (`</content>`).
- **What's wrong:** These are accidental XML-ish closing tags from the PO's write tooling, embedded at the tail of the markdown body. They are not spec content.
- **Why it matters for build:** These four files are **rendered to the HTML review hub via `_render.js`** (the surface Pond/BA/QA read). Stray tags render as literal junk or can truncate/confuse the rendered view, and they signal a systematic leak in the PO's write process that could recur/worsen in future rounds.
- **Suggested fix:** Delete the trailing stray tags from the 4 files; add a "no wrapper tags in body" check to the PO's file-finalization step (see PO-procedure recommendations).

### M3 — The "locked business rules" scope doc still carries the retired Quotation lifecycle (Sent/Agreed) and `SHP` numbering
- **Where:** `scope-oem-ownbrand-supply-planning.md` lines ~70, ~236, ~263, ~267 — Quotation lifecycle shown as `Draft → Sent → Agreed → Convert-to-PO`, and doc-number list includes `SHP`.
- **What's wrong:** The current authoritative `quotation.md` §4 removed **"ส่งแล้ว (Sent)"** entirely (Pond revert 2026-07-29) and reseated **"Agreed" → "Confirmed"**; Route renamed `SHP → RT` (Q1=A). The scope doc — which CLAUDE.md/README cite as the **locked D1–D18 business-rules reference** — still shows the old states and `SHP`.
- **Why it matters for build:** It is explicitly labelled a source-of-truth-adjacent reference. A builder cross-checking D18 (Quotation→PO) against the scope doc would see contradictory QT statuses. README says "module package wins," but a locked-rules doc holding stale lifecycle undermines its own authority.
- **Suggested fix:** Add a short reconciliation banner at the top of the scope doc (or a per-line strikethrough note) pointing Quotation lifecycle → `quotation.md` (Draft/Confirmed/Rejected/Cancelled, no Sent) and `SHP → RT`. Do **not** re-derive D-rules; just annotate the two superseded enumerations.

---

## MINOR

### m1 — Q-INV1 is an unresolved (non-blocking) product decision that UX has already built against
- **Where:** `invoice.md` §13 / `permission-matrix.md` / README §9.
- **Issue:** When a PO/SO already has an active invoice, PO defaulted to **(A) explicit cancel-then-create**; UX/UI proceeded with (A). (B) auto-supersede remains open.
- **Why it matters:** If Pond later picks (B), it reopens `invoice.md` §4b + a UX button change → GATE-1 re-review. Cheap to lock now, costly to flip after build starts.
- **Suggested fix:** Ask Pond to confirm/override (A) at Gate 1 so it is settled before Stage 3.

### m2 — Customer financial summary counts only the *active* invoice, so a delivered order with a voided-and-not-reissued invoice shows 0 purchased
- **Where:** `customer.md` §7 / `invoice.md` §4b.
- **Issue:** `Total purchased = Σ grand total of active (non-void) invoices`. Defensible and internally consistent, but a delivered PO/SO whose only invoice was voided (and none reissued) contributes 0 to the customer's purchased/outstanding totals even though goods shipped.
- **Why it matters:** Edge that could surprise Finance during Gate-3 play-through; it is a *decision*, not a bug.
- **Suggested fix:** No change needed to logic — just have PO state it as intended behaviour in `invoice.md` §4b (one line) so QA writes the AC to expect 0, not a defect.

### m3 — Home tombstone files physically remain in the repo
- **Where:** README §7 notes `home.md` + `home.html` remain as tombstones ("PO tool cannot git rm"); render map + index + Document Hub links were verified removed (no `home` matches in `_render.js` or `functional-spec/modules/index.html`).
- **Issue:** Plumbing removal is genuinely complete; only the orphan files linger.
- **Suggested fix:** DevOps/Dispatcher `git rm docs/.../modules/home.md` and the legacy `home.html` mockup so no future reader mistakes the tombstone for spec.

### m4 — Invoice "no status-lock this phase" is a deliberately deferred rule that should be explicitly acknowledged
- **Where:** `invoice.md` §7/§10 (Confirmed-gate deferred), README §2 reconcile note.
- **Issue:** Creating an invoice against any PO/SO status (even not-Confirmed) is an intentional relaxation with a note to re-tighten later. It is well-documented, but it is a real business-control gap for this phase.
- **Suggested fix:** Have Pond acknowledge the deferral at Gate 1 (so it is a conscious scope decision, not an oversight), and keep a backlog item to re-introduce the Confirmed-gate.

---

## Consistency spot-checks that PASSED (for confidence)
- **DN 6 statuses** identical across `delivery-note.md` §7 · `shipping.md` §4b · `po.md` §4b · `so.md` §4 · `entity-status-map.md` §1.10 · `dashboard.md` §3.5. ✔
- **`RT` (Route) fully replaces `SHP`** inside the module set — no stale `SHP` status/number remains except explicit "SHP→RT historical note" lines. ✔ (the only real `SHP` leak is the scope doc, see M3.)
- **Quotation** — no "Sent" leftover anywhere in the module set (`quotation.md` §4 removed it; deletion-policy/entity-status-map synced). ✔ (only scope doc stale, M3.)
- **G9 codes** = exactly R/C/U/D/A/Ad everywhere; the 9 ambiguous controls settled in `permission-matrix.md` §3.1. ✔
- **VAT by invoice date, credit 60 default, overdue-from-DN-delivered (J3), audit non-read+login (AU1)** consistent across `invoice.md` / `non-functional.md` / `customer.md`. ✔
- **HTML completeness plumbing** — every live `.md` has a 1:1 HTML view mapped in `_render.js` and linked in `index.html`; `home.html` fully unlinked. ✔ (except the 4 stray-tag files render junk — M2.)

---

## Proposed improvements to the PO procedure (recommendations for Pond to approve — NOT yet applied)

1. **Adopt a per-module Definition-of-Done checklist** the PO must self-certify before marking a module "settled." Minimum gates: (a) every field has {type, editable/computed, required?, validation}; (b) every status has an entry-trigger and every terminal/branch (reject, cancel, partial, over/under, void, postpone) is named; (c) every actionable control has a permission + G9 suffix; (d) fields-search-permissions cross-referenced to the modules they touch; (e) US with happy/edge/error AC. *(The best modules already meet this — make it explicit so weak spots like the flow files can't slip.)*

2. **Add a mandatory cross-doc consistency sweep at the end of every review round.** After any status/number/permission/field-name change, grep the whole `modules/` set (incl. `flows/` and `entity-status-map`) for the old token and confirm zero live occurrences outside a labelled "historical note." **The C1 flow-status miss and the scope-doc M3 miss would both have been caught by this one step** — the PO updated the modules but not the derived flow/reference docs.

3. **Maintain a single "document-number & prefix registry"** (extend `numbering-on-save.md` §4 / `non-functional.md` D-F5) that lists *every* document/master identifier and its prefix, and forbid prefix reuse. A registry would have caught the **RT Route/Return collision (M1)** and the **missing Return number** immediately.

4. **Add a flow-branch matrix per end-to-end flow** (rows = steps; columns = happy / reject / cancel / partial / over / under / void / postpone / requeue → which module owns the branch + terminal status). This forces the flow docs to stay in lockstep with module statuses and turns them into a QA test-oracle rather than a prose summary that drifts.

5. **Add a "clean-body" finalization check** to the PO write step: reject any `.md` whose body contains wrapper artifacts (`</content>`, `</invoke>`, `<parameter`, `</antml…`) before commit. Prevents recurrence of M2.

6. **Track deferred rules explicitly** in a "Deferred controls" register (currently the Invoice Confirmed-gate is only a prose note). One list of "relaxed-this-phase, re-tighten-later" items keeps intentional scope cuts visible to Pond at every gate (m4).

7. **Physically retire tombstones** (git rm) rather than leaving `home.md`/`home.html` in-tree, so "removed" means removed (m3).

---

## After reconciliation — resolutions (2026-07-31)

> **สถานะ: RESOLVED (requirement docs only).** ปอนด์อนุมัติ reconciliation pass ให้แก้ **C1 + M1 + M2 + M3 + m2 + m4**. ข้อจำกัด: **backward-compat** (เปลี่ยน token/prefix แล้วอัปเดต reference ทุกจุด ไม่ให้เหลือ dangling) + **ตรวจความสอดคล้องกับ mockups** (ที่ mockup ต้องเปลี่ยน = ลงเป็น UX follow-up, **ไม่แก้ mockup เอง**). ยึด COMPLETENESS RULE (md + HTML view + ลิงก์ใน index). **BEFORE (ผลตรวจเดิม) ด้านบนคงไว้ครบ — ส่วนนี้คือ AFTER.**

### สรุปภาษาไทย (การแก้)
แก้ครบ 6 ข้อ: **C1** flow 2 ใบ → เปลี่ยนสถานะปลายทางเป็น DN-mirror (พร้อมจัดส่ง → อยู่ระหว่างการเตรียม/อยู่ระหว่างจัดส่ง/ส่งสำเร็จ/… ; "ส่งถึง"→"ส่งสำเร็จ"; ถอด In Delivery/Delivered/กำลังจัดส่ง เหลือเฉพาะ note "ห้าม hardcode enum เดิม"). **M1** ให้ใบคืนมี prefix ของตัวเอง **`RET-{YYYYMM}-{NNNNNN}`** (gapless ต่อปี/เดือน, void-only) เพิ่มใน numbering §4 + non-functional D-F5, และเปลี่ยน ledger/trace source ของ Return จาก "RT" → "RET" ทุกจุด (return/stock/traceability); Route คง `RT-…`. **M2** ลบ stray tag ออกจาก 4 ไฟล์. **M3** ใส่ reconciliation banner + inline note ในเอกสาร scope (Quotation lifecycle → quotation.md; SHP → RT) โดยไม่แตะ D-rule. **m2** ระบุใน invoice §4b ว่า financial summary นับเฉพาะใบ active — order ส่งแล้วแต่ใบ void และยังไม่ออกใหม่ = 0 (INTENDED). **m4** เพิ่ม "Deferred-controls register" (non-functional §15) ลง DEF-1 = Invoice Confirmed-gate. **grep ยืนยัน: ไม่มี "RT"=ใบคืน / In Delivery-ส่งถึง ใน flow / stray tag เหลือค้าง.**

### Per-finding resolution
| Finding | Resolution | Files touched |
|---|---|---|
| **C1 (Critical)** — flow files stale terminal statuses | **RESOLVED.** ทั้ง 2 flow refresh เป็น **DN-mirror**: PO/SO fulfilment หลัง "พร้อมจัดส่ง" = สะท้อน DN (อยู่ระหว่างการเตรียม → อยู่ระหว่างจัดส่ง → **ส่งสำเร็จ** / ลูกค้าเลื่อนส่ง / ลูกค้ายกเลิก / ลูกค้ายังไม่กำหนดวันรับใหม่). "ส่งถึง"→"ส่งสำเร็จ"; DN step เพิ่มการจัดรอบ (Route)→gen DN. คำเก่า In Delivery/Delivered/กำลังจัดส่ง เหลือเฉพาะในรูป **prohibition note "ห้าม hardcode enum เดิม"** (สอดคล้อง `po.md` §4b). logic ไม่เปลี่ยน. | `flows/oem-flow.md` · `flows/ownbrand-flow.md` |
| **M1 (Major)** — RT collision + undefined Return number | **RESOLVED.** ใบคืนได้ prefix เฉพาะ **`RET-{YYYYMM}-{NNNNNN}`** (gapless ต่อปี/เดือน, void-only, ออกตอนบันทึก G8/NS2). เพิ่มลง `numbering-on-save.md` §4 (row ใหม่) + §3/§5/§7 + `non-functional.md` D-F2/D-F5. เปลี่ยน return-ledger/trace source token **"RT" → "RET"** ทุกจุด: `return.md` (field เลขใบคืน, summary, list search "เลขใบคืน (RET)", §4/§5/§10 source, cross-link), `stock.md` §6 (ledger row + delta note), `traceability.md` (§3 Return entity, §3.1 id/key, §4 stock-movement audit, §5/§5b sample). Route คง `RT-…`. | `numbering-on-save.md` · `non-functional.md` · `return.md` · `stock.md` · `traceability.md` |
| **M2 (Major)** — stray wrapper tags | **RESOLVED.** ลบ `</content>`/`</invoke>` ออกจากทั้ง 4 ไฟล์ (body). ยืนยันด้วย grep = 0 occurrence ทั้ง `requirements/` set. | `customer.md` · `invoice.md` · `numbering-on-save.md` · `permission-matrix.md` |
| **M3 (Major)** — scope doc stale QT lifecycle + SHP | **RESOLVED (annotate เท่านั้น, ไม่ re-derive D-rules).** เพิ่ม **reconciliation banner** บนหัวเอกสาร + inline "[⚠ superseded …]" ที่ enumeration ที่ล้าสมัย (§สรุปไทย, D18-4, §2.2, §10.1, §10.2 "SHP", §10.3) ชี้ authority = `quotation.md` §4 (Draft/Confirmed/Rejected/Cancelled — no "Sent"; "Agreed"→"Confirmed") และ Route `RT-…` (ไม่ใช่ SHP). D1–D18 business logic ไม่ถูกแก้. | `scope-oem-ownbrand-supply-planning.md` |
| **m2 (Minor)** — financial summary void edge | **RESOLVED.** เพิ่มบรรทัดใน `invoice.md` §4b: financial summary นับเฉพาะใบ active (non-void); order ที่ส่งแล้วแต่ใบเดียวถูก void + ยังไม่ออกใหม่ = **0 (INTENDED, by design)** → QA เขียน AC ให้คาดหวัง 0 (+ US-INV-04 edge). ตอกย้ำใน `customer.md` §7. | `invoice.md` · `customer.md` |
| **m4 (Minor)** — deferred control not registered | **RESOLVED.** เพิ่ม **§15 "Deferred-controls register"** ใน `non-functional.md` (DEF-1 = Invoice Confirmed-gate, relaxed-this-phase → re-tighten later). invoice §7/§10 + permission-matrix r13 ชี้ไป DEF-1. | `non-functional.md` · `invoice.md` · `permission-matrix.md` |
| **m3 (Minor)** — home tombstones | **CONFIRMED RESOLVED (dispatcher git-rm'd).** grep/glob ยืนยัน: **ไม่มี `home.md` ในชุด module package และไม่มี `functional-spec/modules/home.html`**; ที่เหลือคือ legacy `functional-spec/home.html` ซึ่งคง **อยู่ใน ⑥ Archive โดยตั้งใจ** (historical, README §104/§117) — ไม่ใช่ tombstone ของ source-of-truth. | — (verify only) |

### UX follow-up list (mockups ที่ควรเปลี่ยนให้ตรง spec — **PO ไม่แก้ mockup, ส่งให้ UX/UI Stage 1 · re-enter GATE 1 เฉพาะจอที่แก้**)
| # | Mockup | ปัจจุบัน (spot-check) | ต้องเปลี่ยนเป็น | เหตุผล |
|---|---|---|---|---|
| **UX-1** | `mockups/return.html` | ป้าย/หัวคอลัมน์เลขใบคืน + ช่องค้นอาจใช้ **"RT"** | **"RET"** (`RET-{YYYYMM}-{NNNNNN}`) — เลขใบคืน + list search "เลขใบคืน (RET)" | M1: Return ได้ prefix ใหม่ RET (คนละตัวกับ Route RT) |
| **UX-2** | `mockups/stock.html` | return-ledger / movement `return (−)` source อาจแสดง **"RT"** | **"RET"** (เลขใบคืน) เป็น source ของ `return (−)` | M1: sync ledger source token |
| **UX-3** | `mockups/trace.html` | Return topic / sample อาจอ้าง **"RT ที่ส่งคืน"** | **"เลขใบคืน RET"** | M1: trace Return topic ใช้ RET |
| **UX-4 (verify)** | `mockups/delivery-note.html` + จอที่โชว์สถานะ PO/SO (dashboard/po-detail/so-detail) | ตรวจว่าไม่มี label **"In Delivery / Delivered / ส่งถึง / กำลังจัดส่ง"** หลงเหลือ | ใช้ DN 6 สถานะ (อยู่ระหว่างการเตรียม/อยู่ระหว่างจัดส่ง/ส่งสำเร็จ/ลูกค้าเลื่อนส่ง/ลูกค้ายกเลิก/ลูกค้ายังไม่กำหนดวันรับใหม่) | C1: ให้ mockup ตรง DN-mirror (delivery-note.html ทำแล้วตาม r11 — ตรวจยืนยัน) |
> **หมายเหตุ:** UX-4 น่าจะสอดคล้องอยู่แล้ว (mockup Route/DN r11 ใช้ 6 สถานะ) — ระบุไว้เป็น "verify" ให้ UX/QA spot-check. UX-1..3 เป็นการ rename RT→RET เชิง label เท่านั้น (ไม่เปลี่ยน layout/flow) → GATE 1 review เบา.

### Backward-compat / grep verification (ยืนยัน "ไม่มีของเก่าพัง")
- **Return "RT" (ambiguous):** grep ทั้ง `modules/` — เหลือ **0** ตัวที่ "RT" = ใบคืน. ตัวที่พบทั้งหมดเป็น **Route `RT-…`** (shipping/dashboard/comment-convention/numbering/non-functional/delivery-note/traceability Route topic) ซึ่งถูกต้องต้องคงไว้. pattern `Lot/RM/Supplier/RT` เหลือปรากฏ **เฉพาะในไฟล์ audit นี้ (ส่วน BEFORE)** ตามเจตนา.
- **flow stale statuses:** grep `flows/` — "In Delivery/Delivered/ส่งถึง/กำลังจัดส่ง" เหลือเฉพาะใน **prohibition note "ห้าม hardcode enum เดิม …"** (ตั้งใจ, mirror po.md) — ไม่มี live status เก่าเหลือ.
- **stray tags:** grep `</content>`/`</invoke>`/`<parameter`/`</antml` ทั้ง `requirements/erp-v2-ui-first/` = **0 occurrence**.
- **home tombstone:** ไม่มี `home.md`/`functional-spec/modules/home.html` (legacy `functional-spec/home.html` = Archive โดยตั้งใจ).
- **new prefix consistency:** `RET-{YYYYMM}-{NNNNNN}` ปรากฏสอดคล้องใน `return.md` · `numbering-on-save.md` §4 · `non-functional.md` D-F2/D-F5 · `stock.md` §6 · `traceability.md`.

### ยังต้องให้ปอนด์ยืนยันที่ Gate (non-blocking — ไม่ค้างงาน)
- **Q-INV1 (m1):** PO/SO ที่มีใบ active แล้ว → default **(A) explicit cancel-then-create** (UX เดินตาม A แล้ว). ถ้าปอนด์เลือก **(B) auto-supersede** จะปรับ `invoice.md` §4b + ปุ่ม UX 1 จุด → re-review GATE 1.
- **m4 deferral (DEF-1):** ยืนยันว่า **Invoice Confirmed-gate ผ่อนในเฟสนี้โดยตั้งใจ** (create ได้ทุกสถานะ) และจะ re-tighten ภายหลัง — บันทึกใน `non-functional.md` §15.

### HTML view (COMPLETENESS RULE)
- เพิ่ม view `functional-spec/modules/po-output-quality-audit.html` (data-src → `../../../../requirements/erp-v2-ui-first/po-output-quality-audit.md`) + ใส่ใน `_render.js` map + ลิงก์ใน `modules/index.html` ใต้หัวข้อ "Reviews / Audit".
