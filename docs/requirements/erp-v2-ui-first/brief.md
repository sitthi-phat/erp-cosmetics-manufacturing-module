# Product Brief — ERP v2 (UI-First Rebuild)

slug: `erp-v2-ui-first` · เอกสารนี้เขียนในขั้น design-brief (PO ทำคู่ขนานกับ UX/UI) · เจ้าของ status ในขั้นนี้คือ UX/UI

## สรุปภาษาไทย
Prototype (prototype-v1) มี feature ครบทั้ง 44 stories/14 epics แต่ปอนด์ไม่อนุมัติ เพราะ "ดูไม่ professional / ใช้ยาก / อ่านไม่ออก" — คุณค่าทาง business จึงยังไม่เกิดเลยเพราะ user ใช้งานจริงไม่ได้ v2 จึงกลับด้าน: **ล็อก "หน้าตา" ให้ผ่านก่อนเขียนโค้ด** โดยปอนด์อนุมัติ design system + mockup ทุกหน้าที่ Gate 1 แล้วค่อย implement ให้ตรง mockup โดยคง functional scope เดิมไว้ครบ ตัววัดความสำเร็จรอบนี้วัดที่ **ผู้ใช้ที่ไม่เคยใช้ ERP ทำงานจริงได้เร็วและเอง** ไม่ใช่แค่ feature ครบ หน้าที่ต้องเนี้ยบสุดคือจุดที่ปอนด์ feedback หนัก: เปิด PO, วางแผนผลิต/วัตถุดิบ (BOM+FIFO lot), invoice+ใบกำกับภาษีไทย, และ stock

---

## 1. ปัญหา/โอกาสทาง business (ทำไมต้อง rebuild แบบ UI-first)

**บทเรียนจาก prototype-v1:** ระบบทำ functional ครบทั้งสาย order-to-cash แต่ตกที่ human gate ด้าน "หน้าตา" ซ้ำ ๆ (มีประวัติ FAILED / re-run) ผลคือ:
- ลงทุนสร้าง feature เต็มระบบแล้ว แต่ **adoption = 0** เพราะ user มือใหม่ใช้ไม่ได้จริง → ROI ของ prototype ยังไม่เกิด
- แก้ UI ทีหลังบนโค้ดที่สร้างเสร็จแล้ว = rework แพงและวน (แก้แล้วยังไม่ผ่านสายตาปอนด์)

**สมมติฐานของ v2:** ถ้า **ตกลง "หน้าตา" ให้จบก่อน** (design system + mockup ทุกหน้า + theme) แล้วให้ปอนด์อนุมัติที่ Gate 1 ก่อนลงมือเขียนโค้ด จะ:
- ตัด rework loop ด้าน UI (ตัดสินบน mockup ราคาถูก แทนบนโค้ดราคาแพง)
- ได้ระบบที่ user ที่ **ไม่เคยใช้ ERP** ทำงานได้เองตั้งแต่วันแรก → เกิด adoption จริง

> v2 ไม่เพิ่ม functional scope ใหม่ — scope อ้างอิง prototype-v1 ทั้งหมด งานรอบนี้คือ "ยกระดับ UX/UI ให้ professional + usable แล้ว implement ใหม่ให้ตรงหน้าตาที่อนุมัติ"

## 2. Business Key Value (วัดที่ adoption/ความเร็วจริง — ไม่ใช่ feature ครบ)

| # | ตัวชี้วัด | Baseline (prototype-v1) | เป้าหมาย v2 | วัดเมื่อไร |
|---|---|---|---|---|
| BKV-1 | ผู้ใช้ที่ไม่เคยใช้ ERP ทำงานหลักได้เอง (ไม่มีคนสอน) ในเวลาเป้าหมาย เช่น เปิด PO ≤ 3 นาที, ออก invoice+ใบกำกับภาษี ≤ 5 นาที | ทำไม่สำเร็จ/ต้องมีคนช่วย | ≥ 80% ของ UAT tester ทำสำเร็จเองในเวลาเป้าหมาย | UAT (2–3 คน/role) |
| BKV-2 | รอบ rework ด้าน "หน้าตา" | ตกซ้ำหลังสร้างเต็มระบบ | ปอนด์อนุมัติหน้าตาได้ตั้งแต่ขั้น mockup ภายใน ≤ 2 รอบรีวิว (ก่อนเขียนโค้ด) | Gate 1 |
| BKV-3 | หน้าจอที่ยังโชว์ enum/รหัสดิบให้ user เห็น | มี | 0 หน้า (100% เป็นข้อความที่คนอ่านออก) | UX/UI visual audit |
| BKV-4 | จุด feedback เดิมของปอนด์ที่ยังไม่ถูกแก้ | ค้างอยู่ | แก้เห็นชัดใน mockup ครบ 100% (ดู Q1 — ต้องยืนยันรายการ) | Gate 1 |
| BKV-5 | คะแนนความรู้สึก "professional + ใช้ง่าย" จาก UAT tester | ไม่ผ่าน | เฉลี่ย ≥ 4 จาก 5 | UAT |

## 3. นิยาม Gate 1 "อนุมัติหน้าตา" ให้วัดได้

**ปอนด์ต้องเห็นครบทั้ง 6 อย่างจึงจะตัดสินได้:**
1. **Design system** — palette, typography, ระยะห่าง/grid, component library (ปุ่ม/ฟอร์ม/ตาราง/modal ฯลฯ), state ครบ (empty / loading / error / success / disabled), responsive breakpoints
2. **Theme options** — ให้เลือก ≥ 2–3 ธีม พร้อม "ตัวแนะนำ" 1 ตัว และเหตุผล (สี/logo/โทน ปอนด์ยังไม่กำหนด → UX/UI เสนอ)
3. **Mockup ครบทุกหน้าหลัก** ตามรายการลำดับความสำคัญในข้อ 4 แต่ละหน้าแสดง state สำคัญ
4. **Responsive** — โชว์อย่างน้อย desktop + tablet/mobile ในหน้าหัวใจ (Tier 1)
5. **ตารางแก้ feedback** — จุด feedback เดิมของปอนด์แต่ละข้อ map ไปยัง mockup ที่แก้ให้เห็นชัด
6. **Mockup ใบกำกับภาษีไทย** ที่มีฟิลด์ตามกฎหมายครบ (ดูข้อ 5)

**เกณฑ์ผ่าน Gate 1 (ทุกข้อต้องจริง):**
- [ ] ทุกหน้าหลักในรายการที่ตกลง มี mockup ครบ (coverage 100%)
- [ ] จุด feedback เดิมทุกข้อ แสดงการแก้ชัดใน mockup (map ครบ 100%)
- [ ] มี theme ให้เลือก ≥ 2 พร้อมตัวแนะนำ
- [ ] ไม่มี mockup หน้าใดโชว์ enum/รหัสดิบให้ user เห็น
- [ ] หน้า Tier 1 ทุกหน้าแสดงแบบ responsive
- [ ] mockup ใบกำกับภาษีไทยมีฟิลด์ตามกฎหมายครบตามข้อ 5
- [ ] traceability Lot → Batch → FG มองเห็น/กดไล่ดูได้ใน mockup

## 4. ลำดับความสำคัญของหน้าจอ (business priority)

**Tier 1 — หัวใจ ต้องเนี้ยบสุด (จุดที่ปอนด์ feedback หนักสุด):**
- เปิด PO (create purchase/sales order) — จุดเริ่ม cash cycle, user แตะบ่อยสุด
- วางแผนผลิต / วัตถุดิบ (production plan + BOM auto-calc + FIFO lot) — ซับซ้อนสุด, เสี่ยงอ่านไม่ออกสุด
- Invoice + ใบกำกับภาษีไทย (VAT, versioning) — ผูกกฎหมาย, ผิดไม่ได้
- Stock / inventory — ข้อมูลหนาแน่น อ่านง่ายยากสุด

**Tier 2 — สำคัญรองลงมา:**
- QC รับเข้า + batch, ลูกค้า (พร้อมข้อมูลใบกำกับภาษี), จัดส่ง/delivery, dashboard ตามส่วนงาน, หน้า traceability (Lot→Batch→FG)

**Tier 3 — ตั้งค่า/สนับสนุน:**
- User management (7 roles + config permission), audit log, BOM management, เก็บเงิน/payment

## 5. ข้อกำหนด business ที่ UI ห้ามละเมิด (non-negotiable)

- **GMP traceability:** ต้องไล่ Lot → Batch → FG ได้ครบและมองเห็นในหน้าที่เกี่ยวข้อง (ผลิต/QC/stock/traceability)
- **ใบกำกับภาษีไทยตามกฎหมาย:** เลขประจำตัวผู้เสียภาษี 13 หลัก, การแยก VAT, จำนวนเงินเป็น**ตัวหนังสือไทย**, ช่องลายเซ็น, เลขที่/วันที่เอกสาร, การทำ versioning เอกสาร
- **Audit ทุก action:** ทุกการกระทำที่เปลี่ยนข้อมูลต้องบันทึกได้ (UI ต้องรองรับการแสดง audit)
- **ผู้ใช้ไม่เคยใช้ ERP:** นำทางตัวเองได้, ไม่แสดง enum/รหัสดิบ, อ่านออกทุกจุด, มี guard/ยืนยันในงานที่ผิดพลาดไม่ได้
- **Responsive** ทุกหน้า
- **7 roles + permission config:** UI ต้องแสดง/ซ่อนตาม role ได้จริง

## 6. Scope

**In scope (v2):**
- Design system + mockup ทุกหน้าของ functional scope เดิม (prototype-v1) — ทั้งสาย order-to-cash + user mgmt + audit + dashboard + BOM + traceability
- Theme options ให้ปอนด์เลือก
- Implement ใหม่ให้ตรง mockup ที่อนุมัติ บน stack React + Node.js + MySQL (ADR-000)
- QA regression: functional เดิมต้องไม่พัง
- UX/UI visual audit: ของจริงต้องตรง mockup

**Out of scope (v2):**
- feature/business logic ใหม่ที่ไม่มีใน prototype-v1 (ถ้าต้องเพิ่ม = requirement ใหม่)
- การเปลี่ยน tech stack
- ข้อมูล/สี/logo แบรนด์จริง (ปอนด์เลือกจาก theme options ที่ UX/UI เสนอ ที่ Gate 1)
- งานส่วน design UI เอง — นั่นเป็นของ UX/UI agent (PO ให้กรอบ business เท่านั้น)

## 7. Definition of Done — feature v2 ทั้งสาย (ถึง Gate 2)

- [ ] **Gate 1 ผ่าน:** design system + mockup ทุกหน้า + theme ที่เลือก ได้รับอนุมัติจากปอนด์ (ตามเกณฑ์ข้อ 3)
- [ ] **Engineer implement** ครบ functional scope prototype-v1 บน React+Node+MySQL โดยหน้าตาตรง mockup ที่อนุมัติ
- [ ] **QA regression ผ่าน:** functional scope เดิมทั้งหมดยังทำงานถูกต้อง (ไม่ถอยหลัง)
- [ ] **UX/UI visual audit ผ่าน:** ของจริงตรง mockup (component/spacing/responsive) และ 0 หน้าโชว์ enum/รหัสดิบ
- [ ] **ข้อกำหนดห้ามละเมิด (ข้อ 5) ครบ:** traceability ไล่ได้, ใบกำกับภาษีไทยฟิลด์ครบ, audit ทำงาน
- [ ] **BKV วัดผลแล้วผ่านเกณฑ์:** BKV-1 (เวลาทำงาน user มือใหม่), BKV-3 (0 enum ดิบ), BKV-4/5 (feedback แก้ครบ + คะแนน UAT)
- [ ] **DevOps deploy** สำเร็จ
- [ ] **Gate 2 ผ่าน:** ปอนด์อนุมัติ release

## 8. Known constraints / target users
- Tech stack ตายตัว: React + Node.js + MySQL (ADR-000)
- GMP / full traceability เป็นข้อบังคับแฝงในทุก feature (CLAUDE.md)
- Target users: พนักงานโรงงาน/บัญชี/คลัง/ผลิต/QC ที่ **ไม่เคยใช้ ERP** — usability เป็น first-class requirement
- ข้อมูลต้นทาง (44 stories/architecture) อยู่ใน git tag `prototype-v1` เท่านั้น
