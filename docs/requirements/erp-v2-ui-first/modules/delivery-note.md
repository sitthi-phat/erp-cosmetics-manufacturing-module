# Module — Delivery Note (DN · ใบจัดส่ง)

slug: `erp-v2-ui-first` · per-module canonical · PO · 2026-07-30 · **AUTHORITATIVE SPEC (Module C — DN แยกจาก Route · Q1=A LOCKED · + Invoice DN-unify 2026-07-30 · ★ + Gate-1 reconciliation r20 2026-07-31: (A2) DN "ยกเลิกการจัดส่ง" ≠ doc-cancel + order ไม่เปลี่ยน · (B7a) rollup "latest active DN" นิยามชัด · (C3) cancel blocked while active DN · (C4) held/customer-cancelled OEM → FG (OEM identity))**
Mockups: `mockups/delivery-note.html`
กฎอ้างอิง: entity-status-map §1.10 (DN lifecycle) · **`shipping.md` (Module B — Route ที่ gen DN · §4b เสร็จสิ้น · §4d ยกเลิกรอบ)** · **`po.md` §4b/§4d (PO delivery status = สะท้อนจาก DN · cancel blocked while active DN)** · **`so.md` §4/§8 (SO เช่นเดียวกัน)** · **`invoice.md` §4b/§5 (★ DN-unify)** · `customer.md` §3/§9b (ที่อยู่จัดส่ง + ผู้รับสินค้า) · stock (FG FIFO ตอน dispatch, D16) · **★ C4: `stock.md` §4 / `po.md` §5.4 (customer-cancelled OEM → FG stock, OEM identity)** · README §3 (**G6/G8/G9**) · **`comment-convention.md`** · **`numbering-on-save.md` (G8 — เลข DN ออกพร้อม Route, NS7)** · **`permission-matrix.md` (แก้สถานะ DN = A)** · **`platform.md` §7 / `non-functional.md` §7 (DN "ยกเลิกการจัดส่ง" ไม่ยิง noti "เอกสารถูกยกเลิก/ปฏิเสธ")**

## สรุปภาษาไทย
ใบจัดส่ง **DN = 1 ใบต่อ 1 PO/SO** — **สร้างตรงไม่ได้ เกิดผ่าน Route process เท่านั้น** (`shipping.md`). **สถานะ DN 6 สถานะ:** **อยู่ระหว่างการเตรียม** → **อยู่ระหว่างจัดส่ง** → **ส่งสำเร็จ** / **ลูกค้าเลื่อนส่ง** (บังคับวันนัดถัดไป) / **ลูกค้ายกเลิก (ยกเลิกการจัดส่ง)** / **ลูกค้ายังไม่กำหนดวันรับใหม่ (ฝากที่เราไว้ก่อน)** (4 ตัวหลังเกิดใน Route "เสร็จสิ้น" process). **★ (A2 r20): "ลูกค้ายกเลิก" = สถานะการจัดส่ง = "ยกเลิกการจัดส่ง (cancel the DELIVERY)" เท่านั้น — ไม่ใช่ยกเลิกใบสั่ง; สถานะ order (PO/SO) ไม่เปลี่ยน (order ยังอยู่) และไม่นับเป็น event "เอกสารถูกยกเลิก/ปฏิเสธ" ของ bell notification (`platform.md` §7).** **(นอกจากนี้ ถ้า Route ถูกยกเลิกทั้งรอบ → DN = void เป็นประวัติ, ไม่ใช่สถานะจัดส่งของลูกค้า — shipping.md §4d).** **ค้น DN** (คนขับ/username/route-id + ช่วงวันที่ชนิดวัน · PO/SO · วันที่ลูกค้าต้องการรับ · filter สถานะ DN). **พิมพ์ DN** และ **★★ สร้าง/พิมพ์ Invoice จากหน้า DN = ใบ active เดียวกันของ PO/SO (DN-unify, §5)**. **มีช่องหมายเหตุต่อ DN (comment, G6)**. **แก้สถานะ DN ได้โดยตรง — ต้องมีสิทธิ์ A (Approve)** (G9 suffix). **★ สถานะจัดส่งของ PO/SO = LINKED จากสถานะ DN — rollup = "DN ล่าสุด (active)" = DN (non-void) ที่มี timestamp การเปลี่ยนสถานะล่าสุด (§8).**

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
| สถานะ DN | enum (6 — §7) | editable (Route process **หรือ** แก้ตรง A) | §7 · void ถ้า Route ยกเลิก (§4) · **★ status-change timestamp = แกน rollup (§8)** |
| **next delivery date (วันนัดส่งครั้งถัดไป)** | date | editable | **บังคับเมื่อสถานะ = ลูกค้าเลื่อนส่ง** |
| **★ หมายเหตุ DN (comment)** | free-text (ช่องเดียว/DN), editable (แก้ในที่/overwrite) | **แก้ทุกครั้งเก็บประวัติ + โผล่ trace — `comment-convention.md`** · **บังคับกรอกเมื่ออัปเดตสถานะใน "เสร็จสิ้น" process (shipping.md §4b)** |

## 4. ★ DN เกิดจาก Route เท่านั้น (ห้ามสร้างตรง)
- **ไม่มีหน้า create DN** — DN ถูก gen **อัตโนมัติตอน "สร้าง Route" (shipping.md §5)** ราย order ในรอบ (1 DN ต่อ 1 PO/SO).
- ค้นด้วย PO/SO ที่ **ยังไม่มี DN** → แสดงผล **DN = ว่าง (blank)** (order นั้นยังไม่เข้ารอบ).
- order ที่ re-route (หลังเลื่อน/ยกเลิกการจัดส่ง/ยังไม่กำหนดวัน) → รอบใหม่ gen **DN ใบใหม่**; DN เดิมคงสถานะสุดท้ายเป็นประวัติ.
- **★ Route ที่ gen DN ถูกยกเลิกทั้งรอบ (shipping.md §4d) → DN = void** (คงเลขเป็นประวัติ, G8/NS5) — **ไม่ใช่สถานะจัดส่งของลูกค้า**; order (PO/SO) ที่ยังไม่ dispatch **กลับคิว "พร้อมจัดส่ง"** (เข้ารอบใหม่ได้ = gen DN ใบใหม่).
- **★ (C3 r20 — cancel vs active DN):** เพราะ order cancel โดยตรงถูก **บล็อกขณะมี DN (non-void) active** (`po.md` §4d / `so.md` §8) → ทางเดียวที่จะยกเลิกงานที่เข้ารอบแล้ว = **void DN / ยกเลิกรอบผ่าน Route ก่อน** (order กลับคิว "พร้อมจัดส่ง") แล้วจึงยกเลิก PO/SO ที่ต้นทางได้.

## 5. Print DN + สร้าง/Print Invoice (★ DN-unify กับโมดูล Invoice)
- **พิมพ์ DN (print DN):** สร้างจาก **ข้อมูลลูกค้า (ชื่อ/ที่อยู่จัดส่ง/ผู้รับ+เบอร์) + PO/SO (รายการ/จำนวน)** — Shipping.**Read (R)**.
- **★★ สร้าง/พิมพ์ Invoice จากหน้า DN = ทำงานบน "ใบ active ของ PO/SO เดียวกัน" (DN-unify · `invoice.md` §4b/§5 US-INV-05):**
  - PO/SO **ยังไม่มีใบแจ้งหนี้ active** → ปุ่ม **"สร้างใบแจ้งหนี้ (C)"** = **สร้างใบ active** ผ่านกติกา `invoice.md` (pull ข้อมูลลูกค้า + ออกเลข INV แบบ G8 + popup ยืนยัน) → **ใบนี้เป็นใบเดียวกันที่โผล่ในโมดูล Invoice**. สิทธิ์ = Invoice.**Create (C)**.
  - PO/SO **มีใบ active แล้ว** → ปุ่ม **"พิมพ์ Invoice (R)"** = พิมพ์ **ใบ active ใบเดิม** (ไม่สร้างใบซ้ำ). สิทธิ์ = Invoice.**Read (R)**.
  - **หลักการ unify:** ไม่ว่าจะเข้าจากหน้า DN หรือหน้า Invoice → **ใบแจ้งหนี้ของ PO/SO = ใบ active เดียวกัน** (1 active ต่อ PO/SO). ห้ามเกิดใบซ้ำจาก 2 ทางเข้า.
- ต้องมี DN แล้วจึงพิมพ์ DN ได้ (order ที่ยังไม่เข้ารอบ = ไม่มีปุ่มพิมพ์ DN / error "ยังไม่มีใบจัดส่งสำหรับ PO/SO นี้").
- **★ แหล่งข้อมูล (data source):** print DN ใช้ **ที่อยู่จัดส่ง (shipping address)** + **ผู้รับสินค้า** จาก `customer.md` §9b · Invoice ใช้ **ที่อยู่ลูกค้า (registered) + เลขภาษี** จาก `customer.md` §3 (pull ตอนสร้างใบ แล้ว **แก้ในใบได้ per-invoice override — `invoice.md` §3**) · รายการ/จำนวน/ราคา จาก PO/SO ต้นทาง.

## 6. ★ Comment + แก้สถานะ DN โดยตรง
- **Comment ต่อ DN (G6):** ช่องเดียว/DN · แก้ในที่ · เก็บประวัติครบ (`comment-convention.md`) · **คนละฟิลด์กับ next delivery date**.
- **★ แก้สถานะ DN โดยตรงจากหน้า DN = ต้องมีสิทธิ์ Approve (A)** — เป็นทางเข้าที่ 2 (นอกจาก Route "เสร็จสิ้น" process, shipping.md §4b). ทุกการแก้สถานะ **บังคับ comment ต่อ DN** + audit.
  - **สิทธิ์:** DN status edit = **Shipping.Approve (A)** — G9 suffix **(A)** (`permission-matrix.md` §3).
  - เปลี่ยนเป็น "ลูกค้าเลื่อนส่ง" ตรง ๆ → บังคับ next delivery date.

## 7. Statuses / lifecycle (DN — entity-status-map §1.10)
| สถานะ DN | เกิดตอน (how reached) | ผลต่อ order + notification |
|---|---|---|
| **อยู่ระหว่างการเตรียม (Preparing)** | เมื่อ **Route ถูกสร้าง** หรือ **เพิ่ม PO/SO เข้ารอบแล้วบันทึก** | PO/SO สะท้อน "อยู่ระหว่างการเตรียม" · DN active |
| **อยู่ระหว่างจัดส่ง (Out for delivery)** | เมื่อ **Route → กำลังออกไปส่ง** | PO/SO สะท้อน "อยู่ระหว่างจัดส่ง" · DN active |
| **ส่งสำเร็จ (Delivered)** | ใน **Route "เสร็จสิ้น" process** (DN update) → ตัด FG FIFO ราย Batch · PO/SO ส่งสำเร็จ · **เริ่มนับ overdue (credit due = วันส่งสำเร็จ + credit term — `invoice.md` §9)** · noti Read Invoice |
| **ลูกค้าเลื่อนส่ง (Postponed)** | Route "เสร็จสิ้น" process → **บังคับกรอก next delivery date** | PO/SO สะท้อน "ลูกค้าเลื่อนส่ง" · order ค้างคิว รอ re-route |
| **★ ลูกค้ายกเลิก — "ยกเลิกการจัดส่ง" (Delivery-Cancelled)** | Route "เสร็จสิ้น" process → **การส่งถูกยกเลิก** | **★ A2 r20: เป็นการยกเลิก *การจัดส่ง* (delivery) เท่านั้น — ไม่ใช่ยกเลิก order; สถานะ PO/SO ไม่เปลี่ยนเป็น "ยกเลิก" (order ยังอยู่)** · **ไม่ยิง noti "เอกสารถูกยกเลิก/ปฏิเสธ"** (`platform.md` §7 · เป็น delivery status ไม่ใช่ doc-cancel/void/reject) · จัดการของคืน/สต็อกตามนโยบาย: **★ C4: ถ้าเป็น OEM → ของกลับเข้า FG stock (OEM identity, sellable, `stock.md` §4 / `po.md` §5.4)**; Own-Brand FG → กลับ FG stock ตามปกติ |
| **ลูกค้ายังไม่กำหนดวันรับใหม่ (ฝากที่เราไว้ก่อน) (Awaiting-new-date)** | Route "เสร็จสิ้น" process → ของฝากไว้ที่เรา รอลูกค้ากำหนดวัน | PO/SO สะท้อน "ลูกค้ายังไม่กำหนดวันรับใหม่" · **★ C4: OEM ที่ฝากไว้/held → นับเป็น OEM FG stock (OEM identity) — ขายซ้ำได้ (`stock.md` §4)** |
> ทั้ง 6 สถานะเข้าถึงได้ผ่าน (a) Route "เสร็จสิ้น" process (shipping.md §4b) หรือ (b) แก้ตรงบนหน้า DN (สิทธิ์ A, §6).
> **★ นอกเหนือ 6 สถานะข้างต้น (void):** ถ้า **Route ที่ gen DN ถูก "ยกเลิก" ทั้งรอบ (shipping.md §4d)** → DN = **void** (คงเลขเป็นประวัติ, ไม่ขับสถานะจัดส่งของ PO/SO); order ที่ยังไม่ dispatch กลับคิว "พร้อมจัดส่ง". **void ≠ "ลูกค้ายกเลิก (ยกเลิกการจัดส่ง)":** void = ทั้งรอบถูกล้ม (Route cancel); "ยกเลิกการจัดส่ง" = ผลการส่งราย DN ที่ตั้งใจ (order ยังอยู่).
> **★ A2 สรุป:** DN "ยกเลิกการจัดส่ง" และ DN void **ไม่ใช่** event "เอกสารถูกยกเลิก/ปฏิเสธ" ของ notification — event นั้นยิงเฉพาะ **ตัวเอกสาร (PO/SO/QT/RT/DN/Invoice) ถูก cancel/void/reject จริง**; Route cancel = ยิง noti RT ใบเดียว (ดู `shipping.md` §4d, ไม่ยิงราย DN-void).

## 8. ★ PO/SO delivery status = LINKED จาก DN status (rule กลาง · ★ B7a rollup นิยามชัด)
> **กติกา (บังคับทุกจอที่แสดงสถานะ PO/SO):** สถานะ **จัดส่ง** ของ PO/SO ไม่ใช่ enum แยกอิสระหลัง "พร้อมจัดส่ง" — มันคือ **การสะท้อน (reflect) สถานะของ DN ที่ผูกอยู่**.
- **PO แสดงสถานะของตัวเอง** จนถึง **พร้อมจัดส่ง**: `ร่าง · ยืนยันแล้ว-รอรับงาน · กำลังผลิต · … · พร้อมจัดส่ง`.
- **หลังจากนั้น PO สะท้อนสถานะ DN:** `อยู่ระหว่างการเตรียม · อยู่ระหว่างจัดส่ง · ส่งสำเร็จ · ลูกค้าเลื่อนส่ง · ลูกค้ายกเลิก(การส่ง) · ลูกค้ายังไม่กำหนดวันรับใหม่`.
- **★ นิยาม "DN ล่าสุด (active)" — B7a pin (ปอนด์ Gate-1 r20 2026-07-31):** rollup = สถานะของ **DN ที่มี "timestamp การเปลี่ยนสถานะล่าสุด (most-recent status-change timestamp)" ในบรรดา DN ที่ "ไม่ถูก void (non-void)" ของ PO/SO นั้น**. DN ที่ถูก void (Route ยกเลิก) หรือ DN เก่าที่ถูก re-route แทน = **ประวัติ (superseded) — ไม่ขับสถานะ**. (นิยามเดียวกันบังคับใช้ที่ `po.md` §4b และ `so.md` §4.)
- **นิยาม authoritative + rollup (1 PO หลาย DN) = `po.md` §4b · SO = `so.md` §4.**
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
- **★ (A2 r20): DN "ยกเลิกการจัดส่ง" = delivery status เท่านั้น — สถานะ order (PO/SO) ไม่เปลี่ยนเป็น "ยกเลิก" และไม่ยิง noti "เอกสารถูกยกเลิก/ปฏิเสธ".**
- **★ (C4 r20): DN "ยกเลิกการจัดส่ง"/"ยังไม่กำหนดวันรับใหม่" ของ OEM → ของกลับเข้า/นับเป็น FG stock (OEM identity, sellable) — `stock.md` §4.**
- comment (หมายเหตุทั่วไปนอก status-update) = ไม่บังคับ · แก้ได้ทุกสถานะ · audit ทุกครั้ง.

## 11. Pagination / Search
- DN list: 20/หน้า (G1).
- **ค้นด้วย:** ชื่อคนขับ / username คนขับ / route id (+ **ช่วงวันที่ พร้อม dropdown ชนิดวัน = {วันที่สร้าง route · วันที่ route ออกไปส่ง}**) · **PO/SO** (ไม่มี DN → DN ว่าง) · **วันที่ลูกค้าต้องการรับ** · **filter สถานะ DN** (6 ค่า).

## 12. Cross-links
- **Route ที่ gen DN → `shipping.md` (Module B) §4b/§4d/§5.**
- **PO/SO delivery status reflect DN (rollup = DN ล่าสุด non-void, status-change ล่าสุด) → `po.md` §4b · `so.md` §4 · entity-status-map §1.2/§1.10.**
- **★ (C3) cancel order blocked while active DN → `po.md` §4d · `so.md` §8 · `non-functional.md` §10.**
- **★⭐ (C4) customer-cancelled/held OEM delivery → FG stock (OEM identity, sellable) → `stock.md` §4 · `po.md` §5.4.**
- **★ (A2) DN "ยกเลิกการจัดส่ง" ≠ doc-cancel event → `platform.md` §7 · `non-functional.md` §7.**
- **★★ สร้าง/พิมพ์ Invoice จากหน้า DN = ใบ active เดียวกันของ PO/SO (DN-unify) · ส่งสำเร็จ→เริ่มนับเครดิต → `invoice.md` §4b/§5/§9.**
- ที่อยู่จัดส่ง + ผู้รับสินค้า (หัว DN) → `customer.md` §3/§9b.
- FG dispatch FIFO → `stock.md` · D16.
- เลข DN ออกพร้อม Route (G8/NS7) → `numbering-on-save.md` · gapless → `non-functional.md` §5 (D-F5).
- Comment + change-history → `comment-convention.md` · แก้สถานะ DN = A → `permission-matrix.md` §3 · field-audit → `traceability.md` §3/§4.

## 13. Module changelog
- **★★ NEW (2026-07-30 — Module C, ปอนด์):** แยก DN เป็น module เอกสารของตัวเอง. **DN status 6 สถานะใหม่.** **สร้าง DN ตรงไม่ได้ (Route เท่านั้น).** **ค้น DN** + **filter สถานะ**. **print DN + print Invoice.** **comment ต่อ DN (G6).** **★ แก้สถานะ DN โดยตรง = สิทธิ์ A.** **★ PO delivery status = linked จาก DN status (rule กลาง §8).** sync `shipping.md` · `po.md` §4b · `so.md` §4 · entity-status-map §1.10 · `permission-matrix.md` · `traceability.md` · `numbering-on-save.md` · `non-functional.md`.
- **★ เพิ่ม (2026-07-30 — Q1=A lock, ปอนด์):** §4/§7 DN void เมื่อ Route ถูกยกเลิกทั้งรอบ; §5 print data-source ชัด; §8 rollup = DN ล่าสุด. Route rename SHP→RT.
- **★★ เพิ่ม (2026-07-30 — Invoice module review, ปอนด์):** **§5/§9/§10/§12 DN-unify** — ปุ่ม "สร้าง/พิมพ์ Invoice" บนหน้า DN = ทำงานบน **ใบ active เดียวกันของ PO/SO** → ไม่เกิดใบซ้ำ.
- **★ เพิ่ม (2026-07-31 — Gate-1 review reconciliation r20, ปอนด์):**
  - **(A2):** §7 สถานะ "ลูกค้ายกเลิก" = **"ยกเลิกการจัดส่ง (Delivery-Cancelled)"** — เป็นการยกเลิก *การจัดส่ง* เท่านั้น, **สถานะ order (PO/SO) ไม่เปลี่ยน**, **ไม่ยิง noti "เอกสารถูกยกเลิก/ปฏิเสธ"** (delivery status ≠ doc-cancel/void/reject); void (Route cancel) ก็ไม่ใช่ doc-cancel event. summary/§7/§10/§12, ref `platform.md` §7 · `non-functional.md` §7 · `shipping.md`.
  - **(B7a):** §8 นิยาม **"DN ล่าสุด (active)" = most-recent status-change timestamp ในบรรดา DN non-void** (pin ชัด, ใช้ร่วม `po.md` §4b / `so.md` §4). summary/§3/§8.
  - **(C3):** §4 เพิ่ม note — order cancel ถูกบล็อกขณะมี DN active → ยกเลิกงานที่เข้ารอบต้อง void DN/ยกเลิกรอบก่อน. §4/§12, ref `po.md` §4d · `so.md` §8.
  - **(C4 ⭐):** §7 customer-cancelled-delivery / held OEM → ของกลับเข้า/นับเป็น **FG stock (OEM identity, sellable)** — ขายซ้ำผ่าน OEM PO ได้. summary/§7/§10/§12, ref `stock.md` §4 · `po.md` §5.4.
  - **ใช้ view เดิม (`delivery-note.html` render จาก .md) + map ใน `_render.js` + ลิงก์ index.**
- **หมายเหตุ HTML view:** `delivery-note.html` (functional-spec view) + `_render.js` map + ลิงก์ใน index.html (COMPLETENESS RULE).
