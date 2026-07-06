# DevOps Verify Report — ERP Core Prototype

- **slug**: `erp-core-prototype`
- **วันที่**: 2026-07-07
- **เขียนโดย**: DevOps
- **อ้างอิง**: `docs/test-plans/erp-core-prototype/verify-report.md` + `defects.md` (QA re-verify,
  READY_FOR_DEVOPS), `docs/design/erp-core-prototype/tasks.md` (D1-D5)

> จุดยืนเดียวกับ QA: รายงานนี้บันทึกเฉพาะสิ่งที่ **รันจริง** ในเครื่องนี้ (Docker Desktop ใช้งานได้จริงในรอบนี้ —
> ต่างจากสภาพแวดล้อมของ QA ที่ไม่มี Docker/MySQL daemon) พร้อมตัวเลขจริงทุกจุด

---

## 0. สรุปสั้น

สภาพแวดล้อมของเครื่องนี้ **มี Docker Desktop daemon ทำงานได้จริง** ทำให้เป็นครั้งแรกที่ระบบทั้งหมด (migration,
seed, integration test, e2e test) ได้ถูกรันจริงกับ MySQL และ browser จริง ผลที่ได้: **สภาพแวดล้อม/infra ที่
DevOps รับผิดชอบ (D1-D5) ทำงานถูกต้องสมบูรณ์ทุกจุด** แต่การรันจริงครั้งแรกนี้ **เปิดโปงบั๊กจริงในโค้ดที่ไม่เคย
ถูกตรวจพบมาก่อน** (เพราะไม่เคยมีใครรันกับ DB/browser จริงเลยจนถึงตอนนี้) — สรุปคือ:

- ✅ Docker/MySQL/migration/seed (ครั้งแรก) : **ผ่าน**
- ⚠ Seed idempotency (รันซ้ำ) : **พบบั๊ก Critical (DEF-06)** — มี workaround ระดับ infra ให้แล้ว
- ⚠ Integration tests (17 ไฟล์, 154 tests) : **รันได้ครบ, 71 ผ่าน / 82 ไม่ผ่าน / 1 skip** — ไม่ผ่านส่วนใหญ่
  เพราะ DEF-06 (บางส่วน) + DEF-08 (response envelope mismatch, ส่วนใหญ่)
- ⚠ E2E tests (19 tests, 6 ไฟล์) : **รันได้ครบผ่าน browser จริง, 1 ผ่าน / 18 ไม่ผ่าน** — ส่วนใหญ่บล็อกโดย
  DEF-07 (onboarding tour overlay ค้าง) และ testid/flow ที่ไม่ตรงกับหน้าจอจริง ณ ตอนที่ทดสอบ
- ✅ Unit tests : 170 passed / 12 skipped / 0 failed (28/30 suites) — เหมือนเดิม ไม่กระทบ

**บทสรุป**: นี่คือ **หลักฐานว่าทำไม DevOps ต้องทดสอบกับ environment จริงก่อน Gate 2** — โค้ดผ่าน unit test/
static review ทั้งหมดมาโดยตลอด แต่มีบั๊ก data-integrity ระดับ Critical ที่ซ่อนอยู่ (NumberSequence) และบั๊ก UX
ระดับ Major (onboarding tour) ที่ไม่มีทางถูกจับได้จนกว่าจะรันกับ MySQL/browser จริง — สถานะ = **FAILED**,
ส่งกลับ Engineer พร้อม defect list

---

## 1. Environment ที่ยืนยันแล้ว

| รายการ | ผล |
|---|---|
| `docker info` | Docker Desktop daemon ทำงานปกติ (WSL2 backend, 16 CPU, 7.69GiB RAM) |
| `docker compose up -d mysql` (จาก volume ใหม่ล้วนๆ, ผ่าน `docker compose down -v` ก่อน) | สำเร็จ, healthy ภายใน <5s |
| `docker/mysql/init/01-create-test-db.sql` (ใหม่ - DevOps เพิ่ม) | สร้าง schema แยก `erp_core_prototype_test` สำหรับ integration test อัตโนมัติตอน container init ครั้งแรก — ยืนยันด้วย `SHOW DATABASES` |
| `npx prisma migrate deploy` กับ `erp_core_prototype` (MySQL จริง, **ครั้งแรกในประวัติโปรเจกต์**) | **สำเร็จ** — migration `20260706000000_init` apply ได้จริง ไม่มี error |
| `npm run db:seed` (ครั้งแรก, MySQL จริง) | **สำเร็จ** — สร้างครบ 7 users, 5 customers, VATConfig 7%, 10 materials, 5 products, PO→Batch→QC→Shipment→Invoice v1→v2 demo chain |
| `npx playwright install chromium` | สำเร็จ (`chromium-1228`, `chromium_headless_shell-1228` ติดตั้งจริง) |
| `.env.test` (ใหม่ - DevOps เพิ่ม) | ชี้ไป schema แยก + `PERMISSION_CACHE_TTL=2` ตามที่ QA ขอใน test-plan.md §7 |
| `npm run dev` (backend :4000 + frontend :5173) | ขึ้นจริง, `curl /health` → 200, frontend → 200 |

---

## 2. DEF-06 [CRITICAL, ใหม่ — พบโดย DevOps] — NumberSequence ให้เลขซ้ำ/ผิดจริงเมื่อรันกับ MySQL จริงครั้งแรก

### หลักฐานที่ 1 — `npm run db:seed` รันครั้งที่ 2 (idempotency ที่ E1 DoD อ้างว่ามี) ล้มเหลว 100% ของครั้งที่ลอง (3/3)

```
[seed] customers...
[seed] failed: PrismaClientKnownRequestError:
Invalid `prisma.customer.create()` invocation in prisma\seed.ts:217:44
Unique constraint failed on the constraint: `customer_customer_id_key`
```

### หลักฐานที่ 2 — reproduce ที่ root cause ด้วย raw SQL ตรงๆ (ไม่ผ่าน Prisma/Node เลย)

```sql
DELETE FROM number_sequence WHERE prefix='TESTDEMO';
SELECT LAST_INSERT_ID() as before_insert;                 -- 0
INSERT INTO number_sequence (prefix, period_key, counter)
  VALUES ('TESTDEMO','ALL',1)
  ON DUPLICATE KEY UPDATE counter = LAST_INSERT_ID(counter+1);
SELECT LAST_INSERT_ID() as after_first_insert;             -- 0  <-- ควรเป็น 1, บั๊ก
INSERT INTO number_sequence (prefix, period_key, counter)
  VALUES ('TESTDEMO','ALL',1)
  ON DUPLICATE KEY UPDATE counter = LAST_INSERT_ID(counter+1);
SELECT LAST_INSERT_ID() as after_second_insert;            -- 2  (ถูกต้อง เพราะเข้า UPDATE branch)
```

**Root cause**: `src/backend/lib/numberSequence.ts#PrismaSequenceExecutor.incrementAndGet` ใช้ idiom
`INSERT ... ON DUPLICATE KEY UPDATE counter = LAST_INSERT_ID(counter + 1)` ตาม ADR-006 — แต่ **เมื่อเป็น
INSERT จริง (แถวของ (prefix, period_key) นั้นยังไม่เคยมีมาก่อน)** MySQL จะ**ไม่เรียก** `ON DUPLICATE KEY
UPDATE` clause เลย ดังนั้น `LAST_INSERT_ID(counter+1)` **ไม่เคยถูก execute** สำหรับแถวใหม่แรกสุด — ทำให้
`SELECT LAST_INSERT_ID()` ที่ตามมาคืนค่า **stale** (ค่าเก่าจาก connection/session เดิม ซึ่งอาจเป็น 0 ถ้าเป็น
connection ใหม่ หรือค่าจาก prefix อื่นที่เพิ่งใช้บน connection เดียวกัน ถ้า pool reuse connection) — ไม่ใช่ค่า
`1` ที่ตั้งใจไว้ เพราะตาราง `number_sequence` **ไม่มีคอลัมน์ auto_increment** (`@@id([prefix, periodKey])`
เป็น composite key ล้วน) ดังนั้น MySQL ไม่มีทางรู้ว่าต้องตั้ง `LAST_INSERT_ID()` ให้เท่าไหร่จาก plain INSERT

นี่คือบั๊กที่กระทบ**ทุก prefix ที่ถูกใช้ครั้งแรกในฐานข้อมูลใหม่** (CUSTOMER, USER, PO, BATCH, SHIPMENT, INVOICE)
— และเมื่อ Prisma ใช้ connection pool หลาย connection (ค่า default), เลขที่ได้คือแบบสุ่ม/ชนกันได้จริง ไม่ใช่แค่
ทฤษฎี — ยืนยันด้วยเทสต์ concurrency ของ QA เอง (ดูหลักฐานที่ 3)

### หลักฐานที่ 3 — เทสต์ concurrency ที่ Gate 1 เน้นย้ำว่าสำคัญที่สุด (`tests/integration/concurrency/numberSequence.spec.ts`) ล้มเหลวจริง

```
NumberSequence concurrency safety (ADR-006 rev.2) › TC-NFR-N4 (Customer ID):
  N concurrent customer creations never produce a duplicate customer_id
  expect(received).toBe(expected)
  Expected: 99
  Received: 1
```
(หมายเหตุ: ผลลัพธ์ตัวเลข `Received: 1` ในเคสนี้เกิดร่วมกับ DEF-08 ด้านล่างด้วย — เทสต์อ่าน
`res.body.customer_id` ซึ่งไม่ตรงกับ shape จริงของ response ทำให้ทุกค่าที่อ่านได้เป็น `undefined` เหมือนกันหมด
(`Set` size จึงเป็น 1) **แต่ root cause ของ DEF-06 เองก็ยังเป็นปัญหาจริงที่ยืนยันแยกต่างหากแล้วด้วย raw SQL ในหลักฐานที่ 2**
— ทั้งสองปัญหาต้องแก้คนละจุด)

### Workaround ระดับ infra ที่ DevOps ใส่ไว้แล้ว (ไม่ใช่การแก้ business logic)

เพิ่ม `?connection_limit=1` ใน `DATABASE_URL` (`.env`, `.env.test`, `docker-compose.yml`) — บังคับให้
Prisma ใช้ connection เดียวตลอด ทำให้ query ทั้งหมด serialize ผ่าน session เดียว ลดโอกาสชนกันของค่า
stale ระหว่างหลาย connection ลงมาก (ยืนยันด้วยการรัน `npm run db:seed` ซ้ำ 3 ครั้งติดต่อกันสำเร็จทั้งหมด
หลังใส่ workaround นี้ — ก่อนใส่ fail 3/3) **แต่นี่ไม่ใช่การแก้ root cause**:
- เลขแรกของแต่ละ prefix ใหม่ยังคงผิด/ไม่แน่นอน (แค่ไม่ชนกับใครเพราะไม่มีคู่แข่งแล้ว)
- ใช้ไม่ได้จริงเมื่อ Phase 3 ต้องรองรับหลาย instance/connection (Cloud Run scale >1) — ต้องแก้ก่อนขึ้น production

**คำแนะนำแก้ไข (ไม่ใช่คำสั่งบังคับ Engineer เลือกวิธีเอง)**: ใช้ `LAST_INSERT_ID(expr)` ใน VALUES clause ของ
INSERT เองด้วย เพื่อบังคับตั้งค่า session เสมอไม่ว่าจะเข้า branch ไหน:
```sql
INSERT INTO number_sequence (prefix, period_key, counter) VALUES (?, ?, LAST_INSERT_ID(1))
ON DUPLICATE KEY UPDATE counter = LAST_INSERT_ID(counter + 1)
```

---

## 3. DEF-07 [MAJOR, ใหม่ — พบโดย DevOps ผ่าน Playwright จริง] — Onboarding tour overlay ค้าง บังปุ่มกดเมนูทั้งหน้า

รันจริงด้วย `npx playwright test` (chromium, browser จริง, backend+frontend+MySQL ครบ stack):

```
tests\e2e\demoFlow.spec.ts › Full order-to-cash demo flow (brief.md DoD #1)
  Test timeout of 30000ms exceeded.
  - waiting for getByTestId('nav-po-list')
    - element resolved, visible, enabled
    - attempting click action
    - <rect ... mask="url(#ant-tour-mask-:r3:)"> from <div>... subtree intercepts pointer events
    - retrying click action ... (53 ครั้ง จนหมดเวลา 30s)
```

**Impact**: การคลิกเมนู "คำสั่งซื้อ (PO)" ทันทีหลัง login ครั้งแรก (ตามที่ onboarding tour ตั้งใจแนะนำผู้ใช้
ใหม่ ECP-034 AC2) **ถูกบัง/บล็อกโดย tour overlay ของตัวเอง จนคลิกไม่ผ่านเลยภายใน 30 วินาที** — นี่คือ demo flow
หลักที่สุดของทั้งระบบ (brief.md DoD #1) block จริง ไม่ใช่แค่ automated test flaky — เป็นบั๊ก UX ที่ผู้ใช้จริง
คนแรกที่ login ก็จะเจอปัญหาเดียวกัน (ทางแก้ชั่วคราวสำหรับผู้ใช้: กด Escape หรือคลิกพื้นที่ว่างก่อน)

**เกี่ยวข้อง**: ECP-034 AC2 (onboarding tour), `src/frontend/ui/OnboardingTour` (ADR-008 wrapper)

**คำแนะนำ**: ตรวจสอบว่า tour component ปิด overlay/mask ให้ครบ หรือย้าย mask ให้ไม่ intercept pointer
events บน element ที่ tour กำลังชี้แนะอยู่ (antd Tour ปกติควรให้คลิก element เป้าหมายได้ระหว่างเปิด tour)

---

## 4. DEF-08 [MAJOR, ใหม่ — พบโดย DevOps, ต้อง QA/Engineer sync กัน] — Response envelope ไม่ตรงกันระหว่าง test spec กับ API จริง

เทสต์ของ QA จำนวนมาก (เช่น `tests/integration/customer.spec.ts`, `tests/integration/concurrency/
numberSequence.spec.ts`) คาดหวัง response เป็น field แบนๆ ตรงๆ เช่น `res.body.customer_id` — แต่ API จริง
(`src/backend/modules/customer/customer.routes.ts`) ตอบกลับเป็น
```ts
{ status: 201, body: { data: result.customer, warning: result.duplicateNameWarning }, ... }
```
คือ field จริงอยู่ที่ `res.body.data.customerId` (ซ้อนใต้ `data`, camelCase) ไม่ใช่ `res.body.customer_id`
(แบน, snake_case) — `architecture.md` §6 ไม่ได้ระบุ response envelope ไว้ชัดเจน ทำให้ QA (เขียน spec คู่ขนาน
โดยไม่เห็นโค้ดจริง) กับ Engineer (implement เอง) ตีความต่างกัน

**Impact**: ทำให้ automated assertion จำนวนมาก (สังเกตจากตัวเลขจริง: อย่างน้อย 20+ จุดจาก 82 test ที่ fail ใน
integration suite อ่าน field ผิดตำแหน่ง/ผิด case) รายงานผลเป็น "ไม่ผ่าน" ทั้งที่ business logic เบื้องหลังอาจ
ถูกต้องอยู่แล้ว — DevOps **ไม่ได้แก้ทั้งสองฝั่ง** (เพราะเป็นทั้ง `tests/` ของ QA และ `src/` ของ Engineer ซึ่งอยู่
นอกขอบเขต DevOps) เพียงบันทึกไว้ให้ QA/Engineer ตกลง contract กันให้ชัดในรอบถัดไป (แนะนำ: เขียนระบุ envelope
shape ไว้ใน architecture.md §6 อย่างชัดเจนเป็นครั้งแรก เพื่อไม่ให้เกิดซ้ำกับ endpoint อื่นที่ยังไม่ได้ทดสอบ)

---

## 5. ตัวเลขจริงแบบละเอียด (real numbers, ไม่ปัดเศษ)

### Unit tests
```
npm run test:unit
Test Suites: 2 skipped, 28 passed, 28 of 30 total
Tests:       12 skipped, 170 passed, 182 total
```
(ตรงกับที่ QA/Engineer เคยรายงานไว้ — ไม่กระทบจากการรันกับ MySQL จริง เพราะ unit test ใช้ fake/mock)

### Integration tests (17 ไฟล์, ต้องมี MySQL จริง — ครั้งแรกที่รันจนจบในประวัติโปรเจกต์นี้)
```
npm run test:integration
Test Suites: 17 failed, 17 total   (ทุกไฟล์มี >=1 test ไม่ผ่าน แต่ collect+รันได้ครบทั้งไฟล์)
Tests:       82 failed, 1 skipped, 71 passed, 154 total
Time:        ~60s
```
สาเหตุของ 82 ที่ fail แยกตามหมวด (ประมาณการจาก sampling ข้อความ error จริง ไม่ใช่ตัวเลขทางการ):
- ส่วนหนึ่ง (สังเกตได้ >=20 จุด) : DEF-08 (envelope mismatch) — `Received: undefined` เมื่อคาดหวัง field
- ส่วนหนึ่ง (20 จุด `Received: 500`) : ผสมระหว่าง DEF-06 (constraint violation ระหว่าง reseed) และ
  test fixture ที่ใช้ placeholder ID สมมติ (เช่น `"SEEDED_PO_SHIPPED_50000"`) ที่ไม่ได้ resolve เป็น ID จริง
  จาก seed (ข้อจำกัดที่ QA เองบันทึกไว้ใน `fixtures.ts`: "QA cannot know Prisma-generated internal IDs
  ahead of time")
- ส่วนหนึ่ง (15 จุด `Received: 400`) : validation/business-rule edge case ที่ต้องดูทีละเคสว่า business
  logic จริงหรือ test data ไม่ตรง

### E2E tests (6 ไฟล์/19 test, ผ่าน browser จริง — backend+frontend+MySQL ครบ stack, ครั้งแรกในประวัติโปรเจกต์)
```
npm run test:e2e
Running 19 tests using 6 workers
18 failed, 1 passed  (1.3m)
```
สาเหตุหลัก: DEF-07 (onboarding tour บัง — บล็อก demoFlow.spec.ts ทั้งไฟล์), testid ที่ QA เขียนไว้ยังไม่ตรง
กับหน้าจอจริง 100% ในบางจุด (เช่น `admin-section-manage-users` หา element ไม่เจอ), และ VAT config/invoice
revision timeline flow ต้องดู UI จริงเทียบกับ spec อีกรอบ

---

## 6. สิ่งที่ DevOps ทำสำเร็จ (D1-D5 checklist)

| Task | สถานะ | หลักฐาน |
|---|---|---|
| D1 — Docker Compose (Node LTS + MySQL 8) | ✅ | `docker compose up -d mysql` healthy, full stack `docker compose up -d` buildable |
| D2 — Config & secrets (.env) | ✅ | `.env.example` ครบทุกตัวแปร, `.env`/`.env.test` ไม่ commit เป็น secret จริง (`.env.test` เป็น local dummy values, ปลอดภัยที่จะ commit) |
| D3 — DB migration & seed automation | ✅ (พบ DEF-06 ระหว่างทาง, มี workaround) | `prisma migrate deploy` + `npm run db:seed` รันจริงสำเร็จกับ MySQL จริง, `npm run setup`/`npm run reset` = one-command setup |
| D4 — Build/run scripts + lint ใน CI | ✅ | `npm run build`, `npm run lint` (0 error) |
| D5 — Phase 3 readiness note | ✅ | เพิ่มคำเตือนเรื่อง DEF-06 ใช้ไม่ได้กับ multi-instance ใน runbook.md §9 |

---

## 7. สรุปสถานะ

**FAILED** — พบ Critical defect ใหม่ 1 รายการ (DEF-06) และ Major defect ใหม่ 2 รายการ (DEF-07, DEF-08)
ที่ไม่เคยถูกตรวจพบมาก่อนเพราะไม่เคยมีใครรันกับ MySQL/browser จริงจนถึงตอนนี้ — สภาพแวดล้อม/infra (ความ
รับผิดชอบของ DevOps) ทำงานถูกต้องสมบูรณ์ทุกจุดและพร้อมให้ Engineer debug ต่อได้ทันที (มี `.env.test`,
`npm run setup`/`reset`, MySQL 2 schema แยก dev/test, Playwright ติดตั้งแล้ว) — ส่งกลับ Engineer พร้อม
defect list นี้ (DEF-06 ต้องแก้ก่อนอย่างอื่น เพราะเป็น Critical/data-integrity; DEF-07 กระทบ demo flow หลัก;
DEF-08 ต้อง QA+Engineer คุยกันเพื่อ sync contract)
