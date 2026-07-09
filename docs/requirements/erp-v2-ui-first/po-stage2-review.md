# PO Review — Stage 2 Package (Gate 2) · ESSENCE Hub System

slug: `erp-v2-ui-first` · ตรวจโดย PO · 2026-07-09 · **ผลตรวจ = ผ่าน (PASS)** · เปิด Gate 2 ให้ปอนด์อนุมัติ
ขอบเขตตรวจ: BA `functional-spec/` (22 ไฟล์) + TL `architecture/` (index + db-schema + 15 api) + `docs/adr/001–009`

## สรุปภาษาไทย
ตรวจงาน BA และ Tech-Lead ครบทั้งสองฝั่งโดยเปิดไฟล์จริง — **ทุก journey จบทุก case**: entity ทุกตัว/ทุกสถานะ + cascade C1–C19 + 8 use case + 30 exception มี story+AC และมีตาราง DB/endpoint รองรับครบ · AC เขียนแบบ Given/When/Then วัดผลได้ อ้าง element จริงใน mockup และตรงกับกติกาล่าสุดทุกข้อ (PRD กดรับงานเอง, stock ติดลบ+FIFO retro-link, deletion 7 กติกา, VAT ตามวันออกใบ, เครดิตระดับลูกค้า, เลข gapless, session 06:00) · ฝั่ง TL มี endpoint ต่อทุก transition + schema รองรับทุก AC + 9 ADR + coverage ครบ · **ผ่าน** — มีข้อ "ควรยืนยัน" เล็กน้อย 3 จุด (ไม่บล็อก) ให้ปอนด์เคาะตอน review

---

## 1. ผลตรวจตามเกณฑ์

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
- **API ครบทุก transition:** `api-production` = accept/start/submit-qc/rework/hold/resume (QC pass/fail อยู่ module QC ถูกต้อง) · index §7 coverage แสดง endpoint ต่อ cascade ครบ 1–19
- **DB รองรับทุก AC:** `production_queue_item`(รอรับงาน ไม่มีเลข)→`production_order`(PRD)→`batch`(run_no) · `stock_movement` append-only (lot_id null ช่วงติดลบ + reason retro_alloc) + `batch_material_consumption` เติม lot ย้อน FIFO · `sequence`(gapless) · `audit_log`(field-level) · `outbox/notification/notification_ack`(Read-bit + ack ราย user) · `vat_config`(effective date) · soft-delete columns ทุก master · `shipment` 1:N `delivery_note`(po 1:1) · `invoice_version`
- **NFR ครบ 9 ข้อ:** perf <2s เพดาน 3s, 50 users, >200 PO/วัน, audit 1 ปี+manual purge, Cloud SQL backup, UTC+พ.ศ., local+Google+session 06:00, gapless — map ไว้ใน §6
- **จุด TL ขอ confirm:** (ก) noti 14 เหตุการณ์ deep link ปลายทางถูก — ตรวจแล้วตรง continuity matrix · (ข) dashboard tile ใช้ list endpoint เดียวกับ drill (api-dashboard) — วางไว้ใน design แล้ว · (ค) QC ขาเข้า fail → Return — db-schema §qc/§return เชื่อม `qc_record(target=lot)`→`return_doc` (auto-raise) รองรับ

### เกณฑ์ 4 — ลิงก์ (สุ่มคลิก) ✅
เดิน index → module (po/production/stock) → mockup → api → db → กลับ — path ทั้งหมดถูก (`../architecture/api-*.html`, `../functional-spec/*.html`, `../../../requirements/…`, `../../../adr/…`) · ไม่พบเส้นตายในชุดที่สุ่ม

### เกณฑ์ 5 — ไม่ประดิษฐ์กติกาใหม่ ✅ (มี 1 จุดควรยืนยัน — ดู §2)
ทุกกติกาหลักอ้าง entity-status-map / deletion-policy / คำตอบปอนด์ที่บันทึกไว้ · ไม่มีกติกาที่ขัดกับที่ปอนด์ตอบ

---

## 2. ข้อ "ควรยืนยัน" ตอน review (ไม่บล็อก — polish/confirm)
1. **รอบ Active→Inactive = ชุด {1, 3, 6, 8} เดือน (default 3):** BA (US-CUS-02) + TL (db-schema customer) กำหนดชุดค่านี้ — ปอนด์เคยยืนยันแค่ "default 3 เดือน ปรับได้" · **ควรเคาะ**ว่าจำกัดชุดนี้ หรือให้กรอกอิสระ (จุดเดียว แก้ได้ทันทีถ้าต่าง)
2. **ตัวเลขสรุป stories/AC ไม่ตรงกัน:** index = ~47 stories/~141 AC, rtm = ~50/~150 — เป็นตัวเลขพาดหัว (coverage เท่ากัน) · ให้ BA sync ตัวเลขให้ตรง (cosmetic)
3. **ลิงก์ anchor เล็กน้อย:** US-PRD-06 (Potential Delay) อ้าง `continuity.html#c16` (ซึ่งเป็น stock-ติดลบ) — ควรชี้แถว noti ของ Potential Delay โดยตรง (cosmetic)

> ทั้ง 3 ข้อไม่กระทบความครบของ requirement — เป็นการ confirm ค่า 1 จุด + จัดหน้าตา 2 จุด · ไม่ต้องวนกลับก่อนเปิด Gate 2

---

## 3. คู่มือ review Gate 2 สำหรับปอนด์ (~15 นาที)

**เริ่มที่:** `docs/design/erp-v2-ui-first/functional-spec/index.html` (สารบัญ BA) · และ `docs/design/erp-v2-ui-first/architecture/index.html` (สารบัญ TL)

| ลำดับ | เปิดหน้า | ดูอะไร (นาที) |
|---|---|---|
| 1 | functional-spec/**walkthrough** | เดิน 8 use case — เห็นภาพรวมทั้งระบบจบใน 1 หน้า (~3 นาที) |
| 2 | functional-spec/**production** | จุดที่เปลี่ยนล่าสุด: "รอรับงาน→รับงาน (gen PRD)"+negative stock — ตรงที่ปอนด์สั่งไหม (~2) |
| 3 | functional-spec/**stock** US-STK-03 | negative stock + FIFO retro-link + notice ชดเชยยอดติดลบ (~2) |
| 4 | functional-spec/**rbac-deletion** | ตาราง deletion 7 กติกา (ล็อกแล้ว) + RUCDAA 6 ระดับ (~2) |
| 5 | architecture/**index** §1–2 (diagram) + §7 | เห็น system/service diagram + ตารางเช็คครบทุก case (~3) |
| 6 | architecture/**db-schema** §material | จุดยากสุด: stock ledger ติดลบ + retro FIFO (กล่องแดง) (~2) |
| 7 | (ทางเลือก) `docs/adr/001` | ADR สต็อกติดลบ — เหตุผล + แก้บั๊ก DEF-09 (~1) |

**จุดตัดสินใจที่ควรยืนยันตอน review:**
- ✅ requirement + NFR ครบพอเริ่ม dev หรือยัง (Gate 2 = อนุมัติสิ่งนี้)
- ❓ รอบ Active→Inactive จำกัดชุด {1,3,6,8} เดือน หรือกรอกอิสระ (§2 ข้อ 1)
- ❓ ยืนยัน scope: **COGS/valuation อยู่นอก scope** (ใช้ต้นทุน BOM snapshot) — TL ตั้งไว้ตามที่ปอนด์ตอบ
- ✅ ถ้าอนุมัติ → เข้าสู่ Stage 3 (Engineer ∥ QA ∥ BA); ถ้าอยากปรับ UI → วนกลับ Stage 1 แบบ incremental

---

## 4. สถานะ handoff
- **ผลตรวจ PO = ผ่าน** → เปิด **Gate 2** ให้ปอนด์อนุมัติ (current_agent = "ba + tech-lead", status = WAITING_HUMAN_GATE)
- ข้อ §2 (3 จุด polish/confirm) ให้ปอนด์เคาะ ข้อ 1 ตอน review; ข้อ 2–3 BA แก้ cosmetic ได้ทุกเมื่อ ไม่บล็อก
