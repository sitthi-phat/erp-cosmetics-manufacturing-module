# Task Breakdown — ERP Core Prototype

- **slug**: `erp-core-prototype`
- **สถานะ**: Accepted (rev.3 — Gate 2 rework, ต่อจาก rev.2) → READY_FOR_ENGINEER
- **อ้างอิง**: architecture.md (rev.3 §13), ADR-001–009, user-stories.md (**ECP-001–044**)

> Engineer และ QA ทำงาน **ขนานกันได้**: QA เขียน test plan/automation จาก AC + API contract (§6/§13.3) โดยไม่ต้องรอโค้ด.
> **[DEFECT]** = แก้ defect เดิมที่ปอนด์รายงาน (มี root cause จากโค้ดจริง) ; **[NEW]** = ฟีเจอร์ใหม่รอบ Gate 2

## ประวัติการแก้ไข
| rev | สาระ |
|---|---|
| 1 | Engineer E0–E19, QA Q1–Q6, DevOps D1–D5 (ECP-001–036) |
| 2 | เพิ่ม E20/E21 (invoice versioning, VATConfig), Q7 (concurrency/accuracy/TTL) |
| **3** | **Gate 2 rework: เพิ่ม E22–E33 (5 defect fix + scope ใหม่), Q8–Q11; ADR-009 ใหม่. E0–E21/Q1–Q7 คงเดิม** |

---

## A. Engineer Tasks — Gate 2 Rework (E22 เป็นต้นไป)

> E0–E21 เดิม (foundation, order-to-cash, invoice versioning, VATConfig) **implement + verify แล้ว** (QA verify-5
> ผ่าน, DEF-01–15 ปิดหมด). งานรอบนี้ทั้งหมด build ต่อยอดบนของเดิม. รูปแบบ: **ID — งาน | ไฟล์ | Stories | ขึ้นกับ | นิยาม "เสร็จ"**

**E22 — Schema/seed delta (Gate 2) + fix seed lot-number determinism** **[DEFECT+NEW]**
- ไฟล์: `prisma/schema.prisma`, `prisma/migrations/*`, `prisma/seed.ts`
- Stories: ECP-001/002/008/020/041 (Data Rules §13.2), **root cause defect C** | ขึ้นกับ: E1
- DoD:
  - schema: `CompanyProfile` (singleton), `Customer.tax_id?`/`registered_address?`, `Invoice.discount_amount` (default 0.00)/`document_snapshot Json?`, `Lot.supplier_name?`, `QCInspection.lot_id?` (nullable, XOR batch_id — app-level guard + CHECK ถ้า MySQL8 รองรับ)
  - index: `Lot(received_date)` (FIFO), `Customer(tax_id)`
  - **[DEFECT C] seed lot_number = `L-SEED-${i+1}` (loop index 1-based) ไม่ใช่ `material.id`** → `L-SEED-1` มีจริงเสมอทุก reseed
  - seed: CompanyProfile 1 แถว; customer บางรายมี tax_id + **จงใจเว้น 1 รายไม่มี tax_id** (ECP-042 AC4); supplier_name ให้ Lot ที่ seed
  - migration generate + `prisma validate` ผ่าน; seed idempotent (reset+reseed ซ้ำได้)

**E23 — Customer tax fields** **[NEW]** (ECP-001 AC5-7, ECP-002 AC4)
- ไฟล์: `modules/customer/*`, FE `pages/CustomersPage.tsx` (+form) | ขึ้นกับ: E22, E6
- DoD: BE validate tax_id 13 หลักตัวเลขล้วนเมื่อกรอก (AC6), optional ตอนสร้าง (AC7) + แสดง badge เตือนถ้าไม่มี, registered_address (fallback address), tax_id snapshot ทำที่ E30/E32 (ตอนออก invoice/พิมพ์) ไม่แก้ย้อนหลัง (ECP-002 AC4); FE เพิ่มช่อง tax_id + registered_address ในฟอร์มสร้าง/แก้ไข

**E24 — PO line display + delete** **[DEFECT]** (ECP-004 AC1/AC2/AC5)
- ไฟล์: FE `pages/PoCreatePage.tsx`, `pages/PoDetailPage.tsx`; BE `modules/po/*` (delete-line guard) | ขึ้นกับ: E10, E17
- DoD:
  - **root cause fix:** เก็บ product name ใน line state; render เป็นตาราง **ชื่อสินค้า/จำนวน/ราคาต่อหน่วย(บาท)/ยอดรวมบรรทัด** — **regression guard: ห้ามพบข้อความรูปแบบ `Product #<id> x <qty> @ <price>` หรือ raw id ใดๆ บนหน้าจอ** (ECP-004 AC1)
  - เพิ่มปุ่ม "ลบ" ต่อบรรทัดก่อนยืนยัน PO (Draft) → ลบออกจาก state + ยืนยันตามบรรทัดที่เหลือ (AC2)
  - BE ปฏิเสธลบบรรทัดหลัง PO Confirmed ขึ้นไป + ข้อความชัด (AC5)

**E25 — Stock search** **[DEFECT]** (ECP-007 AC4/AC5)
- ไฟล์: FE `pages/StockPage.tsx` (+search box) | ขึ้นกับ: E8, E17
- DoD: **root cause fix (ไม่มีช่องค้นหาเลย)** → เพิ่มช่องค้นหา filter ชื่อ/รหัสวัตถุดิบ case-insensitive ≤2 วิ ซ่อนแถวไม่ตรง (AC4); ไม่พบ → empty-state + ปุ่ม "ล้างการค้นหา" (AC5). Client-side filter บนผลลัพธ์ `GET /stock` (prototype scale เพียงพอ)

**E26 — BOM Management module + UI** **[NEW]** (ECP-039)
- ไฟล์: `modules/bom/*` (หรือ `modules/product`), FE `pages/BomManagementPage.tsx`; permission seed | ขึ้นกับ: E7, E3, E22
- DoD: `GET /boms`, `GET /boms/:productId`, `POST /boms` (สร้างพร้อม ≥1 line), `PUT /boms/:productId` (แก้ in-place), `DELETE /boms/:productId/lines/:lineId`;
  กติกา ≥1 line (AC4), ห้าม material ซ้ำใน BOM เดียว (AC5), ยืนยันก่อนลบบรรทัด (AC3), ไม่มี version history (in-place, AC2); permission `bom.manage` (PR+AD), `bom.view`; audit `ManageBOM`; สินค้าที่เพิ่ม BOM แล้วผ่าน ECP-009 ทันที (AC1)

**E27 — Production material auto-calc + FIFO lot proposal + fix lot picker** **[DEFECT+NEW]** (ECP-013)
- ไฟล์: `modules/production/*` (material-plan service + produce re-validate), FE `pages/ProductionPage.tsx` | ขึ้นกับ: E26, E11, E13
- DoD:
  - `GET /production/:id/material-plan`: required = qty_per_unit × plannedQty ต่อ material; เสนอ Lot **FIFO** (received_date ASC, เฉพาะ Passed, remaining>0) allocate ครบ (AC1); ไม่มี BOM → 409 ข้อความชัด (AC4)
  - **root cause fix:** FE แทน `NumberField name="lotId"` (พิมพ์ internal id) ด้วยแผนที่ระบบเสนอ + เลือก/ปรับ Lot จาก **lot number** (review ไม่พิมพ์เอง) — Lot `L-SEED-1` ที่เคย error ต้องใช้ได้ (AC2)
  - produce: **server re-validate Σ(qtyUsed/material) = required พอดี** (AC5) + ทุก Lot = Passed (ECP-017 AC2/AC3); รองรับ multi-lot (AC3); สร้าง Batch + BatchLotUsage + issue stock ใน tx (คงกลไกเดิม)
  - แก้ raw-id display `material #{id} - lot #{id}` เป็นชื่อ (ต่อเนื่อง ECP-043)

**E28 — Trace single search auto-detect + legend** **[DEFECT+NEW]** (ECP-014)
- ไฟล์: `modules/stock/trace.routes.ts`, FE `pages/TracePage.tsx` | ขึ้นกับ: E22, E12
- DoD:
  - **root cause fix:** `GET /trace?q=<term>` auto-detect Lot/Batch/PO/Invoice ตาม regex ADR-006 (§13.3.1), trim input, fallback Lot; resolve สายเต็มเดียวกันจากทุกจุดเข้า (AC1/AC2); คง `?lot=` backward-compat
  - Lot ที่ใช้หลาย Batch → คืนครบ (AC4); ไม่ match/ไม่พบ → ข้อความเป็นมิตร (AC5)
  - FE: ช่องค้นหาเดียว + **legend "Lot=ล็อตวัตถุดิบต้นทาง / Batch=รอบผลิตปลายทาง"** + timeline ทิศทาง Lot→Batch→สินค้า มองเห็นเสมอ (AC3)
  - หมายเหตุ: root cause seed (`L-SEED-1` ไม่มีจริง) แก้ที่ E22 แล้ว — E28 การันตี auto-detect หา Lot เจอ

**E29 — Incoming QC supplier_name + goods-receipt supplier** **[NEW/ยกระดับ]** (ECP-008 AC4, ECP-017 AC1/AC4)
- ไฟล์: `modules/stock` (receipt +supplier_name), `modules/qc` (lot inspect), FE QC incoming form | ขึ้นกับ: E22, E8, E13
- DoD: goods receipt เก็บ supplier_name ผูก Lot (ECP-008 AC4); ฟอร์มตรวจขาเข้าแสดง qty/lot/supplier ที่ระบบดึงมาให้ (ECP-017 AC1); Lot เก่าไม่มี supplier → แสดง "ไม่ระบุ" ไม่ error (AC4); บันทึกผลตรวจลง `QCInspection.lot_id` + set `Lot.incoming_qc_status`

**E30 — Invoice discount + detail view** **[DEFECT+NEW]** (ECP-020 AC4/AC5, ECP-040)
- ไฟล์: `modules/invoice/*` (calc + detail endpoint), FE `pages/InvoiceDetailPage.tsx` + route + link จาก list | ขึ้นกับ: E15, E20
- DoD:
  - ออก invoice รับ `discount_amount`; block ถ้า discount > subtotal + ข้อความ (ECP-020 AC5); recompute vat=round((subtotal−discount)×rate/100,2), total (AC4)
  - **root cause fix (เปิดดูไม่ได้):** `GET /invoices/:id` คืนรายละเอียดครบ (ลูกค้า/บรรทัด/subtotal/discount/vat/total/สถานะ/ประวัติชำระ) (ECP-040 AC1); version-aware แสดง latest + ลิงก์ประวัติ (AC2); id ไม่มีจริง → 404 ข้อความ ไม่ 500 (AC3); RBAC 403 (AC4)
  - FE หน้า detail + ปุ่มเข้าจาก `pages/InvoicesPage.tsx`

**E31 — CompanyProfile admin** **[NEW]** (ECP-041)
- ไฟล์: `modules/companyProfile/*` (หรือ vatConfig รวม), FE `pages/admin/AdminPage.tsx` (+section) | ขึ้นกับ: E3, E22
- DoD: `GET/PUT /admin/company-profile` singleton, Admin only; validate tax_id 13 หลัก (AC3); logo (url/upload placeholder); snapshot ณ ออกเอกสาร (AC2, ทำจริงที่ E32); FE ส่วน "ข้อมูลบริษัท" ในหน้า /admin; audit `UpdateCompanyProfile`

**E32 — Thai tax-invoice document + Thai baht text** **[NEW]** (ECP-042, ADR-009)
- ไฟล์: `src/shared/thaiBahtText.ts` (pure fn), FE `pages/invoice/InvoiceDocument.tsx` + print CSS, `GET /invoices/:id/document` (assemble จาก snapshot) | ขึ้นกับ: E30, E31
- DoD:
  - `thaiBahtText(amount)` pure fn: หลักไทยครบ (เอ็ด/ยี่/ล้าน/สตางค์/ถ้วน), 0→"ศูนย์บาทถ้วน" (AC5) — **unit test อิสระ (Q8)**
  - print view ตรงตัวอย่างปอนด์ **ครบทุกส่วน** (หัวสองภาษา+โลโก้, ผู้ออกจาก snapshot, ลูกค้า, เลขที่/วันที่ dd/mm/yy, เงื่อนไขชำระ, ตารางรายการ, subtotal/หักส่วนลด/หลังหักส่วนลด/VAT7%/grand total, ตัวหนังสือไทย, ช่องลายเซ็น 2 ช่อง+วงเล็บชื่อ, พื้นที่ตรายาง) (AC1)
  - discount 0 ยังแสดงบรรทัด (AC2); Superseded → พิมพ์ได้ + ลายน้ำ "ยกเลิกแล้ว…" (AC3); block ถ้าไม่มี CompanyProfile (ECP-041 AC4) / ลูกค้าไม่มี tax_id (AC4); ยอดหลังหักส่วนลด=0 → VAT/total=0 + "ศูนย์บาทถ้วน" (AC5)
  - approach = browser print (`@media print` + `window.print()`), **ไม่เพิ่ม server PDF dependency** (ADR-009)

**E33 — UI consistency + responsive (8 หน้าที่แตะ)** **[NEW, Should]** (ECP-043, ECP-044)
- ไฟล์: FE 8 หน้า (PO create/detail, stock, trace, production, QC incoming, BOM, customer form, invoice detail+print), `ui/` (grid/token ถ้าต้อง) | ขึ้นกับ: E23,E24,E25,E26,E27,E28,E29,E30,E32
- DoD: ทั้ง 8 หน้าใช้ design token จาก `ui/` เดียวกัน ไม่มี inline style ขัดกัน (AC1); empty/error-state component เดียวกัน (AC2/AC3); desktop ≥1366 ครบไม่ล้น (AC1); tablet 768–1024 portrait/landscape กดสะดวก ไม่ scroll แนวนอน + เก็บ form state เมื่อหมุนจอ (ECP-044 AC2/AC3); <768 minimum safety ปุ่มสำคัญไม่หาย (AC4); หน้านอก 8 หน้าไม่ต้องแตะ (ECP-043 AC4)

**ลำดับแนะนำ**: E22 → (E23, E26, E31) → E24 → E25 → E27 → E28 → E29 → E30 → E32 → E33
(E22 schema ก่อนทุกอย่าง; E26 BOM ก่อน E27 production auto-calc; E30 ก่อน E32 print; E33 ปิดท้ายหลังหน้าอื่นเสร็จ)

---

## B. Story → Task Coverage (Gate 2 — ครบ ECP ใหม่/แก้)

| Story | Engineer task | ประเภท |
|---|---|---|
| ECP-001 (tax fields) | E22, E23 | NEW |
| ECP-002 (tax_id snapshot) | E23, E32 | NEW |
| ECP-004 (line display/delete) | **E24** | DEFECT |
| ECP-007 (stock search) | **E25** | DEFECT |
| ECP-008 (supplier_name) | E22, E29 | NEW |
| ECP-013 (production auto-calc + lot) | **E27** | DEFECT+NEW |
| ECP-014 (trace auto-detect + legend) | **E28** (+E22 seed) | DEFECT+NEW |
| ECP-017 (incoming QC upgrade) | E29 | ยกระดับ Must |
| ECP-020 (discount) | E30 | NEW |
| ECP-039 (BOM Management UI) | E26 | NEW |
| ECP-040 (invoice detail) | **E30** | DEFECT |
| ECP-041 (CompanyProfile) | E31 | NEW |
| ECP-042 (Thai tax invoice) | E32 (+ADR-009) | NEW |
| ECP-043 (UI consistency) | E33 | NEW |
| ECP-044 (responsive) | E33 | NEW |

ทุก story ใหม่/แก้ (ECP-039–044 + ECP-001/002/004/007/008/013/014/017/020) มี ≥1 engineer task.
5 defect เดิมของปอนด์ = E24(A), E25(B), E28+E22(C), E27(D), E30(E) — ทุกตัวมี root-cause task เจาะจง.

---

## C. QA Tasks — Gate 2 Rework (Q8 เป็นต้นไป)

> Q1–Q7 เดิมยังมีผล. Q8–Q11 = ครอบคลุมของใหม่/ที่แก้รอบนี้. QA เขียน spec จาก AC + §13.3 ได้เลย (data-testid sync กับ E33)

**Q8 — Unit: business logic ใหม่** **[NEW]**
- ครอบคลุม:
  - `thaiBahtText`: happy หลากหลาย, **0→"ศูนย์บาทถ้วน" (ECP-042 AC5)**, สตางค์, เอ็ด/ยี่, ล้าน/หลายล้าน
  - invoice discount math: vat=round((subtotal−discount)×rate/100,2), total (ECP-020 AC4); **discount>subtotal → reject (AC5)**; discount=subtotal → vat/total=0 (ECP-042 AC5)
  - trace type auto-detect: แต่ละรูปแบบ Lot/Batch/PO/Invoice + unknown → fallback/นิยามถูก (ECP-014 AC1/AC5)
  - FIFO allocation: เรียง received_date, multi-lot split, insufficient (ECP-013 AC1/AC5)
  - BOM validation: ≥1 line (ECP-039 AC4), ห้าม material ซ้ำ (AC5)
  - tax_id validation 13 หลัก (ECP-001 AC6, ECP-041 AC3)
- test data: ชุดจำนวนเงิน (0/สตางค์/ล้าน), material/lot/received_date คงที่, ชุดเลขเอกสารทุก format

**Q9 — Integration: API + DB ใหม่** **[NEW]**
- ครอบคลุม:
  - customer tax fields + snapshot ไม่แก้ย้อนหลัง (ECP-001 AC5-7, ECP-002 AC4)
  - BOM CRUD in-place ครบ AC (ECP-039), สินค้าเพิ่ม BOM แล้วผ่าน stock check
  - `GET /production/:id/material-plan` FIFO + produce re-validate (Σ=required, Passed-lot gate) (ECP-013, ECP-017 AC2/AC3)
  - trace auto-detect ทั้ง 4 จุดเข้าได้สายเดียวกัน + not-found (ECP-014 AC1/AC2/AC4/AC5)
  - invoice discount issue + block discount>subtotal + `GET /invoices/:id` detail (404/RBAC/version) (ECP-020/040)
  - CompanyProfile singleton + block พิมพ์เมื่อไม่ตั้งค่า (ECP-041 AC4)
  - `GET /invoices/:id/document` assemble จาก snapshot + Superseded watermark + block ลูกค้าไม่มี tax_id (ECP-042 AC3/AC4)
  - supplier_name capture + fallback "ไม่ระบุ" (ECP-008 AC4, ECP-017 AC4)
  - RBAC ใหม่: bom.manage 403 (SA/WH), company_profile.manage เฉพาะ AD, product.view (Finance ผ่าน)
- test data: seed rev.3 (L-SEED-1..N deterministic, 1 customer ไม่มี tax_id, CompanyProfile set)

**Q10 — E2E / regression guard 5 defect เดิม** **[NEW]**
- ครอบคลุม (ดัก regression ตรงฟีดแบ็คปอนด์):
  - **(A ECP-004)** PO create: ห้ามพบ `Product #<id> x <qty> @ <price>`; แสดงชื่อ+จำนวน+ราคา+ยอดรวม; ลบบรรทัดได้
  - **(B ECP-007)** stock: ค้น "มะพร้าว" filter เหลือแถวตรง; ไม่พบ → empty-state
  - **(C ECP-014)** trace: ค้น "L-SEED-1" คืนสายเต็ม; และค้นด้วย Batch/PO/Invoice number ได้สายเดียวกัน; legend ปรากฏ
  - **(D ECP-013)** production: เปิดหน้าเห็นแผน auto-calc + เลือก Lot ที่เสนอ → produce สำเร็จไม่ error
  - **(E ECP-040)** เปิด invoice detail จาก list ได้ + print preview render ครบ (ECP-042)
  - BOM management: สร้าง BOM ใหม่ → ใช้ใน PO/production e2e
- test data: seed reset ก่อนรัน; sync data-testid กับ E33

**Q11 — Print fidelity + responsive + UI consistency (manual/visual + viewport)** **[NEW]**
- Print fidelity: **ปอนด์เทียบเอกสารพิมพ์กับตัวอย่างจริง → ยืนยันตรง (ECP-042 AC1, DoD Gate2 #9)** — manual/UAT
- responsive: Playwright viewport 1366 (desktop) + 768/1024 (tablet portrait/landscape) บน 8 หน้า → ไม่ล้น/ปุ่มไม่หาย (ECP-044)
- UI consistency: visual review token/empty/error-state สม่ำเสมอ 8 หน้า (ECP-043) — semi-manual

### AC → Test level (Gate 2)
- คำนวณ/validation/algorithm (baht text, discount, FIFO, auto-detect, BOM rule) → **Q8**
- API/DB/RBAC/snapshot/reconciliation ใหม่ → **Q9** ; flow ผู้ใช้ + regression 5 defect → **Q10**
- print visual + responsive + UI consistency → **Q11** (บางส่วน manual/UAT — ปอนด์ verify ที่ Gate 2)

ทุก AC ของ ECP-039–044 + AC ใหม่ของ ECP-001/002/004/007/008/013/014/017/020 ถูก assign ≥1 ระดับ
(happy→Q8/Q9/Q10, edge→Q8/Q9, error→Q9/Q10, print/visual/responsive→Q11).

---

## D. DevOps Tasks — Gate 2 delta

**D6 — Config/env delta** — ไม่มี env ใหม่ที่บังคับ (print เป็น client-side ตาม ADR-009 ไม่ต้องเพิ่ม service).
ถ้ามี logo upload ต้องมี static path/volume → ระบุใน `.env.example` (`UPLOAD_DIR` optional). ยืนยัน migration ใหม่
(E22) รันกับ MySQL จริง + `npm run db:seed` (seed rev.3) idempotent 3x. คง runbook เดิม + เพิ่มบัญชี/หน้าใหม่ใน 
smoke checklist (BOM, invoice print, trace).

**D7 — Verify migration + seed determinism** — รัน `prisma migrate deploy` + seed บน fresh volume; ยืนยัน
`L-SEED-1` มีจริงหลัง reseed (defect C regression). ไม่มี secret ใหม่ถูก commit.

(D1–D5 เดิมคงใช้; Docker/MySQL environment พร้อมแล้วจาก DevOps final-smoke รอบก่อน)

---

## E. หมายเหตุ open items (ไม่ block เริ่มโค้ด — มี default ชัด)
1. **สิทธิ์แก้ BOM (ECP-039)** = ฝ่ายผลิต + Admin (⚠ BA default) — implement ตาม default, ยืนยันปอนด์ช่วง UAT
2. **tax_id ไม่บังคับตอนสร้างลูกค้า** แต่บังคับก่อนพิมพ์ใบกำกับภาษี (ECP-001 AC7/ECP-042 AC4) — default BA, ไม่ block
3. **discount = จำนวนเงินคงที่ต่อใบ** (ไม่ใช่ %/ต่อบรรทัด — ⚠ PO default) — implement คงที่, %/ต่อบรรทัด = backlog
4. **registered_address fallback → address** ถ้าไม่กรอกแยก (PO ให้ BA ตัดสิน) — implement fallback
5. **print approach = browser print (ADR-009)** ไม่ทำ server PDF — ถ้า Phase 3 ต้อง archival PDF ค่อยเพิ่ม route (ไม่ปิดทาง)
6. **Print fidelity** = ปอนด์ verify visual ที่ Gate 2 (subjective) — Engineer ทำตามตัวอย่างครบทุกส่วน, ปอนด์เป็นผู้ยืนยันขั้นสุดท้าย
