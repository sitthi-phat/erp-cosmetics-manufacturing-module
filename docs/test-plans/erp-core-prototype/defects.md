# Defect Log — ERP Core Prototype — QA Verify Phase (เขียน 2026-07-07, อัปเดต re-verify 2026-07-07)

- **slug**: `erp-core-prototype`
- **เขียนโดย**: QA — Phase 2 (Verify) + Phase 2 (Re-verify หลัง Engineer แก้ defect ครบ 5 ตัว)
- **สถานะรวมรอบแรก**: 2 Critical, 3 Major, 3 Minor/Observation — **status = FAILED**
- **สถานะรวมหลัง re-verify**: **DEF-01, DEF-02, DEF-04, DEF-05 = Fixed (ยืนยันด้วยหลักฐานรันจริง/static
  review); DEF-03 = Partially Fixed (testid เพิ่มครบ + flow ปรับ e2e spec แล้ว แต่ยังรันจริงไม่ได้เพราะ
  environment)** — เหลือแค่ Minor + Environment-blocked → ดู §"สรุป re-verify" ท้ายไฟล์

Legend severity: **Critical** = ข้อมูลผิด/สูญหาย/เงื่อนไข Gate 1 ถูกละเมิดตรงๆ, **Major** = AC ที่ระบุชัด
ไม่ผ่านจริงหรือ blocking การ verify ของเคสสำคัญ, **Minor** = ไม่กระทบ business logic/ยังไม่ยืนยันว่าเป็นปัญหาจริง.

---

## DEF-01 [CRITICAL] — Invoice ถูก mark เป็น "Paid" ผิดความหมายเมื่อ overpaid หลังแก้ไข (revise) ลดยอด

> ### สถานะ: **FIXED** (ยืนยัน re-verify 2026-07-07)
> `computeReconciliation` เพิ่ม status ที่ 4 คือ `"Overpaid"` แยกออกจาก `"Paid"` โดยตรง:
> ```ts
> if (outstanding < 0) status = "Overpaid";
> else if (paidAmount <= 0) status = "Issued";
> else if (outstanding === 0) status = "Paid";
> else status = "PartiallyPaid";
> ```
> ยืนยันครบทุกชั้น: (1) `prisma/schema.prisma` enum `InvoiceStatus` เพิ่ม `Overpaid` + migration SQL
> (`prisma/migrations/.../migration.sql`) มี `ENUM('Issued','PartiallyPaid','Paid','Overpaid','Superseded')`
> จริง (2) `src/frontend/ui/StatusTag.tsx` รองรับ `Overpaid: "volcano"` (3) Engineer เพิ่ม assertion ใน
> `invoice.service.test.ts` เองแล้ว: `expect(result.invoice.status).not.toBe("Paid"); expect(result.invoice.status).toBe("Overpaid");`
> (4) **QA รัน `tests/unit/paymentOutstanding.spec.ts` ที่เคย FAIL ซ้ำอีกครั้ง — ผ่านแล้ว (ดู §"ผลรัน re-verify")**
> ปิด defect นี้

**เกี่ยวข้อง**: §5.5 Payment↔Invoice-version reconciliation (เงื่อนไข Gate 1 ข้อ Payment reconciliation),
TC-037-REC1, test-plan.md §4.4

**ที่มา**: `src/backend/modules/invoice/invoice.calc.ts#computeReconciliation`

```ts
export function computeReconciliation(totalAmount: number, paidAmount: number): ReconciliationResult {
  const outstanding = roundMoney(totalAmount - paidAmount);
  let status: ReconciliationResult["status"];
  if (paidAmount <= 0) status = "Issued";
  else if (paidAmount >= totalAmount) status = "Paid";   // <-- ตั้ง "Paid" แม้เมื่อ overpaid
  else status = "PartiallyPaid";
  return { outstanding, status, overpaid: outstanding < 0 };
}
```

**ขั้นตอนทำซ้ำ (reproduced ด้วย unit test จริง, ไม่ต้องมี DB)**:
1. Invoice v1 total = 53,500 บาท ชำระเต็ม 53,500 → PartiallyPaid/Paid ปกติ
2. Revise invoice ลดยอดลงเหลือ total ใหม่ = 30,000 บาท (น้อยกว่ายอดที่จ่ายไปแล้ว 40,000/53,500)
3. เรียก `computeReconciliation(30000, 40000)`

**Expected** (ตาม test-plan.md §4.4 ที่ QA ออกแบบไว้ตั้งแต่ Phase 1, ตรงตามเจตนาของ Gate 1):
`status` ต้อง **ไม่ใช่** `"Paid"` (ต้องแยกสถานะที่สื่อว่า "จ่ายเกินยอดที่ถูกต้องแล้ว ต้องตรวจสอบ/คืนเงิน" อย่างชัดเจน
พร้อมธง `overpaid = true`)

**Actual**: `status = "Paid"` และ `overpaid = true` พร้อมกัน — invoice record ในระบบจะถูกบันทึกสถานะ "Paid"
(ดู `invoice.service.ts#reviseInvoice` → `createRevision({..., status: recon.status})`) ทั้งที่จริงมีการจ่ายเกิน
ยอดที่ถูกต้องไปแล้ว 10,000 บาท ซึ่งฝ่ายบัญชีจะเห็นว่า invoice "จบสมบูรณ์แล้ว (Paid)" โดยไม่รู้ว่าต้องดำเนินการคืนเงิน/
ปรับปรุงยอด — เสี่ยงต่อความถูกต้องทางบัญชีโดยตรง (ตรงกับ NFR "ความแม่นยำสูง" ที่ปอนด์เน้นย้ำใน Gate 1)

**หลักฐานการรัน (real, ไม่ต้องมี DB/Docker)**:
```
FAIL tests/unit/paymentOutstanding.spec.ts
  ● §5.5: overpaid — new (revised) total is LESS than what was already paid
    expect(received).not.toBe(expected)
    Expected: not "Paid"
    at tests/unit/paymentOutstanding.spec.ts:46
```
(รันด้วย `npx jest --config <ephemeral-qa-config>` หลังจาก QA reconcile import ให้ตรงกับ
`invoice.calc.ts#computeReconciliation` จริง — ดูหัวไฟล์ `tests/unit/paymentOutstanding.spec.ts` สำหรับที่มา)

**ข้อสังเกตเสริม**: บั๊กนี้หลุดรอดจากชุดทดสอบของ Engineer เองด้วย เพราะ
`src/backend/modules/invoice/invoice.service.test.ts` เทสต์ชื่อ "flags overpaid when a revise drops the
total below already-paid amount (§5.5)" (บรรทัด 227-247) ยืนยันแค่ `result.overpaid === true` แต่ไม่เคย assert
ว่า `status !== "Paid"` — เป็นช่องโหว่ของชุดเทสต์ Engineer เองด้วย ไม่ใช่แค่ QA ไม่ได้รันเทสต์ (แม้ว่า DEF-02
ก็เป็นสาเหตุที่ทำให้ QA เองไม่เห็นบั๊กนี้เร็วกว่านี้เช่นกัน)

**Severity**: Critical — ละเมิดเงื่อนไข Gate 1 ("payment↔invoice-version reconciliation... overpaid flag")
โดยตรง ข้อมูลทางบัญชีผิดพลาดจริง ไม่ใช่แค่ edge case สมมติ

**คำแนะนำแก้ไข (ไม่ใช่คำสั่งบังคับ Engineer เลือกวิธีเอง)**: แยก status เป็นค่าที่ 4 (เช่น `"Overpaid"`) หรือคง
`"PartiallyPaid"`/ค่าที่ไม่ใช่ `"Paid"` แล้วให้ UI ใช้ธง `overpaid` ควบคู่กับ `status` เพื่อแสดงข้อความเตือนแยก
ต่างหาก ไม่ผูกกับคำว่า "Paid" ที่สื่อความหมายว่า "จบสมบูรณ์"

---

## DEF-02 [CRITICAL] — Test infrastructure ของ QA ไม่ถูกเชื่อมต่อเลย: 23/31 automated spec รันไม่ได้แม้จะมี DB

> ### สถานะ: **FIXED** (ยืนยัน re-verify 2026-07-07) — ส่วนที่เหลือคือ Environment-blocked ไม่ใช่ config ผิด
> `jest.config.js` เป็น multi-project แล้ว: `unit` (default, รวม `tests/unit/**/*.spec.ts`) รันได้ไม่ต้องมี DB,
> `integration` (`tests/integration/**/*.spec.ts` รวม concurrency) รันเมื่อ `RUN_DB_TESTS=1` เท่านั้น —
> ติดตั้ง `supertest`, `@types/supertest`, `@playwright/test`, `cross-env` ครบ, มี `playwright.config.ts`,
> เพิ่ม script `test:unit`/`test:integration`/`test:e2e`, เปิด `export { app }` ใน `src/backend/app.ts`,
> เพิ่ม `POST /api/v1/test/seed-reset` (non-production only), reconcile seed usernames ให้ตรง
> `tests/helpers/fixtures.ts` (`SEED_USERS`) เป๊ะ — ยืนยันแล้ว: `sales_demo/warehouse_demo/production_demo/
> qc_demo/logistics_demo/finance_demo/admin` ตรงกับ `prisma/seed.ts#USERNAME_BY_CODE` ทุกตัว
>
> **ยืนยันด้วยการรันจริง**:
> - `npx jest` (default = unit project): **170 passed, 12 skipped, 0 failed, 28/30 suites** ตรงกับที่
>   Engineer อ้างเป๊ะ (ดู §"ผลรัน re-verify")
> - `RUN_DB_TESTS=1 npx jest --selectProjects integration`: **collect ครบ 17 ไฟล์จริง** (ไม่ใช่ "No tests
>   found" แบบรอบก่อน) — ทุกไฟล์ fail ที่ `beforeAll`/`resetSeed()` timeout (5000ms) เพราะไม่มี MySQL
>   ให้ subprocess `npx tsx prisma/seed.ts` เชื่อมต่อได้จริงในกล่องนี้ — **นี่คือพฤติกรรมที่ถูกต้องแล้วสำหรับ
>   สภาพแวดล้อมที่ไม่มี DB (config ถูก แค่รอ environment)** ไม่ใช่ error จาก DEF-02 อีกต่อไป (ดู ENV-01)
> - `npx playwright test --list`: **collect ครบ 19 test ใน 6 ไฟล์ e2e** (compile ผ่านหมด ไม่มี import error)
>
> ปิด defect นี้ในส่วนที่เป็นความรับผิดชอบของโค้ด/config — ส่วนที่เหลือ (ต้องมี MySQL + browser จริงเพื่อรัน
> integration/concurrency/e2e ให้ผ่านจริง) ย้ายไปอยู่ใน ENV-01/ENV-02 (รอ DevOps)

**เกี่ยวข้อง**: test-plan.md §0/§7 (สิ่งที่ Engineer/DevOps ต้องเตรียมให้ automation รันได้จริง), Q2/Q7 ทั้งหมด

**พบจาก**: `npx jest --config jest.config.js tests/unit/bomCheck.spec.ts` → `No tests found` แม้ไฟล์มีอยู่จริง

**Root cause (ยืนยันด้วยการอ่านโค้ดจริง)**:
1. `jest.config.js` (root) มี `testMatch: ['<rootDir>/src/backend/**/*.test.ts', '<rootDir>/prisma/**/*.test.ts']`
   — **ไม่ครอบคลุม `tests/**` เลยแม้แต่ pattern เดียว** ดังนั้น `npx jest`/`npm test` จะไม่มีวันรันไฟล์ใน
   `tests/unit/`, `tests/integration/`, `tests/integration/concurrency/` เลย ไม่ว่าจะแก้ไฟล์ spec ให้ถูกแค่ไหน
2. `package.json` devDependencies **ไม่มี** `supertest`, `@types/supertest`, `@playwright/test` เลย
   (ตรวจสอบด้วย `node -e "console.log(Object.keys(require('./package.json').devDependencies))"` และ
   `ls node_modules` — พบแค่ `socket.io-client` ซึ่งมาจาก dependency ของ `socket.io` ไม่ใช่ devDependency
   ที่ติดตั้งให้ QA โดยตรง) — import `supertest`/`@playwright/test` ในไฟล์ integration/e2e ของ QA จะ error
   ทันทีที่พยายาม compile
3. ไม่มี `test:integration`/`test:e2e` script, ไม่มี `.env.test`, ไม่มี seed-reset endpoint/CLI ที่ยืนยันชื่อ
   — ทั้งหมดนี้ระบุไว้ชัดเจนแล้วใน test-plan.md §7 ตั้งแต่ Phase 1 ว่าเป็นงานของ Engineer/DevOps รอบ E0/D4
   แต่ Engineer's gate_checklist (`pipeline/status.json`) ไม่มีข้อไหนกล่าวถึงเรื่องนี้เลย และ `npx jest` ที่
   Engineer รันเองก็ไม่มีทางเจอปัญหานี้ เพราะ testMatch เดิมไม่ครอบคลุม tests/ อยู่แล้วจึงดู "ผ่าน 123/123" แต่
   นั่นคือเทสต์ colocated ของ Engineer เอง ไม่ใช่ 27 ไฟล์ automated spec ที่ QA ออกแบบไว้ตาม traceability matrix

**Impact**: เคสวิกฤตที่สุดของทั้งโปรเจกต์ (Q7 — ตรงกับเงื่อนไข Gate 1 ที่ปอนด์เน้นย้ำ) **ไม่เคยถูกรันเลยแม้แต่ครั้งเดียว**:
- `tests/integration/concurrency/stockLedgerAccuracy.spec.ts` (ECP-010 AC4, N1 — stock ledger accuracy 100%)
- `tests/integration/concurrency/numberSequence.spec.ts` (N4 — NumberSequence ไม่ซ้ำ)
- `tests/integration/concurrency/permissionTtl.spec.ts` (ECP-023 AC2 — TTL ≤5 min + clamp ≤300s)
- `tests/integration/concurrency/paymentVersionReconciliation.spec.ts` (§5.5 — เคสเดียวกับ DEF-01)

นี่คือสาเหตุที่ DEF-01 (บั๊กจริงในโค้ด production) ไม่เคยถูกจับได้จนกว่า QA จะ reconcile unit test คู่ขนานขึ้นมาเอง
ระหว่าง verify phase — ถ้า `paymentVersionReconciliation.spec.ts` รันได้ตั้งแต่แรก บั๊กนี้จะถูกจับได้ตั้งแต่รอบ
integration ของ Engineer เองแล้ว

**Severity**: Critical — ทำให้ "automation coverage 91%" ที่รายงานใน test-plan.md Phase 1 เป็นตัวเลข "ออกแบบไว้"
เท่านั้น ไม่ใช่ "verify แล้วว่ารันได้จริง" และปิดบังบั๊กจริงอย่างน้อย 1 ตัว (DEF-01) ไปแล้ว

**คำแนะนำแก้ไข**: Engineer (หรือ DevOps ร่วม) ต้องเพิ่ม `testMatch` ให้ครอบคลุม `tests/**/*.spec.ts` (แยก jest
project/config ระหว่าง unit ของ Engineer เองกับของ QA ก็ได้ ถ้าต้องการแยก DB-dependent ออกจาก non-DB) และ
เพิ่ม `supertest`, `@types/supertest`, `@playwright/test` ใน devDependencies ตาม test-plan.md §7 ที่ระบุไว้
ตั้งแต่ Phase 1

---

## DEF-03 [MAJOR] — ไม่มี `data-testid` ในหน้าจอ FE เลยแม้แต่จุดเดียว + โครงสร้าง flow จริงต่างจากที่ e2e spec สมมติไว้มาก

> ### สถานะ: **PARTIALLY FIXED** (re-verify 2026-07-07)
> Engineer เพิ่ม `testId` prop ทั่วทั้ง `ui/` wrapper (`Form.tsx`, `Button.tsx`, `DataTable.tsx`,
> `Modal.tsx`, `StatusTag.tsx`, ฯลฯ — ยืนยันด้วย `grep -rn data-testid src/frontend` = **51 matches ใน 17
> ไฟล์** เทียบกับ 0 matches รอบก่อน) รวมถึงเพิ่ม `NotifyHost.tsx` ที่ mirror antd toast ชั่วคราวไปเป็น
> `data-testid="notify-error"/"notify-success"/...` ที่ค้างอยู่ใน DOM (แก้ปัญหา toast หายไวเกินจะจับใน e2e)
> — เป็นวิธีแก้ที่ดี
>
> **QA ปรับ `tests/e2e/demoFlow.spec.ts` ตาม 4 flow divergence ที่ Engineer บันทึกไว้แล้ว**:
> (a) PO create เป็น 2 หน้าแยก (list→create Draft→detail page ที่มีปุ่ม "ยืนยัน PO" แยกต่างหาก) (b) customer/
> product/worker/material picker เป็น antd `<Select>` (custom combobox ไม่ใช่ native `<select>`) — ต้อง
> เปลี่ยนจาก `.selectOption()` เป็น "คลิกเปิด แล้วคลิก option ด้วยข้อความ" ทุกจุด ไม่ใช่แค่ 1 จุดที่ Engineer
> เตือน (c) QC result เป็น dropdown เดียว ไม่ใช่ 2 radio (d) login redirect ไป `/` เป๊ะ — ปรับครบแล้ว พร้อม
> แก้เพิ่ม `po-number` (`display:none`) ต้องใช้ `.textContent()` แทน `.innerText()` (5 ไฟล์ e2e ที่เหลือไม่มี
> pattern ที่ต้องแก้ตาม 4 ข้อนี้ — ตรวจแล้วไม่พบ `.selectOption()`/`waitForURL`/`.check()` ในไฟล์เหล่านั้น)
>
> **ยืนยันด้วยการรันจริง**: `npx playwright test --list` หลังแก้ไข: **ยัง collect ครบ 19 test ใน 6 ไฟล์**
> (compile ผ่าน ไม่มี syntax/type error ใหม่จากการแก้)
>
> **ทำไมยังไม่ปิดเป็น Fixed เต็ม**: (1) **ยังไม่เคยรันจริงสักครั้ง** — ไม่มี browser binaries ติดตั้ง
> (`npx playwright install` ยังไม่เคยรันในกล่องนี้) และไม่มี backend+frontend+MySQL ครบ stack ให้ชี้ (ENV-01/
> ENV-02) จึงยืนยันได้แค่ "compile ผ่าน" ไม่ใช่ "flow ทำงานจริงจนจบ" (2) พบ **MIN-04 ใหม่**: `SelectField`
> (`ui/Form.tsx`) ไม่ได้ตั้ง antd `showSearch` จริง แม้ Engineer's comment ใน `PoCreatePage.tsx` จะบอกว่า
> "still type-to-filter via antd's built-in search" — ไม่ block อะไร (ทำงานได้ด้วยการคลิกเปิด+เลือก option
> ตามที่ QA ปรับ spec ไว้แล้ว) แต่ comment ในโค้ดไม่ตรงกับ behavior จริง ควรแก้ comment หรือเพิ่ม `showSearch`
> จริงในรอบถัดไป (3) พบ **MIN-05**: ปุ่ม submit ที่ไม่ได้ตั้ง `testId` ชัดเจน (เช่น "+ เพิ่ม Lot" ใน
> `ProductionPage.tsx`) จะได้ `data-testid="form-submit"` ซ้ำกันหลายจุดถ้ามีมากกว่า 1 form ที่ยังไม่ submit
> อยู่บนจอเดียวกัน — ต้อง scope ด้วย parent locator (เช่น modal/dialog) เสมอ ไม่ใช่ query แบบ global
> ยังไม่ทดสอบจริงว่าจะชนกันจริงหรือไม่ในทุกหน้า

**เกี่ยวข้อง**: ทุก e2e spec (`tests/e2e/*.spec.ts` x6), ECP-004 (PO create+confirm), ECP-020/021 (invoice/payment)

**พบจาก**: `grep -rn "data-testid" src/frontend` → **0 matches** ทั้งโปรเจกต์ FE. เปิดดู
`src/frontend/ui/Form.tsx` และ component อื่นใน `ui/` (shared wrapper layer ตาม ADR-008) — ไม่มี prop ใดรับ
`testId`/`data-testid` แล้วส่งต่อลง DOM เลย ดังนั้น QA ไม่สามารถเพิ่ม testid เองในฝั่ง `tests/` ได้โดยไม่แก้ `src/`

**นอกจากนี้โครงสร้างหน้าจอจริงต่างจากสมมติฐานของ e2e spec เดิมอย่างมีนัยสำคัญ** (ตรวจสอบจาก
`src/frontend/pages/PoCreatePage.tsx` + `PoDetailPage.tsx`):
- `demoFlow.spec.ts` สมมติว่า PO create เป็น "single-page create+confirm" พร้อม customer-search แบบ
  autocomplete (`po-customer-search` + `po-customer-result-0`) ที่คลิก "po-confirm-button" แล้วเห็น
  "po-stock-sufficient-banner" ทันที
- **จริง**: PO create เป็น **2 หน้าแยกกัน** — `PoCreatePage` สร้าง PO เป็น Draft (เลือกลูกค้าจาก `<select>`
  ธรรมดา ไม่ใช่ autocomplete + เพิ่มบรรทัดสินค้าในฟอร์มย่อยแยกต่างหาก) แล้ว navigate ไปที่
  `PoDetailPage` (`/pos/:id`) ซึ่งมีปุ่ม "ยืนยัน PO" แยกต่างหากสำหรับ confirm — ไม่มี element ที่ตรงกับ
  "po-stock-sufficient-banner" (ระบบแจ้งผลผ่าน `Notify.success`/`Notify.error` แบบ toast ชั่วคราวเท่านั้น)

**Impact**: ทั้ง 6 ไฟล์ e2e (`demoFlow`, `invoiceRevisionTimeline`, `adminVatConfig`, `roleMenuOnboarding`,
`realtimeStock`, `errorMessageAudit`) ไม่สามารถ reconcile ให้รันผ่านได้จริงในตอนนี้ ไม่ว่าจะแก้ selector อย่างไร
เพราะไม่มี hook ที่เสถียรให้จับ (ไม่มี testid, DOM structure เปลี่ยนได้ทุกครั้งที่ Engineer refactor UI)
รวมถึง `@playwright/test` เองก็ยังไม่ถูกติดตั้ง (ดู DEF-02) — ไม่ได้แก้ในรอบนี้เพราะ (ก) เป็นงานของ Engineer/
ทีม (เพิ่ม testid ทั่ว `ui/` + business pages) (ข) ต้องตกลง flow-level กับ QA ใหม่ (เช่น PO create เป็น 1
หรือ 2 หน้า) ก่อนเขียน selector ใหม่ ไม่ใช่แค่เปลี่ยนชื่อ selector

**Severity**: Major — บล็อกการ verify เคส demo flow แบบ end-to-end (brief.md DoD #1) และ usability-adjacent
AC ทั้งหมดในทางปฏิบัติ แม้ business logic เบื้องหลังจะถูกต้องก็ตาม (ยืนยันไม่ได้ว่าผู้ใช้จริงเดินตาม flow
เหล่านี้ได้จริงจนจบ)

**Request ถึง Engineer** (ไม่ใช่การแก้ src/ เอง — QA ทำไม่ได้ตามกติกา): เพิ่ม `data-testid` (หรือ testId prop
ที่ forward ไปยัง DOM) ในทุก component ของ `src/frontend/ui/` และจุดสำคัญของ business pages (ปุ่ม submit,
row ของตาราง, badge สถานะ, timeline step) — QA ยินดีส่งรายการ testid ที่ต้องการแบบละเอียดต่อหน้าจอถ้าต้องการ

---

## DEF-04 [MAJOR] — Dashboard (Epic 9, ECP-027–033): ข้อความ empty/edge-state ที่ AC ระบุไว้ไม่ถูก implement เลย

> ### สถานะ: **FIXED** (ยืนยัน re-verify 2026-07-07, static review)
> `dashboard.routes.ts` คืน `emptyStateMessage`/`missingBomWarning` ตรงถ้อยคำ AC เป๊ะทุกจุดที่ระบุไว้:
> - sales: `emptyStateMessage: isEmpty ? "เริ่มต้นสร้าง PO แรกของคุณ" : null` (ECP-027 AC2 ✓)
> - production: `emptyStateMessage: pending === 0 ? "ไม่มีงานผลิตค้างในขณะนี้" : null` (ECP-029 AC2 ✓)
> - warehouse: `missingBomWarning: productsMissingBom > 0 ? \`มีสินค้า ${productsMissingBom} รายการที่ยังไม่มีสูตรในระบบ\` : null`
>   (ECP-028 AC3 ✓, คำนวณจาก `prisma.product.count({where:{bom:null}})` จริง ไม่ crash dashboard หลัก)
> - ยังเพิ่ม empty-state message ให้ qc/logistics/finance ที่ AC ไม่ได้ระบุคำเป๊ะไว้ด้วย (ส่วนเกิน ดีกว่าขาด)
>
> **`DashboardPage.tsx` เลิก raw JSON แล้ว** — เป็น per-role renderer จริง (`switch(role)` 7 case) ที่ผูก
> `emptyStateMessage`/`missingBomWarning` เข้ากับ UI จริงผ่าน `<EmptyState description={...} testId=
> "dashboard-empty-message">` — ยืนยันว่าข้อความจะปรากฏบนจอจริง ไม่ใช่แค่อยู่ใน API payload เฉยๆ เหมือนก่อน
>
> **ข้อสังเกตเล็กน้อยที่ไม่ block (ไม่ใช่ DEF-04 เดิม แต่พบระหว่าง re-verify)**: `finance` case กรอง
> `outstanding = invoices.filter(i => i.status !== "Paid")` — ตอนนี้มี status `"Overpaid"` เพิ่มเข้ามาแล้ว
> (จาก DEF-01) แต่ invoice ที่ `Overpaid` ยังถูกนับรวมอยู่ใน "ยอดค้างชำระ" ของ dashboard การเงิน ทั้งที่จริง
> ไม่ใช่ยอดค้างชำระ (เป็นยอดจ่ายเกิน) — เป็นจุดเล็กที่ควรพิจารณาแยกในรอบถัดไป ไม่ใช่ AC ที่ระบุไว้ตรงๆ จึงไม่
> ยกเป็น defect ใหม่ ใส่เป็น MIN-06 ด้านล่างแทน
>
> ปิด defect นี้

**เกี่ยวข้อง**: ECP-027 AC2, ECP-028 AC3, ECP-029 AC2 (และเป็นไปได้ว่ากระทบ role dashboard อื่นในลักษณะเดียวกัน)

**พบจาก**: อ่าน `src/backend/modules/dashboard/dashboard.routes.ts` เทียบกับ
`docs/requirements/erp-core-prototype/user-stories.md`:

- **ECP-027 AC2**: "Given ยังไม่มี PO ใดในระบบเลย... Then ระบบแสดงตัวเลขทุกสถานะเป็น 0 **พร้อมข้อความแนะนำ
  "เริ่มต้นสร้าง PO แรกของคุณ"**" — backend (`case "sales"`) ส่งกลับแค่ `{byStatus: [], isEmpty: true}` ไม่มี
  ข้อความนี้อยู่ใน payload เลย
- **ECP-029 AC2**: "...Then ระบบแสดง **"ไม่มีงานผลิตค้างในขณะนี้"**" — backend (`case "production"`) ส่งกลับแค่
  `{pendingCount: 0, orders: []}` ไม่มีข้อความนี้
- **ECP-028 AC3**: "...ระบบยังคงแสดง dashboard ได้ปกติ...และแสดง**ข้อความเตือนแยกต่างหาก "มีสินค้า N รายการที่
  ยังไม่มีสูตรในระบบ"**" — backend (`case "warehouse"`) ไม่ได้คำนวณ/ส่งข้อมูลนี้เลย (ไม่มี field ใดเกี่ยวกับ
  BOM ที่หายไป)

**ยิ่งกว่านั้น**: `src/frontend/pages/dashboards/DashboardPage.tsx` render ด้วย
`<pre>{JSON.stringify(data, null, 2)}</pre>` — **แสดง raw JSON ดิบ ไม่มี UI logic ใดๆ ที่จะแทรกข้อความ Thai
ที่ AC ต้องการเลย แม้ backend จะเพิ่มข้อความเหล่านี้เข้าไปในอนาคต ฝั่ง FE ก็ยังไม่มีโค้ดที่จะเอาไปแสดงผลอยู่ดี**
(ยืนยันตรงกับที่ Engineer สารภาพไว้ว่า "dashboard แสดง raw JSON" — แต่ผลที่ตามมาคือ AC ข้อความเฉพาะเจาะจงเหล่านี้
"ไม่ผ่านจริง" ไม่ใช่แค่ "ดูไม่สวย" ตามที่ระบุไว้ในรายงาน Engineer)

**Severity**: Major — เป็นการไม่ปฏิบัติตามถ้อยคำ AC ที่ระบุชัดเจน (ไม่ใช่การตีความ) อย่างน้อย 3 จุดใน Epic เดียว
และมีความเป็นไปได้สูงว่า role dashboard อื่น (Logistics/Finance/Admin/QA) ก็มีลักษณะเดียวกัน แต่ AC ของ 4 role
หลังนี้ไม่ได้ระบุ edge-state message ที่จำเพาะเท่า 3 ตัวนี้จึงไม่ได้ list เป็นข้อแยก

---

## DEF-05 [MAJOR] — Invoice line ทุกบรรทัดถูกผูก productId กับ PO line แรกเสมอ (ไม่ใช่แค่ "UI polish")

> ### สถานะ: **FIXED** (ยืนยัน re-verify 2026-07-07, static review)
> `PoDetailPage.tsx` เปลี่ยนจากฟอร์ม manual entry เป็นการ derive `invoiceLines` ตรงจาก `po.lines` ทั้งหมด
> ด้วย `useMemo`:
> ```ts
> const invoiceLines = useMemo(() => (po?.lines ?? []).map((l: any) => ({
>   productId: l.productId, description: l.product?.name ?? `product #${l.productId}`,
>   quantity: Number(l.quantity), unitPrice: Number(l.unitPrice)
> })), [po]);
> ```
> ทุกบรรทัดของ PO กลายเป็น 1 invoice line ที่มี `productId`/`quantity`/`unitPrice` ตรงกับต้นฉบับเสมอ (ไม่มีการ
> พิมพ์มือ ไม่มีการ hardcode line แรก) พร้อมแสดงตาราง preview ให้ผู้ใช้เห็นก่อนกด "ออก invoice" จริง
> (`<table>` ใน modal, testId `invoice-subtotal-preview`) — แก้ตรงจุดและตรงกับ root cause ที่ระบุไว้เป๊ะ
> ปิด defect นี้

**เกี่ยวข้อง**: ECP-020 (ออก invoice), traceability/ความแม่นยำของข้อมูล invoice ต่อ SKU

**พบจาก**: `src/frontend/pages/PoDetailPage.tsx#addInvoiceLine`:
```ts
function addInvoiceLine(values: Record<string, unknown>) {
  setInvoiceLines((prev) => [
    ...prev,
    {
      productId: Number((po.lines?.[0] ?? {}).productId ?? 0),  // <-- เสมอ line แรกของ PO
      description: String(values.description),
      quantity: Number(values.quantity),
      unitPrice: Number(values.unitPrice)
    }
  ]);
}
```

**Impact**: สำหรับ PO ที่มีมากกว่า 1 line สินค้า เมื่อฝ่ายบัญชีออก invoice และพิมพ์รายละเอียดบรรทัดต่างๆ เอง
(ตามที่ Engineer ออกแบบไว้เป็น manual entry) ทุกบรรทัดของ invoice ที่สร้างขึ้นจะถูกบันทึก `productId` เป็น
สินค้าของ **PO line แรกเสมอ** ไม่ว่า description จะพิมพ์ถึงสินค้าตัวไหนจริงๆ ก็ตาม — เป็นข้อมูลผิดจริงที่ถูก
persist ลง DB (ไม่ใช่แค่การแสดงผล) กระทบความถูกต้องของรายงานยอดขายต่อ SKU และอาจกระทบ traceability ที่โยง
invoice กลับไปยังสินค้า/batch จริง

**Severity**: Major — Engineer's own note ("invoice issue ผูกกับ product ของ PO line แรกเป็นค่าเริ่มต้น")
ระบุว่าเป็นแค่ "UI polish" แต่จากการอ่านโค้ดจริง นี่คือบั๊ก functional ที่ทำให้ข้อมูลผิดเงียบๆ สำหรับ PO
multi-line ซึ่งเป็นกรณีใช้งานทั่วไป ไม่ใช่ edge case

---

## Minor / Observation (ไม่ block gate)

### MIN-01 — ESLint warning 5 จุดในไฟล์ทดสอบของ QA เอง (unused vars)
`tests/integration/customer.spec.ts`, `tests/integration/concurrency/permissionTtl.spec.ts`,
`tests/integration/concurrency/stockLedgerAccuracy.spec.ts` — housekeeping ของ QA เอง ไม่กระทบโค้ด Engineer
จะทำความสะอาดพร้อมตอน reconcile integration/concurrency spec รอบถัดไป (หลัง DEF-02 ถูกแก้)

### MIN-02 — `validateVatRate`/`computeInvoiceAmounts` ไม่มี defense-in-depth type guard ที่ตัวฟังก์ชันเอง
เช่น `validateVatRate("7")` (string) ไม่ throw เพราะ JS loose comparison, `computeInvoiceAmounts` ไม่ reject
`unitPrice` ติดลบที่ตัวมันเอง — ทั้งสองกรณีถูกป้องกันไว้แล้วที่ชั้น zod ของ API (`z.number()`,
`z.number().nonnegative()`) จึง **ไม่มีทางเข้าถึงได้จริงผ่าน HTTP API วันนี้** บันทึกไว้เพื่อความตระหนักเท่านั้น

### MIN-03 — `BatchStatus`/`ShipmentStatus` มีค่า `"ReadyToShip"` ที่ไม่มี code path ใดใช้งานจริง
พบใน `qc.rules.ts`/`shipping.rules.ts` — เป็น type value ที่ดูเหมือนค้างจากการออกแบบรอบก่อน ไม่กระทบ
functionality ปัจจุบัน (ไม่มี route ใดพยายาม set สถานะนี้) แต่ควรให้ Tech-Lead/Engineer ยืนยันว่าตั้งใจเผื่อ
อนาคตหรือควรลบทิ้งเพื่อลดความสับสน

### MIN-04 (ใหม่, พบระหว่าง re-verify) — `SelectField` comment อ้างว่า "searchable" แต่ไม่ได้ตั้ง `showSearch` จริง
`src/frontend/pages/PoCreatePage.tsx` มี comment ว่า customer picker "still type-to-filter via antd's
built-in search" แต่ `SelectField` ใน `src/frontend/ui/Form.tsx` ไม่ได้ส่ง prop `showSearch` ให้ antd
`<Select>` เลย — ผลคือ dropdown เปิด/เลือกได้ปกติ แต่ **พิมพ์กรองรายการไม่ได้จริง** ไม่กระทบ functionality
(รายชื่อลูกค้า/สินค้าที่ seed มีไม่เยอะ) แต่ comment ไม่ตรงกับ behavior จริง ควรแก้ comment ให้ตรง หรือเพิ่ม
`showSearch` จริงถ้าต้องการให้ใช้งานได้ตามที่ตั้งใจไว้

### MIN-05 (ใหม่, พบระหว่าง re-verify) — ปุ่ม submit ที่ไม่ระบุ `testId` ชัดเจนจะได้ id ซ้ำกัน (`"form-submit"`)
`SubmitButton` (`ui/Form.tsx`) default เป็น `data-testid={testId ?? "form-submit"}` — ถ้าหน้าจอเดียวมีมากกว่า
1 ฟอร์มที่ไม่ได้ตั้ง testId ชัดเจน (เช่น "+ เพิ่ม Lot" ใน `ProductionPage.tsx`) เปิดพร้อมกัน จะมี element
`data-testid="form-submit"` ซ้ำมากกว่า 1 ตัวพร้อมกันใน DOM ต้อง scope ด้วย parent locator (เช่น
`page.getByRole("dialog").getByTestId("form-submit")`) เสมอ ไม่ query แบบ global — QA ปรับ
`demoFlow.spec.ts` ให้ scope แบบนี้แล้วสำหรับจุดที่ทราบ แต่ยังไม่ได้ไล่ตรวจทุกหน้าจอว่ามีจุดชนกันอื่นอีกหรือไม่
(ยังไม่ verify จริงเพราะรัน e2e ไม่ได้ในสภาพแวดล้อมนี้)

### MIN-06 (ใหม่, พบระหว่าง re-verify) — Finance dashboard นับ invoice สถานะ `Overpaid` รวมอยู่ใน "ยอดค้างชำระ"
หลัง DEF-01 เพิ่ม status `"Overpaid"` แล้ว, `dashboard.routes.ts#finance` case ยังกรองด้วย
`i.status !== "Paid"` เท่านั้น (ไม่ได้แยก `Overpaid` ออก) ทำให้ invoice ที่จ่ายเกินไปแล้วถูกนับรวมอยู่ใน
"ยอดค้างชำระรวม" ของ dashboard การเงิน ทั้งที่ไม่ใช่ยอดค้างชำระจริง — ไม่มี AC ระบุพฤติกรรมนี้ตรงๆ จึงไม่ยกเป็น
Major แต่ควรพิจารณาแก้ไขเพื่อความถูกต้องของตัวเลข dashboard

---

## Environment-blocked (ไม่นับเป็น pass และไม่นับเป็น defect ของ Engineer — รอ DevOps)

### ENV-01 — ไม่มี Docker daemon ทำงานอยู่ใน sandbox นี้ (ยืนยันซ้ำ re-verify 2026-07-07)
`docker info` → `Client:` แสดงผลปกติ แต่ `Server:` ขึ้น
`failed to connect to the docker API at npipe:////./pipe/dockerDesktopLinuxEngine... daemon is running?`
→ `docker compose up -d mysql` ทำไม่ได้ → `prisma migrate deploy`/`npm run db:seed` กับ MySQL จริงทำไม่ได้
→ ยืนยันด้วยการรันจริงรอบ re-verify: `RUN_DB_TESTS=1 npx jest --selectProjects integration` **collect ครบ
17/17 ไฟล์แล้ว** (DEF-02 แก้จริง) แต่ **153/154 test fail ที่ `beforeAll`/`resetSeed()` timeout (5000ms)**
เพราะ subprocess `npx tsx prisma/seed.ts` ต่อ MySQL ไม่ได้ในกล่องนี้ → ทุก test ที่ต้องการ DB จริง
(integration 13 ไฟล์, concurrency 4 ไฟล์, ส่วนใหญ่ของ e2e 6 ไฟล์) ยังรันไม่ได้เลยในสภาพแวดล้อมนี้ **ไม่ว่า
DEF-02 จะถูกแก้แล้วหรือไม่ก็ตาม** — เป็น environment gap ล้วนๆ ไม่ใช่ config ผิดอีกต่อไป

### ENV-02 — `@playwright/test` ติดตั้ง package แล้วแต่ยังไม่มี browser binaries (อัปเดต re-verify — บางส่วนแก้แล้ว)
`supertest`/`@types/supertest`/`@playwright/test`/`cross-env` ถูกเพิ่มเข้า devDependencies แล้วจริง (ยืนยัน
`npx playwright --version` → `1.61.1` และ `npx playwright test --list` → collect ครบ 19 test/6 ไฟล์) —
**ส่วนที่ยังขาด**: browser binaries (`npx playwright install`) ยังไม่เคยรันในกล่องนี้ ต้องรันก่อนจึงจะ
`npx playwright test` (ไม่ใช่แค่ `--list`) ได้จริง — เป็นงานของ DevOps ในสภาพแวดล้อมที่มีดิสก์/เน็ตให้ดาวน์โหลด
browser binaries ได้

**สิ่งที่ยังไม่ verify และต้องรอ DevOps เตรียม environment ก่อน (ไม่ใช่ FAIL แต่ต้องรันให้ครบก่อนขึ้น production)**:
- ECP-010 AC4 / N1 — stock ledger accuracy 100% ภายใต้ concurrency จริงกับ MySQL (row-lock จริง ไม่ใช่ mutex จำลอง)
- N4 — NumberSequence ไม่ซ้ำภายใต้ concurrency จริงกับ MySQL (`INSERT...ON DUPLICATE KEY UPDATE` จริง)
- ECP-023 AC2 — permission TTL ≤5 นาที รวม clamp `PERMISSION_CACHE_TTL` >300s → ≤300s จริง (ค่า config จริง)
- §5.5 — payment↔invoice-version race กับ DB transaction จริง (2 concurrent revise requests)
- ทุก e2e flow กับ browser จริงต่อ frontend+backend+DB ครบ stack

---

## สรุปนับตาม severity (รอบแรก, 2026-07-07 ก่อน re-verify)

| Severity | จำนวน | ID |
|---|---|---|
| Critical | 2 | DEF-01, DEF-02 |
| Major | 3 | DEF-03, DEF-04, DEF-05 |
| Minor/Observation | 3 | MIN-01, MIN-02, MIN-03 |
| Environment-blocked (ไม่นับ defect) | 2 | ENV-01, ENV-02 |

**ผลสรุปรอบแรก**: มี Critical/Major defect ค้างอยู่ → **status = FAILED** ตามกติกา Exit Gate — ส่งกลับ Engineer
พร้อมรายการนี้ทั้งหมด

---

## สรุปผล Re-verify (2026-07-07, หลัง Engineer แก้ทั้ง 5 defect)

| ID | Severity เดิม | สถานะหลัง re-verify | หลักฐาน |
|---|---|---|---|
| DEF-01 | Critical | **Fixed** | unit test `paymentOutstanding.spec.ts` ที่เคย FAIL ผ่านแล้วจริง + Engineer's own test assert `status==='Overpaid'` |
| DEF-02 | Critical | **Fixed** (ส่วน environment ย้ายไป ENV-01/02) | `npx jest`=170/12/0, `RUN_DB_TESTS=1 npx jest --selectProjects integration` collect 17/17, `npx playwright test --list` collect 19/6 |
| DEF-03 | Major | **Partially Fixed** | testid 51 จุด/17 ไฟล์ยืนยันจริง + e2e spec ปรับ 4 flow divergence แล้ว + compile ผ่าน แต่ยังไม่เคยรันจริง (ไม่มี browser+DB) |
| DEF-04 | Major | **Fixed** | static review: emptyStateMessage/missingBomWarning ตรงถ้อยคำ AC ทุกจุด + FE เลิก raw JSON |
| DEF-05 | Major | **Fixed** | static review: invoiceLines derive จาก po.lines ทั้งหมดผ่าน useMemo, ไม่มี hardcode line แรกอีกแล้ว |

**Defect ใหม่ที่พบระหว่าง re-verify**: MIN-04, MIN-05, MIN-06 (ทั้งหมด Minor, ไม่ block)

**สรุปนับตาม severity หลัง re-verify**:

| Severity | จำนวน | ID |
|---|---|---|
| Critical | 0 | — |
| Major | 0 (DEF-03 เหลือแค่ "รอ environment ยืนยันรันจริง" ไม่ใช่ major เชิงโค้ดอีกต่อไป) | — |
| Minor/Observation | 6 | MIN-01..MIN-06 |
| Environment-blocked (ไม่นับ defect) | 2 | ENV-01, ENV-02 |

**ผลสรุป re-verify**: ไม่มี Critical/Major defect ที่เป็นความผิดของโค้ดค้างอยู่แล้ว เหลือแค่ Minor +
Environment-blocked → ตามกติกา Exit Gate เข้าเงื่อนไข **READY_FOR_DEVOPS** (ดู verify-report.md §6 สำหรับ
รายการที่ DevOps ต้องเตรียมก่อนรัน integration/concurrency/e2e ให้ครบ)
