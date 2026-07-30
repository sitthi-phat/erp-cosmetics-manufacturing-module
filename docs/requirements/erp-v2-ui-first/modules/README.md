# Requirement Package (Per-Module) — ESSENCE Hub System

slug: `erp-v2-ui-first` · เขียนโดย PO · 2026-07-30 · **CANONICAL & COMPLETE SINGLE SOURCE OF TRUTH** สำหรับ BA / QA / Tech-Lead
สถานะ: consolidation ของ requirement ที่กระจัดกระจาย → per-module ที่โครงสร้างสม่ำเสมอ **ครบทุก module + NFR + Deletion Policy** · reconciled กับ D1–D18 + fold คำสั่งใหม่ของปอนด์ (2026-07-29 · **+ Customer/Route/DN 3-module review 2026-07-30 · + Traceability trace-surface + Audit-log review r12 2026-07-30 · + Invoice review r13 2026-07-30**)

## สรุปภาษาไทย
เอกสารชุดนี้คือ **แหล่งความจริงล่าสุดแบบราย module ที่ครบถ้วน (single source of truth)** ของทั้งระบบ ESSENCE Hub. **★★★★★ NEW — Invoice review (r13, ปอนด์ 2026-07-30):** **(1)** ค้น PO/SO/Invoice ด้วย **ชื่อลูกค้า · ผู้ติดต่อ · เลข PO/SO/INV · ช่วงวันที่สร้าง (PO/SO/INV)**. **(2)** **1 PO/SO มีใบแจ้งหนี้ได้หลายใบ แต่ "active" ทีละ 1 ใบ** — active = ใบปัจจุบันที่ยังไม่ยกเลิก; void = ประวัติ (ไม่นับยอด); กลไก supersede = void ใบเดิม → สร้างใบใหม่. **(3)** เจอ PO/SO ยังไม่มีใบ → **สร้างได้เลย เฟสนี้ไม่ล็อกสถานะ** (Confirmed-gate = deferred, บันทึกไว้). **(4)** **สร้างใบ → ออกเลข INV (G8) + พิมพ์ได้ทันที**; ระบบ **pull ข้อมูลลูกค้า (ชื่อ/ที่อยู่ออกเอกสาร/เลขภาษี)** มาเป็นค่าเริ่มต้น **แต่แก้ได้เฉพาะบนใบ (per-invoice override — ไม่แก้ master)**. **(5)** **ยกเลิก/void ใบได้** (commercial-docs void-only). **(6)** **DN-unify:** สร้าง/พิมพ์ Invoice จากหน้า DN = **ใบ active เดียวกันของ PO/SO** (โผล่ในโมดูล Invoice, ไม่เกิดใบซ้ำ). permission: สร้าง=(C) · void=(D) · แก้ข้อมูลลูกค้าบนใบ=(U) · พิมพ์=(R). เอกสารต้นทาง (settled r13): `invoice.md` §3/§4b/§5/§6/§7/§8 · `po.md` §4c · `so.md` §5 · `customer.md` §3/§7 · `delivery-note.md` §5 · `numbering-on-save.md` §4/§5 · `permission-matrix.md` §3/§3.1(r13) · `non-functional.md` D-F3 (VAT invoice date) / J3 (overdue by DN). **★★★★ Traceability + Audit review (r12):** `trace.html` entity/topic selector + id/key + date-type + sample-per-object; Audit = ทุกกิจกรรม non-read + login, Admin-only (Ad). **★★★ 3 modules (2026-07-30):** **(A) Customer** ที่อยู่ registered+shipping + ผู้ติดต่อ receiver-flag. **(B) Shipping = Route `RT-…`** (RT แทน SHP). **(C) DN** module แยก 6 สถานะ; แก้สถานะ DN = A; PO/SO status = LINKED จาก DN. **คงกฎเดิม:** 2-tier Route/DN · G8 number-on-save · G6 comment · G9 permission-code · entity-status-map. **★ ทุกไฟล์ `.md` มี HTML review view + ลิงก์ในหน้า index — r13 ใช้ view เดิม `invoice.html` (มีอยู่ + ลิงก์ครบ), render จาก `.md` ที่อัปเดต — ไม่มี view ใหม่ที่ต้องสร้าง.**

---

## 1. โครงไฟล์ (file tree — ครบทั้งชุด)

```
docs/requirements/erp-v2-ui-first/modules/
  README.md                  ← ไฟล์นี้ (index + D-rule spine + changelog + source-of-truth + old→new map + global rules)
  permission-matrix.md       ← capability → module → action/button → ★ Suffix (G9) · ★ แก้สถานะ DN = A · ★ Audit view = Admin (Ad) · ★ Invoice สร้าง=C/void=D/override=U/print=R (r13)
  comment-convention.md      ← ★ กติกากลาง comment + change-history (CC1–CC7) · 12 object (Shipment→Route)
  numbering-on-save.md        ← ★ กติกากลาง G8 = เลขเอกสารออกตอนบันทึก (NS1–NS7) · DN+Route (RT) · ★ Invoice one-active (void=เลขเดิม/ใบใหม่=เลขใหม่, r13)

  # System-wide / Governance (Non-Functional bucket ใน Hub)
  non-functional.md          ← NFR รวม (★ +Route/DN r11 · RT numbering · DN status-edit A · ★★★★ +Audit non-read+login r12 = AU1/AU6 · D-F3 VAT invoice-date + J3 overdue-by-DN)
  deletion-policy.md         ← soft-delete/void baseline + entity (INV = void-only §2.8)
  traceability.md            ← trace/audit governance (★ +Route/DN entity + DN status-edit A audit · ★★★★ r12: entity/topic selector §3.1 + sample-per-object §5b + non-read+login §3/§4/§9)

  # Platform & Navigation
  platform.md · home.md · dashboard.md

  # Sales & Customer
  customer.md (★ +ที่อยู่ลูกค้า/ที่อยู่จัดส่ง + ผู้ติดต่อ=คนรับสินค้า · ★ +invoice pull/per-invoice-override note r13) · quotation.md · po.md (★ +§4b สถานะจัดส่ง=สะท้อน DN · ★ +§4c billing=ใบ active r13) · so.md (★ +สถานะจัดส่ง=สะท้อน DN · ★ +billing=ใบ active r13)

  # Supply Planning & Production (Functional · ผลิต&คุณภาพ)
  bom.md · supply-planning.md
  production.md              ← คิวผลิต 2 แท็บ + management page + comment
  qc.md                      ← ตรวจรับ RM (QC-gate) + ตรวจแบตช์ 2 sub-tab

  # Inventory & Procurement (Functional · คลัง&จัดซื้อ)
  stock.md · goods-receipt.md · pr.md · supplier.md · return.md

  # Fulfilment & Finance
  shipping.md (★★★ Module B — Route `RT-…` + สร้างรอบ + modal + status actions) · delivery-note.md (★★★ Module C — DN 6 สถานะ + search + print DN/Invoice + comment + แก้สถานะ A · ★ +DN-unify create/print Invoice = ใบ active r13) · invoice.md (★★★★★ r13 — search + one-active + create-no-status-lock + per-invoice override + DN-unify + void)

  # System
  settings.md                ← RUCDAA + Users + VAT + Company + ★★★★ Audit-log tab (non-read+login, Admin-only, §4d/US-SET-05)

  flows/  oem-flow.md · ownbrand-flow.md
```

HTML review view: `docs/design/erp-v2-ui-first/functional-spec/modules/index.html` · Hub `functional-spec/index.html`.
**★ Doc-completeness: ทุกไฟล์ `.md` มี HTML review view ครบ 1:1 + ลิงก์ในหน้า Modules index** (render จาก .md ผ่าน `_render.js`). **★ Customer/Route/DN รอบก่อนเพิ่ม `delivery-note.md`→`delivery-note.html`** (view + map + index link ครบ). **★★★★ r12 (Traceability + Audit):** ใช้ view เดิม `traceability.html` + `settings.html` (มีอยู่ + ลิงก์ครบ). **★★★★★ r13 (Invoice):** ใช้ view เดิม **`invoice.html`** (มีอยู่ + map ใน `_render.js` + ลิงก์ในหน้า index ครบ) — render จาก `invoice.md` ที่อัปเดต r13 — completeness rule satisfied, ไม่มี view ใหม่ที่ต้องสร้าง.

---

## 2. D-Rule Spine (คงเป็นแกน — พร้อม DELTA)
D1–D18 ยังเป็นกฎแกน (`scope-oem-ownbrand-supply-planning.md` §1). จุดอัปเดตหลัก (คงตามรอบก่อน): **D8 v2** (สั่งผลิต batch-count) · **credit 60** · **D18 reseat** (QT Confirmed) · **D11 v2** (BOM/FG+RM code user-entered lock) · **D13 reinforce** (พร้อมส่ง QC-gated) · **D9/D10** (margin sim) · **D12/D16** (QC-gated stock-in). **★★★ 2026-07-30:** Route/DN rewrite ไม่แตะ D-rule แต่ implement D1/D16 (DN อ้าง PO/SO · FG FIFO per-Batch ตอน dispatch = DN "ส่งสำเร็จ"). **★★★★ r12 Trace/Audit:** ไม่แตะ D-rule — implement D14 + D15 + GMP traceability. **★★★★★ r13 Invoice:** ไม่แตะ D-rule — implement D10 (invoice อ้าง SO + cost snapshot) + credit-60/override + VAT-by-invoice-date (D-F3). **★ หมายเหตุ reconcile:** เดิม "invoice ออกได้ตั้งแต่ PO Confirmed" → เฟสนี้ปอนด์ผ่อนเป็น **ไม่ล็อกสถานะตอนสร้าง** (deferred, `invoice.md` §7).

---

## 3. GLOBAL Rules (บังคับทุก module)

| # | กติกา | รายละเอียด |
|---|---|---|
| **G1 Pagination** | list/history ทุกอัน **20 แถว/หน้า + pagination** | ทุก list + **★ Route list · DN list · Invoice list · ★★★★ ตาราง field-audit (trace + Settings audit tab)** |
| **G2 Date-range search** | ค้น **เลขเอกสาร** หรือ **ช่วงวันที่** | quotation/PO/SO/GR/PR/invoice list + production queue + audit + **★ Route/DN list** + **★ Invoice search (ชื่อลูกค้า/ผู้ติดต่อ/เลข PO-SO-INV/ช่วงวันสร้าง PO-SO-INV, r13)** + **★★★★ trace.html (id/key + ช่วงวัน + dropdown ชนิดวัน/date-type) · Settings audit tab** |
| **G3 Drill + back คงสถานะ** | กลับ **ไม่เสีย state เดิม** | dashboard drill · detail modal · **★ Route add-order modal + order detail modal** · **★★★★ trace genealogy node click → deep link + back** |
| **G4 Customer search dropdown** | quotation/po/so-create | ค้นเบอร์/บริษัท/ผู้ติดต่อ · Disabled/Blacklist hard block |
| **G5 Permission-per-action** | ทุกปุ่มระบุ capability | `permission-matrix.md` · **★ แสดงรหัสเป็น suffix ตาม G9** · **★★★★ ดู Audit log = (Ad)** · **★ Invoice void = (D) · override = (U) (r13)** |
| **★ G6 Comment + change-history** | ทุก object ธุรกรรมมี **ช่องหมายเหตุเดียว แก้ในที่ + เก็บประวัติครบ** | **12 object** (Shipment→**Route**) · `comment-convention.md` · **★ comment DN บังคับตอน status-update · ★★★★ comment edit = audited event · Invoice comment = หมายเหตุภายใน ไม่พิมพ์ลงใบ** |
| **★ G7 Search-in-dropdown** | RM/FG/Lot/component + Return RM-in-lot | ค้นชื่อ+รหัส · **★ Route driver ค้นชื่อ/username** · **★★★★ trace topic ที่เป็น master ค้น ชื่อ+รหัส** |
| **★ G8 Document number on SAVE** | create ทุกใบ: ไม่โชว์เลขล่วงหน้า → ออกเลข gapless ตอนบันทึก + popup ยืนยัน · ร่างที่ไม่บันทึกไม่กินเลข | `numbering-on-save.md` (NS1–NS7) · **★ Route (RT) + ทุก DN ออกพร้อมกัน (NS7)** · **★ Invoice ออกตอน "สร้างใบแจ้งหนี้" + print-ready; void=เลขเดิม, ใบใหม่หลัง void=เลขใหม่ (r13)** |
| **★ G9 Permission-code suffix** | ทุก actionable control ที่ permission-gate แสดงรหัสสิทธิ์เป็น suffix | รหัส 6 ตัว: R/C/U/D/A/Ad · **★ แก้สถานะ DN = (A)** · **★★★★ ดู Audit log = (Ad)** · **★ Invoice: สร้าง=(C)/void=(D)/override=(U)/print=(R) (r13)** · authority = `permission-matrix.md` §3 |

> NFR ระดับระบบ รวมที่ `non-functional.md` (**★★★★ AU1–AU6 = audit/trace NFR**).

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
| **★★★★★ NEW — Invoice review (r13, 2026-07-30)** | **(1) Search** PO/SO/INV = ชื่อลูกค้า·ผู้ติดต่อ·เลข PO/SO/INV·ช่วงวันสร้าง · **(2) 1 PO/SO หลายใบ, active ทีละใบ** (active=ใบยังไม่ยกเลิก; void=ประวัติ; supersede = void→create) · **(3) สร้างเมื่อยังไม่มีใบ; เฟสนี้ไม่ล็อกสถานะ** (Confirmed-gate deferred) · **(4) สร้างใบ → ออกเลข INV (G8) + print-ready; pull ข้อมูลลูกค้า → per-invoice override (ไม่แก้ master)** · **(5) ยกเลิก/void ใบได้** (void-only) · **(6) DN-unify: สร้าง/พิมพ์ Invoice จากหน้า DN = ใบ active เดียวกัน** · permission สร้าง=(C)/void=(D)/override=(U)/print=(R) | `invoice.md` §3/§4b/§5/§6/§7/§8 · `po.md` §4c · `so.md` §5 · `customer.md` §3/§7 · `delivery-note.md` §5 · `numbering-on-save.md` §4/§5 · `permission-matrix.md` §3/§3.1(r13) · `non-functional.md` D-F3/J3 |

**หมายเหตุ:** Quotation ทำ material check แต่ **ไม่ auto-open PR**.

---

## 5. ★ Source-of-Truth Statement (ประกาศชัด)
1. **`modules/*.md` = AUTHORITATIVE spec ปัจจุบันของทุก module + NFR + Deletion Policy + Traceability** — ชุดเดียวที่ BA/QA/TL ยึด.
2. แต่ละ .md = **spec เต็ม**. governance authoritative: `non-functional.md` · `deletion-policy.md` · `traceability.md` · `comment-convention.md` (G6) · `numbering-on-save.md` (G8) · `permission-matrix.md` (RBAC+G9).
3. **เอกสารเก่า** = historical reference → Hub ⑥ Archive.
4. **เอกสารหลักการเชิงลึก** (`entity-status-map` **§1.9/§1.10 = Route/DN r11**, `status-journeys`, `stock-reservation`, scope D1–D18, ...) = authoritative reference → Hub ③. **module package wins ถ้าขัดกัน.**
5. **RTM/Traceability คงครบ. ★★★★ r12: Trace + Audit surface = authoritative ที่ `traceability.md` §3/§3.1/§5b (trace) + `settings.md` §4d/US-SET-05 (audit viewer, Admin-only) + `non-functional.md` AU1/AU6 (NFR).** ทั้ง trace.html และ Settings Audit tab อ่าน **audit store เดียวกัน**.
6. **★★★★★ r13: Invoice model = authoritative ที่ `invoice.md`** — multiple-invoices-one-active (§4b) · per-invoice customer override (§3) · create-no-status-lock this phase (§7) · DN-unify (§5). **billing rail ของ PO/SO = สะท้อนใบ active** (`po.md` §4c / `so.md` §5); **financial summary ลูกค้า = ใบ active/ไม่รวม void** (`customer.md` §7). module package wins.
7. **Navigation IA:** ① Functional · ② Non-Functional · ③ Reference · ④ Architecture · ⑤ Mockups · ⑥ Archive.
8. **★ HTML review view = 1:1 ต่อทุก .md** (render จาก .md ผ่าน `_render.js`). **★ delivery-note.md ได้ view + link ครบ.** **★★★★ r12: `traceability.html` + `settings.html` มีอยู่แล้ว + ลิงก์ครบ.** **★★★★★ r13: `invoice.html` มีอยู่แล้ว + map + ลิงก์ครบ** (render `invoice.md` ที่อัปเดต) — ไม่ต้องสร้าง view ใหม่.

---

## 6. ★ Map: เอกสารเก่า → ครอบคลุมโดย module ใด
| เอกสารเก่า | ครอบคลุมโดย module (authoritative) | หมายเหตุ |
|---|---|---|
| functional-spec `shipping.html` (Shipment+DN รวม) | `shipping.md` (Route) + **`delivery-note.md` (DN แยก)** | ★ split เป็น 2 module (B/C) |
| functional-spec `invoice.html` (US-INV-01..04) | **`invoice.md` (★★★★★ +r13 search/one-active/no-status-lock/per-invoice-override/DN-unify/void)** | absorbed เต็ม · เก่าอยู่ ⑥ Archive |
| functional-spec `traceability.html` (US-TRC-01..03) | **`traceability.md` (★★★★ +r12 selector/sample/non-read+login)** | absorbed เต็ม · เก่าอยู่ ⑥ Archive |
| functional-spec BA pages อื่น | โมดูลชื่อเดียวกันใน `modules/` | absorbed เต็ม · เก่าอยู่ ⑥ Archive |
| `SHP-…` numbering (glossary/ADR-008) | **`RT-…` (numbering-on-save + non-functional D-F5)** | ★ rename — Q1=A DECIDED (RT แทน SHP, drop SHP) · historical note: SHP → RT |

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
| **★★★★★ NEW — Invoice review (r13, 2026-07-30)** | **DECIDED 2026-07-30 (ปอนด์) · settled** | **(1) Search** PO/SO/INV = ชื่อลูกค้า·ผู้ติดต่อ·เลข PO/SO/INV·ช่วงวันสร้าง (§8). **(2) Multiple-invoices-one-active** (§4b): 1 PO/SO หลายใบ, active=ใบยังไม่ยกเลิกทีละใบ; void=ประวัติ (ไม่นับยอด); supersede = void→create. **(3) สร้างเมื่อยังไม่มีใบ; เฟสนี้ไม่ล็อกสถานะ** — relax Confirmed-gate (deferred, บันทึกไว้ §7). **(4) สร้างใบ → ออกเลข INV (G8) + print-ready; pull ข้อมูลลูกค้า (ชื่อ/ที่อยู่ออกเอกสาร/เลขภาษี) → per-invoice override (snapshot บนใบ, ไม่แก้ master §3).** **(5) ยกเลิก/void ใบได้** (deletion §2.8). **(6) DN-unify** — สร้าง/พิมพ์ Invoice จากหน้า DN = ใบ active เดียวกันของ PO/SO (โผล่ในโมดูล Invoice, ไม่เกิดใบซ้ำ §5). **permission (r13):** สร้าง=(C, รวมจาก DN)/void=(D)/แก้ข้อมูลลูกค้าบนใบ=(U)/print=(R). อัปเดต `invoice.md` (rewrite §2–§13) · `po.md` §4c · `so.md` §5 · `customer.md` §3/§7/§8/§9b · `delivery-note.md` §5/§9/§10/§12 · `numbering-on-save.md` §2/§4/§5 · `permission-matrix.md` §3/§3.1(r13)/§4. **★ Q-INV1 (non-blocking)** = supersede แบบ explicit-cancel (default A) vs auto-supersede (B) — ดู §9. |
| **★ Doc-completeness — invoice view (r13, 2026-07-30)** | **CONFIRMED (docs เท่านั้น · ไม่มี view ใหม่)** | `invoice.html` **มีอยู่แล้ว + map ใน `_render.js` + ลิงก์ในหน้า `modules/index.html` ครบ** (render จาก `invoice.md` ที่อัปเดต r13). completeness rule satisfied — ไม่ต้องสร้าง/แก้ view. *(อัปเดต teaser ในหน้า index ให้สะท้อน r13.)* |

---

## 8. งานส่งต่อ UX/UI (สรุป)

**punch-list เดิม + delta รอบก่อน:** (คงตามรอบก่อน — commit history · รวม Customer/Route/DN (A–D), Traceability/Audit (E–F))

> **★★★★★ NEW รอบนี้ (r13, 2026-07-30) — Invoice ที่ UX/UI ต้องเพิ่ม/แก้ (`invoices.html · invoice-detail.html · invoice-print.html` + hook บน `delivery-note.html`):**
>
> **(G) Invoice — `invoices.html`:**
> - **(INV-1) Search:** ค้น **ชื่อลูกค้า · ชื่อผู้ติดต่อ · เลข PO/SO/Invoice · ช่วงวันที่สร้าง (dropdown เลือกแกน PO/SO/Invoice, G2)** → ผลลัพธ์รวม PO/SO ที่ยัง **ไม่มีใบ** ด้วย.
> - **(INV-2) List:** แต่ละแถวโชว์ **PO/SO + ใบ active (ถ้ามี) + ประวัติใบที่ void (ขยายดูได้)** + สถานะ billing/overdue + stage จริงของ PO/SO. filter: สถานะ billing/overdue + **ใบ active / ประวัติ (void)**.
> - **(INV-3) สร้างใบเมื่อยังไม่มี:** PO/SO ที่ **ยังไม่มีใบ active** → ปุ่ม **"สร้างใบแจ้งหนี้ (C)"**; ช่องเลข INV = **"(ระบบออกให้เมื่อบันทึก)"** → กดสร้าง → **G8 popup (เลข INV + สรุป ลูกค้า/อ้าง PO-SO/grand total + ลิงก์ detail/print)** → **พิมพ์ได้ทันที**. **เฟสนี้ไม่ต้อง gate สถานะ PO/SO** (สร้างได้ทุกสถานะ).
> - **(INV-4) มีใบ active แล้ว → ปุ่มสร้างถูกบล็อก** (default explicit cancel-then-create, §9 Q-INV1) พร้อมข้อความ + ลิงก์ไปยกเลิกใบเดิม.
>
> **(G) Invoice — `invoice-detail.html`:**
> - **(INV-5) บล็อกข้อมูลลูกค้าที่แก้ได้ (per-invoice override):** ฟิลด์ **ชื่อลูกค้า · ที่อยู่ออกเอกสาร · เลขภาษี** = **แก้ได้บนใบ (U)** (ค่าเริ่มต้น pull จาก customer master ตอนสร้าง) + ป้ายบอกว่า "แก้เฉพาะใบนี้ ไม่กระทบข้อมูลลูกค้า". เครดิต override ต่อใบ (คงเดิม).
> - **(INV-6) ยกเลิก/void ใบ:** ปุ่ม **"ยกเลิกใบ (D)"** + บังคับเหตุผล → ใบเป็น void (เลขคงอยู่) → ราง billing/financial หยุดนับ + PO/SO ออกใบใหม่แทนได้.
> - **(INV-7) comment (G6)** ภายใน (ไม่พิมพ์ลงใบกำกับ) + ประวัติการแก้ · **พิมพ์ (R)**.
>
> **(G) Invoice — `invoice-print.html`:** ใบกำกับภาษีไทยเต็มรูป (ใช้ข้อมูลลูกค้าที่ override บนใบ + VAT ตาม invoice date + ตัวหนังสือไทย + ลายเซ็น 2 ช่อง) — พิมพ์ได้ทันทีหลังสร้าง.
>
> **(G) hook บน `delivery-note.html` (DN-unify):**
> - **(INV-8) ปุ่ม "สร้าง/พิมพ์ Invoice" บนหน้า DN = ทำงานบนใบ active เดียวกันของ PO/SO** — ยังไม่มีใบ active → **"สร้างใบแจ้งหนี้ (C)"** (เปิด G8 popup แบบเดียวกับหน้า Invoice, ใบที่ได้โผล่ในโมดูล Invoice ด้วย); มีใบ active แล้ว → **"พิมพ์ Invoice (R)"** (ใบเดิม, ไม่เกิดใบซ้ำ). ยึด `delivery-note.md` §5 · `invoice.md` §4b/§5.
> - ยึด `invoice.md` · `numbering-on-save.md` · `permission-matrix.md` §3 (r13).
>
> **หมายเหตุ collision:** รอบนี้ PO แก้ **requirement docs เท่านั้น** — mockup Invoice/DN ทั้งหมดข้างต้นส่งต่อ UX/UI (เข้า GATE 1 review เฉพาะส่วนที่เปลี่ยน). *(UX/UI กำลังแก้ trace/settings mockup ขนานกัน — คนละหน้า ไม่ชนกัน.)*

---

## 9. Open questions
**ไม่มี open question ที่บล็อก.** (Q1=A DECIDED · r12 = ไม่มี open question.)

> **★ Q-INV1 (r13 — NON-BLOCKING · PO ตัดสิน default ไว้แล้ว, ปอนด์ confirm/override):** เมื่อ PO/SO **มีใบแจ้งหนี้ active อยู่แล้ว** แล้วต้องการออกใบใหม่ ควรเป็นแบบใด?
> - **(A · ค่า default ที่ PO เลือก) explicit cancel-then-create** — บล็อกการสร้างใบใหม่จนกว่าจะ void ใบ active เดิม (ปลอดภัยกับเอกสารภาษี ไม่ void โดยไม่ตั้งใจ). **UX/UI เดินหน้าด้วยค่านี้.**
> - **(B) auto-supersede** — กด "สร้างใบใหม่" → ระบบ void ใบเดิมอัตโนมัติ + ออกใบใหม่เป็น active.
> - **สถานะไม่ถูกบล็อก** — ถ้าปอนด์เลือก (B) ปรับ `invoice.md` §4b + ปุ่มเดียวบน UX. (ตัดสินใน `invoice.md` §13.)
>
> **PO reasonable decisions รอบนี้ (settled; ไม่ถือเป็น open question — ปอนด์ override ได้):**
> - **Partial / split billing = นอกขอบเขตเฟสนี้** — 1 ใบ active = คลุม PO/SO เต็มใบ (สอดคล้อง 1 DN = 1 PO เต็ม); ถ้าอนาคตต้องแตกบิลบางส่วน จะนิยาม multi-active + aggregate เพิ่ม.
> - **เฟสนี้ไม่ล็อกสถานะตอนสร้างใบ** — Confirmed-gate = deferred (บันทึกไว้ re-tighten ภายหลัง); ไม่ยกเลิกกฎถาวร.
> - **per-invoice override** = pull จาก customer master ตอนสร้าง แล้วแก้บนใบ (snapshot) ไม่กระทบ master.
> - **(รอบก่อน) DN 6 สถานะ / PO-SO rollup = DN ล่าสุด / Route cancel → DN void / แก้สถานะ DN = A / r12 login-failure audit** — คงตามเดิม (commit history).
</content>
