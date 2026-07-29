# Requirement Package (Per-Module) — ESSENCE Hub System

slug: `erp-v2-ui-first` · เขียนโดย PO · 2026-07-29 · **CANONICAL & COMPLETE SINGLE SOURCE OF TRUTH** สำหรับ BA / QA / Tech-Lead
สถานะ: consolidation ของ requirement ที่กระจัดกระจาย → per-module ที่โครงสร้างสม่ำเสมอ **ครบทุก module + NFR + Deletion Policy** (existing-good absorb + delta ใหม่) · reconciled กับ D1–D18 + fold คำสั่งใหม่ของปอนด์ (2026-07-29)

## สรุปภาษาไทย
เอกสารชุดนี้คือ **แหล่งความจริงล่าสุดแบบราย module ที่ครบถ้วน (single source of truth)** ของทั้งระบบ ESSENCE Hub — ทุก module มี .md ที่เป็น **spec ปัจจุบันเต็ม**. Document Hub จัดเป็น **① Functional** (จัดตามแถบเมนูแอป) · **② Non-Functional** (`non-functional.md` + `deletion-policy.md` + **`traceability.md` = พื้นผิว trace/audit governance**) · **③ Reference** (เอกสารหลักการที่ยังใช้ได้) · ④ Architecture · ⑤ Mockups · **⑥ Archive (หน้าเก่า superseded, collapsed)** — หมวด ①/②/③ ลิงก์เฉพาะภายในแพ็กเกจ/reference ไม่เด้งออกไปหน้าเก่า. **★ ปอนด์เคาะ 4 ข้อ (2026-07-29) — ปิดคำถามค้างทั้งหมด:** (1) traceability → Non-Functional, (2) Reference เป็นหมวดของตัวเอง, (3) **Supply Planning แจ้งเตือน Low เชิงรุก** (real-time + J8 digest, แนบ Suggested), (4) **Quotation ยกเลิกได้ทุกสถานะ** (PO loose reference, no cascade, activity-log). **★ Customer module review (2026-07-29):** เพิ่ม **financial summary** (ยอดซื้อ/จ่าย/ค้าง) + **"ต้องติดตาม" = flag แยกจาก status** + **hard block QT/PO/SO เมื่อ Disabled/Blacklist** → มี **1 open question** (ถอด "Follow-up" จาก status enum จริงไหม — default ถอด) ดู §9. **★ Quotation module review (2026-07-29 — settled, no open Q):** เพิ่มสถานะ **"ส่งแล้ว (Sent)"** ใน list/filter/badge + ฟิลด์ **sent-date** + **reseat "ตกลง (Agreed)" → "ยืนยัน (Confirmed)"** + **banner "ไปสร้าง PO"** + **material check บนหน้า edit** + **activity-log ทุก action → trace**. **★ PO (module 3) review (2026-07-29 — cross-cutting):** (a) **Comment field convention** — ทุก object ธุรกรรม (QT/PO/SO/PRD/Batch/DN/Shipment/Invoice/GR/PR) มี **ช่องหมายเหตุเดียว แก้ในที่ (overwrite) แต่เก็บประวัติการแก้ครบ (ใคร/เมื่อ/เดิม→ใหม่) ดูได้ inline + โผล่ trace** — กติกากลางที่ `comment-convention.md` (settled, มี 1 non-blocking flag เรื่อง Return/QC ดู §9) · (b) **Customer Edit = แก้ได้ครบทุกฟิลด์เท่ากับ Create** (ไม่ใช่แค่ผู้ติดต่อ; financial summary read-only) — settled.

---

## 1. โครงไฟล์ (file tree — ครบทั้งชุด)

```
docs/requirements/erp-v2-ui-first/modules/
  README.md                  ← ไฟล์นี้ (index + D-rule spine + changelog + source-of-truth + old→new map + global rules)
  permission-matrix.md       ← capability → module → action/button (รวมทุก module, +3 module ใหม่)
  comment-convention.md      ← ★ กติกากลาง comment + change-history (CC1–CC7) · object list · อ้างโดยทุก module ธุรกรรม

  # System-wide / Governance (Non-Functional bucket ใน Hub)
  non-functional.md          ← NFR รวม: perf/auth-session/audit/backup-infra/data-format/jobs J1–J8/noti/search/responsive/soft-delete/reliability
  deletion-policy.md         ← (folded) soft-delete/void baseline + entity เดิม + entity ใหม่ (Quotation cancel-anytime/SO/FG Batch/OEM surplus/cost snapshot)
  traceability.md            ← trace/audit governance ข้าม module (Hub จัดใน ② Non-Functional) · entity/field search · genealogy · field-audit · QT head-of-chain · ★ comment field audited

  # Platform & Navigation (Functional · ระบบ)
  platform.md                ← login local+Google · session 24h/06:00 · notification outbox+read-bit (+FG→Low) · global search · responsive+guard
  home.md                    ← task inbox ตามสิทธิ์ · quick actions · onboarding
  dashboard.md               ← 7 แผนก × 29 tile · event/state · date filter · drill · permission-based

  # Sales & Customer (Functional · งานขาย/Order)
  customer.md                ← ★ + financial summary · follow-up flag (แยก status) · hard block Disabled/Blacklist · ★ Edit = all fields
  quotation.md               ← OEM Quotation (create/edit/convert-to-PO) · ยกเลิกได้ทุกสถานะ · hard block · Confirmed reseat + sent-date + activity-log · ★ comment
  po.md                      ← OEM Purchase Order · hard block · prefill จาก QT Confirmed (2 ทาง) · ★ comment
  so.md                      ← Own-Brand Sales Order (sell-from-stock + produce-to-stock) · hard block (โหมด ก) · ★ comment

  # Supply Planning & Production (Functional · ผลิต&คุณภาพ)
  bom.md                     ← BOM + other-cost + TYPE(OEM/FG) + Supply-Planning config
  supply-planning.md         ← Demand & Production Cover + FORMULA SUMMARY + ★ proactive Low alerting (real-time + J8)
  production.md              ← PRD/Batch + actual-qty/surplus + queue search/filter · ★ comment (PRD + Batch)
  qc.md                      ← ตรวจ Batch/Lot · rework เฉพาะ line เสีย + feedback · GMP chain

  # Inventory & Procurement (Functional · คลัง&จัดซื้อ)
  stock.md · goods-receipt.md (★ comment) · pr.md (★ comment) · supplier.md · return.md

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

### 2.3 ★ D18 reseat — QT "ตกลง (Agreed)" → "ยืนยัน (Confirmed)" (2026-07-29 Quotation review)
D18-4 กำหนดสถานะ ร่าง/ส่งแล้ว/**ตกลง (Agreed)**/ปฏิเสธ โดย "Agreed" เปิดปุ่ม Convert-to-PO. ปอนด์ปรับ (Quotation review): **การกด "Convert to PO" คือการยืนยันว่าลูกค้าตกลง → ตั้ง QT = "ยืนยัน (Confirmed)" ทันที** (รวมสองสเต็ปเดิม "mark Agreed → ค่อย Convert" เป็นสเต็ปเดียว) · การสร้าง PO เป็น **ขั้นอิสระ** (prefill ตอนนี้/ทีหลัง) · loose ref + no cascade + cancel-anytime **คงเดิม**. enum ใหม่: **ร่าง/ส่งแล้ว/ยืนยัน/ปฏิเสธ + ยกเลิก**. **module package wins** เหนือถ้อยคำ D18-4 (ดู §5 source-of-truth). authoritative = `quotation.md` §4/§6 · entity-status-map §1.1b.

> D1–D7, D9–D17 **ไม่เปลี่ยน**. D18 = reseat ถ้อยคำสถานะ (business flow เดิม: เสนอ→ตกลง→เป็น PO).

---

## 3. GLOBAL Rules (บังคับทุก module — ปอนด์สั่ง 2026-07-29)

| # | กติกา | รายละเอียด |
|---|---|---|
| **G1 Pagination** | list/history ทุกอัน **20 แถว/หน้า + pagination** | ทุก list + drill dashboard + ledger + audit + noti "ดูทั้งหมด" |
| **G2 Date-range search** | ค้น **เลขเอกสาร** หรือ **ช่วงวันที่สร้าง** | quotation/PO/SO/GR/PR/invoice/shipping list + production queue + audit · **★ quotation เพิ่มแกนที่ 2 = ช่วงวันที่ส่งลูกค้า (sent-date)** |
| **G3 Drill + back คงสถานะ** | กลับ **ไม่เสีย state เดิม** | dashboard drill · customer detail จาก order = modal |
| **G4 Customer search dropdown** | quotation/po/so-create | ค้นเบอร์/บริษัท/ผู้ติดต่อ · แสดงสถานะ+credit term · modal detail · **★ Disabled/Blacklist เลือกไม่ได้ (hard block, customer.md §4.2)** |
| **G5 Permission-per-action** | ทุกปุ่มระบุ capability | `permission-matrix.md` |
| **★ G6 Comment + change-history** | ทุก object ธุรกรรมมี **ช่องหมายเหตุเดียว แก้ในที่ (overwrite) + เก็บประวัติการแก้ครบ (ใคร/เมื่อ/เดิม→ใหม่) ดู inline + โผล่ trace** | QT/PO/SO/PRD/Batch/DN/Shipment/Invoice/GR/PR · กติกากลาง = **`comment-convention.md` (CC1–CC7)** · audit = field-audit เดิม |

> NFR ระดับระบบ (perf/auth/audit/format/jobs) รวมที่ `non-functional.md`.

---

## 4. Confirmations ที่ปอนด์สั่งให้ยืนยัน (RESOLVED)

| หัวข้อ | คำตัดสิน | เอกสาร |
|---|---|---|
| **Convert-to-PO** | กด "Convert to PO" → **popup "สถานะจะเปลี่ยนเป็น ยืนยัน (Confirmed)"** → QT = **Confirmed ทันที (immutable)** + **loose link** QT↔PO → เลือก po-create prefill **ตอนนี้/ทีหลัง** (banner ถาวรถ้ายังไม่สร้าง) → PO เลขใหม่. ("Confirmed" reseat จาก "Agreed" D18-4) | `quotation.md` §6 · `po.md` §5 · oem-flow |
| **SO (ก) ขายจากสต็อก** | จอง FG → พร้อมส่ง → ตัด FG FIFO ตอน dispatch → DN/Invoice | `so.md` · `shipping.md` |
| **SO (ข) ผลิตเก็บสต็อก** | BOM check → production; RM ขาด auto-PR; QC ผ่าน → FG เข้าคลัง | `so.md` |
| **★ Comment convention** | ทุก object ธุรกรรมมีช่อง comment เดียว แก้ในที่ + เก็บประวัติครบ + โผล่ trace | `comment-convention.md` · ทุก module ธุรกรรม |
| **★ Customer Edit = all fields** | หน้า edit แก้ได้ครบทุกฟิลด์เท่ากับ create (financial summary read-only) | `customer.md` §2b |

**หมายเหตุ:** Quotation ทำ material check (ทั้ง create + edit) แต่ **ไม่ auto-open PR**.

---

## 5. ★ Source-of-Truth Statement (ประกาศชัด)

1. **`modules/*.md` = AUTHORITATIVE spec ปัจจุบันของทุก module + NFR + Deletion Policy + Traceability** — ชุดเดียวที่ BA/QA/TL ยึด.
2. แต่ละ .md เป็น **spec เต็ม**. `non-functional.md` = NFR authoritative · `deletion-policy.md` = deletion authoritative · `traceability.md` = trace/audit governance · **`comment-convention.md` = comment+change-history convention authoritative (documented ONCE, ราย module อ้างอิงไม่ทำสำเนา)**.
3. **เอกสารเก่า** (functional-spec module pages + cross-cutting + root `deletion-policy.md`) = **historical reference** → ย้ายไป **Hub ⑥ Archive (collapsed)** ออกจากเส้นทางหลัก.
4. **เอกสารหลักการเชิงลึก** (`entity-status-map`, `status-journeys`, `stock-reservation`, `scope` D1–D18, `mock-data-spec`, `brief`, ADRs, `scheduled-jobs`, `rtm`, `glossary`, `continuity`, `list-conventions`) = **authoritative reference** → รวมเป็น **Hub ③ Reference (หมวดของตัวเอง)**, ติดป้าย "reference" ชัด (ไม่ใช่ spec แข่ง). per-module docs อ้างอิง ไม่ทำสำเนา. **★ entity-status-map §1.1 = status source-of-truth reference** — sync กับ `customer.md` (r6: 5 สถานะ + follow-up flag) · **§1.1b = QT lifecycle (r7, sync กับ `quotation.md`)**. **เมื่อถ้อยคำ D18-4 (scope, locked) ต่างจาก module spec (เช่น Agreed↔Confirmed) → module package wins** (scope = historical lock ของ business intent เดิม; ถ้อยคำสถานะปัจจุบันยึด quotation.md).
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
| **★ Quotation cancellation** | **DECIDED 2026-07-29** | **ยกเลิกได้ทุกสถานะ** (Draft/Sent/Confirmed/Rejected) · PO = **loose reference** เท่านั้น · ยกเลิก QT **ไม่ cascade** ไป PO · บันทึก **activity-log** + gapless (ไม่ hard-delete). แทน default เดิม "void-only". อัปเดต `quotation.md` §4/§7/§8 + `deletion-policy.md` §2.9/matrix. **ปิด parked question** |
| **★ Quotation module review (Convert/Sent/sent-date/activity)** | **DECIDED 2026-07-29 · settled (no open Q)** | (a) list เพิ่ม/กรอง "ส่งแล้ว (Sent)" · (b) ฟิลด์ sent-date + list ค้น 2 แกนวันที่ · (c) Convert-to-PO = popup → QT Confirmed ทันที (reseat "Agreed"), immutable, สร้าง PO อิสระ · (d) banner ถาวร "ไปสร้าง PO" · (e) material check บน edit · (f) activity-log ทุก action → trace. อัปเดต `quotation.md` + `po.md` §3/§5/§10 + `traceability.md` + `non-functional.md` AU1 + `deletion-policy.md` + `entity-status-map.md` |
| **★ Customer — financial summary** | **DECIDED 2026-07-29 (Customer review)** | customer-detail แสดง ยอดซื้อรวม/จ่ายมาแล้ว/ค้างชำระ (THB, computed read-only). `customer.md` §3/§7 |
| **★ Customer — Follow-up = flag แยก** | **DECIDED 2026-07-29 · มี open item §9** | "ต้องติดตาม" ถอดออกจาก status → flag อิสระ · badge แยก · list/history filter. **default: ถอด "Follow-up" จาก status enum (6→5) — ★ รอปอนด์ยืนยัน** (`customer.md` §12) |
| **★ Customer — hard block Disabled/Blacklist** | **DECIDED 2026-07-29 (Customer review)** | Disabled/Blacklist = **HARD block เปิด QT/PO/SO**. `customer.md` §4.2, `quotation.md`, `po.md`, `so.md`, G4 |
| **★ Comment field convention (cross-cutting)** | **DECIDED 2026-07-29 (PO module 3 review) · settled** | ทุก object ธุรกรรม (QT/PO/SO/PRD/Batch/DN/Shipment/Invoice/GR/PR) มี **ช่อง comment เดียว แก้ในที่ (overwrite) + เก็บประวัติการแก้ครบ (ใคร/เมื่อ/เดิม→ใหม่) ผ่าน field-audit เดิม + ดู inline "ประวัติการแก้ไข comment" + โผล่ trace + activity-log**. กติกากลาง = **`comment-convention.md` (CC1–CC7, G6)**; ราย module อ้างอิงไม่ทำสำเนา. อัปเดต `po.md` §3/§5.1/§6/§7/§10 · `quotation.md` §3/§5c/§7/§10 · `so.md` §3/§5b/§7 · `production.md` §3/§5b/§7 (PRD+Batch) · `shipping.md` §3/§4b/§6 (Shipment+DN) · `invoice.md` §3/§5b/§6 · `goods-receipt.md` §3/§4b/§6 · `pr.md` §3/§4b/§6 · `traceability.md` §3/§4/§5/§9 · `non-functional.md` AU1/AU2. **1 non-blocking flag:** Return/QC ควรมี comment ไหม (default = ควรมี) — §9 |
| **★ Customer Edit = ALL fields** | **DECIDED 2026-07-29 (PO module 3 review) · settled** | หน้า edit ลูกค้าแก้ได้ครบทุกฟิลด์เท่ากับ create (บริษัท/TYPE/credit/ภาษี-ที่อยู่/สถานะ/⚑ flag/ผู้ติดต่อ) **ไม่ใช่แค่ผู้ติดต่อ** · financial summary + รหัส CUS read-only · ทุกการแก้ audit/management-history · สิทธิ์ราย action คงเดิม. `customer.md` §2b/§3/§8/§9 |
| `scope-…` D8/credit · U4 · stock-reservation Q1 | คงตามรอบก่อน | D8 v2 · credit 60 · Option A |

---

## 8. งานส่งต่อ UX/UI (สรุป)

**punch-list เดิม U1/U2/U3/U5/U6 (ยังค้าง) + delta:** customer TYPE/credit/history · quotation dropdown/no-auto-PR/print-ready/Convert/ปุ่มยกเลิก QT · po/so dropdown+reserve+auto-PR · stock/GR/return · bom cost/TYPE/planning · production queue/actual/surplus · supply-planning: filter + edit→save + สั่งผลิต + Low bell/badge · dashboard/home/platform · qc/shipping/invoice/traceability/settings · pagination/search + customer dropdown component.

> **★ PO module 3 review — UI ที่ UX/UI ต้องเพิ่ม (2026-07-29):**
> **(M1) Comment control (cross-cutting) — เพิ่มบนทุก object ธุรกรรม:** กล่อง **"หมายเหตุ (comment)"** (free-text, ช่องเดียว, แก้ในที่/overwrite) + affordance **"ประวัติการแก้ไข (change history)"** = popover/timeline (เวลา / ผู้แก้ / ค่าเดิม→ค่าใหม่, 20/หน้า). แสดง **ค่าปัจจุบันเด่นบน detail**. วางบนหน้า:
> - **PO:** po-create (ตั้งค่าแรก) + po-detail (แก้ + ประวัติ).
> - **QT:** quotation-create + quotation-detail (ควบคู่ activity-log).
> - **PRD & Batch:** production (comment แยกต่อ PRD และต่อ Batch run).
> - **DN & Shipment (รอบ):** delivery-note (DN) + shipping (รอบ) — แยกช่องต่อ object.
> - **SO:** so-create + so-detail. · **Invoice:** invoice-detail (ไม่พิมพ์ลงใบกำกับ). · **GR:** goods-receipt. · **PR:** purchase-request / pr-create.
> ยึดกติกา `comment-convention.md` (G6) — comment เป็นคนละฟิลด์กับ "เหตุผลยกเลิก/void/QC feedback/Hold/loss/postpone".
> **(M2) Customer Edit = all fields (already in flight):** หน้าแก้ไขลูกค้าเปิดฟอร์ม **ครบทุกฟิลด์เท่ากับ create** (บริษัท/ธุรกิจ, TYPE OEM/Own-Brand, credit term, ภาษี/ที่อยู่, สถานะ 5-status, ⚑ flag ต้องติดตาม, ผู้ติดต่อ) — **ไม่ใช่แค่ผู้ติดต่อ**; **financial summary + รหัส CUS = read-only**. (UX/UI กำลังทำ customer edit — ให้ครอบทุกฟิลด์ตาม `customer.md` §2b.)

> **★ Quotation review UI follow-up (2026-07-29):** (Q1) status ครบชุด badge/filter (รวม "ส่งแล้ว") · (Q2) 2 แกนค้นหาวันที่ (created + sent) · (Q3) material check บน edit · (Q4) Convert-to-PO popup → Confirmed · (Q5) banner ถาวร "ไปสร้าง PO" · (Q6) activity-log visible + node QT บน trace. (`quotation.md` §2–§10)

> **★ Customer review UI follow-up (2026-07-29):** (C1) การ์ด "สรุปการเงิน" · (C2) flag ⚑ badge แยก · (C3) filter "⚑ ต้องติดตาม" · (C4) block affordance เมื่อ Disabled/Blacklist. (`customer.md`)

---

## 9. Open questions
**มี 1 open question ค้าง (จาก Customer review 2026-07-29) + 1 non-blocking flag (จาก PO module 3 review):**
- **★ (BLOCKING-ish) ถอด "Follow-up" ออกจาก status enum จริงไหม?** — spec นี้ใช้ **default = ถอด** (5 สถานะ + flag แยก). ต้องให้ปอนด์ยืนยันก่อน sync dashboard tile/filter ที่อ้าง 6 สถานะเดิม. ตัวเลือก: **(A) ถอด** [default] · **(B) คงคำว่า "Follow-up" ไว้เป็นสถานะที่ 6 + มี flag แยกซ้อน**. (`customer.md` §12) — *(ค้างจากรอบ Customer; ไม่ใช่ประเด็นของ PO module 3)*
- **★ (NON-BLOCKING) Comment บน Return + QC record?** — comment-convention ครอบ **10 object ธุรกรรม** (QT/PO/SO/PRD/Batch/DN/Shipment/Invoice/GR/PR) แล้ว. **Return (ใบคืน) + QC record** ไม่อยู่ในตัวอย่างที่ปอนด์ยกมา ("และ etc.") — PO **แนะนำให้ใส่ด้วย** เพื่อความสม่ำเสมอ แต่ **flag ถามยืนยัน ไม่ตัดทิ้งเงียบ**. ตัวเลือก: **(A) ใส่ Return + QC ด้วย** [PO แนะนำ] · **(B) เฉพาะ Return** · **(C) เฉพาะ 10 ตัว**. **ไม่บล็อก UX/UI** — เดินหน้า 10 ตัวได้เลย, Return/QC เป็น additive. (`comment-convention.md` §6)

**คำถามที่ปิดแล้ว (2026-07-29):**
- Supply Planning proactive alert → DECIDED · Quotation abandon → DECIDED · Quotation review → DECIDED · Traceability/Reference → DECIDED · Customer financial summary / hard block → DECIDED · **Comment convention (10 objects) → DECIDED (settled)** · **Customer Edit = all fields → DECIDED (settled)**.

> **สรุปสถานะ PO module 3 review:** Comment convention (10 objects) + Customer Edit=all fields = **settled → READY_FOR_UX_UI**. เหลือ 1 non-blocking flag (Return/QC) ให้ปอนด์เคาะเมื่อสะดวก (additive) + 1 open item ค้างจากรอบ Customer (Follow-up enum) ที่ไม่เกี่ยวกับรอบนี้.
