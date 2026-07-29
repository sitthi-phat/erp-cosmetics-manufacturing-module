# Requirement Package (Per-Module) — ESSENCE Hub System

slug: `erp-v2-ui-first` · เขียนโดย PO · 2026-07-29 · **CANONICAL & COMPLETE SINGLE SOURCE OF TRUTH** สำหรับ BA / QA / Tech-Lead
สถานะ: consolidation ของ requirement ที่กระจัดกระจาย → per-module ที่โครงสร้างสม่ำเสมอ **ครบทุก module + NFR + Deletion Policy** (existing-good absorb + delta ใหม่) · reconciled กับ D1–D18 + fold คำสั่งใหม่ของปอนด์ (2026-07-29)

## สรุปภาษาไทย
เอกสารชุดนี้คือ **แหล่งความจริงล่าสุดแบบราย module ที่ครบถ้วน (single source of truth)** ของทั้งระบบ ESSENCE Hub — ทุก module มี .md ที่เป็น **spec ปัจจุบันเต็ม** (requirement เดิมที่ดี + ของใหม่ รวมเข้าด้วยกัน). Document Hub จัดเป็น 2 ก้อนหลัก **① Functional** (จัดตามแถบเมนูแอป) และ **② Non-Functional**, ตามด้วย Architecture / Mockups / **⑤ Archive (หน้าเก่า superseded, collapsed)** — หมวด ①/② ลิงก์เฉพาะภายในแพ็กเกจ ไม่เด้งออกไปหน้าเก่า. รอบล่าสุดเพิ่ม **`non-functional.md`** และ **`deletion-policy.md` (fold + entity ใหม่)** เข้าแพ็กเกจ. ก่อนหน้านี้ absorb requirement เดิมจาก functional-spec (BA US/AC), cross-cutting, entity-status-map, status-journeys, stock-reservation, deletion-policy, brief, ADRs, scheduled-jobs และเพิ่ม module ที่ยังขาด (Platform/Home/Dashboard/GR/PR/Supplier/QC/Shipping/Return/Invoice/Traceability/Settings). **แพ็กเกจ modules/ นี้ supersede** functional-spec module pages + root deletion-policy (คงไว้เป็น historical reference ใน Archive). **ไม่มี business-gap ค้าง** — มี 2 confirm non-blocking (SP proactive alert, QT abandon) → **READY_FOR_UX_UI** (mockup ทำต่อ parallel).

---

## 1. โครงไฟล์ (file tree — ครบทั้งชุด)

```
docs/requirements/erp-v2-ui-first/modules/
  README.md                  ← ไฟล์นี้ (index + D-rule spine + changelog + source-of-truth + old→new map + global rules)
  permission-matrix.md       ← capability → module → action/button (รวมทุก module, +3 module ใหม่)

  # System-wide / Governance (Non-Functional)
  non-functional.md          ← NFR รวม: perf/auth-session/audit/backup-infra/data-format/jobs J1–J7/noti/search/responsive/soft-delete/reliability
  deletion-policy.md         ← (folded) soft-delete/void baseline + entity เดิม + entity ใหม่ (Quotation/SO/FG Batch/OEM surplus/cost snapshot)

  # Platform & Navigation (Functional · ระบบ)
  platform.md                ← login local+Google · session 24h/06:00 · notification outbox+read-bit · global search · responsive+guard
  home.md                    ← task inbox ตามสิทธิ์ · quick actions · onboarding
  dashboard.md               ← 7 แผนก × 29 tile · event/state · date filter · drill · permission-based

  # Sales & Customer (Functional · งานขาย/Order)
  customer.md
  quotation.md               ← OEM Quotation (create/edit/convert-to-PO)
  po.md                      ← OEM Purchase Order
  so.md                      ← Own-Brand Sales Order (sell-from-stock + produce-to-stock)

  # Supply Planning & Production (Functional · ผลิต&คุณภาพ)
  bom.md                     ← BOM + other-cost + TYPE(OEM/FG) + Supply-Planning config
  supply-planning.md         ← Demand & Production Cover + FORMULA SUMMARY (Pond review)
  production.md              ← PRD/Batch + actual-qty/surplus + queue search/filter
  qc.md                      ← ตรวจ Batch/Lot · rework เฉพาะ line เสีย + feedback · GMP chain

  # Inventory & Procurement (Functional · คลัง&จัดซื้อ)
  stock.md                   ← RM + FG (per-Batch/FIFO) + ledger + loss/adjust/surplus + 3 ยอด
  goods-receipt.md           ← GR multi-line · gen Lot · ปิด/แตก PR auto · ชดเชยติดลบ+FIFO retro-link
  pr.md                      ← Purchase Request: auto/สร้างตรง · partial→PR ใหม่
  supplier.md                ← price matrix (max active→BOM) · Active/Inactive · snapshot
  return.md                  ← คืน RM: lot→supplier→ตัด stock + comment

  # Fulfilment & Finance (Functional · จัดส่ง&การเงิน)
  shipping.md                ← Shipment รอบ + DN 2 ชั้น · 1 DN=1 order · reconcile · driver/route/vehicle
  invoice.md                 ← ออกตั้งแต่ Confirmed · VAT effective date · overdue · ใบกำกับภาษีไทย · void

  # Governance (Functional · ระบบ)
  traceability.md            ← entity/field search · genealogy · audit table · QT head-of-chain · FG per-Batch
  settings.md                ← RUCDAA + Admin bit · user + bulk reassign · VAT · company · audit · +3 module ใหม่

  flows/
    oem-flow.md              ← end-to-end OEM (Quotation→PO→…→Invoice)
    ownbrand-flow.md         ← end-to-end Own-Brand (a sell-from-stock / b produce-to-stock)
```

HTML review view (Hub-styled, render จาก .md เหล่านี้):
`docs/design/erp-v2-ui-first/functional-spec/modules/index.html` (+ ราย module) — มีลิงก์จาก Document Hub (`functional-spec/index.html`). Hub จัด ① Functional / ② Non-Functional / ③ Architecture / ④ Mockups / ⑤ Archive.

---

## 2. D-Rule Spine (ยังคงเป็นแกน — พร้อม DELTA 2 จุดที่ปอนด์แก้ 2026-07-29)

D1–D18 ยังเป็นกฎแกน (ดูฉบับเต็ม `scope-oem-ownbrand-supply-planning.md` §1). **2 จุดที่อัปเดตในรอบนี้:**

### 2.1 ★ D8 (UPDATED 2026-07-29) — ปุ่ม "สั่งผลิต" ใน Supply Planning
- **เดิม (D8 v1):** กด "สั่งผลิต" → ระบบ **สร้าง PRD เก็บสต็อกไม่ผูกลูกค้า** เงียบ ๆ ทันที.
- **ใหม่ (D8 v2 — REFINED):** กด "สั่งผลิต" → **พาไปหน้า "สร้างใบสั่งขาย (Own-Brand) → (ข) ผลิตเก็บสต็อก (ไม่เลือกลูกค้า)" โดย PRE-FILL** จำนวน = Suggested + FG ที่เลือก → ผู้ใช้ทวน/ยืนยัน → จากนั้นจึงเข้าสาย production.
- **เหตุผล delta:** ให้ produce-to-stock มี **ที่มาเดียว** (หน้า SO produce-to-stock). แก้ปัญหา "PRD สองที่มา" (เดิม punch-list U4) ให้จบ.
- ผลกระทบ: ดู `supply-planning.md` §ปุ่มสั่งผลิต และ `so.md` (so-produce-to-stock).

### 2.2 ★ Credit Term (UPDATED 2026-07-29) — ระดับลูกค้ามี preset + default
- **เดิม:** credit ระดับลูกค้า + override รายใบแจ้งหนี้ (ไม่มี preset/ค่า default ระบุ).
- **ใหม่:** credit term **ระดับลูกค้า = 30 / 60 / 90 วัน · DEFAULT = 60** · **per-invoice override ยังทำได้เหมือนเดิม** (ยึด effective ตาม invoice date สำหรับ overdue).
- ผลกระทบ: ดู `customer.md` · `po.md`/`so.md` · **`invoice.md`** (ตัวอย่างเดิม "30 วัน" → ใช้ default 60) · entity-status-map §1.3.

> D1–D7, D9–D18 **ไม่เปลี่ยน**. อ้างถึงตามเลขเดิมทั้งเอกสารชุดนี้.

---

## 3. GLOBAL Rules (บังคับทุก module — ปอนด์สั่ง 2026-07-29)

| # | กติกา | รายละเอียด |
|---|---|---|
| **G1 Pagination** | list/history ทุกอัน **default 20 แถว/หน้า + pagination** | ใช้กับทุก list เอกสาร + drill-down dashboard + ledger + audit + noti "ดูทั้งหมด" |
| **G2 Date-range search** | ค้นได้ทั้ง **เลขเอกสาร** หรือ **ช่วงวันที่สร้าง** | quotation/PO/SO/GR/PR/invoice/shipping list + production queue + audit |
| **G3 Drill + back คงสถานะ** | คลิกเข้า detail แล้วกลับ **ไม่เสีย state เดิม** (filter/scroll/tab) | dashboard drill · customer detail จาก order = modal dialog |
| **G4 Customer search dropdown** | ใช้บน quotation-create / po-create / so-create | ค้นด้วยเบอร์/ชื่อบริษัท/ชื่อผู้ติดต่อ/เบอร์ผู้ติดต่อ · แสดงสถานะ+credit term · modal detail กลับได้ |
| **G5 Permission-per-action** | ทุกปุ่ม/control ที่ทำงานได้ ต้องระบุ capability/permission ที่ต้องมี | ตาราง permission→action ต่อ module · รวมที่ `permission-matrix.md` |

> G1–G5 ระบุซ้ำในแต่ละ module (หัวข้อ "Pagination / Search" และ "Actions & Permissions") เพื่อให้ module ยืนได้ด้วยตัวเอง. **NFR ระดับระบบ** (perf/auth/audit/format/jobs ฯลฯ) รวมที่ `non-functional.md`.

---

## 4. Confirmations ที่ปอนด์สั่งให้ยืนยัน (RESOLVED จากกฎที่ล็อก — ไม่ใช่การเดา)

| หัวข้อ | คำตัดสิน (อ้างกฎ) | เอกสาร |
|---|---|---|
| **Convert-to-PO** (จาก Quotation edit) | กด "Convert to PO" → QT = ตกลง (Agreed, immutable) + เก็บลิงก์ QT↔PO → เปิด po-create prefill → บันทึก = PO เลขใหม่ (D18) | `quotation.md` · `flows/oem-flow.md` |
| **SO (ก) ขายจากสต็อก** | จอง FG (per-Batch) + SO=พร้อมส่ง → รอโมดูลจัดส่ง → ตัด FG FIFO ตอน dispatch → DN/Invoice (D2-a/D12/D16) | `so.md` · `shipping.md` · `flows/ownbrand-flow.md` |
| **SO (ข) ผลิตเก็บสต็อก** (ไม่เลือกลูกค้า) | BOM RM check → production; RM ขาด → auto-open PR; QC ผ่าน → FG เข้าคลัง → ขายภายหลังผ่าน (ก) (D2-b/D8-v2/D12) | `so.md` · `flows/ownbrand-flow.md` |

**หมายเหตุความต่าง (สำคัญ):** Quotation ทำ material check แต่ **ไม่ auto-open PR** (ต่างจาก PO/SO-produce-to-stock ที่ auto-open PR).

---

## 5. ★ Source-of-Truth Statement (ประกาศชัด)

1. **`docs/requirements/erp-v2-ui-first/modules/*.md` คือ AUTHORITATIVE spec ปัจจุบันของทุก module + NFR + Deletion Policy** — ชุดเดียวที่ BA/QA/Tech-Lead ต้องยึด.
2. แต่ละ .md เป็น **spec เต็ม** (existing-good absorbed + delta ใหม่) ไม่ใช่แค่ส่วนที่เปลี่ยน. **`non-functional.md` = NFR authoritative · `deletion-policy.md` = deletion authoritative** (fold + entity ใหม่).
3. **เอกสารเก่ากระจัดกระจาย** (functional-spec module pages + cross-cutting + **root `deletion-policy.md`**) = **historical reference** — ไม่ลบทิ้ง แต่ **ไม่ใช่แหล่งความจริงหลักอีกต่อไป**; ถ้าขัดกัน ให้ยึด per-module ชุดนี้. ใน Document Hub เอกสารเหล่านี้ถูกย้ายไป **หมวด ⑤ Archive (collapsed)** ออกจากเส้นทางหลัก.
4. **หลักการ/กติกาลึกที่ยังถูกต้อง (ไม่ซ้ำซ้อน) ยังใช้ได้ (per-module อ้างอิง ไม่ทำสำเนา):** `entity-status-map.md`, `status-journeys.md`, `stock-reservation.md`, `scope-oem-ownbrand-supply-planning.md` (D1–D18), `mock-data-spec.md`, `brief.md`, ADR-000..009, `scheduled-jobs.html`, `rtm`, `glossary`, `continuity`, `list-conventions` — เพื่อไม่ให้มี "2 ความจริง". ใน Hub รวมเป็นแถบ **"อ้างอิงเชิงลึก (reference)"** ในหมวด ① (ติดป้าย reference ชัด, ไม่ใช่ spec แข่ง). *(หมายเหตุ: กติกาลบ + NFR ที่เคยกระจายในเอกสารเหล่านี้ ถูก fold เข้า `deletion-policy.md`/`non-functional.md` แล้ว — ให้ยึด 2 ไฟล์นี้.)*
5. **RTM/Traceability คงครบ:** ทุก story/AC ยัง map → module + mockup + journey (ดู `traceability.md` + rtm).
6. **Navigation IA (Document Hub, 2026-07-29):** ① **Functional** (จัดตามแถบเมนูแอป: งานขาย/Order · คลัง&จัดซื้อ · ผลิต&คุณภาพ · จัดส่ง&การเงิน · ระบบ + flows + permission + reference band) · ② **Non-Functional** (`non-functional.md` + `deletion-policy.md`) · ③ Architecture · ④ Mockups · ⑤ 🗄 Archive (superseded, collapsed). **หมวด ①/② ลิงก์เฉพาะภายในแพ็กเกจ — ไม่เด้งเข้าไปหน้าเก่า.** modules/index.html สะท้อนโครงเดียวกัน.

---

## 6. ★ Map: เอกสารเก่า → ครอบคลุมโดย module ใด (old doc → now covered by)

| เอกสารเก่า (functional-spec / cross-cutting / principle) | ครอบคลุมโดย module (authoritative) | หมายเหตุ |
|---|---|---|
| `functional-spec/home.html` (US-HOME-01..03) | **home.md** | absorbed เต็ม · เก่าอยู่ Archive |
| `functional-spec/dashboard.html` (US-DSH-01..04 + 7 dept, 29 tile) | **dashboard.md** | absorbed เต็ม (event/state, สูตร tile) |
| `functional-spec/platform.html` (US-PLT-01..05) | **platform.md** | login/noti/search/session/responsive |
| `functional-spec/stock.html` (US-STK-01..06) | **stock.md** (ยอด/ledger) + **goods-receipt.md** (GR) | GR-specific แยกเป็น module |
| `functional-spec/purchase-request.html` (US-PR-01..03) | **pr.md** | absorbed เต็ม |
| `functional-spec/supplier.html` (US-SUP-01..03) | **supplier.md** | price matrix/snapshot/active |
| `functional-spec/qc.html` (US-QC-01..03) | **qc.md** | Batch/Lot decision |
| `functional-spec/shipping.html` (US-SHP-01..03) | **shipping.md** | +รองรับ SO |
| `functional-spec/return.html` (US-RET-01) | **return.md** | absorbed เต็ม |
| `functional-spec/invoice.html` (US-INV-01..04) | **invoice.md** | +credit reconcile 30→def 60 · +SO |
| `functional-spec/traceability.html` (US-TRC-01..03) | **traceability.md** | +QT head · +SO entity · +FG per-Batch |
| `functional-spec/settings.html` (US-SET-01..05) | **settings.md** | +RUCDAA row Quotation/SO/Supply-Planning |
| `functional-spec/customer.html` (US-CUS-01..04) | **customer.md** | TYPE/credit/history/dropdown |
| `functional-spec/po.html` · `production.html` · `bom.html` | **po.md · production.md · bom.md** | reserve/consume/surplus · queue/actual · cost/TYPE/planning |
| `list-conventions.html` (US-LST-01) | **G1–G3 (README §3)** + Pagination/Search ของทุก module (ยังเป็น reference) | มาตรฐาน list |
| `continuity.html` (cascade + noti matrix) | **platform.md** (noti) + cross-links ทุก module (ยังเป็น reference) | cascade reference |
| **`brief.md` §5/§8 (NFR) · ADR-000..009 · `scheduled-jobs.html` (J1–J7) · entity-status-map §1.6 · stock-reservation** | **non-functional.md** | NFR รวม+อัปเดต scope ใหม่ |
| **root `deletion-policy.md` (7 กติกา) · `rbac-deletion.html` (deletion ส่วน)** | **deletion-policy.md** (folded) + **settings.md**/**permission-matrix.md** (สิทธิ์) | fold เดิม + เพิ่ม entity ใหม่ |

> Visual punch-list เดิม **U1/U2/U3/U5/U6** = **ยังค้าง เป็นงาน UX/UI** (ไม่ใช่ business-gap). **U4 = ปิดแล้ว** (D8 v2).
> **Archive (Document Hub ⑤):** functional-spec module pages (16), `rbac-deletion.html`, root `docs/deletion-policy.html`, `docs/po-reviews.html` — collapsed, ติดป้าย superseded, ไม่อยู่เส้นทางหลัก.

---

## 7. Changelog — เอกสารเก่าที่ถูก supersede / แก้ / ลบ

> หลักการ: ไม่ลบไฟล์ต้นทางทิ้ง แต่ **ประกาศชัดว่าเนื้อหาส่วนใดถูกแทนที่** ด้วย per-module ชุดนี้.

| เอกสารเดิม | สถานะ | เหตุผล / สิ่งที่ถูกแทน |
|---|---|---|
| functional-spec module pages (16 หน้า) | **superseded (Archive)** | absorbed เข้าราย module .md (ดู map §6) |
| **root `deletion-policy.md`** | **superseded (Archive)** | fold + updated → `modules/deletion-policy.md` |
| **NFR ที่กระจายใน brief/ADR/scheduled-jobs** | **consolidated** | รวม+อัปเดต → `modules/non-functional.md` (คงแหล่ง principle ไว้อ้างอิง) |
| `scope-oem-ownbrand-supply-planning.md` | **ยังใช้ (rule spine)** แต่ **D8 + credit default override** | D8 v1→v2 · credit preset 30/60/90 default 60 · D1–D7/D9–D18 คงเดิม |
| `po-e2e-review-oem-ownbrand.md` §2 punch-list **U4** | **RESOLVED / ปิด** | D8 v2 |
| `stock-reservation.md` §3 "จุดตัดจริง 2 ทางเลือก" | **ปิดคำถาม (ยึด Option A)** | ตัดจริงตอน "เริ่มผลิต" |
| "credit ระดับลูกค้า (ไม่มี preset)" + invoice "เครดิต 30 วัน" | **แก้** | preset 30/60/90 default 60 |
| ข้อความ "ปุ่มสั่งผลิต = สร้าง PRD ทันที" | **ลบ/แก้** | D8 v2 (prefill SO produce-to-stock) |

---

## 8. งานส่งต่อ UX/UI (สรุป — รายละเอียดในแต่ละ module)

**เพิ่ม/แก้ mockup ที่ต้องทำ (จาก delta ใหม่ + punch-list เดิมที่ยังค้าง U1/U2/U3/U5/U6):**
1. **customer-*** — TYPE (OEM/Own-Brand, both), credit preset 30/60/90 default 60, management-history section เดียว, QT/PO history (search/paginate/drill-back).
2. **quotation-create/edit** — customer dropdown, material check (ไม่ auto-PR), ปุ่ม "บันทึก" + print-ready, Convert to PO (prefill), ปุ่มยกเลิก QT (void — ดู deletion §5).
3. **po-create / so-*** — customer dropdown, reserve/auto-PR, (ก) ยืนยันจอง FG→Ready to Ship, (ข) BOM check + auto-PR + prefill จาก Supply Planning.
4. **stock / goods-receipt / return** — FG adjust ตรง (เหตุผล+ledger), RM ledger/loss form (U2), surplus batch identity (U6), GR ชดเชยติดลบ notice, return lot→supplier.
5. **bom-create** — ต้นทุนอื่น per-unit + รวม, TYPE selector, planning config fields.
6. **production** — queue search/filter OEM vs Own-Brand + actual/surplus (U1/U5).
7. **supply-planning** — search/filter Low/OK/Overstock, edit rates→save BOM, ปุ่มสั่งผลิต→prefill SO (D8 v2).
8. **dashboard / home / platform** — 29 tile event/state + date filter + drill; task inbox; noti panel/badge/search/session warning (06:00); responsive.
9. **qc / shipping / invoice / traceability / settings** — Batch/Lot decision + feedback; Shipment/DN 2 ชั้น (รองรับ SO); invoice ตั้งแต่ Confirmed + VAT + void; genealogy+audit; RUCDAA 5 หน้าจอ (+3 module ใหม่).
10. **pagination/search + customer dropdown component** — global (G1–G4) reuse ทุกหน้า.

> ทุกจุดอ้าง D-rule / global rule / NFR ที่ล็อกแล้ว — **zero guessing**. Gate 1 ให้ปอนด์รีวิว "เฉพาะส่วนที่แก้".

---

## 9. Open questions (non-blocking — มี default ปลอดภัยแล้ว)
**ไม่มี business/NFR-gap ที่บล็อก.** Requirement + NFR เดิมทั้งหมด absorb/consolidate ครบ; delta ใหม่ derive จากกฎที่ล็อก. มี **2 confirm แบบไม่บล็อก** ให้ปอนด์ (default ใช้ค่าที่ปลอดภัยไปก่อน):
- **NFR — Supply Planning proactive alert:** ปัจจุบัน "Low/ใกล้หมด" เป็น state tile (on-read) ไม่ยิง noti เอง; ต้องการเพิ่ม **scheduled job แจ้งเตือนเชิงรุก** เมื่อ FG cover < safety หรือไม่? (default = คง on-read ไม่มี job ใหม่ — `non-functional.md` §6.1/§12).
- **Deletion — QT abandon:** QT ที่ยังไม่ Agreed (Draft/Sent) ถูกทิ้ง → default = **void-only คง gapless**; รอปอนด์ยืนยัน/override (ตัวเลือก ก/ข/ค ใน `deletion-policy.md` §5).

สิ่งที่ปอนด์ควร sanity-check ตอน Gate 1 (ยืนยันหน้าตา): (a) BOM TYPE selector "OEM / FG" + planning config เฉพาะ FG; (b) customer TYPE mismatch = เตือนไม่บล็อก. → **READY_FOR_UX_UI** (mockups ทำต่อ parallel).
