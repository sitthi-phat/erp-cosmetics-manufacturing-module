# Requirement Package (Per-Module) — ESSENCE Hub System

slug: `erp-v2-ui-first` · เขียนโดย PO · 2026-07-29 · **CANONICAL INPUT** สำหรับ BA / QA / Tech-Lead
สถานะ: consolidation ของ requirement ที่กระจัดกระจาย → per-module ที่โครงสร้างสม่ำเสมอ · reconciled กับ D1–D18 + fold คำสั่งใหม่ของปอนด์ (2026-07-29)

## สรุปภาษาไทย
เอกสารชุดนี้คือ **แหล่งความจริงล่าสุดแบบราย module** (customer / quotation / po / so / stock / bom / production / supply-planning) + **flow OEM/Own-Brand** + **permission matrix** + **HTML review view** สำหรับปอนด์อ่านง่าย. รวบเอา requirement เก่าที่กระจัดกระจายมาไว้ที่เดียว, ฝังกฎ D1–D18, เพิ่มของใหม่ปอนด์ (customer TYPE + credit term 30/60/90 default 60, customer search dropdown, pagination 20/หน้า, date-range search, drill+back คงสถานะ, permission-per-action, BOM TYPE + planning config, FG adjust, Supply Planning formulas + ปุ่มสั่งผลิตพา prefill ไปหน้า SO ผลิตเก็บสต็อก), และ **ลบ/แก้กติกาเก่าที่ผิด** (D8 เดิม + credit default). ยืนยัน 3 flow ที่ปอนด์สั่ง (Convert-to-PO, SO ขายจากสต็อก, SO ผลิตเก็บสต็อก) จากกฎที่ล็อกแล้ว. **ไม่มี business-gap ค้าง → READY_FOR_UX_UI** (ต้องแก้ mockup ต่อ).

---

## 1. โครงไฟล์ (file tree)

```
docs/requirements/erp-v2-ui-first/modules/
  README.md                  ← ไฟล์นี้ (index + D-rule spine + changelog + global rules)
  permission-matrix.md       ← capability → module → action/button (รวมทุก module, ต่อยอด §7.1)
  customer.md
  quotation.md               ← OEM Quotation (create/edit/convert-to-PO)
  po.md                      ← OEM Purchase Order
  so.md                      ← Own-Brand Sales Order (sell-from-stock + produce-to-stock)
  stock.md                   ← RM + FG (per-Batch/FIFO) + ledger + loss/adjust/surplus
  bom.md                     ← BOM + other-cost + TYPE(OEM/FG) + Supply-Planning config
  production.md              ← PRD/Batch + actual-qty/surplus + queue search/filter
  supply-planning.md         ← Demand & Production Cover + FORMULA SUMMARY (Pond review)
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
- **ใหม่ (D8 v2 — REFINED):** กด "สั่งผลิต" → **พาไปหน้า "สร้างใบสั่งขาย (Own-Brand) → (ข) ผลิตเก็บสต็อก (ไม่เลือกลูกค้า)" โดย PRE-FILL** จำนวน = Suggested + FG ที่เลือก → ผู้ใช้ทวน/ยืนยัน → จากนั้นจึงเข้าสาย production (BOM check → PRD ไม่ผูกลูกค้า → ถ้า RM ขาด auto-open PR → ผลิต → QC → FG เข้าคลัง).
- **เหตุผล delta:** ให้ produce-to-stock มี **ที่มาเดียว** (หน้า SO produce-to-stock) — Supply Planning เป็นแค่ตัว prefill. แก้ปัญหา "PRD สองที่มา" (เดิม punch-list U4) ให้จบ: Supply Planning ไม่ได้สร้าง PRD เอง.
- ผลกระทบ: ดู `supply-planning.md` §ปุ่มสั่งผลิต และ `so.md` (so-produce-to-stock).

### 2.2 ★ Credit Term (UPDATED 2026-07-29) — ระดับลูกค้ามี preset + default
- **เดิม:** credit ระดับลูกค้า + override รายใบแจ้งหนี้ (ไม่มี preset/ค่า default ระบุ).
- **ใหม่:** credit term **ระดับลูกค้า = 30 / 60 / 90 วัน · DEFAULT = 60** · **per-invoice override ยังทำได้เหมือนเดิม** (ยึด effective ตาม invoice date สำหรับ overdue).
- ผลกระทบ: ดู `customer.md` (field credit term) + `po.md`/`so.md` (แสดง credit term ตอนเลือกลูกค้า) + entity-status-map §1.3 (overdue = ส่งของแล้ว + เลยเครดิต).

> D1–D7, D9–D18 **ไม่เปลี่ยน**. อ้างถึงตามเลขเดิมทั้งเอกสารชุดนี้.

---

## 3. GLOBAL Rules (บังคับทุก module — ปอนด์สั่ง 2026-07-29)

| # | กติกา | รายละเอียด |
|---|---|---|
| **G1 Pagination** | list/history ทุกอัน **default 20 แถว/หน้า + pagination** | ใช้กับ quotation-list, po-list, so-list, production queue, customer QT/PO history, stock ledger, ฯลฯ |
| **G2 Date-range search** | ค้นได้ทั้ง **เลขเอกสาร** หรือ **ช่วงวันที่สร้าง (created-date range)** | quotation history, PO history, SO list, production queue (+ อื่น ๆ ที่เป็น list เอกสาร) |
| **G3 Drill + back คงสถานะ** | คลิกเข้า detail แล้วกลับ **ไม่เสีย state เดิม** (filter/scroll/tab) | ดูรายละเอียดลูกค้าจากหน้า order = **modal dialog** (กันฟอร์ม order หาย state) |
| **G4 Customer search dropdown** | ใช้บน quotation-create / po-create / so-create | ค้นด้วย **เบอร์โทร / ชื่อบริษัท / ชื่อผู้ติดต่อ / เบอร์ผู้ติดต่อ** · เมื่อ match แสดง **สถานะลูกค้า + credit term** · เปิด customer detail (modal) แล้วกลับได้โดยฟอร์มไม่หาย |
| **G5 Permission-per-action** | ทุกปุ่ม/control ที่ทำงานได้ ต้องระบุ capability/permission ที่ต้องมี | ตาราง permission→action ต่อ module (generic per D14/§7.1) รวมที่ `permission-matrix.md` |

> G1–G5 ระบุซ้ำในแต่ละ module (ในหัวข้อ "Pagination / Search" และ "Actions & Permissions") เพื่อให้ module ยืนได้ด้วยตัวเอง.

---

## 4. Confirmations ที่ปอนด์สั่งให้ยืนยัน (RESOLVED จากกฎที่ล็อก — ไม่ใช่การเดา)

| หัวข้อ | คำตัดสิน (อ้างกฎ) | เอกสาร |
|---|---|---|
| **Convert-to-PO** (จาก Quotation edit) | กด "Convert to PO" → ยืนยัน → QT = **ตกลง (Agreed)** (immutable) + เก็บลิงก์ QT↔PO → เปิดหน้า **po-create ที่ prefill** line/qty/ราคาจาก QT → ผู้ใช้กรอกที่เหลือ (เช่น วันที่ต้องการรับของ) → บันทึก = **PO เลขใหม่** (D18-1/D18-4) | `quotation.md` §Convert-to-PO · `flows/oem-flow.md` |
| **SO (ก) ขายจากสต็อก** — ปุ่ม "ยืนยันใบสั่งขาย (จอง FG)" | ของมี/พร้อมในสต็อก → **จอง FG (per-Batch)** + SO = **พร้อมส่ง (Ready to Ship)** → รอในโมดูล **การจัดส่ง** → ตัด FG FIFO ตอน dispatch → DN/Invoice (D2-a/D12/D16) | `so.md` §sell-from-stock · `flows/ownbrand-flow.md` |
| **SO (ข) ผลิตเก็บสต็อก** — ไม่เลือกลูกค้า | ทำตัวเหมือนเปิด PO: โชว์ **BOM RM stock check** → ส่งงานเข้า production; RM ขาด → **สร้าง production order ได้ + AUTO-open PR ไปคลัง**; ผลิตเสร็จ (QC ผ่าน) → **FG เข้าคลัง** → ขายภายหลังผ่าน (ก) (D2-b/D8-v2/D12) | `so.md` §produce-to-stock · `flows/ownbrand-flow.md` |

**หมายเหตุความต่าง (สำคัญ):** Quotation ทำ material check แต่ **ไม่ auto-open PR** (ต่างจาก PO/SO-produce-to-stock ที่ auto-open PR).

---

## 5. Changelog — เอกสารเก่าที่ถูก supersede / แก้ / ลบ

> หลักการ: ไม่ลบไฟล์ต้นทางทิ้ง (ยังเป็นประวัติ/audit) แต่ **ประกาศชัดว่าเนื้อหาส่วนใดถูกแทนที่** ด้วย per-module ชุดนี้ เพื่อไม่ให้มี "2 ความจริง". BA/QA/TL ให้ยึด per-module ชุดนี้เป็นหลัก.

| เอกสารเดิม | สถานะ | เหตุผล / สิ่งที่ถูกแทน |
|---|---|---|
| `scope-oem-ownbrand-supply-planning.md` | **ยังใช้ (rule spine)** แต่ **D8 + credit default ถูก override** โดย §2 ข้างบน | D8 v1 (สร้าง PRD เงียบ ๆ) → D8 v2 (prefill SO produce-to-stock). credit term เพิ่ม preset 30/60/90 default 60. ส่วน D1–D7/D9–D18 คงเดิม |
| `po-e2e-review-oem-ownbrand.md` §2 punch-list **U4** (PRD สองที่มา) | **RESOLVED / ปิด** | D8 v2 ทำให้ produce-to-stock มีที่มาเดียว (หน้า SO produce-to-stock) — Supply Planning แค่ prefill. ไม่มี PRD สองที่มาอีก |
| `stock-reservation.md` §3 "จุดตัดจริง — 2 ทางเลือก (คำถามหลัก)" | **ปิดคำถาม (ยึด Option A)** | ทั้งชุดนี้เขียนบนสมมติ **Option A: ตัดจริงตอน "เริ่มผลิต"** (คง GMP Batch↔Lot ตาม D16). §8 Q1 ของไฟล์นั้น = ตอบแล้ว = A. (Q2–Q5 = ยึด default ที่ PO แนะนำ: ใกล้หมด=Available, จองเกิน=เตือนไม่บล็อก, rework=ตัดจาก available, มูลค่าสต็อก=on_hand เท่านั้น) |
| "credit ระดับลูกค้า (ไม่มี preset)" ทุกที่ | **แก้** | ใช้ preset 30/60/90 default 60 (customer.md) |
| ข้อความใด ๆ ที่บอก "ปุ่มสั่งผลิต = สร้าง PRD ทันที" | **ลบ/แก้** | แทนด้วย D8 v2 (prefill SO produce-to-stock) |

> Visual punch-list เดิม **U1/U2/U3/U5/U6** (จาก `po-e2e-review-oem-ownbrand.md` §2) = **ยังค้าง เป็นงาน UX/UI รอบนี้** (ไม่ใช่ business-gap). รวมเข้ากับ delta ใหม่ในหัวข้อ "งานส่งต่อ UX/UI" §6.

---

## 6. งานส่งต่อ UX/UI (สรุป — รายละเอียดในแต่ละ module)

**เพิ่ม/แก้ mockup ที่ต้องทำ (จาก delta ใหม่ + punch-list เดิมที่ยังค้าง):**
1. **customer-*** — customer TYPE (OEM/Own-Brand, เลือกได้ทั้งคู่), credit term preset 30/60/90 default 60, รวม management-history เป็น section เดียว, QT history + PO history (search เลข/ช่วงวันที่, 20/หน้า, drill+back).
2. **quotation-create** — customer search dropdown, "เช็ควัตถุดิบตามสูตร" (ไม่ auto-PR), rename ปุ่มเป็น "บันทึก", หลังบันทึกโชว์ print-ready view.
3. **quotation-edit** — ปุ่ม "Convert to PO" (พา prefill ไป po-create).
4. **po-create** — customer search dropdown (+ status/credit term + modal detail + back-no-loss).
5. **so-*** — list search date-range; (ก) customer dropdown + ปุ่ม "ยืนยันใบสั่งขาย (จอง FG)" → Ready to Ship → รอ Delivery; (ข) BOM stock check + auto-PR + prefill จาก Supply Planning.
6. **stock** — FG tab ปรับยอดตรง (เหตุผลบังคับ + ledger source), + punch-list U2/U6 เดิม (RM ledger/loss form, surplus batch identity).
7. **bom-create** — ต้นทุนอื่น (ผู้ใช้ตั้งชื่อ+ค่าเอง, per-unit) + ต้นทุนรวม/หน่วย, TYPE selector (OEM/FG), planning config fields (Sales Rate/Lead/Safety/Target/Batch Size).
8. **production** — queue search (customer/PO/Own-Brand order เลข/ช่วงวันที่, 20/หน้า) + filter PO(OEM) vs Own-Brand + actual-qty/surplus (เดิม) + U1/U5 เดิม.
9. **supply-planning** — search FG by name + filter Low/OK/Overstock, edit rates + save back to BOM, ปุ่มสั่งผลิต → prefill SO produce-to-stock (D8 v2).
10. **pagination/search components** — global (G1/G2/G3) ทุก list; customer search dropdown component (G4) ใช้ซ้ำ 3 หน้า.

> ทุกจุดอ้าง D-rule / global rule ที่ล็อกแล้ว — **zero guessing**. Gate 1 ให้ปอนด์รีวิว "เฉพาะส่วนที่แก้".

---

## 7. Open questions
**ไม่มี business-gap ค้าง.** Confirmations ทั้ง 3 (Convert-to-PO / SO ขายจากสต็อก / SO ผลิตเก็บสต็อก) resolved จากกฎที่ล็อก. Delta ใหม่ทั้งหมด derive จากกฎ/หลักการที่ล็อกแล้ว (warning-not-block, Supply-Planning-เฉพาะ-Own-Brand-FG, RUCDAA generic).
สิ่งที่ปอนด์ควร sanity-check ตอน Gate 1 (ไม่ block — เป็นการยืนยันหน้าตา): (a) BOM TYPE selector labels "OEM / FG" + planning config โผล่เฉพาะ FG type; (b) customer TYPE mismatch = **เตือนไม่บล็อก** (soft filter dropdown) ตอนเปิด order ผิดสาย. → **READY_FOR_UX_UI**.
