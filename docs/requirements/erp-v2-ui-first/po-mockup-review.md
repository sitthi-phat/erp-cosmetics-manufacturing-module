# PO Mockup Completeness Review — ESSENCE Hub System (Gate 1 รอบ 2)

ผู้ review: PO (ปอนด์มอบอำนาจให้ review แทน — "ให้ PO review แล้ว feedback ได้มั้ย แต่อยากให้ละเอียดที่สุด")
วันที่: 2026-07-08 · ทบทวน mockups 24 ไฟล์ที่ `docs/design/erp-v2-ui-first/mockups/`
เทียบกับ: `pond-gate1-r2-feedback.md` (13 หมวด) · `status-journeys.md` (ฉบับอัปเดตรอบ2) · เกณฑ์ "ละเอียดพอให้ BA/Engineer/QA ทำครบ" · ตาราง noti/deep-link (§10)

## สรุปภาษาไทย
Mockups รอบ 2 **คุณภาพงานสูงและครบหน้าหลัก** (design system เนี้ยบ, responsive จริง, trace timeline/status flow bar ทุกหน้า, แก้ครบ feedback รอบ 1). แต่ **สร้างก่อนที่ปอนด์จะให้ feedback รอบ 2** จึงยัง**ไม่สะท้อน flow ที่ปอนด์แก้ในรอบ 2 หลายจุด** — ที่สำคัญสุดคือ **flow การผลิต (ยังมี "ส่งมอบแล้ว" + ไม่มีสเต็ป QC), state "รอวัตถุดิบ" ที่ถูกยกเลิกไปแล้วยังโผล่หลายหน้า, หน้า Supplier ยังมีฟอร์มรับเข้า (ต้องย้ายไป Stock) + ขาด active/inactive + ขาด price matrix, ลูกค้ายังตั้ง "ต้องติดตาม" ไม่ได้, PO ยัง cancel/reopen ไม่ได้, Dashboard ยังไม่มี auto-refresh/drill-down จริง, Settings มีแค่ 1 จาก 5 หน้าจอเต็ม, Trace ยังไม่มี audit ระดับ field/date-range/entity selector**. เอกสารนี้ไล่รายหน้า + ปิดท้ายด้วย **รายการสั่งงาน UX/UI รอบ 3 เรียง priority** (P0/P1/P2)

---

## 0. วิธี review
- **อ่านเชิงลึก 15 หน้า:** production, po-create, po-list, po-detail, customer-detail, dashboard, stock, supplier, bom, qc, purchase-request, shipping, delivery-note, trace, settings
- **สแกน (grep + self-desc) 9 หน้า:** login, home, customers, invoices, invoice-detail, invoice-print, return, responsive, index — ระบุ "(สแกน)" ในตาราง
- เกณฑ์ต่อหน้า: (ก) field ครบ+validation+default (ข) ปุ่ม/action ครบ (ค) empty/error/loading state (ง) pagination (จ) ตรง flow `status-journeys.md` (ฉ) แก้ feedback รอบ2

## 1. ตารางสรุปผล (✅ ครบ / ⚠ มีแต่ไม่ครบ / ❌ ไม่มี)

| หน้า | ผล | ช่องว่างหลัก (สรุป) |
|---|---|---|
| login (สแกน) | ✅ | มีชื่อระบบ/logo/icon — ok |
| home | ⚠ | feedback ร2#1: ยังมี "หน้าหลัก" ซ้ำ (title+เมนู/crumb) → เหลือจุดเดียวในเนื้อหา |
| dashboard | ⚠ | ขาด **auto-refresh 15s + ปุ่ม refresh + คงvieเดิม**; KPI tile ยัง**กดไม่ได้ (ไม่ drill-down เป็น list+pagination)**; มี tile "ต้องติดตาม" แล้ว (ดี) |
| customers (สแกน) | ⚠ | ต้องมี entry จัดการ "ต้องติดตาม" + pagination (ยืนยันในหน้า list) |
| customer-detail | ⚠ | **ตั้ง "ต้องติดตาม" ไม่ได้** (dropdown มีแค่ Disabled/Blacklist) — ต้องเพิ่ม + comment; ที่เหลือ (contact/PO history/reassign/note) ครบดี |
| po-list | ⚠ | ขาด **search 3 แบบวันที่**; filter chip ยังมี "รอวัตถุดิบ" (state ที่ยกเลิก); ไม่มี pagination |
| po-create | ⚠ | ดีมาก (warning ไม่บล็อก, ราคาแก้ได้/0, สร้าง PO ต่อ) แต่ notify ยังเขียน "ตั้ง PO=รอวัตถุดิบ" (ยกเลิกแล้ว) → แก้ถ้อยคำ |
| po-detail | ⚠ | ขาด **ปุ่ม cancel PO (ทุก case) + Cancelled→reopen (Draft)** + action "แก้ไข PO" (เคส Hold); 2-ราง+trace ดี |
| stock | ✅/⚠ | เพิ่มวัตถุดิบ+UOM+เกณฑ์(ไม่มี default)+ราคาซื้อ/ขาย ครบดี; แต่ **หน้า Goods Receipt เต็มรูป (อ้าง/ค้น PR + ปิด PR อัตโนมัติ)** ยังไม่มีจอจริง (มีแค่ปุ่ม) |
| purchase-request | ⚠ | ขาด **ปุ่ม "สร้าง PR ใหม่" (สร้างตรง)**; ยังเขียน "พักรอวัตถุดิบ/ปลดบล็อก PO" (ยกเลิกแล้ว); flow 4 สถานะ+รับทราบ ดี |
| supplier | ⚠⚠ | **ยังมีฟอร์มรับเข้าคลัง (ต้องลบ ย้ายไป stock)**; ขาด **Active/Inactive**; ขาด **price matrix (ราคารับซื้อ ต่อ supplier ต่อวัตถุดิบ) + search วัตถุดิบตอนผูก** |
| bom | ⚠ | cost rule ยังเป็น "ผลรวมราคาซื้อ" — ต้องเป็น **max ของ supplier ที่ active + snapshot ตอนบันทึก** (+badge ราคาล้าสมัย); ที่เหลือดี |
| production | ⚠⚠ | **flow ผิดรอบ2**: flow bar = รับงาน→กำลังผลิต→พร้อมส่งมอบ→**ส่งมอบแล้ว** (ต้องตัด "ส่งมอบแล้ว") + **ไม่มีสเต็ป QC**; dropdown สถานะขาด **QC / QC ไม่ผ่าน→feedback / Hold→แก้ไข PO** |
| qc | ⚠ | incoming ครบ (pass/fail→คืนของ); ต้องยืนยัน **batch QC "ไม่ผ่าน→กลับกำลังผลิต+feedback"** ในแท็บตรวจแบตช์ |
| shipping | ⚠ | สร้างใบจาก PO พร้อมจัดส่ง (checkbox) ดี; ขาด **search PO ด้วยข้อมูลลูกค้า (ชื่อ/บริษัท/เบอร์ contact)** + สร้างใบเปล่าแล้ว search เพิ่ม + เห็น PO Postpone ค้างคิว |
| delivery-note | ✅ | เยี่ยม — per-PO line status, Partially Delivered, Reject→raise Sale (C10), Postpone→สร้างใบใหม่, print, trace |
| invoices (สแกน) | ⚠ | ต้องยืนยัน overdue+PO stage; VAT **effective date** เป็นของ settings |
| invoice-detail (สแกน) | ✅/⚠ | ต้องยืนยัน versioning + PO stage |
| invoice-print (สแกน) | ✅/⚠ | Thai tax invoice ครบ (baht text/2 ลายเซ็น); ต้องโชว์ **VAT + วันที่มีผล** ให้ตรง settings |
| return | ✅ (สแกน) | lot→supplier→ตัด stock+comment (ผ่าน r1) |
| trace | ⚠⚠ | มี Lot→Batch genealogy ดี; ขาด **audit ระดับ field (ใคร/ค่าไหน/จาก→เป็น) + date range+time + entity selector (ลูกค้า/PO/PR/Supplier/BOM)** |
| settings | ⚠⚠ | มีแค่ **Role screen + company card**; ขาดจอจริง: **ผู้ใช้(สร้าง user), VAT+effective date, Audit log** (มีแค่แท็บเปล่า) |
| responsive (สแกน) | ✅ | device demo — ok |
| index (สแกน) | ✅/⚠ | gallery + feedback mapping; ต้องเพิ่มลิงก์หน้าใหม่รอบ3 |

**ภาพรวม:** ✅ เต็ม 4 · ✅/⚠ 4 · ⚠ 13 · ⚠⚠ (ต้องรื้อมาก) 4 · ❌ ไม่มีหน้าเลย 0 — **ไม่มีหน้าไหนหายทั้งหน้า** แต่มีหลายจุดที่ flow/รายละเอียดยังไม่ตรงรอบ2

## 2. เช็ค 13 หมวด feedback รอบ 2

| # หมวด | สถานะ | หมายเหตุ |
|---|---|---|
| 1 Home "หน้าหลัก" ซ้ำ | ⚠ | ยังไม่ dedupe ในเนื้อหา |
| 2 Dashboard refresh/auto-15s/drill-down/pagination | ⚠ | ขาด auto-refresh + tile กดไม่ได้เป็น list |
| 3 ลูกค้า "ต้องติดตาม"+comment | ⚠ | ตั้งจาก customer-detail ไม่ได้ |
| 4 PO search 3 วันที่ / ราคา0 / cancel+reopen | ⚠ | ราคา0 ✅ · search 3 วันที่ ❌ · cancel/reopen ❌ |
| 5 Stock ราคา0 / Goods Receipt เต็ม+ปิด PR | ⚠ | ราคา0 ✅ · GR เต็มจอ ❌ (มีแค่ปุ่ม) |
| 6 PR สร้างตรง + สถานะ auto/manual | ⚠ | สร้างตรง ❌ · สถานะครบ ✅ |
| 7 Supplier +ผูกวัตถุดิบ+ราคา / active-inactive / ไม่มีรับเข้า | ⚠⚠ | price matrix ❌ · active/inactive ❌ · ฟอร์มรับเข้ายังอยู่ (ต้องลบ) |
| 8 BOM cost = max active supplier + snapshot | ⚠ | ยังเป็นผลรวม ไม่ snapshot |
| 9 การผลิต flow ใหม่ (จบ "พร้อมส่งมอบ") | ⚠⚠ | flow bar ยังมี "ส่งมอบแล้ว" + ไม่มี QC step |
| 10 QC ไม่ผ่าน→กลับกำลังผลิต+feedback | ⚠ | incoming ✅ · batch QC→production ต้องเพิ่ม |
| 11 จัดส่ง/DN redesign + Postpone flag | ✅/⚠ | DN ✅ · Shipping search-by-customer ยังขาด |
| 12 Trace ทุก entity + date range + field audit | ⚠⚠ | ขาด field audit + date range + entity selector |
| 13 Settings 5 หน้าจอจริง | ⚠⚠ | มี 1.5/5 (Role + company card) |

## 3. เช็คความครอบคลุมทุกสถานะใน `status-journeys.md`

| Journey | สถานะ/องค์ประกอบ | มี mockup? |
|---|---|---|
| Customer | Lead/Active/Inactive/Disabled/Blacklist | ✅ (customers/customer-detail) |
| Customer | **"ต้องติดตาม" flag + comment** | ⚠ ตั้งไม่ได้ (มีแต่ tile ใน dashboard) |
| PO fulfilment | Draft/Confirmed/InProduction/ReadyToDeliver/InDelivery/Delivered | ✅ (po-detail 2-ราง) |
| PO | **Cancelled + Cancelled→Draft (reopen)** | ❌ ไม่มี action |
| PO billing | NotInvoiced/Invoiced/Paid/Overdue | ✅ |
| Production | รับงาน/กำลังผลิต/**QC**/พร้อมส่งมอบ/Hold | ⚠ ขาด QC step; มี "ส่งมอบแล้ว" เกิน |
| Production | **QC ไม่ผ่าน→กลับกำลังผลิต + feedback** | ⚠ ต้องเพิ่ม |
| Production | **Hold→แก้ไข PO→ผลิตต่อ (raise Sale)** | ⚠ มี Hold+raise แต่ไม่มี "แก้ไข PO" |
| Production | Potential Delay overlay | ✅ |
| Shipping/DN | Created/InRoute/Delivered/Rejected/Postponed/Partially | ✅ (delivery-note) |
| Shipping | **Postpone flag+วันที่ ค้างคิวจัดส่ง** | ⚠ เห็นใน DN แต่คิวจัดส่งหน้า shipping ยังไม่โชว์ PO Postpone |
| Purchase Request | Open/Acknowledged/Fulfilled/Closed | ✅ |
| Purchase Request | **สร้างตรงจากหน้า PR** | ❌ |
| Return | Draft/Returned/Closed | ✅ (scan) |
| Notification | bell→list→deep link+ack | ⚠ มี 🔔 icon ทุกหน้า แต่ยังไม่มี panel รายการ+deep link+badge (ยังเป็นไอคอนเฉยๆ) |

## 4. เช็ค Notification / Deep link (§10)
- ทุกหน้ามีไอคอน 🔔 ที่ header แต่ **ยังไม่มี dropdown/panel รายการแจ้งเตือน + badge ตัวเลข + คลิกรายการ = deep link + acknowledge** → **ต้องทำจริงในรอบ 3** (เป็นแกน UX ของการส่งงานข้ามแผนก)
- deep-link ปลายทางส่วนใหญ่มีหน้ารองรับแล้ว (PO detail, PR detail, production, shipping, invoice detail, customer detail) — ขาดเชื่อม "กระดิ่ง→ปลายทาง" ให้เห็นเป็น flow

---

## 5. รายการสั่งงาน UX/UI รอบ 3 (actionable เรียง priority)

### P0 — flow ผิด/ยกเลิกไปแล้วยังโผล่ (ต้องแก้ก่อน ไม่งั้น BA/Engineer ทำผิด)
1. **production.html**: แก้ flow bar เป็น **รับงาน → กำลังผลิต → QC → พร้อมส่งมอบ** (ตัด "ส่งมอบแล้ว" ออก — เป็นของฝ่ายจัดส่ง); เพิ่มในตัวเปลี่ยนสถานะ: **QC, QC ไม่ผ่าน→กลับกำลังผลิต+ช่อง feedback (บังคับ), Hold→ปุ่ม "แก้ไข PO"+raise Sale**
2. **ลบ state "รอวัตถุดิบ / พักรอวัตถุดิบ / ปลดบล็อก PO" ทุกจุด** (po-list chip, po-create notify, purchase-request, po-detail) — รอบ2 ยืนยัน **วัตถุดิบขาด=warning ไม่บล็อก** PO เดินหน้าปกติ
3. **supplier.html**: **ลบฟอร์ม "รับวัตถุดิบเข้าคลัง"** (ย้ายไป stock) — รอบ2 ระบุชัดว่าไม่อยู่หน้านี้
4. **po-detail.html**: เพิ่ม **ปุ่ม "ยกเลิก PO" (ทุก case) + "เปิดใหม่ (Cancelled→Draft)" + trace** และ action **"แก้ไข PO"** (ใช้เคส Hold)

### P1 — r2 requirement ที่ยังไม่มีจอ/องค์ประกอบ (ต้องเพิ่ม)
5. **stock.html**: สร้าง **หน้า Goods Receipt เต็มจอ** — fields: supplier, วัตถุดิบ, lot(gen), จำนวน, เลขใบรับ, upload; **ช่อง search/อ้างเลข PR → รับครบแล้วปิด PR อัตโนมัติ + ระบุ lot** (C4/C12)
6. **supplier.html**: เพิ่ม **Active/Inactive toggle** + **price matrix (ราคารับซื้อ ต่อ supplier ต่อวัตถุดิบ)** + **search วัตถุดิบตอนผูก**
7. **customer-detail.html**: เพิ่มตัวเลือกสถานะ/flag **"ต้องติดตาม" + comment free text** ในกล่องเปลี่ยนสถานะ (ผูก tile dashboard)
8. **purchase-request.html**: เพิ่มปุ่ม **"➕ สร้างคำขอใหม่"** (สร้าง PR ตรง) + ระบุ "ของเข้าครบ = auto จาก Goods Receipt"
9. **dashboard.html**: เพิ่ม **ปุ่ม refresh + auto-refresh 15s (default) + คง view เดิม**; ทำ **KPI tile กดได้ → drill-down เป็นรายการ + pagination** ทุกแผนก
10. **bom.html**: แก้ป้ายราคาทุน = **"ราคาสูงสุดของ supplier ที่ active"** + **snapshot ตอนบันทึก** (+ badge "ราคาทุนอาจล้าสมัย" เมื่อราคาปัจจุบันต่าง)
11. **trace.html**: เพิ่ม **audit ระดับ field** (ตาราง: เวลา/ผู้ทำ/entity/field/จาก→เป็น) + **ตัวกรอง date range+time** + **entity selector** (ลูกค้า/PO/วัตถุดิบ/PR/Supplier/BOM/ผลิต/จัดส่ง)
12. **settings.html**: สร้างจอจริงอีก 4 แท็บ — **ผู้ใช้งาน(+สร้าง user), VAT + effective date, Audit log** (Role มีแล้ว, company card ขยายเป็นแท็บเต็ม)
13. **shipping.html**: เพิ่ม **search PO ด้วยข้อมูลลูกค้า** (ชื่อ/บริษัท/เบอร์+ชื่อ contact) + สร้างใบเปล่าแล้ว search เพิ่ม + แสดง **PO ที่ Postpone ค้างในคิว**
14. **po-list.html**: เพิ่ม **search 3 แบบวันที่** (สร้าง/จัดส่งจริง/ต้องการรับ) + pagination

### P2 — ปรับให้สมบูรณ์/ต่อเนื่อง
15. **Notification panel จริง**: กระดิ่ง header → dropdown รายการ + badge ตัวเลข + คลิก=deep link+acknowledge (ทำเป็น component ใช้ทุกหน้า)
16. **home.html**: เหลือ "หน้าหลัก" จุดเดียวในเนื้อหา
17. **qc.html**: ยืนยัน/เพิ่ม batch QC **"ไม่ผ่าน→กลับกำลังผลิต+feedback"** ในแท็บตรวจแบตช์
18. **invoice-print/settings**: แสดง **VAT + วันที่มีผล (effective date)** ให้สอดคล้องกัน
19. **ทุกหน้า list**: ใส่ **pagination + empty state + loading/error** ให้ครบ (เกณฑ์ "ละเอียดพอให้ BA/Engineer/QA")
20. **index.html**: เพิ่มลิงก์หน้าใหม่ (goods-receipt) + อัปเดต mapping กับ feedback รอบ2

---

## 6. ข้อสังเกตเชิงบวก (คงไว้)
design system เนี้ยบ + responsive จริง (hamburger/mobile bar) + StatusFlowBar + TraceTimeline ทุกหน้า + ป้ายสถานะภาษาไทยอ่านออก (ไม่มี enum ดิบ) + delivery-note reconcile ราย PO + po-create warning-not-block + stock threshold "ไม่มี default" — ทั้งหมดตรง requirement แล้ว **ให้คงแนวทางนี้ รอบ 3 เน้นเติม flow รอบ2 ที่ขาด ไม่ต้องรื้อ design system**

> หมายเหตุ: 9 หน้าที่ทำเครื่องหมาย "(สแกน)" ผม review จาก grep + คำอธิบายของ UX/UI + โครงสร้าง ยังไม่ได้เปิดอ่านเต็มทุกบรรทัด — ถ้าต้องการ ผม deep-review เพิ่มได้
