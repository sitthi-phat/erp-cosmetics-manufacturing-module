# Permission Matrix — Capability → Module → Action (consolidated)

slug: `erp-v2-ui-first` · per-module canonical · PO · 2026-07-29 (**+ Route/DN actions 2026-07-30 · + Audit-view r12 confirm 2026-07-30 · + Invoice actions r13 2026-07-30 · + stray-tag cleanup 2026-07-31**) · **★ G9 permission-code suffix + authoritative action→code map** · **★★ G9 sweep — 9 ambiguous controls SETTLED (§3.1)**
กฎอ้างอิง: **D14** (RBAC generic) · **D17** · scope §7.1 · **★ Settings review 2026-07-29** · **★ Sale delete → customers unassigned** · **★ G9 permission-code suffix** · **★★★ r11 (2026-07-30): Route/DN actions — แก้สถานะ DN โดยตรง = Shipping.Approve (A)** · **★★★★ r12 (2026-07-30): ดู Audit log (ทุกกิจกรรม non-read + login) = Settings.Admin only (Ad)** · **★★★★★ r13 (2026-07-30): Invoice — สร้าง = C (รวมสร้างจากหน้า DN) · ยกเลิก/void = D · แก้ข้อมูลลูกค้าบนใบ (per-invoice override) = U · พิมพ์ = R**

## สรุปภาษาไทย
RBAC เป็น **generic** — บังคับสิทธิ์ที่ระดับ **module/capability** (โมเดล RUCDAA: Read/Update/Create/Delete/Approve/Admin ต่อ module), ไม่ hardcode ชื่อ role. ใครถือ permission ตรงก็ทำได้; สร้าง role/มัดสิทธิ์ = admin config ใน Settings. ตารางนี้รวม **ทุกปุ่ม/action ของทุก module**. **★ G9:** ทุกปุ่ม/action ที่ permission-gate ต้อง **แสดงรหัสสิทธิ์เป็น suffix ต่อท้าย label** (เช่น "บันทึก (C)", "อนุมัติ (A)", "ตั้งค่า VAT (Ad)"). **รหัส 6 ตัวเป๊ะ: R / C / U / D / A / Ad** (Ad=Admin; ไม่มี "Archive" แยก). **★★★ r11:** เพิ่ม action ของ Route (สร้าง=C, แก้/เปลี่ยนสถานะ=U) และ **DN (แก้สถานะ DN โดยตรง = Approve (A))** + print DN/Invoice = (R). **★★★★ r12 (confirm):** **ดู Audit log = Settings.Admin only → (Ad)**; trace ผ่าน module เดิมยังใช้ **Read (R)** ของ module นั้น. **★★★★★ r13 (Invoice review):** ยืนยัน/เพิ่ม action ของ Invoice — **สร้างใบแจ้งหนี้ = Invoice.C (รวมสร้างจากหน้า DN, DN-unify)** · **ยกเลิก/void ใบ = Invoice.D** · **แก้ข้อมูลลูกค้าบนใบ (ชื่อ/ที่อยู่ออกเอกสาร/เลขภาษี — per-invoice override) = Invoice.U** · **พิมพ์ = Invoice.R**.

---

## 1. RUCDAA bits (internal model) → 6 public codes
| bit (internal) | public code (suffix) | ความหมาย |
|---|---|---|
| **R** Read | **(R)** | ดู/ค้น/รายงาน · **พิมพ์/แชร์ PDF (ไม่ mutate) · print DN/Invoice** · **★★★★ trace ผ่าน module (genealogy + field-audit ของ module ที่มีสิทธิ์ Read)** |
| **U** Update | **(U)** | แก้ข้อมูล/เปลี่ยนสถานะปกติ · **แก้ sub-record (ผู้ติดต่อ/comment/threshold) · แก้ Route/เปลี่ยนสถานะ Route · แก้ข้อมูลลูกค้าบนใบแจ้งหนี้ (per-invoice override)** |
| **C** Create | **(C)** | สร้างเอกสาร/record/master ใหม่ · **สร้าง Route + gen DN · สร้างใบแจ้งหนี้ (รวมจากหน้า DN)** |
| **D** Delete | **(D)** | soft-delete / void / **ปิดใช้งาน (inactivate)** · **ยกเลิก/void ใบแจ้งหนี้** |
| **A** Approve | **(A)** | อนุมัติ/สิทธิ์ระดับสูง (Blacklist, reassign, reopen) · **★ แก้สถานะ DN โดยตรง** |
| **Admin** | **(Ad)** | จัดการ config/force override/undelete/restore · **★ gate VAT/Company/Audit** · **★★★★ ดู Audit-log viewer รวม (r12)** |

### ★ Code-set reconciliation (RUCDAA + Admin → R/C/U/D/A/Ad) — SETTLED
- โมเดลภายในเดิม = **RUCDAA**; **A ตัวที่สอง = Admin** (ไม่ใช่ "Archive").
- **6 รหัสสาธารณะ = R, C, U, D, A, Ad** เป๊ะ. Admin บน UI = **(Ad)**.
- **ไม่มี capability "Archive"** — archive/undelete/restore/force-override = **Admin = (Ad)**.
- ลำดับที่แสดง = **R · C · U · D · A · Ad**. *(ไม่ต้องถามปอนด์.)*

---

## 1b. ★ G9 — Permission-code suffix on every permissioned control (GLOBAL RULE)
> ทุก **actionable control ที่ถูก permission-gate** (ปุ่ม / เมนู / row-action / tab-action) **ต้องแสดงรหัส permission เป็น suffix ต่อท้าย label**.

**รูปแบบ:** `‹label› (‹code›)` — เช่น `บันทึก (C)` · `แก้ไข (U)` · `ลบ (D)` · `อนุมัติ (A)` · `ตั้งค่า VAT (Ad)` · `แก้สถานะ DN (A)` · `ดู Audit log (Ad)` · `สร้างใบแจ้งหนี้ (C)` · `ยกเลิกใบ (D)`.

**กติกา:**
1. **รหัส 6 ตัว: R · C · U · D · A · Ad** (ตาม §1). ห้ามคิดรหัสใหม่.
2. **Read-only view / ปุ่มดูเฉย ๆ** ละ **(R)** ได้ เว้นแต่มีประโยชน์ (เช่น "ดู Audit log (Ad)"). **print/แชร์ PDF (รวม print DN/Invoice) = (R) และควรแสดง (R)**.
3. **Action ที่ต้องถือหลาย permission (cross-module)** แสดงครบคั่นด้วย `+` เช่น `แปลงเป็น PO (U+C)`.
4. **การ gate จริง** ยังยึด permission ตาม §3 — suffix เป็น label ประกอบ.
5. **แหล่งอ้างอิงรหัส** = ตาราง §3 + §3.1.
6. **★★ Value/mode-dependent control:** ปุ่ม save 1 ปุ่มที่ผลลัพธ์ขึ้นกับค่า/โหมด → gate ตามค่าที่เลือก; suffix แสดงเซ็ต `(U/A)` ฯลฯ.

---

## 2. Modules ในระบบ
Customer · **Quotation** · PO · **SO** · **Supply Planning** · BOM · Warehouse/Stock (+ Return + Goods Receipt) · Production · QC · **Shipping/Route** · **Delivery Note (DN)** · Invoice · PR · Supplier · Settings/User-Role.

## 3. ★ Consolidated capability → action → permission → **Suffix (G9)**
> คอลัมน์ **Suffix** = รหัสที่ UX/UI ต้องต่อท้าย label ปุ่มจริง (G9). Admin → **(Ad)**.

| Module | ปุ่ม/action | Permission required | **Suffix (G9)** |
|---|---|---|---|
| **Customer** | ดู list/detail/history · modal detail | Customer.R | (R) *(ละได้)* |
| | สร้างลูกค้า | Customer.C | **(C)** |
| | แก้ (TYPE/credit term/ผู้ติดต่อ/**ที่อยู่ลูกค้า+ที่อยู่จัดส่ง**/**flag ผู้รับสินค้า**) · เปลี่ยนสถานะปกติ · **เพิ่ม/ลบผู้ติดต่อ** · ตั้ง/ล้าง ⚑ follow-up | Customer.U | **(U)** |
| | ตั้ง Disabled/Blacklist · reassign/มอบหมาย/ล้าง Sale ที่ดูแล | Customer.A | **(A)** |
| | **บันทึกสถานะ (value-dependent: ปกติ=U / Disabled·Blacklist=A)** | Customer.U ↔ Customer.A | **(U/A)** |
| | soft-delete | Customer.D | **(D)** |
| | undelete/restore | Customer.Admin | **(Ad)** |
| **Quotation** | ดู list/detail/print-ready · material check | Quotation.R | (R) *(ละได้)* |
| | **พิมพ์/ส่งลูกค้า QT (print/share PDF)** | Quotation.**R** | **(R)** |
| | สร้าง QT (เวอร์ชันใหม่) | Quotation.C | **(C)** |
| | แก้ QT · ตั้งสถานะ ปฏิเสธ | Quotation.U | **(U)** |
| | **Convert to PO (→ Confirmed)** | Quotation.U **+ PO.C** | **(U+C)** |
| | ยกเลิก QT (ทุกสถานะ) + เหตุผล | Quotation.D / Quotation.A | **(D)** / **(A)** |
| **PO** | ดู list/detail | PO.R | (R) *(ละได้)* |
| | เปิด PO ใหม่ | PO.C | **(C)** |
| | แก้ (Draft/Hold) · ยืนยัน PO | PO.U | **(U)** |
| | ยกเลิก | PO.D | **(D)** |
| | reopen | PO.A | **(A)** |
| | force override สถานะ | PO.Admin | **(Ad)** |
| | **บันทึกการเปลี่ยนสถานะ… (value-dependent: ยกเลิก=D / reopen=A / force-override=Ad)** | PO.D ↔ PO.A ↔ PO.Admin | **(D/A/Ad)** |
| **SO** | ดู list/detail | SO.R | (R) *(ละได้)* |
| | สร้าง SO (ก/ข) | SO.C | **(C)** |
| | แก้ SO (ก/ข) | SO.U | **(U)** |
| | ยืนยันใบสั่งขาย (จอง FG) **[โหมด ก]** | SO.U | **(U)** |
| | ยืนยันผลิตเก็บสต็อก (→ PRD) **[โหมด ข]** | SO.C | **(C)** |
| | ยกเลิก SO (คืนจอง) | SO.D / SO.A | **(D)** / **(A)** |
| **Supply Planning** | ดู/ค้น/filter | Supply Planning.R | (R) *(ละได้)* |
| | แก้ rate/lead/cover → save back BOM | Supply Planning.U | **(U)** |
| | ปุ่ม "สั่งผลิต" (prefill SO produce-to-stock) | Supply Planning.C (→ SO/Production.C) | **(C)** |
| **BOM** | ดู | BOM.R | (R) *(ละได้)* |
| | สร้าง | BOM.C | **(C)** |
| | แก้สูตร/ต้นทุน/TYPE/ราคาขาย/planning config · save-back | BOM.U | **(U)** |
| | **ปิดใช้งาน / Inactivate** | BOM.D | **(D)** |
| | **Reactivate (Inactive → Active)** | BOM.U | **(U)** |
| | soft-delete | BOM.D | **(D)** |
| **Warehouse/Stock** | ดู stock (RM/FG) + ledger | Stock.R | (R) *(ละได้)* |
| | ปรับยอด FG/RM (adjust) · loss · คืนวัตถุดิบ (Return) | Stock.U (+ เหตุผล) | **(U)** |
| | ตั้ง/แก้เกณฑ์ near-empty threshold (RM) | Stock.U | **(U)** |
| | เพิ่มวัตถุดิบใหม่ (create RM master) | Stock.C | **(C)** |
| | Goods Receipt (รับเข้าคลัง) · ส่งกลับ QC / ยกเลิก GR | Stock.C / Stock.D | **(C)** / **(D)** |
| **Production** | ดูคิว/PRD/Batch | Production.R | (R) *(ละได้)* |
| | รับงาน · เริ่มผลิต · actual qty · พร้อมส่ง · rework · Hold · loss · ปรับสถานะ | Production.U | **(U)** |
| **QC** | ตัดสิน QC (ผ่าน/ไม่ผ่าน+feedback) — RM ตรวจรับ + Batch | QC.U | **(U)** |
| **Shipping / Route** | ดู Route list/detail + ดูประวัติ comment | Shipping.R | (R) *(ละได้)* |
| | **สร้าง Route + gen DN (อ้าง PO หรือ SO)** | Shipping.C | **(C)** |
| | **แก้ Route (สถานะ/comment/เพิ่ม-แก้ SO/PO) · Route → กำลังออกไปส่ง / เสร็จสิ้น (+ อัปเดต DN ผ่าน process) · ยกเลิก Route** | Shipping.U | **(U)** |
| | print DN | Shipping.R | (R) |
| **Delivery Note (DN)** | ดู DN list/detail | Shipping.R | (R) *(ละได้)* |
| | **★ แก้สถานะ DN โดยตรง (จากหน้า DN)** | Shipping.**A** + comment | **(A)** |
| | แก้ comment DN | Shipping.U | **(U)** |
| | print DN | Shipping.R | **(R)** |
| | **★ สร้างใบแจ้งหนี้จากหน้า DN (ถ้ายังไม่มีใบ active — DN-unify)** | Invoice.**C** | **(C)** |
| | print Invoice (จากหน้า DN · ใบ active) | Invoice.R | **(R)** |
| **Invoice** | ดู list/detail + ค้น PO/SO/INV | Invoice.R | (R) *(ละได้)* |
| | **สร้างใบแจ้งหนี้ (อ้าง PO หรือ SO · รวมสร้างจากหน้า DN — DN-unify)** | Invoice.C | **(C)** |
| | รับชำระ/อัปเดตสถานะชำระ | Invoice.U | **(U)** |
| | **★ แก้ข้อมูลลูกค้าบนใบ (ชื่อ/ที่อยู่ออกเอกสาร/เลขภาษี — per-invoice override)** | Invoice.U | **(U)** |
| | แก้ comment (แก้ในที่) | Invoice.U | **(U)** |
| | **★ ยกเลิก/void ใบแจ้งหนี้ (+ เหตุผล)** | Invoice.D | **(D)** |
| | **พิมพ์ invoice / ใบกำกับ (print PDF)** | Invoice.**R** | **(R)** |
| **PR** | ดู list/detail | PR.R | (R) *(ละได้)* |
| | เปิด PR ด้วยมือ | PR.C | **(C)** |
| | แก้ PR / ยืนยัน / ปิด | PR.U | **(U)** |
| | ยกเลิก PR | PR.D / PR.A | **(D)** / **(A)** |
| **Supplier** | ดู list/detail/price-matrix | Supplier.R | (R) *(ละได้)* |
| | สร้าง supplier | Supplier.C | **(C)** |
| | แก้ข้อมูล/price-matrix · สลับ Active/Inactive | Supplier.U | **(U)** |
| | soft-delete | Supplier.D | **(D)** |
| **Traceability** | ค้น entity/topic + genealogy (ต่อ module) · ดูตาราง field-audit ผ่าน module | Read (R) ของ module ต้นทาง | **(R)** |
| | archive audit เป็น text file | **Super User** | *(Super User)* |
| **Settings/User-Role** | **ดูแท็บ Role/User** · ค้นหา role/user | Settings.**R** | (R) *(ละได้)* |
| | สร้าง role/มัดสิทธิ์ | Settings.**Admin** | **(Ad)** |
| | Disable/Enable role · Restore role · ถอด user ออกจาก role | Settings.**Admin** | **(Ad)** |
| | Soft-delete role (+ เหตุผล) | Settings.**D** | **(D)** |
| | จัดการ user (create/edit/สลับ Active/เปลี่ยน role) · ตั้ง/รีเซ็ตรหัส · ผูก/ยกเลิก Google | Settings.**Admin** | **(Ad)** |
| | **ลบ user (→ ลูกค้าที่ดูแล unassigned อัตโนมัติ)** | Settings.**D** | **(D)** |
| | undelete/restore user/role | Settings.**Admin** | **(Ad)** |
| | ดู/แก้ VAT · ดู/แก้ ข้อมูลบริษัท · **★★★★ ดู Audit log (มุมมองรวม ทุกกิจกรรม non-read + login/logout, r12)** | Settings.**Admin only** | **(Ad)** |
| **G6 (ทุก object)** | **บันทึกหมายเหตุ / comment (💾)** | **= U ของ object แม่** | **(U)** *(รหัสตาม object แม่)* |

> **หมายเหตุ suffix สำหรับ action ที่มี 2 รหัส** (เช่น "ยกเลิก QT (D)/(A)"): ปุ่มจริง 1 ปุ่มถือ permission เดียว → แสดงรหัสของสิทธิ์ที่ผูกกับปุ่มนั้น หรือ default = รหัสแรก.

---

## 3.1 ★★ G9 sweep — 9 ambiguous controls **SETTLED** (2026-07-29, PO = single authority)
> คงตามรอบก่อน — controls #1–#9 ตัดสินครบ.

| # | Control (หน้า) | UX tentative | **PO ruling** | Suffix | Split? | UX label fix? |
|---|---|---|---|---|---|---|
| 1 | customer-detail **"บันทึกสถานะ"** | (U/A) | value-dependent gating (ปกติ=U; Disabled/Blacklist=A) | **(U/A)** | ไม่ | ไม่ |
| 2 | po-detail **"บันทึกการเปลี่ยนสถานะ…"** | (D/A/Ad) | value-dependent (ยกเลิก=D · reopen=A · force=Ad) | **(D/A/Ad)** | ไม่ | ไม่ |
| 3 | so-create **"ยืนยันใบสั่งขาย"** | (U) | mode-dependent (ก=U · ข=C) | **(U)** ก / **(C)** ข | ไม่ | **ใช่** — โหมด ข = (C) |
| 4 | customer-detail **"⚑ ต้องติดตาม"** | (U) | Customer.U | **(U)** | — | ไม่ |
| 5 | G6 **"💾 บันทึกหมายเหตุ"** | U object แม่ | comment = U object แม่ | **(U)** | — | ไม่ |
| 6 | stock **"เพิ่มวัตถุดิบใหม่"** + threshold | C / U | create RM = C · threshold = U | **(C)** / **(U)** | — | ไม่ |
| 7 | customer-edit contact **"ลบ"** | (U) | Customer.U (sub-record) | **(U)** | — | ไม่ |
| 8 | bom **"ปิดใช้งาน"** / reactivate | D / U? | ปิด=D · reactivate=U | ปิด **(D)** / reactivate **(U)** | — | ไม่ |
| 9 | Print buttons (QT/invoice) | QT=(U) | print/แชร์ = (R) ทั้งคู่ | **(R)** | — | **ใช่** — QT (U)→(R) |

**★★★ r11 (2026-07-30) — Route/DN controls (settled, ไม่กำกวม):**
- **สร้าง Route + gen DN = Shipping.C → (C)** · **แก้ Route/เปลี่ยนสถานะ Route (จัดของ/ออกไปส่ง/เสร็จสิ้น/ยกเลิก) = Shipping.U → (U)**.
- **★ แก้สถานะ DN โดยตรง (จากหน้า DN) = Shipping.Approve (A) → (A)** — ปอนด์ระบุชัดว่า "editor ต้องมี A permission". (ต่างจากการอัปเดต DN ผ่าน Route "เสร็จสิ้น" process = ส่วนของ Shipping.U.)
- **print DN = Shipping.R → (R)** · **print Invoice จากหน้า DN = Invoice.R → (R)** (print = read-derived, §3.1 #9).

**★★★★ r12 (2026-07-30) — Traceability + Audit-view controls (settled, confirm — ไม่มี functional change):**
- **ดู Audit log (Settings tab, มุมมองรวม ทุกกิจกรรม non-read + login/logout) = Settings.Admin only → (Ad)** — ยืนยันตามที่มีอยู่แล้ว §3 (VAT/Company/Audit = Admin). label ต้องแสดง **"ดู Audit log (Ad)"** (§1b ข้อ 2).
- **ค้น trace + genealogy + ดู field-audit ผ่าน module (trace.html)** = **Read (R) ของ module ต้นทาง** (topic ที่ไม่มีสิทธิ์ Read = ไม่โผล่ใน entity/topic selector).
- **archive audit เป็น text file = Super User เท่านั้น** (ไม่ใช่ 1 ใน 6 public code; เป็น system-level Super User).
- อ้างอิง: `traceability.md` §6 · `settings.md` §4d/US-SET-05 · `non-functional.md` A8/AU2.

**★★★★★ r13 (2026-07-30) — Invoice controls (settled, PO Invoice review):**
- **สร้างใบแจ้งหนี้ (อ้าง PO/SO) = Invoice.C → (C)** — **รวมการสร้างจากหน้า DN** (DN-unify: ยังไม่มีใบ active → สร้าง; มีแล้ว → พิมพ์ R). **1 PO/SO มีใบ active ทีละใบ** (`invoice.md` §4b).
- **แก้ข้อมูลลูกค้าบนใบ (ชื่อ/ที่อยู่ออกเอกสาร/เลขภาษี — per-invoice override) = Invoice.U → (U)** — snapshot บนใบ, ไม่กระทบ customer master.
- **ยกเลิก/void ใบแจ้งหนี้ (+ เหตุผล) = Invoice.D → (D)** — เอกสารการค้า void-only, เลข gapless คงอยู่ (deletion §2.8).
- **รับชำระ/อัปเดตสถานะชำระ + แก้ comment = Invoice.U → (U)** · **พิมพ์ใบ/ใบกำกับ = Invoice.R → (R)**.
- **เฟสนี้ไม่ล็อกสถานะตอนสร้างใบ** (Confirmed-gate = deferred, `invoice.md` §7 · `non-functional.md` §15 DEF-1) — ไม่กระทบ permission (ยังเป็น Invoice.C).
- อ้างอิง: `invoice.md` §6 · `delivery-note.md` §5/§9.

## 4. หมายเหตุ (D14)
- **surplus (D13)** = auto → ไม่มี permission แยก → ไม่มี suffix.
- **★ Quotation:** print/share = Quotation.R → (R); Convert-to-PO ตั้ง QT=Confirmed.
- **★★ Comment/หมายเหตุ (G6):** = Update (U) ของ object แม่.
- **★★ Print/แชร์เอกสาร:** = Read (R) — รวม **print DN / print Invoice**.
- **★★ Value/mode-dependent controls:** gate ตามค่า/โหมด, ไม่ split.
- **★ Settings:** VAT/Company/Audit-log = Admin bit · effective permission = union role Active · role disable/soft-delete ทำได้แม้มีสมาชิก.
- **★ ลบ Sale/User:** = Settings.D → ลูกค้า unassigned อัตโนมัติ; reassign = Customer.Approve.
- **★★★ r11 Route/DN:** **แก้สถานะ DN โดยตรง = Shipping.Approve (A)** (ปอนด์สั่ง) · สร้าง Route + gen DN = Shipping.C · แก้ Route/สถานะ Route = Shipping.U · print DN/Invoice = R. **คนขับ (driver) = system user** (ค้นชื่อ/username) — ไม่ใช่ capability แยก.
- **★★★★ r12 Trace/Audit:** **ดู Audit log (มุมมองรวม non-read + login) = Settings.Admin only (Ad)** · trace ผ่าน module = Read (R) ของ module ต้นทาง · archive = Super User. ไม่มีสิทธิ์ใหม่ — เป็นการยืนยัน mapping เดิม.
- **★★★★★ r13 Invoice:** **สร้างใบ = C (รวมจากหน้า DN) · ยกเลิก/void = D · แก้ข้อมูลลูกค้าบนใบ (override) = U · รับชำระ/comment = U · พิมพ์ = R.** ใบ active ทีละใบต่อ PO/SO (`invoice.md` §4b); เฟสนี้ไม่ล็อกสถานะตอนสร้าง (ไม่กระทบ permission).
- **★ G9:** ทุกปุ่มที่ permission-gate แสดงรหัสตาม Suffix; รหัส 6 ตัว (R/C/U/D/A/Ad).
- **★ แก้ (2026-07-31 — reconciliation M2 cleanup, ปอนด์):** ลบ stray tag `</content>` ท้ายไฟล์ (ไม่ใช่ spec content); ไม่มีการเปลี่ยน mapping ใด ๆ.

## 5. Cross-links
ต่อ module: customer/quotation/po/so/stock/bom/production/supply-planning/pr/supplier §Actions · **★ `shipping.md` §6 (Route) · `delivery-note.md` §9 (DN — แก้สถานะ = A · สร้าง/พิมพ์ Invoice)** · **★★★★★ `invoice.md` §6 (สร้าง=C/void=D/override=U/print=R)** · **★★★★ `traceability.md` §6 (trace = Read module ต้นทาง; archive = Super User) · `settings.md` §6/US-SET-05 (Audit log = Admin only)** · deletion-policy §3 · settings.md §6/§4b/§4c/§4d · customer.md §4.3/§8 · non-functional §2 (A6/A7/A8) + §3 (AU1/AU2/AU6) + §15 (Deferred-controls) · scope §7.1 · README §3 G9 + §8 · §3.1.
