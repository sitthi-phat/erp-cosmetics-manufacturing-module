# Requirement Package (Per-Module) — ESSENCE Hub System

slug: `erp-v2-ui-first` · เขียนโดย PO · 2026-07-29 · **CANONICAL & COMPLETE SINGLE SOURCE OF TRUTH** สำหรับ BA / QA / Tech-Lead
สถานะ: consolidation ของ requirement ที่กระจัดกระจาย → per-module ที่โครงสร้างสม่ำเสมอ **ครบทุก module + NFR + Deletion Policy** (existing-good absorb + delta ใหม่) · reconciled กับ D1–D18 + fold คำสั่งใหม่ของปอนด์ (2026-07-29)

## สรุปภาษาไทย
เอกสารชุดนี้คือ **แหล่งความจริงล่าสุดแบบราย module ที่ครบถ้วน (single source of truth)** ของทั้งระบบ ESSENCE Hub — ทุก module มี .md ที่เป็น **spec ปัจจุบันเต็ม**. Document Hub จัดเป็น **① Functional** · **② Non-Functional** (`non-functional.md` + `deletion-policy.md` + **`traceability.md`**) · **③ Reference** · ④ Architecture · ⑤ Mockups · **⑥ Archive**. **★ ปอนด์เคาะรอบก่อน (2026-07-29):** traceability → Non-Functional · Reference หมวดเอง · Supply Planning proactive Low · Quotation ยกเลิกได้ทุกสถานะ · Customer/Quotation/PO/Stock/Supplier/BOM/Settings · **Production (คิวงานผลิต)** · **Supply Planning** · **QC + GR/Stock flow (QC-gated stock-in)**. **★★ NEW — 2 คำสั่งปอนด์ (2026-07-29):** **(1) Return module:** เพิ่ม **RM selector (บังคับ) บน return-create** เพราะ **1 Lot ถือได้หลาย RM** (lot = `{supplier prefix}{YYMM}`) → ผู้ใช้เลือกว่าคืน RM ตัวใดในล็อต (search-in-dropdown ชื่อ+รหัส G7); จำนวนคืนหักจากคงเหลือของ (lot, RM); + list search ด้วย Lot/Supplier/ชื่อ RM/รหัส RM. **(2) ★ NEW Global Rule G8 — เลขเอกสารออกตอนบันทึก (number-on-save):** create ทุกใบ **ไม่โชว์เลขล่วงหน้า** (แสดง "(ระบบออกให้เมื่อบันทึก)") → **บันทึกสำเร็จ → ออกเลข gapless + popup ยืนยัน เลข+summary (+ ลิงก์ดู/พิมพ์)** · ป้องกันเลขหาย (ร่างที่ไม่บันทึกไม่กินเลข). Apply: **Lot/GR (รับเข้าคลัง) · QT · SO · PO · PR** + ขยายไป **DN/SHP · Invoice · PRD · Batch** (นิยามครั้งเดียวที่ `numbering-on-save.md`, อ้างจากแต่ละ module). **★★★ NEW ล่าสุด — Global Rule G9 (permission-code suffix):** ทุกปุ่ม/action ที่ permission-gate ต้อง **แสดงรหัสสิทธิ์เป็น suffix ต่อท้าย label** เช่น "บันทึก (C)", "อนุมัติ (A)", "ตั้งค่า VAT (Ad)". **รหัสสาธารณะ 6 ตัวเป๊ะ: R/C/U/D/A/Ad** (Ad=Admin; **ไม่มี Archive แยก** — undelete/restore/force-override = ส่วนของ Admin). `permission-matrix.md` §3 มี **คอลัมน์ Suffix ต่อ action ต่อ module** เป็น authority ให้ UX/UI ไป append. **★ Doc-completeness (2026-07-29):** ตอนนี้ **ทุกไฟล์ `.md` ในชุดนี้มี HTML review view ครบ 1:1 + ลิงก์ในหน้า Modules index** — เติม `comment-convention.html` (G6) และ `numbering-on-save.html` (G8) ที่ก่อนหน้ายังไม่มี view/ลิงก์.

---

## 1. โครงไฟล์ (file tree — ครบทั้งชุด)

```
docs/requirements/erp-v2-ui-first/modules/
  README.md                  ← ไฟล์นี้ (index + D-rule spine + changelog + source-of-truth + old→new map + global rules)
  permission-matrix.md       ← capability → module → action/button → ★ Suffix (G9)
  comment-convention.md      ← ★ กติกากลาง comment + change-history (CC1–CC7) · 12 object · อ้างโดยทุก module ธุรกรรม
  numbering-on-save.md        ← ★ NEW กติกากลาง G8 = เลขเอกสารออกตอนบันทึก (NS1–NS7) · อ้างโดยทุก create flow

  # System-wide / Governance (Non-Functional bucket ใน Hub)
  non-functional.md          ← NFR รวม (★ +GR QC-gated stock-in audit · +number-on-save G8)
  deletion-policy.md         ← soft-delete/void baseline + entity
  traceability.md            ← trace/audit governance (★ +GR object lifecycle + credit on QC pass)

  # Platform & Navigation
  platform.md · home.md · dashboard.md

  # Sales & Customer
  customer.md · quotation.md · po.md · so.md

  # Supply Planning & Production (Functional · ผลิต&คุณภาพ)
  bom.md · supply-planning.md
  production.md              ← คิวผลิต 2 แท็บ + management page + comment (PRD+Batch) · ★ PRD/Batch เลขใน confirm popup (G8)
  qc.md                      ← ★ (A) ตรวจรับ RM = QC-gate เข้าสต็อก · (B) ตรวจแบตช์ 2 sub-tab OEM/Own-Brand · comment placement

  # Inventory & Procurement (Functional · คลัง&จัดซื้อ)
  stock.md (★ +แท็บ "Good Receipt (RM)" · Adjust อ้าง Lot/FIFO · GR credit on QC pass · GR/Lot เลขตอนบันทึก G8) · goods-receipt.md (★ GR object + QC-gated stock-in · GR+Lot number-on-save G8) · pr.md · supplier.md · return.md (★ +RM selector · +list search)

  # Fulfilment & Finance
  shipping.md (★ SHP+DN number-on-save G8) · invoice.md (★ INV number-on-save G8)

  # System
  settings.md

  flows/  oem-flow.md · ownbrand-flow.md
```

HTML review view: `docs/design/erp-v2-ui-first/functional-spec/modules/index.html` · Hub `functional-spec/index.html` จัด ① Functional / ② Non-Functional / ③ Reference / ④ Architecture / ⑤ Mockups / ⑥ Archive.
**★ Doc-completeness (2026-07-29): ทุกไฟล์ `.md` ในชุดนี้มี HTML review view ครบ 1:1 + ลิงก์ในหน้า Modules index** (render จาก .md ผ่าน `_render.js`). แต่ละ .md → view (ตัวอย่าง): `README.md`→`package-overview.html` · `permission-matrix.md`→`permission-matrix.html` · **`comment-convention.md`→`comment-convention.html` (G6, เพิ่งเติมให้ครบ)** · **`numbering-on-save.md`→`numbering-on-save.html` (G8, เพิ่งเติมให้ครบ)** · `flows/oem-flow.md`→`oem-flow.html` · `flows/ownbrand-flow.md`→`ownbrand-flow.html` · (module อื่นชื่อไฟล์เดียวกัน). กติกากลาง 3 ตัว (permission-matrix + comment-convention + numbering-on-save) จัดอยู่กลุ่ม **"Global Rules & Conventions"** ในหน้า index.

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
**RM เข้าสต็อกเมื่อ QC ตรวจรับ "ผ่าน" เท่านั้น** — Goods Receipt สร้าง **GR object + Lot รอตรวจ (ยังไม่ credit)**; **QC ผ่าน → `GR (+)` credit + ชดเชยติดลบ + FIFO retro-link ที่จุดนี้** · **ไม่ผ่าน → ไม่เข้าสต็อก + Lot ระงับ**. GR object 4 สถานะ (QC ตรวจสอบ/ผ่าน/ไม่ผ่าน/ยกเลิก). authoritative = `goods-receipt.md` §4/§9 · `qc.md` §4.1 · `stock.md` §2b/§6 · entity-status-map §1.6/§1.8 (r10).

> D1–D7, D14–D17 **ไม่เปลี่ยน**. D8 → D8 v2. D9/D10 = clarify. D11 → D11 v2. D13 = reinforce. D18 = reseat. **D12/D16 = clarify (RM credit gated on QC pass, gr object).**

---

## 3. GLOBAL Rules (บังคับทุก module — ปอนด์สั่ง 2026-07-29)

| # | กติกา | รายละเอียด |
|---|---|---|
| **G1 Pagination** | list/history ทุกอัน **20 แถว/หน้า + pagination** | ทุก list + **★ stock "Good Receipt (RM)" tab + คิว QC (ตรวจรับ/ตรวจแบตช์)** |
| **G2 Date-range search** | ค้น **เลขเอกสาร** หรือ **ช่วงวันที่** | quotation/PO/SO/GR/PR/invoice/shipping list + production queue + audit + **★ GR (RM) tab (received-date range) · Return (RT/date)** |
| **G3 Drill + back คงสถานะ** | กลับ **ไม่เสีย state เดิม** | dashboard drill · PO/SO detail modal · Supply Planning FG modal |
| **G4 Customer search dropdown** | quotation/po/so-create | ค้นเบอร์/บริษัท/ผู้ติดต่อ · Disabled/Blacklist hard block |
| **G5 Permission-per-action** | ทุกปุ่มระบุ capability | `permission-matrix.md` · **★ แสดงรหัสเป็น suffix ตาม G9** |
| **★ G6 Comment + change-history** | ทุก object ธุรกรรมมี **ช่องหมายเหตุเดียว แก้ในที่ + เก็บประวัติครบ** | **12 object** · กติกากลาง = **`comment-convention.md`** · **★ r10: comment/feedback ของ Batch แสดงในบริบท Batch นั้น** |
| **★ G7 Search-in-dropdown (RM/FG/Lot/component)** | RM/Lot/FG + BOM component + supplier price-matrix + **★ Return RM-in-lot** | **RM & FG ค้นชื่อ+รหัส** · **Lot ค้น dropdown (Loss+Adjust+option "FIFO")** · **★ Return: เลือก RM ในล็อต ค้นชื่อ+รหัส** |
| **★ G8 Document number on SAVE** | **create ทุกใบ: ไม่โชว์เลขล่วงหน้า → ออกเลข gapless ตอนบันทึกสำเร็จ + popup ยืนยัน (เลข + summary + ลิงก์ดู/พิมพ์)** · ร่างที่ไม่บันทึกไม่กินเลข | กติกากลาง = **`numbering-on-save.md`** (NS1–NS7) · **Apply:** Lot/GR (รับเข้าคลัง) · QT · SO · PO · PR · **Extend:** DN/SHP · Invoice · PRD · Batch · **นอกขอบเขต:** QC record + master code |
| **★ G9 Permission-code suffix** | **ทุก actionable control ที่ permission-gate แสดงรหัสสิทธิ์เป็น suffix ต่อท้าย label** เช่น "บันทึก (C)", "อนุมัติ (A)", "ตั้งค่า VAT (Ad)" · read-only ละ (R) ได้ | **รหัสสาธารณะ 6 ตัว: R/C/U/D/A/Ad** (Ad=Admin; **ไม่มี Archive แยก**) · cross-module = แสดงครบ เช่น "แปลงเป็น PO (U+C)" · authority = **`permission-matrix.md` §1b (G9) + §3 คอลัมน์ Suffix** |

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
| **★★ QC + GR/Stock flow review (2026-07-29 — settled)** | **★ QC-gated stock-in:** RM ไม่เข้าสต็อกทันที · GR สร้าง GR object + Lot รอตรวจ · **QC ผ่าน → credit + ชดเชยติดลบ + FIFO retro-link** · **ไม่ผ่าน → ไม่เข้า + Lot ระงับ** · **GR object 4 สถานะ + ส่งกลับ QC/ยกเลิก** · **แท็บ "Good Receipt (RM)" ใน stock** · **ตรวจแบตช์ 2 sub-tab OEM/Own-Brand** · **Batch QC ไม่ผ่าน → Rework** · **comment ในบริบท Batch** | `qc.md` (primary) · `goods-receipt.md` · `stock.md` §2b/§6 · `entity-status-map.md` §1.4/§1.6/§1.8 (r10) · `traceability.md` §3/§4/§9 · `non-functional.md` |
| **★★ NEW — Return module: RM selector + list search (2026-07-29)** | **1 Lot ถือได้หลาย RM** (lot = `{supplier prefix}{YYMM}`) → return-create **บังคับเลือก RM ในล็อต (search-in-dropdown ชื่อ+รหัส G7)**; จำนวนคืน ≤ คงเหลือของ (lot, RM); ตัด stock + ledger `return (−)` source ผูก Lot+RM+Supplier+RT; **list ค้น Lot/Supplier/ชื่อ RM/รหัส RM (+ RT/date)** | `return.md` · `goods-receipt.md` §3 (lot naming) · `stock.md` §6 |
| **★★ NEW — G8 Document number on SAVE (2026-07-29)** | create **ไม่โชว์เลขล่วงหน้า** ("(ระบบออกให้เมื่อบันทึก)") → **บันทึกสำเร็จ → ออกเลข gapless + popup ยืนยัน เลข+summary (+ ลิงก์ดู/พิมพ์)** · ร่างที่ไม่บันทึกไม่กินเลข · หลายเลข/บันทึก (GR+Lot · SHP+DN) → popup แสดงครบ · **Apply:** Lot/GR/QT/SO/PO/PR · **Extend:** DN/SHP·Invoice·PRD·Batch · **นอกขอบเขต:** QC record + master code | **`numbering-on-save.md` (G8/NS1–NS7)** · quotation/so/po/pr/goods-receipt/stock/shipping/invoice/production · `non-functional.md` D-F2 |
| **★★★ NEW — G9 Permission-code suffix (2026-07-29)** | ทุกปุ่ม/action ที่ permission-gate **แสดงรหัสสิทธิ์ต่อท้าย label** · **รหัส 6 ตัว: R/C/U/D/A/Ad** (RUCDAA+Admin reconciled → Ad=Admin; **ไม่มี Archive แยก** — undelete/restore/force-override = Ad) · cross-module แสดงครบ ("แปลงเป็น PO (U+C)") · read-only ละ (R) ได้ | **`permission-matrix.md` §1 (reconcile) · §1b (G9 rule) · §3 (คอลัมน์ Suffix ต่อ module/action)** · README §3 (G9) · §8 (UX/UI sweep) |

**หมายเหตุ:** Quotation ทำ material check แต่ **ไม่ auto-open PR**.

---

## 5. ★ Source-of-Truth Statement (ประกาศชัด)

1. **`modules/*.md` = AUTHORITATIVE spec ปัจจุบันของทุก module + NFR + Deletion Policy + Traceability** — ชุดเดียวที่ BA/QA/TL ยึด.
2. แต่ละ .md เป็น **spec เต็ม**. `non-functional.md` = NFR authoritative · `deletion-policy.md` = deletion authoritative · `traceability.md` = trace/audit governance · **`comment-convention.md` = comment convention authoritative** · **`numbering-on-save.md` = number-on-save (G8) convention authoritative** · **`permission-matrix.md` = RBAC capability + G9 permission-code suffix authoritative**.
3. **เอกสารเก่า** = **historical reference** → Hub ⑥ Archive (collapsed).
4. **เอกสารหลักการเชิงลึก** (`entity-status-map`, `status-journeys`, `stock-reservation`, `scope` D1–D18, `mock-data-spec`, ADRs, `scheduled-jobs`, `rtm`, `glossary`, `list-conventions`) = **authoritative reference** → Hub ③ Reference. **★ entity-status-map §1.1=customer · §1.1b=QT · §1.1c=BOM · §1.4/§1.6 (r9)=Production/Stock · §1.8 (r10)=GR object — sync กับ module spec.** **เมื่อถ้อยคำ D-rule ที่ล็อก (scope) ต่างจาก module spec → module package wins.**
5. **RTM/Traceability คงครบ.**
6. **Navigation IA (Document Hub):** ① Functional · ② Non-Functional · ③ Reference · ④ Architecture · ⑤ Mockups · ⑥ 🗄 Archive.
7. **★ HTML review view = 1:1 ต่อทุก .md** (render จาก .md ผ่าน `_render.js`, ไม่ทำสำเนา content ซ้ำ) — เป็นเพียง "หน้าอ่าน" ของ .md เดียวกัน; ถ้าเนื้อหาต่างกันเมื่อไร **`.md` คือฉบับจริง**.

---

## 6. ★ Map: เอกสารเก่า → ครอบคลุมโดย module ใด

| เอกสารเก่า | ครอบคลุมโดย module (authoritative) | หมายเหตุ |
|---|---|---|
| functional-spec BA pages | โมดูลชื่อเดียวกันใน `modules/` (stock → stock+goods-receipt) | absorbed เต็ม · เก่าอยู่ ⑥ Archive |
| `list-conventions.html` | **G1–G3 (README §3)** + Pagination/Search ทุก module | มาตรฐาน list |
| `continuity.html` | **platform.md** (noti) + cross-links | cascade reference |
| `brief.md` · ADR-000..009 · `scheduled-jobs.html` · entity-status-map §1.6 · stock-reservation | **non-functional.md** (J8 · A6/A7/A8) | NFR รวม+อัปเดต |
| ADR-008 gapless numbering | **`numbering-on-save.md` (G8)** + `non-functional.md` D-F2 | ★ number-on-save = พฤติกรรม create ของทุกใบ |
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
| **★★ QC + GR/Stock flow review** | **DECIDED 2026-07-29 (ปอนด์) · settled (no open Q)** | QC-gated stock-in · GR object lifecycle + ส่งกลับ QC/ยกเลิก · stock "Good Receipt (RM)" tab · ตรวจแบตช์ 2 sub-tab · Batch fail→Rework · comment placement (ดูรอบก่อน) |
| **★★ NEW — Return module: RM selector + list search** | **DECIDED 2026-07-29 (ปอนด์) · settled (no open Q)** | **1 Lot หลาย RM** (lot = `{supplier prefix}{YYMM}`) → return-create **บังคับเลือก RM ในล็อต (search-in-dropdown ชื่อ+รหัส, G7)**; จำนวนคืน ≤ คงเหลือของ (lot, RM); ตัด stock + ledger `return (−)` source ผูก **Lot+RM+Supplier+RT**; **list ค้น Lot/Supplier/ชื่อ RM/รหัส RM** (+ RT/date). อัปเดต `return.md` (§2/§3/§5/§6/§7/§8/§9/§10/§11) · `stock.md` §6/§8 (return source) · `non-functional.md` AU3/D-F4. |
| **★★ NEW — G8 Document number on SAVE (number-on-save)** | **DECIDED 2026-07-29 (ปอนด์) · settled (no open Q)** | **create ไม่โชว์เลขล่วงหน้า** (แสดง "(ระบบออกให้เมื่อบันทึก)") → **บันทึกสำเร็จ → ออกเลข gapless + popup ยืนยัน เลข+summary (+ ลิงก์ดู/พิมพ์)** · **ร่างที่ไม่บันทึกไม่กินเลข** (ป้องกัน gap) · **หลายเลข/บันทึก (GR+Lot · SHP+DN) → popup แสดงครบ (NS7)** · แก้/เวอร์ชันใหม่/void = เลขเดิม (NS6). **Apply (ปอนด์-listed):** Lot/GR (รับเข้าคลัง) · QT · SO · PO · PR. **Extend (propose → apply):** DN/SHP · Invoice · PRD · Batch (PRD/Batch = ออกตอน action → เลขใน confirm popup, NS1 N/A; Batch เลข derived; PR auto = ไม่มี popup). **นอกขอบเขต:** QC record + master code. NEW `numbering-on-save.md` (G8/NS1–NS7) · อ้างจาก quotation/so/po/pr/goods-receipt/stock/shipping/invoice/production create flow · `non-functional.md` D-F2/D-F5/AU1/§6/§9/§10/R5 · README §3 (G8). |
| **★★★ NEW — G9 Permission-code suffix on labels (2026-07-29)** | **DECIDED 2026-07-29 (ปอนด์) · settled (no open Q)** | **ปอนด์ General Key Feature:** ทุก actionable control ที่ permission-gate **แสดงรหัสสิทธิ์เป็น suffix ต่อท้าย label** (บันทึก (C) · อนุมัติ (A) · ตั้งค่า VAT (Ad)). **★ Code-set reconciliation:** โมเดลภายในเดิม = **RUCDAA + Admin**; ตัว **A ตัวที่สองของ RUCDAA = Admin** (ไม่ใช่ "Archive") → **6 รหัสสาธารณะ = R/C/U/D/A/Ad** เป๊ะ; **ไม่มี capability Archive แยก** — งาน undelete/restore/force-override/undelete-role อยู่ใต้ **Admin = (Ad)**. เพิ่ม **คอลัมน์ Suffix ต่อ action ต่อ module** ใน `permission-matrix.md` §3 (customer/quotation/po/so/supply-planning/bom/stock/production/qc/shipping/invoice/**pr**/**supplier**/settings) เป็น authority ให้ UX/UI ไป append. อัปเดต `permission-matrix.md` (§1 reconcile · §1b G9 rule · §3 Suffix · §4/§5) · README §3 (G9 row + G5 cross-ref) · §8 (UX/UI sweep task). |
| **★ Doc-completeness fix — HTML review views + hub links (2026-07-29)** | **DONE 2026-07-29 · PO audit (docs เท่านั้น, ไม่แตะ mockups)** | **Gap:** `comment-convention.md` (G6) + `numbering-on-save.md` (G8) มี .md แต่ **ยังไม่มี HTML review view + ไม่ถูกลิงก์ในหน้า index**. **Fix:** สร้าง `comment-convention.html` + `numbering-on-save.html` (shell เดียวกับ deletion-policy.html · data-src ชี้ .md · `_render.js` เดิม) · เพิ่ม 2 filename→view ใน `_render.js` map (cross-link resolve) · ลิงก์ทั้งคู่จาก `modules/index.html` **กลุ่มใหม่ "Global Rules & Conventions"** (ข้าง permission-matrix) + จาก Document Hub `functional-spec/index.html` (กลุ่มเดียวกัน). **ผล: ทุก .md → มี view + hub link ครบ 1:1** (G9 permission-code ก่อนหน้า landed แล้ว). audit ยืนยัน flows (oem/ownbrand) + ทุก module + convention มี view + ลิงก์ครบ. |
| `scope-…` D8/credit · U4 · stock-reservation Q1 | คงตามรอบก่อน | D8 v2 · credit 60 · Option A |

---

## 8. งานส่งต่อ UX/UI (สรุป)

**punch-list เดิม + delta รอบก่อน:** customer · quotation · po/so · stock/GR/return · bom · production · supply-planning · dashboard/home/platform · qc/shipping/invoice/traceability/settings · pagination/search + customer dropdown. (คงตามรอบก่อน — commit history)

> **★★ QC + GR/Stock flow review — UI ที่ UX/UI ต้องเพิ่ม/แก้ (2026-07-29 · `qc.html` + `goods-receipt.html` + `stock.html` + `production.html`):** (QC-1/QC-2/QC-3 · GR-1 · STK-2 · PRD-fail — คงตามรอบก่อน, commit history)

> **★★ NEW รอบนี้ (2026-07-29) — UI ที่ UX/UI ต้องเพิ่ม/แก้ (2 คำสั่งปอนด์):**
>
> **(A) Return module — `return.html` (create + list):**
> - **(RET-1) RM selector บน return-create (บังคับ):** หลังเลือก Lot (→ supplier auto) เพิ่ม **ช่องเลือกวัตถุดิบ (RM) ในล็อตนั้น** = **search-in-dropdown ค้นชื่อ+รหัส RM (G7)**; ตัวเลือกจำกัดเฉพาะ RM ที่ยังมีคงเหลือใน lot (on_hand ของ (lot, RM) > 0) + แสดงคงเหลือของ RM ตัวนั้นเป็นเพดานจำนวนคืน. ลำดับฟิลด์: Lot → supplier(auto) → **RM** → จำนวน → เหตุผลการคืน(บังคับ) → comment.
> - **(RET-2) validation:** จำนวนคืน **≤ คงเหลือของ RM ที่เลือกในล็อต** (ต่อ (lot, RM) ไม่ใช่ทั้ง lot); ไม่เลือก RM = error "ต้องเลือกวัตถุดิบที่จะคืนในล็อตนี้".
> - **(RET-3) list search:** เพิ่มค้นด้วย **Lot / Supplier / ชื่อ RM / รหัส RM** (คง RT/ช่วงวันที่เดิม) — RM = search-in-dropdown (ชื่อ+รหัส).
> - ยึด `return.md` §2/§3/§5/§8/§9.
>
> **(B) Number-on-save (G8) — ทุกหน้า create ที่ออกเลข:**
> - **(NS-A) ซ่อนเลขล่วงหน้าบน create:** ช่อง "เลขเอกสาร" บนหน้าสร้าง แสดงเป็น **read-only placeholder "(ระบบออกให้เมื่อบันทึก)"** (ไม่มีเลขจริง). ครอบ: **goods-receipt (GR+Lot) · quotation-create (QT) · so-create (SO) · po-create (PO) · pr-create (PR)** + extend **shipping create-round (SHP+DN) · invoice ออกใบ (INV)**.
> - **(NS-B) popup ยืนยันหลังบันทึกสำเร็จ:** เด้ง **confirmation popup** แสดง **(ก) เลขที่ออกให้ (เด่นชัด)** + **(ข) สรุปเอกสาร** (คู่ค้า/ลูกค้า/supplier · จำนวนรายการ · ยอดรวม/ปริมาณ ตามชนิด) + **(ค) ลิงก์ "ดูรายละเอียด"/"พิมพ์"** ตามที่มี. **หลายเลขต่อการบันทึก → popup แสดงครบ:** goods-receipt = **GR + ทุก Lot** (+ ย้ำ "ยังไม่เข้าสต็อก รอ QC"); shipping = **SHP + ทุก DN** ในรอบ (NS7).
> - **(NS-C) PRD/Batch (production):** ไม่มีฟอร์ม create ที่โชว์ช่องเลข → **แสดงเลขที่ออกให้ใน confirm popup ของ action เดิม** — **"รับงาน" → เลข PRD**, **"เริ่มผลิต" → เลข Batch** (fold เข้ากับ confirm popup เดิม §7.7 ของ production, ไม่ทำ popup ซ้อนใหม่).
> - **(NS-D) พฤติกรรม:** ปิด/ยกเลิกร่างก่อนบันทึก = ไม่ออกเลข; แก้/เวอร์ชันใหม่/void = เลขเดิม (ไม่มี popup ออกเลข).
> - ยึด `numbering-on-save.md` (G8/NS1–NS7) + create flow ของแต่ละ module (quotation §5 · po §5 · so §5/§6 · pr §5 · goods-receipt §5 · shipping §5 · invoice §5 · production §7.7).
>
> **★★★ NEW ล่าสุด (2026-07-29) — G9 Permission-code suffix SWEEP (ทุก mockup):**
> - **(G9-SWEEP) งานหลัก:** ไล่ทุก mockup ทุก module แล้ว **ต่อท้ายรหัสสิทธิ์เป็น suffix** ให้ **ทุกปุ่ม/เมนู/row-action/tab-action ที่ถูก permission-gate** — เช่น `บันทึก (C)` · `แก้ไข (U)` · `ลบ (D)` · `อนุมัติ (A)` · `ตั้งค่า VAT (Ad)` · `มอบหมาย Sale (A)` · `สั่งผลิต (C)` · `ตัดสิน QC (U)` · `รีเซ็ตรหัสผ่าน (Ad)` · `ปรับยอดสต็อก (U)` · `รับเข้าคลัง/Goods Receipt (C)`.
> - **(G9-AUTHORITY) แหล่งรหัส = `permission-matrix.md` §3 คอลัมน์ "Suffix"** — ต่อ module ต่อ action มีรหัสกำกับไว้แล้ว. UX/UI **จับคู่ปุ่มในหน้าจอกับแถวในตาราง** แล้ว append รหัสนั้น. อย่าคิดรหัสใหม่นอก 6 ตัว (R/C/U/D/A/Ad).
> - **(G9-RULES):** (1) รหัส 6 ตัว: **R/C/U/D/A/Ad** (Ad=Admin). (2) **Read-only view/ปุ่มดูเฉย ๆ ละ (R) ได้** เว้นแต่มีประโยชน์ (ปุ่มที่ gate ด้วย Admin เช่น "ดู Audit log (Ad)" ต้องแสดง). (3) **cross-module = แสดงครบทั้งสอง** เช่น `แปลงเป็น PO (U+C)`. (4) suffix เป็น label ประกอบ — ไม่เปลี่ยน logic การ show/hide/disable ที่มีอยู่ (ยังยึด G5).
> - **(G9-SCOPE) ครอบทุก module:** customer · quotation · po · so · supply-planning · bom · stock/goods-receipt/return · production · qc · shipping · invoice · pr · supplier · settings (VAT/company/audit/role/user = Ad). Home/Dashboard/Platform = read-only เป็นหลัก (ละ (R) ได้ ยกเว้นปุ่มที่ gate).
> - ยึด `permission-matrix.md` §1b (G9 rule) + §3 (Suffix ต่อ action).
>
> **หมายเหตุ collision:** รอบนี้ PO แก้ **requirement docs เท่านั้น** (`permission-matrix.md` + `README.md`) — G9-SWEEP บน mockups เป็นงานที่ส่งต่อ UX/UI (เข้า GATE 1 review เฉพาะส่วน/ปุ่มที่ label เปลี่ยน). ไม่แตะ mockups ในรอบ PO นี้.

> **★★ รอบก่อน (Production PROD-1..14/STK-1 · Supply Planning SP-1..10 · Comment control · Customer Edit · Quotation REVERT Sent · Stock · Supplier/BOM · Settings) — คงตามรอบก่อน (commit history).**

---

## 9. Open questions
**ไม่มี open question ค้าง — ปิดครบทั้งหมด (2026-07-29).**

**คำถามที่ปิดแล้ว (2026-07-29):** Supply Planning proactive alert · Quotation abandon/review/REVERT Sent · Traceability/Reference · Customer · Comment convention · Stock · Supplier · BOM · Settings · **Production module review** · Delete Sale → unassigned · **Supply Planning module review** · **★★ QC + GR/Stock flow review** · **★★ NEW Return RM selector + list search → DECIDED (settled, no open Q)** · **★★ NEW G8 number-on-save → DECIDED (settled, no open Q)** · **★★★ NEW G9 permission-code suffix → DECIDED (settled, no open Q · code-set RUCDAA+Admin reconciled → R/C/U/D/A/Ad, ไม่มี Archive แยก).**

> **★★★ NEW — G9 PO reasonable decision (settled; ไม่ถือเป็น open question — ปอนด์ override ได้):**
> - **Code-set reconciliation:** "RUCDAA + Admin" ตีความชัดว่า A ตัวที่สองของ RUCDAA = **Admin** (ไม่ใช่ Archive) → 6 รหัสสาธารณะ **R/C/U/D/A/Ad** ตรงตามที่ปอนด์ระบุเป๊ะ. **ไม่มี capability "Archive"** ในโมเดลปัจจุบัน (deletion = soft-delete/void ผ่าน D; undelete/restore/force-override = Admin) → **ไม่ต้องเพิ่มรหัสที่ 7** และ **ไม่ ambiguous → ไม่มีคำถามค้าง**. *(ถ้าภายหลังปอนด์ต้องการแยก "Archive" ออกจาก Admin เป็นรหัสของตัวเอง — แจ้งปรับได้.)*

> **★★ NEW — PO reasonable decisions (settled; ไม่ถือเป็น open question — ปอนด์ override ได้):**
> - **★ G8 ขยายไป DN/SHP · Invoice · PRD · Batch = apply** (ปอนด์: "apply to those too unless one has a reason not to"). **ไม่มีเอกสารใดที่ genuinely shouldn't follow** → **ไม่มีคำถามค้าง**. ข้อยกเว้นเชิงเทคนิคที่อธิบายไว้ (ไม่ใช่ open question): **PRD/Batch** ออกเลขตอน action ("รับงาน"/"เริ่มผลิต") ไม่มีฟอร์ม create ที่โชว์ช่องเลข → ใช้ **confirm popup เดิมแสดงเลข** (NS1 N/A, ไม่ทำ popup ซ้อน); **Batch เลข derived** (`B-{PO}-{line}-{run}`) ไม่ใช่ gapless-per-เดือน; **PR auto จาก PO/SO** = ระบบออกเลขเอง ไม่มี popup (ไม่มี user action); **QC record + master code (RM/BOM/FG)** = นอกขอบเขต G8 (ไม่มี running number). *(ถ้าปอนด์อยากให้ doc ใด ไม่ใช้ G8 หรืออยากโชว์เลขล่วงหน้าบางใบ — แจ้งปรับได้.)*
> - **★ Return:** "1 Lot หลาย RM" มาจาก lot naming (`{supplier prefix}{YYMM}` แชร์หลาย RM, `goods-receipt.md` §3) → RM selector บังคับ + จำนวนคืนหักจาก (lot, RM). settled.

> **การตัดสินสมเหตุผลของ PO รอบก่อน (ไม่ถือเป็น open question):** QC-gated stock-in / GR object lifecycle / 1 PO หลาย PRD / "พร้อมส่ง" QC-gated / Rework ในกลุ่มกำลังผลิต / Stock Adjust อ้าง Lot/FIFO / Supply Planning revenue = ราคาขาย ก่อน VAT. (คงตามรอบก่อน)

> **สรุปสถานะ:** ทุกรายการ **settled → READY_FOR_UX_UI**. รอบล่าสุด = **doc-completeness fix** (comment-convention + numbering-on-save ได้ HTML view + hub link ครบ; ทุก .md → view 1:1). ก่อนหน้า: **G9 permission-code suffix** · Return RM selector + list search · G8 number-on-save.
