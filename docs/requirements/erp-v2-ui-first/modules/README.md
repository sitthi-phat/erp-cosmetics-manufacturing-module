# Requirement Package (Per-Module) — ESSENCE Hub System

slug: `erp-v2-ui-first` · เขียนโดย PO · 2026-07-30 · **CANONICAL & COMPLETE SINGLE SOURCE OF TRUTH** สำหรับ BA / QA / Tech-Lead
สถานะ: consolidation ของ requirement ที่กระจัดกระจาย → per-module ที่โครงสร้างสม่ำเสมอ **ครบทุก module + NFR + Deletion Policy** · reconciled กับ D1–D18 + fold คำสั่งใหม่ของปอนด์ (2026-07-29 · **+ Customer/Route/DN 3-module review 2026-07-30 · + Traceability trace-surface + Audit-log review r12 2026-07-30 · + Invoice review r13 2026-07-30 · + Home removed → Dashboard landing r14 2026-07-30 · + Reconciliation pass C1/M1/M2/M3+m2/m4 r15 2026-07-31 · ★★★★★★ + CUMULATIVE-level RBAC r16 2026-07-31 · ★★★★★★★ + Platform/NFR decisions r17 2026-07-31 · ★★★★★★★★ + Notification READ-DRIVEN (read replaces dismiss) r18 2026-07-31 · ★★★★★★★★★ + Notification event-set update (+Follow-up/+Doc-Cancelled-Rejected/+Route-delivered · SP Low+Overstock DAILY; −Customer-Inactivity; −FG→Low real-time) r19 2026-07-31**)

## สรุปภาษาไทย
เอกสารชุดนี้คือ **แหล่งความจริงล่าสุดแบบราย module ที่ครบถ้วน (single source of truth)** ของทั้งระบบ ESSENCE Hub. **★★★★★★★★★ NEW — Notification EVENT-SET update (r19, ปอนด์ Gate-1 2026-07-31):** ปรับ **ชุด event ของ bell** (คง r18 read-driven mechanics + 4-หมวด UI grouping): **เพิ่ม** (a) **ติดตามลูกค้า (Customer Follow-up)** near-real-time (flag "ต้องติดตาม" `customer.md` §4.1, Read Customer, deep-link customer detail) · (b) **เอกสารถูกยกเลิก/ปฏิเสธ** (QT/PO/SO/RT/DN/Invoice + doc อื่นที่มี cancel/void/reject; **ไม่รวม user soft-delete**) near-real-time, Read module เอกสาร · (c) **Route ส่งสำเร็จ** near-real-time, Read Shipping/Route, deep-link Route/DN. **เปลี่ยน:** FG→Low **ตัด real-time** → **สรุป Supply Planning Low+Overstock รายวัน** (J8 ~06:00, count+list Low + count+list Overstock) deep-link **หน้า SP เดิม (filter Low+Overstock, reuse — ไม่สร้างหน้าใหม่)**; reservation/planning math คงเดิม. **ตัด:** **Customer Inactivity** (แทนด้วย Follow-up). **คงไว้ (ปอนด์ยืนยัน):** **PO→Production · QC ผ่าน/ไม่ผ่าน · PR auto-created · Invoice Overdue · potential-delay (J4)**. **★★★★★★★★ Notification READ-DRIVEN (r18):** per-user **read-bit** (แทน dismiss-bit); **badge = ยังไม่อ่าน**; **คลิกแจ้งเตือน = navigate deep-link + mark READ**; "อ่านแล้วทั้งหมด" เคลียร์ bell; ยกเลิก ✕ dismiss/"ปิดทั้งหมด"; "ดูทั้งหมด" = ประวัติ อ่าน/ยังไม่อ่าน 20/หน้า จัดกลุ่ม 4 หมวด. **★★★★★★★ Platform/NFR decisions (r17):** Notification bell-only + snackbar/shake + ไม่มี email; Forget/Reset password; Account self-disable + Admin re-enable + no auto-lockout; Perf read 200ms/1s · write 1s/3s · ~30 concurrent/module; Password ≥8 lower+upper+digit + encrypt+hash; Global submit-confirm contract; session warn 5 นาที; Environments Dev/Test/Prod; i18n-ready; error/empty-state; API security. **★★★★★★ CUMULATIVE-level RBAC (r16):** ลำดับชั้นสะสม `R < C < U < D < A < Admin`. **★ r15 Reconciliation · Home removed → Dashboard landing (r14) · Invoice (r13) · Traceability + Audit (r12) · 3 modules (Customer · Route `RT-…` · DN).** **คงกฎเดิม:** 2-tier Route/DN · G8 · G6 · G9 · entity-status-map. **★ ทุกไฟล์ `.md` มี HTML review view + ลิงก์ในหน้า index.**

---

## 1. โครงไฟล์ (file tree — ครบทั้งชุด)

```
docs/requirements/erp-v2-ui-first/modules/
  README.md                  ← ไฟล์นี้ (index + D-rule spine + changelog + source-of-truth + old→new map + global rules)
  permission-matrix.md       ← ★★★★★★ RBAC = CUMULATIVE per-module level (§1a: R<C<U<D<A<Admin) · capability → module → action/button → ★ Suffix (G9=min level)
  comment-convention.md      ← ★ กติกากลาง comment + change-history (CC1–CC7) · 12 object (Shipment→Route)
  numbering-on-save.md        ← ★ กติกากลาง G8 = เลขเอกสารออกตอนบันทึก (NS1–NS7) · DN+Route (RT) · ★ Invoice one-active · ★ Return RET-… (r15)

  # System-wide / Governance (Non-Functional bucket ใน Hub)
  non-functional.md          ← NFR รวม (★★★★★★ A3 = cumulative RBAC r16 · ★★★★★★★ r17 = perf ใหม่ §1 + password/self-disable/reset §2 + noti §7 + submit-confirm §9.1 + API security §16 · ★★★★★★★★ r18 = noti read-driven §7 · ★★★★★★★★★ r19 = noti event set §6/§6.1/§7: +Follow-up/+Doc-Cancelled-Rejected/+Route-delivered · SP Low+Overstock DAILY J8 · −Customer-Inactivity · −FG→Low real-time)
  deletion-policy.md         ← soft-delete/void baseline + entity (INV = void-only §2.8)
  traceability.md            ← trace/audit governance (★★★★ r12: entity/topic selector §3.1 + sample-per-object §5b + non-read+login §3/§4/§9)

  # Platform & Navigation
  platform.md                ← ★ login → Dashboard landing (r14) · ★★★★★★★ r17: noti/snackbar+shake · forget-reset password (US-PLT-06) · account self-disable (US-PLT-07) · session warning 5 นาที · ★★★★★★★★ r18: noti read-driven (read แทน dismiss · badge=unread · mark-all-read · ไม่มี ✕dismiss) · ★★★★★★★★★ r19: noti event set (+Follow-up/+Doc-Cancelled-Rejected/+Route-delivered · SP Low+Overstock DAILY · −Customer-Inactivity · −FG→Low real-time) + 4-หมวด UI grouping
  dashboard.md               ← ★★ LANDING หลัง login (r14) · 7 แผนก/29 tile · per-department Read-scoped
  # home.md = ★ REMOVED (ตัดทิ้ง 2026-07-30) — tombstone เท่านั้น

  # Sales & Customer
  customer.md · quotation.md · po.md · so.md

  # Supply Planning & Production
  bom.md · supply-planning.md · production.md · qc.md

  # Inventory & Procurement
  stock.md · goods-receipt.md · pr.md · supplier.md · return.md

  # Fulfilment & Finance
  shipping.md · delivery-note.md · invoice.md

  # System
  settings.md                ← ★★★★★★ RBAC role editor = per-module SINGLE-LEVEL selector (§4) + Users + VAT + Company + Audit-log tab · ★★★★★★★ r17: user email (บังคับ) = reset address §3 + Admin re-enable self-disabled §5/§6

  flows/  oem-flow.md (★ DN-mirror r15) · ownbrand-flow.md (★ DN-mirror r15)

  # Reviews / Audit (ไม่ใช่ spec module)
  ../po-output-quality-audit.md  ← ★ independent Tech-Lead audit + After reconciliation (r15)
  ../platform-gate2-gap-report.md ← ★★★★★★★ r17 input: consolidated Gate-2 gap report (H/M/L) — PO ปิด HIGH ที่เป็น "PO spec"
```

HTML review view: `docs/design/erp-v2-ui-first/functional-spec/modules/index.html` · Hub `functional-spec/index.html`.
**★ Doc-completeness: ทุกไฟล์ `.md` (spec ที่ยังใช้งาน) มี HTML review view ครบ 1:1 + ลิงก์ในหน้า Modules index** (render จาก .md ผ่าน `_render.js`). **★★★★★★★ r17: `platform.html` · `non-functional.html` · `settings.html` มีอยู่แล้ว + map ใน `_render.js` + ลิงก์ใน index — แก้ .md แล้ว view อัปเดตอัตโนมัติ (ไม่มี view ใหม่).** **★★★★★★★★ r18 (noti read-driven): แก้ `platform.md` §7 + `non-functional.md` §7 — view render จาก .md อัปเดตอัตโนมัติ.** **★★★★★★★★★ r19 (noti event set): แก้ `platform.md` §7 + `non-functional.md` §6/§6.1/§7 + `supply-planning.md` §5.1 เท่านั้น — `platform.html`/`non-functional.html`/`supply-planning.html` render จาก .md อัปเดตอัตโนมัติ + index card descriptions (platform/NFR/supply-planning + footer) refreshed — ไม่มี view ใหม่.** **★★★★★★ r16 (cumulative RBAC): แก้ requirement docs เท่านั้น — ใช้ view เดิม.** **★★★★★★ r14 (Home removed):** ตัด `home.html`.

---

## 2. D-Rule Spine (คงเป็นแกน — พร้อม DELTA)
D1–D18 ยังเป็นกฎแกน (`scope-oem-ownbrand-supply-planning.md` §1). จุดอัปเดตหลัก (คงตามรอบก่อน): **D8 v2** · **credit 60** · **D18 reseat** · **D11 v2** · **D13 reinforce** · **D9/D10** · **D12/D16** · Route/DN rewrite · Trace/Audit r12 · Invoice r13 · Home removed r14 · Reconciliation r15. **★★★★★★ r16 Cumulative RBAC:** ไม่แตะ D-rule — **D14 คงเป็นแกน RBAC** แต่ reconcile นิยามเป็น "cumulative per-module level (total order)". **★★★★★★★ r17 Platform/NFR:** ไม่แตะ D-rule — เพิ่ม layer platform/NFR (noti, reset, self-disable, perf, submit-confirm, security) บนกฎเดิม. **★★★★★★★★ r18 Notification read-driven:** ไม่แตะ D-rule — ปรับเฉพาะกลไก read/dismiss ของ notification (read-bit แทน dismiss-bit). **★★★★★★★★★ r19 Notification event-set:** ไม่แตะ D-rule — ปรับเฉพาะ **ชุด event** + schedule ของ FG→Low (real-time→daily) + J-job; **FG→Low reservation/planning math (D4–D6) คงเดิม**, เปลี่ยนเฉพาะ notification delivery. **★ reconcile deferred:** Invoice Confirmed-gate ผ่อน (DEF-1) · RBAC SoD ผ่อน (DEF-2) — `non-functional.md` §15.

---

## 3. GLOBAL Rules (บังคับทุก module)

| # | กติกา | รายละเอียด |
|---|---|---|
| **G1 Pagination** | list/history ทุกอัน **20 แถว/หน้า + pagination** | ทุก list + **★ Route/DN/Invoice list · field-audit · Dashboard drill-down · ★★★★★★★ notification "ดูทั้งหมด" (r17 · ★★★★★★★★ r18 แสดง อ่าน/ยังไม่อ่าน + จัดกลุ่ม 4 หมวด)** |
| **G2 Date-range search** | ค้น **เลขเอกสาร** หรือ **ช่วงวันที่** | quotation/PO/SO/GR/PR/invoice list + production queue + audit + Route/DN list + trace + Dashboard date-range |
| **G3 Drill + back คงสถานะ** | กลับ **ไม่เสีย state เดิม** | dashboard drill · detail modal · Route add-order modal · trace genealogy |
| **G4 Customer search dropdown** | quotation/po/so-create | ค้นเบอร์/บริษัท/ผู้ติดต่อ · Disabled/Blacklist hard block |
| **G5 Permission-per-action** | ทุกปุ่มระบุ capability | `permission-matrix.md` · **★★★★★★ r16: รหัส = ระดับต่ำสุด (min level) ของโมเดลสะสม (§1a)** |
| **★ G6 Comment + change-history** | ทุก object ธุรกรรมมี **ช่องหมายเหตุเดียว แก้ในที่ + เก็บประวัติครบ** | **12 object** · `comment-convention.md` |
| **★ G7 Search-in-dropdown** | RM/FG/Lot/component + Return RM-in-lot | ค้นชื่อ+รหัส · Route driver · trace topic |
| **★ G8 Document number on SAVE** | create ทุกใบ: ไม่โชว์เลขล่วงหน้า → ออกเลข gapless ตอนบันทึก + popup ยืนยัน | `numbering-on-save.md` · **★★★★★★★ r17: cancel ของ submit-confirm = ไม่กินเลข (§9.1 non-functional)** |
| **★ G9 Permission-code suffix** | ทุก actionable control ที่ permission-gate แสดงรหัสสิทธิ์เป็น suffix | รหัส 6 ตัว: R/C/U/D/A/Ad · **★★★★★★ r16: รหัส = min level ของ cumulative ladder (§1a)** · authority = `permission-matrix.md` §3 |

> NFR ระดับระบบ รวมที่ `non-functional.md`. **★★★★★★★ r17 — Platform layer authoritative ที่ `platform.md` (login/noti/reset/self-disable/session) + `non-functional.md` (§1 perf · §2 auth · §7 noti · §9.1 submit-confirm · §16 security). ★★★★★★★★ r18 — noti read-driven authoritative ที่ `platform.md` §7 + `non-functional.md` §7. ★★★★★★★★★ r19 — noti event set authoritative ที่ `platform.md` §7 + `non-functional.md` §6/§7 (+ `supply-planning.md` §5.1 · `customer.md` §4.1).**
> **★★★★★★ r16 — RBAC = cumulative per-module level (`permission-matrix.md` §1a); role editor = per-module single-level selector (`settings.md` §4).**
> **★★★★★★ r14 — Dashboard = landing หลัง login; visibility = Read ต่อแผนก.**

---

## 4. Confirmations ที่ปอนด์สั่งให้ยืนยัน (RESOLVED)

| หัวข้อ | คำตัดสิน | เอกสาร |
|---|---|---|
| **Convert-to-PO** | QT = **Confirmed ทันที** + loose link | `quotation.md` · `po.md` · oem-flow |
| **SO (ก)/(ข)** | จอง FG→พร้อมส่ง→ตัด FIFO→DN/Invoice · ผลิตเก็บสต็อก auto-PR | `so.md` · `shipping.md` |
| **★ Comment convention** | **12 object** มีช่อง comment เดียว | `comment-convention.md` |
| **★★ (settled รอบก่อน) — Customer/Stock/Supplier/BOM/Settings/Production/Supply Planning/QC+GR/Return/G8/G9** | (settled) | ราย module |
| **★★★ Customer address + receiver-contact · Shipping = Route (`RT-…`) · DN module (2026-07-30)** | (settled) | `customer.md` · `shipping.md` · `delivery-note.md` |
| **★★★★ Traceability + Audit (r12)** | trace ครอบทุก object + selector · Audit = non-read+login, Admin-only | `traceability.md` · `settings.md` · `non-functional.md` |
| **★★★★★ Invoice review (r13)** | search · one-active · create-no-status-lock · per-invoice override · void · DN-unify | `invoice.md` · ราย module |
| **★★★★★★ Home removed → Dashboard landing (r14)** | login → Dashboard landing | `dashboard.md` · `platform.md` |
| **★ Reconciliation pass (r15)** | C1 DN-mirror · M1 RET · M2 stray-tag · M3 banner · m2/m4 | `flows/*` · ราย module |
| **★★★★★★ CUMULATIVE-level RBAC (r16)** | ลำดับชั้นสะสม `R < C < U < D < A < Admin`; role = 1 ระดับ/module; รหัส G9 = min level; effective = max ของ role Active | `permission-matrix.md` §1a · `settings.md` §4 · `non-functional.md` A3 |
| **★★★★★★★ Platform/NFR decisions (r17, 2026-07-31)** | **(1) Noti = bell-only, snackbar+shake, ไม่มี email · (2) Forget/Reset password (single-use 3-วัน email, user email บังคับ) · (3) Account self-disable + Admin re-enable + no auto-lockout · (4) Perf: read 200ms/1s · write 1s/3s · ~30 concurrent/module · (5) Password ≥8 lower+upper+digit + encrypt+hash · (6) Global submit-confirm (ยกเว้น search; cancel=zero mutation/ไม่กินเลข/ไม่ audit) · (7) session warn 5 นาที + mid-action redirect · Environments · i18n-ready · error/empty-state · API security** | `platform.md` (US-PLT-06/07 · §2/§4/§7) · `non-functional.md` §1/§2 (A2/A6/A9/A10/A11/A12)/§4 (I5)/§5 (D-F6)/§7/§9.1/§16 · `settings.md` §3/§5/§6 · README |
| **★★★★★★★★ Notification READ-DRIVEN reversal (r18, Gate-1 2026-07-31)** | **กลับ dismiss≠read → read-driven:** per-user **read-bit** · **badge = ยังไม่อ่าน** · **คลิกแจ้งเตือน = navigate deep-link + mark READ** · "อ่านแล้วทั้งหมด" · ยกเลิก ✕ dismiss/"ปิดทั้งหมด" · "ดูทั้งหมด" = อ่าน/ยังไม่อ่าน + 4-หมวด + 20/หน้า. | `platform.md` §7 · `non-functional.md` §7 · README |
| **★★★★★★★★★ Notification EVENT-SET update (r19, Gate-1 2026-07-31)** | **ปรับชุด event (คง r18 mechanics + 4-หมวด grouping): เพิ่ม** ติดตามลูกค้า(Follow-up, near-real-time, Read Customer) · เอกสารถูกยกเลิก/ปฏิเสธ(QT/PO/SO/RT/DN/Invoice, **ไม่รวม user soft-delete**, near-real-time, Read module) · Route ส่งสำเร็จ(near-real-time, Read Shipping/Route). **เปลี่ยน** FG→Low real-time → **สรุป Supply Planning Low+Overstock รายวัน** (J8 ~06:00: count+list Low + count+list Overstock, Read Supply Planning, deep-link หน้า SP เดิม filter Low+Overstock; math คงเดิม). **ตัด** Customer Inactivity (→Follow-up). **คงไว้** PO→Production · QC ผ่าน/ไม่ผ่าน · PR auto-created · Invoice Overdue · potential-delay(J4). | `platform.md` §7 (US-PLT-02 · §3/§4/§6/§7/§9/§10) · `non-functional.md` §6/§6.1/§7 (+§10/R5) · `supply-planning.md` §5.1/§5.2/§6.3 · `customer.md` §4.1 · README |

**หมายเหตุ:** Quotation ทำ material check แต่ **ไม่ auto-open PR**.

---

## 5. ★ Source-of-Truth Statement (ประกาศชัด)
1. **`modules/*.md` = AUTHORITATIVE spec ปัจจุบันของทุก module + NFR + Deletion Policy + Traceability** — ชุดเดียวที่ BA/QA/TL ยึด. `home.md` = tombstone; landing = `dashboard.md`.
2. governance authoritative: `non-functional.md` · `deletion-policy.md` · `traceability.md` · `comment-convention.md` (G6) · `numbering-on-save.md` (G8) · **`permission-matrix.md` (RBAC + G9 — §1a cumulative)**.
3. **เอกสารเก่า** = historical reference → Hub ⑥ Archive.
4. **เอกสารหลักการเชิงลึก** (entity-status-map, status-journeys, scope D1–D18, ...) = authoritative reference → Hub ③. **module package wins ถ้าขัดกัน.**
5. **RTM/Traceability คงครบ (r12 trace+audit surface).**
6. **★★★★★ r13: Invoice model = authoritative ที่ `invoice.md`.**
7. **★★★★★★ r14: Navigation/landing = authoritative ที่ `platform.md` + `dashboard.md`.**
8. **★★★★★★ r16: RBAC authorization model = authoritative ที่ `permission-matrix.md` §1a — CUMULATIVE per-module level.** role editor UI = `settings.md` §4. NFR reconcile = `non-functional.md` A3.
9. **★★★★★★★ r17: Platform layer (identity/auth/notification/session/reset/self-disable) = authoritative ที่ `platform.md`; cross-cutting NFR (perf/password/submit-confirm/environments/i18n/error/API-security/notification) = authoritative ที่ `non-functional.md`; user email field = `settings.md` §3.** gap-report `platform-gate2-gap-report.md` = coordination input. **module package wins.**
10. **★★★★★★★★ r18: Notification read/dismiss mechanics = authoritative ที่ `platform.md` §7 + `non-functional.md` §7 — read-driven (read-bit แทน dismiss-bit; badge=unread; click=navigate+mark read; mark-all-read; ไม่มี ✕ dismiss/"ปิดทั้งหมด").**
11. **★★★★★★★★★ r19: Notification EVENT SET = authoritative ที่ `platform.md` §7 + `non-functional.md` §6/§7** — event set = {PO→Production, QC ผ่าน/ไม่ผ่าน, PR auto-created, Invoice Overdue, potential-delay(J4), **+Customer Follow-up, +Doc Cancelled/Rejected, +Route delivered, +SP Low+Overstock DAILY summary**} · ตัด Customer Inactivity + FG→Low real-time · **FG→Low reservation/planning math (D4–D6) คงเดิม**. Supply Planning alert delivery = `supply-planning.md` §5.1 · Follow-up trigger = `customer.md` §4.1.
12. **Navigation IA:** ① Functional · ② Non-Functional · ③ Reference · ④ Architecture · ⑤ Mockups · ⑥ Archive · Reviews/Audit.
13. **★ HTML review view = 1:1 ต่อทุก .md ที่ยังเป็น spec** (render จาก .md ผ่าน `_render.js`). **★★★★★★★ r17: `platform.html`/`non-functional.html`/`settings.html` มี map + ลิงก์ครบ — ไม่มี view ใหม่. ★★★★★★★★ r18 · ★★★★★★★★★ r19: ใช้ view เดิม (render จาก .md ที่แก้แล้ว) + index card descriptions (platform/NFR/supply-planning + footer) refreshed — ไม่มี view ใหม่.**

---

## 6. ★ Map: เอกสารเก่า → ครอบคลุมโดย module ใด
| เอกสารเก่า | ครอบคลุมโดย module (authoritative) | หมายเหตุ |
|---|---|---|
| functional-spec `home.html` | **— (Home ตัดทิ้ง)** · landing = `dashboard.md` | ★★★★★★ r14 |
| functional-spec `platform.html` (US-PLT-01..05) | **`platform.md` (★★★★★★★ +r17 US-PLT-06/07)** | absorbed เต็ม |
| **Notification "14 events / ack = read / open-ended ~8"** | **`platform.md` §7 + `non-functional.md` §7 (★★★★★★★★ r18 read-driven · ★★★★★★★★★ r19 event set, bell-only)** | ★★★★★★★ r17 rewrite → ★★★★★★★★ r18 read-driven → ★★★★★★★★★ r19 event set (+Follow-up/+Doc-Cancelled-Rejected/+Route-delivered · SP Low+Overstock DAILY · −Inactivity · −FG→Low real-time) |
| **RBAC "generic RUCDAA 6 bit อิสระ"** | **`permission-matrix.md` §1a (cumulative) + `settings.md` §4** | ★★★★★★ r16 reconcile |
| **Perf "P1<2s / 50 concurrent"** | **`non-functional.md` §1 (read 200ms/1s · write 1s/3s · ~30/module)** | ★★★★★★★ r17 (ปิด H-C1) |
| `SHP-…` numbering | **`RT-…`** | ★ Q1=A |
| **Return "RT" token** | **`RET-{YYYYMM}-{NNNNNN}`** | ★ r15 M1 |

---

## 7. Changelog — supersede / แก้ / ปอนด์เคาะ
| เอกสาร/รายการ | สถานะ | เหตุผล |
|---|---|---|
| (รายการรอบก่อน) | **settled** | commit history |
| **★★★ Customer address+receiver-contact · Route (`RT-…`) · DN module (2026-07-30)** | **settled** | ราย module |
| **★★★★ Traceability + Audit (r12)** | **settled** | ราย module |
| **★★★★★ Invoice review (r13)** | **settled** | ราย module |
| **★★★★★★ Home removed → Dashboard landing (r14)** | **settled** | `dashboard.md` · `platform.md` |
| **★ Reconciliation pass (r15)** | **DONE · settled** | ราย module |
| **★★★★★★ CUMULATIVE-level RBAC (r16, 2026-07-31)** | **DECIDED · settled (requirement docs)** | `permission-matrix.md` §1a · `settings.md` §4 · `non-functional.md` A3 · README |
| **★★★★★★★ Platform/NFR decisions (r17, 2026-07-31)** | **DECIDED 2026-07-31 (ปอนด์) · settled (requirement docs; UX/UI mockups = §8 hand-off)** | **7 กลุ่ม:** noti (bell-only/snackbar+shake/ไม่มี email) · forget/reset password (US-PLT-06) · account self-disable (US-PLT-07) · perf ใหม่ (H-C1) · password policy+storage · global submit-confirm · session warn 5 นาที + Environments + i18n + error/empty-state + API security. **★ 3 micro-decisions non-blocking** — ปอนด์ยืนยันที่ Gate (§9). |
| **★★★★★★★★ Notification READ-DRIVEN reversal (r18, Gate-1 2026-07-31)** | **DECIDED 2026-07-31 (ปอนด์ Gate-1) · settled (requirement docs; UX/UI mockups = parallel hand-off)** | กลับโมเดลจาก dismiss≠read → **read-driven**: per-user read-bit · badge=unread · คลิก=navigate+mark READ · read หลุดจาก bell ตอน refresh (ไม่ต้อง real-time) · "อ่านแล้วทั้งหมด" · ยกเลิก ✕dismiss/"ปิดทั้งหมด" · "ดูทั้งหมด" = อ่าน/ยังไม่อ่าน + 4-หมวด + 20/หน้า. **คงเดิม:** bell-only/ไม่มี email · snackbar+shake · fan-out by Read. `platform.md` §7 · `non-functional.md` §7. |
| **★★★★★★★★★ Notification EVENT-SET update (r19, Gate-1 2026-07-31)** | **DECIDED 2026-07-31 (ปอนด์ Gate-1, +correction) · settled (requirement docs; UX/UI mockups = parallel hand-off §8)** | ปอนด์ปรับ **ชุด event ของ bell** (คง r18 read-driven + 4-หมวด grouping). **เพิ่ม:** (a) **ติดตามลูกค้า (Customer Follow-up)** near-real-time, Read Customer, deep-link customer detail (`customer.md` §4.1) · (b) **เอกสารถูกยกเลิก/ปฏิเสธ** (QT/PO/SO/RT/DN/Invoice + doc อื่นที่มี cancel/void/reject; **ไม่รวม user soft-delete — การลบเรคคอร์ดโดยผู้ใช้ไม่ยิง noti**) near-real-time, Read module เอกสาร, deep-link เอกสาร · (c) **Route ส่งสำเร็จ** near-real-time, Read Shipping/Route, deep-link Route/DN. **เปลี่ยน:** FG→Low **ตัด real-time** → **สรุป Supply Planning Low+Overstock รายวัน** (J8 ~06:00: count+list Low + count+list Overstock), Read Supply Planning, **deep-link หน้า SP เดิม filter Low+Overstock (reuse — ไม่สร้างหน้าใหม่)**; **reservation/planning math คงเดิม**. **ตัด:** **Customer Inactivity noti** (J2) → แทนด้วย Follow-up (state sweep คงอยู่, ไม่ยิง noti). **คงไว้ (ปอนด์ correction ยืนยัน):** **PO→Production · QC ผ่าน/ไม่ผ่าน · PR auto-created · Invoice Overdue (J3) · potential-delay (J4)**. UI ยังจัดกลุ่ม 4 หมวด. **scope: เฉพาะ event set + FG→Low schedule + J-job — ไม่แตะ r18 mechanics/RBAC/D-rules.** `platform.md` §7 · `non-functional.md` §6/§6.1/§7 · `supply-planning.md` §5.1 · `customer.md` §4.1. |
| **★ Doc-completeness — Platform/NFR (r17) + Noti read-driven (r18) + Noti event-set (r19)** | **DONE (docs เท่านั้น · ไม่มี view ใหม่)** | `platform.html`/`non-functional.html`/`supply-planning.html` มีอยู่ + map + ลิงก์ครบ (render จาก .md r17/r18/r19); index card descriptions (platform/NFR/supply-planning + footer) อัปเดตเป็น event-set r19. |

---

## 8. งานส่งต่อ UX/UI (สรุป)

**punch-list เดิม + delta รอบก่อน:** (คงตามรอบก่อน · รวม A–J + K role editor r16 + L–P platform/NFR r17)

> **★★★★★★★ (r17, 2026-07-31) — Platform/NFR decisions → mockup change-list (L–P: login/reset-password/settings-users/shell-noti/global-patterns)** — คงตามรอบก่อน (ดู commit r17). **★★★★★★★★ r18 ได้ปรับ bell เป็น read-driven ใน (O-2)/(O-3).**
>
> **★★★★★★★★★ (r19, 2026-07-31) — Notification EVENT-SET → mockup change-list (ส่งต่อ UX/UI · เข้า GATE 1 เฉพาะจอ noti ที่แก้):**
> PO แก้ **requirement docs เท่านั้น** (`platform.md`/`non-functional.md`/`supply-planning.md`/`README`/index card); mockup notification (bell panel + `notifications.html`/"ดูทั้งหมด" + dashboard bell + snackbar) = **UX/UI agent** ปรับแบบขนาน. คง r18 read-driven mechanics ทุกอย่าง — เปลี่ยนเฉพาะ **รายการ event ที่โชว์**:
> - **(R-1) KEEP (ไม่ต้องแตะ):** noti รายการเดิม — **PO→Production (เข้าคิวผลิต) · QC ผ่าน/ไม่ผ่าน · PR auto-created · Invoice Overdue · potential-delay (PRD ใกล้ไม่ทันส่ง)** — คงอยู่ในหมวด UI เดิม (งานส่งต่อ/ความเสี่ยงสต็อก-ผลิต/การเงิน).
> - **(R-2) ADD noti item ใหม่ 3 แบบ:**
>   - **ติดตามลูกค้า (Customer Follow-up)** → หมวด "วงจรลูกค้า" · ข้อความเช่น "ลูกค้า {ชื่อ} ครบกำหนดติดตาม / ตั้ง ⚑ ต้องติดตาม" · คลิก = deep-link หน้ารายละเอียดลูกค้า.
>   - **เอกสารถูกยกเลิก/ปฏิเสธ** → หมวด "งานส่งต่อ/เอกสาร" · ข้อความเช่น "QT-102 / PO-181 / RT-… / DN-… / INV-… ถูกยกเลิก/ปฏิเสธ (void/reject)" · คลิก = deep-link เอกสารใบนั้น. **หมายเหตุ:** **การลบเรคคอร์ดโดยผู้ใช้ (soft-delete) ไม่ต้องมี noti item** — โชว์เฉพาะ cancel/void/reject.
>   - **Route ส่งสำเร็จ** → หมวด "งานส่งต่อ/เอกสาร" · ข้อความเช่น "Route RT-… ส่งสำเร็จ" · คลิก = deep-link Route (และ/หรือ DN).
> - **(R-3) CHANGE รายการ Supply Planning:** **เอา FG→Low real-time item ออก** → แทนด้วย **1 รายการสรุปรายวัน** "สรุปสต็อกวันนี้: Low {X} รายการ · Overstock {Y} รายการ" (หมวด "ความเสี่ยงสต็อก/การผลิต") · **คลิก = deep-link หน้า Supply Planning เดิม โดยเปิด filter Low+Overstock ไว้ (query param)** — ใช้หน้า SP เดิม (SP filter Low/OK/Overstock), ไม่สร้างหน้าใหม่. **คง Low bell/indicator บนหัวหน้า SP เอง** (page feature — ไม่เกี่ยวกับ noti item นี้).
> - **(R-4) REMOVE รายการ Customer Inactivity** จาก noti panel/history mock (แทนด้วย Follow-up ใน R-2). Customer state Active→Inactive ยังมี (badge/หน้า customer) แต่ **ไม่มี noti item**.
> - **(R-5)** "ดูทั้งหมด" history + 4-หมวด grouping ยึดตาม event set ใหม่ (R-1..R-4). ยึด `platform.md` §7 · `non-functional.md` §6/§7 · `supply-planning.md` §5.1.
> - **หมายเหตุ collision:** PO owns `.md`; UX/UI owns mockups — ทำแบบขนาน; เข้า GATE 1 เฉพาะจอ noti ที่แก้.

---

## 9. Open questions
**ไม่มี open question ที่บล็อก.** (r12–r19 = ไม่มี open question ที่บล็อก.)

> **★★★★★★★ r17 (Platform/NFR) — 3 รายการ non-blocking ให้ปอนด์ยืนยันที่ Gate** (password policy · session lead-time 5 นาที · 4-หมวด grouping labels) — สร้างสเปกไว้แล้วตามค่าเสนอ.

> **★★★★★★★★ r18 (Notification read-driven) — ปอนด์เคาะที่ Gate-1 แล้ว (read แทน dismiss); ไม่มี open question.**

> **★★★★★★★★★ r19 (Notification event-set) — ปอนด์เคาะที่ Gate-1 แล้ว (event set นิยามชัด + correction คง PO→Production/QC/PR-auto/Invoice-Overdue/potential-delay); ไม่มี open question ที่บล็อก. NON-BLOCKING flags ให้ปอนด์ veto/ปรับได้:**
> 1. **Removed events (ยืนยันให้ตัด):** **Customer Inactivity noti** (แทนด้วย Follow-up) · **FG→Low real-time** (พับเป็นสรุปรายวัน). ถ้าปอนด์อยากคง Customer Inactivity noti หรือ FG→Low real-time ไว้ → แจ้งได้ (ปัจจุบันตัดตามคำสั่ง).
> 2. **Customer Follow-up schedule = near-real-time (event ตอน flag ถึงกำหนด/ตั้ง):** ถ้า "ถึงกำหนด (due-date)" ต้องเช็ควันแบบ sweep เบา ๆ → PO เพิ่ม light daily check ได้ตอน implement (ยึด near-real-time ตามที่ปอนด์สั่ง).
> 3. **Route delivered recipient = Read Shipping/Route เท่านั้น** (ไม่ fan-out per-record ไปยัง Sale เฉพาะราย) — ปอนด์เพิ่ม Read Sale ได้ถ้าต้องการ.

> **★★★★★★ r16 (Cumulative RBAC) — awkward-case DEF-2 (non-blocking):** A รวม D · U รวม C — ปอนด์ยืนยัน ladder เข้มแล้ว; SoD ละเอียด = รอบถัดไป (`permission-matrix.md` §1a/§4 · `non-functional.md` §15).
