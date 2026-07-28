# Flow — OEM (Quotation → PO → ผลิต → surplus → ส่ง → Invoice)

slug: `erp-v2-ui-first` · per-module canonical · PO · 2026-07-29
กฎอ้างอิง: D3/D10/D13/D18 · stock-reservation (Option A) · entity-status-map · scenario-walkthrough S1
โมดูลที่เกี่ยว: `quotation.md` · `po.md` · `stock.md` · `production.md` · (delivery-note/invoice/trace = spec เดิม)

## สรุปภาษาไทย
สาย OEM (รับจ้างผลิต): เริ่มที่ **ใบเสนอราคา (optional)** → ลูกค้าตกลง → **Convert เป็น PO เลขใหม่** (prefill) → ยืนยัน PO = จองวัตถุดิบ → เริ่มผลิต = ตัดจริง FIFO → QC → ฝ่ายผลิตกรอกจำนวนผลิตจริง → ตอน "พร้อมส่ง" ส่งตามสั่ง + **ส่วนเกินเข้า FG stock** (remark) → DN (อ้าง PO) → Invoice (+ cost snapshot) → ชำระ. **สร้าง PO ตรงโดยไม่มี Quotation ก็ได้** (D18-3).

---

## 1. End-to-end steps
| # | Step | ผู้ทำ | เอกสาร/เลข | stock-ledger effect |
|---|---|---|---|---|
| 1 | เสนอราคา (customer dropdown, line BOM/RM, material check ไม่ auto-PR) → บันทึก → print-ready | Sale OEM | `QT-{YYYYMM}-{NNNNNN}` (ร่าง→ส่งแล้ว) | — |
| 2 | ต่อรอง → แก้ = **เวอร์ชันใหม่** (immutable) | Sale OEM | QT v2 | — |
| 3 | ลูกค้าตกลง → กด **"Convert to PO"** → QT = ตกลง (Agreed) + ลิงก์ QT↔PO → prefill po-create → กรอกวันรับของ → บันทึก | Sale OEM | **`PO-{YYYYMM}-{NNNNNN}`** ใหม่ (ยกยอด line/qty/ราคา) | — |
| 4 | ยืนยัน PO → **จองวัตถุดิบ** (ΣBOM×qty); RM ขาด → เตือน + auto PR | Sale/Stock | reserve · `PR-{NNNNNN}` | `RESERVE (+reserved, −available)` |
| 5 | Goods Receipt RM (ชดเชยติดลบ + FIFO retro-link) → QC ขาเข้าผ่าน | Stock/QC | `GR-…` · Lot | `GR (+on_hand)` |
| 6 | ฝ่ายผลิต **รับงาน** (gen PRD) → **เริ่มผลิต** (gen Batch + ตัดจริง FIFO, ติดลบได้) | Production | `PRD-…` · `B-{PO}-{line}-{run}` | `CONSUME (−on_hand)` |
| 7 | ส่งตรวจ → **QC ผ่าน** (ไม่ผ่าน+feedback → Rework run+1) | QC | Batch = QC ผ่าน | — |
| 8 | กรอก **จำนวนผลิตจริง (actual qty)** (อาจเกินสั่ง) | Production | actual/ordered | — |
| 9 | กด **"พร้อมส่ง (Ready to Ship)"** → ส่งตามสั่ง · **ส่วนเกิน → FG stock** (remark, ไม่ approve, คง Batch identity ผูก PO/PRD/Batch) | Production | FG(สินค้านั้น) per-Batch | `surplus (+FG on_hand)` |
| 10 | ออก **DN (อ้าง PO)** → ส่งถึง (ลูกค้าเซ็น) | Shipping | `DN-…` | — |
| 11 | ออก **Invoice (อ้าง PO + cost snapshot line, D10)** → รับชำระ / overdue ตาม credit term | Finance | `INV-…` | — |

## 2. Variants
- **ไม่มี Quotation (D18-3):** ข้าม step 1–3 → เปิด PO ตรงที่ po-create (origin QT ว่าง).
- **RM-direct line (D3):** line วัตถุดิบตรง **ยังผ่านขั้นผลิต** (แปรรูปจริง optional) — เดินสถานะ production เหมือน BOM.
- **Cancel ก่อนเริ่มผลิต:** release reservation ที่ยังไม่ consume (คืน available). หลังเริ่มผลิต: ส่วนที่ consume แล้วไม่คืน.

## 3. Trace chain (GMP + cost)
`QT ↔ PO ↔ PRD ↔ Batch ↔ (FG surplus per-Batch) ↔ Lot ↔ DN ↔ ลูกค้า` + cost snapshot ที่ line + ledger reason/source ทุก movement (scope §8.1/§8.6). QT Rejected = เก็บประวัติ ไม่เกิด PO.

## 4. Status touchpoints
- QT: ร่าง→ส่งแล้ว→ตกลง (เปิด Convert) / ปฏิเสธ.
- PO fulfilment: Draft→Confirmed→In Production→Ready→In Delivery→Delivered.
- PO billing: Not Invoiced→Invoiced→Paid/Overdue (credit term 30/60/90 default 60).
- Surplus จับที่ **"พร้อมส่ง" ไม่ใช่ QC pass** (D13).
