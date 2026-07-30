# Module — Traceability + Field-level Audit

slug: `erp-v2-ui-first` · per-module canonical · PO · 2026-07-29 (**+ Route/DN r11 2026-07-30**) · **AUTHORITATIVE SPEC** (absorbs functional-spec `traceability.html` US-TRC-01..03)
Mockups: `mockups/trace.html`
กฎอ้างอิง: GMP (Lot→Batch→FG) · `settings.md` US-SET-05 · stock ledger (reason/source, D15) · Glossary · README §3 · **`quotation.md` §10** · **`comment-convention.md`** · **`stock.md` §3b/§6** · **`bom.md` §5c/§9** · **`supplier.md` §10** · **`production.md` §5/§7 + `po.md` §5.2** · **`supply-planning.md` §5b/§5c** · **`goods-receipt.md` §4/§9 + `qc.md` §4.1** · **★ `shipping.md` (Route) + `delivery-note.md` (DN) + `po.md` §4b (PO/SO delivery status = สะท้อน DN)**

## สรุปภาษาไทย
สืบย้อน GMP + audit ระดับ field: **entity selector** + **date range + time** · **genealogy Lot→Batch→line→PO→ลูกค้า→DN/INV** · **ตาราง field-audit** · **archive text file (Super User)**. retention online 1 ปี. เป็นแหล่ง audit เดียวกับ Settings Audit-log. **★ ทุก stock movement มี reason/source + Lot/FIFO ref (D15).** **★★ r10 GR/QC: GR object lifecycle + credit on QC pass.** **★ Production/PO edit/comment ทุก object audit.** **★★★ r11 Route/DN: Route (`RT-…`, ★ เดิม SHP) + DN (6 สถานะ) มี lifecycle + comment audit; ★ แก้สถานะ DN โดยตรง (สิทธิ์ A) audit; ★ PO/SO delivery status = สะท้อน DN (trace ผ่าน DN ต้นทาง).**

---

## 1. Purpose
ตอบคำถาม GMP/ตรวจสอบได้ทุกกรณี: "ของชิ้นนี้มาจาก Lot ไหน ผลิต Batch ไหน ขายใคร ส่งด้วย Route/DN ใด" และ "ใครแก้ค่าอะไร เมื่อไหร่ เพราะอะไร" — ครบทุก entity + ทุก field.

## 2. Screens
| หน้าจอ | บทบาท |
|---|---|
| `trace.html` | entity selector + field · date-range+time · genealogy (node คลิกได้) · ตาราง field-audit (filter/sort/pagination) · archive |

## 3. Entity ที่ค้นได้ + field (จาก US-TRC-01)
| Entity | field ที่ค้นได้ |
|---|---|
| ลูกค้า (Customer) | รหัส CUS / ชื่อ / เบอร์ / สถานะ / **follow_up_flag** · **★ r11: ที่อยู่ลูกค้า/ที่อยู่จัดส่ง · ผู้ติดต่อ (flag ผู้รับสินค้า)** |
| **Quotation (QT)** ★ | เลข QT / ลูกค้า / สถานะ (ร่าง/ยืนยัน/ปฏิเสธ/ยกเลิก) / วันที่สร้าง — **head-of-chain สาย OEM** |
| PO | เลข PO / ลูกค้า / สถานะ fulfilment/billing · **★ field-audit การแก้ PO** · **★★ r11: สถานะจัดส่ง = สะท้อนจาก DN (po.md §4b)** |
| **SO (Own-Brand)** ★ | เลข SO / ลูกค้า(ถ้ามี) / ชนิด / สถานะ · **★★ r11: (ก) สถานะจัดส่งสะท้อน DN** · produce-to-stock จาก Supply Planning ตามได้ |
| PRD / Batch | เลข PRD / เลข Batch / สถานะ · event: รับงาน/เริ่มผลิต/ส่ง QC/พร้อมส่ง/Hold/rework · `actual_produced_qty` · consume lot (FIFO) · comment · QC ผ่าน/ไม่ผ่าน |
| **วัตถุดิบ (RM) / Lot** | รหัส RM (ล็อกหลังสร้าง) / ชื่อ / เลข Lot / supplier / qc_status · loss/adjust movement (Lot/FIFO ref) |
| **★ GR (ใบรับเข้า — object)** ★ r10 | เลข GR / supplier / Lot(s) / RM / สถานะ GR (QC ตรวจสอบ/ผ่าน/ไม่ผ่าน/ยกเลิก) · event lifecycle · comment |
| **FG (สินค้าสำเร็จรูป, per-Batch)** ★ | รหัส FG / ชื่อ / เลข Batch / ยอดราย Batch · FG-in/surplus/loss/adjust movement |
| **BOM (สูตร/FG master)** ★ | รหัส BOM/FG / ชื่อ / TYPE / สถานะ (Active/Inactive) · event create/แก้/inactivate/reactivate/save-back |
| PR | เลข PR / วัตถุดิบ / สถานะ (r10: คิดจากปริมาณ QC "ผ่าน") |
| **Supplier** ★ | รหัส SUP / ชื่อ / สถานะ · event create/แก้/active↔inactive/price-matrix |
| **★★★ Route (รอบจัดส่ง)** ★ r11 | **เลข `RT-{YYYYMMDD}-{NNNN}` (★ เดิม `SHP-…` — Q1) / คนขับ (system user) / เบอร์คนขับ / route / ประเภทรถ / ทะเบียน / สถานะ (เตรียมจัดของ/กำลังออกไปส่ง/เสร็จสิ้น/ยกเลิก)** · **event: สร้างรอบ (gen RT+DN) / จัดของ→ออกไปส่ง / เสร็จสิ้น (สรุปผลราย DN) / ยกเลิก / comment** (`shipping.md`) |
| **★★★ DN (ใบจัดส่ง)** ★ r11 | **เลข `DN-{YYYYMMDD}-{NNNNN}` / Route ต้นทาง (RT) / PO-SO / ลูกค้า / สถานะ (6: อยู่ระหว่างการเตรียม/อยู่ระหว่างจัดส่ง/ส่งสำเร็จ/ลูกค้าเลื่อนส่ง/ลูกค้ายกเลิก/ลูกค้ายังไม่กำหนดวันรับใหม่) / next delivery date** · **event: gen (จาก Route) / เปลี่ยนสถานะ (ผ่าน Route "เสร็จสิ้น" หรือ ★ แก้ตรง สิทธิ์ A) + comment บังคับ** (`delivery-note.md`) |
| Invoice | เลข INV / ลูกค้า / สถานะ |
> **★ field `comment`:** ทุก object ธุรกรรม (QT/PO/SO/PRD/Batch/DN/**Route**/Invoice/GR/PR/Return/QC) มี field `comment` ที่ **audit ได้**. ดู `comment-convention.md`.

## 4. Data model / rules
| รายการ | กติกา |
|---|---|
| genealogy | Lot→Batch→line→PO(หรือ SO)→ลูกค้า→**DN (ผูก Route RT)**→INV · node คลิก = deep link · **QT = head** สาย OEM · **★ Supply Planning "สั่งผลิต" = SO produce-to-stock → PRD/Batch → FG-in** · **★ r10: Lot ↔ GR object; เข้าสายเมื่อ QC ผ่าน** · **★★★ r11: DN ผูก Route ต้นทาง; FG ตัด (FIFO per-Batch) ตอน DN "ส่งสำเร็จ"** |
| audit | ระดับ field: เวลา/ผู้ทำ/entity/field/จาก→เป็น/เหตุผล · **ทุก action ทุก module** · รวม stock ledger (reason/source, D15) |
| **★ stock movement audit (D15)** | ทุก movement audit + trace + reason + source: เพิ่ม RM · loss (−) · adjust (+) (RM: Lot/FIFO) · **`GR (+)` (r10: ตอน QC "ผ่าน")** · FG-in · surplus · return (−) · **CONSUME (−)** (FIFO). ดู `stock.md` §6 |
| **★ r10 GR object + QC-gated stock-in audit** | GR lifecycle event + trace: บันทึกรับ / QC "ผ่าน" (credit `GR (+)` + FIFO retro-link) / QC "ไม่ผ่าน" / ส่งกลับ QC / ยกเลิก / comment. `goods-receipt.md` §4/§9 · `qc.md` §4.1 |
| **★ Production action audit** | รับงาน/เริ่มผลิต(consume FIFO)/ส่ง QC/พร้อมส่ง(surplus→FG)/Hold/rework/`actual_produced_qty`/loss/comment · QC ตัดสิน Batch. `production.md` §5/§7 |
| **★ PO edit audit** | การแก้ PO ทุกครั้ง (รวมจากการผลิต) = field-level audit + raise ⚑ follow-up. `po.md` §5.2 |
| **★★★ r11 Route/DN audit** | **Route lifecycle** (สร้างรอบ→gen RT+DN / จัดของ→ออกไปส่ง / เสร็จสิ้น สรุปผลราย DN / ยกเลิก / comment) · **DN status change** (ผ่าน Route "เสร็จสิ้น" process **หรือ ★ แก้ตรง สิทธิ์ Shipping.Approve (A)**) + **comment DN บังคับตอน status-update** + next delivery date. entity=Route/DN, ใคร/เมื่อ/เดิม→ใหม่/เหตุผล. **★ PO/SO delivery status = สะท้อน DN → trace ผ่าน DN ต้นทาง.** `shipping.md` · `delivery-note.md` · `po.md` §4b |
| **★ BOM/Supplier/save-back audit** | สร้าง/แก้/inactivate/reactivate/price-matrix/save-back planning param (simulate ไม่ audit). `bom.md`/`supplier.md`/`supply-planning.md` §5c |
| **★ QT activity** | สร้าง/แก้→version/Convert→Confirmed/reject/cancel · การส่ง = print/share (ไม่มี sent-date). `quotation.md` §10 |
| **★ comment edit** | entity=object / field=`comment` / old→new / เวลา / ผู้แก้ · แก้ทับแต่ประวัติครบ · ลบไม่ได้ (AU2). `comment-convention.md` |
| retention | online 1 ปี · หลังจากนั้น Super User manual purge/archive |
| archive | text file · **Super User เท่านั้น** · ยืนยันก่อน export |
| เอกสารการค้า | void/cancel ไม่ลบ — trace ครบ (gapless) |

## 5. User Stories (absorbed) + AC สรุป
- **US-TRC-01 (Must) — Entity selector + field ต่อ entity:** entity=Batch → ค้น → genealogy. **★ r10:** entity=GR. **★★★ r11:** entity=Route → ค้น "RT-20260730-0044" → พบ + สถานะ + DN ในรอบ + คนขับ; entity=DN → ค้น "DN-…" → พบ + Route ต้นทาง + สถานะ + PO/SO. **Error:** ไม่มีสิทธิ์ Read → 403.
- **US-TRC-02 (Must) — Genealogy + คลิก node:** ค้น Batch → Lot → line → PO → ลูกค้า → **DN (ผูก Route) → INV**. **★ r10 Lot ↔ GR.** **★★★ r11:** node DN คลิก → Route ต้นทาง (คนขับ/สถานะ); ตัด FG (FIFO) ตอน DN "ส่งสำเร็จ". **Error:** entity ไม่มีสายผลิต (Supplier).
- **US-TRC-03 (Must) — ตาราง field-audit + archive:** **★ comment/stock movement/GR-QC/Production/PO edit/BOM save-back** (คงตามรอบก่อน). **★★★ r11:** entity=Route → "สร้างรอบ (gen RT + DN-…-119=PO-176) / กำลังออกไปส่ง / เสร็จสิ้น (DN-…-119 ส่งสำเร็จ)"; entity=DN → "gen จาก RT-… / ลูกค้าเลื่อนส่ง (next date 2026-08-10, comment '...') — หรือ — ★ แก้ตรง (สิทธิ์ A): ส่งสำเร็จ (comment '...')". **Error:** ผู้ใช้ทั่วไป archive → 403.

## 6. Actions & Permissions (D14)
| ปุ่ม/action | Permission required |
|---|---|
| ค้น entity/field + ดู genealogy | Read ของ module ของ entity นั้น |
| ดูตาราง field-audit | Traceability/Settings.**Read (R)** |
| archive เป็น text file | **Super User** เท่านั้น |
> ผลลัพธ์ค้น/entity selector ถูกจำกัดตามสิทธิ์ Read.

## 7. Validations
- entity/field ที่ค้นได้ตามตาราง §3; นอกสิทธิ์ Read = ไม่แสดง.
- archive = Super User + ยืนยันก่อน export.
- ไม่มี auto-purge (retention 1 ปี online).

## 8. Pagination / Search
- ตาราง field-audit: 20/หน้า (G1) · filter (ผู้ใช้/entity/field/ช่วงวัน+เวลา) + sort เวลา (default ใหม่→เก่า) (G2).

## 9. Formulas / rules
- genealogy = graph traversal Lot→Batch(run)→line→order→customer→**DN(Route)**→INV · **★ r10: Lot ↔ GR; เข้าสายเมื่อ credit (QC ผ่าน)** · **★★★ r11: DN ↔ Route; FG ตัดตอน DN "ส่งสำเร็จ"**.
- audit = generic field-level table ทุกตาราง · **รวม field `comment` ทุก object + ทุก stock movement + GR object lifecycle + ทุก production action + PO edit + BOM/Supplier changes + ★★★ Route/DN lifecycle + DN status-edit(A)**. simulate/what-if ที่ไม่ persist = ไม่ audit.

## 10. Cross-links
- Audit log ใน `settings.md` (US-SET-05) = มุมมองรวม. ledger → `stock.md` §3b/§6. **★ r10 GR object → `goods-receipt.md`/`qc.md`/entity-status-map §1.8.** Production/PO edit → `production.md`/`po.md`. BOM/save-back → `bom.md`/`supply-planning.md`. Supplier → `supplier.md`. QT → `quotation.md` §10. comment → `comment-convention.md`. **★★★ r11 Route/DN → `shipping.md`/`delivery-note.md`/entity-status-map §1.9/§1.10/`po.md` §4b.**

## 11. Module changelog
- **Absorbed:** functional-spec `traceability.html` US-TRC-01..03 (9 AC).
- **เพิ่ม (รอบก่อน):** QT head-of-chain · SO · FG per-Batch · stock ledger reason/source · comment audit · BOM/Supplier · Production action + PO edit · save-back · GR object + QC-gated credit. (คงตามรอบก่อน — commit history)
- **★★★ เพิ่ม (2026-07-30 — Route/DN r11, ปอนด์ Module B/C):** **Route (`RT-…`, ★ เดิม SHP) + DN (6 สถานะ) เป็น entity ใน §3** (แทน "Shipment/DN" เดิม) + สถานะ/event lifecycle · **§4 row Route/DN audit** (Route lifecycle + DN status change ทั้ง Route process และ **★ แก้ตรง สิทธิ์ A** + comment DN บังคับ) · **PO/SO delivery status = สะท้อน DN → trace ผ่าน DN ต้นทาง** · genealogy DN↔Route + ตัด FG ตอน DN "ส่งสำเร็จ" · §5 US-TRC ตัวอย่าง Route/DN · §9/§10. ref `shipping.md`/`delivery-note.md`/`po.md` §4b/entity-status-map §1.9/§1.10.
- **คงเดิม:** field-level audit · genealogy node คลิกได้ · archive Super User · retention 1 ปี.
