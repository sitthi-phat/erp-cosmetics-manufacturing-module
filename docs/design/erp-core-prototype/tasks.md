# Task Breakdown — ERP Core Prototype

- **slug**: `erp-core-prototype`
- **สถานะ**: Accepted (rev.2 หลัง Gate 1 approve-with-conditions) → READY_FOR_ENGINEER
- **อ้างอิง**: architecture.md (rev.2), ADR-001–008 (005/006/008 rev.2), user-stories.md (**ECP-001–038**)

> Engineer และ QA ทำงาน **ขนานกันได้**: QA เขียน test plan/automation จาก AC + API contract (§6) โดยไม่ต้องรอโค้ด.
> **[NEW]/[CHANGED]** = task ที่เพิ่ม/เปลี่ยนในรอบ rev.2 (Gate 1 amendment) — ที่เหลือคงเดิมจาก rev.1

## ประวัติการแก้ไข
| rev | สาระ |
|---|---|
| 1 | Engineer E0–E19, QA Q1–Q6, DevOps D1–D5 (ECP-001–036) |
| **2** | เพิ่ม **E20 (invoice versioning+reconciliation, ECP-037)**, **E21 (VATConfig admin, ECP-038)**, **Q7 (concurrency/accuracy/TTL)**; แก้ E1/E2/E3/E4/E6/E8/E15/E17/E19 + Q1/Q2/Q4 + D2 |

---

## A. Engineer Tasks

รูปแบบ: **ID — งาน | โมดูล/ไฟล์ | Stories | ขึ้นกับ | นิยาม "เสร็จ" (DoD)**

### กลุ่ม Foundation

**E0 — Project scaffolding** (คงเดิม)
- ไฟล์: `package.json`, `tsconfig`, `src/backend/app.ts|server.ts`, `src/frontend` (Vite), `.env.example`, `Dockerfile.*`, `docker-compose.yml`
- DoD: `npm run dev` ยก backend+frontend+MySQL ได้, health 200, env อ่านจาก config ไม่ hardcode (ADR-001)

**E1 — Prisma schema + migration + seed** **[CHANGED]**
- ไฟล์: `prisma/schema.prisma`, `prisma/migrations/*`, `prisma/seed.ts`
- Stories: Data Rules ทุก entity (§3) | ขึ้นกับ: E0
- DoD: สร้างครบทุกตาราง **รวมของใหม่ rev.2: Invoice(invoice_no/version/parent_invoice_id self-FK/subtotal/vat_rate_applied/vat_amount/total_amount/status+Superseded), VATConfig, Customer.customer_id, User.user_id**;
  **สร้าง index ตาม §NFR N3** (StockTransaction(material_id,created_at), unique(invoice_no,version), Payment(invoice_chain_key), AuditLog(user_id,timestamp)/(action_type,timestamp), Customer/User unique ฯลฯ);
  seed ตาม §8 **รวม VATConfig=7.00, customer_id/user_id auto-gen, demo revise invoice v2**; idempotent

**E19 — NumberSequence service** **[CHANGED]** (ADR-006 rev.2)
- ไฟล์: `src/backend/lib/numberSequence.ts`, ตาราง `NumberSequence`
- Stories: ECP-001,004,013,018,020,023,037 (Customer/User/PO/Batch/Shipment/Invoice) | ขึ้นกับ: E1
- DoD: ออกเลขทุก format **เผื่อหลักตาม ADR-006 rev.2** (CUS-8, USR-8, PO-6, B/SH-5, INV-6) **ภายใน tx เดียว + row-lock ต่อคีย์** (UPDATE...LAST_INSERT_ID หรือ SELECT FOR UPDATE);
  **padding overflow ไม่ตัดทอน**; **invoice_no คงที่ทั้ง chain, version+parent จัดการที่ E20**; ทดสอบ concurrency ไม่ซ้ำ (คู่กับ Q7)

**E2 — Auth (JWT identity) + middleware pipeline** **[CHANGED]** (ADR-002,005 rev.2)
- ไฟล์: `middleware/{requestId,auth,resolvePermission,errorHandler}.ts`, `lib/permissionCache.ts`, `modules/user` (login/logout/me), `lib/errors.ts`
- Stories: ECP-025 (login log hook), ECP-036 (error ไทย), **ECP-023 AC2 (role change ≤5 นาที)** | ขึ้นกับ: E1
- DoD: login ออก JWT (httpOnly) **payload = user_id เท่านั้น (ไม่ฝัง permission)**; bcrypt;
  **`resolvePermission` โหลด role+permission ต่อ request จาก `permissionCache` TTL=`PERMISSION_CACHE_TTL` (default 60s, clamp ≤300s)** — source of truth = DB;
  `/auth/me` คืน user+permission สดจาก cache; errorHandler แปลงเป็น `{error:{code,message(ไทย),fields}}`

**E3 — RBAC: permission matrix + requirePermission + config API** **[CHANGED]** (ADR-005 rev.2)
- ไฟล์: `middleware/requirePermission.ts`, `modules/user` (roles/permissions)
- Stories: **ECP-024**, รองรับ AC3 ของ ECP-016/022/027–033 | ขึ้นกับ: E2
- DoD: 403 เมื่อไม่มีสิทธิ์ (แม้เรียก URL ตรง); **แก้ permission/role → `permissionCache.invalidate` + มีผล ≤5 นาทีโดยไม่ re-login (ECP-023 AC2/ECP-024 AC1)**;
  guardrail กัน lockout `manage_permission` (ECP-024 AC2); seed matrix §7 รวม `admin.manage_vat_config`, `invoice.revise`

**E4 — User Management** **[CHANGED]** (ECP-023)
- ไฟล์: `modules/user` | ขึ้นกับ: E3
- DoD: สร้าง/แก้ user + assign role; **user_id auto-gen ผ่าน E19, server strip `user_id` ที่ client ส่งเสมอ (ECP-023 AC4)**; username ซ้ำถูกปฏิเสธ (AC3); role ใหม่มีผล ≤5 นาที (AC2 ผ่าน E2/E3)

**E5 — Audit log core** (คงเดิม + action ใหม่) (ADR-007)
- ไฟล์: `middleware/audit.ts`, `modules/audit` | Stories: ECP-025, ECP-026 | ขึ้นกับ: E2
- DoD: login สำเร็จ+ล้มเหลว; interceptor เขียน action สำคัญ **รวม `ReviseInvoice`, `UpdateVATConfig`**; write-fail ไม่เงียบ (retry+system log); `GET /audit-logs` filter+pagination; **ไม่มี path ใด update/delete audit** (ECP-026 AC3)

### กลุ่ม Master data & Stock

**E6 — Customer module** **[CHANGED]** (ECP-001,002,003)
- ไฟล์: `modules/customer` + FE pages | ขึ้นกับ: E3, E19
- DoD: CRUD + ค้นหา; **customer_id auto-gen ผ่าน E19, ไม่มีช่องกรอกในฟอร์ม, server strip `customer_id` ที่ client ส่ง (ECP-001 AC1/AC4)**; required field (AC3); เตือนชื่อซ้ำไม่ block (AC2); เตือน inactive ทั้งมี PO เปิด (ECP-002 AC2); ประวัติ PO (ECP-003)

**E7 — Master: Product / RawMaterial / BOM** (คงเดิม)
- ไฟล์: `modules/stock`(master)/`modules/product` | ขึ้นกับ: E1 | DoD: อ่าน master+BOM, รองรับเคส product ไม่มี BOM

**E8 — Stock core: balance + ledger + realtimeGateway + goods receipt** **[CHANGED]** (ADR-004, §NFR)
- ไฟล์: `modules/stock` (balance, transaction, receipt, **reconciliation**), `lib/realtimeGateway.ts`, socket server
- Stories: **ECP-007, ECP-008, ECP-010 (รวม AC4)** | ขึ้นกับ: E1, E19
- DoD: goods receipt สร้าง Lot + physical += ใน tx + StockTxn (AC2 lot ซ้ำถามยืนยัน, AC3 qty≤0 block);
  แยก physical/reserved/available (ECP-010); **ทุก path ที่แก้ยอดใช้ row-lock `StockBalance` (SELECT FOR UPDATE) กัน lost-update (§NFR N1)**;
  emit `stock.changed`, หน้า stock ≤1 นาทีไม่ refresh (ECP-007 AC1), ยอด 0+"หมดสต็อก" (AC2), error state คงเวลาล่าสุด (AC3), เบิกเกิน physical ปฏิเสธ (ECP-010 AC3);
  **`GET /stock/reconciliation`: Σledger = physical 100% (ECP-010 AC4)**

**E9 — BOM stock check** (คงเดิม) (ECP-009)
- ไฟล์: `modules/stock`(check) | ขึ้นกับ: E7, E8 | DoD: need=Σ(qty_per_unit×order_qty) เทียบ available, ระบุเฉพาะ material ที่ขาด (AC2), block ถ้าไม่มี BOM (AC3)

### กลุ่ม Order-to-Cash flow

**E10 — PO module: create/confirm(reserve)/cancel/timeline** (คงเดิม)
- ไฟล์: `modules/po` + FE | Stories: **ECP-004,005,006** | ขึ้นกับ: E6, E9, E19
- DoD: create Draft (≥1 line), confirm → stock check+reserve ใน tx+emit (block เมื่อไม่พอ), cancel คืน reservation ครั้งเดียว, block cancel เมื่อ InProduction, timeline 5 สถานะ, "รอผลิตใหม่" เมื่อ QC reject, ไม่พบ PO → ข้อความชัด

**E11 — Production: queue + assign + produce(batch) + issue stock** (คงเดิม) (ECP-011,012,013)
- ไฟล์: `modules/production` + FE | ขึ้นกับ: E10, E8 | DoD: queue เรียง delivery date, assign สร้าง ProductionOrder, produce สร้าง Batch+เลข ผูกหลาย Lot (BatchLotUsage), เบิก physical ใน tx+emit, block ถ้าไม่เลือก Lot

**E12 — Traceability** (คงเดิม) (ECP-014)
- ไฟล์: `modules/stock`(trace) | ขึ้นกับ: E11 | DoD: Lot→Batch(หลาย)→FG→PO ครบสาย ≤5 นาที (ใช้ index §NFR N3), หลาย Batch/Lot (AC2), Lot ไม่มี → ข้อความ

**E13 — QC: batch inspect + incoming lot inspect** (คงเดิม) (ECP-015,016,017)
- ไฟล์: `modules/qc` + FE | ขึ้นกับ: E11, E8 | DoD: Approve/Reject batch+audit, reject→PO "รอผลิตใหม่", กันอนุมัติซ้ำ, filter สถานะ+ปฏิเสธ role, incoming lot QC gate การเลือก Lot

**E14 — Shipping** (คงเดิม) (ECP-018,019)
- ไฟล์: `modules/shipping` + FE | ขึ้นกับ: E13 | DoD: Shipment เฉพาะ Batch=QCApproved (กรอง reject, ปฏิเสธ pending แม้เรียกตรง), Shipped→Delivered ห้ามข้ามขั้น, วันที่ส่ง ≤ วันนี้, อัปเดต PO

**E15 — Invoice (issue v1 + VAT snapshot) + Payment** **[CHANGED]** (ECP-020,021,022)
- ไฟล์: `modules/invoice` + FE | ขึ้นกับ: E14, E19, **E21 (VATConfig)** | Stories: ECP-020,021,022
- DoD: `POST /pos/:id/invoice` ออก **version 1 (parent=null)** จาก PO=Shipped, **subtotal=Σ(qty×unit_price), ดึง rate ปัจจุบันจาก VATConfig → snapshot `vat_rate_applied`, คำนวณ vat_amount=round(subtotal×rate/100,2), total=subtotal+vat (ECP-020 AC1)**;
  block ออกสายซ้ำต่อ PO → ชี้ไป revise (ECP-020 AC2), block ถ้ายังไม่ Shipped (AC3);
  payment full/partial คำนวณคงค้างจาก **total_amount ของ version ล่าสุด** (ECP-021 AC1/AC2), ห้ามเกินคงค้าง (AC3); รายการ+filter+ปฏิเสธ role (ECP-022)

**E20 — Invoice versioning + Payment reconciliation** **[NEW]** (ECP-037, §5.4/§5.5)
- ไฟล์: `modules/invoice` (revise service, versions query, reconciliation) + FE (timeline versions) | ขึ้นกับ: E15
- Stories: **ECP-037 (AC1-AC4)** | task-level acceptance:
  - `POST /invoices/:id/revise`: แก้ได้เฉพาะ **version ล่าสุดของสาย** → สร้าง `version = n+1`, `parent_invoice_id = id ของ v(n)`, snapshot VAT rate ปัจจุบันใหม่, ตั้ง v(n) = **Superseded (read-only)** (ECP-037 AC1)
  - `GET /pos/:id/invoice/versions`: คืนทั้งสายเรียงเวลา + ป้าย "ถูกแทนที่โดย vN เมื่อ [เวลา] โดย [ผู้แก้]"; version เก่าเปิดดูได้ครบไม่ถูกเขียนทับ (ECP-037 AC2)
  - แก้ version ที่ไม่ใช่ล่าสุด → block + ลิงก์ไป version ล่าสุด (ECP-037 AC3)
  - version ต้องมี ≥1 line มิฉะนั้น block (ECP-037 AC4)
  - **Payment reconciliation (§5.5):** payment ผูก chain (invoice_chain_key), carry-over เมื่อมี version ใหม่, recompute status (Issued/PartiallyPaid/Paid) จาก Σpayment vs total ของ version ล่าสุด, ธง `overpaid` + เตือนเมื่อ total ใหม่ < ยอดจ่าย, เตือนก่อน revise ถ้ามี payment แล้ว
  - **นโยบาย `INVOICE_EDIT_AFTER_PAYMENT` (config)**: default = allow (BA default); เปลี่ยนเป็น block ได้ด้วย config เดียว — **⚠ UAT ต้องยืนยันกับปอนด์** (ดู Q7/E)
  - audit `ReviseInvoice` (E5)

**E21 — VATConfig + Admin Portal (VAT settings)** **[NEW]** (ECP-038)
- ไฟล์: `modules/user`(vat-config service) หรือ `modules/vat-config` + FE `pages/admin/*` | ขึ้นกับ: E3
- Stories: **ECP-038 (AC1-AC3)** | task-level acceptance:
  - `GET/PUT /admin/vat-config` (permission `admin.manage_vat_config`, Admin only)
  - PUT บันทึก rate ใหม่ (0–100 validate; นอกช่วง → error "อัตรา VAT ต้องอยู่ระหว่าง 0% ถึง 100%" คงค่าเดิม, ECP-038 AC3)
  - ค่าใหม่มีผลกับ invoice ที่ออกใหม่เท่านั้น (E15 อ่านตอนออกเอกสาร) — invoice เดิม snapshot ไม่เปลี่ยน (ECP-038 AC2)
  - FE: ส่วน "ตั้งค่า VAT" อยู่ **หน้าเดียวกับจัดการผู้ใช้งาน** (route `/admin`, ECP-038 AC1)
  - audit `UpdateVATConfig` (E5)

**E16 — Dashboard APIs** (คงเดิม) (ECP-027–033)
- ไฟล์: `modules/dashboard` + FE 7 หน้า | ขึ้นกับ: E10,E8,E11,E13,E14,E15,E5 | DoD: aggregation ตรงจริง, empty state, RBAC, dashboard คลัง real-time, admin ครบ 7 role รวม 0 คน

### กลุ่ม Frontend cross-cutting

**E17 — FE foundation: ui/ wrapper + router + auth/permission guard + apiClient + socket + error UX + layout/menu + onboarding** **[CHANGED]** (ADR-008 rev.2)
- ไฟล์: `src/frontend/ui/*` (**wrapper layer**), `lib/*`, `hooks/*`, `components/*`, `App.tsx`, `router.tsx`, `.eslintrc`
- Stories: **ECP-034, ECP-036** (+ ฐานทุกหน้า) | ขึ้นกับ: E2, E3
- DoD: **สร้าง `ui/` ห่อ antd (Button/DataTable/Form/Modal/StatusTag/Notify/Tooltip/OnboardingTour/Steps/Layout/Menu/theme)**;
  **ESLint `no-restricted-imports` ห้าม import antd นอก `ui/`** (CI/lint ผ่าน);
  business logic อยู่ใน hooks ไม่พึ่ง antd; เมนู/home ตาม permission (ECP-034 AC1), onboarding tour ครั้งแรก (AC2), role ว่าง → ติดต่อ Admin (AC3);
  error ไทยไม่โผล่ technical ผ่าน `ui/Notify` (ECP-036); **FE refetch `/auth/me` เป็นระยะ/เมื่อ 401-403 เพื่อ sync เมนูภายในกรอบ TTL (ADR-005 rev.2)**;
  socket client invalidate React Query + fallback polling

> FE ของแต่ละโดเมนรวมใน E6/E10/E11/E13/E14/E15/E20/E21/E16 (ที่ระบุ "+ FE") ใช้ฐานจาก E17

**ลำดับแนะนำ**: E0 → E1 → (E19, E2) → (E3, E5, E7) → E4 → **E21** → E6 → E8 → E9 → E10 → E11 → (E12, E13) → E14 → E15 → **E20** → E16 ; E17 เริ่มขนานหลัง E2/E3
(E21 ก่อน E15 เพราะ E15 ต้องอ่าน VATConfig; E20 หลัง E15)

---

## B. Story → Task Coverage (ครบ ECP-001–038)

| Story | Engineer task | Story | Engineer task |
|---|---|---|---|
| ECP-001 | **E6 (+E19 auto-gen)** | ECP-020 | **E15 (VAT snapshot)** |
| ECP-002 | E6 | ECP-021 | E15 |
| ECP-003 | E6 | ECP-022 | E15 |
| ECP-004 | E10 (+E9,E19) | ECP-023 | **E4 (+E19 auto-gen)** |
| ECP-005 | E10 | ECP-024 | E3 |
| ECP-006 | E10 (+E13,E14,E15) | ECP-025 | E2,E5 |
| ECP-007 | E8 | ECP-026 | E5 |
| ECP-008 | E8 (+E19) | ECP-027 | E16 |
| ECP-009 | E9 | ECP-028 | E16 (+E8) |
| ECP-010 | **E8 (AC4→E8 reconciliation, Q7)** | ECP-029 | E16 |
| ECP-011 | E11 | ECP-030 | E16 |
| ECP-012 | E11 | ECP-031 | E16 |
| ECP-013 | E11 (+E19) | ECP-032 | E16 |
| ECP-014 | E12 | ECP-033 | E16 |
| ECP-015 | E13 | ECP-034 | E17 |
| ECP-016 | E13 | ECP-035 | (UAT — QA, §C Q6) |
| ECP-017 | E13 | ECP-036 | E17 (+E2 error กลาง) |
| ECP-018 | E14 | **ECP-037** | **E20 [NEW]** |
| ECP-019 | E14 | **ECP-038** | **E21 [NEW]** |

ทุก story ECP-001–038 มี ≥1 engineer task (ECP-035 = usability UAT ที่ QA รัน).

---

## C. QA Tasks (ทำขนานกับ Engineer)

**Q1 — Unit: business logic ล้วน** **[CHANGED]**
- ครอบคลุม: BOM check (ECP-009), reservation/release math (ECP-010 AC1/AC2), **invoice subtotal/VAT snapshot math: vat=round(subtotal×rate/100,2), total (ECP-020 AC1)**, payment คงค้าง/เกิน (ECP-021), state transition ที่ห้าม (ECP-005/019/020 AC3), **invoice versioning rules: revise เฉพาะ version ล่าสุด, ≥1 line, parent chain (ECP-037 AC3/AC4)**, **VAT rate validate 0–100 (ECP-038 AC3)**, number format+padding (ADR-006 rev.2)
- test data: material/BOM คงที่, invoice/payment ตัวอย่าง, ชุด VAT rate (7/10/0/-5/150)

**Q2 — Integration: API + DB (transaction/real-time correctness)** **[CHANGED]**
- ครอบคลุม: goods receipt→balance/ledger atomic, confirm PO reserve+emit, cancel คืนครั้งเดียว, produce หัก physical+block เบิกเกิน, QC→shipment gate, **invoice issue v1 VAT snapshot (ECP-020)**, **revise→v2+Superseded+parent (ECP-037 AC1/AC2), block แก้ version เก่า (AC3)**, **payment reconciliation carry-over + overpaid flag (§5.5)**, **VATConfig PUT → invoice ใหม่ใช้ rate ใหม่, invoice เดิม snapshot ไม่เปลี่ยน (ECP-038 AC1/AC2)**, audit append-only (ECP-026 AC3), RBAC 403 (รวม `admin.manage_vat_config`, `invoice.revise`), guardrail lockout (ECP-024 AC2), traceability หลาย Lot/Batch (ECP-014)
- test data: seed §8 + WebSocket test client

**Q3 — E2E: demo flow** **[CHANGED]**
- ครอบคลุม: flow ECP-004→...→020→021 ครบ **รวม VAT ในยอด invoice**, **demo revise invoice → v2 timeline (ECP-037)**, **Admin ตั้งค่า VAT ในหน้าเดียวกับจัดการผู้ใช้ (ECP-038 AC1)**, timeline PO 5 สถานะ, stock update real-time ไม่ refresh, เมนูตาม role+onboarding
- test data: seed reset ก่อนรัน

**Q4 — Real-time & timing metrics (KPI)** (คงเดิม)
- stock update ≤1 นาที, traceability ≤5 นาที, insufficient-stock alert 100% ของ test case

**Q5 — Error message audit (ECP-036)** (คงเดิม)
- ทุก error case แสดงไทยชัด ไม่มี null/undefined/stack/ศัพท์เทคนิค (0 หลุด) — **รวมข้อความใหม่ของ ECP-037/038**

**Q6 — Usability UAT (ECP-035, KPI#5)** (คงเดิม)
- manual UAT ≥80% ทำจบเอง; **Dependency (ECP-035 AC3): QA ถามปอนด์ "จำนวนผู้ใช้ทดสอบต่อ role" ก่อน UAT** — ไม่ block เริ่มโค้ด

**Q7 — Concurrency, accuracy & permission-TTL** **[NEW]**
- ระดับ: integration (+ script ยิงขนาน)
- ครอบคลุม:
  - **Stock ledger accuracy 100% (ECP-010 AC4):** ยิงธุรกรรมพร้อมกันจำนวนมาก (receipt/reserve/release/issue) หลายผู้ใช้ → `GET /stock/reconciliation` Σledger = physical **ตรง 100% ไม่มีส่วนต่าง** (ยืนยัน row-lock §NFR N1 ทำงาน)
  - **NumberSequence concurrency (ADR-006 rev.2):** ยิงสร้างเอกสาร/customer/user พร้อมกัน → **ไม่มีเลขซ้ำ** ทุกชนิด
  - **Permission TTL ≤5 นาที (ADR-005 rev.2, ECP-023 AC2/ECP-024):** เปลี่ยน role/permission ของ user ที่ login ค้าง → สิทธิ์ใหม่มีผล **ภายใน ≤ PERMISSION_CACHE_TTL (≤5 นาที) โดยไม่ re-login**; ยืนยัน invalidate เชิงรุกก็มีผลเกือบทันที
  - **Reconciliation Payment↔version (§5.5):** revise invoice หลังชำระบางส่วน → payment คงอยู่, outstanding คำนวณจาก total ใหม่, overpaid flag เมื่อ total ใหม่ < ยอดจ่าย
- test data: seed §8 + ชุด concurrency script; **⚠ ผล reconciliation Payment↔version ติดป้ายให้ปอนด์ยืนยัน default (allow-edit-after-payment) ช่วง UAT**

### AC → Test level (สรุป)
- กฎ/คำนวณ/validation (รวม VAT, versioning rules) → **Q1** ; transaction/RBAC/audit/real-time/reconciliation → **Q2**
- flow ผู้ใช้ + timeline + menu + revise + VAT config → **Q3** ; KPI ตัวเลข → **Q4**
- error → **Q5** ; usability → **Q6** ; **concurrency/accuracy/permission-TTL → Q7**

ทุก AC ของ ECP-001–038 ถูก assign ≥1 ระดับ (happy→Q1/Q2/Q3, edge→Q1/Q2/Q7, error→Q2/Q5; accuracy/concurrency/TTL→Q7).

---

## D. DevOps Tasks

**D1 — Local dev environment (Docker Compose)** (คงเดิม) — Node LTS + MySQL 8, volume, hot-reload

**D2 — Config & secrets (.env)** **[CHANGED]**
- ตัวแปร: `DATABASE_URL`, `JWT_SECRET`, `PORT`, `NODE_ENV`, `CORS_ORIGIN`, **`SESSION_TTL` (default 8h)**, **`PERMISSION_CACHE_TTL` (default 60s, clamp ≤300s — ADR-005 rev.2)**, **`VAT_DEFAULT_RATE` (default 7.00 สำหรับ seed — ADR/ECP-038)**, **`INVOICE_EDIT_AFTER_PAYMENT` (default allow — §5.5)**, (เผื่อ) `SEQ_*` format
- DoD: `.env.example` ครบทุกตัว, ไม่มี secret hardcode; config loader **clamp PERMISSION_CACHE_TTL ≤300s**

**D3 — DB migration & seed automation** (คงเดิม) — `prisma migrate deploy` + `db seed` ใน entrypoint; seed reset ได้ (รวม VATConfig=7)

**D4 — Build/run scripts** (คงเดิม) — dev/build(tsc+vite+prisma generate)/start; **lint (ESLint no-restricted-imports antd) เป็นส่วนของ CI/build (ADR-008 rev.2)**

**D5 — Phase 3 readiness note** **[CHANGED]** (บันทึกอย่างเดียว)
- mapping: local MySQL → Cloud SQL, container → Cloud Run, Socket.IO → +Redis adapter, audit DB-immutability,
  **permission cache → shared cache/pub-sub invalidation (ถ้าต้องการทันทีข้าม instance; ปัจจุบัน TTL ≤5 นาที converge อยู่แล้ว)**,
  **NumberSequence → sharded/hi-lo ถ้า throughput สูงมาก** — เป็น backlog Phase 3 ไม่ทำในรอบนี้

---

## E. หมายเหตุ open items (ไม่ block เริ่มโค้ด — มี default ชัด)
1. **QA/QC ต้อง Approve ก่อน Shipment เสมอ** — default GMP, ปอนด์ยืนยันช่วง UAT
2. **จำนวนผู้ใช้ทดสอบ UAT ต่อ role** (ECP-035 AC3) — QA ถามปอนด์ตอนวางแผน UAT
3. **⚠ Payment↔invoice-version: แก้ไข invoice ที่ชำระแล้วได้หรือไม่** — default = allow (BA/§5.5), เปลี่ยนได้ด้วย config
   `INVOICE_EDIT_AFTER_PAYMENT`; **ติดป้ายให้ปอนด์ยืนยันช่วง UAT** (Q7). Engineer ไม่ต้องเดา — implement ตาม default
4. **format Customer/User/เอกสาร** — กำหนดชัดใน ADR-006 rev.2 แล้ว (ปอนด์ยืนยันได้ที่ UAT, บันทึกลง CLAUDE.md เมื่อ final)
