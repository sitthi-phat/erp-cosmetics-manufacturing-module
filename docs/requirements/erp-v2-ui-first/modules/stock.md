# Module — Stock (RM + FG)

slug: `erp-v2-ui-first` · per-module canonical · PO · 2026-07-29
Mockups: `mockups/stock.html` · `mockups/goods-receipt.html` · `mockups/return.html`
กฎอ้างอิง: stock-reservation (3 ยอด, reserve/consume) · entity-status-map §1.6 (negative stock, FIFO retro-link) · **D11/D12/D16** (FG per-Batch) · **D13** (surplus) · **D15** (loss + ledger reason/source) · README §3

## สรุปภาษาไทย
คลังรองรับ **RM (per-lot) + FG (per-Batch, FIFO — D16)** แยกแท็บ. ทุกวัตถุดิบ/FG มี 3 ยอด (คงคลัง/จองแล้ว/ใช้ได้), ติดลบได้ + badge. **FG tab: ปรับยอด FG ได้ตรงจากที่นี่** (เหตุผลบังคับ + ledger source ตาม D15). ทุก movement (reserve/consume/GR/FG-in/surplus/loss/return/adjust) เป็น **ledger ที่มีเหตุผล + แหล่งที่มา (source ref)** บังคับ ลิงก์ Batch/PRD/PO/SO (append-only). loss = เหตุผลบังคับ ตัด on_hand ไม่อนุมัติ. surplus (D13) = auto ตอน "พร้อมส่ง" + remark (ไม่ approve).

---

## 1. Purpose
เป็นความจริงของยอดคงคลัง RM + FG, การจอง/ตัด, การรับเข้า (GR), คืน (Return), loss/adjust/surplus และ **stock ledger** ที่ตอบได้ทุกครั้งว่า "ทำไมยอดขึ้น/ลง".

## 2. Screens / Tabs
| หน้าจอ/แท็บ | บทบาท |
|---|---|
| `stock.html` แท็บ **RM** | 3 ยอดต่อ RM + negative badge + **ledger view (reason/source)** + ฟอร์ม loss/adjust (U2 ต้องเพิ่ม) |
| `stock.html` แท็บ **FG** | FG แตกราย Batch (FIFO) + 3 ยอด + **ปรับยอด FG ตรง** + ledger (FG-in/surplus/loss/adjust) |
| `goods-receipt.html` | รับเข้า RM (gen Lot, ชดเชยติดลบ + FIFO retro-link) |
| `return.html` | คืน RM ให้ supplier (ระบุ Lot → ตัด stock + เหตุผลบังคับ) |

## 3. Model — 3 ยอด (RM + FG เหมือนกัน)
| ยอด | นิยาม | ติดลบได้ |
|---|---|---|
| คงคลัง (on_hand) | กายภาพจริง (RM per-lot / FG per-Batch) | ได้ (ตัดเกิน → GR retro-link) |
| จองแล้ว (Reserved) | Σ reservation active | ไม่ (≥0) |
| ใช้ได้ (Available) = on_hand − Reserved | รับปากกับ order ใหม่ได้ | ได้ (จองเกิน = เตือนไม่บล็อก) |
> FG reservation มิเรอร์ RM (D12): SO(ก) ยืนยัน = จอง FG per-Batch → ตัด FIFO ตอน dispatch.

## 4. ★ FG per-Batch (D16) + FG เข้าคลัง (D12) + surplus (D13)
- **FG แตกราย Batch** (Batch = "lot" ของ FG) · ตัด **FIFO** ตอนขาย/ส่ง · UI โชว์ breakdown ราย Batch (recall GMP).
- **FG เข้าคลังเมื่อ:** (1) produce-to-stock Batch **QC ผ่าน** → `FG-in (+)` · (2) OEM **surplus** ตอน "พร้อมส่ง" → `surplus (+)` (คง Batch identity ของตัวเอง ผูก OEM Batch/PRD/PO — แก้ U6).
- **1 BOM = 1 FG (auto, D11).**

## 5. ★ ปรับยอด FG ตรง (delta — ปอนด์สั่ง)
- แท็บ FG อนุญาต **ปรับยอด FG ได้โดยตรงจากที่นี่** (adjust ±) — **เหตุผลบังคับ (mandatory reason)** + **ledger source บันทึกว่าเป็น warehouse adjust** (D15). ตัด/เพิ่ม on_hand ราย Batch. ไม่ต้องอนุมัติ.

## 6. Stock Ledger (D15) — ทุก movement มีเหตุผล + source
| movement | ผล | source ref (บังคับ) |
|---|---|---|
| `RESERVE` / `RELEASE` | reserved ± | PO line / SO |
| `CONSUME (−)` | on_hand − (ตอนเริ่มผลิต, FIFO) | Batch/PRD/PO |
| `GR (+)` | on_hand + (ชดเชยติดลบ + FIFO retro-link) | Lot/PR/GR |
| `FG-in (+)` | FG on_hand + (QC ผ่าน produce-to-stock) | PRD/Batch |
| `surplus (+)` | FG on_hand + (ผลิตเกิน OEM, remark ไม่ approve) | Batch/PRD/PO |
| `loss (−)` | on_hand − (เหตุผลบังคับ, ไม่อนุมัติ) | Batch/PRD (production) หรือ warehouse |
| `return (−)` | on_hand − (คืน supplier) | Lot/Supplier/RT |
| `adjust (±)` | on_hand ± (เหตุผลบังคับ) | warehouse |
> append-only. loss ที่ทำให้ได้ไม่ครบตามสั่ง → **ไม่ auto re-produce** (คนกด "ผลิตซ้ำ" เอง, D15).

## 7. Loss (D15)
- จุดบันทึก: (ก) `production` ระหว่างผลิต · (ข) `stock` warehouse (RM + FG).
- บังคับเหตุผล + trace · ตัด **on_hand อย่างเดียว** · **ไม่ต้องอนุมัติ** · เป็น ledger (reason+source).

## 8. Actions & Permissions (D14)
| ปุ่ม/action | Permission required |
|---|---|
| ดู stock (RM/FG) + ledger | Warehouse/Stock.**Read (R)** |
| ปรับยอด FG/RM (adjust) | Warehouse/Stock.**Update (U)** + เหตุผล |
| บันทึก loss (warehouse) | Warehouse/Stock.**Update (U)** + เหตุผล |
| บันทึก loss (production) | Production.**Update (U)** + เหตุผล |
| Goods Receipt | Warehouse/Stock.**Create (C)** |
| Return (คืน supplier) | Warehouse/Stock.**Update (U)** + เหตุผล |
> surplus (D13) = auto ตอนพร้อมส่ง (ไม่มี permission แยก, แจ้ง remark).

## 9. Validations
- adjust/loss/return = **เหตุผลบังคับ** + source ref.
- FG ตัดตอนขาย = FIFO ราย Batch (ห้ามข้าม Batch เก่า).
- on_hand ติดลบ = แดง + badge "ติดลบ (รอรับเข้า)"; available ติดลบ = "จองเกิน (รอรับเข้า)".

## 10. Pagination / Search
- ledger + FG batch breakdown: 20/หน้า (G1) · ค้น RM/FG by name/code · filter movement type/ช่วงวันที่ (G2).

## 11. Cross-links
- reservation → stock-reservation · GR/retro-link → entity-status-map §1.6 · FG source → `production.md` (surplus), `so.md` (produce-to-stock FG-in) · trace → scope §8.5.

## 12. Module changelog
- **เพิ่ม:** FG per-Batch tab + ปรับยอด FG ตรง (D15) · ledger reason/source ทุก movement · surplus batch identity (แก้ U6) · RM ledger/loss form (แก้ U2).
