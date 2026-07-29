# Requirement Package (Per-Module) — ESSENCE Hub System

slug: `erp-v2-ui-first` · เขียนโดย PO · 2026-07-29 · **CANONICAL & COMPLETE SINGLE SOURCE OF TRUTH** สำหรับ BA / QA / Tech-Lead
สถานะ: consolidation ของ requirement ที่กระจัดกระจาย → per-module ที่โครงสร้างสม่ำเสมอ **ครบทุก module + NFR + Deletion Policy** (existing-good absorb + delta ใหม่) · reconciled กับ D1–D18 + fold คำสั่งใหม่ของปอนด์ (2026-07-29)

## สรุปภาษาไทย
เอกสารชุดนี้คือ **แหล่งความจริงล่าสุดแบบราย module ที่ครบถ้วน (single source of truth)** ของทั้งระบบ ESSENCE Hub — ทุก module มี .md ที่เป็น **spec ปัจจุบันเต็ม**. Document Hub จัดเป็น **① Functional** (จัดตามแถบเมนูแอป) · **② Non-Functional** (`non-functional.md` + `deletion-policy.md` + **`traceability.md` = พื้นผิว trace/audit governance**) · **③ Reference** (เอกสารหลักการที่ยังใช้ได้) · ④ Architecture · ⑤ Mockups · **⑥ Archive (หน้าเก่า superseded, collapsed)** — หมวด ①/②/③ ลิงก์เฉพาะภายในแพ็กเกจ/reference ไม่เด้งออกไปหน้าเก่า. **★ ปอนด์เคาะ 4 ข้อ (2026-07-29) — ปิดคำถามค้างทั้งหมด:** (1) traceability → Non-Functional, (2) Reference เป็นหมวดของตัวเอง, (3) **Supply Planning แจ้งเตือน Low เชิงรุก** (real-time + J8 digest, แนบ Suggested), (4) **Quotation ยกเลิกได้ทุกสถานะ** (PO loose reference, no cascade, activity-log). **★ Customer module review (2026-07-29 — settled):** financial summary + follow-up flag แยก status + hard block QT/PO/SO เมื่อ Disabled/Blacklist → **ถอด "Follow-up" ออกจาก status enum → 5 สถานะ + flag ⚑ แยก**. **★ Quotation module review (2026-07-29 — settled):** reseat "ตกลง (Agreed)" → "ยืนยัน (Confirmed)" + banner "ไปสร้าง PO" + material check บน edit + activity-log ทุก action → trace · **REVERTED: ถอดสถานะ "ส่งแล้ว (Sent)" + sent-date ออกทั้งหมด**. **★ PO (module 3) review (2026-07-29):** Comment field convention (12 object) + Customer Edit = all fields. **★ Stock (module 4) review (2026-07-29):** RM code ผู้ใช้ตั้ง+unique · Loss/Adjust 2 action · "บันทึก (คงคลัง)" · RM/Lot/FG search dropdown (ค้นชื่อ+รหัส) · BOM=FG shared code · audit+trace ทุก movement. **★★ Supplier + BOM module review (2026-07-29 — settled, no open Q):** **(Supplier)** RM ใน price-matrix = **search dropdown ค้นชื่อ+รหัส (G7)** · audit ครบ (create/edit/active-inactive/price-matrix). **(BOM)** **รหัส BOM = ผู้ใช้ตั้งเองตอนสร้าง + unique + ★ ล็อกหลังสร้าง (create-only-lock) — reconcile D11→D11 v2; RM code ก็ด้วย** · RM component = **search dropdown ค้นชื่อ+รหัส (G7)** · **ราคาซื้อแก้มือได้ ทั้งมี/ไม่มี supplier (ไม่บล็อกแล้ว)** · **BOM = Active/Inactive (ลบถาวรไม่ได้) → Inactive บล็อก QT/PO/SO + กันออก Supply Planning, ไม่กระทบงานที่วิ่งอยู่** · audit ทุกการเปลี่ยน BOM. อัปเดต `supplier.md` · `bom.md` · `stock.md` · `deletion-policy.md` · `quotation.md`/`po.md`/`so.md` · `supply-planning.md` · `traceability.md` · `non-functional.md` · `entity-status-map.md`.

---

## 1. โครงไฟล์ (file tree — ครบทั้งชุด)

```
docs/requirements/erp-v2-ui-first/modules/
  README.md                  ← ไฟล์นี้ (index + D-rule spine + changelog + source-of-truth + old→new map + global rules)
  permission-matrix.md       ← capability → module → action/button (รวมทุก module, +3 module ใหม่)
  comment-convention.md      ← ★ กติกากลาง comment + change-history (CC1–CC7) · object list 12 ตัว · อ้างโดยทุก module ธุรกรรม

  # System-wide / Governance (Non-Functional bucket ใน Hub)
  non-functional.md          ← NFR รวม: perf/auth-session/audit/backup-infra/data-format/jobs J1–J8/noti/search/responsive/soft-delete/reliability
  deletion-policy.md         ← (folded) soft-delete/void baseline + entity เดิม + entity ใหม่ (QT cancel-anytime/SO/FG Batch/OEM surplus/cost snapshot/★ BOM inactivate)
  traceability.md            ← trace/audit governance ข้าม module · entity/field search · genealogy · field-audit · ★ comment/stock-movement/BOM/Supplier audited

  # Platform & Navigation (Functional · ระบบ)
  platform.md                ← login local+Google · session 24h/06:00 · notification outbox+read-bit (+FG→Low) · global search · responsive+guard
  home.md                    ← task inbox ตามสิทธิ์ · quick actions · onboarding
  dashboard.md               ← 7 แผนก × 29 tile · event/state · date filter · drill · permission-based

  # Sales & Customer (Functional · งานขาย/Order)
  customer.md                ← ★ + financial summary · follow-up flag (แยก status) · hard block Disabled/Blacklist · ★ Edit = all fields
  quotation.md               ← OEM Quotation · ยกเลิกได้ทุกสถานะ · hard block ลูกค้า + ★ hard block Inactive BOM/FG · Confirmed reseat · ★ comment · (ไม่มี Sent)
  po.md                      ← OEM Purchase Order · hard block ลูกค้า + ★ Inactive BOM/FG · prefill จาก QT Confirmed · ★ comment
  so.md                      ← Own-Brand Sales Order · hard block ลูกค้า (โหมด ก) + ★ Inactive FG/BOM (2 โหมด) · ★ comment

  # Supply Planning & Production (Functional · ผลิต&คุณภาพ)
  bom.md                     ← BOM + other-cost + TYPE(OEM/FG) + Supply-Planning config + ★ รหัส user-entered+lock (D11 v2) + ★ ราคาซื้อแก้มือ + ★ Active/Inactive
  supply-planning.md         ← Demand & Production Cover + FORMULA SUMMARY + ★ proactive Low alerting + ★ กัน Inactive FG ออก
  production.md              ← PRD/Batch + actual-qty/surplus + queue search/filter · ★ comment (PRD + Batch)
  qc.md                      ← ตรวจ Batch/Lot · rework เฉพาะ line เสีย + feedback · GMP chain · ★ comment (QC record)

  # Inventory & Procurement (Functional · คลัง&จัดซื้อ)
  stock.md (★ add-RM unique+lock + Loss/Adjust 2 actions + search dropdown) · goods-receipt.md (★ comment + RM master ref) · pr.md (★ comment) · supplier.md (★ RM search dropdown + audit) · return.md (★ comment)

  # Fulfilment & Finance (Functional · จัดส่ง&การเงิน)
  shipping.md (★ comment: Shipment รอบ + DN) · invoice.md (★ comment)

  # System (Functional · ระบบ)
  settings.md                ← RUCDAA + Admin bit · user + bulk reassign · VAT · company · audit · +3 module ใหม่

  flows/
    oem-flow.md · ownbrand-flow.md
```

HTML review view: `docs/design/erp-v2-ui-first/functional-spec/modules/index.html` (+ ราย module) · Hub `functional-spec/index.html` จัด ① Functional / ② Non-Functional / ③ Reference / ④ Architecture / ⑤ Mockups / ⑥ Archive.

---

## 2. D-Rule Spine (ยังคงเป็นแกน — พร้อม DELTA ที่ปอนด์แก้ 2026-07-29)

D1–D18 ยังเป็นกฎแกน (ดูฉบับเต็ม `scope-oem-ownbrand-supply-planning.md` §1). **จุดที่อัปเดต:**

### 2.1 ★ D8 v2 — ปุ่ม "สั่งผลิต" ใน Supply Planning
กด "สั่งผลิต" → **พาไปหน้า SO produce-to-stock (ไม่เลือกลูกค้า) แบบ PRE-FILL** (จำนวน = Suggested) → เข้าสาย production. ให้ produce-to-stock มีที่มาเดียว (แก้ U4). ดู `supply-planning.md` §5, `so.md`.

### 2.2 ★ Credit Term — ระดับลูกค้า 30/60/90 · DEFAULT 60
per-invoice override ยังทำได้; ยึด effective ตาม invoice date. ดู `customer.md`/`invoice.md`.

### 2.3 ★ D18 reseat — QT "ตกลง (Agreed)" → "ยืนยัน (Confirmed)" (2026-07-29 Quotation review · Sent reverted)
D18-4 (ถ้อยคำเดิมที่ล็อก) กำหนดสถานะ ร่าง/ส่งแล้ว/**ตกลง (Agreed)**/ปฏิเสธ. ปอนด์ปรับ: **การกด "Convert to PO" คือการยืนยันว่าลูกค้าตกลง → ตั้ง QT = "ยืนยัน (Confirmed)" ทันที** · การสร้าง PO เป็น **ขั้นอิสระ** · loose ref + no cascade + cancel-anytime **คงเดิม**. **★ REVERTED: ถอดสถานะ "ส่งแล้ว (Sent)" + ฟิลด์ sent-date ออกทั้งหมด** — QT lifecycle = ร่าง/ยืนยัน/ปฏิเสธ/ยกเลิก. **module package wins** เหนือถ้อยคำ D18-4. authoritative = `quotation.md` · entity-status-map §1.1b.

### 2.4 ★★ D11 v2 reconcile — รหัส BOM/FG + RM = ผู้ใช้ตั้งเองตอนสร้าง + ล็อก (2026-07-29 BOM review)
D11 เดิม (ถ้อยคำที่ล็อก) = "1 BOM = 1 FG · **รหัส FG สร้างอัตโนมัติ (auto)**". ปอนด์ปรับ (2026-07-29: **"สร้างได้ แต่แก้ไขไม่ได้ RM ก็ด้วย"**) → **D11 v2:**
- **1 BOM = 1 FG (1:1) + BOM/FG แชร์รหัสเดียวกัน — คงเดิม.**
- **ที่มารหัสเปลี่ยน: auto → ผู้ใช้พิมพ์เองตอนสร้าง (user-entered on create) + ต้องไม่ซ้ำ (unique).**
- **เพิ่ม create-only-lock: รหัสแก้ไม่ได้หลังสร้าง (read-only)** — เพื่อคง shared code ให้ reference (FG stock/PO/SO/QT/PRD/Batch/trace) ไม่แตก (stable identity).
- **รหัส RM ก็กติกาเดียวกัน** (user-entered ตอนสร้าง + unique + ล็อก — "RM ก็ด้วย").
- **module package wins** เหนือถ้อยคำ "auto" ของ D11. authoritative = `bom.md` §5 · `stock.md` §3b · entity-status-map §1.1c/§1.6 · non-functional D-F5.

> D1–D7, D9–D10, D12–D17 **ไม่เปลี่ยน**. D11 → D11 v2 (code source auto→user + create-only-lock; 1:1+shared คงเดิม). D18 = reseat ถ้อยคำสถานะ. **หมายเหตุ:** คำสั่งปอนด์รอบ Stock/BOM/Supplier เป็นการ implement/refine ภายใต้ D-rule เดิม (D9/D11/D15) — D11 เท่านั้นที่ปรับที่มารหัส (v2).

---

## 3. GLOBAL Rules (บังคับทุก module — ปอนด์สั่ง 2026-07-29)

| # | กติกา | รายละเอียด |
|---|---|---|
| **G1 Pagination** | list/history ทุกอัน **20 แถว/หน้า + pagination** | ทุก list + drill dashboard + ledger + audit + noti "ดูทั้งหมด" |
| **G2 Date-range search** | ค้น **เลขเอกสาร** หรือ **ช่วงวันที่สร้าง** | quotation/PO/SO/GR/PR/invoice/shipping list + production queue + audit · **★ quotation = ช่วงวันที่สร้าง (created-date) แกนเดียว** (★ ถอดแกน sent-date แล้ว — revert 2026-07-29) |
| **G3 Drill + back คงสถานะ** | กลับ **ไม่เสีย state เดิม** | dashboard drill · customer detail จาก order = modal |
| **G4 Customer search dropdown** | quotation/po/so-create | ค้นเบอร์/บริษัท/ผู้ติดต่อ · แสดงสถานะ+credit term · modal detail · **★ Disabled/Blacklist เลือกไม่ได้ (hard block, customer.md §4.2)** |
| **G5 Permission-per-action** | ทุกปุ่มระบุ capability | `permission-matrix.md` |
| **★ G6 Comment + change-history** | ทุก object ธุรกรรมมี **ช่องหมายเหตุเดียว แก้ในที่ (overwrite) + เก็บประวัติการแก้ครบ (ใคร/เมื่อ/เดิม→ใหม่) ดู inline + โผล่ trace** | **12 object:** QT/PO/SO/PRD/Batch/DN/Shipment/Invoice/GR/PR + Return + QC record · กติกากลาง = **`comment-convention.md` (CC1–CC7)** |
| **★ G7 Search-in-dropdown (RM/FG/Lot/component)** | เลือก RM/Lot/FG ในหน้า stock + **RM component ใน BOM** + **RM ใน supplier price-matrix** | **RM & FG ค้นได้ทั้งชื่อและรหัส** · **Lot ค้นผ่าน dropdown** (stock.md §10) · **★ BOM component RM (bom.md §3) + Supplier price-matrix RM (supplier.md §3) ก็ค้นชื่อ+รหัส** — ปอนด์สั่ง Stock/BOM/Supplier review 2026-07-29 |

> NFR ระดับระบบ (perf/auth/audit/format/jobs) รวมที่ `non-functional.md`.

---

## 4. Confirmations ที่ปอนด์สั่งให้ยืนยัน (RESOLVED)

| หัวข้อ | คำตัดสิน | เอกสาร |
|---|---|---|
| **Convert-to-PO** | กด "Convert to PO" → popup → QT = **Confirmed ทันที (immutable)** + loose link → เลือก prefill ตอนนี้/ทีหลัง | `quotation.md` §6 · `po.md` §5 · oem-flow |
| **SO (ก) ขายจากสต็อก** | จอง FG → พร้อมส่ง → ตัด FG FIFO ตอน dispatch → DN/Invoice | `so.md` · `shipping.md` |
| **SO (ข) ผลิตเก็บสต็อก** | BOM check → production; RM ขาด auto-PR; QC ผ่าน → FG เข้าคลัง | `so.md` |
| **★ Comment convention** | **12 object** ธุรกรรม (รวม Return + QC record) มีช่อง comment เดียว แก้ในที่ + เก็บประวัติครบ + โผล่ trace | `comment-convention.md` · ทุก module ธุรกรรม |
| **★ Customer Edit = all fields** | หน้า edit แก้ได้ครบทุกฟิลด์เท่ากับ create (financial summary read-only) | `customer.md` §2b |
| **★ Customer Follow-up = flag แยก (ถอดจาก enum)** | 5 สถานะ + flag ⚑ แยก | `customer.md` §4/§12 · `entity-status-map.md` §1.1 |
| **★ Stock — RM code / Loss-Adjust / BOM=FG** | RM code = ผู้ใช้ตั้ง+UNIQUE · Loss(−)/Adjust(+) 2 action · "บันทึก (คงคลัง)" · RM/Lot/FG search dropdown · BOM=FG shared · audit ทุก movement | `stock.md` · `bom.md` · `traceability.md` · `non-functional.md` |
| **★★ Supplier — RM search dropdown + audit** | **price-matrix เลือกวัตถุดิบผ่าน search dropdown ค้นชื่อ+รหัส (G7)** · **create/edit/active↔inactive/price-matrix = audit + trace** · max-active = default ราคาซื้อที่ BOM override ได้ | `supplier.md` §3/§5/§10 · `traceability.md` · `non-functional.md` AU1 |
| **★★ BOM — code lock + ราคาซื้อแก้มือ + Active/Inactive + audit** | **รหัส BOM/FG = ผู้ใช้ตั้งตอนสร้าง + unique + create-only-lock (D11 v2, RM ก็ด้วย)** · **RM component search dropdown ชื่อ+รหัส** · **ราคาซื้อแก้มือได้ ทั้งมี/ไม่มี supplier (ไม่บล็อก)** · **Active/Inactive (ลบถาวรไม่ได้) → Inactive บล็อก QT/PO/SO + กันออก Supply Planning, ไม่กระทบงานที่วิ่งอยู่** · audit ทุกการเปลี่ยน | `bom.md` · `stock.md` §3b · `deletion-policy.md` §2.4 · `quotation.md`/`po.md`/`so.md` · `supply-planning.md` · `traceability.md` · `non-functional.md` |

**หมายเหตุ:** Quotation ทำ material check (ทั้ง create + edit) แต่ **ไม่ auto-open PR**.

---

## 5. ★ Source-of-Truth Statement (ประกาศชัด)

1. **`modules/*.md` = AUTHORITATIVE spec ปัจจุบันของทุก module + NFR + Deletion Policy + Traceability** — ชุดเดียวที่ BA/QA/TL ยึด.
2. แต่ละ .md เป็น **spec เต็ม**. `non-functional.md` = NFR authoritative · `deletion-policy.md` = deletion authoritative · `traceability.md` = trace/audit governance · **`comment-convention.md` = comment+change-history convention authoritative**.
3. **เอกสารเก่า** (functional-spec module pages + cross-cutting + root `deletion-policy.md`) = **historical reference** → Hub ⑥ Archive (collapsed).
4. **เอกสารหลักการเชิงลึก** (`entity-status-map`, `status-journeys`, `stock-reservation`, `scope` D1–D18, `mock-data-spec`, `brief`, ADRs, `scheduled-jobs`, `rtm`, `glossary`, `continuity`, `list-conventions`) = **authoritative reference** → Hub ③ Reference. **★ entity-status-map §1.1 = customer status · §1.1b = QT lifecycle · §1.1c = BOM lifecycle (r8) — sync กับ module spec.** **เมื่อถ้อยคำ D-rule ที่ล็อก (scope) ต่างจาก module spec (เช่น Agreed↔Confirmed, มี/ไม่มี Sent, รหัส auto↔user-entered) → module package wins** (scope = historical lock ของ business intent เดิม; ถ้อยคำ/กลไกปัจจุบันยึด module).
5. **RTM/Traceability คงครบ:** ทุก story/AC ยัง map → module + mockup + journey.
6. **Navigation IA (Document Hub, ปอนด์เคาะ 2026-07-29):** ① **Functional** · ② **Non-Functional** (non-functional + deletion-policy + traceability) · ③ **Reference** · ④ Architecture · ⑤ Mockups · ⑥ 🗄 Archive. **หมวด ①/②/③ ลิงก์เฉพาะภายใน.**

---

## 6. ★ Map: เอกสารเก่า → ครอบคลุมโดย module ใด

| เอกสารเก่า | ครอบคลุมโดย module (authoritative) | หมายเหตุ |
|---|---|---|
| functional-spec BA pages (home/dashboard/platform/customer/po/production/qc/stock/pr/supplier/return/bom/shipping/invoice/traceability/settings) | โมดูลชื่อเดียวกันใน `modules/` (stock → stock+goods-receipt) | absorbed เต็ม · เก่าอยู่ ⑥ Archive |
| `list-conventions.html` (US-LST-01) | **G1–G3 (README §3)** + Pagination/Search ทุก module (ยังเป็น **③ Reference**) | มาตรฐาน list |
| `continuity.html` (cascade + noti matrix) | **platform.md** (noti, +FG→Low) + cross-links (ยังเป็น **③ Reference**) | cascade reference |
| **`brief.md` §5/§8 · ADR-000..009 · `scheduled-jobs.html` (J1–J7) · entity-status-map §1.6 · stock-reservation** | **non-functional.md** (J8 เพิ่มใหม่) | NFR รวม+อัปเดต |
| **root `deletion-policy.md` · `rbac-deletion.html`** | **deletion-policy.md** (folded) + **settings.md**/**permission-matrix.md** | fold + entity ใหม่ (+ ★ BOM inactivate) |
| `functional-spec/traceability.html` (US-TRC) | **traceability.md** — Hub ② Non-Functional | classification เปลี่ยน (ปอนด์เคาะ) |

> **Archive (Hub ⑥):** functional-spec module pages (16), `rbac-deletion.html`, root `docs/deletion-policy.html`, `docs/po-reviews.html` — collapsed, superseded.

---

## 7. Changelog — supersede / แก้ / ปอนด์เคาะ

| เอกสาร/รายการ | สถานะ | เหตุผล |
|---|---|---|
| functional-spec module pages (16) + root deletion-policy | **superseded (Archive)** | absorbed/folded → module package |
| NFR ใน brief/ADR/scheduled-jobs | **consolidated** | → `non-functional.md` |
| **★ Traceability classification** | **DECIDED 2026-07-29** | Hub placement → ② Non-Functional |
| **★ Reference section** | **DECIDED 2026-07-29** | ดึง reference band → หมวด ③ Reference |
| **★ Supply Planning proactive alerting** | **DECIDED 2026-07-29** | real-time (FG→Low) + J8 daily digest ~06:00, แนบ Suggested. เพิ่ม J8 (non-functional §6), event FG→Low. **ปิด parked question** |
| **★ Quotation cancellation / review / REVERT Sent** | **DECIDED 2026-07-29 · settled** | ยกเลิกได้ทุกสถานะ · loose ref · Convert→Confirmed reseat · banner · material check บน edit · activity-log · **ถอด Sent + sent-date**. `quotation.md`/`deletion-policy.md`/`entity-status-map.md` |
| **★ Customer — financial summary / follow-up flag / hard block** | **DECIDED 2026-07-29 · settled** | financial summary + follow-up flag แยก (ถอดจาก enum, 6→5) + hard block Disabled/Blacklist QT/PO/SO. `customer.md` |
| **★ Comment field convention (12 object) + Customer Edit = all fields** | **DECIDED 2026-07-29 (PO module 3 review) · settled** | ช่อง comment + change-history ทุก object ธุรกรรม (`comment-convention.md`) · edit ลูกค้า = ครบทุกฟิลด์. |
| **★ Stock module 4 review** | **DECIDED 2026-07-29 · settled** | RM code user+unique · Loss(−)/Adjust(+) · "บันทึก (คงคลัง)" · RM/Lot/FG search dropdown ชื่อ+รหัส · BOM=FG shared · audit ทุก movement. `stock.md`/`bom.md`/`traceability.md`/`non-functional.md` |
| **★★ Supplier module review** | **DECIDED 2026-07-29 (Supplier review) · settled (no open Q)** | **(1)** price-matrix เลือกวัตถุดิบ = **search dropdown ค้นชื่อ+รหัส (G7)** — reuse pattern Stock. **(2)** **audit + trace ตอกย้ำ:** supplier create/edit, active↔inactive, price-matrix change (ใคร/เมื่อ/เดิม→ใหม่). **(3)** max-active = **default ราคาซื้อที่ BOM override ได้**; ไม่มี active supplier = **ไม่บล็อก** BOM แล้ว. อัปเดต `supplier.md` §3/§4/§5/§9/§10 · `traceability.md` §3/§4 · `non-functional.md` AU1/D-F4 |
| **★★ BOM module review — code lock (D11 v2) + ราคาซื้อแก้มือ + Active/Inactive + audit** | **DECIDED 2026-07-29 (BOM review, ปอนด์: "สร้างได้ แต่แก้ไขไม่ได้ RM ก็ด้วย") · settled (no open Q)** | **(1)** **รหัส BOM = ผู้ใช้ตั้งเองตอนสร้าง + UNIQUE + ★ create-only-lock (แก้ไม่ได้หลังสร้าง)** → **reconcile D11→D11 v2** (code source auto→user; 1:1+shared คงเดิม; +lock) · **RM code ก็ด้วย** (user-entered+unique+lock). **(2)** **RM component ใน BOM = search dropdown ค้นชื่อ+รหัส (G7)**. **(3)** **ราคาซื้อ (purchase price) แก้มือได้โดยตรง — ทั้งมี/ไม่มี active supplier** (default=max-active, override ได้; ไม่มี supplier ก็กรอกเอง ไม่บล็อก); feed cost+snapshot. **แทนกฎเดิม "no active supplier → block"**. **(4)** **BOM ลบถาวรไม่ได้ → Active/Inactive**; **Inactive บล็อกเปิด QT/PO/SO ใหม่ที่อ้าง BOM/FG + กันออก Supply Planning** (คนละแหล่งกับ block ลูกค้า) · **ไม่กระทบงานผลิต/เอกสารที่วิ่งอยู่แล้ว/FG stock เดิม**. **(5)** **audit + trace ทุกการเปลี่ยน BOM** (create/edit/ราคาซื้อ/inactivate/reactivate). อัปเดต `bom.md` (rewrite) · `stock.md` §3b/§4/§9 · `deletion-policy.md` §2.4/matrix · `quotation.md`/`po.md`/`so.md` (§validations block) · `supply-planning.md` §4 (exclude) · `traceability.md` §3/§4 · `non-functional.md` AU1/AU3/D-F5/§10 · `entity-status-map.md` §1.1c/§1.6/cascade#23/§4 |
| `scope-…` D8/credit · U4 · stock-reservation Q1 | คงตามรอบก่อน | D8 v2 · credit 60 · Option A |

---

## 8. งานส่งต่อ UX/UI (สรุป)

**punch-list เดิม + delta รอบก่อน:** customer · quotation dropdown/no-auto-PR/print-ready/Convert/ปุ่มยกเลิก · po/so dropdown+reserve+auto-PR · stock/GR/return · bom cost/TYPE/planning · production · supply-planning · dashboard/home/platform · qc/shipping/invoice/traceability/settings · pagination/search + customer dropdown component. (ดูรายละเอียดรอบก่อนใน commit history — คงไว้)

> **★ Comment control (cross-cutting, 12 object)**, **★ Customer Edit = all fields**, **★ Quotation REVERT Sent/sent-date**, **★ Stock (add-RM/Loss-Adjust/search dropdown/"บันทึก (คงคลัง)")** — คงตามรอบก่อน (ดู commit history).

> **★★ Supplier module review — UI ที่ UX/UI ต้องเพิ่ม/แก้ (2026-07-29 · `supplier.html`):**
> - **(SUP-1)** ช่องเลือกวัตถุดิบใน **price matrix = search-in-dropdown ค้นได้ทั้งชื่อและรหัส (G7)** (reuse component เดียวกับ stock RM dropdown) + inline validation "วัตถุดิบผูกแล้ว".
> - **(SUP-2)** (ไม่ใช่ UI ใหม่ แต่ระบุ) การแก้ราคา/สลับ Active-Inactive/แก้ price-matrix มี **trace/audit** — ถ้ามีแผง "ประวัติการแก้ราคา" บน supplier ให้ชี้ไป field-audit เดียวกัน.
> ยึด `supplier.md` §3/§5/§10.

> **★★ BOM module review — UI ที่ UX/UI ต้องเพิ่ม/แก้ (2026-07-29 · `bom-create.html` + `bom.html`):**
> - **(BOM-1)** **ช่องรหัส BOM/FG** = **ผู้ใช้พิมพ์เองตอนสร้าง** + inline validation **"รหัสนี้ถูกใช้แล้ว" (unique)** · **แสดงเป็น read-only (ล็อก) เมื่ออยู่โหมดแก้ไข** (create-only-lock — D11 v2). *(เปลี่ยนจากเดิมที่วางแผนไว้ว่าเป็น auto/read-only ตลอด — ตอนนี้ตั้งเองตอนสร้าง แล้วล็อก.)*
> - **(BOM-2)** **RM component (วัตถุดิบในสูตร) = search-in-dropdown ค้นได้ทั้งชื่อและรหัส (G7)** (เหมือน stock RM dropdown).
> - **(BOM-3)** **ช่อง "ราคาซื้อ" ต่อ component แก้ด้วยมือได้โดยตรง** — default = max-active supplier (แสดง hint), override ได้; **กรณีไม่มี active supplier → ไม่บล็อก** ให้กรอกเองได้ (แสดง hint "ไม่มีราคาจาก supplier — กรอกเอง"). **ถอด affordance "บล็อกจนกว่าจะ override" แบบเดิม.**
> - **(BOM-4)** **Toggle Active/Inactive** บน bom-create/detail (บังคับเหตุผลตอน inactivate) + **badge "ปิดใช้งาน"** บน bom list + **filter สถานะ Active/Inactive**. (ไม่มีปุ่ม "ลบ" ถาวร — เป็น inactivate.)
> - **(BOM-5) affordance บล็อก Inactive ในหน้า sales:** ที่ quotation-create / po-create / so-create — **BOM/FG ที่ Inactive หายจาก dropdown เลือกรายการ** + ถ้าหลุดเข้ามา แสดง error *"สูตร/สินค้าปิดใช้งาน (Inactive)"* (คนละข้อความกับ block ลูกค้า Disabled/Blacklist). Supply Planning: **FG Inactive ไม่โผล่/ไม่มีปุ่มสั่งผลิต**.
> ยึด `bom.md` §2b/§3/§5/§5b/§5c · `quotation.md`/`po.md`/`so.md` §validations · `supply-planning.md` §4.

---

## 9. Open questions
**ไม่มี open question ค้าง — ปิดครบทั้งหมด (2026-07-29).**

**คำถามที่ปิดแล้ว (2026-07-29):** Supply Planning proactive alert · Quotation abandon/review/REVERT Sent · Traceability/Reference · Customer financial summary / follow-up enum / hard block · Comment convention (12 objects) · Customer Edit = all fields · **Stock module 4** · **★★ Supplier module review (RM search dropdown + audit) → DECIDED (settled, no open Q)** · **★★ BOM module review (code create-only-lock D11 v2 + RM code lock / RM component search / ราคาซื้อแก้มือ ไม่บล็อก / Active-Inactive บล็อก sales / audit) → DECIDED (settled, no open Q)**.

> **การตัดสินสมเหตุผลของ PO (ไม่ถือเป็น open question):** **BOM Inactive → FG ถูกกันออกจาก Supply Planning** (ไม่แนะนำ/ไม่สั่งผลิต/ไม่ยิง Low alert) — สอดคล้องกับการที่ Inactive บล็อกการเปิด SO ผลิตเก็บสต็อก (`supply-planning.md` §4, `bom.md` §5c). ถ้าปอนด์ต้องการให้ FG Inactive ยังโผล่ใน Supply Planning เพื่อดูอย่างเดียว (ไม่สั่งผลิต) — แจ้งปรับได้ แต่ค่า default ปัจจุบัน = กันออกทั้งหมด.

> **สรุปสถานะ:** ทุกรายการ **settled → READY_FOR_UX_UI**. รอบนี้ = Supplier (RM search dropdown + audit) + BOM (code create-only-lock D11 v2 + RM component search + ราคาซื้อแก้มือ + Active/Inactive block sales + audit).
