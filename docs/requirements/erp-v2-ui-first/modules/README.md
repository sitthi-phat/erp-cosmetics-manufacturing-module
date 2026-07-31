# Requirement Package (Per-Module) — ESSENCE Hub System

slug: `erp-v2-ui-first` · เขียนโดย PO · 2026-07-30 · **CANONICAL & COMPLETE SINGLE SOURCE OF TRUTH** สำหรับ BA / QA / Tech-Lead
สถานะ: consolidation ของ requirement ที่กระจัดกระจาย → per-module ที่โครงสร้างสม่ำเสมอ **ครบทุก module + NFR + Deletion Policy** · reconciled กับ D1–D18 + fold คำสั่งใหม่ของปอนด์ (2026-07-29 · **+ Customer/Route/DN 3-module review 2026-07-30 · + Traceability trace-surface + Audit-log review r12 2026-07-30 · + Invoice review r13 2026-07-30 · + Home removed → Dashboard landing r14 2026-07-30 · + Reconciliation pass C1/M1/M2/M3+m2/m4 r15 2026-07-31**)

## สรุปภาษาไทย
เอกสารชุดนี้คือ **แหล่งความจริงล่าสุดแบบราย module ที่ครบถ้วน (single source of truth)** ของทั้งระบบ ESSENCE Hub. **★ NEW — Reconciliation pass (r15, ปอนด์ 2026-07-31):** แก้ audit findings **C1** (flow 2 ใบ → DN-mirror: "ส่งถึง"→"ส่งสำเร็จ", ถอด In Delivery/Delivered/กำลังจัดส่ง) · **M1** (ใบคืนได้ prefix เฉพาะ **`RET-{YYYYMM}-{NNNNNN}`** แยกจาก Route `RT-…`; return ledger/trace source RT→RET) · **M2** (ลบ stray tag 4 ไฟล์) · **M3** (scope doc ใส่ reconciliation banner: QT lifecycle→`quotation.md`, SHP→RT) · **m2** (invoice financial-summary void edge = INTENDED) · **m4** (Deferred-controls register `non-functional.md` §15). **★★★★★★ Home removed → Dashboard landing (r14, คงเดิม):** โมดูล Home ถูกตัดทิ้ง; หน้าแรกหลัง login = Dashboard (`platform.md`→`dashboard.md`); งานประจำวันรายแผนกดูจาก Dashboard tile ตามสิทธิ์ Read + Notification bell. **★★★★★ Invoice review (r13):** ค้น PO/SO/INV · 1 PO/SO หลายใบ active ทีละใบ · สร้างเมื่อยังไม่มีใบ (เฟสนี้ไม่ล็อกสถานะ) · G8+print-ready + per-invoice override · void · DN-unify. **★★★★ Traceability + Audit (r12):** trace entity/topic selector + sample-per-object; Audit = non-read+login, Admin-only. **★★★ 3 modules (2026-07-30):** Customer address+receiver · Shipping = Route `RT-…` · DN 6 สถานะแยกโมดูล. **คงกฎเดิม:** 2-tier Route/DN · G8 number-on-save · G6 comment · G9 permission-code · entity-status-map. **★ ทุกไฟล์ `.md` มี HTML review view + ลิงก์ในหน้า index (รวม audit report r15).**

---

## 1. โครงไฟล์ (file tree — ครบทั้งชุด)

```
docs/requirements/erp-v2-ui-first/modules/
  README.md                  ← ไฟล์นี้ (index + D-rule spine + changelog + source-of-truth + old→new map + global rules)
  permission-matrix.md       ← capability → module → action/button → ★ Suffix (G9) · ★ แก้สถานะ DN = A · ★ Audit view = Admin (Ad) · ★ Invoice สร้าง=C/void=D/override=U/print=R (r13)
  comment-convention.md      ← ★ กติกากลาง comment + change-history (CC1–CC7) · 12 object (Shipment→Route)
  numbering-on-save.md        ← ★ กติกากลาง G8 = เลขเอกสารออกตอนบันทึก (NS1–NS7) · DN+Route (RT) · ★ Invoice one-active (void=เลขเดิม/ใบใหม่=เลขใหม่, r13) · ★ Return RET-… (r15)

  # System-wide / Governance (Non-Functional bucket ใน Hub)
  non-functional.md          ← NFR รวม (★ +Route/DN r11 · RT numbering · DN status-edit A · ★★★★ +Audit non-read+login r12 = AU1/AU6 · D-F3 VAT invoice-date + J3 overdue-by-DN · ★ +Return RET numbering + §15 Deferred-controls register r15)
  deletion-policy.md         ← soft-delete/void baseline + entity (INV = void-only §2.8)
  traceability.md            ← trace/audit governance (★ +Route/DN entity + DN status-edit A audit · ★★★★ r12: entity/topic selector §3.1 + sample-per-object §5b + non-read+login §3/§4/§9 · ★ Return topic source RT→RET r15)

  # Platform & Navigation
  platform.md                ← ★ login → Dashboard landing (r14) · identity/noti/global search/session/guard
  dashboard.md               ← ★★ LANDING หลัง login (r14) · 7 แผนก/29 tile · per-department Read-scoped day-to-day · date-range รายแผนก + date-type
  # home.md = ★ REMOVED (ตัดทิ้ง 2026-07-30) — tombstone เท่านั้น (ไม่ใช่ spec · ไม่มี view/link · ควร git rm)

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
  settings.md                ← RUCDAA + Users + VAT + Company + ★★★★ Audit-log tab (non-read+login, Admin-only, §4d/US-SET-05)

  flows/  oem-flow.md (★ DN-mirror r15) · ownbrand-flow.md (★ DN-mirror r15)

  # Reviews / Audit (ไม่ใช่ spec module — บันทึกการตรวจ)
  ../po-output-quality-audit.md  ← ★ independent Tech-Lead audit (BEFORE) + After reconciliation resolutions (r15) · view = functional-spec/modules/po-output-quality-audit.html
```

HTML review view: `docs/design/erp-v2-ui-first/functional-spec/modules/index.html` · Hub `functional-spec/index.html`.
**★ Doc-completeness: ทุกไฟล์ `.md` (spec ที่ยังใช้งาน) มี HTML review view ครบ 1:1 + ลิงก์ในหน้า Modules index** (render จาก .md ผ่าน `_render.js`). **★★★★★★ r14 (Home removed):** ตัด `home.md` ออกจากชุด spec (เหลือเป็น tombstone REMOVED — ไม่ถูกลิงก์/ไม่มี view ในสารบัญ); ลบ entry `home.html` ออกจาก `_render.js` map + unlink จาก `modules/index.html` + Document Hub `functional-spec/index.html`; `dashboard.html`/`platform.html` ใช้ view เดิม render จาก `.md` ที่อัปเดต r14. **★ r15 (Reconciliation): เพิ่ม view `po-output-quality-audit.html` (audit report) + map ใน `_render.js` + ลิงก์ใน `modules/index.html` (Reviews/Audit).** **★★★★★ r13 (Invoice):** ใช้ view เดิม **`invoice.html`**. **★★★★ r12:** `traceability.html` + `settings.html`. **★ Customer/Route/DN:** `delivery-note.html` (view + map + link ครบ).

---

## 2. D-Rule Spine (คงเป็นแกน — พร้อม DELTA)
D1–D18 ยังเป็นกฎแกน (`scope-oem-ownbrand-supply-planning.md` §1). จุดอัปเดตหลัก (คงตามรอบก่อน): **D8 v2** (สั่งผลิต batch-count) · **credit 60** · **D18 reseat** (QT Confirmed) · **D11 v2** (BOM/FG+RM code user-entered lock) · **D13 reinforce** (พร้อมส่ง QC-gated) · **D9/D10** (margin sim) · **D12/D16** (QC-gated stock-in). **★★★ 2026-07-30:** Route/DN rewrite ไม่แตะ D-rule แต่ implement D1/D16 (DN อ้าง PO/SO · FG FIFO per-Batch ตอน dispatch = DN "ส่งสำเร็จ"). **★★★★ r12 Trace/Audit:** ไม่แตะ D-rule — implement D14 + D15 + GMP traceability. **★★★★★ r13 Invoice:** ไม่แตะ D-rule — implement D10 (invoice อ้าง SO + cost snapshot) + credit-60/override + VAT-by-invoice-date (D-F3). **★★★★★★ r14 Home removed:** ไม่แตะ D-rule — navigation/landing change เท่านั้น. **★ r15 Reconciliation:** ไม่แตะ D-rule — เป็นการ **แก้ความไม่สอดคล้อง/เลข/สถานะ** ให้ตรง module package (C1 flow DN-mirror · M1 Return `RET-…` · M2 stray-tag · M3 scope doc annotate เท่านั้น). **★ หมายเหตุ reconcile:** เดิม "invoice ออกได้ตั้งแต่ PO Confirmed" → เฟสนี้ปอนด์ผ่อนเป็น **ไม่ล็อกสถานะตอนสร้าง** (deferred, `invoice.md` §7 · register `non-functional.md` §15 DEF-1).

---

## 3. GLOBAL Rules (บังคับทุก module)

| # | กติกา | รายละเอียด |
|---|---|---|
| **G1 Pagination** | list/history ทุกอัน **20 แถว/หน้า + pagination** | ทุก list + **★ Route list · DN list · Invoice list · ★★★★ ตาราง field-audit (trace + Settings audit tab)** · **★ Dashboard drill-down** |
| **G2 Date-range search** | ค้น **เลขเอกสาร** หรือ **ช่วงวันที่** | quotation/PO/SO/GR/PR/invoice list + production queue + audit + **★ Route/DN list** + **★ Invoice search (ชื่อลูกค้า/ผู้ติดต่อ/เลข PO-SO-INV/ช่วงวันสร้าง PO-SO-INV, r13)** + **★★★★ trace.html (id/key + ช่วงวัน + dropdown ชนิดวัน/date-type) · Settings audit tab** + **★★★★★★ Dashboard date-range รายแผนก + date-type (r14)** |
| **G3 Drill + back คงสถานะ** | กลับ **ไม่เสีย state เดิม** | dashboard drill · detail modal · **★ Route add-order modal + order detail modal** · **★★★★ trace genealogy node click → deep link + back** |
| **G4 Customer search dropdown** | quotation/po/so-create | ค้นเบอร์/บริษัท/ผู้ติดต่อ · Disabled/Blacklist hard block |
| **G5 Permission-per-action** | ทุกปุ่มระบุ capability | `permission-matrix.md` · **★ แสดงรหัสเป็น suffix ตาม G9** · **★★★★ ดู Audit log = (Ad)** · **★ Invoice void = (D) · override = (U) (r13)** |
| **★ G6 Comment + change-history** | ทุก object ธุรกรรมมี **ช่องหมายเหตุเดียว แก้ในที่ + เก็บประวัติครบ** | **12 object** (Shipment→**Route**) · `comment-convention.md` · **★ comment DN บังคับตอน status-update · ★★★★ comment edit = audited event · Invoice comment = หมายเหตุภายใน ไม่พิมพ์ลงใบ** |
| **★ G7 Search-in-dropdown** | RM/FG/Lot/component + Return RM-in-lot | ค้นชื่อ+รหัส · **★ Route driver ค้นชื่อ/username** · **★★★★ trace topic ที่เป็น master ค้น ชื่อ+รหัส** |
| **★ G8 Document number on SAVE** | create ทุกใบ: ไม่โชว์เลขล่วงหน้า → ออกเลข gapless ตอนบันทึก + popup ยืนยัน · ร่างที่ไม่บันทึกไม่กินเลข | `numbering-on-save.md` (NS1–NS7) · **★ Route (RT) + ทุก DN ออกพร้อมกัน (NS7)** · **★ Invoice ออกตอน "สร้างใบแจ้งหนี้" + print-ready; void=เลขเดิม, ใบใหม่หลัง void=เลขใหม่ (r13)** · **★ Return `RET-…` ออกตอนบันทึกใบคืน (r15)** |
| **★ G9 Permission-code suffix** | ทุก actionable control ที่ permission-gate แสดงรหัสสิทธิ์เป็น suffix | รหัส 6 ตัว: R/C/U/D/A/Ad · **★ แก้สถานะ DN = (A)** · **★★★★ ดู Audit log = (Ad)** · **★ Invoice: สร้าง=(C)/void=(D)/override=(U)/print=(R) (r13)** · authority = `permission-matrix.md` §3 |

> NFR ระดับระบบ รวมที่ `non-functional.md` (**★★★★ AU1–AU6 = audit/trace NFR · ★ §15 Deferred-controls register r15**).
> **★★★★★★ r14 — Dashboard visibility = Read permission ต่อแผนก (ล้วน ๆ ไม่ผูก role); Dashboard = landing หลัง login** (`dashboard.md`/`platform.md`).

---

## 4. Confirmations ที่ปอนด์สั่งให้ยืนยัน (RESOLVED)

| หัวข้อ | คำตัดสิน | เอกสาร |
|---|---|---|
| **Convert-to-PO** | QT = **Confirmed ทันที** + loose link | `quotation.md` · `po.md` · oem-flow |
| **SO (ก)/(ข)** | จอง FG→พร้อมส่ง→ตัด FIFO→DN/Invoice · ผลิตเก็บสต็อก auto-PR | `so.md` · `shipping.md` |
| **★ Comment convention** | **12 object** มีช่อง comment เดียว แก้ในที่ + เก็บประวัติ | `comment-convention.md` |
| **★ Customer Edit / follow-up flag / financial summary** | Edit ครบทุกฟิลด์ · flag ⚑ แยก enum · financial roll-up | `customer.md` · entity-status-map §1.1 |
| **★ Delete Sale → customers unassigned** | ลบ Sale → ลูกค้า unassigned อัตโนมัติ | `settings.md` US-SET-02 · `customer.md` §4.3 |
| **★★ Stock/Supplier/BOM/Settings/Production/Supply Planning/QC+GR reviews** | (settled รอบก่อน — commit history) | ราย module |
| **★★ Return RM selector + G8 number-on-save + G9 permission-code** | (settled รอบก่อน) | `return.md` · `numbering-on-save.md` · `permission-matrix.md` |
| **★★★ NEW — Customer address + receiver-contact (2026-07-30)** | ที่อยู่ registered + shipping แยกกัน · ผู้ติดต่อ flag "เป็นคนรับสินค้า" → ชื่อ+เบอร์บังคับ | `customer.md` §3/§9b · `shipping.md` §5 · `delivery-note.md` §5/§7 |
| **★★★ NEW — Shipping = Route (`RT-…`) rewrite (2026-07-30)** | รอบ = Route; RT แทน SHP (Q1=A) | `shipping.md` · entity-status-map §1.9 · `numbering-on-save.md` |
| **★★★ NEW — DN module (2026-07-30)** | DN 6 สถานะ; สร้างตรงไม่ได้; print DN/Invoice; แก้สถานะ DN=A; PO/SO status=สะท้อน DN | `delivery-note.md` · `po.md` §4b · `so.md` §4 · entity-status-map §1.10 · `permission-matrix.md` |
| **★★★★ NEW — Traceability trace-surface + Audit-log review (r12, 2026-07-30)** | trace ครอบทุก object + entity/topic selector + id/key + date-type + sample-per-object · Audit = non-read+login, Admin-only (Ad) | `traceability.md` §3/§3.1/§5b · `settings.md` §4d/US-SET-05 · `non-functional.md` AU1/AU6 · `permission-matrix.md` |
| **★★★★★ NEW — Invoice review (r13, 2026-07-30)** | **(1) Search** PO/SO/INV = ชื่อลูกค้า·ผู้ติดต่อ·เลข PO/SO/INV·ช่วงวันสร้าง · **(2) 1 PO/SO หลายใบ, active ทีละใบ** · **(3) สร้างเมื่อยังไม่มีใบ; เฟสนี้ไม่ล็อกสถานะ** · **(4) สร้างใบ → G8+print-ready; pull ข้อมูลลูกค้า → per-invoice override** · **(5) void ได้** · **(6) DN-unify** | `invoice.md` · `po.md` §4c · `so.md` §5 · `customer.md` §3/§7 · `delivery-note.md` §5 · `numbering-on-save.md` §4/§5 · `permission-matrix.md` §3/§3.1(r13) · `non-functional.md` D-F3/J3 |
| **★★★★★★ NEW — Home removed → Dashboard landing (r14, 2026-07-30)** | **ตัดโมดูล Home ทิ้งทั้งหมด** ("ตัดทิ้ง ไม่มี module นี้"); **login → Dashboard เป็น landing**; task-inbox ตัดทิ้ง (ไม่ย้าย); **Dashboard = per-department Read-scoped day-to-day + date-range รายแผนก(+date-type)**; เมนูซ้ายตัด "หน้าหลัก" (UX/UI sweep); refresh statuses ให้ตรงโมเดลล่าสุด | `dashboard.md` (US-DSH-00/§1/§3/§6/§10) · `platform.md` (login→Dashboard) · README (ไฟล์นี้) · `home.md`+`home.html` = tombstone REMOVED |
| **★ NEW — Reconciliation pass (C1/M1/M2/M3+m2/m4) (r15, 2026-07-31)** | **C1** flow DN-mirror · **M1** Return `RET-{YYYYMM}-{NNNNNN}` (แยกจาก Route RT) · **M2** ลบ stray tag 4 ไฟล์ · **M3** scope doc reconciliation banner (annotate เท่านั้น) · **m2** invoice void-edge INTENDED · **m4** Deferred-controls register | `flows/oem-flow.md` · `flows/ownbrand-flow.md` · `numbering-on-save.md` · `non-functional.md` · `return.md` · `stock.md` · `traceability.md` · `invoice.md` · `customer.md` · `permission-matrix.md` · `scope-…` · `po-output-quality-audit.md` (After) |

**หมายเหตุ:** Quotation ทำ material check แต่ **ไม่ auto-open PR**.

---

## 5. ★ Source-of-Truth Statement (ประกาศชัด)
1. **`modules/*.md` = AUTHORITATIVE spec ปัจจุบันของทุก module + NFR + Deletion Policy + Traceability** — ชุดเดียวที่ BA/QA/TL ยึด. **★★★★★★ r14: `home.md` ถูกตัดออกจากชุด spec (tombstone REMOVED เท่านั้น) — landing = `dashboard.md`.**
2. แต่ละ .md = **spec เต็ม**. governance authoritative: `non-functional.md` · `deletion-policy.md` · `traceability.md` · `comment-convention.md` (G6) · `numbering-on-save.md` (G8) · `permission-matrix.md` (RBAC+G9).
3. **เอกสารเก่า** = historical reference → Hub ⑥ Archive (**รวม legacy `home.html` US-HOME-01..03 = historical เท่านั้น; โมดูล Home ถูกตัดทิ้ง**).
4. **เอกสารหลักการเชิงลึก** (`entity-status-map` **§1.9/§1.10 = Route/DN r11**, `status-journeys`, `stock-reservation`, scope D1–D18, ...) = authoritative reference → Hub ③. **module package wins ถ้าขัดกัน.** **★ r15:** scope doc มี reconciliation banner ชี้ enumeration ที่ล้าสมัย (QT lifecycle → `quotation.md`; SHP → Route `RT-…`) — annotate เท่านั้น, ไม่แก้ D-rule.
5. **RTM/Traceability คงครบ. ★★★★ r12: Trace + Audit surface = authoritative ที่ `traceability.md` §3/§3.1/§5b (trace) + `settings.md` §4d/US-SET-05 (audit viewer, Admin-only) + `non-functional.md` AU1/AU6 (NFR).** ทั้ง trace.html และ Settings Audit tab อ่าน **audit store เดียวกัน**. **★ r15: Return topic source = `RET-…` (แยกจาก Route `RT-…`).**
6. **★★★★★ r13: Invoice model = authoritative ที่ `invoice.md`** — multiple-invoices-one-active (§4b) · per-invoice customer override (§3) · create-no-status-lock this phase (§7 · deferred `non-functional.md` §15 DEF-1) · DN-unify (§5). **billing rail ของ PO/SO = สะท้อนใบ active** (`po.md` §4c / `so.md` §5); **financial summary ลูกค้า = ใบ active/ไม่รวม void** (`customer.md` §7 · **void-edge = 0 = INTENDED, `invoice.md` §4b m2, r15**). module package wins.
7. **★★★★★★ r14: Navigation/landing = authoritative ที่ `platform.md` (login → Dashboard) + `dashboard.md` (landing รายแผนก · visibility = Read permission ต่อแผนก · date-range contextual + date-type).** ไม่มีโมดูล Home; task-inbox = ตัดทิ้ง; แจ้งงานข้ามแผนก = notification (`platform.md`).
8. **Navigation IA:** ① Functional · ② Non-Functional · ③ Reference · ④ Architecture · ⑤ Mockups · ⑥ Archive · **Reviews/Audit** (`po-output-quality-audit.html`).
9. **★ HTML review view = 1:1 ต่อทุก .md ที่ยังเป็น spec** (render จาก .md ผ่าน `_render.js`). **★★★★★★ r14: ตัด `home.html` ออกจาก `_render.js` map + unlink จาก `modules/index.html` + Document Hub** (home.md/home.html = tombstone, ไม่อยู่ในสารบัญ). **★ delivery-note.md ได้ view + link ครบ.** **★★★★ r12: `traceability.html` + `settings.html`.** **★★★★★ r13: `invoice.html`.** **★ r15: `po-output-quality-audit.html` (audit report) + map + link (Reviews/Audit).**

---

## 6. ★ Map: เอกสารเก่า → ครอบคลุมโดย module ใด
| เอกสารเก่า | ครอบคลุมโดย module (authoritative) | หมายเหตุ |
|---|---|---|
| functional-spec `home.html` (US-HOME-01..03) | **— (โมดูล Home ตัดทิ้ง)** · landing = `dashboard.md` | ★★★★★★ r14: Home REMOVED (ปอนด์) · legacy อยู่ ⑥ Archive (historical) |
| functional-spec `shipping.html` (Shipment+DN รวม) | `shipping.md` (Route) + **`delivery-note.md` (DN แยก)** | ★ split เป็น 2 module (B/C) |
| functional-spec `invoice.html` (US-INV-01..04) | **`invoice.md` (★★★★★ +r13 search/one-active/no-status-lock/per-invoice-override/DN-unify/void)** | absorbed เต็ม · เก่าอยู่ ⑥ Archive |
| functional-spec `traceability.html` (US-TRC-01..03) | **`traceability.md` (★★★★ +r12 selector/sample/non-read+login)** | absorbed เต็ม · เก่าอยู่ ⑥ Archive |
| functional-spec BA pages อื่น | โมดูลชื่อเดียวกันใน `modules/` | absorbed เต็ม · เก่าอยู่ ⑥ Archive |
| `SHP-…` numbering (glossary/ADR-008) | **`RT-…` (numbering-on-save + non-functional D-F5)** | ★ rename — Q1=A DECIDED (RT แทน SHP, drop SHP) · historical note: SHP → RT |
| **Return document token "RT" (return/stock/trace เดิม)** | **`RET-{YYYYMM}-{NNNNNN}` (numbering-on-save §4 + non-functional D-F5)** | ★ r15 reconcile M1 — ใบคืนได้ prefix เฉพาะ (แยกจาก Route `RT-…`); ledger/trace source RT→RET; ไม่มี "RT"=ใบคืน เหลือค้าง |
| **scope doc — QT lifecycle (Sent/Agreed) + SHP** | **`quotation.md` §4 (Draft/Confirmed/Rejected/Cancelled) + Route `RT-…`** | ★ r15 reconcile M3 — annotate banner ใน scope doc (ไม่ re-derive D) |

---

## 7. Changelog — supersede / แก้ / ปอนด์เคาะ
| เอกสาร/รายการ | สถานะ | เหตุผล |
|---|---|---|
| (รายการรอบก่อน — Quotation/Customer/Stock/Supplier/BOM/Settings/Production/Supply Planning/QC+GR/Return/G8/G9/doc-completeness) | **settled** | commit history |
| **★★★ NEW — Customer address + receiver-contact (Module A)** | **DECIDED 2026-07-30 (ปอนด์) · settled** | ที่อยู่ registered+shipping แยก · ผู้ติดต่อ flag "เป็นคนรับสินค้า" (ชื่อ+เบอร์บังคับ §9b). อัปเดต `customer.md` §1/§2/§2b/§3/§8/§9/§9b/§11/§12. |
| **★★★ NEW — Shipping → Route (`RT-…`) rewrite (Module B)** | **DECIDED 2026-07-30 (ปอนด์) · settled (Q1=A LOCKED)** | รอบ = Route (`RT-…`); 4 สถานะ; modal เพิ่ม PO/SO/DN; G8 popup RT+DN. อัปเดต `shipping.md` · entity-status-map §1.9 · `numbering-on-save.md`. RT แทน SHP (drop SHP). |
| **★★★ NEW — Delivery Note (DN) module (Module C)** | **DECIDED 2026-07-30 (ปอนด์) · settled** | DN 6 สถานะ; สร้างตรงไม่ได้; ค้น+filter; print DN/Invoice; comment (G6); แก้สถานะ DN=A; PO/SO status=สะท้อน DN. อัปเดต `delivery-note.md` · `po.md` §4b · `so.md` §4 · entity-status-map §1.2/§1.10 · `permission-matrix.md`. |
| **★ Doc-completeness — delivery-note view (2026-07-30)** | **DONE (docs เท่านั้น)** | สร้าง `delivery-note.html` + map ใน `_render.js` + ลิงก์ใน `modules/index.html`. |
| **★★★★ NEW — Traceability trace-surface + Audit-log review (r12, 2026-07-30)** | **DECIDED 2026-07-30 (ปอนด์) · settled (committed)** | trace entity/topic selector + id/key + date-type + sample-per-object; Audit = non-read+login, Admin-only (Ad). อัปเดต `traceability.md` §3/§3.1/§5b/§4/§9 · `settings.md` §4d/US-SET-05 · `non-functional.md` AU1/AU2/AU6 · `permission-matrix.md`. |
| **★ Doc-completeness — trace/settings views (r12, 2026-07-30)** | **CONFIRMED (docs เท่านั้น · ไม่มี view ใหม่)** | `traceability.html` + `settings.html` มีอยู่ + ลิงก์ครบ. |
| **★★★★★ NEW — Invoice review (r13, 2026-07-30)** | **DECIDED 2026-07-30 (ปอนด์) · settled** | **(1) Search** PO/SO/INV = ชื่อลูกค้า·ผู้ติดต่อ·เลข PO/SO/INV·ช่วงวันสร้าง (§8). **(2) Multiple-invoices-one-active** (§4b). **(3) สร้างเมื่อยังไม่มีใบ; เฟสนี้ไม่ล็อกสถานะ** (deferred §7). **(4) สร้างใบ → G8 + print-ready; pull ข้อมูลลูกค้า → per-invoice override (§3).** **(5) void ได้** (§2.8). **(6) DN-unify** (§5). permission สร้าง=(C)/void=(D)/override=(U)/print=(R). อัปเดต `invoice.md` · `po.md` §4c · `so.md` §5 · `customer.md` · `delivery-note.md` · `numbering-on-save.md` · `permission-matrix.md`. **★ Q-INV1 (non-blocking)** = supersede explicit-cancel (default A) vs auto (B) — §9. |
| **★ Doc-completeness — invoice view (r13, 2026-07-30)** | **CONFIRMED (docs เท่านั้น · ไม่มี view ใหม่)** | `invoice.html` มีอยู่ + map + ลิงก์ครบ (render จาก `invoice.md` r13). |
| **★★★★★★ NEW — Home removed → Dashboard landing (r14, 2026-07-30)** | **DECIDED 2026-07-30 (ปอนด์) · settled** | **(1) ตัดโมดูล Home ทิ้งทั้งหมด** ("ตัดทิ้ง ไม่มี module นี้") — `home.md`/`home.html` = tombstone REMOVED, ตัด entry `home.html` จาก `_render.js` map + unlink จาก `modules/index.html` + Document Hub `functional-spec/index.html` (legacy archive relabel = historical). **(2) หน้าแรกหลัง login = Dashboard** (`platform.md` login → `dashboard.md` landing; US-DSH-00 ใหม่; เมนูซ้ายตัด "หน้าหลัก (Home)"). **(3) task-inbox ตัดทิ้ง (ไม่ย้าย)** — ไม่มีฟีเจอร์ unique ที่ต้องย้าย; งานประจำวัน = Dashboard tile รายแผนก + Notification bell. **(4) Dashboard update:** วัตถุประสงค์ **per-department Read-scoped day-to-day (visibility = Read permission ต่อแผนก, ไม่ผูก role)** + **date-range รายแผนก (contextual) + date-type dropdown** + refresh statuses ตรงโมเดลล่าสุด (DN 6 สถานะ/Route/PO-status-from-DN/QC-gated · ไม่มี SHP/ส่งถึงแล้ว/In Delivery ค้าง). อัปเดต `dashboard.md` (US-DSH-00/§1/§2/§3/§4/§6/§8/§9/§10) · `platform.md` (§2/§4/§5/§6/§7/§9/§10/§11) · README · file-tree/§3 G1-G2/§4/§5/§6/§8. **หมายเหตุ:** enumeration "home" ในรายการหน้าจอที่โชว์สถานะ PO/SO ถูกตัดออกจาก `po.md`/`so.md`/`delivery-note.md`/entity-status-map. |
| **★ Doc-completeness — Home removal (r14, 2026-07-30)** | **DONE (docs เท่านั้น)** | ตัด `home.html` จาก `_render.js` + `modules/index.html` + Document Hub; `dashboard.html`/`platform.html` render จาก `.md` ที่อัปเดต. *(ควร `git rm` `home.md`+`home.html` — คงเป็น tombstone เพราะเครื่องมือ PO ปัจจุบันลบไฟล์ตรงไม่ได้.)* |
| **★ NEW — Reconciliation pass (C1/M1/M2/M3 + m2/m4) (r15, 2026-07-31)** | **DONE (requirement docs เท่านั้น) · settled** | **C1** `flows/oem-flow.md` + `flows/ownbrand-flow.md` refresh เป็น **DN-mirror** ("ส่งถึง"→"ส่งสำเร็จ"; ถอด In Delivery/Delivered/กำลังจัดส่ง เหลือ prohibition note). **M1** ใบคืนได้เลข **`RET-{YYYYMM}-{NNNNNN}`** (gapless ต่อปี/เดือน, void-only) เพิ่ม `numbering-on-save.md` §4 + `non-functional.md` D-F2/D-F5; return ledger/trace source **RT→RET** (`return.md`/`stock.md` §6/`traceability.md`); Route คง `RT-…`. **M2** ลบ stray tag `</content>`/`</invoke>` (customer/invoice/numbering/permission-matrix). **M3** `scope-…` reconciliation banner + inline note (QT lifecycle→`quotation.md`; SHP→RT) — annotate เท่านั้น. **m2** `invoice.md` §4b financial-summary void edge = INTENDED (+ `customer.md` §7). **m4** `non-functional.md` §15 Deferred-controls register (DEF-1). ยึด `po-output-quality-audit.md` (After section). |
| **★ Doc-completeness — audit report view (r15, 2026-07-31)** | **DONE (docs เท่านั้น)** | สร้าง `functional-spec/modules/po-output-quality-audit.html` (data-src → audit .md) + map ใน `_render.js` + ลิงก์ใน `modules/index.html` (Reviews/Audit). |

---

## 8. งานส่งต่อ UX/UI (สรุป)

**punch-list เดิม + delta รอบก่อน:** (คงตามรอบก่อน — commit history · รวม Customer/Route/DN (A–D), Traceability/Audit (E–F), Invoice (G), Home/Dashboard (H–I))

> **★★★★★★ (r14, 2026-07-30) — Home removed → Dashboard landing:**
>
> **(H) Home — ลบทิ้ง (ทุก mockup):**
> - **(H-1)** ลบ mockup `mockups/home.html`.
> - **(H-2)** ลบรายการเมนู **"หน้าหลัก (Home)"** ออกจาก **sidebar ที่ใช้ร่วมทุกหน้า (unified sidebar sweep — ทุก mockup)**.
> - **(H-3)** login → landing = **`dashboard.html`** (ไม่ redirect ไป home อีก); ตรวจทุกลิงก์/ปุ่ม "หน้าหลัก" ให้ชี้ Dashboard หรือถูกตัด.
>
> **(I) Dashboard — refresh + purpose + date-range (`mockups/dashboard.html`):**
> - **(I-1) Refresh statuses ให้ตรงโมเดลล่าสุด:** Shipping tiles = **DN 6 สถานะ + Route (`RT-…`)** (กำลังจัดส่ง=อยู่ระหว่างการเตรียม+อยู่ระหว่างจัดส่ง · ส่งสำเร็จ · เลื่อน/ยกเลิก) · PO/SO delivery status = สะท้อน DN · QC-gated flows — **ห้ามมี SHP / "ส่งถึงแล้ว" / "In Delivery" เดิม**.
> - **(I-2) Purpose per-department:** แต่ละแผนกเห็น **งานประจำวันของตน** ตาม **สิทธิ์ Read ต่อแผนก (visibility = Read permission, ไม่ผูกชื่อ role)**; ตัวสลับแผนกแสดงเฉพาะแผนกที่มี Read.
> - **(I-3) Dashboard = landing หลัง login** (หน้าแรก) — ผู้ใช้ที่ไม่มี Read แผนกใด = หน้าว่าง + ข้อความ (ไม่ error).
> - **(I-4) Date-range รายแผนก (contextual) + date-type dropdown:** ช่วงวันที่ (presets วันนี้/สัปดาห์นี้/เดือนนี้/กำหนดเอง, default เดือนนี้) + **dropdown "ชนิดวัน"** ที่ข้อมูลแผนกมีหลายแกนวัน (Shipping = วันสร้าง Route/วันออกส่ง · Finance = วันออกใบ/ครบกำหนด/รับชำระ · Sale = วันสร้าง PO ฯลฯ — `dashboard.md` §3 หมายเหตุ date-type). event รีคำนวณ, state คงค่า.
> - ยึด `dashboard.md` · `platform.md`.

> **★ NEW รอบนี้ (r15, 2026-07-31) — Reconciliation UX follow-up (PO แก้ requirement docs เท่านั้น; ไม่แก้ mockup — เข้า GATE 1 เฉพาะจอที่แก้):**
> - **(J-1)** `mockups/return.html` — ป้าย/หัวคอลัมน์เลขใบคืน + ช่องค้น **"RT" → "RET"** (`RET-{YYYYMM}-{NNNNNN}`).
> - **(J-2)** `mockups/stock.html` — return-ledger / movement `return (−)` source **"RT" → "RET"** (เลขใบคืน).
> - **(J-3)** `mockups/trace.html` — Return topic / sample **"RT ที่ส่งคืน" → "เลขใบคืน RET"**.
> - **(J-4 verify)** `mockups/delivery-note.html` + จอที่โชว์สถานะ PO/SO (dashboard/po-detail/so-detail) — ยืนยันไม่มี **In Delivery / Delivered / ส่งถึง / กำลังจัดส่ง** (ใช้ DN 6 สถานะ) — น่าจะตรงอยู่แล้วตาม r11/r14; ระบุเป็น spot-check.
> - เป็นการ rename เชิง label (J-1..3) — ไม่เปลี่ยน layout/flow → GATE 1 review เบา.
>
> **หมายเหตุ collision:** ทุกรอบ (r14/r15) PO แก้ **requirement docs เท่านั้น** — mockup ข้างต้นส่งต่อ UX/UI (เข้า GATE 1 review เฉพาะส่วนที่เปลี่ยน).

---

## 9. Open questions
**ไม่มี open question ที่บล็อก.** (Q1=A DECIDED · r12/r13/r14/r15 = ไม่มี open question ที่บล็อก.)

> **★ r15 (Reconciliation) — 2 รายการ non-blocking ให้ปอนด์ยืนยันที่ Gate (ไม่ค้างงาน):**
> - **Q-INV1 (m1):** PO/SO ที่มีใบ active แล้ว → default **(A) explicit cancel-then-create** (UX เดินตาม A). ถ้าเลือก **(B) auto-supersede** → ปรับ `invoice.md` §4b + ปุ่ม UX 1 จุด.
> - **m4 deferral (DEF-1):** ยืนยันว่า **Invoice Confirmed-gate ผ่อนในเฟสนี้โดยตั้งใจ** (create ได้ทุกสถานะ) จะ re-tighten ภายหลัง — register ที่ `non-functional.md` §15.

> **★★★★★★ r14 (Home removed) — PO decision (settled; ไม่ถือเป็น open question — ปอนด์ override ได้):**
> - **ไม่มีฟีเจอร์ unique ของ Home ที่ต้องย้ายไป Dashboard** — task-inbox aggregate เดิม reuse สถานะ/นับเดียวกับ Dashboard + notification อยู่แล้ว → ตัดทิ้งได้โดยไม่เสีย capability. Dashboard (per-department Read-scoped) + Notification bell ครอบคลุมงานประจำวันครบ. *(ถ้าปอนด์ต้องการ task-inbox กลับมาในอนาคต = นิยามใหม่ในรอบถัดไป.)*
> - **onboarding Lot/Batch glossary** ที่เคยอยู่หน้า Home = ตัดจากหน้าแรก; glossary ยังอยู่ใน Reference/Glossary.
>
> **★ Q-INV1 (r13 — NON-BLOCKING · PO ตัดสิน default ไว้แล้ว, ปอนด์ confirm/override):** เมื่อ PO/SO **มีใบแจ้งหนี้ active อยู่แล้ว** แล้วต้องการออกใบใหม่ ควรเป็นแบบใด?
> - **(A · ค่า default ที่ PO เลือก) explicit cancel-then-create** — บล็อกการสร้างใบใหม่จนกว่าจะ void ใบ active เดิม. **UX/UI เดินหน้าด้วยค่านี้.**
> - **(B) auto-supersede** — กด "สร้างใบใหม่" → ระบบ void ใบเดิมอัตโนมัติ + ออกใบใหม่เป็น active.
>
> **PO reasonable decisions รอบก่อน (settled; ไม่ถือเป็น open question — ปอนด์ override ได้):**
> - **Partial / split billing = นอกขอบเขตเฟสนี้** — 1 ใบ active = คลุม PO/SO เต็มใบ.
> - **เฟสนี้ไม่ล็อกสถานะตอนสร้างใบ** — Confirmed-gate = deferred (register `non-functional.md` §15 DEF-1).
> - **per-invoice override** = pull จาก customer master ตอนสร้าง แล้วแก้บนใบ (snapshot) ไม่กระทบ master.
> - **(รอบก่อน) DN 6 สถานะ / PO-SO rollup = DN ล่าสุด / Route cancel → DN void / แก้สถานะ DN = A / r12 login-failure audit** — คงตามเดิม (commit history).
