# PO Review — Stage 2 Package (Gate 2) · ESSENCE Hub System

slug: `erp-v2-ui-first` · ตรวจโดย PO · 2026-07-10 · **รอบ 1 = PASS · รอบ 2 (depth) = PASS · รอบ 3 (Stock Reservation) = PASS · M1 ปิดแล้ว (per-lot 625)** → **พร้อมเปิด Gate 2 ให้ปอนด์ (ไม่มี blocker ค้าง)**
ขอบเขตตรวจ: BA `functional-spec/` (24 ไฟล์ · 70 stories/210 AC) + TL `architecture/` (index + db-schema + 17 api + scheduled-jobs) + `docs/adr/001–009 (+ADR-001 addendum reservation)`

## สรุปภาษาไทย
ตรวจงาน BA และ Tech-Lead ครบทั้งสองฝั่งโดยเปิดไฟล์จริง 3 รอบ — **ทุก journey จบทุก case** (entity/สถานะ + cascade C1–C20 + 8 UC + 30 exception + 6 User Journeys) · AC วัดผลได้ อ้าง element จริง ตรงกติกาล่าสุดทุกข้อ · **รอบ 3 (Stock Reservation):** เพิ่มชั้นจอง/ตัดจริง/คืน ครบทั้ง 3 สาย (BA↔API↔DB↔mockup) และ **สะท้อนคำตอบปอนด์ครบ** (ตัดจริงตอนเริ่มผลิต, dialog คืน/ไม่คืนหลังผลิต, threshold=Available, จองเกิน=เตือน, rework ตัด available, มูลค่า per-lot 625) · **M1 (สูตรมูลค่า) ปิดแล้ว = per-lot 625** · **ไม่เหลือ blocker** (คงเหลือ confirm 1 จุด cosmetic = รอบ inactive {1,3,6,8})

---

## 1. ผลตรวจตามเกณฑ์ (รอบ 1)

### เกณฑ์ 1 — ทุก journey จบทุก case ✅
- **Entity + สถานะ (entity-status-map §1):** ครบทุก entity — Customer(6), PO 2 ราง, PRD(รอรับงาน→รับงาน→กำลังผลิต→รอ QC→พร้อมส่งมอบ/Rework/Hold), Batch, Lot, PR, GR, Shipment, DN, Invoice · แต่ละตัวมี module + story + ตาราง DB
- **Cascade C1–C19:** `continuity.html` มีครบ 17 แถว + 2 แถวเสริม (reassign, return) + Notification matrix 14 แถวพร้อม deep link ปลายทางถูกต้อง · ตรงกับ TL `architecture/index §7` (endpoint ต่อแถว) และ db-schema (outbox/notification/ack)
- **8 Use Case + เส้นวัตถุดิบ:** `walkthrough.html` เดินครบ UC1–UC8 + materials line ทุกขั้นผูก story (PO-191 draft, PO-188 Hold→Follow-up, PO-176 QC pass, PO-181 rework ราย line, PO-170 rework ครบวง, SHP-0044/45/46) — ตรง dataset กลาง
- **30 exception:** `rtm.html` §exception ผูกทุกกลุ่มกับ story จริง (วัตถุดิบขาด, ราคา 0, QC ไม่ผ่าน, Hold, reject/postpone, PR ค้าง, supplier inactive, BOM block, negative stock, void/gapless, soft-delete ฯลฯ)

### เกณฑ์ 2 — คุณภาพ AC (สุ่มลึก 5 module: PO/Production/Invoice/Stock/Customer) ✅
- ทุก story มี **Given/When/Then ครบ happy/edge/error** (≥3 AC/story) · อ้าง element จริง (ปุ่ม "ยืนยัน PO", การ์ด "เปลี่ยนสถานะ PO", คิว "รอรับงาน", badge "ติดลบ (รอรับเข้า)", ปุ่ม "รับงาน/เริ่มผลิต/ส่งตรวจ QC/ผลิตซ้ำ")
- **ตรงกติกาล่าสุดทุกข้อ:** PRD เกิดตอน "รับงาน" (ไม่ auto, US-PRD-01) · negative stock + FIFO retro-link (US-STK-03 edge) · VAT ยึด invoice date (US-INV-02) · เครดิตระดับลูกค้า + นับ overdue หลังส่งของ (US-INV-03) · void ไม่ลบ/gapless (US-INV-04) · deletion 7 กติกา + COGS out of scope (rbac-deletion) · Follow-up comment บังคับ (US-CUS-03)
- **ไม่พบ AC คลุมเครือ/วัดไม่ได้** ในกลุ่มที่สุ่ม

### เกณฑ์ 3 — ฝั่ง Tech-Lead ✅
- **API ครบทุก transition:** `api-production` = accept/start/submit-qc/rework/hold/resume (QC pass/fail อยู่ module QC ถูกต้อง) · index §7 coverage แสดง endpoint ต่อ cascade ครบ
- **DB รองรับทุก AC:** `production_queue_item`→`production_order`(PRD)→`batch`(run_no) · `stock_movement` append-only + `batch_material_consumption` FIFO retro · `sequence`(gapless) · `audit_log`(field) · `outbox/notification/notification_ack` · `vat_config` · soft-delete ทุก master · `shipment` 1:N `delivery_note` · `invoice_version`
- **NFR ครบ 9 ข้อ** (§6) · **จุด TL ขอ confirm (ก/ข/ค): ตรวจแล้วรองรับ**

### เกณฑ์ 4 — ลิงก์ (สุ่มคลิก) ✅ · เกณฑ์ 5 — ไม่ประดิษฐ์กติกาใหม่ ✅
ทุกกติกาอ้าง entity-status-map / deletion-policy / stock-reservation / คำตอบปอนด์ · path ไม่ตายในชุดที่สุ่ม

---

## 2. ข้อ "ควรยืนยัน" ตอน review (ไม่บล็อก)
1. **รอบ Active→Inactive = ชุด {1, 3, 6, 8} เดือน (default 3):** BA (US-CUS-02) + TL (db-schema) กำหนดชุดนี้ — ปอนด์เคยยืนยันแค่ "default 3 ปรับได้" · ควรเคาะว่าจำกัดชุดนี้หรือกรอกอิสระ (แก้ทันทีถ้าต่าง)
2. ตัวเลข story/AC พาดหัว sync ให้ตรง (cosmetic) · 3. anchor US-PRD-06 (cosmetic)

---

## 5. รอบ 2 — Depth-fix + Tri-layer Alignment (spec ↔ API ↔ DB)

### 5.1 depth-fix ผ่านทุก module ตาม Depth Standard
Dashboard 2→**US-DSH-01..04 + 7 story รายแผนก (29 tile)** · Home **US-HOME-01..03** · Settings 2→**US-SET-01..05 (5 จอ)** · Platform **US-PLT-01..05** · PO +**US-PO-07** · Stock +**US-STK-05** · +**list-conventions US-LST-01** — ครบ ✅

### 5.2 Tri-layer (สุ่มลึก) ✅
Dashboard 29 tiles↔api-dashboard (Read-scope) · Home↔/api/home aggregator · global search↔/api/search (Read-filtered) · Settings↔DELETE users+reassignToUserId(1 tx) · US-PO-07↔/api/po/suggest · session↔/api/auth/session — ตรงหมด

### 5.3 ตัดสิน 2 จุด TL ขอ confirm
- **(ก) Admin เห็นทุกแผนก → ปิด: Read-bit ล้วน** (dashboard US-DSH-04 + api-dashboard §perm ถูกแล้ว)
- **(ข) มูลค่าสต็อก (M1) → ✅ ปิดแล้ว (2026-07-10): ปอนด์เลือก per-lot = 625** · BA (US-STK-05/US-DSH-STK) และ TL (api-stock/api-dashboard/db-schema) sync เป็น **Σ ต่อ lot (lot.on_hand × ราคาซื้อล่าสุดของ lot นั้น) · ไม่หัก Reserved** ตรงกันแล้ว — **ไม่มี misalignment เหลือ**

### 5.4 HTTP :3000 — PO ทำเองไม่ได้ (ไม่มี shell/browser)
ตรวจ content/alignment ครบด้วยการเปิดไฟล์จริง · coordinator ยืนยันทุกไฟล์ **HTTP 200 แล้ว** · render จริงฝาก ux/dispatcher ยืนยันตอน pre-invite

---

## 6. รอบ 3 — Stock Reservation (Lock/จอง) — PASS ✅
ปอนด์ถามเรื่อง lock stock → PO ออกแบบ (`stock-reservation.md`) → BA/TL/UX ทำครบ 3 สาย · ตรวจ tri-layer + ยืนยันคำตอบปอนด์สะท้อนครบ:

| ประเด็น (คำตอบปอนด์) | BA (spec) | TL (API/DB) | ผล |
|---|---|---|---|
| **3 ยอด** คงคลัง/จองแล้ว/ใช้ได้ (Available=on_hand−Reserved) | US-STK-01/03 + data-rules | `reserved_balance` cache + `/api/stock/{id}/availability` | ✅ |
| **จอง ตอน PO Confirmed** = ΣBOM×qty | US-PO-02 cascade | `POST /po/confirm` สร้าง reservation ต่อ line (1 tx) | ✅ |
| **ตัดจริง ตอน "เริ่มผลิต"** (convert จอง→consume FIFO, Available ไม่ขยับ) | US-PRD-02 + US-STK-03 | `POST /production/start` reserved→consumed + production_consume FIFO (ติดลบ+retro) | ✅ |
| **Cancel = คืน + dialog คืน/ไม่คืนหลังผลิต** | US-PO-04 + po-detail dialog | `POST /po/cancel {returnMaterials}` → line ยังไม่ผลิต RELEASE auto; ผลิตแล้ว true=**cancel_return**(+on_hand) / false=**write_off** | ✅ |
| **Hold แก้ PO → ปรับจอง** (delta reserve/release) | US-PO-05 | `PATCH /po/{id}` recompute ΣBOM×qty → delta | ✅ |
| **เกณฑ์ใกล้หมด = Available** | US-STK-01 + US-DSH-STK | api-dashboard threshold=available | ✅ |
| **จองเกิน available = เตือนไม่บล็อก** (2 ชนิดติดลบแยก: จองเกิน vs กายภาพ) | US-STK-03 (on_hand 66/จอง 70/ใช้ได้ −4 badge "จองเกิน") | confirm/suggest warn-not-block | ✅ |
| **Rework ตัด available** (ไม่ pre-reserve) | US-PRD-04 | `POST /production/rework` ตัด available (ติดลบ+เตือน) | ✅ |
| **มูลค่าสต็อก = on_hand เท่านั้น ไม่หัก Reserved** (per-lot 625) | US-STK-05 | api-stock value | ✅ (M1 ปิด) |
| **US-STK-06** ดูใครจอง (reservation view) | US-STK-06 | `GET /api/stock/{id}/reservations` | ✅ |
| suggest เทียบ **available** | US-PO-07 | `/api/po/suggest` shortBy=required>available | ✅ |

- **DB:** `reservation` table + `reserved_balance` cache (≥0) + `cancel_return`/`write_off` movement + scheduled-jobs dual-cache — ครบ ✅
- **user-journeys (ไฟล์ PO — BA แก้จุดอ้าง story):** ตรวจแล้ว **การแก้ถูกต้อง ไม่บิดเนื้อเรื่อง** — J2 "ร่างยังไม่จอง"→Confirmed จอง, suggest vs Available, cancel dialog คืน/ไม่คืน, Hold ปรับจอง delta; J3 "convert จอง→ตัดจริง FIFO (Reserved↓/on_hand↓/Available ไม่ขยับ)", rework ตัด Available · **ยอมรับ ไม่ต้อง revert**
- **ไม่ regress:** เกณฑ์รอบ 1–2 (journey/cascade/depth/link) ยังผ่านครบ · cascade เพิ่ม C20 (reservation) ทั้ง entity-status-map + continuity

---

## 3. คู่มือ review Gate 2 สำหรับปอนด์ (~15 นาที · ฉบับสุดท้าย)
**เริ่มที่:** `functional-spec/index.html` → การ์ด **★ User Journeys** (เปิดผ่าน http://localhost:3000/…) · และ `architecture/index.html` (TL)

| ลำดับ | เปิดหน้า | ดูอะไร (นาที) |
|---|---|---|
| 1 | functional-spec/**user-journeys** ★ | เรื่องคนทำงานจริง 6 สาย (Customer→PO→ผลิต→QC→จัดส่ง→Billing) — ตรวจว่า requirement ตรงชีวิตจริง (~3) |
| 2 | functional-spec/**stock** US-STK-03/05/06 ★reservation | **3 ยอด (คงคลัง/จองแล้ว/ใช้ได้)** + จองเกิน + มูลค่า per-lot 625 (~2) |
| 3 | functional-spec/**po** US-PO-02/04 ★reservation | ยืนยัน=จอง / ยกเลิก=คืน + **dialog คืน/ไม่คืนหลังผลิต** (~1.5) |
| 4 | functional-spec/**dashboard** ★ | 7 แผนก × 29 tile + date-filter (จุดที่ปอนด์ทักตื้น=แก้แล้ว) (~2) |
| 5 | functional-spec/**home** + **platform** ★ | task-inbox ราย role · global search · noti panel · session warning (~2) |
| 6 | functional-spec/**settings** | 5 จอ (User+bulk-reassign · audit-log) (~1) |
| 7 | architecture/**index** §1–2 diagram + §7 · (ทางเลือก) **db-schema** §material+reservation | system/service diagram + stock ledger ติดลบ + reservation (~2) |

**จุดตัดสินใจตอน review (เหลือน้อย — ไม่มี blocker):**
- ✅ requirement + NFR + depth + reservation ครบพอเริ่ม dev หรือยัง (Gate 2 = อนุมัติสิ่งนี้)
- ✅ **M1 (มูลค่าสต็อก) ปิดแล้ว = per-lot 625** · **Reservation 5 คำถาม = ปอนด์ตอบครบแล้ว** (สะท้อนใน spec ครบ)
- ❓ (cosmetic เดียว) รอบ Active→Inactive: ชุด {1,3,6,8} หรือกรอกอิสระ (§2 ข้อ 1) — แก้ 1 บรรทัดถ้าต่าง
- ✅ ถ้าอนุมัติ → Stage 3 (Engineer ∥ QA ∥ BA); อยากปรับ UI → วน Stage 1 incremental

---

## 4. สถานะ handoff
- **รอบ 1/2/3 = PASS · M1 ปิด · Reservation aligned ทั้ง 3 สาย** → **เปิด Gate 2 (ไม่มี blocker ค้าง)**
- **ให้ dispatcher/ux-ui:** render check :3000 ก่อนเชิญปอนด์ (PO ไม่มี browser tool — coordinator ยืนยัน HTTP 200 แล้ว)
- **cosmetic (ทำเมื่อไรก็ได้):** BA sync ตัวเลข story/AC + anchor US-PRD-06 + (ถ้าปอนด์เคาะ) รอบ inactive set
