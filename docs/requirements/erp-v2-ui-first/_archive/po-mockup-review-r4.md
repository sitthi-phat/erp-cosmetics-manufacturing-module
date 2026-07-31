# PO Mockup Review — รอบ 4 + 4.5 (ผลตรวจ) — ESSENCE Hub System

ผู้ review: PO (แทนปอนด์ — ละเอียดที่สุด) · 2026-07-09 · ต่อจาก `po-mockup-review.md` §8
รอบ 4 = โครงสร้าง/flow (ผ่าน §1–§5) · **รอบ 4.5 = ฝัง dataset กลาง — ตรวจความตรงข้ามหน้า (§6) = ผ่าน → เปิด Gate 1**

## สรุปภาษาไทย
รอบ 4 mockups โครงสร้าง+flow ครบ (Batch/rework loop, create pages, GR multi-line, dashboard filter). รอบ 4.5 UX ฝัง `mock-data-spec.md` (dataset เดียว 8 use cases) ลงทุกหน้า. **PO ตรวจเองข้ามหน้าแล้ว (เปิดไฟล์จริง เทียบ mock-data-spec) — ข้อมูลตรงกันทุกจุดที่ตรวจ = ผ่าน** เปิด Gate 1 รอบ 4 ให้ปอนด์

## 1–5 (รอบ 4) — ผ่านทั้งหมด
P0/P1/P2 จาก §8 ปิดครบ · โจทย์ปอนด์รอบ 3 9/9 · Batch `B-{PO}-{line}-{run}` + rework loop (ก-ง) ตรง journeys §3.1/§3.2 (รายละเอียดในเวอร์ชันก่อนหน้าของไฟล์นี้)

---

## 6. ผลตรวจรอบ 4.5 — ความตรงของข้อมูลข้ามหน้า (เปิดไฟล์จริง เทียบ `mock-data-spec.md`)

| # | จุดตรวจ | ผล | หลักฐาน (ไฟล์จริง) |
|---|---|---|---|
| 1 | **PO-202607-000181** rework (line2 run1→run2) ตรงทุกหน้า | ✅ | po-list: "กำลังผลิต · line2 rework" · production: B-PO-202607-000181-1-1 (รอ QC) + B-PO-202607-000181-2-2 badge Rework + feedback "เนื้อโฟมเป็นก้อน" · qc: B-…-181-2-2 Rework + ประวัติ run1 · po-detail: line1 รอ QC / line2 Rework run2 (ผ่าน 0/2) · trace: audit "B-…-181-2-1 → ไม่ผ่าน (ตีกลับ line #2)" |
| 2 | **เดอร์มา แคร์ = ต้องติดตาม** โยง PO-188 Hold | ✅ | customers: CUS-000021 badge "ต้องติดตาม" + "ติดตาม: โทรยืนยันการแก้สูตร PO-202607-000188 (งานผลิตติด Hold)" · customer-detail: Follow-up + link PO-188 · dashboard: tile ต้องติดตาม + drill-down · po-list: PO-188 เดอร์มา "กำลังผลิต · Hold" |
| 3 | **SHP-20260708-0046 = ส่งบางส่วน** | ✅ | delivery-note: DN-00122(PO-174) ส่งถึงแล้ว / DN-00123(PO-175) ถูกปฏิเสธ / DN-00124(PO-178) เลื่อนส่ง 10/07 + notify raise Sale / Postpone · po-list: PO-175 "ถูกปฏิเสธ กลับคิว", PO-178 "Postpone 10/07" |
| 4 | **GR-008 partial → PR-032** | ✅ | purchase-request: PR-000028 แอลกอฮอล์ 250 "รับบางส่วน (200/250)" + PR-000032 "50 ล. · ของขาดจาก GR-008 · เปิดคำขอ" · flow เปิด→รับทราบ→รับบางส่วน 200/250 |
| 5 | **8 use cases ครบใน po-list** + INV-135↔PO-176 + doc format | ✅ | po-list 11 rows = 8 UC (PO-191/188/185/181/178/176/175/174/173/172/170) ตรง §C · invoice-detail crumb INV-2026-000135 ผูก PO-202607-000176 · format ถูก PO-{YYYYMM}-{NNNNNN}, B-{PO}-{line}-{run}, DN-{YYYYMMDD}-{NNNNN}, SHP-… |
| 6 | Thai encoding (arrow/ป้าย) | ✅ | อ่านไฟล์จริงหลายหน้า — ภาษาไทย + ↩️📦→✓ แสดงถูก ไม่มี mojibake (perl arrow bug แก้แล้ว) |
| — | Sale assignment สอดคล้อง | ✅ | เดอร์มา/กลอรี่=สมหญิง · บิวตี้=สมชาย · สวยใส/ปิดกิจการ=อารดา ตรงทุกหน้า |
| — | ลูกค้า 7 ราย ครบ 6 สถานะ | ✅ | ผู้สนใจ/ประจำ/ห่างหาย/ต้องติดตาม/ปิดใช้งาน/บัญชีดำ (customers) |

**คำตัดสิน: ผ่าน** — ข้อมูลก้อนเดียวกันตรงกันข้าม module ทุกจุดที่ตรวจ · ไม่พบข้อมูลขัดกัน · เปิด Gate 1 รอบ 4

---

## 7. คู่มือ review สำหรับปอนด์ (เดินเรื่อง 8 use cases ให้เห็นครบใน ~10 นาที)
เริ่มที่ **`index.html`** (สารบัญ + ป้าย 🟢ใหม่/🔵แก้) แล้วเดินตามเส้นเรื่องนี้:

1. **หน้าหลัก + Dashboard (1 นาที):** ดู home (งานที่รอ) → dashboard กดสลับแผนก + กด tile "ต้องติดตาม" (drill-down) + ลอง date filter (เดือนนี้/กำหนดเอง) สังเกต caption "ในช่วง/ตอนนี้"
2. **ลูกค้า (1.5 นาที):** customers เห็นครบ 6 สถานะ → กด **เดอร์มา แคร์ (ต้องติดตาม)** → customer-detail เห็นเหตุโยง **PO-188 Hold** + note timeline · ลอง "เพิ่มลูกค้า"/"เพิ่มผู้ติดต่อ" (หน้า create จริง ฟอร์มว่าง)
3. **เปิด PO ใหม่ = UC1 (1 นาที):** po-create (PO-191 ร่าง, สวยใส/Lead) เห็น suggest + เช็ควัตถุดิบ
4. **การผลิต + QC = UC2/4/5 (2.5 นาที — หัวใจ GMP):** production เห็นคิว → **PO-181 line2 badge "Rework" (B-…-181-2-2) + feedback** · หน้าผลิต**ไม่มีปุ่ม "QC ไม่ผ่าน"** · ไป qc แท็บ "ตรวจแบตช์" → ตัดสินราย Batch, เห็น **ประวัติ run1 ไม่ผ่าน** + **Lot→Batch (GMP chain)** · ดู PO-188 (Hold), PO-170 (rework run2 ผ่าน)
5. **PO detail = reconcile (1 นาที):** po-detail (PO-181) เห็น **การ์ดเปลี่ยนสถานะ PO** + ตารางราย line/Batch/QC (ผ่าน 0/2) + trace มี rework
6. **คลัง/จัดซื้อ = UC ของขาด (1.5 นาที):** goods-receipt (multi-line, 1 GR หลาย PR, **กล่องยืนยันสร้าง PR ของขาด**) → purchase-request (PR-028 รับบางส่วน→PR-032) → supplier (layout ใหม่เต็มจอ, active/inactive, price matrix) → bom-create (block ถ้าไม่มี supplier active)
7. **จัดส่ง = UC6/7/8 (1.5 นาที):** shipping (สร้างรอบ 2 ทาง + คนขับ/รถ) → delivery-note **SHP-0046 (ส่งบางส่วน)**: DN-122 ส่งถึง / DN-123 ถูกปฏิเสธ→raise Sale / DN-124 เลื่อน 10/07
8. **การเงิน + trace (0.5 นาที):** invoices → INV-135 (PO-176) ใบกำกับภาษีไทย · trace ค้น **B-PO-202607-000170** เห็น Lot→Batch(run1 ไม่ผ่าน→run2 ผ่าน)→line→PO→ลูกค้า + audit ระดับ field

> ทุกหน้ามี **กระดิ่งแจ้งเตือน (มุมบนขวา)** กดดูรายการ→deep link · responsive (ลองย่อจอ) · ทุกเลขเอกสารเชื่อมถึงกัน (คลิกได้)
> **จุดที่อยากให้ปอนด์ยืนยันเป็นพิเศษ:** (ก) rework loop เข้าใจง่าย ไม่งงไหม (ข) การจัดส่ง 2 ชั้น (รอบ/DN) ชัดไหม (ค) Batch format `B-{PO}-{line}-{run}` โอเคไหม
