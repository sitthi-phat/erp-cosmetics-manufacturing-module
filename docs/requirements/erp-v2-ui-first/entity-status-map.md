# Entity Status Map — ESSENCE Hub System (แผนที่สถานะฉบับเดียวจบ)

เอกสารสำหรับปอนด์ (+ BA/Engineer/QA เป็น source of truth เรื่อง lifecycle) · เขียนโดย PO · 2026-07-09 (ปรับ r4.1) · **r5 (2026-07-10): เพิ่มชั้น Stock Reservation — รายละเอียดเต็มที่ `stock-reservation.md`** · **r6 (2026-07-29): Customer §1.1 → 5 สถานะ + "ต้องติดตาม" เป็น flag แยก** · **r7 (2026-07-29): เพิ่ม §1.1b Quotation (QT) lifecycle — reseat "ตกลง (Agreed)" → "ยืนยัน (Confirmed)"** · **r7.1 (2026-07-29): REVERT — ถอด "ส่งแล้ว (Sent)" + sent-date** · **r8 (2026-07-29): เพิ่ม §1.1c BOM lifecycle (Active/Inactive) + RM/BOM/FG code = user-entered+unique+create-only-lock** · **★ r9 (2026-07-29): Production module review — PRD "พร้อมส่ง (Ready to Ship)" เป็น action ที่ QC-gated + capture surplus; PO/SO = พร้อมส่ง เมื่อ PRD ครบ; actual qty ≥ ordered; consume/adjust lot = เลือก lot มี stock/FIFO; authoritative = `modules/production.md`/`modules/po.md`/`modules/stock.md`** · **★★ r10 (2026-07-29): QC + GR/Stock flow review — (a) §1.8 GR object lifecycle + QC-GATED STOCK-IN; (b) §1.4 Batch QC ไม่ผ่าน → PRD Rework** · **★★★ r11 (2026-07-30): Shipping/Route + DN rewrite — §1.9 Shipment→Route (`RT-…`, 4 สถานะ เตรียมจัดของ/กำลังออกไปส่ง/เสร็จสิ้น/ยกเลิก); §1.10 DN 6 สถานะใหม่ (อยู่ระหว่างการเตรียม/อยู่ระหว่างจัดส่ง/ส่งสำเร็จ/ลูกค้าเลื่อนส่ง/ลูกค้ายกเลิก/ลูกค้ายังไม่กำหนดวันรับใหม่); §1.2 PO/SO delivery status = สะท้อนจาก DN (rule กลาง, ทุกจอ); authoritative = `modules/shipping.md`/`modules/delivery-note.md`/`modules/po.md` §4b. ★ RT vs SHP numbering = open Q1 (PO เสนอ RT แทน SHP).**
เป็น **ความจริงหลัก** เรื่อง entity/สถานะ/ใครเปลี่ยน/cascade · `status-journeys.md` อ้างอิงเอกสารนี้ (sync แล้ว ไม่ให้มี 2 ความจริง)

## สรุปภาษาไทย
**ปอนด์ปรับ flow (r4.1):** PO ยืนยันแล้ว → งานแต่ละ line เข้า **คิวผลิตสถานะ "รอรับงาน"** (ยัง**ไม่**เกิด PRD) → **ฝ่ายผลิตกด "รับงาน" เอง → ตอนนั้นถึงสร้าง PRD** (1 ใบต่อ line) → กด "เริ่มผลิต" = gen เลข **Batch** · **1 PO : N PRD (N=line) : M Batch (M≥N, +1/rework)** · **วัตถุดิบขาดไม่บล็อก** — รับงาน/เริ่มผลิตได้เลย และ **ผลิตจริงตัด stock ติดลบได้** พอทำ GR + QC ผ่าน ค่อยบวกกลับ · Batch ผ่าน QC → PRD line "พร้อมส่งมอบ (eligible)" → **ฝ่ายผลิตกด "พร้อมส่ง"** → PRD "พร้อมส่ง (Ready to Ship)" → ทุก PRD พร้อมส่ง → PO/SO พร้อมส่ง
**★ r5 Stock Reservation:** PO Confirmed → จอง (Reserve) = ΣBOM×qty ต่อ line → ยอด ใช้ได้ (Available) = คงคลัง − จองแล้ว · ตัดจริง (Consume) ตอน "เริ่มผลิต" (Option A) · Cancel PO = คืน (Release) · **ดู `stock-reservation.md`**
**★ r6 Customer:** สถานะ **6 → 5** + "ต้องติดตาม" เป็น flag แยก · **Disabled/Blacklist = HARD block เปิดงานขาย QT/PO/SO** · **★ r9: flag ⚑ ถูก raise เพิ่มเมื่อ "PO ถูกแก้ไข (รวมจากบริบทการผลิต — under-production)".**
**★ r7 Quotation:** สถานะ ร่าง/ยืนยัน/ปฏิเสธ/ยกเลิก · "ยืนยัน (Confirmed)" ตั้งโดย "Convert to PO" · ยกเลิกได้ทุกสถานะ · **r7.1: ถอด "ส่งแล้ว (Sent)" + sent-date**.
**★ r8 BOM:** lifecycle Active/Inactive · Inactive = HARD block เปิด QT/PO/SO + กันออก Supply Planning · รหัส BOM/FG/RM = user-entered+unique+create-only-lock.
**★ r9 Production (2026-07-29):** **PRD "พร้อมส่ง (Ready to Ship)" = action ที่ฝ่ายผลิตกด (ไม่ auto)** โดย **QC ผ่านเป็น precondition (gate)** · การกด = capture surplus (D13) + ตั้ง Ready to Ship · **ทุก PRD พร้อมส่ง → PO/SO พร้อมส่ง** · **actual ต้อง ≥ ordered** · **consume/loss/adjust lot = เลือก lot มี stock; หลาย lot = FIFO** · confirm popup ทุก status change. authoritative = `modules/production.md`.
**★★ r10 QC + GR/Stock flow (2026-07-29):** **RM เข้าสต็อกเมื่อ QC ตรวจรับ "ผ่าน" เท่านั้น** — GR สร้าง GR object + Lot รอตรวจ (ยังไม่ credit) → QC ผ่าน → credit + FIFO retro-link · GR object 4 สถานะ (§1.8) · Batch QC ไม่ผ่าน → PRD Rework (§1.4). authoritative = `modules/goods-receipt.md`/`modules/qc.md`/`modules/stock.md`.
**★★★ r11 Shipping/Route + DN (2026-07-30):** รอบจัดส่ง **Shipment → "Route" (`RT-…`)** 4 สถานะ (เตรียมจัดของ→กำลังออกไปส่ง→เสร็จสิ้น/ยกเลิก); **DN 6 สถานะใหม่**; **"เสร็จสิ้น" = action บังคับสรุปผลราย DN + comment**; **★ PO/SO delivery status = สะท้อนจาก DN (ทุกจอ)**. authoritative = `modules/shipping.md`/`modules/delivery-note.md`/`modules/po.md` §4b. **★ RT vs SHP numbering = open Q1.**

---

## ตอบคำถามปอนด์ (กระชับ — อัปเดตตามคำตอบ r4.1)
1. **สร้าง PO ที่ไม่ใช่ร่าง:** กด "ยืนยัน PO" → PO = **"ยืนยันแล้ว (Confirmed)"** · แต่ละ line **เข้าคิวฝ่ายผลิต "รอรับงาน"** — **ยังไม่สร้าง PRD** · **ฝ่ายผลิตกด "รับงาน" เอง** → สร้าง PRD → กด "เริ่มผลิต" · **r5: ตอน Confirmed ระบบจองวัตถุดิบ (§1.6)**
2. **เลข PRD เกิดตอน:** **ตอนฝ่ายผลิตกด "รับงาน"** · **1 line item = 1 PRD** → 1 PO N line = **N PRD** · format `PRD-{YYYYMM}-{NNNNNN}` (gapless ต่อเดือน)
3. **เลข Batch เกิดตอน:** ฝ่ายผลิตกด **"เริ่มผลิต"** → gen **Batch run แรก** `B-{PO}-{line}-1` · cascade: Batch(กำลังผลิต)→PRD(กำลังผลิต) · Batch(รอ QC)→PRD(รอ QC) · **Batch ผ่าน QC → PRD line = พร้อมส่งมอบ (eligible)** → **[r9] ฝ่ายผลิตกด "พร้อมส่ง" → PRD = พร้อมส่ง (Ready to Ship)** · **ทุก PRD ของ PO พร้อมส่ง → PO = พร้อมส่ง** · Batch ไม่ผ่าน → PRD = Rework + gen Batch run ถัดไป
4. **"ส่งตรวจคุณภาพ" สร้าง Batch ไหม?** **ไม่ใช่** — Batch สร้างตอน **"เริ่มผลิต"** · "ส่งตรวจ QC" = Batch ที่มีอยู่เปลี่ยนสถานะ

**★ วัตถุดิบขาด + Negative Stock (ปอนด์ตอบ r4.1 · ★ r10 ปรับจุด credit):** วัตถุดิบไม่พอ **ไม่บล็อก** — กด "รับงาน" ได้เลย + **เตือน** · **อนุญาตตัด stock ติดลบ** · GR → gen Lot รอตรวจ → **★ r10: QC ตรวจรับ "ผ่าน" → บวก stock กลับ + FIFO retro-link + ต้องแสดงชัดว่าเคยติดลบ** (§1.6 + §1.8 + §4); **QC ไม่ผ่าน → ไม่บวก, ยอดติดลบคงอยู่**

**ความสัมพันธ์เชิงตัวเลข:** **1 PO : N PRD (N=line) : M Batch (M≥N; +1 ทุกครั้ง rework)** · 1 PO : 1..K DN · **1 Route : หลาย DN** · 1 PO : 1 Invoice (+versions)

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
- **★ r11 (2026-07-30):** ลูกค้าเพิ่มฟิลด์ **ที่อยู่ลูกค้า (registered) + ที่อยู่จัดส่ง (shipping) แยกกัน** + ผู้ติดต่อมี flag **"เป็นคนรับสินค้า (is receiver)"** (ติด flag = ชื่อ+เบอร์บังคับ) — `modules/customer.md` §3/§9b.
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
| **★★ r11: [สถานะจัดส่ง = สะท้อนจาก DN]** | auto (จาก DN — `modules/po.md` §4b) | **อยู่ระหว่างการเตรียม** (DN เข้ารอบ) → **อยู่ระหว่างจัดส่ง** (Route ออกไปส่ง) → **ส่งสำเร็จ / ลูกค้าเลื่อนส่ง / ลูกค้ายกเลิก / ลูกค้ายังไม่กำหนดวันรับใหม่** (Route "เสร็จสิ้น" หรือแก้ DN ตรง) |
| ยกเลิก (Cancelled) → เปิดใหม่เป็น ร่าง | Sale/Admin (บังคับ comment) · reopen คงเลข | ทุกขั้น |
> force override = Admin + เหตุผล + trace
> **Create-time gate (r6/r8):** เปิด/ยืนยัน PO ให้ลูกค้า **Disabled/Blacklist ไม่ได้** · **BOM/FG Inactive ไม่ได้** (HARD block)
> **★ r9 — แก้ PO (po.md §5.2):** การแก้ PO ทุกครั้ง **รวมจากบริบทการผลิต (under-production)** → **raise ⚑ follow-up ที่ลูกค้า + audit ละเอียดระดับ field** · แก้จำนวน line → ปรับ reservation (delta)
> **★★ r11 — สถานะจัดส่ง = LINKED จาก DN (`modules/po.md` §4b):** PO แสดงสถานะตัวเองถึง "พร้อมจัดส่ง" แล้ว **สะท้อน (reflect) สถานะ DN** (ตารางด้านบน 6 ค่า) — **ไม่ใช่ enum อิสระ** (แทน In Delivery/Delivered เดิม). **rollup = DN ล่าสุด (active).** **บังคับใช้ทุกจอ: po-list/po-detail/dashboard/production queue/home.** **SO (ก) เช่นเดียวกัน** (`modules/so.md` §4).
> **หมายเหตุ vs QT (r7):** "PO Confirmed" ≠ "QT Confirmed". สร้าง PO จาก QT → PO เริ่ม **ร่าง (Draft)**.

### 1.3 PO — ราง Billing · หน้า: invoices / invoice-detail / po-detail
| สถานะ | ใครเปลี่ยน | เกิดตอน |
|---|---|---|
| ยังไม่วางบิล (Not Invoiced) | (เริ่มต้น) | — |
| วางบิลแล้ว (Invoiced) | Finance/Sale (ออก invoice ได้ตั้งแต่ Confirmed) | ออกใบแจ้งหนี้ |
| ชำระแล้ว (Paid) | Finance | รับชำระครบ |
| เกินกำหนด (Overdue) | auto scheduler | ส่งของแล้ว + เลยเครดิต + ยังไม่จ่าย |
> **r6:** ยอด billing = ฐานของ Customer financial summary (`modules/customer.md` §7). **r11:** "เริ่มนับเครดิต/overdue" trigger = DN "ส่งสำเร็จ".

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
| **★ พร้อมส่ง (Ready to Ship)** | **Production (กด "✓ พร้อมส่ง")** — **QC-gated (r9)** | **capture surplus (actual − ordered → FG, D13) + confirm popup** · ต้อง QC ผ่านก่อน |
| **Rework (กลับกำลังผลิต · "กำลังผลิต · Rework")** ★ | auto (Batch QC ไม่ผ่าน) | QC ตีกลับ → gen Batch run ถัดไป · **★ r10 CONFIRM: สถานะ = "กำลังผลิต · Rework"** |
| พักงาน (Hold) | Production (บังคับ comment + raise Sale/Stock) | ติดปัญหา |
> overlay: **เสี่ยงล่าช้า (Potential Delay)** = auto (2 วันผลิต + 1 วันส่ง)
> **★ r9 — จำนวนผลิตจริง (actual qty):** ฝ่ายผลิตกรอก actual (D13) · **ต้อง ≥ จำนวนสั่งเสมอ** · ผลิตน้อยกว่าสั่ง = **แก้ PO ให้จำนวนสั่ง = ผลิตจริงก่อน** (→ follow-up + audit) · over-production → surplus → FG ตอนพร้อมส่ง
> **★ r9 — roll-up:** ทุก PRD ของ PO/SO = พร้อมส่ง → **PO/SO = พร้อมส่ง (done)** · produce-to-stock (ไม่ผูกลูกค้า): กด "พร้อมส่ง" → FG เข้าคลังเต็มจำนวนผลิตจริง (ส่ง 0)
> **★ r9 — "ไปหน้า QC":** ปุ่ม "ไปหน้า QC ›" เปิดได้เฉพาะสถานะ **ส่งตรวจคุณภาพ (QC)** → deep-link ไป qc แท็บ "ตรวจแบตช์" · **★ r10: ปลายทางเลือก sub-tab OEM/Own-Brand** · **ปุ่ม Loss มีบนหน้าจัดการ** · **ทุกการเปลี่ยนสถานะ = confirm popup**
> **★ r10 — ยืนยัน Batch QC ไม่ผ่าน → Rework:** **settled** — Rework = กลุ่ม กำลังผลิต, สีฟ้า. "QC ไม่ผ่าน" comment = reuse ฟิลด์ feedback (`modules/qc.md` §4.2).
> **วัตถุดิบขาดไม่บล็อก:** รับงาน/เริ่มผลิตได้แม้ stock ไม่พอ (§1.6 negative stock)
> **สีป้าย Rework (r5):** PRD Rework = **สีฟ้า (processing)** — งานกลับมาผลิต ไม่ใช่ error (`modules/production.md` §6.2)
> **หมายเหตุ r8:** BOM ถูก Inactivate ระหว่าง PRD/Batch กำลังผลิต → **PRD/Batch เดินต่อจนจบได้**.

### 1.5 ★ Batch — รุ่นการผลิต · `B-{PO}-{line}-{run}` · หน้า: production / qc / trace
**นิยาม:** รุ่นผลิตจริง 1 รอบของ PRD · gen ตอน "เริ่มผลิต" · run เพิ่มทีละ 1 เมื่อ rework · ผูก PO/line/Lot วัตถุดิบที่ใช้
| สถานะ Batch | ใครเปลี่ยน | เกิดตอน |
|---|---|---|
| กำลังผลิต | auto (gen ตอนเริ่มผลิต) → **ตัด stock วัตถุดิบ (เลือก lot มี stock; หลาย lot = FIFO; ติดลบได้)** | PRD เริ่มผลิต |
| รอ QC | Production (ส่งตรวจ) | ผลิตเสร็จ |
| QC ผ่าน | **QC (หน้า qc เท่านั้น · sub-tab OEM/Own-Brand — r10)** | ตัดสินผ่าน → PRD line eligible กด "พร้อมส่ง" |
| QC ไม่ผ่าน | **QC (หน้า qc เท่านั้น)** + feedback "QC ไม่ผ่าน" บังคับ | ตัดสินไม่ผ่าน → PRD Rework (กำลังผลิต · Rework) |
> หน้า production **ไม่มีปุ่มตัดสิน QC** — เห็นผล + "ไปหน้า QC ›" (นำทาง) เท่านั้น

### 1.6 Lot วัตถุดิบ + Stock (+ Reservation r5) · `{supplier prefix}{YYMM}` · หน้า: stock / goods-receipt / qc / trace
> **★ r8: รหัส RM (master) = user-entered + unique + create-only-lock** — เลข Lot ยัง gen อัตโนมัติจาก supplier prefix ตอน GR (`modules/stock.md` §3b).

| สถานะ Lot | ใครเปลี่ยน | เกิดตอน |
|---|---|---|
| **รอตรวจ (รอ QC ขาเข้า)** | auto (gen ตอน Goods Receipt) · **★ r10: ยังไม่ credit on_hand** | บันทึกรับเข้า |
| **พร้อมใช้ผลิต** | QC (ตรวจรับผ่าน) · **★ r10: credit on_hand ตอนนี้ + ชดเชยติดลบ + FIFO retro-link** | QC ขาเข้าผ่าน (+อาจปิด PR) |
| ระงับ (ไม่ผ่าน) | QC (ไม่ผ่าน) → ทำใบคืนของ · **★ r10: ไม่ credit** | QC ขาเข้าไม่ผ่าน |
| หมด/ตัดสต็อก | auto (ใช้ในการผลิต/Return) | ตัด stock |

**★ Stock Reservation / 3 ยอด (r5) · ดู `stock-reservation.md`:**
- **3 ยอดต่อวัตถุดิบ:** **คงคลัง (on_hand)** (ติดลบได้) · **จองแล้ว (Reserved)** (≥0) · **ใช้ได้ (Available) = on_hand − Reserved** (ติดลบได้)
- **Reservation lifecycle:** **จอง** ตอน PO Confirmed → **ใช้จริงแล้ว (Consumed)** ตอน "ตัดจริง" → **คืนแล้ว (Released)** ตอน cancel/แก้ลด
- **★ จุด "ตัดจริง" = Option A "เริ่มผลิต" ราย Batch** · **★ r9: consume เลือกเฉพาะ lot ที่มี stock; หลาย lot = FIFO** (`modules/production.md` §5d)
- **Cancel PO** → release reservation ที่ยังไม่ consume · จองเกิน available = เตือนไม่บล็อก

**★ Loss / Adjust (RM) — 2 action (Stock review) + ★ r9 Adjust อ้าง Lot/FIFO:**
- **Loss (ตัดคงคลัง −)** อ้าง **Lot (เลือก lot มี stock **หรือ** "FIFO")** · **Adjust (ปรับยอด +)** — **★ r9: ต้องอ้าง Lot เสมอ** — `modules/stock.md` §5.1/§6.
- ทั้งคู่: เหตุผลบังคับ + ledger source (D15) · ปุ่ม "บันทึก (คงคลัง)".

**★ Negative Stock Rule (ปอนด์ตอบ r4.1 · ★ r10 จุด credit = QC pass):**
- การผลิต (Batch เริ่มผลิต) **ตัด stock ได้แม้ไม่พอ → ติดลบได้** (ไม่บล็อก) · ทุกครั้ง **บันทึก trace**
- **Goods Receipt** → gen Lot รอตรวจ (ยังไม่ credit) → **★ r10: QC ตรวจรับ "ผ่าน" → บวก stock กลับ (ชดเชยติดลบก่อน)** · **"ไม่ผ่าน" → ไม่บวก, ติดลบคงอยู่**
- **★ FIFO retro-link (GMP):** **เมื่อ QC ผ่าน** → GR ชดเชยยอดติดลบ → ผูก consumption ที่ตัดติดลบไว้เข้ากับ Lot ใหม่แบบ FIFO อัตโนมัติ → **Batch ↔ Lot ครบสายย้อนหลัง**
- **จุดแสดงผลบังคับ (UX/UI):**
  - **stock.html:** **3 ยอด** · on_hand ติดลบ = **แดง + badge "ติดลบ (รอรับเข้า)"** · available ติดลบ = "จองเกิน (รอรับเข้า)"
  - **production:** เตือน "จะตัด stock ติดลบ X หน่วย" ตอนรับงาน/เริ่มผลิต
  - **goods-receipt/qc:** **★ r10: กล่องแจ้ง "ชดเชยยอดติดลบ X หน่วย (ผูก Lot ย้อน FIFO)" แสดงตอน QC ผ่าน**
  - **trace:** genealogy Batch แสดง Lot ที่ผูกย้อน FIFO

### 1.7 PR — คำขอสั่งซื้อ · `PR-{NNNNNN}` · หน้า: purchase-request / pr-create
| สถานะ | ใครเปลี่ยน | เกิดตอน |
|---|---|---|
| เปิดคำขอ (Open) | auto (PO วัตถุดิบขาด) / Stock | วัตถุดิบขาด/สร้างเอง |
| รับทราบ (Acknowledged) | Stock | รับทราบ |
| รับบางส่วน (Partially) | auto (**★ r10: GR ที่ QC "ผ่าน" ไม่ครบ**) | รับ/ผ่านบางส่วน |
| ของเข้าครบ (Fulfilled) | auto (**★ r10: GR ที่ QC "ผ่าน" ครบ**) | รับ/ผ่านครบ |
| ปิดคำขอ (Closed) / ยกเลิก | Stock (ยกเลิกบังคับ comment) | ปิด/ยกเลิก |

### 1.8 ★ GR — ใบรับเข้า (GR object) · `GR-{YYYYMMDD}-{NNN}` · หน้า: goods-receipt / stock (แท็บ Good Receipt (RM)) / qc
**★ r10 (2026-07-29): GR เป็น object ที่มี lifecycle + เป็น "ใบรอ QC ตรวจรับ" — RM เข้าสต็อกเมื่อ QC ผ่านเท่านั้น.** authoritative = `modules/goods-receipt.md` §4 · `modules/qc.md` §4.1 · `modules/stock.md` §2b.

event บันทึกรับเข้า → **gen Lot รายบรรทัด (รอตรวจ) + GR object (สถานะ "QC ตรวจสอบ")** · **★ ยังไม่บวก stock** · เมื่อ QC ผ่าน → **บวก stock กลับ (ชดเชยติดลบ + FIFO retro-link) + `GR (+)` ledger + Available เพิ่ม** + อัปเดต/ปิด PR

| สถานะ GR object | ใครเปลี่ยน | เกิดตอน / ผล |
|---|---|---|
| **QC ตรวจสอบ (Under QC)** | auto (บันทึก GR) | Lot ราย line = รอตรวจ · **ยังไม่ credit on_hand** |
| **ผ่าน (Passed)** | auto (ทุก Lot ราย line QC ผ่าน) | **credit on_hand + FIFO retro-link + `GR (+)`** · อาจปิด PR |
| **ไม่ผ่าน (Failed)** | auto (≥1 Lot ราย line QC ไม่ผ่าน) | ส่วนไม่ผ่านไม่เข้าสต็อก + Lot ระงับ → **ส่งกลับ QC / ยกเลิก / คืน supplier** |
| **ยกเลิก (Cancelled)** | Warehouse/Stock.Delete (บังคับเหตุผล) | **เฉพาะสถานะ QC ตรวจสอบ/ไม่ผ่าน** (ก่อน credit) → void, gapless |

- **★ Action (warehouse ที่แท็บ Good Receipt (RM)):** **ส่งกลับ QC (re-submit)** · **ยกเลิก GR** (เฉพาะก่อน credit).
- **★ Cancel semantics (settled):** GR ที่ยกเลิกได้ **ยังไม่เคย credit สต็อก → ยกเลิกไม่ต้อง reverse ยอด**. เอาของออกหลังผ่าน = **Return/Loss**.
- **★ partial:** บาง line ผ่าน (credit แล้ว) บาง line ไม่ผ่าน → GR "ไม่ผ่าน" + breakdown ราย line.

### 1.9 ★★★ Route (รอบจัดส่ง) · `RT-{YYYYMMDD}-{NNNN}` · หน้า: shipping / delivery-note · **r11 (2026-07-30)**
**authoritative = `modules/shipping.md` (Module B).** **★ เดิม = "Shipment `SHP-…`"; r11 rename → "Route `RT-…`" (★ RT vs SHP = open Q1 — PO เสนอ RT แทน SHP).**

| สถานะ Route | ใครเปลี่ยน | เกิดตอน / ผลต่อ DN |
|---|---|---|
| **เตรียมจัดของ (Preparing)** | auto (สร้าง Route จาก order พร้อมจัดส่ง) | สร้างรอบ → gen DN · **DN ทุกใบ = อยู่ระหว่างการเตรียม** |
| **กำลังออกไปส่ง (Out for delivery)** | Shipping (action) | หลังจัดของ → ตั้งวันที่ route ออกไปส่ง · **DN ทุกใบ = อยู่ระหว่างจัดส่ง** |
| **เสร็จสิ้น (Completed)** | Shipping (action) | **บังคับสรุปผลราย DN ทุกใบ + comment (G6)** — ส่งสำเร็จ/เลื่อน/ยกเลิก/ยังไม่กำหนดวัน |
| **ยกเลิก (Cancelled)** | Shipping (action, กดได้ทุกเมื่อ + เหตุผล) | ยกเลิกรอบ · order กลับคิว "พร้อมจัดส่ง" ถ้ายังไม่ dispatch |
> **★ เลข RT + ทุก DN ในรอบ ออกตอน "สร้างรอบ" สำเร็จ (G8/NS7).** "ส่งบางส่วน (Partially)" = ป้าย reconcile/สรุป ไม่ใช่ lifecycle status. **ปิดรอบด้วย action "เสร็จสิ้น" (ไม่ auto-close เดิม).**
> **หัวรอบ (ฟิลด์):** คนขับ (ค้นชื่อ/username, = system user) · เบอร์คนขับ\* · Route/เส้นทาง · ประเภทรถ\* {รถกระบะ/รถเก๋ง/มอเตอร์ไซด์/10 ล้อ/6 ล้อ} · ทะเบียนรถ · วัน-เวลาออกรอบ. **Route มี comment (G6).**

### 1.10 ★★★ DN — ใบจัดส่ง (1 ใบ = 1 PO/SO) · `DN-{YYYYMMDD}-{NNNNN}` · หน้า: delivery-note · **r11 (2026-07-30)**
**authoritative = `modules/delivery-note.md` (Module C).** **สร้างตรงไม่ได้ — เกิดผ่าน Route เท่านั้น.**

| สถานะ DN | ใครเปลี่ยน | เกิดตอน |
|---|---|---|
| **อยู่ระหว่างการเตรียม (Preparing)** | auto | Route ถูกสร้าง / เพิ่ม PO-SO เข้ารอบ+บันทึก |
| **อยู่ระหว่างจัดส่ง (Out for delivery)** | auto | Route → กำลังออกไปส่ง |
| **ส่งสำเร็จ (Delivered)** | Shipping (Route "เสร็จสิ้น" process หรือแก้ตรง A) | → ตัด FG FIFO · PO/SO ส่งสำเร็จ · เริ่มนับ overdue · noti Finance+Sale |
| **ลูกค้าเลื่อนส่ง (Postponed)** | Shipping (Route "เสร็จสิ้น" / แก้ตรง A) | **บังคับ next delivery date** · order ค้างคิว รอ re-route |
| **ลูกค้ายกเลิก (Cancelled)** | Shipping (Route "เสร็จสิ้น" / แก้ตรง A) | การส่งถูกยกเลิก |
| **ลูกค้ายังไม่กำหนดวันรับใหม่ (ฝากที่เราไว้ก่อน)** | Shipping (Route "เสร็จสิ้น" / แก้ตรง A) | ของฝากไว้ที่เรา รอลูกค้ากำหนดวัน |
> **★ ทุก DN status update → บังคับ comment ต่อ DN (G6).** **★ แก้สถานะ DN โดยตรงจากหน้า DN = ต้องมีสิทธิ์ Approve (A)** (`modules/permission-matrix.md`). **★ order ที่ re-route = gen DN ใบใหม่; DN เดิมคงสถานะสุดท้ายเป็นประวัติ.** **PO/SO สะท้อน DN ล่าสุด (§1.2).**

### 1.11 Invoice · `INV-{YYYY}-{NNNNNN}` · หน้า: invoices / invoice-detail / invoice-print
รอชำระ / ชำระแล้ว / เกินกำหนด + **versioning** · ผู้ทำ = Finance · **r6:** ฐานของ Customer financial summary · **r11:** print Invoice จากหน้า DN ได้ (`modules/delivery-note.md` §5).

---

## 2. Cascade Table (X เปลี่ยน → Y เปลี่ยน → เห็นที่หน้า → noti ไปหา)
| # | ต้นเหตุ (ใคร) | ผล cascade | เห็นที่หน้า | noti |
|---|---|---|---|---|
| 0 | **★ QT → ยืนยัน (Confirmed)** (r7) | ตั้ง QT=Confirmed (immutable); ไม่บังคับให้เกิด PO; สร้าง PO → loose ref; ยกเลิก QT = ไม่ cascade | quotation-detail, po-create | — |
| 1 | **PO Draft → ยืนยันแล้ว** (Sale) | line เข้าคิว "รอรับงาน"; **+ จองวัตถุดิบ (r5)**; ลูกค้า Lead→Active | po-detail, production, stock, customers | Production |
| 2 | **รอรับงาน → รับงาน** (Production, confirm popup) | **gen เลข PRD** (สถานะ รับงาน) | production | — |
| 3 | **PRD รับงาน → กำลังผลิต** (Production "เริ่มผลิต") | **gen Batch run แรก**; **ตัด stock จริง (เลือก lot มี stock; หลาย lot = FIFO; ติดลบได้)**; PO=กำลังผลิต | production, stock | — |
| 4 | **Batch กำลังผลิต → รอ QC** (Production "ส่งตรวจ QC") | PRD=รอ QC; Batch โผล่คิว QC (sub-tab OEM/Own-Brand — r10) | production, qc | QC |
| 5 | **Batch → QC ผ่าน** (QC) | PRD line=พร้อมส่งมอบ (eligible) → **เปิดปุ่ม "พร้อมส่ง" ที่หน้าผลิต** | qc, production | — |
| **5b** | **★ r9 กด "✓ พร้อมส่ง"** (Production, QC-gated, confirm popup) | **capture surplus (actual − ordered → FG, D13)**; PRD=พร้อมส่ง; **ทุก PRD พร้อมส่ง → PO/SO=พร้อมส่ง** → โผล่คิวจัดส่ง | production, stock (FG), po-detail, shipping | Shipping (เมื่อ PO พร้อม) |
| 6 | **Batch → QC ไม่ผ่าน** (QC + feedback "QC ไม่ผ่าน") | Batch=ไม่ผ่าน; **PRD=Rework (กำลังผลิต · Rework — r10)** | qc, production | Production |
| 7 | **PRD Rework → เริ่มผลิตซ้ำ** (Production) | **gen Batch run ถัดไป** → กลับคิว QC; ใช้วัตถุดิบเพิ่ม (FIFO/ติดลบได้) | production, qc, stock | QC |
| 8 | **PRD → Hold** (Production, เหตุลูกค้า/stock) | raise Sale/Stock; (เหตุลูกค้า) ตั้ง flag ⚑ ที่ลูกค้า | production, po-detail, customers | Sale หรือ Stock |
| **9** | **★★ r11 สร้าง Route + เพิ่ม order พร้อมจัดส่ง** (Shipping) | **gen เลข RT + DN ราย order** (G8/NS7); Route=เตรียมจัดของ; **DN=อยู่ระหว่างการเตรียม**; **PO/SO สะท้อน "อยู่ระหว่างการเตรียม"** | shipping, delivery-note, po-detail, so-detail | — |
| **9b** | **★★ r11 Route → กำลังออกไปส่ง** (Shipping) | DN=อยู่ระหว่างจัดส่ง; **PO/SO สะท้อน "อยู่ระหว่างจัดส่ง"** | shipping, delivery-note, po-detail | — |
| **10** | **★★ r11 DN → ส่งสำเร็จ** (Shipping, Route "เสร็จสิ้น" / แก้ตรง A) | ตัด FG FIFO; **PO/SO สะท้อน "ส่งสำเร็จ"**; เริ่มนับ overdue | delivery-note, po-detail, stock | Finance + Sale |
| **11** | **★★ r11 DN → ลูกค้ายกเลิก / ยังไม่กำหนดวันรับใหม่** (Shipping) | **PO/SO สะท้อนสถานะนั้น**; (ยังไม่กำหนดวัน = ฝากของ) | delivery-note, po-list, shipping | Sale |
| **12** | **★★ r11 DN → ลูกค้าเลื่อนส่ง** (Shipping, บังคับ next date) | **PO/SO สะท้อน "ลูกค้าเลื่อนส่ง"**; order ค้างคิว รอ re-route (gen DN ใหม่รอบหน้า) | delivery-note, shipping | Shipping |
| 13 | **ออก Invoice** (Finance) | PO billing=วางบิลแล้ว; + Customer financial summary อัปเดต | invoices, po-detail, customer-detail | — |
| 14 | **Overdue** (scheduler) | billing=เกินกำหนด; auto ตั้ง flag ⚑ เหตุ "ค้างชำระ" | invoices, dashboard, customer-detail | Finance + Sale |
| 15 | **PO วัตถุดิบขาด** (ตอนเปิด PO) | เตือน(ไม่บล็อก, เทียบ available) + gen PR | po-create, purchase-request | Stock + Production |
| 16 | **ผลิตตัด stock ติดลบ** (Batch เริ่มผลิต) | stock ติดลบ + trace; badge แดง | stock, production, trace | Stock |
| 17 | **★ r10 Goods Receipt บันทึกรับ** (Stock) | **gen Lot รอตรวจ + GR object (QC ตรวจสอบ) · ยังไม่บวก stock** + อ้าง PR | goods-receipt, stock (GR tab), purchase-request | Stock/Production (QC) |
| **17b** | **★ r10 QC ตรวจรับ "ผ่าน"** (QC) | **บวก stock กลับ + FIFO retro-link + `GR (+)` + Available เพิ่ม** + ปิด/อัปเดต PR + GR=ผ่าน + Lot=พร้อมใช้ | qc, stock, goods-receipt, purchase-request, trace | Stock/Production |
| 18 | **★ r10 QC ตรวจรับ "ไม่ผ่าน"** (QC) | **ไม่บวก stock** → Lot=ระงับ + GR=ไม่ผ่าน → คืนของ/ส่งกลับ QC/ยกเลิก | qc, stock (GR tab), return | Stock |
| **18b** | **★ r10 GR ส่งกลับ QC / ยกเลิก** (Warehouse) | ส่งกลับ: Lot→รอตรวจ + GR→QC ตรวจสอบ · ยกเลิก (ก่อน credit): GR→ยกเลิก (void) | stock (GR tab), goods-receipt, trace | — |
| 19 | **PO ยกเลิก → เปิดใหม่(ร่าง)** (Sale/Admin) | คงเลข PO เดิม + trace; **+ Release reservation ที่ยังไม่ consume** | po-detail, stock | Production |
| 20 | **★ Reservation (r5)** | Reserved/Available เปลี่ยน (ดู `stock-reservation.md`) | stock, po-detail | Stock (ถ้า available ติดลบ) |
| 21 | **★ Customer → Disabled/Blacklist (r6)** | **HARD block เปิดงานขายใหม่ (QT/PO/SO)**; เดิมเดินต่อ (no cascade) | customers, quotation/po/so-create | Sale |
| 22 | **★ QT ยกเลิก (Cancelled) — ทุกสถานะ (r7)** | QT=ยกเลิก + activity-log; PO ที่ผูก = loose ref → ไม่ cascade | quotation-detail, trace | — |
| 23 | **★ BOM → Inactive (r8)** | **HARD block เปิด QT/PO/SO ใหม่** + **กันออก Supply Planning**; งานที่วิ่งอยู่เดินต่อ | bom, quotation/po/so-create, supply-planning | — |
| **24** | **★ PO ถูกแก้ไข (รวมจากบริบทการผลิต — under-production) (r9)** (PO.Update / Production) | **raise ⚑ "ต้องติดตาม" ที่ลูกค้า** + **audit ละเอียดระดับ field** + ปรับ reservation (delta ถ้าแก้ qty) | po-detail, production, customers, trace | — (flag ไม่ยิง noti) |
| **25** | **★★★ r11 แก้สถานะ DN โดยตรง (สิทธิ์ A)** (Shipping.Approve) | DN เปลี่ยนสถานะ + บังคับ comment; **PO/SO สะท้อน DN ล่าสุด** | delivery-note, po-detail, so-detail, trace | (ตามสถานะ: ส่งสำเร็จ = Finance+Sale) |

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
                                          │                     └─► ตัดจริง — เลือก lot มี stock; หลาย lot = FIFO (ติดลบได้) [r5/r9]
                                          │  [Production] กด "ส่งตรวจ QC"
                                          ▼
                                    PRD/Batch = รอ QC ([Production] "ไปหน้า QC ›" → qc ตรวจแบตช์ sub-tab OEM/Own-Brand [r10])
                                          │  [QC] ตัดสินราย Batch (ที่หน้า qc เท่านั้น)
                          ┌───────────────┴───────────────┐
                    ✕ ไม่ผ่าน (+feedback "QC ไม่ผ่าน")   ✓ ผ่าน
                          │                                │
                Batch=ไม่ผ่าน · PRD=Rework [r10]        PRD line = พร้อมส่งมอบ (eligible)
                → gen Batch run+1 ──► วนกลับ QC          │  [Production] กด "✓ พร้อมส่ง" (QC-gated) [r9]
                                              PRD = พร้อมส่ง (Ready to Ship) → capture surplus→FG (D13)
                                                         │  (ทุก PRD ของ PO พร้อมส่ง)
                                                         ▼
                                              PO = พร้อมส่ง (Ready to Ship) ──► โผล่คิวจัดส่ง
                                                         │  [Shipping] สร้าง Route (RT-…) → gen DN ราย order (G8/NS7)
                                                         ▼
                                    Route = เตรียมจัดของ → กำลังออกไปส่ง → เสร็จสิ้น (สรุปผลราย DN + comment)
                                    DN: อยู่ระหว่างการเตรียม → อยู่ระหว่างจัดส่ง → ส่งสำเร็จ/เลื่อน/ยกเลิก/ยังไม่กำหนดวัน
                                    PO/SO delivery status = สะท้อน DN (ทุกจอ · po.md §4b)
                                                         │  DN ส่งสำเร็จ ──► ตัด FG FIFO + เริ่มนับเครดิต
                                                         │  [Finance] ออกใบแจ้งหนี้   INV-{YYYY}-{NNNNNN}
                                                         ▼
                                              billing = วางบิลแล้ว → ชำระแล้ว / เกินกำหนด
```
**★ เส้นวัตถุดิบ (ขนาน · r10):** PO วัตถุดิบขาด → **PR** → [Stock] **Goods Receipt** → **GR object (QC ตรวจสอบ) + Lot รอตรวจ (ยังไม่ credit)** → [QC] **ตรวจรับ**: **ผ่าน → บวก stock + FIFO retro-link + Lot พร้อมใช้** · **ไม่ผ่าน → ไม่บวก + Lot ระงับ** → ใช้ผลิต Batch
**★★★ หมายเหตุ Route/DN r11:** รอบ = "Route" (`RT-…`, ★Q1 vs SHP); "เสร็จสิ้น" = action บังคับสรุปผลราย DN + comment; DN 6 สถานะ; **PO/SO delivery status = mirror DN ทุกจอ**; DN สร้างตรงไม่ได้; แก้สถานะ DN ตรง = สิทธิ์ A.

---

## 4. ตรวจ mockups ปัจจุบัน สอดคล้องนิยามนี้ไหม (รายการแก้ — ไม่แก้เอง)
| จุด | สถานะ | รายการแก้ (ให้ UX/UI) |
|---|---|---|
| **★★★ r11 Shipping→Route + DN rewrite** | ⚠ ต้องแก้ | **shipping.html:** Route list (ค้นคนขับ/username/route-id + ช่วงวันชนิดวัน + คอลัมน์ RouteID/วันสร้าง/วันออกส่ง/จำนวน PO-SO/Status + ปุ่ม "สร้าง Route"); create/update Route (คนขับ/เบอร์\*/route/ประเภทรถ\*/ทะเบียน/วัน-เวลา + modal เพิ่ม PO/SO/DN เรียงตามวันต้องการรับ + modal รายละเอียด order แสดง ที่อยู่จัดส่ง/ผู้รับ + status actions + "เสร็จสิ้น" บังคับสรุป DN); เลข RT/DN ตอนบันทึก + popup DN ต่อ PO/SO. **delivery-note.html:** DN 6 สถานะ + ค้น (คนขับ/username/route-id/วันชนิดวัน · PO-SO · วันลูกค้าต้องการรับ) + filter สถานะ + print DN/Invoice + comment + แก้สถานะตรง (A). (ดู `modules/shipping.md`/`modules/delivery-note.md`) |
| **★★★ r11 PO/SO delivery status = mirror DN (ทุกจอ)** | ⚠ ต้องแก้ | po-list/po-detail/so-list/so-detail/dashboard/production-queue/home: แสดงสถานะจัดส่งด้วย combined logic (สถานะ PO เอง → พร้อมจัดส่ง → สะท้อน DN 6 ค่า) — เลิกใช้ In Delivery/Delivered เดิม (ดู `modules/po.md` §4b) |
| **★★★ r11 Customer address + receiver-contact** | ⚠ ต้องแก้ | customer-create/detail: 2 ช่องที่อยู่ (ลูกค้า/จัดส่ง) + option "ใช้ที่อยู่เดียวกัน"; contact เพิ่ม checkbox "เป็นคนรับสินค้า" (ติด = ชื่อ+เบอร์บังคับ) (ดู `modules/customer.md` §3/§9b) |
| **★★ r10 QC-gated stock-in + GR object + ตรวจแบตช์ sub-tabs** | ⚠ ต้องแก้ | qc/goods-receipt/stock (คงตามรอบก่อน) |
| **★ Production queue 2 tabs + management page (r9)** | ⚠ ต้องแก้ | production.html (คงตามรอบก่อน) |
| **★ Stock Adjust อ้าง Lot/FIFO (r9)** | ⚠ ต้องแก้ | stock.html (คงตามรอบก่อน) |
| **★ Quotation lifecycle r7/r7.1** | ⚠ ต้องแก้ | quotation-list/detail (คงตามรอบก่อน) |
| **★ BOM Active/Inactive + code lock (r8)** | ⚠ ต้องแก้ | bom-create (คงตามรอบก่อน) |
| **★ Customer status 6→5 + follow-up flag (r6/r9)** | ⚠ ต้องแก้ | customers/customer-detail (คงตามรอบก่อน) |
| 1 line = 1 PRD | ✅ ตรง | production แสดง PRD ต่อ line |
| Batch เกิดตอนเริ่มผลิต | ✅ ตรง | production alert อธิบายชัด |
| **PRD numbering format** | ✅ แก้แล้ว | `PRD-{YYYYMM}-{NNNNNN}` |

---

## 5. คำถามถึงปอนด์
- **r4 (3 ข้อ): ตอบครบแล้ว ✅**
- **Deletion Policy: ตอบครบ 7 ข้อ ✅**
- **★ r5–r10: ไม่มีคำถามค้าง** (Reservation Option A · Customer 5+flag · Quotation Confirmed · BOM Active/Inactive · Production พร้อมส่ง QC-gated · QC-gated stock-in + GR object) — settled รอบก่อน.
- **★★★ r11 Shipping/Route + DN (2026-07-30): มี open Q1** —
  - **Q1 (GENUINE) — RT vs SHP numbering:** รอบจัดส่งเดิม `SHP-{YYYYMMDD}-{NNNN}` (locked D-F5). ปอนด์ให้รอบเป็น "Route" รหัส `RT-…`. **PO เสนอ (ตัวเลือก A): RT แทน SHP ทั้งหมด** (rename, `RT-{YYYYMMDD}-{NNNN}` gapless ต่อวัน, ไม่มีข้อมูลจริงต้อง migrate). **ตัวเลือก B:** RT อยู่ร่วมกับ SHP (2 เลข). เอกสารเขียนด้วยสมมติฐาน A ไว้ก่อน — รอปอนด์ยืนยัน. (`modules/shipping.md` §12)
  - **settled (PO reasonable decision, override ได้):** DN 6 สถานะ (supersede ชุดเดิม 4); "เสร็จสิ้น" = action บังคับสรุป DN + comment; **PO/SO delivery status = mirror DN, rollup = DN ล่าสุด (active)** (1 DN = 1 PO เต็ม → ไม่มีหลาย DN active พร้อมกัน); DN สร้างตรงไม่ได้; แก้สถานะ DN ตรง = สิทธิ์ A.
