# Module — Traceability + Field-level Audit

slug: `erp-v2-ui-first` · per-module canonical · PO · 2026-07-29 · **AUTHORITATIVE SPEC** (absorbs functional-spec `traceability.html` US-TRC-01..03)
Mockups: `mockups/trace.html`
กฎอ้างอิง: GMP (Lot→Batch→FG) · `settings.md` US-SET-05 (Audit log = มุมมองรวมของ field-audit เดียวกัน) · stock ledger (reason/source, D15) · Glossary (Lot vs Batch) · README §3 · **`quotation.md` §10 (QT activity actions)** · **`comment-convention.md` (comment field = audited/trace-visible ทุก object ธุรกรรม)** · **`stock.md` §3b/§6 (add-RM + loss/adjust movements)** · **`bom.md` §5c/§9 (BOM changes + inactivate)** · **`supplier.md` §10 (supplier + price-matrix changes)**

## สรุปภาษาไทย
สืบย้อน GMP + audit ระดับ field: **entity selector** (ค้นได้ทุก entity + field ที่ค้นได้ต่อ entity) + **date range + time** · **genealogy Lot→Batch→line→PO→ลูกค้า→DN/INV** (คลิก node ไปหน้าจริง; rework = Batch run ใหม่) · **ตาราง field-audit** (คอลัมน์ เวลา/ผู้ทำ/entity/field/จาก→เป็น/เหตุผล + filter/sort/pagination) · **archive เป็น text file (Super User เท่านั้น)**. retention online 1 ปี, หลังจากนั้น Super User manual purge/archive (ไม่มี auto-purge). เป็นแหล่ง audit เดียวกับ Settings Audit-log. สอดคล้อง scope ใหม่: **QT = head-of-chain** (OEM สาย Quotation→PO — **ทุก action ของ QT: create/edit→version/convert→Confirmed/cancel ถูก log และค้น/แสดงบน trace ได้**; ★ ไม่มีสถานะ "ส่งแล้ว/Sent" และไม่มี sent-date — revert 2026-07-29), **FG per-Batch** (ผูก Own-Brand Batch/PRD, **ค้นได้ทั้งชื่อและรหัส**), **stock ledger มี reason/source** ต่อ movement. **★ ทุก stock movement (เพิ่มวัตถุดิบใหม่/loss −/adjust +/GR/FG-in/surplus/return — RM+FG) ถูก audit + โผล่บน trace พร้อม reason + source (D15).** **★ ทุกการเปลี่ยนแปลง BOM (สร้าง/แก้ฟิลด์/แก้ราคาซื้อ/inactivate/reactivate) และ Supplier (สร้าง/แก้/active↔inactive/price-matrix) ถูก audit + trace-visible.** **★ ช่อง `comment` ของทุก object ธุรกรรม (QT/PO/SO/PRD/Batch/DN/Shipment/Invoice/GR/PR) เป็น field ที่ถูก audit เต็ม (แก้ทับได้แต่เก็บประวัติ ใคร/เมื่อ/เดิม→ใหม่) และโผล่บนหน้า trace — ยึด `comment-convention.md`.**

---

## 1. Purpose
ตอบคำถาม GMP/ตรวจสอบได้ทุกกรณี: "ของชิ้นนี้มาจาก Lot ไหน ผลิต Batch ไหน ขายใคร" และ "ใครแก้ค่าอะไร เมื่อไหร่ เพราะอะไร" — ครบทุก entity + ทุก field (รวมช่อง `comment`, ทุก stock movement, การเปลี่ยน BOM/Supplier).

## 2. Screens
| หน้าจอ | บทบาท |
|---|---|
| `trace.html` | entity selector + field · date-range+time · genealogy (node คลิกได้) · ตาราง field-audit (filter/sort/pagination) · archive |

## 3. Entity ที่ค้นได้ + field (จาก US-TRC-01)
| Entity | field ที่ค้นได้ |
|---|---|
| ลูกค้า (Customer) | รหัส CUS / ชื่อ / เบอร์ / สถานะ |
| **Quotation (QT)** ★ | เลข QT / ลูกค้า / สถานะ (ร่าง/ยืนยัน/ปฏิเสธ/ยกเลิก — ★ ไม่มี "ส่งแล้ว/Sent") / วันที่สร้าง — **head-of-chain สาย OEM** |
| PO | เลข PO / ลูกค้า / สถานะ fulfilment/billing |
| **SO (Own-Brand)** ★ | เลข SO / ลูกค้า(ถ้ามี) / ชนิด (ขายจากสต็อก/ผลิตเก็บสต็อก) / สถานะ |
| PRD / Batch | เลข PRD / เลข Batch `B-{PO}-{line}-{run}` / สถานะ |
| **วัตถุดิบ (RM) / Lot** | **รหัส RM (ผู้ใช้ตั้งตอนสร้าง, unique, ★ ล็อกหลังสร้าง) / ชื่อ** / เลข Lot / supplier / qc_status · **event สร้าง RM master + loss/adjust movement audit ได้** |
| **FG (สินค้าสำเร็จรูป, per-Batch)** ★ | **รหัส FG (= รหัส BOM, ผู้ใช้ตั้งตอนสร้าง+ล็อก) / ชื่อ** / เลข Batch / ยอดราย Batch · **FG-in/surplus/loss/adjust movement audit ได้** — ค้นได้ทั้งชื่อและรหัส (`stock.md` §4) |
| **BOM (สูตร/FG master)** ★ | **รหัส BOM/FG / ชื่อ / TYPE / สถานะ (Active/Inactive)** · **event: สร้าง / แก้สูตร-ต้นทุน-ราคาซื้อ / inactivate / reactivate = audit ได้** (`bom.md` §5c/§9) |
| PR / GR | เลข PR / เลข GR / วัตถุดิบ / สถานะ |
| **Supplier** ★ | **รหัส SUP / ชื่อ / สถานะ active** · **event: สร้าง / แก้ข้อมูล / active↔inactive / แก้ price-matrix (คู่ supplier×วัตถุดิบ×ราคา) = audit ได้** (`supplier.md` §10) |
| Shipment / DN / Invoice | เลข SHP / DN / INV / ลูกค้า / สถานะ |
> **★ field `comment` (2026-07-29):** ทุก object ธุรกรรม (QT/PO/SO/PRD/Batch/DN/Shipment/Invoice/GR/PR) มี field `comment` ที่ **audit ได้** — ปรากฏในตาราง field-audit (§4) และ filter ด้วย field="comment" ได้ (ค้นการเปลี่ยนแปลง comment ของ entity นั้น). ดู `comment-convention.md`.

## 4. Data model / rules
| รายการ | กติกา |
|---|---|
| genealogy | Lot→Batch→line→PO(หรือ SO)→ลูกค้า→DN/INV · node คลิก = deep link · rework = Batch run ใหม่ · **FG per-Batch** ผูก Own-Brand Batch/PRD · **QT = head** สาย OEM (QT→PO→PRD/Batch→DN→Invoice; loose ref QT↔PO) |
| audit | ระดับ field: เวลา/ผู้ทำ/entity/field/จาก→เป็น/เหตุผล · **ทุก action ทุก module** · รวม stock ledger (reason/source ต่อ movement, D15) |
| **★ stock movement audit (D15, 2026-07-29 Stock review)** | **ทุก movement ของ stock ledger = audit event + โผล่บน trace พร้อม reason + source ref บังคับ:** **เพิ่มวัตถุดิบใหม่ (create RM master)** · **loss (−)** (RM: Lot optional/FIFO · production/warehouse) · **adjust (+)** (RM/FG บังคับเลือก, warehouse-adjust) · GR (+) · FG-in (+) · surplus (+) · return (−) · reserve/consume. entity = RM/Lot หรือ FG/Batch · แสดงใคร/เมื่อ/จำนวน/reason/source. ดู `stock.md` §6. |
| **★ BOM change audit (2026-07-29 BOM review)** | **ทุกการเปลี่ยนแปลง BOM = field-audit event + โผล่ trace:** สร้าง BOM (รหัส user-entered) · แก้สูตร/component · **แก้ราคาซื้อ (purchase price) ต่อ component** · แก้ต้นทุนอื่น/ราคาขาย/planning · **inactivate (Active→Inactive, เหตุผลบังคับ)** · **reactivate**. entity=BOM/FG, field=field ที่แก้, จาก→เป็น. รหัส BOM/FG = create-only-lock (แก้ไม่ได้ → ไม่มี audit-change ของรหัส). ดู `bom.md` §5c/§9. |
| **★ Supplier change audit (2026-07-29 Supplier review)** | **ทุกการเปลี่ยนแปลง supplier = field-audit event + โผล่ trace:** สร้าง supplier · แก้ชื่อ/Lot prefix · **active↔inactive** · **แก้ price-matrix (เพิ่ม/ลบ/แก้ราคาคู่ supplier×วัตถุดิบ)** เช่น 45→48. entity=Supplier (หรือคู่ราคา), จาก→เป็น, ใคร/เมื่อ. ดู `supplier.md` §10. |
| **★ QT activity (2026-07-29)** | **ทุก action ของ Quotation ต้องปรากฏใน field-audit + trace:** สร้าง QT · แก้→เวอร์ชันใหม่ · **Convert to PO → ยืนยัน (Confirmed)** (ผูก loose ref QT↔PO เมื่อสร้าง PO) · ปฏิเสธ (Rejected) · **ยกเลิก (Cancelled, ทุกสถานะ, เหตุผลบังคับ)** — ดู `quotation.md` §10. **★ การส่งใบเสนอราคา = print/share (อาจ log ได้) แต่ไม่เปลี่ยนสถานะ/ไม่มี sent-date (revert 2026-07-29).** เอกสาร cancel ไม่ลบ (gapless). |
| **★ comment edit (2026-07-29)** | **การแก้ช่อง `comment` ของทุก object ธุรกรรม = field-audit event:** entity=object / field=`comment` / จาก(old)→เป็น(new) / เวลา / ผู้แก้ · เหตุผล = ว่างได้ (comment ไม่บังคับเหตุผล) · **แก้ทับ (overwrite) แต่ประวัติครบทุกครั้ง** · โผล่บน trace + activity-log ของ object · **ลบประวัติไม่ได้** (retention AU2). ดู `comment-convention.md` (CC3/CC6/CC7). |
| retention | online 1 ปี · หลังจากนั้น Super User manual purge/archive (ไม่มี auto-purge) |
| archive | text file · **Super User เท่านั้น** · ยืนยันก่อน export |
| เอกสารการค้า | void/cancel ไม่ลบ — trace ครบ (gapless) |

## 5. User Stories (absorbed) + AC สรุป
- **US-TRC-01 (Must) — Entity selector + field ต่อ entity:** เลือก entity=Batch → ค้น "B-PO-…-170-1-2" → พบ + ปุ่มดู genealogy; ช่องค้นแสดง field ที่ใช้ได้ของ Batch. **Edge:** date range + time ร่วมกับ entity → เฉพาะรายการในช่วง; ไม่พบ = empty state. **Error:** ไม่มีสิทธิ์ Read module ของ entity → entity นั้นไม่อยู่ใน selector / 403.
- **US-TRC-02 (Must) — Genealogy + คลิก node ไปหน้าจริง:** ค้น B-PO-…-170-1-2 → genealogy: Lot (L-GLY-2506, L-OLV-2604) → Batch run1(ไม่ผ่าน)+run2(ผ่าน) → line1 → PO-170 → กลอรี่ → DN/INV; คลิก node Lot→stock/qc, Batch→production/qc, PO→po-detail, DN/INV→หน้าเอกสาร. **QT head:** เลือก entity=Quotation → ค้น QT-… → node QT ต้นสาย คลิกไป quotation-detail. **Edge:** อธิบาย Lot vs Batch (hover/คำอธิบาย). **Error:** entity ไม่มีสายผลิต (เช่น Supplier) → "รายการนี้ไม่มีสายการผลิต" + ยังดู field-audit ได้.
- **US-TRC-03 (Must) — ตาราง field-audit + archive:** CUS-000021 ตั้ง flag ⚑ ต้องติดตาม → ตาราง field-audit กรอง field="follow_up_flag" + เรียงเวลาใหม่→เก่า → คอลัมน์ (เวลา/ผู้ทำ/entity/field/จาก→เป็น/เหตุผล) เช่น สมหญิง/CUS-000021/follow_up_flag/false→true/เหตุผล + pagination. **★ ตัวอย่าง QT:** entity=Quotation, QT-202607-000012 → เห็นแถว "สร้าง / แก้→เวอร์ชันใหม่ / Convert→Confirmed / ยกเลิก+เหตุผล" ตามเวลา (★ ไม่มีแถว "ส่งลูกค้า/sent-date"). **★ ตัวอย่าง comment:** entity=PO, PO-202607-000170, filter field="comment" → เห็นแถว "แก้ comment: '<เดิม>' → '<ใหม่>'" ใคร/เมื่อ ตามเวลา (แก้ทับได้แต่ประวัติครบ). **★ ตัวอย่าง stock movement:** entity=RM=RM-GLY-01 → เห็นแถว "สร้าง RM master / loss −2 กก. (reason, warehouse, Lot L-GLY-2607) / adjust +5 กก. (reason, warehouse-adjust)"; entity=FG=รหัส BOM → "FG-in / adjust +/− (Batch)". **★ ตัวอย่าง BOM:** entity=BOM=FG-101 → "สร้าง / แก้ราคาซื้อ component 45→48 / inactivate (เหตุผล) / reactivate". **★ ตัวอย่าง Supplier:** entity=Supplier=SUP-01 → "แก้ราคา (กลีเซอรีน) 45→48 / ตั้ง Inactive". **Edge:** Super User เลือกช่วง → "archive เป็น text file" → export + ยืนยันก่อน (retention online 1 ปี; purge/archive manual). **Error:** ผู้ใช้ทั่วไป archive → ไม่มีปุ่ม / 403.

## 6. Actions & Permissions (D14)
| ปุ่ม/action | Permission required |
|---|---|
| ค้น entity/field + ดู genealogy | Read ของ module ของ entity นั้น (scope ตาม Read) |
| ดูตาราง field-audit | Traceability/Settings.**Read (R)** |
| archive เป็น text file | **Super User** เท่านั้น |
> ผลลัพธ์ค้น/entity selector ถูกจำกัดตามสิทธิ์ Read (entity ที่ไม่มี Read ไม่ปรากฏ).

## 7. Validations
- entity/field ที่ค้นได้ตามตาราง §3; นอกสิทธิ์ Read = ไม่แสดง.
- archive = Super User + ยืนยันก่อน export.
- ไม่มี auto-purge (retention 1 ปี online, จากนั้น manual).

## 8. Pagination / Search
- ตาราง field-audit: 20/หน้า (G1) · filter (ผู้ใช้/entity/field/ช่วงวัน+เวลา) + sort เวลา (default ใหม่→เก่า) (G2).

## 9. Formulas / rules
- genealogy = graph traversal Lot→Batch(run)→line→order→customer→DN/INV (deep-link nodes).
- audit = generic field-level table ทุกตาราง (เดียวกับ Settings Audit-log — source เดียว, ไม่ซ้ำซ้อน) · **รวม field `comment` ทุก object + ทุก stock movement (add-RM/loss/adjust/GR/FG-in/surplus/return) + ทุกการเปลี่ยน BOM (create/edit/price/inactivate/reactivate) + ทุกการเปลี่ยน Supplier (create/edit/active-inactive/price-matrix)** (ไม่ต้องมีตาราง audit แยก).

## 10. Cross-links
- Audit log ใน `settings.md` (US-SET-05) = มุมมองรวมของ field-audit เดียวกัน (source เดียว). ทุกการเปลี่ยนสถานะทุก module → บันทึก audit (continuity). **ledger reason/source + stock movement (add-RM/loss/adjust) → `stock.md` §3b/§6.** **BOM changes/inactivate → `bom.md` §5c/§9.** **Supplier/price-matrix changes → `supplier.md` §10.** Glossary Lot/Batch. **QT activity actions → `quotation.md` §10.** **comment field audit → `comment-convention.md` + ราย module.**

## 11. Module changelog
- **Absorbed:** functional-spec `traceability.html` US-TRC-01..03 (9 AC) verbatim ในความหมาย.
- **เพิ่ม (delta, สอดคล้อง scope ใหม่):** **QT = head-of-chain** สาย OEM · **SO (Own-Brand)** เป็น entity ค้นได้ · **FG per-Batch** ใน genealogy · stock ledger reason/source (D15) เข้า audit.
- **★ เพิ่ม (2026-07-29 — Quotation module review):** ระบุชัด **QT activity ทุก action (create/edit→version/convert→Confirmed/cancel) เข้า field-audit + แสดงบน trace** (§4 QT activity row, §5 ตัวอย่าง QT). cross-ref `quotation.md` §10.
- **★ REVERTED (2026-07-29 — Pond):** ถอดสถานะ **"ส่งแล้ว (Sent)"** + field **sent-date** ออกจาก QT (§3 entity row, §4 QT activity row, §5 ตัวอย่าง QT) — การส่งใบเสนอราคา = print/share ไม่ใช่สถานะ. sync `quotation.md` §4/§9/§10.
- **★ เพิ่ม (2026-07-29 — comment cross-cutting feedback, PO module 3 review):** field **`comment`** ของทุก object ธุรกรรม = **audited + trace-visible** (§3 note, §4 comment-edit row, §5 ตัวอย่าง comment, §9). ไม่มีตาราง audit แยก — ใช้ field-audit เดียวกัน. cross-ref `comment-convention.md`.
- **★ เพิ่ม (2026-07-29 — Stock module 4 review):** ระบุชัด **ทุก stock movement (เพิ่มวัตถุดิบใหม่/loss −/adjust +/GR/FG-in/surplus/return, RM+FG) = audit + trace + reason/source** (§3 RM/FG rows + FG ค้นชื่อ+รหัส, §4 stock-movement row, §5 ตัวอย่าง stock movement, §9/§10). cross-ref `stock.md` §3b/§6.
- **★ เพิ่ม (2026-07-29 — BOM + Supplier module review, ปอนด์):**
  1. **BOM = entity ค้นได้** + **ทุกการเปลี่ยน BOM (สร้าง/แก้สูตร-ต้นทุน-ราคาซื้อ/inactivate/reactivate) = audit + trace** (§3 BOM row, §4 BOM-change row, §5 ตัวอย่าง BOM, §9/§10). รหัส BOM/FG + RM = create-only-lock (แก้ไม่ได้). cross-ref `bom.md` §5c/§9.
  2. **Supplier audit ตอกย้ำ:** **สร้าง/แก้/active↔inactive/แก้ price-matrix = audit + trace** (§3 Supplier row, §4 Supplier-change row, §5 ตัวอย่าง Supplier, §9/§10). cross-ref `supplier.md` §10.
- **คงเดิม:** field-level audit · genealogy node คลิกได้ · archive Super User · retention 1 ปี · source เดียวกับ Settings audit.
