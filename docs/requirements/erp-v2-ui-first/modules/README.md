# Requirement Package (Per-Module) — ESSENCE Hub System

slug: `erp-v2-ui-first` · เขียนโดย PO · 2026-07-30 · **CANONICAL & COMPLETE SINGLE SOURCE OF TRUTH** สำหรับ BA / QA / Tech-Lead
สถานะ: consolidation ของ requirement ที่กระจัดกระจาย → per-module ที่โครงสร้างสม่ำเสมอ **ครบทุก module + NFR + Deletion Policy** · reconciled กับ D1–D18 + fold คำสั่งใหม่ของปอนด์ (2026-07-29 · **+ Customer/Route/DN 3-module review 2026-07-30 · + Traceability trace-surface + Audit-log review r12 2026-07-30 · + Invoice review r13 2026-07-30 · + Home removed → Dashboard landing r14 2026-07-30 · + Reconciliation pass C1/M1/M2/M3+m2/m4 r15 2026-07-31 · ★★★★★★ + CUMULATIVE-level RBAC r16 2026-07-31 · ★★★★★★★ + Platform/NFR decisions r17 2026-07-31 · ★★★★★★★★ + Notification READ-DRIVEN (read replaces dismiss) r18 2026-07-31 · ★★★★★★★★★ + Notification event-set update r19 2026-07-31 · ★★★★★★★★★★ + GATE-1 REVIEW RECONCILIATION r20 2026-07-31**)

## สรุปภาษาไทย
เอกสารชุดนี้คือ **แหล่งความจริงล่าสุดแบบราย module ที่ครบถ้วน (single source of truth)** ของทั้งระบบ ESSENCE Hub. **★★★★★★★★★★ NEW — GATE-1 REVIEW RECONCILIATION (r20, ปอนด์ Gate-1 Final Team Review 2026-07-31):** รอบ reconcile เก็บงานจาก Gate-1 team review (spec-only; UX/UI handles mockups หลังจากนี้): **NOTIFICATION —** **(A1)** Customer Follow-up = **flag-set-only** (ตัด "ครบกำหนด/due-date" ทั้งหมด — ลูกค้าไม่มี due-date/sweep) + **de-dup** กับ event ที่มี noti เอง (Invoice Overdue) · **(A2)** Route ส่งสำเร็จ = ยิงเมื่อ Route **"เสร็จสิ้น"** (generic; Read Shipping/Route + owning Sale; **เฟสนี้ Sale เห็นทั้ง route/ทุก DN**); Route cancel = **single RT noti** (ตัด N×DN-void); DN **"ยกเลิกการจัดส่ง"** = delivery status ไม่ใช่ doc-cancel + **order ไม่เปลี่ยน** · **(A3)** single fan-out rule = Read module ปลายทางล้วน ((Sale)/(Finance) = descriptive; Route +owning Sale = exception เดียว) · **(A4)** ไม่เพิ่ม event ใหม่ (Ready-to-Ship/DN-delivered = **queue-discovered**) + **purge stale C-codes** (C5/C6/C9/C10/C12/C13/C15/C17/C18) ใน qc/pr/return/shipping/goods-receipt · **(A6)** badge **optimistic** (คลิก = ลด badge ทันที client-side; poll ≤15s = reconcile). **CONSISTENCY —** **(B1)** permission-matrix §3 = +PO-print/SO-print (R) · +Return void (D)/RET create (C) · normalize "ยกเลิก QT/SO/PR (D)/(A)" → min-level (D) · **(B2)** README §9 flags CLOSED · **(B4)** return RT→RET UX note DONE · **(B5)** SP deep-link = `?filter=low-overstock` · **(B7)** pin: rollup "latest active DN" = most-recent status-change ในบรรดา DN non-void · "only Admin" guard = ≥1 other Active Admin · J8 หลัง J1 (~06:00, 06:00–06:15). **FLOW —** **(C1)** SO(ก) FG shortage = **WARN-not-block** (Pond D2, negative FG reserve) · **(C2)** SO(ข) terminal **"ผลิตเข้าคลังแล้ว"** (exclude Route) · **(C3)** ยกเลิก PO/SO โดยตรง = **BLOCKED ขณะมี DN active** (via Route/DN) · **(C4 ⭐ CRITICAL)** **OEM sell-from-stock** — OEM overproduction + held/customer-cancelled-delivery goods → **FG stock (OEM identity)** = sellable; OEM PO fulfil ได้ด้วยการ **เลือก OEM FG จากสต็อก** (ขนาน Own-Brand ก). **+ header logo/title = home-link → Dashboard ทุกหน้า.** **★ คงกฎเดิมทั้งหมด (DN 6-status · RT/RET · cumulative RBAC · DN-unify · GR→QC stock-in · G8/G9 · entity-status-map).** **★ ทุกไฟล์ `.md` มี HTML review view + ลิงก์ในหน้า index.**

---

## 1. โครงไฟล์ (file tree — ครบทั้งชุด)

```
docs/requirements/erp-v2-ui-first/modules/
  README.md                  ← ไฟล์นี้ (index + D-rule spine + changelog + source-of-truth + old→new map + global rules)
  permission-matrix.md       ← ★★★★★★ RBAC = CUMULATIVE per-module level (§1a) · ★ r20 B1: +PO/SO print (R) · +RET create(C)/void(D) · normalize cancel → (D)
  comment-convention.md      ← ★ กติกากลาง comment + change-history (CC1–CC7) · 12 object (Shipment→Route)
  numbering-on-save.md        ← ★ กติกากลาง G8 = เลขเอกสารออกตอนบันทึก (NS1–NS7) · DN+Route (RT) · ★ Invoice one-active · ★ Return RET-… (r15)

  # System-wide / Governance (Non-Functional bucket ใน Hub)
  non-functional.md          ← NFR รวม (★★★★★★ r16 cumulative RBAC · ★★★★★★★ r17 · ★★★★★★★★ r18 · ★★★★★★★★★ r19 · ★★★★★★★★★★ r20: A1 Follow-up flag-set+de-dup · A3 single fan-out · A6 optimistic badge · A11 only-Admin guard pin · J8-after-J1)
  deletion-policy.md         ← soft-delete/void baseline + entity (INV = void-only §2.8)
  traceability.md            ← trace/audit governance (★★★★ r12)

  # Platform & Navigation
  platform.md                ← ★ Dashboard landing (r14) · r17/r18/r19 noti · ★ r20: A1/A2/A3/A6 noti reconcile + header logo/title → Dashboard (home-link)
  dashboard.md               ← ★★ LANDING หลัง login (r14) · 7 แผนก/29 tile · per-department Read-scoped

  # Sales & Customer
  customer.md · quotation.md · po.md · so.md   ← ★ r20: customer (A1 Follow-up flag-set) · po (C3 cancel-block · C4 OEM sell-from-stock ⭐) · so (C1 warn-not-block · C2 terminal · C3)

  # Supply Planning & Production
  bom.md · supply-planning.md · production.md · qc.md   ← ★ r20: supply-planning (B5 deep-link param) · production (C2 rollup · C4 OEM surplus) · qc (A4 C-code purge)

  # Inventory & Procurement
  stock.md · goods-receipt.md · pr.md · supplier.md · return.md   ← ★ r20: stock (C4 OEM FG bucket) · goods-receipt/pr/return (A4 C-code purge) · return (B1 create=C/void=D · B4 DONE)

  # Fulfilment & Finance
  shipping.md · delivery-note.md · invoice.md   ← ★ r20: shipping (A2 Route noti · A4) · delivery-note (A2 delivery-cancel · B7a rollup · C3/C4)

  # System
  settings.md                ← ★★★★★★ RBAC role editor · ★★★★★★★ r17 user email

  flows/  oem-flow.md (★ r20 C4 sell-from-stock variant) · ownbrand-flow.md (★ r20 C1/C2)

  # Reviews / Audit (ไม่ใช่ spec module)
  ../po-output-quality-audit.md
  ../platform-gate2-gap-report.md
  ../gate1-team-review-report.md  ← ★★★★★★★★★★ r20 input: Gate-1 Final Team Review (A1-A6/B1-B7/C1-C4/D1-D2)
```

HTML review view: `docs/design/erp-v2-ui-first/functional-spec/modules/index.html` · Hub `functional-spec/index.html`.
**★ Doc-completeness: ทุกไฟล์ `.md` (spec ที่ยังใช้งาน) มี HTML review view ครบ 1:1 + ลิงก์ในหน้า Modules index** (render จาก .md ผ่าน `_render.js`). **★★★★★★★★★★ r20 (Gate-1 reconciliation): แก้ requirement `.md` หลายไฟล์ (platform/non-functional/customer/po/so/production/stock/delivery-note/shipping/permission-matrix/supply-planning/qc/pr/return/goods-receipt/oem-flow/ownbrand-flow) — view เดิม render จาก .md อัปเดตอัตโนมัติ + index card descriptions refreshed — ไม่มี view ใหม่ (ทุกไฟล์มี map ใน `_render.js` + ลิงก์ index อยู่แล้ว).**

---

## 2. D-Rule Spine (คงเป็นแกน — พร้อม DELTA)
D1–D18 ยังเป็นกฎแกน (`scope-oem-ownbrand-supply-planning.md` §1). จุดอัปเดตหลัก (คงตามรอบก่อน): **D8 v2** · **credit 60** · **D18 reseat** · **D11 v2** · **D13 reinforce** · **D9/D10** · **D12/D16** · Route/DN rewrite · Trace/Audit r12 · Invoice r13 · Home removed r14 · Reconciliation r15. **★★★★★★ r16 Cumulative RBAC** · **★★★★★★★ r17 Platform/NFR** · **★★★★★★★★ r18 Notification read-driven** · **★★★★★★★★★ r19 Notification event-set**. **★★★★★★★★★★ r20 Gate-1 reconciliation:** ไม่แตะ D-rule — เก็บงาน notification-semantics + requirement-consistency + flow-completeness; **★ D2 (Own-Brand ก sell-from-stock) reaffirm = warn-not-block (C1); ★ D13 reinforce = OEM surplus → OEM FG sellable bucket (C4)**. **★ reconcile deferred:** Invoice Confirmed-gate ผ่อน (DEF-1) · RBAC SoD ผ่อน (DEF-2) · Route-delivered per-DN scoping ผ่อน (DEF-3) — `non-functional.md` §15.

---

## 3. GLOBAL Rules (บังคับทุก module)

| # | กติกา | รายละเอียด |
|---|---|---|
| **G1 Pagination** | list/history ทุกอัน **20 แถว/หน้า + pagination** | ทุก list + **★ Route/DN/Invoice list · field-audit · Dashboard drill-down · ★★★★★★★ notification "ดูทั้งหมด" (r17 · ★★★★★★★★ r18 อ่าน/ยังไม่อ่าน + จัดกลุ่ม 4 หมวด)** |
| **G2 Date-range search** | ค้น **เลขเอกสาร** หรือ **ช่วงวันที่** | quotation/PO/SO/GR/PR/invoice list + production queue + audit + Route/DN list + trace + Dashboard date-range |
| **G3 Drill + back คงสถานะ** | กลับ **ไม่เสีย state เดิม** | dashboard drill · detail modal · Route add-order modal · trace genealogy |
| **G4 Customer search dropdown** | quotation/po/so-create | ค้นเบอร์/บริษัท/ผู้ติดต่อ · Disabled/Blacklist hard block |
| **G5 Permission-per-action** | ทุกปุ่มระบุ capability | `permission-matrix.md` · **★★★★★★ r16: รหัส = ระดับต่ำสุด (min level) ของโมเดลสะสม (§1a)** |
| **★ G6 Comment + change-history** | ทุก object ธุรกรรมมี **ช่องหมายเหตุเดียว แก้ในที่ + เก็บประวัติครบ** | **12 object** · `comment-convention.md` |
| **★ G7 Search-in-dropdown** | RM/FG/Lot/component + Return RM-in-lot | ค้นชื่อ+รหัส · Route driver · trace topic · **★ C4: OEM FG จากสต็อก (po-create sell-from-stock)** |
| **★ G8 Document number on SAVE** | create ทุกใบ: ไม่โชว์เลขล่วงหน้า → ออกเลข gapless ตอนบันทึก + popup ยืนยัน | `numbering-on-save.md` · **★★★★★★★ r17: cancel ของ submit-confirm = ไม่กินเลข (§9.1 non-functional)** |
| **★ G9 Permission-code suffix** | ทุก actionable control ที่ permission-gate แสดงรหัสสิทธิ์เป็น suffix | รหัส 6 ตัว: R/C/U/D/A/Ad · **★★★★★★ r16: รหัส = min level ของ cumulative ladder (§1a)** · authority = `permission-matrix.md` §3 |

> NFR ระดับระบบ รวมที่ `non-functional.md`. **★★★★★★★ r17 — Platform layer authoritative ที่ `platform.md` + `non-functional.md`. ★★★★★★★★ r18 · ★★★★★★★★★ r19 · ★★★★★★★★★★ r20 — noti authoritative ที่ `platform.md` §7 + `non-functional.md` §6/§7 (+ `supply-planning.md` §5.1 · `customer.md` §4.1).**
> **★★★★★★ r16 — RBAC = cumulative per-module level (`permission-matrix.md` §1a); role editor = per-module single-level selector (`settings.md` §4).**
> **★★★★★★ r14 — Dashboard = landing หลัง login; visibility = Read ต่อแผนก. ★ r20: header logo/title = home-link → Dashboard ทุกหน้า.**

---

## 4. Confirmations ที่ปอนด์สั่งให้ยืนยัน (RESOLVED)

| หัวข้อ | คำตัดสิน | เอกสาร |
|---|---|---|
| **Convert-to-PO** | QT = **Confirmed ทันที** + loose link | `quotation.md` · `po.md` · oem-flow |
| **SO (ก)/(ข)** | จอง FG→พร้อมส่ง→ตัด FIFO→DN/Invoice · ผลิตเก็บสต็อก auto-PR | `so.md` · `shipping.md` |
| **★ Comment convention** | **12 object** มีช่อง comment เดียว | `comment-convention.md` |
| **★★ (settled รอบก่อน)** | (settled) | ราย module |
| **★★★ Customer address · Route (`RT-…`) · DN module (2026-07-30)** | (settled) | ราย module |
| **★★★★ Traceability + Audit (r12)** | (settled) | `traceability.md` · `settings.md` |
| **★★★★★ Invoice review (r13)** | (settled) | `invoice.md` · ราย module |
| **★★★★★★ Home removed → Dashboard landing (r14)** | (settled) | `dashboard.md` · `platform.md` |
| **★ Reconciliation pass (r15)** | (settled) | `flows/*` · ราย module |
| **★★★★★★ CUMULATIVE-level RBAC (r16)** | ลำดับชั้นสะสม `R < C < U < D < A < Admin` | `permission-matrix.md` §1a · `settings.md` §4 |
| **★★★★★★★ Platform/NFR decisions (r17)** | 7 กลุ่ม (noti/reset/self-disable/perf/password/submit-confirm/session) | `platform.md` · `non-functional.md` |
| **★★★★★★★★ Notification READ-DRIVEN (r18)** | read-bit · badge=unread · click=navigate+read · mark-all-read | `platform.md` §7 · `non-functional.md` §7 |
| **★★★★★★★★★ Notification EVENT-SET (r19/r19.1)** | +Follow-up/+Doc-Cancel/+Route-delivered · SP Low+Overstock DAILY · −Inactivity · Route +owning Sale · Follow-up near-real-time | `platform.md` §7 · `non-functional.md` §6/§7 · `supply-planning.md` §5.1 · `customer.md` §4.1 |
| **★★★★★★★★★★ GATE-1 REVIEW RECONCILIATION (r20, ปอนด์ 2026-07-31)** | **A1** Follow-up flag-set-only + de-dup · **A2** Route "เสร็จสิ้น" generic (Sale เห็นทั้งรอบ) + single RT-cancel noti + DN "ยกเลิกการจัดส่ง"≠doc-cancel(order ไม่เปลี่ยน) · **A3** single fan-out rule · **A4** no new events (queue-discovered) + purge C-codes · **A6** optimistic badge · **B1** perm PO/SO-print(R)+RET create(C)/void(D)+normalize cancel(D) · **B2** README flags CLOSED · **B4** return RT→RET DONE · **B5** SP deep-link `?filter=low-overstock` · **B7** rollup/only-Admin/J8-after-J1 pins · **C1** SO(ก) warn-not-block (D2) · **C2** SO(ข) terminal "ผลิตเข้าคลังแล้ว" · **C3** cancel blocked while active DN · **C4 ⭐** OEM sell-from-stock (OEM FG identity bucket) · **+header logo/title→Dashboard** | `platform.md` · `non-functional.md` · `customer.md` · `po.md` · `so.md` · `production.md` · `stock.md` · `delivery-note.md` · `shipping.md` · `permission-matrix.md` · `supply-planning.md` · `qc.md` · `pr.md` · `return.md` · `goods-receipt.md` · `flows/*` · README |

**หมายเหตุ:** Quotation ทำ material check แต่ **ไม่ auto-open PR**.

---

## 5. ★ Source-of-Truth Statement (ประกาศชัด)
1. **`modules/*.md` = AUTHORITATIVE spec ปัจจุบันของทุก module + NFR + Deletion Policy + Traceability**. `home.md` = tombstone; landing = `dashboard.md`.
2. governance authoritative: `non-functional.md` · `deletion-policy.md` · `traceability.md` · `comment-convention.md` (G6) · `numbering-on-save.md` (G8) · **`permission-matrix.md` (RBAC + G9 — §1a cumulative)**.
3. **เอกสารเก่า** = historical reference → Hub ⑥ Archive.
4. **เอกสารหลักการเชิงลึก** (entity-status-map, status-journeys, scope D1–D18, ...) = authoritative reference → Hub ③. **module package wins ถ้าขัดกัน.**
5. **RTM/Traceability คงครบ (r12 trace+audit surface).**
6. **★★★★★ r13: Invoice model = authoritative ที่ `invoice.md`.**
7. **★★★★★★ r14: Navigation/landing = authoritative ที่ `platform.md` + `dashboard.md`.**
8. **★★★★★★ r16: RBAC authorization model = authoritative ที่ `permission-matrix.md` §1a.**
9. **★★★★★★★ r17: Platform layer = `platform.md`; cross-cutting NFR = `non-functional.md`; user email = `settings.md` §3.**
10. **★★★★★★★★ r18: Notification read/dismiss mechanics = `platform.md` §7 + `non-functional.md` §7 (read-driven).**
11. **★★★★★★★★★ r19 / ★★★★★★★★★★ r20: Notification EVENT SET + semantics = `platform.md` §7 + `non-functional.md` §6/§7** — event set = {PO→Production, QC ผ่าน/ไม่ผ่าน, PR auto-created, Invoice Overdue, potential-delay(J4), **+Customer Follow-up (flag-set-only+de-dup), +Doc Cancelled/Rejected (ไม่รวม DN "ยกเลิกการจัดส่ง"), +Route "เสร็จสิ้น" (Read Shipping/Route+owning Sale, single noti; cancel=single RT), +SP Low+Overstock DAILY summary (`?filter=low-overstock`)**} · **single fan-out rule = Read module ปลายทาง (Route +owning Sale = exception เดียว)** · **optimistic badge** · **no new events (Ready-to-Ship/DN-delivered = queue-discovered)**. **★ C4 (⭐): OEM sell-from-stock — OEM FG bucket (OEM identity) = `stock.md` §4 · `po.md` §5.4.** Follow-up trigger = `customer.md` §4.1 · SP alert = `supply-planning.md` §5.1.
12. **Navigation IA:** ① Functional · ② Non-Functional · ③ Reference · ④ Architecture · ⑤ Mockups · ⑥ Archive.
13. **★ HTML review view = 1:1 ต่อทุก .md ที่ยังเป็น spec** (render จาก .md ผ่าน `_render.js`). **★★★★★★★★★★ r20: ใช้ view เดิม (render จาก .md ที่แก้แล้ว) + index card descriptions refreshed — ไม่มี view ใหม่.**

---

## 6. ★ Map: เอกสารเก่า → ครอบคลุมโดย module ใด
| เอกสารเก่า | ครอบคลุมโดย module (authoritative) | หมายเหตุ |
|---|---|---|
| functional-spec `home.html` | **— (Home ตัดทิ้ง)** · landing = `dashboard.md` | ★★★★★★ r14 |
| functional-spec `platform.html` | **`platform.md` (r17 US-PLT-06/07 · ★ r20 home-link)** | absorbed เต็ม |
| **Notification "14 events / ack=read"** | **`platform.md` §7 + `non-functional.md` §7 (r18 read-driven · r19/r20 event set)** | rewrite chain r17→r18→r19→r20 |
| **RBAC "generic RUCDAA"** | **`permission-matrix.md` §1a (cumulative) + `settings.md` §4** | ★★★★★★ r16 |
| **Perf "P1<2s / 50 concurrent"** | **`non-functional.md` §1** | ★★★★★★★ r17 |
| `SHP-…` numbering | **`RT-…`** | ★ Q1=A |
| **Return "RT" token** | **`RET-{YYYYMM}-{NNNNNN}`** | ★ r15 M1 · r20 B4 DONE |
| **Old notification handoff C-codes (C5/C6/C9/C10/C12/C13/C15/C17/C18)** | **event r19 names / "queue-discovered"** | ★ r20 A4 purge |

---

## 7. Changelog — supersede / แก้ / ปอนด์เคาะ
| เอกสาร/รายการ | สถานะ | เหตุผล |
|---|---|---|
| (รายการรอบก่อน r11–r19.1) | **settled** | commit history |
| **★★★★★★★★★ Notification EVENT-SET (r19 + r19.1)** | **settled** | `platform.md` §7 · `non-functional.md` §6/§7 |
| **★★★★★★★★★★ GATE-1 REVIEW RECONCILIATION (r20, 2026-07-31, ปอนด์ Gate-1 Final Team Review)** | **DECIDED 2026-07-31 (ปอนด์) · settled (requirement docs; UX/UI mockups = parallel hand-off §8)** | เก็บงานจาก `gate1-team-review-report.md`. **A1** Customer Follow-up = flag-set-only (ตัด due-date) + de-dup กับ Invoice-Overdue (`platform.md` §4/§7 · `non-functional.md` §7 · `customer.md` §4.1). **A2** Route ส่งสำเร็จ ยิงตอน "เสร็จสิ้น" (generic; Read Shipping/Route+owning Sale; เฟสนี้ Sale เห็นทั้งรอบ) · Route cancel = single RT noti (ตัด N×DN-void) · DN "ยกเลิกการจัดส่ง" = delivery status ไม่ใช่ doc-cancel + order ไม่เปลี่ยน (`platform.md` · `shipping.md` §4b/§4d · `delivery-note.md` §7). **A3** single fan-out rule = Read module ปลายทาง; (Sale)/(Finance) = descriptive; Route +owning Sale = exception (`non-functional.md` §7 · `platform.md` §6). **A4** ไม่เพิ่ม event ใหม่ (Ready-to-Ship/DN-delivered = queue-discovered) + purge stale C-codes ใน qc/pr/return/shipping/goods-receipt. **A6** optimistic badge (client decrement + poll reconcile, `platform.md` §7 · `non-functional.md` §7/P5). **B1** permission-matrix §3 = +PO/SO-print(R) · +RET create(C)/void(D) · normalize "ยกเลิก QT/SO/PR (D)/(A)" → min-level (D). **B2** README §9 flags CLOSED. **B4** return RT→RET UX note DONE. **B5** SP deep-link `?filter=low-overstock`. **B7** pin rollup "latest active DN" (most-recent status-change, non-void) · "only Admin" = ≥1 other Active Admin · J8 หลัง J1 (06:00–06:15). **C1** SO(ก) FG shortage = WARN-not-block (Pond D2) + negative FG reserve. **C2** SO(ข) terminal "ผลิตเข้าคลังแล้ว" (exclude Route). **C3** ยกเลิก PO/SO โดยตรง = BLOCKED ขณะมี DN active (via Route/DN). **C4 ⭐ CRITICAL** OEM sell-from-stock (OEM overproduction + held/customer-cancelled → FG stock OEM identity = sellable; OEM PO เลือก OEM FG จากสต็อก). **+header logo/title → Dashboard (home-link).** |
| **★ Doc-completeness — Gate-1 reconciliation (r20)** | **DONE (docs เท่านั้น · ไม่มี view ใหม่)** | ทุกไฟล์ที่แก้มี HTML view (render จาก .md) + map ใน `_render.js` + ลิงก์ index; index card descriptions refreshed. |

---

## 8. งานส่งต่อ UX/UI (สรุป)

**punch-list เดิม + delta รอบก่อน** (คงตามรอบก่อน · รวม A–J + K role editor r16 + L–P platform/NFR r17 + R noti event-set r19).

> **★★★★★★★★★★ (r20, 2026-07-31) — Gate-1 review reconciliation → mockup change-list (ส่งต่อ UX/UI · เข้า GATE 1 เฉพาะจอที่แก้):** PO แก้ **requirement docs เท่านั้น**; mockup = **UX/UI agent** ปรับขนาน. รายการ:
> - **(A5) inner-page bell — ทุกหน้า:** regenerate shared inner-page bell ให้ mirror dashboard's **4-category read-driven panel** (งานส่งต่อ/เอกสาร · ความเสี่ยงสต็อก-ผลิต · การเงิน · วงจรลูกค้า) + event set r19/r20. (32 หน้ายังเป็น flat 6-item เก่า.)
> - **(A2) DN-cancel wording:** เปลี่ยนป้าย DN "ลูกค้ายกเลิก" → **"ยกเลิกการจัดส่ง"** ทุกจอ (delivery-note/shipping/po-detail/so-detail) ให้ชัดว่า cancel การส่ง ไม่ใช่ยกเลิก order.
> - **(C4 ⭐ CRITICAL — MUST NOT DROP) po-create select-OEM-FG-from-stock:** `po-create.html` ต้องเพิ่ม option ให้ Sale **"เลือก OEM FG จากสต็อก"** ต่อ line (fulfil source = from-stock) — ขนาน so-create โหมด ก. **flag เด่นให้ Stage 1.**
> - **Follow-up wording:** noti item "ติดตามลูกค้า" = ข้อความตั้ง flag (ตัดคำ "ครบกำหนด/due").
> - **(B3) delta print cards:** `gate1-delta.html` เพิ่ม **po-print / so-print** cards.
> - **(B6) gallery fix:** `mockups/index.html` customers card "6 สถานะ" → **5 + ⚑ flag**.
> - **header logo/title → link to dashboard.html บนทุก mockup page** (home-link).
> - **(A6) optimistic badge · (E) polish:** mobile bottom-bar per-page · snackbar+shake ให้ครบ · notifications.html bell → dashboard · pager 20 rows.
> - **หมายเหตุ collision:** PO owns `.md`; UX/UI owns mockups — ขนาน; เข้า GATE 1 เฉพาะจอที่แก้.

---

## 9. Open questions
**ไม่มี open question ที่บล็อก.** (r12–r20 = ไม่มี open question ที่บล็อก.)

> **★★★★★★★ r17 — 3 รายการ non-blocking ให้ปอนด์ยืนยันที่ Gate** (password policy · session lead-time 5 นาที · 4-หมวด grouping labels) — สร้างสเปกไว้แล้ว.

> **★★★★★★★★ r18 — ปอนด์เคาะที่ Gate-1 แล้ว (read แทน dismiss); ไม่มี open question.**

> **★★★★★★★★★ r19 / r19.1 — CLOSED (ปอนด์ Gate-1 2026-07-31):** เดิม 2 non-blocking flags → **ปอนด์เคาะปิดแล้ว (sync `non-functional.md` §12 = CLOSED):**
> 1. **Customer Follow-up schedule = near-real-time เท่านั้น** (ตัด light daily due-check) → **★ r20 ยืนยันต่อ: flag-set-only เท่านั้น (ลูกค้าไม่มี due-date) + de-dup กับ Invoice-Overdue.** **CLOSED.**
> 2. **Route delivered recipient = Read Shipping/Route + owning Sale** → **★ r20 ยืนยันต่อ: ยิงตอน Route "เสร็จสิ้น" (generic); เฟสนี้ Sale เห็นทั้งรอบ/ทุก DN (accepted, DEF-3).** **CLOSED.**
> *(ทั้งสอง flag = CLOSED ไม่ใช่ open question อีกต่อไป — sync กับ `non-functional.md` §12.)*

> **★★★★★★★★★★ r20 (Gate-1 review reconciliation) — ปอนด์เคาะที่ Gate-1 Final Team Review แล้ว (D1=A Follow-up flag-set · D2=B Own-Brand ก warn-not-block); ไม่มี open question ที่บล็อก.** NON-BLOCKING note: **DEF-3 (r20)** Route-delivered เฟสนี้ Sale เห็นทั้งรอบ (ไม่ scope ราย DN) — re-tighten รอบถัดไปได้ (`non-functional.md` §15).

> **★★★★★★ r16 (Cumulative RBAC) — awkward-case DEF-2 (non-blocking):** A รวม D · U รวม C — ปอนด์ยืนยัน ladder เข้มแล้ว (★ r20 B1 normalize dual-suffix cancel ตามนี้); SoD ละเอียด = รอบถัดไป (`permission-matrix.md` §1a/§4 · `non-functional.md` §15).
