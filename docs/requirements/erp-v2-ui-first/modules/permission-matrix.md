# Permission Matrix — Capability → Module → Action (consolidated)

slug: `erp-v2-ui-first` · per-module canonical · PO · 2026-07-29 · **★ G9 permission-code suffix + authoritative action→code map added (2026-07-29)**
กฎอ้างอิง: **D14** (RBAC generic, permission-per-module/capability, ไม่ fix role) · **D17** · scope §7.1 (ต่อยอด) · **★ Settings module review 2026-07-29 (VAT/Company/Audit = Admin only; role disable/soft-delete; user password/Google-link)** · **★ Sale delete → customers unassigned/blank (ปอนด์ 2026-07-29, resolve US-SET-02)** · **★ G9 permission-code suffix on labels (ปอนด์ 2026-07-29)**

## สรุปภาษาไทย
RBAC เป็น **generic** — บังคับสิทธิ์ที่ระดับ **module/capability** (โมเดล RUCDAA: Read/Update/Create/Delete/Approve/Admin ต่อ module), ไม่ hardcode ชื่อ role. ใครถือ permission ตรงก็ทำได้; สร้าง role/มัดสิทธิ์ = admin config ใน Settings. ตารางนี้รวม **ทุกปุ่ม/action ของทุก module** ในแพ็กเกจ (customer/quotation/po/so/stock/bom/production/supply-planning/pr/supplier/settings) เข้ากับ permission bit ที่ต้องมี. **★ G9 (ปอนด์ 2026-07-29):** ทุกปุ่ม/action ที่ permission-gate ต้อง **แสดงรหัสสิทธิ์เป็น suffix ต่อท้าย label** เช่น "บันทึก (C)", "อนุมัติ (A)", "ตั้งค่า VAT (Ad)". **รหัสสาธารณะมี 6 ตัวเป๊ะ: R / C / U / D / A / Ad** — โดย **Ad = Admin** (คือ A ตัวที่สองของ RUCDAA); **ไม่มี capability "Archive" แยก** — undelete/restore/force-override = ส่วนหนึ่งของ Admin (Ad). คอลัมน์ **"Suffix"** ในตาราง §3 คือรหัสที่ UX/UI ต้องเอาไปต่อท้ายปุ่มจริง.

---

## 1. RUCDAA bits (internal model) → 6 public codes
| bit (internal) | public code (suffix) | ความหมาย |
|---|---|---|
| **R** Read | **(R)** | ดู/ค้น/รายงาน |
| **U** Update | **(U)** | แก้ข้อมูล/เปลี่ยนสถานะปกติ |
| **C** Create | **(C)** | สร้างเอกสาร/record ใหม่ |
| **D** Delete | **(D)** | soft-delete / void (เอกสารการค้า = void) |
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
2. **Read-only view / ปุ่มดูเฉย ๆ** ละ **(R)** ได้ เว้นแต่การแสดงจะมีประโยชน์ (เช่น ปุ่ม "ดู Audit log (Ad)" ที่ gate ด้วย Admin — ต้องแสดง).
3. **Action ที่ต้องถือหลาย permission (cross-module)** แสดง **ครบทุกรหัส** คั่นด้วย `+` เช่น `แปลงเป็น PO (U+C)` (Quotation.U + PO.C) · `สั่งผลิต (C)` (Supply Planning.C → ปลายทาง SO/Production.C). ให้แสดงรหัสของ **capability ที่ผู้ใช้กำลังกระทำบนหน้านั้น** ก่อน แล้วตามด้วย dependency.
4. **การ gate จริง** (แสดง/ซ่อน/disable ปุ่ม) ยังยึด permission ตาม §3 เหมือนเดิม — suffix เป็น **label ประกอบสายตา**เพิ่มเข้ามา ไม่เปลี่ยน logic การ gate.
5. **แหล่งอ้างอิงรหัส** = ตาราง §3 (คอลัมน์ **Suffix**) — UX/UI เอารหัสจากตารางนี้ไปต่อท้ายปุ่มที่ตรงกัน.

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
| | แก้ (TYPE/credit term/ผู้ติดต่อ) · เปลี่ยนสถานะปกติ | Customer.U | **(U)** |
| | ตั้ง Disabled/Blacklist · **reassign/มอบหมาย/ล้าง Sale ที่ดูแล (รวมมอบหมายลูกค้าที่ unassigned)** | Customer.A | **(A)** |
| | soft-delete | Customer.D | **(D)** |
| | undelete/restore | Customer.Admin | **(Ad)** |
| **Quotation** | ดู list/detail/print-ready · material check | Quotation.R | (R) *(ละได้)* |
| | สร้าง QT (เวอร์ชันใหม่) | Quotation.C | **(C)** |
| | แก้ QT · ตั้งสถานะ ปฏิเสธ (Rejected) · พิมพ์/ส่งลูกค้า (print/share, ไม่เปลี่ยนสถานะ) | Quotation.U | **(U)** |
| | **Convert to PO (→ Confirmed)** | Quotation.U **+ PO.C** | **(U+C)** |
| | ยกเลิก QT (ทุกสถานะ) + เหตุผลบังคับ | Quotation.D / Quotation.A | **(D)** / **(A)** |
| **PO** | ดู list/detail | PO.R | (R) *(ละได้)* |
| | เปิด PO ใหม่ | PO.C | **(C)** |
| | แก้ (Draft/Hold) | PO.U | **(U)** |
| | ยืนยัน PO (จองวัตถุดิบ) | PO.U | **(U)** |
| | ยกเลิก | PO.D | **(D)** |
| | reopen | PO.A | **(A)** |
| | force override สถานะ | PO.Admin | **(Ad)** |
| **SO** | ดู list/detail | SO.R | (R) *(ละได้)* |
| | สร้าง SO (ก/ข) | SO.C | **(C)** |
| | แก้ SO (ก/ข) | SO.U | **(U)** |
| | ยืนยันใบสั่งขาย (จอง FG) [ก] | SO.U | **(U)** |
| | ยืนยันผลิตเก็บสต็อก (→ PRD) [ข] | SO.C | **(C)** |
| | ยกเลิก SO (คืนจอง) | SO.D / SO.A | **(D)** / **(A)** |
| **Supply Planning** | ดู/ค้น/filter | Supply Planning.R | (R) *(ละได้)* |
| | แก้ rate/lead/cover → save back BOM | Supply Planning.U | **(U)** |
| | ปุ่ม "สั่งผลิต" (prefill SO produce-to-stock) | Supply Planning.C (ปลายทางสร้าง PRD = SO/Production.C) | **(C)** |
| **BOM** | ดู | BOM.R | (R) *(ละได้)* |
| | สร้าง | BOM.C | **(C)** |
| | แก้สูตร/ต้นทุนอื่น/TYPE/ราคาขาย/planning config · **บันทึกกลับ BOM (save-back)** | BOM.U | **(U)** |
| | soft-delete | BOM.D | **(D)** |
| **Warehouse/Stock** | ดู stock (RM/FG) + ledger | Stock.R | (R) *(ละได้)* |
| | ปรับยอด FG/RM (adjust) · loss (warehouse) · **คืนวัตถุดิบ (Return)** | Stock.U (+ เหตุผลบังคับ) | **(U)** |
| | Goods Receipt (รับเข้าคลัง) | Stock.C | **(C)** |
| **Production** | ดูคิว/PRD/Batch | Production.R | (R) *(ละได้)* |
| | รับงาน · เริ่มผลิต · actual qty · พร้อมส่ง · rework · Hold · loss (production) · **ปรับสถานะ** | Production.U | **(U)** |
| **QC** | ตัดสิน QC (ผ่าน/ไม่ผ่าน+feedback) — RM ตรวจรับ + Batch | QC.U | **(U)** |
| **Shipping** | สร้างรอบ/DN (อ้าง PO หรือ SO) | Shipping.C | **(C)** |
| **Invoice** | ออก invoice (อ้าง PO หรือ SO) | Invoice.C | **(C)** |
| | รับชำระ/อัปเดตสถานะชำระ | Invoice.U | **(U)** |
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

> **หมายเหตุ suffix สำหรับ action ที่มี 2 รหัส** (เช่น "ยกเลิก QT (D)/(A)"): ปุ่มจริง 1 ปุ่มถือ permission เดียว → แสดงรหัสของสิทธิ์ที่ผูกกับปุ่มนั้นในบริบทหน้าจอ. ถ้า UI เปิดให้ทำ action เดียวได้ด้วยหลายสิทธิ์ (เช่น void ทำได้ทั้ง D และ A) ให้แสดงรหัสที่ตรงกับสิทธิ์ที่ผู้ใช้คนนั้นถืออยู่ หรือ default = รหัสแรกในตาราง.

## 4. หมายเหตุ (D14)
- **surplus (D13)** = auto ตอน "พร้อมส่ง" + remark → **ไม่มี permission แยก** (ไม่ใช่ approval) → **ไม่มี suffix** (ไม่ใช่ปุ่มที่ gate).
- **★ Quotation (2026-07-29):** ไม่มีสถานะ "ส่งแล้ว (Sent)" — การส่งใบเสนอราคา = print/share (Quotation.R/U) ไม่เปลี่ยนสถานะ · Convert-to-PO ตั้ง QT = ยืนยัน (Confirmed) ทันที.
- **★ Settings (2026-07-29 — Settings review):** **VAT / ข้อมูลบริษัท / Audit-log = Admin bit เท่านั้น** (ข้อมูลไวต่อความปลอดภัย/การเงิน; เดิม VAT/Company=U, Audit=R) · **effective permission = union ของ role ที่ Active เท่านั้น** (role Disabled/Deleted ไม่ grant; settings.md §4b) · **role disable/soft-delete ทำได้แม้มีสมาชิก** (member เสีย permission โดยกลไก — deletion-policy §2.14).
- **★ ลบ Sale/User (2026-07-29 — resolve US-SET-02):** ลบ user = **Settings.D** → **ลูกค้าที่ Sale คนนั้นดูแลถูกล้าง assigned-Sale เป็นว่าง (unassigned) อัตโนมัติ** — **ไม่ต้อง bulk-reassign, ไม่มีหน้า bulk-reassign** (supersede กฎเดิม); **มอบหมาย Sale ใหม่ภายหลัง = Customer.Approve** (customer.md §4.3/§8 · deletion-policy §2.15).
- **★ G9 (2026-07-29):** ทุกปุ่มที่ permission-gate แสดงรหัสตามคอลัมน์ **Suffix** ต่อท้าย label; รหัสมี 6 ตัว (R/C/U/D/A/Ad); Admin=**(Ad)**; **ไม่มี Archive แยก** (undelete/restore/force-override = Ad).
- แต่ละ capability **grant แยกได้อิสระ**; role ใด ๆ ที่ถือ permission ตรงก็ทำได้ (เช่น AR/Sale เปิด PO/Quotation ได้ถ้ามีสิทธิ์).
- Cross-module actions (Convert to PO = Quotation.U + PO.C → suffix **(U+C)**; สั่งผลิต = Supply Planning.C → SO/Production.C → suffix **(C)**) ต้องถือ **ทั้งสอง** permission.
- `settings.html` เพิ่มแถว RUCDAA ของ **Quotation, SO, Supply Planning**.

## 5. Cross-links
ต่อ module: customer/quotation/po/so/stock/bom/production/supply-planning/pr/supplier §Actions & Permissions · deletion-policy §3 (สิทธิ์ลบ) · **deletion-policy §2.15 (ลบ Sale → ลูกค้า unassigned)** · **settings.md §6/§4b/§4c (Settings actions + role lifecycle + delete-Sale→unassign)** · **customer.md §4.3/§8 (assigned Sale nullable + reassign)** · non-functional §2 (A6/A7/A8 auth/Google/Admin-gate) · scope §7.1 · **README §3 G9 (permission-code suffix) + §8 (UX/UI sweep task)**.
