# Entity Status Map — ESSENCE Hub System (แผนที่สถานะฉบับเดียวจบ)

เอกสารสำหรับปอนด์ (+ BA/Engineer/QA เป็น source of truth เรื่อง lifecycle) · เขียนโดย PO · 2026-07-09 (ปรับ r4.1) · **r5 (2026-07-10): เพิ่มชั้น Stock Reservation — รายละเอียดเต็มที่ `stock-reservation.md`**
เป็น **ความจริงหลัก** เรื่อง entity/สถานะ/ใครเปลี่ยน/cascade · `status-journeys.md` อ้างอิงเอกสารนี้ (sync แล้ว ไม่ให้มี 2 ความจริง)

## สรุปภาษาไทย
**ปอนด์ปรับ flow (r4.1):** PO ยืนยันแล้ว → งานแต่ละ line เข้า **คิวผลิตสถานะ "รอรับงาน"** (ยัง**ไม่**เกิด PRD) → **ฝ่ายผลิตกด "รับงาน" เอง → ตอนนั้นถึงสร้าง PRD** (1 ใบต่อ line, สถานะเริ่ม = รับงาน) → กด "เริ่มผลิต" = gen เลข **Batch** · **1 PO : N PRD (N=line) : M Batch (M≥N, +1/rework)** · **วัตถุดิบขาดไม่บล็อก** — รับงาน/เริ่มผลิตได้เลย (เตือนวัตถุดิบอาจไม่พร้อม) และ **ผลิตจริงตัด stock ติดลบได้** พอทำ GR ค่อยบวกกลับ (หน้า stock/GR ต้องโชว์ยอดติดลบชัด) · Batch ผ่าน QC → PRD line พร้อมส่งมอบ → ทุก PRD ของ PO พร้อม → PO พร้อมจัดส่ง
**★ r5 Stock Reservation (ปอนด์ถาม 2026-07-10):** **PO Confirmed → จอง (Reserve) วัตถุดิบ = ΣBOM×qty ต่อ line** (ยังไม่ตัดจริง) → เกิดยอด **ใช้ได้ (Available) = คงคลัง − จองแล้ว** · **ตัดจริง (Consume)** ตอนไหน = คำถามหลัก (PO เสนอ "เริ่มผลิต" ราย Batch) · **Cancel PO = คืน (Release) ที่จองอัตโนมัติ** · จองเกิน available ได้+เตือน · **ดู `stock-reservation.md` (ความจริงหลักเรื่อง reservation)**

---

## ตอบคำถามปอนด์ (กระชับ — อัปเดตตามคำตอบ r4.1)
1. **สร้าง PO ที่ไม่ใช่ร่าง:** กด "ยืนยัน PO" → PO(ราง fulfilment) = **"ยืนยันแล้ว (Confirmed)"** · งานแต่ละ line **เข้าคิวฝ่ายผลิตที่สถานะ "รอรับงาน (Awaiting Acceptance)"** — **ยังไม่สร้าง PRD** · **ฝ่ายผลิตกด "รับงาน" เอง** → **ตอนนั้นระบบสร้าง PRD** (สถานะ "รับงาน") → กด "เริ่มผลิต" เมื่อพร้อม **[ปอนด์เลือก: ไม่ auto — ฝ่ายผลิตยืนยันรับเอง]** · **r5: ตอน Confirmed ระบบยัง "จองวัตถุดิบ" ด้วย (ดู §1.6)**
2. **เลข PRD เกิดตอน:** **ตอนฝ่ายผลิตกด "รับงาน"** (ปอนด์เปลี่ยนจากเดิม "ตอน Confirm") · **1 line item = 1 PRD** (แต่ละสินค้าผลิตแยก ใช้ BOM/lot ต่างกัน + QC ราย line) → 1 PO N line = **N PRD** · format `PRD-{YYYYMM}-{NNNNNN}` (gapless ต่อเดือน — ออกเลขตอนรับงาน)
3. **เลข Batch เกิดตอน:** ฝ่ายผลิตกด **"เริ่มผลิต"** ของ PRD นั้น → gen **Batch run แรก** `B-{PO}-{line}-1` · cascade ขึ้นไป: Batch(กำลังผลิต) → PRD(กำลังผลิต) · Batch(รอ QC) → PRD(รอ QC) · **Batch ผ่าน QC → PRD line = พร้อมส่งมอบ** · **ทุก PRD ของ PO พร้อมส่งมอบ → PO = พร้อมจัดส่ง** · Batch ไม่ผ่าน → PRD = Rework(กลับกำลังผลิต) + gen Batch run ถัดไป
4. **"ส่งตรวจคุณภาพ" สร้าง Batch ไหม?** **ไม่ใช่** — Batch สร้างตอน **"เริ่มผลิต"** · "ส่งตรวจ QC" คือ **Batch ที่มีอยู่แล้วเปลี่ยนสถานะ** (กำลังผลิต → รอ QC) แล้วส่งไปหน้า QC · Batch สร้างครั้งเดียวต่อ run (+ run ใหม่เฉพาะตอน rework)

**★ วัตถุดิบขาด + Negative Stock (ปอนด์ตอบ r4.1):** วัตถุดิบไม่พอ **ไม่บล็อก**สายผลิต — กด "รับงาน" สร้าง PRD ได้เลย + **เตือนว่าวัตถุดิบอาจไม่พร้อม** · **อนุญาตตัด stock ติดลบ** เมื่อผลิตจริง (เหตุผลปอนด์: ของจริงอาจมาถึงแล้วแต่ยังไม่ได้ทำใบรับในระบบ ห้ามหยุดสายผลิต) · เมื่อทำ **Goods Receipt** ระบบ **บวก stock กลับ + FIFO retro-link** และ **ต้องแสดงชัดว่าเคยติดลบ** (ดู §1.6 + §4)

**ความสัมพันธ์เชิงตัวเลข:** **1 PO : N PRD (N=line) : M Batch (M≥N; +1 ทุกครั้งที่ rework)** · 1 PO : 1..K DN (ปกติ 1, เพิ่มเมื่อ reject/postpone แล้วส่งรอบใหม่) · 1 Shipment(รอบ) : หลาย DN · 1 PO : 1 Invoice (+versions)

---

## 1. รายการ Entity + สถานะของตัวเอง

### 1.1 Customer · `CUS-{NNNNNN}` · หน้า: customers / customer-detail
| สถานะ | ใครเปลี่ยน | เกิดตอน |
|---|---|---|
| ผู้สนใจ (Lead) | ระบบ (สร้างลูกค้า) | สร้างลูกค้าใหม่ |
| ลูกค้าประจำ (Active) | auto (มี PO ใบแรก/มี order ในรอบ) | ยืนยัน PO ใบแรก |
| ห่างหาย (Inactive) | auto scheduler (ไม่มี order เกินรอบ default 3 ด.) | ครบรอบไม่มี order |
| ต้องติดตาม (Follow-up) | Sale / Sale Manager (บังคับ comment) | manual (เช่นจาก PRD Hold เหตุลูกค้า) |
| ปิดใช้งาน (Disabled) / บัญชีดำ (Blacklist) | Sale Manager / Admin (บังคับ comment) | manual |

### 1.2 PO — ราง Fulfilment (การผลิต/จัดส่ง) · `PO-{YYYYMM}-{NNNNNN}` · หน้า: po-create / po-detail / po-list
| สถานะ | ใครเปลี่ยน | เกิดตอน |
|---|---|---|
| ร่าง (Draft) | Sale | สร้าง PO |
| ยืนยันแล้ว (Confirmed) | Sale (กดยืนยัน) | ยืนยัน PO → **แต่ละ line เข้าคิวผลิต "รอรับงาน"** (ยังไม่เกิด PRD) + **จองวัตถุดิบ (r5)** |
| กำลังผลิต (In Production) | auto (จาก PRD เริ่มผลิต) | PRD ใด ๆ เริ่มผลิต |
| พร้อมจัดส่ง (Ready to Deliver) | auto (ทุก PRD พร้อมส่งมอบ) | ทุก line ผ่าน QC |
| กำลังจัดส่ง (In Delivery) | auto (DN ออกวิ่ง) | Shipment In-Route |
| ส่งถึงแล้ว (Delivered) | auto (DN Delivered) | ลูกค้าเซ็นรับ |
| ยกเลิก (Cancelled) → เปิดใหม่เป็น ร่าง | Sale/Admin (บังคับ comment) · reopen คงเลข PO เดิม | ทุกขั้น |
> force override (ข้ามลำดับ) = เฉพาะสิทธิ์ **Admin** + เหตุผล + trace (ที่การ์ด "เปลี่ยนสถานะ PO" หน้า po-detail)

### 1.3 PO — ราง Billing (วางบิล/ชำระ) · หน้า: invoices / invoice-detail / po-detail
| สถานะ | ใครเปลี่ยน | เกิดตอน |
|---|---|---|
| ยังไม่วางบิล (Not Invoiced) | (เริ่มต้น) | — |
| วางบิลแล้ว (Invoiced) | Finance/Sale (ออก invoice ได้ตั้งแต่ PO=Confirmed) | ออกใบแจ้งหนี้ |
| ชำระแล้ว (Paid) | Finance | รับชำระครบ |
| เกินกำหนด (Overdue) | auto scheduler | ส่งของแล้ว + เลยเครดิต(ระดับลูกค้า) + ยังไม่จ่าย |

### 1.4 ★ PRD — ใบสั่งผลิต (Production Order) · `PRD-{YYYYMM}-{NNNNNN}` · หน้า: production (+ dashboard/qc/po-detail อ้างอิง)
**นิยาม:** ใบสั่งผลิต **1 ใบต่อ 1 line item** · **สร้างเมื่อฝ่ายผลิตกด "รับงาน"** (ไม่ auto ตอน Confirm — ปอนด์เลือก) · เป็น "งาน" ที่ฝ่ายผลิตรับมาทำ · 1 PRD มีได้หลาย Batch (run) เมื่อ rework
> **ก่อนเกิด PRD:** PO Confirmed สร้าง **"รายการคิวรอรับงาน (Production Queue Item)" ต่อ line** สถานะ **"รอรับงาน (Awaiting Acceptance)"** — ยังไม่มีเลข PRD · ฝ่ายผลิตกด **"รับงาน"** จึง gen PRD

| สถานะ PRD | ใครเปลี่ยน | เกิดตอน |
|---|---|---|
| *(pre)* รอรับงาน (Awaiting Acceptance) | auto (จาก PO Confirmed) — เป็นคิว ยังไม่ใช่ PRD | PO ยืนยัน |
| รับงาน (Received) | **Production (กด "รับงาน")** → **gen เลข PRD** | ฝ่ายผลิตรับงาน |
| กำลังผลิต (In Progress) | Production (กด "เริ่มผลิต") | → gen Batch run แรก |
| รอ QC | Production (กด "ส่งตรวจ QC") | Batch ผลิตเสร็จส่งตรวจ |
| พร้อมส่งมอบ (Ready to Deliver) | auto (Batch ล่าสุด QC ผ่าน) | QC ผ่าน |
| Rework (กลับกำลังผลิต) | auto (Batch QC ไม่ผ่าน) | QC ตีกลับ → gen Batch run ถัดไป |
| พักงาน (Hold) | Production (บังคับ comment + raise Sale/Stock) | ติดปัญหา |
> overlay: **เสี่ยงล่าช้า (Potential Delay)** = auto (เกณฑ์ 2 วันผลิต + 1 วันส่ง)
> **วัตถุดิบขาดไม่บล็อก:** รับงาน/เริ่มผลิตได้แม้ stock ไม่พอ — แสดง badge/เตือน "วัตถุดิบอาจไม่พร้อม" (ดู §1.6 negative stock)
> **สีป้าย Rework (r5 · PO ตัดสิน 2026-07-14):** PRD ที่ถูกตีกลับกลับสู่สถานะ **"กำลังผลิต · Rework" = สีฟ้า (processing)** — เป็นงานที่กลับมาผลิตอีกครั้ง ไม่ใช่สถานะ error · สัญญาณ "ตก/ต้องแก้" สีแดงอยู่ที่ **Batch "QC ไม่ผ่าน"** (ตัว run ที่ fail) + noti เท่านั้น ไม่ซ้ำที่ระดับ PRD

### 1.5 ★ Batch — รุ่นการผลิต · `B-{PO}-{line}-{run}` · หน้า: production / qc / trace
**นิยาม:** รุ่นผลิตจริง 1 รอบของ PRD · gen ตอน "เริ่มผลิต" · run เพิ่มทีละ 1 เมื่อ rework · ผูก PO/line/Lot วัตถุดิบที่ใช้
| สถานะ Batch | ใครเปลี่ยน | เกิดตอน |
|---|---|---|
| กำลังผลิต | auto (gen ตอนเริ่มผลิต) → **ตัด stock วัตถุดิบ (ติดลบได้)** | PRD เริ่มผลิต |
| รอ QC | Production (ส่งตรวจ) | ผลิตเสร็จ |
| QC ผ่าน | **QC (หน้า qc เท่านั้น)** | ตัดสินผ่าน |
| QC ไม่ผ่าน | **QC (หน้า qc เท่านั้น)** + feedback บังคับ | ตัดสินไม่ผ่าน → PRD Rework |
> หน้า production **ไม่มีปุ่มตัดสิน QC** — เห็นผล + รับงานกลับเท่านั้น

### 1.6 Lot วัตถุดิบ + Stock (+ Reservation r5) · `{supplier prefix}{YYMM}` (เช่น L-GLY-2607) · หน้า: stock / goods-receipt / qc / trace
| สถานะ Lot | ใครเปลี่ยน | เกิดตอน |
|---|---|---|
| รอตรวจรับ (รอ QC ขาเข้า) | auto (gen ตอน Goods Receipt) | บันทึกรับเข้า |
| พร้อมใช้ผลิต | QC (ตรวจรับผ่าน) | QC ขาเข้าผ่าน (+อาจปิด PR) |
| ระงับ (ไม่ผ่าน) | QC (ไม่ผ่าน) → ทำใบคืนของ | QC ขาเข้าไม่ผ่าน |
| หมด/ตัดสต็อก | auto (ใช้ในการผลิต/Return) | ตัด stock |

**★ Stock Reservation / 3 ยอด (r5 — ปอนด์ถาม 2026-07-10) · ดู `stock-reservation.md` (ความจริงหลัก):**
- **3 ยอดต่อวัตถุดิบ:** **คงคลัง (on_hand)** = กายภาพจริง (ติดลบได้) · **จองแล้ว (Reserved)** = Σ reservation active (≥0) · **ใช้ได้ (Available) = on_hand − Reserved** (ติดลบได้ = จองเกิน)
- **Reservation lifecycle (ต่อ po_line × material):** **จอง (Reserved)** เกิดตอน **PO Confirmed** (qty=ΣBOM×qty) → **ใช้จริงแล้ว (Consumed)** ตอน "ตัดจริง" → **คืนแล้ว (Released)** ตอน cancel/แก้ลด · reservation จองระดับ material (lot เลือก FIFO ตอน consume จริง)
- **★ จุด "ตัดจริง" = คำถามหลักถึงปอนด์** (PO เสนอ Option A "เริ่มผลิต" ราย Batch เพื่อคง GMP Batch↔Lot; ทางเลือก B "พร้อมส่ง") — ดู `stock-reservation.md` §3 + คำถาม §5
- **Cancel PO** → release reservation ที่ยังไม่ consume ทั้งหมด (auto คืน) · **Hold แก้ PO** → ปรับ reservation (delta) · **จองเกิน available** = เตือนไม่บล็อก (สอดคล้อง warning-not-block)

**★ Negative Stock Rule (ปอนด์ตอบ r4.1):**
- การผลิต (Batch เริ่มผลิต) **ตัด stock ได้แม้ยอดคงเหลือไม่พอ → ยอดคงเหลือติดลบได้** (ไม่บล็อก) · ทุกครั้งที่เกิดติดลบ **บันทึก trace** (Batch ไหน/วัตถุดิบใด/ติดลบเท่าไร/เมื่อไหร่/ใคร)
- เมื่อทำ **Goods Receipt** วัตถุดิบตัวที่ติดลบ → ระบบ **บวก stock กลับ** (ชดเชยยอดติดลบก่อน แล้วส่วนเกินเข้า stock ปกติ)
- **★ FIFO retro-link (ปอนด์ยืนยัน — GMP):** GR ที่เข้ามาชดเชยยอดติดลบ → ระบบ **ผูกการใช้วัตถุดิบ (consumption) ที่ตัดติดลบไว้ก่อนหน้า เข้ากับ Lot ใหม่ที่รับเข้าแบบ FIFO อัตโนมัติ** (Lot เก่าสุดก่อน) → ทำให้ **Batch ↔ Lot ครบสายย้อนหลัง** (genealogy ไม่มีรูโหว่) · retro-link ทุกครั้งบันทึก trace (Batch/consumption ใด ↔ Lot ใด/จำนวน/เวลา) · ถ้า GR ที่รับไม่พอชดเชยยอดติดลบทั้งหมด → ผูกเท่าที่มี แล้วรอ GR ถัดไปผูกส่วนที่เหลือ (ยังติดลบต่อจนกว่าจะครบ)
- **จุดแสดงผลบังคับ (ให้ UX/UI):**
  - **stock.html:** **แสดง 3 ยอด (คงคลัง/จองแล้ว/ใช้ได้)** · on_hand ติดลบ = **สีแดง + badge "ติดลบ (รอรับเข้า)"** · available ติดลบ (จองเกิน) = แดง + badge "จองเกิน (รอรับเข้า)"
  - **production:** ตอน "รับงาน"/"เริ่มผลิต" ที่วัตถุดิบไม่พอ → **เตือน "วัตถุดิบอาจไม่พร้อม / จะตัด stock ติดลบ X หน่วย"** (ให้ทำต่อได้)
  - **goods-receipt:** ถ้ารายการที่รับไปชดเชยยอดติดลบ → **กล่องแจ้ง "การรับนี้ชดเชยยอดติดลบ X หน่วย (ผูก Lot ย้อนแบบ FIFO)"** ก่อนยืนยัน
  - **trace:** genealogy Batch แสดง Lot ที่ผูกย้อนแบบ FIFO ด้วย (ระบุว่า retro-link จาก GR ใด)

### 1.7 PR — คำขอสั่งซื้อ · `PR-{NNNNNN}` · หน้า: purchase-request / pr-create
| สถานะ | ใครเปลี่ยน | เกิดตอน |
|---|---|---|
| เปิดคำขอ (Open) | auto (PO วัตถุดิบขาด) / Stock (สร้างตรง) | วัตถุดิบขาด/สร้างเอง |
| รับทราบ (Acknowledged) | Stock (manual) | รับทราบ |
| รับบางส่วน (Partially) | auto (GR รับไม่ครบ) | รับบางส่วน → เสนอสร้าง PR ใหม่ (user review) |
| ของเข้าครบ (Fulfilled) | auto (GR รับครบ ผูก lot) | รับครบ |
| ปิดคำขอ (Closed) / ยกเลิก | Stock (manual, ยกเลิกบังคับ comment) | ปิด/ยกเลิก |

### 1.8 GR — ใบรับเข้า · `GR-{YYYYMMDD}-{NNN}` · หน้า: goods-receipt
event บันทึกรับเข้า (header 1 supplier + หลาย line) → **gen Lot รายบรรทัด** + **ปิด/อัปเดต PR ที่อ้าง** + **บวก stock กลับ (ชดเชยยอดติดลบถ้ามี + FIFO retro-link — โชว์ notice)** · ผู้ทำ = Stock · (ไม่มี lifecycle ยาว — เป็นเอกสารบันทึก) · **r5: on_hand เพิ่ม → Available เพิ่มอัตโนมัติ (ไม่แตะ Reserved)**

### 1.9 Shipment (รอบจัดส่ง) · `SHP-{YYYYMMDD}-{NNNN}` · หน้า: shipping / delivery-note
| สถานะรอบ | ใครเปลี่ยน | เกิดตอน |
|---|---|---|
| รับเข้ารอบ (Received) | Shipping (สร้างรอบจาก PO พร้อมจัดส่ง) | สร้างรอบ (+คนขับ/เบอร์/route/ประเภทรถ) |
| กำลังนำส่ง (In-Route) | Shipping | ออกวิ่ง |
| จบรอบ (Closed) | auto | ทุก DN ในรอบถึงสถานะสุดท้าย |
> **"ส่งบางส่วน (Partially)" = ป้าย reconcile/มุมมองสรุปรอบ ไม่ใช่ lifecycle status (PO ยืนยัน 2026-07-14):** เมื่อรอบรวมหลาย DN แล้วบาง DN ถึงปลายทาง บางใบถูกปฏิเสธ/เลื่อน → **รอบยังอยู่สถานะ "กำลังนำส่ง (In-Route)" (ยังไม่ Closed)** จนกว่าทุก DN ถึงสถานะสุดท้าย · "ส่งบางส่วน (Partially)" เป็นเพียง **ป้ายสรุปผลรอบ (reconcile badge)** ที่หัวใบ delivery-note/หน้า shipping เพื่อบอกคนว่ารอบนี้ยังปิดไม่ได้ — **ไม่ใช่สถานะรอบใน lifecycle** · สอดคล้องกับ mock-data-journeys UC8 (badge หัวใบ "รอบยังไม่ปิด") ที่ใช้เชิงมุมมอง ไม่ได้ประกาศเป็น lifecycle status

### 1.10 DN — ใบจัดส่ง (1 ใบ = 1 PO) · `DN-{YYYYMMDD}-{NNNNN}` · หน้า: delivery-note
| สถานะ DN | ใครเปลี่ยน | เกิดตอน |
|---|---|---|
| กำลังนำส่ง (In-Route) | Shipping | รอบออกวิ่ง |
| ส่งถึงแล้ว (Delivered) | Shipping (ลูกค้าเซ็น) | ส่งถึง → PO Delivered |
| ถูกปฏิเสธ (Rejected) | Shipping | ลูกค้าปฏิเสธ → PO กลับพร้อมจัดส่ง + raise Sale |
| เลื่อนส่ง (Postponed) | Shipping | เลื่อน → PO พร้อมจัดส่ง + flag Postpone+วันที่ ค้างคิว |

### 1.11 Invoice · `INV-{YYYY}-{NNNNNN}` · หน้า: invoices / invoice-detail / invoice-print
รอชำระ / ชำระแล้ว / เกินกำหนด + **versioning** (ยึด VAT rate ตาม effective ณ invoice date) · ผู้ทำ = Finance

---

## 2. Cascade Table (X เปลี่ยน → Y เปลี่ยน → เห็นที่หน้า → noti ไปหา)
| # | ต้นเหตุ (ใคร) | ผล cascade | เห็นที่หน้า | noti |
|---|---|---|---|---|
| 1 | **PO Draft → ยืนยันแล้ว** (Sale) | **แต่ละ line เข้าคิวผลิต "รอรับงาน"** (ยังไม่เกิด PRD); **+ จองวัตถุดิบ (Reserved เพิ่ม, Available ลด — r5)**; ลูกค้า Lead→Active (ใบแรก) | po-detail, production (คิวรอรับงาน), stock, customers | Production |
| 2 | **รอรับงาน → รับงาน** (Production กด "รับงาน") | **gen เลข PRD** `PRD-{YYYYMM}-{NNNNNN}` (สถานะ รับงาน) | production | — |
| 3 | **PRD รับงาน → กำลังผลิต** (Production "เริ่มผลิต") | **gen Batch run แรก** `B-{PO}-{line}-1`; **ตัด stock จริง (convert จอง→ตัด, FIFO lot, ติดลบได้ — r5 ถ้า Option A)**; PO=กำลังผลิต | production, stock | — |
| 4 | **Batch กำลังผลิต → รอ QC** (Production "ส่งตรวจ QC") | PRD=รอ QC; Batch โผล่คิว QC | production, qc | QC |
| 5 | **Batch → QC ผ่าน** (QC) | PRD line=พร้อมส่งมอบ; **ถ้าทุก PRD ของ PO ผ่าน → PO=พร้อมจัดส่ง** → โผล่คิวจัดส่ง | qc, po-detail, shipping | Shipping (เมื่อ PO พร้อม) |
| 6 | **Batch → QC ไม่ผ่าน** (QC + feedback) | Batch=ไม่ผ่าน; PRD=Rework(กลับกำลังผลิต); PO ยังไม่พร้อม | qc, production (badge Rework) | Production |
| 7 | **PRD Rework → เริ่มผลิตซ้ำ** (Production "ผลิตซ้ำ") | **gen Batch run ถัดไป** `...-{run+1}` → กลับคิว QC; **ใช้วัตถุดิบเพิ่ม (ตัดจาก available/ติดลบได้ — r5 Q4)** | production, qc, stock | QC |
| 8 | **PRD → Hold** (Production, เหตุลูกค้า/stock) | raise Sale/Stock; (เหตุลูกค้า) Sale ตั้งลูกค้า Follow-up | production, po-detail, customers | Sale หรือ Stock |
| 9 | **PO พร้อมจัดส่ง → กำลังจัดส่ง** (Shipping สร้าง Shipment+DN) | Shipment=รับเข้ารอบ→In-Route; DN=กำลังนำส่ง | shipping, delivery-note | — |
| 10 | **DN → ส่งถึงแล้ว** (Shipping) | PO=ส่งถึงแล้ว; เริ่มนับ overdue; Shipment จบรอบเมื่อ DN ครบ | delivery-note, po-detail | Finance + Sale |
| 11 | **DN → ถูกปฏิเสธ** (Shipping) | PO=พร้อมจัดส่ง(กลับคิว) + raise Sale | delivery-note, po-list, shipping | Sale |
| 12 | **DN → เลื่อนส่ง** (Shipping) | PO=พร้อมจัดส่ง + flag Postpone+วันที่ ค้างคิว | delivery-note, shipping | Shipping |
| 13 | **ออก Invoice** (Finance) | PO billing=วางบิลแล้ว | invoices, po-detail | — |
| 14 | **Overdue** (scheduler) | billing=เกินกำหนด | invoices, dashboard(Finance) | Finance + Sale |
| 15 | **PO วัตถุดิบขาด** (ตอนเปิด PO) | เตือน(ไม่บล็อก, เทียบ **available** — r5) + gen PR(ส่วนที่ขาด) | po-create, purchase-request | Stock + Production |
| 16 | **ผลิตตัด stock ติดลบ** (Batch เริ่มผลิต, วัตถุดิบไม่พอ) | stock ติดลบ + trace; badge สีแดงในหน้า stock; ไม่บล็อกการผลิต | stock, production, trace | Stock |
| 17 | **Goods Receipt บันทึกรับ** (Stock) | gen Lot(รอตรวจรับ) รายบรรทัด + ปิด/อัปเดต PR + **บวก stock กลับ + FIFO retro-link + Available เพิ่ม (r5)** | goods-receipt, purchase-request, stock, trace | Stock/Production |
| 18 | **Lot QC ขาเข้า ผ่าน/ไม่ผ่าน** (QC) | ผ่าน→Lot พร้อมใช้ (+อาจปิด PR) / ไม่ผ่าน→Lot ระงับ→คืนของ | qc, stock, return | Stock |
| 19 | **PO ยกเลิก → เปิดใหม่(ร่าง)** (Sale/Admin) | คงเลข PO เดิม + trace; คิว/PRD/Batch ยกเลิกตาม; **+ Release reservation ที่ยังไม่ consume ทั้งหมด (คืน Available — r5)** | po-detail, stock | Production |
| 20 | **★ Reservation (r5)** — Confirm=จอง / Cancel-แก้ลด=คืน / เริ่มผลิต=ตัดจริง | Reserved/Available เปลี่ยน (ดู `stock-reservation.md`) | stock (3 ยอด), po-detail | Stock (ถ้า available ติดลบ) |

---

## 3. แผนภาพเส้นเดียว จากต้นจนจบ (ใครทำ / gen อะไร ตอนไหน)

```
ลูกค้าสั่ง
  │  [Sale] สร้าง PO
  ▼
PO = ร่าง (Draft)                                   PO-{YYYYMM}-{NNNNNN}
  │  [Sale] กดยืนยัน
  ▼
PO = ยืนยันแล้ว (Confirmed) ──auto──► แต่ละ line เข้าคิวผลิต = "รอรับงาน"  (ยังไม่มีเลข PRD)
  │                                   └─► [r5] จองวัตถุดิบ = ΣBOM×qty (Reserved+, Available−)
  │  [Production] กด "รับงาน"
  ▼
                                    gen PRD (สถานะ "รับงาน")   PRD-{YYYYMM}-{NNNNNN}  (1 line = 1 PRD)
                                          │  [Production] กด "เริ่มผลิต"
                                          ▼
                                    PRD = กำลังผลิต ──auto──► gen Batch run1   B-{PO}-{line}-1  (Batch เกิดตอนนี้!)
                                          │                     └─► ตัดจริง (convert จอง→ตัด) FIFO lot (ติดลบได้ ไม่บล็อก) [r5 Option A]
                                          │  [Production] กด "ส่งตรวจ QC"   (Batch เปลี่ยนเป็น รอ QC — ไม่ได้ gen ใหม่)
                                          ▼
                                    PRD/Batch = รอ QC
                                          │  [QC] ตัดสินราย Batch (ที่หน้า qc เท่านั้น)
                          ┌───────────────┴───────────────┐
                    ✕ ไม่ผ่าน (+feedback)              ✓ ผ่าน
                          │                                │
                Batch=ไม่ผ่าน · PRD=Rework            PRD line = พร้อมส่งมอบ
                [Production] "ผลิตซ้ำ"                    │
                → gen Batch run+1 ──► วนกลับ QC          ▼
                                              (ทุก PRD ของ PO พร้อมส่งมอบ)
                                                         ▼
                                              PO = พร้อมจัดส่ง (Ready to Deliver) ──► โผล่คิวจัดส่ง
                                                         │  [Shipping] สร้างรอบ (Shipment) + DN (1 DN=1 PO)
                                                         ▼         SHP-{YYYYMMDD}-{NNNN} / DN-{YYYYMMDD}-{NNNNN}
                                              PO = กำลังจัดส่ง (Shipment In-Route)
                                                         │  [Shipping] ส่งถึง + ลูกค้าเซ็น
                                                         ▼
                                              PO = ส่งถึงแล้ว (Delivered) ──► เริ่มนับเครดิต
                                                         │  [Finance] ออกใบแจ้งหนี้ (ได้ตั้งแต่ Confirmed)   INV-{YYYY}-{NNNNNN}
                                                         ▼
                                              billing = วางบิลแล้ว → (รับชำระ) → ชำระแล้ว / (เลยเครดิต) → เกินกำหนด
```
**เส้นวัตถุดิบ (ขนาน):** PO วัตถุดิบขาด → **PR** (PR-{NNNNNN}) → [Stock] **Goods Receipt** (GR-{YYYYMMDD}-{NNN}) → gen **Lot** (รอตรวจรับ) + **บวก stock กลับ/ชดเชยติดลบ + FIFO retro-link** → [QC] ตรวจรับ → Lot พร้อมใช้ → ใช้ในการผลิต Batch
**หมายเหตุ negative stock:** ถ้าผลิตก่อนของเข้า → Batch ตัด stock ติดลบ (badge แดงหน้า stock) → GR เข้ามาบวกกลับ + ผูก Lot ย้อน FIFO ให้ genealogy ครบ (notice "ชดเชยยอดติดลบ")
**หมายเหตุ reservation (r5):** Confirmed=จอง (Available ลด) · เริ่มผลิต=ตัดจริง (Option A) · Cancel=คืนจอง · ดู `stock-reservation.md`

---

## 4. ตรวจ mockups ปัจจุบัน สอดคล้องนิยามนี้ไหม (รายการแก้ — ไม่แก้เอง)
| จุด | สถานะ | รายการแก้ (ให้ UX/UI) |
|---|---|---|
| **PRD manual accept (รอรับงาน → รับงาน)** | ⚠ ต้องแก้ | **เดิม mockup ทำ PRD auto ตอน Confirm** — ต้องเพิ่ม **คิว "รอรับงาน" + ปุ่ม "รับงาน"** ในหน้า production; เลข PRD ออกตอนกดรับงาน (ก่อนกด = ยังไม่มีเลข PRD) |
| **Negative stock display** | ⚠ ต้องเพิ่ม | stock.html: ยอดติดลบ = **สีแดง + badge "ติดลบ (รอรับเข้า)"**; production: เตือน "จะตัด stock ติดลบ X หน่วย" ตอนรับงาน/เริ่มผลิต |
| **GR negative notice + FIFO retro-link** | ⚠ ต้องเพิ่ม | goods-receipt: กล่องแจ้ง **"การรับนี้ชดเชยยอดติดลบ X หน่วย (ผูก Lot ย้อน FIFO)"** ก่อนยืนยัน; trace: แสดง Lot ที่ผูกย้อนใน genealogy |
| **★ Stock 3 ยอด (Reservation r5)** | ⚠ ต้องเพิ่ม | stock.html: แสดง **คงคลัง/จองแล้ว/ใช้ได้** ต่อวัตถุดิบ + badge "จองเกิน" เมื่อ available ติดลบ · po-create: เช็ค available · dashboard "ใกล้หมด": เกณฑ์ available (รอปอนด์ยืนยันจุดตัดจริง) |
| 1 line = 1 PRD | ✅ ตรง | production แสดง PRD ต่อ line ของ PO-181 |
| Batch เกิดตอนเริ่มผลิต (ไม่ใช่ส่งตรวจ) | ✅ ตรง | production alert อธิบายชัด |
| **PRD numbering format** | ✅ แก้แล้ว (ux-ui prd-format-fix) | `PRD-{YYYYMM}-{NNNNNN}` แล้วที่ production/dashboard/qc/settings/po-detail |
| **po-detail แสดง PRD ต่อ line** | ✅ แก้แล้ว (ux-ui prd-format-fix) | มีคอลัมน์ PRD ต่อ line แล้ว (ปรับให้แสดง "รอรับงาน" เมื่อยังไม่รับงาน — รวมในงาน manual-accept ข้างบน) |
| คำศัพท์สถานะ PRD สม่ำเสมอ | ⚠ ตรวจ | dashboard(ฝ่ายผลิต) ใช้คำ รอรับงาน/รับงาน/กำลังผลิต/รอ QC/พร้อมส่งมอบ/Hold/Rework ตรงกับ production |

---

## 5. คำถามถึงปอนด์
- **r4 (3 ข้อ): ตอบครบแล้ว ✅** — (1) PRD **ไม่ auto** ฝ่ายผลิตกด "รับงาน" เอง (เพิ่มคิว "รอรับงาน") · (2) **1 line = 1 PRD** ✅ · (3) วัตถุดิบขาด**ไม่บล็อก** + อนุญาต **stock ติดลบ** (GR บวกกลับ + FIFO retro-link + โชว์ชัด)
- **Deletion Policy: ตอบครบ 7 ข้อ ล็อกแล้ว ✅** — ดู `deletion-policy.md`
- **★ r5 Stock Reservation: มี 5 คำถามค้าง (จุดตัดจริงสำคัญสุด)** — ดู `stock-reservation.md` §8: (1) ตัดจริงตอนไหน [PO แนะนำ เริ่มผลิต] (2) เกณฑ์ใกล้หมด available/on_hand (3) จองเกิน available (4) rework material (5) มูลค่าสต็อก on_hand เท่านั้น
