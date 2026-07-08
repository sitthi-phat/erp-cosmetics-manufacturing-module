# Product Brief — ESSENCE Hub System (ERP v2, UI-First Rebuild)

**ชื่อระบบอย่างเป็นทางการ: ESSENCE Hub System** (ปอนด์กำหนด 2026-07-08 — บันทึกใน CLAUDE.md)
slug: `erp-v2-ui-first` · เอกสารนี้เขียนในขั้น design-brief (PO ทำคู่ขนานกับ UX/UI) · เจ้าของ status ในขั้นนี้คือ UX/UI
เอกสารประกอบ: `status-journeys.md` (state machine ทุกสาย — หัวใจ Gate 1), `status-summary-for-pond.md`, `po-mockup-review.md`, `prototype-feedback-reference.md`, `pond-gate1-feedback.md`, `pond-gate1-r2-feedback.md`

## สรุปภาษาไทย
Prototype (prototype-v1) มี feature ครบ แต่ปอนด์ไม่อนุมัติเพราะ "ไม่ professional / ใช้ยาก / อ่านไม่ออก" — คุณค่า business ยังไม่เกิดเพราะ user ใช้จริงไม่ได้ v2 ("**ESSENCE Hub System**") กลับด้าน: **ล็อกหน้าตาให้ผ่านก่อนเขียนโค้ด** เน้น **"ทุกสถานะต้องต่อเนื่องกันทั้งระบบ ห้ามหลุด journey"** (`status-journeys.md`). Gate 1 ผ่าน 2 รอบยังไม่อนุมัติ — รอบ 2 ปอนด์ให้ feedback รายหน้า 13 หมวด + ตอบคำถาม flow ครบ (ล่าสุด: **ลูกค้ามี 6 สถานะ** เพิ่ม "ต้องติดตาม", **การจัดส่ง 2 ชั้น Shipment→DN, DN 1 ใบ=1 PO**). เอกสารชุดนี้เป็น input ของ BA/Engineer/QA จึงต้องละเอียด — PO ได้ review mockups ครบ 24 หน้าและออกรายการสั่งงานรอบ 3 (`po-mockup-review.md`)

---

## 0. Product Identity (ส่งถึง UX/UI เป็นข้อกำหนด)
- **ชื่อระบบ:** ESSENCE Hub System — ต้องปรากฏใน **ทุกหน้า mockup**: หน้า login, header ของแอป, และ **browser title**
- **Placeholder logo + favicon/app icon:** ออกแบบจากชื่อ "ESSENCE Hub System" ให้เข้ากับ **theme A — Clean Clinical (teal)** ที่ปอนด์เลือก
- โทน/สี = theme A teal ทั้งระบบ

## 1. ปัญหา/โอกาสทาง business (ทำไมต้อง rebuild แบบ UI-first)

**บทเรียนจาก prototype-v1:** functional ครบ order-to-cash แต่ตกที่ human gate ด้าน "หน้าตา" ซ้ำ ๆ → **adoption = 0** เพราะ user มือใหม่ใช้ไม่ได้จริง; แก้ UI ทีหลัง = rework แพงและวน

**สมมติฐานของ v2:** ล็อก "หน้าตา" (design system + mockup ทุกหน้า/ทุกสถานะ + theme) ให้ผ่านก่อนเขียนโค้ด → ตัด rework loop + ได้ระบบที่ user มือใหม่ใช้เองได้

**บทเรียนเพิ่มจาก Gate 1 รอบ 1–2:** functional scope เดิม**ยังไม่ครบพอ** — ปอนด์ระบุ requirement เชิงกระบวนการอีกมาก โดยเฉพาะ **ความต่อเนื่องของสถานะข้าม module** และ **รายละเอียด flow ต่อหน้า** (mockup = input ของ BA/Engineer/QA)

## 2. Business Key Value (วัดที่ adoption/ความเร็วจริง)

| # | ตัวชี้วัด | Baseline | เป้าหมาย v2 | วัดเมื่อไร |
|---|---|---|---|---|
| BKV-1 | ความเร็ว/ความง่ายของ task หลัก — user มือใหม่ทำเองได้ โดย**ลดคลิก/หน้าให้น้อยสุด** | prototype หลายหน้า/หลายคลิก | เปิด PO ≤ 10 คลิก, ออก invoice ≤ 6 คลิก (เพดานวัด UAT) + smart default; ≥ 80% ทำสำเร็จเอง | UAT + review flow |
| BKV-2 | รอบ rework ด้านหน้าตา | ตกซ้ำ (ร1–ร2 ยังไม่ผ่าน) | อนุมัติหน้าตาที่ขั้น mockup ในรอบถัดไป | Gate 1 |
| BKV-3 | หน้าจอที่โชว์ enum/รหัสดิบ | มี | 0 หน้า | visual audit |
| BKV-4 | จุด feedback ปอนด์ที่ยังไม่ถูกแก้ | prototype 10 + ร1 12 หน้า + ร2 13 หมวด | แก้เห็นชัดใน mockup ครบ 100% | Gate 1 รอบถัดไป |
| BKV-5 | คุณภาพส่งมอบ | prototype ไม่ผ่าน | **Functional = 0 defect ทุกระดับ** และ **UX/UI ≥ 3.5/5 + ต้องใช้ง่าย** | UAT / QA |
| BKV-6 | ความต่อเนื่องของสถานะข้าม module (mockup ต้นทาง+ปลายทาง + trace) | ไม่มีใน prototype | ครบทุกแถวใน `status-journeys.md` §8 | Gate 1 รอบถัดไป |

### 2.1 หลักการออกแบบข้อแรก — ส่งถึง UX/UI (คำสั่งตรงจากปอนด์)
ผู้ใช้ทำงาน routine ทั้งวัน — กรอกนาน/หลายหน้า = เลิกใช้+พลาดสูง ดังนั้นทุก mockup ต้อง: (1) **minimize clicks** (2) **จบในหน้าเดียวถ้าทำได้** (3) **smart defaults** (ราคาจาก BOM, lot FIFO, supplier จาก lot) (4) **อ่านง่าย/ไม่มี enum ดิบ** (5) **responsive ทุกหน้า (Must)**
> **Gate 1 = การเสนองานจริง ต้องดีที่สุด — mockup ต้องละเอียดพอเป็น input ให้ BA/Engineer/QA ทำครบ**

## 2.2 กติกา business ที่ปอนด์ยืนยัน (รอบ1) — ผูกเข้า `status-journeys.md`
1. วัตถุดิบขาด = **เตือน ไม่บล็อก** + auto Purchase Request (ไม่มี Awaiting Materials)
2. เกณฑ์ "ใกล้หมด" **ไม่มี default** — ไม่เตือนจนกว่าตั้งค่าต่อวัตถุดิบ
3. Delivery Note: บาง PO เลื่อน/reject → Partially; PO เลื่อนสร้างใบใหม่ได้
4. PO Rejected ตอนส่ง → กลับ "พร้อมจัดส่ง" + แจ้ง Sale
5. RUCDA → **RUCDAA** (เพิ่มระดับ 6 "Admin")
6. ออกใบแจ้งหนี้ได้ตั้งแต่ PO = Confirmed

## 2.3 การแก้ flow รอบ 2 (`pond-gate1-r2-feedback.md`) — ผูกเข้า `status-journeys.md`
1. **Home:** "หน้าหลัก" ซ้ำ → เหลือที่เดียว
2. **Dashboard ทุกแผนก:** ปุ่ม refresh + **auto-refresh 15s (default)** + **refresh แล้วค้าง view เดิม**; **ทุก KPI tile drill-down → รายการ + pagination + กดเข้าถึง module พร้อม context**; Sale เพิ่ม tile "ต้องติดตาม"
3. **ลูกค้า:** **"ต้องติดตาม" = สถานะที่ 6 แยกจริง** (คำตอบปอนด์) + **comment บังคับ** — ตั้งโดย Sale/Sale Manager, เข้า-ออก Active/Inactive ได้, ผูก use case Production Hold, โชว์ tile Sale dashboard
4. **PO:** search 3 แบบวันที่ (สร้าง/จัดส่งจริง/ต้องการรับ); เพิ่มสินค้าแก้จำนวน+ราคา/หน่วยได้เสมอ **ราคา 0 ได้**; **cancel ได้ทุก case + Cancelled → Draft (คงเลข PO เดิม) รับงานต่อได้** (trace เต็ม)
5. **Stock:** ราคาซื้อ/ขาย 0 ได้; **หน้า Goods Receipt เต็มจอ** (lot+supplier, อ้าง/search PR → **ปิด PR อัตโนมัติ** พร้อมเหตุผลรับจาก lot ไหน)
6. **Purchase Request:** **สร้างตรงจากหน้า PR ได้**; "ของเข้าครบ" auto จาก goods receipt; "รับทราบ"+"ปิดคำขอ" manual
7. **Supplier:** เพิ่ม/แก้ + **ผูกวัตถุดิบรายตัว + ราคารับซื้อ (matrix supplier×วัตถุดิบ)** + search วัตถุดิบตอนผูก; **Active/Inactive**; **ไม่มีฟังก์ชันรับเข้าคลังในหน้านี้** (อยู่ stock)
8. **BOM:** หน้าสร้างสูตรเต็มรูปแบบ; **ราคาทุน = สูงสุดของ supplier ที่ active + user แก้ทับได้ + snapshot ตอนบันทึก + badge เตือน "ราคาทุนอาจล้าสมัย"**; ราคาขาย mandatory
9. **การผลิต:** flow ใหม่ รับงาน→กำลังผลิต→QC→พร้อมส่งมอบ (จบแค่นี้); QC ไม่ผ่าน→กลับกำลังผลิต+feedback; **Hold→แก้ไข PO (Sale แก้ได้หมด+trace)→ผลิตต่อ (raise Sale)**
10. **QC:** ไม่ผ่าน → กลับ "กำลังผลิต" พร้อม feedback
11. **การจัดส่ง 2 ชั้น (คำตอบปอนด์):** **Shipment (รอบจัดส่ง)** 1 รอบรวมหลาย **DN** (สถานะรอบ: รับเข้ารอบ/กำลังนำส่ง/จบรอบ) · **DN 1 ใบ = 1 PO เสมอ** print ทีละใบให้ลูกค้าเซ็น (สถานะ DN ราย order: ส่งถึง/ปฏิเสธ/เลื่อน); หน้าจัดส่ง=สร้างรอบ (เลือก PO "พร้อมจัดส่ง", search ด้วย PO ID/ข้อมูลลูกค้า); **Reject→PO พร้อมจัดส่ง+raise Sale**; **Postpone→PO พร้อมจัดส่ง + flag "กันจัดส่ง Postpone"+วันที่ ค้างคิว**; **รอบจบเมื่อทุก DN จบ**
12. **Traceability:** search ทุก entity (ลูกค้า/PO/วัตถุดิบ/PR/Supplier/BOM) มุมมองผลิต(status)+จัดส่ง(รอบ+DN); **date range + time**; เลือกประเภท entity; **audit ระดับ field** (ใครทำอะไร ค่าไหนเปลี่ยน จากอะไรเป็นอะไร)
13. **Settings — 5 หน้าจอจริง:** (1) Role & สิทธิ์ +สร้าง role (2) ผู้ใช้ +สร้าง user (3) Config VAT + effective date (4) ข้อมูลบริษัท (5) Audit log

## 2.4 คำตอบปอนด์ล่าสุด (r2-analysis, 2026-07-08) — ยืนยันใน docs
- **ลูกค้า "ต้องติดตาม" = สถานะที่ 6 แยกจริง** (ต่างจาก default flag-ซ้อน) → `status-journeys.md` §1
- **การจัดส่ง 2 ชั้น: Shipment (รอบ) รวมหลาย DN / DN 1 ใบ = 1 PO** (ต่างจาก default 1-ใบ-หลาย-PO) → §4
- PO reopen **คงเลข PO เดิม** · Hold "แก้ไข PO" **Sale แก้ได้หมด + trace** · BOM **snapshot + badge เตือน** — ตรง default, ยืนยันชัดใน docs แล้ว

## 3. นิยาม Gate 1 "อนุมัติหน้าตา" — เกณฑ์ (รวมรอบ 2)

ปอนด์อนุมัติ theme A (Clean Clinical teal). Gate 1 = การเสนองานจริง ต้องครบ+เนี๊ยบ+ **ละเอียดพอเป็น input ให้ BA/Engineer/QA**

**เกณฑ์ผ่าน (ทุกข้อต้องจริง):**
- [ ] mockup coverage 100% ทุกหน้า + ทุกสถานะ (ลูกค้า 6 สถานะ, dashboard 7 แผนก drill-down+auto-refresh, ทุก state ทุก journey รวม Shipment/DN 2 ชั้น)
- [ ] ชื่อ + logo/icon (theme teal) ทุกหน้า
- [ ] feedback prototype 10 + Gate1-ร1 + **Gate1-ร2 13 หมวด** map เห็นการแก้ครบ
- [ ] cross-module continuity ครบทุกแถว (ต้นทาง+ปลายทาง)
- [ ] ไม่มี mockup โชว์ enum/รหัสดิบ · ทุกหน้า responsive (desktop+tablet+mobile)
- [ ] ใบกำกับภาษีไทยฟิลด์ครบ (VAT + effective date)
- [ ] Dashboard drill-down + pagination + auto-refresh 15s ค้าง context ครบทุกแผนก
- [ ] Traceability: audit ระดับ field + date range + เลือก entity
- [ ] Settings ครบ 5 หน้าจอ · flow หลักผ่าน click budget

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

**Tier 1 — หัวใจ:** PO create+summary · Production (flow ใหม่) · Invoice+ใบกำกับภาษีไทย · Stock · Customer (6 สถานะ)
> Tier ใช้จัดลำดับความประณีต — **responsive เป็น Must ทุก Tier ทุกหน้า**

**Tier 2:** Dashboard รายแผนก (drill-down/auto-refresh) · Shipping (Shipment) + Delivery Note · QC · Supplier · Purchase Request · Return · Traceability · BOM builder

**Tier 3:** Settings (5 หน้าจอ) · Home · Audit log · Payment/collection

## 5. ข้อกำหนด business ที่ UI ห้ามละเมิด (non-negotiable)

- **Status-journey continuity:** ทุกการเปลี่ยนสถานะต่อเนื่องข้าม module ตาม `status-journeys.md` + **trace เสมอ** (รวม cancel/reopen, QC fail, Hold, Follow-up) + comment (บังคับในจุดที่ระบุ)
- **Responsive ทุกหน้า (Must)**
- **GMP traceability:** ไล่ Lot → Batch → FG + อธิบาย Lot vs Batch; **audit ระดับ field**; archive text file เฉพาะ Super User
- **ใบกำกับภาษีไทย:** LOGO, ผู้ออก+เลขผู้เสียภาษี 13 หลัก, ลูกค้า, เลขที่/วันที่/เครดิต, ตารางรายการ, สรุปยอด (subtotal, **discount**, **VAT7% + effective date**, grand total, **ตัวหนังสือไทย**), **ลายเซ็น 2 ช่อง**, ตรายาง — ข้อมูลบริษัท Admin กรอกใน settings
- **Audit ทุก action** · ผู้ใช้ไม่เคยใช้ ERP: นำทางเอง, ไม่โชว์ enum/รหัสดิบ, search ได้, guard งานที่ผิดไม่ได้, **คลิก/หน้าต่อ task น้อยสุด**
- **Permission RUCDAA (6 ระดับ) ราย module** + role ไม่จำกัด

## 6. Scope (v2 — รวม Gate1 รอบ1+รอบ2 + คำตอบล่าสุด)

**In scope:**
- Product identity ESSENCE Hub System + placeholder logo/favicon ทุกหน้า
- Design system (theme A) + mockup ทุกหน้า/ทุกสถานะ + **responsive ทุกหน้า (Must)**
- **Home**: ชื่อ user + "หน้าหลัก" จุดเดียว
- **Dashboard รายแผนก 7 แผนก**: refresh + **auto-refresh 15s (default) ค้าง view เดิม**; **KPI tile drill-down → list + pagination + context**; Sale เพิ่ม tile "ต้องติดตาม"; สลับแผนกเมื่อหลาย role
- **Customers**: contact ไม่จำกัด, **6 สถานะ (เพิ่ม "ต้องติดตาม" + comment บังคับ)**, note timeline, sale assignment + reassign, ประวัติ PO, search ด้วย PO/วันที่
- **PO**: summary (ราคา/VAT/sale), suggest + เช็ควัตถุดิบ (ขาด=เตือนไม่บล็อก + auto PR), ขาย BOM+วัตถุดิบ, **แก้จำนวน+ราคาได้เสมอ ราคา 0 ได้**, **search 3 แบบวันที่**, **cancel ทุก case + Cancelled→Draft reopen (คงเลขเดิม, trace เต็ม)**, 2 ราง
- **Stock**: เพิ่มวัตถุดิบ + UOM, เกณฑ์ใกล้หมด (ไม่มี default), **ราคาซื้อ/ขาย 0 ได้**, **หน้า Goods Receipt เต็มจอ** (lot+supplier, อ้าง/search PR → ปิด PR อัตโนมัติ)
- **Supplier**: เพิ่ม/แก้ + **price matrix (supplier×วัตถุดิบ)** + search วัตถุดิบ, **Active/Inactive**; ไม่มีรับเข้าคลังในหน้านี้
- **BOM builder**: สร้างสูตรเต็มรูปแบบ, **ราคาทุน = max active supplier + แก้ทับได้ + snapshot + badge เตือน**, ราคาขาย mandatory
- **Production**: flow ใหม่ (รับงาน→กำลังผลิต→QC→พร้อมส่งมอบ; QC loop; Hold→แก้ PO (Sale แก้ได้หมด)→ผลิตต่อ raise Sale), Potential Delay, เรียง/ค้นวันจัดส่ง
- **QC**: incoming inspection + batch QC (ไม่ผ่าน→กลับกำลังผลิต+feedback)
- **Purchase Request**: **สร้างตรงได้**, ของเข้าครบ auto จาก goods receipt, รับทราบ/ปิดคำขอ manual
- **Shipping 2 ชั้น**: **Shipment (รอบ) รวมหลาย DN / DN 1 ใบ = 1 PO** print ทีละใบ; หน้าจัดส่ง=สร้างรอบ (PO พร้อมจัดส่ง, search PO ID/ข้อมูลลูกค้า), Reject→PO พร้อมจัดส่ง+raise Sale, **Postpone→flag กันจัดส่ง+วันที่ ค้างคิว**, รอบจบเมื่อทุก DN จบ
- **Return**: lot→supplier→ตัด stock + comment บังคับ
- **Invoice**: ออกได้ตั้งแต่ PO=Confirmed + โชว์ PO status, overdue alert, versioning, ใบกำกับภาษีไทยเต็มรูป (VAT+effective date)
- **Traceability**: search ทุก entity มุมมองผลิต+จัดส่ง(รอบ+DN), date range+time, เลือก entity, **audit ระดับ field**, archive (Super User)
- **Settings — 5 หน้าจอจริง**: Role&สิทธิ์(+สร้าง role), ผู้ใช้(+สร้าง user), Config VAT+effective date, ข้อมูลบริษัท, Audit log; RUCDAA, role ไม่จำกัด
- **Roles ใหม่**: Sale Manager, Super User · **Notification/Inbox + deep link** (`status-journeys.md` §10)
- Implement ให้ตรง mockup บน React+Node+MySQL (ADR-000); QA regression; UX/UI visual audit

**Out of scope:**
- feature/logic นอก feedback ทั้ง 3 ชุด + นอก prototype-v1 (= requirement ใหม่)
- เปลี่ยน tech stack · logo/แบรนด์จริง (ใช้ placeholder) · ข้อมูลบริษัทจริง (Admin กรอกเอง)
- งาน design UI เอง (เป็นของ UX/UI — PO ให้กรอบ business + journey)

## 7. Definition of Done — feature v2 ทั้งสาย (ถึง Gate สุดท้าย)

- [ ] **Gate 1 ผ่าน:** mockup ครบ 100% ทุกหน้า/ทุกสถานะ (รวม flow รอบ2 + ลูกค้า 6 สถานะ + Shipment/DN 2 ชั้น) + cross-module continuity + product identity + responsive + Settings 5 หน้าจอ + Dashboard drill-down + click budget — ปอนด์อนุมัติ
- [ ] **Engineer implement** ครบ scope §6 + ทุก status journey + กติกา §2.2/§2.3/§2.4 โดยหน้าตาตรง mockup + responsive
- [ ] **QA: Functional = 0 defect ทุกระดับ** + ทดสอบทุก state transition & cross-module notify ถูกต้อง
- [ ] **UX/UI visual audit ผ่าน:** ตรง mockup + 0 หน้าโชว์ enum/รหัสดิบ + responsive จริง + UX/UI ≥ 3.5/5
- [ ] **ข้อกำหนดห้ามละเมิด (§5) ครบ:** trace ทุก status change + audit ระดับ field, ใบกำกับภาษีครบ, RUCDAA ทำงาน
- [ ] **BKV ผ่านเกณฑ์:** BKV-1/3/4/5/6
- [ ] **DevOps deploy** สำเร็จ · **Gate สุดท้าย:** ปอนด์อนุมัติ release

## 8. Known constraints / target users
- Tech stack ตายตัว: React + Node.js + MySQL (ADR-000)
- GMP / full traceability (audit ระดับ field) + status-journey continuity + responsive เป็นข้อบังคับแฝงทุก feature
- Target users: พนักงานที่ไม่เคยใช้ ERP ทำงาน routine — usability + minimize clicks เป็น first-class requirement
- เอกสารต้นทาง: prototype-v1 (git tag); `prototype-feedback-reference.md`; `pond-gate1-feedback.md`; `pond-gate1-r2-feedback.md`; state machine `status-journeys.md`; สรุปปอนด์ `status-summary-for-pond.md`; mockup review `po-mockup-review.md`

## 9. เอนทิตี/role ใหม่ที่ต้อง flag ให้ BA/Tech-Lead
- **Role ใหม่:** Sale Manager (reassign, dashboard ทีม, ตั้ง Follow-up), Super User (archive trace)
- **เอนทิตี/field ใหม่:** **Shipment (รอบจัดส่ง)** + Delivery Note (1 ใบ=1 PO, print ราย order), Purchase Request (สร้างตรงได้), Supplier (+active/inactive), **Supplier×Material price matrix**, Customer Contact (หลายรายการ), **Customer สถานะที่ 6 "Follow-up" + comment**, เอกสารใบรับ supplier (file), ใบคืนของ (Return), UOM, ราคาซื้อ/ขาย/ทุน แยก field (0 ได้), **BOM cost snapshot (max active supplier) + badge ล้าสมัย**, low-stock threshold ต่อวัตถุดิบ (ไม่มี default), **VAT effective date**, **field-level audit**, **PO cancel/reopen (คงเลขเดิม)**, **Postpone flag + date** ระดับ PO/DN
- **สิทธิ์พิเศษ = permission ระดับ Admin (bit ที่ 6) ของ RUCDAA** ต่อ module: reassign customer, archive trace, ปลด Blacklist, status override, cancel/reopen PO

## 10. สถานะคำถาม
คำถาม flow 5 ข้อจากรอบ r2-analysis **ปอนด์ตอบครบแล้ว** (สรุปใน `status-journeys.md` §12 + §2.4 ด้านบน) — ไม่มีคำถามค้างในรอบนี้
