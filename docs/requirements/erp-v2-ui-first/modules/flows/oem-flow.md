# Flow — OEM (Quotation → PO → ผลิต → surplus → ส่ง → Invoice · + ★ sell-from-stock variant)

slug: `erp-v2-ui-first` · per-module canonical · PO · 2026-07-29 (**+ delivery-status reconcile → DN-mirror model, 2026-07-31 · ★ + Gate-1 r20: C4 OEM sell-from-stock variant · C3 cancel blocked while active DN**)
กฎอ้างอิง: D3/D10/D13/D18 · stock-reservation (Option A) · entity-status-map · scenario-walkthrough S1 · **DN-mirror: `po.md` §4b · `delivery-note.md` §7/§8** · **★ C4: `po.md` §5.4 (OEM sell-from-stock) · `stock.md` §4 (OEM FG bucket) · `production.md` §5b (surplus)** · **★ C3: `po.md` §4d (cancel blocked while active DN)**
โมดูลที่เกี่ยว: `quotation.md` · `po.md` · `stock.md` · `production.md` · **`shipping.md` (Route) · `delivery-note.md` (DN)** · (invoice/trace = spec เดิม)

## สรุปภาษาไทย
สาย OEM (รับจ้างผลิต): เริ่มที่ **ใบเสนอราคา (optional)** → ลูกค้าตกลง → **Convert เป็น PO เลขใหม่** (prefill) → ยืนยัน PO = จองวัตถุดิบ → เริ่มผลิต = ตัดจริง FIFO → QC → ฝ่ายผลิตกรอกจำนวนผลิตจริง → ตอน "พร้อมส่ง" ส่งตามสั่ง + **ส่วนเกินเข้า FG stock (OEM identity, sellable)** → DN (อ้าง PO) → Invoice → ชำระ. **สร้าง PO ตรงโดยไม่มี Quotation ก็ได้** (D18-3). **★ การส่งใบเสนอราคา = print/share ไม่ใช่สถานะ.** **★ สถานะจัดส่งของ PO หลัง "พร้อมจัดส่ง" = สะท้อนจาก DN (DN-mirror).** **★★ ใหม่ (C4 ⭐ — 2026-07-31): OEM PO fulfil ได้ 2 เส้นทาง — (1) produce (ผลิตตามสั่ง, เดิม) · (2) sell-from-stock (เลือก OEM FG ที่มีในสต็อก) — ขนาน Own-Brand ก.** **★ (C3): ยกเลิก PO โดยตรงถูกบล็อกขณะมี DN active — จัดการผ่าน Route/DN (void DN) ก่อน.**

---

## 1. End-to-end steps (produce / made-to-order — เส้นทางหลัก)
| # | Step | ผู้ทำ | เอกสาร/เลข | stock-ledger effect |
|---|---|---|---|---|
| 1 | เสนอราคา (customer dropdown, line BOM/RM, material check ไม่ auto-PR) → บันทึก → print-ready | Sale OEM | `QT-{YYYYMM}-{NNNNNN}` (ร่าง/Draft) | — |
| 2 | ต่อรอง → แก้ = **เวอร์ชันใหม่** (immutable) | Sale OEM | QT v2 | — |
| 3 | ลูกค้าตกลง → กด **"Convert to PO"** (popup) → QT = **ยืนยัน (Confirmed)** ทันที + ลิงก์ QT↔PO (loose) → prefill po-create → บันทึก | Sale OEM | **`PO-{YYYYMM}-{NNNNNN}`** ใหม่ | — |
| 4 | ยืนยัน PO → **จองวัตถุดิบ**; RM ขาด → เตือน + auto PR | Sale/Stock | reserve · `PR-{NNNNNN}` | `RESERVE (+reserved, −available)` |
| 5 | Goods Receipt RM → QC ขาเข้าผ่าน (credit ตอน QC ผ่าน) | Stock/QC | `GR-…` · Lot | `GR (+on_hand)` |
| 6 | ฝ่ายผลิต **รับงาน** (gen PRD) → **เริ่มผลิต** (gen Batch + ตัดจริง FIFO) | Production | `PRD-…` · `B-{PO}-{line}-{run}` | `CONSUME (−on_hand)` |
| 7 | ส่งตรวจ → **QC ผ่าน** (ไม่ผ่าน+feedback → Rework run+1) | QC | Batch = QC ผ่าน | — |
| 8 | กรอก **จำนวนผลิตจริง (actual qty)** (อาจเกินสั่ง) | Production | actual/ordered | — |
| 9 | กด **"พร้อมส่ง (Ready to Ship)"** → ส่งตามสั่ง · **ส่วนเกิน → FG stock (★ OEM identity, sellable bucket — `stock.md` §4)** → **PO = พร้อมจัดส่ง** | Production | FG per-Batch (OEM identity) | `surplus (+FG on_hand)` |
| 10 | **จัดรอบส่ง (Route) → gen DN (อ้าง PO)**; DN: อยู่ระหว่างการเตรียม → อยู่ระหว่างจัดส่ง → ส่งสำเร็จ *(หรือ ลูกค้าเลื่อนส่ง / ลูกค้ายกเลิก(การจัดส่ง) / ลูกค้ายังไม่กำหนดวันรับใหม่)* · **PO สะท้อนสถานะ DN** (`po.md` §4b) | Shipping | `RT-…` · `DN-…` | — |
| 11 | ออก **Invoice (อ้าง PO + cost snapshot, D10)** → รับชำระ / overdue (เริ่มนับจาก DN "ส่งสำเร็จ") | Finance | `INV-…` | — |

## 1b. ★⭐ Sell-from-stock variant (C4 — OEM PO fulfil จาก OEM FG ในสต็อก)
| # | Step | ผู้ทำ | หมายเหตุ |
|---|---|---|---|
| A1 | มี OEM FG ในสต็อก (จาก surplus D13 · หรือ held/customer-cancelled-delivery OEM) — คลัง FG เดียวกับ Own-Brand FG แต่ **OEM identity** (`stock.md` §4) | — | sellable bucket |
| A2 | สร้าง/ทำ OEM PO → line เลือก **fulfil source = from-stock** → **เลือก OEM FG จากสต็อก** (search dropdown, Batch/คงเหลือ, FIFO) | Sale OEM | `po.md` §5.4 · po-create option (UX/UI) |
| A3 | ยืนยัน PO → **จอง OEM FG per-Batch** (ไม่เข้าสายผลิต) → line = **พร้อมจัดส่งทันที** | Sale/Stock | `RESERVE (+reserved FG, OEM)` |
| A4 | เข้ารอบ Route → gen DN → **ตัด OEM FG FIFO ตอน DN "ส่งสำเร็จ"** → DN/Invoice (เหมือน produce) | Shipping/Finance | `CONSUME (−on_hand FG, FIFO)` |
> **1 PO ผสม line ได้:** บาง line = produce, บาง line = from-stock; PO พร้อมจัดส่งเมื่อทุก line พร้อมครบ.

## 2. Variants
- **ไม่มี Quotation (D18-3):** ข้าม step 1–3 → เปิด PO ตรงที่ po-create.
- **RM-direct line (D3):** line วัตถุดิบตรง **ยังผ่านขั้นผลิต** — เดินสถานะ production เหมือน BOM.
- **★ Sell-from-stock (C4):** ดู §1b — OEM PO fulfil จาก OEM FG ในสต็อก (ไม่ผลิตใหม่).
- **Cancel ก่อนเริ่มผลิต:** release reservation ที่ยังไม่ consume. หลังเริ่มผลิต: ส่วนที่ consume แล้วไม่คืน. **★ (C3): ยกเลิก PO โดยตรง = บล็อกขณะมี DN (non-void) active — ต้อง void DN/ยกเลิกรอบ Route ก่อน (order กลับคิว "พร้อมจัดส่ง"), แล้วจึงยกเลิก PO (`po.md` §4d).**
- **★ Route ยกเลิกทั้งรอบ (shipping.md §4d):** DN = void (ประวัติ) → PO กลับไปแสดง "พร้อมจัดส่ง" · **★ A2: Route cancel = ยิง noti RT ใบเดียว (ไม่ยิง N×DN-void).**
- **★ ลูกค้ายกเลิกการจัดส่ง / ฝากไว้ (C4):** ของ OEM กลับเข้า/นับเป็น **FG stock (OEM identity, sellable)** → ขายซ้ำผ่าน OEM PO ใหม่ได้ (`delivery-note.md` §7).

## 3. Trace chain (GMP + cost)
`QT ↔ PO ↔ PRD ↔ Batch ↔ (FG surplus per-Batch, OEM identity) ↔ Lot ↔ DN ↔ ลูกค้า` + cost snapshot ที่ line + ledger reason/source ทุก movement. **★ C4: OEM FG bucket → OEM PO ใหม่ (sell-from-stock) → DN → ลูกค้า (chain ครบ).** QT Rejected = เก็บประวัติ ไม่เกิด PO.

## 4. Status touchpoints
- QT: **ร่าง (Draft) → ยืนยัน (Confirmed)** / **ปฏิเสธ (Rejected)** · **ยกเลิก (Cancelled) ได้ทุกสถานะ** · การส่งใบเสนอราคา = print/share ไม่ใช่สถานะ.
- **PO fulfilment (delivery status = DN-mirror):** ร่าง → ยืนยันแล้ว-รอรับงาน → กำลังผลิต → **พร้อมจัดส่ง** → **[สะท้อนสถานะ DN]** อยู่ระหว่างการเตรียม → อยู่ระหว่างจัดส่ง → **ส่งสำเร็จ** / ลูกค้าเลื่อนส่ง / ลูกค้ายกเลิก(การจัดส่ง) / ลูกค้ายังไม่กำหนดวันรับใหม่. **★ หลัง "พร้อมจัดส่ง" สถานะจัดส่งสะท้อนจาก DN** (`po.md` §4b · `delivery-note.md` §7/§8). **★ (C4) line from-stock: ยืนยัน → จอง OEM FG → พร้อมจัดส่ง (ข้ามขั้นผลิต).** **★ (A2) "ลูกค้ายกเลิก(การจัดส่ง)" = ยกเลิก *การส่ง* ไม่ใช่ยกเลิก PO — PO ไม่เปลี่ยนเป็น "ยกเลิก".**
- PO billing: Not Invoiced→Invoiced→Paid/Overdue (credit term 30/60/90 default 60; นับ overdue จาก DN "ส่งสำเร็จ").
- Surplus จับที่ **"พร้อมส่ง" ไม่ใช่ QC pass** (D13) · **★ C4: OEM surplus = OEM identity → OEM FG bucket (sellable).**
