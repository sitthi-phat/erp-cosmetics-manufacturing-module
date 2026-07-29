# Requirement Package (Per-Module) — ESSENCE Hub System

slug: `erp-v2-ui-first` · เขียนโดย PO · 2026-07-29 · **CANONICAL & COMPLETE SINGLE SOURCE OF TRUTH** สำหรับ BA / QA / Tech-Lead
สถานะ: consolidation ของ requirement ที่กระจัดกระจาย → per-module ที่โครงสร้างสม่ำเสมอ **ครบทุก module + NFR + Deletion Policy** (existing-good absorb + delta ใหม่) · reconciled กับ D1–D18 + fold คำสั่งใหม่ของปอนด์ (2026-07-29)

## สรุปภาษาไทย
เอกสารชุดนี้คือ **แหล่งความจริงล่าสุดแบบราย module ที่ครบถ้วน (single source of truth)** ของทั้งระบบ ESSENCE Hub — ทุก module มี .md ที่เป็น **spec ปัจจุบันเต็ม**. Document Hub จัดเป็น **① Functional** (จัดตามแถบเมนูแอป) · **② Non-Functional** (`non-functional.md` + `deletion-policy.md` + **`traceability.md` = พื้นผิว trace/audit governance**) · **③ Reference** (เอกสารหลักการที่ยังใช้ได้) · ④ Architecture · ⑤ Mockups · **⑥ Archive (หน้าเก่า superseded, collapsed)** — หมวด ①/②/③ ลิงก์เฉพาะภายในแพ็กเกจ/reference ไม่เด้งออกไปหน้าเก่า. **★ ปอนด์เคาะ 4 ข้อ (2026-07-29) — ปิดคำถามค้างทั้งหมด:** (1) traceability → Non-Functional, (2) Reference เป็นหมวดของตัวเอง, (3) **Supply Planning แจ้งเตือน Low เชิงรุก** (real-time + J8 digest, แนบ Suggested), (4) **Quotation ยกเลิกได้ทุกสถานะ** (PO loose reference, no cascade, activity-log). **★ Customer module review (2026-07-29):** เพิ่ม **financial summary** (ยอดซื้อ/จ่าย/ค้าง) + **"ต้องติดตาม" = flag แยกจาก status** + **hard block QT/PO/SO เมื่อ Disabled/Blacklist** → มี **1 open question** (ถอด "Follow-up" จาก status enum จริงไหม — default ถอด) ดู §9. **★ Quotation module review (2026-07-29 — settled, no open Q):** เพิ่มสถานะ **"ส่งแล้ว (Sent)"** ใน list/filter/badge + ฟิลด์ **sent-date** (ค้นเป็น date-range แกนที่ 2) + **reseat "ตกลง (Agreed)" → "ยืนยัน (Confirmed)"** ตั้งโดย **Convert-to-PO popup** (ทันที, immutable, การสร้าง PO เป็นขั้นอิสระ) + **banner ถาวร "ไปสร้าง PO"** เมื่อ Confirmed-ยังไม่มี PO + **material check บนหน้า edit** + **activity-log ทุก action → trace (QT=head-of-chain)** ดู §7/§8.

---

## 1. โครงไฟล์ (file tree — ครบทั้งชุด)

```
docs/requirements/erp-v2-ui-first/modules/
  README.md                  ← ไฟล์นี้ (index + D-rule spine + changelog + source-of-truth + old→new map + global rules)
  permission-matrix.md       ← capability → module → action/button (รวมทุก module, +3 module ใหม่)

  # System-wide / Governance (Non-Functional bucket ใน Hub)
  non-functional.md          ← NFR รวม: perf/auth-session/audit/backup-infra/data-format/jobs J1–J8/noti/search/responsive/soft-delete/reliability
  deletion-policy.md         ← (folded) soft-delete/void baseline + entity เดิม + entity ใหม่ (Quotation cancel-anytime/SO/FG Batch/OEM surplus/cost snapshot)
  traceability.md            ← trace/audit governance ข้าม module (Hub จัดใน ② Non-Functional) · entity/field search · genealogy · field-audit · QT head-of-chain

  # Platform & Navigation (Functional · ระบบ)
  platform.md                ← login local+Google · session 24h/06:00 · notification outbox+read-bit (+FG→Low) · global search · responsive+guard
  home.md                    ← task inbox ตามสิทธิ์ · quick actions · onboarding
  dashboard.md               ← 7 แผนก × 29 tile · event/state · date filter · drill · permission-based

  # Sales & Customer (Functional · งานขาย/Order)
  customer.md                ← ★ + financial summary · follow-up flag (แยก status) · hard block Disabled/Blacklist
  quotation.md               ← OEM Quotation (create/edit/convert-to-PO) · ★ ยกเลิกได้ทุกสถานะ (loose ref, no cascade) · ★ hard block Disabled/Blacklist · ★ Confirmed reseat + sent-date + activity-log
  po.md                      ← OEM Purchase Order · ★ hard block Disabled/Blacklist · ★ prefill จาก QT Confirmed (2 ทาง)
  so.md                      ← Own-Brand Sales Order (sell-from-stock + produce-to-stock) · ★ hard block Disabled/Blacklist (โหมด ก)

  # Supply Planning & Production (Functional · ผลิต&คุณภาพ)
  bom.md                     ← BOM + other-cost + TYPE(OEM/FG) + Supply-Planning config
  supply-planning.md         ← Demand & Production Cover + FORMULA SUMMARY + ★ proactive Low alerting (real-time + J8)
  production.md              ← PRD/Batch + actual-qty/surplus + queue search/filter
  qc.md                      ← ตรวจ Batch/Lot · rework เฉพาะ line เสีย + feedback · GMP chain

  # Inventory & Procurement (Functional · คลัง&จัดซื้อ)
  stock.md · goods-receipt.md · pr.md · supplier.md · return.md

  # Fulfilment & Finance (Functional · จัดส่ง&การเงิน)
  shipping.md · invoice.md

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

> NFR ระดับระบบ (perf/auth/audit/format/jobs) รวมที่ `non-functional.md`.

---

## 4. Confirmations ที่ปอนด์สั่งให้ยืนยัน (RESOLVED)

| หัวข้อ | คำตัดสิน | เอกสาร |
|---|---|---|
| **Convert-to-PO** | กด "Convert to PO" → **popup "สถานะจะเปลี่ยนเป็น ยืนยัน (Confirmed)"** → QT = **Confirmed ทันที (immutable)** + **loose link** QT↔PO → เลือก po-create prefill **ตอนนี้/ทีหลัง** (banner ถาวรถ้ายังไม่สร้าง) → PO เลขใหม่. ("Confirmed" reseat จาก "Agreed" D18-4) | `quotation.md` §6 · `po.md` §5 · oem-flow |
| **SO (ก) ขายจากสต็อก** | จอง FG → พร้อมส่ง → ตัด FG FIFO ตอน dispatch → DN/Invoice | `so.md` · `shipping.md` |
| **SO (ข) ผลิตเก็บสต็อก** | BOM check → production; RM ขาด auto-PR; QC ผ่าน → FG เข้าคลัง | `so.md` |

**หมายเหตุ:** Quotation ทำ material check (ทั้ง create + edit) แต่ **ไม่ auto-open PR**.

---

## 5. ★ Source-of-Truth Statement (ประกาศชัด)

1. **`modules/*.md` = AUTHORITATIVE spec ปัจจุบันของทุก module + NFR + Deletion Policy + Traceability** — ชุดเดียวที่ BA/QA/TL ยึด.
2. แต่ละ .md เป็น **spec เต็ม**. `non-functional.md` = NFR authoritative · `deletion-policy.md` = deletion authoritative · `traceability.md` = trace/audit governance (Hub จัดใน ② Non-Functional).
3. **เอกสารเก่า** (functional-spec module pages + cross-cutting + root `deletion-policy.md`) = **historical reference** → ย้ายไป **Hub ⑥ Archive (collapsed)** ออกจากเส้นทางหลัก.
4. **เอกสารหลักการเชิงลึก** (`entity-status-map`, `status-journeys`, `stock-reservation`, `scope` D1–D18, `mock-data-spec`, `brief`, ADRs, `scheduled-jobs`, `rtm`, `glossary`, `continuity`, `list-conventions`) = **authoritative reference** → รวมเป็น **Hub ③ Reference (หมวดของตัวเอง)**, ติดป้าย "reference" ชัด (ไม่ใช่ spec แข่ง). per-module docs อ้างอิง ไม่ทำสำเนา. **★ entity-status-map §1.1 = status source-of-truth reference** — sync กับ `customer.md` (r6: 5 สถานะ + follow-up flag) · **§1.1b = QT lifecycle (r7, sync กับ `quotation.md`)**. **เมื่อถ้อยคำ D18-4 (scope, locked) ต่างจาก module spec (เช่น Agreed↔Confirmed) → module package wins** (scope = historical lock ของ business intent เดิม; ถ้อยคำสถานะปัจจุบันยึด quotation.md).
5. **RTM/Traceability คงครบ:** ทุก story/AC ยัง map → module + mockup + journey.
6. **Navigation IA (Document Hub, ปอนด์เคาะ 2026-07-29):** ① **Functional** (งานขาย/Order · คลัง&จัดซื้อ · ผลิต&คุณภาพ · จัดส่ง&การเงิน · ระบบ + flows + permission) · ② **Non-Functional** (non-functional + deletion-policy + **traceability**) · ③ **Reference** (เอกสารหลักการ) · ④ Architecture · ⑤ Mockups · ⑥ 🗄 Archive. **หมวด ①/②/③ ลิงก์เฉพาะภายใน — ไม่เด้งเข้าไปหน้าเก่า.** modules/index.html สะท้อนโครงเดียวกัน.

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
| **★ Quotation module review (Convert/Sent/sent-date/activity)** | **DECIDED 2026-07-29 · settled (no open Q)** | (a) **list เพิ่ม/กรอง "ส่งแล้ว (Sent)" ครบชุด badge** · (b) **ฟิลด์ sent-date** (ตั้งตอนส่ง) + list ค้น **2 แกนวันที่ (created + sent)** — G2 ขยาย · (c) **Convert-to-PO = popup → QT ยืนยัน (Confirmed) ทันที** (reseat "Agreed"), **immutable**, การสร้าง PO **อิสระ** (prefill ตอนนี้/ทีหลัง) · (d) **banner ถาวร "ยืนยันแล้ว · ไปสร้าง PO ด้วยข้อมูลนี้"** เมื่อ Confirmed-ยังไม่มี PO · (e) **material check บนหน้า edit** เหมือน create (ไม่ auto-PR) · (f) **activity-log ทุก action (create/send/edit→version/convert→Confirmed/cancel) → trace, QT=head-of-chain**. อัปเดต `quotation.md` (rewrite §2–§12) + `po.md` §3/§5/§10 + `traceability.md` §3/§4/§5/§11 + `non-functional.md` AU1/§14 + `deletion-policy.md` §2.9/matrix + `entity-status-map.md` §1.1b/cascade #0,#22/§3/§4/r7 |
| **★ Customer — financial summary** | **DECIDED 2026-07-29 (Customer review)** | customer-detail แสดง **ยอดซื้อรวม/จ่ายมาแล้ว/ค้างชำระ** (THB, computed read-only, derive จาก invoice+payment). `customer.md` §3/§7 + cross-link `invoice.md`. entity-status-map §1.3/§1.11 หมายเหตุ |
| **★ Customer — Follow-up = flag แยก** | **DECIDED 2026-07-29 · มี open item §9** | "ต้องติดตาม" ถอดออกจาก status → **flag อิสระ (boolean + เหตุผล + who/when) ควบคู่ได้ทุกสถานะ** · badge แยก · list/history filter. **default: ถอด "Follow-up" จาก status enum (6→5) — ★ รอปอนด์ยืนยัน** (`customer.md` §12, entity-status-map §1.1 r6). cascade #8/#14 → ตั้ง flag แทนเปลี่ยน status |
| **★ Customer — hard block Disabled/Blacklist** | **DECIDED 2026-07-29 (Customer review)** | Disabled/Blacklist = **HARD block เปิด QT/PO/SO** (เลือกไม่ได้ใน dropdown + บล็อกตอนยืนยัน). ต่างจาก TYPE mismatch (warn-not-block). `customer.md` §4.2, `quotation.md` §5/§8, `po.md` §5/§7, `so.md` §5/§8 (โหมด ก), G4 (§3) |
| `scope-…` D8/credit · U4 · stock-reservation Q1 | คงตามรอบก่อน | D8 v2 · credit 60 · Option A |

---

## 8. งานส่งต่อ UX/UI (สรุป)

**punch-list เดิม U1/U2/U3/U5/U6 (ยังค้าง) + delta:** customer TYPE/credit/history · quotation dropdown/no-auto-PR/print-ready/Convert/**ปุ่มยกเลิก QT** · po/so dropdown+reserve+auto-PR · stock/GR/return (FG adjust, ledger/loss, surplus identity, negative notice) · bom cost/TYPE/planning · production queue/actual/surplus · **supply-planning: filter Low/OK/Overstock + edit→save + สั่งผลิต + ★ Low bell/badge + noti entry (แนบ Suggested)** · dashboard/home/platform (29 tile, task inbox, noti panel +FG→Low, session warning) · qc/shipping/invoice/traceability/settings · pagination/search + customer dropdown component.

> UI follow-up ใหม่รอบนี้ (ยังไม่แก้ mockup): **(a)** SP Low bell/badge บนหัว supply-planning · **(b)** รายการ noti "FG {name} → Low · ควรผลิต {Suggested}" (deep-link) · **(c)** ปุ่ม/สถานะ "ยกเลิก" บน quotation-detail (ทุกสถานะ). ทุกจุดอ้าง rule ที่ล็อกแล้ว — zero guessing.

> **★ Quotation review UI follow-up (2026-07-29 — UX/UI ทำต่อจาก spec นี้· quotation screens):**
> **(Q1) quotation-list — status ครบชุด:** badge + filter ต้องมี **ร่าง / ส่งแล้ว (Sent) / ยืนยัน (Confirmed) / ปฏิเสธ / ยกเลิก** (เดิมขาด "ส่งแล้ว"). (`quotation.md` §2/§9)
> **(Q2) quotation-list — 2 แกนค้นหาวันที่:** เพิ่มตัวกรอง **ช่วงวันที่ส่งลูกค้า (sent-date range)** คู่กับ **ช่วงวันที่สร้าง (created-date range)** + คอลัมน์ "วันที่ส่ง". (`quotation.md` §3/§9)
> **(Q3) quotation-edit — material check:** หน้า edit (สร้างเวอร์ชันใหม่) ต้องมีปุ่ม **"เช็ควัตถุดิบตามสูตร (เหมือน PO · แต่ไม่สร้าง/ส่ง PR)"** เหมือนหน้า create. (`quotation.md` §5b)
> **(Q4) quotation-detail — Convert-to-PO popup:** ปุ่ม "Convert to PO (ออก PO เลขใหม่)" → **popup ยืนยัน "สถานะจะเปลี่ยนเป็น ยืนยัน (Confirmed)"** + 2 ทางเลือก **"ยืนยัน + สร้าง PO เดี๋ยวนี้ (prefill)"** / **"ยืนยันเฉย ๆ (สร้าง PO ทีหลัง)"** — ทั้งคู่ตั้ง QT=Confirmed ทันที. (`quotation.md` §6)
> **(Q5) quotation-detail — banner ถาวร (Confirmed-ยังไม่มี PO):** เมื่อ QT=ยืนยัน แต่ยังไม่ผูก PO → แสดง **banner ถาวร** *"ใบเสนอราคานี้ได้รับการยืนยันแล้ว"* + ปุ่ม **"ไปสร้าง PO ด้วยข้อมูลนี้"** (prefill) จนกว่าจะมี PO; เมื่อมี PO → เปลี่ยนเป็นลิงก์ "🔗 PO-…". (`quotation.md` §6.4)
> **(Q6) quotation-detail — activity-log visible:** แสดง activity-log ในหน้า detail (create/send+sent-date/edit→version/convert→Confirmed/cancel+เหตุผล) และ node QT ต้องปรากฏบน trace (head-of-chain). (`quotation.md` §10, `traceability.md`)

> **★ Customer review UI follow-up (2026-07-29 — UX/UI ทำต่อจาก spec นี้):**
> **(C1) customer-detail: การ์ด "สรุปการเงิน"** = ยอดซื้อรวม / จ่ายมาแล้ว / ยังไม่จ่าย(ค้างชำระ) · THB · read-only · outstanding>0+เลยเครดิต = เน้นสีเตือน + ลิงก์ไป invoices (filter ลูกค้า). (`customer.md` §7)
> **(C2) customer-detail: flag ⚑ "ต้องติดตาม" เป็น badge แยกจาก status badge** + tooltip เหตุผล + ปุ่มตั้ง/เคลียร์ (บังคับเหตุผล) ลง management-history. **ถอด "Follow-up" ออกจากชุด status badge** (ตาม default — ★ รอปอนด์ยืนยัน §9). (`customer.md` §4.1)
> **(C3) customers list: filter "⚑ ต้องติดตาม (yes/no)"** เพิ่มจาก filter สถานะ/TYPE/Sale เดิม + คอลัมน์/ไอคอน ⚑. (`customer.md` §10)
> **(C4) QT/PO/SO create: block affordance เมื่อลูกค้า Disabled/Blacklist** — ใน customer search dropdown (G4) แสดงสถานะแต่ **เลือกไม่ได้ (disabled option)** + ถ้าหลุดเข้ามาให้ **บล็อกตอนบันทึก/ยืนยัน** พร้อมข้อความชัด. ต่างจาก TYPE mismatch (คงเป็น warn). (`quotation/po/so.md`)

---

## 9. Open questions
**มี 1 open question ค้าง (จาก Customer review 2026-07-29):**
- **★ ถอด "Follow-up" ออกจาก status enum จริงไหม?** — spec นี้ใช้ **default = ถอด** (สถานะเหลือ 5: Lead/Active/Inactive/Disabled/Blacklist + flag "ต้องติดตาม" แยก) เพราะตรงกับคำสั่ง "แยกออกมาจาก status ปกติ". **ต้องให้ปอนด์ยืนยัน** ก่อน sync dashboard tile/filter ที่อ้าง 6 สถานะเดิม. ตัวเลือก: **(A) ถอด** [default] · **(B) คงคำว่า "Follow-up" ไว้เป็นสถานะที่ 6 ด้วย + มี flag แยกซ้อน**. ดู `customer.md` §12, entity-status-map §1.1 r6.

**คำถามที่ปิดแล้ว (2026-07-29):**
- **Supply Planning proactive alert → DECIDED:** real-time + J8 daily digest (แนบ Suggested) — `non-functional.md` §6.1/§6(J8)/§7, `supply-planning.md` §5.1, `platform.md` §7/§9.
- **Quotation abandon → DECIDED:** ยกเลิกได้ทุกสถานะ + PO loose reference + no cascade + activity-log — `deletion-policy.md` §2.9, `quotation.md` §4/§8.
- **★ Quotation review (Convert/Sent/sent-date/activity) → DECIDED (settled, no open Q):** reseat Agreed→Confirmed (ตั้งโดย Convert popup, immediate, immutable) · sent-date + Sent-status ใน list · material check บน edit · activity-log ทุก action → trace — `quotation.md` §2–§12, entity-status-map §1.1b.
- **Traceability classification / Reference section → DECIDED:** traceability → ② Non-Functional; Reference = หมวด ③ (§5.6).
- **Customer financial summary / hard block Disabled-Blacklist → DECIDED:** ดู §7.

> Customer module: financial summary + hard block = **settled** (UX/UI ทำได้ทันที); follow-up flag existence = settled; เหลือเพียง **status-enum disposition** (ถอด Follow-up?) เป็น open item เดียว → **BLOCKED_NEED_INPUT** (batch คำถามเดียว) จนกว่าปอนด์เคาะ. Quotation module review = **settled ทั้งหมด → READY_FOR_UX_UI**.
