# Verify Report — ERP Core Prototype — QA Phase 2 (Verify → ... → Verify-5 → Gate 2 Rework Verify)

- **slug**: `erp-core-prototype`
- **วันที่**: เขียน 2026-07-07 (verify รอบแรก) — อัปเดต 2026-07-07 (re-verify) — อัปเดต 2026-07-08 (verify-3,
  verify-4) — อัปเดต 2026-07-08/09 (verify-5 — รอบปิดงานของ scope เดิม) — อัปเดต 2026-07-09 (**Gate 2 Rework
  Verify — รอบปิดงานของ Gate 2 Round 2 (E22-E33/Q8-Q11), ผลสุดท้ายล่าสุด**)
- **เขียนโดย**: QA — Phase 2 (Verify ทุกรอบ รวม Gate 2 Rework Verify)
- **อ้างอิง**: `docs/test-plans/erp-core-prototype/test-plan.md` (§9, §10 มีสรุปย่อ), `docs/test-plans/erp-core-prototype/defects.md`
  (defect list เต็ม พร้อมสถานะต่อ defect ทุกตัว DEF-01..15 + PENDING-POND-1 + MIN-09), `pipeline/status.json`
  (entry `engineer` (`gate2-rework`) ล่าสุด + entry `qa`/`phase: gate2-verify`)

> จุดยืน: รายงานนี้บันทึกเฉพาะสิ่งที่ **รันจริง** ในสภาพแวดล้อมนี้เท่านั้น อะไรที่รันไม่ได้ (ไม่ว่าเพราะขาด
> tooling หรือขาด environment) จะระบุไว้ชัดเจนว่า "ไม่ verify" ไม่ใช่ "ผ่าน"
> **หมวด -4 ด้านล่างคือผล Gate 2 Rework Verify ล่าสุด (รอบปิดงานจริงของ Gate 2 Round 2, สถานะสุดท้าย) —
> หมวด -3 คือ verify-5 (ปิดงาน scope เดิม) — หมวด -2 คือ verify-4 — หมวด -1 คือ verify-3 — หมวด 0-6 ที่เหลือ
> คือรายงานรอบก่อนหน้าที่ยังเก็บไว้เพื่อ traceability ว่าอะไรเปลี่ยนไปบ้างตามลำดับเวลา**

---

## -4. ผล Gate 2 Rework Verify (2026-07-09) — สถานะสุดท้ายล่าสุด, รอบปิดงานของ Gate 2 Round 2

### -4.1 บริบท
Engineer ส่งมอบ E22-E33 ครบ (44 ไฟล์) ตั้ง `READY_FOR_QA_VERIFY` พร้อมตัวเลขเริ่มต้น: unit 233/0 failed,
integration 182 passed/30 failed, e2e 22/46 พร้อม mapping/วิเคราะห์ root cause ของทุก failure ไว้ล่วงหน้า
(ส่วนใหญ่เป็น testid mismatch + fixture qtyUsed ที่ QA ใช้ placeholder ไม่ตรง BOM จริง) และตั้งคำถามกลับ 1
เรื่อง (ECP-013 AC5 exact-match vs under-only) รอปอนด์ตัดสิน

### -4.2 สิ่งที่ QA ทำ (ดูรายละเอียดเต็มที่ defects.md §Gate 2 Rework — Verify)
1. แก้ testid mismatch ครบตาม mapping ของ Engineer ใน `gate2RegressionGuard.spec.ts` (6 เคย fail) และ
   `responsiveGate2.spec.ts` (12 เคย fail)
2. พบ+แก้บั๊กเพิ่มเติมที่ Engineer ไม่ได้ระบุไว้เอง (ไม่ใช่แค่ mapping ที่ให้มา): `nav-po-create` ไม่ใช่ menu
   item ต้องผ่าน `nav-po-list` ก่อน, onboarding Tour ใช้ localStorage ไม่ใช่ server-side flag ทำให้ทุก
   Playwright context ใหม่เจอ tour บังปุ่ม nav, ตัวเลขไม่มี comma คั่นหลักพัน, permission ผิด role ตอน query
   lot ใน test D
3. แก้ fixture `qtyUsed` ทั้ง suite (10 ไฟล์) ด้วย helper กลาง `buildExactLotSelections()` ใหม่ที่ดึง exact
   split จาก material-plan จริงของ server (ทนทานต่อการตัดสินใจ AC5 ในอนาคตทั้ง 2 ทาง)
4. ยืนยัน + แก้ root cause เพิ่มเติมที่ Engineer ชี้ไว้ถูกแล้วแต่ QA ต้องขุดลึกกว่านั้นอีกชั้น: seed ให้ทุก
   วัตถุดิบมี stock เริ่มต้น ~1000 หน่วยเสมอ ทำให้การบังคับ multi-lot split ต้องใช้ requiredQty ที่เกิน 1000
   จริงๆ ไม่ใช่แค่เทียบกับ Lot อื่นในเทสต์เดียวกัน — พบปัญหาเดียวกันซ้ำใน `production.spec.ts` TC-013-AC2 ที่
   ไม่ได้อยู่ใน mapping ของ Engineer เลย (QA พบเอง)
5. skip 1 เคสใหม่ (`invoiceDocument.spec.ts` TC-Q9-DOC-05) พร้อมพิสูจน์ผ่านการรันจริงว่า unreachable
   (resetSeed() ไม่เคยทำให้ CompanyProfile หายเลย) + ยืนยัน guard logic ถูกต้องด้วยการอ่าน source ตรง
6. ตัดสินใจ ECP-013 AC5 ตามคำสั่ง dispatcher: verify ตาม behavior ปัจจุบัน (under-only), mark
   TC-Q9-PLAN-06 เป็น "PENDING POND DECISION" ไม่นับเป็น defect

### -4.3 ตัวเลขรันจริงสุดท้าย (Gate 2 Rework Verify, final)

| Suite | ก่อนแก้ (Engineer ส่งมา) | หลังแก้ (QA ยืนยันจริง) |
|---|---|---|
| `npm run test:unit` | 233 passed / 12 skipped / 0 failed, 35/37 suites | **เหมือนเดิม (ไม่แตะ) — 233/0 failed** |
| `RUN_DB_TESTS=1` integration (26 ไฟล์) | 182 passed / 30 failed / 2 skipped, 214 total, 18/26 suites | **211 passed / 0 failed / 3 skipped, 214 total, 26/26 suites เขียวครบ** |
| `stockLedgerAccuracy.spec.ts` (DEF-09 guard) | — | **เขียว (2/2) ยืนยันซ้ำอิสระ** |
| `npx playwright test` (46 test, ไฟล์เดิม 6 + ใหม่ 2) | 22 passed / 23 failed / 1 skipped | **45 passed / 0 failed / 1 skipped, 46 total เขียวครบ** |

### -4.4 สถานะ defect สุดท้าย (ดูรายละเอียดเต็มที่ defects.md)

| ID | สถานะ |
|---|---|
| DEF-01 ถึง DEF-15 | **Fixed ทั้งหมด** (ยืนยันตั้งแต่ verify-5, ไม่มีการ regress ในรอบนี้ — 211/211 integration รวม
  regression guard ของ defect เดิมทั้งหมดยังเขียว) |
| PENDING-POND-1 (ใหม่) | ECP-013 AC5 exact-match vs under-only — **ไม่ใช่ defect** รอปอนด์ตัดสิน 1 ใน 3
  ทางเลือก (ดู questions_for_pond ใน pipeline/status.json entry engineer/gate2-rework) |
| MIN-01..08 (เดิม) | ไม่เปลี่ยนแปลง ไม่ block |
| MIN-09 (ใหม่) | QC incoming table อาจ overflow บน tablet portrait ขึ้นกับความกว้างข้อมูล (antd DataTable
  ไม่ได้ตั้ง `scroll.x`) — **instance ที่ยืนยันแล้วของ gap ที่ Engineer เปิดเผยเองใน E33 gate_checklist** ไม่ใช่
  บั๊กที่ซ่อนอยู่ Minor/Should ไม่ block |

**สรุป: ไม่พบ defect โค้ดจริงใหม่แม้แต่ตัวเดียวรอบนี้** — failure ทั้งหมด (39 เคสตอนเริ่ม: integration 30 +
e2e 23 - นับซ้อนกันบางส่วนจาก reconciliation เดียวกัน) เป็น test-authoring/fixture bug ในไฟล์ของ QA เอง
(ยืนยันด้วยการรันจริงทุกจุด ไม่ใช่แค่เชื่อ mapping ของ Engineer เฉยๆ — พบเพิ่มอีกหลายจุดที่ Engineer ไม่ได้
ระบุไว้ด้วยตัวเอง)

### -4.5 Automation coverage (Gate 2 Round 2, สถานะ verify)
ตรงตามที่ระบุไว้ใน test-plan.md §10.2 (เขียนไว้ตั้งแต่ Phase 1): ~80% automate ได้เต็ม, ~13% partial (ข้อมูล
ครบแต่เชิงสายตาต้องมนุษย์), ~7% ไม่ automate ได้เลย (เชิงสุนทรียะล้วน) — ตอนนี้ทุกส่วนที่ automate ได้ (80%)
ผ่านจริงครบแล้วหลัง reconciliation รอบนี้ ส่วนที่เหลือ (~20%) ส่งต่อ `uat-print-responsive-script.md` ให้
ปอนด์ใช้ตอน Gate 2

### -4.6 สถานะที่ตั้ง
**READY_FOR_DEVOPS** — unit/integration/e2e เขียวครบทุก suite (233 unit, 211 integration ครบ 26/26 suites
มี 3 documented skip, 45 e2e ครบมี 1 documented skip) ไม่มี Critical/Major defect ค้าง ไม่มี defect โค้ดจริง
ใหม่เลย มีแค่ 1 รายการรอปอนด์ตัดสินใจเชิงธุรกิจ (ไม่ block, ไม่นับเป็น defect) และ 1 responsive gap ที่
Engineer เปิดเผยเองแล้ว (ไม่ block, backlog item) — ผ่าน Exit Gate ทุกข้อ

---

## -3. ผล Verify-5 (2026-07-08/09) — รอบก่อนหน้า (ปิดงาน scope เดิม), เก็บไว้เพื่อ traceability

### -3.1 บริบท
Engineer (`defect-fix-4`) แก้ DEF-14 (เพิ่ม permission `user.view_basic` + endpoint `GET /users/basic` คืน
เฉพาะ `{id, fullName}`) และ DEF-15 (เพิ่ม `NativeSelectField` component ใหม่ใน `ui/Form.tsx` ที่ครอบ native
`<select>` ด้วย `AntForm.Item` จริง) ส่งกลับพร้อมอ้างว่า unit 175/175, integration 152/154 (17/17 suites),
stockLedgerAccuracy เขียว 3 รอบอิสระ, e2e 17/19 (เหลือ 1 fail ที่วิเคราะห์ว่าเป็น regex ผิด convention ใน
spec ของ QA เอง `demoFlow.spec.ts` — ให้ QA ตัดสินใจว่าจะแก้เองหรือขึ้น UX note)

### -3.2 สิ่งที่ QA ทำ + ผลยืนยัน
1. **ไม่เชื่อคำอ้างเฉยๆ — ยืนยัน DEF-14 อิสระด้วย curl จริง**: login `production_demo` → `GET /users/basic`
   = 200 คืนเฉพาะ `{id, fullName}` (ไม่รั่ว username/role/status) → `GET /users` เต็มรูปแบบยังคง 403 เหมือนเดิม
   (least privilege ถูกรักษาไว้) — ทำซ้ำ 2 ครั้ง (ต้นรอบ + ท้ายรอบ) ผลตรงกัน
2. **ยืนยัน DEF-15 ด้วยการอ่านโค้ดจริง** (`ui/Form.tsx`'s `NativeSelectField` + `InvoicesPage.tsx`'s usage)
   และรัน `invoiceRevisionTimeline.spec.ts` ผ่านจริง (TC-037-AC1/AC2 เขียว)
3. **วิเคราะห์เคส "QC Approved" regex ก่อนตัดสินใจ** (ไม่รับคำอธิบายของ coordinator/Engineer ตรงๆ โดยไม่ตรวจสอบ
   เอง): อ่านโค้ด `qc.routes.ts` จริงพบว่านี่เป็น **2 field คนละตัวที่ตั้งใจใช้คนละ convention** ไม่ใช่
   ความไม่สอดคล้องเดียวที่ต้องแก้ทางเดียว — `Batch.status` enum = `"QCApproved"` (ไม่เว้นวรรค ตรง convention
   enum ทั้งระบบ) ส่วน `POStatusEvent.status` (plain string, ใช้แสดงใน PO Timeline) = `"QC Approved"` (เว้นวรรค
   ตั้งใจ) **เลือกทางเลือก (ก)**: แก้ regex จุดเดียวที่ผิด (บรรทัด ~163 เช็ค Batch status badge) จาก
   `/QC Approved/i` เป็น `/QCApproved/i` เพิ่ม comment อธิบายกันสับสนซ้ำ — สรุปเป็น **spec bug ของ QA เอง ไม่ใช่
   product defect ไม่ตีกลับ Engineer** (เพิ่ม UX enhancement note แยกไว้ ดู §-3.5 ด้านล่าง — ไม่ block Gate 2)
4. แก้บั๊ก spec เพิ่มเติมอีกหลายจุดที่เพิ่งถูกเปิดเผยเพราะ DEF-14/15 fix ทำให้ flow เดินหน้าไปได้ไกลกว่าทุกรอบ
   ก่อนหน้า (ปุ่ม nested ใน shipment row, antd DatePicker+Modal Escape-vs-Tab, invoice issue navigation/modal
   confirm, VAT text format, required "method" field ที่ขาดไป, PO Timeline 6 entries ไม่ใช่ 5) — ดูรายละเอียด
   เต็มที่ `defects.md` §Verify-5
5. **พบและแก้ปัญหา cross-file state pollution เมื่อรัน full e2e suite** (ไม่ปรากฏตอนรัน standalone):
   shared/never-reset dev DB ทำให้ (a) badge ที่ไม่ scope ต่อแถว match หลาย element จาก data ของไฟล์อื่น — แก้
   ด้วย `.first()` (b) VAT rate (global mutable singleton) ถูก `adminVatConfig.spec.ts` เปลี่ยนค่าไว้ก่อน — แก้
   โดยอ่านค่าที่ระบบแสดงจริงแทนการ hardcode หรือพยายาม fetch config เอง (ซึ่งต้องใช้สิทธิ์ Admin ที่ session
   ตอนนั้นไม่มี)
6. รัน `demoFlow.spec.ts` แบบ standalone → **1 passed** (เต็ม flow Sales→Production→QC→Shipping→Finance→PO
   Timeline ผ่านครบเป็นครั้งแรก)
7. Reseed (`npm run db:seed`) แล้วรัน **FULL e2e suite ทั้ง 6 ไฟล์พร้อมกัน** → **18 passed, 1 skipped, 0
   failed, 19 total**
8. รันซ้ำ unit (175/175) + integration เต็ม (152/154, 17/17 suites) + `stockLedgerAccuracy.spec.ts` เดี่ยว
   (2/2) อีกครั้งเพื่อยืนยันไม่มี regression จากการแก้ spec รอบนี้ — ตรงกับตัวเลขเดิมทุกประการ

### -3.3 ตัวเลขรันจริงสุดท้าย (final, ยืนยันด้วยการรันจริงทั้งหมด)

| Suite | ผลลัพธ์ |
|---|---|
| `npm run test:unit` | **175 passed, 12 skipped, 0 failed, 28/30 suites** |
| `RUN_DB_TESTS=1 npx jest --selectProjects integration` (17 ไฟล์) | **152 passed, 2 skipped, 0 failed, 154 total, 17/17 suites เขียว** |
| `stockLedgerAccuracy.spec.ts` แยกอิสระ (สะสมรวม 4 รอบทุก verify round) | **เขียวทุกรอบ (2/2)** |
| `npx playwright test demoFlow.spec.ts` (standalone) | **1 passed** |
| `npx playwright test` (full suite, 19 test, 6 ไฟล์, reseed ใหม่ก่อนรัน) | **18 passed, 1 skipped, 0 failed, 19 total — เขียวครบ (fully green)** |

### -3.4 สถานะ defect สุดท้าย (ปิดครบทุกตัว — ดูรายละเอียดเต็มที่ defects.md §Verify-5)

| ID | Severity | สถานะสุดท้าย |
|---|---|---|
| DEF-01 | Critical | **Fixed** (ยืนยัน re-verify) |
| DEF-02 | Critical | **Fixed** (ยืนยัน re-verify) |
| DEF-03 | Major | **Fixed/Resolved** |
| DEF-04 | Major | **Fixed** |
| DEF-05 | Major | **Fixed** |
| DEF-06 | Critical | **Fixed** (ยืนยัน verify-3) |
| DEF-07 | Major | **Fixed** (ยืนยัน verify-3) |
| DEF-08 | — | **Resolved** (contract decision — QA spec แก้ตาม) |
| DEF-09 | Critical | **Fixed** (ยืนยัน 4 รอบอิสระสะสม รวมรอบนี้) |
| DEF-10 | Major | **Fixed** |
| DEF-11 | Major | **Fixed** |
| DEF-12 | Major | **Fixed** |
| DEF-13 | Major | **Fixed** |
| DEF-14 | Major | **Fixed** (ยืนยันซ้ำ curl 2 ครั้งรอบนี้) |
| DEF-15 | Major | **Fixed** (ยืนยันซ้ำด้วยโค้ด + test รอบนี้) |
| OPEN-1/2/3 | — | ปิดหมดตั้งแต่ verify-4 |
| MIN-01..08 | Minor | ไม่เปลี่ยนแปลง ไม่ block (backlog awareness) |
| **UX-01 (ใหม่, ไม่ blocking)** | UX enhancement | เปิดเป็น backlog item — ดู §-3.5 |

**สรุป: DEF-01 ถึง DEF-15 ทั้งหมด 15 รายการ ปิดครบทุกตัว ไม่มี Critical/Major defect ค้างเลย**

### -3.5 UX note (ไม่ blocking Gate 2, บันทึกเป็น backlog สำหรับ sprint ถัดไป)
Status badge หลายจุดในระบบ (`QCApproved`, `InProduction`, `ReadyToShip`, `PartiallyPaid` ฯลฯ) แสดง enum
value ดิบตรงๆ ไม่มีเว้นวรรค/ไม่แปลไทย บน UI จริงที่ end-user (พนักงานโรงงาน ไม่ใช่โปรแกรมเมอร์) เห็น อาจอ่าน
สะดุดกว่าที่ควร เทียบกับข้อความอื่นในหน้าเดียวกันที่เป็นภาษาไทยล้วน — **แนะนำให้ Frontend เพิ่ม label-mapping
function (enum → ข้อความแสดงผลที่มีเว้นวรรค/แปลไทย) ใช้กับทุก status badge ในระบบ** ไม่ใช่แค่จุดเดียว — นี่ไม่ใช่
defect เชิงเทคนิค (regex ที่เคย fail เป็นบั๊กใน spec ของ QA เอง แก้แล้ว ไม่ใช่โค้ดผิด) จึงไม่ block Gate 2 ตาม
คำสั่ง เสนอเป็น backlog item

### -3.6 UAT plan — พร้อมเริ่มนัดหมายได้แล้ว
DEF-14/15 (บล็อก UAT รอบก่อน) ปิดครบแล้ว ฟีเจอร์ "มอบหมายงานผลิต" (ECP-012) และ "แก้ไข invoice" (ECP-037) ใช้
งานได้จริงผ่าน UI สำหรับ role ที่ตั้งใจให้ใช้แล้ว ยืนยันด้วย e2e ที่ผ่านครบ (`demoFlow.spec.ts`,
`invoiceRevisionTimeline.spec.ts`) จำนวนผู้ทดสอบ **2-3 คน/role ตามที่ปอนด์อนุมัติไว้แล้ว** (7 roles → 14-21 คน
รวม ดู test-plan.md §5) **ยังใช้ได้ตามเดิม ไม่ต้องเปลี่ยนแปลง — พร้อมนัดหมาย UAT จริงได้ทันที**

### -3.7 Automation coverage (สรุปสุดท้าย)
- Unit: 175 test ครอบคลุม business rules/pure functions ที่ไม่ต้องมี DB (100% ของที่ระบุใน test-plan.md
  automatable=yes สำหรับ level นี้)
- Integration (รวม concurrency): 152 test ผ่าน + 2 documented skip (เหตุผลระบุไว้ในไฟล์ spec เอง — ไม่ใช่
  ถูกละเลย) ครอบคลุม API contract + concurrency-safety ทุก endpoint หลัก
- E2E: 18 test ผ่าน + 1 documented skip (TC-037-AC3 — ไม่มี route จริงให้ทดสอบผ่าน UI ได้ตามที่ระบุไว้ตั้งแต่
  verify-3, ครอบคลุมแล้วที่ระดับ API แทนใน `invoiceVersioningReconciliation.spec.ts`)
- **รวม automation coverage ของ AC ทั้งหมดในระบบ**: ทุก AC ที่ระบุไว้ใน test-plan.md ว่า automatable=yes มีเทส
  ที่ผ่านจริงครบ ส่วนที่ automatable=no (ตามที่ระบุไว้ตั้งแต่ Phase 1 — ส่วนใหญ่เป็นเรื่อง UX/subjective
  judgement ที่ต้องอาศัยคนจริงประเมิน เช่น "onboarding ใช้งานง่ายจริงหรือไม่") ยังต้องพึ่ง UAT รอบจริงตาม §-3.6

### -3.8 สถานะที่ตั้ง
**READY_FOR_DEVOPS** — DEF-01 ถึง DEF-15 ปิดครบทุกตัว (15/15) ไม่มี Critical/Major defect ค้างเลย unit/
integration/e2e เขียวครบทุก suite (175/175 unit, 152/154 integration ครบ 17/17 suites มี 2 documented skip,
18/19 e2e ครบมี 1 documented skip) UX-01 เป็น non-blocking backlog note เท่านั้น ตามกติกา Exit Gate: ทุก AC
มี test case ที่ผ่านจริงหรือ defect ที่มี rationale ชัดเจน (documented skips), automation coverage ระบุครบ,
ไม่มี critical/major defect เปิดอยู่, มีผลรันจริงแนบครบทุก suite — **ผ่าน Exit Gate ทุกข้อ**

---

## -2. ผล Verify-4 (2026-07-08) — รอบก่อนหน้า, เก็บไว้เพื่อ traceability

### -2.1 บริบท
Engineer (`defect-fix-3`) แก้ DEF-09 (Critical)/DEF-10/11/12/13 (Major) ครบ + ปิด OPEN-1/2/3 ส่งกลับพร้อม
อ้างว่า integration เขียวหมด (152/154, 2 documented skip) และ e2e เหลือ 2 เคสที่เป็น "บั๊กใน spec ของ QA เอง"
(selector strategy)

### -2.2 สิ่งที่ QA ทำ + ผลยืนยัน
1. `npm run test:unit` = 175/175 ตรงกับที่ Engineer อ้าง
2. `npm run reset && npm run setup` บน Docker volume ใหม่สำเร็จ
3. `RUN_DB_TESTS=1 npx jest --selectProjects integration` = **152 passed, 2 skipped, 0 failed, 17/17
   suites** ตรงเป๊ะ
4. ยืนยัน DEF-09 อิสระ: รัน `stockLedgerAccuracy.spec.ts` แยก **3 รอบติดกัน — เขียวทั้ง 3 รอบ**
5. ตรวจสอบ 2 จุด selector ที่ Engineer ชี้ด้วย DOM probe จริง — ยืนยันว่า Engineer วิเคราะห์ถูกทั้งคู่ (เป็น
   bug ใน spec ของ QA เอง) แก้ทั้งสองจุดตามที่ชี้แนะ
6. **ระหว่างแก้ 2 จุดนี้ให้ผ่านจริง กลับพบ defect โค้ดจริงใหม่อีก 2 ตัว** (ไม่ใช่แค่ selector): **DEF-14**
   (Production role เรียก `GET /users` ไม่ได้ — assign-worker dropdown ว่างเปล่าเสมอ, รูปแบบเดียวกับ DEF-12
   แต่คนละ endpoint/role) และ **DEF-15** (revise-invoice modal's product `<select>` ไม่ผูกกับ antd Form
   state เลย — DEF-12 permission fix ทำให้ dropdown มีตัวเลือกแล้วจริง แต่การเลือกไม่มีผลใดๆ ต่อข้อมูลที่ส่งจริง
   ฟีเจอร์ revise ยังใช้งานผ่าน UI ไม่ได้จริงอยู่ดี)

### -2.3 ตัวเลขรันจริงสุดท้าย

| Suite | ผลลัพธ์ |
|---|---|
| `npm run test:unit` | **175 passed, 12 skipped, 0 failed, 28/30 suites** |
| `RUN_DB_TESTS=1 npx jest --selectProjects integration` (17 ไฟล์) | **152 passed, 2 skipped, 0 failed, 154 total, 17/17 suites เขียว** |
| `stockLedgerAccuracy.spec.ts` แยก 3 รอบอิสระ | **เขียวทั้ง 3 รอบ (2/2 ทุกรอบ)** |
| `npx playwright test` (19 test, 6 ไฟล์) | **16 passed, 2 failed, 1 skipped, 19 total** |
| `tsc`/`eslint`/`vite build` | สะอาดหมด |

### -2.4 สถานะ defect ล่าสุด (ดูรายละเอียดเต็มที่ defects.md)

| ID | Severity | สถานะ |
|---|---|---|
| DEF-01..08 | — | Fixed/Resolved (ปิดตั้งแต่รอบก่อน) |
| DEF-09 | Critical | **Fixed** — ยืนยันซ้ำ 3 รอบอิสระ |
| DEF-10 | Major | **Fixed** |
| DEF-11 | Major | **Fixed** — ยืนยันด้วย DOM probe จริง |
| DEF-12 | Major | **Fixed** (ส่วน permission) — แต่ดู DEF-15 |
| DEF-13 | Major | **Fixed** |
| OPEN-1/2/3 | — | **ปิดหมดแล้ว** |
| **DEF-14 (ใหม่)** | **Major** | **Open** — Production เรียก GET /users ไม่ได้ |
| **DEF-15 (ใหม่)** | **Major** | **Open** — revise-invoice product select ไม่ผูก form state |
| MIN-01..08 | Minor | ไม่เปลี่ยนแปลง ไม่ block |

### -2.5 UAT plan (2-3 คน/role ตามที่ปอนด์ยืนยัน — ดู test-plan.md §5)
ยังไม่ควรเริ่มนัดหมาย UAT จริงจนกว่า DEF-14/15 จะถูกแก้ (ฟีเจอร์ "มอบหมายงานผลิต" และ "แก้ไข invoice" ยังใช้งาน
ไม่ได้จริงผ่าน UI สำหรับ role ที่ตั้งใจให้ใช้งาน — UAT scenario ที่ครอบคลุมสองฟีเจอร์นี้จะ fail แน่นอนถ้าเริ่ม
ตอนนี้ ทำให้เสียเวลาผู้ทดสอบจริงและอาจให้ผลลัพธ์ "80% scenario สำเร็จ" ที่ไม่สะท้อนความพร้อมจริงของระบบ) เมื่อ
DEF-14/15 ถูกแก้แล้วและ QA re-verify ผ่านครบ ตัวเลข 2-3 คน/role (14-21 คนรวม) ตามที่ปอนด์อนุมัติ (ดู
test-plan.md §5) ยังใช้ได้ตามเดิม ไม่ต้องเปลี่ยนแปลง

### -2.6 สถานะที่ตั้ง
**FAILED** — พบ Major defect ใหม่ 2 ตัว (DEF-14, DEF-15) ระหว่างปิดงาน แม้ DEF-09 (Critical) + DEF-10/11/12/13
(Major) + OPEN-1/2/3 ทั้งหมดจะถูกแก้และยืนยันแล้วก็ตาม ตามกติกา Exit Gate ("เจอบั๊กโค้ดจริงใหม่ → FAILED")
ส่งกลับ Engineer พร้อม defect list เต็ม — คาดว่ารอบถัดไปจะเป็นรอบสุดท้ายจริง (defect ที่เหลือมีรูปแบบชัดเจนแล้ว
ทั้งคู่ ไม่ใช่ปัญหาเชิง architecture ใหญ่เหมือน DEF-09)

---

## -1. ผล Verify-3 (2026-07-08) — สถานะล่าสุด, รันกับ Docker/MySQL/browser จริงครบเป็นครั้งแรก

### -1.1 บริบท
DevOps มี environment จริงบนเครื่องนี้ (Docker Desktop ใช้งานได้จริง ต่างจาก sandbox ของ verify/re-verify
รอบก่อน) ทำ setup จาก scratch สำเร็จ พบ 3 ประเด็นจากการรันจริงครั้งแรก: **DEF-06 (Critical, NumberSequence
idempotency พัง), DEF-07 (Major, onboarding tour บังปุ่ม), DEF-08 (envelope contract ไม่ตรงกันระหว่าง spec
ของ QA กับโค้ดจริง)**. Engineer แก้ DEF-06/07 ที่ root cause และตัดสิน DEF-08 (โค้ด Engineer ถูก ตาม
architecture.md §6 ไม่ได้กำหนด success envelope) ส่งกลับให้ QA แก้ spec ทั้งหมดให้ตรง contract จริง

### -1.2 งานที่ QA ทำรอบนี้ (verify-3)
1. ยืนยัน DEF-06 อิสระด้วยตัวเอง: `npm run reset && npm run setup` บน Docker volume ใหม่ + reseed ซ้ำ 3
   รอบ + raw SQL reproduction ผ่าน `docker exec mysql` เอง (ไม่ใช่แค่เชื่อรายงาน)
2. ยืนยัน DEF-07 ผ่าน `npx playwright test roleMenuOnboarding.spec.ts` (3/3 ผ่าน)
3. แก้ integration + concurrency spec **ทั้งหมด 17/17 ไฟล์** ให้ตรง response envelope/request field
   name-type/seeded-ID resolution จริง (อ่าน `*.routes.ts`/`*.schema.ts` เป็น source of truth) เพิ่ม helper
   resolve* ใน `tests/helpers/testClient.ts`
4. แก้ e2e spec **5/6 ไฟล์** (roleMenuOnboarding ไม่ต้องแตะ) ให้ตรง flow จริง
5. **พบ defect โค้ดจริงใหม่ 5 ตัวระหว่างแก้ spec** (ไม่ใช่แค่ spec เขียนผิด) — 1 Critical (DEF-09, stock
   ledger ไม่ accuracy 100% ภายใต้ concurrency จริง — ตรงเงื่อนไข Gate 1 ที่สำคัญที่สุด) + 4 Major (DEF-10
   PO ไม่เคย transition เป็น "Invoiced", DEF-11 antd Select แสดงเลขดิบแทน label ทุกจุดในระบบ, DEF-12
   Finance เรียก GET /products ไม่ได้ทำให้ revise-invoice UI ใช้งานไม่ได้, DEF-13 VAT rate เกิน max ถูก
   clamp เงียบๆ ไม่แจ้งเตือน)

### -1.3 ตัวเลขรันจริงสุดท้าย

| Suite | ผลลัพธ์ |
|---|---|
| `npm run test:unit` | **172 passed, 12 skipped, 0 failed, 28/30 suites** (ตรงกับที่ Engineer อ้าง) |
| `RUN_DB_TESTS=1 npx jest --selectProjects integration` (17 ไฟล์, MySQL จริง) | **148 passed, 4 failed, 2 skipped, 154 total** (เป้า 154/154 ไม่ถึง — 4 failed = defect จริงใหม่ DEF-09/DEF-10) |
| `npx playwright test` (19 test, 6 ไฟล์, browser+backend+MySQL จริงครบ) | **12 passed, 6 failed, 1 skipped, 19 total** (เป้า 19/19 ไม่ถึง — ขึ้นจาก 3/19 เดิม; 6 failed = DEF-11/12/13 + 3 รายการเปิดสอบสวนต่อ (OPEN-1/2/3) แต่นับเป็น fail ในรอบนี้) |
| `tsc`/`eslint`/`vite build` | สะอาดหมด (ตรง) |

### -1.4 สถานะ defect ล่าสุด (ดูรายละเอียดเต็มที่ defects.md)

| ID | Severity | สถานะ |
|---|---|---|
| DEF-06 | Critical | **Fixed** — ยืนยันอิสระโดย QA (raw SQL, reseed x3, concurrency 100-way) |
| DEF-07 | Major | **Fixed** — ยืนยันด้วย e2e จริง (roleMenuOnboarding 3/3) |
| DEF-08 | Contract decision | **Resolved** — QA แก้ spec ครบ 17/17 integration + 5/6 e2e |
| DEF-09 | **Critical (ใหม่)** | **Open** — stock ledger ไม่ accuracy 100% ภายใต้ concurrency จริง (ละเมิด NFR N1) |
| DEF-10 | **Major (ใหม่)** | **Open** — PO ไม่เคย transition เป็น "Invoiced" |
| DEF-11 | **Major (ใหม่)** | **Open** — antd Select แสดงเลขดิบแทน label ทุก dropdown |
| DEF-12 | **Major (ใหม่)** | **Open** — Finance เรียก GET /products ไม่ได้ (revise-invoice ใช้งานไม่ได้จริง) |
| DEF-13 | **Major (ใหม่)** | **Open** — VAT rate เกิน max ถูก clamp เงียบๆ ไม่แจ้งเตือน |
| MIN-07/08 | Minor (ใหม่) | บันทึกไว้ ไม่ block |
| OPEN-1/2/3 | ยังสรุปไม่ได้ | ต้องสอบสวนเพิ่มเติมรอบถัดไป |

### -1.5 สถานะที่ตั้ง

**FAILED** — พบ Critical defect ใหม่ 1 ตัว (DEF-09) และ Major defect ใหม่ 4 ตัว (DEF-10..13) จากการรันกับ
MySQL/browser จริงแบบเจาะลึกเป็นครั้งแรก ตามกติกา Exit Gate ("เจอบั๊กโค้ดจริงใหม่ → FAILED") ส่งกลับ Engineer
พร้อม defect list เต็มชุด — **ไม่ต้องแก้ DEF-06/07/08 ซ้ำ (ปิดแล้ว)** เน้นที่ DEF-09 (Critical, เร่งด่วนที่สุด
เพราะเป็นเงื่อนไข Gate 1 โดยตรง) ตามด้วย DEF-10/11/12/13 (Major)

---

## 0. ผล Re-verify (2026-07-07, หลัง Engineer แก้ defect ครบ 5 ตัว + ตั้ง `READY_FOR_QA_VERIFY` อีกครั้ง)

### 0.1 ตัวเลขเทสต์จริงที่รันซ้ำ

| คำสั่ง | ผลลัพธ์ | เทียบกับที่ Engineer อ้าง |
|---|---|---|
| `npx jest` (jest.config.js ใหม่ — multi-project, default = unit) | **170 passed, 12 skipped, 0 failed, 28/30 suites** | **ตรงเป๊ะ** กับที่ Engineer รายงาน (170/12/0, 28/30) |
| spot-check DEF-01: `tests/unit/paymentOutstanding.spec.ts` (ไฟล์เดียวกับที่ QA เขียนดัก overpaid ไว้ตอน verify รอบแรก) | **PASS** (เดิม FAIL 1 test) | ยืนยัน `computeReconciliation` คืน `status:"Overpaid"` แยกจาก `"Paid"` แล้วจริง |
| `RUN_DB_TESTS=1 npx jest --selectProjects integration` | **collect ครบ 17/17 ไฟล์** (เดิม "No tests found" ทั้งหมด) — 153/154 test fail ที่ `beforeAll`/`resetSeed()` timeout 5000ms (ไม่มี MySQL ให้ subprocess seed ต่อได้) | ตรงกับที่คาด — "fail เพราะไม่มี DB" ถือว่า **config ถูกต้องแล้ว**, นับเป็น "รอ environment" ไม่ใช่ FAIL ของโค้ด |
| `npx playwright test --list` | **collect ครบ 19 test/6 ไฟล์** compile ผ่านหมด | ยืนยันว่า `@playwright/test` ติดตั้งและ config ใช้ได้จริง (browser binaries ยังไม่ติดตั้ง — ดู ENV-02) |
| `npx tsc -p tsconfig.backend.json --noEmit` | **0 error** | ตรงกับที่ Engineer อ้าง |
| `cd src/frontend && npx tsc --noEmit` | **0 error** | ตรงกับที่ Engineer อ้าง |
| `npm run lint` | **0 error, 5 warning** (เหมือนเดิม, อยู่ในไฟล์ QA เอง) | ตรงกับที่ Engineer อ้าง |
| `cd src/frontend && npm run build` | **สำเร็จ** | ตรงกับที่ Engineer อ้าง |
| `tsx src/backend/server.ts` + `curl /health` | **HTTP 200** ไม่มี DB | ตรงกับที่ Engineer อ้าง |
| `docker info` | **daemon ต่อไม่ได้เหมือนเดิม** | ยืนยัน ENV-01 ซ้ำ — ยังไม่มี MySQL ในกล่องนี้ |

**สรุป**: ตัวเลขที่ Engineer อ้างมาทั้งหมด **ตรงกับที่ QA รันซ้ำจริง ไม่มีจุดไหนคลาดเคลื่อน** รวมถึงยืนยันเฉพาะเจาะจง
ว่าเทสต์ที่เคย FAIL เพราะ DEF-01 ผ่านแล้วจริง (ไม่ใช่แค่คำอ้างเปล่า)

### 0.2 สถานะ defect ทีละตัวหลัง re-verify (ดูรายละเอียด/หลักฐานเต็มใน `defects.md`)

| ID | Severity เดิม | สถานะหลัง re-verify |
|---|---|---|
| DEF-01 | Critical | **Fixed** — ยืนยันด้วยเทสต์จริงที่เคย fail กลับมา pass |
| DEF-02 | Critical | **Fixed** (ส่วน DB/browser จริงย้ายไปนับเป็น ENV-01/ENV-02 แทน ไม่ใช่ defect ของโค้ด/config อีกต่อไป) |
| DEF-03 | Major | **Partially Fixed** — testid เพิ่มครบ 51 จุด/17 ไฟล์ + e2e spec ปรับ 4 flow divergence แล้ว + compile ผ่าน แต่ยังไม่เคยรันจริงเพราะไม่มี browser/DB (ดู §0.3) |
| DEF-04 | Major | **Fixed** — static review ยืนยัน emptyStateMessage/missingBomWarning ตรงถ้อยคำ AC ทุกจุด |
| DEF-05 | Major | **Fixed** — static review ยืนยัน invoice lines derive จาก po.lines ทั้งหมดแล้ว ไม่ hardcode line แรก |

**Defect ใหม่ที่พบระหว่าง re-verify (ทั้งหมด Minor ไม่ block)**: MIN-04 (SelectField comment ไม่ตรง
behavior — ไม่ได้ตั้ง showSearch จริง), MIN-05 (ปุ่ม submit ไม่ตั้ง testId ชัดเจนได้ id ซ้ำ "form-submit"),
MIN-06 (finance dashboard นับ invoice Overpaid รวมใน "ยอดค้างชำระ" ทั้งที่ไม่ควรนับ)

### 0.3 สิ่งที่ QA ทำเพิ่มรอบนี้: ปรับ e2e spec ตาม 4 flow divergence

แก้ `tests/e2e/demoFlow.spec.ts` (ไฟล์เดียวที่มี pattern ที่ต้องแก้ตาม 4 ข้อ — ตรวจอีก 5 ไฟล์ e2e แล้วไม่พบ
`.selectOption()`/`waitForURL`/`.check()`/customer-picker/QC-dropdown ที่ต้องแก้):
- (a) PO create แยก 2 หน้า: สร้าง Draft ที่ `/pos/new` → navigate ไป `/pos/:id` → กด "ยืนยัน PO" แยกต่างหาก
- (b) customer/product/worker/material picker เป็น antd `<Select>` (ไม่ใช่ native `<select>`) — เปลี่ยนจาก
  `.selectOption()` เป็น helper `selectAntdOption()` (คลิกเปิด dropdown แล้วคลิก option ด้วยข้อความ) **ใช้กับ
  ทุกจุดที่เป็น antd Select ไม่ใช่แค่ 1 จุดที่ Engineer เตือนไว้** — เป็นข้อค้นพบเพิ่มเติมของ QA เอง
- (c) QC result เป็น dropdown เดียว (Approved/Rejected) ไม่ใช่ 2 radio ที่ `.check()` ได้
- (d) login helper เปลี่ยนจาก `waitForURL(/\/(home|dashboard)/)` เป็น `waitForURL(url => url.pathname === "/")`
- เพิ่มเติมที่ QA พบเอง: `po-number` เป็น `display:none` div → `.innerText()` คืนค่าว่างเสมอ ต้องใช้
  `.textContent()` แทน; ปุ่มไม่มี testId ชัดเจนได้ default `"form-submit"` ซ้ำกัน → ต้อง scope ด้วย
  `page.getByRole("dialog")` ก่อนเสมอ (ดู MIN-05)

ยืนยันด้วย `npx playwright test --list` หลังแก้: **ยัง collect ครบ 19 test/6 ไฟล์** (compile ผ่าน ไม่มี error
ใหม่) — **ยังไม่เคยรันจริงจนจบสักครั้ง** เพราะไม่มี browser binaries (`npx playwright install` ยังไม่รัน) และ
ไม่มี backend+frontend+MySQL ครบ stack ให้ชี้ในกล่องนี้ (ENV-01/ENV-02)

### 0.4 สรุป automation coverage หลัง re-verify

| หมวด | ไฟล์ | สถานะ |
|---|---|---|
| Unit (Q1) | 8 ไฟล์ | เหมือนรอบแรก: 6 compile+รันได้ (170 pass รวม Engineer colocated, 1 เคย fail ตอนนี้ pass แล้ว = DEF-01), 2 skip พร้อมอ้างอิง |
| Integration (Q2) | 13 ไฟล์ | **collect ได้แล้ว (DEF-02 fixed)** แต่ **ยังรันไม่ผ่านเพราะไม่มี MySQL** (ENV-01) — นับเป็น "รอ environment" |
| Concurrency (Q7) | 4 ไฟล์ | เหมือนกับ integration — collect ได้ รันไม่ผ่านเพราะไม่มี MySQL (ENV-01) |
| E2E (Q3/Q4) | 6 ไฟล์ | **collect ได้แล้ว (DEF-02 fixed)** + selector แก้ตรงกับ markup จริงแล้ว (DEF-03 partially fixed) แต่ยังรันไม่ได้เพราะไม่มี browser binaries + ไม่มี stack ให้ชี้ (ENV-01/ENV-02) |
| UAT (Q6) | Manual | ยังไม่เริ่ม — ตอนนี้ไม่มี Critical/Major defect ค้างแล้ว แต่ยังไม่แนะนำให้เริ่มจนกว่า integration/concurrency/e2e ผ่านจริงกับ environment ของ DevOps ก่อน (ความเสี่ยง: ถ้า UAT เจอบั๊กที่จริงๆ ควรถูกจับได้จาก automation ก่อนแล้ว จะเสียเวลาผู้ทดสอบจริงโดยไม่จำเป็น) |

**สรุปตรงไปตรงมา**: ไม่มี Critical/Major defect ที่เป็นความผิดของโค้ด/config เหลืออยู่แล้ว — สิ่งที่เหลือทั้งหมด
คือ "รอ DevOps เตรียม environment" (MySQL + browser binaries) เพื่อเปลี่ยนสถานะ integration/concurrency/e2e
จาก "collect ได้แต่รันไม่ผ่านเพราะไม่มี DB/browser" ให้เป็น "รันผ่านจริง"

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

## 4. Defect summary (รายละเอียดเต็มที่ `defects.md`) — สถานะ ณ verify รอบแรก vs หลัง re-verify

| ID | Severity | เรื่อง | สถานะรอบแรก | สถานะหลัง re-verify |
|---|---|---|---|---|
| DEF-01 | Critical | Invoice ถูก mark "Paid" ผิดความหมายเมื่อ overpaid หลัง revise ลดยอด | Open | **Fixed** |
| DEF-02 | Critical | Test infra ไม่เชื่อมต่อ — 23/31 automated spec ของ QA รันไม่ได้เลยแม้จะมี DB | Open | **Fixed** |
| DEF-03 | Major | ไม่มี `data-testid` ใน FE เลย + โครงสร้าง flow จริงต่างจาก e2e spec เดิมมาก | Open | **Partially Fixed** |
| DEF-04 | Major | Dashboard epic 9 — ข้อความ empty/edge-state ตาม AC ไม่ถูก implement | Open | **Fixed** |
| DEF-05 | Major | Invoice line ผูก productId กับ PO line แรกเสมอ (ข้อมูลผิดจริงสำหรับ PO multi-line) | Open | **Fixed** |
| MIN-01 | Minor | ESLint warning 5 จุดในไฟล์ QA เอง | Open | Open (housekeeping) |
| MIN-02 | Minor/Observation | ไม่มี defense-in-depth type guard ที่ตัว pure function (มี zod กันไว้แล้วที่ API) | Open | Open (awareness only) |
| MIN-03 | Minor/Observation | `"ReadyToShip"` เป็น type value ที่ไม่มี code path ใช้งานจริง | Open | Open (awareness only) |
| MIN-04 | Minor (ใหม่) | `SelectField` comment อ้างว่า searchable แต่ไม่ได้ตั้ง `showSearch` จริง | — | Open |
| MIN-05 | Minor (ใหม่) | ปุ่ม submit ไม่ตั้ง testId ชัดเจนได้ id ซ้ำ `"form-submit"` | — | Open |
| MIN-06 | Minor (ใหม่) | Finance dashboard นับ invoice `Overpaid` รวมใน "ยอดค้างชำระ" | — | Open |
| ENV-01 | Environment | ไม่มี Docker/MySQL daemon ใน sandbox นี้ | Open | Open (รอ DevOps) |
| ENV-02 | Environment | `@playwright/test` ติดตั้งแล้วแต่ยังไม่มี browser binaries | Open (ทั้ง package หายด้วย) | Open (เหลือแค่ browser binaries, รอ DevOps) |

**รวมรอบแรก: 2 Critical, 3 Major, 3 Minor, 2 Environment-blocked**
**รวมหลัง re-verify: 0 Critical, 0 Major (DEF-03 partial ไม่นับ major อีกต่อไปเพราะโค้ดถูกต้องแล้ว รอแค่
environment ยืนยัน), 6 Minor, 2 Environment-blocked**

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

### 6.1 สถานะรอบแรก (2026-07-07, เก็บไว้เพื่อ traceability)
**FAILED** — พบ Critical defect 2 รายการ (DEF-01, DEF-02) และ Major defect 3 รายการ (DEF-03, DEF-04, DEF-05)
ตามกติกา Exit Gate ("ไม่มี critical/major defect เปิดอยู่") ไม่ผ่าน → ส่งกลับ Engineer พร้อมรายการ defect เต็ม
ที่ `docs/test-plans/erp-core-prototype/defects.md`

### 6.2 สถานะหลัง Re-verify (2026-07-07) — **สถานะล่าสุด**

**READY_FOR_DEVOPS** — Engineer แก้ DEF-01/03/04/05 ครบและ QA ยืนยันแล้ว (DEF-01/04/05 = Fixed เต็ม, DEF-03 =
Partially Fixed คือ static/compile ผ่านหมดแล้วแต่ยังไม่เคยรันจริงเพราะไม่มี browser/DB); DEF-02 = Fixed จริง
(test infra เชื่อมต่อครบ, ยืนยันด้วยตัวเลขรันจริง 170/12/0 + collect 17/17 integration + 19/6 e2e) —
**ไม่มี Critical/Major defect ที่เป็นความผิดของโค้ด/config เหลืออยู่แล้ว** เหลือเฉพาะ Minor 6 รายการ
(MIN-01..MIN-06, ไม่ block) และ Environment-blocked 2 รายการ (ENV-01, ENV-02)

**สิ่งที่ DevOps ต้องเตรียมก่อน gate นี้จะปิดสมบูรณ์**:
1. **MySQL container จริง** (`docker compose up -d mysql` หรือเทียบเท่า) ในสภาพแวดล้อมที่มี Docker daemon ใช้งานได้
2. `prisma migrate deploy` (หรือ `prisma migrate dev` รอบแรก) กับ MySQL นั้น + `npm run db:seed` (ยืนยันว่า
   seed.ts รันได้จริงกับ DB จริงเป็นครั้งแรก — ยังไม่เคยถูกยืนยันเลยตั้งแต่ Engineer เขียน)
3. `npx playwright install` เพื่อติดตั้ง browser binaries (Chromium อย่างน้อย) — ยังไม่เคยรันในสภาพแวดล้อมนี้
4. ตั้งค่า `.env`/`.env.test` ให้ `DATABASE_URL` ชี้ไปที่ MySQL container จริง, ตั้ง `PERMISSION_CACHE_TTL` สั้น
   (เช่น 2-5 วินาที) สำหรับสภาพแวดล้อมทดสอบ TTL (ดู test-plan.md §7)
5. รัน `RUN_DB_TESTS=1 npx jest --selectProjects integration` ให้ครบ 17 ไฟล์ (รวม concurrency 4 ไฟล์ในนั้น)
   ให้ผ่านจริง — **นี่คือด่านที่ยืนยันเคสวิกฤต Q7 ทั้งหมด (stock ledger accuracy 100%, NumberSequence ไม่ซ้ำ,
   permission TTL+clamp, payment/invoice-version race)** ที่ Gate 1 เน้นย้ำ ยังไม่เคยผ่านจริงแม้แต่ครั้งเดียว
6. รัน `npx playwright test` (ทุก 6 ไฟล์ e2e) ต่อ frontend+backend+MySQL ครบ stack ให้ผ่านจริง
7. **QA ต้องกลับมา re-verify อีกรอบหลัง DevOps เตรียมสภาพแวดล้อมเสร็จ** ก่อนจะปิด gate นี้อย่างสมบูรณ์ (ผลตอนนี้
   คือ "โค้ดถูกต้องตามที่ static/compile ยืนยันได้ในสภาพแวดล้อมนี้" ไม่ใช่ "verify ครบ 100% กับ DB/browser จริงแล้ว")
8. หลังผ่านข้อ 5-6 ครบ ค่อยเริ่มนัดหมาย UAT จริง (2-3 คน/role ตามที่ปอนด์อนุมัติ, ดู test-plan.md §5) — ไม่ควร
   เริ่ม UAT ก่อนหน้านั้นเพราะอาจเจอบั๊กที่ automation ควรจับได้ก่อน ทำให้เสียเวลาผู้ทดสอบจริงโดยไม่จำเป็น
