# Requirement Package (Per-Module) — ESSENCE Hub System

slug: `erp-v2-ui-first` · เขียนโดย PO · 2026-07-30 · **CANONICAL & COMPLETE SINGLE SOURCE OF TRUTH** สำหรับ BA / QA / Tech-Lead
สถานะ: consolidation ของ requirement ที่กระจัดกระจาย → per-module ที่โครงสร้างสม่ำเสมอ **ครบทุก module + NFR + Deletion Policy** · reconciled กับ D1–D18 + fold คำสั่งใหม่ของปอนด์ (2026-07-29 · **+ Customer/Route/DN 3-module review 2026-07-30 · + Traceability trace-surface + Audit-log review r12 2026-07-30 · + Invoice review r13 2026-07-30 · + Home removed → Dashboard landing r14 2026-07-30 · + Reconciliation pass C1/M1/M2/M3+m2/m4 r15 2026-07-31 · ★★★★★★ + CUMULATIVE-level RBAC r16 2026-07-31 · ★★★★★★★ + Platform/NFR decisions r17 2026-07-31 · ★★★★★★★★ + Notification READ-DRIVEN (read replaces dismiss) r18 2026-07-31**)

## สรุปภาษาไทย
เอกสารชุดนี้คือ **แหล่งความจริงล่าสุดแบบราย module ที่ครบถ้วน (single source of truth)** ของทั้งระบบ ESSENCE Hub. **★★★★★★★★ NEW — Notification READ-DRIVEN (r18, ปอนด์ Gate-1 2026-07-31):** กลับโมเดลแจ้งเตือนจาก dismiss≠read → **read-driven** — per-user **read-bit** (แทน dismiss-bit); **badge = ยังไม่อ่าน (unread)** cap "9+"; **คลิกแจ้งเตือน (ใน bell หรือหน้า "ดูทั้งหมด") = navigate deep-link + mark READ ราย user** (A อ่านไม่กระทบ B); รายการที่อ่านแล้วหลุดจาก bell ตอน refresh/poll ถัดไป (**ไม่ต้อง real-time, ไม่มี websocket/batch**); ปุ่ม **"อ่านแล้วทั้งหมด (mark all read)"** เคลียร์ bell; **ยกเลิก ✕ dismiss ราย item + "ปิดทั้งหมด"** เดิม; "ดูทั้งหมด" = ประวัติ อ่าน/ยังไม่อ่าน 20/หน้า จัดกลุ่ม 4 ประเภท. คงเดิม: bell-only/ไม่มี email · 4-type taxonomy · snackbar+shake · fan-out by Read · FG→Low real-time + J8. **★★★★★★★ Platform/NFR decisions (r17, ปอนด์ 2026-07-31):** (1) **Notification = bell-only, event-driven, 4-type taxonomy** (งานส่งต่อ · ความเสี่ยงสต็อก/ผลิต · การเงิน · วงจรลูกค้า) + **★★★★★★★★ r18 read-driven (read แทน dismiss)** (คลิกแจ้งเตือน = navigate deep-link + mark READ ราย user; badge = unread; "อ่านแล้วทั้งหมด" เคลียร์ bell; read หลุดจาก bell ตอน refresh — ไม่ต้อง real-time; "ดูทั้งหมด" = อ่าน/ยังไม่อ่าน 20/หน้า; ยกเลิก ✕ dismiss + "ปิดทั้งหมด") + **snackbar/toast + bell shake** + **ไม่มี email** (email เฉพาะ reset). (2) **Forget/Reset password** — ลิงก์ "ลืมรหัสผ่าน" → single-use link 3 วัน → อีเมลบนเรคคอร์ด → ตั้งรหัสใหม่ (email field บน user = บังคับ). (3) **Account self-disable** + **Admin re-enable** + **no auto-lockout**. (4) **Perf ใหม่:** read AVG 200ms/MAX 1s · write AVG 1s/MAX 3s · rate-limit ~30 concurrent/module. (5) **Password policy** ≥8 lower+upper+digit + **storage encrypt+hash**. (6) **Global submit-confirm contract** (ทุก submit ยืนยัน ยกเว้น search; cancel = zero mutation/ไม่กินเลข/ไม่ audit). (7) **Session warning 5 นาที + mid-action redirect · Environments Dev/Test/Prod · i18n-ready · error/empty-state · API security**. อัปเดต `platform.md` · `non-functional.md` §1/§2/§7/§9/§16 · `settings.md` §3. **★★★★★★ CUMULATIVE-level RBAC (r16):** โมเดลสิทธิ์ = ลำดับชั้นสะสม `R < C < U < D < A < Admin` (Create < Update); role เลือกระดับเดียว/module; รหัส G9 = min level; effective = max ของ role Active. **★ r15 Reconciliation · ★★★★★★ Home removed → Dashboard landing (r14) · ★★★★★ Invoice (r13) · ★★★★ Traceability + Audit (r12) · ★★★ 3 modules (Customer · Route `RT-…` · DN).** **คงกฎเดิม:** 2-tier Route/DN · G8 · G6 · G9 · entity-status-map. **★ ทุกไฟล์ `.md` มี HTML review view + ลิงก์ในหน้า index.**

---

## 1. โครงไฟล์ (file tree — ครบทั้งชุด)

```
docs/requirements/erp-v2-ui-first/modules/
  README.md                  ← ไฟล์นี้ (index + D-rule spine + changelog + source-of-truth + old→new map + global rules)
  permission-matrix.md       ← ★★★★★★ RBAC = CUMULATIVE per-module level (§1a: R<C<U<D<A<Admin) · capability → module → action/button → ★ Suffix (G9=min level)
  comment-convention.md      ← ★ กติกากลาง comment + change-history (CC1–CC7) · 12 object (Shipment→Route)
  numbering-on-save.md        ← ★ กติกากลาง G8 = เลขเอกสารออกตอนบันทึก (NS1–NS7) · DN+Route (RT) · ★ Invoice one-active · ★ Return RET-… (r15)

  # System-wide / Governance (Non-Functional bucket ใน Hub)
  non-functional.md          ← NFR รวม (★★★★★★ A3 = cumulative RBAC r16 · ★★★★★★★ r17 = perf ใหม่ §1 + password/self-disable/reset §2 + noti 4-type §7 + submit-confirm §9.1 + API security §16 · ★★★★★★★★ r18 = noti read-driven §7)
  deletion-policy.md         ← soft-delete/void baseline + entity (INV = void-only §2.8)
  traceability.md            ← trace/audit governance (★★★★ r12: entity/topic selector §3.1 + sample-per-object §5b + non-read+login §3/§4/§9)

  # Platform & Navigation
  platform.md                ← ★ login → Dashboard landing (r14) · ★★★★★★★ r17: noti 4-type/snackbar+shake · forget-reset password (US-PLT-06) · account self-disable (US-PLT-07) · session warning 5 นาที · ★★★★★★★★ r18: noti read-driven (read แทน dismiss · badge=unread · mark-all-read · ไม่มี ✕dismiss)
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
**★ Doc-completeness: ทุกไฟล์ `.md` (spec ที่ยังใช้งาน) มี HTML review view ครบ 1:1 + ลิงก์ในหน้า Modules index** (render จาก .md ผ่าน `_render.js`). **★★★★★★★ r17: `platform.html` · `non-functional.html` · `settings.html` มีอยู่แล้ว + map ใน `_render.js` + ลิงก์ใน index — แก้ .md แล้ว view อัปเดตอัตโนมัติ (ไม่มี view ใหม่).** **★★★★★★★★ r18 (noti read-driven): แก้ `platform.md` §7 + `non-functional.md` §7 (+ header/summary/§1/§6/§9.1) เท่านั้น — `platform.html`/`non-functional.html` render จาก .md อัปเดตอัตโนมัติ + index card descriptions (platform/NFR) refreshed — ไม่มี view ใหม่.** **★★★★★★ r16 (cumulative RBAC): แก้ requirement docs เท่านั้น — ใช้ view เดิม.** **★★★★★★ r14 (Home removed):** ตัด `home.html`.

---

## 2. D-Rule Spine (คงเป็นแกน — พร้อม DELTA)
D1–D18 ยังเป็นกฎแกน (`scope-oem-ownbrand-supply-planning.md` §1). จุดอัปเดตหลัก (คงตามรอบก่อน): **D8 v2** · **credit 60** · **D18 reseat** · **D11 v2** · **D13 reinforce** · **D9/D10** · **D12/D16** · Route/DN rewrite · Trace/Audit r12 · Invoice r13 · Home removed r14 · Reconciliation r15. **★★★★★★ r16 Cumulative RBAC:** ไม่แตะ D-rule — **D14 คงเป็นแกน RBAC** แต่ reconcile นิยามเป็น "cumulative per-module level (total order)". **★★★★★★★ r17 Platform/NFR:** ไม่แตะ D-rule — เพิ่ม layer platform/NFR (noti 4-type, reset, self-disable, perf, submit-confirm, security) บนกฎเดิม. **★★★★★★★★ r18 Notification read-driven:** ไม่แตะ D-rule — ปรับเฉพาะกลไก read/dismiss ของ notification (read-bit แทน dismiss-bit) บน layer เดิม. **★ reconcile deferred:** Invoice Confirmed-gate ผ่อน (DEF-1) · RBAC SoD ผ่อน (DEF-2) — `non-functional.md` §15.

---

## 3. GLOBAL Rules (บังคับทุก module)

| # | กติกา | รายละเอียด |
|---|---|---|
| **G1 Pagination** | list/history ทุกอัน **20 แถว/หน้า + pagination** | ทุก list + **★ Route/DN/Invoice list · field-audit · Dashboard drill-down · ★★★★★★★ notification "ดูทั้งหมด" (r17 · ★★★★★★★★ r18 แสดง อ่าน/ยังไม่อ่าน + จัดกลุ่ม 4 ประเภท)** |
| **G2 Date-range search** | ค้น **เลขเอกสาร** หรือ **ช่วงวันที่** | quotation/PO/SO/GR/PR/invoice list + production queue + audit + Route/DN list + trace + Dashboard date-range |
| **G3 Drill + back คงสถานะ** | กลับ **ไม่เสีย state เดิม** | dashboard drill · detail modal · Route add-order modal · trace genealogy |
| **G4 Customer search dropdown** | quotation/po/so-create | ค้นเบอร์/บริษัท/ผู้ติดต่อ · Disabled/Blacklist hard block |
| **G5 Permission-per-action** | ทุกปุ่มระบุ capability | `permission-matrix.md` · **★★★★★★ r16: รหัส = ระดับต่ำสุด (min level) ของโมเดลสะสม (§1a)** |
| **★ G6 Comment + change-history** | ทุก object ธุรกรรมมี **ช่องหมายเหตุเดียว แก้ในที่ + เก็บประวัติครบ** | **12 object** · `comment-convention.md` |
| **★ G7 Search-in-dropdown** | RM/FG/Lot/component + Return RM-in-lot | ค้นชื่อ+รหัส · Route driver · trace topic |
| **★ G8 Document number on SAVE** | create ทุกใบ: ไม่โชว์เลขล่วงหน้า → ออกเลข gapless ตอนบันทึก + popup ยืนยัน | `numbering-on-save.md` · **★★★★★★★ r17: cancel ของ submit-confirm = ไม่กินเลข (§9.1 non-functional)** |
| **★ G9 Permission-code suffix** | ทุก actionable control ที่ permission-gate แสดงรหัสสิทธิ์เป็น suffix | รหัส 6 ตัว: R/C/U/D/A/Ad · **★★★★★★ r16: รหัส = min level ของ cumulative ladder (§1a)** · authority = `permission-matrix.md` §3 |

> NFR ระดับระบบ รวมที่ `non-functional.md`. **★★★★★★★ r17 — Platform layer authoritative ที่ `platform.md` (login/noti 4-type/reset/self-disable/session) + `non-functional.md` (§1 perf · §2 auth · §7 noti · §9.1 submit-confirm · §16 security). ★★★★★★★★ r18 — noti read-driven (read แทน dismiss) authoritative ที่ `platform.md` §7 + `non-functional.md` §7.**
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
| **★★★★★★★ Platform/NFR decisions (r17, 2026-07-31)** | **(1) Noti = bell-only, 4-type taxonomy, dismiss≠read, snackbar+shake, ไม่มี email · (2) Forget/Reset password (single-use 3-วัน email, user email บังคับ) · (3) Account self-disable + Admin re-enable + no auto-lockout · (4) Perf: read 200ms/1s · write 1s/3s · ~30 concurrent/module · (5) Password ≥8 lower+upper+digit + encrypt+hash · (6) Global submit-confirm (ยกเว้น search; cancel=zero mutation/ไม่กินเลข/ไม่ audit) · (7) session warn 5 นาที + mid-action redirect · Environments · i18n-ready · error/empty-state · API security** | `platform.md` (US-PLT-06/07 · §2/§4/§7) · `non-functional.md` §1/§2 (A2/A6/A9/A10/A11/A12)/§4 (I5)/§5 (D-F6)/§7/§9.1/§16 · `settings.md` §3/§5/§6 · README |
| **★★★★★★★★ Notification READ-DRIVEN reversal (r18, Gate-1 2026-07-31)** | **กลับ dismiss≠read → read-driven:** per-user **read-bit** (แทน dismiss-bit) · **badge = ยังไม่อ่าน (unread)** · **คลิกแจ้งเตือน (bell/"ดูทั้งหมด") = navigate deep-link + mark READ (ราย user)** · read หลุดจาก bell ตอน refresh/poll ถัดไป (**ไม่ต้อง real-time, ไม่มี websocket/batch**) · **"อ่านแล้วทั้งหมด (mark all read)"** เคลียร์ bell · **ยกเลิก ✕ dismiss ราย item + "ปิดทั้งหมด"** · "ดูทั้งหมด" = อ่าน/ยังไม่อ่าน + จัดกลุ่ม 4 ประเภท + 20/หน้า + deep-link. **คงเดิม:** bell-only/ไม่มี email · 4-type taxonomy · snackbar+shake · fan-out by Read · FG→Low real-time+J8. **scope: เฉพาะกลไก read/dismiss + read-bit + badge — ไม่แตะ taxonomy/RBAC/D-rules.** | `platform.md` §7 (US-PLT-02/03 · §2/§3/§4/§6/§7/§9) · `non-functional.md` §7 (+§1 P5/§6/§9.1) · README |

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
9. **★★★★★★★ r17: Platform layer (identity/auth/notification/session/reset/self-disable) = authoritative ที่ `platform.md`; cross-cutting NFR (perf/password/submit-confirm/environments/i18n/error/API-security/notification) = authoritative ที่ `non-functional.md`; user email field = `settings.md` §3.** gap-report `platform-gate2-gap-report.md` = coordination input (ไม่ใช่ build spec). **module package wins.**
10. **★★★★★★★★ r18: Notification read/dismiss mechanics = authoritative ที่ `platform.md` §7 + `non-functional.md` §7 — read-driven (read-bit แทน dismiss-bit; badge=unread; click=navigate+mark read; mark-all-read; ไม่มี ✕ dismiss/"ปิดทั้งหมด").**
11. **Navigation IA:** ① Functional · ② Non-Functional · ③ Reference · ④ Architecture · ⑤ Mockups · ⑥ Archive · Reviews/Audit.
12. **★ HTML review view = 1:1 ต่อทุก .md ที่ยังเป็น spec** (render จาก .md ผ่าน `_render.js`). **★★★★★★★ r17: `platform.html`/`non-functional.html`/`settings.html` มี map + ลิงก์ครบ — ไม่มี view ใหม่. ★★★★★★★★ r18: ใช้ view เดิม (render จาก .md ที่แก้แล้ว) + index card descriptions refreshed — ไม่มี view ใหม่.**

---

## 6. ★ Map: เอกสารเก่า → ครอบคลุมโดย module ใด
| เอกสารเก่า | ครอบคลุมโดย module (authoritative) | หมายเหตุ |
|---|---|---|
| functional-spec `home.html` | **— (Home ตัดทิ้ง)** · landing = `dashboard.md` | ★★★★★★ r14 |
| functional-spec `platform.html` (US-PLT-01..05) | **`platform.md` (★★★★★★★ +r17 US-PLT-06/07)** | absorbed เต็ม |
| **Notification "14 events / ack = read / open-ended ~8"** | **`platform.md` §7 + `non-functional.md` §7 (4-type, ★★★★★★★★ r18 read-driven, bell-only)** | ★★★★★★★ r17 rewrite (4-type) → ★★★★★★★★ r18 read-driven (read แทน dismiss) |
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
| **★★★★★★★ Platform/NFR decisions (r17, 2026-07-31)** | **DECIDED 2026-07-31 (ปอนด์) · settled (requirement docs; UX/UI mockups = §8 hand-off)** | **7 กลุ่ม:** (1) Notification rewrite → **bell-only, event-driven, 4-type taxonomy** (งานส่งต่อ/ความเสี่ยงสต็อก-ผลิต/การเงิน/วงจรลูกค้า), **dismiss≠read** *(→ superseded by r18 read-driven)*, **snackbar+shake**, **ไม่มี email** — `platform.md` §7 · `non-functional.md` §7. (2) **Forget/Reset password** — ลิงก์บน login + `reset-password.html` (request+set-new), single-use 3-วัน, email delivery, no-enumeration, expired/reused edge, **user email บังคับ** — `platform.md` US-PLT-06 · `settings.md` §3. (3) **Account self-disable** + confirm + session-kill + login-block + **Admin re-enable** + only-Admin guard + **no auto-lockout** — `platform.md` US-PLT-07 · `settings.md` §5/§6. (4) **Perf ใหม่** (ปิด H-C1) — read AVG 200ms/MAX 1s · write AVG 1s/MAX 3s · rate-limit ~30 concurrent/module + test oracle — `non-functional.md` §1. (5) **Password policy** ≥8 lower+upper+digit (special ไม่บังคับ) + **storage encrypt+hash** + first-login abandonment — `non-functional.md` A9/A10/A6. (6) **Global submit-confirm contract** (ทุก submit ยืนยัน ยกเว้น search; cancel=zero mutation/ไม่กินเลข/ไม่ audit) — `non-functional.md` §9.1. (7) **Session warn 5 นาที + mid-action redirect (A2) · Environments Dev/Test/Prod (I5) · i18n-ready (D-F6) · error/empty-state (§9) · API security HTTPS/rate-limit/input-validation/CSRF (§16)**. **★ 3 micro-decisions non-blocking** (4-type taxonomy labels · password rule · session lead-time 5 นาที) — ปอนด์ยืนยันที่ Gate (§9). |
| **★★★★★★★★ Notification READ-DRIVEN reversal (r18, Gate-1 2026-07-31)** | **DECIDED 2026-07-31 (ปอนด์ Gate-1) · settled (requirement docs; UX/UI mockups = parallel hand-off)** | ปอนด์ทบทวน r17 notification bell ที่ Gate-1 → **กลับโมเดลจาก dismiss≠read → read-driven** (เรียบง่ายกว่า): per-user **read-bit** (แทน dismiss-bit) · **badge = ยังไม่อ่าน (unread)** cap "9+" · **คลิกแจ้งเตือน (bell หรือ "ดูทั้งหมด") = navigate deep-link + mark READ (ราย user; A อ่านไม่กระทบ B)** · read หลุดจาก bell ตอน refresh/poll ถัดไป (**near-real-time ไม่จำเป็น; ยอมรับ poll delay P5 ≤15s; ไม่มี websocket/batch**) · ปุ่ม **"อ่านแล้วทั้งหมด (mark all read)"** เคลียร์ bell · **ยกเลิก ✕ dismiss ราย item + "ปิดทั้งหมด" (dismiss-all)** · "ดูทั้งหมด" history = แสดง **อ่าน/ยังไม่อ่าน** + จัดกลุ่ม 4 ประเภท + 20/หน้า + deep-link. **คงเดิม (unchanged):** bell-only/ไม่มี email · 4-type taxonomy content · snackbar+shake · fan-out by Read (per-user) · FG→Low real-time + J8 digest + Suggested · deep-links per type. **scope: เฉพาะ notification read/dismiss mechanics + data-model bit (dismiss-bit→read-bit) + badge definition — ไม่แตะ cumulative-RBAC/D-rules/อื่นใด.** `platform.md` §7 (header/summary/§2/§3/§4/US-PLT-02/03/§6/§7/§9) · `non-functional.md` §7 (+§1 P5/§6/§9.1/§14). |
| **★ Doc-completeness — Platform/NFR (r17) + Notification read-driven (r18)** | **DONE (docs เท่านั้น · ไม่มี view ใหม่)** | `platform.html`/`non-functional.html`/`settings.html` มีอยู่ + map + ลิงก์ครบ (render จาก .md r17/r18); index card descriptions (platform/NFR) อัปเดตเป็น read-driven. |

---

## 8. งานส่งต่อ UX/UI (สรุป)

**punch-list เดิม + delta รอบก่อน:** (คงตามรอบก่อน · รวม A–J + K role editor r16)

> **★★★★★★★ (r17, 2026-07-31) — Platform/NFR decisions → mockup change-list (ส่งต่อ UX/UI · เข้า GATE 1 เฉพาะจอที่แก้/ใหม่):**
>
> **(L) Login (`mockups/login.html`):**
> - **(L-1)** เพิ่มลิงก์ **"ลืมรหัสผ่าน"** ใต้ปุ่ม login → ไป reset-password flow.
> - **(L-2)** first-login change: กติการหัสใหม่ต้องผ่านเกณฑ์ **≥8 + lower+upper+digit** (แสดง hint/validation).
>
> **(M) Reset-password page (`mockups/reset-password.html` — ใหม่):**
> - **(M-1) request:** ช่องกรอกอีเมล + ปุ่มส่ง → ข้อความทั่วไป "ถ้าอีเมลตรงกับบัญชี เราได้ส่งลิงก์ให้แล้ว" (no enumeration).
> - **(M-2) set-new:** เปิดจากลิงก์ในอีเมล → 2 ช่องรหัสใหม่ + toggle show/hide + validation A9 → บันทึก → กลับ login.
> - **(M-3)** หน้า error ลิงก์หมดอายุ/ถูกใช้แล้ว + ปุ่มขอใหม่.
>
> **(N) Settings — Users tab (`mockups/settings.html`):**
> - **(N-1)** เพิ่มฟิลด์ **อีเมล (บังคับ)** บนฟอร์ม user = ที่อยู่รับลิงก์รีเซ็ต + validation รูปแบบ.
> - **(N-2)** สถานะบัญชี **Self-disabled** + ปุ่ม **"เปิดคืนบัญชี (Ad)"** (Admin) สำหรับบัญชีที่ผู้ใช้ปิดเอง.
> - **(N-3)** password setup แสดงกติกา A9.
>
> **(O) Shell / user menu (ทุกหน้า):**
> - **(O-1)** ปุ่ม **"ปิดบัญชีของฉัน"** ในเมนูผู้ใช้ → confirm popup (guard only-Admin แสดง error ถ้าเป็น Admin คนเดียว).
> - **(O-2) Notification bell redesign — ★★★★★★★★ r18 READ-DRIVEN (แทน dismiss ของ r17):** คลิกแจ้งเตือนในรายการ = **navigate deep-link + mark READ** (รายการหลุดจาก bell ตอน refresh) · ปุ่ม **"อ่านแล้วทั้งหมด (mark all read)"** (แทน "ปิดทั้งหมด"/dismiss-all) · **เอา ✕ dismiss ราย item ออก** · badge = **ยังไม่อ่าน (unread)** "9+" · ลิงก์ **"ดูทั้งหมด"** → หน้า read-all history (แสดง **อ่าน/ยังไม่อ่าน**, จัดกลุ่ม 4 ประเภท, 20/หน้า, แต่ละแถวคลิก = navigate + mark read).
> - **(O-3) snackbar/toast** ชั่วคราวมุมจอ + **bell shake** เมื่อมี notification ใหม่ (distinct จาก confirm modal).
> - **(O-4) session warning banner** โผล่ล่วงหน้า 5 นาทีก่อนตัด.
>
> **(P) Global patterns (ทุกหน้า):**
> - **(P-1) Submit-confirm popup** ทุก action ที่เปลี่ยนข้อมูล (create/save/status-change/delete/void/cancel/approve/config) — **ยกเว้น search/filter/pagination + ★★★★★★★★ r18: การอ่านแจ้งเตือน (คลิก/mark-all-read) ยิงได้ทันที ไม่ต้อง confirm**; โครง = หัวเรื่อง + สรุปสิ่งที่เปลี่ยน + ยืนยัน/ยกเลิก; cancel = ไม่มีการเปลี่ยนแปลง.
> - **(P-2) error page + empty-state** ที่เป็นมิตร (403/404/500 + "ไม่พบข้อมูล").
> - **(P-3) i18n-ready** — ไม่ hardcode สตริงใน markup (เตรียม externalize; แสดงไทยอย่างเดียว).
> - ยึด `platform.md` · `non-functional.md` §1/§2/§7/§9/§9.1/§16 · `settings.md` §3.
> - **หมายเหตุ collision:** PO รอบนี้แก้ **requirement docs เท่านั้น** (`platform.md`/`non-functional.md`/`settings.md`/README); mockups (L–P) ส่งต่อ **UX/UI agent**. **★★★★★★★★ r18: UX/UI กำลังอัปเดต mockup notification (dashboard bell + notifications.html) เป็น read-driven แบบขนาน — PO owns `.md`, UX/UI owns mockups.**

---

## 9. Open questions
**ไม่มี open question ที่บล็อก.** (r12–r18 = ไม่มี open question ที่บล็อก.)

> **★★★★★★★ r17 (Platform/NFR) — 3 รายการ non-blocking ให้ปอนด์ยืนยันที่ Gate (สร้างสเปกไว้แล้วตามค่าเสนอ; งานเดินต่อ):**
> 1. **4-type notification taxonomy (labels/grouping):** PO เสนอ 4 ประเภท = **(1) งานส่งต่อข้ามแผนก** (PO→Production, QC pass/fail, DN outcomes, PR auto) · **(2) ความเสี่ยงสต็อก/การผลิต** (FG→Low real-time+J8, potential-delay J4) · **(3) การเงิน/เครดิต** (Invoice Overdue J3) · **(4) วงจรลูกค้า** (Customer Inactivity J2). แต่ละ type = trigger→ผู้รับ(Read)→deep-link→read (`platform.md` §7). **ยืนยัน/ปรับชื่อประเภทที่ Gate.**
> 2. **Password policy:** PO เสนอ **≥ 8 ตัวอักษร + lower + upper + digit (special ไม่บังคับ)** (`non-functional.md` A9). **ยืนยัน/ปรับที่ Gate.**
> 3. **Session-expiry warning lead-time:** PO เสนอ **5 นาที** ก่อนตัด (`non-functional.md` A2). **ยืนยัน/ปรับที่ Gate.**

> **★★★★★★★★ r18 (Notification read-driven) — ปอนด์เคาะที่ Gate-1 แล้ว (read แทน dismiss); ไม่มี open question. UX/UI อัปเดต mockup แบบขนาน.**

> **★★★★★★ r16 (Cumulative RBAC) — awkward-case DEF-2 (non-blocking):** A รวม D · U รวม C — ปอนด์ยืนยัน ladder เข้มแล้ว; SoD ละเอียด = รอบถัดไป (`permission-matrix.md` §1a/§4 · `non-functional.md` §15).
