# Entity Status Map — ESSENCE Hub System (แผนที่สถานะฉบับเดียวจบ)

เอกสารสำหรับปอนด์ (+ BA/Engineer/QA เป็น source of truth เรื่อง lifecycle) · เขียนโดย PO · 2026-07-09 (ปรับ r4.1) · **r5 (2026-07-10): เพิ่มชั้น Stock Reservation — รายละเอียดเต็มที่ `stock-reservation.md`** · **r6 (2026-07-29): Customer §1.1 → 5 สถานะ + "ต้องติดตาม" เป็น flag แยก** · **r7 (2026-07-29): เพิ่ม §1.1b Quotation (QT) lifecycle — reseat "ตกลง (Agreed)" → "ยืนยัน (Confirmed)"** · **r7.1 (2026-07-29): REVERT — ถอด "ส่งแล้ว (Sent)" + sent-date** · **r8 (2026-07-29): เพิ่ม §1.1c BOM lifecycle (Active/Inactive) + RM/BOM/FG code = user-entered+unique+create-only-lock** · **★ r9 (2026-07-29): Production module review — PRD "พร้อมส่ง (Ready to Ship)" เป็น action ที่ QC-gated (ไม่ auto) + capture surplus; PO/SO = พร้อมส่ง เมื่อ PRD ครบ; actual qty ≥ ordered (under-production = แก้ PO ลง → follow-up+audit); consume/adjust lot = เลือก lot มี stock/FIFO; authoritative = `modules/production.md`/`modules/po.md`/`modules/stock.md`**
เป็น **ความจริงหลัก** เรื่อง entity/สถานะ/ใครเปลี่ยน/cascade · `status-journeys.md` อ้างอิงเอกสารนี้ (sync แล้ว ไม่ให้มี 2 ความจริง)

## สรุปภาษาไทย
**ปอนด์ปรับ flow (r4.1):** PO ยืนยันแล้ว → งานแต่ละ line เข้า **คิวผลิตสถานะ "รอรับงาน"** (ยัง**ไม่**เกิด PRD) → **ฝ่ายผลิตกด "รับงาน" เอง → ตอนนั้นถึงสร้าง PRD** (1 ใบต่อ line, สถานะเริ่ม = รับงาน) → กด "เริ่มผลิต" = gen เลข **Batch** · **1 PO : N PRD (N=line) : M Batch (M≥N, +1/rework)** · **วัตถุดิบขาดไม่บล็อก** — รับงาน/เริ่มผลิตได้เลย และ **ผลิตจริงตัด stock ติดลบได้** พอทำ GR ค่อยบวกกลับ · Batch ผ่าน QC → PRD line "พร้อมส่งมอบ (eligible)" → **ฝ่ายผลิตกด "พร้อมส่ง"** → PRD "พร้อมส่ง (Ready to Ship)" → ทุก PRD พร้อมส่ง → PO/SO พร้อมส่ง
**★ r5 Stock Reservation:** PO Confirmed → จอง (Reserve) วัตถุดิบ = ΣBOM×qty ต่อ line → ยอด ใช้ได้ (Available) = คงคลัง − จองแล้ว · ตัดจริง (Consume) ตอน "เริ่มผลิต" (Option A) · Cancel PO = คืน (Release) · **ดู `stock-reservation.md`**
**★ r6 Customer:** สถานะ **6 → 5** + "ต้องติดตาม" เป็น flag แยก · **Disabled/Blacklist = HARD block เปิดงานขาย QT/PO/SO** · **★ r9: flag ⚑ ถูก raise เพิ่มเมื่อ "PO ถูกแก้ไข (รวมจากบริบทการผลิต — under-production)" ให้ Sale เห็น (`modules/po.md` §5.2).**
**★ r7 Quotation:** สถานะ ร่าง/ยืนยัน/ปฏิเสธ/ยกเลิก · "ยืนยัน (Confirmed)" ตั้งโดย "Convert to PO" · ยกเลิกได้ทุกสถานะ · PO = loose ref → no cascade · **r7.1: ถอด "ส่งแล้ว (Sent)" + sent-date**.
**★ r8 BOM:** lifecycle Active/Inactive (ลบถาวรไม่ได้ → inactivate) · Inactive = HARD block เปิด QT/PO/SO + กันออก Supply Planning · รหัส BOM/FG/RM = user-entered+unique+create-only-lock.
**★ r9 Production (2026-07-29):** **PRD "พร้อมส่ง (Ready to Ship)" = action ที่ฝ่ายผลิตกด (ไม่ auto)** โดย **QC ผ่านเป็น precondition (gate)** — ไม่ผ่าน ปุ่มพร้อมส่ง disabled + popup "QC ต้องผ่านก่อน"; การกด "พร้อมส่ง" = capture surplus (D13, actual − ordered → FG) + ตั้ง Ready to Ship · **ทุก PRD ของ PO/SO พร้อมส่ง → PO/SO พร้อมส่ง (done)** · **จำนวนผลิตจริง (actual) ต้อง ≥ จำนวนสั่งเสมอ**; ผลิตน้อยกว่าสั่ง = **แก้ PO ให้จำนวนสั่ง = ผลิตจริงก่อน** (→ raise ⚑ follow-up + audit) · **consume/loss/adjust lot = เลือก lot ที่มี stock; หลาย lot = FIFO** · **ทุกการเปลี่ยนสถานะมี confirm popup** · **ปุ่ม Loss มีบนหน้าจัดการ** · **"ไปหน้า QC" เปิดเฉพาะสถานะ QC → deep-link ตรง Batch (แท็บ ตรวจแบตช์)**. authoritative = `modules/production.md`.

---

## ตอบคำถามปอนด์ (กระชับ — อัปเดตตามคำตอบ r4.1)
1. **สร้าง PO ที่ไม่ใช่ร่าง:** กด "ยืนยัน PO" → PO = **"ยืนยันแล้ว (Confirmed)"** · แต่ละ line **เข้าคิวฝ่ายผลิต "รอรับงาน"** — **ยังไม่สร้าง PRD** · **ฝ่ายผลิตกด "รับงาน" เอง** → สร้าง PRD → กด "เริ่มผลิต" · **r5: ตอน Confirmed ระบบจองวัตถุดิบ (§1.6)**
2. **เลข PRD เกิดตอน:** **ตอนฝ่ายผลิตกด "รับงาน"** · **1 line item = 1 PRD** → 1 PO N line = **N PRD** · format `PRD-{YYYYMM}-{NNNNNN}` (gapless ต่อเดือน)
3. **เลข Batch เกิดตอน:** ฝ่ายผลิตกด **"เริ่มผลิต"** → gen **Batch run แรก** `B-{PO}-{line}-1` · cascade: Batch(กำลังผลิต)→PRD(กำลังผลิต) · Batch(รอ QC)→PRD(รอ QC) · **Batch ผ่าน QC → PRD line = พร้อมส่งมอบ (eligible)** → **[r9] ฝ่ายผลิตกด "พร้อมส่ง" → PRD = พร้อมส่ง (Ready to Ship)** · **ทุก PRD ของ PO พร้อมส่ง → PO = พร้อมส่ง** · Batch ไม่ผ่าน → PRD = Rework + gen Batch run ถัดไป
4. **"ส่งตรวจคุณภาพ" สร้าง Batch ไหม?** **ไม่ใช่** — Batch สร้างตอน **"เริ่มผลิต"** · "ส่งตรวจ QC" = Batch ที่มีอยู่เปลี่ยนสถานะ

**★ วัตถุดิบขาด + Negative Stock (ปอนด์ตอบ r4.1):** วัตถุดิบไม่พอ **ไม่บล็อก** — กด "รับงาน" ได้เลย + **เตือน** · **อนุญาตตัด stock ติดลบ** · GR → **บวก stock กลับ + FIFO retro-link** + **ต้องแสดงชัดว่าเคยติดลบ** (§1.6 + §4)

**ความสัมพันธ์เชิงตัวเลข:** **1 PO : N PRD (N=line) : M Batch (M≥N; +1 ทุกครั้ง rework)** · 1 PO : 1..K DN · 1 Shipment : หลาย DN · 1 PO : 1 Invoice (+versions)

---

## 1. รายการ Entity + สถานะของตัวเอง

### 1.1 Customer · `CUS-{NNNNNN}` · หน้า: customers / customer-detail
**r6 (2026-07-29): 5 สถานะหลัก + "ต้องติดตาม" เป็น flag แยก** (ดู `modules/customer.md` §4/§4.1/§4.2 — authoritative)

| สถานะ (enum r2) | ใครเปลี่ยน | เกิดตอน |
|---|---|---|
| ผู้สนใจ (Lead) | ระบบ (สร้างลูกค้า) | สร้างลูกค้าใหม่ |
| ลูกค้าประจำ (Active) | auto (มี PO ใบแรก) | ยืนยัน PO ใบแรก |
| ห่างหาย (Inactive) | auto scheduler (default 3 ด.) | ครบรอบไม่มี order |
| ปิดใช้งาน (Disabled) | Sale Manager / Admin (บังคับ comment) | manual · **→ HARD block เปิด QT/PO/SO** |
| บัญชีดำ (Blacklist) | Sale Manager / Admin (บังคับ comment) | manual · **→ HARD block เปิด QT/PO/SO** |

**★ Follow-up flag (attribute แยกจาก status — r6):**
| attribute | ใครตั้ง/เคลียร์ | เกิดตอน |
|---|---|---|
| **⚑ ต้องติดตาม (Follow-up flag)** = boolean + เหตุผล + ใคร/เมื่อ | Sale / Sale Manager (manual) หรือ auto จาก cascade | manual (ติดเงิน) หรือ auto (PRD Hold เหตุลูกค้า, Invoice Overdue, **★ r9: PO ถูกแก้ไข รวมจากบริบทการผลิต — under-production, `modules/po.md` §5.2**) |

- **flag ควบคู่ได้ทุกสถานะ** · **UI: แยก badge ⚑ ออกจาก status badge** + filter ได้.
- **★ DECIDED (ถอด "Follow-up" ออกจาก enum, 6→5)** — `modules/customer.md` §12.
- **Soft-delete** ได้เสมอ — PO เดิมเดินต่อ, ห้ามเปิด order ใหม่.

### 1.1b ★ Quotation (QT — OEM) · `QT-{YYYYMM}-{NNNNNN}` · หน้า: quotation-list / quotation-create / quotation-detail
**r7 (2026-07-29): authoritative = `modules/quotation.md` §4.** สาย OEM เท่านั้น. **r7.1: ถอด "ส่งแล้ว (Sent)" + sent-date.**

| สถานะ QT | ใครเปลี่ยน | เกิดตอน |
|---|---|---|
| ร่าง (Draft) | Quotation.C | บันทึกครั้งแรก (ออกเลข QT) |
| **ยืนยัน (Confirmed)** ★ | Quotation.U (**กด "Convert to PO"**) | ลูกค้าตกลง → กด Convert → ตั้งทันที + immutable |
| ปฏิเสธ (Rejected) | Quotation.U | ลูกค้าไม่ตกลง |
| ยกเลิก (Cancelled) | Quotation.D/Approve (บังคับเหตุผล) | **กดได้ทุกสถานะ** → activity-log + gapless |

- **★ ไม่มี "ส่งแล้ว (Sent)"/sent-date** — การส่ง = print/share.
- **แก้ = เวอร์ชันใหม่เสมอ** · ไม่มี Expired.
- **Convert to PO:** กดได้เมื่อ QT = **Draft** + ลูกค้าไม่ Disabled/Blacklist + BOM/FG ไม่ Inactive → ตั้ง Confirmed → เลือกสร้าง PO เดี๋ยวนี้/ทีหลัง (banner).
- **PO = loose reference** → ยกเลิก QT ไม่ cascade.

### 1.1c ★ BOM (สูตร/FG master) · รหัส = รหัส FG (user-entered, shared, 1:1) · หน้า: bom / bom-create · **r8 (2026-07-29)**
**authoritative = `modules/bom.md` §2b/§5/§5c.**

| สถานะ BOM | ใครเปลี่ยน | เกิดตอน / ผล |
|---|---|---|
| **Active (ใช้งาน)** | default ตอนสร้าง | เปิด QT/PO/SO ได้ · โผล่ Supply Planning (ถ้า TYPE=FG) |
| **Inactive (ปิดใช้งาน)** | BOM.**Delete** (inactivate) · reactivate = BOM.**Update** | **HARD block เปิด QT/PO/SO ใหม่** + **กันออกจาก Supply Planning** · **★ ไม่กระทบ:** PRD/Batch/QT/PO/SO/FG stock ที่วิ่งอยู่แล้ว |

- **★ รหัส BOM = รหัส FG (1:1, shared):** user-entered + unique + **create-only-lock**. **รหัส RM เช่นเดียวกัน.**
- **ไม่มี hard delete** — "ลบ" = Inactivate.

### 1.2 PO — ราง Fulfilment · `PO-{YYYYMM}-{NNNNNN}` · หน้า: po-create / po-detail / po-list
| สถานะ | ใครเปลี่ยน | เกิดตอน |
|---|---|---|
| ร่าง (Draft) | Sale | สร้าง PO |
| ยืนยันแล้ว (Confirmed) | Sale (กดยืนยัน) | ยืนยัน PO → **แต่ละ line เข้าคิวผลิต "รอรับงาน"** + **จองวัตถุดิบ (r5)** |
| กำลังผลิต (In Production) | auto (จาก PRD เริ่มผลิต) | PRD ใด ๆ เริ่มผลิต |
| **พร้อมส่ง / พร้อมจัดส่ง (Ready to Ship)** | auto (**★ r9: ทุก PRD ถูกกด "พร้อมส่ง" ครบ**) | ทุก line ผ่าน QC + กดพร้อมส่ง |
| กำลังจัดส่ง (In Delivery) | auto (DN ออกวิ่ง) | Shipment In-Route |
| ส่งถึงแล้ว (Delivered) | auto (DN Delivered) | ลูกค้าเซ็นรับ |
| ยกเลิก (Cancelled) → เปิดใหม่เป็น ร่าง | Sale/Admin (บังคับ comment) · reopen คงเลข | ทุกขั้น |
> force override = Admin + เหตุผล + trace
> **Create-time gate (r6/r8):** เปิด/ยืนยัน PO ให้ลูกค้า **Disabled/Blacklist ไม่ได้** · **BOM/FG Inactive ไม่ได้** (HARD block)
> **★ r9 — แก้ PO (po.md §5.2):** การแก้ PO ทุกครั้ง **รวมจากบริบทการผลิต (under-production ลดจำนวนสั่งให้ = ผลิตจริง)** → **raise ⚑ follow-up ที่ลูกค้า (ให้ Sale เห็น) + audit ละเอียดระดับ field (who/when/old→new)** · แก้จำนวน line → ปรับ reservation (delta)
> **หมายเหตุ vs QT (r7):** "PO Confirmed" ≠ "QT Confirmed". สร้าง PO จาก QT → PO เริ่ม **ร่าง (Draft)**.

### 1.3 PO — ราง Billing · หน้า: invoices / invoice-detail / po-detail
| สถานะ | ใครเปลี่ยน | เกิดตอน |
|---|---|---|
| ยังไม่วางบิล (Not Invoiced) | (เริ่มต้น) | — |
| วางบิลแล้ว (Invoiced) | Finance/Sale (ออก invoice ได้ตั้งแต่ Confirmed) | ออกใบแจ้งหนี้ |
| ชำระแล้ว (Paid) | Finance | รับชำระครบ |
| เกินกำหนด (Overdue) | auto scheduler | ส่งของแล้ว + เลยเครดิต + ยังไม่จ่าย |
> **r6:** ยอด billing = ฐานของ Customer financial summary (`modules/customer.md` §7).

### 1.4 ★ PRD — ใบสั่งผลิต (Production Order) · `PRD-{YYYYMM}-{NNNNNN}` · หน้า: production (+ dashboard/qc/po-detail อ้างอิง)
**นิยาม:** ใบสั่งผลิต **1 ใบต่อ 1 line item** · **สร้างเมื่อฝ่ายผลิตกด "รับงาน"** · 1 PRD มีได้หลาย Batch (run) เมื่อ rework
> **ก่อนเกิด PRD:** PO Confirmed สร้าง **"รายการคิวรอรับงาน" ต่อ line** สถานะ **"รอรับงาน (Awaiting Acceptance)"** — ยังไม่มีเลข PRD · ฝ่ายผลิตกด **"รับงาน"** จึง gen PRD

| สถานะ PRD | ใครเปลี่ยน | เกิดตอน |
|---|---|---|
| *(pre)* รอรับงาน (Awaiting Acceptance) | auto (จาก PO Confirmed) — เป็นคิว ยังไม่ใช่ PRD | PO ยืนยัน |
| รับงาน (Received) | **Production (กด "รับงาน")** → **gen เลข PRD** | ฝ่ายผลิตรับงาน (confirm popup) |
| กำลังผลิต (In Progress) | Production (กด "เริ่มผลิต") | → gen Batch run แรก + consume lot (เลือก lot มี stock; หลาย lot = FIFO) |
| รอ QC / ส่งตรวจคุณภาพ | Production (กด "ส่งตรวจ QC") | Batch ผลิตเสร็จส่งตรวจ |
| **พร้อมส่งมอบ (eligible, QC ผ่าน)** | auto (Batch ล่าสุด QC ผ่าน) | QC ผ่าน → **เปิดสิทธิ์กด "พร้อมส่ง"** (ยังไม่ Ready to Ship) |
| **★ พร้อมส่ง (Ready to Ship)** | **Production (กด "✓ พร้อมส่ง")** — **QC-gated (r9)** | **capture surplus (actual − ordered → FG, D13) + confirm popup** · ต้อง QC ผ่านก่อน (ไม่ผ่าน = ปุ่ม disabled + popup "QC ต้องผ่านก่อน") |
| Rework (กลับกำลังผลิต) | auto (Batch QC ไม่ผ่าน) | QC ตีกลับ → gen Batch run ถัดไป |
| พักงาน (Hold) | Production (บังคับ comment + raise Sale/Stock) | ติดปัญหา |
> overlay: **เสี่ยงล่าช้า (Potential Delay)** = auto (2 วันผลิต + 1 วันส่ง)
> **★ r9 — จำนวนผลิตจริง (actual qty):** ฝ่ายผลิตกรอก actual (D13) · **ต้อง ≥ จำนวนสั่งเสมอ** (validation, `modules/production.md` §5c) · ผลิตน้อยกว่าสั่ง = **แก้ PO ให้จำนวนสั่ง = ผลิตจริงก่อน** (→ follow-up + audit) · over-production → surplus → FG ตอนพร้อมส่ง
> **★ r9 — roll-up:** ทุก PRD ของ PO/SO = พร้อมส่ง (Ready to Ship) → **PO/SO = พร้อมส่ง (done)** · produce-to-stock (ไม่ผูกลูกค้า): กด "พร้อมส่ง" → FG เข้าคลังเต็มจำนวนผลิตจริง (ส่ง 0)
> **★ r9 — "ไปหน้า QC":** ปุ่ม "ไปหน้า QC ›" เปิดได้เฉพาะสถานะ **ส่งตรวจคุณภาพ (QC)** → deep-link ไป qc แท็บ "ตรวจแบตช์" ที่ Batch นั้นตรง (`modules/qc.md` §9) · **ปุ่ม Loss มีบนหน้าจัดการ (confirm popup ทุกครั้ง)** · **ทุกการเปลี่ยนสถานะ = confirm popup**
> **วัตถุดิบขาดไม่บล็อก:** รับงาน/เริ่มผลิตได้แม้ stock ไม่พอ (§1.6 negative stock)
> **สีป้าย Rework (r5):** PRD Rework = **สีฟ้า (processing)** — งานกลับมาผลิต ไม่ใช่ error · ในคิว "รับแล้ว" ถือเป็นส่วนของกลุ่ม "กำลังผลิต" สำหรับ ordering (`modules/production.md` §6.2)
> **หมายเหตุ r8:** BOM ถูก Inactivate ระหว่าง PRD/Batch กำลังผลิต → **PRD/Batch เดินต่อจนจบได้**.

### 1.5 ★ Batch — รุ่นการผลิต · `B-{PO}-{line}-{run}` · หน้า: production / qc / trace
**นิยาม:** รุ่นผลิตจริง 1 รอบของ PRD · gen ตอน "เริ่มผลิต" · run เพิ่มทีละ 1 เมื่อ rework · ผูก PO/line/Lot วัตถุดิบที่ใช้
| สถานะ Batch | ใครเปลี่ยน | เกิดตอน |
|---|---|---|
| กำลังผลิต | auto (gen ตอนเริ่มผลิต) → **ตัด stock วัตถุดิบ (เลือก lot มี stock; หลาย lot = FIFO; ติดลบได้)** | PRD เริ่มผลิต |
| รอ QC | Production (ส่งตรวจ) | ผลิตเสร็จ |
| QC ผ่าน | **QC (หน้า qc เท่านั้น)** | ตัดสินผ่าน → PRD line eligible กด "พร้อมส่ง" |
| QC ไม่ผ่าน | **QC (หน้า qc เท่านั้น)** + feedback บังคับ | ตัดสินไม่ผ่าน → PRD Rework |
> หน้า production **ไม่มีปุ่มตัดสิน QC** — เห็นผล + "ไปหน้า QC ›" (นำทาง) เท่านั้น

### 1.6 Lot วัตถุดิบ + Stock (+ Reservation r5) · `{supplier prefix}{YYMM}` · หน้า: stock / goods-receipt / qc / trace
> **★ r8: รหัส RM (master) = user-entered + unique + create-only-lock** — เลข Lot ยัง gen อัตโนมัติจาก supplier prefix ตอน GR (`modules/stock.md` §3b).

| สถานะ Lot | ใครเปลี่ยน | เกิดตอน |
|---|---|---|
| รอตรวจรับ (รอ QC ขาเข้า) | auto (gen ตอน Goods Receipt) | บันทึกรับเข้า |
| พร้อมใช้ผลิต | QC (ตรวจรับผ่าน) | QC ขาเข้าผ่าน (+อาจปิด PR) |
| ระงับ (ไม่ผ่าน) | QC (ไม่ผ่าน) → ทำใบคืนของ | QC ขาเข้าไม่ผ่าน |
| หมด/ตัดสต็อก | auto (ใช้ในการผลิต/Return) | ตัด stock |

**★ Stock Reservation / 3 ยอด (r5) · ดู `stock-reservation.md`:**
- **3 ยอดต่อวัตถุดิบ:** **คงคลัง (on_hand)** (ติดลบได้) · **จองแล้ว (Reserved)** (≥0) · **ใช้ได้ (Available) = on_hand − Reserved** (ติดลบได้)
- **Reservation lifecycle:** **จอง** ตอน PO Confirmed → **ใช้จริงแล้ว (Consumed)** ตอน "ตัดจริง" → **คืนแล้ว (Released)** ตอน cancel/แก้ลด
- **★ จุด "ตัดจริง" = Option A "เริ่มผลิต" ราย Batch** (คง GMP Batch↔Lot) · **★ r9: consume เลือกเฉพาะ lot ที่มี stock; หลาย lot = FIFO (lot เก่าสุดก่อน)** (`modules/production.md` §5d)
- **Cancel PO** → release reservation ที่ยังไม่ consume · จองเกิน available = เตือนไม่บล็อก

**★ Loss / Adjust (RM) — 2 action (Stock review) + ★ r9 Adjust อ้าง Lot/FIFO:**
- **Loss (ตัดคงคลัง −)** อ้าง **Lot (เลือก lot มี stock **หรือ** "FIFO")** · **Adjust (ปรับยอด +)** — **★ r9: ตอนนี้ต้องอ้าง Lot เสมอ (เลือก lot **หรือ** "FIFO"=lot เก่าสุดก่อน)** (เดิม RM-only) — `modules/stock.md` §5.1/§6.
- ทั้งคู่: เหตุผลบังคับ + ledger source (D15) · ปุ่ม "บันทึก (คงคลัง)".

**★ Negative Stock Rule (ปอนด์ตอบ r4.1):**
- การผลิต (Batch เริ่มผลิต) **ตัด stock ได้แม้ไม่พอ → ติดลบได้** (ไม่บล็อก) · ทุกครั้ง **บันทึก trace**
- **Goods Receipt** → **บวก stock กลับ** (ชดเชยติดลบก่อน)
- **★ FIFO retro-link (GMP):** GR ชดเชยยอดติดลบ → ผูก consumption ที่ตัดติดลบไว้เข้ากับ Lot ใหม่แบบ FIFO อัตโนมัติ → **Batch ↔ Lot ครบสายย้อนหลัง** · retro-link บันทึก trace ทุกครั้ง
- **จุดแสดงผลบังคับ (UX/UI):**
  - **stock.html:** **3 ยอด** · on_hand ติดลบ = **แดง + badge "ติดลบ (รอรับเข้า)"** · available ติดลบ = "จองเกิน (รอรับเข้า)"
  - **production:** เตือน "จะตัด stock ติดลบ X หน่วย" ตอนรับงาน/เริ่มผลิต
  - **goods-receipt:** กล่องแจ้ง "ชดเชยยอดติดลบ X หน่วย (ผูก Lot ย้อน FIFO)" ก่อนยืนยัน
  - **trace:** genealogy Batch แสดง Lot ที่ผูกย้อน FIFO

### 1.7 PR — คำขอสั่งซื้อ · `PR-{NNNNNN}` · หน้า: purchase-request / pr-create
| สถานะ | ใครเปลี่ยน | เกิดตอน |
|---|---|---|
| เปิดคำขอ (Open) | auto (PO วัตถุดิบขาด) / Stock | วัตถุดิบขาด/สร้างเอง |
| รับทราบ (Acknowledged) | Stock | รับทราบ |
| รับบางส่วน (Partially) | auto (GR รับไม่ครบ) | รับบางส่วน |
| ของเข้าครบ (Fulfilled) | auto (GR รับครบ) | รับครบ |
| ปิดคำขอ (Closed) / ยกเลิก | Stock (ยกเลิกบังคับ comment) | ปิด/ยกเลิก |

### 1.8 GR — ใบรับเข้า · `GR-{YYYYMMDD}-{NNN}` · หน้า: goods-receipt
event บันทึกรับเข้า → **gen Lot รายบรรทัด** + ปิด/อัปเดต PR + **บวก stock กลับ (ชดเชยติดลบ + FIFO retro-link)** · **r5: on_hand เพิ่ม → Available เพิ่มอัตโนมัติ**

### 1.9 Shipment (รอบจัดส่ง) · `SHP-{YYYYMMDD}-{NNNN}` · หน้า: shipping / delivery-note
| สถานะรอบ | ใครเปลี่ยน | เกิดตอน |
|---|---|---|
| รับเข้ารอบ (Received) | Shipping (สร้างรอบจาก PO พร้อมส่ง) | สร้างรอบ |
| กำลังนำส่ง (In-Route) | Shipping | ออกวิ่ง |
| จบรอบ (Closed) | auto | ทุก DN ถึงสถานะสุดท้าย |
> "ส่งบางส่วน (Partially)" = ป้าย reconcile/มุมมองสรุปรอบ ไม่ใช่ lifecycle status

### 1.10 DN — ใบจัดส่ง (1 ใบ = 1 PO) · `DN-{YYYYMMDD}-{NNNNN}` · หน้า: delivery-note
| สถานะ DN | ใครเปลี่ยน | เกิดตอน |
|---|---|---|
| กำลังนำส่ง (In-Route) | Shipping | รอบออกวิ่ง |
| ส่งถึงแล้ว (Delivered) | Shipping (ลูกค้าเซ็น) | ส่งถึง → PO Delivered |
| ถูกปฏิเสธ (Rejected) | Shipping | ลูกค้าปฏิเสธ → PO กลับพร้อมส่ง + raise Sale |
| เลื่อนส่ง (Postponed) | Shipping | เลื่อน → PO พร้อมส่ง + flag |

### 1.11 Invoice · `INV-{YYYY}-{NNNNNN}` · หน้า: invoices / invoice-detail / invoice-print
รอชำระ / ชำระแล้ว / เกินกำหนด + **versioning** · ผู้ทำ = Finance · **r6:** ฐานของ Customer financial summary

---

## 2. Cascade Table (X เปลี่ยน → Y เปลี่ยน → เห็นที่หน้า → noti ไปหา)
| # | ต้นเหตุ (ใคร) | ผล cascade | เห็นที่หน้า | noti |
|---|---|---|---|---|
| 0 | **★ QT → ยืนยัน (Confirmed)** (r7) | ตั้ง QT=Confirmed (immutable); ไม่บังคับให้เกิด PO; สร้าง PO → loose ref; ยกเลิก QT = ไม่ cascade | quotation-detail, po-create | — |
| 1 | **PO Draft → ยืนยันแล้ว** (Sale) | line เข้าคิว "รอรับงาน"; **+ จองวัตถุดิบ (r5)**; ลูกค้า Lead→Active | po-detail, production, stock, customers | Production |
| 2 | **รอรับงาน → รับงาน** (Production, confirm popup) | **gen เลข PRD** (สถานะ รับงาน) | production | — |
| 3 | **PRD รับงาน → กำลังผลิต** (Production "เริ่มผลิต") | **gen Batch run แรก**; **ตัด stock จริง (เลือก lot มี stock; หลาย lot = FIFO; ติดลบได้)**; PO=กำลังผลิต | production, stock | — |
| 4 | **Batch กำลังผลิต → รอ QC** (Production "ส่งตรวจ QC") | PRD=รอ QC; Batch โผล่คิว QC | production, qc | QC |
| 5 | **Batch → QC ผ่าน** (QC) | PRD line=พร้อมส่งมอบ (eligible) → **เปิดปุ่ม "พร้อมส่ง" ที่หน้าผลิต** | qc, production | — |
| **5b** | **★ r9 กด "✓ พร้อมส่ง"** (Production, QC-gated, confirm popup) | **capture surplus (actual − ordered → FG, D13)**; PRD=พร้อมส่ง (Ready to Ship); **ทุก PRD พร้อมส่ง → PO/SO=พร้อมส่ง** → โผล่คิวจัดส่ง | production, stock (FG), po-detail, shipping | Shipping (เมื่อ PO พร้อม) |
| 6 | **Batch → QC ไม่ผ่าน** (QC + feedback) | Batch=ไม่ผ่าน; PRD=Rework | qc, production | Production |
| 7 | **PRD Rework → เริ่มผลิตซ้ำ** (Production) | **gen Batch run ถัดไป** → กลับคิว QC; ใช้วัตถุดิบเพิ่ม (FIFO/ติดลบได้) | production, qc, stock | QC |
| 8 | **PRD → Hold** (Production, เหตุลูกค้า/stock) | raise Sale/Stock; (เหตุลูกค้า) ตั้ง flag ⚑ ที่ลูกค้า | production, po-detail, customers | Sale หรือ Stock |
| 9 | **PO พร้อมส่ง → กำลังจัดส่ง** (Shipping) | Shipment=รับเข้ารอบ→In-Route; DN=กำลังนำส่ง | shipping, delivery-note | — |
| 10 | **DN → ส่งถึงแล้ว** (Shipping) | PO=ส่งถึงแล้ว; เริ่มนับ overdue | delivery-note, po-detail | Finance + Sale |
| 11 | **DN → ถูกปฏิเสธ** (Shipping) | PO=พร้อมส่ง(กลับคิว) + raise Sale | delivery-note, po-list, shipping | Sale |
| 12 | **DN → เลื่อนส่ง** (Shipping) | PO=พร้อมส่ง + flag Postpone | delivery-note, shipping | Shipping |
| 13 | **ออก Invoice** (Finance) | PO billing=วางบิลแล้ว; + Customer financial summary อัปเดต | invoices, po-detail, customer-detail | — |
| 14 | **Overdue** (scheduler) | billing=เกินกำหนด; auto ตั้ง flag ⚑ เหตุ "ค้างชำระ" | invoices, dashboard, customer-detail | Finance + Sale |
| 15 | **PO วัตถุดิบขาด** (ตอนเปิด PO) | เตือน(ไม่บล็อก, เทียบ available) + gen PR | po-create, purchase-request | Stock + Production |
| 16 | **ผลิตตัด stock ติดลบ** (Batch เริ่มผลิต) | stock ติดลบ + trace; badge แดง | stock, production, trace | Stock |
| 17 | **Goods Receipt บันทึกรับ** (Stock) | gen Lot + ปิด/อัปเดต PR + **บวก stock กลับ + FIFO retro-link + Available เพิ่ม** | goods-receipt, purchase-request, stock, trace | Stock/Production |
| 18 | **Lot QC ขาเข้า ผ่าน/ไม่ผ่าน** (QC) | ผ่าน→Lot พร้อมใช้ / ไม่ผ่าน→ระงับ→คืนของ | qc, stock, return | Stock |
| 19 | **PO ยกเลิก → เปิดใหม่(ร่าง)** (Sale/Admin) | คงเลข PO เดิม + trace; **+ Release reservation ที่ยังไม่ consume** | po-detail, stock | Production |
| 20 | **★ Reservation (r5)** | Reserved/Available เปลี่ยน (ดู `stock-reservation.md`) | stock, po-detail | Stock (ถ้า available ติดลบ) |
| 21 | **★ Customer → Disabled/Blacklist (r6)** | **HARD block เปิดงานขายใหม่ (QT/PO/SO)**; เดิมเดินต่อ (no cascade) | customers, quotation/po/so-create | Sale |
| 22 | **★ QT ยกเลิก (Cancelled) — ทุกสถานะ (r7)** | QT=ยกเลิก + activity-log; PO ที่ผูก = loose ref → ไม่ cascade | quotation-detail, trace | — |
| 23 | **★ BOM → Inactive (r8)** | **HARD block เปิด QT/PO/SO ใหม่** + **กันออก Supply Planning**; งานที่วิ่งอยู่เดินต่อ | bom, quotation/po/so-create, supply-planning | — |
| **24** | **★ PO ถูกแก้ไข (รวมจากบริบทการผลิต — under-production) (r9)** (PO.Update / Production) | **raise ⚑ "ต้องติดตาม" ที่ลูกค้า (ให้ Sale เห็น)** + **audit ละเอียดระดับ field (who/when/old→new)** + ปรับ reservation (delta ถ้าแก้ qty) — flag ไม่บล็อก | po-detail, production, customers, trace | — (flag ไม่ยิง noti) |

---

## 3. แผนภาพเส้นเดียว จากต้นจนจบ (ใครทำ / gen อะไร ตอนไหน)

```
[OEM] ใบเสนอราคา (optional, D18)
  │  [Quotation] สร้าง QT (ร่าง) → พิมพ์/ส่งให้ลูกค้า (print/share) → กด "Convert to PO" → QT=ยืนยัน (Confirmed)
  │  └─ เลือก "สร้าง PO เดี๋ยวนี้" หรือ "ไว้ทีหลัง (banner)"  · loose ref QT↔PO (no cascade)
  ▼
ลูกค้าสั่ง
  │  [Sale] สร้าง PO (จาก QT prefill หรือสร้างตรง)
  ▼
PO = ร่าง (Draft)                                   PO-{YYYYMM}-{NNNNNN}
  │  [Sale] กดยืนยัน
  ▼
PO = ยืนยันแล้ว (Confirmed) ──auto──► แต่ละ line เข้าคิวผลิต = "รอรับงาน"  (ยังไม่มีเลข PRD)
  │                                   └─► [r5] จองวัตถุดิบ = ΣBOM×qty (Reserved+, Available−)
  │  [Production] กด "รับงาน" (confirm popup)
  ▼
                                    gen PRD (สถานะ "รับงาน")   PRD-{YYYYMM}-{NNNNNN}  (1 line = 1 PRD)
                                          │  [Production] กด "เริ่มผลิต"
                                          ▼
                                    PRD = กำลังผลิต ──auto──► gen Batch run1   B-{PO}-{line}-1
                                          │                     └─► ตัดจริง — เลือก lot มี stock; หลาย lot = FIFO (ติดลบได้) [r5 Option A / r9]
                                          │  [Production] กด "ส่งตรวจ QC"
                                          ▼
                                    PRD/Batch = รอ QC / ส่งตรวจคุณภาพ    ([Production] "ไปหน้า QC ›" → qc แท็บ ตรวจแบตช์ ตรง Batch)
                                          │  [QC] ตัดสินราย Batch (ที่หน้า qc เท่านั้น)
                          ┌───────────────┴───────────────┐
                    ✕ ไม่ผ่าน (+feedback)              ✓ ผ่าน
                          │                                │
                Batch=ไม่ผ่าน · PRD=Rework            PRD line = พร้อมส่งมอบ (eligible)
                [Production] "ผลิตซ้ำ"                    │  [Production] กด "✓ พร้อมส่ง" (QC-gated, confirm popup) [r9]
                → gen Batch run+1 ──► วนกลับ QC          ▼   └─► capture surplus (actual − ordered → FG, D13); actual ต้อง ≥ ordered
                                              PRD = พร้อมส่ง (Ready to Ship)
                                                         │  (ทุก PRD ของ PO พร้อมส่ง)
                                                         ▼
                                              PO = พร้อมส่ง (Ready to Ship) ──► โผล่คิวจัดส่ง
                                                         │  [Shipping] สร้างรอบ (Shipment) + DN
                                                         ▼
                                              PO = กำลังจัดส่ง → ส่งถึงแล้ว (Delivered) ──► เริ่มนับเครดิต
                                                         │  [Finance] ออกใบแจ้งหนี้   INV-{YYYY}-{NNNNNN}
                                                         ▼
                                              billing = วางบิลแล้ว → ชำระแล้ว / เกินกำหนด
```
**เส้นวัตถุดิบ (ขนาน):** PO วัตถุดิบขาด → **PR** → [Stock] **Goods Receipt** → gen **Lot** + บวก stock กลับ/ชดเชยติดลบ + FIFO retro-link → [QC] ตรวจรับ → Lot พร้อมใช้ → ใช้ผลิต Batch
**หมายเหตุ negative stock:** ผลิตก่อนของเข้า → Batch ตัด stock ติดลบ → GR บวกกลับ + ผูก Lot ย้อน FIFO
**หมายเหตุ reservation (r5):** Confirmed=จอง · เริ่มผลิต=ตัดจริง (เลือก lot มี stock; หลาย lot = FIFO) · Cancel=คืนจอง
**หมายเหตุ customer r6:** Disabled/Blacklist = บล็อก (hard); flag ⚑ = ป้ายเตือน ไม่บล็อก
**หมายเหตุ QT r7:** "Convert to PO" ตั้ง QT=Confirmed ทันที; loose ref; **การส่ง = print/share ไม่ใช่สถานะ (ไม่มี Sent/sent-date)**
**หมายเหตุ BOM r8:** Inactive = บล็อก (hard) + กันออก Supply Planning; รหัส BOM/FG/RM = user-entered+unique+lock
**★ หมายเหตุ Production r9:** "พร้อมส่ง" = action ที่ฝ่ายผลิตกด (QC-gated, capture surplus); ทุก PRD พร้อมส่ง → PO/SO พร้อมส่ง; actual ≥ ordered (ผลิตน้อย = แก้ PO ลง → follow-up+audit); consume/loss/adjust lot = เลือก lot มี stock/FIFO; confirm popup ทุก status change; ปุ่ม Loss บนหน้าจัดการ

---

## 4. ตรวจ mockups ปัจจุบัน สอดคล้องนิยามนี้ไหม (รายการแก้ — ไม่แก้เอง)
| จุด | สถานะ | รายการแก้ (ให้ UX/UI) |
|---|---|---|
| **★ Production queue 2 tabs + management page (r9)** | ⚠ ต้องแก้ | production.html: **แท็บ "รอรับงาน"** (search PO/SO/ลูกค้า/ผู้ติดต่อ/ช่วงวันที่สร้าง/ช่วงวันที่ต้องการรับของ ทุกสถานะ · filter PO/SO · **default "พร้อมรับงาน"** · PO/SO detail modal + ลิงก์เต็ม) · **แท็บ "คิวงานที่รับแล้ว"** (search + **PRD** · default รับงานแล้ว/Hold/กำลังผลิต/QC/พร้อมส่งมอบ · **ordering รับงานแล้ว→กำลังผลิต→QC→พร้อมส่งมอบ→Hold** · **group ตาม PO/SO → PRD ซ้อนใต้**) · **หน้าจัดการ:** actual qty (≥ ordered) · lot picker (เฉพาะ lot มี stock, FIFO) · **"✓ พร้อมส่ง" QC-gated + popup "QC ต้องผ่านก่อน"** · **ปุ่ม Loss + confirm popup** · **"ไปหน้า QC ›" deep-link ตรง Batch (เฉพาะสถานะ QC)** · **confirm popup ทุก status change** · **edit-PO → follow-up + audit** (ดู `modules/production.md`) |
| **★ Stock Adjust อ้าง Lot/FIFO (r9)** | ⚠ ต้องแก้ | stock.html แท็บ RM: ฟอร์ม **Adjust (ปรับยอด +) เพิ่ม Lot selector (เลือก lot มี stock **หรือ** option "FIFO")** — เดิม RM-only (ดู `modules/stock.md` §5.1) |
| **★ Quotation lifecycle r7/r7.1** | ⚠ ต้องแก้ | quotation-list/detail: badge/filter ร่าง/ยืนยัน/ปฏิเสธ/ยกเลิก (ถอด Sent) + created-date แกนเดียว + Convert popup + banner + activity-log |
| **★ BOM Active/Inactive + code lock (r8)** | ⚠ ต้องแก้ | bom-create: รหัสพิมพ์เองตอนสร้าง (read-only เมื่อแก้) + RM component search dropdown + ราคาซื้อแก้มือ + toggle Active/Inactive |
| **★ Customer status 6→5 + follow-up flag (r6/r9)** | ⚠ ต้องแก้ | customers/customer-detail: flag ⚑ แยก badge + เหตุผล + **raise จาก PO edit (r9)** + financial summary |
| **PRD manual accept (รอรับงาน → รับงาน)** | ⚠ ต้องแก้ | คิว "รอรับงาน" + ปุ่ม "รับงาน"; เลข PRD ออกตอนกดรับงาน |
| **Negative stock display** | ⚠ ต้องเพิ่ม | stock: แดง + badge "ติดลบ"; production: เตือน "จะตัด stock ติดลบ X" |
| **GR negative notice + FIFO retro-link** | ⚠ ต้องเพิ่ม | goods-receipt: กล่องแจ้งชดเชยติดลบ; trace: Lot ผูกย้อน |
| **★ Stock 3 ยอด (Reservation r5)** | ⚠ ต้องเพิ่ม | stock: คงคลัง/จองแล้ว/ใช้ได้ + badge "จองเกิน" |
| 1 line = 1 PRD | ✅ ตรง | production แสดง PRD ต่อ line (★ r9: คิว "รับแล้ว" group PO/SO → PRD ซ้อนใต้) |
| Batch เกิดตอนเริ่มผลิต | ✅ ตรง | production alert อธิบายชัด |
| **PRD numbering format** | ✅ แก้แล้ว | `PRD-{YYYYMM}-{NNNNNN}` |
| **po-detail แสดง PRD ต่อ line** | ✅ แก้แล้ว | มีคอลัมน์ PRD ต่อ line |
| คำศัพท์สถานะ PRD สม่ำเสมอ | ⚠ ตรวจ | dashboard(ฝ่ายผลิต) ใช้คำ รอรับงาน/รับงาน/กำลังผลิต/รอ QC/พร้อมส่งมอบ/พร้อมส่ง/Hold/Rework |

---

## 5. คำถามถึงปอนด์
- **r4 (3 ข้อ): ตอบครบแล้ว ✅**
- **Deletion Policy: ตอบครบ 7 ข้อ ✅**
- **★ r5 Stock Reservation:** จุดตัดจริง = Option A "เริ่มผลิต" (★ r9 ระบุ consume เลือก lot มี stock; หลาย lot = FIFO)
- **★ r6 Customer: DECIDED ✅** — ถอด "Follow-up" ออกจาก enum (5 สถานะ + flag)
- **★ r7 Quotation: ไม่มีคำถามค้าง** — Confirmed reseat + cancel ทุกสถานะ · r7.1 ถอด Sent/sent-date
- **★ r8 BOM: ไม่มีคำถามค้าง** — Active/Inactive + code user-entered+lock
- **★ r9 Production (2026-07-29): ไม่มีคำถามค้าง** — **1 PO : หลาย PRD = CONFIRMED โดย locked model (1 line = 1 PRD)** → คิว "รับแล้ว" group PO/SO → PRD ซ้อนใต้ · "พร้อมส่ง" QC-gated action + capture surplus · PO/SO พร้อมส่งเมื่อ PRD ครบ · actual ≥ ordered (under-production = แก้ PO ลง → follow-up+audit) · consume/adjust lot มี stock/FIFO · confirm popup ทุก status change · Loss บนหน้าจัดการ · "ไปหน้า QC" deep-link. authoritative = `modules/production.md`/`po.md`/`stock.md`/`qc.md`.
