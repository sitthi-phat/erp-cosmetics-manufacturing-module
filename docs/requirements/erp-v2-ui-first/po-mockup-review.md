# PO Mockup Completeness Review — ESSENCE Hub System (Gate 1)

ผู้ review: PO (ปอนด์มอบอำนาจให้ review แทน — "ให้ PO review แล้ว feedback ได้มั้ย แต่อยากให้ละเอียดที่สุด")
วันที่: 2026-07-08 · ทบทวน mockups ที่ `docs/design/erp-v2-ui-first/mockups/`
รอบ 2 = ตรวจครั้งแรก (§1–§6) · รอบ 3 = ตรวจซ้ำ ผ่าน (§7) · **รอบ 3 feedback ปอนด์ → รายการสั่งงานรอบ 4 (§8) + คำตอบ r3 ครบ (§8.1)**

## สรุปภาษาไทย
รอบ 2: ออกรายการ P0/P1/P2. รอบ 3: UX/UI ปิดครบ, PO ตรวจผ่าน (§7). ปอนด์ review รอบ 3 → feedback ใหม่ (4 ประเด็น 🔍PO + งาน UX) → รายการสั่งงานรอบ 4 (§8). ปอนด์ตอบคำถาม r3 ครบแล้ว รวมถึง **เลข Batch = `B-{PO}-{line}-{run}`** + **rework loop ที่ต้องเห็นชัด** (§8.1)

---

## 5. รายการสั่งงาน UX/UI (จากรอบ 2) — ปิดครบในรอบ 3
P0 (4/4), P1 (10/10), P2 (§15–20) — **✅ ปิดทั้งหมด** (ยืนยันใน §7)

## 7. ผลตรวจรอบ 3 — ผ่าน (ก่อนปอนด์ review)
production flow ใหม่, po-detail cancel/reopen+field trace, supplier active/inactive+price matrix, goods-receipt เต็มจอ, customer 6 สถานะ, shipping/DN 2 ชั้น, dashboard drill-down+auto-refresh, bom snapshot+badge, trace field-audit, settings 5 หน้าจอ, notification panel — ครบ + คำตอบปอนด์ 5 ข้อ + feedback ร2 13/13

---

## 8. รายการสั่งงาน UX/UI รอบ 4 (จาก `pond-gate1-r3-feedback.md` + วิเคราะห์ PO + คำตอบ r3)
อ้างอิงกติกาใน `status-journeys.md` (§3.1 Batch, §3.2 QC rework, §5 GR multi-line, §12 dashboard) + `brief.md` §2.5

### P0 — flow/พฤติกรรมผิด (ต้องแก้ก่อน)
1. **production.html**: **เอาปุ่ม "QC ไม่ผ่าน" ออก** (QC ตัดสินที่หน้า QC เท่านั้น) + **แสดง Batch format ใหม่ `B-{PO}-{line}-{run}`** (เช่น B-PO-2026-0012-2-1) + **Rework loop UI**:
   - line ที่ถูกตีกลับมี **badge "Rework"** + ระบุ **Batch run ใหม่** (เช่น "Batch ใหม่: B-...-2-2") + **feedback จาก QC ติดกับ line นั้น**
   - ปุ่ม **"ผลิตซ้ำ"** → gen Batch run ถัดไปอัตโนมัติ → ส่งกลับคิว QC
   - **line อื่นเดินต่อไม่สะดุด** · หน้าผลิตแสดงราย line ชัด (ผ่าน/รอ QC/Rework)
2. **qc.html**: **QC ราย line item/Batch** — ผ่าน/ไม่ผ่านราย line; ไม่ผ่าน→ตีกลับเฉพาะ line+feedback(บังคับ); PO พร้อมจัดส่งเมื่อทุก line ผ่าน; **คิว QC เห็นรายการ rework เป็นรายการใหม่ + ประวัติ run ก่อนหน้า** (run 1 ไม่ผ่านเพราะอะไร); แสดง PO↔Batch↔Lot ต่อ line
3. **po-detail.html**: **เห็นภาพรวมทุก line/Batch ของ PO** (สถานะราย line: ผ่าน/รอ QC/Rework + เลข Batch run) + UI เปลี่ยนสถานะ PO ชัดเจน + trace
4. **หน้า create จริง (กดได้ ไม่ใช่ edit):** เพิ่มลูกค้า, เพิ่มผู้ติดต่อ, เพิ่ม Supplier, สร้างคำขอใหม่ (PR), สร้างสูตรใหม่ (BOM), **สร้างรอบจัดส่ง (shipping)**

### P1 — requirement รอบ 3
5. **goods-receipt.html**: **multi-line** — header (supplier/เลขใบรับ/วันที่/แนบไฟล์) + ตาราง line (วัตถุดิบ×จำนวน×ราคา×lot gen รายบรรทัด×อ้าง PR รายบรรทัด); **1 GR อ้างหลาย PR**; **รับไม่ครบ → ระบบเสนอสร้าง PR ใหม่เฉพาะที่ขาด + user ต้อง review/ยืนยันก่อน (ไม่ auto)**
6. **dashboard.html**: **date filter** (preset วันนี้/สัปดาห์/เดือน[default]/กำหนดเอง) + **เลือกอิสระ เดือน/ปี/date range** มีผลทุก tile + **caption ต่อ tile** (event vs state ตาม `status-journeys.md` §12)
7. **shipping.html**: หน้า **"สร้างรอบจัดส่ง" จริง 2 ทาง** + ข้อมูลรอบ **คนขับ/เบอร์/Route/ประเภทรถ (เก๋ง/motorcycle/กระบะ/10 ล้อ dropdown)**
8. **supplier.html**: **layout หน้าแก้ไขใหม่** (เลิก panel ขวา) + price matrix จัดการสะดวก + หน้า "เพิ่ม Supplier" แยกจริง
9. **bom.html**: **component ไม่มี supplier active → บล็อกบันทึกจนกรอกราคาทุน override** (badge/แจ้งชัด)

### P2 — UX/คุณภาพ
10. **ตรวจ label ซ้ำทุกหน้า** (ปอนด์เจอ "Dashboard" 3 จุด) — เหลือจุดเดียว/หน้า
11. **test data สมจริงตรง use case ทุกหน้า** (Follow-up มีเคส Hold, Blacklist มีเหตุผล, Batch/QC/GR เล่าเรื่องต่อเนื่อง — line rework โยง run ก่อนหน้า)
12. **dropdown ทุกจุด search ได้** (supplier/วัตถุดิบ/PO/ลูกค้า/ประเภทรถ)
13. **empty/loading/error state** ครบทุก list

### 8.1 คำตอบปอนด์ r3 (ปิดคำถามครบ) — UX/UI ยึดตามนี้
- **QC ราย line:** ตีกลับเฉพาะ line ที่เสีย + rework loop (§3.2)
- **เลข Batch:** **`B-{PO}-{line}-{run}`** (GMP) — ผลิตซ้ำ run+1; คำกำชับ: rework ต้องไม่ทำให้ฝ่ายผลิตงง + ส่งกลับ QC ลื่น (ดู P0-1/2/3)
- **Dashboard:** default เดือนนี้ + เลือกอิสระ เดือน/ปี/date range + event/state
- **GR/PR:** 1 GR อ้างหลาย PR; รับไม่ครบ → เสนอ PR ใหม่เฉพาะที่ขาด + user review ก่อน
- **BOM ไม่มี supplier active:** บล็อกจนกรอก override

### เกณฑ์ตรวจรอบ 4 (PO จะ re-review)
ทุกข้อ P0/P1/P2 ปิด + 4 ประเด็น 🔍PO + Batch format `B-{PO}-{line}-{run}` + rework loop (ก-ง) สะท้อนใน production/qc/po-detail + หน้า create กดได้จริง + ไม่มี label ซ้ำ + test data สมจริง → เปิด Gate 1 รอบ 4
