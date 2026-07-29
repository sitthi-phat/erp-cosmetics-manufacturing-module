# Module — Shipping (จัดส่ง: Shipment รอบ + DN)

slug: `erp-v2-ui-first` · per-module canonical · PO · 2026-07-29 · **AUTHORITATIVE SPEC** (absorbs functional-spec `shipping.html` US-SHP-01..03)
Mockups: `mockups/shipping.html` · `mockups/delivery-note.html`
กฎอ้างอิง: entity-status-map §1.9/§1.10 (Shipment/DN) · `po.md`/`so.md` (พร้อมจัดส่ง→ตัด FG/dispatch) · `invoice.md` (Delivered→เริ่มนับเครดิต) · stock (FG FIFO ตอน dispatch, D16) · README §3 (**G8**) · **`comment-convention.md` (comment + change-history)** · **`numbering-on-save.md` (G8 — เลข SHP + DN ออกตอนสร้างรอบ, NS7)**

## สรุปภาษาไทย
จัดส่งเป็น **2 ชั้น**: **Shipment (รอบจัดส่ง)** รวมหลาย DN + คนขับ/เบอร์/route/ประเภทรถ · **DN = 1 ใบต่อ 1 PO/SO เสมอ** (ลูกค้าเซ็นรายใบ). สร้างรอบ = เลือก order "พร้อมจัดส่ง" (ค้นด้วย PO/SO ID หรือข้อมูลลูกค้า) → ระบบ gen DN ราย order → รวมเป็นรอบ. **★ เลข Shipment (SHP) + ทุก DN ในรอบ ไม่โชว์ล่วงหน้า → ออก gapless ตอน "สร้างรอบ" สำเร็จ + popup ยืนยันแสดง "เลข SHP + ทุก DN ที่ gen + สรุป (คนขับ/route/จำนวน order)" (G8 · `numbering-on-save.md` NS7)**. DN: กำลังนำส่ง → **ส่งถึงแล้ว** (PO ส่งถึง + เริ่มนับ overdue + noti Finance/Sale) / **ถูกปฏิเสธ** (PO กลับพร้อมจัดส่ง + raise Sale) / **เลื่อนส่ง** (PO พร้อมจัดส่ง + flag+วันที่ ค้างคิว). รอบ = จบรอบ (Closed) auto เมื่อ DN ทุกใบถึงสถานะสุดท้าย; ระหว่างนั้น = "ส่งบางส่วน (Partially)" + breakdown. FG ตัด FIFO ราย Batch ตอน dispatch (D16). เลข `SHP-{YYYYMMDD}-{NNNN}` / `DN-{YYYYMMDD}-{NNNNN}`. **★ ทั้ง Shipment (รอบ) และ DN มีช่องหมายเหตุ (comment) แก้ในที่ + เก็บประวัติการแก้ครบ (comment-convention.md).**

---

## 1. Purpose
จัดรอบส่งของและออกใบส่งของ (DN) ราย order ให้ลูกค้าเซ็น, ติดตามผลการส่งราย DN, และ reconcile รอบ — เป็นจุดที่ FG ถูกตัดจริง (FIFO ราย Batch) และเป็นตัวจุด billing (Delivered → เริ่มนับเครดิต).

## 2. Screens
| หน้าจอ | บทบาท |
|---|---|
| `shipping.html` | คิว order "พร้อมจัดส่ง" (รวม Postpone) · สร้างรอบ · search by PO/SO/ลูกค้า · กรอกคนขับ/เบอร์/route/ประเภทรถ · **comment ต่อรอบ (Shipment) + "ประวัติการแก้ไข comment"** · **★ ช่องเลข SHP/DN = "(ระบบออกให้เมื่อบันทึก)" → ออกตอนสร้างรอบ + popup (G8/NS7)** |
| `delivery-note.html` | DN ราย order · print · สถานะราย DN · reconcile รอบ Partially · **comment ต่อ DN + "ประวัติการแก้ไข comment"** |

## 3. Fields
| ฟิลด์ | ชนิด | editable/computed | หมายเหตุ |
|---|---|---|---|
| เลข Shipment `SHP-{YYYYMMDD}-{NNNN}` | string | computed | รอบ · **★ ออกตอน "สร้างรอบ" สำเร็จ + popup (G8/NS2, NS7)** |
| คนขับ / เบอร์ / route / ประเภทรถ | text | editable | ต่อรอบ |
| เลข DN `DN-{YYYYMMDD}-{NNNNN}` | string | computed | **1 DN = 1 PO/SO** · **★ ออกพร้อมรอบ (ทุก DN ในรอบ) ตอนสร้างรอบ (G8/NS7)** |
| สถานะรอบ | enum {รับเข้ารอบ, กำลังนำส่ง, จบรอบ, ส่งบางส่วน} | computed | reconcile จาก DN |
| สถานะ DN | enum {กำลังนำส่ง, ส่งถึงแล้ว, ถูกปฏิเสธ, เลื่อนส่ง} | editable | |
| postpone date | date | editable | เมื่อเลื่อนส่ง |
| **★ หมายเหตุรอบ (Shipment comment)** | free-text (ช่องเดียว/รอบ), editable (แก้ในที่/overwrite) | **แก้ทุกครั้งเก็บประวัติ ใคร/เมื่อ/เดิม→ใหม่ + โผล่ trace — `comment-convention.md` (CC1–CC7)** |
| **★ หมายเหตุ DN (DN comment)** | free-text (ช่องเดียว/DN), editable (แก้ในที่/overwrite) | **แก้ทุกครั้งเก็บประวัติ + โผล่ trace — `comment-convention.md`** · คนละฟิลด์กับ postpone/reject note |

## 4. Statuses / lifecycle (entity-status-map §1.9/§1.10)
- **Shipment (รอบ):** รับเข้ารอบ → กำลังนำส่ง → **จบรอบ (Closed) auto** เมื่อ DN ทุกใบถึงสถานะสุดท้าย · ระหว่างทาง = "ส่งบางส่วน (Partially)".
- **DN:** กำลังนำส่ง → ส่งถึงแล้ว / ถูกปฏิเสธ / เลื่อนส่ง.
  - **ส่งถึงแล้ว:** PO/SO=ส่งถึงแล้ว; เริ่มนับ overdue; noti Finance+Sale (C10). ตัด FG FIFO ราย Batch.
  - **ถูกปฏิเสธ:** PO→พร้อมจัดส่ง (กลับคิว) + raise Sale; รอสร้าง DN รอบใหม่ (C11).
  - **เลื่อนส่ง:** PO→พร้อมจัดส่ง + flag "Postpone <date>" ค้างคิว; noti Shipping (C12).

## 4b. ★ Comment + change-history (Shipment & DN — ยึด `comment-convention.md`)
- **Shipment (รอบ) มีช่อง comment เดียว** และ **DN มีช่อง comment เดียว** — แต่ละ object แยกช่องกัน · แก้ในที่ (overwrite).
- ทุกครั้งที่แก้ → เก็บ **ใคร/เมื่อ/ค่าเดิม→ค่าใหม่** ผ่าน field-audit เดิม; หน้า shipping/delivery-note แสดง **ค่าปัจจุบัน + affordance "ประวัติการแก้ไข comment"** ต่อรอบ/ต่อ DN.
- การแก้ = activity-log event + **โผล่บน trace** (entity=Shipment หรือ DN, field=`comment`). กติกาเต็ม = `comment-convention.md` (CC1–CC7) · **คนละฟิลด์** กับ postpone date / reject note.

## 5. User Stories (absorbed) + AC สรุป
- **US-SHP-01 (Must) — สร้างรอบ + DN ราย order:** PO-176 "พร้อมจัดส่ง" → สร้างรอบ + คนขับ/เบอร์/route/ประเภทรถ → **★ กด "สร้างรอบ" → ออกเลข SHP-…-0044 + DN-…-00119 (=PO-176) พร้อมกัน + popup ยืนยัน (SHP + ทุก DN + summary) (G8/NS7)**; รอบ=รับเข้ารอบ→In-Route; PO→กำลังจัดส่ง (C9). **Edge:** ค้นด้วยชื่อบริษัท/เบอร์ contact → เลือกหลาย PO เข้ารอบเดียว → **1 DN ต่อ 1 PO** (หลาย DN ในรอบ → popup แสดงทุก DN, NS7). **Error:** เลือก PO ที่ยังผลิตอยู่ → เลือกไม่ได้ (เฉพาะ "พร้อมจัดส่ง") + แจ้งเหตุผล · **สร้างรอบไม่สำเร็จ = ไม่ออกเลข SHP/DN (G8/NS4)**.
- **US-SHP-02 (Must) — DN Delivered/Rejected/Postponed:** **Delivered:** ลูกค้าเซ็น → "ส่งถึงแล้ว" → DN+PO ส่งถึง; เริ่มนับ overdue; noti Finance+Sale (C10). **Rejected:** DN-…-123 (PO-175) ปฏิเสธ → PO-175→พร้อมจัดส่ง (กลับคิว) + raise Sale; รอ DN รอบใหม่ (C11). **Postponed:** DN-…-124 (PO-178) ขอเลื่อน 10/07 → PO-178→พร้อมจัดส่ง + flag "Postpone 10/07" ค้างคิว; noti Shipping (C12).
- **US-SHP-03 (Must) — Reconcile รอบ + print DN:** SHP-0045 2 DN ส่งถึงครบ → รอบ=จบรอบ (Closed) auto. **Edge:** SHP-0046 (1 ส่งถึง + 1 ปฏิเสธ + 1 เลื่อน) → หัวรอบแสดง "ส่งบางส่วน (Partially)" + breakdown 3 DN; รอบยังไม่ปิดจนทุก DN ถึงสถานะสุดท้าย. **Error:** print DN ที่ยังไม่สร้าง (PO ยังไม่ใส่รอบ) → ไม่มีปุ่มพิมพ์ / error "ยังไม่มีใบจัดส่งสำหรับ PO นี้".

## 6. Actions & Permissions (D14)
| ปุ่ม/action | Permission required |
|---|---|
| ดูคิว/รอบ/DN + **ดูประวัติ comment** | Shipping.**Read (R)** |
| สร้างรอบ/DN (อ้าง PO หรือ SO, ★ ออกเลข SHP+DN) | Shipping.**Create (C)** |
| อัปเดตผล DN (Delivered/Rejected/Postponed) | Shipping.**Update (U)** |
| **แก้ไข comment รอบ/DN (แก้ในที่)** | Shipping.**Update (U)** (เก็บประวัติ auto — comment-convention.md) |
| print DN | Shipping.**Read (R)** |

## 7. Validations
- เข้ารอบได้เฉพาะ order สถานะ "พร้อมจัดส่ง".
- 1 DN = 1 PO/SO (ห้ามรวมหลาย order ใน DN เดียว).
- **★ เลข SHP + ทุก DN ในรอบ ออกตอน "สร้างรอบ" สำเร็จเท่านั้น (G8/NS2, NS7) — สร้างรอบไม่สำเร็จ = ไม่ออกเลข (NS4).**
- print DN ต้องมี DN แล้ว.
- เลื่อนส่ง = ระบุวันที่.
- **★ comment รอบ/DN (หมายเหตุทั่วไป) = ไม่บังคับ** · แก้ได้ทุกสถานะ · ทุกการแก้ถูก audit (comment-convention.md CC2/CC3).

## 8. Pagination / Search
- คิว/รอบ/DN: 20/หน้า (G1) · ค้น PO/SO ID / ข้อมูลลูกค้า / เลข SHP/DN / ช่วงวันที่ (G2).

## 9. Formulas
- รอบ Closed เมื่อ ทุก DN ∈ {ส่งถึงแล้ว, ถูกปฏิเสธ(จัดการแล้ว), เลื่อนส่ง(จัดการแล้ว)} (สถานะสุดท้าย).
- FG ตัดตอน dispatch = FIFO ราย Batch (D16).

## 10. Cross-links
- order พร้อมจัดส่ง (C9) → `po.md`/`so.md`. Delivered→เริ่มนับเครดิต (C10) → `invoice.md`. Reject (C11)/Postpone (C12) → continuity. FG dispatch FIFO → `stock.md`.
- **★ เลข SHP+DN ออกตอนสร้างรอบ (G8/NS7) → `numbering-on-save.md` · gapless → `non-functional.md` §5 (D-F2).**
- **Comment + change-history → `comment-convention.md` · field-audit → `traceability.md` §4.**

## 11. Module changelog
- **Absorbed:** functional-spec `shipping.html` US-SHP-01..03 (9 AC) verbatim ในความหมาย.
- **เพิ่ม (delta):** DN รองรับ **SO (Own-Brand)** ไม่ใช่แค่ PO — สอดคล้อง scope ใหม่ (sell-from-stock → Ready to Ship → Delivery).
- **★ เพิ่ม (2026-07-29 — number-on-save G8, extend, ปอนด์ cross-cutting):** **เลข SHP + ทุก DN ในรอบ ออก gapless ตอน "สร้างรอบ" สำเร็จ + popup ยืนยัน (SHP + ทุก DN + summary)** — §2/§3/§5/§6/§7/§10, ยึด `numbering-on-save.md` (G8/NS2/NS4, **NS7** หลายเลข/รอบ).
- **★ เพิ่ม (2026-07-29 — comment cross-cutting feedback, PO module 3 review):** ช่อง **หมายเหตุ (comment)** แบบแก้ในที่ + **เก็บประวัติการแก้ครบ** ทั้งบน **Shipment (รอบ) และ DN** — ยึด `comment-convention.md` (§3 fields, §4b, §6 permission). คนละฟิลด์กับ postpone date/reject note.
- **คงเดิม:** 2 ชั้น Shipment/DN · 1 DN=1 order · reconcile Partially/Closed · Reject/Postpone behavior.
