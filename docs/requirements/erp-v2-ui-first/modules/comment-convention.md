# Convention — Comment field with change-history (cross-cutting)

slug: `erp-v2-ui-first` · per-module canonical · PO · 2026-07-29 · **AUTHORITATIVE convention (documented ONCE, referenced by every transactional module)**
กฎอ้างอิง: `traceability.md` §4 (field-level audit — เวลา/ผู้ทำ/entity/field/จาก→เป็น) · `non-functional.md` §3 (AU1) · `settings.md` US-SET-05 (Audit log = มุมมองรวมของ field-audit เดียวกัน) · README §3

## สรุปภาษาไทย
กติกากลาง **"ช่องหมายเหตุ (comment) + ประวัติการแก้ไข"** ที่ใช้ซ้ำกับ **ทุก object ธุรกรรมหลัก 12 ตัว** (QT/PO/SO/PRD/Batch/DN/Shipment/Invoice/GR/PR/**Return**/**QC record**). แต่ละ object มี **ช่อง comment แบบ free-text เดียว** · ผู้ใช้ **แก้ทับที่เดิม (edit-in-place / overwrite)** เห็นค่าเดียวคือค่าปัจจุบัน · **แต่ระบบเก็บประวัติการแก้ครบทุกครั้ง** (ใคร/เมื่อ/ค่าเดิม→ค่าใหม่) ผ่าน **field-level audit ที่มีอยู่แล้ว** · ดูประวัติได้ในหน้า detail เป็น **popover/timeline "ประวัติการแก้ไข comment"** · ค่าปัจจุบันแสดงบน detail · การแก้ทุกครั้งเป็น **activity-log event** และ **โผล่บนหน้า traceability** ของ object นั้น. เอกสารนี้เป็นแหล่งเดียว — module อื่นอ้างอิง ไม่เขียนซ้ำ.

---

## 1. Purpose
ให้ทุก object ธุรกรรมมี "หมายเหตุ" ที่ผู้ใช้แก้ได้สะดวก (ช่องเดียว, แก้ทับ) โดย **ไม่สูญเสียความสามารถในการตรวจสอบย้อนหลัง (GMP/traceability)** — ทุกการแก้ comment ถูกบันทึกครบ ใคร/เมื่อ/ค่าเดิม→ค่าใหม่.

## 2. The convention (นิยามกลาง — ยึดที่นี่ที่เดียว)
| # | กติกา | รายละเอียด |
|---|---|---|
| **CC1** | **ช่อง comment เดียวต่อ object** | 1 free-text field ต่อ 1 object (PO/QT/PRD/Batch/DN/… — ดูรายการ §4) · ไม่ใช่ list ต่อท้าย (append) ในมุมมองผู้ใช้ · ว่างได้ (optional) |
| **CC2** | **แก้ในที่ (edit-in-place / overwrite)** | ผู้ใช้เห็น **ค่าปัจจุบันค่าเดียว** และ **แก้ทับ** ช่องเดิม (ไม่ต่อท้าย, ไม่มีหลาย thread) |
| **CC3** | **เก็บประวัติครบทุกครั้ง (ผ่าน field-audit ที่มีอยู่)** | ทุกครั้งที่ค่า comment เปลี่ยน → บันทึก **ใคร / เมื่อ / ค่าเดิม (old) → ค่าใหม่ (new)** ผ่าน **field-level audit เดิม** (`traceability.md` §4 / AU1) — entity = object, field = `comment` · ไม่มีตารางใหม่ (ใช้กลไก audit เดียวกับทุก field) |
| **CC4** | **ดูประวัติได้ inline** | หน้า detail แสดง affordance **"ประวัติการแก้ไข comment (change history)"** = popover/timeline เรียงเวลาใหม่→เก่า · แต่ละแถว: เวลา / ผู้แก้ / ค่าเดิม→ค่าใหม่ · paginate 20/หน้า ถ้ายาว (G1) |
| **CC5** | **ค่าปัจจุบันแสดงบน detail** | comment ปัจจุบันแสดงเด่นบนหน้า detail ของ object เสมอ (อ่านออกโดยไม่ต้องเปิดประวัติ) |
| **CC6** | **โผล่บน traceability + เป็น activity-log event** | การแก้ comment = event ใน field-audit → **ค้น/แสดงบนหน้า `trace.html`** ได้ (entity=object, field=`comment`) และนับเป็นรายการใน activity-log ของ object นั้น (subset ของ field-audit เดียวกัน — source เดียว, ไม่ซ้ำซ้อน) |
| **CC7** | **ไม่มี hard delete ของประวัติ** | ประวัติ comment เป็น audit → **ลบไม่ได้** (retention ตาม AU2: online 1 ปี แล้ว Super User purge/archive) · แก้ comment ให้ว่าง = แก้ทับด้วยค่าว่าง (ค่าเดิมยังอยู่ในประวัติ) |

## 3. Behaviour / rules
- **เหตุผลในการแก้ (reason):** comment เป็นช่องบันทึกอิสระ → **ไม่บังคับกรอกเหตุผลแยก** ตอนแก้ (ต่างจากการ "ยกเลิก/เปลี่ยนสถานะ" ที่บังคับ comment/เหตุผล). field-audit จับ old→new อัตโนมัติอยู่แล้ว (คอลัมน์ "เหตุผล" ของ audit = ว่างได้สำหรับ comment edit).
- **ความยาว/รูปแบบ:** free-text (แนะนำ limit ระดับ UI เช่น 1–2 พันตัวอักษร — Tech-Lead/UX กำหนดค่าจริง; ไม่ใช่ business rule ที่ปอนด์ล็อก).
- **Permission:** สิทธิ์แก้ comment ผูกกับ **capability Update (U) ของ module ที่ object นั้นสังกัด** (เช่น แก้ comment PO ต้อง PO.Update) · ดูได้ด้วย **Read (R)** ของ module นั้น · การเปิด popover ประวัติ = Read.
- **แก้ได้แม้ object ปิด/immutable?** comment เป็น metadata เชิงบันทึก → **แก้ได้ทุกสถานะของ object** รวมสถานะปิด/immutable/void (เพราะไม่กระทบ business state ของเอกสาร) เว้นแต่ module ระบุจำกัดไว้เอง. *(ถ้าปอนด์ต้องการล็อก comment เมื่อเอกสาร void/closed → เป็น open item; default = แก้ได้)*
- **1 field เท่านั้น:** object ที่มี "เหตุผลยกเลิก / feedback QC / เหตุผลการคืน (return reason) / remark surplus" อยู่แล้ว = ฟิลด์คนละตัวกับ `comment` กลางนี้ (comment = ช่องหมายเหตุทั่วไปเพิ่มเข้ามา ไม่ทับของเดิม). โดยเฉพาะ **Return** มี "เหตุผลการคืน (บังคับ)" เดิม และ **QC record** มี "feedback (บังคับเมื่อไม่ผ่าน)" เดิม → comment กลางนี้เป็นช่องเพิ่มแยกต่างหาก.

## 4. ★ Object list (ขอบเขตที่ใช้กติกานี้ — 12 object)
ใช้กับ **object ธุรกรรมหลักทุกตัว** (ปอนด์สั่ง "PO/QT/PRD/Batch/DN และ etc." → PO เสนอชุดเต็ม; **ปอนด์เคาะ 2026-07-29 ตัวเลือก A → เพิ่ม Return + QC record ครบเป็น 12**):

| Object | Module doc | จุดแสดง comment + ประวัติ |
|---|---|---|
| **Quotation (QT)** | `quotation.md` | quotation-detail (+ create/edit) |
| **Purchase Order (PO)** | `po.md` | po-detail (+ create/edit) |
| **Sales Order (SO, Own-Brand)** | `so.md` | so-detail (+ create) |
| **PRD (คำสั่งผลิต)** | `production.md` | production (PRD card/detail) |
| **Batch** | `production.md` | Batch card/detail (per-run) |
| **DN (ใบส่งของ)** | `shipping.md` | delivery-note |
| **Shipment (รอบจัดส่ง)** | `shipping.md` | shipping (รอบ header) |
| **Invoice** | `invoice.md` | invoice-detail |
| **Goods Receipt (GR)** | `goods-receipt.md` | goods-receipt |
| **Purchase Request (PR)** | `pr.md` | purchase-request / pr-create |
| **★ Return (ใบคืนสินค้า/RM)** | `return.md` | return (return-detail) — comment แยกจาก "เหตุผลการคืน (บังคับ)" |
| **★ QC record** | `qc.md` | qc (Batch line / Lot record) — comment แยกจาก "feedback (บังคับเมื่อไม่ผ่าน)" |

- **Master objects (Customer / Supplier):** มี **management-history / notes** ของตัวเองอยู่แล้ว (`customer.md` §5) → **ไม่บังคับใช้ comment กลางนี้** (มีช่องบันทึกเชิง timeline อยู่แล้ว). ถ้าปอนด์ต้องการช่อง comment เดี่ยวเพิ่มบน master ด้วย ให้แจ้ง.

## 5. Cross-links
- Field-level audit + trace surface → `traceability.md` §4 (row "comment edit") + §3 (field `comment` ต่อ entity) · AU1 → `non-functional.md` §3.
- Audit log รวม → `settings.md` US-SET-05 (source เดียว).
- ราย module ที่ implement: `quotation.md` · `po.md` · `so.md` · `production.md` · `shipping.md` · `invoice.md` · `goods-receipt.md` · `pr.md` · **`return.md`** · **`qc.md`** (แต่ละไฟล์อ้างกติกานี้ ไม่เขียนซ้ำ).

## 6. Resolved decisions
- **★ Return + QC record → included (ปอนด์เคาะ ตัวเลือก A, 2026-07-29):** Return (ใบคืน) และ QC record ได้ comment+history ครบเช่นเดียวกับอีก 10 object → object list = **12 ตัว** (§4). CC1–CC7 ใช้เหมือนกันทุกประการ. comment เป็นช่องเพิ่ม **แยกจาก** "เหตุผลการคืน" (Return) และ "feedback" (QC) ที่มีอยู่เดิม. *(เดิมเป็น open item — ปิดแล้ว.)*

## 7. Module changelog
- **★ UPDATED (2026-07-29 — ปอนด์เคาะตัวเลือก A):** เพิ่ม **Return** + **QC record** เข้า object list → **12 object** (เดิม 10). CC1–CC7 คงเดิมทุกข้อ. ปิด open item Return/QC (§6 resolved) · เพิ่ม cross-link `return.md`/`qc.md`.
- **NEW (2026-07-29 — ปอนด์ cross-cutting feedback, PO module 3 review):** สร้างกติกากลาง **comment + change-history** (CC1–CC7) · object list 10 ตัว (§4) · flag Return/QC เป็น open item. อ้างโดยทุก module ธุรกรรม + traceability.md §4 + non-functional.md AU1.
