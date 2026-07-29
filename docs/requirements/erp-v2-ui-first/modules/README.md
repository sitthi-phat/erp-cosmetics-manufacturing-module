# Requirement Package (Per-Module) — ESSENCE Hub System

slug: `erp-v2-ui-first` · เขียนโดย PO · 2026-07-29 · **CANONICAL & COMPLETE SINGLE SOURCE OF TRUTH** สำหรับ BA / QA / Tech-Lead
สถานะ: consolidation ของ requirement ที่กระจัดกระจาย → per-module ที่โครงสร้างสม่ำเสมอ **ครบทุก module + NFR + Deletion Policy** (existing-good absorb + delta ใหม่) · reconciled กับ D1–D18 + fold คำสั่งใหม่ของปอนด์ (2026-07-29)

## สรุปภาษาไทย
เอกสารชุดนี้คือ **แหล่งความจริงล่าสุดแบบราย module ที่ครบถ้วน (single source of truth)** ของทั้งระบบ ESSENCE Hub — ทุก module มี .md ที่เป็น **spec ปัจจุบันเต็ม**. Document Hub จัดเป็น **① Functional** (จัดตามแถบเมนูแอป) · **② Non-Functional** (`non-functional.md` + `deletion-policy.md` + **`traceability.md` = พื้นผิว trace/audit governance**) · **③ Reference** (เอกสารหลักการที่ยังใช้ได้) · ④ Architecture · ⑤ Mockups · **⑥ Archive (หน้าเก่า superseded, collapsed)** — หมวด ①/②/③ ลิงก์เฉพาะภายในแพ็กเกจ/reference ไม่เด้งออกไปหน้าเก่า. **★ ปอนด์เคาะ 4 ข้อ (2026-07-29) — ปิดคำถามค้างทั้งหมด:** (1) traceability → Non-Functional, (2) Reference เป็นหมวดของตัวเอง, (3) **Supply Planning แจ้งเตือน Low เชิงรุก** (real-time + J8 digest, แนบ Suggested), (4) **Quotation ยกเลิกได้ทุกสถานะ** (PO loose reference, no cascade, activity-log). **★ Customer module review (2026-07-29 — settled, no open Q):** เพิ่ม **financial summary** (ยอดซื้อ/จ่าย/ค้าง) + **"ต้องติดตาม" = flag แยกจาก status** + **hard block QT/PO/SO เมื่อ Disabled/Blacklist** → **★ DECIDED (ปอนด์ยืนยัน 2026-07-29 · ตัวเลือก A): ถอด "Follow-up" ออกจาก status enum → 5 สถานะ + flag ⚑ แยก** (ดู §9, ปิดคำถามค้างแล้ว). **★ Quotation module review (2026-07-29 — settled, no open Q):** **reseat "ตกลง (Agreed)" → "ยืนยัน (Confirmed)"** + **banner "ไปสร้าง PO"** + **material check บนหน้า edit** + **activity-log ทุก action → trace**. **★ REVERTED (ปอนด์ 2026-07-29): ถอดสถานะ "ส่งแล้ว (Sent)" + ฟิลด์ sent-date ออกทั้งหมด** — QT lifecycle = ร่าง/ยืนยัน/ปฏิเสธ/ยกเลิก · list ค้นด้วย created-date แกนเดียว · การส่งใบเสนอราคา = print/share ไม่ใช่สถานะ. **★ PO (module 3) review (2026-07-29 — cross-cutting):** (a) **Comment field convention** — ทุก object ธุรกรรม (QT/PO/SO/PRD/Batch/DN/Shipment/Invoice/GR/PR + **★ Return + QC record**) มี **ช่องหมายเหตุเดียว แก้ในที่ (overwrite) แต่เก็บประวัติการแก้ครบ (ใคร/เมื่อ/เดิม→ใหม่) ดูได้ inline + โผล่ trace** — กติกากลางที่ `comment-convention.md` · **★ ปอนด์เคาะตัวเลือก A (2026-07-29) → เพิ่ม Return + QC record ครบเป็น 12 object · settled, ไม่มี open Q เรื่อง comment แล้ว** · (b) **Customer Edit = แก้ได้ครบทุกฟิลด์เท่ากับ Create** (ไม่ใช่แค่ผู้ติดต่อ; financial summary read-only) — settled. **★ Stock (module 4) review (2026-07-29 — settled, no open Q):** (1) **"เพิ่มวัตถุดิบใหม่" — RM code ผู้ใช้ตั้งเอง แต่ต้อง UNIQUE** · (2) **แยก Loss (ตัดคงคลัง −, Lot optional) / Adjust (ปรับยอด +, RM บังคับ)** เป็น 2 action บนแท็บ RM (D15) · (3) **เปลี่ยนป้ายปุ่ม → "บันทึก (คงคลัง)"** ทั้ง RM/FG · (4) **RM/Lot/FG = search dropdown; RM & FG ค้นได้ทั้งชื่อและรหัส** · (5) **BOM มีรหัส = รหัส FG (1 BOM=1 FG, 1:1, shared, auto — D11); "BOM = FG?" = ใช่** · (6) **audit + trace ทุก stock movement (add-RM/loss/adjust, RM+FG) + reason/source (D15)**. อัปเดต `stock.md` + `bom.md` + `goods-receipt.md` + `traceability.md` + `non-functional.md`.

---

## 1. โครงไฟล์ (file tree — ครบทั้งชุด)

```
docs/requirements/erp-v2-ui-first/modules/
  README.md                  ← ไฟล์นี้ (index + D-rule spine + changelog + source-of-truth + old→new map + global rules)
  permission-matrix.md       ← capability → module → action/button (รวมทุก module, +3 module ใหม่)
  comment-convention.md      ← ★ กติกากลาง comment + change-history (CC1–CC7) · object list 12 ตัว · อ้างโดยทุก module ธุรกรรม

  # System-wide / Governance (Non-Functional bucket ใน Hub)
  non-functional.md          ← NFR รวม: perf/auth-session/audit/backup-infra/data-format/jobs J1–J8/noti/search/responsive/soft-delete/reliability
  deletion-policy.md         ← (folded) soft-delete/void baseline + entity เดิม + entity ใหม่ (Quotation cancel-anytime/SO/FG Batch/OEM surplus/cost snapshot)
  traceability.md            ← trace/audit governance ข้าม module (Hub จัดใน ② Non-Functional) · entity/field search · genealogy · field-audit · QT head-of-chain · ★ comment field audited · ★ stock movement audited

  # Platform & Navigation (Functional · ระบบ)
  platform.md                ← login local+Google · session 24h/06:00 · notification outbox+read-bit (+FG→Low) · global search · responsive+guard
  home.md                    ← task inbox ตามสิทธิ์ · quick actions · onboarding
  dashboard.md               ← 7 แผนก × 29 tile · event/state · date filter · drill · permission-based

  # Sales & Customer (Functional · งานขาย/Order)
  customer.md                ← ★ + financial summary · follow-up flag (แยก status) · hard block Disabled/Blacklist · ★ Edit = all fields
  quotation.md               ← OEM Quotation (create/edit/convert-to-PO) · ยกเลิกได้ทุกสถานะ · hard block · Confirmed reseat + activity-log · ★ comment · (★ ไม่มี Sent/sent-date — revert)
  po.md                      ← OEM Purchase Order · hard block · prefill จาก QT Confirmed (2 ทาง) · ★ comment
  so.md                      ← Own-Brand Sales Order (sell-from-stock + produce-to-stock) · hard block (โหมด ก) · ★ comment

  # Supply Planning & Production (Functional · ผลิต&คุณภาพ)
  bom.md                     ← BOM + other-cost + TYPE(OEM/FG) + Supply-Planning config + ★ รหัส BOM=FG (1:1, shared, auto)
  supply-planning.md         ← Demand & Production Cover + FORMULA SUMMARY + ★ proactive Low alerting (real-time + J8)
  production.md              ← PRD/Batch + actual-qty/surplus + queue search/filter · ★ comment (PRD + Batch)
  qc.md                      ← ตรวจ Batch/Lot · rework เฉพาะ line เสีย + feedback · GMP chain · ★ comment (QC record)

  # Inventory & Procurement (Functional · คลัง&จัดซื้อ)
  stock.md (★ add-RM unique + Loss/Adjust 2 actions + search dropdown) · goods-receipt.md (★ comment + RM master ref) · pr.md (★ comment) · supplier.md · return.md (★ comment)

  # Fulfilment & Finance (Functional · จัดส่ง&การเงิน)
  shipping.md (★ comment: Shipment รอบ + DN) · invoice.md (★ comment)

  # System (Functional · ระบบ)
  settings.md                ← RUCDAA + Admin bit · user + bulk reassign · VAT · company · audit · +3 module ใหม่

  flows/
    oem-flow.md · ownbrand-flow.md
```

HTML review view: `docs/design/erp-v2-ui-first/functional-spec/modules/index.html` (+ ราย module) · Hub `functional-spec/index.html` จัด ① Functional / ② Non-Functional / ③ Reference / ④ Architecture / ⑤ Mockups / ⑥ Archive.

---

## 2. D-Rule Spine (ยังคงเป็นแกน — พร้อม DELTA 2 จุดที่ปอนด์แก้ 2026-07-29)

D1–D18 ยังเป็นกฎแกน (ดูฉบับเต็ม `scope-oem-ownbrand-supply-planning.md` §1). **2 จุดที่อัปเดต:**

### 2.1 ★ D8 v2 — ปุ่ม "สั่งผลิต" ใน Supply Planning
กด "สั่งผลิต" → **พาไปหน้า SO produce-to-stock (ไม่เลือกลูกค้า) แบบ PRE-FILL** (จำนวน = Suggested) → เข้าสาย production. ให้ produce-to-stock มีที่มาเดียว (แก้ U4). ดู `supply-planning.md` §5, `so.md`.

### 2.2 ★ Credit Term — ระดับลูกค้า 30/60/90 · DEFAULT 60
per-invoice override ยังทำได้; ยึด effective ตาม invoice date. ดู `customer.md`/`invoice.md`.

### 2.3 ★ D18 reseat — QT "ตกลง (Agreed)" → "ยืนยัน (Confirmed)" (2026-07-29 Quotation review · Sent reverted)
D18-4 (ถ้อยคำเดิมที่ล็อก) กำหนดสถานะ ร่าง/ส่งแล้ว/**ตกลง (Agreed)**/ปฏิเสธ โดย "Agreed" เปิดปุ่ม Convert-to-PO. ปอนด์ปรับ (Quotation review): **การกด "Convert to PO" คือการยืนยันว่าลูกค้าตกลง → ตั้ง QT = "ยืนยัน (Confirmed)" ทันที** (รวมสองสเต็ปเดิม "mark Agreed → ค่อย Convert" เป็นสเต็ปเดียว) · การสร้าง PO เป็น **ขั้นอิสระ** (prefill ตอนนี้/ทีหลัง) · loose ref + no cascade + cancel-anytime **คงเดิม**. **★ REVERTED (ปอนด์ 2026-07-29): ถอดสถานะ "ส่งแล้ว (Sent)" + ฟิลด์ sent-date ออกทั้งหมด** (การส่งใบเสนอราคา = print/share ไม่ใช่สถานะ). **enum ปัจจุบัน: ร่าง (Draft) / ยืนยัน (Confirmed) / ปฏิเสธ (Rejected) + ยกเลิก (Cancelled)** · Convert-to-PO กดได้จาก Draft. **module package wins** เหนือถ้อยคำ D18-4 (ดู §5 source-of-truth). authoritative = `quotation.md` §4/§6 · entity-status-map §1.1b.

> D1–D7, D9–D17 **ไม่เปลี่ยน**. D18 = reseat ถ้อยคำสถานะ (business flow เดิม: เสนอ→ตกลง→เป็น PO). **หมายเหตุ Stock review (D11/D15):** ไม่แก้ D-rule — คำสั่งปอนด์รอบ Stock (RM code user-unique / Loss=− Adjust=+ / BOM=FG shared code) เป็น **การ implement ภายใต้ D11 (FG auto) + D15 (ledger reason/source) เดิม** ไม่ขัดกฎที่ล็อก.

---

## 3. GLOBAL Rules (บังคับทุก module — ปอนด์สั่ง 2026-07-29)

| # | กติกา | รายละเอียด |
|---|---|---|
| **G1 Pagination** | list/history ทุกอัน **20 แถว/หน้า + pagination** | ทุก list + drill dashboard + ledger + audit + noti "ดูทั้งหมด" |
| **G2 Date-range search** | ค้น **เลขเอกสาร** หรือ **ช่วงวันที่สร้าง** | quotation/PO/SO/GR/PR/invoice/shipping list + production queue + audit · **★ quotation = ช่วงวันที่สร้าง (created-date) แกนเดียว** (★ ถอดแกน sent-date แล้ว — revert 2026-07-29) |
| **G3 Drill + back คงสถานะ** | กลับ **ไม่เสีย state เดิม** | dashboard drill · customer detail จาก order = modal |
| **G4 Customer search dropdown** | quotation/po/so-create | ค้นเบอร์/บริษัท/ผู้ติดต่อ · แสดงสถานะ+credit term · modal detail · **★ Disabled/Blacklist เลือกไม่ได้ (hard block, customer.md §4.2)** |
| **G5 Permission-per-action** | ทุกปุ่มระบุ capability | `permission-matrix.md` |
| **★ G6 Comment + change-history** | ทุก object ธุรกรรมมี **ช่องหมายเหตุเดียว แก้ในที่ (overwrite) + เก็บประวัติการแก้ครบ (ใคร/เมื่อ/เดิม→ใหม่) ดู inline + โผล่ trace** | **12 object:** QT/PO/SO/PRD/Batch/DN/Shipment/Invoice/GR/PR + **★ Return + QC record** (ปอนด์เคาะตัวเลือก A, 2026-07-29) · กติกากลาง = **`comment-convention.md` (CC1–CC7)** · audit = field-audit เดิม · comment แยกจาก "เหตุผลการคืน (Return) / feedback (QC) / เหตุผลยกเลิก/void" เดิม |
| **★ G7 Stock search dropdown** | เลือก RM/Lot/FG ในหน้า stock (add-RM/loss/adjust) | **RM & FG ค้นได้ทั้งชื่อและรหัส** · **Lot ค้นผ่าน dropdown** (stock.md §10) — ปอนด์สั่ง Stock review 2026-07-29 |

> NFR ระดับระบบ (perf/auth/audit/format/jobs) รวมที่ `non-functional.md`.

---

## 4. Confirmations ที่ปอนด์สั่งให้ยืนยัน (RESOLVED)

| หัวข้อ | คำตัดสิน | เอกสาร |
|---|---|---|
| **Convert-to-PO** | กด "Convert to PO" → **popup "สถานะจะเปลี่ยนเป็น ยืนยัน (Confirmed)"** → QT = **Confirmed ทันที (immutable)** + **loose link** QT↔PO → เลือก po-create prefill **ตอนนี้/ทีหลัง** (banner ถาวรถ้ายังไม่สร้าง) → PO เลขใหม่. ("Confirmed" reseat จาก "Agreed" D18-4 · กดได้จาก Draft) | `quotation.md` §6 · `po.md` §5 · oem-flow |
| **SO (ก) ขายจากสต็อก** | จอง FG → พร้อมส่ง → ตัด FG FIFO ตอน dispatch → DN/Invoice | `so.md` · `shipping.md` |
| **SO (ข) ผลิตเก็บสต็อก** | BOM check → production; RM ขาด auto-PR; QC ผ่าน → FG เข้าคลัง | `so.md` |
| **★ Comment convention** | **12 object** ธุรกรรม (รวม Return + QC record) มีช่อง comment เดียว แก้ในที่ + เก็บประวัติครบ + โผล่ trace | `comment-convention.md` · ทุก module ธุรกรรม |
| **★ Customer Edit = all fields** | หน้า edit แก้ได้ครบทุกฟิลด์เท่ากับ create (financial summary read-only) | `customer.md` §2b |
| **★ Customer Follow-up = flag แยก (ถอดจาก enum)** | **DECIDED (ปอนด์ยืนยัน 2026-07-29 · ตัวเลือก A):** ถอด "Follow-up" ออกจาก status enum → 5 สถานะ + flag ⚑ แยก | `customer.md` §4/§12 · `entity-status-map.md` §1.1 |
| **★ Stock — RM code / Loss-Adjust / BOM=FG** | **RM code = ผู้ใช้ตั้งเอง + UNIQUE** · **Loss (ตัดคงคลัง −, Lot optional) / Adjust (ปรับยอด +, RM บังคับ)** = 2 action (D15) · ปุ่ม **"บันทึก (คงคลัง)"** ทั้ง RM/FG · **RM/Lot/FG search dropdown (RM&FG ชื่อ+รหัส)** · **BOM = FG (1:1, shared auto code — D11); BOM มีรหัส = FG code** · audit+trace ทุก movement | `stock.md` · `bom.md` · `goods-receipt.md` · `traceability.md` · `non-functional.md` |

**หมายเหตุ:** Quotation ทำ material check (ทั้ง create + edit) แต่ **ไม่ auto-open PR**.

---

## 5. ★ Source-of-Truth Statement (ประกาศชัด)

1. **`modules/*.md` = AUTHORITATIVE spec ปัจจุบันของทุก module + NFR + Deletion Policy + Traceability** — ชุดเดียวที่ BA/QA/TL ยึด.
2. แต่ละ .md เป็น **spec เต็ม**. `non-functional.md` = NFR authoritative · `deletion-policy.md` = deletion authoritative · `traceability.md` = trace/audit governance · **`comment-convention.md` = comment+change-history convention authoritative (documented ONCE, ราย module อ้างอิงไม่ทำสำเนา)**.
3. **เอกสารเก่า** (functional-spec module pages + cross-cutting + root `deletion-policy.md`) = **historical reference** → ย้ายไป **Hub ⑥ Archive (collapsed)** ออกจากเส้นทางหลัก.
4. **เอกสารหลักการเชิงลึก** (`entity-status-map`, `status-journeys`, `stock-reservation`, `scope` D1–D18, `mock-data-spec`, `brief`, ADRs, `scheduled-jobs`, `rtm`, `glossary`, `continuity`, `list-conventions`) = **authoritative reference** → รวมเป็น **Hub ③ Reference (หมวดของตัวเอง)**, ติดป้าย "reference" ชัด (ไม่ใช่ spec แข่ง). per-module docs อ้างอิง ไม่ทำสำเนา. **★ entity-status-map §1.1 = status source-of-truth reference** — sync กับ `customer.md` (r6: 5 สถานะ + follow-up flag) · **§1.1b = QT lifecycle (r7/r7.1, sync กับ `quotation.md` — Draft/Confirmed/Rejected/Cancelled, ไม่มี Sent)**. **เมื่อถ้อยคำ D18-4 (scope, locked) ต่างจาก module spec (เช่น Agreed↔Confirmed, มี/ไม่มี Sent) → module package wins** (scope = historical lock ของ business intent เดิม; ถ้อยคำสถานะปัจจุบันยึด quotation.md).
5. **RTM/Traceability คงครบ:** ทุก story/AC ยัง map → module + mockup + journey.
6. **Navigation IA (Document Hub, ปอนด์เคาะ 2026-07-29):** ① **Functional** (งานขาย/Order · คลัง&จัดซื้อ · ผลิต&คุณภาพ · จัดส่ง&การเงิน · ระบบ + flows + permission) · ② **Non-Functional** (non-functional + deletion-policy + **traceability**) · ③ **Reference** (เอกสารหลักการ) · ④ Architecture · ⑤ Mockups · ⑥ 🗄 Archive. **หมวด ①/②/③ ลิงก์เฉพาะภายใน — ไม่เด้งเข้าไปหน้าเก่า.** modules/index.html สะท้อนโครงเดียวกัน. **`comment-convention.md` วางในกลุ่ม cross-cutting/convention ข้าง permission-matrix.**

---

## 6. ★ Map: เอกสารเก่า → ครอบคลุมโดย module ใด

| เอกสารเก่า | ครอบคลุมโดย module (authoritative) | หมายเหตุ |
|---|---|---|
| functional-spec BA pages (home/dashboard/platform/customer/po/production/qc/stock/pr/supplier/return/bom/shipping/invoice/traceability/settings) | โมดูลชื่อเดียวกันใน `modules/` (stock → stock+goods-receipt) | absorbed เต็ม · เก่าอยู่ ⑥ Archive |
| `list-conventions.html` (US-LST-01) | **G1–G3 (README §3)** + Pagination/Search ทุก module (ยังเป็น **③ Reference**) | มาตรฐาน list |
| `continuity.html` (cascade + noti matrix) | **platform.md** (noti, +FG→Low) + cross-links (ยังเป็น **③ Reference**) | cascade reference |
| **`brief.md` §5/§8 · ADR-000..009 · `scheduled-jobs.html` (J1–J7) · entity-status-map §1.6 · stock-reservation** | **non-functional.md** (J8 เพิ่มใหม่) | NFR รวม+อัปเดต |
| **root `deletion-policy.md` · `rbac-deletion.html`** | **deletion-policy.md** (folded) + **settings.md**/**permission-matrix.md** | fold + entity ใหม่ |
| `functional-spec/traceability.html` (US-TRC) | **traceability.md** — **Hub จัดใน ② Non-Functional** (trace/audit governance) | classification เปลี่ยน (ปอนด์เคาะ) |

> **Archive (Hub ⑥):** functional-spec module pages (16), `rbac-deletion.html`, root `docs/deletion-policy.html`, `docs/po-reviews.html` — collapsed, superseded.

---

## 7. Changelog — supersede / แก้ / ปอนด์เคาะ

| เอกสาร/รายการ | สถานะ | เหตุผล |
|---|---|---|
| functional-spec module pages (16) + root deletion-policy | **superseded (Archive)** | absorbed/folded → module package |
| NFR ใน brief/ADR/scheduled-jobs | **consolidated** | → `non-functional.md` |
| **★ Traceability classification** | **DECIDED 2026-07-29** | ย้าย Hub placement จาก ① Functional(ระบบ) → **② Non-Functional** (trace/audit governance surface). เนื้อหา traceability.md คงเดิม |
| **★ Reference section** | **DECIDED 2026-07-29** | ดึง reference band ออกจาก ① → **หมวด ③ Reference ของตัวเอง**; renumber Architecture/Mockups/Archive → ④/⑤/⑥ |
| **★ Supply Planning proactive alerting** | **DECIDED 2026-07-29** | เดิม on-read-only → **real-time (FG พลิกเข้า Low) + J8 daily digest ~06:00**, แนบ **Suggested**, ผ่าน noti outbox by Read Supply Planning, deep-link supply-planning/SO prefill. เพิ่ม **J8** (non-functional §6), event **FG→Low** (platform §7/§9, non-functional §7), reconcile non-functional §6.1. **ปิด parked question** |
| **★ Quotation cancellation** | **DECIDED 2026-07-29** | **ยกเลิกได้ทุกสถานะ** (Draft/Confirmed/Rejected) · PO = **loose reference** เท่านั้น · ยกเลิก QT **ไม่ cascade** ไป PO · บันทึก **activity-log** + gapless (ไม่ hard-delete). แทน default เดิม "void-only". อัปเดต `quotation.md` §4/§7/§8 + `deletion-policy.md` §2.9/matrix. **ปิด parked question** |
| **★ Quotation module review (Convert/activity)** | **DECIDED 2026-07-29 · settled (no open Q)** | (a) Convert-to-PO = popup → QT Confirmed ทันที (reseat "Agreed"), immutable, สร้าง PO อิสระ · (b) banner ถาวร "ไปสร้าง PO" · (c) material check บน edit · (d) activity-log ทุก action → trace. อัปเดต `quotation.md` + `po.md` §3/§5/§10 + `traceability.md` + `non-functional.md` AU1 + `deletion-policy.md` + `entity-status-map.md` |
| **★ Quotation — REVERT "Sent" + sent-date** | **DECIDED 2026-07-29 (Pond) · settled** | **ถอดสถานะ "ส่งแล้ว (Sent)" + ฟิลด์ "วันที่ส่งลูกค้า (sent-date)" ออกทั้งหมด** (field, list column, sent-date range search, Sent badge/chip) → QT lifecycle = **ร่าง/ยืนยัน/ปฏิเสธ/ยกเลิก** · list ค้นด้วย **created-date แกนเดียว** · การส่งใบเสนอราคา = print/share ไม่ใช่สถานะ · Convert-to-PO กดได้จาก **Draft**. เหตุผล: dispatcher over-added Sent/sent-date รอบก่อน — ปอนด์ยืนยันให้ REMOVE. อัปเดต `quotation.md` §3/§4/§7/§9/§10/§12 + `entity-status-map.md` §1.1b + `deletion-policy.md` §2.9/matrix. **UX/UI ต้องถอด Sent chip/badge + sent-date column/search จาก quotation-list (ดู §8).** |
| **★ Customer — financial summary** | **DECIDED 2026-07-29 (Customer review)** | customer-detail แสดง ยอดซื้อรวม/จ่ายมาแล้ว/ค้างชำระ (THB, computed read-only). `customer.md` §3/§7 |
| **★ Customer — Follow-up = flag แยก (ถอดจาก enum)** | **DECIDED 2026-07-29 (ปอนด์ยืนยัน · ตัวเลือก A) · settled · ปิด open item** | "ต้องติดตาม" ถอดออกจาก status → flag อิสระ · badge แยก · list/history filter. **ปอนด์ยืนยัน: ถอด "Follow-up" จาก status enum (6→5)** (`customer.md` §12). sync `entity-status-map.md` §1.1 + dashboard tile/filter ที่อ้าง 6 สถานะเดิม |
| **★ Customer — hard block Disabled/Blacklist** | **DECIDED 2026-07-29 (Customer review)** | Disabled/Blacklist = **HARD block เปิด QT/PO/SO**. `customer.md` §4.2, `quotation.md`, `po.md`, `so.md`, G4 |
| **★ Comment field convention (cross-cutting)** | **DECIDED 2026-07-29 (PO module 3 review) · settled** | ทุก object ธุรกรรม (QT/PO/SO/PRD/Batch/DN/Shipment/Invoice/GR/PR) มี **ช่อง comment เดียว แก้ในที่ (overwrite) + เก็บประวัติการแก้ครบ (ใคร/เมื่อ/เดิม→ใหม่) ผ่าน field-audit เดิม + ดู inline "ประวัติการแก้ไข comment" + โผล่ trace + activity-log**. กติกากลาง = **`comment-convention.md` (CC1–CC7, G6)**; ราย module อ้างอิงไม่ทำสำเนา. อัปเดต `po.md` §3/§5.1/§6/§7/§10 · `quotation.md` §3/§5c/§7/§10 · `so.md` §3/§5b/§7 · `production.md` §3/§5b/§7 (PRD+Batch) · `shipping.md` §3/§4b/§6 (Shipment+DN) · `invoice.md` §3/§5b/§6 · `goods-receipt.md` §3/§4b/§6 · `pr.md` §3/§4b/§6 · `traceability.md` §3/§4/§5/§9 · `non-functional.md` AU1/AU2 |
| **★ Comment field — Return + QC record (object list 10→12)** | **DECIDED 2026-07-29 (ปอนด์เคาะตัวเลือก A) · settled · ปิด open item** | ปอนด์ยืนยัน **ตัวเลือก A** → **Return (ใบคืน) + QC record ได้ comment+history ด้วย** → comment-convention object list = **12** (เดิม 10). CC1–CC7 เหมือนกันทุกข้อ. comment เป็นช่องเพิ่ม **แยกจาก** "เหตุผลการคืน" (Return) และ "feedback" (QC) เดิม. อัปเดต `comment-convention.md` §2/§4/§6/§7 · `return.md` §2/§3/§4b/§5/§6/§7/§11 · `qc.md` §2/§3/§4b/§5/§6/§7/§11 · G6 (§3). **ปิด non-blocking flag §9 (Return/QC)** · UX/UI เพิ่ม UI comment บน return/qc screens (parallel) |
| **★ Customer Edit = ALL fields** | **DECIDED 2026-07-29 (PO module 3 review) · settled** | หน้า edit ลูกค้าแก้ได้ครบทุกฟิลด์เท่ากับ create (บริษัท/TYPE/credit/ภาษี-ที่อยู่/สถานะ/⚑ flag/ผู้ติดต่อ) **ไม่ใช่แค่ผู้ติดต่อ** · financial summary + รหัส CUS read-only · ทุกการแก้ audit/management-history · สิทธิ์ราย action คงเดิม. `customer.md` §2b/§3/§8/§9 |
| **★ Stock module 4 review (RM code / Loss-Adjust / BOM=FG / search / audit)** | **DECIDED 2026-07-29 (Stock module 4 review) · settled (no open Q)** | (1) **"เพิ่มวัตถุดิบใหม่"** — RM code **ผู้ใช้ตั้งเอง + UNIQUE** (reject ถ้าซ้ำ, free-form) · (2) **แยก Loss (ตัดคงคลัง −, RM บังคับ + Lot optional/FIFO) / Adjust (ปรับยอด +, RM บังคับ)** เป็น 2 action บนแท็บ RM — ledger `adjust (±)` → `loss (−)` + `adjust (+)` (D15) · (3) **ป้ายปุ่มบันทึก → "บันทึก (คงคลัง)"** ทั้ง RM ("บันทึก (ตัดคงคลัง)"→) และ FG ("บันทึก (ตัด onhand)"→) · (4) **RM/Lot/FG = search-in-dropdown; RM & FG ค้นได้ทั้งชื่อและรหัส** (G7) · (5) **BOM มีรหัส = รหัส FG (1 BOM=1 FG, 1:1, shared, auto — D11); "BOM = FG?" = ใช่** (OEM ก็มี FG identity ยอด 0 ยกเว้น surplus) · (6) **audit + trace ทุก stock movement (add-RM/loss/adjust, RM+FG) + reason/source (D15)**. อัปเดต `stock.md` §2/§3b/§4/§5/§6/§8/§9/§10/§11 · `bom.md` §3/§5/§7 · `goods-receipt.md` §1/§3/§6/§7/§10 · `traceability.md` §3/§4/§5/§9 · `non-functional.md` AU3/D-F4/D-F5 |
| `scope-…` D8/credit · U4 · stock-reservation Q1 | คงตามรอบก่อน | D8 v2 · credit 60 · Option A |

---

## 8. งานส่งต่อ UX/UI (สรุป)

**punch-list เดิม U1/U2/U3/U5/U6 (ยังค้าง) + delta:** customer TYPE/credit/history · quotation dropdown/no-auto-PR/print-ready/Convert/ปุ่มยกเลิก QT · po/so dropdown+reserve+auto-PR · stock/GR/return · bom cost/TYPE/planning · production queue/actual/surplus · supply-planning: filter + edit→save + สั่งผลิต + Low bell/badge · dashboard/home/platform · qc/shipping/invoice/traceability/settings · pagination/search + customer dropdown component.

> **★ PO module 3 review — UI ที่ UX/UI ต้องเพิ่ม (2026-07-29):**
> **(M1) Comment control (cross-cutting) — เพิ่มบนทุก object ธุรกรรม (12 ตัว):** กล่อง **"หมายเหตุ (comment)"** (free-text, ช่องเดียว, แก้ในที่/overwrite) + affordance **"ประวัติการแก้ไข (change history)"** = popover/timeline (เวลา / ผู้แก้ / ค่าเดิม→ค่าใหม่, 20/หน้า). แสดง **ค่าปัจจุบันเด่นบน detail**. วางบนหน้า:
> - **PO:** po-create (ตั้งค่าแรก) + po-detail (แก้ + ประวัติ).
> - **QT:** quotation-create + quotation-detail (ควบคู่ activity-log).
> - **PRD & Batch:** production (comment แยกต่อ PRD และต่อ Batch run).
> - **DN & Shipment (รอบ):** delivery-note (DN) + shipping (รอบ) — แยกช่องต่อ object.
> - **SO:** so-create + so-detail. · **Invoice:** invoice-detail (ไม่พิมพ์ลงใบกำกับ). · **GR:** goods-receipt. · **PR:** purchase-request / pr-create.
> - **★ Return:** return (return-detail) — ช่อง comment **แยกจาก "เหตุผลการคืน" (บังคับ)**. · **★ QC record:** qc (Batch line / Lot record) — ช่อง comment **แยกจาก "feedback" (บังคับเมื่อไม่ผ่าน)**. *(ปอนด์เคาะตัวเลือก A — UX/UI กำลังเพิ่มสองจอนี้ขนานกัน)*
> ยึดกติกา `comment-convention.md` (G6) — comment เป็นคนละฟิลด์กับ "เหตุผลยกเลิก/void/QC feedback/return reason/Hold/loss/postpone".
> **(M2) Customer Edit = all fields (already in flight):** หน้าแก้ไขลูกค้าเปิดฟอร์ม **ครบทุกฟิลด์เท่ากับ create** (บริษัท/ธุรกิจ, TYPE OEM/Own-Brand, credit term, ภาษี/ที่อยู่, สถานะ 5-status, ⚑ flag ต้องติดตาม, ผู้ติดต่อ) — **ไม่ใช่แค่ผู้ติดต่อ**; **financial summary + รหัส CUS = read-only**. (UX/UI กำลังทำ customer edit — ให้ครอบทุกฟิลด์ตาม `customer.md` §2b.)

> **★ Quotation REVERT — UI ที่ UX/UI ต้องถอด (2026-07-29 · quotation-list):** ตามคำสั่งปอนด์ให้ถอด "Sent" + sent-date ทั้งหมด — UX/UI ต้องแก้ `quotation-list.html` (+ detail/create ถ้ามีร่องรอย):
> - **ถอด filter chip "ส่งแล้ว (Sent)"** ออกจากแถบ filter สถานะ → เหลือ **ร่าง / ยืนยัน / ปฏิเสธ / ยกเลิก**.
> - **ถอด badge "ส่งแล้ว (Sent)"** ออกจากคอลัมน์สถานะ (lifecycle badges = Draft/Confirmed/Rejected/Cancelled).
> - **ถอดคอลัมน์ "วันที่ส่งลูกค้า (sent-date)"** ออกจากตาราง list.
> - **ถอดช่องค้นหา "ช่วงวันที่ส่งลูกค้า (sent-date range)"** → เหลือ **ช่วงวันที่สร้าง (created-date range) แกนเดียว**.
> - **ถอดปุ่ม/action "ส่งลูกค้า (→ Sent)"** ถ้าเคยใส่บน detail (การส่ง = print/share จาก print-ready view, ไม่เปลี่ยนสถานะ).
> - **ทุกอย่างอื่นจากรีวิว Quotation คงเดิม:** Convert-to-PO popup → Confirmed, banner ถาวร "ไปสร้าง PO", material check บน edit, activity-log visible, ปุ่มยกเลิก QT (ทุกสถานะ). (ยึด `quotation.md` §2–§10)

> **★ Quotation review UI follow-up (2026-07-29 · คงไว้):** (Q1) status badge/filter ครบชุด = **ร่าง/ยืนยัน/ปฏิเสธ/ยกเลิก** (ไม่มี Sent) · (Q2) ค้นด้วย **created-date แกนเดียว** · (Q3) material check บน edit · (Q4) Convert-to-PO popup → Confirmed · (Q5) banner ถาวร "ไปสร้าง PO" · (Q6) activity-log visible + node QT บน trace. (`quotation.md` §2–§10)

> **★ Customer review UI follow-up (2026-07-29):** (C1) การ์ด "สรุปการเงิน" · (C2) flag ⚑ badge แยก · (C3) filter "⚑ ต้องติดตาม" · (C4) block affordance เมื่อ Disabled/Blacklist · (C5) status enum badge/filter = **5 สถานะ** (ถอด "Follow-up") — DECIDED §7. (`customer.md`)

> **★ Stock module 4 review UI follow-up (2026-07-29) — จอ stock/bom:**
> **แท็บ RM (`stock.html`):**
> - **(S1)** ปุ่ม/ฟอร์ม **"เพิ่มวัตถุดิบใหม่"** — ช่อง **รหัสวัตถุดิบ (ผู้ใช้พิมพ์เอง)** + inline validation **"รหัสนี้ถูกใช้แล้ว"** (unique) + ชื่อ + หน่วยนับ.
> - **(S2)** แยกเป็น **2 แท็บ/action:** **Loss (ตัดคงคลัง)** = ลด (−), เลือก **RM (บังคับ)** + **Lot (ไม่บังคับ)** · **Adjust (ปรับยอด)** = เพิ่ม (+), เลือก **RM (บังคับ)** — เหตุผลบังคับทั้งคู่.
> - **(S3)** **RM & Lot = search-in-dropdown** — RM **ค้นได้ทั้งชื่อและรหัส** · Lot ค้นผ่าน dropdown.
> - **(S4)** เปลี่ยนป้ายปุ่มบันทึก **"บันทึก (ตัดคงคลัง)" → "บันทึก (คงคลัง)"**.
> **แท็บ FG (`stock.html`):**
> - **(S5)** ฟอร์ม **loss / ปรับยอด FG** — เลือก **FG = search-in-dropdown ค้นได้ทั้งชื่อและรหัส**.
> - **(S6)** เปลี่ยนป้ายปุ่มบันทึก **"บันทึก (ตัด onhand)" → "บันทึก (คงคลัง)"**.
> **BOM (`bom-create.html`):**
> - **(S7)** แสดง **ช่องรหัส BOM/FG** ให้เห็น (auto, 1 BOM=1 FG, 1:1, shared code — ไม่ให้ผู้ใช้แก้) เพื่อให้ FG ค้นด้วยรหัสได้.
> ยึด `stock.md` §3b/§4/§5/§10 + `bom.md` §3/§5.

---

## 9. Open questions
**ไม่มี open question ค้าง — ปิดครบทั้งหมด (2026-07-29).**

**คำถามที่ปิดแล้ว (2026-07-29):**
- Supply Planning proactive alert → DECIDED · Quotation abandon → DECIDED · Quotation review → DECIDED · **★ Quotation REVERT "Sent"+sent-date → DECIDED (ปอนด์)** · Traceability/Reference → DECIDED · Customer financial summary / hard block → DECIDED · **★ Customer Follow-up enum disposition → DECIDED (ปอนด์ยืนยัน · ตัวเลือก A: ถอด "Follow-up" จาก status enum → 5 สถานะ + flag แยก)** · **Comment convention (12 objects, รวม Return + QC record) → DECIDED (settled)** · **Customer Edit = all fields → DECIDED (settled)** · **★ Stock module 4 (RM code user-unique / Loss=− Adjust=+ / BOM=FG shared code / search dropdown / audit) → DECIDED (settled, no open Q)**.

> **สรุปสถานะ:** ทุกรายการ **settled → READY_FOR_UX_UI**. ไม่มี open item ค้าง. รอบนี้ = REVERT Quotation "Sent"/sent-date + housekeeping (ปิด Customer Follow-up enum + PR comment placement).
