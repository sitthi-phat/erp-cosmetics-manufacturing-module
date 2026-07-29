# Requirement Package (Per-Module) — ESSENCE Hub System

slug: `erp-v2-ui-first` · เขียนโดย PO · 2026-07-29 · **CANONICAL & COMPLETE SINGLE SOURCE OF TRUTH** สำหรับ BA / QA / Tech-Lead
สถานะ: consolidation ของ requirement ที่กระจัดกระจาย → per-module ที่โครงสร้างสม่ำเสมอ **ครบทุก module + NFR + Deletion Policy** (existing-good absorb + delta ใหม่) · reconciled กับ D1–D18 + fold คำสั่งใหม่ของปอนด์ (2026-07-29)

## สรุปภาษาไทย
เอกสารชุดนี้คือ **แหล่งความจริงล่าสุดแบบราย module ที่ครบถ้วน (single source of truth)** ของทั้งระบบ ESSENCE Hub — ทุก module มี .md ที่เป็น **spec ปัจจุบันเต็ม**. Document Hub จัดเป็น **① Functional** (จัดตามแถบเมนูแอป) · **② Non-Functional** (`non-functional.md` + `deletion-policy.md` + **`traceability.md` = พื้นผิว trace/audit governance**) · **③ Reference** (เอกสารหลักการที่ยังใช้ได้) · ④ Architecture · ⑤ Mockups · **⑥ Archive (หน้าเก่า superseded, collapsed)** — หมวด ①/②/③ ลิงก์เฉพาะภายในแพ็กเกจ/reference ไม่เด้งออกไปหน้าเก่า. **★ ปอนด์เคาะ 4 ข้อ (2026-07-29) — ปิดคำถามค้างทั้งหมด:** (1) traceability → Non-Functional, (2) Reference เป็นหมวดของตัวเอง, (3) **Supply Planning แจ้งเตือน Low เชิงรุก** (real-time + J8 digest, แนบ Suggested), (4) **Quotation ยกเลิกได้ทุกสถานะ** (PO loose reference, no cascade, activity-log). **★ Customer module review (2026-07-29 — settled):** financial summary + follow-up flag แยก status + hard block QT/PO/SO เมื่อ Disabled/Blacklist → **ถอด "Follow-up" ออกจาก status enum → 5 สถานะ + flag ⚑ แยก**. **★ Quotation module review (2026-07-29 — settled):** reseat "ตกลง (Agreed)" → "ยืนยัน (Confirmed)" + banner "ไปสร้าง PO" + material check บน edit + activity-log ทุก action → trace · **REVERTED: ถอดสถานะ "ส่งแล้ว (Sent)" + sent-date ออกทั้งหมด**. **★ PO (module 3) review (2026-07-29):** Comment field convention (12 object) + Customer Edit = all fields. **★ Stock (module 4) review (2026-07-29):** RM code ผู้ใช้ตั้ง+unique · Loss/Adjust 2 action · "บันทึก (คงคลัง)" · RM/Lot/FG search dropdown (ค้นชื่อ+รหัส) · BOM=FG shared code · audit+trace ทุก movement. **★★ Supplier + BOM module review (2026-07-29 — settled, no open Q):** **(Supplier)** RM ใน price-matrix = **search dropdown ค้นชื่อ+รหัส (G7)** · audit ครบ. **(BOM)** **รหัส BOM = ผู้ใช้ตั้งเองตอนสร้าง + unique + ★ ล็อกหลังสร้าง (D11 v2; RM ก็ด้วย)** · RM component = **search dropdown (G7)** · **ราคาซื้อแก้มือได้ ทั้งมี/ไม่มี supplier** · **BOM = Active/Inactive → Inactive บล็อก QT/PO/SO + กันออก Supply Planning** · audit ทุกการเปลี่ยน. **★★ Settings module review (2026-07-29 — settled, no open Q):** **(Role)** ค้นหา role · filter **Active/Disabled/Deleted** · ดู role's user list + **ถอด user ออกจาก role** · **Disable (พักชั่วคราว, reversible)** + **Soft-delete (recoverable)** — ทั้งสองแบบ member เสีย permission; **★ ไม่ต้องย้าย user ออกก่อน (supersede กฎเดิม "block until users moved")**. **(User)** ค้นหาชื่อ-สกุล/username · password mode (**must-change-first-login / permanent**) + กรอก 2 ครั้ง + show/hide · edit ไม่โชว์รหัสเดิม · **Google account link → login เลือก basic/Google**. **(Admin-only)** **VAT / ข้อมูลบริษัท / Audit-log = Admin bit เท่านั้น**. **(Audit)** ทุกการเปลี่ยน Settings → audit + trace. อัปเดต `settings.md` (primary) · `platform.md` · `non-functional.md` · `deletion-policy.md` · `permission-matrix.md` · README.

---

## 1. โครงไฟล์ (file tree — ครบทั้งชุด)

```
docs/requirements/erp-v2-ui-first/modules/
  README.md                  ← ไฟล์นี้ (index + D-rule spine + changelog + source-of-truth + old→new map + global rules)
  permission-matrix.md       ← capability → module → action/button (รวมทุก module, +3 module ใหม่, ★ Settings Admin-gate)
  comment-convention.md      ← ★ กติกากลาง comment + change-history (CC1–CC7) · object list 12 ตัว · อ้างโดยทุก module ธุรกรรม

  # System-wide / Governance (Non-Functional bucket ใน Hub)
  non-functional.md          ← NFR รวม: perf/auth-session (★ password mode + Google link + Admin-gate)/audit/backup-infra/data-format/jobs J1–J8/noti/search/responsive/soft-delete/reliability
  deletion-policy.md         ← (folded) soft-delete/void baseline + entity เดิม + entity ใหม่ (QT cancel-anytime/SO/FG Batch/OEM surplus/cost snapshot/★ BOM inactivate/★ Role disable+soft-delete)
  traceability.md            ← trace/audit governance ข้าม module · entity/field search · genealogy · field-audit · ★ comment/stock-movement/BOM/Supplier/Settings audited

  # Platform & Navigation (Functional · ระบบ)
  platform.md                ← login ★ basic-vs-Google choice + first-login password change · session 24h/06:00 · notification outbox+read-bit (+FG→Low) · global search · responsive+guard
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
  settings.md                ← RUCDAA + Admin bit · user + bulk reassign · VAT · company · audit · +3 module ใหม่ · ★ role search/filter/user-list/remove-user/disable+soft-delete · ★ user search + password modes + Google link · ★ VAT/Company/Audit = Admin only

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

> D1–D7, D9–D10, D12–D17 **ไม่เปลี่ยน**. D11 → D11 v2. D18 = reseat ถ้อยคำสถานะ. **หมายเหตุ:** คำสั่งปอนด์รอบ Stock/BOM/Supplier/**Settings** เป็นการ implement/refine ภายใต้ D-rule เดิม (D9/D11/D14/D15) — D11 เท่านั้นที่ปรับที่มารหัส (v2). **Settings review = refine ภายใต้ D14 (RBAC generic)** — ไม่แตะ D-rule spine.

---

## 3. GLOBAL Rules (บังคับทุก module — ปอนด์สั่ง 2026-07-29)

| # | กติกา | รายละเอียด |
|---|---|---|
| **G1 Pagination** | list/history ทุกอัน **20 แถว/หน้า + pagination** | ทุก list + drill dashboard + ledger + audit + noti "ดูทั้งหมด" · **★ role's user list + user list ใน Settings** |
| **G2 Date-range search** | ค้น **เลขเอกสาร** หรือ **ช่วงวันที่สร้าง** | quotation/PO/SO/GR/PR/invoice/shipping list + production queue + audit · **★ quotation = ช่วงวันที่สร้าง (created-date) แกนเดียว** (★ ถอดแกน sent-date แล้ว — revert 2026-07-29) |
| **G3 Drill + back คงสถานะ** | กลับ **ไม่เสีย state เดิม** | dashboard drill · customer detail จาก order = modal |
| **G4 Customer search dropdown** | quotation/po/so-create | ค้นเบอร์/บริษัท/ผู้ติดต่อ · แสดงสถานะ+credit term · modal detail · **★ Disabled/Blacklist เลือกไม่ได้ (hard block, customer.md §4.2)** |
| **G5 Permission-per-action** | ทุกปุ่มระบุ capability | `permission-matrix.md` |
| **★ G6 Comment + change-history** | ทุก object ธุรกรรมมี **ช่องหมายเหตุเดียว แก้ในที่ (overwrite) + เก็บประวัติการแก้ครบ (ใคร/เมื่อ/เดิม→ใหม่) ดู inline + โผล่ trace** | **12 object:** QT/PO/SO/PRD/Batch/DN/Shipment/Invoice/GR/PR + Return + QC record · กติกากลาง = **`comment-convention.md` (CC1–CC7)** |
| **★ G7 Search-in-dropdown (RM/FG/Lot/component)** | เลือก RM/Lot/FG ในหน้า stock + **RM component ใน BOM** + **RM ใน supplier price-matrix** | **RM & FG ค้นได้ทั้งชื่อและรหัส** · **Lot ค้นผ่าน dropdown** (stock.md §10) · **★ BOM component RM (bom.md §3) + Supplier price-matrix RM (supplier.md §3) ก็ค้นชื่อ+รหัส** |

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
| **★★ BOM — code lock + ราคาซื้อแก้มือ + Active/Inactive + audit** | **รหัส BOM/FG = ผู้ใช้ตั้งตอนสร้าง + unique + create-only-lock (D11 v2, RM ก็ด้วย)** · **RM component search dropdown** · **ราคาซื้อแก้มือได้ ทั้งมี/ไม่มี supplier** · **Active/Inactive → Inactive บล็อก QT/PO/SO + กันออก Supply Planning** · audit ทุกการเปลี่ยน | `bom.md` · `stock.md` §3b · `deletion-policy.md` §2.4 · `quotation.md`/`po.md`/`so.md` · `supply-planning.md` · `traceability.md` · `non-functional.md` |
| **★★ Settings — role disable/soft-delete · user password/Google · Admin-only** | **(Role)** ค้นหา + filter Active/Disabled/Deleted · role's user list + ถอด user · **Disable (reversible) + Soft-delete (recoverable)** — member เสีย permission · **★ ไม่ต้องย้าย user ก่อน (supersede)** · **(User)** ค้นหาชื่อ-สกุล/username · **password mode (first-login-change/permanent)** + confirm-twice + show/hide · edit ไม่โชว์รหัสเดิม · **Google link → login basic/Google** · **(Admin-only)** VAT/Company/Audit = Admin bit · audit ทุกการเปลี่ยน | `settings.md` §4b/§5/§6 · `platform.md` §2/§4 · `deletion-policy.md` §2.14 · `permission-matrix.md` §3 · `non-functional.md` A6/A7/A8/AU1 |

**หมายเหตุ:** Quotation ทำ material check (ทั้ง create + edit) แต่ **ไม่ auto-open PR**.

---

## 5. ★ Source-of-Truth Statement (ประกาศชัด)

1. **`modules/*.md` = AUTHORITATIVE spec ปัจจุบันของทุก module + NFR + Deletion Policy + Traceability** — ชุดเดียวที่ BA/QA/TL ยึด.
2. แต่ละ .md เป็น **spec เต็ม**. `non-functional.md` = NFR authoritative · `deletion-policy.md` = deletion authoritative · `traceability.md` = trace/audit governance · **`comment-convention.md` = comment+change-history convention authoritative**.
3. **เอกสารเก่า** (functional-spec module pages + cross-cutting + root `deletion-policy.md` + **rbac-deletion.html**) = **historical reference** → Hub ⑥ Archive (collapsed). **★ กฎเดิม rbac-deletion "ลบ role บล็อกจนย้าย user ออกหมด" = superseded โดย settings.md §4b + deletion-policy §2.14 (role disable/soft-delete, member เสีย permission โดยกลไก).**
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
| **`brief.md` §5/§8 · ADR-000..009 · `scheduled-jobs.html` (J1–J7) · entity-status-map §1.6 · stock-reservation** | **non-functional.md** (J8 เพิ่มใหม่ · ★ A6/A7/A8 auth) | NFR รวม+อัปเดต |
| **root `deletion-policy.md` · `rbac-deletion.html`** | **deletion-policy.md** (folded · ★ §2.14 role) + **settings.md** (★ §4b) / **permission-matrix.md** | fold + entity ใหม่ (+ ★ BOM inactivate + ★ Role disable/soft-delete · **supersede "block until users moved"**) |
| `functional-spec/traceability.html` (US-TRC) | **traceability.md** — Hub ② Non-Functional | classification เปลี่ยน (ปอนด์เคาะ) |

> **Archive (Hub ⑥):** functional-spec module pages (16), `rbac-deletion.html`, root `docs/deletion-policy.html`, `docs/po-reviews.html` — collapsed, superseded.

---

## 7. Changelog — supersede / แก้ / ปอนด์เคาะ

| เอกสาร/รายการ | สถานะ | เหตุผล |
|---|---|---|
| functional-spec module pages (16) + root deletion-policy + rbac-deletion | **superseded (Archive)** | absorbed/folded → module package |
| NFR ใน brief/ADR/scheduled-jobs | **consolidated** | → `non-functional.md` |
| **★ Traceability classification** | **DECIDED 2026-07-29** | Hub placement → ② Non-Functional |
| **★ Reference section** | **DECIDED 2026-07-29** | ดึง reference band → หมวด ③ Reference |
| **★ Supply Planning proactive alerting** | **DECIDED 2026-07-29** | real-time (FG→Low) + J8 daily digest. **ปิด parked question** |
| **★ Quotation cancellation / review / REVERT Sent** | **DECIDED 2026-07-29 · settled** | ยกเลิกได้ทุกสถานะ · loose ref · Convert→Confirmed reseat · material check บน edit · activity-log · **ถอด Sent + sent-date** |
| **★ Customer — financial summary / follow-up flag / hard block** | **DECIDED 2026-07-29 · settled** | financial summary + follow-up flag แยก (6→5) + hard block Disabled/Blacklist |
| **★ Comment field convention (12 object) + Customer Edit = all fields** | **DECIDED 2026-07-29 · settled** | ช่อง comment + change-history · edit ลูกค้า = ครบทุกฟิลด์ |
| **★ Stock module 4 review** | **DECIDED 2026-07-29 · settled** | RM code user+unique · Loss/Adjust · "บันทึก (คงคลัง)" · search dropdown · BOM=FG shared · audit |
| **★★ Supplier module review** | **DECIDED 2026-07-29 · settled (no open Q)** | price-matrix search dropdown (G7) · audit + trace · max-active = default |
| **★★ BOM module review — code lock (D11 v2) + ราคาซื้อแก้มือ + Active/Inactive + audit** | **DECIDED 2026-07-29 · settled (no open Q)** | รหัส create-only-lock (RM ก็ด้วย) · RM component search · ราคาซื้อแก้มือ ไม่บล็อก · Active/Inactive บล็อก sales · audit |
| **★★ Settings module review — role disable/soft-delete · user password/Google · Admin-only VAT/Company/Audit** | **DECIDED 2026-07-29 (Settings review, ปอนด์) · settled (no open Q)** | **(1)** **Role:** ค้นหา + filter **Active/Disabled/Deleted** · role's user list + **ถอด user ออกจาก role** · **Disable (พักชั่วคราว, reversible)** + **Soft-delete (recoverable)** — ทั้งสองแบบ **สมาชิกเสีย permission ของ role นั้น** · **★ SUPERSEDE กฎเดิม "ลบ role บล็อกจนย้าย user ออกหมด"** → ทำได้ทันทีแม้มีสมาชิก (member เสีย permission โดยกลไก; ถอด user ราย ๆ = optional; membership คงอยู่เพื่อ restore). **(2)** **User:** ค้นหาชื่อ-สกุล/username · **password mode (must-change-first-login / permanent)** + กรอก 2 ครั้ง + show/hide · **edit ไม่โชว์รหัสเดิม** (write-only). **(3)** **Google account link** ราย user (1:1) → **login เลือก basic auth / Google** (reconcile platform.md local+Google + session). **(4)** **★ VAT / ข้อมูลบริษัท / Audit-log = Admin bit เท่านั้น** (VAT/Company เดิม U→Admin; Audit เดิม R→Admin). **(5)** **audit + trace ทุกการเปลี่ยน Settings** (role/user/password/Google-link/VAT/company; รหัสผ่านเก็บ event ไม่เก็บค่า). อัปเดต `settings.md` (rewrite §2/§3/§4b/§5/§6/§7/§8/§9) · `platform.md` §2/§4/§5/§7/§9 · `non-functional.md` A1/A3/A4/A6/A7/A8/AU1/AU2/§10 · `deletion-policy.md` §2.14/Role row/matrix · `permission-matrix.md` §3/§4 · README |
| `scope-…` D8/credit · U4 · stock-reservation Q1 | คงตามรอบก่อน | D8 v2 · credit 60 · Option A |

---

## 8. งานส่งต่อ UX/UI (สรุป)

**punch-list เดิม + delta รอบก่อน:** customer · quotation · po/so · stock/GR/return · bom · production · supply-planning · dashboard/home/platform · qc/shipping/invoice/traceability/settings · pagination/search + customer dropdown component. (ดูรายละเอียดรอบก่อนใน commit history — คงไว้)

> **★ Comment control (12 object)**, **★ Customer Edit = all fields**, **★ Quotation REVERT Sent**, **★ Stock**, **★★ Supplier/BOM review** — คงตามรอบก่อน (ดู commit history).

> **★★ Settings module review — UI ที่ UX/UI ต้องเพิ่ม/แก้ (2026-07-29 · `settings.html` + `login.html`):**
> - **(SET-1) Role tab — ค้นหา + filter สถานะ:** ช่องค้นหา role (ตามชื่อ) + **filter Active / Disabled / Deleted** (3-state) + **badge สถานะ** บนแต่ละ role ("ใช้งาน" / "ปิดใช้งาน" / "ถูกลบ").
> - **(SET-2) Role's user list + remove-user:** เปิด role → panel **รายชื่อผู้ใช้ใน role นี้** (list 20/หน้า) + ปุ่ม **"ถอดออกจาก role"** ราย user (confirm).
> - **(SET-3) Disable / Soft-delete / Restore role:** ปุ่ม **"ปิดใช้งาน" (Disable, reversible)** + **"ลบ" (Soft-delete, บังคับเหตุผล)** + **"เปิดใช้งาน"/"กู้คืน" (Enable/Restore)** — **ไม่มี block "ต้องย้าย user ออกก่อน" อีกต่อไป** (ถอด affordance/error เดิม); แสดง hint "สมาชิกจะเสียสิทธิ์ของ role นี้".
> - **(SET-4) User tab — ค้นหา:** ช่องค้นหาผู้ใช้ตาม **ชื่อ-สกุล หรือ username**.
> - **(SET-5) Password control:** **radio โหมด** — "ต้องเปลี่ยนเมื่อเข้าครั้งแรก" / "ตั้งแบบถาวร" · **กรอกรหัส 2 ช่อง (ยืนยัน)** + **ปุ่มดู/ซ่อนรหัส (show/hide toggle)** ทั้งสองช่อง · inline error "รหัสผ่านยืนยันไม่ตรงกัน".
> - **(SET-6) Edit-user password hidden:** หน้าแก้ไขผู้ใช้ **ไม่แสดงรหัสเดิม** (ช่องว่าง/masked) — กรอกใหม่เท่านั้น (2 ช่อง + toggle); เว้นว่าง = ไม่เปลี่ยนรหัส.
> - **(SET-7) Google account link control:** ปุ่ม/section **"ผูก Google account"** ต่อ user (กรอก/เลือกอีเมล Google) + สถานะ "ผูกแล้ว/ยังไม่ผูก" + ปุ่มยกเลิกผูก.
> - **(SET-8) Login screen — basic vs Google choice:** `login.html` แสดง **ทั้งฟอร์ม username+password และปุ่ม "เข้าสู่ระบบด้วย Google"** ให้ผู้ใช้เลือก · **หน้า/โมดัล "ตั้งรหัสใหม่" สำหรับ first-login** (โหมด must-change) — 2 ช่อง + show/hide.
> - **(SET-9) Admin-only gating (VAT/Company/Audit):** แท็บ **Config VAT · ข้อมูลบริษัท · Audit log** แสดง/แก้ได้ **เฉพาะผู้มี Admin bit** — ผู้ไม่มี Admin ไม่เห็นแท็บ/เข้าตรง URL = 403.
> ยึด `settings.md` §2/§4b/§5/§6 · `platform.md` §2/§4 · `permission-matrix.md` §3.
> **หมายเหตุ collision:** รอบนี้ PO แก้ **requirement docs เท่านั้น** — UX/UI ที่กำลังแก้ supplier/bom mockups ทำงานคู่ขนานได้ (คนละไฟล์). Settings/Login mockup ยังไม่ถูกแตะ — เป็นงานที่ส่งต่อ (SET-1..9).

---

## 9. Open questions
**ไม่มี open question ค้าง — ปิดครบทั้งหมด (2026-07-29).**

**คำถามที่ปิดแล้ว (2026-07-29):** Supply Planning proactive alert · Quotation abandon/review/REVERT Sent · Traceability/Reference · Customer financial summary / follow-up enum / hard block · Comment convention (12 objects) · Customer Edit = all fields · **Stock module 4** · **★★ Supplier module review** · **★★ BOM module review** · **★★ Settings module review (role disable/soft-delete + supersede "move users first" · user password modes/Google-link · Admin-only VAT/Company/Audit · audit ทุกการเปลี่ยน) → DECIDED (settled, no open Q)**.

> **การตัดสินสมเหตุผลของ PO (ไม่ถือเป็น open question):**
> - **BOM Inactive → FG กันออกจาก Supply Planning** — สอดคล้อง block SO ผลิตเก็บสต็อก (`supply-planning.md` §4, `bom.md` §5c).
> - **★ Role soft-delete/Disable ไม่ต้องย้าย user ออกก่อน (supersede กฎเดิม "block until users moved")** — เหตุผล: ปอนด์ระบุชัดว่า **soft-delete/disable strip permission จากสมาชิกโดยกลไก** + role retained/recoverable; กฎ block เดิมมีไว้กัน permission กำพร้า ซึ่งกลไกใหม่จัดการให้แล้ว → block กลายเป็นไม่จำเป็น. membership คงอยู่เพื่อ restore; ถอด user ราย ๆ = action ทางเลือก. ถ้าปอนด์ยังต้องการบังคับย้าย user ก่อนลบ role — แจ้งปรับได้ แต่ default ปัจจุบัน = ไม่บังคับ.
> - **★ VAT/Company/Audit "viewing" = Admin** — ตีความ "require Admin only" ครอบทั้ง **ดูและแก้** ทั้งสามแท็บ (ข้อมูลไวต่อความปลอดภัย/การเงิน). ถ้าปอนด์ต้องการให้ "ดู" VAT/Company ได้ด้วย Read (แต่แก้ต้อง Admin) — แจ้งปรับได้.

> **สรุปสถานะ:** ทุกรายการ **settled → READY_FOR_UX_UI**. รอบนี้ = Settings (role search/filter/user-list/remove-user/disable+soft-delete · user search/password-modes/Google-link · Admin-only VAT/Company/Audit · audit ทุกการเปลี่ยน) + login basic-vs-Google choice + first-login change.
