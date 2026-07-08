# PO Mockup Completeness Review — ESSENCE Hub System (Gate 1)

ผู้ review: PO (ปอนด์มอบอำนาจให้ review แทน — "ให้ PO review แล้ว feedback ได้มั้ย แต่อยากให้ละเอียดที่สุด")
วันที่: 2026-07-08 · ทบทวน mockups ที่ `docs/design/erp-v2-ui-first/mockups/`
รอบ 2 = ตรวจครั้งแรก (§1–§6) · รอบ 3 = ตรวจซ้ำ ผ่าน (§7) · **รอบ 3 feedback ปอนด์ → รายการสั่งงานรอบ 4 (§8 ท้ายไฟล์)**

## สรุปภาษาไทย
รอบ 2: ออกรายการ P0/P1/P2. รอบ 3: UX/UI ปิดครบ, PO ตรวจผ่าน (§7). แต่ปอนด์ review รอบ 3 แล้ว**ยังไม่ approve** — มี feedback ใหม่ (4 ประเด็นวิเคราะห์ 🔍PO + งาน UX หลายจุด) → รายการสั่งงานรอบ 4 อยู่ §8

---

## 5. รายการสั่งงาน UX/UI (จากรอบ 2) — ปิดครบในรอบ 3
P0 (4/4), P1 (10/10), P2 (§15–20) — **✅ ปิดทั้งหมด** (รายละเอียดยืนยันใน §7)

## 7. ผลตรวจรอบ 3 — ผ่าน (ก่อนปอนด์ review)
ตรวจ 15+ หน้า + grep: production flow ใหม่, po-detail cancel/reopen+field trace, supplier active/inactive+price matrix, goods-receipt เต็มจอ, customer 6 สถานะ, shipping/DN 2 ชั้น, dashboard drill-down+auto-refresh, bom snapshot+badge, trace field-audit, settings 5 หน้าจอ, notification panel — ทุกข้อ + คำตอบปอนด์ 5 ข้อ + feedback ร2 13/13 ครบ

---

## 8. รายการสั่งงาน UX/UI รอบ 4 (จาก `pond-gate1-r3-feedback.md` + วิเคราะห์ PO)
อ้างอิงกติกาที่อัปเดตใน `status-journeys.md` (§3.1 Batch, §3.2 QC ราย line, §5 GR multi-line, §12 dashboard filter) + `brief.md` §2.5

### P0 — flow/พฤติกรรมผิด (ต้องแก้ก่อน ไม่งั้น BA/Engineer ทำผิด)
1. **production.html**: **เอาตัวเลือก "QC ไม่ผ่าน" ออกจากหน้าผลิต** — การตัดสิน QC อยู่หน้า QC เท่านั้น; หน้าผลิตแค่แสดงผล QC + รับ Batch กลับเมื่อถูกตีกลับ (ตัวเปลี่ยนสถานะเหลือ: เริ่มผลิต / ส่งตรวจ QC / Hold)
2. **qc.html**: ทำ **QC ราย line item / ราย Batch** — แต่ละ line มีผล ผ่าน/ไม่ผ่าน; ไม่ผ่าน = ตีกลับเฉพาะ line นั้น + feedback (บังคับ); PO พร้อมจัดส่งเมื่อทุก line ผ่าน (แสดง reconcile ที่ PO) + แสดง **Batch + Lot ที่ใช้** ต่อ line
3. **production.html + qc.html**: แสดง **Batch lifecycle** — เลข Batch สร้างตอนกด "เริ่มผลิต" (1 line = 1 Batch), Batch ผูก PO/line/Lot; หน้า QC เห็น PO↔Batch↔Lot
4. **หน้า create ที่ยังเป็น edit/กดไม่ได้ → ทำเป็น create จริง กดได้:** เพิ่มลูกค้า (customers), เพิ่มผู้ติดต่อ (customer-detail), เพิ่ม Supplier, สร้างคำขอใหม่ (PR), สร้างสูตรใหม่ (BOM), **สร้างรอบจัดส่ง (shipping)**

### P1 — requirement รอบ 3
5. **goods-receipt.html**: เปลี่ยนเป็น **multi-line** — header (supplier/เลขใบรับ/วันที่/แนบไฟล์) + ตาราง line (วัตถุดิบ×จำนวน×ราคา×lot gen รายบรรทัด×อ้าง PR รายบรรทัด); รองรับ **1 GR อ้างหลาย PR**
6. **dashboard.html**: เพิ่ม **date filter** (preset วันนี้/สัปดาห์นี้/เดือนนี้[default]/กำหนดเอง) มีผลทุก tile + **caption ต่อ tile** อธิบายความหมายกับช่วง (event vs state ตาม `status-journeys.md` §12)
7. **shipping.html**: หน้า **"สร้างรอบจัดส่ง" จริง 2 ทาง** (เลือก PO ก่อน / สร้างรอบเปล่าแล้ว search PO) + ฟอร์มข้อมูลรอบ: **คนขับ, เบอร์คนขับ, Route, ประเภทรถ (เก๋ง/motorcycle/กระบะ/10 ล้อ — dropdown)**
8. **supplier.html**: **layout หน้าแก้ไขใหม่** — เลิกใช้ panel ขวา (เลื่อนดูวัตถุดิบลำบาก); ทำเป็นหน้าเต็ม/ตารางที่จัดการ price matrix ได้สะดวก + หน้า "เพิ่ม Supplier" แยกจริง
9. **po-detail.html**: เพิ่ม **UI เปลี่ยนสถานะ PO ชัดเจน** (ปุ่ม/กล่องเปลี่ยนสถานะ + เหตุผล + trace) — ปอนด์ยังไม่เห็น case แก้ไขสถานะ PO

### P2 — UX/คุณภาพ (สำคัญต่อการอนุมัติ)
10. **ตรวจ label ซ้ำ "ทุกหน้า"** — ปอนด์เจอ "Dashboard" 3 จุดในหน้าเดียว; ให้ UX ไล่ scan ทุกหน้า เหลือ label จุดเดียว/หน้า (title vs crumb vs heading)
11. **test data สมจริงตรง use case ทุกหน้า** — เช่น ลูกค้า Follow-up ต้องมีเคส Hold ประกอบ, Blacklist มี comment เหตุผล, GR/Batch/QC มีข้อมูลที่เล่าเรื่องต่อเนื่องกัน (กัน BA/QA งง)
12. **dropdown ทุกจุด search ได้** — เลือก supplier/วัตถุดิบ/PO/ลูกค้า ฯลฯ เป็น searchable select
13. **empty/loading/error state** ให้ครบทุก list (ยืนยัน pattern)

### เกณฑ์ตรวจรอบ 4 (PO จะ re-review)
ทุกข้อ P0/P1/P2 ปิด + 4 ประเด็น 🔍PO สะท้อนใน mockup ตรงกับ `status-journeys.md` (§3.1/§3.2/§5/§12) + หน้า create กดได้จริง + ไม่มี label ซ้ำ + test data สมจริง → เปิด Gate 1 รอบ 4

> คำถามยืนยันปอนด์ 5 ข้อ (QC ราย line, Batch granularity, dashboard default, GR/PR many-to-many, BOM no-active-supplier) อยู่ใน `status-journeys.md` §13 + status.json — ตั้ง default แล้ว UX/UI เริ่มได้เลย ไม่ต้องรอ
