# สรุปสถานะ PO และ Delivery Note — สำหรับปอนด์

ระบบ: **ESSENCE Hub System** · จัดทำโดย PO · 2026-07-08
เอกสารเต็มดูได้ที่ `status-journeys.md` — ฉบับนี้ย่อให้กวาดตาเดียวเห็นหมด

---

## 1. สถานะของ PO
PO แยกเป็น **2 ราง** ที่เดินคู่กัน (ออกใบแจ้งหนี้ได้โดยไม่ต้องรอส่งของ แต่เห็นสถานะการผลิต/ส่งเสมอ)

### ราง A — การผลิต/จัดส่ง (Fulfilment)
| สถานะ (ไทย / อังกฤษ) | ความหมายสั้นๆ | ใครทำให้เกิด | เห็นที่ module ไหนบ้าง |
|---|---|---|---|
| ร่าง / **Draft** | กำลังสร้าง PO ยังไม่ยืนยัน | Sale | PO list, Sale Dashboard, ประวัติ PO ของลูกค้า |
| ยืนยันแล้ว / **Confirmed** | ยืนยัน PO แล้ว (ถ้าวัตถุดิบขาดจะเตือนแต่ยืนยันได้) | Sale | PO list, คิวผลิต (Production), หน้าออก Invoice, Sale Dashboard, ประวัติ PO |
| กำลังผลิต / **In Production** | ส่งเข้าสายผลิตแล้ว | ระบบ (จาก Confirmed) | PO list, Production, Invoice, Sale Dashboard, ประวัติ PO |
| พร้อมส่ง / **Ready to Deliver** | ผลิตเสร็จ + QC ผ่าน รอจัดส่ง | Production (+QC) | PO list, Production, **Shipping**, Invoice, Sale Dashboard |
| กำลังจัดส่ง / **In Delivery** | อยู่ในใบจัดส่ง กำลังนำส่ง | Shipping | PO list, Shipping, Invoice, Sale Dashboard, ประวัติ PO |
| ส่งแล้ว / **Delivered** | ส่งถึงลูกค้าแล้ว (เริ่มนับเครดิต) | Shipping | PO list, Shipping, **Finance/Invoice**, Sale Dashboard, ประวัติ PO |
| ยกเลิก / **Cancelled** | PO ถูกยกเลิก (มี trace เหตุผล) | Sale/Admin | PO list, Sale Dashboard, ประวัติ PO |

### ราง B — การวางบิล/เก็บเงิน (Billing)
| สถานะ (ไทย / อังกฤษ) | ความหมายสั้นๆ | ใครทำให้เกิด | เห็นที่ module ไหนบ้าง |
|---|---|---|---|
| ยังไม่วางบิล / **Not Invoiced** | ยังไม่ออกใบแจ้งหนี้ | (ค่าเริ่มต้น) | PO detail, Invoice (คิวรอออกบิล) |
| ออกใบแจ้งหนี้แล้ว / **Invoiced** | ออกใบแจ้งหนี้แล้ว (ได้ตั้งแต่ PO=Confirmed) | Finance/Sale | Invoice/Finance, PO detail, Sale Dashboard, ประวัติ PO |
| ชำระแล้ว / **Paid** | รับเงินครบแล้ว | Finance | Finance, PO detail, ประวัติ PO |
| ค้างชำระ / **Overdue** | ส่งของแล้ว + เลยเครดิต ยังไม่จ่าย (โชว์จำนวนวันค้าง) | ระบบ (scheduler) | **Finance (แจ้งเตือน)**, Sale Dashboard, PO detail |

---

## 2. สถานะของใบจัดส่ง (Delivery Note)
1 ใบจัดส่งรวมได้หลาย PO → สถานะ "ระดับใบ" สรุปมาจากสถานะราย PO ในใบ

| สถานะ (ไทย / อังกฤษ) | ความหมาย | ความสัมพันธ์กับสถานะราย PO ในใบ | เห็นที่ module ไหนบ้าง |
|---|---|---|---|
| รับเข้า / **Received** | ฝ่ายจัดส่งรับของจากฝ่ายผลิตแล้ว | ทุก PO ในใบ = พร้อมส่ง | Shipping, Production |
| กำลังนำส่ง / **In-Route** | ออกไปส่งแล้ว | PO ในใบ → In Delivery | Shipping, PO detail, Sale Dashboard |
| ส่งสำเร็จ / **Delivered** | ส่งครบทุก PO ในใบ | ทุก PO = Delivered | Shipping, PO detail, Finance/Invoice, Sale Dashboard |
| ส่งบางส่วน / **Partially Delivered** | บาง PO สำเร็จ บาง PO ถูกปฏิเสธ/เลื่อน | PO คละกัน (Delivered + Rejected/Postponed) — ใบยังไม่ปิดจนเคลียร์ครบ | Shipping (เห็น breakdown), PO detail |
| ถูกปฏิเสธ / **Rejected** | ลูกค้าปฏิเสธรับ (ราย PO) | PO นั้นกลับไป Production=พร้อมส่ง + แจ้ง Sale ตัดสินใจ | Shipping, Production, PO detail, Sale Dashboard |
| เลื่อนส่ง / **Postponed** | เลื่อนการส่ง (ราย PO) | PO นั้นค้างไว้ + เปิดสร้างใบจัดส่งใบใหม่ได้ | Shipping, PO detail |

---

## 3. ตารางกากบาท: สถานะ × module (กวาดตาเดียวเห็นหมด)
✓ = สถานะนี้แสดง/เกี่ยวข้องกับ module นั้น

### PO (รวม 2 ราง)
| สถานะ PO | PO list | Production | Shipping | Invoice/Finance | Sale Dashboard | ประวัติ PO ลูกค้า |
|---|:--:|:--:|:--:|:--:|:--:|:--:|
| Draft | ✓ |  |  |  | ✓ | ✓ |
| Confirmed | ✓ | ✓ |  | ✓ | ✓ | ✓ |
| In Production | ✓ | ✓ |  | ✓ | ✓ | ✓ |
| Ready to Deliver | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| In Delivery | ✓ |  | ✓ | ✓ | ✓ | ✓ |
| Delivered | ✓ |  | ✓ | ✓ | ✓ | ✓ |
| Cancelled | ✓ |  |  |  | ✓ | ✓ |
| Invoiced (Billing) | ✓ |  |  | ✓ | ✓ | ✓ |
| Paid (Billing) |  |  |  | ✓ |  | ✓ |
| Overdue (Billing) | ✓ |  |  | ✓ | ✓ | ✓ |

### Delivery Note
| สถานะใบจัดส่ง | Shipping | Production | PO detail | Invoice/Finance | Sale Dashboard |
|---|:--:|:--:|:--:|:--:|:--:|
| Received | ✓ | ✓ |  |  |  |
| In-Route | ✓ |  | ✓ |  | ✓ |
| Delivered | ✓ |  | ✓ | ✓ | ✓ |
| Partially Delivered | ✓ |  | ✓ |  | ✓ |
| Rejected | ✓ | ✓ | ✓ |  | ✓ |
| Postponed | ✓ |  | ✓ |  |  |

---

## 4. สถานะไหนเปลี่ยนแล้ว "สั่นกระดิ่ง" (Notification) ไปหาใคร
กระดิ่งมุมบนขวา → กดดูรายการ → กดแต่ละรายการ = พาไปหน้าทำงานต่อ + รายการนั้นหายไป (นับแยกต่อคน)
ใครได้รับ = คนที่มีสิทธิ์ "อ่าน (Read)" ของ module ปลายทางนั้น

| สถานะเปลี่ยนเป็น | กระดิ่งไปหา (แผนก/บทบาท) |
|---|---|
| PO Confirmed | ฝ่ายผลิต |
| วัตถุดิบขาด (ตอนสร้าง PO) | ฝ่าย Stock + ฝ่ายผลิต |
| Production Hold | ฝ่ายขาย หรือ ฝ่าย Stock (ตามเหตุที่ติด) |
| Potential Delay (เสี่ยงส่งช้า) | ฝ่ายขาย + ฝ่าย Stock |
| Ready to Deliver | ฝ่ายจัดส่ง |
| Delivery: Delivered | ฝ่ายการเงิน + ฝ่ายขาย (เจ้าของ) |
| Delivery: Rejected | ฝ่ายขาย (เจ้าของ) + Sale Manager |
| Delivery: Postponed | ฝ่ายจัดส่ง |
| Invoice Overdue (ค้างจ่าย) | ฝ่ายการเงิน + ฝ่ายขาย (เจ้าของ) |
| QC รับวัตถุดิบเข้า | ฝ่าย Stock (+ ฝ่ายผลิต ถ้าปิดคำขอซื้อ) |
| Return (คืนของ) | ฝ่าย Stock |
| ลูกค้าถูก reassign | Sale เดิม + Sale ใหม่ + Sale Manager |

> รายละเอียดเต็ม (เงื่อนไข transition, สิทธิ์, deep link ปลายทางแต่ละ noti) อยู่ใน `status-journeys.md` §8 และ §10
