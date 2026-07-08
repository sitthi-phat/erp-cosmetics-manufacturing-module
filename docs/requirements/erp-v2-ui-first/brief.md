# Product Brief — ESSENCE Hub System (ERP v2, UI-First Rebuild)

**ชื่อระบบอย่างเป็นทางการ: ESSENCE Hub System** (ปอนด์กำหนด 2026-07-08 — บันทึกใน CLAUDE.md)
slug: `erp-v2-ui-first` · เอกสารนี้เขียนในขั้น design-brief (PO ทำคู่ขนานกับ UX/UI) · เจ้าของ status ในขั้นนี้คือ UX/UI
เอกสารประกอบ: `status-journeys.md` (state machine ทุกสาย — หัวใจ Gate 1 รอบ 2), `prototype-feedback-reference.md`, `pond-gate1-feedback.md`

## สรุปภาษาไทย
Prototype (prototype-v1) มี feature ครบ แต่ปอนด์ไม่อนุมัติเพราะ "ไม่ professional / ใช้ยาก / อ่านไม่ออก" — คุณค่า business ยังไม่เกิดเพราะ user ใช้จริงไม่ได้ v2 ("**ESSENCE Hub System**") กลับด้าน: **ล็อกหน้าตาให้ผ่านก่อนเขียนโค้ด** วัดที่ผู้ใช้มือใหม่ทำงานได้เอง+เร็ว **Gate 1 รอบ 1 ปอนด์อนุมัติ theme (A — Clean Clinical teal) แล้ว แต่ยังไม่ผ่านหน้าตา** เพราะมี requirement เพิ่มก้อนใหญ่ โดยเน้นคำสั่ง: **"ทุกสถานะต้องต่อเนื่องกันทั้งระบบ ห้ามหลุด journey"** (ดู `status-journeys.md`) และปอนด์ย้ำว่า **Gate 1 รอบ 2 = การเสนองานจริงครั้งเดียว ต้องเนี๊ยบที่สุด** หลักการออกแบบข้อแรก: **ลดจำนวนคลิก/หน้าต่อ task ให้น้อยที่สุด** เกณฑ์คุณภาพเข้มขึ้น: **functional ต้อง 0 defect ทุกระดับ** และ UX/UI ≥ 3.5 + ต้องใช้ง่าย · **responsive เป็น requirement ระดับ Must ทุกหน้า** · ปอนด์ยืนยันกติกา business 6 ข้อแล้ว (วัตถุดิบขาด = เตือนไม่บล็อก, RUCDA→RUCDAA ฯลฯ)

---

## 0. Product Identity (ส่งถึง UX/UI เป็นข้อกำหนด)
- **ชื่อระบบ:** ESSENCE Hub System — ต้องปรากฏใน **ทุกหน้า mockup**: หน้า login, header ของแอป, และ **browser title**
- **Placeholder logo + favicon/app icon:** ออกแบบจากชื่อ "ESSENCE Hub System" ให้เข้ากับ **theme A — Clean Clinical (teal)** ที่ปอนด์เลือก (ยังไม่มีไฟล์แบรนด์จริง → ใช้ placeholder)
- โทน/สี = theme A teal ทั้งระบบ

## 1. ปัญหา/โอกาสทาง business (ทำไมต้อง rebuild แบบ UI-first)

**บทเรียนจาก prototype-v1:** ระบบทำ functional ครบทั้งสาย order-to-cash แต่ตกที่ human gate ด้าน "หน้าตา" ซ้ำ ๆ ผลคือ:
- ลงทุนสร้าง feature เต็มระบบแล้ว แต่ **adoption = 0** เพราะ user มือใหม่ใช้ไม่ได้จริง → ROI ยังไม่เกิด
- แก้ UI ทีหลังบนโค้ดที่สร้างเสร็จ = rework แพงและวน

**สมมติฐานของ v2:** ตกลง "หน้าตา" (design system + mockup ทุกหน้า/ทุกสถานะ + theme) ให้ปอนด์อนุมัติที่ Gate 1 ก่อนเขียนโค้ด → ตัด rework loop + ได้ระบบที่ user มือใหม่ใช้เองได้ตั้งแต่วันแรก

**บทเรียนเพิ่มจาก Gate 1 รอบ 1:** functional scope ที่อ้างจาก prototype **ยังไม่ครบพอ** — พอปอนด์เห็น mockup จริงจึงระบุ requirement เชิงกระบวนการอีกมาก โดยเฉพาะ **ความต่อเนื่องของสถานะข้าม module** → v2 ยกให้ status-journey continuity เป็น first-class requirement (`status-journeys.md`)

## 2. Business Key Value (วัดที่ adoption/ความเร็วจริง)

| # | ตัวชี้วัด | Baseline | เป้าหมาย v2 | วัดเมื่อไร |
|---|---|---|---|---|
| BKV-1 | **ความเร็ว/ความง่ายของ task หลัก** — user มือใหม่ทำเองได้โดยไม่มีคนสอน โดย**ลดจำนวนคลิก/หน้าให้น้อยสุด** | prototype หลายหน้า/หลายคลิก, ผู้ใช้เลิกกลางคัน | flow หลักจบใน **จำนวนคลิกจำกัด** (เปิด PO ≤ 10 คลิก, ออก invoice ≤ 6 คลิก [DEFAULT — รอยืนยันตัวเลข]) + ฟอร์มจบในหน้าเดียวถ้าทำได้ + smart default; ≥ 80% ของ UAT tester ทำสำเร็จเอง | UAT + review mockup flow count |
| BKV-2 | รอบ rework ด้านหน้าตา | ตกซ้ำ (Gate 1 รอบ 1 ยังไม่ผ่าน) | อนุมัติหน้าตาที่ขั้น mockup ภายใน ≤ 2 รอบนับจากรอบนี้ | Gate 1 |
| BKV-3 | หน้าจอที่โชว์ enum/รหัสดิบ | มี | 0 หน้า | visual audit |
| BKV-4 | จุด feedback ปอนด์ที่ยังไม่ถูกแก้ | prototype 10 ข้อ + Gate1-รอบ1 12 หน้า | แก้เห็นชัดใน mockup ครบ 100% | Gate 1 รอบ 2 |
| BKV-5 | **คุณภาพส่งมอบ (เกณฑ์ปอนด์)** | prototype ไม่ผ่าน | **Functional = 0 defect ทุกระดับ (minor/major/critical)** และ **UX/UI ≥ 3.5/5 + ต้องใช้ง่าย** | UAT / QA |
| BKV-6 | ความต่อเนื่องของสถานะข้าม module (mockup ต้นทาง+ปลายทาง + trace) | ไม่มีใน prototype | 14/14 แถวใน `status-journeys.md` §8 ครบ | Gate 1 รอบ 2 |

### 2.1 หลักการออกแบบข้อแรก — ส่งถึง UX/UI (คำสั่งตรงจากปอนด์)
ผู้ใช้ทำงาน **routine ซ้ำ ๆ ทั้งวัน** — ถ้ากรอกนาน/สลับหลายหน้า จะ **เลิกใช้ + พลาดสูง** ดังนั้นทุก mockup ต้อง:
1. **Minimize clicks per task** — ตั้ง click budget ต่อ flow หลัก (BKV-1) และออกแบบให้ถึงเป้า
2. **จบในหน้าเดียวถ้าทำได้** — ฟอร์มยาวไม่ควรบังคับ wizard หลายหน้าโดยไม่จำเป็น
3. **Smart defaults** — เติมค่าที่เดาได้ให้อัตโนมัติ (ราคาจาก BOM, lot FIFO, supplier จาก lot ฯลฯ) ผู้ใช้แค่ review
4. **อ่านง่าย/นำทางเอง** — ไม่มี enum ดิบ, ป้ายสถานะสื่อความหมาย
5. **Responsive ทุกหน้า (Must)** — ดู §5
> **Gate 1 รอบ 2 = การเสนองานจริง มีโอกาสครั้งเดียว ต้องดีที่สุด — ห้ามส่ง mockup ครึ่งๆ กลางๆ**

## 2.2 กติกา business ที่ปอนด์ยืนยันแล้ว (2026-07-08) — ผูกเข้า `status-journeys.md`
1. **วัตถุดิบขาดตอนเปิด PO = เตือน (warning) ไม่บล็อก** — ผู้ใช้ตัดสินใจสร้าง PO ต่อได้ + ระบบส่ง Purchase Request ไป Stock อัตโนมัติ (ตัดสถานะ `Awaiting Materials` ออกจากเส้นบังคับ)
2. **เกณฑ์ "ใกล้หมด" ของวัตถุดิบ: ไม่มี default** — ระบบ**ไม่เตือน**จนกว่าจะตั้งค่าต่อวัตถุดิบ (% หรือจำนวน) เอง
3. **Delivery Note:** บาง PO เลื่อน/reject → ใบเป็น `Partially Delivered`; **PO ที่เลื่อน (Postponed) เปิด flow สร้างใบจัดส่งใบใหม่ได้**
4. **PO Rejected ตอนส่ง:** กลับ Production = `Ready to Delivery` **+ แจ้ง Sale ให้ตัดสินใจ** (ติดต่อลูกค้าเพื่อส่งใหม่ / ยกเลิก) — เป็นลำดับเดียว
5. **RUCDA → RUCDAA:** เพิ่ม permission ระดับที่ 6 **"Admin"** ต่อ module สำหรับ special capabilities (reassign customer, archive trace, ปลด Blacklist, status override) แทน capability-layer แยก
6. **ออกใบแจ้งหนี้ได้ตั้งแต่ PO = Confirmed** ขึ้นไป

## 3. นิยาม Gate 1 "อนุมัติหน้าตา" — เกณฑ์รอบ 2

ปอนด์อนุมัติ theme แล้ว (A — Clean Clinical teal). Gate 1 รอบ 2 คือ **การเสนองานจริงครั้งเดียว** — ต้องครบและเนี๊ยบที่สุด

**ปอนด์ต้องเห็นครบ:**
1. **Design system** (theme A) + component/state ครบ (empty/loading/error/success/disabled) + responsive breakpoints + **placeholder logo + favicon/app icon (จากชื่อ ESSENCE Hub System)** + ชื่อระบบทุกหน้า (login/header/browser title)
2. **Mockup ครบ 100% ทุกหน้า** ตามข้อ 6 — รวม **ทุกสถานะ**:
   - **ทุก Customer status** (Lead/Active/Inactive/Disabled/Blacklist)
   - **Dashboard แยกทุกแผนก** (Sale, Stock, Production, QC, Shipping, Finance, Admin) + ตัวสลับแผนกเมื่อ user หลาย role
   - ทุก state ของ PO / Production / Shipping / Purchase Request / Return / Invoice ตาม `status-journeys.md`
3. **ตาราง feedback → mockup** ครบ: prototype 10 ข้อ (§3.1) + Gate1-รอบ1 (12 หน้า + ประเด็นเชิงระบบ)
4. **Mockup แสดง cross-module continuity** — 14 แถวใน `status-journeys.md` §8 (รวม PO วัตถุดิบขาดแบบ warning-not-block, PO postponed สร้างใบใหม่, PO rejected แจ้ง Sale)
5. **Mockup ใบกำกับภาษีไทย** ฟิลด์ครบ (§5)
6. **หลักการ minimize-clicks (§2.1) เห็นในทุก flow หลัก**
7. **Responsive (Must)** — ทุกหน้าแสดงผลได้บนหลายขนาดจอ (desktop / tablet / mobile) ไม่ใช่เฉพาะบางหน้า
8. **หน้า Settings แสดง permission แบบ RUCDAA (6 ระดับ)** + สร้าง role ไม่จำกัด

**เกณฑ์ผ่าน Gate 1 รอบ 2 (ทุกข้อต้องจริง):**
- [ ] mockup coverage 100% ทุกหน้า + ทุกสถานะ (customer 5, dashboard 7 แผนก, ทุก state ทุก journey)
- [ ] ชื่อ "ESSENCE Hub System" + placeholder logo/icon (theme teal) ปรากฏทุกหน้า (login/header/title)
- [ ] feedback prototype 10 ข้อ + Gate1-รอบ1 ทั้งหมด map เห็นการแก้
- [ ] cross-module continuity 14/14 แถวมี mockup ต้นทาง+ปลายทาง
- [ ] ไม่มี mockup โชว์ enum/รหัสดิบ
- [ ] **ทุกหน้า responsive (Must)** — แสดง desktop + tablet + mobile
- [ ] ใบกำกับภาษีไทยฟิลด์ครบ (§5)
- [ ] traceability Lot→Batch→FG + trace ทุก status change เห็นใน mockup
- [ ] permission RUCDAA (6 ระดับ) + role ไม่จำกัด + role ใหม่ (Sale Manager, Super User) มีหน้าตั้งค่า
- [ ] flow หลักผ่าน click budget (§2.1 / BKV-1)

### 3.1 ตาราง 10 จุด feedback (prototype) → สิ่งที่ต้องเห็นใน mockup
ที่มา: `prototype-feedback-reference.md`

| # | จุด feedback | หน้า/mockup | สิ่งที่ต้องเห็น | Tier |
|---|---|---|---|---|
| 1 | PO แสดง `Product #7 x 1 @ 1` + แก้/ลบไม่ได้ | PO create | ชื่อสินค้า/จำนวน/ราคา + ปุ่มลบ/แก้ต่อบรรทัด | 1 |
| 2 | stock search ไม่ได้ + ไม่มีทาง BOM | stock | search + ลิงก์ไป BOM | 1 |
| 3 | trace หา lot ไม่เจอ + งง Lot vs Batch | traceability | search Lot/Batch/PO + อธิบาย Lot vs Batch | 2 |
| 4 | production กรอก lot error + ต้องกรอกเอง | production | auto-calc จาก BOM + review + lot picker FIFO | 1 |
| 5 | QC ไม่มีรับเข้า raw material | QC | ฟอร์ม incoming inspection | 2 |
| 6 | ไม่มี BOM module | BOM management | หน้าจัดการ/สร้างสูตร ใช้ง่าย | 3→1 |
| 7 | ไม่ professional | ทั้งระบบ | design system theme A | ทุก Tier |
| 8 | ไม่ responsive | ทั้งระบบ | **ทุกหน้า** desktop + tablet + mobile (Must) | 1 |
| 9 | customers ไม่มีฟิลด์ tax | customers | เลขผู้เสียภาษี 13 หลัก, ที่อยู่จดทะเบียน, contact | 2→1 |
| 10 | invoice เปิดดูไม่ได้ + ไม่มีเอกสาร | invoice | หน้ารายละเอียด + เอกสารใบกำกับภาษีครบ (§5) | 1 |

## 4. ลำดับความสำคัญของหน้าจอ (ปอนด์ยืนยัน Tier 1)

**Tier 1 — หัวใจ ต้องเนี๊ยบที่สุด (ยืนยันโดยปอนด์ — เสนอครั้งเดียว ต้องดีที่สุด):**
- **PO create + summary** (suggest สินค้า, เช็ควัตถุดิบ = เตือนไม่บล็อก, Purchase Request auto, ขาย BOM/วัตถุดิบ, sale ที่ดูแล, ราคาแก้ได้)
- **Production / วางแผนผลิต** (auto-calc BOM, FIFO lot, สถานะ+Potential Delay+cross-notify, เรียง/ค้นตามวันจัดส่ง)
- **Invoice + ใบกำกับภาษีไทย** (โชว์ PO status, overdue alert, VAT/discount/ตัวหนังสือไทย)
- **Stock** (add material+UOM, config ใกล้หมด — ไม่เตือนจนกว่าตั้งค่า, ราคาซื้อ/ขายแยก, search)
- **Customer** (5 สถานะ, contact ไม่จำกัด, note, sale assignment, search ด้วย PO/วันที่) — เพราะ lifecycle เป็นแกน

> Tier ใช้จัดลำดับความประณีต/ลำดับทำ — **แต่ responsive เป็น Must ทุก Tier ทุกหน้า** (ไม่ scope-down)

**Tier 2:** QC incoming + Supplier Management + Return · Shipping/Delivery Note · Dashboard รายแผนก · Traceability · BOM builder

**Tier 3:** Settings (RUCDAA, role ไม่จำกัด, company profile) · Home · Audit log · Payment/collection

## 5. ข้อกำหนด business ที่ UI ห้ามละเมิด (non-negotiable)

- **Status-journey continuity (คำสั่งเน้นของปอนด์):** ทุกการเปลี่ยนสถานะต้องต่อเนื่องข้าม module ตาม `status-journeys.md` และมี **trace เสมอ** (ใคร/จากอะไร→เป็นอะไร/เมื่อไหร่/เหตุผล) + comment ได้ทุกสถานะ (บังคับในจุดที่ระบุ)
- **Responsive ทุกหน้า (Must — คำสั่งย้ำจากปอนด์):** ทุกหน้าต้องแสดงผลได้ดีบน desktop / tablet / mobile — เป็น requirement หลัก **ไม่ใช่ nice-to-have** และไม่ scope-down เหลือเฉพาะบางหน้า
- **GMP traceability:** ไล่ Lot → Batch → FG ได้ครบ + UI อธิบาย Lot vs Batch; trace ทุก module/activity ตลอด; archive text file เฉพาะ Super User (Admin-bit ของ Traceability)
- **ใบกำกับภาษีไทยตามกฎหมาย/ตัวอย่างที่ปอนด์แนบ:** หัวเอกสาร (LOGO, ผู้ออก+เลขผู้เสียภาษี 13 หลัก, ลูกค้า, เลขที่, วันที่, เครดิต), ตารางรายการ, สรุปยอด (subtotal, **discount**, VAT 7% จาก VATConfig, grand total, **ตัวหนังสือไทย**), ท้าย (**ลายเซ็น 2 ช่อง**, ตรายาง) — ข้อมูลบริษัท Admin กรอกในหน้าตั้งค่า
- **Audit ทุก action** · **ผู้ใช้ไม่เคยใช้ ERP:** นำทางเอง, ไม่โชว์ enum/รหัสดิบ, อ่านออกทุกจุด, list สำคัญ search ได้, guard/ยืนยันงานที่ผิดไม่ได้, **จำนวนคลิก/หน้าต่อ task น้อยสุด (§2.1)**
- **Permission RUCDAA (6 ระดับ: Read/Update/Create/Delete/Approve/Admin) ราย module** + role ไม่จำกัด; UI แสดง/ซ่อนตามสิทธิ์จริง

## 6. Scope (v2 — รวม Gate1 รอบ1 + คำตอบยืนยัน)

**In scope:**
- Product identity: ชื่อ **ESSENCE Hub System** + placeholder logo/favicon (theme A teal) ทุกหน้า
- Design system (theme A) + mockup ทุกหน้า/ทุกสถานะ + **responsive ทุกหน้า (Must)**
- **Home**: ชื่อ user จุดเดียว
- **Dashboard รายแผนก** 7 แผนก + สลับเมื่อหลาย role
- **Customers**: contact ไม่จำกัด, 5 สถานะ (lifecycle §1 status-journeys), note timeline, sale assignment + reassign, ประวัติ PO, search ด้วย PO/วันที่
- **PO**: summary (ราคา/VAT/sale), suggest สินค้า + เช็ควัตถุดิบครบ/ขาด (**ขาด = เตือนไม่บล็อก + auto Purchase Request**), ขาย BOM + วัตถุดิบตรง, ราคา default จาก BOM แก้ได้; PO 2 ราง (fulfilment + billing)
- **Stock**: เพิ่มวัตถุดิบใหม่ + UOM, config เกณฑ์ใกล้หมด (% หรือจำนวน) ต่อวัตถุดิบ (**ไม่มี default — ไม่เตือนจนกว่าตั้งค่า**), ราคาซื้อ/ขายแยก
- **BOM builder**: สร้างสูตร (ไม่ต้องมี stock แต่โชว์ stock ประกอบ), ราคาทุน (default จากราคาซื้อ), ราคาขาย mandatory
- **Production**: เรียง/ค้นตามวันจัดส่ง/PO/ลูกค้า, Potential Delay (2+1 วัน), 5 สถานะ, comment + cross-notify Sale/Stock, trace
- **QC incoming + Supplier Management**: lot prefix ต่อ supplier, mapping วัตถุดิบ-หลาย supplier, รับเข้า (เลือก supplier → gen lot + เลขใบรับ + upload เอกสาร), **Return flow** (lot→supplier→ตัด stock + comment บังคับ)
- **Shipping**: Delivery Note รวมหลาย PO, 5 สถานะใบ + reconcile ระดับ PO (**Partially Delivered + สร้างใบใหม่จาก PO ที่เลื่อน**, **Rejected → กลับ Production + แจ้ง Sale**), comment + trace
- **Invoice**: ออกได้ตั้งแต่ PO=Confirmed + โชว์ PO status, overdue alert (นับวันค้าง), versioning, เอกสารใบกำกับภาษีไทยเต็มรูป
- **Traceability**: ทุก module/activity + archive text file (Super User)
- **Settings**: **RUCDAA (6 ระดับ) ราย module**, สร้าง role ไม่จำกัด, user ใต้ role, company profile
- **Roles ใหม่**: Sale Manager, Super User
- Implement ให้ตรง mockup บน React+Node+MySQL (ADR-000); QA regression; UX/UI visual audit

**Out of scope:**
- feature/logic นอก feedback ทั้งสองชุด + นอก prototype-v1 (= requirement ใหม่)
- เปลี่ยน tech stack · logo/แบรนด์จริง (ใช้ placeholder จากชื่อ ESSENCE Hub System) · ข้อมูลบริษัทจริง (Admin กรอกเอง)
- งาน design UI เอง (เป็นของ UX/UI — PO ให้กรอบ business + journey)

## 7. Definition of Done — feature v2 ทั้งสาย (ถึง Gate 2)

- [ ] **Gate 1 รอบ 2 ผ่าน:** mockup ครบ 100% ทุกหน้า/ทุกสถานะ + cross-module continuity + product identity (ESSENCE Hub System) + responsive ทุกหน้า + flow ผ่าน click budget — ปอนด์อนุมัติ
- [ ] **Engineer implement** ครบ scope §6 + ทุก status journey + กติกา §2.2 โดยหน้าตาตรง mockup + responsive
- [ ] **QA: Functional = 0 defect ทุกระดับ (minor/major/critical)** + ทดสอบทุก state transition & cross-module notify ถูกต้อง (regression เดิมไม่พัง)
- [ ] **UX/UI visual audit ผ่าน:** ตรง mockup + 0 หน้าโชว์ enum/รหัสดิบ + responsive จริงทุกหน้า + คะแนน UX/UI ≥ 3.5/5 และใช้ง่าย
- [ ] **ข้อกำหนดห้ามละเมิด (§5) ครบ:** trace ทุก status change, ใบกำกับภาษีครบ, permission RUCDAA ทำงาน
- [ ] **BKV ผ่านเกณฑ์:** BKV-1 (click budget + task success), BKV-3, BKV-4, BKV-5 (0 defect + UX ≥3.5), BKV-6
- [ ] **DevOps deploy** สำเร็จ
- [ ] **Gate 2 ผ่าน:** ปอนด์อนุมัติ release

## 8. Known constraints / target users
- Tech stack ตายตัว: React + Node.js + MySQL (ADR-000)
- GMP / full traceability + status-journey continuity + responsive เป็นข้อบังคับแฝงทุก feature
- Target users: พนักงานที่ไม่เคยใช้ ERP ทำงาน routine — usability + minimize clicks เป็น first-class requirement
- เอกสารต้นทาง: 44 stories/architecture ใน git tag `prototype-v1`; feedback prototype + ใบกำกับภาษีที่ `prototype-feedback-reference.md`; feedback Gate1 รอบ1 ที่ `pond-gate1-feedback.md`; state machine ที่ `status-journeys.md`

## 9. เอนทิตี/role ใหม่ที่ต้อง flag ให้ BA/Tech-Lead
- **Role ใหม่:** Sale Manager (reassign ลูกค้า, dashboard ทีม), Super User (archive trace)
- **เอนทิตีใหม่:** Purchase Request, Delivery Note (รวมหลาย PO), Supplier, Customer Contact (หลายรายการ), Customer Note, เอกสารใบรับ supplier (file), ใบคืนของ (Return), UOM, ราคาซื้อ/ขาย/ทุน แยก field, low-stock threshold config ต่อวัตถุดิบ (ไม่มี default)
- **สิทธิ์พิเศษ = permission ระดับ Admin (bit ที่ 6) ของ RUCDAA** ต่อ module: reassign customer, archive trace, ปลด Blacklist, status override — ไม่ใช้ capability layer แยกแล้ว (คำตอบปอนด์ ข้อ 5)
