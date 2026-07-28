# Module — Customer (ลูกค้า)

slug: `erp-v2-ui-first` · per-module canonical · PO · 2026-07-29
Mockups: `mockups/customers.html` · `mockups/customer-detail.html` · `mockups/customer-create.html` · `mockups/contact-create.html`
กฎอ้างอิง: entity-status-map §1.1 (6 สถานะ) · deletion-policy §2.1/§2.6 · README §3 (G1–G5) · README §2.2 (credit term)

## สรุปภาษาไทย
โมดูลลูกค้า: เพิ่ม **TYPE = OEM และ/หรือ Own-Brand** (เป็นได้ทั้งคู่) สำหรับรายงาน + กันสับสนตอนเปิด order. **Credit term ระดับลูกค้า = 30/60/90 วัน default 60** (override รายใบแจ้งหนี้ยังได้). รวม "เปลี่ยนสถานะ/มอบหมาย + บันทึก/ประวัติการจัดการ + Sale ที่ดูแล (reassign)" เป็น **section เดียว = ประวัติการจัดการ (management-history)**. หน้า detail โชว์ **ประวัติใบเสนอราคา (QT) + ประวัติ PO** ค้นด้วยเลข/ช่วงวันที่, 20/หน้า, คลิกเข้าดูแล้วกลับได้ไม่เสีย state.

---

## 1. Purpose
จัดการ master ลูกค้า (ข้อมูล + ผู้ติดต่อ + credit) และเป็นจุดเริ่ม/อ้างอิงของทุก order (OEM Quotation/PO, Own-Brand SO). รองรับ lifecycle 6 สถานะ, การมอบหมาย Sale, และประวัติการค้าเต็มรูป (QT/PO) เพื่อ traceability + การติดตามลูกค้า.

## 2. Screens
| หน้าจอ | บทบาท |
|---|---|
| `customers.html` (list) | รายชื่อลูกค้า + filter (สถานะ, **TYPE**, Sale ที่ดูแล) + search |
| `customer-detail.html` | ข้อมูลลูกค้า + ผู้ติดต่อ + **management-history (section เดียว)** + **QT history** + **PO history** |
| `customer-create.html` (add/edit) | เพิ่ม/แก้ลูกค้า (+ TYPE, credit term, ผู้ติดต่อ) |
| `contact-create.html` | เพิ่ม/แก้ผู้ติดต่อของลูกค้า |
| **modal detail** (ใช้จากหน้า order) | ดูข้อมูลลูกค้าแบบ modal จาก quotation/po/so-create — กลับได้ไม่เสีย state (G3/G4) |

> **หมายเหตุ split:** ถ้า add/edit ใหญ่เกิน สามารถแยก `customer-add.md` / `customer-edit.md` ภายหลัง — รอบนี้รวมใน customer.md.

## 3. Fields
| ฟิลด์ | หน่วย/ชนิด | editable/computed | หมายเหตุ |
|---|---|---|---|
| รหัสลูกค้า `CUS-{NNNNNN}` | string | computed (auto) | gapless |
| ชื่อบริษัท | text | editable | ใช้ค้นใน customer dropdown (G4) |
| **TYPE** | multi-select {OEM, Own-Brand} | editable | **เลือกได้ทั้งคู่** · ใช้ report + filter/เตือนตอนเปิด order · **mismatch = เตือนไม่บล็อก** |
| สถานะ | enum 6 สถานะ | editable (บาง state auto) | Lead/Active/Inactive/Follow-up/Disabled/Blacklist (entity-status-map §1.1) |
| **Credit term (ระดับลูกค้า)** | enum {30, 60, 90} วัน | editable | **DEFAULT = 60** · override รายใบแจ้งหนี้ยังได้ (README §2.2) |
| Sale ที่ดูแล (owner) | ref user | editable (reassign) | reassign = Sale Manager/Admin (ดู §5) |
| ผู้ติดต่อ (contacts) | list {ชื่อ, เบอร์, อีเมล, หลัก?} | editable | ต้องมีผู้ติดต่อหลัก 1 คน (deletion-policy §2.6) |
| เบอร์โทรบริษัท | phone | editable | ใช้ค้นใน customer dropdown (G4) |
| ที่อยู่/เลขภาษี | text | editable | ใช้ออกเอกสาร |

## 4. Statuses / lifecycle
6 สถานะ (source: entity-status-map §1.1): **ผู้สนใจ (Lead)** → **ลูกค้าประจำ (Active)** (auto เมื่อยืนยัน order ใบแรก) → **ห่างหาย (Inactive)** (auto scheduler ไม่มี order เกินรอบ default 3 ด.) · **ต้องติดตาม (Follow-up)** (manual, บังคับ comment) · **ปิดใช้งาน (Disabled)/บัญชีดำ (Blacklist)** (Sale Manager/Admin, บังคับ comment). **Soft-delete** ได้เสมอ (deletion-policy §2.1) — PO เดิมเดินต่อ, ห้ามเปิด order ใหม่, หายจาก dropdown.

## 5. ★ Management-history (section เดียว — consolidated)
รวม 3 อย่างที่เคยแยกให้เป็น **section เดียว** บน customer-detail:
1. **เปลี่ยนสถานะ / มอบหมาย** — เปลี่ยน 6 สถานะ (บังคับ comment ตาม state), มอบหมายงานติดตาม.
2. **บันทึก / ประวัติการจัดการ** — timeline การกระทำ (comment, การติดต่อ, การเปลี่ยนสถานะ) เรียงเวลา.
3. **Sale ที่ดูแล (reassign)** — เปลี่ยนผู้ดูแล (Sale Manager/Admin) + เหตุผล; รองรับ bulk reassign ตอนลบ Sale (deletion-policy §2.2).
> ทุก entry เก็บ ใคร/เมื่อไหร่/เหตุผล (audit). paginate 20/หน้า (G1).

## 6. ★ QT history + PO history (บน customer-detail)
- **ประวัติใบเสนอราคา (Quotation history):** list QT ของลูกค้ารายนี้ · **ค้นด้วยเลข QT หรือช่วงวันที่สร้าง** (G2) · **20/หน้า** (G1) · คลิกเข้า `quotation-detail` แล้ว **กลับมาไม่เสีย state** (G3).
- **ประวัติ PO:** list PO ของลูกค้า · ค้นด้วยเลข PO หรือช่วงวันที่สร้าง (G2) · 20/หน้า (G1) · คลิกเข้า `po-detail` แล้วกลับไม่เสีย state (G3).
- (Own-Brand) ลูกค้าที่มี SO — แสดง SO history ในรูปแบบเดียวกัน (optional tab).

## 7. Actions & Permissions (per-action, D14/§7.1)
> โมเดล generic RUCDAA ต่อ module = **Customer**. ปุ่ม↔permission:

| ปุ่ม/action | Permission required (Customer module) |
|---|---|
| ดูรายชื่อ/detail/history | Customer.**Read (R)** |
| สร้างลูกค้าใหม่ | Customer.**Create (C)** |
| แก้ข้อมูล/TYPE/credit term/ผู้ติดต่อ | Customer.**Update (U)** |
| เปลี่ยนสถานะ Lead/Active/Follow-up | Customer.**Update (U)** (บังคับ comment ตาม state) |
| ตั้ง Disabled / Blacklist | Customer.**Approve (A)** (แนะนำ Sale Manager/Admin) + comment |
| reassign Sale ที่ดูแล | Customer.**Approve (A)** (Sale Manager/Admin) |
| soft-delete ลูกค้า | Customer.**Delete (D)** + comment |
| กู้คืน (undelete) | Customer.**Admin** |
| เปิด modal detail จากหน้า order | Customer.**Read (R)** |

## 8. Validations
- TYPE ต้องเลือกอย่างน้อย 1 (OEM หรือ Own-Brand หรือทั้งคู่).
- Credit term บังคับเลือก (default 60 ถ้าไม่แตะ).
- ต้องมีผู้ติดต่อหลัก 1 คนเสมอ (ลบผู้ติดต่อหลักคนเดียวไม่ได้จนตั้งคนใหม่ — deletion-policy §2.6).
- เปลี่ยนเป็น Disabled/Blacklist/Follow-up/soft-delete = **บังคับ comment**.
- **mismatch TYPE ตอนเปิด order:** เปิด OEM order ให้ลูกค้าที่ TYPE ไม่มี OEM (หรือ Own-Brand SO ให้ลูกค้าที่ไม่มี Own-Brand) = **เตือน (warning) ไม่บล็อก** — สอดคล้องหลัก warning-not-block ทั้งระบบ.

## 9. Pagination / Search (global)
- ทุก list/history: **20/หน้า** (G1).
- customers list: search ชื่อ/เบอร์/รหัส + filter สถานะ/TYPE/Sale.
- QT/PO history: search เลข **หรือ** ช่วงวันที่สร้าง (G2).
- **Customer search dropdown (G4)** — component ที่ถูกใช้ซ้ำบน quotation-create/po-create/so-create: ค้นด้วย **เบอร์โทร / ชื่อบริษัท / ชื่อผู้ติดต่อ / เบอร์ผู้ติดต่อ**; เมื่อ match แสดง **สถานะ + credit term**; เปิด customer detail (modal) แล้วกลับได้โดยฟอร์ม order ไม่หาย.

## 10. Cross-links
- Credit term → `po.md`/`so.md` (billing/overdue) · README §2.2.
- Customer dropdown → `quotation.md` §create, `po.md` §create, `so.md` §sell-from-stock.
- Deletion → deletion-policy §2.1/§2.6 · RBAC → `permission-matrix.md`.

## 11. Module changelog
- **เพิ่ม:** TYPE (OEM/Own-Brand, both) · credit term preset 30/60/90 default 60 · management-history รวม section · QT/PO history (search/paginate/drill-back) · customer search dropdown (G4).
- **แก้:** credit ระดับลูกค้าเดิม (ไม่มี preset) → preset + default 60.
