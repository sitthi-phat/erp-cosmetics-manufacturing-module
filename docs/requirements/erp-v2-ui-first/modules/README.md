# Requirement Package (Per-Module) — ESSENCE Hub System

slug: `erp-v2-ui-first` · เขียนโดย PO · 2026-07-29 · **CANONICAL & COMPLETE SINGLE SOURCE OF TRUTH** สำหรับ BA / QA / Tech-Lead
สถานะ: consolidation ของ requirement ที่กระจัดกระจาย → per-module ที่โครงสร้างสม่ำเสมอ **ครบทุก module + NFR + Deletion Policy** (existing-good absorb + delta ใหม่) · reconciled กับ D1–D18 + fold คำสั่งใหม่ของปอนด์ (2026-07-29)

## สรุปภาษาไทย
เอกสารชุดนี้คือ **แหล่งความจริงล่าสุดแบบราย module ที่ครบถ้วน (single source of truth)** ของทั้งระบบ ESSENCE Hub — ทุก module มี .md ที่เป็น **spec ปัจจุบันเต็ม**. Document Hub จัดเป็น **① Functional** (จัดตามแถบเมนูแอป) · **② Non-Functional** (`non-functional.md` + `deletion-policy.md` + **`traceability.md` = พื้นผิว trace/audit governance**) · **③ Reference** (เอกสารหลักการที่ยังใช้ได้) · ④ Architecture · ⑤ Mockups · **⑥ Archive (หน้าเก่า superseded, collapsed)**. **★ ปอนด์เคาะ 4 ข้อ (2026-07-29):** traceability → Non-Functional · Reference เป็นหมวดของตัวเอง · Supply Planning แจ้งเตือน Low เชิงรุก · Quotation ยกเลิกได้ทุกสถานะ. **★ Customer/Quotation/PO/Stock/Supplier/BOM/Settings module reviews (2026-07-29 — settled).** **★★ Production (การผลิต / คิวงานผลิต) module review (2026-07-29 — settled, no open Q).** **★★ Supply Planning module review (2026-07-29 — settled, no open Q):** ปรับหน้าจากการ์ดต่อ FG → **รายการ (list) FG** (ชื่อ/รหัส/สถานะ + **why-calc inline** + **ขยายแถวดู RM breakdown + สต็อกคงเหลือต่อ RM** + คลิก→**modal**) · **ค้น FG 3 แกน: ชื่อ · รหัส · วัตถุดิบ (RM reverse lookup)** + filter Low/OK/Overstock (คงไว้) · **modal: "สั่งผลิต" ระบุจำนวน batch เอง** (qty = batch count × Batch Size) + **จำลอง cost/revenue/margin** (cost = ต้นทุนรวม BOM × qty · **revenue = ราคาขาย FG `bom.md` §3 × qty** · margin = revenue − cost, ก่อน VAT, decision-support ไม่ใช่ COGS) + **แก้ param = simulate (ไม่บันทึก) vs "บันทึกกลับ BOM master" (persist + audited)**. **★ sell-price question = SETTLED** (revenue = ฟิลด์ "ราคาขาย" mandatory ใน `bom.md` §3, ก่อน VAT — ไม่ประดิษฐ์แหล่งราคาใหม่, ไม่มี open question). อัปเดต `supply-planning.md` (primary, DONE) · `bom.md` §3/§4/§8 · `so.md` §3/§6 · `traceability.md` §3/§4 · `non-functional.md` AU1/AU4/D-F3 · README §4/§7/§8/§9. **★ Stock delta (Production review):** **Adjust (ปรับยอด +) ตอนนี้ต้องอ้าง Lot — เลือก lot ที่มี stock หรือเลือก "FIFO"** (เดิม RM-only). **★ Sale delete → customers unassigned (ปอนด์ 2026-07-29, resolve US-SET-02):** ลบ Sale → ลูกค้าที่ดูแลกลายเป็น "ไม่มีผู้ดูแล (Sale ว่าง)" อัตโนมัติ, **ไม่บังคับ bulk-reassign, หน้า bulk-reassign = ยกเลิก**; reassign ภายหลังด้วยมือ.

---

## 1. โครงไฟล์ (file tree — ครบทั้งชุด)

```
docs/requirements/erp-v2-ui-first/modules/
  README.md                  ← ไฟล์นี้ (index + D-rule spine + changelog + source-of-truth + old→new map + global rules)
  permission-matrix.md       ← capability → module → action/button (รวมทุก module, +3 module ใหม่, ★ Settings Admin-gate, ★ delete-Sale→unassign)
  comment-convention.md      ← ★ กติกากลาง comment + change-history (CC1–CC7) · object list 12 ตัว · อ้างโดยทุก module ธุรกรรม

  # System-wide / Governance (Non-Functional bucket ใน Hub)
  non-functional.md          ← NFR รวม: perf/auth-session/audit (★ +production action/PO edit/★ BOM save-back-param audit)/backup-infra/data-format/jobs J1–J8/noti/search/responsive/soft-delete/reliability
  deletion-policy.md         ← soft-delete/void baseline + entity เดิม + entity ใหม่ (★ +§2.15 Sale delete→customers unassigned)
  traceability.md            ← trace/audit governance ข้าม module · ★ +production action/actual-qty/PO edit/lot-consume/adjust-Lot-FIFO/★ BOM save-back-param audited

  # Platform & Navigation (Functional · ระบบ)
  platform.md                ← login basic-vs-Google · session · notification · global search · responsive
  home.md · dashboard.md

  # Sales & Customer (Functional · งานขาย/Order)
  customer.md                ← financial summary · follow-up flag (★ +raise จาก PO edit) · hard block Disabled/Blacklist · Edit = all fields · ★ assigned Sale nullable + auto-clear on Sale delete
  quotation.md · po.md (★ +§5.2 edit-PO→follow-up+audit) · so.md (★ +prefill สั่งผลิต พก batch count)

  # Supply Planning & Production (Functional · ผลิต&คุณภาพ)
  bom.md · supply-planning.md ← ★ list+expand+modal · FG search ชื่อ/รหัส/RM · สั่งผลิต batch-count + cost/revenue/margin sim · simulate vs save-back BOM
  production.md              ← ★ คิวผลิต 2 แท็บ + management page (actual≥ordered, surplus, lot-FIFO, QC-gate พร้อมส่ง, loss, ไปหน้า QC, confirm popups, edit-PO→follow-up) · comment (PRD+Batch)
  qc.md                      ← ตรวจ Batch/Lot · ★ +QC-gate "พร้อมส่ง" + deep-link "ไปหน้า QC" (ตรวจแบตช์) · comment

  # Inventory & Procurement (Functional · คลัง&จัดซื้อ)
  stock.md (★ Adjust อ้าง Lot/FIFO + Loss/Adjust 2 actions + add-RM lock + search dropdown) · goods-receipt.md · pr.md · supplier.md · return.md

  # Fulfilment & Finance (Functional · จัดส่ง&การเงิน)
  shipping.md · invoice.md

  # System (Functional · ระบบ)
  settings.md                ← ★ role disable/soft-delete · user password/Google · Admin-only VAT/Company/Audit · ★ delete-Sale→customers unassigned (US-SET-02 simplified, ไม่ bulk-reassign)

  flows/
    oem-flow.md · ownbrand-flow.md
```

HTML review view: `docs/design/erp-v2-ui-first/functional-spec/modules/index.html` · Hub `functional-spec/index.html` จัด ① Functional / ② Non-Functional / ③ Reference / ④ Architecture / ⑤ Mockups / ⑥ Archive.

---

## 2. D-Rule Spine (ยังคงเป็นแกน — พร้อม DELTA ที่ปอนด์แก้ 2026-07-29)

D1–D18 ยังเป็นกฎแกน (ดูฉบับเต็ม `scope-oem-ownbrand-supply-planning.md` §1). **จุดที่อัปเดต:**

### 2.1 ★ D8 v2 — ปุ่ม "สั่งผลิต" ใน Supply Planning
กด "สั่งผลิต" → **พาไปหน้า SO produce-to-stock (ไม่เลือกลูกค้า) แบบ PRE-FILL** → เข้าสาย production. **★ (Supply Planning review 2026-07-29) ผู้ใช้ระบุ "จำนวน batch (batch count)" เองใน modal → prefill จำนวน = batch count × Batch Size** (เดิม prefill = Suggested คงที่). ดู `supply-planning.md` §5/§5b, `so.md` §6.

### 2.2 ★ Credit Term — ระดับลูกค้า 30/60/90 · DEFAULT 60
per-invoice override ยังทำได้. ดู `customer.md`/`invoice.md`.

### 2.3 ★ D18 reseat — QT "ตกลง (Agreed)" → "ยืนยัน (Confirmed)" · REVERTED Sent
การกด "Convert to PO" = ยืนยันว่าลูกค้าตกลง → QT = "ยืนยัน (Confirmed)" ทันที · **REVERTED: ถอด "ส่งแล้ว (Sent)" + sent-date**. authoritative = `quotation.md` · entity-status-map §1.1b.

### 2.4 ★★ D11 v2 — รหัส BOM/FG + RM = ผู้ใช้ตั้งเองตอนสร้าง + ล็อก
1 BOM = 1 FG (1:1, shared) · รหัส user-entered on create + unique + **create-only-lock** · **RM ก็ด้วย**. authoritative = `bom.md` §5 · `stock.md` §3b.

### 2.5 ★★ D13 reinforce — Production review (2026-07-29)
**"พร้อมส่ง (Ready to Ship)" = action ที่ฝ่ายผลิตกด (ไม่ auto), QC-gated** → capture surplus (actual − ordered → FG) · **ทุก PRD พร้อมส่ง → PO/SO พร้อมส่ง** · **actual ≥ ordered เสมอ** (under-production = แก้ PO ลง → follow-up + audit) · **consume/loss/adjust lot = เลือก lot มี stock; หลาย lot = FIFO**. authoritative = `production.md` · `po.md` §5.2 · `stock.md` §5.1 · entity-status-map §1.4 (r9).

### 2.6 ★★ D9/D10 clarify — Supply Planning margin simulation (2026-07-29)
Supply Planning modal จำลอง **cost/revenue/margin** ตอน "สั่งผลิต": **cost = ต้นทุนรวม/หน่วย (BOM §4, D9) × qty · revenue = ราคาขาย FG (BOM §3, mandatory) × qty · margin = revenue − cost** — **ค่าก่อน VAT, decision-support ตอนวางแผน ไม่ใช่ COGS**; **D10 cost snapshot คงเดิม (snapshot-only, เกิดตอนขายจริง)**. authoritative = `supply-planning.md` §5b/§6.2b · `bom.md` §3/§4.

> D1–D7, D12, D14–D17 **ไม่เปลี่ยน**. D8 → D8 v2 (batch count). D9/D10 = clarify (margin sim uses live cost/sell-price, snapshot คงเดิม). D11 → D11 v2. D13 = reinforce. D18 = reseat.

---

## 3. GLOBAL Rules (บังคับทุก module — ปอนด์สั่ง 2026-07-29)

| # | กติกา | รายละเอียด |
|---|---|---|
| **G1 Pagination** | list/history ทุกอัน **20 แถว/หน้า + pagination** | ทุก list + drill dashboard + ledger + audit + **★ คิวผลิต 2 แท็บ** + **★ Supply Planning FG list** |
| **G2 Date-range search** | ค้น **เลขเอกสาร** หรือ **ช่วงวันที่** | quotation/PO/SO/GR/PR/invoice/shipping list + **★ production queue (created-date + ★ required-delivery-date range)** + audit |
| **G3 Drill + back คงสถานะ** | กลับ **ไม่เสีย state เดิม** | dashboard drill · **★ PO/SO detail modal จากคิวผลิต** · **★ Supply Planning FG modal (ปิดแล้วกลับ list ไม่เสีย state)** |
| **G4 Customer search dropdown** | quotation/po/so-create | ค้นเบอร์/บริษัท/ผู้ติดต่อ · **★ Disabled/Blacklist เลือกไม่ได้ (hard block)** |
| **G5 Permission-per-action** | ทุกปุ่มระบุ capability | `permission-matrix.md` |
| **★ G6 Comment + change-history** | ทุก object ธุรกรรมมี **ช่องหมายเหตุเดียว แก้ในที่ + เก็บประวัติครบ** | **12 object** · กติกากลาง = **`comment-convention.md` (CC1–CC7)** |
| **★ G7 Search-in-dropdown (RM/FG/Lot/component)** | RM/Lot/FG ในหน้า stock + BOM component + supplier price-matrix | **RM & FG ค้นชื่อ+รหัส** · **Lot ค้น dropdown (Loss+Adjust+option "FIFO")** |

> NFR ระดับระบบ (perf/auth/audit/format/jobs) รวมที่ `non-functional.md`.

---

## 4. Confirmations ที่ปอนด์สั่งให้ยืนยัน (RESOLVED)

| หัวข้อ | คำตัดสิน | เอกสาร |
|---|---|---|
| **Convert-to-PO** | กด "Convert to PO" → popup → QT = **Confirmed ทันที (immutable)** + loose link → เลือก prefill ตอนนี้/ทีหลัง | `quotation.md` §6 · `po.md` §5 · oem-flow |
| **SO (ก) ขายจากสต็อก** | จอง FG → พร้อมส่ง → ตัด FG FIFO ตอน dispatch → DN/Invoice | `so.md` · `shipping.md` |
| **SO (ข) ผลิตเก็บสต็อก** | BOM check → production; RM ขาด auto-PR; QC ผ่าน → FG เข้าคลัง | `so.md` |
| **★ Comment convention** | **12 object** ธุรกรรม มีช่อง comment เดียว แก้ในที่ + เก็บประวัติครบ + โผล่ trace | `comment-convention.md` |
| **★ Customer Edit = all fields** | หน้า edit แก้ได้ครบทุกฟิลด์เท่ากับ create (financial summary read-only) | `customer.md` §2b |
| **★ Customer Follow-up = flag แยก (ถอดจาก enum)** | 5 สถานะ + flag ⚑ แยก · **★ raise เพิ่มเมื่อ PO ถูกแก้ (Production review)** | `customer.md` §4/§12 · `entity-status-map.md` §1.1 |
| **★ Delete Sale → customers unassigned (blank)** | ลบ Sale → assigned-Sale ของลูกค้าที่ดูแล = **ว่าง (unassigned) อัตโนมัติ** · **ไม่บังคับ bulk-reassign, ไม่มีหน้า bulk-reassign** (supersede กฎเดิม) · Sale ว่าง = valid state (ไม่บล็อกงานขาย) · reassign ภายหลังด้วยมือ (Customer.Approve) · audit-logged | `settings.md` §4c/§5 US-SET-02 · `customer.md` §4.3 · `deletion-policy.md` §2.15 · `permission-matrix.md` §3 |
| **★ Stock — RM code / Loss-Adjust / BOM=FG** | RM code = ผู้ใช้ตั้ง+UNIQUE+ล็อก · Loss(−)/Adjust(+) 2 action · **★ Adjust อ้าง Lot/FIFO** · "บันทึก (คงคลัง)" · search dropdown · audit ทุก movement | `stock.md` · `bom.md` · `traceability.md` · `non-functional.md` |
| **★★ Supplier — RM search dropdown + audit** | price-matrix search dropdown (G7) · create/edit/active↔inactive/price-matrix = audit + trace | `supplier.md` §3/§5/§10 |
| **★★ BOM — code lock + ราคาซื้อแก้มือ + Active/Inactive + audit** | รหัส BOM/FG user-entered + unique + create-only-lock (D11 v2, RM ก็ด้วย) · ราคาซื้อแก้มือ · Inactive บล็อก QT/PO/SO + กันออก Supply Planning · audit · **★ ราคาขาย = revenue source · ต้นทุนรวม = cost source ของ Supply Planning margin sim** | `bom.md` · `stock.md` §3b · `deletion-policy.md` §2.4 · `quotation.md`/`po.md`/`so.md` · `supply-planning.md` |
| **★★ Settings — role disable/soft-delete · user password/Google · Admin-only · ★ delete-Sale→unassign** | Role search/filter/user-list/remove-user/disable+soft-delete (ไม่ต้องย้าย user ก่อน) · user password mode/Google link · VAT/Company/Audit = Admin bit · **★ ลบ Sale → ลูกค้า unassigned (ไม่ bulk-reassign)** · audit ทุกการเปลี่ยน | `settings.md` §4b/§4c/§5/§6 · `platform.md` §2/§4 · `deletion-policy.md` §2.14/§2.15 · `customer.md` §4.3 · `permission-matrix.md` §3 · `non-functional.md` A6/A7/A8/AU1 |
| **★★ Production — คิว 2 แท็บ / 1PO-หลาย PRD / actual≥ordered / QC-gate พร้อมส่ง / lot-FIFO / loss / ไปหน้า QC / edit-PO→follow-up** | **① รอรับงาน** (search PO/SO/ลูกค้า/ผู้ติดต่อ/ช่วงวันที่สร้าง/ช่วงวันที่ต้องการรับของ · filter PO/SO · **default "พร้อมรับงาน"** · PO/SO modal+ลิงก์) · **② คิวรับแล้ว** (search + PRD · default+ordering กำหนด · **group PO/SO → PRD ซ้อนใต้ = 1 line=1 PRD CONFIRMED**) · **หน้าจัดการ:** actual≥ordered (under-prod=แก้ PO ลง→follow-up+audit) · surplus→FG @ พร้อมส่ง (D13) · **"✓ พร้อมส่ง" QC-gated + popup "QC ต้องผ่านก่อน"** → roll-up PO/SO · **lot มี stock+FIFO** · **ปุ่ม Loss + confirm popup** · **"ไปหน้า QC" เฉพาะสถานะ QC → deep-link ตรง Batch (ตรวจแบตช์)** · **confirm popup ทุก status change** · **edit-PO→follow-up+audit** | `production.md` (primary) · `stock.md` §5.1/§6 (Adjust Lot/FIFO) · `po.md` §5.2 · `customer.md` §4.1 · `qc.md` §4b/§9 · `traceability.md` §3/§4 · `non-functional.md` AU1/AU3 · `entity-status-map.md` r9 |
| **★★ Supply Planning — list+expand+modal / FG search ชื่อ-รหัส-RM / สั่งผลิต batch-count + cost-revenue-margin / simulate vs save-back** | **จากการ์ด → รายการ (list) FG** (ชื่อ/รหัส/สถานะ + **why-calc inline** + **ขยายแถว → RM breakdown + สต็อกคงเหลือต่อ RM** + คลิก→**modal**) · **ค้น 3 แกน: ชื่อ FG · รหัส FG · วัตถุดิบ (RM reverse lookup)** + filter Low/OK/Overstock (คงไว้) · **modal: "สั่งผลิต" ระบุจำนวน batch เอง** (qty = batch count × Batch Size → prefill SO produce-to-stock, D8 v2) + **จำลอง cost/revenue/margin live** (cost = ต้นทุนรวม BOM × qty · **revenue = ราคาขาย FG `bom.md` §3 × qty** · margin = revenue − cost + %, **ก่อน VAT, decision-support ไม่ใช่ COGS, D10 snapshot คงเดิม**) · **แก้ param = simulate (ไม่ persist, ทิ้งเมื่อปิด) vs "บันทึกกลับ BOM master" (persist + audited)** · FG Inactive กันออก · proactive Low alert (J8 + real-time) คงไว้. **★ sell-price = SETTLED (revenue = ราคาขาย `bom.md` §3, ก่อน VAT — no open Q)** | `supply-planning.md` (primary, DONE) · `bom.md` §3/§4/§8 · `so.md` §3/§6 · `traceability.md` §3/§4 · `non-functional.md` AU1/AU4/D-F3 |

**หมายเหตุ:** Quotation ทำ material check (create + edit) แต่ **ไม่ auto-open PR**.

---

## 5. ★ Source-of-Truth Statement (ประกาศชัด)

1. **`modules/*.md` = AUTHORITATIVE spec ปัจจุบันของทุก module + NFR + Deletion Policy + Traceability** — ชุดเดียวที่ BA/QA/TL ยึด.
2. แต่ละ .md เป็น **spec เต็ม**. `non-functional.md` = NFR authoritative · `deletion-policy.md` = deletion authoritative · `traceability.md` = trace/audit governance · **`comment-convention.md` = comment convention authoritative**.
3. **เอกสารเก่า** = **historical reference** → Hub ⑥ Archive (collapsed).
4. **เอกสารหลักการเชิงลึก** (`entity-status-map`, `status-journeys`, `stock-reservation`, `scope` D1–D18, `mock-data-spec`, ADRs, `scheduled-jobs`, `rtm`, `glossary`, `list-conventions`) = **authoritative reference** → Hub ③ Reference. **★ entity-status-map §1.1=customer · §1.1b=QT · §1.1c=BOM · §1.4/§1.6 (r9)=Production/Stock — sync กับ module spec.** **เมื่อถ้อยคำ D-rule ที่ล็อก (scope) ต่างจาก module spec → module package wins.**
5. **RTM/Traceability คงครบ.**
6. **Navigation IA (Document Hub):** ① Functional · ② Non-Functional · ③ Reference · ④ Architecture · ⑤ Mockups · ⑥ 🗄 Archive.

---

## 6. ★ Map: เอกสารเก่า → ครอบคลุมโดย module ใด

| เอกสารเก่า | ครอบคลุมโดย module (authoritative) | หมายเหตุ |
|---|---|---|
| functional-spec BA pages (home/dashboard/platform/customer/po/production/qc/stock/pr/supplier/return/bom/shipping/invoice/traceability/settings) | โมดูลชื่อเดียวกันใน `modules/` (stock → stock+goods-receipt) | absorbed เต็ม · เก่าอยู่ ⑥ Archive |
| `list-conventions.html` (US-LST-01) | **G1–G3 (README §3)** + Pagination/Search ทุก module | มาตรฐาน list |
| `continuity.html` (cascade + noti matrix) | **platform.md** (noti) + cross-links | cascade reference |
| **`brief.md` · ADR-000..009 · `scheduled-jobs.html` · entity-status-map §1.6 · stock-reservation** | **non-functional.md** (J8 · A6/A7/A8) | NFR รวม+อัปเดต |
| **root `deletion-policy.md` · `rbac-deletion.html`** | **deletion-policy.md** + **settings.md** / **permission-matrix.md** | fold + entity ใหม่ · **★ Sale delete→unassign supersede rbac-deletion bulk-reassign rule** |
| `functional-spec/traceability.html` (US-TRC) | **traceability.md** — Hub ② Non-Functional | classification เปลี่ยน |

> **Archive (Hub ⑥):** functional-spec module pages (16), `rbac-deletion.html`, root `docs/deletion-policy.html`, `docs/po-reviews.html` — collapsed, superseded.

---

## 7. Changelog — supersede / แก้ / ปอนด์เคาะ

| เอกสาร/รายการ | สถานะ | เหตุผล |
|---|---|---|
| functional-spec module pages (16) + root deletion-policy + rbac-deletion | **superseded (Archive)** | absorbed/folded → module package |
| NFR ใน brief/ADR/scheduled-jobs | **consolidated** | → `non-functional.md` |
| **★ Traceability / Reference classification** | **DECIDED 2026-07-29** | Hub placement |
| **★ Supply Planning proactive alerting** | **DECIDED 2026-07-29** | real-time + J8 digest |
| **★ Quotation cancellation / review / REVERT Sent** | **DECIDED 2026-07-29 · settled** | ยกเลิกได้ทุกสถานะ · Convert→Confirmed · ถอด Sent |
| **★ Customer — financial summary / follow-up flag / hard block / Edit=all fields** | **DECIDED 2026-07-29 · settled** | 6→5 + flag แยก |
| **★ Comment convention (12 object)** | **DECIDED 2026-07-29 · settled** | ช่อง comment + change-history |
| **★ Stock module 4 review** | **DECIDED 2026-07-29 · settled** | RM code · Loss/Adjust · search dropdown · audit |
| **★★ Supplier module review** | **DECIDED 2026-07-29 · settled** | price-matrix search dropdown · audit |
| **★★ BOM module review** | **DECIDED 2026-07-29 · settled** | code lock · ราคาซื้อแก้มือ · Active/Inactive · audit |
| **★★ Settings module review** | **DECIDED 2026-07-29 · settled** | role disable/soft-delete · user password/Google · Admin-only |
| **★ Delete Sale → customers unassigned (blank) · US-SET-02 simplified** | **DECIDED 2026-07-29 (ปอนด์, resolve US-SET-02 flag) · settled** | ลบ Sale → assigned-Sale ของลูกค้าที่ดูแล = **ว่าง (unassigned) อัตโนมัติ**; **★ SUPERSEDE กฎเดิม "Sale delete → bulk-reassign required" + ถอดสเต็ป/หน้า bulk-reassign** (US-SET-02 simplified); Sale ว่าง = valid state (ไม่บล็อกงานขาย); reassign ภายหลังด้วยมือ (Customer.Approve); audit-logged. อัปเดต `deletion-policy.md` §1.8/§2.1-2.8/§2.15/§3/changelog · `settings.md` §2/§4c/§5 US-SET-02/§6/§7/§9/changelog · `customer.md` §3/§4.3/§others/changelog · `permission-matrix.md` §3/§4. **UX follow-up "delete-user bulk-reassign screen" = CANCELLED (ไม่ต้องทำ — แค่ยืนยัน "ลูกค้าจะไม่มีผู้ดูแล (Sale ว่าง)").** |
| **★★ Production (การผลิต / คิวงานผลิต) module review** | **DECIDED 2026-07-29 (Production review, ปอนด์) · settled (no open Q)** | **(1) คิว 2 แท็บ** — "รอรับงาน" (search PO/SO/ลูกค้า/ผู้ติดต่อ/ช่วงวันที่สร้าง/ช่วงวันที่ต้องการรับของ ทุกสถานะ · filter PO/SO · **default "พร้อมรับงาน"** · PO/SO **modal** + ลิงก์เต็ม) · "คิวงานที่รับแล้ว" (search + **PRD** · default รับงานแล้ว/Hold/กำลังผลิต/QC/พร้อมส่งมอบ · **ordering รับงานแล้ว→กำลังผลิต→QC→พร้อมส่งมอบ→Hold**). **(2) ★ 1 PO/SO : หลาย PRD = CONFIRMED** (1 line = 1 PRD, locked model) → คิว "รับแล้ว" **group PO/SO → PRD ซ้อนใต้**. **(3) หน้าจัดการ:** **actual qty ≥ ordered เสมอ** (under-production = **แก้ PO ให้จำนวนสั่ง = ผลิตจริงก่อน** → raise ⚑ follow-up + audit) · over-production → surplus→FG ตอน "พร้อมส่ง" (D13) · **"✓ พร้อมส่ง (ส่ง XX·เข้าคลัง XX)" QC-gated** (ไม่ผ่าน = disabled + popup "QC ต้องผ่านก่อน") → PRD Ready to Ship; **ทุก PRD พร้อมส่ง → PO/SO พร้อมส่ง** · **lot consume/loss เลือกเฉพาะ lot ที่มี stock; หลาย lot = FIFO** · **ปุ่ม Loss มีบนหน้า + confirm popup ทุกครั้ง** (เหตุผลบังคับ, D15) · **"ไปหน้า QC ›" เปิดเฉพาะสถานะ QC → deep-link ตรง Batch (qc แท็บ "ตรวจแบตช์")** · **confirm popup ทุก status change** · **edit-PO ในบริบทการผลิต → follow-up + audit**. **(4) ★ Stock delta:** **Adjust (ปรับยอด +) ต้องอ้าง Lot — เลือก lot มี stock หรือ "FIFO"** (เดิม RM-only). อัปเดต `production.md` (primary rewrite §2/§4/§5/§6/§7) · `stock.md` §5.1/§6/§9/§10 · `po.md` §5.2 · `customer.md` §4.1 · `qc.md` §4b/§9 · `traceability.md` §3/§4 · `non-functional.md` AU1/AU3 · `entity-status-map.md` r9 · README |
| **★★ Supply Planning module review** | **DECIDED 2026-07-29 (Supply Planning review, ปอนด์) · settled (no open Q)** | **(1) Layout: การ์ดต่อ FG → รายการ (list) FG** (ชื่อ/รหัส/สถานะ + **why-calc inline** [เห็นตัวเลข cover เทียบ Target/Safety ไม่ใช่แค่ badge] + **ขยายแถว → RM breakdown + สต็อกคงเหลือต่อ RM** + คลิก→**modal**) · คง 3 stat tiles บน list header. **(2) ★ ค้น FG 3 แกน: ชื่อ · รหัส · วัตถุดิบ (RM reverse lookup — หา FG ที่ BOM มี RM นั้น, ค้น RM ชื่อ/รหัส)** + filter Low/OK/Overstock (คงไว้). **(3) ★ คลิก FG → modal รายละเอียดเต็ม** (ตัวเลขวางแผน + RM breakdown + สั่งผลิต + margin sim + แก้ param). **(4) ★ "สั่งผลิต" ระบุจำนวน batch เอง** → qty = batch count × Batch Size → prefill SO produce-to-stock (D8 v2 พก batch count). **(5) ★ cost/revenue/margin simulation** — cost = ต้นทุนรวม BOM × qty (D9/D10) · **revenue = ราคาขาย FG (`bom.md` §3, mandatory) × qty** · margin = revenue − cost (+ %) — **ก่อน VAT, decision-support ไม่ใช่ COGS, D10 snapshot คงเดิม**. **(6) ★ แก้ param 2 โหมด: simulate (ไม่ persist, ทิ้งเมื่อปิด) vs "บันทึกกลับ BOM master" (persist + audited)**. **★ PO settled: revenue = "ราคาขาย" ที่มีอยู่แล้วใน `bom.md` §3 (ก่อน VAT) — ไม่ประดิษฐ์แหล่งราคาใหม่, no open Q.** อัปเดต `supply-planning.md` (primary, DONE) · `bom.md` §3/§4/§8/changelog · `so.md` §3/§6/§8/§10/changelog · `traceability.md` §3/§4/§5/§9/changelog · `non-functional.md` AU1/AU4/D-F3/D-F4/§6/§7/changelog · README §2.1/§2.6/§4/§7/§8/§9 |
| `scope-…` D8/credit · U4 · stock-reservation Q1 | คงตามรอบก่อน | D8 v2 · credit 60 · Option A |

---

## 8. งานส่งต่อ UX/UI (สรุป)

**punch-list เดิม + delta รอบก่อน:** customer · quotation · po/so · stock/GR/return · bom · production · supply-planning · dashboard/home/platform · qc/shipping/invoice/traceability/settings · pagination/search + customer dropdown component. (ดูรายละเอียดรอบก่อนใน commit history — คงไว้)

> **★ รอบก่อน (Comment control · Customer Edit · Quotation REVERT Sent · Stock · Supplier/BOM · Settings SET-1..9)** — คงตามรอบก่อน (commit history).

> **★ CANCELLED UX follow-up (2026-07-29 — ปอนด์, resolve US-SET-02):** งาน UX/UI ที่เคยตั้งไว้ว่า **"หน้าจอ delete-user bulk-reassign (ให้เลือก Sale ปลายทางรับลูกค้าครบก่อนลบ)" = ยกเลิก (CANCELLED — ไม่ต้องทำ)**. แทนที่ด้วย: หน้า delete-user แค่แสดง **confirm popup ที่ยืนยันว่า "ลูกค้าจะไม่มีผู้ดูแล (Sale ว่าง)"** (จำนวน N ราย, มอบหมายภายหลังได้) — ไม่มี step เลือก Sale ปลายทาง. ประกอบกับ: หน้ารายชื่อ/แก้ไขลูกค้าเพิ่ม **filter "ไม่มีผู้ดูแล (unassigned)" + reassign action** (มีใน 3 requirement docs อยู่แล้ว). ยึด `settings.md` §4c/§5 US-SET-02 · `customer.md` §4.3.

> **★★ Production module review — UI ที่ UX/UI ต้องเพิ่ม/แก้ (2026-07-29 · `production.html` + `stock.html` + `qc.html`):**
> - **(PROD-1) แท็บ "รอรับงาน" — search:** ช่องค้น **เลข PO และ SO (ทุกสถานะ) · ชื่อลูกค้า · ข้อมูลผู้ติดต่อ (ชื่อ/เบอร์) · ช่วงวันที่สร้าง PO/SO · ช่วงวันที่ต้องการรับของ**.
> - **(PROD-2) แท็บ "รอรับงาน" — filter + default:** filter ตามสถานะ PO/SO · **default filter = "พร้อมรับงาน (ready to accept)"**.
> - **(PROD-3) PO/SO detail = modal:** คลิกรายการ → **modal dialog** แสดงข้อมูล PO/SO (ไม่สลับหน้า) + **ลิงก์ "เปิดหน้า PO/SO เต็ม"**; กลับมาไม่เสีย state (ใช้ทั้ง 2 แท็บ).
> - **(PROD-4) แท็บ "คิวงานที่รับแล้ว" — search:** เพิ่ม **เลข PRD** (นอกเหนือจาก PO/SO/ลูกค้า/ผู้ติดต่อ/ช่วงวันที่สร้าง/ช่วงวันที่ต้องการรับของ).
> - **(PROD-5) แท็บ "รับแล้ว" — filter + default + ordering:** filter PO/SO · **default = รับงานแล้ว/Hold/กำลังผลิต/QC/พร้อมส่งมอบ** · **ordering ผลลัพธ์ = รับงานแล้ว → กำลังผลิต → QC → พร้อมส่งมอบ → Hold** (Rework อยู่ในกลุ่มกำลังผลิต).
> - **(PROD-6) Grouping คิว "รับแล้ว":** **จัดกลุ่มตาม PO/SO (header) → PRD (ต่อ line) ซ้อนอยู่ใต้** (1 PO/SO หลาย PRD).
> - **(PROD-7) หน้าจัดการ — จำนวนผลิตจริง:** ฟิลด์ "จำนวนผลิตจริง (actual)" แก้ได้ · **validate ≥ จำนวนสั่ง** (บล็อกถ้าน้อยกว่า) · preview "ส่ง XX · เข้าคลัง XX" (surplus).
> - **(PROD-8) หน้าจัดการ — under-production affordance:** ถ้าต้องส่งน้อยกว่าสั่ง → พาไป **แก้ PO ให้จำนวนสั่ง = ผลิตจริง** (การแก้ PO นี้ → raise ⚑ follow-up ลูกค้า + audit) — ไม่มีทางลัดตั้ง actual < ordered.
> - **(PROD-9) หน้าจัดการ — lot picker:** เลือกวัตถุดิบตัดได้ **เฉพาะ lot ที่มี stock**; หลาย lot → **FIFO (เก่าสุดก่อน)**; ไม่แสดง lot ที่ stock=0.
> - **(PROD-10) หน้าจัดการ — "✓ พร้อมส่ง (ส่ง XX·เข้าคลัง XX)":** ปุ่ม **disabled จนกว่า QC ผ่าน**; กดตอนยังไม่ผ่าน → **popup "QC ต้องผ่านก่อน"**; ผ่านแล้วกด → **confirm popup** → PRD Ready to Ship + surplus→FG.
> - **(PROD-11) หน้าจัดการ — ปุ่ม Loss:** **ต้องมีปุ่มบันทึก Loss บนหน้าจัดการ** (ปอนด์หาไม่เจอ) · **confirm popup ทุกครั้ง** · เหตุผลบังคับ · ตัด stock (D15).
> - **(PROD-12) หน้าจัดการ — "ไปหน้า QC ›":** ปุ่ม **enabled เฉพาะสถานะ = ส่งตรวจคุณภาพ (QC)** → คลิก **navigate ตรงไป qc แท็บ "ตรวจแบตช์" ที่ Batch นั้น** (deep-link).
> - **(PROD-13) confirm popup ทุก status change:** รับงาน/เริ่มผลิต/ส่ง QC/พร้อมส่ง/Hold/rework/loss/edit-PO — ทุกอันมี popup ยืนยัน.
> - **(PROD-14) edit-PO → follow-up flag:** การแก้ PO จากบริบทการผลิต → **ตั้ง ⚑ "ต้องติดตาม" ที่ลูกค้า** (ให้ Sale เห็น) + audit ละเอียด (field-level).
> - **(STK-1 delta) stock.html แท็บ RM — Adjust:** ฟอร์ม **Adjust (ปรับยอด +) เพิ่ม Lot selector** = เลือก lot ที่มี stock **หรือ** option **"FIFO"** (เดิม RM-only) — สมมาตรกับ Loss.
> ยึด `production.md` §5/§6/§7 · `stock.md` §5.1 · `qc.md` §9 · `po.md` §5.2 · `customer.md` §4.1.
> **หมายเหตุ collision:** รอบนั้น PO แก้ **requirement docs เท่านั้น** — mockups เป็นงานที่ส่งต่อ (PROD-1..14 + STK-1).

> **★★ Supply Planning module review — UI ที่ UX/UI ต้องเพิ่ม/แก้ (2026-07-29 · `supply-planning.html`):**
> - **(SP-1) โครงหน้า: การ์ดต่อ FG → รายการ (list) FG:** แต่ละแถวโชว์ **ชื่อ FG · รหัส FG · badge สถานะ (Low/OK/Overstock)**; คง **3 stat tiles** (Items below target / Suggested production / Shortest cover) บน list header · **20/หน้า + pagination (G1)**.
> - **(SP-2) แถบค้นหา — 3 แกน (any-match):** ช่องค้นเดียว match **(1) ชื่อ FG · (2) รหัส FG · (3) วัตถุดิบ (RM reverse lookup — พิมพ์ชื่อ/รหัส RM → คืน FG ทุกตัวที่ BOM มี RM นั้น)** — hint "ค้นชื่อ/รหัส FG หรือวัตถุดิบ" หรือ toggle "ค้นด้วยวัตถุดิบ" (รายละเอียดหน้าตา = งาน UX/UI).
> - **(SP-3) filter สถานะ:** Low / OK / Overstock (คงไว้).
> - **(SP-4) why-calc inline ต่อแถว:** แสดงตัวเลขเบื้องหลัง badge — **Cover today เทียบ Target (+ Safety/Lead) + Suggested (ceil-to-batch) ถ้า Low** (ตัวอย่าง: "เหลือ cover 14.3 วัน < Target 30 (Safety 5/Lead 7) — ควรผลิต 1,500 ชิ้น"). ไม่ใช่แค่ป้ายสี.
> - **(SP-5) ปุ่มขยายแถว (▸/▾) → RM breakdown inline:** โชว์ **รายการวัตถุดิบ (RM) ของสูตร: รหัส RM · ชื่อ RM · qty ต่อหน่วยสินค้า · สต็อกคงเหลือ (on_hand/available) ต่อ RM** — read-only (open/close ในแถว).
> - **(SP-6) คลิกแถว (นอกปุ่มขยาย) → MODAL รายละเอียดเต็ม:** modal dialog (ไม่สลับหน้า, ปิดแล้วกลับ list ไม่เสีย state — G3) แสดง หัว (ชื่อ/รหัส/badge/narrative) + ตัวเลขวางแผนเต็ม + coverage bar (4 markers) + RM breakdown + สั่งผลิต + margin sim + แก้ param + ลิงก์ "เปิดหน้า BOM/FG เต็ม" / "เปิดหน้า SO produce-to-stock".
> - **(SP-7) modal — "สั่งผลิต" ระบุจำนวน batch เอง:** ช่อง **batch count (integer ≥ 1, default = Suggested batch count)** → แสดง **qty = batch count × Batch Size**; กด "สั่งผลิต" → prefill SO produce-to-stock (FG + qty ที่คำนวณ, D8 v2). ปุ่มโผล่เฉพาะ FG Active.
> - **(SP-8) modal — cost/revenue/margin simulation (recompute live):** เปลี่ยน batch count → อัปเดตทันที: **cost = ต้นทุนรวม/หน่วย (BOM) × qty · revenue = ราคาขาย FG (BOM) × qty · margin = revenue − cost · margin %**. ป้าย/hint ระบุ "decision-support ตอนวางแผน (ก่อน VAT) — ไม่ใช่ COGS". ถ้าไม่มีราคาขาย/ต้นทุน → ปิดการคำนวณ margin + hint "ข้อมูลราคา/ต้นทุนไม่ครบใน BOM" (สั่งผลิตยังทำได้).
> - **(SP-9) modal — แก้ param 2 โหมดแยกชัด:** แก้ **Sales Rate/Lead/Safety/Target/Batch Size** → recompute โหมด **จำลอง (unsaved)** ทันที + affordance "กำลังจำลอง (unsaved)" + ปุ่ม "รีเซ็ตกลับค่าจริง" · ปุ่มแยก **"บันทึกกลับ BOM master"** (persist + audited, ต้องสิทธิ์ Supply Planning.Update). ปิด modal/เปลี่ยน FG = ทิ้งค่าจำลอง.
> - **(SP-10 — list follow-up):** bell/badge "Low" บนหัวหน้า supply-planning (นับ FG Low ปัจจุบัน) + รายการใน notification panel (deep-link มา supply-planning / SO prefill) + digest เช้า = 1 entry รวม.
> ยึด `supply-planning.md` §2/§4/§4b/§5/§5a/§5b/§5c/§6 · `bom.md` §3/§4 · `so.md` §6.
> **หมายเหตุ collision:** รอบนี้ PO แก้ **requirement docs เท่านั้น** — mockup `supply-planning.html` (SP-1..10) เป็นงานที่ส่งต่อ UX/UI (เข้า GATE 1 review เฉพาะหน้าที่แก้).

---

## 9. Open questions
**ไม่มี open question ค้าง — ปิดครบทั้งหมด (2026-07-29).**

**คำถามที่ปิดแล้ว (2026-07-29):** Supply Planning proactive alert · Quotation abandon/review/REVERT Sent · Traceability/Reference · Customer financial summary / follow-up enum / hard block / Edit=all fields · Comment convention (12 objects) · Stock module 4 · Supplier · BOM · Settings · **★ Production (การผลิต / คิวงานผลิต) module review → DECIDED (settled, no open Q)** · **★ Delete Sale → customers unassigned (US-SET-02) → DECIDED (settled)** · **★★ Supply Planning module review → DECIDED (settled, no open Q) — รวม sell-price question**.

> **★ Supply Planning sell-price (revenue source) = SETTLED (2026-07-29):** แหล่ง revenue ของ margin simulation = **ฟิลด์ "ราคาขาย" (mandatory) ที่มีอยู่แล้วใน `bom.md` §3** (ยืนยันว่ามีจริง) — คูณ qty ได้ revenue; ต้นทุน = ต้นทุนรวม/หน่วย (`bom.md` §4, D9). ทั้งคู่ **ก่อน VAT** (VAT เป็นเรื่องตอน invoice, D-F3); margin = decision-support ตอนวางแผน **ไม่ใช่ COGS/บัญชี (D10 snapshot คงเดิม)**. **ไม่ประดิษฐ์แหล่งราคาใหม่ → ไม่มี open question.** ถ้าปอนด์อยากได้ฐานราคาอื่น/รวม VAT → แจ้งปรับได้ (default ปัจจุบัน = ราคาขาย ก่อน VAT).

> **การตัดสินสมเหตุผลของ PO (ไม่ถือเป็น open question):**
> - **★ 1 PO/SO : หลาย PRD = CONFIRMED โดย locked model** (1 line = 1 PRD — entity-status-map §1.4 · scope D-rule) → settle ทันที (ไม่ถามปอนด์) → คิว "รับแล้ว" group PO/SO → PRD ซ้อนใต้.
> - **★ "พร้อมส่ง" QC-gated action (ไม่ auto)** — reconcile D13 (capture surplus ตอน "พร้อมส่ง") + คำสั่งปอนด์ (กด "พร้อมส่ง" ต้อง QC ผ่าน); QC-pass เป็น precondition, ฝ่ายผลิตกดเอง → PRD Ready to Ship. entity-status-map §1.4 (r9) ปรับจาก "auto ตอน QC ผ่าน" เป็น action.
> - **★ Rework อยู่ในกลุ่ม "กำลังผลิต" สำหรับ ordering** — สอดคล้อง entity-status-map r5 (Rework = สีฟ้า processing under กำลังผลิต).
> - **★ Stock Adjust อ้าง Lot/FIFO** — ตีความ "Adjust ต้องอ้าง Lot; ไม่มี/จำไม่ได้ = FIFO" ให้สมมาตรกับ Loss (คง genealogy ราย lot); D15 ledger append-only ไม่กระทบ.
> - **★ Supply Planning revenue = ราคาขาย (BOM §3) ก่อน VAT · margin sim = decision-support ไม่ใช่ COGS** — ใช้ฟิลด์ที่มีอยู่แล้ว, ไม่กระทบ D10 snapshot; simulate ไม่ persist (ไม่ audit), เฉพาะ "บันทึกกลับ BOM master" ที่ persist + audited.
> ถ้าปอนด์เห็นต่างข้อใด — แจ้งปรับได้ แต่ default ปัจจุบันตามด้านบน.

> **สรุปสถานะ:** ทุกรายการ **settled → READY_FOR_UX_UI**. รอบล่าสุด = **Supply Planning module review** (list+expand+modal · FG search ชื่อ/รหัส/RM · สั่งผลิต batch-count + cost/revenue/margin sim · simulate vs save-back BOM · sell-price settled) — ripples ครบทุกไฟล์ (`bom.md`/`so.md`/`traceability.md`/`non-functional.md`/README).
