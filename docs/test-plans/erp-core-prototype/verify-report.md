# Verify Report — ERP Core Prototype — QA Phase 2 (Verify)

- **slug**: `erp-core-prototype`
- **วันที่**: 2026-07-07
- **เขียนโดย**: QA — Phase 2 (Verify, หลัง Engineer ส่งมอบ E0–E21, `READY_FOR_QA_VERIFY`)
- **อ้างอิง**: `docs/test-plans/erp-core-prototype/test-plan.md` (§9 มีสรุปย่อ), `docs/test-plans/erp-core-prototype/defects.md`
  (defect list เต็ม), `pipeline/status.json` (entry `engineer` ล่าสุด + entry `qa`/`phase: test-plan`)

> จุดยืน: รายงานนี้บันทึกเฉพาะสิ่งที่ **รันจริง** ในสภาพแวดล้อมนี้เท่านั้น อะไรที่รันไม่ได้ (ไม่ว่าเพราะขาด
> tooling หรือขาด environment) จะระบุไว้ชัดเจนว่า "ไม่ verify" ไม่ใช่ "ผ่าน"

---

## 1. สิ่งที่รันจริงและผลลัพธ์จริง (numbers)

| คำสั่ง | ผลลัพธ์ | หมายเหตุ |
|---|---|---|
| `npm install` | สำเร็จ (604 packages, 2 vulnerabilities moderate/high — ไม่ใช่ scope QA) | |
| `npx jest` (jest.config.js เดิมของ Engineer) | **123/123 tests passed, 22 suites** | ยืนยันตรงกับตัวเลขที่ Engineer รายงาน — แต่ pattern นี้ครอบคลุมเฉพาะ `src/backend/**/*.test.ts` เท่านั้น (ดู DEF-02) ไม่ใช่ 27 ไฟล์ `.spec.ts` ของ QA ใน `tests/` |
| `npx tsc -p tsconfig.backend.json --noEmit` | **0 error** | |
| `cd src/frontend && npx tsc --noEmit` | **0 error** | |
| `npm run lint` (ESLint, `eslint . --ext .ts,.tsx`) | **0 error, 5 warning** | warning ทั้งหมดอยู่ใน `tests/integration/*.spec.ts` ของ QA เอง (unused vars) ไม่ใช่โค้ด Engineer — ดู MIN-01 |
| `cd src/frontend && npm run build` (vite) | **สำเร็จ** | มี performance warning เรื่อง chunk size (1.34MB) — ไม่ block, เป็น optimization ในอนาคต |
| `tsx src/backend/server.ts` + `curl /health` | **HTTP 200 `{"status":"ok"}`** โดยไม่มี DB ต่อ | ตรงกับที่ Engineer รายงาน |
| `vite preview` + `curl /` | **HTTP 200**, HTML/JS bundle serve ได้ปกติ | |
| `docker info` | Client ปกติ, **Server: ต่อ daemon ไม่ได้** (`failed to connect to the docker API...`) | ยืนยัน ENV-01 — ไม่มี Docker/MySQL ใช้งานได้ใน sandbox นี้ |
| QA reconciled `tests/unit/*.spec.ts` (8 ไฟล์) ด้วย ephemeral jest config (ไม่แก้ `jest.config.js` ของ Engineer) | **45 passed, 1 failed, 12 skipped (documented), 6 suites (4 pass, 1 fail, 2 skip)** | ไฟล์ที่ fail (`paymentOutstanding.spec.ts`) ยืนยัน **DEF-01 จริงด้วยหลักฐานรัน** ไม่ใช่แค่การอ่านโค้ด |
| `tests/integration/*.spec.ts` (13 ไฟล์), `tests/integration/concurrency/*.spec.ts` (4 ไฟล์), `tests/e2e/*.spec.ts` (6 ไฟล์) | **รันไม่ได้เลยแม้แต่ไฟล์เดียว** | สาเหตุผสม: DEF-02 (jest ไม่ครอบคลุม tests/, ไม่มี supertest/@playwright/test ติดตั้ง) + ENV-01 (ไม่มี Docker/MySQL) |

**สรุปตัวเลขหลัก**: unit-level ของทั้ง Engineer (123) และ QA reconciled (45 pass) = **168 automated
assertions ผ่านจริง**, **1 automated assertion ยืนยันบั๊กจริง (DEF-01)**, **12 ถูก skip อย่างมีเหตุผลและ
อ้างอิงเทียบเท่าที่ Engineer ทดสอบผ่านแล้ว**, **23 ไฟล์ spec (integration+concurrency+e2e) ยังไม่ถูก verify
เลยแม้แต่ครั้งเดียว** ในสภาพแวดล้อมนี้

---

## 2. Static review เทียบ AC — สิ่งที่ตรวจแล้ว "ตรง" กับสิ่งที่ "ไม่ตรง/ขาด"

**ตรงและทำได้ดี (สุ่มตรวจโค้ดจริงเทียบ architecture/ADR):**
- Invoice versioning chain (ECP-037): `invoice.service.ts#reviseInvoice` เช็ค latest-in-chain ก่อน revise,
  สร้าง `parent_invoice_id`, บล็อกแก้ version เก่าพร้อม error ชี้ไป version ล่าสุด, บล็อกกรณี 0 line — ตรงตาม
  design เกือบทั้งหมด **ยกเว้น** จุด status ที่กระทบ DEF-01
- VAT snapshot (ECP-020/038): `computeInvoiceAmounts` คำนวณ subtotal/VAT/total ครั้งเดียวตอน issue/revise
  แล้วเก็บเป็น snapshot ไม่คำนวณซ้ำ — ตรง architecture §3.2; VAT config อยู่หน้าเดียวกับ manage user จริง
  (`AdminPage.tsx`) ตรง ECP-038 AC1
- RBAC/permission cache TTL (ADR-005 rev.2): `PermissionCache` มี TTL clamp ≤300s จริง (`config/index.ts`
  บังคับ `Math.min(raw, 300)`) และ guardrail กัน lockout ของ `manage_permission` (ECP-024 AC2) มี unit test
  ยืนยันครบ 3 เคส (allow-when-someone-keeps-it / block-when-nobody-keeps-it / allow-multi-role)
- Audit log coverage (ECP-025/026): มี `auditableRoute` interceptor ครอบคลุมทุก action สำคัญ (Create/Update/
  Confirm/Cancel PO, Assign/Produce, Inspect batch/lot, Create/Update shipment, Goods receipt, Create/Update
  user, Update role permissions, Issue/Revise invoice, Record payment, Update VAT config) บวก Login/LoginFailed
  แยกต่างหาก — ไม่พบ endpoint update/delete ของ audit log เอง (append-only จริงตาม ADR-007)

**ไม่ตรง/ขาด (ดู defects.md สำหรับรายละเอียดเต็ม):**
- DEF-01 (Critical): overpaid invoice ถูก mark "Paid" ผิดความหมาย
- DEF-04 (Major): Dashboard epic 9 — ข้อความ empty/edge-state ที่ AC ระบุ (ECP-027 AC2, ECP-028 AC3,
  ECP-029 AC2) ไม่ถูกคำนวณในฝั่ง backend เลย และฝั่ง FE render raw JSON จึงไม่มีทางแสดงข้อความเหล่านี้อยู่ดี
- DEF-05 (Major): invoice line ผูก productId กับ PO line แรกเสมอ ไม่ใช่ product ที่ user เลือกจริง (สำหรับ PO
  multi-line)

**FE simplification ที่ Engineer สารภาพไว้ — ประเมินผลกระทบต่อ AC จริง**:
- Dashboard แสดง raw JSON: **กระทบ AC จริง** (ดู DEF-04) ไม่ใช่แค่ "ไม่สวย" — AC ระบุข้อความเฉพาะเจาะจงที่ต้อง
  ปรากฏบนจอ ซึ่งไม่มีทางเกิดขึ้นได้จาก `<pre>{JSON.stringify(...)}</pre>`
- PO/Invoice เพิ่ม line ทีละรายการ (ไม่ใช่ตารางแก้ไขได้): **ไม่กระทบ AC โดยตรง** (ACs ไม่ได้ระบุ UX pattern
  เฉพาะเจาะจง) แต่ **เผยบั๊กจริง 1 ตัว** (DEF-05 — invoice line productId ผูกกับ line แรกเสมอ) ซึ่งไม่ใช่แค่
  UI polish อย่างที่ Engineer บันทึกไว้
- Invoice issue ผูกกับ product ของ PO line แรกเป็นค่าเริ่มต้น: **นี่คือ DEF-05 เอง** — ยืนยันเป็น defect จริง
  ไม่ใช่ observation

---

## 3. Automation coverage — ตัวเลขที่ verify แล้วจริง (ไม่ใช่แค่ที่ออกแบบไว้)

Test-plan.md (Phase 1) รายงาน coverage ที่ "ออกแบบไว้" = 90.8% เต็มรูป + 5.9% บางส่วน จาก 119 AC

**Verify phase (Phase 2) ต้องแยกให้ชัดระหว่าง "ออกแบบไว้" กับ "รันจริงแล้วผ่าน" ในสภาพแวดล้อมนี้:**

| หมวด | ไฟล์ | สถานะการรันจริง |
|---|---|---|
| Unit (Q1) | 8 ไฟล์ | 6 ไฟล์ compile และรันได้ (4 ผ่านทั้งหมด, 1 ยืนยันบั๊กจริง = DEF-01, 1 adapter ผ่านทั้งหมด); 2 ไฟล์ skip พร้อมอ้างอิง Engineer's colocated test ที่ครอบคลุม AC เดียวกันแล้ว |
| Integration (Q2) | 13 ไฟล์ | **0 ไฟล์รันได้** — บล็อกโดย DEF-02 + ENV-01 |
| Concurrency (Q7) | 4 ไฟล์ | **0 ไฟล์รันได้** — บล็อกโดย DEF-02 + ENV-01 (นี่คือเคสวิกฤตที่ Gate 1 เน้นย้ำ) |
| E2E (Q3/Q4) | 6 ไฟล์ | **0 ไฟล์รันได้** — บล็อกโดย DEF-02 (ไม่มี @playwright/test) + DEF-03 (ไม่มี testid) + ENV-01 (ต้องมี backend+DB จริง) |
| UAT (Q6) | Manual | ยังไม่เริ่ม — รอผ่าน gate นี้ก่อนตามที่ระบุใน test-plan.md §5 |

**สรุปตรงไปตรงมา**: จาก 119 AC, ระดับที่ "verify แล้วว่ารันได้จริงและผ่าน" ในสภาพแวดล้อมนี้ครอบคลุมส่วนใหญ่ของ
**unit-level AC** (ประมาณ ECP-004/005/008/009/010/019/020/021/037/038 AC3, ADR-006 format — ผ่านหมด ยกเว้น
DEF-01) บวกกับ **integration-level business logic ที่ Engineer เขียน colocated test คู่ขนานไว้เอง** (RBAC,
audit, permission cache, invoice service, PO/production/QC/shipping rules — ทั้งหมด 123 test ผ่าน) แต่
**AC ที่ต้องพึ่ง DB จริง/concurrency จริง/WebSocket จริง/browser จริงโดยเฉพาะ (ส่วนใหญ่ของ Integration+
Concurrency+E2E ใน traceability matrix เดิม) ยังไม่มีหลักฐานรันจริงเลยแม้แต่ครั้งเดียว** — คิดเป็นสัดส่วน
คร่าวๆ ว่า automation ที่ "verify แล้วจริง" อยู่ที่ประมาณ **50-55% ของ 119 AC** ส่วนที่เหลือ (~45-50%)
ต้องรอ DEF-02 ถูกแก้ + environment (Docker/MySQL) จาก DevOps ก่อนจึงจะ verify ได้ครบ

---

## 4. Defect summary (รายละเอียดเต็มที่ `defects.md`)

| ID | Severity | เรื่อง |
|---|---|---|
| DEF-01 | **Critical** | Invoice ถูก mark "Paid" ผิดความหมายเมื่อ overpaid หลัง revise ลดยอด (ยืนยันด้วยเทสต์จริง) |
| DEF-02 | **Critical** | Test infra ไม่เชื่อมต่อ — 23/31 automated spec ของ QA รันไม่ได้เลยแม้จะมี DB |
| DEF-03 | Major | ไม่มี `data-testid` ใน FE เลย + โครงสร้าง flow จริงต่างจาก e2e spec เดิมมาก |
| DEF-04 | Major | Dashboard epic 9 — ข้อความ empty/edge-state ตาม AC ไม่ถูก implement |
| DEF-05 | Major | Invoice line ผูก productId กับ PO line แรกเสมอ (ข้อมูลผิดจริงสำหรับ PO multi-line) |
| MIN-01 | Minor | ESLint warning 5 จุดในไฟล์ QA เอง |
| MIN-02 | Minor/Observation | ไม่มี defense-in-depth type guard ที่ตัว pure function (มี zod กันไว้แล้วที่ API) |
| MIN-03 | Minor/Observation | `"ReadyToShip"` เป็น type value ที่ไม่มี code path ใช้งานจริง |
| ENV-01 | Environment | ไม่มี Docker/MySQL daemon ใน sandbox นี้ |
| ENV-02 | Environment | `supertest`/`@playwright/test` ไม่ได้ติดตั้ง |

**รวม: 2 Critical, 3 Major, 3 Minor, 2 Environment-blocked**

---

## 5. เคสที่ยังไม่ verify และรอ environment (ต้องรันให้ครบก่อนขึ้น production — ไม่ใช่ FAIL แต่ยังไม่ผ่านการยืนยัน)

1. **ECP-010 AC4 / N1** — stock ledger accuracy 100% ภายใต้ concurrency จริงกับ MySQL row-lock จริง
   (unit-level mutex-based test ของ Engineer ผ่านแล้ว แต่ยังไม่เท่ากับ MySQL `SELECT...FOR UPDATE` จริง)
2. **N4** — NumberSequence ไม่ซ้ำภายใต้ concurrency จริงกับ MySQL (`INSERT...ON DUPLICATE KEY UPDATE` จริง)
3. **ECP-023 AC2** — permission TTL ≤5 นาที รวม clamp `PERMISSION_CACHE_TTL` >300s → ≤300s ภายใต้เวลาจริง
   (unit test ของ config loader ผ่านแล้ว แต่ end-to-end ผ่าน HTTP request cycle จริงยังไม่ได้ยืนยัน)
4. **§5.5** — payment↔invoice-version race กับ DB transaction จริง (2 concurrent revise requests ชนกัน)
5. **ทุก e2e flow** ผ่าน browser จริงต่อ frontend+backend+DB ครบ stack (demo flow เต็มสาย, invoice revision
   timeline, admin VAT config, role menu/onboarding, realtime stock ≤1 นาที, error message audit scan)

ทั้งหมดนี้ต้องรอ (ก) Engineer/DevOps แก้ DEF-02 (เชื่อม jest + ติดตั้ง supertest/@playwright/test) (ข) DevOps
เตรียม environment ที่มี Docker/MySQL daemon ใช้งานได้จริง ก่อนจึงจะรันได้ครบ

---

## 6. สถานะที่ตั้ง

**FAILED** — พบ Critical defect 2 รายการ (DEF-01, DEF-02) และ Major defect 3 รายการ (DEF-03, DEF-04, DEF-05)
ตามกติกา Exit Gate ("ไม่มี critical/major defect เปิดอยู่") ไม่ผ่าน → ส่งกลับ Engineer พร้อมรายการ defect เต็ม
ที่ `docs/test-plans/erp-core-prototype/defects.md`

**หลังจาก Engineer แก้ DEF-01/03/04/05 แล้ว**: QA ต้อง re-verify defect เหล่านั้น + ยังต้องรอ DevOps แก้ DEF-02
(เชื่อม test infra) และเตรียม environment (ENV-01/02) ก่อนจึงจะรัน integration/concurrency/e2e ได้ครบและปิด
gate นี้อย่างสมบูรณ์
