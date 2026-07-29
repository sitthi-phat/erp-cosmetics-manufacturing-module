# Permission Matrix — Capability → Module → Action (consolidated)

slug: `erp-v2-ui-first` · per-module canonical · PO · 2026-07-29
กฎอ้างอิง: **D14** (RBAC generic, permission-per-module/capability, ไม่ fix role) · **D17** · scope §7.1 (ต่อยอด) · **★ Settings module review 2026-07-29 (VAT/Company/Audit = Admin only; role disable/soft-delete; user password/Google-link)** · **★ Sale delete → customers unassigned/blank (ปอนด์ 2026-07-29, resolve US-SET-02)**

## สรุปภาษาไทย
RBAC เป็น **generic** — บังคับสิทธิ์ที่ระดับ **module/capability** (โมเดล RUCDAA: Read/Update/Create/Delete/Approve/Admin ต่อ module), ไม่ hardcode ชื่อ role. ใครถือ permission ตรงก็ทำได้; สร้าง role/มัดสิทธิ์ = admin config ใน Settings. ตารางนี้รวม **ทุกปุ่ม/action ของทุก module** ในแพ็กเกจ (customer/quotation/po/so/stock/bom/production/supply-planning) เข้ากับ permission bit ที่ต้องมี. เพิ่ม 3 module ใหม่ในตาราง RUCDAA ของ Settings: **Quotation, SO, Supply Planning**. **★ Settings review 2026-07-29:** VAT/ข้อมูลบริษัท/Audit-log = **Admin bit เท่านั้น** · role disable/enable/soft-delete/restore/remove-user + user password/Google-link = **Admin**. **★ ลบ user (Sale) = Settings.D → ลูกค้าที่ดูแลกลายเป็น "ไม่มีผู้ดูแล (Sale ว่าง)" อัตโนมัติ (ไม่ต้อง bulk-reassign); มอบหมายภายหลัง = Customer.Approve.**

---

## 1. RUCDAA bits
| bit | ความหมาย |
|---|---|
| **R** Read | ดู/ค้น/รายงาน |
| **U** Update | แก้ข้อมูล/เปลี่ยนสถานะปกติ |
| **C** Create | สร้างเอกสาร/record ใหม่ |
| **D** Delete | soft-delete / void (เอกสารการค้า = void) |
| **A** Approve | อนุมัติ/สิทธิ์ระดับสูง (เช่น Blacklist, reassign) |
| **Admin** | จัดการ config/force override/undelete · **★ gate VAT/Company/Audit** |

## 2. Modules ในระบบ (มี 3 module ใหม่)
Customer · **Quotation (ใหม่)** · PO · **SO (ใหม่)** · **Supply Planning (ใหม่)** · BOM · Warehouse/Stock · Production · QC · Shipping · Invoice · PR · Supplier · Settings/User-Role.

## 3. ★ Consolidated capability → action → permission
| Module | ปุ่ม/action | Permission required |
|---|---|---|
| **Customer** | ดู list/detail/history · modal detail | Customer.R |
| | สร้างลูกค้า | Customer.C |
| | แก้ (TYPE/credit term/ผู้ติดต่อ) · เปลี่ยนสถานะปกติ | Customer.U |
| | ตั้ง Disabled/Blacklist · **reassign/มอบหมาย/ล้าง Sale ที่ดูแล (รวมมอบหมายลูกค้าที่ unassigned)** | Customer.A |
| | soft-delete | Customer.D |
| | undelete | Customer.Admin |
| **Quotation** | ดู list/detail/print-ready · material check | Quotation.R |
| | สร้าง/แก้ (เวอร์ชันใหม่) · ตั้งสถานะ ปฏิเสธ (Rejected) · พิมพ์/ส่งลูกค้า (print/share, ไม่เปลี่ยนสถานะ) | Quotation.C / Quotation.U |
| | **Convert to PO (→ Confirmed)** | Quotation.U **+ PO.C** |
| | ยกเลิก QT (ทุกสถานะ) + เหตุผลบังคับ | Quotation.D / Quotation.A |
| **PO** | ดู list/detail | PO.R |
| | เปิด PO ใหม่ / แก้ (Draft/Hold) | PO.C / PO.U |
| | ยืนยัน PO (จองวัตถุดิบ) | PO.U |
| | ยกเลิก/reopen | PO.D / PO.A |
| | force override สถานะ | PO.Admin |
| **SO** | ดู list/detail | SO.R |
| | สร้าง/แก้ SO (ก/ข) | SO.C / SO.U |
| | ยืนยันใบสั่งขาย (จอง FG) [ก] | SO.U |
| | ยืนยันผลิตเก็บสต็อก (→ PRD) [ข] | SO.C |
| | ยกเลิก SO (คืนจอง) | SO.D / SO.A |
| **Supply Planning** | ดู/ค้น/filter | Supply Planning.R |
| | แก้ rate/lead/cover → save back BOM | Supply Planning.U |
| | ปุ่ม "สั่งผลิต" (prefill SO produce-to-stock) | Supply Planning.C (ปลายทางสร้าง PRD = SO/Production.C) |
| **BOM** | ดู | BOM.R |
| | สร้าง | BOM.C |
| | แก้สูตร/ต้นทุนอื่น/TYPE/ราคาขาย/planning config | BOM.U |
| | soft-delete | BOM.D |
| **Warehouse/Stock** | ดู stock (RM/FG) + ledger | Stock.R |
| | ปรับยอด FG/RM (adjust) · loss (warehouse) · return | Stock.U (+ เหตุผลบังคับ) |
| | Goods Receipt | Stock.C |
| **Production** | ดูคิว/PRD/Batch | Production.R |
| | รับงาน/เริ่มผลิต/actual qty/พร้อมส่ง/rework/Hold · loss (production) | Production.U |
| **QC** | ตัดสิน QC (ผ่าน/ไม่ผ่าน+feedback) | QC.U |
| **Shipping** | สร้างรอบ/DN (อ้าง PO หรือ SO) | Shipping.C |
| **Invoice** | ออก invoice (อ้าง PO หรือ SO) · รับชำระ | Invoice.C / Invoice.U |
| **Settings/User-Role** | **ดูแท็บ Role/User** (list/detail) · **★ ค้นหา role · ค้นหา user (ชื่อ-สกุล/username)** | Settings.**R** |
| | สร้าง role/มัดสิทธิ์ (edit permission-matrix) | Settings.**Admin** |
| | **★ Disable/Enable role · Restore role · ถอด user ออกจาก role** | Settings.**Admin** |
| | **★ Soft-delete role** (+ เหตุผล) | Settings.**D** |
| | จัดการ user (create/edit/สลับ Active/เปลี่ยน role) · **★ ตั้ง/รีเซ็ตรหัส + password mode · ผูก/ยกเลิก Google link** | Settings.**Admin** |
| | **★ ลบ user (→ ลูกค้าที่ดูแลกลายเป็น Sale ว่าง/unassigned อัตโนมัติ; ไม่ bulk-reassign)** | Settings.**D** |
| | undelete/restore user/role | Settings.**Admin** |
| | **★ ดู/แก้ VAT** | Settings.**Admin only** *(เดิม U)* |
| | **★ ดู/แก้ ข้อมูลบริษัท** | Settings.**Admin only** *(เดิม U)* |
| | **★ ดู Audit log** | Settings.**Admin only** *(เดิม R)* |

## 4. หมายเหตุ (D14)
- **surplus (D13)** = auto ตอน "พร้อมส่ง" + remark → **ไม่มี permission แยก** (ไม่ใช่ approval).
- **★ Quotation (2026-07-29):** ไม่มีสถานะ "ส่งแล้ว (Sent)" — การส่งใบเสนอราคา = print/share (Quotation.R/U) ไม่เปลี่ยนสถานะ · Convert-to-PO ตั้ง QT = ยืนยัน (Confirmed) ทันที.
- **★ Settings (2026-07-29 — Settings review):** **VAT / ข้อมูลบริษัท / Audit-log = Admin bit เท่านั้น** (ข้อมูลไวต่อความปลอดภัย/การเงิน; เดิม VAT/Company=U, Audit=R) · **effective permission = union ของ role ที่ Active เท่านั้น** (role Disabled/Deleted ไม่ grant; settings.md §4b) · **role disable/soft-delete ทำได้แม้มีสมาชิก** (member เสีย permission โดยกลไก — deletion-policy §2.14).
- **★ ลบ Sale/User (2026-07-29 — resolve US-SET-02):** ลบ user = **Settings.D** → **ลูกค้าที่ Sale คนนั้นดูแลถูกล้าง assigned-Sale เป็นว่าง (unassigned) อัตโนมัติ** — **ไม่ต้อง bulk-reassign, ไม่มีหน้า bulk-reassign** (supersede กฎเดิม); **มอบหมาย Sale ใหม่ภายหลัง = Customer.Approve** (customer.md §4.3/§8 · deletion-policy §2.15).
- แต่ละ capability **grant แยกได้อิสระ**; role ใด ๆ ที่ถือ permission ตรงก็ทำได้ (เช่น AR/Sale เปิด PO/Quotation ได้ถ้ามีสิทธิ์).
- Cross-module actions (Convert to PO = Quotation.U + PO.C; สั่งผลิต = Supply Planning.C → SO/Production.C) ต้องถือ **ทั้งสอง** permission.
- `settings.html` เพิ่มแถว RUCDAA ของ **Quotation, SO, Supply Planning**.

## 5. Cross-links
ต่อ module: customer/quotation/po/so/stock/bom/production/supply-planning §Actions & Permissions · deletion-policy §3 (สิทธิ์ลบ) · **deletion-policy §2.15 (ลบ Sale → ลูกค้า unassigned)** · **settings.md §6/§4b/§4c (Settings actions + role lifecycle + delete-Sale→unassign)** · **customer.md §4.3/§8 (assigned Sale nullable + reassign)** · non-functional §2 (A6/A7/A8 auth/Google/Admin-gate) · scope §7.1.
