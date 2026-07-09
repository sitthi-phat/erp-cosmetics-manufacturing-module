# Entity Status Map — ESSENCE Hub System (แผนที่สถานะฉบับเดียวจบ)

เอกสารสำหรับปอนด์ (+ BA/Engineer/QA เป็น source of truth เรื่อง lifecycle) · เขียนโดย PO · 2026-07-09
เป็น **ความจริงหลัก** เรื่อง entity/สถานะ/ใครเปลี่ยน/cascade · `status-journeys.md` อ้างอิงเอกสารนี้ (sync แล้ว ไม่ให้มี 2 ความจริง)

## สรุปภาษาไทย
ตอบชัด: **PO ยืนยันแล้ว → ระบบสร้าง "ใบสั่งผลิต (PRD)" ให้อัตโนมัติ 1 ใบต่อ line (สถานะเริ่ม = รับงาน)** ฝ่ายผลิตไม่ต้องกดรับ แต่กด **"เริ่มผลิต"** เพื่อ **gen เลข Batch** (Batch เกิดตอนนี้ ไม่ใช่ตอนส่งตรวจ QC) · **1 PO : N PRD (N = จำนวน line) : M Batch (M ≥ N, +1 ต่อการ rework)** · Batch ผ่าน QC → PRD line = พร้อมส่งมอบ → ทุก PRD ของ PO พร้อม → PO = พร้อมจัดส่ง

---

## ตอบคำถามปอนด์ 4 ข้อ (กระชับ)
1. **สร้าง PO ที่ไม่ใช่ร่าง:** กด "ยืนยัน PO" → PO(ราง fulfilment) = **"ยืนยันแล้ว (Confirmed)"** · **ส่งต่อผลิตแบบอัตโนมัติ** — ระบบ **สร้าง PRD (ใบสั่งผลิต) ให้เองตอน Confirm** (1 ใบ/line) สถานะ **"รับงาน"** โผล่คิวฝ่ายผลิตทันที (ฝ่ายผลิต**ไม่ต้องกดรับเอง**) → ฝ่ายผลิตกด "เริ่มผลิต" เมื่อพร้อมทำ **[เสนอ default — ดู Q ปอนด์ ข้อ 1 ท้ายไฟล์]**
2. **เลข PRD เกิดตอน:** **ตอน PO Confirmed (auto)** · **1 line item = 1 PRD** (แต่ละสินค้าผลิตแยก ใช้ BOM/lot ต่างกัน + QC ราย line) → 1 PO มี N line = **N PRD** · format `PRD-{YYYYMM}-{NNNNNN}`
3. **เลข Batch เกิดตอน:** ฝ่ายผลิตกด **"เริ่มผลิต"** ของ PRD นั้น → gen **Batch run แรก** `B-{PO}-{line}-1` · การเกิด/เปลี่ยน Batch cascade ขึ้นไป: Batch(กำลังผลิต) → PRD(กำลังผลิต) · Batch(รอ QC) → PRD(รอ QC) · **Batch ผ่าน QC → PRD line = พร้อมส่งมอบ** · **ทุก PRD ของ PO พร้อมส่งมอบ → PO = พร้อมจัดส่ง** · Batch ไม่ผ่าน → PRD = Rework(กลับกำลังผลิต) + gen Batch run ถัดไป
4. **"ส่งตรวจคุณภาพ" สร้าง Batch ไหม?** **ไม่ใช่** — Batch สร้างตอน **"เริ่มผลิต"** (ตามที่ตกลง) · "ส่งตรวจ QC" คือ **Batch ที่มีอยู่แล้วเปลี่ยนสถานะ** (กำลังผลิต → รอ QC) แล้วส่งไปหน้า QC เท่านั้น · Batch สร้างครั้งเดียวต่อ run (+ run ใหม่เฉพาะตอน rework)

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
| ยืนยันแล้ว (Confirmed) | Sale (กดยืนยัน) | ยืนยัน PO → **auto สร้าง PRD** |
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
**นิยาม (ใหม่ — เดิม status-journeys ไม่ได้แยกชื่อ):** ใบสั่งผลิต **1 ใบต่อ 1 line item** สร้าง**อัตโนมัติเมื่อ PO Confirmed** · เป็น "งาน" ที่ฝ่ายผลิตเห็นในคิว · 1 PRD มีได้หลาย Batch (run) เมื่อ rework
| สถานะ PRD | ใครเปลี่ยน | เกิดตอน |
|---|---|---|
| รับงาน (Received) | auto (จาก PO Confirmed) | PO ยืนยัน |
| กำลังผลิต (In Progress) | Production (กด "เริ่มผลิต") | → gen Batch run แรก |
| รอ QC | Production (กด "ส่งตรวจ QC") | Batch ผลิตเสร็จส่งตรวจ |
| พร้อมส่งมอบ (Ready to Deliver) | auto (Batch ล่าสุด QC ผ่าน) | QC ผ่าน |
| Rework (กลับกำลังผลิต) | auto (Batch QC ไม่ผ่าน) | QC ตีกลับ → gen Batch run ถัดไป |
| พักงาน (Hold) | Production (บังคับ comment + raise Sale/Stock) | ติดปัญหา |
> overlay: **เสี่ยงล่าช้า (Potential Delay)** = auto (เกณฑ์ 2 วันผลิต + 1 วันส่ง)

### 1.5 ★ Batch — รุ่นการผลิต · `B-{PO}-{line}-{run}` · หน้า: production / qc / trace
**นิยาม:** รุ่นผลิตจริง 1 รอบของ PRD · gen ตอน "เริ่มผลิต" · run เพิ่มทีละ 1 เมื่อ rework · ผูก PO/line/Lot วัตถุดิบที่ใช้
| สถานะ Batch | ใครเปลี่ยน | เกิดตอน |
|---|---|---|
| กำลังผลิต | auto (gen ตอนเริ่มผลิต) | PRD เริ่มผลิต |
| รอ QC | Production (ส่งตรวจ) | ผลิตเสร็จ |
| QC ผ่าน | **QC (หน้า qc เท่านั้น)** | ตัดสินผ่าน |
| QC ไม่ผ่าน | **QC (หน้า qc เท่านั้น)** + feedback บังคับ | ตัดสินไม่ผ่าน → PRD Rework |
> หน้า production **ไม่มีปุ่มตัดสิน QC** — เห็นผล + รับงานกลับเท่านั้น

### 1.6 Lot วัตถุดิบ · `{supplier prefix}{YYMM}` (เช่น L-GLY-2607) · หน้า: stock / goods-receipt / qc / trace
| สถานะ Lot | ใครเปลี่ยน | เกิดตอน |
|---|---|---|
| รอตรวจรับ (รอ QC ขาเข้า) | auto (gen ตอน Goods Receipt) | บันทึกรับเข้า |
| พร้อมใช้ผลิต | QC (ตรวจรับผ่าน) | QC ขาเข้าผ่าน (+อาจปิด PR) |
| ระงับ (ไม่ผ่าน) | QC (ไม่ผ่าน) → ทำใบคืนของ | QC ขาเข้าไม่ผ่าน |
| หมด/ตัดสต็อก | auto (ใช้ในการผลิต/Return) | ตัด stock |

### 1.7 PR — คำขอสั่งซื้อ · `PR-{NNNNNN}` · หน้า: purchase-request / pr-create
| สถานะ | ใครเปลี่ยน | เกิดตอน |
|---|---|---|
| เปิดคำขอ (Open) | auto (PO วัตถุดิบขาด) / Stock (สร้างตรง) | วัตถุดิบขาด/สร้างเอง |
| รับทราบ (Acknowledged) | Stock (manual) | รับทราบ |
| รับบางส่วน (Partially) | auto (GR รับไม่ครบ) | รับบางส่วน → เสนอสร้าง PR ใหม่ (user review) |
| ของเข้าครบ (Fulfilled) | auto (GR รับครบ ผูก lot) | รับครบ |
| ปิดคำขอ (Closed) / ยกเลิก | Stock (manual, ยกเลิกบังคับ comment) | ปิด/ยกเลิก |

### 1.8 GR — ใบรับเข้า · `GR-{YYYYMMDD}-{NNN}` · หน้า: goods-receipt
event บันทึกรับเข้า (header 1 supplier + หลาย line) → **gen Lot รายบรรทัด** + **ปิด/อัปเดต PR ที่อ้าง** · ผู้ทำ = Stock · (ไม่มี lifecycle ยาว — เป็นเอกสารบันทึก)

### 1.9 Shipment (รอบจัดส่ง) · `SHP-{YYYYMMDD}-{NNNN}` · หน้า: shipping / delivery-note
| สถานะรอบ | ใครเปลี่ยน | เกิดตอน |
|---|---|---|
| รับเข้ารอบ (Received) | Shipping (สร้างรอบจาก PO พร้อมจัดส่ง) | สร้างรอบ (+คนขับ/เบอร์/route/ประเภทรถ) |
| กำลังนำส่ง (In-Route) | Shipping | ออกวิ่ง |
| จบรอบ (Closed) | auto | ทุก DN ในรอบถึงสถานะสุดท้าย |

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
| 1 | **PO Draft → ยืนยันแล้ว** (Sale) | **ระบบ gen PRD ต่อ line = "รับงาน"** + PO=กำลังผลิต(เมื่อเริ่มผลิต); ลูกค้า Lead→Active (ใบแรก) | po-detail, production (คิว), customers | Production |
| 2 | **PRD รับงาน → กำลังผลิต** (Production "เริ่มผลิต") | **gen Batch run แรก** `B-{PO}-{line}-1` (กำลังผลิต); PO=กำลังผลิต | production | — |
| 3 | **Batch กำลังผลิต → รอ QC** (Production "ส่งตรวจ QC") | PRD=รอ QC; Batch โผล่คิว QC | production, qc | QC |
| 4 | **Batch → QC ผ่าน** (QC) | PRD line=พร้อมส่งมอบ; **ถ้าทุก PRD ของ PO ผ่าน → PO=พร้อมจัดส่ง** → โผล่คิวจัดส่ง | qc, po-detail, shipping | Shipping (เมื่อ PO พร้อม) |
| 5 | **Batch → QC ไม่ผ่าน** (QC + feedback) | Batch=ไม่ผ่าน; PRD=Rework(กลับกำลังผลิต); PO ยังไม่พร้อม | qc, production (badge Rework) | Production |
| 6 | **PRD Rework → เริ่มผลิตซ้ำ** (Production "ผลิตซ้ำ") | **gen Batch run ถัดไป** `...-{run+1}` → กลับคิว QC | production, qc | QC |
| 7 | **PRD → Hold** (Production, เหตุลูกค้า/stock) | raise Sale/Stock; (เหตุลูกค้า) Sale ตั้งลูกค้า Follow-up | production, po-detail, customers | Sale หรือ Stock |
| 8 | **PO พร้อมจัดส่ง → กำลังจัดส่ง** (Shipping สร้าง Shipment+DN) | Shipment=รับเข้ารอบ→In-Route; DN=กำลังนำส่ง | shipping, delivery-note | — |
| 9 | **DN → ส่งถึงแล้ว** (Shipping) | PO=ส่งถึงแล้ว; เริ่มนับ overdue; Shipment จบรอบเมื่อ DN ครบ | delivery-note, po-detail | Finance + Sale |
| 10 | **DN → ถูกปฏิเสธ** (Shipping) | PO=พร้อมจัดส่ง(กลับคิว) + raise Sale | delivery-note, po-list, shipping | Sale |
| 11 | **DN → เลื่อนส่ง** (Shipping) | PO=พร้อมจัดส่ง + flag Postpone+วันที่ ค้างคิว | delivery-note, shipping | Shipping |
| 12 | **ออก Invoice** (Finance) | PO billing=วางบิลแล้ว | invoices, po-detail | — |
| 13 | **Overdue** (scheduler) | billing=เกินกำหนด | invoices, dashboard(Finance) | Finance + Sale |
| 14 | **PO วัตถุดิบขาด** (ตอนเปิด PO) | เตือน(ไม่บล็อก) + gen PR(ส่วนที่ขาด) | po-create, purchase-request | Stock + Production |
| 15 | **Goods Receipt บันทึกรับ** (Stock) | gen Lot(รอตรวจรับ) รายบรรทัด + ปิด/อัปเดต PR (ครบ→Fulfilled / ไม่ครบ→รับบางส่วน + dialog PR ใหม่) | goods-receipt, purchase-request, stock | Stock/Production |
| 16 | **Lot QC ขาเข้า ผ่าน/ไม่ผ่าน** (QC) | ผ่าน→Lot พร้อมใช้ (+อาจปิด PR) / ไม่ผ่าน→Lot ระงับ→คืนของ | qc, stock, return | Stock |
| 17 | **PO ยกเลิก → เปิดใหม่(ร่าง)** (Sale/Admin) | คงเลข PO เดิม + trace lifecycle; PRD/Batch ที่เกิดแล้วถูกยกเลิกตาม (trace) | po-detail | Production |

---

## 3. แผนภาพเส้นเดียว จากต้นจนจบ (ใครทำ / gen อะไร ตอนไหน)

```
ลูกค้าสั่ง
  │  [Sale] สร้าง PO
  ▼
PO = ร่าง (Draft)                                   PO-{YYYYMM}-{NNNNNN}
  │  [Sale] กดยืนยัน
  ▼
PO = ยืนยันแล้ว (Confirmed) ──auto──► gen PRD ต่อ line (สถานะ "รับงาน")   PRD-{YYYYMM}-{NNNNNN}  (1 line = 1 PRD)
                                          │  [Production] กด "เริ่มผลิต"
                                          ▼
                                    PRD = กำลังผลิต ──auto──► gen Batch run1   B-{PO}-{line}-1  (Batch เกิดตอนนี้!)
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
**เส้นวัตถุดิบ (ขนาน):** PO วัตถุดิบขาด → **PR** (PR-{NNNNNN}) → [Stock] **Goods Receipt** (GR-{YYYYMMDD}-{NNN}) → gen **Lot** (รอตรวจรับ) → [QC] ตรวจรับ → Lot พร้อมใช้ → ใช้ในการผลิต Batch

---

## 4. ตรวจ mockups ปัจจุบัน สอดคล้องนิยามนี้ไหม (รายการแก้ — ไม่แก้เอง)
| จุด | สถานะ | รายการแก้ (ให้ UX/UI) |
|---|---|---|
| PRD auto-create ตอน PO Confirmed | ✅ ตรง | production trace แสดง "สร้างงานผลิต PRD-… จาก PO ยืนยัน" แล้ว |
| 1 line = 1 PRD | ✅ ตรง | production แสดง PRD-000091(line1)+PRD-000088(line2) ของ PO-181 |
| Batch เกิดตอนเริ่มผลิต (ไม่ใช่ส่งตรวจ) | ✅ ตรง | production alert อธิบายชัด |
| **PRD numbering format** | ⚠ ต้องแก้ | ปัจจุบัน `PRD-000091` (สั้น) → ควรเป็น **`PRD-{YYYYMM}-{NNNNNN}`** (gapless ต่อเดือน ตาม doc-numbering ที่ปอนด์ตอบ) — แก้ที่ production/dashboard/qc/settings |
| **po-detail แสดง PRD ต่อ line** | ⚠ ควรเพิ่ม | ตาราง line ปัจจุบันโชว์ Batch ล่าสุด แต่ไม่โชว์เลข PRD — เพิ่มคอลัมน์/ลิงก์ PRD ต่อ line ให้เห็น 1 line=1 PRD ชัด |
| คำศัพท์สถานะ PRD สม่ำเสมอ | ⚠ ตรวจ | ให้ dashboard(ฝ่ายผลิต) ใช้คำ รับงาน/กำลังผลิต/รอ QC/พร้อมส่งมอบ/Hold/Rework ตรงกับ production |

---

## 5. คำถามถึงปอนด์ (จุดที่ตัดสินแทนไม่ได้ — ตั้ง default ไว้แล้ว)
1. **การส่งงานเข้าผลิต:** [DEFAULT ผมเสนอ] PO Confirmed → **ระบบสร้าง PRD "รับงาน" อัตโนมัติ** (ฝ่ายผลิตไม่ต้องกดรับ แค่กด "เริ่มผลิต" เมื่อพร้อม) — หรือปอนด์ต้องการให้**ฝ่ายผลิตกด "รับงาน" ยืนยันเอง**ก่อน (เพิ่มขั้นตอน acknowledgment)? · **เหตุผล default:** ลดคลิก + PO ยืนยัน = ผูกมัดผลิตแล้ว
2. **PRD granularity:** [DEFAULT] **1 line item = 1 PRD** (ตาม mockup + QC ราย line) — ยืนยันไหม (ทางเลือก: 1 PO = 1 PRD รวมทุก line — แต่จะขัดกับ QC/rework ราย line)
3. **PO Confirmed ทั้งที่วัตถุดิบขาด:** PRD ยังถูกสร้าง (รับงาน) ไหม? [DEFAULT] สร้าง — ฝ่ายผลิตเห็นงานแต่รอวัตถุดิบเข้าก่อนกด "เริ่มผลิต" (สอดคล้อง warning-not-block)
