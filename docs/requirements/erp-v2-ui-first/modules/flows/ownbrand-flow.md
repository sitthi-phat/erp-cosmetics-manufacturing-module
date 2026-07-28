# Flow — Own-Brand (SO: ก ขายจากสต็อก / ข ผลิตเก็บสต็อก)

slug: `erp-v2-ui-first` · per-module canonical · PO · 2026-07-29
กฎอ้างอิง: D1/D2/D8 v2/D12/D16/D18-2 · scenario-walkthrough S4/S5
โมดูลที่เกี่ยว: `so.md` · `supply-planning.md` · `stock.md` · `production.md` · (delivery-note/invoice/trace = spec เดิม)

## สรุปภาษาไทย
สาย Own-Brand (แบรนด์ตัวเอง) ใช้ **SO `SO-{YYYYMM}-{NNNNNN}` (คนละโมดูล, ไม่มี Quotation)**. 2 แบบ: **(ก) ขายจากสต็อก** = เลือกลูกค้า → ยืนยัน (จอง FG) → พร้อมส่ง → Delivery ตัด FG FIFO → DN/Invoice. **(ข) ผลิตเก็บสต็อก** = ไม่เลือกลูกค้า, เหมือนเปิด PO → BOM check → PRD ไม่ผูกลูกค้า → RM ขาด auto-PR → ผลิต → QC ผ่าน → FG เข้าคลัง → ขายภายหลังผ่าน (ก). Supply Planning ปุ่มสั่งผลิต = prefill (ข) (D8 v2).

---

## 1. (ก) Sell-from-stock — end-to-end
| # | Step | ผู้ทำ | เอกสาร/สถานะ | stock-ledger effect (FG) |
|---|---|---|---|---|
| 1 | `so-create` (ก) → **เลือกลูกค้า (customer dropdown)** + FG มีสต็อก → โชว์ FG Available ราย Batch (D16) | Sale Own-Brand | `SO-…` (ร่าง) | — |
| 2 | กด **"ยืนยันใบสั่งขาย (จอง FG)"** → ของมีในสต็อก → **จอง FG per-Batch** + SO = **พร้อมส่ง (Ready to Ship)** → รอโมดูล **การจัดส่ง** | Sale Own-Brand | SO = พร้อมส่ง | `RESERVE (+reserved FG)` |
| 3 | โมดูลการจัดส่งหยิบเข้ารอบ → **ตัด FG FIFO ราย Batch** ตอน dispatch | Shipping | SO → กำลังจัดส่ง | `CONSUME (−on_hand FG, FIFO)` |
| 4 | ออก **DN (อ้าง SO)** → ส่งถึง | Shipping | `DN-…` (Own-Brand badge) | — |
| 5 | ออก **Invoice (อ้าง SO + cost snapshot, D10)** → รับชำระ | Finance | `INV-…` | — |
| — | **ยกเลิก SO** ก่อน dispatch = คืนจอง FG | Sale Own-Brand | SO = ยกเลิก | `RELEASE (−reserved FG)` |

## 2. (ข) Produce-to-stock — end-to-end
| # | Step | ผู้ทำ | เอกสาร/สถานะ | stock-ledger effect (FG) |
|---|---|---|---|---|
| 0 | (option) Supply Planning เห็น FG **Low** → กด **"สั่งผลิต"** → **prefill** so-create (ข) จำนวน = Suggested (D8 v2) | วางแผน | prefill | — |
| 1 | `so-create` (ข) → **ไม่เลือกลูกค้า** + FG(BOM) + จำนวนผลิต → ยืนยัน → **BOM RM stock check** | Sale/วางแผน | `SO-…` (ผลิตเก็บสต็อก) | — |
| 2 | ส่งงานเข้า production → **PRD ไม่ผูกลูกค้า** (customerless) | Production | `PRD-…` | — |
| 3 | **RM ขาด → สร้าง production order ได้ + AUTO-open PR** ไปคลัง | Production/Stock | `PR-…` | (RM) `RESERVE/CONSUME` |
| 4 | ผลิต → gen Batch → QC ตรวจ (Batch ไม่ผูกลูกค้า — U1) | Production/QC | `B-PRD-…` | (RM) `CONSUME` |
| 5 | **QC ผ่าน → FG เข้าคลัง per-Batch (D12)** | QC/Stock | FG on_hand + | `FG-in (+on_hand FG)` |
| 6 | ขายภายหลังผ่าน (ก) — ตัด FIFO ราย Batch | Sale Own-Brand | ตาม (ก) | ตาม (ก) |

## 3. ความต่างสำคัญ vs OEM
- **ไม่มี Quotation** (D18-2).
- (ข) **auto-open PR** เมื่อ RM ขาด (เหมือน PO; ต่างจาก Quotation ที่ไม่ auto-PR).
- ที่มา produce-to-stock = **เดียว** (หน้า SO produce-to-stock); Supply Planning แค่ prefill (D8 v2, ปิด U4).
- (ข) ไม่มีลูกค้า/ราคาตอนผลิต — FG เข้าคลังก่อน แล้วขาย (ก) ทีหลัง.

## 4. Trace chain
- (ก): `SO ↔ FG Batch (FIFO) ↔ Lot ↔ DN ↔ ลูกค้า` + cost snapshot ที่ line.
- (ข): `FG stock (per-Batch) ↔ Batch ↔ Lot` (genealogy ครบแม้ยังไม่มีลูกค้า); เมื่อขาย → เชื่อมกับ (ก).
- ทุก movement มี reason + source (D15).

## 5. Status touchpoints
- SO (ก): ร่าง → พร้อมส่ง (จอง FG) → กำลังจัดส่ง → ส่งถึง → (billing) Paid/Overdue.
- SO (ข): ร่าง → ผลิตเก็บสต็อก → (PRD/Batch flow) → FG เข้าคลัง.
- credit term (ก) = ระดับลูกค้า 30/60/90 default 60 (override รายใบแจ้งหนี้ได้).
