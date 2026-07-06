# Test Plan — ERP Core Prototype (Order-to-Cash)

- **slug**: `erp-core-prototype`
- **เขียนโดย**: QA — Phase 1 (Plan & Automate, ขนานกับ Engineer)
- **สถานะเอกสาร**: Draft พร้อมรัน (โค้ดจริงยังไม่มี — automation เป็น executable spec รอ Engineer)
- **อ้างอิง**: `docs/requirements/erp-core-prototype/user-stories.md` (ECP-001–038),
  `docs/design/erp-core-prototype/tasks.md` (Q1–Q7), `docs/design/erp-core-prototype/architecture.md` (rev.2),
  ADR-002–008, `docs/requirements/erp-core-prototype/brief.md` (Business Key Value)

> **จุดยืนของ QA เอกสารนี้**: กินความสงสัยเป็นหลัก — ทุก AC ต้องมี test case ที่ "พิสูจน์ได้ว่าพัง"
> ไม่ใช่แค่ยืนยันว่าโค้ดทำงานตาม happy path ทุก edge/error case ในเอกสาร story ถูกแปลงเป็น TC จริง
> และเพิ่ม exploratory case ที่ story ไม่ได้พูดถึงตรงๆ (boundary, malformed input, ลำดับ operation ที่ผิดปกติ)

---

## 0. สมมติฐานด้าน Tooling (การตัดสินใจของ QA — ไม่กระทบ business logic)

tasks.md ไม่ได้ระบุ test framework ชัดเจน (เป็นเรื่อง technical tooling ของ QA) จึงเลือกดังนี้
(Engineer/DevOps ต้องเพิ่ม devDependency ให้ตรงในรอบ E0/D4 — ดู §7 "สิ่งที่ต้องเตรียมให้ automation รันได้จริง"):

| Layer | Tool | เหตุผล |
|---|---|---|
| Unit (Q1) | Jest + ts-jest | มาตรฐาน TS ecosystem, mock ง่าย, เร็ว |
| Integration (Q2, Q7) | Jest + supertest + `socket.io-client` (test client) + Prisma (test DB) | ยิง HTTP ตรงเข้า Express app, ยืนยัน DB state จริงหลัง `$transaction`, subscribe WebSocket event ได้ |
| E2E (Q3, Q4 บางส่วน) | Playwright (+ `@playwright/test`) | รองรับ React SPA จริง, รอ WebSocket push ได้, cross-browser พอสำหรับ prototype |
| Load/concurrency (Q7) | Node script ยิง `Promise.all`/`p-limit` ผ่าน supertest agent หลาย instance พร้อมกัน ภายใน Jest test เดียวกัน | ไม่ต้องพึ่ง external load tool (เกินความจำเป็นสำหรับ prototype) |

โครงสร้างโฟลเดอร์ทดสอบ (ตาม `architecture.md` §2 `└─ tests/`):
```
tests/
├─ unit/            (Q1)
├─ integration/      (Q2)
│  └─ concurrency/  (Q7)
├─ e2e/              (Q3, Q4 UI-level)
└─ helpers/          (fixtures/test client ใช้ร่วม)
```

**ข้อมูลที่ยังไม่มี ณ ตอนเขียนแผนนี้ (ไม่ block — ระบุชัดว่าขาดอะไร):**
- `package.json`/`tsconfig`/CI script ยังไม่มี (E0 ของ Engineer) → automated spec compile ไม่ได้จนกว่า E0 เสร็จ และ QA/DevOps ต้องเพิ่ม `jest.config.ts`, `playwright.config.ts`, script `test:unit`/`test:integration`/`test:e2e`, และ dependency (`jest`,`ts-jest`,`supertest`,`socket.io-client`,`@playwright/test`,`@types/jest`) เข้า `package.json`
- Endpoint response body ที่แน่นอน (field names เป๊ะ) ยังไม่ fix 100% — spec ใช้ shape ตาม architecture.md §6/§3.1 เป็น ground truth ชั่วคราว จะต้องปรับ assertion เล็กน้อยตอน verify phase ถ้า Engineer ตั้งชื่อ field ต่างออกไป (ไม่ถือเป็น defect หากมีการสื่อสาร)
- ยังไม่มี seed reset endpoint/CLI ที่ยืนยันชื่อคำสั่ง — สมมติ `npm run db:seed:reset` ตาม D3 (`prisma migrate reset` + seed) จนกว่า DevOps จะยืนยัน

---

## 1. กลยุทธ์ทดสอบ (สรุปตาม Q1–Q7 ของ tasks.md)

| Task | ระดับ | ขอบเขต | Automatable |
|---|---|---|---|
| **Q1** | Unit | BOM check math, reservation/release math, VAT/invoice math, payment คงค้าง, invoice versioning rule, VAT rate validate, number format/padding, state-transition guard ล้วนๆ (ไม่แตะ DB) | ใช่ 100% |
| **Q2** | Integration | ทุก endpoint สำคัญ + DB transaction correctness + WebSocket emit + RBAC 403 + audit append-only + traceability | ใช่ 100% |
| **Q3** | E2E | Demo flow เต็มสาย, revise invoice timeline, admin VAT config หน้าเดียวกับ manage user, PO timeline 5 สถานะ, stock real-time ไม่ refresh, เมนูตาม role/onboarding | ใช่ ส่วนใหญ่ (ยกเว้นการวัด "ใช้งานง่ายจริงหรือไม่" เชิงอัตวิสัย) |
| **Q4** | Integration/E2E วัดเวลา | stock ≤1 นาที, traceability ≤5 นาที, insufficient-stock alert 100% ของ test case | ใช่ (วัด timestamp/latency อัตโนมัติ) |
| **Q5** | Integration + static scan | ข้อความ error ทุกจุดเป็นไทย ไม่มี null/undefined/stack/ศัพท์เทคนิคหลุด | ใช่บางส่วน (automated string-pattern scan ของ response body ครอบคลุมมาก แต่ "ความเข้าใจง่ายของถ้อยคำ" ต้องมนุษย์ตัดสินสุดท้ายด้วย) |
| **Q6** | Manual UAT | ผู้ใช้ทดสอบใหม่ทำ task จบเอง ≥80% | **ไม่ได้ — ต้องใช้มนุษย์จริงที่ไม่เคยเห็นระบบ**; ต้องการ (ก) ผู้ทดสอบจริงต่อ role (ข) เวลาที่นัดหมาย UAT (ค) baseline scenario script — ดู §5 |
| **Q7** | Integration + concurrency script | stock ledger accuracy 100%, NumberSequence ไม่ซ้ำ, permission TTL ≤5 นาที, payment↔invoice-version reconciliation | ใช่ 100% (เขียนสคริปต์ยิงขนานได้โดยไม่ต้องรอ UI) |

---

## 2. Traceability Matrix — ECP-xxx → TC-xxx (ครบทุก AC)

Legend Level: **U**=Unit, **I**=Integration, **E**=E2E, **C**=Concurrency(Q7), **M**=Manual/UAT.
Automatable: **Y**=ใช่, **P**=Partial (automated ครอบคลุมบางส่วน + ต้องมนุษย์ยืนยันเพิ่ม), **N**=ไม่ได้ (เหตุผลระบุในช่องหมายเหตุ)

### Epic 1: Customer Management

| AC | TC ID | Level | Auto | ไฟล์ / หมายเหตุ |
|---|---|---|---|---|
| ECP-001 AC1 (สร้างลูกค้า, customer_id auto-gen) | TC-001-AC1 | I | Y | `tests/integration/customer.spec.ts` |
| ECP-001 AC2 (ชื่อซ้ำ→เตือนไม่ block) | TC-001-AC2 | I | Y | เดียวกัน |
| ECP-001 AC3 (ชื่อว่าง→error ไทย) | TC-001-AC3 | I | Y | เดียวกัน + `tests/e2e/errorMessageAudit.spec.ts` |
| ECP-001 AC4 (client ส่ง customer_id มาเอง→ถูก strip) | TC-001-AC4 | I | Y | เดียวกัน — ยิง raw payload พร้อม `customer_id` แล้วตรวจว่าค่าที่บันทึกไม่ตรงกับที่ส่ง |
| ECP-002 AC1 (แก้เบอร์โทร) | TC-002-AC1 | I | Y | เดียวกัน |
| ECP-002 AC2 (inactive ทั้งมี PO เปิด→เตือนไม่ block, N ถูกต้อง) | TC-002-AC2 | I | Y | เดียวกัน — ต้อง seed PO เปิดค้างจริงเพื่อนับ N |
| ECP-002 AC3 (ลบอีเมล→ไม่บันทึก data เดิมไม่หาย) | TC-002-AC3 | I | Y | เดียวกัน |
| ECP-003 AC1 (ค้นหา ≤3 วิ พร้อม PO history) | TC-003-AC1 | I | Y | `tests/integration/customer.spec.ts` — วัด response time |
| ECP-003 AC2 (ไม่พบ→ข้อความชัด) | TC-003-AC2 | I | Y | เดียวกัน |
| ECP-003 AC3 (DB timeout→ข้อความ+ปุ่มลองใหม่) | TC-003-AC3 | E | P | ต้อง mock DB timeout จริง — integration-level mock connection error; UI ปุ่ม "ลองใหม่" ต้องตรวจใน e2e |

### Epic 2: Purchasing Order

| AC | TC ID | Level | Auto | หมายเหตุ |
|---|---|---|---|---|
| ECP-004 AC1 (เปิด PO stock พอ→Confirmed+จอง) | TC-004-AC1 | I | Y | `tests/integration/po.spec.ts` |
| ECP-004 AC2 (stock ไม่พอบางส่วน→ block confirm, ระบุชื่อ+จำนวนขาด) | TC-004-AC2 | I | Y | เดียวกัน — ผูกกับ Q4 100% ของ test case |
| ECP-004 AC3 (ไม่มี line→block) | TC-004-AC3 | I | Y | เดียวกัน |
| ECP-005 AC1 (cancel Confirmed→คืน stock) | TC-005-AC1 | I | Y | เดียวกัน |
| ECP-005 AC2 (cancel InProduction→block) | TC-005-AC2 | I | Y | เดียวกัน |
| ECP-005 AC3 (cancel ซ้ำ→ไม่คืนซ้ำสอง) | TC-005-AC3 | I | Y | เดียวกัน — ยืนยันด้วย `GET /stock/reconciliation` ว่ายอดไม่เพิ่มซ้ำ |
| ECP-006 AC1 (timeline 5 สถานะ) | TC-006-AC1 | I/E | Y | `tests/integration/po.spec.ts` + `tests/e2e/demoFlow.spec.ts` |
| ECP-006 AC2 (QC Rejected→"รอผลิตใหม่"+เหตุผล) | TC-006-AC2 | I | Y | เดียวกัน |
| ECP-006 AC3 (PO ID ไม่มีจริง→ข้อความชัดไม่ error 500) | TC-006-AC3 | I | Y | เดียวกัน |

### Epic 3: Stock & Real-time Inventory

| AC | TC ID | Level | Auto | หมายเหตุ |
|---|---|---|---|---|
| ECP-007 AC1 (real-time ≤1 นาที ไม่ refresh) | TC-007-AC1 | E | Y | `tests/e2e/realtimeStock.spec.ts` — วัดเวลาโดยจับ event ผ่าน socket + DOM update |
| ECP-007 AC2 (ยอด 0 → แสดง "หมดสต็อก" ไม่ซ่อนแถว) | TC-007-AC2 | I/E | Y | `tests/integration/stock.spec.ts` |
| ECP-007 AC3 (DB ขัดข้อง→ข้อความ+เวลาล่าสุด) | TC-007-AC3 | I | P | ต้อง mock DB connection failure |
| ECP-008 AC1 (goods receipt +Lot, +200) | TC-008-AC1 | I | Y | `tests/integration/stock.spec.ts` |
| ECP-008 AC2 (Lot ซ้ำ→ถามยืนยันรวม/สร้างใหม่) | TC-008-AC2 | I | Y | เดียวกัน |
| ECP-008 AC3 (qty ≤0→block) | TC-008-AC3 | U/I | Y | `tests/unit/stockReservation.spec.ts` + integration |
| ECP-009 AC1 (BOM พอ→คำนวณถูก) | TC-009-AC1 | U/I | Y | `tests/unit/bomCheck.spec.ts` |
| ECP-009 AC2 (เจาะจงเฉพาะวัตถุดิบที่ขาด) | TC-009-AC2 | U/I | Y | เดียวกัน |
| ECP-009 AC3 (ไม่มี BOM→block) | TC-009-AC3 | I | Y | `tests/integration/stock.spec.ts` |
| ECP-010 AC1 (confirm→available ลด, physical ไม่เปลี่ยน) | TC-010-AC1 | U/I | Y | `tests/unit/stockReservation.spec.ts` |
| ECP-010 AC2 (cancel ก่อนผลิต→คืนครั้งเดียว) | TC-010-AC2 | I | Y | เดียวกัน |
| ECP-010 AC3 (เบิกเกิน physical→block) | TC-010-AC3 | I | Y | เดียวกัน |
| **ECP-010 AC4 (accuracy 100% concurrency)** | **TC-010-AC4** | **C** | **Y** | `tests/integration/concurrency/stockLedgerAccuracy.spec.ts` — **critical, ดู §4.1** |

### Epic 4: Production & Traceability

| AC | TC ID | Level | Auto | หมายเหตุ |
|---|---|---|---|---|
| ECP-011 AC1 (คิวเรียงตาม delivery date) | TC-011-AC1 | I | Y | `tests/integration/production.spec.ts` |
| ECP-011 AC2 (ไม่มีงาน→ข้อความ) | TC-011-AC2 | I | Y | เดียวกัน |
| ECP-011 AC3 (PO ถูกยกเลิกระหว่างดู→หายจากคิวทันที) | TC-011-AC3 | I | Y | เดียวกัน |
| ECP-012 AC1 (assign→Production Order, Assigned) | TC-012-AC1 | I | Y | เดียวกัน |
| ECP-012 AC2 (assign ซ้ำ→เตือนไม่ silent) | TC-012-AC2 | I | Y | เดียวกัน |
| ECP-012 AC3 (ไม่มีผู้ปฏิบัติงาน Active→ข้อความ) | TC-012-AC3 | I | Y | เดียวกัน |
| ECP-013 AC1 (บันทึกผลิต→Batch+เชื่อม Lot+หัก physical) | TC-013-AC1 | I | Y | เดียวกัน |
| ECP-013 AC2 (หลาย Lot ต่อวัตถุดิบเดียว) | TC-013-AC2 | I | Y | เดียวกัน |
| ECP-013 AC3 (ไม่เลือก Lot→block) | TC-013-AC3 | I | Y | เดียวกัน |
| ECP-014 AC1 (traceability เต็มสาย ≤5 นาที) | TC-014-AC1 | I | Y | `tests/integration/traceability.spec.ts` — วัดเวลา |
| ECP-014 AC2 (Lot ใช้หลาย Batch→ครบทุก Batch) | TC-014-AC2 | I | Y | เดียวกัน |
| ECP-014 AC3 (Lot ไม่มีจริง→ข้อความ) | TC-014-AC3 | I | Y | เดียวกัน |

### Epic 5: QA/QC

| AC | TC ID | Level | Auto | หมายเหตุ |
|---|---|---|---|---|
| ECP-015 AC1 (Approve→QC Approved) | TC-015-AC1 | I | Y | `tests/integration/qc.spec.ts` |
| ECP-015 AC2 (Reject→QC Rejected+PO รอผลิตใหม่) | TC-015-AC2 | I | Y | เดียวกัน |
| ECP-015 AC3 (approve ซ้ำ→เตือน+ต้องยืนยัน) | TC-015-AC3 | I | Y | เดียวกัน |
| ECP-016 AC1 (filter QC Pending, เรียงเก่า→ใหม่) | TC-016-AC1 | I | Y | เดียวกัน |
| ECP-016 AC2 (ไม่มีที่ค้าง→ข้อความ) | TC-016-AC2 | I | Y | เดียวกัน |
| ECP-016 AC3 (role ไม่ใช่ QA→403) | TC-016-AC3 | I | Y | เดียวกัน + RBAC matrix test |
| ECP-017 AC1 (incoming QC ผ่าน→พร้อมใช้ผลิต) | TC-017-AC1 | I | Y | เดียวกัน |
| ECP-017 AC2 (ไม่ผ่าน→ไม่ให้เลือกแม้ผ่าน API ตรง) | TC-017-AC2 | I | Y | เดียวกัน |
| ECP-017 AC3 (ยังไม่ตรวจ→ไม่อนุญาต) | TC-017-AC3 | I | Y | เดียวกัน |

### Epic 6: Shipping

| AC | TC ID | Level | Auto | หมายเหตุ |
|---|---|---|---|---|
| ECP-018 AC1 (สร้าง Shipment จาก QCApproved) | TC-018-AC1 | I | Y | `tests/integration/shipping.spec.ts` |
| ECP-018 AC2 (QCRejected ไม่แสดงเป็นตัวเลือก) | TC-018-AC2 | I | Y | เดียวกัน |
| ECP-018 AC3 (QCPending เรียก action ตรง→ปฏิเสธ) | TC-018-AC3 | I | Y | เดียวกัน |
| ECP-019 AC1 (Shipped→Delivered) | TC-019-AC1 | I | Y | เดียวกัน |
| ECP-019 AC2 (ข้ามขั้น Draft→Delivered→block) | TC-019-AC2 | I | Y | เดียวกัน |
| ECP-019 AC3 (วันที่อนาคต→block) | TC-019-AC3 | U/I | Y | เดียวกัน |

### Epic 7: Invoice & Billing

| AC | TC ID | Level | Auto | หมายเหตุ |
|---|---|---|---|---|
| ECP-020 AC1 (v1 + VAT snapshot คำนวณถูก) | TC-020-AC1 | U/I | Y | `tests/unit/invoiceVat.spec.ts` + `tests/integration/invoice.spec.ts` |
| ECP-020 AC2 (ออกซ้ำ→block ชี้ไป revise) | TC-020-AC2 | I | Y | `tests/integration/invoice.spec.ts` |
| ECP-020 AC3 (ยังไม่ Shipped→block) | TC-020-AC3 | I | Y | เดียวกัน |
| ECP-021 AC1 (ชำระเต็ม→Paid, คงค้าง 0) | TC-021-AC1 | U/I | Y | `tests/unit/paymentOutstanding.spec.ts` + integration |
| ECP-021 AC2 (ชำระบางส่วน→Partially Paid) | TC-021-AC2 | U/I | Y | เดียวกัน |
| ECP-021 AC3 (เกินคงค้าง→block) | TC-021-AC3 | U/I | Y | เดียวกัน |
| ECP-022 AC1 (filter ค้างชำระ) | TC-022-AC1 | I | Y | `tests/integration/invoice.spec.ts` |
| ECP-022 AC2 (ไม่มีค้าง→ข้อความ) | TC-022-AC2 | I | Y | เดียวกัน |
| ECP-022 AC3 (role ผิด→403) | TC-022-AC3 | I | Y | เดียวกัน |

### Epic 8: User Management & Audit Log

| AC | TC ID | Level | Auto | หมายเหตุ |
|---|---|---|---|---|
| ECP-023 AC1 (สร้าง user, user_id auto-gen) | TC-023-AC1 | I | Y | `tests/integration/userRbac.spec.ts` |
| **ECP-023 AC2 (เปลี่ยน role→มีผล ≤5 นาที ไม่ต้อง re-login)** | **TC-023-AC2** | **C** | **Y** | `tests/integration/concurrency/permissionTtl.spec.ts` — **critical, ดู §4.3** |
| ECP-023 AC3 (username ซ้ำ→ปฏิเสธ) | TC-023-AC3 | I | Y | `tests/integration/userRbac.spec.ts` |
| ECP-023 AC4 (client ส่ง user_id เอง→ถูก strip) | TC-023-AC4 | I | Y | เดียวกัน |
| ECP-024 AC1 (เปิดสิทธิ์เมนู→มีผลใน login ครั้งถัดไป) | TC-024-AC1 | I | Y | เดียวกัน |
| **ECP-024 AC2 (guardrail กัน lockout manage_permission)** | **TC-024-AC2** | **I** | **Y** | เดียวกัน — ต้องทดสอบ "ถอดสิทธิ์ทุก role พร้อมกัน" ด้วย ไม่ใช่แค่ role เดียว (ดู §6 exploratory) |
| ECP-024 AC3 (บันทึกล้มเหลว→ค่าเดิมไม่เปลี่ยน half-write) | TC-024-AC3 | I | P | ต้อง mock DB failure กลาง transaction |
| ECP-025 AC1 (login สำเร็จ→audit log) | TC-025-AC1 | I | Y | `tests/integration/auditLog.spec.ts` |
| ECP-025 AC2 (login ผิด→audit log Failed) | TC-025-AC2 | I | Y | เดียวกัน |
| ECP-025 AC3 (เขียน log ล้มเหลว→retry/ไม่เงียบ) | TC-025-AC3 | I | P | ต้อง mock audit write failure |
| ECP-026 AC1 (approve batch→audit log ค้นได้) | TC-026-AC1 | I | Y | `tests/integration/auditLog.spec.ts` |
| ECP-026 AC2 (>1,000 รายการ ค้น filter+pagination) | TC-026-AC2 | I | Y | เดียวกัน — seed 1,000+ แถว |
| **ECP-026 AC3 (audit append-only, ปฏิเสธ update/delete เสมอ)** | **TC-026-AC3** | **I** | **Y** | เดียวกัน — ยิง PUT/DELETE ตรงแม้ไม่มี route ก็ต้องได้ 404/403 ไม่ใช่ 500 |

### Epic 9: Dashboard (7 roles)

| AC | TC ID | Level | Auto | หมายเหตุ |
|---|---|---|---|---|
| ECP-027 AC1–AC3 (Sales dashboard) | TC-027-AC1..3 | I | Y | `tests/integration/dashboard.spec.ts` |
| ECP-028 AC1–AC3 (Warehouse, real-time ≤1 นาที) | TC-028-AC1..3 | I/E | Y | เดียวกัน + `tests/e2e/realtimeStock.spec.ts` (AC2) |
| ECP-029 AC1–AC3 (Production) | TC-029-AC1..3 | I | Y | `tests/integration/dashboard.spec.ts` |
| ECP-030 AC1–AC3 (QA/QC) | TC-030-AC1..3 | I | Y | เดียวกัน |
| ECP-031 AC1–AC3 (Logistics) | TC-031-AC1..3 | I | Y | เดียวกัน |
| ECP-032 AC1–AC3 (Finance) | TC-032-AC1..3 | I | Y | เดียวกัน |
| ECP-033 AC1–AC3 (Admin) | TC-033-AC1..3 | I | Y | เดียวกัน |

> ทุก dashboard มี AC3 = "role อื่นเข้าตรงๆ → 403" — ทดสอบแบบ table-driven ตัวเดียว (parametrize 7 role × 7 dashboard = 49 combination, ดู `tests/integration/dashboard.spec.ts`) แทนเขียนซ้ำ 7 ครั้ง

### Epic 10: Usability & Onboarding

| AC | TC ID | Level | Auto | หมายเหตุ |
|---|---|---|---|---|
| ECP-034 AC1 (เมนูตาม role, ไม่เห็นเมนู role อื่น) | TC-034-AC1 | E | Y | `tests/e2e/roleMenuOnboarding.spec.ts` |
| ECP-034 AC2 (onboarding tooltip ครั้งแรก) | TC-034-AC2 | E | Y | เดียวกัน |
| ECP-034 AC3 (role ว่าง→ข้อความติดต่อ Admin) | TC-034-AC3 | E | Y | เดียวกัน |
| **ECP-035 AC1 (ผู้ใช้ใหม่ทำ task จบเอง ≥80%)** | **TC-035-AC1** | **M (UAT)** | **N** | **ต้องมนุษย์จริงที่ไม่เคยเห็นระบบ — ไม่มีเครื่องมือ automate "ความเข้าใจของมนุษย์" ได้ ดู §5** |
| ECP-035 AC2 (บันทึกจุดติดขัดของผู้ทดสอบ) | TC-035-AC2 | M (UAT) | N | เดียวกัน — เป็น qualitative data collection |
| ECP-035 AC3 (QA ต้องถามปอนด์จำนวนผู้ทดสอบก่อน UAT) | TC-035-AC3 | Process | N/A | **ดำเนินการแล้วในเอกสารนี้ §5 — เป็นคำถามใน `questions_for_pond`** |
| ECP-036 AC1 (error ระบุช่องผิด+วิธีแก้ เป็นไทย) | TC-036-AC1 | I | Y | `tests/e2e/errorMessageAudit.spec.ts` (static scan) |
| ECP-036 AC2 (unexpected error→ข้อความกลาง ไม่โชว์ technical) | TC-036-AC2 | I | Y | เดียวกัน |
| ECP-036 AC3 (สแกนทุกหน้าจอ error case, 0 หลุด) | TC-036-AC3 | I/E | **P** | Automated string-pattern scan (regex หา `null`,`undefined`,`Error:`,stack, English-only) ครอบคลุมสูง แต่การตัดสิน "เข้าใจง่ายจริงไหม" ต้องมนุษย์ทำ final pass |

### Epic 11: Invoice Versioning & VAT Config (Gate 1 Amendment)

| AC | TC ID | Level | Auto | หมายเหตุ |
|---|---|---|---|---|
| **ECP-037 AC1 (revise→v2, parent ชี้ v1, v1→Superseded)** | **TC-037-AC1** | **I** | **Y** | `tests/integration/invoiceVersioningReconciliation.spec.ts` |
| ECP-037 AC2 (timeline แสดงทั้งสาย, v1 เปิดดูได้ครบ) | TC-037-AC2 | I/E | Y | เดียวกัน + `tests/e2e/invoiceRevisionTimeline.spec.ts` |
| ECP-037 AC3 (แก้ version เก่า→block+ลิงก์ล่าสุด) | TC-037-AC3 | I | Y | `tests/integration/invoiceVersioningReconciliation.spec.ts` |
| ECP-037 AC4 (ลบจนไม่เหลือ line→block, version เดิมไม่เปลี่ยน) | TC-037-AC4 | U/I | Y | `tests/unit/invoiceVersioning.spec.ts` + integration |
| **§5.5 Payment↔version reconciliation (carry-over, overpaid flag)** | TC-037-REC1 | C | Y | `tests/integration/concurrency/paymentVersionReconciliation.spec.ts` — **critical, ดู §4.4** |
| ECP-038 AC1 (ตั้งค่า VAT ในหน้าเดียวกับ manage user, ค่าใหม่กระทบ invoice ใหม่) | TC-038-AC1 | I/E | Y | `tests/integration/vatConfigAdmin.spec.ts` + `tests/e2e/adminVatConfig.spec.ts` |
| ECP-038 AC2 (invoice เก่าไม่เปลี่ยนตาม config ใหม่ — snapshot) | TC-038-AC2 | I | Y | `tests/integration/vatConfigAdmin.spec.ts` |
| ECP-038 AC3 (rate นอกช่วง 0–100→block, error ไทย) | TC-038-AC3 | U/I | Y | `tests/unit/vatConfigValidation.spec.ts` + integration |

### NFR (จาก §NFR ของ user-stories.md, อ้าง architecture.md §NFR N1–N4)

| NFR | TC ID | Level | Auto | หมายเหตุ |
|---|---|---|---|---|
| N1 stock ledger accuracy 100% | TC-NFR-N1 | C | Y | = TC-010-AC4 |
| N2 stock/dashboard speed ≤1 นาที | TC-NFR-N2 | E | Y | = TC-007-AC1/TC-028-AC2 |
| N3 Indexing (query เร็วภายใต้ปริมาณข้อมูลมาก) | TC-NFR-N3 | I | Y | `tests/integration/traceability.spec.ts` + `tests/integration/auditLog.spec.ts` — seed ≥1,000 แถวแล้ววัด response time (ไม่ทดสอบ index โดยตรงแต่ทดสอบ "ผลลัพธ์" ตาม NFR ผ่าน SLA เวลา) |
| N4 NumberSequence ไม่ซ้ำแม้ concurrency | TC-NFR-N4 | C | Y | `tests/integration/concurrency/numberSequence.spec.ts` — **critical, ดู §4.2** |

**สรุปจำนวน AC ทั้งหมด: 119 ACs (ECP-001–038) + 4 NFR item (ผูกกับ AC ที่มีอยู่แล้ว ไม่นับซ้ำ) + 1 reconciliation item (§5.5)**

---

## 3. สรุป Automation Coverage

| หมวด | จำนวน | % ของ 119 AC |
|---|---|---|
| Automatable เต็ม (Y) | 108 | 90.8% |
| Automatable บางส่วน (P — ต้อง mock failure/manual final pass) | 7 | 5.9% (ECP-003 AC3, ECP-007 AC3, ECP-024 AC3, ECP-025 AC3, ECP-036 AC3 ร่วมกับ AC1/AC2 ที่นับเป็น Y แล้ว) |
| ไม่ได้ (N — ต้องใช้มนุษย์จริง) | 3 | 2.5% (ECP-035 AC1, AC2 และ process-only AC3) |
| Process-only (ไม่ใช่ระบบ behavior) | 1 | 0.8% (ECP-035 AC3) |

**สรุป**: automation coverage ระดับ AC = **~91% เต็มรูป + ~6% บางส่วน** ส่วนที่เหลือ (~3%) คือ ECP-035
(usability UAT) ซึ่งเป็นธรรมชาติของงาน — วัด "มนุษย์ทำงานเองได้ไหมโดยไม่มี training" ไม่มีเครื่องมือ
automate ทดแทนการมีผู้ทดสอบจริงได้ (บันทึกไว้ใน gate ว่าไม่ automatable พร้อมเหตุผล ไม่ใช่ gap ที่ QA ละเลย)

**สิ่งที่ยัง "ไม่ถูกเขียนเป็นโค้ดจริง" ในรอบนี้ (มี TC ID + design ครบ แต่ marked `test.todo` ในไฟล์จนกว่าจะยืนยัน field
name ที่แน่นอนจาก Engineer)**: รายละเอียด mock-failure cases (P) ทั้ง 7 ข้อ — เหตุผล: ต้องรู้ก่อนว่า Engineer
เลือกวิธี mock DB/service failure อย่างไร (dependency injection point) จึงจะเขียน mock ได้แม่นยำ ไม่ใช่ข้อมูล
business ที่ขาด แต่เป็น technical detail ที่ต้องรอโค้ดจริง (ระบุใน `test.todo` comment ชัดเจนในไฟล์)

---

## 4. เคสสำคัญ (Critical — อธิบายละเอียดเกินตาราง)

### 4.1 Stock ledger accuracy 100% ภายใต้ concurrency (ECP-010 AC4 / N1)
ไฟล์: `tests/integration/concurrency/stockLedgerAccuracy.spec.ts`
- Setup: seed วัตถุดิบ Y พร้อม physical เริ่มต้นที่ทราบค่าแน่นอน
- ยิงพร้อมกัน (`Promise.all`) ผสมกัน ≥200 ธุรกรรม: goods receipt, PO confirm(reserve), PO cancel(release),
  บันทึกผลิต(issue) จากหลาย "ผู้ใช้" (token ต่างกัน) พร้อมกันจริง (ไม่ await ทีละตัว)
- Assertion หลัก: หลังธุรกรรมทั้งหมด commit ครบ, `GET /stock/reconciliation?material=Y` ต้องได้
  `Σ(StockTransaction.qty) === StockBalance.physical_qty` เป๊ะ (ไม่มี tolerance/epsilon — ตรงตาม NFR "100% ไม่มีส่วนต่างแม้แต่หน่วยเดียว")
- Exploratory เพิ่มเติม (เกิน AC): ยิงธุรกรรมที่ตั้งใจชนกัน (เบิกพร้อมกัน 2 คำขอที่รวมกันเกิน physical
  พอดี) เพื่อยืนยันว่ามีคำขอเดียวเท่านั้นที่ผ่าน ไม่ใช่ปฏิเสธทั้งคู่หรือผ่านทั้งคู่ (race บน boundary เป๊ะ)

### 4.2 NumberSequence ไม่ออกเลขซ้ำภายใต้ concurrency (ADR-006 rev.2 / N4)
ไฟล์: `tests/integration/concurrency/numberSequence.spec.ts`
- ยิงสร้าง Customer/User/PO/Batch/Shipment/Invoice พร้อมกัน ≥100 รายการต่อชนิดใน period_key เดียวกัน
- Assertion: เลขที่ออกทั้งหมด unique 100% (ไม่มี duplicate) และต่อเนื่องไม่กระโดดข้ามอย่างผิดปกติ
  (allow gap ได้ถ้า tx rollback แต่ต้องไม่ซ้ำ)
- Exploratory: ทดสอบ 2 period_key ที่ต่างกันพร้อมกัน (เช่น PO เดือนนี้/เดือนหน้าคาบเกี่ยว boundary เที่ยงคืน)
  ว่า sequence ไม่ปนกัน; ทดสอบ padding overflow (`counter` เกินจำนวนหลักที่กำหนด เช่น CUS ตัวที่ 100,000,000)
  ว่าเลขยาวขึ้นเองไม่ตัดทอน/ไม่ชนตามที่ ADR-006 สัญญาไว้

### 4.3 Permission TTL ≤5 นาที โดยไม่ re-login (ECP-023 AC2 / ECP-024 AC1 / ADR-005 rev.2)
ไฟล์: `tests/integration/concurrency/permissionTtl.spec.ts`
- Login user ที่มี role A → เก็บ session/cookie ค้างไว้ (จำลอง "login ค้างอยู่")
- เปลี่ยน role ของ user เป็น role B ผ่าน Admin API (**ไม่เรียก invalidate/logout ใดๆ เพิ่มเติม** — ทดสอบ
  worst-case ที่ proactive invalidation ไม่ทำงาน เพื่อยืนยันว่า TTL fallback ยังการันตี ≤5 นาที)
- Assertion: เรียก endpoint ที่สงวนสิทธิ์ตาม role เดิมทันที (t=0) ต้องยังเห็นสิทธิ์เดิม (cache ยังไม่หมดอายุ)
  แล้ว fast-forward เวลา (mock `Date.now`/รอจริงตาม `PERMISSION_CACHE_TTL` ที่ config ไว้สั้นในสภาพแวดล้อมทดสอบ
  เช่น 2 วินาที เพื่อไม่ต้องรอ 5 นาทีจริงในทุกรัน) → ต้องเห็นสิทธิ์ใหม่ **ภายในเวลา ≤ TTL ที่ config ไว้เสมอ**
  โดยไม่มี re-login ใหม่
- แยกอีก 1 เคส: ถ้ามีการเรียก `permissionCache.invalidate` เชิงรุก → สิทธิ์ใหม่ต้องมีผล "เกือบทันที" (เช่น ภายใน
  1 request ถัดไป) — Assertion แยกจากเคส TTL fallback ข้างต้น (สอง path ต้องผ่านทั้งคู่แยกกัน)
- **หมายเหตุ QA (สงสัยเชิงรุก)**: ต้อง run เคสนี้ด้วย `PERMISSION_CACHE_TTL` ที่ตั้งเกิน 300 วินาที (เช่น 999) เพื่อยืนยันว่า
  config loader **clamp เหลือ ≤300 วินาทีจริง** (ตามที่ D2/ADR-005 ระบุ) — ถ้าไม่ clamp = defect ร้ายแรง (ละเมิดเงื่อนไข Gate 1 ตรงๆ)

### 4.4 Payment ↔ Invoice-version reconciliation + overpaid flag (§5.5)
ไฟล์: `tests/integration/concurrency/paymentVersionReconciliation.spec.ts`
- Setup: PO → Invoice v1 (total = 53,500) → บันทึกชำระบางส่วน 40,000 (PartiallyPaid, คงค้าง 13,500)
- Revise invoice → v2 (แก้ quantity ทำให้ total ใหม่ = 30,000 ซึ่ง**น้อยกว่า**ยอดที่จ่ายไปแล้ว 40,000)
- Assertion: payment 40,000 ยัง carry-over อยู่ (ไม่ถูกลบ), status ของ v2 **ต้องไม่ mark "Paid" อัตโนมัติแบบผิด
  ความหมาย** แต่ตั้งธง `overpaid = true` พร้อมข้อความเตือนตามที่ architecture.md §5.5 ระบุ, outstanding แสดง
  เป็นค่าติดลบหรือ 0 อย่างสม่ำเสมอ (ต้องเลือก 1 พฤติกรรมและ assert ไม่กำกวม — ถ้า Engineer ทำไม่ตรง spec นี้ = defect)
- อีกเคส: revise invoice v1→v2 ทำให้ total ใหม่ **มากกว่า** เดิม (เช่น 53,500 → 80,000) ขณะที่จ่ายไปแล้ว 40,000
  → status ต้องเป็น `PartiallyPaid` ใหม่ ยอดคงค้าง = 40,000 (คำนวณจาก total ใหม่ ไม่ใช่ total เดิม)
- **⚠ ผลลัพธ์ของเคสนี้ผูกกับ default `INVOICE_EDIT_AFTER_PAYMENT=allow`** (ดู tasks.md E/§3, architecture.md §5.5)
  — ถ้าปอนด์ยืนยันภายหลังว่าต้องการ "block แก้ไขเมื่อ Paid/PartiallyPaid" แทน ต้องเพิ่มเคสคู่ตรงข้าม
  (`INVOICE_EDIT_AFTER_PAYMENT=block` → revise บน invoice ที่มี payment ต้องถูกปฏิเสธ) — TC สำรองเตรียมไว้แล้วใน
  ไฟล์เดียวกัน (`describe.skip` จนกว่าจะยืนยัน toggle)

---

## 5. แผน UAT (ECP-035, KPI#5) — เกณฑ์ตัวเลขและจำนวนผู้ทดสอบ

> **อัปเดต 2026-07-07 (คำตอบปอนด์)**: ปอนด์เลือกตัวเลือก **B — 2–3 คนต่อ role (รวม 14–21 คน)**
> เพื่อความน่าเชื่อถือทางสถิติของตัวเลข "≥80% ของ scenario" มากกว่า default 1 คน/role เดิม
> (คำถามใน `pipeline/status.json` → entry `qa`/`phase: test-plan` → `questions_for_pond`).
> ตัวเลขและแผนด้านล่างปรับเป็นค่าที่ปอนด์อนุมัติแล้ว **ต้องรอ Gate ของ verify phase (Q1–Q4/Q7 ผ่านหมด
> ไม่มี Critical/Major defect ค้าง) ก่อนจึงจะนัดหมาย UAT จริงได้ — ดู verify-report.md: ด่านนี้ยังไม่ผ่าน
> (มี Critical defect DEF-01/DEF-02 ค้างอยู่) ดังนั้น UAT ยังไม่ควรเริ่มนัดหมายในตอนนี้.**

**ค่าที่อนุมัติแล้ว (แทน default เดิม):**
- ผู้ทดสอบ **2–3 คนต่อ role × 7 roles = 14–21 คนรวม** (แทน 1 คน/role เดิม)
- เหตุผลเดิมของ QA (ยังใช้ได้เป็น rationale): sample size = 1 ต่อ role ทำให้ผลลัพธ์ "≥80% ของ scenario"
  วัดได้แค่ระดับ scenario ต่อคน ไม่ใช่ระดับ population ของ role นั้นจริง — 2–3 คน/role ลดความเสี่ยงที่ผลลัพธ์
  สะท้อนแค่ความถนัด/ไม่ถนัดของคนคนเดียว
- **ผลต่อ scenario/logistics**: จำนวน scenario รวมที่ต้องรันจะคูณตามจำนวนคน (เช่น Sales 3 คน x 5 scenario
  = 15 รอบทดสอบสำหรับ role เดียว) — ต้องเผื่อเวลาจัดตารางและผู้สังเกตการณ์ (observer) มากกว่าแผนเดิม
  ~2–3 เท่า ทีมที่จะช่วยจัดคน 14–21 คน (recruit ผู้ทดสอบใหม่ที่ไม่เคยเห็นระบบจริงตามเกณฑ์ AC1) ควรเริ่มหาได้
  ตั้งแต่ตอนนี้ แต่ **การนัดวันจริงต้องรอผ่าน Gate verify phase ก่อน** (ดูกล่องด้านบน)
- Scenario ต่อ role: อย่างน้อย 3–5 scenario ที่ครอบคลุม "task หลัก" ของ role นั้น (map จาก must-have story
  ของแต่ละ role เช่น Sales → เปิด PO ให้จบ 1 ใบ; คลัง → รับของ+ดู stock; ฝ่ายผลิต → assign+บันทึกผลิต;
  QA/QC → ตรวจ+อนุมัติ Batch; จัดส่ง → สร้าง Shipment+update สถานะ; บัญชี → ออก invoice+รับชำระ; Admin →
  สร้าง user+ปรับสิทธิ์)
- เกณฑ์ผ่าน: ≥80% ของ scenario ทั้งหมด (รวมทุก role) ทำจบเองโดยไม่มี training/คู่มือ/ถามคนอื่น
- Timing: จัดหลัง Engineer ส่งมอบ build ที่ผ่าน Q1–Q4/Q7 ทั้งหมดแล้ว (ไม่ทำ UAT บนโค้ดที่ยังมี defect
  วิกฤต — ผิดเป้าหมายของ usability test ถ้า user ติดเพราะ bug ไม่ใช่เพราะ UX)
- ผลที่ต้องบันทึก: จุดที่ผู้ทดสอบติดขัด (คำถามเปิด, screen recording แนะนำ), เวลาที่ใช้ต่อ scenario,
  success/fail ต่อ scenario — ใช้เป็น input ปรับ UX รอบถัดไป (ตาม AC2)

---

## 6. เคส Exploratory เพิ่มเติม (นอกเหนือจาก AC ที่ BA เขียนไว้ — มุมมองกังขาของ QA)

รายการนี้ไม่ได้ผูกกับ ECP-xxx โดยตรง แต่ QA เพิ่มเพราะเป็นจุดที่ระบบ ERP จริงมักพัง:

1. **Double-submit**: กดปุ่ม "ยืนยัน PO" / "บันทึกผลิต" / "ออก invoice" 2 ครั้งติดกันเร็วมาก (double-click)
   ก่อน response แรกกลับ → ต้องไม่สร้างเอกสารซ้ำ 2 ใบ (idempotency ที่ไม่มี AC ไหนพูดถึงตรงๆ)
2. **Clock skew / เขตเวลา**: ธุรกรรมที่ผูก "วันที่ปัจจุบัน" (shipped_date ≤ today, payment_date ≤ today)
   ทดสอบกับ timezone ของ server ต่างจาก client (Thailand +07:00) — ต้องยึด server time เป็นหลักเสมอ ตาม
   CLAUDE.md domain note (timezone) — ถ้ายังไม่ระบุ ให้ทดสอบว่าไม่มี edge case เที่ยงคืนที่ค่าเพี้ยนข้ามวัน
3. **Negative/zero/decimal boundary**: unit_price = 0 (ควรอนุญาตหรือไม่? architecture ระบุ `unit_price ≥ 0`
   — ทดสอบ 0 พอดีต้องผ่าน), quantity เป็นทศนิยม (POLine.quantity ควรเป็นจำนวนเต็มหรือทศนิยมได้? ไม่ระบุชัด
   ใน Data Rules — ทำเครื่องหมายเป็นคำถามถ้า Engineer ตีความต่างจาก QA)
4. **VAT rounding edge**: subtotal ที่คูณ VAT แล้วได้ทศนิยมตำแหน่งที่ 3 พอดี .005 (round-half-up ตาม
   architecture §3.2) — ทดสอบค่าที่ทำให้ปัดขึ้น/ลงต่างจาก native JS `Math.round` (floating point error
   คลาสสิกของภาษาโปรแกรม เช่น `0.145 * 100` ใน JS ไม่เท่ากับ 14.5 พอดี) — ต้องยืนยันว่า backend ใช้ decimal
   library ที่แม่นยำ ไม่ใช่ float ตรงๆ (ผูกกับ NFR ความแม่นยำ)
5. **Invoice chain ข้าม PO ที่ถูกยกเลิกภายหลัง**: PO ถูก Invoiced แล้ว แต่ภายหลังพบว่าธุรกิจจริงต้องการยกเลิก
   PO ทั้งใบ (ไม่มี AC ไหนพูดถึง flow นี้ตรงๆ — เป็น gap ที่ควร flag ว่า "PO สถานะ Invoiced ไม่มี transition
   ไป Cancelled ในทุก state machine ที่ระบุ" → อาจเป็น design gap ที่ QA ควร log เป็นคำถาม/ข้อสังเกตให้ Tech-Lead
   ทราบตอน verify phase ถ้า Engineer implement ไม่ตรงกับที่คาด)
6. **Concurrent revise บน invoice เดียวกัน**: 2 คนกด "แก้ไข invoice" พร้อมกันบน version ล่าสุดเดียวกัน
   (race ที่ AC ไม่ได้พูดถึง) → ต้องมีแค่ 1 คำขอที่สร้าง v(n+1) สำเร็จ อีกคำขอต้อง fail แบบมีข้อความชัด
   (ไม่ใช่สร้าง 2 version พร้อมกันจาก parent เดียวกัน — จะทำให้ chain แตกเป็นกิ่ง)
7. **Audit log ของการกระทำที่ fail**: ECP-026 เน้น action ที่ "สำเร็จ" — แต่ audit log ของ action ที่ล้มเหลว
   (เช่น พยายาม approve batch ซ้ำ, พยายามแก้ invoice version เก่า) ควรถูกบันทึกด้วยหรือไม่เพื่อ security trail?
   ไม่มี AC ระบุชัด — ทดสอบพฤติกรรมปัจจุบันแล้วบันทึกเป็นข้อสังเกต ไม่ใช่ defect (เพราะไม่มี AC ยืนยัน)

---

## 7. สิ่งที่ Engineer/DevOps ต้องเตรียมให้ automation รันได้จริง (ไม่ block เริ่มโค้ด)

1. `package.json` devDependencies: `jest`, `ts-jest`, `@types/jest`, `supertest`, `@types/supertest`,
   `socket.io-client`, `@playwright/test` + script `"test:unit"`, `"test:integration"`, `"test:e2e"`
2. `.env.test` แยกจาก `.env` (DB แยก schema/instance สำหรับทดสอบ ไม่ปนกับ dev data) + ค่า
   `PERMISSION_CACHE_TTL` ที่ตั้งสั้นได้ในสภาพแวดล้อมทดสอบ (เช่น 2 วินาที) เพื่อทดสอบ TTL ไม่ต้องรอ 5 นาทีจริง
3. Seed reset ที่เรียกซ้ำได้ระหว่าง test suite (`prisma migrate reset --force` + seed, หรือ endpoint
   test-only `POST /test/seed-reset` ที่ปิดใน production build)
4. ยืนยัน endpoint response field names ให้ตรงกับที่ QA สมมติไว้ (architecture.md §6/§3.1) หรือแจ้ง QA
   ปรับ assertion ก่อน verify phase

---

## 8. Exit Gate ของเอกสารนี้ (self-check ของ QA — Phase 1)

- [x] ทุก story (ECP-001–038) มี test case map ครบทุก AC (119/119 — ดู §2)
- [x] เคส NFR/concurrency ครอบคลุม (N1–N4 + §5.5 reconciliation — ดู §4)
- [x] automated spec พร้อมรัน (ไฟล์ `.spec.ts` ใน `tests/` — compile ไม่ได้จนกว่า Engineer ทำ E0 เสร็จ ซึ่งเป็น
      เงื่อนไขที่ทราบและระบุไว้ใน §0/§7 ไม่ใช่ความบกพร่องของแผนนี้)
- [x] จำนวนผู้ทดสอบ UAT ต่อ role — **ปอนด์ยืนยันแล้ว 2026-07-07: ตัวเลือก B (2–3 คน/role, 14–21 คนรวม)**
      ปรับ §5 แล้ว — ยังไม่นัดหมาย UAT จริงเพราะ verify phase (§9) ยังมี Critical defect ค้าง

---

## 9. ผล Verify Phase (QA — หลัง Engineer ส่งมอบ E0–E21) — 2026-07-07

> รายละเอียดเต็มอยู่ที่ `docs/test-plans/erp-core-prototype/verify-report.md` และ defect list ที่
> `docs/test-plans/erp-core-prototype/defects.md`. สรุปย่อที่นี่เพื่อให้ traceability matrix ด้านบน (§2)
> มีสถานะ "ตรวจจริงแล้ว" ควบคู่กับ "ออกแบบไว้แล้ว" ของ Phase 1.

**รันจริงได้ในสภาพแวดล้อมนี้ (ไม่มี Docker/MySQL daemon):**
- `npx jest` (โค้ด Engineer เดิม): **123/123 ผ่าน, 22 suites** — ตรงกับที่ Engineer รายงาน
- `tsc --noEmit` backend + frontend: **0 error ทั้งคู่**
- `npm run lint` (ESLint): **0 error, 5 warning** (warning ทั้งหมดอยู่ใน `tests/integration/*.spec.ts` ของ QA เอง — unused var, ไม่ใช่โค้ด Engineer)
- `vite build` (frontend): **สำเร็จ** (มี performance warning เรื่อง chunk size >500kB เท่านั้น)
- Backend boot (`tsx src/backend/server.ts`) + `GET /health` → **200 โดยไม่ต้องมี DB** ตามที่ Engineer รายงาน
- Frontend `vite preview` → **200**
- **QA ปรับ (reconcile) unit spec 8 ไฟล์ใน `tests/unit/` ให้ตรงกับ API จริงของ Engineer แล้วรันจริงด้วย
  ephemeral jest config (ไม่แก้ `jest.config.js` ของ Engineer — ดูเหตุผลใน DEF-02):**
  **45 ผ่าน, 1 ไม่ผ่าน (ยืนยัน DEF-01 จริง — ดู defects.md), 12 skip (มีเหตุผล/อ้างอิงเทียบเท่าที่ Engineer ทดสอบผ่านแล้ว)**

**รันไม่ได้เลยในสภาพแวดล้อมนี้ (Integration 13 ไฟล์ + Concurrency 4 ไฟล์ + E2E 6 ไฟล์ = 23/31 ไฟล์ automated spec ของ QA):**
- เหตุผลผสมกัน 2 ชั้น: (1) **DEF-02** — `jest.config.js` ไม่ครอบคลุม `tests/` เลย + ไม่มี `supertest`/`@playwright/test`
  ติดตั้งไว้ (2) **ไม่มี Docker/MySQL daemon** ใน sandbox นี้ (ตรวจแล้ว `docker info` ต่อ daemon ไม่ได้)
- ผลกระทบตรงจุดสำคัญที่สุด: **เคส Q7 ทั้ง 4 ไฟล์ (stock ledger accuracy 100% concurrency, NumberSequence
  ไม่ซ้ำ, permission TTL ≤5 นาที+clamp≤300s, payment↔invoice-version race)** ที่ Gate 1 เน้นย้ำเป็นเงื่อนไข
  ยังไม่เคยถูกรันกับโค้ดจริงเลยแม้แต่ครั้งเดียว — เป็น gap เดียวกับที่ทำให้ DEF-01 หลุดรอดมาได้

**Automation coverage ที่ verify ได้จริง ณ วันนี้ (เทียบกับ 119 AC เดิม):**
- มีหลักฐานรันจริงและผ่าน (ของ QA เอง + colocated ของ Engineer ที่ตรง AC เดียวกัน): ครอบคลุม ACs ระดับ unit
  เกือบทั้งหมด (ECP-004/005/008/009/010/019/020/021/037/038 AC3, ADR-006 format) และส่วนใหญ่ของ integration-level
  business logic ผ่าน Engineer's colocated `*.test.ts` (แต่ยังไม่ใช่ QA's ไฟล์ `tests/integration/*.spec.ts`
  โดยตรง เพราะรันไม่ได้ — ดู DEF-02)
- **ยังไม่มีหลักฐานรันจริงเลย**: ทุก AC ที่ต้องพึ่ง DB จริง/concurrency จริง/WebSocket จริง/UI จริง
  (Integration 13 + Concurrency 4 + E2E 6 ไฟล์) = คิดเป็น TC ที่ยัง "ไม่ verify" ประมาณ **~45-50% ของ 119 AC**
  (ทุก AC ระดับ **I**/**E**/**C** ใน traceability matrix §2 ที่ไม่มี Engineer colocated test คู่ขนานให้อ้างอิง)
- สรุปตรงไปตรงมา: **automation ที่ "ออกแบบไว้" ยังอยู่ที่ ~91% เต็ม + ~6% บางส่วนเหมือน Phase 1 เดิม แต่
  automation ที่ "verify แล้วว่ารันได้จริงและผ่าน" ในสภาพแวดล้อมนี้ต่ำกว่านั้นมาก** เพราะ tooling gap (DEF-02)
  และ environment gap (ไม่มี Docker/MySQL) ผสมกัน — ทั้งสองอย่างต้องแก้ก่อนจะเคลมว่า Q7/Q2 ผ่านจริง

**Defect ที่พบ**: ดู `docs/test-plans/erp-core-prototype/defects.md` — สรุป 2 Critical, 3 Major, 3 Minor
**สถานะ**: `FAILED` — ส่งกลับ Engineer แก้ไข DEF-01–DEF-05 ก่อน (ดู defects.md สำหรับรายละเอียด/repro)
