# Scenario Walkthrough — เดินเรื่องจริงด้วย Mock Data (OEM + Own-Brand + Supply Planning + FG Stock)

slug: `erp-v2-ui-first` · เขียนโดย PO · 2026-07-28 (คืน) · สำหรับ **ปอนด์** อ่านเป็น "เรื่องเล่าการใช้งานจริง" ตอนตื่น · คู่กับ `po-e2e-review-oem-ownbrand.md` (completeness matrix + punch-list)
ข้อมูลต่อยอดจาก `mock-data-spec.md` / `mock-data-journeys.md` (ไม่ขัดของเดิม — extend) · ทุก step ลิงก์หน้าจอ mockup จริง
HTML view (อ่านง่าย): `docs/design/erp-v2-ui-first/functional-spec/scenario-walkthrough.html`

## สรุปภาษาไทย
เอกสารนี้เล่า **9 scenario** (S1–S5 หลัก + B1–B4 กิ่ง) ของการใช้งานจริง ตั้งแต่ OEM เสนอราคา→ผลิตเกิน→ส่ง→เก็บเงิน, รับ/คืนวัตถุดิบ, จังหวะสต็อกเพิ่ม (surplus) vs ลด (loss), Own-Brand ผลิตเก็บสต็อกแล้วขายทีหลัง, และขายจากสต็อก. แต่ละ scenario บอก **ผู้ทำ · ลำดับ step · เอกสาร/เลขที่เกิด · Stock Ledger (เหตุผล+แหล่งที่มา+ยอด before→after) · สถานะสุดท้ายของทุก entity · ลิงก์หน้าจอ**. เลขทั้งหมดต่อเนื่องกับ dataset เดิม. จุดที่ mockup ปัจจุบันยังโชว์ไม่ครบ/ผิด จะกำกับ **[ดู punch-list Ux]** ให้ตรงกับรีวิว.

> **ป้าย movement ใน ledger:** `RESERVE` (−ใช้ได้) · `CONSUME` (−คงคลัง, ตอนเริ่มผลิต) · `GR` (+คงคลัง) · `FG-in` (+FG จาก QC produce-to-stock) · `surplus` (+FG จากผลิตเกิน OEM) · `loss` (−คงคลัง, เหตุผลบังคับ) · `return` (−คงคลัง, คืน supplier) · `adjust` (±)

---

## S1 — OEM full chain: เสนอราคา → ผลิตเกิน → surplus เข้าสต็อก → ส่ง → เก็บเงิน
**ผู้ทำ:** Sale OEM (สมหญิง) · คลัง · ฝ่ายผลิต (วิชัย) · QC (อรุณี) · จัดส่ง · Finance
**ต้นเรื่อง:** กลอรี่ คอสเมติก ตกลงราคาเซรั่ม+ครีมกันแดด → แปลงเป็น PO → ผลิตครีมกันแดดได้เกินจำนวนสั่ง

| # | เหตุการณ์ | หน้าจอ | เอกสาร/สถานะ |
|---|---|---|---|
| 1 | เสนอราคา (v1) แล้วลูกค้าต่อรอง → แก้เป็น v2 (ลดเซรั่ม 220→200) | `quotation-create` / `quotation-detail` | **QT-202607-000010** v2 · Sent→**Agreed** |
| 2 | กด **Convert to PO** → ออก PO เลขใหม่ + ลิงก์ QT↔PO | `quotation-detail` → `po-detail` | **PO-202607-000193** (ยกยอด: ครีมกันแดด SPF50 ×100 @150 · เซรั่มวิตซี ×30 @200 = 21,000 +VAT 1,470 = **22,470**) · billing: ยังไม่วางบิล |
| 3 | ยืนยัน PO → **จองวัตถุดิบ** (ΣBOM×qty) · TiO2 ไม่พอ → เตือน + PR | `po-create`/`stock` | จอง: TiO2 2.5 · กลีเซอรีน 4.3 · VitC 0.6 · น้ำหอม 0.3 → **PR-000033** (TiO2 ส่วนขาด) |
| 4 | คลังรับ TiO2 เข้า (ชดเชย/เข้าคลัง) → QC ขาเข้าผ่าน | `goods-receipt`/`qc` | Lot ใหม่ · PR-000033 = ของเข้าครบ |
| 5 | ฝ่ายผลิต **รับงาน** line#1 (ครีมกันแดด) → gen PRD | `production` (แท็บรอรับงาน→รับงาน) | **PRD-202607-000110** |
| 6 | **เริ่มผลิต** → gen Batch + ตัด RM FIFO (CONSUME) | `production` | **B-PO-202607-000193-1-1** |
| 7 | ส่งตรวจ → QC **ผ่าน** | `qc` (ตรวจแบตช์) | Batch = QC ผ่าน · PRD line = พร้อมส่งมอบ |
| 8 | ฝ่ายผลิตกรอก **จำนวนผลิตจริง = 120** (สั่ง 100) | `production` modal (field actual qty) | surplus = 120−100 = **20** |
| 9 | กด **"พร้อมส่ง (Ready to Ship)"** → ส่งลูกค้า 100 · **surplus 20 → FG stock อัตโนมัติ + remark** (ไม่ approve) | `production` ปุ่ม "พร้อมส่ง (ส่ง 100 · เข้าคลัง 20)" | FG(ครีมกันแดด SPF50 = **FG-202**, auto D11) · **Batch ใหม่ B-PO-202607-000193-1-1** [ดู **U6**: surplus ต้องเป็น FG batch ของตัวเอง ไม่ยัดรวม batch อื่น] |
| 10 | ออก DN (อ้าง PO) → ส่งถึง ลูกค้าเซ็น | `delivery-note` | **DN-20260728-00130** · PO-193 = ส่งถึงแล้ว |
| 11 | ออก Invoice (อ้าง PO + cost snapshot line) → รับชำระ | `invoice-detail` | **INV-2026-000140** · รอชำระ → **ชำระแล้ว (Paid)** |

**Stock Ledger (FG-202 ครีมกันแดด SPF50) — จุดที่ยอดขยับ:**
| เวลา | movement | จำนวน | เหตุผล | source ref | on_hand before→after |
|---|---|---|---|---|---|
| ตอน "พร้อมส่ง" | `surplus (+)` | +20 | สต็อกเพิ่มจากการผลิตเกิน | Batch B-PO-…193-1-1 · PRD-110 · PO-193 | 0 → **20** |

**สถานะสุดท้าย:** QT-000010 = Agreed (มี PO ที่แปลง) · PO-193 = ส่งถึงแล้ว/**ชำระแล้ว** · PRD-110 = พร้อมส่งมอบ · Batch = QC ผ่าน · FG-202 on_hand 20 (พร้อมขายผ่าน SO ภายหลัง) · INV-140 = Paid.
**ประเด็นสำคัญ (ให้ปอนด์เห็นชัด):** surplus จับ **ตอน "พร้อมส่ง" ไม่ใช่ตอน QC ผ่าน** (D13) — เพราะจำนวนส่ง/เก็บสรุปแน่นอนตอนนั้น · เป็น **remark ไม่ใช่ approval**.

---

## S2 — รับวัตถุดิบ (GR) + คืนวัตถุดิบ (RM Return)
**ผู้ทำ:** คลัง (Stock) · QC
**ต้นเรื่อง:** รับแอลกอฮอล์ชดเชยยอดติดลบ แล้วเจอน้ำหอมกลิ่นเพี้ยน → คืน supplier

**2A. Goods Receipt (แอลกอฮอล์ 200 ล. · ชดเชยติดลบ)** — `goods-receipt` GR-20260708-008
| เวลา | movement | จำนวน | เหตุผล | source ref | on_hand before→after |
|---|---|---|---|---|---|
| 08/07 10:30 | `GR (+)` | +200 | รับเข้าจาก TT-INV-8842 (ชดเชยติดลบ -30 ก่อน · retro-link FIFO) | Lot L-TT-ALC-2607 · PR-000028 | **-30 → 170** |
> จอ GR แสดงกล่อง "การรับนี้ชดเชยยอดติดลบ -30 ล. ... ส่วนที่เหลือ 170 ล. เข้า stock (รอ QC)". Lot ใหม่ = รอ QC ขาเข้า → ใช้ผลิตได้เมื่อ QC ผ่าน.

**2B. RM Return (น้ำหอม L-ARM-FRG-2606 · 5 กก.)** — `return` RT-20260708-0007
| เวลา | movement | จำนวน | เหตุผล (บังคับ) | source ref | on_hand before→after |
|---|---|---|---|---|---|
| 08/07 15:00 | `return (−)` | −5 | กลิ่นผิดเพี้ยน (บังคับ comment) | Lot L-ARM-FRG-2606 · Supplier อโรมา เฮ้าส์ | **23 → 18** |
> `return.html`: ระบุ Lot → ระบบดึง supplier ให้อัตโนมัติ → ตัดสต็อก + เหตุผลบังคับ + trace Lot↔Supplier · สถานะใบคืน = "คืนแล้ว (ตัดสต็อก)".
> **[ดู U2]** movement `return −5` ควรโผล่ใน **ledger ของแท็บ RM** ใน `stock.html` ด้วย (ตอนนี้แท็บ RM ยังไม่มี ledger view — เห็น −qty แค่ผ่าน `return.html`/`trace.html`).

**สถานะสุดท้าย:** แอลกอฮอล์ on_hand 170 (รอ QC) · น้ำหอม on_hand 18 · RT-0007 = คืนแล้ว · ทุก movement มี reason+source (D15).

---

## S3 — จังหวะ Over-production (เพิ่ม) vs Loss (ลด) — ให้เห็น "ตอนไหนยอดขยับ"
**เป้าหมาย:** ให้ปอนด์เห็นชัด **ADD เกิดตอน "พร้อมส่ง" · REMOVE (loss) เกิดทันทีที่บันทึก (เหตุผลบังคับ ไม่อนุมัติ)**

**เหตุการณ์ A — ADD (surplus ตอน Ready-to-Ship)** — จาก S1, FG-202:
| event ตอนไหน | movement | จำนวน | on_hand before→after |
|---|---|---|---|
| กด "พร้อมส่ง" (ไม่ใช่ตอน QC ผ่าน) | `surplus (+)` | +20 | 0 → **20** |

**เหตุการณ์ B — REMOVE (loss ระหว่างผลิต, ฝ่ายผลิต)** — `production` ฟอร์ม loss:
| event ตอนไหน | movement | จำนวน | เหตุผล (บังคับ) | on_hand before→after |
|---|---|---|---|---|
| ระหว่างผลิต บันทึกทันที | `loss (−)` | −5 | เนื้อครีมแยกชั้น | (ตัด on_hand ของ FG batch นั้นทันที) |
> loss **ไม่ auto re-produce** — ของไม่ครบตามสั่งต้องกด "ผลิตซ้ำ" เอง (D15).

**เหตุการณ์ C — REMOVE (loss ในคลัง, warehouse)** — `stock` FG ledger (ตัวอย่างจริงใน 목업):
| event | movement | จำนวน | เหตุผล | source | on_hand before→after |
|---|---|---|---|---|---|
| 11/07 14:30 | `loss (−)` | −12 | ขวดแตกระหว่างจัดเก็บ | FG-101 · B-…101-1 (warehouse) | 712 → **700** |

**สรุปจังหวะ:** สต็อก **เพิ่ม** เฉพาะ 2 ทาง — `FG-in` (QC ผ่าน, produce-to-stock) และ `surplus` (พร้อมส่ง, OEM ผลิตเกิน) · สต็อก **ลด** จาก `CONSUME`/`loss`/`return`/`reserve→consume` · **ทุกครั้งมีเหตุผล+แหล่งที่มา** (D15) · loss เหตุผลบังคับ ไม่ต้องอนุมัติ ตัด on_hand อย่างเดียว.

---

## S4 — Own-Brand produce-to-stock → ขายทีหลัง (FIFO trace ย้อน Batch/Lot)
**ผู้ทำ:** วางแผนผลิต · ฝ่ายผลิต · QC · Sale Own-Brand
**ต้นเรื่อง:** FG-101 ไบรท์ เซรั่ม cover ต่ำ (Low) → สั่งผลิตเก็บสต็อก → เดือนถัดมามีลูกค้าซื้อ

| # | เหตุการณ์ | หน้าจอ | เอกสาร/สถานะ |
|---|---|---|---|
| 1 | Supply Planning เห็น FG-101 **Low** (cover 14.3 วัน < Target 30) → กด **"สั่งผลิต 1,500"** (3 แบตช์×500, ceil ถึง Target — D6) | `supply-planning` การ์ด FG-101 | สร้าง **PRD-202607-000104** (ผลิตเก็บสต็อก · **ไม่ผูกลูกค้า** D8) |
| 2 | ฝ่ายผลิตเริ่มผลิต → gen Batch (customerless) | `production` PRD-104 badge "ผลิตเก็บสต็อก" | **B-PRD-202607-000104-1** |
| 3 | QC ตรวจแบตช์ produce-to-stock (**ไม่มี PO/ลูกค้า**) → ผ่าน | `qc` (ตรวจแบตช์) **[ดู U1: จอ QC ยังไม่มีแบตช์ประเภทนี้ — ต้องเพิ่ม]** | Batch = QC ผ่าน |
| 4 | QC ผ่าน → **FG เข้าคลังราย Batch** (D12) | `stock` แท็บ FG ledger `FG-in (+)` | FG-101 on_hand +1,500 |
| 5 | เดือนถัดมา ลูกค้าซื้อ → SO ขายจากสต็อก → ตัด **FIFO ราย Batch** | `so-create`/`so-detail` | ตัด batch เก่าสุดก่อน |
| 6 | trace ย้อน: SO → FG Batch → Lot (genealogy ครบแม้ผลิตตอนไม่มีลูกค้า) | `trace` **[ดู U3: ต้องเพิ่มตัวอย่าง Own-Brand]** | genealogy Batch→Lot |

**Stock Ledger (FG-101):**
| เวลา | movement | จำนวน | เหตุผล | source ref | on_hand before→after |
|---|---|---|---|---|---|
| QC ผ่าน | `FG-in (+)` | +1,500 | QC ผ่าน (produce-to-stock) | PRD-104 (ไม่ผูกลูกค้า) · B-PRD-…104-1 | 1,200 → **2,700** |
| ขายภายหลัง (ยืนยัน SO) | `reserve` | −50 (ใช้ได้) | จอง SO | SO-2026xx | reserved +50 |
| พร้อมจัดส่ง | `CONSUME (−)` | −50 | ตัด FIFO batch เก่าสุด (B-…104-1) | DN · SO | 2,700 → **2,650** |

**สถานะสุดท้าย:** PRD-104 = พร้อมส่งมอบ (เข้าคลัง) · FG-101 batch B-PRD-104-1 มีของขาย · SO ที่ขาย = ส่งถึงแล้ว/รอชำระ · genealogy FG→Batch→Lot ครบ (GMP recall ได้).

---

## S5 — Own-Brand sell-from-stock (SO มีลูกค้า)
**ผู้ทำ:** Sale Own-Brand (อารดา) · จัดส่ง · Finance
**ต้นเรื่อง:** ร้านสวยใส ซื้อไบรท์ เซรั่ม + ลิปบาล์ม จากสต็อกที่มี

| # | เหตุการณ์ | หน้าจอ | เอกสาร/สถานะ |
|---|---|---|---|
| 1 | สร้าง SO โหมด (ก) **เลือกลูกค้า** ร้านสวยใส + FG-101×50 + FG-150×25 (ไม่มี Quotation) | `so-create` | **SO-202607-000030** (12,840) |
| 2 | ยืนยัน SO → **จอง FG ราย Batch** (FIFO) | `so-detail` | จอง FG-101 ×50 (B-…101-1) · FG-150 ×25 (B-…150-1) |
| 3 | พร้อมจัดส่ง → **ตัด FG FIFO ราย Batch** | `so-detail` ปุ่ม "พร้อมจัดส่ง (ตัด FG FIFO)" | on_hand ลดราย Batch |
| 4 | ออก **DN อ้าง SO** → ส่งถึง | `delivery-note` DN-125 → SO-030 | DN = ส่งถึงแล้ว 11:30 |
| 5 | ออก **Invoice อ้าง SO** (+ cost snapshot) → รับชำระ | `invoice-detail` | INV อ้าง SO-030 · รอชำระ→ชำระแล้ว |

**Stock Ledger (FG-101 + FG-150):**
| เวลา | movement | จำนวน | เหตุผล | source | balance |
|---|---|---|---|---|---|
| ยืนยัน SO | `reserve` | −50 (FG-101 ใช้ได้) · −25 (FG-150 ใช้ได้) | จอง SO-030 | SO-202607-000030 | reserved +75 |
| พร้อมจัดส่ง | `CONSUME (−)` | −50 (B-…101-1) · −25 (B-…150-1) | ตัด FIFO ราย Batch | DN-125 · SO-030 | on_hand ลดตาม |

**สถานะสุดท้าย:** SO-030 = ส่งถึงแล้ว/ชำระ · DN-125 = ส่งถึงแล้ว · genealogy SO→Batch→Lot ครบ.

---

## กิ่ง (Branch scenarios) — ให้แน่ใจว่า flow ครบจริง

### B1 — QC fail → Rework (run1 ไม่ผ่าน → run2 ผ่าน)
`qc` → `production`. PO-202607-000181 line#2 (โฟม): run1 **B-…181-2-1** ไม่ผ่าน ("เนื้อโฟมเป็นก้อน" — feedback บังคับ) → PRD Rework → กด "ผลิตซ้ำ" → run2 **B-…181-2-2** → กลับคิว QC. **line#1 เดินต่อไม่สะดุด** · PO พร้อมจัดส่งเมื่อทั้ง 2 batch ผ่าน. (ครบตาม §3.2)

### B2 — Cancel ก่อน/หลังเริ่มผลิต (คืน vs ไม่คืน)
- **ก่อนเริ่มผลิต:** Cancel PO/SO → **release reservation ที่ยังไม่ consume ทั้งหมด (คืน Available)** — `so-detail` ปุ่ม "ยกเลิก SO (คืนจอง FG)"; PO cancel/reopen คงเลขเดิม (`po-detail`). Ledger: `RELEASE` (+ใช้ได้).
- **หลังเริ่มผลิต (บาง line ตัดจริงแล้ว):** ส่วนที่ **consume ไปแล้ว = ไม่คืน** (ของออกจากคลังจริง/ตัด on_hand แล้ว) · คืนเฉพาะส่วนที่ยัง "จอง". (ตรง `stock-reservation.md` §4)

### B3 — Partial DN (รอบส่งบางส่วน)
`delivery-note` SHP-20260708-0046: DN-122 ส่งถึง · DN-123 **ถูกปฏิเสธ** → PO-175 กลับ "พร้อมจัดส่ง" + raise Sale · DN-124 **เลื่อนส่ง 10/07** → PO-178 flag Postpone ค้างคิว · DN-125 (SO-030 Own-Brand) ส่งถึง. หัวรอบ badge **"ส่งบางส่วน"** = ป้าย reconcile (รอบยัง In-Route จนทุก DN ถึงปลายทาง). (ครบตาม UC8 + entity-status-map §1.9)

### B4 — Quotation Rejected / แก้เป็นเวอร์ชันใหม่
`quotation-list`/`quotation-detail`: **QT-202607-000006** (ร้านสวยใส) = **ปฏิเสธ (Rejected)** → จบสาย ไม่เกิด PO (เก็บเป็นประวัติ) · **QT-202607-000010** แก้ราคา v1→v2 = **เวอร์ชันใหม่เสมอ** (immutable, เก็บประวัติ v1 "แทนที่แล้ว"). (ครบตาม D18-4)

---

## Master: scenario × หน้าจอหลัก
| Scenario | quotation | po | so | supply-plan | production | qc | stock(FG/RM) | goods-receipt | return | delivery-note | invoice | trace |
|---|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| S1 OEM full+surplus | ✓ | ✓ | | | ✓ | ✓ | ✓ | ✓ | | ✓ | ✓ | ✓ |
| S2 GR + RM return | | | | | | ✓ | ✓(RM) | ✓ | ✓ | | | ✓ |
| S3 surplus vs loss timing | | | | | ✓ | | ✓ | | | | | |
| S4 produce-to-stock→sold | | | ✓ | ✓ | ✓ | ✓ | ✓ | | | ✓ | ✓ | ✓ |
| S5 sell-from-stock | | | ✓ | | | | ✓ | | | ✓ | ✓ | |
| B1 rework | | ✓ | | | ✓ | ✓ | | | | | | ✓ |
| B2 cancel คืน/ไม่คืน | | ✓ | ✓ | | ✓ | | ✓ | | | | | |
| B3 partial DN | | ✓ | ✓ | | | | | | | ✓ | | |
| B4 QT rejected/version | ✓ | | | | | | | | | | | |

> เลขเอกสารใหม่ใน scenario (PO-193, PRD-110/104, B-PO-193-1-1, FG-202, DN-130, INV-140, PR-033, RT-0007) ต่อเนื่องจาก dataset เดิม — ไม่ทับเลขที่ใช้แล้ว. จุด **[U1]–[U6]** = หน้าจอที่ต้องให้ UX/UI เติมให้ scenario เดินได้ครบบนจอจริง (ดู `po-e2e-review-oem-ownbrand.md` §2).
