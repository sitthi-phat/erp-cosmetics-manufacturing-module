# Module — Delivery Note (DN · ใบจัดส่ง)

slug: `erp-v2-ui-first` · per-module canonical · PO · 2026-07-30 · **AUTHORITATIVE SPEC (Module C — DN แยกจาก Route)**
Mockups: `mockups/delivery-note.html`
กฎอ้างอิง: entity-status-map §1.10 (DN lifecycle) · **`shipping.md` (Module B — Route ที่ gen DN)** · **`po.md` §4b (PO delivery status = สะท้อนจาก DN)** · **`so.md` §4 (SO เช่นเดียวกัน)** · `invoice.md` (ส่งสำเร็จ→เริ่มนับเครดิต · print Invoice) · `customer.md` §3/§9b (ที่อยู่จัดส่ง + ผู้รับสินค้า) · stock (FG FIFO ตอน dispatch, D16) · README §3 (**G6/G8/G9**) · **`comment-convention.md`** · **`numbering-on-save.md` (G8 — เลข DN ออกพร้อม Route, NS7)** · **`permission-matrix.md` (แก้สถานะ DN = A)**

## สรุปภาษาไทย
ใบจัดส่ง **DN = 1 ใบต่อ 1 PO/SO** — **สร้างตรงไม่ได้ เกิดผ่าน Route process เท่านั้น** (`shipping.md`). **สถานะ DN 6 สถานะ:** **อยู่ระหว่างการเตรียม** (Route ถูกสร้าง/เพิ่ม PO-SO เข้ารอบ+บันทึก) → **อยู่ระหว่างจัดส่ง** (Route → กำลังออกไปส่ง) → **ส่งสำเร็จ** / **ลูกค้าเลื่อนส่ง** (บังคับวันนัดถัดไป) / **ลูกค้ายกเลิก** / **ลูกค้ายังไม่กำหนดวันรับใหม่ (ฝากที่เราไว้ก่อน)** (4 ตัวหลังเกิดใน Route "เสร็จสิ้น" process). **ค้น DN ด้วย:** ชื่อคนขับ/username คนขับ/route id (+ ช่วงวันที่ พร้อม dropdown ชนิดวัน = วันที่สร้าง route/วันที่ route ออกไป) · **ด้วย PO/SO** (ถ้ายังไม่มี DN → ช่อง DN ว่าง) · **ด้วยวันที่ลูกค้าต้องการรับ** · **filter สถานะ DN**. **พิมพ์ได้ 2 อย่าง: พิมพ์ DN** (จากข้อมูลลูกค้า+PO/SO) และ **พิมพ์ Invoice** (จากข้อมูลลูกค้า+PO/SO). **มีช่องหมายเหตุต่อ DN (comment, G6)**. **แก้สถานะ DN ได้โดยตรงจากหน้า DN — ต้องมีสิทธิ์ A (Approve)** (G9 suffix). **★ สถานะจัดส่งของ PO = LINKED จากสถานะ DN** — PO แสดงสถานะของตัวเองถึง "พร้อมจัดส่ง" แล้วสะท้อนสถานะ DN (`po.md` §4b) — **ทุกจอที่โชว์สถานะ PO ต้องใช้ logic นี้**.

---

## 1. Purpose
ออกใบส่งของ (DN) ราย order ให้ลูกค้าเซ็น, พิมพ์ DN/Invoice, ติดตามผลการส่งราย DN, และเป็น **ต้นทางของสถานะจัดส่งที่ PO/SO สะท้อน**. DN ผูก Route ต้นทาง (`shipping.md`).

## 2. Screens
| หน้าจอ | บทบาท |
|---|---|
| `delivery-note.html` | รายการ DN · search (คนขับ/username/route id + ช่วงวันที่ชนิดวัน · PO/SO · วันที่ลูกค้าต้องการรับ) + **filter สถานะ DN** · **print DN / print Invoice** · **comment ต่อ DN + "ประวัติการแก้ไข comment"** · **แก้สถานะ DN โดยตรง (A)** · reconcile รอบ (breakdown ราย DN) |

## 3. Fields (DN)
| ฟิลด์ | ชนิด | editable/computed | หมายเหตุ |
|---|---|---|---|
| **เลข DN `DN-{YYYYMMDD}-{NNNNN}`** | string | computed | **1 DN = 1 PO/SO** · **★ ออกพร้อม Route (ทุก DN ในรอบ) ตอน "สร้างรอบ" (G8/NS7)** · **สร้างตรงไม่ได้ (§4)** |
| RouteID ต้นทาง `RT-…` | ref Route | computed | รอบที่ gen DN นี้ (shipping.md) |
| PO/SO ต้นทาง | ref PO หรือ SO | computed | 1:1 |
| ลูกค้า | ref customer | computed | ชื่อ + **ที่อยู่จัดส่ง + ผู้รับสินค้า(ชื่อ+เบอร์)** (customer.md §3/§9b) — โผล่บนหัว DN |
| วันที่ลูกค้าต้องการรับ (desired receive date) | date | computed (จาก PO/SO) | แกนค้น "วันที่ลูกค้าต้องการรับ" |
| สถานะ DN | enum (6 — §4) | editable (Route process **หรือ** แก้ตรง A) | §4 |
| **next delivery date (วันนัดส่งครั้งถัดไป)** | date | editable | **บังคับเมื่อสถานะ = ลูกค้าเลื่อนส่ง** |
| **★ หมายเหตุ DN (comment)** | free-text (ช่องเดียว/DN), editable (แก้ในที่/overwrite) | **แก้ทุกครั้งเก็บประวัติ + โผล่ trace — `comment-convention.md`** · **บังคับกรอกเมื่ออัปเดตสถานะใน "เสร็จสิ้น" process (shipping.md §4b)** |

## 4. ★ DN เกิดจาก Route เท่านั้น (ห้ามสร้างตรง)
- **ไม่มีหน้า create DN** — DN ถูก gen **อัตโนมัติตอน "สร้าง Route" (shipping.md §5)** ราย order ในรอบ (1 DN ต่อ 1 PO/SO).
- ค้นด้วย PO/SO ที่ **ยังไม่มี DN** → แสดงผล **DN = ว่าง (blank)** (order นั้นยังไม่เข้ารอบ).
- order ที่ re-route (หลังเลื่อน/ยกเลิก/ยังไม่กำหนดวัน) → รอบใหม่ gen **DN ใบใหม่**; DN เดิมคงสถานะสุดท้ายเป็นประวัติ.

## 5. Print DN + Print Invoice
- **พิมพ์ DN (print DN):** สร้างจาก **ข้อมูลลูกค้า (ชื่อ/ที่อยู่จัดส่ง/ผู้รับ+เบอร์) + PO/SO (รายการ/จำนวน)** — Shipping.**Read (R)**.
- **พิมพ์ Invoice (print Invoice):** สร้างจาก **ข้อมูลลูกค้า (ที่อยู่ออกเอกสาร/เลขภาษี) + PO/SO** — Invoice.**Read (R)** · ยึดกติกา `invoice.md`.
- ต้องมี DN แล้วจึงพิมพ์ได้ (order ที่ยังไม่เข้ารอบ = ไม่มีปุ่มพิมพ์ / error "ยังไม่มีใบจัดส่งสำหรับ PO/SO นี้").

## 6. ★ Comment + แก้สถานะ DN โดยตรง
- **Comment ต่อ DN (G6):** ช่องเดียว/DN · แก้ในที่ · เก็บประวัติครบ (`comment-convention.md`) · **คนละฟิลด์กับ next delivery date**.
- **★ แก้สถานะ DN โดยตรงจากหน้า DN = ต้องมีสิทธิ์ Approve (A)** — เป็นทางเข้าที่ 2 (นอกจาก Route "เสร็จสิ้น" process, shipping.md §4b). ทุกการแก้สถานะ **บังคับ comment ต่อ DN** + audit.
  - **สิทธิ์:** DN status edit = **Shipping.Approve (A)** — G9 suffix **(A)** (`permission-matrix.md` §3).
  - เปลี่ยนเป็น "ลูกค้าเลื่อนส่ง" ตรง ๆ → บังคับ next delivery date.

## 7. Statuses / lifecycle (DN — entity-status-map §1.10)
| สถานะ DN | เกิดตอน (how reached) |
|---|---|
| **อยู่ระหว่างการเตรียม (Preparing)** | เมื่อ **Route ถูกสร้าง** หรือ **เพิ่ม PO/SO เข้ารอบแล้วบันทึก** (Route = เตรียมจัดของ) |
| **อยู่ระหว่างจัดส่ง (Out for delivery)** | เมื่อ **Route → กำลังออกไปส่ง** |
| **ส่งสำเร็จ (Delivered)** | ใน **Route "เสร็จสิ้น" process** (DN update) → ตัด FG FIFO ราย Batch · PO/SO ส่งสำเร็จ · เริ่มนับ overdue · noti Finance+Sale |
| **ลูกค้าเลื่อนส่ง (Postponed)** | Route "เสร็จสิ้น" process → **บังคับกรอก next delivery date** · order ค้างคิว รอ re-route |
| **ลูกค้ายกเลิก (Cancelled)** | Route "เสร็จสิ้น" process → การส่งถูกยกเลิก |
| **ลูกค้ายังไม่กำหนดวันรับใหม่ (ฝากที่เราไว้ก่อน) (Awaiting-new-date)** | Route "เสร็จสิ้น" process → ของฝากไว้ที่เรา รอลูกค้ากำหนดวัน |
> ทั้ง 6 สถานะเข้าถึงได้ผ่าน (a) Route "เสร็จสิ้น" process (shipping.md §4b) หรือ (b) แก้ตรงบนหน้า DN (สิทธิ์ A, §6).

## 8. ★ PO/SO delivery status = LINKED จาก DN status (rule กลาง)
> **กติกา (บังคับทุกจอที่แสดงสถานะ PO/SO):** สถานะ **จัดส่ง** ของ PO/SO ไม่ใช่ enum แยกอิสระหลัง "พร้อมจัดส่ง" — มันคือ **การสะท้อน (reflect) สถานะของ DN ที่ผูกอยู่**.
- **PO แสดงสถานะของตัวเอง** จนถึง **พร้อมจัดส่ง**: `ร่าง · ยืนยันแล้ว-รอรับงาน · กำลังผลิต · … (สถานะ PO อื่น) … · พร้อมจัดส่ง`.
- **หลังจากนั้น PO สะท้อนสถานะ DN:** `อยู่ระหว่างการเตรียม · อยู่ระหว่างจัดส่ง · ส่งสำเร็จ · ลูกค้าเลื่อนส่ง · ลูกค้ายกเลิก(การส่ง) · ลูกค้ายังไม่กำหนดวันรับใหม่`.
- **นิยาม authoritative + rollup (1 PO หลาย DN) = `po.md` §4b** · **SO = `so.md` §4**.
- **ทุก module/จอที่โชว์สถานะ PO ต้องใช้ logic เดียวกันนี้:** po-list · po-detail · dashboard · คิวงานผลิต (production queue) · home. ระบุเป็น rule ที่ `po.md` §4b + entity-status-map §1.2.

## 9. Actions & Permissions (D14 / G9)
| ปุ่ม/action | Permission required | Suffix (G9) |
|---|---|---|
| ดู list/detail DN + ดูประวัติ comment | Shipping.**Read (R)** | (R) |
| **print DN** | Shipping.**Read (R)** | (R) |
| **print Invoice** | Invoice.**Read (R)** | (R) |
| แก้ไข comment DN (แก้ในที่) | Shipping.**Update (U)** | **(U)** |
| **★ แก้สถานะ DN โดยตรง** | Shipping.**Approve (A)** + comment | **(A)** |
| อัปเดตสถานะ DN ผ่าน Route "เสร็จสิ้น" | Shipping.**Update (U)** (ส่วนของ Route process) | **(U)** |

## 10. Validations
- **★ สร้าง DN ตรงไม่ได้** — เกิดผ่าน Route เท่านั้น (§4).
- print DN/Invoice ต้องมี DN แล้ว.
- **★ สถานะ = ลูกค้าเลื่อนส่ง → บังคับ next delivery date.**
- **★ อัปเดตสถานะ DN (ทั้ง Route process และแก้ตรง) → บังคับ comment ต่อ DN (G6).**
- **★ แก้สถานะ DN โดยตรง = ต้องมีสิทธิ์ A (Approve).**
- comment (หมายเหตุทั่วไปนอก status-update) = ไม่บังคับ · แก้ได้ทุกสถานะ · audit ทุกครั้ง.

## 11. Pagination / Search
- DN list: 20/หน้า (G1).
- **ค้นด้วย:** ชื่อคนขับ / username คนขับ / route id (+ **ช่วงวันที่ พร้อม dropdown ชนิดวัน = {วันที่สร้าง route · วันที่ route ออกไปส่ง}**) · **PO/SO** (ไม่มี DN → DN ว่าง) · **วันที่ลูกค้าต้องการรับ** · **filter สถานะ DN** (6 ค่า).

## 12. Cross-links
- **Route ที่ gen DN → `shipping.md` (Module B) §4b/§5.**
- **PO/SO delivery status reflect DN → `po.md` §4b · `so.md` §4 · entity-status-map §1.2/§1.10.**
- print Invoice / ส่งสำเร็จ→เริ่มนับเครดิต → `invoice.md`.
- ที่อยู่จัดส่ง + ผู้รับสินค้า (หัว DN) → `customer.md` §3/§9b.
- FG dispatch FIFO → `stock.md` · D16.
- เลข DN ออกพร้อม Route (G8/NS7) → `numbering-on-save.md` · gapless → `non-functional.md` §5 (D-F5).
- Comment + change-history → `comment-convention.md` · แก้สถานะ DN = A → `permission-matrix.md` §3 · field-audit → `traceability.md` §3/§4.

## 13. Module changelog
- **★★ NEW (2026-07-30 — Module C, ปอนด์):** แยก DN เป็น module เอกสารของตัวเอง (เดิม fold ใน shipping.md). **DN status 6 สถานะใหม่** (อยู่ระหว่างการเตรียม/อยู่ระหว่างจัดส่ง/ส่งสำเร็จ/ลูกค้าเลื่อนส่ง/ลูกค้ายกเลิก/ลูกค้ายังไม่กำหนดวันรับใหม่) แทนชุดเดิม (กำลังนำส่ง/ส่งถึงแล้ว/ถูกปฏิเสธ/เลื่อนส่ง). **สร้าง DN ตรงไม่ได้ (Route เท่านั้น).** **ค้น DN** (คนขับ/username/route-id/ช่วงวันชนิดวัน · PO/SO · วันที่ลูกค้าต้องการรับ) + **filter สถานะ**. **print DN + print Invoice.** **comment ต่อ DN (G6).** **★ แก้สถานะ DN โดยตรง = สิทธิ์ A (Approve).** **★ PO delivery status = linked จาก DN status (rule กลาง §8, authoritative `po.md` §4b).** sync `shipping.md` · `po.md` §4b · `so.md` §4 · entity-status-map §1.10 · `permission-matrix.md` · `traceability.md` · `numbering-on-save.md` · `non-functional.md` D-F5.
- **หมายเหตุ HTML view:** เพิ่ม `delivery-note.html` (functional-spec view) + `_render.js` map + ลิงก์ใน index.html (COMPLETENESS RULE).
