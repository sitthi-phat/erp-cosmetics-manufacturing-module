# Product Brief — ESSENCE Hub System (ERP v2, UI-First Rebuild)

**ชื่อระบบอย่างเป็นทางการ: ESSENCE Hub System** (ปอนด์กำหนด 2026-07-08 — บันทึกใน CLAUDE.md)
slug: `erp-v2-ui-first` · เอกสารนี้เขียนในขั้น design-brief (PO ทำคู่ขนานกับ UX/UI) · เจ้าของ status ในขั้นนี้คือ UX/UI
เอกสารประกอบ: `status-journeys.md` (state machine ทุกสาย — หัวใจ Gate 1), `status-summary-for-pond.md`, `po-mockup-review.md`, `prototype-feedback-reference.md`, `pond-gate1-feedback.md`, `pond-gate1-r2-feedback.md`, `pond-gate1-r3-feedback.md`

## สรุปภาษาไทย
Prototype (prototype-v1) มี feature ครบ แต่ปอนด์ไม่อนุมัติเพราะ "ไม่ professional / ใช้ยาก / อ่านไม่ออก" v2 ("**ESSENCE Hub System**") กลับด้าน: **ล็อกหน้าตาให้ผ่านก่อนเขียนโค้ด** เน้น **"ทุกสถานะต้องต่อเนื่องกันทั้งระบบ ห้ามหลุด journey"**. Gate 1 ผ่าน 3 รอบยังไม่อนุมัติ — รอบ 3 (`pond-gate1-r3-feedback.md`) มี 4 ประเด็นที่ปอนด์สั่ง PO วิเคราะห์: **Dashboard date filter (นิยามต่อ tile), Goods Receipt หลายวัตถุดิบต่อใบ, QC ราย line item, Batch lifecycle** + งาน UX (หน้า create จริง, label ซ้ำ, test data สมจริง, dropdown search, supplier layout ใหม่, shipment round data). ข้อวิเคราะห์อยู่ใน `status-journeys.md` §3.1–§3.2, §5, §12–§13

---

## 0. Product Identity (ส่งถึง UX/UI เป็นข้อกำหนด)
- **ชื่อระบบ:** ESSENCE Hub System — ต้องปรากฏใน **ทุกหน้า mockup**: หน้า login, header ของแอป, และ **browser title**
- **Placeholder logo + favicon/app icon:** ออกแบบจากชื่อ "ESSENCE Hub System" ให้เข้ากับ **theme A — Clean Clinical (teal)** ที่ปอนด์เลือก
- โทน/สี = theme A teal ทั้งระบบ

## 1. ปัญหา/โอกาสทาง business (ทำไมต้อง rebuild แบบ UI-first)

**บทเรียนจาก prototype-v1:** functional ครบ order-to-cash แต่ตกที่ human gate ด้าน "หน้าตา" ซ้ำ ๆ → **adoption = 0** เพราะ user มือใหม่ใช้ไม่ได้จริง; แก้ UI ทีหลัง = rework แพงและวน

**สมมติฐานของ v2:** ล็อก "หน้าตา" (design system + mockup ทุกหน้า/ทุกสถานะ + theme) ให้ผ่านก่อนเขียนโค้ด → ตัด rework loop + ได้ระบบที่ user มือใหม่ใช้เองได้

**บทเรียนเพิ่มจาก Gate 1 รอบ 1–3:** functional scope เดิม**ยังไม่ครบพอ** — ปอนด์ระบุ requirement เชิงกระบวนการอีกมาก โดยเฉพาะ **ความต่อเนื่องของสถานะข้าม module** และ **รายละเอียด flow ต่อหน้า** (mockup = spec ของ BA/Engineer/QA — ทุกหน้า create/edit ต้องกดได้จริง + test data สมจริง)

## 2. Business Key Value (วัดที่ adoption/ความเร็วจริง)

| # | ตัวชี้วัด | Baseline | เป้าหมาย v2 | วัดเมื่อไร |
|---|---|---|---|---|
| BKV-1 | ความเร็ว/ความง่ายของ task หลัก — user มือใหม่ทำเองได้ โดย**ลดคลิก/หน้าให้น้อยสุด** | prototype หลายหน้า/หลายคลิก | เปิด PO ≤ 10 คลิก, ออก invoice ≤ 6 คลิก (เพดานวัด UAT) + smart default; ≥ 80% ทำสำเร็จเอง | UAT + review flow |
| BKV-2 | รอบ rework ด้านหน้าตา | ตกซ้ำ (ร1–ร3 ยังไม่ผ่าน) | อนุมัติหน้าตาที่ขั้น mockup ในรอบถัดไป | Gate 1 |
| BKV-3 | หน้าจอที่โชว์ enum/รหัสดิบ | มี | 0 หน้า | visual audit |
| BKV-4 | จุด feedback ปอนด์ที่ยังไม่ถูกแก้ | prototype 10 + ร1 12 + ร2 13 + ร3 | แก้เห็นชัดใน mockup ครบ 100% | Gate 1 รอบถัดไป |
| BKV-5 | คุณภาพส่งมอบ | prototype ไม่ผ่าน | **Functional = 0 defect ทุกระดับ** และ **UX/UI ≥ 3.5/5 + ต้องใช้ง่าย** | UAT / QA |
| BKV-6 | ความต่อเนื่องของสถานะข้าม module (mockup ต้นทาง+ปลายทาง + trace) | ไม่มีใน prototype | ครบทุกแถวใน `status-journeys.md` §8 | Gate 1 รอบถัดไป |

### 2.1 หลักการออกแบบข้อแรก — ส่งถึง UX/UI (คำสั่งตรงจากปอนด์)
ผู้ใช้ทำงาน routine ทั้งวัน — กรอกนาน/หลายหน้า = เลิกใช้+พลาดสูง ดังนั้นทุก mockup ต้อง: (1) **minimize clicks** (2) **จบในหน้าเดียวถ้าทำได้** (3) **smart defaults** (4) **อ่านง่าย/ไม่มี enum ดิบ** (5) **responsive ทุกหน้า (Must)** (6) **dropdown ทุกจุด search ได้** (7) **หน้า create/edit กดได้จริง (create ≠ edit)** (8) **test data สมจริงตรง use case**
> **Gate 1 = การเสนองานจริง ต้องดีที่สุด — mockup ต้องละเอียดพอเป็น spec ให้ BA/Engineer/QA**

## 2.2 กติกา business ที่ปอนด์ยืนยัน (รอบ1)
1. วัตถุดิบขาด = **เตือน ไม่บล็อก** + auto Purchase Request (ไม่มี Awaiting Materials)
2. เกณฑ์ "ใกล้หมด" **ไม่มี default** — ไม่เตือนจนกว่าตั้งค่าต่อวัตถุดิบ
3. Delivery Note: บาง PO เลื่อน/reject → Partially; PO เลื่อนสร้างใบใหม่ได้
4. PO Rejected ตอนส่ง → กลับ "พร้อมจัดส่ง" + แจ้ง Sale
5. RUCDA → **RUCDAA** (เพิ่มระดับ 6 "Admin")
6. ออกใบแจ้งหนี้ได้ตั้งแต่ PO = Confirmed

## 2.3 การแก้ flow รอบ 2 (`pond-gate1-r2-feedback.md`)
13 หมวด (dashboard drill-down+auto-refresh, ลูกค้า Follow-up, PO 3-date search+cancel/reopen, GR+ปิด PR, PR สร้างตรง, supplier price matrix+active/inactive, BOM snapshot, production flow ใหม่, QC fail loop, จัดส่ง 2 ชั้น, trace field-audit, settings 5 หน้าจอ) — ปิดครบในรอบ 3 (ดู `po-mockup-review.md` §7)

## 2.4 คำตอบปอนด์ (r2-analysis) — ยืนยันใน docs
- **ลูกค้า "ต้องติดตาม" = สถานะที่ 6 แยกจริง** → §1 · **การจัดส่ง 2 ชั้น Shipment→DN (DN=1 PO)** → §4 · PO reopen **คงเลข PO เดิม** · Hold "แก้ไข PO" **Sale แก้ได้หมด + trace** · BOM **snapshot + badge เตือน**

## 2.5 การแก้ flow รอบ 3 (`pond-gate1-r3-feedback.md`, 2026-07-08) — วิเคราะห์ 4 ประเด็น + งาน UX
**🔍PO 4 ประเด็นวิเคราะห์ (รายละเอียดเต็มใน `status-journeys.md`):**
1. **Dashboard date filter (§12):** preset **วันนี้/สัปดาห์นี้/เดือนนี้ (default)/กำหนดเอง** มีผลทุก tile — แยก metric 2 ชนิด: **event** (PO สร้างในช่วง, ค้างชำระครบกำหนดในช่วง, ห่างหาย=กลายเป็น Inactive ในช่วง, Follow-up=ตั้งในช่วง) vs **state/activity** (ลูกค้าประจำ=มี order ในช่วง; คิวผลิต=ตอนนี้) — แต่ละ tile มี **caption อธิบายว่าเลขหมายถึงอะไรกับช่วง** (กัน BA/QA งง)
2. **Goods Receipt multi-line (§5):** header (supplier/เลขใบรับ/วันที่/แนบไฟล์) + **หลาย line (วัตถุดิบ×จำนวน×ราคา×lot gen รายบรรทัด×อ้าง PR รายบรรทัด)**; **1 GR อ้างหลาย PR ได้ / 1 PR ปิดด้วยหลาย GR (partial)** [default รอยืนยัน]
3. **QC ราย line item (§3.2):** **เสนอ — ตีกลับเฉพาะ line/Batch ที่ไม่ผ่าน** (ผลิตซ้ำเฉพาะตัวเสีย, practical) · PO พร้อมจัดส่งเมื่อทุก line ผ่าน · **QC ตัดสินที่หน้า QC เท่านั้น** (หน้าผลิตเอา "QC ไม่ผ่าน" ออก) — ถามปอนด์ยืนยัน (vs ตีกลับทั้ง PO)
4. **Batch lifecycle (§3.1):** **gen Batch ตอนกด "เริ่มผลิต"**, **1 line item = 1 Batch** [default], Batch ผูก PO/line/Lot; QC เห็น PO↔Batch↔Lot (GMP chain: Lot→Batch→line→PO→ลูกค้า)

**งาน UX อื่นในรอบ 3:**
- **PO:** มี UI เปลี่ยนสถานะ PO ชัดเจน + trace
- **ลูกค้า:** หน้า "เพิ่มลูกค้า" เป็น create จริง (ไม่ใช่ edit), มีหน้า "เพิ่มผู้ติดต่อ" จริง, test data สมจริง (Follow-up มีเคส Hold, Blacklist มีเหตุผล)
- **Supplier:** หน้า "เพิ่ม Supplier" จริง + **layout แก้ไขใหม่ (ไม่เอา panel ขวา เลื่อนดูลำบาก)**
- **PR / BOM:** หน้า "สร้างคำขอใหม่" / "สร้างสูตรใหม่" เต็มจอ กดได้จริง
- **การจัดส่ง:** หน้า "สร้างรอบจัดส่ง" จริง 2 ทาง (เลือก PO ก่อน / สร้างรอบก่อนแล้ว search PO) + **ข้อมูลรอบ: คนขับ/เบอร์/Route/ประเภทรถ (เก๋ง/motorcycle/กระบะ/10 ล้อ)**
- **ทั่วทั้งระบบ:** ตรวจ **label ซ้ำทุกหน้า** (ปอนด์เจอ "Dashboard" 3 จุด), **dropdown search ได้ทุกจุด**, test data ตรง use case ทุกหน้า

## 3. นิยาม Gate 1 "อนุมัติหน้าตา" — เกณฑ์ (รวมรอบ 2–3)

ปอนด์อนุมัติ theme A (Clean Clinical teal). Gate 1 = การเสนองานจริง ต้องครบ+เนี๊ยบ+ **ละเอียดพอเป็น spec ให้ BA/Engineer/QA** + **ทุกหน้า create/edit กดได้จริง + test data สมจริง**

**เกณฑ์ผ่าน (ทุกข้อต้องจริง):**
- [ ] mockup coverage 100% ทุกหน้า + ทุกสถานะ (ลูกค้า 6 สถานะ, dashboard 7 แผนก drill-down+auto-refresh+date-filter, Shipment/DN 2 ชั้น, Batch/QC ราย line)
- [ ] หน้า create จริงครบ (เพิ่มลูกค้า/ผู้ติดต่อ/supplier/PR/BOM/รอบจัดส่ง) — กดได้ ไม่ใช่ edit
- [ ] ไม่มี label ซ้ำในหน้าเดียว (ตรวจทุกหน้า) · dropdown search ได้ทุกจุด · test data สมจริงตรง use case
- [ ] Goods Receipt multi-line + อ้าง PR หลายใบ · QC ราย line + Batch lifecycle เห็นชัด
- [ ] Dashboard date filter (preset + caption ต่อ tile) · shipment round data ครบ (คนขับ/เบอร์/route/รถ)
- [ ] feedback prototype 10 + ร1 + ร2 13 หมวด + ร3 map เห็นการแก้ครบ
- [ ] cross-module continuity ครบทุกแถว · ไม่มี enum ดิบ · responsive ทุกหน้า · ใบกำกับภาษีครบ
- [ ] Settings 5 หน้าจอ · Traceability field-audit+date range+entity · flow ผ่าน click budget

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

**Tier 2:** Dashboard รายแผนก (drill-down/auto-refresh/date-filter) · Shipping (Shipment) + Delivery Note · QC · Supplier · Purchase Request · Return · Traceability · BOM builder

**Tier 3:** Settings (5 หน้าจอ) · Home · Audit log · Payment/collection

## 5. ข้อกำหนด business ที่ UI ห้ามละเมิด (non-negotiable)

- **Status-journey continuity:** ทุกการเปลี่ยนสถานะต่อเนื่องข้าม module ตาม `status-journeys.md` + **trace เสมอ** (รวม cancel/reopen, QC fail, Hold, Follow-up, PO status-change) + comment (บังคับในจุดที่ระบุ)
- **Responsive ทุกหน้า (Must)**
- **GMP traceability:** ไล่ **Lot → Batch → line → PO → ลูกค้า**; **Batch สร้างตอนเริ่มผลิต ผูก PO/line/Lot**; audit ระดับ field; archive text file เฉพาะ Super User
- **ใบกำกับภาษีไทย:** LOGO, ผู้ออก+เลขผู้เสียภาษี 13 หลัก, ลูกค้า, เลขที่/วันที่/เครดิต, ตารางรายการ, สรุปยอด (subtotal, **discount**, **VAT7% + effective date**, grand total, **ตัวหนังสือไทย**), **ลายเซ็น 2 ช่อง**, ตรายาง
- **Audit ทุก action** · ผู้ใช้ไม่เคยใช้ ERP: นำทางเอง, ไม่โชว์ enum/รหัสดิบ, **dropdown search ได้ทุกจุด**, guard งานที่ผิดไม่ได้, **คลิก/หน้าต่อ task น้อยสุด**
- **Permission RUCDAA (6 ระดับ) ราย module** + role ไม่จำกัด

## 6. Scope (v2 — รวม Gate1 รอบ1–3)

**In scope:**
- Product identity ESSENCE Hub System + placeholder logo/favicon ทุกหน้า
- Design system (theme A) + mockup ทุกหน้า/ทุกสถานะ + **responsive ทุกหน้า (Must)** + **หน้า create/edit กดได้จริง + test data สมจริง + ไม่มี label ซ้ำ + dropdown search ได้**
- **Home**: ชื่อ user + "หน้าหลัก" จุดเดียว
- **Dashboard รายแผนก 7 แผนก**: refresh + auto-refresh 15s (default) ค้าง view; **date filter (วันนี้/สัปดาห์/เดือน default/กำหนดเอง) มีผลทุก tile + caption นิยามต่อ tile (§12)**; KPI tile drill-down → list + pagination; Sale tile "ต้องติดตาม"
- **Customers**: contact ไม่จำกัด (**หน้าเพิ่มผู้ติดต่อจริง**), **6 สถานะ** + comment บังคับ, **หน้าเพิ่มลูกค้า = create จริง**, note timeline, reassign, ประวัติ PO, search
- **PO**: summary, suggest + เช็ควัตถุดิบ (ขาด=เตือนไม่บล็อก + auto PR), ขาย BOM+วัตถุดิบ, แก้จำนวน+ราคา (0 ได้), search 3 วันที่, cancel+reopen (คงเลขเดิม), **UI เปลี่ยนสถานะ PO + trace**, 2 ราง
- **Stock**: เพิ่มวัตถุดิบ+UOM, เกณฑ์ใกล้หมด (ไม่มี default), ราคา 0 ได้, **หน้า Goods Receipt multi-line** (header + หลาย line วัตถุดิบ×จำนวน×ราคา×lot gen รายบรรทัด×อ้าง PR หลายใบ → ปิด PR อัตโนมัติ)
- **Supplier**: **หน้าเพิ่ม Supplier จริง** + **layout แก้ไขใหม่ (ไม่เอา panel ขวา)** + price matrix (supplier×วัตถุดิบ) + search วัตถุดิบ, Active/Inactive; ไม่มีรับเข้าคลังในหน้านี้
- **BOM builder**: **หน้าสร้างสูตรใหม่ กดได้จริง**, ราคาทุน = max active supplier + แก้ทับได้ + snapshot + badge เตือน, ราคาขาย mandatory
- **Production**: flow รับงาน→กำลังผลิต→รอ QC→พร้อมส่งมอบ; **gen Batch ตอนเริ่มผลิต (1 line=1 Batch)**; **หน้าผลิตไม่มีปุ่ม "QC ไม่ผ่าน"** (มาจากหน้า QC); Hold→แก้ PO→ผลิตต่อ; Potential Delay; เรียง/ค้นวันจัดส่ง
- **QC**: incoming inspection + **batch QC ราย line item** (ไม่ผ่าน→ตีกลับเฉพาะ line ที่เสีย+feedback); QC ตัดสินที่หน้านี้เท่านั้น; เห็น PO↔Batch↔Lot
- **Purchase Request**: **หน้าสร้างคำขอใหม่จริง**, ของเข้าครบ auto จาก GR, รับทราบ/ปิดคำขอ manual, partial receipt
- **Shipping 2 ชั้น**: Shipment (รอบ) รวมหลาย DN / DN 1 ใบ = 1 PO print ทีละใบ; **หน้าสร้างรอบจัดส่งจริง 2 ทาง + ข้อมูลรอบ (คนขับ/เบอร์/route/ประเภทรถ)**; Reject→raise Sale; Postpone→flag+วันที่ ค้างคิว
- **Return**: lot→supplier→ตัด stock + comment บังคับ
- **Invoice**: ออกได้ตั้งแต่ PO=Confirmed + โชว์ PO status, overdue, versioning, ใบกำกับภาษีไทย (VAT+effective date)
- **Traceability**: search ทุก entity, date range+time, เลือก entity, **audit ระดับ field**, GMP chain Lot→Batch→line→PO, archive (Super User)
- **Settings — 5 หน้าจอจริง**: Role&สิทธิ์(+สร้าง role), ผู้ใช้(+สร้าง user), VAT+effective date, ข้อมูลบริษัท, Audit log; RUCDAA
- **Roles ใหม่**: Sale Manager, Super User · **Notification/Inbox + deep link**
- Implement ให้ตรง mockup บน React+Node+MySQL (ADR-000); QA regression; UX/UI visual audit

**Out of scope:**
- feature/logic นอก feedback ทั้ง 4 ชุด + นอก prototype-v1 (= requirement ใหม่)
- เปลี่ยน tech stack · logo/แบรนด์จริง (ใช้ placeholder) · ข้อมูลบริษัทจริง (Admin กรอกเอง)
- งาน design UI เอง (เป็นของ UX/UI — PO ให้กรอบ business + journey)

## 7. Definition of Done — feature v2 ทั้งสาย (ถึง Gate สุดท้าย)

- [ ] **Gate 1 ผ่าน:** mockup ครบ 100% ทุกหน้า/ทุกสถานะ (flow รอบ2–3 + 6 สถานะ + Shipment/DN + Batch/QC ราย line + GR multi-line) + หน้า create จริง + cross-module continuity + responsive + Settings 5 หน้าจอ — ปอนด์อนุมัติ
- [ ] **Engineer implement** ครบ scope §6 + ทุก status journey + กติกา §2.2–§2.5 โดยหน้าตาตรง mockup + responsive
- [ ] **QA: Functional = 0 defect ทุกระดับ** + ทดสอบทุก state transition & cross-module notify + GMP chain
- [ ] **UX/UI visual audit ผ่าน:** ตรง mockup + 0 หน้าโชว์ enum/รหัสดิบ + responsive จริง + UX/UI ≥ 3.5/5
- [ ] **ข้อกำหนดห้ามละเมิด (§5) ครบ:** trace ทุก status change + audit ระดับ field + GMP chain, ใบกำกับภาษีครบ, RUCDAA
- [ ] **BKV ผ่านเกณฑ์:** BKV-1/3/4/5/6
- [ ] **DevOps deploy** สำเร็จ · **Gate สุดท้าย:** ปอนด์อนุมัติ release

## 8. Known constraints / target users
- Tech stack ตายตัว: React + Node.js + MySQL (ADR-000)
- GMP / full traceability (Lot→Batch→line→PO, audit ระดับ field) + status-journey continuity + responsive เป็นข้อบังคับแฝงทุก feature
- Target users: พนักงานที่ไม่เคยใช้ ERP ทำงาน routine — usability + minimize clicks เป็น first-class requirement
- เอกสารต้นทาง: prototype-v1 (git tag); `prototype-feedback-reference.md`; `pond-gate1-feedback.md`; `pond-gate1-r2-feedback.md`; `pond-gate1-r3-feedback.md`; state machine `status-journeys.md`; mockup review `po-mockup-review.md`

## 9. เอนทิตี/role ใหม่ที่ต้อง flag ให้ BA/Tech-Lead
- **Role ใหม่:** Sale Manager (reassign, dashboard ทีม, ตั้ง Follow-up), Super User (archive trace)
- **เอนทิตี/field ใหม่:** **Batch (สร้างตอนเริ่มผลิต, 1 line=1 Batch, ผูก PO/line/Lot)**, **Goods Receipt multi-line (header + lines, lot gen รายบรรทัด, อ้าง PR หลายใบ)**, **Shipment (รอบจัดส่ง: คนขับ/เบอร์/route/ประเภทรถ)**, Delivery Note (1 ใบ=1 PO), Purchase Request (สร้างตรง + partial receipt), Supplier (+active/inactive + **Supplier×Material price matrix**), Customer Contact (หลายรายการ, หน้าเพิ่มจริง), **Customer สถานะที่ 6 "Follow-up" + comment**, ใบคืนของ (Return), UOM, ราคาซื้อ/ขาย/ทุน แยก field (0 ได้), **BOM cost snapshot + badge ล้าสมัย**, VAT effective date, **field-level audit**, **PO cancel/reopen (คงเลขเดิม) + PO status-change UI**, Postpone flag + date, **Vehicle type list (เก๋ง/motorcycle/กระบะ/10 ล้อ, config ได้)**
- **สิทธิ์พิเศษ = permission ระดับ Admin (bit ที่ 6) ของ RUCDAA** ต่อ module: reassign customer, archive trace, ปลด Blacklist, status override, cancel/reopen PO

## 10. สถานะคำถาม
- คำถาม flow 5 ข้อ (r2-analysis) ปอนด์ตอบครบแล้ว (§2.4)
- **รอบ 3 (r3-analysis): มีคำถามยืนยัน 5 ข้อ** (QC ราย line ตีกลับเฉพาะ line vs ทั้ง PO / Batch 1-line-1-batch / dashboard default+ตีความ / GR อ้างหลาย PR + PR ปิดหลาย GR / BOM ไม่มี active supplier) — ตั้ง default แล้ว ไม่ block UX/UI; รวบใน `status-journeys.md` §13 + `pipeline/status.json` entry po/gate1-r3-analysis
