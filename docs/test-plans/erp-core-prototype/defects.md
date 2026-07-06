# Defect Log — ERP Core Prototype — QA Verify Phase (2026-07-07)

- **slug**: `erp-core-prototype`
- **เขียนโดย**: QA — Phase 2 (Verify)
- **สถานะรวม**: 2 Critical, 3 Major, 3 Minor/Observation — **status = FAILED, ส่งกลับ Engineer**

Legend severity: **Critical** = ข้อมูลผิด/สูญหาย/เงื่อนไข Gate 1 ถูกละเมิดตรงๆ, **Major** = AC ที่ระบุชัด
ไม่ผ่านจริงหรือ blocking การ verify ของเคสสำคัญ, **Minor** = ไม่กระทบ business logic/ยังไม่ยืนยันว่าเป็นปัญหาจริง.

---

## DEF-01 [CRITICAL] — Invoice ถูก mark เป็น "Paid" ผิดความหมายเมื่อ overpaid หลังแก้ไข (revise) ลดยอด

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

---

## Environment-blocked (ไม่นับเป็น pass และไม่นับเป็น defect ของ Engineer — รอ DevOps)

### ENV-01 — ไม่มี Docker daemon ทำงานอยู่ใน sandbox นี้
`docker info` → `Client:` แสดงผลปกติ แต่ `Server:` ขึ้น
`failed to connect to the docker API at npipe:////./pipe/dockerDesktopLinuxEngine... daemon is running?`
→ `docker compose up -d mysql` ทำไม่ได้ → `prisma migrate deploy`/`npm run db:seed` กับ MySQL จริงทำไม่ได้
→ ทุก test ที่ต้องการ DB จริง (integration 13 ไฟล์, concurrency 4 ไฟล์, ส่วนใหญ่ของ e2e 6 ไฟล์) รันไม่ได้เลย
ในสภาพแวดล้อมนี้ **ไม่ว่า DEF-02 จะถูกแก้แล้วหรือไม่ก็ตาม**

### ENV-02 — `supertest`/`@playwright/test` ไม่ถูกติดตั้งเลย (ซ้ำกับ DEF-02 แต่แยกไว้เพราะเป็นคนละ action item)
DevOps/Engineer ต้อง `npm install --save-dev supertest @types/supertest @playwright/test` (และ
`npx playwright install` สำหรับ browser binaries) ก่อนที่ integration/e2e spec จะแม้แต่ compile ได้

**สิ่งที่ยังไม่ verify และต้องรอ DevOps เตรียม environment ก่อน (ไม่ใช่ FAIL แต่ต้องรันให้ครบก่อนขึ้น production)**:
- ECP-010 AC4 / N1 — stock ledger accuracy 100% ภายใต้ concurrency จริงกับ MySQL (row-lock จริง ไม่ใช่ mutex จำลอง)
- N4 — NumberSequence ไม่ซ้ำภายใต้ concurrency จริงกับ MySQL (`INSERT...ON DUPLICATE KEY UPDATE` จริง)
- ECP-023 AC2 — permission TTL ≤5 นาที รวม clamp `PERMISSION_CACHE_TTL` >300s → ≤300s จริง (ค่า config จริง)
- §5.5 — payment↔invoice-version race กับ DB transaction จริง (2 concurrent revise requests)
- ทุก e2e flow กับ browser จริงต่อ frontend+backend+DB ครบ stack

---

## สรุปนับตาม severity

| Severity | จำนวน | ID |
|---|---|---|
| Critical | 2 | DEF-01, DEF-02 |
| Major | 3 | DEF-03, DEF-04, DEF-05 |
| Minor/Observation | 3 | MIN-01, MIN-02, MIN-03 |
| Environment-blocked (ไม่นับ defect) | 2 | ENV-01, ENV-02 |

**ผลสรุป**: มี Critical/Major defect ค้างอยู่ → **status = FAILED** ตามกติกา Exit Gate — ส่งกลับ Engineer
พร้อมรายการนี้ทั้งหมด
