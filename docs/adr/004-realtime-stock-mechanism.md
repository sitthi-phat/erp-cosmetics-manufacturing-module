# ADR-004: Real-time Stock Update Mechanism — Transactional Ledger + WebSocket Push

- **สถานะ**: Proposed (รอ Human Gate 1)
- **วันที่**: 2026-07-06
- **ผู้ตัดสินใจ**: Tech-Lead (เสนอ) / ปอนด์ (approve)
- **ขอบเขต**: Epic 3 (Stock) และทุกจุดที่กระทบยอดสต็อก (PO confirm/cancel, goods receipt,
  เบิกผลิต) — **นี่คือ pain หลักของปอนด์**

## บริบท (Context)

ปัญหาอันดับหนึ่งคือ "stock วัตถุดิบมองไม่เห็นแบบ real-time" AC ที่เกี่ยวข้อง:
- ECP-007 AC1: หน้าจอที่เปิดค้างต้องแสดงยอดใหม่ **ภายใน ≤1 นาที โดยไม่ต้องกด refresh**
- ECP-010: ต้องแยก **physical stock** กับ **available to promise (ATP)** และจอง/คืนอัตโนมัติ
  ทันทีในธุรกรรมเดียว
- ECP-028 AC2: dashboard คลังต้องอัปเดตรายการ "ใกล้หมด" real-time เช่นกัน

ต้องแยก 2 เรื่องออกจากกันให้ชัด: (ก) **ความถูกต้องของยอด** (correctness) และ
(ข) **การ push ยอดใหม่ไปหน้าจอ** (delivery)

## การตัดสินใจ (Decision)

### (ก) Correctness — Transactional Stock Ledger (source of truth)
- ตาราง **`StockTransaction`** เป็น append-only ledger: ทุกการเคลื่อนไหว
  (Receipt / Reservation / ReservationRelease / Issue / Adjustment) เขียน 1 แถว
- ตาราง **`StockBalance`** ต่อ `material_id` เก็บ `physical_qty` และ `reserved_qty`
  (available = physical − reserved) เป็น projection ที่อ่านเร็ว
- ตาราง **`Lot`** เก็บ `remaining_qty` ต่อ Lot สำหรับ traceability + เบิกตาม Lot
- **กติกาเหล็ก**: การเขียน `StockTransaction` + อัปเดต `StockBalance`/`Lot.remaining_qty`
  ต้องอยู่ใน **`prisma.$transaction` เดียวกัน** เสมอ → ยอดที่อ่านได้ถูกต้อง ณ ทุกขณะ
  ไม่มี batch reconcile job (ตอบ DoD "ไม่ใช่ batch update เป็นรอบ")
- การเบิกผลิตห้ามเกิน `physical_qty` จริง (ECP-010 AC3) — เช็คภายใน transaction

### (ข) Delivery — WebSocket push ด้วย Socket.IO
- หลัง commit ธุรกรรมสำเร็จ service ยิง event `stock.changed` (payload: material_id,
  physical, reserved, available) เข้า Socket.IO
- Client (หน้า stock ECP-007, dashboard คลัง ECP-028) subscribe room `stock` และอัปเดต
  แถวที่กระทบทันที — ได้ real-time จริง (ต่ำกว่า ≤1 นาทีมาก) โดยไม่ refresh
- **Fallback**: ถ้า WebSocket หลุด client มี polling ทุก 30 วินาทีเป็น safety net เพื่อ
  ยังคงผ่านเกณฑ์ ≤1 นาทีของ ECP-007 AC1 แม้ socket มีปัญหา

## ทางเลือกที่พิจารณา (Alternatives Considered)

- **Polling อย่างเดียว** (client ถามทุก N วินาที) — ผ่านเกณฑ์ ≤1 นาทีทางเทคนิค แต่ไม่ตอบ
  "pain หลัก" เชิงประสบการณ์ (ยังหน่วง/โหลดซ้ำ); ใช้เป็น fallback เท่านั้น ไม่ใช่กลไกหลัก
- **Server-Sent Events (SSE)** — เบากว่า WebSocket และ push ทางเดียวก็พอ; เป็นตัวเลือกสำรอง
  ที่ดี แต่เลือก Socket.IO เพราะจัดการ reconnect/room/fallback ให้ในตัว และเผื่อ use case
  interactive อื่นในอนาคต
- **DB trigger + external message queue (Pub/Sub)** — robust สำหรับ scale ใหญ่ แต่ over-engineer
  สำหรับ prototype single-process; ปฏิเสธ (แต่เป็นทิศทาง Phase 3 ที่เปิดไว้)

## ผลที่ตามมา (Consequences)

- ยอดสต็อกถูกต้องมาจาก DB transaction เสมอ; WebSocket เป็นเพียงชั้น delivery — ถ้า push พลาด
  ข้อมูลไม่เพี้ยน (client ยัง reconcile ได้ด้วย fallback polling)
- **Phase 3 (GCP scale-out หลาย instance)**: Socket.IO in-process จะ broadcast ไม่ครบข้าม
  instance → ต้องเพิ่ม **Socket.IO Redis adapter (Memorystore)** ภายหลัง บันทึกเป็น future
  work; ไม่ทำใน prototype แต่ layer delivery แยกจาก correctness แล้ว จึงเปลี่ยนได้โดยไม่แตะ logic
- Service layer ต้อง emit event ผ่าน interface กลาง (`realtimeGateway.emit`) ไม่เรียก Socket.IO
  ตรง เพื่อสับเปลี่ยน transport (SSE/Redis adapter) ได้ในอนาคต
