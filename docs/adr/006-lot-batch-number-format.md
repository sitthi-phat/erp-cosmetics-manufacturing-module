# ADR-006: Lot / Batch / Document / Entity Number Format

- **สถานะ**: Accepted (แก้ไขตามเงื่อนไข Human Gate 1 — ปอนด์ approve แบบมีเงื่อนไข 2026-07-06)
- **วันที่**: 2026-07-06 (rev.2)
- **ผู้ตัดสินใจ**: Tech-Lead (เสนอ) / ปอนด์ (approve-with-conditions)
- **ขอบเขต**: รูปแบบเลขเอกสาร/lot/batch **และรหัส entity (Customer ID, User ID)** ทั้งระบบ + กลไกออกเลขที่กัน concurrency

## ประวัติการแก้ไข (Revision History)

| rev | วันที่ | สาระ |
|---|---|---|
| 1 | 2026-07-06 | ฉบับแรก เสนอ format Lot/Batch/PO/Shipment/Invoice + NumberSequence service (รอปอนด์ยืนยันที่ Gate 1) |
| **2** | **2026-07-06** | **แก้ตามเงื่อนไข Gate 1 #1: (a) เผื่อจำนวนหลัก running number ให้รองรับปริมาณสูง (b) ระบุกลไก gen เลขกันชนกัน (concurrency-safe) ชัดเจน (c) เพิ่ม format Customer ID + User ID (d) เพิ่ม Invoice version chain (invoice_no คงที่ + version + parent_invoice_id)** |

## บริบท (Context)

เดิม BA ระบุว่า format Lot/Batch ยังไม่กำหนดจากปอนด์ และให้ Tech-Lead เสนอ. ที่ Gate 1 ปอนด์
approve แบบมีเงื่อนไข (ดู `pipeline/status.json` → `human_gates.gate1_architecture.note` ข้อ 1):

1. **เลขเอกสารทุก format ต้องรองรับปริมาณสูง/การสร้างพร้อมกัน (concurrency)** — เผื่อจำนวนหลัก
   running number ให้มากขึ้น + ต้องมีกลไกออกเลขที่กันชนกัน (sequence table ใน transaction)
2. **เพิ่ม format: Customer ID, User ID** (ทั้งคู่ต้อง auto-generate ห้าม client กรอกเอง — ECP-001 AC1/AC4, ECP-023 AC1/AC4)
3. **เพิ่ม Invoice version chain** — เมื่อแก้ไข invoice ต้องมี version + reference ถึง parent invoice (ECP-037)

แยก 2 ประเภทเหมือนเดิม:
- **Lot number** = ผู้จำหน่ายกำหนดมา ผู้ใช้กรอกเอง (ECP-008) → ระบบไม่บังคับ format (free text, unique/material)
- **เลขที่/รหัสที่ระบบออกให้เอง** = Customer, User, PO, Batch, Shipment, Invoice → ต้อง unique, concurrency-safe, มนุษย์อ่านได้

## การตัดสินใจ (Decision — rev.2)

### 1) รูปแบบเลข (เผื่อจำนวนหลักรองรับปริมาณสูง)

| ประเภท | ที่มา | Format | period ของ running | ตัวอย่าง |
|---|---|---|---|---|
| **Customer ID** | ระบบออก | `CUS-NNNNNNNN` (8 หลัก, global running ไม่ผูก period) | ไม่มี (สะสมตลอด) | `CUS-00000042` |
| **User ID** | ระบบออก | `USR-NNNNNNNN` (8 หลัก, global running) — **แยกจาก username** | ไม่มี | `USR-00000015` |
| **PO number** | ระบบออก | `PO-YYYYMM-NNNNNN` (6 หลัก/เดือน) | ต่อเดือน | `PO-202607-000001` |
| **Batch number** | ระบบออก | `B-YYYYMMDD-NNNNN` (5 หลัก/วัน) | ต่อวัน | `B-20260706-00001` |
| **Shipment number** | ระบบออก | `SH-YYYYMMDD-NNNNN` (5 หลัก/วัน) | ต่อวัน | `SH-20260706-00001` |
| **Invoice number (chain)** | ระบบออก | `INV-YYYY-NNNNNN` (6 หลัก/ปี) — **คงที่ตลอดทั้ง version chain** | ต่อปี | `INV-2026-000123` |
| **Invoice display no** | derived | `INV-YYYY-NNNNNN-vNN` (ต่อท้ายด้วย version 2 หลัก) | — | `INV-2026-000123-v02` |
| **Lot number** | ผู้ใช้กรอก | free text, unique/material; ถ้าเว้นว่างเสนอ default `L-YYYYMMDD-NNNNN` | — | `SUP-88123` |

**เหตุผลเผื่อหลัก:** เพิ่มความกว้างจาก rev.1 (PO 4→6, Batch/Shipment 3→5, Invoice 5→6, เพิ่ม
Customer/User 8 หลัก) เพื่อรองรับปริมาณสูงตลอดอายุระบบ. **กติกาสำคัญ: padding เป็นเพียงการเติมศูนย์
เพื่อความสวยงาม — ถ้า counter ทะลุจำนวนหลัก padding เลขจะยาวขึ้นเองโดยไม่ตัดทอน/ไม่ชน** (เช่น
`CUS-100000000`) จึงไม่มีเพดานที่ทำให้ระบบตันเมื่อปริมาณสูงเกินคาด.

### 2) Invoice version chain (เงื่อนไข Gate 1 #1 / ECP-037)

เลือกแนวทาง **"เลขที่ invoice คงที่ทั้งสาย + version int + parent_invoice_id (self-FK)"**
แทนการฝัง version ลงในสตริงเลขที่เพียงอย่างเดียว:

- `invoice_no` = อัตลักษณ์ของสาย (chain) **คงที่ทุก version** (เช่น `INV-2026-000123`) — คือ
  "ใบ invoice" ที่ลูกค้า/บัญชีอ้างถึง
- `version` = int เริ่ม 1 เพิ่มทีละ 1 ทุกครั้งที่แก้ไข
- `parent_invoice_id` = self-FK ไปยัง row ของ version ก่อนหน้า (null สำหรับ version 1)
- **Unique constraint = (`invoice_no`, `version`)** → สอดคล้อง Data Rules ของ BA ("unique ต่อ version")
- **display number** ที่แสดง/พิมพ์ = `INV-YYYY-NNNNNN-vNN` (compose ตอน render, unique ทั้งระบบ)

**เหตุผลที่เลือกแนวนี้ (ไม่ใช่ single opaque string):**
- ตรงกับโลกจริงทางบัญชี — invoice ที่แก้ไขยังเป็น "ใบเดิมที่ปรับปรุง" ไม่ใช่ใบใหม่คนละเลข
- **group by `invoice_no` (หรือ `po_id`) ได้ตรงๆ** เพื่อดึงทั้งสายมาแสดงไทม์ไลน์ (ECP-037 AC2)
  โดยไม่ต้อง parse string — และเดินตาม `parent_invoice_id` เพื่อ audit ย้อน version ได้ชัด
- version ที่ถูกแทนที่ = `Superseded` (read-only ตลอดไป ห้ามลบ/แก้) → audit ครบ (ECP-037 AC2)
- 1 chain ต่อ 1 PO (group by `po_id`) — กันการออก invoice ซ้ำสาย (ECP-020 AC2)

### 3) กลไกออกเลขกัน concurrency (เงื่อนไข Gate 1 #1)

ตาราง **`NumberSequence(prefix, period_key, counter)`** (PK รวม `prefix`+`period_key`) + service กลาง
`numberSequence.next(prefix, periodKey)`:

- ออกเลข **ภายใน `$transaction` เดียวกับการสร้างเอกสาร** (ADR-003) → ถ้า tx rollback เลขคืน
- เพิ่ม counter แบบ atomic ด้วย MySQL idiom กัน race:
  `UPDATE number_sequence SET counter = LAST_INSERT_ID(counter + 1) WHERE prefix=? AND period_key=?`
  แล้วอ่านค่าใหม่จาก `SELECT LAST_INSERT_ID()` — **การ UPDATE ถือ row lock ทำให้ธุรกรรมพร้อมกันถูก
  serialize ต่อคีย์เดียวกัน ไม่มีเลขซ้ำ** (ถ้าแถวยังไม่มีให้ upsert ค่าเริ่ม 1)
- ทางเลือก implement ที่ยอมรับได้เท่ากัน: `SELECT ... FOR UPDATE` แล้ว `UPDATE counter+1` ภายใน tx
  (ให้ผลเดียวกัน — row-level lock ต่อคีย์). Engineer เลือกอันใดอันหนึ่ง แต่ **ต้องอยู่ใน tx และถือ lock ต่อคีย์**
- Prefix/pattern เก็บเป็น config (`SEQ_*` / ตาราง config) ไม่ hardcode กระจาย → เปลี่ยน format แก้ที่เดียว

**หมายเหตุ concurrency vs. ปริมาณ:** การ serialize ต่อคีย์เกิดเฉพาะเลขที่ใช้ `period_key` เดียวกัน
(เช่น PO เดือนเดียวกัน) ซึ่งเป็นคอขวดที่ยอมรับได้สำหรับ prototype; ถ้า Phase 3 ต้องการ throughput
สูงมากค่อยพิจารณา hi/lo หรือ sharded sequence (บันทึกเป็น backlog ไม่ทำในรอบนี้).

## ทางเลือกที่พิจารณา (Alternatives Considered)

- **UUID/auto-increment ล้วน** — unique ง่ายแต่มนุษย์อ่าน/สื่อสารยาก ไม่เหมาะเอกสาร GMP; ปฏิเสธ
- **Invoice ฝัง version ใน single opaque string เป็น unique field เดียว** (`INV-...-vNN` เป็น PK เชิงตรรกะ)
  — ทำให้ group ทั้งสายต้อง parse string, เดิน parent ยาก; ปฏิเสธ เลือก chain-no + version + self-FK แทน
- **ฝัง sequence ใน timestamp อย่างเดียว (ไม่มี counter)** — เสี่ยงชนกันถ้าออกหลายเลขในวินาทีเดียว; ปฏิเสธ
- **บังคับ format Lot number** — Lot มาจากผู้จำหน่ายภายนอก บังคับจะ block การรับของจริง (ขัด ECP-008); ปฏิเสธ
- **ใช้ DB AUTO_INCREMENT ต่อตารางแล้วประกอบ prefix** — ใช้ได้แต่ผูก running กับ period/reset ต่อวัน/เดือน/ปี
  ไม่ได้ตามที่ต้องการ; NumberSequence ต่อ (prefix, period_key) ยืดหยุ่นกว่า

## ผลที่ตามมา (Consequences)

- Customer/User: **ไม่มีช่องกรอก id ใน form/API — service strip ค่า id ที่ client ส่งมาทิ้งเสมอ** แล้ว
  gen ให้เอง (ECP-001 AC4, ECP-023 AC4). username ยังกรอกเองได้ (แยกจาก user_id)
- Invoice: schema เพิ่ม `invoice_no`, `version`, `parent_invoice_id` (self-FK), unique (`invoice_no`,`version`)
  (ดู architecture.md §3.1, §5.4)
- NumberSequence service ต้อง unit-test concurrency (ยิงขนานแล้วไม่มีเลขซ้ำ — ดู tasks Q7/E19)
- ถ้าปอนด์อยากปรับ format ภายหลัง = แก้ config ที่เดียว; ควรบันทึก format ที่ยืนยันแล้วลง
  `CLAUDE.md` §Domain Knowledge (ช่องที่เตรียมไว้ "format Lot number, หน่วยวัด")
