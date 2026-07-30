# Requirement Package (Per-Module) — ESSENCE Hub System

slug: `erp-v2-ui-first` · เขียนโดย PO · 2026-07-30 · **CANONICAL & COMPLETE SINGLE SOURCE OF TRUTH** สำหรับ BA / QA / Tech-Lead
สถานะ: consolidation ของ requirement ที่กระจัดกระจาย → per-module ที่โครงสร้างสม่ำเสมอ **ครบทุก module + NFR + Deletion Policy** · reconciled กับ D1–D18 + fold คำสั่งใหม่ของปอนด์ (2026-07-29 · **+ Customer/Route/DN 3-module review 2026-07-30**)

## สรุปภาษาไทย
เอกสารชุดนี้คือ **แหล่งความจริงล่าสุดแบบราย module ที่ครบถ้วน (single source of truth)** ของทั้งระบบ ESSENCE Hub. **★★★ NEW — 3 modules ที่ปอนด์รีวิว (2026-07-30, ผูกกันแน่น):** **(A) Customer** — เพิ่ม **ที่อยู่ลูกค้า (registered)** และ **ที่อยู่จัดส่งสินค้า (shipping)** แยกกัน + ผู้ติดต่อมี flag **"เป็นคนรับสินค้า (is receiver)"** (ติด flag = ชื่อ+เบอร์บังคับ). **(B) การจัดส่ง (Shipping)** — รอบจัดส่งเป็น **"Route" รหัส `RT-…`** (★ reconcile SHP: PO เสนอ RT แทน SHP — **Q1 รอปอนด์**); Route list ค้นคนขับ/username/route-id + ช่วงวันชนิดวัน + ปุ่ม "สร้าง Route"; หน้าสร้าง/แก้ (คนขับ=user, เบอร์\*, ประเภทรถ\*×5, ทะเบียน, วัน-เวลา) + modal เพิ่ม PO/SO/DN (เรียงตามวันต้องการรับ, เลือกได้เฉพาะพร้อมจัดส่ง) + modal รายละเอียด order แสดง ที่อยู่จัดส่ง/ผู้รับ; **สถานะ เตรียมจัดของ→กำลังออกไปส่ง→เสร็จสิ้น(บังคับสรุปผลราย DN + comment G6)/ยกเลิก**; บันทึกสร้างรอบ → G8 popup เลข RT + ทุก DN. **(C) ใบจัดส่ง DN** — module เอกสารแยก; **6 สถานะใหม่** (อยู่ระหว่างการเตรียม/อยู่ระหว่างจัดส่ง/ส่งสำเร็จ/ลูกค้าเลื่อนส่ง/ลูกค้ายกเลิก/ลูกค้ายังไม่กำหนดวันรับใหม่); สร้างตรงไม่ได้ (ผ่าน Route); ค้น (คนขับ/username/route-id/PO-SO/วันลูกค้าต้องการรับ) + filter สถานะ; **print DN + print Invoice**; comment (G6); **★ แก้สถานะ DN โดยตรง = สิทธิ์ A (Approve, G9)**; **★ PO/SO delivery status = LINKED จาก DN status — ทุกจอที่โชว์สถานะ PO ต้องใช้ logic นี้ (po.md §4b)**. **คงกฎเดิม:** 2-tier Route/DN · G8 number-on-save · G6 comment · G9 permission-code · entity-status-map. **★ ทุกไฟล์ `.md` มี HTML review view + ลิงก์ในหน้า index — รอบนี้เพิ่ม `delivery-note.md`→`delivery-note.html` (view + _render map + index link ครบ).**

---

## 1. โครงไฟล์ (file tree — ครบทั้งชุด)

```
docs/requirements/erp-v2-ui-first/modules/
  README.md                  ← ไฟล์นี้ (index + D-rule spine + changelog + source-of-truth + old→new map + global rules)
  permission-matrix.md       ← capability → module → action/button → ★ Suffix (G9) · ★ แก้สถานะ DN = A
  comment-convention.md      ← ★ กติกากลาง comment + change-history (CC1–CC7) · 12 object (Shipment→Route)
  numbering-on-save.md        ← ★ กติกากลาง G8 = เลขเอกสารออกตอนบันทึก (NS1–NS7) · DN+Route (RT)

  # System-wide / Governance (Non-Functional bucket ใน Hub)
  non-functional.md          ← NFR รวม (★ +Route/DN r11 · RT numbering · DN status-edit A)
  deletion-policy.md         ← soft-delete/void baseline + entity
  traceability.md            ← trace/audit governance (★ +Route/DN entity + DN status-edit A audit)

  # Platform & Navigation
  platform.md · home.md · dashboard.md

  # Sales & Customer
  customer.md (★ +ที่อยู่ลูกค้า/ที่อยู่จัดส่ง + ผู้ติดต่อ=คนรับสินค้า) · quotation.md · po.md (★ +§4b สถานะจัดส่ง=สะท้อน DN) · so.md (★ +สถานะจัดส่ง=สะท้อน DN)

  # Supply Planning & Production (Functional · ผลิต&คุณภาพ)
  bom.md · supply-planning.md
  production.md              ← คิวผลิต 2 แท็บ + management page + comment
  qc.md                      ← ตรวจรับ RM (QC-gate) + ตรวจแบตช์ 2 sub-tab

  # Inventory & Procurement (Functional · คลัง&จัดซื้อ)
  stock.md · goods-receipt.md · pr.md · supplier.md · return.md

  # Fulfilment & Finance
  shipping.md (★★★ Module B — Route `RT-…` + สร้างรอบ + modal + status actions) · delivery-note.md (★★★ Module C ใหม่ — DN 6 สถานะ + search + print DN/Invoice + comment + แก้สถานะ A) · invoice.md

  # System
  settings.md

  flows/  oem-flow.md · ownbrand-flow.md
```

HTML review view: `docs/design/erp-v2-ui-first/functional-spec/modules/index.html` · Hub `functional-spec/index.html`.
**★ Doc-completeness: ทุกไฟล์ `.md` มี HTML review view ครบ 1:1 + ลิงก์ในหน้า Modules index** (render จาก .md ผ่าน `_render.js`). **★ รอบนี้เพิ่ม `delivery-note.md`→`delivery-note.html`** (สร้าง view + เพิ่ม map ใน `_render.js` + ลิงก์ในกลุ่ม "จัดส่ง & การเงิน" ของ index.html + shipping.html view rename เป็น "Shipping / Route" + nav ชี้ delivery-note).

---

## 2. D-Rule Spine (คงเป็นแกน — พร้อม DELTA)
D1–D18 ยังเป็นกฎแกน (`scope-oem-ownbrand-supply-planning.md` §1). จุดอัปเดตหลัก (คงตามรอบก่อน): **D8 v2** (สั่งผลิต batch-count) · **credit 60** · **D18 reseat** (QT Confirmed) · **D11 v2** (BOM/FG+RM code user-entered lock) · **D13 reinforce** (พร้อมส่ง QC-gated) · **D9/D10** (margin sim) · **D12/D16** (QC-gated stock-in). **★★★ 2026-07-30:** Route/DN rewrite ไม่แตะ D-rule แต่ implement D1/D16 (DN อ้าง PO/SO · FG FIFO per-Batch ตอน dispatch = DN "ส่งสำเร็จ").

---

## 3. GLOBAL Rules (บังคับทุก module)

| # | กติกา | รายละเอียด |
|---|---|---|
| **G1 Pagination** | list/history ทุกอัน **20 แถว/หน้า + pagination** | ทุก list + **★ Route list · DN list** |
| **G2 Date-range search** | ค้น **เลขเอกสาร** หรือ **ช่วงวันที่** | quotation/PO/SO/GR/PR/invoice list + production queue + audit + **★ Route/DN list (ช่วงวันชนิดวัน = สร้าง route / route ออกไปส่ง)** |
| **G3 Drill + back คงสถานะ** | กลับ **ไม่เสีย state เดิม** | dashboard drill · detail modal · **★ Route add-order modal + order detail modal** |
| **G4 Customer search dropdown** | quotation/po/so-create | ค้นเบอร์/บริษัท/ผู้ติดต่อ · Disabled/Blacklist hard block |
| **G5 Permission-per-action** | ทุกปุ่มระบุ capability | `permission-matrix.md` · **★ แสดงรหัสเป็น suffix ตาม G9** |
| **★ G6 Comment + change-history** | ทุก object ธุรกรรมมี **ช่องหมายเหตุเดียว แก้ในที่ + เก็บประวัติครบ** | **12 object** (Shipment→**Route**) · `comment-convention.md` · **★ comment DN บังคับตอน status-update** |
| **★ G7 Search-in-dropdown** | RM/FG/Lot/component + Return RM-in-lot | ค้นชื่อ+รหัส · **★ Route driver ค้นชื่อ/username** |
| **★ G8 Document number on SAVE** | create ทุกใบ: ไม่โชว์เลขล่วงหน้า → ออกเลข gapless ตอนบันทึก + popup ยืนยัน · ร่างที่ไม่บันทึกไม่กินเลข | `numbering-on-save.md` (NS1–NS7) · **★ Route (RT) + ทุก DN ออกพร้อมกันตอนสร้างรอบ (NS7)** |
| **★ G9 Permission-code suffix** | ทุก actionable control ที่ permission-gate แสดงรหัสสิทธิ์เป็น suffix | รหัส 6 ตัว: R/C/U/D/A/Ad · **★ แก้สถานะ DN = (A)** · authority = `permission-matrix.md` §3 |

> NFR ระดับระบบ รวมที่ `non-functional.md`.

---

## 4. Confirmations ที่ปอนด์สั่งให้ยืนยัน (RESOLVED)

| หัวข้อ | คำตัดสิน | เอกสาร |
|---|---|---|
| **Convert-to-PO** | QT = **Confirmed ทันที** + loose link | `quotation.md` · `po.md` · oem-flow |
| **SO (ก)/(ข)** | จอง FG→พร้อมส่ง→ตัด FIFO→DN/Invoice · ผลิตเก็บสต็อก auto-PR | `so.md` · `shipping.md` |
| **★ Comment convention** | **12 object** มีช่อง comment เดียว แก้ในที่ + เก็บประวัติ | `comment-convention.md` |
| **★ Customer Edit / follow-up flag / financial summary** | Edit ครบทุกฟิลด์ · flag ⚑ แยก enum · financial roll-up | `customer.md` · entity-status-map §1.1 |
| **★ Delete Sale → customers unassigned** | ลบ Sale → ลูกค้า unassigned อัตโนมัติ | `settings.md` US-SET-02 · `customer.md` §4.3 |
| **★★ Stock/Supplier/BOM/Settings/Production/Supply Planning/QC+GR reviews** | (settled รอบก่อน — commit history) | ราย module |
| **★★ Return RM selector + G8 number-on-save + G9 permission-code** | (settled รอบก่อน) | `return.md` · `numbering-on-save.md` · `permission-matrix.md` |
| **★★★ NEW — Customer address + receiver-contact (2026-07-30)** | **ที่อยู่ลูกค้า (registered) + ที่อยู่จัดส่ง (shipping) แยกกัน** (+ option "ใช้ที่อยู่เดียวกัน") · **ผู้ติดต่อ flag "เป็นคนรับสินค้า" → ชื่อ+เบอร์บังคับ** · ทั้งคู่ไปแสดงบน Route modal + หัว DN | `customer.md` §3/§9b · `shipping.md` §5 · `delivery-note.md` §5/§7 |
| **★★★ NEW — Shipping = Route (`RT-…`) rewrite (2026-07-30)** | รอบ = Route; สถานะ เตรียมจัดของ→กำลังออกไปส่ง→เสร็จสิ้น(สรุป DN + comment)/ยกเลิก; หน้าสร้าง/แก้ + modal เพิ่ม PO/SO/DN + status actions; G8 popup RT+DN; **★ RT vs SHP = Q1 รอปอนด์** | `shipping.md` · entity-status-map §1.9 · `numbering-on-save.md` |
| **★★★ NEW — DN module (2026-07-30)** | DN 6 สถานะ; สร้างตรงไม่ได้; ค้น + filter; print DN/Invoice; comment (G6); **★ แก้สถานะ DN โดยตรง = A**; **★ PO/SO status = สะท้อน DN (ทุกจอ)** | `delivery-note.md` · `po.md` §4b · `so.md` §4 · entity-status-map §1.10 · `permission-matrix.md` |

**หมายเหตุ:** Quotation ทำ material check แต่ **ไม่ auto-open PR**.

---

## 5. ★ Source-of-Truth Statement (ประกาศชัด)
1. **`modules/*.md` = AUTHORITATIVE spec ปัจจุบันของทุก module + NFR + Deletion Policy + Traceability** — ชุดเดียวที่ BA/QA/TL ยึด.
2. แต่ละ .md = **spec เต็ม**. governance authoritative: `non-functional.md` · `deletion-policy.md` · `traceability.md` · `comment-convention.md` (G6) · `numbering-on-save.md` (G8) · `permission-matrix.md` (RBAC+G9).
3. **เอกสารเก่า** = historical reference → Hub ⑥ Archive.
4. **เอกสารหลักการเชิงลึก** (`entity-status-map` **§1.9/§1.10 = Route/DN r11**, `status-journeys`, `stock-reservation`, scope D1–D18, ...) = authoritative reference → Hub ③. **module package wins ถ้าขัดกัน.**
5. **RTM/Traceability คงครบ.**
6. **Navigation IA:** ① Functional · ② Non-Functional · ③ Reference · ④ Architecture · ⑤ Mockups · ⑥ Archive.
7. **★ HTML review view = 1:1 ต่อทุก .md** (render จาก .md ผ่าน `_render.js`). **★ delivery-note.md ได้ view + link ครบรอบนี้.**

---

## 6. ★ Map: เอกสารเก่า → ครอบคลุมโดย module ใด
| เอกสารเก่า | ครอบคลุมโดย module (authoritative) | หมายเหตุ |
|---|---|---|
| functional-spec `shipping.html` (Shipment+DN รวม) | `shipping.md` (Route) + **`delivery-note.md` (DN แยก)** | ★ split เป็น 2 module (B/C) |
| functional-spec BA pages อื่น | โมดูลชื่อเดียวกันใน `modules/` | absorbed เต็ม · เก่าอยู่ ⑥ Archive |
| `SHP-…` numbering (glossary/ADR-008) | **`RT-…` (numbering-on-save + non-functional D-F5)** | ★ rename — Q1 รอปอนด์ |

---

## 7. Changelog — supersede / แก้ / ปอนด์เคาะ
| เอกสาร/รายการ | สถานะ | เหตุผล |
|---|---|---|
| (รายการรอบก่อน — Quotation/Customer/Stock/Supplier/BOM/Settings/Production/Supply Planning/QC+GR/Return/G8/G9/doc-completeness) | **settled** | commit history |
| **★★★ NEW — Customer address + receiver-contact (Module A)** | **DECIDED 2026-07-30 (ปอนด์) · settled** | **ที่อยู่ลูกค้า (registered) + ที่อยู่จัดส่ง (shipping) แยกกัน** (split จาก "ที่อยู่/เลขภาษี" เดิม → ที่อยู่ลูกค้า + เลขภาษี + ที่อยู่จัดส่ง) · **ผู้ติดต่อ flag "เป็นคนรับสินค้า" → ชื่อ+เบอร์บังคับครบ (HARD validation §9b)** · ทั้งคู่แสดงบน Route modal + หัว DN. อัปเดต `customer.md` §1/§2/§2b/§3/§8/§9/§9b/§11/§12. |
| **★★★ NEW — Shipping → Route (`RT-…`) rewrite (Module B)** | **DECIDED 2026-07-30 (ปอนด์) · settled ยกเว้น Q1** | รอบ Shipment → **Route (`RT-…`)**; สถานะใหม่ 4 ตัว (เตรียมจัดของ/กำลังออกไปส่ง/เสร็จสิ้น/ยกเลิก); **"เสร็จสิ้น" = action บังคับสรุปผลราย DN + comment (G6)**; Route list (ค้นคนขับ/username/route-id + ช่วงวันชนิดวัน + คอลัมน์ + ปุ่มสร้าง Route + row edit); หน้าสร้าง/แก้ (คนขับ=user ค้นชื่อ/username · เบอร์\* · route · ประเภทรถ\*×5 · ทะเบียน · วัน-เวลา); modal เพิ่ม PO/SO/DN (เรียงตามวันต้องการรับ, ค้น code/ลูกค้า/ผู้ติดต่อ/เบอร์, เลือกได้เฉพาะพร้อมจัดส่ง, filter default พร้อมจัดส่ง); modal รายละเอียด order = ชื่อลูกค้า/ที่อยู่จัดส่ง/เบอร์ผู้รับ; **G8 popup RT + ทุก DN (PO/SO ใบไหนได้ DN ใด)**. อัปเดต `shipping.md` (rewrite) · entity-status-map §1.9 · `numbering-on-save.md` · `comment-convention.md` · `non-functional.md`. **★ Q1: RT vs SHP numbering — รอปอนด์.** |
| **★★★ NEW — Delivery Note (DN) module (Module C)** | **DECIDED 2026-07-30 (ปอนด์) · settled** | DN = module เอกสารแยก (`delivery-note.md`, HTML view ใหม่). **DN 6 สถานะ** (อยู่ระหว่างการเตรียม/อยู่ระหว่างจัดส่ง/ส่งสำเร็จ/ลูกค้าเลื่อนส่ง/ลูกค้ายกเลิก/ลูกค้ายังไม่กำหนดวันรับใหม่) แทนชุดเดิม 4; **สร้าง DN ตรงไม่ได้ (Route เท่านั้น)**; ค้น (คนขับ/username/route-id/PO-SO/วันลูกค้าต้องการรับ) + filter สถานะ; **print DN + print Invoice**; comment (G6, บังคับตอน status-update); **★ แก้สถานะ DN โดยตรง = Shipping.Approve (A)**; **★★ PO/SO delivery status = LINKED จาก DN status (rule กลาง, ทุกจอ: po-list/po-detail/dashboard/production queue/home)** — `po.md` §4b + `so.md` §4. **Rollup = DN ล่าสุด (active)** (1 DN=1 PO เต็ม). อัปเดต `delivery-note.md` (ใหม่) · `po.md` §4b · `so.md` §4 · entity-status-map §1.2/§1.10 + cascade 9–12/25 + r11 · `permission-matrix.md` · `traceability.md` §3/§4 · `numbering-on-save.md` · `non-functional.md`. |
| **★ Doc-completeness — delivery-note view (2026-07-30)** | **DONE (docs เท่านั้น)** | สร้าง `delivery-note.html` (shell เดียวกับ shipping.html · data-src ชี้ delivery-note.md) · เพิ่ม map ใน `_render.js` · ลิงก์ใน `modules/index.html` (กลุ่ม จัดส่ง & การเงิน) · shipping.html rename เป็น "Shipping / Route" + nav → delivery-note. **ทุก .md → view + link ครบ 1:1.** |

---

## 8. งานส่งต่อ UX/UI (สรุป)

**punch-list เดิม + delta รอบก่อน:** (คงตามรอบก่อน — commit history)

> **★★★ NEW รอบนี้ (2026-07-30) — 3 modules (Customer/Route/DN) ที่ UX/UI ต้องเพิ่ม/แก้:**
>
> **(A) Customer — `customers.html` · `customer-create.html` · `customer-detail.html` · `contact-create.html`:**
> - **(CUS-1) ที่อยู่ 2 ช่อง:** แยก **"ที่อยู่ลูกค้า (registered/ออกเอกสาร)"** + **"ที่อยู่จัดส่งสินค้า (shipping)"** (บน create/edit/detail) + checkbox/option **"ใช้ที่อยู่เดียวกับที่อยู่ลูกค้า"** (copy). แยกจากช่อง "ที่อยู่/เลขภาษี" เดิม (→ ที่อยู่ลูกค้า + เลขภาษี + ที่อยู่จัดส่ง).
> - **(CUS-2) ผู้ติดต่อ = คนรับสินค้า:** เพิ่ม **checkbox "เป็นคนรับสินค้า (is receiver)"** ต่อผู้ติดต่อ (contact-create + edit). ติด flag = **ชื่อ+เบอร์บังคับครบ** (validation error ถ้าว่าง). ติดได้หลายคน. detail แสดงป้าย "คนรับสินค้า" ต่อผู้ติดต่อ.
> - ยึด `customer.md` §3/§9b.
>
> **(B) Shipping / Route — `shipping.html`:**
> - **(RT-1) Route LIST:** ค้น **ชื่อคนขับ/username/route id** + **ช่วงวันที่ + dropdown ชนิดวัน (สร้าง route / route ออกไปส่ง)** · คอลัมน์ **RouteID · วันที่สร้าง · วันที่ออกไปส่ง · จำนวน PO/SO · Status** · ปุ่ม **"สร้าง Route (C)" มุมขวาบน** · row **edit action** (สถานะ/comment/เพิ่ม-แก้ SO/PO).
> - **(RT-2) Create/Update Route:** ฟิลด์ **คนขับ (search-in-dropdown ชื่อ/username, = system user) · เบอร์ติดต่อคนขับ\* · Route/เส้นทาง · ประเภทรถ\*** {รถกระบะ/รถเก๋ง/มอเตอร์ไซด์/รถ 10 ล้อ/รถ 6 ล้อ} **· ทะเบียนรถ · วัน-เวลาออกรอบ**. ช่องเลข Route/DN = **"(ระบบออกให้เมื่อบันทึก)" (G8)**.
> - **(RT-3) modal เพิ่ม PO/SO/DN:** candidate list **เรียงตามวันที่ต้องการรับ เร็ว→ช้า** · ค้น **code/ชื่อลูกค้า/ชื่อผู้ติดต่อ/เบอร์ผู้ติดต่อ** (ค้นทุกสถานะ) · **เลือกได้เฉพาะ "พร้อมจัดส่ง"** · **filter สถานะ default = พร้อมจัดส่ง**.
> - **(RT-4) status actions:** เตรียมจัดของ (auto ตอนสร้าง) → **กำลังออกไปส่ง** (ปุ่ม) → **เสร็จสิ้น** (ปุ่ม — **บังคับสรุปผลราย DN ทุกใบ + comment; เลื่อนส่ง=บังคับ next date**) · **ยกเลิก** (ทุกเมื่อ).
> - **(RT-5) G8 popup:** บันทึกสร้างรอบ → popup **เลข RT + สรุป + เลข DN ทุกใบ (ระบุ PO/SO ใบไหนได้ DN ใด) + ลิงก์ดู/พิมพ์**.
> - **(RT-6) modal รายละเอียด order:** คลิก PO/SO/DN → แสดง **ชื่อลูกค้า / ที่อยู่จัดส่ง / เบอร์ผู้รับ** (จาก customer).
> - ยึด `shipping.md`. **★ ชื่อ/เลข RT vs SHP = รอ Q1 (ถ้าปอนด์ตอบ B ค่อยปรับ prefix).**
>
> **(C) Delivery Note (DN) — `delivery-note.html`:**
> - **(DN-1) search:** คนขับ/username/route id (+ ช่วงวันชนิดวัน) · **PO/SO** (ไม่มี DN → DN ว่าง) · **วันที่ลูกค้าต้องการรับ** · **filter สถานะ DN (6)**.
> - **(DN-2) 6 สถานะ:** แสดง badge อยู่ระหว่างการเตรียม/อยู่ระหว่างจัดส่ง/ส่งสำเร็จ/ลูกค้าเลื่อนส่ง/ลูกค้ายกเลิก/ลูกค้ายังไม่กำหนดวันรับใหม่.
> - **(DN-3) print:** ปุ่ม **พิมพ์ DN (R)** + **พิมพ์ Invoice (R)** (จากข้อมูลลูกค้า+PO/SO).
> - **(DN-4) comment (G6)** ต่อ DN + ประวัติ.
> - **(DN-5) ★ แก้สถานะ DN โดยตรง = ปุ่มที่ gate ด้วย Shipping.Approve → suffix (A)** + บังคับ comment (+ next date ถ้าเลื่อน).
> - **(DN-6) สร้าง DN ตรงไม่ได้** — ไม่มีปุ่ม "สร้าง DN".
> - ยึด `delivery-note.md`.
>
> **(D) PO/SO status display — ทุกจอที่โชว์สถานะ PO/SO:**
> - **(POS-1) combined logic:** `po-list · po-detail · so-list · so-detail · dashboard · production queue · home` แสดงสถานะจัดส่งด้วย **สถานะ PO เอง → พร้อมจัดส่ง → สะท้อนสถานะ DN 6 ค่า** (เลิกใช้ In Delivery/Delivered enum เดิม). ยึด `po.md` §4b / `so.md` §4 · `delivery-note.md` §8.
>
> **หมายเหตุ collision:** รอบนี้ PO แก้ **requirement docs เท่านั้น** — งาน mockup ทั้งหมดข้างต้นส่งต่อ UX/UI (เข้า GATE 1 review เฉพาะส่วนที่เปลี่ยน). ไม่แตะ mockups ในรอบ PO นี้.

---

## 9. Open questions
**★ มี 1 open question (Q1) — รอปอนด์:**

> **Q1 (GENUINE) — RT vs SHP numbering:** รอบจัดส่งเดิมมีเลข `SHP-{YYYYMMDD}-{NNNN}` (locked, D-F5). ปอนด์ให้รอบเป็น "Route" รหัส `RT-…`.
> - **ตัวเลือก A (PO แนะนำ):** **RT แทน SHP ทั้งหมด** — รอบเปลี่ยนชื่อเป็น "Route", เลข `RT-{YYYYMMDD}-{NNNN}` (gapless ต่อวัน แบบเดิม), เลิกใช้ SHP. (ระบบยังไม่ deploy → ไม่มีข้อมูลจริงต้อง migrate; เอกสารทั้งชุดเขียนด้วยสมมติฐานนี้ไว้ก่อน.)
> - **ตัวเลือก B:** **RT อยู่ร่วมกับ SHP** — รอบมี 2 เลข (SHP = เลขเอกสารรอบ + RT = route identifier แยก).
> - ถ้าเลือก B → ปรับ delta เล็กที่ `shipping.md`/`numbering-on-save.md`/`non-functional.md` D-F5/entity-status-map §1.9.

**PO reasonable decisions รอบนี้ (settled; ไม่ถือเป็น open question — ปอนด์ override ได้):**
- **DN 6 สถานะ = supersede ชุดเดิม 4** (กำลังนำส่ง/ส่งถึงแล้ว/ถูกปฏิเสธ/เลื่อนส่ง) — ปอนด์ให้ชุดใหม่ครบ; behavior "ถูกปฏิเสธ" เดิม fold เข้า ยกเลิก/เลื่อน/ยังไม่กำหนดวัน (order re-route = gen DN ใหม่).
- **PO/SO delivery status = สะท้อน DN, rollup = DN ล่าสุด (active).** เพราะ **1 DN = 1 PO เต็มใบ** จึงไม่มีหลาย DN active พร้อมกัน; DN เก่าที่ re-route = ประวัติ (superseded). *(ถ้าอนาคตแตก PO เป็นหลาย DN พร้อมกัน จะนิยาม aggregate rollup เพิ่ม.)*
- **"เสร็จสิ้น" Route = action ที่ผู้ใช้กด + บังคับสรุปผลราย DN + comment** (แทน auto-close เดิม).
- **แก้สถานะ DN โดยตรง = Shipping.Approve (A)** (ปอนด์สั่งชัด); print DN/Invoice = (R).

**คำถามที่ปิดแล้ว (รอบก่อน):** Supply Planning/Quotation/Customer(follow-up,financial,unassign)/Comment/Stock/Supplier/BOM/Settings/Production/QC+GR/Return/G8/G9. (คงตามรอบก่อน — commit history)
