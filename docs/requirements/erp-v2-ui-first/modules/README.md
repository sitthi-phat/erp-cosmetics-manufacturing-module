# Requirement Package (Per-Module) — ESSENCE Hub System

slug: `erp-v2-ui-first` · เขียนโดย PO · 2026-07-29 · **CANONICAL & COMPLETE SINGLE SOURCE OF TRUTH** สำหรับ BA / QA / Tech-Lead
สถานะ: consolidation ของ requirement ที่กระจัดกระจาย → per-module ที่โครงสร้างสม่ำเสมอ **ครบทุก module** (existing-good absorb + delta ใหม่) · reconciled กับ D1–D18 + fold คำสั่งใหม่ของปอนด์ (2026-07-29)

## สรุปภาษาไทย
เอกสารชุดนี้คือ **แหล่งความจริงล่าสุดแบบราย module ที่ครบถ้วน (single source of truth)** ของทั้งระบบ ESSENCE Hub — ทุก module มี .md ที่เป็น **spec ปัจจุบันเต็ม** (requirement เดิมที่ดีอยู่แล้ว + ของใหม่ รวมเข้าด้วยกัน ไม่ใช่แค่ส่วน delta). รอบนี้ **absorb** requirement เดิมจาก functional-spec (BA user-stories/AC), cross-cutting docs, entity-status-map, status-journeys, stock-reservation, deletion-policy ฯลฯ เข้ามาเป็น per-module ที่เดียว. เพิ่ม module ที่ยังขาด: Platform · Home · Dashboard · Goods-Receipt · PR · Supplier · QC · Shipping · Return · Invoice · Traceability · Settings (รวมกับเดิม customer/quotation/po/so/stock/bom/production/supply-planning = ครบ). ฝังกฎ D1–D18, ของใหม่ปอนด์ (customer TYPE + credit 30/60/90 default 60, customer dropdown, pagination 20, date-range search, drill+back, permission-per-action, BOM TYPE + planning config, FG adjust, Supply Planning + ปุ่มสั่งผลิต D8 v2), และแก้/ลบกติกาเก่าที่ผิด (D8 เดิม, credit default, invoice ตัวอย่างเครดิต 30). **แพ็กเกจ modules/ นี้ supersede** functional-spec module pages เดิม (ยังเก็บไว้เป็น historical reference). **ไม่มี business-gap ค้าง → READY_FOR_UX_UI** (mockup ทำต่อ parallel).

---

## 1. โครงไฟล์ (file tree — ครบทั้งชุด)

```
docs/requirements/erp-v2-ui-first/modules/
  README.md                  ← ไฟล์นี้ (index + D-rule spine + changelog + source-of-truth + old→new map + global rules)
  permission-matrix.md       ← capability → module → action/button (รวมทุก module, +3 module ใหม่)

  # Platform & Navigation (ใหม่)
  platform.md                ← login local+Google · session 24h/06:00 · notification outbox+read-bit · global search · responsive+guard
  home.md                    ← task inbox ตามสิทธิ์ · quick actions · onboarding
  dashboard.md               ← 7 แผนก × 29 tile · event/state · date filter · drill · permission-based

  # Sales & Customer (OEM / Own-Brand)
  customer.md
  quotation.md               ← OEM Quotation (create/edit/convert-to-PO)
  po.md                      ← OEM Purchase Order
  so.md                      ← Own-Brand Sales Order (sell-from-stock + produce-to-stock)

  # Supply Planning & Production
  bom.md                     ← BOM + other-cost + TYPE(OEM/FG) + Supply-Planning config
  supply-planning.md         ← Demand & Production Cover + FORMULA SUMMARY (Pond review)
  production.md              ← PRD/Batch + actual-qty/surplus + queue search/filter
  qc.md                      ← (ใหม่) ตรวจ Batch/Lot · rework เฉพาะ line เสีย + feedback · GMP chain

  # Inventory & Procurement
  stock.md                   ← RM + FG (per-Batch/FIFO) + ledger + loss/adjust/surplus + 3 ยอด
  goods-receipt.md           ← (ใหม่) GR multi-line · gen Lot · ปิด/แตก PR auto · ชดเชยติดลบ+FIFO retro-link
  pr.md                      ← (ใหม่) Purchase Request: auto/สร้างตรง · partial→PR ใหม่
  supplier.md                ← (ใหม่) price matrix (max active→BOM) · Active/Inactive · snapshot
  return.md                  ← (ใหม่) คืน RM: lot→supplier→ตัด stock + comment

  # Fulfilment & Finance
  shipping.md                ← (ใหม่) Shipment รอบ + DN 2 ชั้น · 1 DN=1 order · reconcile · driver/route/vehicle
  invoice.md                 ← (ใหม่) ออกตั้งแต่ Confirmed · VAT effective date · overdue · ใบกำกับภาษีไทย · void

  # Governance
  traceability.md            ← (ใหม่) entity/field search · genealogy · audit table · QT head-of-chain · FG per-Batch
  settings.md                ← (ใหม่) RUCDAA + Admin bit · user + bulk reassign · VAT · company · audit · +3 module ใหม่

  flows/
    oem-flow.md              ← end-to-end OEM (Quotation→PO→…→Invoice)
    ownbrand-flow.md         ← end-to-end Own-Brand (a sell-from-stock / b produce-to-stock)
```

HTML review view (Hub-styled, render จาก .md เหล่านี้):
`docs/design/erp-v2-ui-first/functional-spec/modules/index.html` (+ ราย module) — มีลิงก์จาก Document Hub (`functional-spec/index.html`).

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
- ผลกระทบ: ดู `customer.md` · `po.md`/`so.md` (แสดง credit term ตอนเลือกลูกค้า) · **`invoice.md`** (ตัวอย่างเดิม "30 วัน" → ใช้ default 60) · entity-status-map §1.3.

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

> G1–G5 ระบุซ้ำในแต่ละ module (หัวข้อ "Pagination / Search" และ "Actions & Permissions") เพื่อให้ module ยืนได้ด้วยตัวเอง.

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

1. **`docs/requirements/erp-v2-ui-first/modules/*.md` คือ AUTHORITATIVE spec ปัจจุบันของทุก module** — เป็นชุดเดียวที่ BA/QA/Tech-Lead ต้องยึดสำหรับเนื้อหา requirement.
2. แต่ละ module .md เป็น **spec เต็ม** (existing-good absorbed + delta ใหม่) ไม่ใช่แค่ส่วนที่เปลี่ยน.
3. **เอกสารเก่ากระจัดกระจาย (functional-spec module pages + cross-cutting) = historical reference** — ไม่ลบทิ้ง (เก็บ audit/ที่มา) แต่ **ไม่ใช่แหล่งความจริงหลักอีกต่อไป**; ถ้าขัดกัน ให้ยึด per-module ชุดนี้.
4. **หลักการ/กติกาลึก** ที่ยังเป็นแหล่งอ้างอิงที่ถูกต้อง (ไม่ซ้ำซ้อน) ยังใช้ได้: `entity-status-map.md`, `status-journeys.md`, `deletion-policy.md`, `stock-reservation.md`, `scope-oem-ownbrand-supply-planning.md` (D1–D18), `mock-data-spec.md`, `brief.md`, `rtm` — per-module docs **อ้างอิง** เอกสารเหล่านี้ (ไม่ทำสำเนากติกาซ้ำ) เพื่อไม่ให้มี "2 ความจริง".
5. **RTM/Traceability คงครบ:** ทุก story/AC ยัง map → module + mockup + journey (ดู `traceability.md` + rtm).

---

## 6. ★ Map: เอกสารเก่า → ครอบคลุมโดย module ใด (old doc → now covered by)

| เอกสารเก่า (functional-spec / cross-cutting) | ครอบคลุมโดย module (authoritative) | หมายเหตุ |
|---|---|---|
| `functional-spec/home.html` (US-HOME-01..03) | **home.md** | absorbed เต็ม |
| `functional-spec/dashboard.html` (US-DSH-01..04 + 7 dept, 29 tile) | **dashboard.md** | absorbed เต็ม (event/state, สูตร tile) |
| `functional-spec/platform.html` (US-PLT-01..05) | **platform.md** | login/noti/search/session/responsive |
| `functional-spec/stock.html` (US-STK-01..06) | **stock.md** (ยอด/ledger) + **goods-receipt.md** (GR) | GR-specific แยกเป็น module ตาม module list |
| `functional-spec/purchase-request.html` (US-PR-01..03) | **pr.md** | absorbed เต็ม |
| `functional-spec/supplier.html` (US-SUP-01..03) | **supplier.md** | price matrix/snapshot/active |
| `functional-spec/qc.html` (US-QC-01..03) | **qc.md** | Batch/Lot decision |
| `functional-spec/shipping.html` (US-SHP-01..03) | **shipping.md** | +รองรับ SO (Own-Brand) |
| `functional-spec/return.html` (US-RET-01) | **return.md** | absorbed เต็ม |
| `functional-spec/invoice.html` (US-INV-01..04) | **invoice.md** | +credit reconcile 30→default 60 · +SO |
| `functional-spec/traceability.html` (US-TRC-01..03) | **traceability.md** | +QT head-of-chain · +SO entity · +FG per-Batch |
| `functional-spec/settings.html` (US-SET-01..05) | **settings.md** | +RUCDAA row Quotation/SO/Supply-Planning |
| `functional-spec/customer.html` (US-CUS-01..04) | **customer.md** | TYPE/credit/history/dropdown |
| `functional-spec/po.html` (US-PO-01..07) | **po.md** | reserve/consume/surplus/2 ราง |
| `functional-spec/production.html` (US-PRD-01..06) | **production.md** | queue/actual/surplus |
| `functional-spec/bom.html` (US-BOM-01..02) | **bom.md** | cost/TYPE/planning config |
| `rbac-deletion.html` (RUCDAA + deletion) | **settings.md** + **permission-matrix.md** (+ deletion-policy อ้างอิง) | สิทธิ์/ลบ |
| `list-conventions.html` (US-LST-01) | **G1–G3 (README §3)** + Pagination/Search ของทุก module | มาตรฐาน list |
| `continuity.html` (cascade + noti matrix) | **platform.md** (noti) + cross-links ของทุก module | ยังใช้เป็น cascade reference |

> Visual punch-list เดิม **U1/U2/U3/U5/U6** (จาก `po-e2e-review-oem-ownbrand.md` §2) = **ยังค้าง เป็นงาน UX/UI** (ไม่ใช่ business-gap). **U4 = ปิดแล้ว** (D8 v2).

---

## 7. Changelog — เอกสารเก่าที่ถูก supersede / แก้ / ลบ

> หลักการ: ไม่ลบไฟล์ต้นทางทิ้ง (ยังเป็นประวัติ/audit) แต่ **ประกาศชัดว่าเนื้อหาส่วนใดถูกแทนที่** ด้วย per-module ชุดนี้ เพื่อไม่ให้มี "2 ความจริง".

| เอกสารเดิม | สถานะ | เหตุผล / สิ่งที่ถูกแทน |
|---|---|---|
| functional-spec module pages (home/dashboard/platform/stock/pr/supplier/qc/shipping/return/invoice/traceability/settings/customer/po/production/bom) | **superseded (historical ref)** | absorbed เข้าราย module .md ชุดนี้ (ดู map §6) — ยึด per-module เป็นหลัก |
| `scope-oem-ownbrand-supply-planning.md` | **ยังใช้ (rule spine)** แต่ **D8 + credit default ถูก override** โดย §2 | D8 v1→v2 · credit preset 30/60/90 default 60 · D1–D7/D9–D18 คงเดิม |
| `po-e2e-review-oem-ownbrand.md` §2 punch-list **U4** | **RESOLVED / ปิด** | D8 v2 ทำให้ produce-to-stock มีที่มาเดียว |
| `stock-reservation.md` §3 "จุดตัดจริง 2 ทางเลือก" | **ปิดคำถาม (ยึด Option A)** | ตัดจริงตอน "เริ่มผลิต" (Q1=A; Q2–Q5 ยึด default PO แนะนำ) |
| "credit ระดับลูกค้า (ไม่มี preset)" ทุกที่ + invoice "เครดิต 30 วัน" | **แก้** | ใช้ preset 30/60/90 default 60 (customer.md/invoice.md) |
| ข้อความ "ปุ่มสั่งผลิต = สร้าง PRD ทันที" | **ลบ/แก้** | แทนด้วย D8 v2 (prefill SO produce-to-stock) |

---

## 8. งานส่งต่อ UX/UI (สรุป — รายละเอียดในแต่ละ module)

**เพิ่ม/แก้ mockup ที่ต้องทำ (จาก delta ใหม่ + punch-list เดิมที่ยังค้าง U1/U2/U3/U5/U6):**
1. **customer-*** — TYPE (OEM/Own-Brand, both), credit preset 30/60/90 default 60, management-history section เดียว, QT/PO history (search/paginate/drill-back).
2. **quotation-create/edit** — customer dropdown, material check (ไม่ auto-PR), ปุ่ม "บันทึก" + print-ready, Convert to PO (prefill).
3. **po-create / so-*** — customer dropdown, reserve/auto-PR, (ก) ยืนยันจอง FG→Ready to Ship, (ข) BOM check + auto-PR + prefill จาก Supply Planning.
4. **stock / goods-receipt / return** — FG adjust ตรง (เหตุผล+ledger), RM ledger/loss form (U2), surplus batch identity (U6), GR ชดเชยติดลบ notice, return lot→supplier.
5. **bom-create** — ต้นทุนอื่น per-unit + รวม, TYPE selector, planning config fields.
6. **production** — queue search/filter OEM vs Own-Brand + actual/surplus (U1/U5).
7. **supply-planning** — search/filter Low/OK/Overstock, edit rates→save BOM, ปุ่มสั่งผลิต→prefill SO (D8 v2).
8. **dashboard / home / platform** — 29 tile event/state + date filter + drill; task inbox; noti panel/badge/search/session warning; responsive.
9. **qc / shipping / invoice / traceability / settings** — Batch/Lot decision + feedback; Shipment/DN 2 ชั้น (รองรับ SO); invoice ตั้งแต่ Confirmed + VAT + void; genealogy+audit; RUCDAA 5 หน้าจอ (+3 module ใหม่).
10. **pagination/search + customer dropdown component** — global (G1–G4) reuse ทุกหน้า.

> ทุกจุดอ้าง D-rule / global rule ที่ล็อกแล้ว — **zero guessing**. Gate 1 ให้ปอนด์รีวิว "เฉพาะส่วนที่แก้".

---

## 9. Open questions
**ไม่มี business-gap ค้าง.** Requirement เดิมทั้งหมด absorb ครบ (map §6), delta ใหม่ derive จากกฎ/หลักการที่ล็อกแล้ว (warning-not-block, Supply-Planning-เฉพาะ-Own-Brand-FG, RUCDAA generic, credit default 60, D8 v2). Confirmations ทั้ง 3 resolved จากกฎที่ล็อก.
สิ่งที่ปอนด์ควร sanity-check ตอน Gate 1 (ไม่ block — ยืนยันหน้าตา): (a) BOM TYPE selector "OEM / FG" + planning config เฉพาะ FG; (b) customer TYPE mismatch = เตือนไม่บล็อก. → **READY_FOR_UX_UI** (mockups ทำต่อ parallel).
