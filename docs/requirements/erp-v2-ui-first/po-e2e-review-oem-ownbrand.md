# End-to-End Journey-Completeness Review — OEM + Own-Brand + Supply Planning + FG Stock

slug: `erp-v2-ui-first` · เขียนโดย PO · 2026-07-28 (คืน) · ที่มา: คำสั่งปอนด์ก่อนนอน (ตรวจ flow ทั้งระบบ + สร้าง scenario walkthrough)
ขอบเขต: ตรวจ **หลัง UX/UI วาด Stage-1 delta** (quotation-*, supply-planning, so-*, + แก้ po-*, stock, production, bom, delivery-note, invoice-detail, trace, settings) เทียบกฎที่ล็อก D1–D18 + spec เดิม (entity-status-map / status-journeys / stock-reservation / deletion-policy)
คู่กับ: `scenario-walkthrough.md` (เดินเรื่องด้วย mock data)

## สรุปภาษาไทย
เดินทุก journey ปลายจรดปลายเทียบกฎ D1–D18 + หน้าจอจริง — **flow ครบทุกสาย ไม่มี business-gap** (กฎล็อกครบ ตอบทุกคำถามธุรกิจแล้ว จึง**ไม่มีคำถามถึงปอนด์**). เจอ **ช่องว่างเชิงหน้าจอ (visual/mockup) 6 จุด** ที่กฎกำหนดไว้แล้วแต่ mockup ยัง "ไม่โชว์เคส" — ต้องส่งกลับ UX/UI แก้: (U1) หน้า QC ยังไม่มีแบตช์ produce-to-stock ที่ไม่ผูกลูกค้า, (U2) แท็บ RM ในหน้า stock ไม่มี ledger เคลื่อนไหว + ฟอร์ม loss/ปรับยอด RM (มีแต่ฝั่ง FG), (U3) trace ยังไม่ render เคส Own-Brand/produce-to-stock (มีแต่ OEM), (U4) เลข PRD-104 ถูกใช้ 2 ที่มา, (U5) ไม่มีตัวอย่าง RM-direct วิ่งผ่านผลิต (optional), (U6) OEM surplus ถูกยัดเข้า FG batch ผิดตัว (ควรเป็น FG batch ของตัวเองผูก OEM Batch). สถานะ = **READY_FOR_UX_UI** (แก้ visual 6 จุด แล้วค่อยเข้า Gate-1 ให้ปอนด์ดู "หน้าตา").

---

## 1. Completeness Matrix — ทุก chain/step → กฎ (Dx) → หน้าจอ → PASS/GAP

### 1.1 OEM full chain (Quotation → PO → ผลิต → surplus → ส่ง → invoice → ชำระ)
| # | Step | กฎ | หน้าจอที่รองรับ (element จริง) | ผล |
|---|---|---|---|---|
| 1 | สร้าง Quotation (QT + line BOM/RM + ราคา) | D18 | `quotation-create` — เลข QT-202607-000013, line BOM/RM, ราคา/หน่วยแก้ได้, VAT, บันทึกร่าง/ส่ง | **PASS** |
| 2 | ส่งลูกค้า → ตกลง (Agreed) → แก้=เวอร์ชันใหม่ | D18-4 | `quotation-detail` — badge "ตกลง", ประวัติเวอร์ชัน v1→v2, `quotation-list` filter สถานะ | **PASS** |
| 3 | Convert to PO (PO เลขใหม่ + ลิงก์ QT↔PO) | D18-1 | `quotation-detail` ปุ่ม "Convert to PO" (เปิดเมื่อ Agreed) + "QT-000008 → PO-181"; `po-list` คอลัมน์ "🔗 จาก QT-…" | **PASS** |
| 3b | สร้าง PO ตรง (ข้าม QT) | D18-3 | `po-create` field "สร้างจากใบเสนอราคา — ไม่บังคับ" (default "— ไม่มี") | **PASS** |
| 4 | Reserve RM ตอน Confirmed (Available = on_hand − reserved) | r5 / D-stock | `po-create` เช็ค "ใช้ได้ (Available)" + จองตอนสร้าง; `stock` 3 ยอด คงคลัง/จองแล้ว/ใช้ได้ | **PASS** |
| 5 | PR สำหรับส่วนขาด (ไม่บล็อก) | C3 | `po-create` warning "จองเกินใช้ได้ + ส่ง PR อัตโนมัติ"; `purchase-request` / `pr-create` | **PASS** |
| 6 | Goods Receipt (+ ชดเชยติดลบ FIFO retro-link) | §1.6 | `goods-receipt` multi-line + กล่อง "การรับนี้ชดเชยยอดติดลบ -30 ล." | **PASS** |
| 7 | รับงาน (คิว "รอรับงาน" → gen PRD) | r4.1 | `production` แท็บ "รอรับงาน" + ปุ่ม "รับงาน" → PRD-{YYYYMM}-{NNNNNN} | **PASS** |
| 8 | เริ่มผลิต → gen Batch + ตัด stock (ติดลบได้) | r4.1/§3.3 | `production` modal flow, alert Batch B-{PO}-{line}-{run}, ตาราง Lot FIFO | **PASS** |
| 9 | QC ราย Batch (ผ่าน) | §3.2 | `qc` แท็บ "ตรวจแบตช์" + ปุ่ม "ผ่าน (line พร้อมส่งมอบ)" + GMP Lot chain | **PASS** |
| 9b | QC ไม่ผ่าน → Rework → run+1 → กลับ QC | §3.2 | `qc` "ไม่ผ่าน + feedback บังคับ"; `production` badge Rework + run2 + feedback run1 | **PASS** |
| 10 | จำนวนผลิตจริง (actual produced qty) | D13-1 | `production` modal field "จำนวนผลิตจริง 230 (สั่ง 200)" | **PASS** |
| 11 | Ready-to-Ship: ส่งตามสั่ง + surplus → FG stock (remark, ไม่ approve) | D13-2/3 | `production` ปุ่ม "พร้อมส่ง (ส่ง 200 · เข้าคลัง 30)" + alert remark; `stock` ledger "surplus (+)" | **PASS*** (ดู U6) |
| 12 | DN (อ้าง PO) | §4 | `delivery-note` DN-{YYYYMMDD} อ้าง PO | **PASS** |
| 13 | Invoice (อ้าง PO + cost snapshot line) | D10/§7 | `invoice-detail` INV จาก PO-176 + "cost snapshot 122.40/หน่วย" | **PASS** |
| 14 | Paid / Overdue | 2B | `invoice-detail` ปุ่ม "บันทึกรับชำระ" + badge "รอชำระ · ครบ 07/08" | **PASS** |

### 1.2 OEM RM-direct line (D3 — วัตถุดิบตรง ยังผ่านขั้นผลิต)
| # | Step | กฎ | หน้าจอ | ผล |
|---|---|---|---|---|
| 1 | line วัตถุดิบตรงใน QT/PO | D3 | `quotation-create` suggest "กลีเซอรีน (ขายวัตถุดิบตรง) — ผ่านขั้นผลิตเมื่อเป็น PO"; `po-create` alert D3 | **PASS** |
| 2 | RM-direct เดินสถานะผ่าน production flow จริง | D3 | *กฎชัด แต่* `production`/`qc` ไม่มีตัวอย่าง PRD/Batch ของ line วัตถุดิบตรง (ทุกตัวอย่างเป็นสินค้า BOM) | **GAP-minor U5** |

### 1.3 Own-Brand (a) sell-from-stock
| # | Step | กฎ | หน้าจอ | ผล |
|---|---|---|---|---|
| 1 | สร้าง SO เลือกลูกค้า + FG มีสต็อก (ไม่มี Quotation) | D1/D2-a/D18-2 | `so-create` โหมด (ก) เลือกลูกค้า, FG Available ราย Batch | **PASS** |
| 2 | ยืนยัน = จอง FG (per-Batch, มิเรอร์ RM) | D12/D16 | `so-detail` "ยืนยัน SO → จอง FG 75", ledger reserve; `so-list` "จอง FG" | **PASS** |
| 3 | พร้อมจัดส่ง = ตัด FG FIFO ราย Batch | D16 | `so-detail` ปุ่ม "พร้อมจัดส่ง (ตัด FG FIFO)" + Batch ที่จอง | **PASS** |
| 4 | DN อ้าง SO | §6.2 | `delivery-note` DN-125 → SO-202607-000030 (badge Own-Brand) | **PASS** |
| 5 | Invoice อ้าง SO + cost snapshot | D10 | `invoice-detail` "ออกจาก PO และ SO ได้" + snapshot line; `so-detail` snapshot 78.40/41.00 | **PASS** |
| 6 | ยกเลิก SO = คืนจอง FG | D12/§5.5 | `so-detail` ปุ่ม "ยกเลิก SO (คืนจอง FG)" | **PASS** |

### 1.4 Own-Brand (b) produce-to-stock
| # | Step | กฎ | หน้าจอ | ผล |
|---|---|---|---|---|
| 1 | Supply Planning "สั่งผลิต" = PRD ไม่ผูกลูกค้า | D8 | `supply-planning` การ์ด FG-101 Low + ปุ่ม "สั่งผลิต 1,500 (3 แบตช์×500)" | **PASS** |
| 1b | หรือ SO โหมด (ข) ไม่เลือกลูกค้า → PRD | D2-b | `so-create` โหมด (ข) → PRD ไม่ผูกลูกค้า; `so-list` SO-028 ผลิตเก็บสต็อก | **PASS** (ดู U4 coherence) |
| 2 | ผลิต (customerless PRD) → Batch | D8 | `production` PRD-202607-000104 badge "ผลิตเก็บสต็อก · ไม่ผูกลูกค้า", Batch B-PRD-…104-1 | **PASS** |
| 3 | QC แบตช์ produce-to-stock (ไม่มีลูกค้า) | §10.3-qc | `qc` แท็บ "ตรวจแบตช์" **แสดงเฉพาะแบตช์ที่ผูก PO/ลูกค้า** — ไม่มีแบตช์ produce-to-stock | **GAP U1** |
| 4 | QC ผ่าน → FG เข้าคลัง (ราย Batch) | D12 | `stock` แท็บ FG ledger "FG-in (+) +500 · QC ผ่าน (produce-to-stock) · PRD-101"; `so-list` SO-024 "เข้าคลังแล้ว FG +1,000" | **PASS** |
| 5 | ขายภายหลังผ่าน (a) FIFO trace ย้อน Batch/Lot | §8.2 | `so-detail`/`so-create` FG ราย Batch FIFO; *trace ไม่มีตัวอย่าง SO→Batch→Lot* | **PASS/GAP U3** |

### 1.5 Warehouse — RM receipt / RM return / adjust / loss / surplus / ledger
| # | Step | กฎ | หน้าจอ | ผล |
|---|---|---|---|---|
| 1 | RM Goods Receipt (gen Lot, ผูก PR, ชดเชยติดลบ) | §5/§1.6 | `goods-receipt` multi-line + retro-link notice | **PASS** |
| 2 | RM Return (ระบุ Lot → supplier → ตัด stock + เหตุผลบังคับ) | §6 | `return` RT-{YYYYMMDD}, Lot→supplier auto, ตัดสต็อก + เหตุผลบังคับ, trace Lot↔Supplier | **PASS** |
| 3 | Adjust stock ได้ทุกเมื่อ (RM + FG) | D15/§5.4 | `stock` FG: ฟอร์ม "loss/ปรับยอด (adjust)"; **RM: ไม่มีฟอร์ม loss/adjust** | **PASS(FG)/GAP U2(RM)** |
| 4 | Loss (RM+FG) เหตุผลบังคับ, ตัด on_hand, ไม่อนุมัติ | D15 | FG: `stock` ฟอร์ม loss + `production` ฟอร์ม loss (เหตุผลบังคับ); **RM warehouse loss: ไม่มีจุดบันทึกบนแท็บ RM** | **PASS(FG)/GAP U2(RM)** |
| 5 | Surplus-in (auto + remark, ไม่ approve) | D13 | `stock` ledger "surplus (+)"; `production` "พร้อมส่ง" | **PASS*** (U6 batch identity) |
| 6 | ทุก movement มี reason + source + traceable | D15/§8.5 | `stock` แท็บ FG ledger (reason+source); `trace` "Stock ledger — เหตุผล+แหล่งที่มา"; **แท็บ RM ไม่มี ledger view** | **PASS(FG)/GAP U2(RM)** |

### 1.6 RBAC / Tracing / Cost / Deletion (cross-cutting)
| หัวข้อ | กฎ | หน้าจอ | ผล |
|---|---|---|---|
| RBAC generic + 3 module ใหม่ (Quotation/SO/Supply Planning) | D14/D17 | `settings` RUCDAA เพิ่ม 3 แถวใหม่ + note "generic per-capability, Convert=Create@PO, สั่งผลิต=Create@Supply Planning" | **PASS** |
| OEM หัวสาย = QT (trace QT→PO→…→INV) | D18/§8.1 | `trace` flow "QT-000008→PO-181→PRD→Batch→surplus→DN→Invoice" | **PASS** |
| Own-Brand หัวสาย = SO (SO↔FG/Batch/Lot↔DN) | §8.2 | `trace` *กล่าวถึงใน text แต่ไม่ render เคสจริง* | **GAP-minor U3** |
| Cost snapshot per line (D10, เก็บไม่ทำรายงาน) | D10 | `bom` ต้นทุนอื่น per-unit + ต้นทุนรวม snapshot 29.10; `so-detail`/`invoice-detail` snapshot line | **PASS** |
| BOM ต้นทุนหลายหมวด per-unit | D9 | `bom` ตาราง "ต้นทุนอื่น (ต่อหน่วย)" ค่าแรง/บรรจุ/โสหุ้ย + แก้/เพิ่มได้ | **PASS** |
| Deletion soft-delete / void เอกสารการค้า | deletion-policy | (ล็อกใน spec; ไม่ใช่ delta หน้าจอรอบนี้) | **PASS (out of delta)** |

**Verdict:** flow **ครบทุกสาย ปิดจบทุก step ไม่มี orphan/dead-status ในเชิงกฎ** · ทุก GAP เป็น **visual/mockup** (หน้าจอยังไม่โชว์เคสที่กฎกำหนดไว้แล้ว) — **ไม่มี business-gap**.

---

## 2. Gap Punch-List

### 2.1 ส่งกลับ UX/UI (visual/mockup — กฎมีแล้ว หน้าจอยังไม่โชว์)
| ID | ระดับ | หน้าจอ | สิ่งที่ขาด (อ้างกฎ) | สิ่งที่ต้องเพิ่ม |
|---|---|---|---|---|
| **U1** | **ต้องแก้** | `qc.html` | แท็บ "ตรวจแบตช์" แสดงเฉพาะแบตช์ผูก PO/ลูกค้า — **ไม่มีแบตช์ produce-to-stock ที่ไม่ผูกลูกค้า** (§10.3 ระบุ qc ต้องรองรับ) → S4 ขาดจอ QC | เพิ่มแถวแบตช์ customerless (เช่น B-PRD-202607-000104-1 จาก Supply Planning FG-101) + ฟอร์มตัดสิน (ไม่มี PO/ลูกค้า, ผ่าน → FG เข้าคลังราย Batch) |
| **U2** | **ต้องแก้** | `stock.html` (แท็บ RM) | แท็บ RM มี 3 ยอด/ติดลบ แต่ **ไม่มี ledger การเคลื่อนไหว (reason+source)** และ **ไม่มีฟอร์ม loss/ปรับยอด RM** — มีแต่ฝั่ง FG. D15 บังคับทุก movement RM (reserve/consume/GR/loss/**return**/adjust) มี reason+source + traceable → S2 (RM return −qty), S3 (RM loss) ไม่มีจุดโชว์บนแท็บ RM | เพิ่ม ledger view + ฟอร์ม loss/adjust บนแท็บ RM ให้สมมาตรกับ FG (return จาก `return.html` ต้องโผล่เป็น movement −qty ที่นี่ด้วย) |
| **U3** | ควรแก้ | `trace.html` | render เฉพาะ genealogy OEM (B-PO-170) + สาย QT. **ไม่มีตัวอย่างจริง** ของ (a) produce-to-stock ย้อน FG Batch→Lot (ไม่มีลูกค้า) และ (b) SO→FG Batch→Lot→DN→Invoice (§8.2) — มีแต่ข้อความ | เพิ่ม 1 ตัวอย่าง Own-Brand/produce-to-stock genealogy (S4/S5 จะ demo ได้) |
| **U4** | ควรแก้ | `production.html` + `so-list.html` | **เลข PRD-202607-000104 ถูกอ้าง 2 ที่มา**: Supply Planning FG-101 "สั่งผลิต" (production) และ SO-028 "ผลิตเก็บสต็อก" (so-list) — สับสนว่า produce-to-stock มาจาก trigger ไหน | ใช้เลข PRD แยกกัน หรือรวมเป็น 1 ที่มาเดียว (data coherence) |
| **U5** | optional | `production.html` / `qc.html` | ไม่มีตัวอย่าง line **วัตถุดิบตรง (RM-direct, D3)** วิ่งผ่านผลิต/QC — ตัวอย่างทั้งหมดเป็นสินค้า BOM | เพิ่ม 1 ตัวอย่าง RM-direct เดินสถานะผ่าน production flow เพื่อ demo D3 เต็มสาย |
| **U6** | **ต้องแก้** | `stock.html` (แท็บ FG) | OEM surplus แสดงเป็น +50 **ยัดรวมใน batch produce-to-stock "B-PRD-…101-2"** และผูก FG-101 (ไบรท์ เซรั่ม) ทั้งที่ต้นทาง PO-185 เป็น**ครีมกันแดด** — D13/D16 กำหนด surplus ต้อง**คง Batch identity ของตัวเอง** ผูก OEM Batch/PRD/PO และเข้า **FG ที่ถูกตัว** | แยก surplus เป็น **FG Batch ของตัวเอง** (เช่น FG(ครีมกันแดด) · Batch = B-PO-…185-1) ให้ FIFO/recall ราย Batch ถูกต้อง + ผูก FG ให้ตรงสินค้า |

### 2.2 ส่งกลับ Pond (business gap)
**ไม่มี.** — กฎ D1–D18 ล็อกครบ (ZERO open questions) ตอบทุกจุดตัดสินธุรกิจแล้ว: trigger surplus, จุดจอง/ตัดจริง, FIFO per-Batch, loss ไม่อนุมัติ, produce-to-stock ไม่ผูกลูกค้า, QT immutable/เวอร์ชันใหม่, RBAC generic. ทุก GAP ข้างบนเป็น "หน้าจอยังไม่โชว์เคสที่กฎมีแล้ว" — แก้ที่ UX/UI ได้เลยโดยไม่ต้องถามปอนด์.

---

## 3. Handoff
- **สถานะ:** `READY_FOR_UX_UI` — มี visual gap 6 จุด (U1/U2/U6 = must-fix, U3/U4 = should-fix, U5 = optional). แก้เฉพาะจอที่ระบุ (diff เล็ก) แล้วเข้า **Gate-1** ให้ปอนด์รีวิว "เฉพาะส่วนที่แก้".
- **คู่กับ:** `scenario-walkthrough.md` (+ `functional-spec/scenario-walkthrough.html`) — เดินเรื่อง S1–S9 ด้วย mock data + ledger before/after ให้ปอนด์อ่านเป็น scenario ตอนตื่น.
- **ไม่มีคำถามถึงปอนด์.**
