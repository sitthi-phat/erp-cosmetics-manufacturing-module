# Permission Matrix — Capability → Module → Action (consolidated)

slug: `erp-v2-ui-first` · per-module canonical · PO · 2026-07-29 · **★ G9 permission-code suffix + authoritative action→code map added (2026-07-29)** · **★★ G9 sweep — 9 ambiguous controls SETTLED (§3.1, 2026-07-29)**
กฎอ้างอิง: **D14** (RBAC generic, permission-per-module/capability, ไม่ fix role) · **D17** · scope §7.1 (ต่อยอด) · **★ Settings module review 2026-07-29 (VAT/Company/Audit = Admin only; role disable/soft-delete; user password/Google-link)** · **★ Sale delete → customers unassigned/blank (ปอนด์ 2026-07-29, resolve US-SET-02)** · **★ G9 permission-code suffix on labels (ปอนด์ 2026-07-29)**

## สรุปภาษาไทย
RBAC เป็น **generic** — บังคับสิทธิ์ที่ระดับ **module/capability** (โมเดล RUCDAA: Read/Update/Create/Delete/Approve/Admin ต่อ module), ไม่ hardcode ชื่อ role. ใครถือ permission ตรงก็ทำได้; สร้าง role/มัดสิทธิ์ = admin config ใน Settings. ตารางนี้รวม **ทุกปุ่ม/action ของทุก module** ในแพ็กเกจ (customer/quotation/po/so/stock/bom/production/supply-planning/pr/supplier/settings) เข้ากับ permission bit ที่ต้องมี. **★ G9 (ปอนด์ 2026-07-29):** ทุกปุ่ม/action ที่ permission-gate ต้อง **แสดงรหัสสิทธิ์เป็น suffix ต่อท้าย label** เช่น "บันทึก (C)", "อนุมัติ (A)", "ตั้งค่า VAT (Ad)". **รหัสสาธารณะมี 6 ตัวเป๊ะ: R / C / U / D / A / Ad** — โดย **Ad = Admin** (คือ A ตัวที่สองของ RUCDAA); **ไม่มี capability "Archive" แยก** — undelete/restore/force-override = ส่วนหนึ่งของ Admin (Ad). คอลัมน์ **"Suffix"** ในตาราง §3 คือรหัสที่ UX/UI ต้องเอาไปต่อท้ายปุ่มจริง. **★★ 2026-07-29:** G9 sweep พบ 9 controls ที่รหัสกำกวม → **ตัดสินครบใน §3.1 (single authority)**; controls ที่รวมหลาย action ในปุ่มเดียว = **value/mode-dependent gating** (ปุ่มเดียวถือรหัสตามค่า/โหมดที่เลือก); **print/แชร์เอกสาร = (R)** (ไม่ mutate); **comment save = U ของ object แม่**.

---

## 1. RUCDAA bits (internal model) → 6 public codes
| bit (internal) | public code (suffix) | ความหมาย |
|---|---|---|
| **R** Read | **(R)** | ดู/ค้น/รายงาน · **พิมพ์/แชร์ PDF (ไม่ mutate)** |
| **U** Update | **(U)** | แก้ข้อมูล/เปลี่ยนสถานะปกติ · **แก้ sub-record (ผู้ติดต่อ/comment/threshold)** |
| **C** Create | **(C)** | สร้างเอกสาร/record/master ใหม่ |
| **D** Delete | **(D)** | soft-delete / void / **ปิดใช้งาน (inactivate)** (เอกสารการค้า = void) |
| **A** Approve | **(A)** | อนุมัติ/สิทธิ์ระดับสูง (เช่น Blacklist, reassign, reopen) |
| **Admin** | **(Ad)** | จัดการ config/force override/undelete/restore · **★ gate VAT/Company/Audit** |

### ★ Code-set reconciliation (RUCDAA + Admin → R/C/U/D/A/Ad) — SETTLED
- โมเดลภายในเดิมเรียก **RUCDAA** = **R**ead · **U**pdate · **C**reate · **D**elete · **A**pprove · **A**dmin. ตัว **A ตัวที่สอง = Admin** (ไม่ใช่ "Archive").
- **6 รหัสสาธารณะ (public suffix) = R, C, U, D, A, Ad** เป๊ะ. Admin ปรากฏบน UI เป็น **(Ad)** เพื่อไม่ชนกับ (A)=Approve.
- **ไม่มี capability "Archive" หรือ bit ที่เจ็ดใด ๆ** ในโมเดล. งานลักษณะ archive/undelete/restore/force-override/undelete-role = **อยู่ภายใต้ Admin = (Ad)** ทั้งหมด (ดู §3 rows: undelete customer/user/role, PO force override).
- ลำดับที่แสดงต่อผู้ใช้ = **R · C · U · D · A · Ad** (จัดเรียงตามระดับสิทธิ์เชิงตรรกะ). *(ไม่ต้องถามปอนด์ — ตรง requirement, ไม่ ambiguous.)*

---

## 1b. ★ G9 — Permission-code suffix on every permissioned control (GLOBAL RULE)

> **G9 (ปอนด์ 2026-07-29):** ทุก **actionable control ที่ถูก permission-gate** (ปุ่ม / เมนู / row-action / tab-action) **ต้องแสดงรหัส permission เป็น suffix ต่อท้าย label** เพื่อให้ผู้ใช้รู้ว่าต้องมีสิทธิ์อะไรจึงจะกดได้.

**รูปแบบ:** `‹label› (‹code›)` — เช่น `บันทึก (C)` · `แก้ไข (U)` · `ลบ (D)` · `อนุมัติ (A)` · `ตั้งค่า VAT (Ad)` · `มอบหมาย Sale (A)`.

**กติกา:**
1. **รหัสที่ใช้ได้มี 6 ตัวเท่านั้น: R · C · U · D · A · Ad** (ตาม §1). ห้ามคิดรหัสใหม่นอกชุดนี้.
2. **Read-only view / ปุ่มดูเฉย ๆ** ละ **(R)** ได้ เว้นแต่การแสดงจะมีประโยชน์ (เช่น ปุ่ม "ดู Audit log (Ad)" ที่ gate ด้วย Admin — ต้องแสดง). **ปุ่มพิมพ์/แชร์ PDF = (R) และควรแสดง (R)** เพื่อความชัดเจน (ดู §3.1 #9).
3. **Action ที่ต้องถือหลาย permission (cross-module)** แสดง **ครบทุกรหัส** คั่นด้วย `+` เช่น `แปลงเป็น PO (U+C)` (Quotation.U + PO.C) · `สั่งผลิต (C)` (Supply Planning.C → ปลายทาง SO/Production.C). ให้แสดงรหัสของ **capability ที่ผู้ใช้กำลังกระทำบนหน้านั้น** ก่อน แล้วตามด้วย dependency.
4. **การ gate จริง** (แสดง/ซ่อน/disable ปุ่ม) ยังยึด permission ตาม §3 เหมือนเดิม — suffix เป็น **label ประกอบสายตา**เพิ่มเข้ามา ไม่เปลี่ยน logic การ gate.
5. **แหล่งอ้างอิงรหัส** = ตาราง §3 + **§3.1 (ambiguous-control resolutions)** — UX/UI เอารหัสจากที่นี่ไปต่อท้ายปุ่มที่ตรงกัน.
6. **★★ Value/mode-dependent control (ปุ่มเดียวหลาย action):** ปุ่ม save 1 ปุ่มที่ผลลัพธ์ขึ้นกับค่า/โหมดที่เลือก (เช่น dropdown สถานะ) → **gate ตามค่า/โหมดที่เลือกจริง**; suffix แสดงรหัสของค่าที่เลือก หรือแสดงเซ็ตคั่นด้วย `/` เมื่อ label เดียวครอบหลายกรณี (เช่น `(U/A)`, `(D/A/Ad)`). รายละเอียดต่อ control ดู §3.1.

**ตัวอย่าง label ที่ถูกต้อง:** `สร้างลูกค้า (C)` · `ยืนยัน PO (U)` · `ยกเลิก SO (D)` · `ตั้ง Blacklist (A)` · `ตัดสิน QC (U)` · `สร้าง role (Ad)` · `ลบ role (D)` · `รีเซ็ตรหัสผ่าน (Ad)` · `ปรับยอดสต็อก (U)` · `รับเข้าคลัง / Goods Receipt (C)`.

---

## 2. Modules ในระบบ (มี 3 module ใหม่)
Customer · **Quotation (ใหม่)** · PO · **SO (ใหม่)** · **Supply Planning (ใหม่)** · BOM · Warehouse/Stock (+ Return + Goods Receipt) · Production · QC · Shipping · Invoice · PR · Supplier · Settings/User-Role.

## 3. ★ Consolidated capability → action → permission → **Suffix (G9)**
> คอลัมน์ **Suffix** = รหัสที่ UX/UI ต้องต่อท้าย label ปุ่มจริง (G9). Admin → **(Ad)**.

| Module | ปุ่ม/action | Permission required | **Suffix (G9)** |
|---|---|---|---|
| **Customer** | ดู list/detail/history · modal detail | Customer.R | (R) *(ละได้)* |
| | สร้างลูกค้า | Customer.C | **(C)** |
| | แก้ (TYPE/credit term/ผู้ติดต่อ) · เปลี่ยนสถานะปกติ · **เพิ่ม/ลบผู้ติดต่อ (contact sub-record)** · **ตั้ง/ล้าง ⚑ ต้องติดตาม (follow-up flag)** | Customer.U | **(U)** |
| | ตั้ง Disabled/Blacklist · **reassign/มอบหมาย/ล้าง Sale ที่ดูแล (รวมมอบหมายลูกค้าที่ unassigned)** | Customer.A | **(A)** |
| | **บันทึกสถานะ (ปุ่มเดียว value-dependent: ปกติ=U / Disabled·Blacklist=A)** | Customer.U ↔ Customer.A (ตามค่าที่เลือก) | **(U/A)** |
| | soft-delete | Customer.D | **(D)** |
| | undelete/restore | Customer.Admin | **(Ad)** |
| **Quotation** | ดู list/detail/print-ready · material check | Quotation.R | (R) *(ละได้)* |
| | **พิมพ์/ส่งลูกค้า QT (print/share PDF, ไม่เปลี่ยนสถานะ)** | Quotation.**R** | **(R)** |
| | สร้าง QT (เวอร์ชันใหม่) | Quotation.C | **(C)** |
| | แก้ QT · ตั้งสถานะ ปฏิเสธ (Rejected) | Quotation.U | **(U)** |
| | **Convert to PO (→ Confirmed)** | Quotation.U **+ PO.C** | **(U+C)** |
| | ยกเลิก QT (ทุกสถานะ) + เหตุผลบังคับ | Quotation.D / Quotation.A | **(D)** / **(A)** |
| **PO** | ดู list/detail | PO.R | (R) *(ละได้)* |
| | เปิด PO ใหม่ | PO.C | **(C)** |
| | แก้ (Draft/Hold) | PO.U | **(U)** |
| | ยืนยัน PO (จองวัตถุดิบ) | PO.U | **(U)** |
| | ยกเลิก | PO.D | **(D)** |
| | reopen | PO.A | **(A)** |
| | force override สถานะ | PO.Admin | **(Ad)** |
| | **บันทึกการเปลี่ยนสถานะ… (ปุ่มเดียว value-dependent: ยกเลิก=D / reopen=A / force-override=Ad)** | PO.D ↔ PO.A ↔ PO.Admin (ตามตัวเลือกที่เลือก) | **(D/A/Ad)** |
| **SO** | ดู list/detail | SO.R | (R) *(ละได้)* |
| | สร้าง SO (ก/ข) | SO.C | **(C)** |
| | แก้ SO (ก/ข) | SO.U | **(U)** |
| | ยืนยันใบสั่งขาย (จอง FG) **[โหมด ก]** | SO.U | **(U)** |
| | ยืนยันผลิตเก็บสต็อก (→ PRD) **[โหมด ข]** | SO.C | **(C)** |
| | ยกเลิก SO (คืนจอง) | SO.D / SO.A | **(D)** / **(A)** |
| **Supply Planning** | ดู/ค้น/filter | Supply Planning.R | (R) *(ละได้)* |
| | แก้ rate/lead/cover → save back BOM | Supply Planning.U | **(U)** |
| | ปุ่ม "สั่งผลิต" (prefill SO produce-to-stock) | Supply Planning.C (ปลายทางสร้าง PRD = SO/Production.C) | **(C)** |
| **BOM** | ดู | BOM.R | (R) *(ละได้)* |
| | สร้าง | BOM.C | **(C)** |
| | แก้สูตร/ต้นทุนอื่น/TYPE/ราคาขาย/planning config · **บันทึกกลับ BOM (save-back)** | BOM.U | **(U)** |
| | **ปิดใช้งาน / Inactivate (แทน hard-delete)** | BOM.D | **(D)** |
| | **เปิดใช้งานอีกครั้ง / Reactivate (Inactive → Active)** | BOM.U | **(U)** |
| | soft-delete | BOM.D | **(D)** |
| **Warehouse/Stock** | ดู stock (RM/FG) + ledger | Stock.R | (R) *(ละได้)* |
| | ปรับยอด FG/RM (adjust) · loss (warehouse) · **คืนวัตถุดิบ (Return)** | Stock.U (+ เหตุผลบังคับ) | **(U)** |
| | **ตั้ง/แก้เกณฑ์ near-empty threshold (RM)** | Stock.U | **(U)** |
| | **เพิ่มวัตถุดิบใหม่ (create RM master)** | Stock.C | **(C)** |
| | Goods Receipt (รับเข้าคลัง) | Stock.C | **(C)** |
| **Production** | ดูคิว/PRD/Batch | Production.R | (R) *(ละได้)* |
| | รับงาน · เริ่มผลิต · actual qty · พร้อมส่ง · rework · Hold · loss (production) · **ปรับสถานะ** | Production.U | **(U)** |
| **QC** | ตัดสิน QC (ผ่าน/ไม่ผ่าน+feedback) — RM ตรวจรับ + Batch | QC.U | **(U)** |
| **Shipping** | สร้างรอบ/DN (อ้าง PO หรือ SO) | Shipping.C | **(C)** |
| **Invoice** | ออก invoice (อ้าง PO หรือ SO) | Invoice.C | **(C)** |
| | รับชำระ/อัปเดตสถานะชำระ | Invoice.U | **(U)** |
| | **พิมพ์ invoice / ใบกำกับ (print PDF, ไม่ mutate)** | Invoice.**R** | **(R)** |
| **PR** | ดู list/detail | PR.R | (R) *(ละได้)* |
| | เปิด PR ด้วยมือ (manual) | PR.C | **(C)** |
| | แก้ PR / ยืนยัน / ปิด | PR.U | **(U)** |
| | ยกเลิก PR | PR.D / PR.A | **(D)** / **(A)** |
| **Supplier** | ดู list/detail/price-matrix | Supplier.R | (R) *(ละได้)* |
| | สร้าง supplier | Supplier.C | **(C)** |
| | แก้ข้อมูล/price-matrix · สลับ Active/Inactive | Supplier.U | **(U)** |
| | soft-delete | Supplier.D | **(D)** |
| **Settings/User-Role** | **ดูแท็บ Role/User** (list/detail) · **★ ค้นหา role · ค้นหา user (ชื่อ-สกุล/username)** | Settings.**R** | (R) *(ละได้)* |
| | สร้าง role/มัดสิทธิ์ (edit permission-matrix) | Settings.**Admin** | **(Ad)** |
| | **★ Disable/Enable role · Restore role · ถอด user ออกจาก role** | Settings.**Admin** | **(Ad)** |
| | **★ Soft-delete role** (+ เหตุผล) | Settings.**D** | **(D)** |
| | จัดการ user (create/edit/สลับ Active/เปลี่ยน role) · **★ ตั้ง/รีเซ็ตรหัส + password mode · ผูก/ยกเลิก Google link** | Settings.**Admin** | **(Ad)** |
| | **★ ลบ user (→ ลูกค้าที่ดูแลกลายเป็น Sale ว่าง/unassigned อัตโนมัติ; ไม่ bulk-reassign)** | Settings.**D** | **(D)** |
| | undelete/restore user/role | Settings.**Admin** | **(Ad)** |
| | **★ ดู/แก้ VAT** | Settings.**Admin only** *(เดิม U)* | **(Ad)** |
| | **★ ดู/แก้ ข้อมูลบริษัท** | Settings.**Admin only** *(เดิม U)* | **(Ad)** |
| | **★ ดู Audit log** | Settings.**Admin only** *(เดิม R)* | **(Ad)** |
| **G6 (ทุก object)** | **บันทึกหมายเหตุ / comment (💾)** | **= U ของ object แม่** (ไม่มี capability "comment" แยก) | **(U)** *(รหัสตาม object แม่)* |

> **หมายเหตุ suffix สำหรับ action ที่มี 2 รหัส** (เช่น "ยกเลิก QT (D)/(A)"): ปุ่มจริง 1 ปุ่มถือ permission เดียว → แสดงรหัสของสิทธิ์ที่ผูกกับปุ่มนั้นในบริบทหน้าจอ. ถ้า UI เปิดให้ทำ action เดียวได้ด้วยหลายสิทธิ์ (เช่น void ทำได้ทั้ง D และ A) ให้แสดงรหัสที่ตรงกับสิทธิ์ที่ผู้ใช้คนนั้นถืออยู่ หรือ default = รหัสแรกในตาราง.

---

## 3.1 ★★ G9 sweep — 9 ambiguous controls **SETTLED** (2026-07-29, PO = single authority)
> ทั้ง 9 controls ที่ UX/UI G9 sweep แจ้งว่ารหัสกำกวม — ตัดสินเด็ดขาดที่นี่. **"UX label fix"** = mockup ปัจจุบันติดรหัสไม่ตรง ต้องแก้ suffix (ส่งเป็น punch-list ให้ UX/UI; ไม่แก้ mockup ในงานนี้).

| # | Control (หน้า) | UX tentative | **PO ruling** | Suffix | Split? | UX label fix? |
|---|---|---|---|---|---|---|
| 1 | customer-detail **"บันทึกสถานะ"** | (U/A) | **คงปุ่มเดียว, value-dependent gating**: สถานะปกติ = Customer.U; Disabled/Blacklist = Customer.A. ไม่แยกปุ่ม (Disabled/Blacklist ถูก gate ที่ระดับ *ค่า* ใน dropdown — เลือกค่าเสี่ยงต้องมี A) | **(U/A)** | ไม่ | **ไม่** (UX ถูก) |
| 2 | po-detail **"บันทึกการเปลี่ยนสถานะ…"** | (D/A/Ad) | **คงปุ่มเดียว, value-dependent gating**: ยกเลิก = PO.D · reopen = PO.A · force-override = PO.Admin. ปุ่มถือรหัสตามตัวเลือกที่เลือก; ตัวเลือกที่ผู้ใช้ไม่มีสิทธิ์ = disabled | **(D/A/Ad)** | ไม่ | **ไม่** (UX ถูก) |
| 3 | so-create **"ยืนยันใบสั่งขาย (จอง FG)"** | (U) | **mode-dependent**: โหมด ก (จอง FG) = SO.U → (U); โหมด ข (ผลิตเก็บสต็อก) = SO.C → (C). **label ต้องเปลี่ยนตามโหมด** (ก = "ยืนยันใบสั่งขาย (จอง FG) (U)" · ข = "ยืนยันผลิตเก็บสต็อก (C)") | **(U)** ก / **(C)** ข | ไม่ (ปุ่มเดียว mode-dependent) | **ใช่** — โหมด ข ต้องเป็น **(C)** ไม่ใช่ (U) |
| 4 | customer-detail **"⚑ ต้องติดตาม" set/clear** | (U) | **Customer.U** — เป็นการแก้ customer record | **(U)** | — | ไม่ (UX ถูก; เพิ่มแถวใน §3 แล้ว) |
| 5 | G6 **"💾 บันทึกหมายเหตุ"** (ทุก object) | U ของ object แม่ | **ยืนยัน**: comment field = **U ของ object แม่** (ไม่มี capability "comment" แยก) — เช่น comment บน PO = PO.U, บน customer = Customer.U | **(U)** *(ตาม object แม่)* | — | ไม่ (UX ถูก; เพิ่มแถว G6 + note §4) |
| 6 | stock **"เพิ่มวัตถุดิบใหม่"** + **"ตั้งเกณฑ์ near-empty"** | C / U | **เพิ่มวัตถุดิบใหม่ (create RM master) = Stock.C** → (C) · **ตั้ง/แก้ threshold = Stock.U** → (U) | **(C)** / **(U)** | — | ไม่ (UX ถูก; เพิ่ม 2 แถวใน §3 แล้ว) |
| 7 | customer-edit contact **"ลบ"** | (U) | **Customer.U** — ผู้ติดต่อเป็น sub-record ใต้ customer, ไม่ใช่เอกสารอิสระ → เพิ่ม/ลบผู้ติดต่อ = การแก้ customer (U). **ไม่ใช้ (D)** (D สงวนไว้ให้ soft-delete ตัว customer) | **(U)** | — | ไม่ (UX ถูก) |
| 8 | bom **"ปิดใช้งาน"** / reactivate | ปิด=(D), reactivate=(U)? | **ยืนยัน**: ปิดใช้งาน/Inactivate = **BOM.D** → (D) (Inactive แทน hard-delete = การ "ลบ" เชิงตรรกะ) · **Reactivate (Inactive→Active) = BOM.U** → (U) (เป็นการแก้สถานะปกติ, **ไม่ใช่ Ad**) | ปิด **(D)** / reactivate **(U)** | — | ไม่ (UX ถูก; เพิ่มแถว reactivate ใน §3 แล้ว) |
| 9 | Print buttons (quotation print/share · invoice print) | QT=(U), invoice=uncoded | **print/แชร์ = (R)** ทั้ง QT และ invoice — พิมพ์/แชร์ PDF = read-derived, ไม่ mutate ข้อมูล/สถานะ (Quotation ไม่มีสถานะ "Sent"). ใช้ **(R) เหมือนกันทั้งคู่** และ **แสดง (R)** (ข้อยกเว้นตาม G9 กติกา 2 — print ควรโชว์รหัส) | **(R)** ทั้งคู่ | — | **ใช่** — quotation print/share **(U) → (R)**; invoice print = **(R)** (ใส่รหัสที่ยังว่าง) |

**สรุป UX label-fix punch-list (2 รายการ):**
1. **so-create** — ปุ่ม confirm ในโหมด ข "ผลิตเก็บสต็อก": suffix ต้องเป็น **(C)** (ปัจจุบันติด (U)). โหมด ก คง (U).
2. **quotation** print/share (และ **invoice** print): suffix = **(R)** — QT เปลี่ยนจาก (U)→(R); invoice ใส่ (R) (เดิมยังไม่มีรหัส).

*(ไม่มีอะไรต้องถามปอนด์: #1/#2 = คงปุ่มรวมแบบ value-dependent → ไม่เปลี่ยน mockup, ไม่ใช่การ split ที่ต้องตัดสินเชิง product; ที่เหลือ map ตรงกับ RUCDAA. — PO)*

## 4. หมายเหตุ (D14)
- **surplus (D13)** = auto ตอน "พร้อมส่ง" + remark → **ไม่มี permission แยก** (ไม่ใช่ approval) → **ไม่มี suffix** (ไม่ใช่ปุ่มที่ gate).
- **★ Quotation (2026-07-29):** ไม่มีสถานะ "ส่งแล้ว (Sent)" — การส่งใบเสนอราคา = print/share (**Quotation.R → (R)**, ★แก้จากเดิม U 2026-07-29 §3.1 #9) ไม่เปลี่ยนสถานะ · Convert-to-PO ตั้ง QT = ยืนยัน (Confirmed) ทันที.
- **★★ Comment/หมายเหตุ (G6, 2026-07-29 §3.1 #5):** ช่อง comment/หมายเหตุ ของทุก object **ไม่มี capability แยก** — บันทึก comment = **Update (U) ของ object แม่นั้น ๆ** (comment บน PO ใช้ PO.U, บน customer ใช้ Customer.U ฯลฯ). suffix = **(U)** โดยรหัสอ้างอิง object ที่ comment แปะอยู่.
- **★★ Print/แชร์เอกสาร (2026-07-29 §3.1 #9):** พิมพ์/แชร์ PDF (QT, invoice, และเอกสารอื่น) = **Read (R)** — ไม่ mutate ข้อมูล/สถานะ. ใช้ **(R)** สม่ำเสมอทุก module และ **แสดง (R)** บนปุ่ม. *(ถ้าภายหลังปอนด์ต้องการจำกัดเอกสารที่ส่งออกหาลูกค้าให้เฉพาะผู้แก้ไขได้ = bump เป็น U ได้ — ค่า default ปัจจุบัน = R)*
- **★★ Value/mode-dependent controls (2026-07-29 §3.1 #1/#2/#3):** ปุ่ม save ปุ่มเดียวที่ครอบหลาย action (customer "บันทึกสถานะ" = U/A · po "บันทึกการเปลี่ยนสถานะ" = D/A/Ad · so-create confirm = U[ก]/C[ข]) → **gate ตามค่า/โหมดที่เลือกจริง**, ไม่ต้อง split ปุ่ม; suffix แสดงเป็นเซ็ต (เช่น (U/A)) หรือรหัสของโหมดปัจจุบัน (so-create).
- **★ Settings (2026-07-29 — Settings review):** **VAT / ข้อมูลบริษัท / Audit-log = Admin bit เท่านั้น** (ข้อมูลไวต่อความปลอดภัย/การเงิน; เดิม VAT/Company=U, Audit=R) · **effective permission = union ของ role ที่ Active เท่านั้น** (role Disabled/Deleted ไม่ grant; settings.md §4b) · **role disable/soft-delete ทำได้แม้มีสมาชิก** (member เสีย permission โดยกลไก — deletion-policy §2.14).
- **★ ลบ Sale/User (2026-07-29 — resolve US-SET-02):** ลบ user = **Settings.D** → **ลูกค้าที่ Sale คนนั้นดูแลถูกล้าง assigned-Sale เป็นว่าง (unassigned) อัตโนมัติ** — **ไม่ต้อง bulk-reassign, ไม่มีหน้า bulk-reassign** (supersede กฎเดิม); **มอบหมาย Sale ใหม่ภายหลัง = Customer.Approve** (customer.md §4.3/§8 · deletion-policy §2.15).
- **★ G9 (2026-07-29):** ทุกปุ่มที่ permission-gate แสดงรหัสตามคอลัมน์ **Suffix** ต่อท้าย label; รหัสมี 6 ตัว (R/C/U/D/A/Ad); Admin=**(Ad)**; **ไม่มี Archive แยก** (undelete/restore/force-override = Ad).
- แต่ละ capability **grant แยกได้อิสระ**; role ใด ๆ ที่ถือ permission ตรงก็ทำได้ (เช่น AR/Sale เปิด PO/Quotation ได้ถ้ามีสิทธิ์).
- Cross-module actions (Convert to PO = Quotation.U + PO.C → suffix **(U+C)**; สั่งผลิต = Supply Planning.C → SO/Production.C → suffix **(C)**) ต้องถือ **ทั้งสอง** permission.
- `settings.html` เพิ่มแถว RUCDAA ของ **Quotation, SO, Supply Planning**.

## 5. Cross-links
ต่อ module: customer/quotation/po/so/stock/bom/production/supply-planning/pr/supplier §Actions & Permissions · deletion-policy §3 (สิทธิ์ลบ) · **deletion-policy §2.15 (ลบ Sale → ลูกค้า unassigned)** · **settings.md §6/§4b/§4c (Settings actions + role lifecycle + delete-Sale→unassign)** · **customer.md §4.3/§8 (assigned Sale nullable + reassign)** · non-functional §2 (A6/A7/A8 auth/Google/Admin-gate) · scope §7.1 · **README §3 G9 (permission-code suffix) + §8 (UX/UI sweep task)** · **§3.1 (G9 9-control resolutions)**.
