# Product Brief — ESSENCE Hub System (ERP v2, UI-First Rebuild)

**ชื่อระบบอย่างเป็นทางการ: ESSENCE Hub System** (ปอนด์กำหนด 2026-07-08 — บันทึกใน CLAUDE.md)
slug: `erp-v2-ui-first` · เอกสารนี้เขียนในขั้น design-brief (PO ทำคู่ขนานกับ UX/UI) · เจ้าของ status ในขั้นนี้คือ UX/UI
เอกสารประกอบ: `status-journeys.md` (state machine ทุกสาย — หัวใจ Gate 1), `status-summary-for-pond.md`, `prototype-feedback-reference.md`, `pond-gate1-feedback.md`, `pond-gate1-r2-feedback.md`

## สรุปภาษาไทย
Prototype (prototype-v1) มี feature ครบ แต่ปอนด์ไม่อนุมัติเพราะ "ไม่ professional / ใช้ยาก / อ่านไม่ออก" — คุณค่า business ยังไม่เกิดเพราะ user ใช้จริงไม่ได้ v2 ("**ESSENCE Hub System**") กลับด้าน: **ล็อกหน้าตาให้ผ่านก่อนเขียนโค้ด** วัดที่ผู้ใช้มือใหม่ทำงานได้เอง+เร็ว เน้นคำสั่ง **"ทุกสถานะต้องต่อเนื่องกันทั้งระบบ ห้ามหลุด journey"** (`status-journeys.md`). **Gate 1 รอบ 2 ปอนด์ยังไม่อนุมัติ** — ให้ feedback รายหน้า 13 หมวด (`pond-gate1-r2-feedback.md`) โดยแก้ flow สำคัญ: การผลิตจบที่ "พร้อมส่งมอบ", QC ไม่ผ่านวนกลับ, Hold→แก้ไข PO, PO cancel/reopen ได้, redesign หน้าจัดส่ง/ใบจัดส่ง, PR สร้างตรงได้, BOM cost snapshot, ลูกค้า "ต้องติดตาม" + dashboard drill-down/auto-refresh. เอกสารชุดนี้เป็น input ของ BA/Engineer/QA จึงต้องละเอียด — ปอนด์เปิดทางให้ PO ถามได้ทุกจุดที่ flow กำกวม (ดู §2.3 + คำถามใน status.json)

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

**บทเรียนเพิ่มจาก Gate 1 รอบ 1–2:** functional scope ที่อ้างจาก prototype **ยังไม่ครบพอ** — พอปอนด์เห็น mockup จริงจึงระบุ requirement เชิงกระบวนการอีกมาก โดยเฉพาะ **ความต่อเนื่องของสถานะข้าม module** และ **รายละเอียด flow ต่อหน้า** (mockup = input ของ BA/Engineer/QA) → v2 ยกให้ status-journey continuity + flow detail เป็น first-class requirement (`status-journeys.md`)

## 2. Business Key Value (วัดที่ adoption/ความเร็วจริง)

| # | ตัวชี้วัด | Baseline | เป้าหมาย v2 | วัดเมื่อไร |
|---|---|---|---|---|
| BKV-1 | **ความเร็ว/ความง่ายของ task หลัก** — user มือใหม่ทำเองได้โดยไม่มีคนสอน โดย**ลดจำนวนคลิก/หน้าให้น้อยสุด** | prototype หลายหน้า/หลายคลิก, ผู้ใช้เลิกกลางคัน | flow หลักจบใน **จำนวนคลิกจำกัด** (เปิด PO ≤ 10 คลิก, ออก invoice ≤ 6 คลิก — เพดานวัด UAT, flow จริงน้อยกว่า) + ฟอร์มจบในหน้าเดียวถ้าทำได้ + smart default; ≥ 80% ของ UAT tester ทำสำเร็จเอง | UAT + review mockup flow count |
| BKV-2 | รอบ rework ด้านหน้าตา | ตกซ้ำ (Gate 1 รอบ 1–2 ยังไม่ผ่าน) | อนุมัติหน้าตาที่ขั้น mockup ให้ได้ในรอบถัดไป | Gate 1 |
| BKV-3 | หน้าจอที่โชว์ enum/รหัสดิบ | มี | 0 หน้า | visual audit |
| BKV-4 | จุด feedback ปอนด์ที่ยังไม่ถูกแก้ | prototype 10 + Gate1-ร1 12 หน้า + Gate1-ร2 13 หมวด | แก้เห็นชัดใน mockup ครบ 100% | Gate 1 รอบถัดไป |
| BKV-5 | **คุณภาพส่งมอบ (เกณฑ์ปอนด์)** | prototype ไม่ผ่าน | **Functional = 0 defect ทุกระดับ (minor/major/critical)** และ **UX/UI ≥ 3.5/5 + ต้องใช้ง่าย** | UAT / QA |
| BKV-6 | ความต่อเนื่องของสถานะข้าม module (mockup ต้นทาง+ปลายทาง + trace) | ไม่มีใน prototype | ครบทุกแถวใน `status-journeys.md` §8 | Gate 1 รอบถัดไป |

### 2.1 หลักการออกแบบข้อแรก — ส่งถึง UX/UI (คำสั่งตรงจากปอนด์)
ผู้ใช้ทำงาน **routine ซ้ำ ๆ ทั้งวัน** — ถ้ากรอกนาน/สลับหลายหน้า จะ **เลิกใช้ + พลาดสูง** ดังนั้นทุก mockup ต้อง:
1. **Minimize clicks per task** — ตั้ง click budget ต่อ flow หลัก (BKV-1) และออกแบบให้ถึงเป้า
2. **จบในหน้าเดียวถ้าทำได้** — ฟอร์มยาวไม่ควรบังคับ wizard หลายหน้าโดยไม่จำเป็น
3. **Smart defaults** — เติมค่าที่เดาได้ให้อัตโนมัติ (ราคาจาก BOM, lot FIFO, supplier จาก lot ฯลฯ) ผู้ใช้แค่ review
4. **อ่านง่าย/นำทางเอง** — ไม่มี enum ดิบ, ป้ายสถานะสื่อความหมาย
5. **Responsive ทุกหน้า (Must)** — ดู §5
> **Gate 1 = การเสนองานจริง ต้องดีที่สุด — ห้ามส่ง mockup ครึ่งๆ กลางๆ. mockup ต้องละเอียดพอเป็น input ให้ BA/Engineer/QA ทำครบ**

## 2.2 กติกา business ที่ปอนด์ยืนยันแล้ว (รอบ1, 2026-07-08) — ผูกเข้า `status-journeys.md`
1. **วัตถุดิบขาดตอนเปิด PO = เตือน (warning) ไม่บล็อก** — สร้าง PO ต่อได้ + auto Purchase Request ไป Stock (ไม่มี `Awaiting Materials`)
2. **เกณฑ์ "ใกล้หมด" ของวัตถุดิบ: ไม่มี default** — ไม่เตือนจนกว่าจะตั้งค่าต่อวัตถุดิบเอง
3. **Delivery Note:** บาง PO เลื่อน/reject → ใบเป็น `Partially Delivered`; PO เลื่อนสร้างใบใหม่ได้
4. **PO Rejected ตอนส่ง:** กลับ "พร้อมจัดส่ง" + แจ้ง Sale ให้ตัดสินใจ
5. **RUCDA → RUCDAA:** เพิ่ม permission ระดับที่ 6 **"Admin"** ต่อ module สำหรับ special capabilities
6. **ออกใบแจ้งหนี้ได้ตั้งแต่ PO = Confirmed**

## 2.3 การแก้ flow รอบ 2 (`pond-gate1-r2-feedback.md`, 2026-07-08) — ผูกเข้า `status-journeys.md`
1. **Home:** มีคำว่า "หน้าหลัก" ซ้ำ 2 จุด → เหลือที่เดียว
2. **Dashboard ทุกแผนก:** ปุ่ม refresh + **auto-refresh 15 วิ (default)** และ **refresh แล้วค้าง view เดิม (ไม่เด้งกลับหน้าแรก)**; **ทุก KPI tile drill-down ได้** → แสดงรายการ + **pagination** + กดรายการ → เข้า module นั้นพร้อม context; Sale เพิ่ม tile **"ต้องติดตาม"**
3. **ลูกค้า:** เพิ่มกลไก **"ต้องติดตาม" + comment free text** (นิยาม: [DEFAULT] flag ซ้อน 5 สถานะเดิม — **ถามปอนด์** ยืนยัน)
4. **PO:** search 3 แบบวันที่ (สร้าง/จัดส่งจริง/ต้องการรับ); เพิ่มสินค้าแก้ **จำนวน+ราคา/หน่วยได้เสมอ ราคา 0 ได้**; **cancel ได้ทุก case + Cancelled → Draft รับงานต่อได้** (trace เต็ม)
5. **Stock:** ราคาซื้อ/ขาย 0 ได้; **หน้า Goods Receipt เต็มจอ** (lot+supplier, อ้าง PR ได้/search PR → **ปิด PR อัตโนมัติ** พร้อมเหตุผลรับจาก lot ไหน)
6. **Purchase Request:** **สร้างตรงจากหน้า PR ได้**; "ของเข้าครบ" auto จาก goods receipt; "รับทราบ"+"ปิดคำขอ" manual
7. **Supplier:** เพิ่ม/แก้ supplier + **ผูกวัตถุดิบรายตัว + ราคารับซื้อ (ต่อ supplier ต่อวัตถุดิบ)** + search วัตถุดิบตอนผูก; **Active/Inactive ได้**; ไม่มีฟังก์ชันรับเข้าคลังในหน้านี้ (อยู่ stock)
8. **BOM:** หน้าสร้างสูตรเต็มรูปแบบ; **ราคาทุน = ราคาสูงสุดของ supplier ที่ active เท่านั้น + user แก้ทับได้ + snapshot ตอนบันทึก ไม่คำนวณใหม่**; ราคาขาย mandatory
9. **การผลิต:** flow ใหม่ รับงาน→กำลังผลิต→QC→พร้อมส่งมอบ (จบแค่นี้); QC ไม่ผ่าน→กลับกำลังผลิต+feedback; Hold→แก้ไข PO→ผลิตต่อ (raise Sale)
10. **QC:** ไม่ผ่าน → กลับ "กำลังผลิต" พร้อม feedback
11. **จัดส่ง/ใบจัดส่ง redesign:** หน้าจัดส่ง=สร้างใบ (เลือกเฉพาะ PO "พร้อมจัดส่ง", search ได้ทั้งหมด, search ด้วย PO ID/ข้อมูลลูกค้า); หน้าใบจัดส่ง=ราย order print ทีละใบให้เซ็น; Reject→PO พร้อมจัดส่ง+raise Sale; **Postpone→PO พร้อมจัดส่ง + flag "กันจัดส่ง Postpone"+วันที่ ค้างคิวจัดส่ง**
12. **Traceability:** search ทุก entity (ลูกค้า/PO/วัตถุดิบ/PR/Supplier/BOM) มุมมองผลิต(status)+จัดส่ง(DN); **date range + time**; เลือกประเภท entity; **audit ระดับ field** (ใครทำอะไร ค่าไหนเปลี่ยน จากอะไรเป็นอะไร)
13. **Settings — 5 หน้าจอจริง:** (1) Role & สิทธิ์ +สร้าง role (2) ผู้ใช้ +สร้าง user (3) Config VAT + effective date (4) ข้อมูลบริษัท (5) Audit log

## 3. นิยาม Gate 1 "อนุมัติหน้าตา" — เกณฑ์ (รวมรอบ 2)

ปอนด์อนุมัติ theme แล้ว (A — Clean Clinical teal). Gate 1 = **การเสนองานจริง** — ต้องครบและเนี๊ยบที่สุด และ **ละเอียดพอเป็น input ให้ BA/Engineer/QA**

**ปอนด์ต้องเห็นครบ:**
1. **Design system** (theme A) + component/state ครบ (empty/loading/error/success/disabled) + responsive breakpoints + **placeholder logo + favicon/app icon** + ชื่อระบบทุกหน้า (login/header/browser title)
2. **Mockup ครบ 100% ทุกหน้า** — รวม **ทุกสถานะ** (Customer 5 สถานะ + flag ต้องติดตาม; Dashboard 7 แผนก + drill-down + auto-refresh; ทุก state ของ PO/Production(ใหม่)/Shipping+DN(redesign)/PR(ใหม่)/Return/Invoice ตาม `status-journeys.md`)
3. **ตาราง feedback → mockup** ครบ: prototype 10 + Gate1-ร1 + **Gate1-ร2 13 หมวด**
4. **Mockup แสดง cross-module continuity** — ทุกแถวใน `status-journeys.md` §8
5. **Mockup ใบกำกับภาษีไทย** ฟิลด์ครบ (§5)
6. **หลักการ minimize-clicks (§2.1) เห็นในทุก flow หลัก**
7. **Responsive (Must)** ทุกหน้า
8. **Settings 5 หน้าจอจริง** + RUCDAA (6 ระดับ) + สร้าง role/user ไม่จำกัด

**เกณฑ์ผ่าน Gate 1 (ทุกข้อต้องจริง):**
- [ ] mockup coverage 100% ทุกหน้า + ทุกสถานะ (รวม flow รอบ2 ทั้ง 13 หมวด)
- [ ] ชื่อ + logo/icon (theme teal) ทุกหน้า
- [ ] feedback prototype 10 + Gate1-ร1 + Gate1-ร2 map เห็นการแก้ครบ
- [ ] cross-module continuity ครบทุกแถว (ต้นทาง+ปลายทาง)
- [ ] ไม่มี mockup โชว์ enum/รหัสดิบ
- [ ] ทุกหน้า responsive (desktop+tablet+mobile)
- [ ] ใบกำกับภาษีไทยฟิลด์ครบ
- [ ] Dashboard: drill-down + pagination + auto-refresh 15s ค้าง context ครบทุกแผนก
- [ ] Traceability: audit ระดับ field + date range + เลือก entity
- [ ] Settings ครบ 5 หน้าจอ
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

**Tier 1 — หัวใจ ต้องเนี๊ยบที่สุด:**
- **PO create + summary** (suggest สินค้า, เช็ควัตถุดิบ=เตือนไม่บล็อก, PR auto, ขาย BOM/วัตถุดิบ, ราคาแก้ได้/0 ได้, search 3 วันที่, cancel/reopen)
- **Production** (flow ใหม่ รับงาน→ผลิต→QC→พร้อมส่งมอบ, QC loop, Hold→แก้ PO, Potential Delay, เรียง/ค้นวันจัดส่ง)
- **Invoice + ใบกำกับภาษีไทย** (โชว์ PO status, overdue, VAT/discount/ตัวหนังสือไทย)
- **Stock** (add material+UOM, goods receipt เต็มจอ+ปิด PR, ราคาซื้อ/ขาย 0 ได้, search)
- **Customer** (5 สถานะ + ต้องติดตาม, contact ไม่จำกัด, note, sale assignment, search)

> Tier ใช้จัดลำดับความประณีต — **แต่ responsive เป็น Must ทุก Tier ทุกหน้า**

**Tier 2:** Dashboard รายแผนก (drill-down/auto-refresh) · Shipping+Delivery Note (redesign) · QC · Supplier · Purchase Request · Return · Traceability · BOM builder

**Tier 3:** Settings (5 หน้าจอ) · Home · Audit log · Payment/collection

## 5. ข้อกำหนด business ที่ UI ห้ามละเมิด (non-negotiable)

- **Status-journey continuity:** ทุกการเปลี่ยนสถานะต้องต่อเนื่องข้าม module ตาม `status-journeys.md` + **trace เสมอ** (รวม cancel/reopen, QC fail, Hold) + comment ได้ทุกสถานะ (บังคับในจุดที่ระบุ)
- **Responsive ทุกหน้า (Must)**
- **GMP traceability:** ไล่ Lot → Batch → FG ได้ครบ + อธิบาย Lot vs Batch; **audit ระดับ field** (ใครทำอะไร ค่าไหนเปลี่ยน จากอะไรเป็นอะไร); archive text file เฉพาะ Super User
- **ใบกำกับภาษีไทย:** LOGO, ผู้ออก+เลขผู้เสียภาษี 13 หลัก, ลูกค้า, เลขที่/วันที่/เครดิต, ตารางรายการ, สรุปยอด (subtotal, **discount**, VAT7% + **effective date**, grand total, **ตัวหนังสือไทย**), **ลายเซ็น 2 ช่อง**, ตรายาง — ข้อมูลบริษัท Admin กรอกใน settings
- **Audit ทุก action** · **ผู้ใช้ไม่เคยใช้ ERP:** นำทางเอง, ไม่โชว์ enum/รหัสดิบ, list สำคัญ search ได้, guard งานที่ผิดไม่ได้, **คลิก/หน้าต่อ task น้อยสุด**
- **Permission RUCDAA (6 ระดับ) ราย module** + role ไม่จำกัด; UI แสดง/ซ่อนตามสิทธิ์จริง

## 6. Scope (v2 — รวม Gate1 รอบ1+รอบ2)

**In scope:**
- Product identity: ชื่อ **ESSENCE Hub System** + placeholder logo/favicon ทุกหน้า
- Design system (theme A) + mockup ทุกหน้า/ทุกสถานะ + **responsive ทุกหน้า (Must)**
- **Home**: ชื่อ user จุดเดียว + คำว่า "หน้าหลัก" จุดเดียว
- **Dashboard รายแผนก 7 แผนก**: ปุ่ม refresh + **auto-refresh 15s (default) ค้าง view เดิม**; **ทุก KPI tile drill-down → รายการ + pagination + กดเข้าถึง module พร้อม context**; Sale เพิ่ม tile "ต้องติดตาม"; สลับแผนกเมื่อหลาย role
- **Customers**: contact ไม่จำกัด, 5 สถานะ + **"ต้องติดตาม" (flag + comment free text)**, note timeline, sale assignment + reassign, ประวัติ PO, search ด้วย PO/วันที่
- **PO**: summary (ราคา/VAT/sale), suggest สินค้า + เช็ควัตถุดิบ (ขาด=เตือนไม่บล็อก + auto PR), ขาย BOM+วัตถุดิบ, **แก้จำนวน+ราคา/หน่วยได้เสมอ ราคา 0 ได้**, **search 3 แบบวันที่** (สร้าง/จัดส่งจริง/ต้องการรับ), **cancel ทุก case + Cancelled→Draft reopen (trace เต็ม)**, 2 ราง (fulfilment+billing)
- **Stock**: เพิ่มวัตถุดิบใหม่ + UOM, config เกณฑ์ใกล้หมด (ไม่มี default), **ราคาซื้อ/ขาย 0 ได้**, **หน้า Goods Receipt เต็มจอ** (lot+supplier, อ้าง/ search PR → ปิด PR อัตโนมัติ พร้อมเหตุผล lot)
- **Supplier**: เพิ่ม/แก้ + **ผูกวัตถุดิบรายตัว + ราคารับซื้อ (matrix supplier×วัตถุดิบ)** + search วัตถุดิบตอนผูก, **Active/Inactive**; ไม่มีรับเข้าคลังในหน้านี้
- **BOM builder**: หน้าสร้างสูตรเต็มรูปแบบ (โชว์ stock ประกอบ), **ราคาทุน = max ของ supplier active + แก้ทับได้ + snapshot ตอนบันทึก**, ราคาขาย mandatory
- **Production**: flow ใหม่ (รับงาน→กำลังผลิต→QC→พร้อมส่งมอบ; QC loop; Hold→แก้ PO→ผลิตต่อ raise Sale), Potential Delay (2+1 วัน), เรียง/ค้นวันจัดส่ง/PO/ลูกค้า, comment + trace
- **QC**: incoming inspection + QC ผลิต (ไม่ผ่าน→กลับกำลังผลิต+feedback)
- **Purchase Request**: **สร้างตรงจากหน้า PR ได้**, ของเข้าครบ auto จาก goods receipt, รับทราบ/ปิดคำขอ manual
- **Shipping + Delivery Note (redesign)**: หน้าจัดส่ง=สร้างใบ (เฉพาะ PO พร้อมจัดส่ง, search PO ด้วย PO ID/ข้อมูลลูกค้า), หน้าใบจัดส่ง=ราย order **print ทีละใบ**, Reject→PO พร้อมจัดส่ง+raise Sale, **Postpone→flag กันจัดส่ง+วันที่ ค้างคิว**, Partially Delivered
- **Return**: lot→supplier→ตัด stock + comment บังคับ
- **Invoice**: ออกได้ตั้งแต่ PO=Confirmed + โชว์ PO status, overdue alert, versioning, ใบกำกับภาษีไทยเต็มรูป
- **Traceability**: **search ทุก entity** (ลูกค้า/PO/วัตถุดิบ/PR/Supplier/BOM) มุมมองผลิต+จัดส่ง, **date range+time, เลือก entity, audit ระดับ field**, archive text file (Super User)
- **Settings — 5 หน้าจอจริง**: Role&สิทธิ์(+สร้าง role), ผู้ใช้(+สร้าง user), Config VAT+effective date, ข้อมูลบริษัท, Audit log; RUCDAA (6 ระดับ), role ไม่จำกัด
- **Roles ใหม่**: Sale Manager, Super User
- **Notification/Inbox + deep link** (`status-journeys.md` §10)
- Implement ให้ตรง mockup บน React+Node+MySQL (ADR-000); QA regression; UX/UI visual audit

**Out of scope:**
- feature/logic นอก feedback ทั้ง 3 ชุด + นอก prototype-v1 (= requirement ใหม่)
- เปลี่ยน tech stack · logo/แบรนด์จริง (ใช้ placeholder) · ข้อมูลบริษัทจริง (Admin กรอกเอง)
- งาน design UI เอง (เป็นของ UX/UI — PO ให้กรอบ business + journey)

## 7. Definition of Done — feature v2 ทั้งสาย (ถึง Gate สุดท้าย)

- [ ] **Gate 1 ผ่าน:** mockup ครบ 100% ทุกหน้า/ทุกสถานะ (รวม flow รอบ2) + cross-module continuity + product identity + responsive + Settings 5 หน้าจอ + Dashboard drill-down + click budget — ปอนด์อนุมัติ
- [ ] **Engineer implement** ครบ scope §6 + ทุก status journey + กติกา §2.2/§2.3 โดยหน้าตาตรง mockup + responsive
- [ ] **QA: Functional = 0 defect ทุกระดับ** + ทดสอบทุก state transition & cross-module notify ถูกต้อง
- [ ] **UX/UI visual audit ผ่าน:** ตรง mockup + 0 หน้าโชว์ enum/รหัสดิบ + responsive จริง + UX/UI ≥ 3.5/5
- [ ] **ข้อกำหนดห้ามละเมิด (§5) ครบ:** trace ทุก status change + audit ระดับ field, ใบกำกับภาษีครบ, RUCDAA ทำงาน
- [ ] **BKV ผ่านเกณฑ์:** BKV-1/3/4/5/6
- [ ] **DevOps deploy** สำเร็จ · **Gate สุดท้าย:** ปอนด์อนุมัติ release

## 8. Known constraints / target users
- Tech stack ตายตัว: React + Node.js + MySQL (ADR-000)
- GMP / full traceability (audit ระดับ field) + status-journey continuity + responsive เป็นข้อบังคับแฝงทุก feature
- Target users: พนักงานที่ไม่เคยใช้ ERP ทำงาน routine — usability + minimize clicks เป็น first-class requirement
- เอกสารต้นทาง: prototype-v1 (git tag); `prototype-feedback-reference.md`; `pond-gate1-feedback.md` (ร1); `pond-gate1-r2-feedback.md` (ร2); state machine `status-journeys.md`; สรุปปอนด์ `status-summary-for-pond.md`

## 9. เอนทิตี/role ใหม่ที่ต้อง flag ให้ BA/Tech-Lead
- **Role ใหม่:** Sale Manager (reassign ลูกค้า, dashboard ทีม), Super User (archive trace)
- **เอนทิตี/field ใหม่:** Purchase Request (สร้างตรงได้), Delivery Note (redesign, ราย order print ได้), Supplier (+active/inactive), **Supplier×Material price matrix**, Customer Contact (หลายรายการ), Customer Note + **"ต้องติดตาม" flag/comment**, เอกสารใบรับ supplier (file), ใบคืนของ (Return), UOM, ราคาซื้อ/ขาย/ทุน แยก field (0 ได้), **BOM cost snapshot** (max active supplier), low-stock threshold ต่อวัตถุดิบ (ไม่มี default), **VAT effective date**, **field-level audit**, **PO cancel/reopen lifecycle**, **Postpone flag + date** ในคิวจัดส่ง
- **สิทธิ์พิเศษ = permission ระดับ Admin (bit ที่ 6) ของ RUCDAA** ต่อ module: reassign customer, archive trace, ปลด Blacklist, status override, cancel/reopen PO

## 10. คำถามถึงปอนด์ (flow ยังกำกวม — ปอนด์เปิดทางให้ถามเต็มที่)
รวบไว้ใน `pipeline/status.json` (entry po/gate1-r2-analysis) — ทุกข้อมี options + default ที่ผมเสนอ (ไม่ block UX/UI):
1. "ต้องติดตาม" = flag ซ้อน (default) หรือ สถานะที่ 6
2. PO cancel→reopen: คงเลข PO เดิม (default) หรือออกเลขใหม่ผูกเลขเดิม
3. "แก้ไข PO" ใน Hold: แก้อะไรได้บ้าง + ใครแก้ (default: Sale แก้จำนวน/สินค้า/ราคา/วันส่ง + trace)
4. BOM snapshot: ใช้ snapshot จนกว่า save ใหม่ (default) + badge เตือนราคาล้าสมัย
5. ใบจัดส่ง: 1 ใบรวมหลาย order print แยกราย order (default) หรือ 1 ใบ = 1 order
