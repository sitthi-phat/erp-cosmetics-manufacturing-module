# Requirement Package (Per-Module) — ESSENCE Hub System

slug: `erp-v2-ui-first` · เขียนโดย PO · 2026-07-30 · **CANONICAL & COMPLETE SINGLE SOURCE OF TRUTH** สำหรับ BA / QA / Tech-Lead
สถานะ: consolidation ของ requirement ที่กระจัดกระจาย → per-module ที่โครงสร้างสม่ำเสมอ **ครบทุก module + NFR + Deletion Policy** · reconciled กับ D1–D18 + fold คำสั่งใหม่ของปอนด์ (2026-07-29 · **+ Customer/Route/DN 3-module review 2026-07-30 · + Traceability trace-surface + Audit-log review r12 2026-07-30 · + Invoice review r13 2026-07-30 · + Home removed → Dashboard landing r14 2026-07-30 · + Reconciliation pass C1/M1/M2/M3+m2/m4 r15 2026-07-31 · ★★★★★★ + CUMULATIVE-level RBAC r16 2026-07-31**)

## สรุปภาษาไทย
เอกสารชุดนี้คือ **แหล่งความจริงล่าสุดแบบราย module ที่ครบถ้วน (single source of truth)** ของทั้งระบบ ESSENCE Hub. **★★★★★★ NEW — CUMULATIVE-level RBAC (r16, ปอนด์ 2026-07-31):** โมเดลสิทธิ์เปลี่ยนจาก "generic RUCDAA 6 bit อิสระต่อ module" → **"ลำดับชั้นสะสม (cumulative total order) `R < C < U < D < A < Admin`"** — แต่ละ role เลือก **ระดับเดียวต่อ module** และระดับนั้น**รวมทุก action ที่ต่ำกว่าอัตโนมัติ** (⚠️ Create < Update). Role editor ใน Settings = **per-module single-level selector (radio/dropdown) + explainer สะสม** (เลิก checkbox แยก action). รหัส G9 (§3 permission-matrix) = **ระดับต่ำสุด (min level)** ที่ใช้ปุ่มนั้นได้. Effective level = **max** ของ role Active. อัปเดต `permission-matrix.md` §1a (authoritative) · `settings.md` §4/US-SET-01 · `non-functional.md` A3. **flag awkward-case (A รวม D · U รวม C) = non-blocking**. **★ NEW — Reconciliation pass (r15):** C1 flow DN-mirror · M1 Return `RET-…` · M2 stray-tag · M3 scope banner · m2/m4. **★★★★★★ Home removed → Dashboard landing (r14).** **★★★★★ Invoice review (r13).** **★★★★ Traceability + Audit (r12).** **★★★ 3 modules (2026-07-30):** Customer · Route `RT-…` · DN. **คงกฎเดิม:** 2-tier Route/DN · G8 · G6 · G9 · entity-status-map. **★ ทุกไฟล์ `.md` มี HTML review view + ลิงก์ในหน้า index.**

---

## 1. โครงไฟล์ (file tree — ครบทั้งชุด)

```
docs/requirements/erp-v2-ui-first/modules/
  README.md                  ← ไฟล์นี้ (index + D-rule spine + changelog + source-of-truth + old→new map + global rules)
  permission-matrix.md       ← ★★★★★★ RBAC = CUMULATIVE per-module level (§1a: R<C<U<D<A<Admin) · capability → module → action/button → ★ Suffix (G9=min level) · ★ แก้สถานะ DN = A · ★ Audit view = Admin (Ad) · ★ Invoice สร้าง=C/void=D/override=U/print=R (r13)
  comment-convention.md      ← ★ กติกากลาง comment + change-history (CC1–CC7) · 12 object (Shipment→Route)
  numbering-on-save.md        ← ★ กติกากลาง G8 = เลขเอกสารออกตอนบันทึก (NS1–NS7) · DN+Route (RT) · ★ Invoice one-active · ★ Return RET-… (r15)

  # System-wide / Governance (Non-Functional bucket ใน Hub)
  non-functional.md          ← NFR รวม (★ +Route/DN r11 · RT numbering · DN status-edit A · ★★★★ +Audit non-read+login r12 = AU1/AU6 · D-F3 VAT invoice-date + J3 overdue-by-DN · ★ +Return RET numbering + §15 Deferred-controls register r15 · ★★★★★★ A3 = cumulative RBAC r16)
  deletion-policy.md         ← soft-delete/void baseline + entity (INV = void-only §2.8)
  traceability.md            ← trace/audit governance (★ +Route/DN entity + DN status-edit A audit · ★★★★ r12: entity/topic selector §3.1 + sample-per-object §5b + non-read+login §3/§4/§9 · ★ Return topic source RT→RET r15)

  # Platform & Navigation
  platform.md                ← ★ login → Dashboard landing (r14) · identity/noti/global search/session/guard
  dashboard.md               ← ★★ LANDING หลัง login (r14) · 7 แผนก/29 tile · per-department Read-scoped day-to-day · date-range รายแผนก + date-type
  # home.md = ★ REMOVED (ตัดทิ้ง 2026-07-30) — tombstone เท่านั้น

  # Sales & Customer
  customer.md (★ +ที่อยู่ลูกค้า/ที่อยู่จัดส่ง + ผู้ติดต่อ=คนรับสินค้า · ★ +invoice pull/per-invoice-override note r13) · quotation.md · po.md (★ +§4b สถานะจัดส่ง=สะท้อน DN · ★ +§4c billing=ใบ active r13) · so.md (★ +สถานะจัดส่ง=สะท้อน DN · ★ +billing=ใบ active r13)

  # Supply Planning & Production (Functional · ผลิต&คุณภาพ)
  bom.md · supply-planning.md
  production.md              ← คิวผลิต 2 แท็บ + management page + comment
  qc.md                      ← ตรวจรับ RM (QC-gate) + ตรวจแบตช์ 2 sub-tab

  # Inventory & Procurement (Functional · คลัง&จัดซื้อ)
  stock.md (★ return source=RET r15) · goods-receipt.md · pr.md · supplier.md · return.md (★ เลขใบคืน RET-… r15)

  # Fulfilment & Finance
  shipping.md (★★★ Module B — Route `RT-…` + สร้างรอบ + modal + status actions) · delivery-note.md (★★★ Module C — DN 6 สถานะ + search + print DN/Invoice + comment + แก้สถานะ A · ★ +DN-unify create/print Invoice = ใบ active r13) · invoice.md (★★★★★ r13 — search + one-active + create-no-status-lock + per-invoice override + DN-unify + void · ★ +m2 financial-summary-intended r15)

  # System
  settings.md                ← ★★★★★★ RBAC role editor = per-module SINGLE-LEVEL selector (cumulative, §4) + Users + VAT + Company + ★★★★ Audit-log tab (non-read+login, Admin-only, §4d/US-SET-05)

  flows/  oem-flow.md (★ DN-mirror r15) · ownbrand-flow.md (★ DN-mirror r15)

  # Reviews / Audit (ไม่ใช่ spec module — บันทึกการตรวจ)
  ../po-output-quality-audit.md  ← ★ independent Tech-Lead audit (BEFORE) + After reconciliation resolutions (r15) · view = functional-spec/modules/po-output-quality-audit.html
```

HTML review view: `docs/design/erp-v2-ui-first/functional-spec/modules/index.html` · Hub `functional-spec/index.html`.
**★ Doc-completeness: ทุกไฟล์ `.md` (spec ที่ยังใช้งาน) มี HTML review view ครบ 1:1 + ลิงก์ในหน้า Modules index** (render จาก .md ผ่าน `_render.js`). **★★★★★★ r16 (cumulative RBAC): แก้ requirement docs เท่านั้น (`permission-matrix.md` §1a · `settings.md` §4 · `non-functional.md` A3 · README) — ใช้ view เดิม `permission-matrix.html` + `settings.html` (render จาก .md ที่อัปเดต); ไม่มี view ใหม่. UX/UI แก้ mockup `settings.html` (role editor) แยกต่างหาก (ดู §8, ไม่ collide กับ requirement docs).** **★★★★★★ r14 (Home removed):** ตัด `home.html` จาก `_render.js` + unlink. **★ r15:** เพิ่ม view `po-output-quality-audit.html`. **★★★★★ r13:** `invoice.html`. **★★★★ r12:** `traceability.html` + `settings.html`.

---

## 2. D-Rule Spine (คงเป็นแกน — พร้อม DELTA)
D1–D18 ยังเป็นกฎแกน (`scope-oem-ownbrand-supply-planning.md` §1). จุดอัปเดตหลัก (คงตามรอบก่อน): **D8 v2** · **credit 60** · **D18 reseat** · **D11 v2** · **D13 reinforce** · **D9/D10** · **D12/D16**. **★★★ 2026-07-30:** Route/DN rewrite. **★★★★ r12 Trace/Audit.** **★★★★★ r13 Invoice.** **★★★★★★ r14 Home removed.** **★ r15 Reconciliation.** **★★★★★★ r16 Cumulative RBAC:** ไม่แตะ D-rule — **D14 คงเป็นแกน RBAC** แต่ reconcile นิยามจาก "generic RUCDAA 6 bit อิสระ" → **"cumulative per-module level (total order)"** (`permission-matrix.md` §1a). **★ หมายเหตุ reconcile:** เดิม "invoice ออกได้ตั้งแต่ PO Confirmed" → เฟสนี้ผ่อนเป็น **ไม่ล็อกสถานะตอนสร้าง** (deferred, `invoice.md` §7 · `non-functional.md` §15 DEF-1). **★★★★★★ RBAC deferred (DEF-2):** total order ทำให้ SoD ละเอียด (A-without-D, U-without-C) เป็นไปไม่ได้ — ผ่อนตามที่ปอนด์สั่ง (`non-functional.md` §15 DEF-2).

---

## 3. GLOBAL Rules (บังคับทุก module)

| # | กติกา | รายละเอียด |
|---|---|---|
| **G1 Pagination** | list/history ทุกอัน **20 แถว/หน้า + pagination** | ทุก list + **★ Route list · DN list · Invoice list · ★★★★ ตาราง field-audit (trace + Settings audit tab)** · **★ Dashboard drill-down** |
| **G2 Date-range search** | ค้น **เลขเอกสาร** หรือ **ช่วงวันที่** | quotation/PO/SO/GR/PR/invoice list + production queue + audit + **★ Route/DN list** + **★ Invoice search (r13)** + **★★★★ trace.html · Settings audit tab** + **★★★★★★ Dashboard date-range รายแผนก + date-type (r14)** |
| **G3 Drill + back คงสถานะ** | กลับ **ไม่เสีย state เดิม** | dashboard drill · detail modal · **★ Route add-order modal** · **★★★★ trace genealogy node click → deep link + back** |
| **G4 Customer search dropdown** | quotation/po/so-create | ค้นเบอร์/บริษัท/ผู้ติดต่อ · Disabled/Blacklist hard block |
| **G5 Permission-per-action** | ทุกปุ่มระบุ capability | `permission-matrix.md` · **★ แสดงรหัสเป็น suffix ตาม G9** · **★★★★★★ r16: รหัส = ระดับต่ำสุด (min level) ของโมเดลสะสม (§1a); ผู้ใช้ต้องมีระดับ ≥ รหัสจึงกดได้** · **★★★★ ดู Audit log = (Ad)** · **★ Invoice void = (D) · override = (U) (r13)** |
| **★ G6 Comment + change-history** | ทุก object ธุรกรรมมี **ช่องหมายเหตุเดียว แก้ในที่ + เก็บประวัติครบ** | **12 object** (Shipment→**Route**) · `comment-convention.md` · **★ comment DN บังคับ · ★★★★ comment edit = audited event · Invoice comment = ภายใน ไม่พิมพ์** |
| **★ G7 Search-in-dropdown** | RM/FG/Lot/component + Return RM-in-lot | ค้นชื่อ+รหัส · **★ Route driver ค้นชื่อ/username** · **★★★★ trace topic master ค้น ชื่อ+รหัส** |
| **★ G8 Document number on SAVE** | create ทุกใบ: ไม่โชว์เลขล่วงหน้า → ออกเลข gapless ตอนบันทึก + popup ยืนยัน | `numbering-on-save.md` (NS1–NS7) · **★ Route (RT) + ทุก DN (NS7)** · **★ Invoice (r13)** · **★ Return `RET-…` (r15)** |
| **★ G9 Permission-code suffix** | ทุก actionable control ที่ permission-gate แสดงรหัสสิทธิ์เป็น suffix | รหัส 6 ตัว: R/C/U/D/A/Ad · **★★★★★★ r16: รหัส = min level ของ cumulative ladder R<C<U<D<A<Admin (§1a)** · **★ แก้สถานะ DN = (A)** · **★★★★ ดู Audit log = (Ad)** · **★ Invoice (r13)** · authority = `permission-matrix.md` §3 |

> NFR ระดับระบบ รวมที่ `non-functional.md` (**★★★★ AU1–AU6 · ★ §15 Deferred-controls register (DEF-1 invoice · ★★★★★★ DEF-2 RBAC SoD)**).
> **★★★★★★ r14 — Dashboard visibility = Read permission ต่อแผนก; Dashboard = landing หลัง login.**
> **★★★★★★ r16 — RBAC = cumulative per-module level (authoritative `permission-matrix.md` §1a); role editor = per-module single-level selector (`settings.md` §4).**

---

## 4. Confirmations ที่ปอนด์สั่งให้ยืนยัน (RESOLVED)

| หัวข้อ | คำตัดสิน | เอกสาร |
|---|---|---|
| **Convert-to-PO** | QT = **Confirmed ทันที** + loose link | `quotation.md` · `po.md` · oem-flow |
| **SO (ก)/(ข)** | จอง FG→พร้อมส่ง→ตัด FIFO→DN/Invoice · ผลิตเก็บสต็อก auto-PR | `so.md` · `shipping.md` |
| **★ Comment convention** | **12 object** มีช่อง comment เดียว | `comment-convention.md` |
| **★ Customer Edit / follow-up flag / financial summary** | Edit ครบทุกฟิลด์ · flag ⚑ แยก enum · financial roll-up | `customer.md` · entity-status-map §1.1 |
| **★ Delete Sale → customers unassigned** | ลบ Sale → ลูกค้า unassigned อัตโนมัติ | `settings.md` US-SET-02 · `customer.md` §4.3 |
| **★★ Stock/Supplier/BOM/Settings/Production/Supply Planning/QC+GR reviews** | (settled รอบก่อน) | ราย module |
| **★★ Return RM selector + G8 number-on-save + G9 permission-code** | (settled รอบก่อน) | `return.md` · `numbering-on-save.md` · `permission-matrix.md` |
| **★★★ NEW — Customer address + receiver-contact (2026-07-30)** | ที่อยู่ registered + shipping แยก · ผู้ติดต่อ flag "เป็นคนรับสินค้า" | `customer.md` §3/§9b · `shipping.md` §5 · `delivery-note.md` §5/§7 |
| **★★★ NEW — Shipping = Route (`RT-…`) rewrite (2026-07-30)** | รอบ = Route; RT แทน SHP (Q1=A) | `shipping.md` · entity-status-map §1.9 · `numbering-on-save.md` |
| **★★★ NEW — DN module (2026-07-30)** | DN 6 สถานะ; สร้างตรงไม่ได้; print DN/Invoice; แก้สถานะ DN=A | `delivery-note.md` · `po.md` §4b · `so.md` §4 · entity-status-map §1.10 · `permission-matrix.md` |
| **★★★★ NEW — Traceability trace-surface + Audit-log review (r12)** | trace ครอบทุก object + selector · Audit = non-read+login, Admin-only (Ad) | `traceability.md` §3/§3.1/§5b · `settings.md` §4d/US-SET-05 · `non-functional.md` AU1/AU6 · `permission-matrix.md` |
| **★★★★★ NEW — Invoice review (r13)** | search PO/SO/INV · one-active · create-no-status-lock · per-invoice override · void · DN-unify | `invoice.md` · `po.md` §4c · `so.md` §5 · `customer.md` · `delivery-note.md` · `numbering-on-save.md` · `permission-matrix.md` §3/§3.1 · `non-functional.md` D-F3/J3 |
| **★★★★★★ NEW — Home removed → Dashboard landing (r14)** | ตัดโมดูล Home ทิ้ง; login → Dashboard landing; per-department Read-scoped | `dashboard.md` · `platform.md` · README · `home.md`/`home.html` = tombstone |
| **★ NEW — Reconciliation pass (C1/M1/M2/M3+m2/m4) (r15)** | C1 flow DN-mirror · M1 Return `RET-…` · M2 stray-tag · M3 scope banner · m2 · m4 | `flows/*` · `numbering-on-save.md` · `non-functional.md` · `return.md` · `stock.md` · `traceability.md` · `invoice.md` · `customer.md` · `permission-matrix.md` · `po-output-quality-audit.md` |
| **★★★★★★ NEW — CUMULATIVE-level RBAC (r16, 2026-07-31)** | **โมเดลสิทธิ์ = ลำดับชั้นสะสม `R < C < U < D < A < Admin`; role = 1 ระดับ/module (ระดับสูงรวม action ที่ต่ำกว่า, C < U); role editor = per-module single-level selector + explainer สะสม (เลิก checkbox แยก action); รหัส G9 = min level; effective level = max ของ role Active; Admin-only (VAT/Company/Audit/undelete/force-override/role-matrix/จัดการ user) = ระดับ Admin. flag awkward-case A⊇D · U⊇C = non-blocking (DEF-2).** | `permission-matrix.md` §1a/§3/§3.1/§4 (authoritative) · `settings.md` §4/§4b/US-SET-01/§6/§9/§11 · `non-functional.md` A3/A4/A8/AU1/§9/§12/§15 DEF-2 · README |

**หมายเหตุ:** Quotation ทำ material check แต่ **ไม่ auto-open PR**.

---

## 5. ★ Source-of-Truth Statement (ประกาศชัด)
1. **`modules/*.md` = AUTHORITATIVE spec ปัจจุบันของทุก module + NFR + Deletion Policy + Traceability** — ชุดเดียวที่ BA/QA/TL ยึด. **★★★★★★ r14: `home.md` ถูกตัดออกจากชุด spec (tombstone) — landing = `dashboard.md`.**
2. แต่ละ .md = **spec เต็ม**. governance authoritative: `non-functional.md` · `deletion-policy.md` · `traceability.md` · `comment-convention.md` (G6) · `numbering-on-save.md` (G8) · **`permission-matrix.md` (RBAC + G9 — ★★★★★★ §1a = cumulative per-module level model, authoritative)**.
3. **เอกสารเก่า** = historical reference → Hub ⑥ Archive.
4. **เอกสารหลักการเชิงลึก** (`entity-status-map` §1.9/§1.10, `status-journeys`, `stock-reservation`, scope D1–D18, ...) = authoritative reference → Hub ③. **module package wins ถ้าขัดกัน.** **★ r15:** scope doc reconciliation banner.
5. **RTM/Traceability คงครบ. ★★★★ r12: Trace + Audit surface = authoritative ที่ `traceability.md` + `settings.md` §4d/US-SET-05 + `non-functional.md` AU1/AU6.** **★ r15: Return topic source = `RET-…`.**
6. **★★★★★ r13: Invoice model = authoritative ที่ `invoice.md`** — one-active · per-invoice override · create-no-status-lock (§7 · deferred §15 DEF-1) · DN-unify. **billing rail = สะท้อนใบ active** · **financial summary = ใบ active/ไม่รวม void** (void-edge = 0 = INTENDED, m2).
7. **★★★★★★ r14: Navigation/landing = authoritative ที่ `platform.md` (login → Dashboard) + `dashboard.md`.**
8. **★★★★★★ r16: RBAC authorization model = authoritative ที่ `permission-matrix.md` §1a — CUMULATIVE per-module level (total order `R < C < U < D < A < Admin`); role ได้ 1 ระดับ/module (ระดับสูงรวม action ต่ำกว่า, C<U); รหัส G9 §3 = min level; effective level = max ของ role Active; Admin-only = ระดับ Admin.** role editor UI = authoritative ที่ `settings.md` §4/US-SET-01 (per-module single-level selector + explainer). NFR reconcile ที่ `non-functional.md` A3 (D14 = generic RUCDAA → total order สะสม; ไม่ใช่ 6 bit อิสระ). **module package wins.** awkward-case (A⊇D · U⊇C) = deferred DEF-2, ปอนด์ยืนยัน ladder เข้มแล้ว.
9. **Navigation IA:** ① Functional · ② Non-Functional · ③ Reference · ④ Architecture · ⑤ Mockups · ⑥ Archive · **Reviews/Audit** (`po-output-quality-audit.html`).
10. **★ HTML review view = 1:1 ต่อทุก .md ที่ยังเป็น spec** (render จาก .md ผ่าน `_render.js`). **★★★★★★ r16: `permission-matrix.html` + `settings.html` render จาก .md ที่อัปเดต — ไม่มี view ใหม่.** **★★★★★★ r14: ตัด `home.html`.** **★★★★ r12: `traceability.html` + `settings.html`.** **★★★★★ r13: `invoice.html`.** **★ r15: `po-output-quality-audit.html`.**

---

## 6. ★ Map: เอกสารเก่า → ครอบคลุมโดย module ใด
| เอกสารเก่า | ครอบคลุมโดย module (authoritative) | หมายเหตุ |
|---|---|---|
| functional-spec `home.html` (US-HOME-01..03) | **— (โมดูล Home ตัดทิ้ง)** · landing = `dashboard.md` | ★★★★★★ r14: Home REMOVED |
| functional-spec `shipping.html` (Shipment+DN รวม) | `shipping.md` (Route) + **`delivery-note.md` (DN แยก)** | ★ split เป็น 2 module |
| functional-spec `invoice.html` (US-INV-01..04) | **`invoice.md` (★★★★★ +r13)** | absorbed เต็ม |
| functional-spec `traceability.html` (US-TRC-01..03) | **`traceability.md` (★★★★ +r12)** | absorbed เต็ม |
| **RBAC "generic RUCDAA 6 bit อิสระต่อ module" (D14 เดิม · rbac-deletion · settings checkbox grid)** | **`permission-matrix.md` §1a (★★★★★★ cumulative per-module level, total order R<C<U<D<A<Admin) + `settings.md` §4 (single-level selector)** | ★★★★★★ r16 reconcile — D14 คงเป็นแกน แต่นิยาม = total order สะสม (ไม่ใช่ 6 bit อิสระ); role editor เลิก checkbox แยก action |
| functional-spec BA pages อื่น | โมดูลชื่อเดียวกันใน `modules/` | absorbed เต็ม |
| `SHP-…` numbering (glossary/ADR-008) | **`RT-…` (numbering-on-save + non-functional D-F5)** | ★ Q1=A DECIDED (RT แทน SHP) |
| **Return document token "RT" (return/stock/trace เดิม)** | **`RET-{YYYYMM}-{NNNNNN}`** | ★ r15 M1 |
| **scope doc — QT lifecycle (Sent/Agreed) + SHP** | **`quotation.md` §4 + Route `RT-…`** | ★ r15 M3 |

---

## 7. Changelog — supersede / แก้ / ปอนด์เคาะ
| เอกสาร/รายการ | สถานะ | เหตุผล |
|---|---|---|
| (รายการรอบก่อน) | **settled** | commit history |
| **★★★ NEW — Customer address + receiver-contact (Module A)** | **DECIDED 2026-07-30 · settled** | `customer.md` §1/§2/§2b/§3/§8/§9/§9b/§11/§12. |
| **★★★ NEW — Shipping → Route (`RT-…`) rewrite (Module B)** | **DECIDED 2026-07-30 · settled (Q1=A)** | `shipping.md` · entity-status-map §1.9 · `numbering-on-save.md`. |
| **★★★ NEW — Delivery Note (DN) module (Module C)** | **DECIDED 2026-07-30 · settled** | `delivery-note.md` · `po.md` §4b · `so.md` §4 · entity-status-map §1.10 · `permission-matrix.md`. |
| **★ Doc-completeness — delivery-note view** | **DONE** | `delivery-note.html` + map + ลิงก์. |
| **★★★★ NEW — Traceability + Audit-log review (r12)** | **DECIDED 2026-07-30 · settled** | `traceability.md` · `settings.md` §4d/US-SET-05 · `non-functional.md` · `permission-matrix.md`. |
| **★★★★★ NEW — Invoice review (r13)** | **DECIDED 2026-07-30 · settled** | `invoice.md` · `po.md` §4c · `so.md` §5 · `customer.md` · `delivery-note.md` · `numbering-on-save.md` · `permission-matrix.md`. |
| **★★★★★★ NEW — Home removed → Dashboard landing (r14)** | **DECIDED 2026-07-30 · settled** | `dashboard.md` · `platform.md` · README. |
| **★ NEW — Reconciliation pass (C1/M1/M2/M3 + m2/m4) (r15)** | **DONE (requirement docs เท่านั้น) · settled** | `flows/*` · `numbering-on-save.md` · `non-functional.md` · `return.md` · `stock.md` · `traceability.md` · `invoice.md` · `customer.md` · `permission-matrix.md` · `scope-…` · `po-output-quality-audit.md`. |
| **★★★★★★ NEW — CUMULATIVE-level RBAC (r16, 2026-07-31)** | **DECIDED 2026-07-31 (ปอนด์) · settled (requirement docs เท่านั้น)** | **โมเดลสิทธิ์ = ลำดับชั้นสะสม `R < C < U < D < A < Admin`** (total order, ไม่ใช่ 6 bit อิสระ). role = **1 ระดับ/module**, ระดับสูงรวม action ที่ต่ำกว่า (⚠️ C < U). role editor = **per-module single-level selector (radio/dropdown) + explainer สะสม + สรุป effective actions** (เลิก checkbox แยก action). รหัส **G9 = min level** (ปุ่ม (X) ต้องระดับ ≥ X). **effective level = max** ของ role Active. **Admin-only** (VAT/Company/Audit/undelete/force-override/role-matrix/จัดการ user) = ระดับ Admin. §3/§3.1 permission-matrix **ไม่เปลี่ยน mapping** — เปลี่ยน semantics เป็น min level. อัปเดต `permission-matrix.md` §1(title)/§1a(ใหม่)/§1b/§3/§3.1/§4/§5 · `settings.md` §1/§2/§3/§4(rewrite)/§4b/§4d/§5 US-SET-01/§6/§7/§9/§11 · `non-functional.md` A3(rewrite)/A4/A8/AU1/§9/§12/§15 DEF-2 · README. **★ awkward-case flag (A⊇D · U⊇C) = non-blocking (DEF-2)** — ปอนด์ยืนยัน ladder เข้มแล้ว. **UX/UI change list → `settings.html` role editor (ดู §8, K).** ไม่แก้ mockup เอง (คนละมือกับ UX agent). |
| **★ Doc-completeness — RBAC cumulative (r16, 2026-07-31)** | **DONE (docs เท่านั้น · ไม่มี view ใหม่)** | `permission-matrix.html` + `settings.html` มีอยู่ + map + ลิงก์ครบ (render จาก .md r16). |

---

## 8. งานส่งต่อ UX/UI (สรุป)

**punch-list เดิม + delta รอบก่อน:** (คงตามรอบก่อน · รวม A–D Customer/Route/DN, E–F Traceability/Audit, G Invoice, H–I Home/Dashboard, J r15 rename)

> **★★★★★★ (r16, 2026-07-31) — CUMULATIVE-level RBAC → role editor redesign (`mockups/settings.html` · แท็บ Role & สิทธิ์):**
>
> **(K) Role-permission editor — จาก "checkbox grid ราย action" → "per-module single-level selector":**
> - **(K-1)** เปลี่ยน matrix ต่อ module จาก **6 checkbox (R/U/C/D/A/Admin ติ๊กอิสระ)** → **ตัวเลือกระดับเดียว (radio group หรือ dropdown): ไม่มีสิทธิ์ · R · C · U · D · A · Admin** (เรียงตามลำดับสะสม **R < C < U < D < A < Admin** — ⚠️ **C อยู่ก่อน U**).
> - **(K-2) Inline explainer (cumulative):** ข้างตัวเลือกแต่ละ module แสดงว่าเลือกระดับใด = ทำ action อะไรได้บ้าง **แบบสะสม** (เช่น เลือก **U** → chip/ข้อความ "ทำได้: ดู (R) · สร้าง (C) · แก้ (U)"; เลือก **A** → "…+ ลบ (D) · อนุมัติ (A)"). อาจใช้ legend รวม 1 จุด + preview per row.
> - **(K-3) แสดง effective actions** ของระดับที่เลือก (สรุปสั้น) — ให้ admin เห็นผลทันทีก่อนบันทึก.
> - **(K-4)** ป้าย/หัวคอลัมน์เดิม "6 ช่องสิทธิ์" → "ระดับสิทธิ์ (1 ระดับต่อ module)"; ลบ hint ที่สื่อว่า "ติ๊กหลายช่องได้".
> - **(K-5) Admin-only note:** module พิเศษ (VAT/Company/Audit-log = ในทางปฏิบัติเป็นส่วนของ Settings) — สื่อชัดว่าเข้าถึง = ต้องระดับ **Admin**.
> - **(K-6)** คง role search/filter (Active/Disabled/Deleted) · role's user list + ถอด user · Disable/Soft-delete/Restore **ตามเดิม** (ไม่เปลี่ยน).
> - ยึด `settings.md` §4/US-SET-01 · `permission-matrix.md` §1a.
> - **หมายเหตุ collision:** PO รอบนี้แก้ **requirement docs เท่านั้น** (`permission-matrix.md`/`settings.md`/`non-functional.md`/README); mockup `settings.html` role editor ส่งต่อ **UX/UI agent** (เข้า GATE 1 เฉพาะ role editor). UX agent อีกมือทำ return/stock/trace mockups — **ไม่ชนกัน** (คนละไฟล์/คนละส่วน).

---

## 9. Open questions
**ไม่มี open question ที่บล็อก.** (Q1=A DECIDED · r12/r13/r14/r15/r16 = ไม่มี open question ที่บล็อก.)

> **★★★★★★ r16 (Cumulative RBAC) — 1 รายการ non-blocking ให้ปอนด์ยืนยันที่ Gate (ไม่ค้างงาน):**
> - **awkward-case ของ total order (DEF-2):** ลำดับเข้ม `R<C<U<D<A<Admin` ทำให้ **A รวม D เสมอ** (ไม่มี "อนุมัติได้แต่ห้ามลบ/void") และ **U รวม C เสมอ** (ไม่มี "แก้ได้แต่ห้ามสร้างใหม่" เช่น Stock.U ↔ Stock.C). PO implement ตาม ladder ที่ปอนด์สั่ง. **ยืนยันหรือไม่** ว่าเฟสนี้รับได้ (ถ้าต้องการ SoD ละเอียด → เพิ่ม exception flag นอก total order รอบถัดไป, register DEF-2). ดู `permission-matrix.md` §1a/§4 · `non-functional.md` §12/§15 DEF-2.

> **★ r15 (Reconciliation) — 2 รายการ non-blocking:** Q-INV1 (m1) default (A) explicit cancel-then-create · m4 deferral DEF-1.
> **★★★★★★ r14 · ★ Q-INV1 (r13) · PO reasonable decisions รอบก่อน:** (settled — commit history).
