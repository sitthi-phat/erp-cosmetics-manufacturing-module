# Module — Settings (RUCDAA + Users + VAT + Company + Audit)

slug: `erp-v2-ui-first` · per-module canonical · PO · 2026-07-29 · **AUTHORITATIVE SPEC** (absorbs functional-spec `settings.html` US-SET-01..05 + rbac-deletion + 3 new modules in RUCDAA)
Mockups: `mockups/settings.html`
กฎอ้างอิง: **D14** (RUCDAA generic) · rbac-deletion (7 กติกา soft-delete + bulk reassign) · `permission-matrix.md` (capability→action) · `invoice.md` (VAT/ข้อมูลบริษัท) · `traceability.md` (audit source เดียว) · README §3

## สรุปภาษาไทย
Settings 5 หน้าจอ: **1) Role & สิทธิ์** (RUCDAA 6 ระดับต่อ module: Read/Update/Create/Delete/Approve/**Admin bit** = force override; role ไม่จำกัดจำนวน) **2) ผู้ใช้** (สร้าง/ผูก Google/เปิด-ปิด/เปลี่ยน role/**ลบ→บังคับ bulk reassign ลูกค้าก่อน**) **3) Config VAT + effective date + ประวัติ** (ยึด invoice date) **4) ข้อมูลบริษัท** (ชื่อ/เลขภาษี 13 หลัก/ที่อยู่/เบอร์/อีเมล/logo → invoice-print) **5) Audit log** (field-level เดียวกับ Traceability). ลบ Sale ต้อง reassign ลูกค้าทั้งหมดก่อน; ลบ Role บล็อกจนย้าย user ออกหมด. auth: local + Google · session 24 ชม. + reset 06:00. **RUCDAA matrix ต้องมีแถว module ใหม่: Quotation, SO, Supply Planning** (นอกเหนือจาก module เดิม).

---

## 1. Purpose
ศูนย์กลาง config การเข้าถึง (RBAC generic) + จัดการผู้ใช้/ลบอย่างปลอดภัย (ไม่มีงาน/ลูกค้าตกค้างไม่มีเจ้าภาพ) + ตั้ง VAT/ข้อมูลบริษัทสำหรับเอกสารภาษี + audit log ทั้งระบบ.

## 2. Screens (5 แท็บ)
| แท็บ | บทบาท |
|---|---|
| Role & สิทธิ์ | สร้าง role + matrix RUCDAA 6 ช่องต่อทุก module (รวม Admin bit) |
| ผู้ใช้ | สร้าง/ผูก Google/เปิด-ปิด/เปลี่ยน role/ลบ→bulk reassign |
| Config VAT | อัตรา + effective date + ประวัติ |
| ข้อมูลบริษัท | ชื่อ/เลขภาษี 13 หลัก/ที่อยู่/เบอร์/อีเมล/logo |
| Audit log | field-level (filter/search/sort/pagination) — source เดียวกับ Traceability |

## 3. Fields
| ฟิลด์ | ชนิด | editable/computed | หมายเหตุ |
|---|---|---|---|
| role + matrix RUCDAA | grid {module × R/U/C/D/A/Admin} | editable | Admin bit = force override |
| user {ชื่อ, อีเมล, role, Google link, สถานะ} | record | editable | Active/ปิดใช้งาน |
| VAT {อัตรา%, effective date, ผู้ตั้ง} | list | editable | ยึด invoice date · ไม่ทับซ้อน |
| ข้อมูลบริษัท | {ชื่อ, เลขภาษี 13 หลัก, ที่อยู่, เบอร์, อีเมล, logo} | editable | เลขภาษี = ตัวเลข 13 หลัก |
| audit row | {เวลา, ผู้ทำ, module, entity, field, จาก→เป็น, เหตุผล} | computed | |

## 4. RUCDAA bits (D14)
R Read · U Update · C Create · D Delete(soft/void) · A Approve · **Admin** (config/force override/undelete). **Module ในระบบ (รวมใหม่):** Customer · **Quotation** · PO · **SO** · **Supply Planning** · BOM · Warehouse/Stock · Production · QC · Shipping · Invoice · PR · Supplier · Settings/User-Role. (ดู `permission-matrix.md`).

## 5. User Stories (absorbed) + AC สรุป
- **US-SET-01 (Must) — Role & สิทธิ์:** สร้าง role "หัวหน้าคลัง" (Stock=R,U,C; Production=R; อื่นว่าง) → บันทึก matrix 6 ช่องต่อทุก module; ผู้ใช้ role นี้เห็น Stock+Production, สร้าง/แก้ Stock ได้ แต่ลบ/approve ไม่ได้. **Edge:** Admin bit ของ PO → ผู้ใช้เห็น "เปลี่ยนสถานะข้ามลำดับ (force override)" (po US-PO-06); ไม่มี Admin bit = ไม่เห็น. **Error:** ลบ role ที่มี user ≥1 → บล็อก "ต้องย้าย user ออกจาก role นี้ให้หมดก่อนลบ" (no force-migrate).
- **US-SET-02 (Must) — จัดการผู้ใช้ + ลบ→bulk reassign:** สร้าง user + เลือก role + ผูก Google + Active → ล็อกอินได้ทั้ง local+Google; เปลี่ยน role/สลับ Active จากแถว. **Edge:** ลบ Sale ที่ดูแลลูกค้า 12 ราย → เปิดหน้า **bulk reassign** บังคับเลือก Sale ปลายทางรับช่วงครบ 12 ก่อนจึง mark ลบได้; PO เดิมเดินต่อ ห้ามสร้าง PO ใหม่ในนามผู้ถูกลบ. **Error:** ยืนยันลบก่อน reassign ครบ / ไม่มีสิทธิ์ D → ไม่ลบ + error.
- **US-SET-03 (Must) — Config VAT + effective + ประวัติ:** เพิ่ม VAT 7% effective 01/01/2569 → บันทึก + ประวัติ (อัตรา/วันมีผล/ผู้ตั้ง); ใบกำกับยึด invoice date. **Edge:** หลายรายการตามช่วง → ออกใบปี 2568 ใช้อัตราที่ครอบวันนั้น; เปลี่ยน VAT ใหม่ไม่กระทบใบเก่า. **Error:** effective date ว่าง/ทับซ้อน → error "ต้องระบุวันที่มีผลที่ไม่ทับซ้อน".
- **US-SET-04 (Should) — ข้อมูลบริษัท:** กรอกชื่อ/เลขภาษี 13 หลัก/ที่อยู่/เบอร์/อีเมล + upload logo → ปรากฏบน invoice-print. **Edge:** ไม่มี logo → placeholder (ตัว "E") — ยังพิมพ์ได้. **Error:** เลขภาษีไม่ครบ 13 หลัก/มีตัวอักษร → error "เลขประจำตัวผู้เสียภาษีต้องเป็นตัวเลข 13 หลัก".
- **US-SET-05 (Should) — Audit log:** กรอง ผู้ใช้/module/ช่วงวันที่ + คำค้น → ตารางคอลัมน์ (เวลา/ผู้ทำ/module/entity/field/จาก→เป็น/เหตุผล) + pagination + sort เวลา. **Edge:** เป็นมุมมองรวมของ field-audit เดียวกับ Traceability; คลิกแถว → deep link ไป trace; retention 1 ปี, purge/archive=Super User. **Error:** ไม่มีสิทธิ์ Read Settings/Admin → 403 / ไม่เห็นแท็บ.

## 6. Actions & Permissions (D14)
| ปุ่ม/action | Permission required |
|---|---|
| ดู settings/audit | Settings.**Read (R)** |
| สร้าง role/มัดสิทธิ์ · จัดการ user · bulk reassign · undelete | Settings.**Admin** |
| แก้ VAT/ข้อมูลบริษัท | Settings.**Update (U)** (หรือ Admin ตาม config) |
| ลบ user/role | Settings.**Delete (D)** + เงื่อนไข (reassign/ย้าย user) |

## 7. Validations
- ลบ role: บล็อกจนย้าย user ออกหมด (no force-migrate).
- ลบ Sale: บังคับ bulk reassign ลูกค้าทั้งหมดก่อน; PO เดิมเดินต่อ, ห้ามสร้างใหม่ในนามผู้ถูกลบ.
- VAT: effective date ไม่ว่าง + ไม่ทับซ้อน; ยึด invoice date; เปลี่ยนใหม่ไม่กระทบใบเก่า.
- เลขภาษี = ตัวเลข 13 หลัก.
- Audit = Read Settings เท่านั้น (ข้อมูลไวต่อความปลอดภัย).

## 8. Pagination / Search
- user list + audit log: 20/หน้า (G1) · audit filter (ผู้ใช้/module/ช่วงวัน) + search + sort เวลา (G2).

## 9. Formulas / rules
- VAT lookup = อัตราที่ effective ครอบ invoice date.
- audit = field-audit table เดียวกับ Traceability (source เดียว).
- auth (NFR): local + Google · session 24 ชม. + reset 06:00 (+ warning ก่อนตัด — ดู `platform.md`).

## 10. Cross-links
- สิทธิ์ Read → เห็น module + dashboard แผนก + noti (`dashboard.md`/`platform.md`). VAT/ข้อมูลบริษัท → `invoice.md`. Audit ↔ `traceability.md` (source เดียว). ลบ Sale/Role → deletion-policy / rbac-deletion. capability→action → `permission-matrix.md`.

## 11. Module changelog
- **Absorbed:** functional-spec `settings.html` US-SET-01..05 (15 AC) + rbac-deletion กติกา verbatim ในความหมาย.
- **เพิ่ม (delta):** RUCDAA matrix เพิ่มแถว module ใหม่ **Quotation / SO / Supply Planning** (capabilities ของ 3 module ใหม่ config ได้ที่นี่).
- **คงเดิม:** Admin bit=force override · ลบ Sale→bulk reassign · ลบ role บล็อก · VAT effective/invoice date · เลขภาษี 13 หลัก · audit source เดียว · auth local+Google + session 24h/06:00.
