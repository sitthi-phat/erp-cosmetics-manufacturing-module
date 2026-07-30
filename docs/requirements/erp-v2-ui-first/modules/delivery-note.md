# Module — Delivery Note (DN · ใบจัดส่ง)

slug: `erp-v2-ui-first` · per-module canonical · PO · 2026-07-30 · **AUTHORITATIVE SPEC (Module C — DN แยกจาก Route · Q1=A LOCKED · + Invoice DN-unify 2026-07-30)**
Mockups: `mockups/delivery-note.html`
กฎอ้างอิง: entity-status-map §1.10 (DN lifecycle) · **`shipping.md` (Module B — Route ที่ gen DN · §4b เสร็จสิ้น · §4d ยกเลิกรอบ)** · **`po.md` §4b (PO delivery status = สะท้อนจาก DN)** · **`so.md` §4 (SO เช่นเดียวกัน)** · **`invoice.md` §4b/§5 (★ DN-unify: สร้าง/พิมพ์ Invoice จากหน้า DN = ใบ active เดียวกันของ PO/SO · ส่งสำเร็จ→เริ่มนับเครดิต)** · `customer.md` §3/§9b (ที่อยู่จัดส่ง + ผู้รับสินค้า) · stock (FG FIFO ตอน dispatch, D16) · README §3 (**G6/G8/G9**) · **`comment-convention.md`** · **`numbering-on-save.md` (G8 — เลข DN ออกพร้อม Route, NS7)** · **`permission-matrix.md` (แก้สถานะ DN = A)**

## สรุปภาษาไทย
ใบจัดส่ง **DN = 1 ใบต่อ 1 PO/SO** — **สร้างตรงไม่ได้ เกิดผ่าน Route process เท่านั้น** (`shipping.md`). **สถานะ DN 6 สถานะ:** **อยู่ระหว่างการเตรียม** (Route ถูกสร้าง/เพิ่ม PO-SO เข้ารอบ+บันทึก) → **อยู่ระหว่างจัดส่ง** (Route → กำลังออกไปส่ง) → **ส่งสำเร็จ** / **ลูกค้าเลื่อนส่ง** (บังคับวันนัดถัดไป) / **ลูกค้ายกเลิก** / **ลูกค้ายังไม่กำหนดวันรับใหม่ (ฝากที่เราไว้ก่อน)** (4 ตัวหลังเกิดใน Route "เสร็จสิ้น" process). **(นอกจากนี้ ถ้า Route ถูกยกเลิกทั้งรอบ → DN = void เป็นประวัติ, ไม่ใช่สถานะจัดส่งของลูกค้า — shipping.md §4d).** **ค้น DN ด้วย:** ชื่อคนขับ/username คนขับ/route id (+ ช่วงวันที่ พร้อม dropdown ชนิดวัน = วันที่สร้าง route/วันที่ route ออกไป) · **ด้วย PO/SO** (ถ้ายังไม่มี DN → ช่อง DN ว่าง) · **ด้วยวันที่ลูกค้าต้องการรับ** · **filter สถานะ DN**. **พิมพ์ DN** (จากข้อมูลลูกค้า+PO/SO) และ **★★ สร้าง/พิมพ์ Invoice จากหน้า DN = ใบ active เดียวกันของ PO/SO (DN-unify กับโมดูล Invoice — ไม่เกิดใบซ้ำ, §5)**. **มีช่องหมายเหตุต่อ DN (comment, G6)**. **แก้สถานะ DN ได้โดยตรงจากหน้า DN — ต้องมีสิทธิ์ A (Approve)** (G9 suffix). **★ สถานะจัดส่งของ PO = LINKED จากสถานะ DN** — PO แสดงสถานะของตัวเองถึง "พร้อมจัดส่ง" แล้วสะท้อนสถานะ DN (`po.md` §4b) — **ทุกจอที่โชว์สถานะ PO ต้องใช้ logic นี้**.

---

## 1. Purpose
ออกใบส่งของ (DN) ราย order ให้ลูกค้าเซ็น, พิมพ์ DN/Invoice, ติดตามผลการส่งราย DN, และเป็น **ต้นทางของสถานะจัดส่งที่ PO/SO สะท้อน**. DN ผูก Route ต้นทาง (`shipping.md`).

## 2. Screens
| หน้าจอ | บทบาท |
|---|---|
| `delivery-note.html` | รายการ DN · search (คนขับ/username/route id + ช่วงวันที่ชนิดวัน · PO/SO · วันที่ลูกค้าต้องการรับ) + **filter สถานะ DN** · **print DN / สร้าง-พิมพ์ Invoice (ใบ active เดียวกัน)** · **comment ต่อ DN + "ประวัติการแก้ไข comment"** · **แก้สถานะ DN โดยตรง (A)** · reconcile รอบ (breakdown ราย DN) |

## 3. Fields (DN)
| ฟิลด์ | ชนิด | editable/computed | หมายเหตุ |
|---|---|---|---|
| **เลข DN `DN-{YYYYMMDD}-{NNNNN}`** | string | computed | **1 DN = 1 PO/SO** · **★ ออกพร้อม Route (ทุก DN ในรอบ) ตอน "สร้างรอบ" (G8/NS7)** · **สร้างตรงไม่ได้ (§4)** |
| RouteID ต้นทาง `RT-…` | ref Route | computed | รอบที่ gen DN นี้ (shipping.md) |
| PO/SO ต้นทาง | ref PO หรือ SO | computed | 1:1 |
| ลูกค้า | ref customer | computed | ชื่อ + **ที่อยู่จัดส่ง + ผู้รับสินค้า(ชื่อ+เบอร์)** (customer.md §3/§9b) — โผล่บนหัว DN |
| วันที่ลูกค้าต้องการรับ (desired receive date) | date | computed (จาก PO/SO) | แกนค้น "วันที่ลูกค้าต้องการรับ" |
| สถานะ DN | enum (6 — §7) | editable (Route process **หรือ** แก้ตรง A) | §7 · void ถ้า Route ยกเลิก (§4) |
| **next delivery date (วันนัดส่งครั้งถัดไป)** | date | editable | **บังคับเมื่อสถานะ = ลูกค้าเลื่อนส่ง** |
| **★ หมายเหตุ DN (comment)** | free-text (ช่องเดียว/DN), editable (แก้ในที่/overwrite) | **แก้ทุกครั้งเก็บประวัติ + โผล่ trace — `comment-convention.md`** · **บังคับกรอกเมื่ออัปเดตสถานะใน "เสร็จสิ้น" process (shipping.md §4b)** |

## 4. ★ DN เกิดจาก Route เท่านั้น (ห้ามสร้างตรง)
- **ไม่มีหน้า create DN** — DN ถูก gen **อัตโนมัติตอน "สร้าง Route" (shipping.md §5)** ราย order ในรอบ (1 DN ต่อ 1 PO/SO).
- ค้นด้วย PO/SO ที่ **ยังไม่มี DN** → แสดงผล **DN = ว่าง (blank)** (order นั้นยังไม่เข้ารอบ).
- order ที่ re-route (หลังเลื่อน/ยกเลิก/ยังไม่กำหนดวัน) → รอบใหม่ gen **DN ใบใหม่**; DN เดิมคงสถานะสุดท้ายเป็นประวัติ.
- **★ Route ที่ gen DN ถูกยกเลิกทั้งรอบ (shipping.md §4d) → DN = void** (คงเลขเป็นประวัติ, G8/NS5) — **ไม่ใช่สถานะจัดส่งของลูกค้า**; order (PO/SO) ที่ยังไม่ dispatch **กลับคิว "พร้อมจัดส่ง"** (เข้ารอบใหม่ได้ = gen DN ใบใหม่).

## 5. Print DN + สร้าง/Print Invoice (★ DN-unify กับโมดูล Invoice)
- **พิมพ์ DN (print DN):** สร้างจาก **ข้อมูลลูกค้า (ชื่อ/ที่อยู่จัดส่ง/ผู้รับ+เบอร์) + PO/SO (รายการ/จำนวน)** — Shipping.**Read (R)**.
- **★★ สร้าง/พิมพ์ Invoice จากหน้า DN = ทำงานบน "ใบ active ของ PO/SO เดียวกัน" (DN-unify · `invoice.md` §4b/§5 US-INV-05):**
  - PO/SO **ยังไม่มีใบแจ้งหนี้ active** → ปุ่ม **"สร้างใบแจ้งหนี้ (C)"** = **สร้างใบ active** ผ่านกติกา `invoice.md` (pull ข้อมูลลูกค้า + ออกเลข INV แบบ G8 + popup ยืนยัน) → **ใบนี้เป็นใบเดียวกันที่โผล่ในโมดูล Invoice** (ไม่ใช่คนละใบ). สิทธิ์ = Invoice.**Create (C)**.
  - PO/SO **มีใบ active แล้ว** → ปุ่ม **"พิมพ์ Invoice (R)"** = พิมพ์ **ใบ active ใบเดิม** (ไม่สร้างใบซ้ำ). สิทธิ์ = Invoice.**Read (R)**.
  - **หลักการ unify:** ไม่ว่าจะเข้าจากหน้า DN หรือหน้า Invoice → **ใบแจ้งหนี้ของ PO/SO = ใบ active เดียวกัน** (1 active ต่อ PO/SO, `invoice.md` §4b). ห้ามเกิดใบซ้ำจาก 2 ทางเข้า.
- ต้องมี DN แล้วจึงพิมพ์ DN ได้ (order ที่ยังไม่เข้ารอบ = ไม่มีปุ่มพิมพ์ DN / error "ยังไม่มีใบจัดส่งสำหรับ PO/SO นี้"). *(การสร้าง/พิมพ์ Invoice ผูกกับ PO/SO ตามกติกา `invoice.md` — เฟสนี้ไม่ล็อกสถานะการสร้างใบ.)*
- **★ แหล่งข้อมูล (data source):** print DN ใช้ **ที่อยู่จัดส่ง (shipping address)** + **ผู้รับสินค้า** จาก `customer.md` §9b · Invoice ใช้ **ที่อยู่ลูกค้า (registered) + เลขภาษี** จาก `customer.md` §3 (pull ตอนสร้างใบ แล้ว **แก้ในใบได้ per-invoice override — `invoice.md` §3**) · รายการ/จำนวน/ราคา จาก PO/SO ต้นทาง.

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
| **ส่งสำเร็จ (Delivered)** | ใน **Route "เสร็จสิ้น" process** (DN update) → ตัด FG FIFO ราย Batch · PO/SO ส่งสำเร็จ · **เริ่มนับ overdue (credit due = วันส่งสำเร็จ + credit term — `invoice.md` §9)** · noti Finance+Sale |
| **ลูกค้าเลื่อนส่ง (Postponed)** | Route "เสร็จสิ้น" process → **บังคับกรอก next delivery date** · order ค้างคิว รอ re-route |
| **ลูกค้ายกเลิก (Cancelled)** | Route "เสร็จสิ้น" process → การส่งถูกยกเลิก |
| **ลูกค้ายังไม่กำหนดวันรับใหม่ (ฝากที่เราไว้ก่อน) (Awaiting-new-date)** | Route "เสร็จสิ้น" process → ของฝากไว้ที่เรา รอลูกค้ากำหนดวัน |
> ทั้ง 6 สถานะเข้าถึงได้ผ่าน (a) Route "เสร็จสิ้น" process (shipping.md §4b) หรือ (b) แก้ตรงบนหน้า DN (สิทธิ์ A, §6).
> **★ นอกเหนือ 6 สถานะข้างต้น (void):** ถ้า **Route ที่ gen DN ถูก "ยกเลิก" ทั้งรอบ (shipping.md §4d)** → DN = **void** (คงเลขเป็นประวัติ, ไม่ขับสถานะจัดส่งของ PO/SO); order ที่ยังไม่ dispatch กลับคิว "พร้อมจัดส่ง". void ≠ "ลูกค้ายกเลิก" (ลูกค้ายกเลิก = ผลการส่งราย DN ที่ตั้งใจ; void = ทั้งรอบถูกล้ม).

## 8. ★ PO/SO delivery status = LINKED จาก DN status (rule กลาง)
> **กติกา (บังคับทุกจอที่แสดงสถานะ PO/SO):** สถานะ **จัดส่ง** ของ PO/SO ไม่ใช่ enum แยกอิสระหลัง "พร้อมจัดส่ง" — มันคือ **การสะท้อน (reflect) สถานะของ DN ที่ผูกอยู่**.
- **PO แสดงสถานะของตัวเอง** จนถึง **พร้อมจัดส่ง**: `ร่าง · ยืนยันแล้ว-รอรับงาน · กำลังผลิต · … (สถานะ PO อื่น) … · พร้อมจัดส่ง`.
- **หลังจากนั้น PO สะท้อนสถานะ DN:** `อยู่ระหว่างการเตรียม · อยู่ระหว่างจัดส่ง · ส่งสำเร็จ · ลูกค้าเลื่อนส่ง · ลูกค้ายกเลิก(การส่ง) · ลูกค้ายังไม่กำหนดวันรับใหม่`.
- **นิยาม authoritative + rollup (1 PO หลาย DN) = `po.md` §4b** · **SO = `so.md` §4**. **rollup = DN ล่าสุด (active); DN เก่าที่ re-route/void = ประวัติ (ไม่ขับสถานะ).**
- **DN void จาก Route ยกเลิก → PO/SO กลับไปแสดง "พร้อมจัดส่ง"** (ไม่มี DN active — §4/§7).
- **ทุก module/จอที่โชว์สถานะ PO ต้องใช้ logic เดียวกันนี้:** po-list · po-detail · dashboard · คิวงานผลิต (production queue). ระบุเป็น rule ที่ `po.md` §4b + entity-status-map §1.2.

## 9. Actions & Permissions (D14 / G9)
| ปุ่ม/action | Permission required | Suffix (G9) |
|---|---|---|
| ดู list/detail DN + ดูประวัติ comment | Shipping.**Read (R)** | (R) |
| **print DN** | Shipping.**Read (R)** | (R) |
| **★ สร้างใบแจ้งหนี้ (ถ้ายังไม่มีใบ active)** | Invoice.**Create (C)** | **(C)** |
| **print Invoice (ใบ active)** | Invoice.**Read (R)** | **(R)** |
| แก้ไข comment DN (แก้ในที่) | Shipping.**Update (U)** | **(U)** |
| **★ แก้สถานะ DN โดยตรง** | Shipping.**Approve (A)** + comment | **(A)** |
| อัปเดตสถานะ DN ผ่าน Route "เสร็จสิ้น" | Shipping.**Update (U)** (ส่วนของ Route process) | **(U)** |

## 10. Validations
- **★ สร้าง DN ตรงไม่ได้** — เกิดผ่าน Route เท่านั้น (§4).
- print DN ต้องมี DN แล้ว.
- **★ สร้าง/พิมพ์ Invoice จากหน้า DN = ใบ active เดียวกันของ PO/SO (ห้ามใบซ้ำ) — มีใบ active แล้ว = พิมพ์ (R); ยังไม่มี = สร้าง (C)** (`invoice.md` §4b).
- **★ สถานะ = ลูกค้าเลื่อนส่ง → บังคับ next delivery date.**
- **★ อัปเดตสถานะ DN (ทั้ง Route process และแก้ตรง) → บังคับ comment ต่อ DN (G6).**
- **★ แก้สถานะ DN โดยตรง = ต้องมีสิทธิ์ A (Approve).**
- comment (หมายเหตุทั่วไปนอก status-update) = ไม่บังคับ · แก้ได้ทุกสถานะ · audit ทุกครั้ง.

## 11. Pagination / Search
- DN list: 20/หน้า (G1).
- **ค้นด้วย:** ชื่อคนขับ / username คนขับ / route id (+ **ช่วงวันที่ พร้อม dropdown ชนิดวัน = {วันที่สร้าง route · วันที่ route ออกไปส่ง}**) · **PO/SO** (ไม่มี DN → DN ว่าง) · **วันที่ลูกค้าต้องการรับ** · **filter สถานะ DN** (6 ค่า).

## 12. Cross-links
- **Route ที่ gen DN → `shipping.md` (Module B) §4b/§4d/§5.**
- **PO/SO delivery status reflect DN → `po.md` §4b · `so.md` §4 · entity-status-map §1.2/§1.10.**
- **★★ สร้าง/พิมพ์ Invoice จากหน้า DN = ใบ active เดียวกันของ PO/SO (DN-unify) · ส่งสำเร็จ→เริ่มนับเครดิต → `invoice.md` §4b/§5/§9.**
- ที่อยู่จัดส่ง + ผู้รับสินค้า (หัว DN) → `customer.md` §3/§9b.
- FG dispatch FIFO → `stock.md` · D16.
- เลข DN ออกพร้อม Route (G8/NS7) → `numbering-on-save.md` · gapless → `non-functional.md` §5 (D-F5).
- Comment + change-history → `comment-convention.md` · แก้สถานะ DN = A → `permission-matrix.md` §3 · field-audit → `traceability.md` §3/§4.

## 13. Module changelog
- **★★ NEW (2026-07-30 — Module C, ปอนด์):** แยก DN เป็น module เอกสารของตัวเอง (เดิม fold ใน shipping.md). **DN status 6 สถานะใหม่** (อยู่ระหว่างการเตรียม/อยู่ระหว่างจัดส่ง/ส่งสำเร็จ/ลูกค้าเลื่อนส่ง/ลูกค้ายกเลิก/ลูกค้ายังไม่กำหนดวันรับใหม่) แทนชุดเดิม (กำลังนำส่ง/ส่งถึงแล้ว/ถูกปฏิเสธ/เลื่อนส่ง). **สร้าง DN ตรงไม่ได้ (Route เท่านั้น).** **ค้น DN** (คนขับ/username/route-id/ช่วงวันชนิดวัน · PO/SO · วันที่ลูกค้าต้องการรับ) + **filter สถานะ**. **print DN + print Invoice.** **comment ต่อ DN (G6).** **★ แก้สถานะ DN โดยตรง = สิทธิ์ A (Approve).** **★ PO delivery status = linked จาก DN status (rule กลาง §8, authoritative `po.md` §4b).** sync `shipping.md` · `po.md` §4b · `so.md` §4 · entity-status-map §1.10 · `permission-matrix.md` · `traceability.md` · `numbering-on-save.md` · `non-functional.md`.
- **★ เพิ่ม (2026-07-30 — Q1=A lock, ปอนด์):** §4/§7 DN void เมื่อ Route ถูกยกเลิกทั้งรอบ (shipping.md §4d) — คงเลขเป็นประวัติ, order กลับคิว "พร้อมจัดส่ง"; §5 print data-source ชัด (DN = shipping addr+receiver · Invoice = registered addr+tax id); §8 rollup = DN ล่าสุด + DN void → PO/SO กลับ "พร้อมจัดส่ง". Route rename SHP→RT = Q1=A DECIDED.
- **★★ เพิ่ม (2026-07-30 — Invoice module review, ปอนด์):** **§5/§9/§10/§12 DN-unify** — ปุ่ม "สร้าง/พิมพ์ Invoice" บนหน้า DN = ทำงานบน **ใบ active เดียวกันของ PO/SO** (ยังไม่มีใบ = สร้าง Invoice.C + G8; มีแล้ว = พิมพ์ Invoice.R) → **ใบเดียวกันโผล่ในโมดูล Invoice ไม่เกิดใบซ้ำ**; Invoice pull ข้อมูลลูกค้า + per-invoice override (`invoice.md` §3/§4b/§5). ref `invoice.md`.
- **หมายเหตุ HTML view:** `delivery-note.html` (functional-spec view) + `_render.js` map + ลิงก์ใน index.html (COMPLETENESS RULE).
