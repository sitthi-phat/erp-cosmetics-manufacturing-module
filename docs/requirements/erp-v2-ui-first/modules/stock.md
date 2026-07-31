# Module — Stock (RM + FG)

slug: `erp-v2-ui-first` · per-module canonical · PO · 2026-07-29 (**+ Return ledger-source RT→RET 2026-07-31 · ★ + C4 OEM FG sellable bucket (OEM identity) r20 2026-07-31**)
Mockups: `mockups/stock.html` · `mockups/goods-receipt.html` · `mockups/return.html`
กฎอ้างอิง: stock-reservation (3 ยอด, reserve/consume) · entity-status-map §1.6 (negative stock, FIFO retro-link) / **§1.8 (GR object · QC-gated stock-in)** · **D11 v2/D12/D16** (FG per-Batch, 1 BOM=1 FG, รหัส user-entered-locked) · **D13** (surplus · **★ C4: OEM surplus = OEM identity, sellable bucket**) · **D15** (loss + ledger reason/source) · README §3 (**G8**) · `bom.md` (BOM/FG code + create-only-lock) · **`goods-receipt.md` §4/§5 (GR object lifecycle · credit on QC pass · ★ เลข GR+Lot ออกตอนบันทึก G8)** · **`qc.md` §4.1 (ตรวจรับ RM = gate เข้าสต็อก)** · **`numbering-on-save.md` (G8)** · **`return.md` (ใบคืน `RET-…`)** · **★ C4: `po.md` §5.4 (OEM sell-from-stock) · `production.md` §5b (OEM surplus) · `delivery-note.md` §7 (held/cancelled OEM → FG)** · `traceability.md` (audit)

## สรุปภาษาไทย
คลังรองรับ **RM (per-lot) + FG (per-Batch, FIFO — D16)** แยกแท็บ **+ ★ แท็บ "Good Receipt (RM)"** (มุมมอง GR ให้ warehouse). ทุกวัตถุดิบ/FG มี 3 ยอด (คงคลัง/จองแล้ว/ใช้ได้), ติดลบได้ + badge. **แท็บ RM: (1) "เพิ่มวัตถุดิบใหม่" — รหัส RM ผู้ใช้ตั้งเองตอนสร้าง, ต้องไม่ซ้ำ (unique), และ ★ แก้ไขไม่ได้หลังสร้าง (create-only-lock)** · (2) แยกเป็น **2 action**: **Loss (ตัดคงคลัง −)** และ **Adjust (ปรับยอด +)** — **★ ทั้งคู่อ้าง Lot: เลือก lot ที่ต้องการ หรือเลือก "FIFO"**. ทั้งคู่ปุ่ม **"บันทึก (คงคลัง)"**, เหตุผลบังคับ + ledger source (D15). เลือก RM/Lot ผ่าน **search dropdown** (RM ค้นได้ทั้ง **ชื่อและรหัส**). **★ แท็บ "Good Receipt (RM)": ลิสต์ GR ทุกใบ + ค้น + filter สถานะ + action "ส่งกลับ QC" / "ยกเลิก"**. **★ การรับเข้า (goods-receipt): เลข GR + Lot ออกตอนบันทึกสำเร็จ + popup ยืนยัน (G8).** **★ RM ที่รับเข้าจะ credit on_hand ก็ต่อเมื่อ QC ตรวจรับ "ผ่าน"** (`qc.md` §4.1). **แท็บ FG: loss/ปรับยอด FG** เลือก FG ผ่าน **search dropdown ค้นได้ทั้งชื่อและรหัส**. **★★ ใหม่ (C4 ⭐ r20): FG stock เก็บทั้ง Own-Brand FG และ OEM FG (OEM identity) ในคลังเดียวกัน — OEM FG มาจาก overproduction/surplus (D13) และของ OEM ที่ลูกค้ายกเลิกการจัดส่ง/ฝากไว้ → เป็น "sellable bucket" ขายซ้ำผ่าน OEM PO ใหม่ได้ (sell-from-stock, `po.md` §5.4).** ทุก movement (add-RM/reserve/consume/GR/FG-in/surplus/loss/adjust/return) เป็น **ledger + audit + trace ที่มีเหตุผล + แหล่งที่มา (source ref) บังคับ** (append-only, D15). **★ `return (−)` source ใช้เลขใบคืน `RET-…`.**

---

## 1. Purpose
เป็นความจริงของยอดคงคลัง RM + FG, การสร้าง master วัตถุดิบ, การจอง/ตัด, การรับเข้า (GR — credit เมื่อ QC ผ่าน), คืน (Return), loss/adjust/surplus และ **stock ledger** ที่ตอบได้ทุกครั้งว่า "ทำไมยอดขึ้น/ลง" + ใครเป็นคนทำ (audit/trace). **+ ให้ warehouse เห็น/จัดการ GR ที่รับมา (รวมที่ QC ไม่ผ่าน) ที่แท็บ "Good Receipt (RM)".** **★ C4: FG stock เป็นแหล่ง sell-from-stock ทั้ง Own-Brand (SO ก) และ OEM (OEM PO ที่ fulfil จากสต็อก, `po.md` §5.4).**

## 2. Screens / Tabs
| หน้าจอ/แท็บ | บทบาท |
|---|---|
| `stock.html` แท็บ **RM** | 3 ยอดต่อ RM + negative badge + **ledger view (reason/source)** + **"เพิ่มวัตถุดิบใหม่" (รหัส RM ผู้ใช้ตั้งตอนสร้าง+unique+ล็อกหลังสร้าง)** + **2 action: Loss (ตัดคงคลัง −, อ้าง Lot/FIFO) / Adjust (ปรับยอด +, อ้าง Lot/FIFO)** — RM/Lot = search dropdown |
| `stock.html` แท็บ **FG** | FG แตกราย Batch (FIFO) + 3 ยอด + **loss/ปรับยอด FG (FG = search dropdown ค้นชื่อ+รหัส)** + ledger (FG-in/surplus/loss/adjust) · **★ C4: แสดง identity ของ Batch = Own-Brand หรือ OEM (OEM ผูก PO/PRD/Batch ต้นทาง); OEM FG = sellable bucket** |
| **★ `stock.html` แท็บ "Good Receipt (RM)"** | **ลิสต์ GR object ทุกใบ + สถานะ (ผ่าน/ไม่ผ่าน/QC ตรวจสอบ/ยกเลิก) + search + filter + action ส่งกลับ QC / ยกเลิก** — §2b |
| `goods-receipt.html` | รับเข้า RM (gen GR object + Lot รอตรวจ, **credit ตอน QC ผ่าน**) — อ้าง RM ที่สร้างไว้แล้ว · **★ เลข GR+Lot ออกตอนบันทึกสำเร็จ + popup (G8/NS7 — `goods-receipt.md` §5)** |
| `return.html` | คืน RM ให้ supplier (ระบุ Lot **+ ★ เลือก RM ในล็อต (1 lot หลาย RM)** → ตัด stock + เหตุผลบังคับ — `return.md`) |

## 2b. ★ แท็บ "Good Receipt (RM)" — มุมมอง/จัดการ GR ของ warehouse (ปอนด์สั่ง 2026-07-29)
เพิ่มแท็บใหม่ใน `stock.html` เคียงข้างแท็บ RM และ FG — **เพื่อให้คลังเห็น RM ที่รับมาแต่ QC ไม่ผ่าน แล้ว action ต่อได้**. แท็บนี้เป็น **มุมมองของ GR object** (data เดียวกับ `goods-receipt.md`; แท็บนี้ = list + จัดการ, ไม่สร้าง GR ใหม่ที่นี่).

- **ลิสต์ GR records** (20/หน้า, G1) — แสดง: เลข GR · วันที่รับ · supplier · Lot(s) · RM (ชื่อ/รหัส) · จำนวน · **สถานะ GR**.
- **★ Search (any-match):** **(1) เลข GR** · **(2) Lot** · **(3) Supplier** · **(4) ชื่อ RM** · **(5) name/code (รหัส RM)** · **(6) ★ ช่วงวันที่ (date-range) บนวันที่รับ (received date)** (G2).
- **★ Filter by สถานะ:** **ผ่าน (pass) · ไม่ผ่าน (fail) · QC ตรวจสอบ (under QC) · ยกเลิก (cancelled)** (ตรง GR object lifecycle, `goods-receipt.md` §4.2).
- **★ Action ต่อ record:**
  - **ส่งกลับไปที่ QC (re-submit to QC):** เฉพาะ GR **ไม่ผ่าน** → Lot ที่ไม่ผ่านกลับ "รอตรวจ" + GR กลับ "QC ตรวจสอบ" (Warehouse/Stock.Update, audit) — `goods-receipt.md` §4.3.
  - **ยกเลิก (cancel) GR:** เฉพาะสถานะ **QC ตรวจสอบ / ไม่ผ่าน** (ยังไม่ credit หรือส่วนที่ไม่ผ่าน) + เหตุผลบังคับ (Warehouse/Stock.Delete, audit, gapless — เลข GR คงอยู่) — `goods-receipt.md` §4.3.
  - (ลิงก์) **เปิด GR เต็ม** (`goods-receipt.html`) · **ทำใบคืน** (RM ไม่ผ่าน → `return.md`).
- **★ credit note:** GR สถานะ **ผ่าน** = on_hand ของ Lot ถูก credit แล้ว (movement `GR (+)` §6); **QC ตรวจสอบ/ไม่ผ่าน/ยกเลิก = ยังไม่ credit** — สอดคล้อง QC-gated stock-in (`qc.md` §4.1).
- **Permission:** ดู = Warehouse/Stock.Read · ส่งกลับ QC = Update · ยกเลิก = Delete + เหตุผล (§8).

## 3. Model — 3 ยอด (RM + FG เหมือนกัน)
| ยอด | นิยาม | ติดลบได้ |
|---|---|---|
| คงคลัง (on_hand) | กายภาพจริง (RM per-lot / FG per-Batch) | ได้ (ตัดเกิน → GR retro-link ตอน QC ผ่าน) |
| จองแล้ว (Reserved) | Σ reservation active | ไม่ (≥0) |
| ใช้ได้ (Available) = on_hand − Reserved | รับปากกับ order ใหม่ได้ | ได้ (จองเกิน = เตือนไม่บล็อก) |
> FG reservation มิเรอร์ RM (D12): SO(ก) ยืนยัน = จอง FG per-Batch → ตัด FIFO ตอน dispatch. **★ C1 (so.md §8): SO(ก) ยืนยันได้แม้ Available < qty → reserved > on_hand → Available ติดลบ = "จองเกิน (รอเติมสต็อก)".** **★ C4: OEM PO fulfil-from-stock (`po.md` §5.4) จอง OEM FG per-Batch เช่นเดียวกัน.**

## 3b. ★ เพิ่มวัตถุดิบใหม่ (RM master — รหัสผู้ใช้ตั้งเองตอนสร้าง, unique, ล็อกหลังสร้าง) — ปอนด์สั่ง 2026-07-29
- **สร้าง RM master จากแท็บ RM** (ปุ่ม "เพิ่มวัตถุดิบใหม่").
- ฟิลด์:
  | ฟิลด์ | ชนิด | editable/computed | หมายเหตุ |
  |---|---|---|---|
  | **รหัสวัตถุดิบ (RM code)** | string | **editable เฉพาะตอนสร้าง (ผู้ใช้พิมพ์เอง) · LOCKED หลังสร้าง (read-only)** | **บังคับ + ต้องไม่ซ้ำ (UNIQUE) ตอนสร้าง** · รูปแบบอิสระ (free-form) แต่ระบบ **reject ถ้าซ้ำ** ก่อนบันทึก · **★ แก้ไขไม่ได้หลังสร้าง (create-only-lock)** · กติกาเดียวกับรหัส BOM/FG (`bom.md` §5) · **หมายเหตุ: RM code = user-entered master identity ไม่ใช่ running number → นอกขอบเขต G8 (`numbering-on-save.md` §4)** |
  | ชื่อวัตถุดิบ | string | editable | บังคับ |
  | หน่วยนับ (unit) | string | editable | บังคับ |
  | (optional) supplier ตั้งต้น / หมายเหตุ | ref/text | editable | ไม่บังคับ |
- **ยอดตั้งต้น:** RM ที่เพิ่งสร้าง on_hand = 0 · ของจริงเข้าคลังผ่าน **Goods Receipt** (gen Lot) **+ QC ผ่าน** เท่านั้น.
- **Audit/trace:** การสร้าง RM = **entity-create event** ที่ถูก audit + ปรากฏบน trace (entity=RM, action=create, ใคร/เมื่อ) — `traceability.md` §3/§4.
- RM ที่สร้างแล้วเลือกได้ทันทีใน GR / Loss / Adjust / BOM component / **Return** (search dropdown, ค้นชื่อ+รหัส).

## 4. ★ FG per-Batch (D16) + FG เข้าคลัง (D12) + surplus (D13) + รหัส FG (D11 v2) + ★ C4 OEM FG sellable bucket
- **FG แตกราย Batch** (Batch = "lot" ของ FG) · ตัด **FIFO** ตอนขาย/ส่ง · UI โชว์ breakdown ราย Batch (recall GMP).
- **FG เข้าคลังเมื่อ:** (1) produce-to-stock Batch **QC ผ่าน → กด "พร้อมส่ง"** → `FG-in (+)` (production.md §4, Own-Brand identity) · (2) OEM **surplus** ตอน "พร้อมส่ง" → `surplus (+)` (**★ คง OEM identity ของตัวเอง ผูก OEM Batch/PRD/PO**) · **(3) ★ C4: OEM held / customer-cancelled-delivery** → ของ OEM ที่ลูกค้ายกเลิกการจัดส่ง/ฝากไว้ (ยังไม่กำหนดวันรับใหม่) กลับเข้า FG stock (**OEM identity**) — `delivery-note.md` §7 · `shipping.md` §4b.
- **★★ C4 (⭐ CRITICAL — ปอนด์ 2026-07-31) — OEM FG = sellable stock bucket (OEM identity):**
  - **OEM FG เก็บใน "คลัง FG เดียวกัน" กับ Own-Brand FG** (per-Batch, FIFO, 3 ยอด เหมือนกัน) — แต่ **มี OEM identity** (trace ผูก OEM Batch/PRD/PO ต้นทาง; แสดง badge "OEM" บนแท็บ FG §2).
  - **OEM FG bucket = ขายได้ (sellable):** OEM PO ใหม่ **fulfil ได้ด้วยการเลือก OEM FG จากสต็อก (sell-from-stock)** — ขนานกับ Own-Brand โหมด ก. การจอง/ตัด OEM FG = per-Batch, FIFO, มิเรอร์ Own-Brand FG (`po.md` §5.4).
  - **ที่มา OEM FG:** overproduction/surplus (D13, movement `surplus (+)`) + held/customer-cancelled-delivery OEM (movement `FG-in (+)` หรือ return-to-FG, OEM identity). ยอดปกติของ OEM BOM = 0 ยกเว้นสองที่มานี้.
- **1 BOM = 1 FG แบบ 1:1 · FG มีรหัส = รหัส BOM (แชร์รหัสเดียว)** → FG **ค้นได้ทั้งชื่อและรหัส** ในแท็บ FG (search dropdown). **★ ที่มารหัส = ผู้ใช้ตั้งเองตอนสร้าง BOM + unique + ล็อกหลังสร้าง (D11 v2)**; รายละเอียด = `bom.md` §3/§5. (OEM BOM ก็มี FG identity + รหัส เช่นกัน.)

## 5. ★ Loss / Adjust — แยก 2 action (ปอนด์สั่ง 2026-07-29; ★ Adjust อ้าง Lot + FIFO fallback — Production review 2026-07-29)

### 5.1 RM — 2 action แยกกัน (ทั้งคู่อ้าง Lot + มี FIFO fallback)
| action | ทิศทาง | เลือกอะไร | ผลต่อ on_hand | ปุ่ม |
|---|---|---|---|---|
| **Loss (ตัดคงคลัง)** | **ลด (−)** | **RM (บังคับ, search dropdown ค้นชื่อ+รหัส)** + **Lot (อ้างอิง: เลือก lot ที่มี stock **หรือ** เลือก "FIFO")** | ตัด on_hand · **เลือก lot → ตัด lot นั้นเจาะจง (GMP)** · **เลือก "FIFO" → ตัด RM แบบ FIFO (lot เก่าสุดก่อน)** | **"บันทึก (คงคลัง)"** |
| **Adjust (ปรับยอด)** | **เพิ่ม (+)** | **RM (บังคับ, search dropdown ค้นชื่อ+รหัส)** + **★ Lot (อ้างอิง: เลือก lot **หรือ** เลือก "FIFO")** | เพิ่ม on_hand · **เลือก lot → บวกเข้า lot นั้นเจาะจง** · **★ เลือก "FIFO" → บวกเข้า RM แบบ FIFO (ผูก lot เก่าสุดก่อน)** | **"บันทึก (คงคลัง)"** |
- **★ delta (ปอนด์สั่ง 2026-07-29 — Production review):** เดิม Adjust (+) เป็น **RM-only** (ไม่อ้าง Lot). ปอนด์กำหนดใหม่: **Adjust ต้องอ้าง Lot เสมอ — เลือก lot ที่ต้องการ, หรือถ้าไม่มี/จำไม่ได้ ให้เลือก "FIFO"** — สมมาตรกับ Loss.
- ทั้งสอง action: **เหตุผลบังคับ (mandatory reason)** + **source ref บังคับ = warehouse (+ lot/FIFO ref)** · **ไม่ต้องอนุมัติ** · append-only ledger (D15) · **audit + trace**.
- **หมายเหตุการตั้งชื่อ (ปอนด์สั่ง):** ป้ายปุ่มบันทึกฝั่ง RM = **"บันทึก (คงคลัง)"**.
- Return (คืน supplier) ยังเป็น action แยก (`return.md`) — ไม่ใช่ Loss. **GR credit (+) ไม่ใช่ Adjust** — เกิดอัตโนมัติตอน QC ผ่าน (§6).

### 5.2 FG — ปรับยอด FG ตรง (delta ±) + loss (คงเดิม + ปอนด์ delta 2026-07-29)
- แท็บ FG อนุญาต **ปรับยอด FG (adjust ±) + บันทึก loss FG** ได้จากที่นี่ — **เลือก FG ผ่าน search dropdown ค้นได้ทั้งชื่อและรหัส** (FG มีรหัส = รหัส BOM, D11 v2).
- **เหตุผลบังคับ** + **ledger source = warehouse adjust/loss** (D15) · ตัด/เพิ่ม on_hand ราย Batch (FIFO เมื่อ − / ผูก Batch เก่าสุดก่อนเมื่อ +) · **ไม่ต้องอนุมัติ** · audit + trace. **★ C4: ปรับ/loss OEM FG = คง OEM identity (per-Batch).**
- **ป้ายปุ่มบันทึกฝั่ง FG (ปอนด์สั่ง):** = **"บันทึก (คงคลัง)"**.
> **หมายเหตุความสมมาตร:** ปอนด์สั่งแยก 2 action (Loss −/Adjust +) เฉพาะ **แท็บ RM**; ฝั่ง **FG** ยังคง adjust ± ตรง + loss ตามเดิม.

## 6. Stock Ledger (D15) — ทุก movement มีเหตุผล + source + audit/trace
| movement | ผล | source ref (บังคับ) |
|---|---|---|
| `RESERVE` / `RELEASE` | reserved ± | PO line / SO · **★ C4: OEM PO from-stock ก็ RESERVE OEM FG** |
| `CONSUME (−)` | on_hand − (ตอนเริ่มผลิต, **เลือก lot มี stock; หลาย lot = FIFO**) | Batch/PRD/PO + Lot |
| `GR (+)` | on_hand + (**★ ตอน QC ตรวจรับ "ผ่าน" เท่านั้น** — ชดเชยติดลบ + FIFO retro-link ตอนนี้) | Lot/PR/GR |
| `FG-in (+)` | FG on_hand + (QC ผ่าน + กด "พร้อมส่ง", produce-to-stock — Own-Brand · **★ C4: held/customer-cancelled OEM กลับเข้า FG = OEM identity**) | PRD/Batch (+ DN ต้นทางถ้าคืนจากการส่ง) |
| `surplus (+)` | FG on_hand + (ผลิตเกิน OEM, remark ไม่ approve — **★ C4: OEM identity, sellable**) | Batch/PRD/PO |
| `loss (−)` | on_hand − (เหตุผลบังคับ, ไม่อนุมัติ) · **RM: อ้าง Lot (เลือก lot มี stock **หรือ** "FIFO")** | Batch/PRD (production) หรือ **warehouse** + Lot/FIFO |
| `adjust (+)` | on_hand + (**เพิ่มอย่างเดียว**, เหตุผลบังคับ, RM บังคับ) · **★ RM: อ้าง Lot (เลือก lot **หรือ** "FIFO")** | **warehouse-adjust** + Lot/FIFO |
| `return (−)` | on_hand − (คืน supplier) | **Lot + RM + Supplier + RET** (เลขใบคืน `RET-…`, `return.md`) |
> append-only. **ทุกแถว ledger = audit event + ปรากฏบน trace** (reason + source + Lot ref + ใคร/เมื่อ — D15, `traceability.md` §4). loss ที่ทำให้ได้ไม่ครบตามสั่ง → **ไม่ auto re-produce** (คนกด "ผลิตซ้ำ" เอง, D15).
> **★ delta 2026-07-29 (ปอนด์):** (a) เดิม `adjust (±)` → แยกเป็น **`loss (−)`** + **`adjust (+)`**. (b) **Production review:** **`adjust (+)` เพิ่ม Lot ref**. **(c) ★ QC + GR/Stock flow review: `GR (+)` เกิดตอน QC ตรวจรับ "ผ่าน" เท่านั้น**. **(d) ★ Return module: `return (−)` source ผูก Lot + RM + Supplier + เลขใบคืน.**
> **★ delta 2026-07-31 (reconcile M1, ปอนด์):** `return (−)` source token "RT" → **เลขใบคืน `RET-…`**.
> **★★ delta 2026-07-31 (C4 r20, ปอนด์):** `surplus (+)` และ `FG-in (+)` ของ OEM = **คง OEM identity** (ผูก OEM Batch/PRD/PO) → เข้า **OEM FG sellable bucket** (§4); held/customer-cancelled-delivery OEM → กลับเข้า FG stock (OEM identity) ผ่าน movement `FG-in (+)` (source = DN/Batch ต้นทาง). กลไก ledger คงเดิม — เพิ่ม identity + sellable semantics.

## 7. Loss (D15)
- จุดบันทึก: (ก) `production` (บนหน้าจัดการงานผลิต — ปุ่ม Loss + confirm popup ทุกครั้ง, production.md §7.5) · (ข) `stock` warehouse (RM + FG).
- บังคับเหตุผล + trace · ตัด **on_hand อย่างเดียว** · **ไม่ต้องอนุมัติ** · เป็น ledger (reason+source) + audit.
- **RM warehouse/production loss:** อ้าง **Lot (เลือก lot มี stock หรือ "FIFO")**. RM เลือกผ่าน search dropdown (ชื่อ+รหัส).

## 8. Actions & Permissions (D14)
| ปุ่ม/action | Permission required |
|---|---|
| ดู stock (RM/FG) + ledger + **แท็บ Good Receipt (RM)** | Warehouse/Stock.**Read (R)** |
| **เพิ่มวัตถุดิบใหม่ (create RM master, รหัส unique, ล็อกหลังสร้าง)** | Warehouse/Stock.**Create (C)** |
| Adjust (ปรับยอด +, อ้าง Lot/FIFO) RM/FG | Warehouse/Stock.**Update (U)** + เหตุผล |
| Loss (ตัดคงคลัง −, อ้าง Lot/FIFO) RM/FG (warehouse) | Warehouse/Stock.**Update (U)** + เหตุผล |
| บันทึก loss (production) | Production.**Update (U)** + เหตุผล |
| Goods Receipt (gen GR object + Lot รอตรวจ, ★ ออกเลข GR+Lot ตอนบันทึก G8) | Warehouse/Stock.**Create (C)** |
| **★ ส่งกลับ QC (re-submit GR ไม่ผ่าน) — แท็บ GR (RM)** | Warehouse/Stock.**Update (U)** |
| **★ ยกเลิก GR (สถานะ QC ตรวจสอบ/ไม่ผ่าน) — แท็บ GR (RM)** | Warehouse/Stock.**Delete (D)** + เหตุผล |
| Return (คืน supplier — เลือก RM ในล็อต) | Warehouse/Stock.**Update (U)** + RM + เหตุผล |
> surplus (D13) = auto ตอนพร้อมส่ง (ไม่มี permission แยก, แจ้ง remark; **★ C4: OEM surplus → OEM FG bucket**). **`GR (+)` credit = ผลอัตโนมัติของ QC pass (ตัดสินที่ `qc.md`), ไม่ใช่ action ในหน้า stock.** **★ C4: การจอง/ตัด OEM FG จากการขาย = ควบคุมผ่าน OEM PO (`po.md` §5.4) / Route/DN — ไม่ใช่ action ตรงในหน้า stock.**

## 9. Validations
- **RM code: ตอนสร้าง = บังคับ + UNIQUE** · **หลังสร้าง = read-only (create-only-lock)** · ชื่อ + หน่วยนับ บังคับ.
- **Adjust (RM): RM บังคับ · ★ Lot อ้างอิงบังคับ (เลือก lot **หรือ** "FIFO")** · เป็น **+ เท่านั้น** · เหตุผล + source บังคับ.
- **Adjust (FG): FG บังคับ** (search dropdown) · เป็น ± (ราย Batch, FIFO/เลือก Batch) · เหตุผล + source บังคับ.
- **Loss (RM): RM บังคับ · Lot อ้างอิง (เลือก lot มี stock **หรือ** "FIFO")** · เป็น **− เท่านั้น** · เหตุผล + source บังคับ.
- **★ Lot ที่เลือกได้ = เฉพาะ lot ที่มี stock (on_hand > 0);** เลือก "FIFO" = ระบบจัดการ lot เก่าสุดก่อน.
- **★ GR (RM) tab: ส่งกลับ QC = เฉพาะ GR ไม่ผ่าน · ยกเลิก = เฉพาะ QC ตรวจสอบ/ไม่ผ่าน + เหตุผลบังคับ (เลข GR คงอยู่ gapless).**
- **★ Goods Receipt: เลข GR + Lot ออกตอนบันทึกสำเร็จ (G8/NS2, NS7) — `goods-receipt.md` §5/§7.**
- adjust/loss/return = **เหตุผลบังคับ** + source ref · **ทุกครั้ง audit + trace**.
- FG ตัดตอนขาย/loss = FIFO ราย Batch (ห้ามข้าม Batch เก่า) · **★ C4: OEM FG ตัด FIFO per-Batch ภายใน OEM identity เดียวกัน (ไม่ปน Own-Brand Batch).**
- on_hand ติดลบ = แดง + badge "ติดลบ (รอรับเข้า)"; available ติดลบ = "จองเกิน (รอรับเข้า)".

## 10. Pagination / Search
- ledger + FG batch breakdown: 20/หน้า (G1) · ค้น RM/FG by **name/code** · filter movement type/ช่วงวันที่ (G2) · **★ C4: filter/แสดง identity FG = Own-Brand/OEM**.
- **★ แท็บ Good Receipt (RM): 20/หน้า (G1) · ค้น GR/Lot/Supplier/ชื่อ RM/รหัส/★ ช่วงวันที่รับ · filter สถานะ (§2b, G2).**
- **★ RM/Lot/FG selection = search-in-dropdown** (ปอนด์สั่ง): **RM ค้นได้ทั้งชื่อและรหัส** · **Lot** ค้นผ่าน dropdown (**Loss + Adjust ทั้งคู่ + option "FIFO"**) · **FG ค้นได้ทั้งชื่อและรหัส (รวม OEM FG bucket สำหรับ OEM PO sell-from-stock)**.

## 11. Cross-links
- reservation → stock-reservation · **★ GR/retro-link/credit ตอน QC ผ่าน → entity-status-map §1.6/§1.8 · `goods-receipt.md` §4/§9 · `qc.md` §4.1** · **★ เลข GR+Lot ออกตอนบันทึก (G8/NS7) → `numbering-on-save.md` · `goods-receipt.md` §5** · **RM master ที่สร้างที่นี่ → อ้างใน `goods-receipt.md`, `bom.md`, `return.md`** · **FG/รหัส FG + create-only-lock → `bom.md` §5** · FG source + loss/lot-FIFO consume → `production.md` §5/§7, `so.md` (produce-to-stock FG-in) · **★⭐ C4: OEM FG sellable bucket (OEM identity) → `po.md` §5.4 (OEM sell-from-stock) · `production.md` §5b (OEM surplus) · `delivery-note.md` §7 (held/customer-cancelled OEM → FG) · `oem-flow.md`** · **★ `return (−)` = เลขใบคืน `RET-…` → `return.md` · `numbering-on-save.md` §4** · **audit/trace ทุก movement → `traceability.md` §3/§4 · `non-functional.md` AU3** · trace → scope §8.5.

## 12. Module changelog
- **เพิ่ม (รอบก่อน):** FG per-Batch tab + ปรับยอด FG ตรง (D15) · ledger reason/source ทุก movement · surplus batch identity (แก้ U6) · RM ledger/loss form (แก้ U2).
- **★ เพิ่ม (2026-07-29 — number-on-save G8, ปอนด์ cross-cutting):** ระบุชัดว่า **Goods Receipt ออกเลข GR + Lot ตอนบันทึกสำเร็จ + popup (G8/NS7)**. หมายเหตุ **RM code = master identity → นอกขอบเขต G8** (§3b).
- **★ เพิ่ม (2026-07-29 — Return module feedback, ปอนด์):** `return (−)` source ผูก **Lot + RM + Supplier + เลขใบคืน**.
- **★ เพิ่ม (2026-07-29 — Stock module 4 review, ปอนด์):** "เพิ่มวัตถุดิบใหม่" (RM code unique) · แยก Loss/Adjust (RM) · ป้าย "บันทึก (คงคลัง)" · RM/Lot/FG search dropdown · audit ทุก movement.
- **★ CHANGED (2026-07-29 — BOM module review):** **RM code = user-entered + unique + ★ ล็อกหลังสร้าง**.
- **★ CHANGED (2026-07-29 — Production module review):** **Adjust (+) ต้องอ้าง Lot เสมอ (เลือก lot หรือ "FIFO")**.
- **★ NEW/CHANGED (2026-07-29 — QC + GR/Stock flow review, ปอนด์):** **★ แท็บ "Good Receipt (RM)"** · **★ `GR (+)` credit เกิดตอน QC ตรวจรับ "ผ่าน" เท่านั้น**.
- **★★ CHANGED (2026-07-31 — reconciliation M1, ปอนด์):** `return (−)` ledger source token **"RT" → "RET"**.
- **★★ NEW (2026-07-31 — Gate-1 review reconciliation r20 · C4 ⭐ CRITICAL, ปอนด์):** **OEM FG = sellable stock bucket (OEM identity)** — FG stock เก็บทั้ง Own-Brand FG และ OEM FG ในคลังเดียวกัน; OEM FG มาจาก **overproduction/surplus (D13)** + **held/customer-cancelled-delivery OEM** (`delivery-note.md` §7) → คง OEM identity + **ขายซ้ำผ่าน OEM PO ใหม่ได้ (sell-from-stock, `po.md` §5.4)**. อัปเดต summary/§1/§2 (FG tab identity)/§3/§4 (bucket) /§5.2/§6 (surplus+FG-in OEM identity)/§8/§9/§10/§11, ref `po.md` §5.4 · `production.md` §5b · `delivery-note.md` §7 · `oem-flow.md`. **ใช้ view เดิม (`stock.html` render จาก .md).**
- **คงเดิม:** 3 ยอด, append-only ledger, GR credit on QC pass, FG FIFO per-Batch, RM/FG create-only-lock.
