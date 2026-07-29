# Requirement Package (Per-Module) — ESSENCE Hub System

slug: `erp-v2-ui-first` · เขียนโดย PO · 2026-07-29 · **CANONICAL & COMPLETE SINGLE SOURCE OF TRUTH** สำหรับ BA / QA / Tech-Lead
สถานะ: consolidation ของ requirement ที่กระจัดกระจาย → per-module ที่โครงสร้างสม่ำเสมอ **ครบทุก module + NFR + Deletion Policy** (existing-good absorb + delta ใหม่) · reconciled กับ D1–D18 + fold คำสั่งใหม่ของปอนด์ (2026-07-29)

## สรุปภาษาไทย
เอกสารชุดนี้คือ **แหล่งความจริงล่าสุดแบบราย module ที่ครบถ้วน (single source of truth)** ของทั้งระบบ ESSENCE Hub — ทุก module มี .md ที่เป็น **spec ปัจจุบันเต็ม**. Document Hub จัดเป็น **① Functional** · **② Non-Functional** (`non-functional.md` + `deletion-policy.md` + **`traceability.md`**) · **③ Reference** · ④ Architecture · ⑤ Mockups · **⑥ Archive**. **★ ปอนด์เคาะรอบก่อน (2026-07-29):** traceability → Non-Functional · Reference หมวดเอง · Supply Planning proactive Low · Quotation ยกเลิกได้ทุกสถานะ · Customer/Quotation/PO/Stock/Supplier/BOM/Settings · **Production (คิวงานผลิต)** · **Supply Planning (list+expand+modal · FG search ชื่อ/รหัส/RM · สั่งผลิต batch-count + cost/revenue/margin sim · simulate vs save-back BOM · sell-price settled)**. **★★ NEW — QC + GR/Stock flow review (ปอนด์ 2026-07-29 — settled):** **(1) ★ QC-gated stock-in:** RM ที่รับเข้า **ไม่เข้าสต็อกทันที** — Goods Receipt สร้าง **GR object + Lot รอตรวจ (ยังไม่ credit)** → QC ตรวจรับบันทึก **ผ่าน/ไม่ผ่าน**: **ผ่าน → credit on_hand + ชดเชยติดลบ + FIFO retro-link ตอนนี้** · **ไม่ผ่าน → ไม่เข้าสต็อก + Lot ระงับ**. (reconcile กับ GR→Lot + negative-compensation เดิม — credit + retro-link **ย้ายจากตอน GR มาที่จุด QC pass**, กลไก FIFO ไม่ขัดกัน). **(2) ★ GR object lifecycle 4 สถานะ:** QC ตรวจสอบ → ผ่าน / ไม่ผ่าน / ยกเลิก + action **ส่งกลับ QC (re-submit)** / **ยกเลิก GR** (ยกเลิก = เฉพาะก่อน credit → ไม่ reverse ยอด; เอาของออกหลังผ่าน = Return/Loss — PO reasonable decision, override ได้). **(3) ★ แท็บใหม่ "Good Receipt (RM)" ใน stock** — list GR + ค้น (GR/Lot/Supplier/ชื่อ RM/รหัส/ช่วงวันที่รับ) + filter สถานะ 4 + action ส่งกลับ QC/ยกเลิก (ให้ warehouse เห็น RM ที่ QC ไม่ผ่าน). **(4) ★ ตรวจแบตช์ แยก 2 sub-tab: "Batch OEM" / "Batch Own-Brand"** (ตัดสินเหมือนกัน; ต่างที่ context + ปลายทางหลังผ่าน = surplus vs FG-in เต็มจำนวน). **(5) ★ CONFIRM Batch QC ไม่ผ่าน → PRD Rework = "กำลังผลิต · Rework" (reuse feedback "QC ไม่ผ่าน")** — settled ตรง entity-status-map §1.4. **(6) ★ Comment placement:** comment/feedback ของ Batch แสดง **ในบริบท Batch นั้น (ติดกับ Batch)** — UX note. อัปเดต `qc.md` (primary) · `goods-receipt.md` (GR object + QC-gated stock-in) · `stock.md` §2b (GR (RM) tab) · `entity-status-map.md` §1.4/§1.6/§1.8 (r10) · `traceability.md` §3/§4/§9 · `non-functional.md` AU1/AU3/AU4/R3/R5/§6 · README.

---

## 1. โครงไฟล์ (file tree — ครบทั้งชุด)

```
docs/requirements/erp-v2-ui-first/modules/
  README.md                  ← ไฟล์นี้ (index + D-rule spine + changelog + source-of-truth + old→new map + global rules)
  permission-matrix.md       ← capability → module → action/button
  comment-convention.md      ← ★ กติกากลาง comment + change-history (CC1–CC7) · 12 object · อ้างโดยทุก module ธุรกรรม

  # System-wide / Governance (Non-Functional bucket ใน Hub)
  non-functional.md          ← NFR รวม (★ +GR QC-gated stock-in audit)
  deletion-policy.md         ← soft-delete/void baseline + entity
  traceability.md            ← trace/audit governance (★ +GR object lifecycle + credit on QC pass)

  # Platform & Navigation
  platform.md · home.md · dashboard.md

  # Sales & Customer
  customer.md · quotation.md · po.md · so.md

  # Supply Planning & Production (Functional · ผลิต&คุณภาพ)
  bom.md · supply-planning.md
  production.md              ← คิวผลิต 2 แท็บ + management page + comment (PRD+Batch)
  qc.md                      ← ★ (A) ตรวจรับ RM = QC-gate เข้าสต็อก · (B) ตรวจแบตช์ 2 sub-tab OEM/Own-Brand · comment placement

  # Inventory & Procurement (Functional · คลัง&จัดซื้อ)
  stock.md (★ +แท็บ "Good Receipt (RM)" · Adjust อ้าง Lot/FIFO · GR credit on QC pass) · goods-receipt.md (★ GR object + QC-gated stock-in) · pr.md · supplier.md · return.md

  # Fulfilment & Finance
  shipping.md · invoice.md

  # System
  settings.md

  flows/  oem-flow.md · ownbrand-flow.md
```

HTML review view: `docs/design/erp-v2-ui-first/functional-spec/modules/index.html` · Hub `functional-spec/index.html` จัด ① Functional / ② Non-Functional / ③ Reference / ④ Architecture / ⑤ Mockups / ⑥ Archive.

---

## 2. D-Rule Spine (ยังคงเป็นแกน — พร้อม DELTA ที่ปอนด์แก้ 2026-07-29)

D1–D18 ยังเป็นกฎแกน (ดูฉบับเต็ม `scope-oem-ownbrand-supply-planning.md` §1). **จุดที่อัปเดต:**

### 2.1 ★ D8 v2 — ปุ่ม "สั่งผลิต" ใน Supply Planning
กด "สั่งผลิต" → พาไปหน้า SO produce-to-stock (ไม่เลือกลูกค้า) แบบ PRE-FILL → เข้าสาย production. **★ ผู้ใช้ระบุ "จำนวน batch" เองใน modal → prefill จำนวน = batch count × Batch Size**. ดู `supply-planning.md` §5/§5b, `so.md` §6.

### 2.2 ★ Credit Term — ระดับลูกค้า 30/60/90 · DEFAULT 60
per-invoice override ยังทำได้. ดู `customer.md`/`invoice.md`.

### 2.3 ★ D18 reseat — QT "ตกลง (Agreed)" → "ยืนยัน (Confirmed)" · REVERTED Sent
"Convert to PO" = QT = "ยืนยัน (Confirmed)" ทันที · **REVERTED: ถอด "ส่งแล้ว (Sent)" + sent-date**. authoritative = `quotation.md` · entity-status-map §1.1b.

### 2.4 ★★ D11 v2 — รหัส BOM/FG + RM = ผู้ใช้ตั้งเองตอนสร้าง + ล็อก
1 BOM = 1 FG (1:1, shared) · รหัส user-entered on create + unique + **create-only-lock** · **RM ก็ด้วย**. authoritative = `bom.md` §5 · `stock.md` §3b.

### 2.5 ★★ D13 reinforce — Production review (2026-07-29)
**"พร้อมส่ง (Ready to Ship)" = action ที่ฝ่ายผลิตกด (ไม่ auto), QC-gated** → capture surplus · **ทุก PRD พร้อมส่ง → PO/SO พร้อมส่ง** · **actual ≥ ordered เสมอ** · **consume/loss/adjust lot = เลือก lot มี stock; หลาย lot = FIFO**. authoritative = `production.md` · `po.md` §5.2 · `stock.md` §5.1 · entity-status-map §1.4 (r9).

### 2.6 ★★ D9/D10 clarify — Supply Planning margin simulation (2026-07-29)
Supply Planning modal จำลอง **cost/revenue/margin** ตอน "สั่งผลิต" (ก่อน VAT, decision-support ไม่ใช่ COGS; D10 snapshot คงเดิม). authoritative = `supply-planning.md` §5b/§6.2b · `bom.md` §3/§4.

### 2.7 ★★ D12/D16 clarify — QC + GR/Stock flow review (2026-07-29)
**RM เข้าสต็อกเมื่อ QC ตรวจรับ "ผ่าน" เท่านั้น** — Goods Receipt สร้าง **GR object + Lot รอตรวจ (ยังไม่ credit)**; **QC ผ่าน → `GR (+)` credit + ชดเชยติดลบ + FIFO retro-link ที่จุดนี้** · **ไม่ผ่าน → ไม่เข้าสต็อก + Lot ระงับ**. **D12 (FG เข้าคลังตอน QC ผ่าน) + negative-compensation + FIFO retro-link เดิมไม่ขัดกัน** — เพียงเลื่อน trigger ของ RM credit จาก "ตอน GR" → "ตอน QC pass". GR object 4 สถานะ (QC ตรวจสอบ/ผ่าน/ไม่ผ่าน/ยกเลิก). authoritative = `goods-receipt.md` §4/§9 · `qc.md` §4.1 · `stock.md` §2b/§6 · entity-status-map §1.6/§1.8 (r10).

> D1–D7, D14–D17 **ไม่เปลี่ยน**. D8 → D8 v2. D9/D10 = clarify. D11 → D11 v2. D13 = reinforce. D18 = reseat. **D12/D16 = clarify (RM credit gated on QC pass, gr object).**

---

## 3. GLOBAL Rules (บังคับทุก module — ปอนด์สั่ง 2026-07-29)

| # | กติกา | รายละเอียด |
|---|---|---|
| **G1 Pagination** | list/history ทุกอัน **20 แถว/หน้า + pagination** | ทุก list + **★ stock "Good Receipt (RM)" tab + คิว QC (ตรวจรับ/ตรวจแบตช์)** |
| **G2 Date-range search** | ค้น **เลขเอกสาร** หรือ **ช่วงวันที่** | quotation/PO/SO/GR/PR/invoice/shipping list + production queue + audit + **★ GR (RM) tab (received-date range)** |
| **G3 Drill + back คงสถานะ** | กลับ **ไม่เสีย state เดิม** | dashboard drill · PO/SO detail modal · Supply Planning FG modal |
| **G4 Customer search dropdown** | quotation/po/so-create | ค้นเบอร์/บริษัท/ผู้ติดต่อ · Disabled/Blacklist hard block |
| **G5 Permission-per-action** | ทุกปุ่มระบุ capability | `permission-matrix.md` |
| **★ G6 Comment + change-history** | ทุก object ธุรกรรมมี **ช่องหมายเหตุเดียว แก้ในที่ + เก็บประวัติครบ** | **12 object** · กติกากลาง = **`comment-convention.md`** · **★ r10: comment/feedback ของ Batch แสดงในบริบท Batch นั้น** |
| **★ G7 Search-in-dropdown (RM/FG/Lot/component)** | RM/Lot/FG + BOM component + supplier price-matrix | **RM & FG ค้นชื่อ+รหัส** · **Lot ค้น dropdown (Loss+Adjust+option "FIFO")** |

> NFR ระดับระบบ รวมที่ `non-functional.md`.

---

## 4. Confirmations ที่ปอนด์สั่งให้ยืนยัน (RESOLVED)

| หัวข้อ | คำตัดสิน | เอกสาร |
|---|---|---|
| **Convert-to-PO** | QT = **Confirmed ทันที** + loose link | `quotation.md` · `po.md` · oem-flow |
| **SO (ก) ขายจากสต็อก** | จอง FG → พร้อมส่ง → ตัด FG FIFO → DN/Invoice | `so.md` · `shipping.md` |
| **SO (ข) ผลิตเก็บสต็อก** | BOM check → production; RM ขาด auto-PR; QC ผ่าน → FG เข้าคลัง | `so.md` |
| **★ Comment convention** | **12 object** มีช่อง comment เดียว แก้ในที่ + เก็บประวัติ | `comment-convention.md` |
| **★ Customer Edit / follow-up flag** | Edit ครบทุกฟิลด์ · flag ⚑ แยกจาก enum (5 สถานะ) · raise จาก PO edit | `customer.md` · entity-status-map §1.1 |
| **★ Delete Sale → customers unassigned** | ลบ Sale → ลูกค้า unassigned อัตโนมัติ · ไม่ bulk-reassign | `settings.md` US-SET-02 · `customer.md` §4.3 · `deletion-policy.md` §2.15 |
| **★ Stock — RM code / Loss-Adjust / BOM=FG** | RM code user-set+UNIQUE+ล็อก · Loss(−)/Adjust(+) · Adjust อ้าง Lot/FIFO · audit ทุก movement | `stock.md` · `bom.md` · `traceability.md` |
| **★★ Supplier / BOM / Settings module reviews** | price-matrix dropdown+audit · code lock+Active/Inactive+audit · role disable/soft-delete+Admin-only | `supplier.md` · `bom.md` · `settings.md` |
| **★★ Production module review** | คิว 2 แท็บ · 1 PO หลาย PRD · actual≥ordered · QC-gate พร้อมส่ง · lot-FIFO · loss · ไปหน้า QC · edit-PO→follow-up | `production.md` · `stock.md` · `po.md` §5.2 · `qc.md` · entity-status-map r9 |
| **★★ Supply Planning module review** | list+expand+modal · FG search ชื่อ/รหัส/RM · สั่งผลิต batch-count + cost/revenue/margin sim · simulate vs save-back · sell-price settled | `supply-planning.md` · `bom.md` · `so.md` · `traceability.md` · `non-functional.md` |
| **★★ QC + GR/Stock flow review (NEW 2026-07-29 — settled)** | **★ QC-gated stock-in:** RM ไม่เข้าสต็อกทันที · GR สร้าง GR object + Lot รอตรวจ (ยังไม่ credit) · **QC ผ่าน → credit on_hand + ชดเชยติดลบ + FIFO retro-link ที่จุดนี้** · **ไม่ผ่าน → ไม่เข้า + Lot ระงับ** · **GR object 4 สถานะ (QC ตรวจสอบ/ผ่าน/ไม่ผ่าน/ยกเลิก) + ส่งกลับ QC/ยกเลิก** (ยกเลิก = เฉพาะก่อน credit; หลังผ่านใช้ Return/Loss — PO reasonable decision) · **แท็บ "Good Receipt (RM)" ใน stock** (list+ค้น GR/Lot/Supplier/ชื่อ RM/รหัส/ช่วงวันที่รับ + filter สถานะ 4 + action ส่งกลับ QC/ยกเลิก) · **ตรวจแบตช์ 2 sub-tab OEM/Own-Brand** · **Batch QC ไม่ผ่าน → Rework = กำลังผลิต·Rework (reuse feedback "QC ไม่ผ่าน")** · **comment/feedback ในบริบท Batch** | `qc.md` (primary) · `goods-receipt.md` · `stock.md` §2b/§6 · `entity-status-map.md` §1.4/§1.6/§1.8 (r10) · `traceability.md` §3/§4/§9 · `non-functional.md` AU1/AU3/AU4/R3/R5/§6 |

**หมายเหตุ:** Quotation ทำ material check แต่ **ไม่ auto-open PR**.

---

## 5. ★ Source-of-Truth Statement (ประกาศชัด)

1. **`modules/*.md` = AUTHORITATIVE spec ปัจจุบันของทุก module + NFR + Deletion Policy + Traceability** — ชุดเดียวที่ BA/QA/TL ยึด.
2. แต่ละ .md เป็น **spec เต็ม**. `non-functional.md` = NFR authoritative · `deletion-policy.md` = deletion authoritative · `traceability.md` = trace/audit governance · **`comment-convention.md` = comment convention authoritative**.
3. **เอกสารเก่า** = **historical reference** → Hub ⑥ Archive (collapsed).
4. **เอกสารหลักการเชิงลึก** (`entity-status-map`, `status-journeys`, `stock-reservation`, `scope` D1–D18, `mock-data-spec`, ADRs, `scheduled-jobs`, `rtm`, `glossary`, `list-conventions`) = **authoritative reference** → Hub ③ Reference. **★ entity-status-map §1.1=customer · §1.1b=QT · §1.1c=BOM · §1.4/§1.6 (r9)=Production/Stock · §1.8 (r10)=GR object — sync กับ module spec.** **เมื่อถ้อยคำ D-rule ที่ล็อก (scope) ต่างจาก module spec → module package wins.**
5. **RTM/Traceability คงครบ.**
6. **Navigation IA (Document Hub):** ① Functional · ② Non-Functional · ③ Reference · ④ Architecture · ⑤ Mockups · ⑥ 🗄 Archive.

---

## 6. ★ Map: เอกสารเก่า → ครอบคลุมโดย module ใด

| เอกสารเก่า | ครอบคลุมโดย module (authoritative) | หมายเหตุ |
|---|---|---|
| functional-spec BA pages | โมดูลชื่อเดียวกันใน `modules/` (stock → stock+goods-receipt) | absorbed เต็ม · เก่าอยู่ ⑥ Archive |
| `list-conventions.html` | **G1–G3 (README §3)** + Pagination/Search ทุก module | มาตรฐาน list |
| `continuity.html` | **platform.md** (noti) + cross-links | cascade reference |
| `brief.md` · ADR-000..009 · `scheduled-jobs.html` · entity-status-map §1.6 · stock-reservation | **non-functional.md** (J8 · A6/A7/A8) | NFR รวม+อัปเดต |
| root `deletion-policy.md` · `rbac-deletion.html` | **deletion-policy.md** + **settings.md** / **permission-matrix.md** | fold + entity ใหม่ |
| `functional-spec/traceability.html` | **traceability.md** — Hub ② Non-Functional | classification เปลี่ยน |

> **Archive (Hub ⑥):** functional-spec module pages (16), `rbac-deletion.html`, root `docs/deletion-policy.html`, `docs/po-reviews.html` — collapsed, superseded.

---

## 7. Changelog — supersede / แก้ / ปอนด์เคาะ

| เอกสาร/รายการ | สถานะ | เหตุผล |
|---|---|---|
| functional-spec module pages (16) + root deletion-policy + rbac-deletion | **superseded (Archive)** | absorbed/folded → module package |
| NFR ใน brief/ADR/scheduled-jobs | **consolidated** | → `non-functional.md` |
| **★ Traceability / Reference classification** | **DECIDED 2026-07-29** | Hub placement |
| **★ Supply Planning proactive alerting** | **DECIDED 2026-07-29** | real-time + J8 digest |
| **★ Quotation / Customer / Comment / Stock / Supplier / BOM / Settings reviews** | **DECIDED 2026-07-29 · settled** | (ดูรอบก่อน) |
| **★ Delete Sale → customers unassigned · US-SET-02 simplified** | **DECIDED 2026-07-29 · settled** | ลบ Sale → unassigned; ไม่ bulk-reassign |
| **★★ Production (คิวงานผลิต) module review** | **DECIDED 2026-07-29 · settled (no open Q)** | คิว 2 แท็บ · 1 PO หลาย PRD · actual≥ordered · QC-gate พร้อมส่ง · lot-FIFO · loss · ไปหน้า QC · edit-PO→follow-up · Adjust Lot/FIFO |
| **★★ Supply Planning module review** | **DECIDED 2026-07-29 · settled (no open Q)** | list+expand+modal · FG search ชื่อ/รหัส/RM · สั่งผลิต batch-count + cost/revenue/margin sim · simulate vs save-back · sell-price settled |
| **★★ QC + GR/Stock flow review (NEW)** | **DECIDED 2026-07-29 (ปอนด์) · settled (no open Q)** | **(1) ★ QC-gated stock-in:** RM ไม่เข้าสต็อกทันที; GR สร้าง GR object + Lot รอตรวจ (ยังไม่ credit); **QC ผ่าน → credit on_hand + ชดเชยติดลบ + FIFO retro-link ที่จุดนี้** (reconcile GR→Lot + negative-compensation + FIFO retro-link เดิม — credit **ย้ายมาที่ QC pass**, กลไกไม่ขัด); **ไม่ผ่าน → ไม่เข้า + Lot ระงับ**. **(2) ★ GR object lifecycle 4 สถานะ** (QC ตรวจสอบ/ผ่าน/ไม่ผ่าน/ยกเลิก) + **ส่งกลับ QC (re-submit)** / **ยกเลิก GR** (ยกเลิก = เฉพาะก่อน credit → ไม่ reverse ยอด; หลังผ่าน = Return/Loss — PO reasonable decision, override ได้). **(3) ★ แท็บใหม่ "Good Receipt (RM)" ใน stock** (list GR + ค้น GR/Lot/Supplier/ชื่อ RM/รหัส/ช่วงวันที่รับ + filter สถานะ 4 + action ส่งกลับ QC/ยกเลิก). **(4) ★ ตรวจแบตช์ แยก 2 sub-tab: Batch OEM / Batch Own-Brand** (ตัดสินเหมือน; ต่าง context + ปลายทาง surplus vs FG-in). **(5) ★ CONFIRM Batch QC ไม่ผ่าน → Rework = "กำลังผลิต · Rework" (reuse feedback "QC ไม่ผ่าน")** — settled ตรง entity-status-map §1.4. **(6) ★ comment/feedback ในบริบท Batch (UX placement).** อัปเดต `qc.md` (primary) · `goods-receipt.md` · `stock.md` §2b/§5.1/§6/§8/§9/§10 · `entity-status-map.md` §1.4/§1.6/§1.7/§1.8/cascade 17/17b/18/18b (r10) · `traceability.md` §3/§4/§5/§9/§11 · `non-functional.md` AU1/AU3/AU4/R3/R5/§6/§7/§9/§10/D-F2/D-F4/changelog · README |
| `scope-…` D8/credit · U4 · stock-reservation Q1 | คงตามรอบก่อน | D8 v2 · credit 60 · Option A |

---

## 8. งานส่งต่อ UX/UI (สรุป)

**punch-list เดิม + delta รอบก่อน:** customer · quotation · po/so · stock/GR/return · bom · production · supply-planning · dashboard/home/platform · qc/shipping/invoice/traceability/settings · pagination/search + customer dropdown. (คงตามรอบก่อน — commit history)

> **★★ QC + GR/Stock flow review — UI ที่ UX/UI ต้องเพิ่ม/แก้ (2026-07-29 · `qc.html` + `goods-receipt.html` + `stock.html` + `production.html`):**
> - **(QC-1) แท็บ "ตรวจรับวัตถุดิบ (RM incoming)":** คิว GR/Lot สถานะ "รอตรวจ" → บันทึก **ผ่าน/ไม่ผ่าน** ราย Lot (per GR line). **ผ่าน = gate ให้ RM เข้าสต็อก** (แสดงผลว่า credit เกิดตอนนี้ + กล่อง "ชดเชยยอดติดลบ X (ผูก Lot ย้อน FIFO)" ถ้ามี). **ไม่ผ่าน = Lot ระงับ + GR ไม่ผ่าน** + ลิงก์ทำใบคืน.
> - **(QC-2) แท็บ "ตรวจแบตช์" แยก 2 sub-tab:** **"Batch OEM"** (แสดง PO + ลูกค้า) และ **"Batch Own-Brand"** (แสดง SO produce-to-stock + FG + batch count). การตัดสิน (ผ่าน/ไม่ผ่าน+feedback) เหมือนกัน; default = OEM. deep-link "ไปหน้า QC" เลือก sub-tab อัตโนมัติตามชนิด PRD.
> - **(QC-3) comment placement:** comment (G6) + feedback ("QC ไม่ผ่าน") ต้องแสดง **ในบริบท/ติดกับ card ของ Batch นั้น** (ไม่ลอยแยก) — ให้ชัดว่าเป็นของ Batch ใด.
> - **(GR-1) `goods-receipt.html`:** บันทึก GR แล้ว → GR = "QC ตรวจสอบ" + Lot รอตรวจ (**แสดงชัดว่า "ยังไม่เข้าสต็อก รอ QC"**); **กล่องชดเชยยอดติดลบย้ายไปแสดงตอน QC ผ่าน** (ไม่ใช่ตอนบันทึก GR).
> - **(STK-2) แท็บใหม่ "Good Receipt (RM)" ใน `stock.html`:** เคียงข้าง RM/FG. list GR ทุกใบ (20/หน้า) + **search: GR / Lot / Supplier / ชื่อ RM / name-code / ช่วงวันที่รับ** + **filter สถานะ: ผ่าน / ไม่ผ่าน / QC ตรวจสอบ / ยกเลิก** + **action: ส่งกลับไปที่ QC (re-submit) / ยกเลิก (cancel)** + ลิงก์เปิด GR เต็ม / ทำใบคืน.
> - **(PRD-fail) Batch QC ไม่ผ่าน → PRD = "กำลังผลิต · Rework"** (สีฟ้า processing) + gen Batch run ถัดไป (คงตาม production.md §6.2 — ยืนยันคำศัพท์สถานะ).
> ยึด `qc.md` §2/§2b/§4/§9 · `goods-receipt.md` §4 · `stock.md` §2b · `entity-status-map.md` §1.8.
> **หมายเหตุ collision:** รอบนี้ PO แก้ **requirement docs เท่านั้น** — mockups (QC-1..3 · GR-1 · STK-2 · PRD-fail) เป็นงานที่ส่งต่อ UX/UI (เข้า GATE 1 review เฉพาะหน้าที่แก้).

> **★★ รอบก่อน (Production PROD-1..14/STK-1 · Supply Planning SP-1..10 · Comment control · Customer Edit · Quotation REVERT Sent · Stock · Supplier/BOM · Settings) — คงตามรอบก่อน (commit history).**

---

## 9. Open questions
**ไม่มี open question ค้าง — ปิดครบทั้งหมด (2026-07-29).**

**คำถามที่ปิดแล้ว (2026-07-29):** Supply Planning proactive alert · Quotation abandon/review/REVERT Sent · Traceability/Reference · Customer · Comment convention · Stock · Supplier · BOM · Settings · **Production module review** · Delete Sale → unassigned · **Supply Planning module review** · **★★ QC + GR/Stock flow review → DECIDED (settled, no open Q).**

> **★★ QC + GR/Stock flow — PO reasonable decisions (settled; ไม่ถือเป็น open question — locked mechanics เป็นตัวกำหนด):**
> - **★ credit gated on QC pass = คำสั่งตรงของปอนด์** ("ผ่าน → RM เข้าสต็อก · ไม่ผ่าน → ไม่เข้า"); credit + FIFO retro-link **ย้ายจากตอน GR มาที่จุด QC pass**. กลไก negative-stock/FIFO-retro-link เดิม **ไม่ขัดกัน** (เพียงเลื่อน trigger หนึ่งขั้น) → **ไม่มี genuine conflict**.
> - **★ GR-cancel restore negative stock?** ในโมเดลใหม่ GR ที่ยกเลิกได้ **ยังไม่เคย credit สต็อก** (ยกเลิก = เฉพาะสถานะ QC ตรวจสอบ/ไม่ผ่าน) → **ยกเลิกไม่ต้อง restore/reverse อะไร** และ **ไม่กระทบยอดติดลบ** (ติดลบคงอยู่จนกว่ามี GR/Lot ที่ผ่านมาชดเชย) — determined. หลังผ่านแล้วต้องเอาของออก = **Return/Loss** (คง ledger/GMP), ไม่ใช่ยกเลิก GR.
> - **★ QC-fail interact กับ FIFO retro-link?** QC ไม่ผ่าน → **ไม่ credit → ไม่มี retro-link** → ยอดติดลบ (ถ้ามี) คงอยู่จนกว่า GR/Lot ที่ผ่านใบถัดไปมาชดเชย; Lot ที่ไม่ผ่าน = ระงับ → คืน supplier — determined (ตามกลไก credit-on-pass).
> - **★ Batch QC ไม่ผ่าน → กำลังผลิต·Rework** = ตรง entity-status-map §1.4 (locked) → settled (ปอนด์: "ถ้าใช่ เอาเป็นแบบนี้ไปก่อน"). "QC ไม่ผ่าน" comment = reuse feedback field.
> **ถ้าปอนด์เห็นต่างข้อใด — แจ้งปรับได้** (เช่น อยากให้ credit เกิดตอนรับของ (GR) แล้ว QC เป็นแค่ release-to-use เหมือนเดิม, หรืออยากให้ยกเลิก GR หลังผ่านแบบ reverse credit) — default ปัจจุบันตามด้านบน.

> **การตัดสินสมเหตุผลของ PO รอบก่อน (ไม่ถือเป็น open question):** 1 PO หลาย PRD (locked model) · "พร้อมส่ง" QC-gated · Rework ในกลุ่มกำลังผลิต · Stock Adjust อ้าง Lot/FIFO · Supply Planning revenue = ราคาขาย (BOM §3) ก่อน VAT. (คงตามรอบก่อน)

> **สรุปสถานะ:** ทุกรายการ **settled → READY_FOR_UX_UI**. รอบล่าสุด = **QC + GR/Stock flow review** (QC-gated stock-in · GR object lifecycle + ส่งกลับ QC/ยกเลิก · stock "Good Receipt (RM)" tab · ตรวจแบตช์ 2 sub-tab OEM/Own-Brand · Batch fail→Rework · comment placement) — ripples ครบทุกไฟล์ (`qc.md`/`goods-receipt.md`/`stock.md`/`entity-status-map.md`/`traceability.md`/`non-functional.md`/README).
