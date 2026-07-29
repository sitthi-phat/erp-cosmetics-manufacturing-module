# Requirement Package (Per-Module) — ESSENCE Hub System

slug: `erp-v2-ui-first` · เขียนโดย PO · 2026-07-29 · **CANONICAL & COMPLETE SINGLE SOURCE OF TRUTH** สำหรับ BA / QA / Tech-Lead
สถานะ: consolidation ของ requirement ที่กระจัดกระจาย → per-module ที่โครงสร้างสม่ำเสมอ **ครบทุก module + NFR + Deletion Policy** (existing-good absorb + delta ใหม่) · reconciled กับ D1–D18 + fold คำสั่งใหม่ของปอนด์ (2026-07-29)

## สรุปภาษาไทย
เอกสารชุดนี้คือ **แหล่งความจริงล่าสุดแบบราย module ที่ครบถ้วน (single source of truth)** ของทั้งระบบ ESSENCE Hub — ทุก module มี .md ที่เป็น **spec ปัจจุบันเต็ม**. Document Hub จัดเป็น **① Functional** (จัดตามแถบเมนูแอป) · **② Non-Functional** (`non-functional.md` + `deletion-policy.md` + **`traceability.md` = พื้นผิว trace/audit governance**) · **③ Reference** (เอกสารหลักการที่ยังใช้ได้) · ④ Architecture · ⑤ Mockups · **⑥ Archive (หน้าเก่า superseded, collapsed)** — หมวด ①/②/③ ลิงก์เฉพาะภายในแพ็กเกจ/reference ไม่เด้งออกไปหน้าเก่า. **★ ปอนด์เคาะ 4 ข้อ (2026-07-29) — ปิดคำถามค้างทั้งหมด:** (1) traceability → Non-Functional, (2) Reference เป็นหมวดของตัวเอง, (3) **Supply Planning แจ้งเตือน Low เชิงรุก** (real-time + J8 digest, แนบ Suggested), (4) **Quotation ยกเลิกได้ทุกสถานะ** (PO loose reference, no cascade, activity-log). **ไม่มี open question ค้าง → READY_FOR_UX_UI** (mockup ทำต่อ parallel; มี UI follow-up เล็ก ๆ = SP Low bell/badge + noti entry).

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
  customer.md
  quotation.md               ← OEM Quotation (create/edit/convert-to-PO) · ★ ยกเลิกได้ทุกสถานะ (loose ref, no cascade)
  po.md                      ← OEM Purchase Order
  so.md                      ← Own-Brand Sales Order (sell-from-stock + produce-to-stock)

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

> D1–D7, D9–D18 **ไม่เปลี่ยน**.

---

## 3. GLOBAL Rules (บังคับทุก module — ปอนด์สั่ง 2026-07-29)

| # | กติกา | รายละเอียด |
|---|---|---|
| **G1 Pagination** | list/history ทุกอัน **20 แถว/หน้า + pagination** | ทุก list + drill dashboard + ledger + audit + noti "ดูทั้งหมด" |
| **G2 Date-range search** | ค้น **เลขเอกสาร** หรือ **ช่วงวันที่สร้าง** | quotation/PO/SO/GR/PR/invoice/shipping list + production queue + audit |
| **G3 Drill + back คงสถานะ** | กลับ **ไม่เสีย state เดิม** | dashboard drill · customer detail จาก order = modal |
| **G4 Customer search dropdown** | quotation/po/so-create | ค้นเบอร์/บริษัท/ผู้ติดต่อ · แสดงสถานะ+credit term · modal detail |
| **G5 Permission-per-action** | ทุกปุ่มระบุ capability | `permission-matrix.md` |

> NFR ระดับระบบ (perf/auth/audit/format/jobs) รวมที่ `non-functional.md`.

---

## 4. Confirmations ที่ปอนด์สั่งให้ยืนยัน (RESOLVED)

| หัวข้อ | คำตัดสิน | เอกสาร |
|---|---|---|
| **Convert-to-PO** | QT = Agreed (immutable) + **loose link** QT↔PO → po-create prefill → PO เลขใหม่ (D18) | `quotation.md` · oem-flow |
| **SO (ก) ขายจากสต็อก** | จอง FG → พร้อมส่ง → ตัด FG FIFO ตอน dispatch → DN/Invoice | `so.md` · `shipping.md` |
| **SO (ข) ผลิตเก็บสต็อก** | BOM check → production; RM ขาด auto-PR; QC ผ่าน → FG เข้าคลัง | `so.md` |

**หมายเหตุ:** Quotation ทำ material check แต่ **ไม่ auto-open PR**.

---

## 5. ★ Source-of-Truth Statement (ประกาศชัด)

1. **`modules/*.md` = AUTHORITATIVE spec ปัจจุบันของทุก module + NFR + Deletion Policy + Traceability** — ชุดเดียวที่ BA/QA/TL ยึด.
2. แต่ละ .md เป็น **spec เต็ม**. `non-functional.md` = NFR authoritative · `deletion-policy.md` = deletion authoritative · `traceability.md` = trace/audit governance (Hub จัดใน ② Non-Functional).
3. **เอกสารเก่า** (functional-spec module pages + cross-cutting + root `deletion-policy.md`) = **historical reference** → ย้ายไป **Hub ⑥ Archive (collapsed)** ออกจากเส้นทางหลัก.
4. **เอกสารหลักการเชิงลึก** (`entity-status-map`, `status-journeys`, `stock-reservation`, `scope` D1–D18, `mock-data-spec`, `brief`, ADRs, `scheduled-jobs`, `rtm`, `glossary`, `continuity`, `list-conventions`) = **authoritative reference** → รวมเป็น **Hub ③ Reference (หมวดของตัวเอง)**, ติดป้าย "reference" ชัด (ไม่ใช่ spec แข่ง). per-module docs อ้างอิง ไม่ทำสำเนา.
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
| **★ Quotation cancellation** | **DECIDED 2026-07-29** | **ยกเลิกได้ทุกสถานะ** (Draft/Sent/Agreed/Rejected) · PO = **loose reference** เท่านั้น · ยกเลิก QT **ไม่ cascade** ไป PO · บันทึก **activity-log** + gapless (ไม่ hard-delete). แทน default เดิม "void-only". อัปเดต `quotation.md` §4/§7/§8 + `deletion-policy.md` §2.9/matrix. **ปิด parked question** |
| `scope-…` D8/credit · U4 · stock-reservation Q1 | คงตามรอบก่อน | D8 v2 · credit 60 · Option A |

---

## 8. งานส่งต่อ UX/UI (สรุป)

**punch-list เดิม U1/U2/U3/U5/U6 (ยังค้าง) + delta:** customer TYPE/credit/history · quotation dropdown/no-auto-PR/print-ready/Convert/**ปุ่มยกเลิก QT** · po/so dropdown+reserve+auto-PR · stock/GR/return (FG adjust, ledger/loss, surplus identity, negative notice) · bom cost/TYPE/planning · production queue/actual/surplus · **supply-planning: filter Low/OK/Overstock + edit→save + สั่งผลิต + ★ Low bell/badge + noti entry (แนบ Suggested)** · dashboard/home/platform (29 tile, task inbox, noti panel +FG→Low, session warning) · qc/shipping/invoice/traceability/settings · pagination/search + customer dropdown component.

> UI follow-up ใหม่รอบนี้ (ยังไม่แก้ mockup): **(a)** SP Low bell/badge บนหัว supply-planning · **(b)** รายการ noti "FG {name} → Low · ควรผลิต {Suggested}" (deep-link) · **(c)** ปุ่ม/สถานะ "ยกเลิก" บน quotation-detail (ทุกสถานะ). ทุกจุดอ้าง rule ที่ล็อกแล้ว — zero guessing.

---

## 9. Open questions
**ไม่มี open question ค้าง — ปิดครบ.** ทั้ง 2 คำถามที่เคย parked ถูกปอนด์ตัดสินแล้ว (2026-07-29):
- **Supply Planning proactive alert → DECIDED:** real-time + J8 daily digest (แนบ Suggested) — `non-functional.md` §6.1/§6(J8)/§7, `supply-planning.md` §5.1, `platform.md` §7/§9.
- **Quotation abandon → DECIDED:** ยกเลิกได้ทุกสถานะ + PO loose reference + no cascade + activity-log — `deletion-policy.md` §2.9, `quotation.md` §4/§8.
- **Traceability classification / Reference section → DECIDED:** traceability → ② Non-Functional; Reference = หมวด ③ (§5.6).

Gate 1 sanity-check (ยืนยันหน้าตา ไม่บล็อก): BOM TYPE selector OEM/FG + planning config เฉพาะ FG; customer TYPE mismatch = เตือนไม่บล็อก; SP Low bell/badge + noti entry. → **READY_FOR_UX_UI**.
