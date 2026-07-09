# Spec Depth Audit — เอกสารสั่งงาน BA (Gate 2 rework) · ESSENCE Hub System

slug: `erp-v2-ui-first` · เขียนโดย PO · 2026-07-09 · ที่มา: `pond-gate2-feedback.md` — "PO คุยกับ BA ให้ครบทุก module ครบทุก function จริงๆ"
วิธีตรวจ: เปิด spec จริงทั้ง 17 module + cross-cutting เทียบ mockup + entity-status-map ทีละหน้า

## สรุปภาษาไทย
ปอนด์ทักถูก — **Dashboard และ Settings ตื้น**: ประกาศหลายหน้าจอ/หลายแผนก แต่เขียน story แค่ 2 อัน ไม่มีนิยาม/สูตร/เงื่อนไขรายตัว · โมดูล transaction ส่วนใหญ่ (PO/ผลิต/Invoice/Stock/ลูกค้า/QC/จัดส่ง/PR/BOM/Return) **ลึกพอ** (3 AC happy/edge/error อ้าง element จริง) แต่ยังขาด "พฤติกรรมย่อย" บางจุด (suggest logic, search/filter fields, notification panel, genealogy interaction) · เอกสารนี้ = (1) นิยามมาตรฐานความลึกขั้นต่ำ (2) **Dashboard template เต็ม** (7 แผนก × 29 tile — PO เขียนให้เพราะเป็นเจ้าของ §12) (3) gap list ต่อ module จัด P0/P1/P2

---

## 1. นิยาม "ความลึกขั้นต่ำต่อ module" (Definition of Depth) — บทเรียนจาก Dashboard
ทุก **function บนหน้าจอ** (ไม่ใช่แค่ชื่อ + AC ผิวๆ) ต้องมีครบ 4 ด้าน:

| # | ด้าน | ต้องมีอะไร |
|---|---|---|
| ก | **พฤติกรรม step-by-step** | user ทำอะไร → ระบบตอบอะไร ทีละขั้น (ไม่ใช่ "กดแล้วได้ผล") · ปุ่ม/field/state จริงในหน้าจอ |
| ข | **เงื่อนไข/นิยาม/สูตรของทุกตัวเลข-ทุกกลุ่ม** | ทุก KPI/badge/สถานะ: นับจากอะไร (สูตร) · เข้ากลุ่มด้วยเงื่อนไขใด · ผูก config ตัวไหน (เช่นรอบ Active, threshold ใกล้หมด) · event vs state |
| ค | **มุมมองตามสิทธิ์/role** | ใคร (Read/Update/Create/Approve/Admin) เห็นอะไร/ทำอะไรได้ · หลาย role พร้อมกันเป็นยังไง |
| ง | **edge cases + empty/error** | 0 รายการ, ค่าไม่ครบ, ไม่มีสิทธิ์, ข้อมูลทับซ้อน, concurrent, พฤติกรรม refresh/filter คงค่า |

> **เกณฑ์ผ่าน:** ถ้า Engineer/QA อ่าน spec แล้ว **ยังต้องเดา** พฤติกรรม/สูตร/เงื่อนไขของ function ใด = ยังไม่ผ่าน · ทุกหน้าจอที่ประกาศ (เช่น "Settings 5 หน้าจอ", "Dashboard 7 แผนก") ต้องมี story/AC ครบ **ทุกหน้าจอ/ทุกแผนก** ไม่ใช่รวมเป็นก้อนเดียว

---

## 2. Dashboard — เคสต้นแบบ (spec ที่ BA ต้องเขียนให้ครบ · PO ให้ข้อมูลครบแล้ว)

### 2.1 พฤติกรรม Date Filter (ต้องเขียนเป็น story/AC เต็ม)
- **Preset:** `วันนี้` / `สัปดาห์นี้` / `เดือนนี้ (default)` / `กำหนดเอง (custom range)` — chip เลือกได้ทีละอัน · custom = เลือกเดือน/ปี หรือ date range (ปฏิทิน) · มีผลกับ **ทุก tile พร้อมกัน**
- **caption ต่อ tile:** `ในช่วง` (event — นับเหตุการณ์ที่เกิดในช่วงที่เลือก) vs `ตอนนี้` (state — snapshot ปัจจุบัน ไม่ขึ้นกับช่วง) — ทุก tile ต้องระบุว่าเป็นชนิดไหน
- **refresh:** auto ทุก 15 วิ (default, toggle ปิดได้) — **คง filter + คง view/drill ที่เปิดอยู่** (ไม่รีเซ็ตช่วง ไม่เด้งกลับ tile) · แสดงเวลา refresh ล่าสุด
- **edge:** custom range เริ่ม>สิ้นสุด = error "ช่วงวันที่ไม่ถูกต้อง" ไม่ยิง query · เปลี่ยน preset ระหว่าง drill เปิดอยู่ = drill รีคำนวณตามช่วงใหม่ (ถ้า tile เป็น event)

### 2.2 ตาราง 7 แผนก × ทุก tile (นิยาม/สูตร/ชนิด/drill/สิทธิ์) — **BA เขียนเป็น story ต่อแผนก (US-DSH-Sale, -Stock, ... 7 อัน)**

**แผนก Sale — Read Sale (5 tile)**
| tile | สูตรนับ / เงื่อนไขเข้ากลุ่ม | ชนิด | drill-down (คอลัมน์ → คลิกไป) |
|---|---|---|---|
| ลูกค้าประจำ | count(customer.status=Active AND มี order ในช่วง) | event | ชื่อลูกค้า/สถานะ → customer-detail |
| ห่างหาย | count(customer transition→Inactive ในช่วง โดย scheduler; เกณฑ์ = inactive_after_months ของลูกค้า default 3) | event | ชื่อ/เหตุ(ไม่มี order เกิน N เดือน) → customer-detail |
| PO | count(po.created_date ในช่วง) | event | PO/ลูกค้า/สถานะ → po-detail |
| รอชำระ | count(invoice.status=รอชำระ AND ยังไม่เกินกำหนด AND issued ในช่วง) | event | INV/ลูกค้า/ครบกำหนด → invoice-detail |
| ต้องติดตาม | count(customer.status=Follow-up ที่ยังค้าง) | **state** | ชื่อ/เหตุผล comment → customer-detail |

**แผนก Stock — Read Stock (4 tile)**
| tile | สูตร/เงื่อนไข | ชนิด | drill |
|---|---|---|---|
| ใกล้หมด | count(material ที่ on_hand ≤ low_stock_threshold; **เฉพาะที่ตั้ง threshold** — null=ไม่นับ) | state | วัตถุดิบ/คงเหลือ → stock |
| ล็อตรอ QC | count(lot.qc_status=รอตรวจรับ) | state | lot/วัตถุดิบ → qc |
| คำขอ PR ค้าง | count(PR.status ∈ {เปิดคำขอ, รับทราบ, รับบางส่วน}) | state | PR/วัตถุดิบ/สถานะ → purchase-request |
| มูลค่าสต็อก | Σ(on_hand × ราคาอ้างอิง) — **นิยามราคาอ้างอิงให้ชัด** (COGS อยู่นอก scope → ใช้ last buy price หรือ default_buy_price) | state | วัตถุดิบมูลค่าสูงสุด → stock · **[ต้องยืนยันสูตรกับ PO/ปอนด์]** |

**แผนก Production — Read Production (4 tile)**
| tile | สูตร/เงื่อนไข | ชนิด | drill |
|---|---|---|---|
| คิวงานผลิต | count(queue_item=รอรับงาน) + count(PRD.status ∈ {รับงาน, กำลังผลิต, รอ QC, Rework}) — caption แยก "รอรับงาน X + ในสายผลิต Y" | state | รายการ/สถานะ (รอรับงาน=ยังไม่มีเลข PRD) → production |
| เสี่ยงล่าช้า | count(PRD ที่ overlay potential_delay=true; เกณฑ์ 2 วันผลิต+1 วันส่ง) | state | PRD/เหลือกี่วัน → production |
| พักงาน (Hold) | count(PRD.status=Hold) | state | PRD/เหตุ Hold → production |
| ผลิตเสร็จ | count(Batch→QC ผ่าน หรือ PRD→พร้อมส่งมอบ ในช่วง) | event | PRD/สถานะ → production |

**แผนก QC — Read QC (4 tile)**
| tile | สูตร/เงื่อนไข | ชนิด | drill |
|---|---|---|---|
| ล็อตรอตรวจรับ | count(lot.qc_status=รอตรวจรับ) | state | lot → qc |
| แบตช์รอ QC | count(batch.status=รอ QC) | state | batch → qc |
| ผ่าน QC | count(qc_record.result=pass ในช่วง; รวม lot+batch) | event | รายการ/ชนิด → qc |
| รอทำใบคืน | count(lot.qc_status=ระงับ AND ยังไม่มี return_doc) | state | lot เสีย → return |

**แผนก Shipping — Read Shipping (4 tile)**
| tile | สูตร/เงื่อนไข | ชนิด | drill |
|---|---|---|---|
| รอจัดส่ง | count(PO.fulfil=พร้อมจัดส่ง; **รวม PO ที่มี postpone_flag**) | state | PO/ลูกค้า/Postpone → shipping |
| กำลังนำส่ง | count(DN.status=กำลังนำส่ง) | state | SHP/DN → delivery-note |
| ส่งถึงแล้ว | count(DN→Delivered ในช่วง) | event | DN → delivery-note |
| เลื่อน/ปฏิเสธ | count(DN→Rejected หรือ Postponed ในช่วง) | event | PO/เหตุ → delivery-note |

**แผนก Finance — Read Finance/Invoice (4 tile)**
| tile | สูตร/เงื่อนไข | ชนิด | drill |
|---|---|---|---|
| รอวางบิล | count(PO.billing=ยังไม่วางบิล AND fulfil ≥ Confirmed) | state | PO → invoices |
| ค้างชำระ | count(invoice ครบกำหนดในช่วง AND ยังไม่จ่าย) | event | INV/ลูกค้า/+วัน → invoice-detail |
| รับชำระ | Σ(ยอดรับชำระในช่วง) — **เป็นยอดเงิน ไม่ใช่ count** | event | รายการรับชำระ → invoice-detail |
| เกินกำหนด | count(invoice.status=Overdue ที่ยังค้าง) | state | INV/+วัน → invoice-detail |

**แผนก Admin — Read Admin/Settings (4 tile)**
| tile | สูตร/เงื่อนไข | ชนิด | drill |
|---|---|---|---|
| ผู้ใช้ทั้งหมด | count(user ที่ไม่ถูก soft-delete) | state | user/role/สถานะ → settings |
| Role | count(role) | state | role/จำนวนสิทธิ์ → settings |
| เข้าใช้ | count(login events ในช่วง) | event | user/เวลา → trace |
| เหตุการณ์ trace | count(audit_log ในช่วง) | event | audit ล่าสุด → trace |

### 2.3 มุมมองตามสิทธิ์ + edge (ต้องเขียนเป็น AC)
- **สิทธิ์:** เห็นเฉพาะแผนกที่มี Read bit · **หลาย role = สลับแผนกได้** (tab/selector) · ไม่มีสิทธิ์แผนกใด = ไม่เห็นในตัวสลับ + เข้า URL ตรง 403
- **drill-down:** ทุก tile กด → list + pagination + คลิกรายการเข้า module พร้อม context (deep link) · tile=0 → empty state "ไม่มีรายการ"
- **edge:** date range ผิด = error · auto-refresh ค้าง filter+view · Admin เห็นได้ทุกแผนก (superset) หรือเฉพาะ Admin dashboard — **[BA ยืนยันกับ PO]**

---

## 3. Gap List ต่อ Module (17 + cross-cutting) — จัด P0/P1/P2

### สถานะความลึกปัจจุบัน
| กลุ่ม | module | ประเมิน |
|---|---|---|
| ✅ ลึกพอ (main+edge ครบ, 3 AC) | PO, Production, Invoice, Stock, Customer, QC, Shipping, PR, BOM, Return, Supplier | ผ่านเกณฑ์หลัก — เติม "พฤติกรรมย่อย" (P1/P2) |
| ⚠ ตื้น (screens/depts > stories) | **Dashboard, Settings** | ต้องขยายเป็น story ต่อหน่วยจอ/แผนก (P0/P1) |
| ⚠ ยังไม่มี module | **Home** | BA กำลังเพิ่ม (P0 — Pond ข้อ 1) |
| ⚠ ขาด sub-behavior | Traceability, Platform | เติมพฤติกรรมย่อย (P1) |

### P0 — ปอนด์ชี้ / function หลักหาย (ต้องแก้ก่อนกลับ Gate 2)
| # | module | Gap — ต้องเพิ่มอะไร |
|---|---|---|
| P0-1 | **Dashboard** | เขียน story ต่อแผนก (7 อัน) ครบทุก tile ตาม §2.2: นิยาม/สูตรนับ/เงื่อนไขเข้ากลุ่ม/ชนิด event-state/drill columns/สิทธิ์ · + story date-filter behavior (§2.1) + refresh คง view + multi-role |
| P0-2 | **Home** | (BA กำลังทำ) body หน้าหลัก: งานที่รอฉัน (ตามสิทธิ์/role), ทางลัด, สรุป noti, onboarding — story + AC + สิทธิ์ + empty state |
| P0-3 | **Settings** | แยก story ต่อหน้าจอครบ 5: (1) Role มีแล้ว (2) **User management** — สร้าง user/ผูก Google/เปิด-ปิด/เปลี่ยน role/**bulk-reassign ก่อนลบ Sale** (ยังไม่มี story) (3) VAT+ประวัติ มีแล้ว (4) **ข้อมูลบริษัท** — field ครบใช้ในใบกำกับ (ยังไม่เป็น story เดี่ยว) (5) **Audit log screen** — คอลัมน์/filter/search/ความสัมพันธ์กับ trace (ยังไม่มี story) |

### P1 — เงื่อนไข/พฤติกรรมไม่ครบ (ต้องเติมให้ Engineer/QA ไม่เดา)
| # | module | Gap |
|---|---|---|
| P1-1 | **Traceability** | (ก) entity selector — ระบุ entity ที่ค้นได้ + **field ที่ค้นได้ต่อ entity** (ข) genealogy — คลิก node (Lot/Batch/PO) ไปไหน + การแสดง "Lot vs Batch อธิบาย" (ค) ตาราง field-audit — คอลัมน์/filter/sort/pagination (ง) archive — ขอบเขต/รูปแบบไฟล์/ยืนยัน |
| P1-2 | **Platform/Notification** | (ก) noti panel — ลำดับรายการ, grouping, "mark all read", empty state, badge cap ("9+"), ลิงก์ "ดูทั้งหมด" (ข) **global header search** — ค้นอะไร/แสดงผลยังไง/คลิกไปไหน (ยังไม่ spec เลย) (ค) session pre-expiry warning ก่อน 06:00 reset |
| P1-3 | **PO** | **suggest/auto-calc logic ตอน create** — "เช็ควัตถุดิบพอ" คำนวณจากอะไร (BOM×qty เทียบ on_hand), แสดงผลยังไง, ราคา default มาจากไหนต่อ item type (BOM=ราคาขาย, วัตถุดิบตรง=default_sell_price) |
| P1-4 | **Supplier** | price matrix — พฤติกรรมเพิ่ม/แก้ราคาต่อคู่ (material×supplier), toggle active/inactive มีผลกับ BOM cost เมื่อไหร่ (snapshot ไม่กระทบ PO เดิม), search/filter รายการ supplier (ยังไม่ได้อ่าน spec เต็ม — **BA ตรวจตามเกณฑ์**) |
| P1-5 | **ทุก list/table page** | ระบุ **search/filter fields + sort + page-size + default sort + empty state** ต่อหน้า (po-list มี 3-date แล้ว; customers/stock/supplier/purchase-request/invoices/qc/shipping/delivery-note ยังไม่ enumerate ตัวกรอง) |
| P1-6 | **Stock — มูลค่าสต็อก** | สูตรมูลค่าต้องนิยาม (COGS out of scope) — ใช้ราคาอ้างอิงตัวไหน (ยืนยัน PO) |

### P2 — polish
| # | Gap |
|---|---|
| P2-1 | field-level validation ต่อฟอร์ม create/edit ทุกหน้า (required/format/range) — ระบุครบ ไม่พึ่ง generic |
| P2-2 | empty state ข้อความมาตรฐานทุกหน้า list/drill |
| P2-3 | multi-role switch UX (ผู้ใช้หลายแผนก) — ให้สอดคล้องทั้ง dashboard + เมนู |
| P2-4 | mock-data: dashboard tile count ไม่ตรง drill count บางจุด (เช่น Stock ใกล้หมด tile=1 vs drill "(5)"; QC ล็อตรอ tile=4 vs drill "(3)") — UX แก้ data ให้ตรง (ไม่ใช่ spec แต่กระทบความน่าเชื่อ) |
| P2-5 | badge/สถานะไทยสม่ำเสมอทุกหน้า (ไม่โชว์ enum ดิบ) — ยืนยัน glossary ครอบทุกค่า |

---

## 4. คำสั่งถึง BA (ลำดับทำ)
1. **P0 ก่อน** (Dashboard 7-dept template §2 พร้อมแล้วใช้ได้เลย · Home · Settings 5 screens) → ให้ PO review
2. **P1** (Traceability, Platform noti+search, PO suggest logic, Supplier matrix, list-page filters, Stock มูลค่าสูตร)
3. **P2** polish
4. จุด **[ยืนยัน PO/ปอนด์]**: (ก) สูตร "มูลค่าสต็อก" (ข) Admin เห็นทุกแผนกหรือเฉพาะ Admin dashboard (ค) รอบ Active→Inactive จำกัดชุด {1,3,6,8} หรืออิสระ (ค้างจาก po-stage2-review.md)
> เกณฑ์ปิดงาน = §1 (ทุก function ครบ 4 ด้าน) · PO จะ re-review ทุก module ก่อนเปิด Gate 2 อีกครั้ง
