# Module — Stock (RM + FG)

slug: `erp-v2-ui-first` · per-module canonical · PO · 2026-07-29
Mockups: `mockups/stock.html` · `mockups/goods-receipt.html` · `mockups/return.html`
กฎอ้างอิง: stock-reservation (3 ยอด, reserve/consume) · entity-status-map §1.6 (negative stock, FIFO retro-link) · **D11 v2/D12/D16** (FG per-Batch, 1 BOM=1 FG, รหัส user-entered-locked) · **D13** (surplus) · **D15** (loss + ledger reason/source) · README §3 · `bom.md` (BOM/FG code + create-only-lock) · `traceability.md` (audit)

## สรุปภาษาไทย
คลังรองรับ **RM (per-lot) + FG (per-Batch, FIFO — D16)** แยกแท็บ. ทุกวัตถุดิบ/FG มี 3 ยอด (คงคลัง/จองแล้ว/ใช้ได้), ติดลบได้ + badge. **แท็บ RM: (1) "เพิ่มวัตถุดิบใหม่" — รหัส RM ผู้ใช้ตั้งเองตอนสร้าง, ต้องไม่ซ้ำ (unique), และ ★ แก้ไขไม่ได้หลังสร้าง (create-only-lock — ปอนด์: "RM ก็ด้วย")** · (2) แยกเป็น **2 action**: **Loss (ตัดคงคลัง −)** และ **Adjust (ปรับยอด +)** — **★ ทั้งคู่อ้าง Lot: เลือก lot ที่ต้องการ หรือเลือก "FIFO" (ระบบตัด/บวก lot เก่าสุดก่อน) ถ้าไม่มี lot/จำไม่ได้** (ปอนด์สั่ง 2026-07-29 — Adjust เดิม RM-only ตอนนี้อ้าง Lot + FIFO fallback ด้วย). ทั้งคู่ปุ่ม **"บันทึก (คงคลัง)"**, เหตุผลบังคับ + ledger source (D15). เลือก RM/Lot ผ่าน **search dropdown** (RM ค้นได้ทั้ง **ชื่อและรหัส**). **แท็บ FG: loss/ปรับยอด FG** เลือก FG ผ่าน **search dropdown ค้นได้ทั้งชื่อและรหัส** (FG มีรหัส = รหัส BOM ที่ผู้ใช้ตั้งเองตอนสร้าง + ล็อก, 1 BOM=1 FG แบบ 1:1 — D11 v2), ปุ่ม **"บันทึก (คงคลัง)"**. ทุก movement (add-RM/reserve/consume/GR/FG-in/surplus/loss/adjust/return) เป็น **ledger + audit + trace ที่มีเหตุผล + แหล่งที่มา (source ref) บังคับ** (append-only, D15).

---

## 1. Purpose
เป็นความจริงของยอดคงคลัง RM + FG, การสร้าง master วัตถุดิบ, การจอง/ตัด, การรับเข้า (GR), คืน (Return), loss/adjust/surplus และ **stock ledger** ที่ตอบได้ทุกครั้งว่า "ทำไมยอดขึ้น/ลง" + ใครเป็นคนทำ (audit/trace).

## 2. Screens / Tabs
| หน้าจอ/แท็บ | บทบาท |
|---|---|
| `stock.html` แท็บ **RM** | 3 ยอดต่อ RM + negative badge + **ledger view (reason/source)** + **"เพิ่มวัตถุดิบใหม่" (รหัส RM ผู้ใช้ตั้งตอนสร้าง+unique+ล็อกหลังสร้าง)** + **2 action: Loss (ตัดคงคลัง −, อ้าง Lot/FIFO) / Adjust (ปรับยอด +, อ้าง Lot/FIFO)** — RM/Lot = search dropdown (U2/U7 ต้องเพิ่ม) |
| `stock.html` แท็บ **FG** | FG แตกราย Batch (FIFO) + 3 ยอด + **loss/ปรับยอด FG (FG = search dropdown ค้นชื่อ+รหัส)** + ledger (FG-in/surplus/loss/adjust) |
| `goods-receipt.html` | รับเข้า RM (gen Lot, ชดเชยติดลบ + FIFO retro-link) — อ้าง RM ที่สร้างไว้แล้ว (`goods-receipt.md`) |
| `return.html` | คืน RM ให้ supplier (ระบุ Lot → ตัด stock + เหตุผลบังคับ) |

## 3. Model — 3 ยอด (RM + FG เหมือนกัน)
| ยอด | นิยาม | ติดลบได้ |
|---|---|---|
| คงคลัง (on_hand) | กายภาพจริง (RM per-lot / FG per-Batch) | ได้ (ตัดเกิน → GR retro-link) |
| จองแล้ว (Reserved) | Σ reservation active | ไม่ (≥0) |
| ใช้ได้ (Available) = on_hand − Reserved | รับปากกับ order ใหม่ได้ | ได้ (จองเกิน = เตือนไม่บล็อก) |
> FG reservation มิเรอร์ RM (D12): SO(ก) ยืนยัน = จอง FG per-Batch → ตัด FIFO ตอน dispatch.

## 3b. ★ เพิ่มวัตถุดิบใหม่ (RM master — รหัสผู้ใช้ตั้งเองตอนสร้าง, unique, ล็อกหลังสร้าง) — ปอนด์สั่ง 2026-07-29
- **สร้าง RM master จากแท็บ RM** (ปุ่ม "เพิ่มวัตถุดิบใหม่").
- ฟิลด์:
  | ฟิลด์ | ชนิด | editable/computed | หมายเหตุ |
  |---|---|---|---|
  | **รหัสวัตถุดิบ (RM code)** | string | **editable เฉพาะตอนสร้าง (ผู้ใช้พิมพ์เอง) · LOCKED หลังสร้าง (read-only)** | **บังคับ + ต้องไม่ซ้ำ (UNIQUE) ตอนสร้าง** · รูปแบบอิสระ (free-form) แต่ระบบ **reject ถ้าซ้ำ** ก่อนบันทึก · **★ แก้ไขไม่ได้หลังสร้าง (create-only-lock)** — ปอนด์สั่ง 2026-07-29 ("RM ก็ด้วย") เพื่อไม่ให้ reference (GR/Lot/BOM component/trace) แตก · กติกาเดียวกับรหัส BOM/FG (`bom.md` §5) |
  | ชื่อวัตถุดิบ | string | editable | บังคับ |
  | หน่วยนับ (unit) | string | editable | บังคับ |
  | (optional) supplier ตั้งต้น / หมายเหตุ | ref/text | editable | ไม่บังคับ |
- **ยอดตั้งต้น:** RM ที่เพิ่งสร้าง on_hand = 0 · ของจริงเข้าคลังผ่าน **Goods Receipt** (gen Lot) เท่านั้น — การ "เพิ่มวัตถุดิบใหม่" คือสร้าง master ไม่ใช่ movement.
- **Audit/trace:** การสร้าง RM = **entity-create event** ที่ถูก audit + ปรากฏบน trace (entity=RM, action=create, ใคร/เมื่อ) — `traceability.md` §3/§4.
- RM ที่สร้างแล้วเลือกได้ทันทีใน GR / Loss / Adjust / BOM component (search dropdown, ค้นชื่อ+รหัส).

## 4. ★ FG per-Batch (D16) + FG เข้าคลัง (D12) + surplus (D13) + รหัส FG (D11 v2)
- **FG แตกราย Batch** (Batch = "lot" ของ FG) · ตัด **FIFO** ตอนขาย/ส่ง · UI โชว์ breakdown ราย Batch (recall GMP).
- **FG เข้าคลังเมื่อ:** (1) produce-to-stock Batch **QC ผ่าน → กด "พร้อมส่ง"** → `FG-in (+)` (production.md §4) · (2) OEM **surplus** ตอน "พร้อมส่ง" → `surplus (+)` (คง Batch identity ของตัวเอง ผูก OEM Batch/PRD/PO — แก้ U6).
- **1 BOM = 1 FG แบบ 1:1 · FG มีรหัส = รหัส BOM (แชร์รหัสเดียว)** → FG **ค้นได้ทั้งชื่อและรหัส** ในแท็บ FG (search dropdown). **★ ที่มารหัส = ผู้ใช้ตั้งเองตอนสร้าง BOM + unique + ล็อกหลังสร้าง (D11 v2 — ต่างจากถ้อยคำเดิม "auto")**; รายละเอียด = `bom.md` §3/§5. (OEM BOM ก็มี FG identity + รหัส เช่นกัน — ปกติยอด 0 ยกเว้น surplus D13.)

## 5. ★ Loss / Adjust — แยก 2 action (ปอนด์สั่ง 2026-07-29; ★ Adjust อ้าง Lot + FIFO fallback — Production review 2026-07-29)

### 5.1 RM — 2 action แยกกัน (ทั้งคู่อ้าง Lot + มี FIFO fallback)
| action | ทิศทาง | เลือกอะไร | ผลต่อ on_hand | ปุ่ม |
|---|---|---|---|---|
| **Loss (ตัดคงคลัง)** | **ลด (−)** | **RM (บังคับ, search dropdown ค้นชื่อ+รหัส)** + **Lot (อ้างอิง: เลือก lot ที่มี stock **หรือ** เลือก "FIFO")** | ตัด on_hand · **เลือก lot → ตัด lot นั้นเจาะจง (GMP)** · **เลือก "FIFO" (ไม่มี lot/จำไม่ได้) → ตัด RM แบบ FIFO (lot เก่าสุดก่อน)** | **"บันทึก (คงคลัง)"** |
| **Adjust (ปรับยอด)** | **เพิ่ม (+)** | **RM (บังคับ, search dropdown ค้นชื่อ+รหัส)** + **★ Lot (อ้างอิง: เลือก lot **หรือ** เลือก "FIFO")** | เพิ่ม on_hand · **เลือก lot → บวกเข้า lot นั้นเจาะจง (คง genealogy)** · **★ เลือก "FIFO" (ไม่มี lot/จำไม่ได้) → บวกเข้า RM แบบ FIFO (ผูก lot เก่าสุดก่อน)** | **"บันทึก (คงคลัง)"** |
- **★ delta (ปอนด์สั่ง 2026-07-29 — Production review):** เดิม Adjust (+) เป็น **RM-only** (ไม่อ้าง Lot). ปอนด์กำหนดใหม่: **Adjust ต้องอ้าง Lot เสมอ — เลือก lot ที่ต้องการ, หรือถ้าไม่มี/จำไม่ได้ ให้เลือก "FIFO" (ระบบผูก lot เก่าสุดก่อน)** — สมมาตรกับ Loss. เพื่อคง genealogy ราย lot ครบทุก movement.
- ทั้งสอง action: **เหตุผลบังคับ (mandatory reason)** + **source ref บังคับ = warehouse (+ lot/FIFO ref)** · **ไม่ต้องอนุมัติ** · append-only ledger (D15) · **audit + trace**.
- **หมายเหตุการตั้งชื่อ (ปอนด์สั่ง):** ป้ายปุ่มบันทึกฝั่ง RM = **"บันทึก (คงคลัง)"**.
- Return (คืน supplier) ยังเป็น action แยก (`return.md`) — ไม่ใช่ Loss.

### 5.2 FG — ปรับยอด FG ตรง (delta ±) + loss (คงเดิม + ปอนด์ delta 2026-07-29)
- แท็บ FG อนุญาต **ปรับยอด FG (adjust ±) + บันทึก loss FG** ได้จากที่นี่ — **เลือก FG ผ่าน search dropdown ค้นได้ทั้งชื่อและรหัส** (FG มีรหัส = รหัส BOM, D11 v2).
- **เหตุผลบังคับ** + **ledger source = warehouse adjust/loss** (D15) · ตัด/เพิ่ม on_hand ราย Batch (FIFO เมื่อ − / ผูก Batch เก่าสุดก่อนเมื่อ +) · **ไม่ต้องอนุมัติ** · audit + trace.
- **ป้ายปุ่มบันทึกฝั่ง FG (ปอนด์สั่ง):** = **"บันทึก (คงคลัง)"**.
> **หมายเหตุความสมมาตร:** ปอนด์สั่งแยก 2 action (Loss −/Adjust +) เฉพาะ **แท็บ RM** (ทั้งคู่ตอนนี้อ้าง Lot/FIFO); ฝั่ง **FG** ยังคง adjust ± ตรง + loss ตามเดิม (FG อ้าง Batch เป็นหน่วย lot — FIFO/เลือก Batch). UX/UI ทำตามนี้.

## 6. Stock Ledger (D15) — ทุก movement มีเหตุผล + source + audit/trace
| movement | ผล | source ref (บังคับ) |
|---|---|---|
| `RESERVE` / `RELEASE` | reserved ± | PO line / SO |
| `CONSUME (−)` | on_hand − (ตอนเริ่มผลิต, **เลือก lot มี stock; หลาย lot = FIFO**) | Batch/PRD/PO + Lot |
| `GR (+)` | on_hand + (ชดเชยติดลบ + FIFO retro-link) | Lot/PR/GR |
| `FG-in (+)` | FG on_hand + (QC ผ่าน + กด "พร้อมส่ง", produce-to-stock) | PRD/Batch |
| `surplus (+)` | FG on_hand + (ผลิตเกิน OEM, remark ไม่ approve) | Batch/PRD/PO |
| `loss (−)` | on_hand − (เหตุผลบังคับ, ไม่อนุมัติ) · **RM: อ้าง Lot (เลือก lot มี stock **หรือ** "FIFO"=lot เก่าสุดก่อน)** | Batch/PRD (production) หรือ **warehouse** + Lot/FIFO |
| `adjust (+)` | on_hand + (**เพิ่มอย่างเดียว**, เหตุผลบังคับ, RM บังคับ) · **★ RM: อ้าง Lot (เลือก lot **หรือ** "FIFO"=lot เก่าสุดก่อน)** | **warehouse-adjust** + Lot/FIFO |
| `return (−)` | on_hand − (คืน supplier) | Lot/Supplier/RT |
> append-only. **ทุกแถว ledger = audit event + ปรากฏบน trace** (reason + source + Lot ref + ใคร/เมื่อ — D15, `traceability.md` §4). loss ที่ทำให้ได้ไม่ครบตามสั่ง → **ไม่ auto re-produce** (คนกด "ผลิตซ้ำ" เอง, D15).
> **★ delta 2026-07-29 (ปอนด์):** (a) เดิม `adjust (±)` (สองทาง) → แยกเป็น **`loss (−)`** (ลด) และ **`adjust (+)`** (เพิ่ม). (b) **★ Production review 2026-07-29:** **`adjust (+)` เพิ่ม Lot ref (เลือก lot หรือ "FIFO")** เหมือน `loss (−)` — โมเดล ledger append-only+signed ไม่กระทบ (เป็น source-ref เพิ่ม Lot/FIFO ต่อ movement). CONSUME ระบุชัด "เลือกเฉพาะ lot ที่มี stock; หลาย lot = FIFO" (production.md §5d).

## 7. Loss (D15)
- จุดบันทึก: (ก) `production` (บนหน้าจัดการงานผลิต — ปุ่ม Loss + confirm popup ทุกครั้ง, production.md §7.5) · (ข) `stock` warehouse (RM + FG).
- บังคับเหตุผล + trace · ตัด **on_hand อย่างเดียว** · **ไม่ต้องอนุมัติ** · เป็น ledger (reason+source) + audit.
- **RM warehouse/production loss:** อ้าง **Lot (เลือก lot มี stock หรือ "FIFO")**. RM เลือกผ่าน search dropdown (ชื่อ+รหัส).

## 8. Actions & Permissions (D14)
| ปุ่ม/action | Permission required |
|---|---|
| ดู stock (RM/FG) + ledger | Warehouse/Stock.**Read (R)** |
| **เพิ่มวัตถุดิบใหม่ (create RM master, รหัส unique, ล็อกหลังสร้าง)** | Warehouse/Stock.**Create (C)** |
| Adjust (ปรับยอด +, อ้าง Lot/FIFO) RM/FG | Warehouse/Stock.**Update (U)** + เหตุผล |
| Loss (ตัดคงคลัง −, อ้าง Lot/FIFO) RM/FG (warehouse) | Warehouse/Stock.**Update (U)** + เหตุผล |
| บันทึก loss (production) | Production.**Update (U)** + เหตุผล |
| Goods Receipt | Warehouse/Stock.**Create (C)** |
| Return (คืน supplier) | Warehouse/Stock.**Update (U)** + เหตุผล |
> surplus (D13) = auto ตอนพร้อมส่ง (ไม่มี permission แยก, แจ้ง remark).

## 9. Validations
- **RM code: ตอนสร้าง = บังคับ + UNIQUE** (reject ถ้าซ้ำก่อนบันทึก) · **หลังสร้าง = read-only (แก้ไม่ได้ — create-only-lock)** · ชื่อ + หน่วยนับ บังคับ.
- **Adjust (RM): RM บังคับ · ★ Lot อ้างอิงบังคับ (เลือก lot **หรือ** "FIFO")** · เป็น **+ เท่านั้น** · เหตุผล + source บังคับ.
- **Adjust (FG): FG บังคับ** (search dropdown) · เป็น ± (ราย Batch, FIFO/เลือก Batch) · เหตุผล + source บังคับ.
- **Loss (RM): RM บังคับ · Lot อ้างอิง (เลือก lot มี stock **หรือ** "FIFO")** · เป็น **− เท่านั้น** · เหตุผล + source บังคับ.
- **★ Lot ที่เลือกได้ = เฉพาะ lot ที่มี stock (on_hand > 0);** เลือก "FIFO" = ระบบจัดการ lot เก่าสุดก่อน (Loss ตัด / Adjust บวก).
- adjust/loss/return = **เหตุผลบังคับ** + source ref · **ทุกครั้ง audit + trace**.
- FG ตัดตอนขาย/loss = FIFO ราย Batch (ห้ามข้าม Batch เก่า).
- on_hand ติดลบ = แดง + badge "ติดลบ (รอรับเข้า)"; available ติดลบ = "จองเกิน (รอรับเข้า)".

## 10. Pagination / Search
- ledger + FG batch breakdown: 20/หน้า (G1) · ค้น RM/FG by **name/code** · filter movement type/ช่วงวันที่ (G2).
- **★ RM/Lot/FG selection = search-in-dropdown** (ปอนด์สั่ง): **RM ค้นได้ทั้งชื่อและรหัส** · **Lot** ค้นผ่าน dropdown (**Loss + Adjust ทั้งคู่ + option "FIFO"**) · **FG ค้นได้ทั้งชื่อและรหัส**.

## 11. Cross-links
- reservation → stock-reservation · GR/retro-link → entity-status-map §1.6 · **RM master ที่สร้างที่นี่ → อ้างใน `goods-receipt.md` (GR line), `bom.md` (component)** · **FG/รหัส FG + create-only-lock → `bom.md` §5 (1 BOM=1 FG, code)** · FG source + loss/lot-FIFO consume → `production.md` §5/§7 (surplus, loss, FIFO), `so.md` (produce-to-stock FG-in) · **audit/trace ทุก movement + add-RM → `traceability.md` §3/§4 · `non-functional.md` AU3** · trace → scope §8.5.

## 12. Module changelog
- **เพิ่ม (รอบก่อน):** FG per-Batch tab + ปรับยอด FG ตรง (D15) · ledger reason/source ทุก movement · surplus batch identity (แก้ U6) · RM ledger/loss form (แก้ U2).
- **★ เพิ่ม (2026-07-29 — Stock module 4 review, ปอนด์):**
  1. **"เพิ่มวัตถุดิบใหม่"** — RM code **ผู้ใช้ตั้งเอง แต่ต้อง UNIQUE** — §3b · audit entity-create.
  2. **แยก Loss / Adjust เป็น 2 action (RM):** Loss=ลด(−) · Adjust=เพิ่ม(+) — §5.1, ledger §6.
  3. **เปลี่ยนป้ายปุ่มบันทึก RM/FG** → **"บันทึก (คงคลัง)"** — §5.
  4. **RM/Lot/FG = search dropdown** · RM & FG **ค้นได้ทั้งชื่อและรหัส** — §10.
  5. **Audit + tracing** ทุก stock movement พร้อม reason+source (D15) — §6/§9/§11.
- **★ CHANGED (2026-07-29 — BOM module review, ปอนด์: "RM ก็ด้วย"):** **RM code = user-entered + unique + ★ ล็อกหลังสร้าง (create-only-lock)** — §3b/§9.
- **★ CHANGED (2026-07-29 — Production module review, ปอนด์):** **Adjust (ปรับยอด +) ตอนนี้ต้องอ้าง Lot เสมอ — เลือก lot ที่ต้องการ หรือเลือก "FIFO" (lot เก่าสุดก่อน) ถ้าไม่มี/จำไม่ได้** (เดิม RM-only) — สมมาตรกับ Loss เพื่อคง genealogy ราย lot — §5.1/§6/§9/§10. คง D15 ledger append-only. **CONSUME** ระบุชัด "เลือก lot ที่มี stock; หลาย lot = FIFO" (production.md §5d).
