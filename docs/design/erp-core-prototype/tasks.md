# Task Breakdown — ERP Core Prototype

- **slug**: `erp-core-prototype`
- **สถานะ**: Proposed — รอ Human Gate 1
- **อ้างอิง**: architecture.md, ADR-001–008, user-stories.md (ECP-001–036)

> Engineer และ QA ทำงาน **ขนานกันได้**: QA เขียน test plan/automation จาก AC + API contract
> (§6 architecture) โดยไม่ต้องรอโค้ดเสร็จ. ลำดับ dependency ด้านล่างใช้จัดคิว Engineer เป็นหลัก.

---

## A. Engineer Tasks

รูปแบบ: **ID — งาน | โมดูล/ไฟล์ | Stories | ขึ้นกับ | นิยาม "เสร็จ" (DoD)**

### กลุ่ม Foundation (ต้องเสร็จก่อนโดเมน)

**E0 — Project scaffolding**
- ไฟล์: `package.json`, `tsconfig`, `src/backend/app.ts|server.ts`, `src/frontend` (Vite),
  `.env.example`, `Dockerfile.*`, `docker-compose.yml`
- Stories: (เอื้อทั้งหมด) | ขึ้นกับ: —
- DoD: `npm run dev` ยก backend+frontend+MySQL (compose) ได้, health endpoint ตอบ 200,
  env อ่านจาก config ไม่ hardcode (ADR-001)

**E1 — Prisma schema + migration + seed**
- ไฟล์: `prisma/schema.prisma`, `prisma/migrations/*`, `prisma/seed.ts`
- Stories: รองรับ Data Rules ทุก entity (§3) | ขึ้นกับ: E0
- DoD: `prisma migrate` สร้างครบทุกตาราง §3.1, `prisma db seed` โหลด mock data ตามกลยุทธ์ §8
  (รวมเคส BOM ขาด, stock ต่ำ, stock=0, flow สำเร็จ 1 ชุด) และรันซ้ำได้ (idempotent)

**E19 — NumberSequence service (ADR-006)**
- ไฟล์: `src/backend/lib/numberSequence.ts`, ตาราง `NumberSequence`
- Stories: ECP-004,013,018,020 (เลข PO/Batch/Shipment/Invoice) | ขึ้นกับ: E1
- DoD: ออกเลขตาม format ADR-006 ภายใน tx เดียวกับเอกสาร, ไม่ซ้ำเมื่อเรียกพร้อมกัน (ทดสอบ concurrency)

**E2 — Auth (JWT + bcrypt) + middleware pipeline (ADR-002,005)**
- ไฟล์: `middleware/{requestId,auth,errorHandler}.ts`, `modules/user` (login/logout/me), `lib/errors.ts`
- Stories: ECP-025 (login log hook), ECP-036 (error กลางไทย) | ขึ้นกับ: E1
- DoD: login ออก JWT (httpOnly cookie) ฝัง permission snapshot, `/auth/me` คืน user+permission,
  รหัสผ่าน bcrypt, errorHandler แปลง error เป็น `{error:{code,message(ไทย),fields}}`

**E3 — RBAC: permission matrix + `requirePermission` + config API (ADR-005)**
- ไฟล์: `middleware/requirePermission.ts`, `modules/user` (roles/permissions)
- Stories: **ECP-024** (config สิทธิ์ผ่านหน้าจอ), รองรับ AC3 ของ ECP-016/022/027–033 | ขึ้นกับ: E2
- DoD: middleware ปฏิเสธ 403 เมื่อไม่มีสิทธิ์ (แม้เรียก URL ตรง), แก้ permission ผ่าน API มีผล
  login ถัดไป, **guardrail กัน lockout `manage_permission`** (ECP-024 AC2) ทำงาน

**E4 — User Management (ECP-023)**
- ไฟล์: `modules/user`
- Stories: ECP-023 | ขึ้นกับ: E3
- DoD: สร้าง/แก้ user + assign role, username ซ้ำถูกปฏิเสธ (AC3), role ใหม่มีผล login ถัดไป (AC2)

**E5 — Audit log core (ADR-007)**
- ไฟล์: `middleware/audit.ts`, `modules/audit`
- Stories: ECP-025, ECP-026 | ขึ้นกับ: E2
- DoD: บันทึก login สำเร็จ+ล้มเหลว (ECP-025 AC1/AC2), interceptor เขียน action สำคัญ,
  write-fail ไม่เงียบ (retry+system log, AC3), `GET /audit-logs` filter+pagination,
  **ไม่มี path ใด update/delete audit ได้** (ECP-026 AC3)

### กลุ่ม Master data & Stock (หัวใจ real-time)

**E6 — Customer module (ECP-001,002,003)**
- ไฟล์: `modules/customer` + FE pages | ขึ้นกับ: E3
- DoD: CRUD + ค้นหา, required field validation (AC3), เตือนชื่อซ้ำไม่ block (ECP-001 AC2),
  เตือนเมื่อ inactive ทั้งที่มี PO เปิด (ECP-002 AC2), แสดงประวัติ PO (ECP-003)

**E7 — Master: Product / RawMaterial / BOM (support)**
- ไฟล์: `modules/stock` (master) หรือ `modules/product` | ขึ้นกับ: E1
- DoD: อ่าน master + BOM ได้ (ส่วนใหญ่มาจาก seed), รองรับเคส product ไม่มี BOM

**E8 — Stock core: balance + ledger + realtimeGateway + goods receipt (ADR-004)**
- ไฟล์: `modules/stock` (balance, transaction, receipt), `lib/realtimeGateway.ts`, socket server
- Stories: **ECP-007, ECP-008, ECP-010** | ขึ้นกับ: E1, E19
- DoD: goods receipt สร้าง Lot + physical += ใน tx + StockTxn (ECP-008; AC2 lot ซ้ำถามยืนยัน,
  AC3 qty≤0 block), แยก physical/reserved/available (ECP-010), emit `stock.changed`,
  หน้า stock อัปเดต ≤1 นาทีไม่ refresh (ECP-007 AC1), แสดงยอด 0 + "หมดสต็อก" (AC2),
  error state คงเวลาล่าสุด (AC3), เบิกเกิน physical ถูกปฏิเสธ (ECP-010 AC3)

**E9 — BOM stock check (ECP-009)**
- ไฟล์: `modules/stock` (check service) | ขึ้นกับ: E7, E8
- DoD: คำนวณ need = Σ(qty_per_unit×order_qty) เทียบ available, ระบุเฉพาะ material ที่ขาด
  (ชื่อ+จำนวนขาด, AC2), block ถ้าไม่มี BOM (AC3)

### กลุ่ม Order-to-Cash flow

**E10 — PO module: create/confirm(reserve)/cancel/timeline**
- ไฟล์: `modules/po` + FE | Stories: **ECP-004, ECP-005, ECP-006** | ขึ้นกับ: E6, E9, E19
- DoD: create Draft (≥1 line, ECP-004 AC3), confirm → เช็ค stock + reserve ใน tx + emit
  (AC1/AC2 block เมื่อไม่พอ), cancel คืน reservation ครั้งเดียว (ECP-005 AC1/AC3), block cancel
  เมื่อ InProduction (AC2), timeline 5 สถานะ + วันเวลา (ECP-006 AC1), แสดง "รอผลิตใหม่" เมื่อ QC
  reject (AC2), ไม่พบ PO → ข้อความชัด (AC3)

**E11 — Production: queue + assign + produce(batch) + issue stock**
- ไฟล์: `modules/production` + FE | Stories: **ECP-011,012,013** | ขึ้นกับ: E10, E8
- DoD: queue จาก PO Confirmed เรียงตาม delivery date (ECP-011), assign สร้าง ProductionOrder
  (ECP-012; AC2 assign ซ้ำถามยืนยัน, AC3 ไม่มี operator → ข้อความ), produce สร้าง Batch+เลข,
  ผูกหลาย Lot (BatchLotUsage, ECP-013 AC2), เบิก physical ใน tx + emit, block ถ้าไม่เลือก Lot (AC3)

**E12 — Traceability (ECP-014)**
- ไฟล์: `modules/stock` (trace) หรือ `modules/production` | ขึ้นกับ: E11
- DoD: ค้นด้วย Lot → คืน Lot→Batch(หลาย)→FG→PO ครบสาย (AC1 ≤5 นาที = ตอบเร็ว), หลาย Batch ต่อ Lot
  (AC2), Lot ไม่มี → ข้อความ (AC3)

**E13 — QC: batch inspect + incoming lot inspect (ECP-015,016,017)**
- ไฟล์: `modules/qc` + FE | ขึ้นกับ: E11, E8
- DoD: Approve/Reject batch เปลี่ยนสถานะ + audit (ECP-015; AC2 reject → PO "รอผลิตใหม่",
  AC3 กันอนุมัติซ้ำ), รายการ+filter สถานะ (ECP-016; AC3 ปฏิเสธ role ไม่มีสิทธิ์),
  incoming lot QC gate การเลือก Lot ผลิต (ECP-017)

**E14 — Shipping (ECP-018,019)**
- ไฟล์: `modules/shipping` + FE | ขึ้นกับ: E13
- DoD: สร้าง Shipment เฉพาะ Batch=QCApproved (ECP-018; AC2 กรอง reject ออก, AC3 ปฏิเสธ pending
  แม้เรียกตรง), update สถานะ Shipped→Delivered ห้ามข้ามขั้น (ECP-019 AC2), วันที่ส่ง ≤ วันนี้ (AC3),
  อัปเดตสถานะ PO (ECP-006)

**E15 — Invoice + Payment (ECP-020,021,022)**
- ไฟล์: `modules/invoice` + FE | ขึ้นกับ: E14, E19
- DoD: ออก invoice จาก PO Shipped, amount=Σ(qty×unit_price) ไม่มี VAT, 1 ใบ/PO (ECP-020 AC2),
  block ถ้ายังไม่ Shipped (AC3), payment full/partial คำนวณคงค้าง (ECP-021 AC1/AC2), ห้ามเกินคงค้าง
  (AC3), รายการ+filter (ECP-022; AC3 ปฏิเสธ role)

**E16 — Dashboard APIs (ECP-027–033)**
- ไฟล์: `modules/dashboard` + FE 7 หน้า | ขึ้นกับ: E10,E8,E11,E13,E14,E15,E5
- DoD: aggregation ต่อ role ตรงข้อมูลจริง, empty state มีคำแนะนำ (ทุก AC2), RBAC ปฏิเสธ role อื่น
  (ทุก AC3), dashboard คลัง real-time (ECP-028 AC2), dashboard admin แสดงครบ 7 role รวม 0 คน (ECP-033)

### กลุ่ม Frontend cross-cutting

**E17 — FE foundation: router, auth/permission guard, apiClient, socket, error UX, layout/menu, onboarding**
- ไฟล์: `src/frontend/lib/*`, `components/*`, `App.tsx`, `router.tsx`
- Stories: **ECP-034, ECP-036** (+ เป็นฐานของทุกหน้า) | ขึ้นกับ: E2, E3
- DoD: เมนู/home ตาม permission (ECP-034 AC1), onboarding tour ครั้งแรก (AC2), role ว่างเปล่า
  → ข้อความติดต่อ Admin (AC3), error กลางเป็นไทยไม่โผล่ technical (ECP-036 AC1/AC2),
  socket client invalidate React Query + fallback polling (ADR-004)

> FE ของแต่ละโดเมนรวมอยู่ในงาน E6/E10/E11/E13/E14/E15/E16 ที่ระบุ "+ FE" แล้ว โดยใช้ฐานจาก E17

**ลำดับแนะนำ**: E0 → E1 → (E19, E2) → (E3, E5, E7) → E4 → E6 → E8 → E9 → E10 → E11 →
(E12, E13) → E14 → E15 → E16 ; E17 เริ่มขนานได้หลัง E2/E3

---

## B. Story → Task Coverage (ครบ ECP-001–036)

| Story | Engineer task | Story | Engineer task |
|---|---|---|---|
| ECP-001 | E6 | ECP-019 | E14 |
| ECP-002 | E6 | ECP-020 | E15 |
| ECP-003 | E6 | ECP-021 | E15 |
| ECP-004 | E10 (+E9,E19) | ECP-022 | E15 |
| ECP-005 | E10 | ECP-023 | E4 |
| ECP-006 | E10 (+E13,E14,E15) | ECP-024 | E3 |
| ECP-007 | E8 | ECP-025 | E2,E5 |
| ECP-008 | E8 (+E19) | ECP-026 | E5 |
| ECP-009 | E9 | ECP-027 | E16 |
| ECP-010 | E8 | ECP-028 | E16 (+E8) |
| ECP-011 | E11 | ECP-029 | E16 |
| ECP-012 | E11 | ECP-030 | E16 |
| ECP-013 | E11 (+E19) | ECP-031 | E16 |
| ECP-014 | E12 | ECP-032 | E16 |
| ECP-015 | E13 | ECP-033 | E16 |
| ECP-016 | E13 | ECP-034 | E17 |
| ECP-017 | E13 | ECP-035 | (UAT — QA, ดู C) |
| ECP-018 | E14 | ECP-036 | E17 (+E2 error กลาง) |

ทุก story มี ≥1 engineer task รองรับ (ECP-035 = usability UAT ที่ QA รัน ไม่ใช่ feature โค้ด
แต่ทุกหน้าจอที่ UAT ใช้มาจาก E6–E17)

---

## C. QA Tasks (ทำขนานกับ Engineer — เขียนจาก AC + API contract)

รูปแบบ: **ระดับที่ automate | ขอบเขต | test data ที่ต้องใช้**

**Q1 — Unit: business logic ล้วน**
- ระดับ: **unit** (service functions, ไม่แตะ DB จริงได้ด้วย mock/prisma test)
- ครอบคลุม AC เชิงกฎ: BOM check คำนวณ need/ขาด (ECP-009 AC1/AC2), reservation/release math
  (ECP-010 AC1/AC2), invoice amount=Σ(qty×price) (ECP-020), payment คงค้าง/เกิน (ECP-021 ทุก AC),
  state machine transition ที่ห้าม (ECP-005 AC2, ECP-019 AC2, ECP-020 AC3), number format (ADR-006)
- test data: ชุด material/BOM ตัวเลขคงที่, invoice/payment ตัวอย่าง

**Q2 — Integration: API + DB (transaction/real-time correctness)**
- ระดับ: **integration** (ยิง endpoint จริง + MySQL test schema + seed)
- ครอบคลุม: goods receipt → balance/ledger atomic (ECP-008,007), confirm PO reserve +
  emit event (ECP-004,010), cancel คืนครั้งเดียว (ECP-005 AC3), produce หัก physical + block
  เบิกเกิน (ECP-013,010 AC3), QC approve/reject → shipment gate (ECP-015,018), invoice/payment
  flow (ECP-020,021), audit append-only (ECP-026 AC3 ลอง DELETE/PUT → 403), RBAC 403 เมื่อเรียก
  URL ตรง (ECP-016/022/027–033 AC3), guardrail lockout (ECP-024 AC2), traceability หลาย Lot/Batch
  (ECP-014 AC1/AC2)
- test data: seed §8 + ผูก WebSocket test client ฟัง `stock.changed`

**Q3 — E2E: end-to-end demo flow (DoD หลัก)**
- ระดับ: **e2e** (Playwright/Cypress ผ่าน UI)
- ครอบคลุม: flow ECP-004→009→010→011→012→013→015→018→020→021 ครบไม่สะดุด (DoD ข้อ 1),
  timeline PO 5 สถานะ (ECP-006 AC1), stock หน้าจอ update real-time หลังทำธุรกรรมโดยไม่ refresh
  (ECP-007 AC1 / ECP-028 AC2), เมนูตาม role + onboarding (ECP-034)
- test data: seed reset ก่อนรัน

**Q4 — Real-time & timing metrics (KPI)**
- ระดับ: integration + e2e วัดเวลา
- ครอบคลุม: stock update ≤1 นาที (KPI#1, ECP-007), traceability ≤5 นาที/ตอบเร็ว (KPI#2, ECP-014),
  insufficient-stock alert 100% ของ test case (KPI#4, ECP-004 AC2/ECP-009) — ออกแบบชุด test case
  ให้ครบทุก material-shortage pattern
- test data: material ยอดต่ำ/เป็น 0/พอ (จาก seed §8)

**Q5 — Error message audit (ECP-036)**
- ระดับ: e2e/สแกน UI ทุกหน้าที่มี error case
- ครอบคลุม: ทุก error case ใน AC ของ story อื่น แสดงข้อความไทยชัด ไม่มี null/undefined/stack/
  ศัพท์เทคนิค (ECP-036 AC1/AC2/AC3 = 0 รายการหลุด)

**Q6 — Usability UAT (ECP-035, KPI#5)**
- ระดับ: manual UAT (ไม่ automate) — QA ออกแบบ scenario task หลักต่อ role, วัด ≥80% ทำจบเอง
  โดยไม่ training, บันทึกจุดติดขัดเป็น user journey data (ECP-035 AC2)
- **Dependency (ECP-035 AC3)**: QA ต้องถามปอนด์ "จำนวนผู้ใช้ทดสอบต่อ role" ก่อนวางแผน UAT
  — เป็น open item ของ QA ตอนใกล้ UAT **ไม่ block Gate 1 / ไม่ block เริ่มโค้ด**

### AC → Test level (สรุป)
- กฎ/คำนวณ/validation → **Q1 unit**
- transaction, RBAC, audit, real-time correctness → **Q2 integration**
- flow ผู้ใช้จริง + timeline + menu → **Q3 e2e**
- KPI ตัวเลข (≤1 นาที/≤5 นาที/100%) → **Q4**
- ข้อความ error → **Q5** ; usability → **Q6 UAT**

ทุก AC ของ ECP-001–036 ถูก assign อย่างน้อย 1 ระดับ (happy→Q1/Q2/Q3, edge→Q1/Q2, error→Q2/Q5).

---

## D. DevOps Tasks (สภาพแวดล้อม/ config — Phase 2 local, ไม่ปิดทาง Phase 3)

**D1 — Local dev environment (Docker Compose)**
- Node.js LTS + MySQL 8 ผ่าน `docker-compose.yml`, volume สำหรับ MySQL, hot-reload backend/frontend
- DoD: `docker compose up` แล้วเข้าใช้งานได้ครบ

**D2 — Config & secrets (.env)**
- ตัวแปร: `DATABASE_URL`, `JWT_SECRET`, `PORT`, `NODE_ENV`, `CORS_ORIGIN`, (เผื่อ) `SEQ_*` format
- DoD: `.env.example` ครบทุกตัว, ไม่มี secret hardcode (ADR-001)

**D3 — DB migration & seed automation**
- รัน `prisma migrate deploy` + `prisma db seed` ใน entrypoint/สคริปต์ setup
- DoD: เครื่องใหม่ setup ครบใน 1 คำสั่ง, seed reset ได้สำหรับ demo/UAT รอบใหม่

**D4 — Build/run scripts**
- scripts: dev, build (tsc + vite build + prisma generate), start
- DoD: build ผ่าน, frontend เป็น static build เสิร์ฟได้

**D5 — Phase 3 readiness note (ไม่ลงมือ ทำแค่บันทึก)**
- ระบุ mapping: local MySQL → Cloud SQL, container → Cloud Run, Socket.IO → +Redis adapter
  (ADR-004), audit DB-immutability hardening (ADR-007) — เป็น backlog Phase 3 ไม่ทำใน prototype

---

## E. หมายเหตุ open items (ไม่ block Gate 1)
1. **ADR-006 number format** — ต้องให้ปอนด์ยืนยัน/ปรับที่ Gate 1; ถ้าไม่ระบุ ใช้ default
   (Engineer ไม่ต้องเดา — มี default ชัดใน ADR-006)
2. **QA/QC ต้อง Approve ก่อน Shipment เสมอ** — ออกแบบตามนี้ (default GMP), ปอนด์ยืนยันช่วง UAT
3. **จำนวนผู้ใช้ทดสอบ UAT ต่อ role** (ECP-035 AC3) — QA ถามปอนด์ตอนวางแผน UAT
