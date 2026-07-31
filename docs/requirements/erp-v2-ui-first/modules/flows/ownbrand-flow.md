# Flow — Own-Brand (SO: ก ขายจากสต็อก / ข ผลิตเก็บสต็อก)

slug: `erp-v2-ui-first` · per-module canonical · PO · 2026-07-29 (**+ delivery-status reconcile → DN-mirror model, 2026-07-31 · ★ + Gate-1 r20: C1 SO(ก) FG shortage = WARN-not-block · C2 SO(ข) terminal "ผลิตเข้าคลังแล้ว" · C3 cancel blocked while active DN**)
กฎอ้างอิง: D1/D2/D8 v2/D12/D16/D18-2 · scenario-walkthrough S4/S5 · **DN-mirror: `so.md` §4 · `delivery-note.md` §7/§8** · **★ C1: `so.md` §5/§8 (warn-not-block, negative FG reserve) · `stock.md` §3** · **★ C2: `so.md` §4 · `production.md` §4 (terminal "ผลิตเข้าคลังแล้ว", exclude Route)** · **★ C3: `so.md` §8 (cancel blocked while active DN)**
โมดูลที่เกี่ยว: `so.md` · `supply-planning.md` · `stock.md` · `production.md` · **`shipping.md` (Route) · `delivery-note.md` (DN)** · (invoice/trace = spec เดิม)

## สรุปภาษาไทย
สาย Own-Brand (แบรนด์ตัวเอง) ใช้ **SO `SO-{YYYYMM}-{NNNNNN}` (คนละโมดูล, ไม่มี Quotation)**. 2 แบบ: **(ก) ขายจากสต็อก** = เลือกลูกค้า → ยืนยัน (จอง FG) → พร้อมจัดส่ง → Delivery ตัด FG FIFO → DN/Invoice. **★ (C1 — Pond D2): SO(ก) ยืนยันได้แม้ FG Available < จำนวนสั่ง → เตือน ไม่บล็อก (WARN-not-block, มิเรอร์ RM) → จอง FG จนติดลบ (Available ติดลบ = "จองเกิน") → ตัดจริง FIFO ตอน dispatch.** **(ข) ผลิตเก็บสต็อก** = ไม่เลือกลูกค้า, เหมือนเปิด PO → BOM check → PRD ไม่ผูกลูกค้า → RM ขาด auto-PR → ผลิต → QC ผ่าน → FG เข้าคลัง → **★ (C2) terminal = "ผลิตเข้าคลังแล้ว (Completed/stocked)" — ไม่ใช่ "พร้อมจัดส่ง", ไม่เข้าคิว Route** → ขายภายหลังผ่าน (ก). Supply Planning ปุ่มสั่งผลิต = prefill (ข) (D8 v2). **★ สถานะจัดส่งของ SO (ก) หลัง "พร้อมจัดส่ง" = สะท้อนจาก DN (DN-mirror).** **★ (C3): ยกเลิก SO(ก) โดยตรงถูกบล็อกขณะมี DN active — จัดการผ่าน Route/DN (void DN) ก่อน.**

---

## 1. (ก) Sell-from-stock — end-to-end
| # | Step | ผู้ทำ | เอกสาร/สถานะ | stock-ledger effect (FG) |
|---|---|---|---|---|
| 1 | `so-create` (ก) → **เลือกลูกค้า** + FG → โชว์ FG Available ราย Batch (D16) | Sale Own-Brand | `SO-…` (ร่าง) | — |
| 2 | กด **"ยืนยันใบสั่งขาย (จอง FG)"** → **★ (C1) ยืนยันได้แม้ FG ไม่พอ = เตือน ไม่บล็อก** → **จอง FG per-Batch (จองได้จนติดลบ = "จองเกิน (รอเติมสต็อก)", `stock.md` §3)** + SO = **พร้อมจัดส่ง (Ready to Ship)** → รอโมดูล **การจัดส่ง** | Sale Own-Brand | SO = พร้อมจัดส่ง | `RESERVE (+reserved FG; อาจ > on_hand)` |
| 3 | โมดูลการจัดส่งหยิบเข้ารอบ (Route) → gen DN → **ตัด FG FIFO ราย Batch** ตอน dispatch (★ ถ้าไม่พอ = ตัดติดลบ, GR/ผลิตเติมชดเชยภายหลัง) | Shipping | **SO สะท้อนสถานะ DN: อยู่ระหว่างการเตรียม → อยู่ระหว่างจัดส่ง** | `CONSUME (−on_hand FG, FIFO)` |
| 4 | **DN (อ้าง SO)** เดินตาม Route → **ส่งสำเร็จ** *(หรือ ลูกค้าเลื่อนส่ง / ลูกค้ายกเลิก(การจัดส่ง) / ลูกค้ายังไม่กำหนดวันรับใหม่)* · **SO สะท้อนสถานะ DN** (`so.md` §4) | Shipping | `DN-…` (Own-Brand badge) · DN = ส่งสำเร็จ | — |
| 5 | ออก **Invoice (อ้าง SO + cost snapshot, D10)** → รับชำระ (เริ่มนับเครดิตจาก DN "ส่งสำเร็จ") | Finance | `INV-…` | — |
| — | **ยกเลิก SO** ก่อน dispatch = คืนจอง FG · **★ (C3): บล็อกถ้ามี DN active (อยู่ระหว่างการเตรียม/อยู่ระหว่างจัดส่ง) — ต้อง void DN/ยกเลิกรอบ Route ก่อน (order กลับคิว "พร้อมจัดส่ง"), แล้วจึงยกเลิก SO** | Sale Own-Brand | SO = ยกเลิก | `RELEASE (−reserved FG)` |

## 2. (ข) Produce-to-stock — end-to-end
| # | Step | ผู้ทำ | เอกสาร/สถานะ | stock-ledger effect (FG) |
|---|---|---|---|---|
| 0 | (option) Supply Planning เห็น FG **Low** → กด **"สั่งผลิต"** → **prefill** so-create (ข) จำนวน = batch count × Batch Size (D8 v2) | วางแผน | prefill | — |
| 1 | `so-create` (ข) → **ไม่เลือกลูกค้า** + FG(BOM) + จำนวนผลิต → ยืนยัน → **BOM RM stock check** | Sale/วางแผน | `SO-…` (ผลิตเก็บสต็อก) | — |
| 2 | ส่งงานเข้า production → **PRD ไม่ผูกลูกค้า** (customerless) | Production | `PRD-…` | — |
| 3 | **RM ขาด → สร้าง production order ได้ + AUTO-open PR** ไปคลัง | Production/Stock | `PR-…` | (RM) `RESERVE/CONSUME` |
| 4 | ผลิต → gen Batch → QC ตรวจ (Batch ไม่ผูกลูกค้า — U1) | Production/QC | `B-PRD-…` | (RM) `CONSUME` |
| 5 | **QC ผ่าน → FG เข้าคลัง per-Batch (D12)** | QC/Stock | FG on_hand + | `FG-in (+on_hand FG)` |
| 6 | **★ (C2) ทุก PRD ของ SO(ข) เข้าคลังครบ → SO(ข) = "ผลิตเข้าคลังแล้ว (Completed/stocked)"** — terminal ของโหมด ข; **ไม่ใช่ "พร้อมจัดส่ง" และไม่เข้าคิว Route** (`so.md` §4 · `production.md` §4) | Production | SO(ข) = ผลิตเข้าคลังแล้ว | — |
| 7 | ขายภายหลังผ่าน (ก) — ตัด FIFO ราย Batch | Sale Own-Brand | ตาม (ก) | ตาม (ก) |

## 3. ความต่างสำคัญ vs OEM
- **ไม่มี Quotation** (D18-2).
- (ข) **auto-open PR** เมื่อ RM ขาด (เหมือน PO; ต่างจาก Quotation ที่ไม่ auto-PR).
- ที่มา produce-to-stock = **เดียว** (หน้า SO produce-to-stock); Supply Planning แค่ prefill (D8 v2).
- (ข) ไม่มีลูกค้า/ราคาตอนผลิต — FG เข้าคลังก่อน (**★ terminal "ผลิตเข้าคลังแล้ว"**) แล้วขาย (ก) ทีหลัง.
- **★ C1 (ก):** FG shortage = warn-not-block (mirror RM) — ต่างจาก block ลูกค้า Disabled/Blacklist (hard block) และ FG/BOM Inactive (hard block).

## 4. Trace chain
- (ก): `SO ↔ FG Batch (FIFO) ↔ Lot ↔ DN ↔ ลูกค้า` + cost snapshot ที่ line.
- (ข): `FG stock (per-Batch) ↔ Batch ↔ Lot` (genealogy ครบแม้ยังไม่มีลูกค้า); เมื่อขาย → เชื่อมกับ (ก).
- ทุก movement มี reason + source (D15).

## 5. Status touchpoints
- **SO (ก) (delivery status = DN-mirror):** ร่าง → **พร้อมจัดส่ง (จอง FG — ★ C1: จองได้แม้ไม่พอ = warn)** → **[สะท้อนสถานะ DN]** อยู่ระหว่างการเตรียม → อยู่ระหว่างจัดส่ง → **ส่งสำเร็จ** / ลูกค้าเลื่อนส่ง / ลูกค้ายกเลิก(การจัดส่ง) / ลูกค้ายังไม่กำหนดวันรับใหม่ → (billing) Paid/Overdue. **★ หลัง "พร้อมจัดส่ง" สถานะจัดส่งสะท้อนจาก DN** (`so.md` §4 · `delivery-note.md` §7/§8). **★ (A2) "ลูกค้ายกเลิก(การจัดส่ง)" = ยกเลิก *การส่ง* ไม่ใช่ยกเลิก SO — SO ไม่เปลี่ยนเป็น "ยกเลิก".**
- **SO (ข):** ร่าง → ผลิตเก็บสต็อก → (PRD/Batch flow) → FG เข้าคลัง → **★ (C2) "ผลิตเข้าคลังแล้ว (Completed/stocked)" [terminal] — ไม่เข้าคิว Route**.
- credit term (ก) = ระดับลูกค้า 30/60/90 default 60 (นับ overdue จาก DN "ส่งสำเร็จ").
