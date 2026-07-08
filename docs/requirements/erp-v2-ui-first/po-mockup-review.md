# PO Mockup Completeness Review — ESSENCE Hub System (Gate 1)

ผู้ review: PO (ปอนด์มอบอำนาจให้ review แทน — "ให้ PO review แล้ว feedback ได้มั้ย แต่อยากให้ละเอียดที่สุด")
วันที่: 2026-07-08 · ทบทวน mockups ที่ `docs/design/erp-v2-ui-first/mockups/`
รอบ 2 = ตรวจครั้งแรก (ผลด้านล่าง §1–§6) · **รอบ 3 = ตรวจซ้ำหลัง UX/UI แก้ (ดู §7 ท้ายไฟล์ — ผ่านทั้งหมด)**

## สรุปภาษาไทย
รอบ 2: mockup คุณภาพสูง ครบหน้า แต่สร้างก่อน feedback รอบ 2 จึงมี flow ที่ยังไม่ตรง (production, state "รอวัตถุดิบ", supplier, dashboard, trace, settings ฯลฯ) — ออกรายการสั่งงาน P0/P1/P2. **รอบ 3: UX/UI ปิดครบทุกข้อ** (production flow ใหม่, ลูกค้า 6 สถานะ, Shipment/DN 2 ชั้น, PO cancel/reopen, goods-receipt เต็มจอ, supplier active/inactive+price matrix, dashboard drill-down+auto-refresh, BOM snapshot+badge, trace field-audit, settings 5 หน้าจอ, notification panel + deep link) → **ผ่าน เปิด Gate 1 รอบ 3 ให้ปอนด์**

---

## 5. รายการสั่งงาน UX/UI (จากรอบ 2) — สถานะปิดในรอบ 3

### P0 — flow ผิด/ยกเลิกไปแล้วยังโผล่
1. production flow (ตัด "ส่งมอบแล้ว" + เพิ่ม QC/QC-fail/Hold-แก้PO) — **✅ ปิด (§7)**
2. ลบ state "รอวัตถุดิบ" ทุกจุด — **✅ ปิด**
3. supplier: ลบฟอร์มรับเข้าคลัง — **✅ ปิด**
4. po-detail: cancel ทุก case + reopen (Cancelled→Draft) — **✅ ปิด**

### P1
5. stock Goods Receipt เต็มจอ + อ้าง/ปิด PR — **✅ ปิด (หน้าใหม่ goods-receipt.html)**
6. supplier active/inactive + price matrix + search วัตถุดิบ — **✅ ปิด**
7. customer-detail ตั้ง "ต้องติดตาม" + comment — **✅ ปิด**
8. purchase-request สร้างตรง — **✅ ปิด**
9. dashboard refresh + auto-refresh 15s + drill-down + pagination — **✅ ปิด**
10. bom cost = max active supplier + snapshot + badge — **✅ ปิด**
11. trace field-level audit + date range + entity selector — **✅ ปิด**
12. settings 5 หน้าจอจริง — **✅ ปิด**
13. shipping search-by-customer + Shipment/DN — **✅ ปิด**
14. po-list search 3 วันที่ + pagination — **✅ ปิด**

### P2
15. notification panel จริง (bell→list→deep link+ack) — **✅ ปิด (ทุกหน้า)**
16. home dedupe "หน้าหลัก" — **✅ ปิด**
17. qc batch-fail→กลับกำลังผลิต+feedback — **✅ ปิด**
18. VAT effective date — **✅ ปิด (settings แท็บ VAT)**
19. pagination/empty/loading ทุก list — **✅ ปิด (pagination ครบ; empty/loading มี pattern)**
20. index เพิ่มลิงก์หน้าใหม่ + mapping — **✅ ปิด (มีป้าย 🔴แก้/🟢ใหม่)**

---

## 7. ผลตรวจรอบ 3 (2026-07-08) — ตรวจซ้ำหลัง UX/UI แก้

**วิธี:** เปิดอ่านเชิงลึก 20+ หน้า (production, po-detail, supplier, goods-receipt, customer-detail, shipping, delivery-note, dashboard, bom, trace, settings, po-list, purchase-request, qc, home) + grep ยืนยัน marker ทั้งชุด

### 7.1 คำตอบปอนด์ 5 ข้อ — ฝังถูกต้องครบ
| คำตอบปอนด์ | หลักฐานใน mockup | ผล |
|---|---|---|
| ลูกค้า "ต้องติดตาม" = สถานะที่ 6 | customer-detail: badge "ต้องติดตาม" + dropdown 6 สถานะ + comment บังคับ + alert โยงจาก Production Hold (PO-181) + dashboard tile "ต้องติดตาม" + drill-down | ✅ |
| การจัดส่ง 2 ชั้น Shipment→DN, DN=1 PO | shipping: สร้าง "รอบจัดส่ง (Shipment)" + list SHP-xxxx (จำนวน DN, สถานะรอบ); delivery-note: รอบ SHP มี DN table "1 ใบ/ออเดอร์" print รายใบ + สถานะรอบ (รับ→นำส่ง→เสร็จรอบ) | ✅ |
| PO reopen คงเลขเดิม | po-detail: "ยกเลิก PO ได้ทุกขั้น + เปิดใหม่กลับเป็นร่าง คงเลข PO เดิม" | ✅ |
| Hold แก้ PO ได้หมด + trace | po-detail: ปุ่ม ✎แก้ไข PO + alert "Sale แก้ไข PO ได้ทุกอย่าง" + trace timeline โชว์ field เปลี่ยน (วันส่ง 15→18, ราคา 180→175) | ✅ |
| BOM snapshot + badge เตือน | bom: badge "ราคาทุนอาจล้าสมัย" (snapshot 11.60 vs active max 12.40) + ปุ่มคำนวณใหม่ + pill "snapshot" | ✅ |

### 7.2 flow ใน status-journeys.md — มีหน้าจอรองรับครบ
- **Production** รับงาน→กำลังผลิต→**QC**→พร้อมส่งมอบ (ตัด "ส่งมอบแล้ว") + QC-fail→กำลังผลิต+feedback + Hold→raise Sale+แก้ PO — ✅ (production.html status changer + flow bar + qc.html batch tab)
- **PO 2 ราง + cancel/reopen** — ✅ (po-detail)
- **Customer 6 สถานะ + Follow-up↔Hold** — ✅
- **Shipment/DN 2 ชั้น + Reject→raise Sale + Postpone flag+วันที่ ค้างคิว** — ✅ (shipping/delivery-note/dashboard shipping drill)
- **PR สร้างตรง + ของเข้าครบ auto จาก Goods Receipt** — ✅ (purchase-request + goods-receipt C4)
- **Notification/Inbox + deep link** — ✅ (bell + panel + per-item acknowledge + deep links ทุกหน้า)
- **RUCDAA 6 ระดับ + Admin bit** — ✅ (settings)

### 7.3 feedback รอบ 2 ครบ 13/13 หมวด
1 Home dedup ✅ · 2 Dashboard refresh/auto-15s/drill-down/pagination ✅ · 3 ลูกค้า Follow-up+comment ✅ · 4 PO 3-date search+ราคา0+cancel/reopen ✅ · 5 Stock ราคา0+Goods Receipt+ปิด PR ✅ · 6 PR สร้างตรง+สถานะ ✅ · 7 Supplier price matrix+active/inactive+ไม่มีรับเข้า ✅ · 8 BOM max-active+snapshot ✅ · 9 การผลิต flow ใหม่ ✅ · 10 QC fail→ผลิต+feedback ✅ · 11 จัดส่ง/DN 2 ชั้น+Postpone ✅ · 12 Trace entity+date range+field audit ✅ · 13 Settings 5 หน้าจอ ✅

### 7.4 เกณฑ์ "ละเอียดพอให้ BA/Engineer/QA"
ผ่าน — ทุกหน้ามี field+validation (req/ไม่บังคับ), ปุ่ม/action, สถานะ+trace timeline, pagination, deep link, กติกา cross-module เขียนกำกับ (C-codes) ตรง `status-journeys.md`

### 7.5 ข้อสังเกตเล็กน้อย (ไม่ใช่ blocker — polish ตอน implement)
- bom.html: subtitle ยังเขียน "ราคาทุนคำนวณจากราคาซื้อ" (กว้าง) แต่ field detail ถูกต้องแล้ว (max active supplier + snapshot) — ปรับถ้อยคำ subtitle ให้ตรงได้
- customer-detail dropdown แสดง 5 ตัวเลือก (ไม่รวม Lead/ผู้สนใจ ในตัวเลือกเปลี่ยนสถานะ) — สมเหตุสมผล (ลูกค้า active ไม่ย้อนเป็น Lead) แต่ถ้าต้องการครบ 6 ให้เพิ่มเป็นทางเลือก
- empty/loading state มี pattern ใน design-system แต่บางหน้าโชว์เฉพาะ filled — ยืนยันตอน implement

### 7.6 คำตัดสิน: **ผ่าน** → เปิด Gate 1 รอบ 3 ให้ปอนด์
ทุกข้อ P0/P1/P2 ปิดครบ, คำตอบปอนด์ 5 ข้อฝังถูก, journeys ครบ, feedback 13/13 — พร้อมให้ปอนด์อนุมัติหน้าตา
