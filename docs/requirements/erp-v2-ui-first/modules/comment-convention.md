# Convention — Comment field with change-history (cross-cutting)

slug: `erp-v2-ui-first` · per-module canonical · PO · 2026-07-29 (**+ Route rename 2026-07-30**) · **AUTHORITATIVE convention (documented ONCE, referenced by every transactional module)**
กฎอ้างอิง: `traceability.md` §4 (field-level audit — เวลา/ผู้ทำ/entity/field/จาก→เป็น) · `non-functional.md` §3 (AU1) · `settings.md` US-SET-05 (Audit log = มุมมองรวมของ field-audit เดียวกัน) · README §3

## สรุปภาษาไทย
กติกากลาง **"ช่องหมายเหตุ (comment) + ประวัติการแก้ไข"** ที่ใช้ซ้ำกับ **ทุก object ธุรกรรมหลัก 12 ตัว** (QT/PO/SO/PRD/Batch/DN/**Route**/Invoice/GR/PR/**Return**/**QC record**). แต่ละ object มี **ช่อง comment แบบ free-text เดียว** · ผู้ใช้ **แก้ทับที่เดิม (edit-in-place / overwrite)** เห็นค่าเดียวคือค่าปัจจุบัน · **แต่ระบบเก็บประวัติการแก้ครบทุกครั้ง** (ใคร/เมื่อ/ค่าเดิม→ค่าใหม่) ผ่าน **field-level audit ที่มีอยู่แล้ว** · ดูประวัติได้ในหน้า detail เป็น **popover/timeline "ประวัติการแก้ไข comment"** · ค่าปัจจุบันแสดงบน detail · การแก้ทุกครั้งเป็น **activity-log event** และ **โผล่บนหน้า traceability** ของ object นั้น. เอกสารนี้เป็นแหล่งเดียว — module อื่นอ้างอิง ไม่เขียนซ้ำ. **★ 2026-07-30: object "Shipment (รอบจัดส่ง)" เปลี่ยนชื่อเป็น "Route (`RT-…`)"; DN detail ย้ายไป `delivery-note.md`** (Module C).

---

## 1. Purpose
ให้ทุก object ธุรกรรมมี "หมายเหตุ" ที่ผู้ใช้แก้ได้สะดวก (ช่องเดียว, แก้ทับ) โดย **ไม่สูญเสียความสามารถในการตรวจสอบย้อนหลัง (GMP/traceability)** — ทุกการแก้ comment ถูกบันทึกครบ ใคร/เมื่อ/ค่าเดิม→ค่าใหม่.

## 2. The convention (นิยามกลาง — ยึดที่นี่ที่เดียว)
| # | กติกา | รายละเอียด |
|---|---|---|
| **CC1** | **ช่อง comment เดียวต่อ object** | 1 free-text field ต่อ 1 object (PO/QT/PRD/Batch/DN/… — ดูรายการ §4) · ไม่ใช่ list ต่อท้าย (append) ในมุมมองผู้ใช้ · ว่างได้ (optional) |
| **CC2** | **แก้ในที่ (edit-in-place / overwrite)** | ผู้ใช้เห็น **ค่าปัจจุบันค่าเดียว** และ **แก้ทับ** ช่องเดิม (ไม่ต่อท้าย, ไม่มีหลาย thread) |
| **CC3** | **เก็บประวัติครบทุกครั้ง (ผ่าน field-audit ที่มีอยู่)** | ทุกครั้งที่ค่า comment เปลี่ยน → บันทึก **ใคร / เมื่อ / ค่าเดิม (old) → ค่าใหม่ (new)** ผ่าน **field-level audit เดิม** (`traceability.md` §4 / AU1) — entity = object, field = `comment` · ไม่มีตารางใหม่ |
| **CC4** | **ดูประวัติได้ inline** | หน้า detail แสดง affordance **"ประวัติการแก้ไข comment (change history)"** = popover/timeline เรียงเวลาใหม่→เก่า · แต่ละแถว: เวลา / ผู้แก้ / ค่าเดิม→ค่าใหม่ · paginate 20/หน้า ถ้ายาว (G1) |
| **CC5** | **ค่าปัจจุบันแสดงบน detail** | comment ปัจจุบันแสดงเด่นบนหน้า detail ของ object เสมอ (อ่านออกโดยไม่ต้องเปิดประวัติ) |
| **CC6** | **โผล่บน traceability + เป็น activity-log event** | การแก้ comment = event ใน field-audit → **ค้น/แสดงบนหน้า `trace.html`** ได้ (entity=object, field=`comment`) และนับเป็นรายการใน activity-log ของ object นั้น (subset ของ field-audit เดียวกัน — source เดียว, ไม่ซ้ำซ้อน) |
| **CC7** | **ไม่มี hard delete ของประวัติ** | ประวัติ comment เป็น audit → **ลบไม่ได้** (retention ตาม AU2) · แก้ comment ให้ว่าง = แก้ทับด้วยค่าว่าง (ค่าเดิมยังอยู่ในประวัติ) |

## 3. Behaviour / rules
- **เหตุผลในการแก้ (reason):** comment เป็นช่องบันทึกอิสระ → **ไม่บังคับกรอกเหตุผลแยก** ตอนแก้ (ต่างจากการ "ยกเลิก/เปลี่ยนสถานะ" ที่บังคับ comment/เหตุผล). field-audit จับ old→new อัตโนมัติ.
  - **★ ข้อยกเว้น (r11):** **comment ต่อ DN เมื่ออัปเดตสถานะใน Route "เสร็จสิ้น" process หรือแก้สถานะ DN ตรง = บังคับกรอก** (`delivery-note.md` §6/§10) — เป็นกติกาของ DN status-update, ไม่ใช่ comment ทั่วไป.
- **ความยาว/รูปแบบ:** free-text (limit ระดับ UI — Tech-Lead/UX กำหนด).
- **Permission:** สิทธิ์แก้ comment ผูกกับ **capability Update (U) ของ module ที่ object นั้นสังกัด** · ดูได้ด้วย **Read (R)**.
- **แก้ได้แม้ object ปิด/immutable?** comment = metadata → **แก้ได้ทุกสถานะ** เว้นแต่ module ระบุจำกัดไว้เอง.
- **1 field เท่านั้น:** object ที่มี "เหตุผลยกเลิก / feedback QC / เหตุผลการคืน / remark surplus / **next delivery date (DN)**" อยู่แล้ว = ฟิลด์คนละตัวกับ `comment` กลางนี้.

## 4. ★ Object list (ขอบเขตที่ใช้กติกานี้ — 12 object)
| Object | Module doc | จุดแสดง comment + ประวัติ |
|---|---|---|
| **Quotation (QT)** | `quotation.md` | quotation-detail (+ create/edit) |
| **Purchase Order (PO)** | `po.md` | po-detail (+ create/edit) |
| **Sales Order (SO, Own-Brand)** | `so.md` | so-detail (+ create) |
| **PRD (คำสั่งผลิต)** | `production.md` | production (PRD card/detail) |
| **Batch** | `production.md` | Batch card/detail (per-run) |
| **DN (ใบส่งของ)** | `delivery-note.md` | delivery-note · **★ บังคับเมื่อ status-update (Route เสร็จสิ้น / แก้ตรง A)** |
| **Route (รอบจัดส่ง)** ★ | `shipping.md` | shipping (Route header) · **★ เดิม "Shipment `SHP-`" → "Route `RT-`"** |
| **Invoice** | `invoice.md` | invoice-detail |
| **Goods Receipt (GR)** | `goods-receipt.md` | goods-receipt |
| **Purchase Request (PR)** | `pr.md` | purchase-request / pr-create |
| **★ Return (ใบคืนสินค้า/RM)** | `return.md` | return (return-detail) — comment แยกจาก "เหตุผลการคืน (บังคับ)" |
| **★ QC record** | `qc.md` | qc (Batch line / Lot record) — comment แยกจาก "feedback (บังคับเมื่อไม่ผ่าน)" |

- **Master objects (Customer / Supplier):** มี **management-history / notes** ของตัวเองอยู่แล้ว (`customer.md` §5) → **ไม่บังคับใช้ comment กลางนี้**.

## 5. Cross-links
- Field-level audit + trace surface → `traceability.md` §4 (row "comment edit") + §3 (field `comment` ต่อ entity) · AU1 → `non-functional.md` §3.
- Audit log รวม → `settings.md` US-SET-05 (source เดียว).
- ราย module ที่ implement: `quotation.md` · `po.md` · `so.md` · `production.md` · `shipping.md` (Route) · **`delivery-note.md` (DN)** · `invoice.md` · `goods-receipt.md` · `pr.md` · **`return.md`** · **`qc.md`**.

## 6. Resolved decisions
- **★ Return + QC record → included (ปอนด์เคาะ ตัวเลือก A, 2026-07-29):** object list = **12 ตัว** (§4). CC1–CC7 ใช้เหมือนกัน.

## 7. Module changelog
- **★ UPDATED (2026-07-30 — Route rename + DN split):** object "Shipment (รอบจัดส่ง)" → **"Route (`RT-…`)"**; DN module doc `shipping.md` → **`delivery-note.md`** (Module C); note comment DN บังคับเมื่อ status-update (§3). object count คงที่ 12.
- **★ UPDATED (2026-07-29 — ปอนด์เคาะตัวเลือก A):** เพิ่ม **Return** + **QC record** เข้า object list → **12 object** (เดิม 10). CC1–CC7 คงเดิม.
- **NEW (2026-07-29 — ปอนด์ cross-cutting feedback):** สร้างกติกากลาง **comment + change-history** (CC1–CC7) · object list. อ้างโดยทุก module ธุรกรรม + traceability.md §4 + non-functional.md AU1.
