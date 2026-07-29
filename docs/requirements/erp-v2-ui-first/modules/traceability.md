# Module — Traceability + Field-level Audit

slug: `erp-v2-ui-first` · per-module canonical · PO · 2026-07-29 · **AUTHORITATIVE SPEC** (absorbs functional-spec `traceability.html` US-TRC-01..03)
Mockups: `mockups/trace.html`
กฎอ้างอิง: GMP (Lot→Batch→FG) · `settings.md` US-SET-05 (Audit log = มุมมองรวมของ field-audit เดียวกัน) · stock ledger (reason/source, D15) · Glossary (Lot vs Batch) · README §3 · **`quotation.md` §10 (QT activity actions)** · **`comment-convention.md` (comment field = audited/trace-visible ทุก object ธุรกรรม)** · **`stock.md` §3b/§6 (add-RM + loss/adjust movements + lot/FIFO)** · **`bom.md` §5c/§9 (BOM changes + inactivate)** · **`supplier.md` §10 (supplier + price-matrix changes)** · **`production.md` §5/§7 (accept/actual-qty/status-change/loss/lot-consume) + `po.md` §5.2 (PO edit)** · **`supply-planning.md` §5b/§5c (save-back planning param + สั่งผลิต produce-to-stock)**

## สรุปภาษาไทย
สืบย้อน GMP + audit ระดับ field: **entity selector** + **date range + time** · **genealogy Lot→Batch→line→PO→ลูกค้า→DN/INV** · **ตาราง field-audit** (เวลา/ผู้ทำ/entity/field/จาก→เป็น/เหตุผล + filter/sort/pagination) · **archive text file (Super User)**. retention online 1 ปี. เป็นแหล่ง audit เดียวกับ Settings Audit-log. สอดคล้อง scope: **QT = head-of-chain** (★ ไม่มี Sent/sent-date), **FG per-Batch**, **stock ledger มี reason/source** ต่อ movement. **★ ทุก stock movement (เพิ่มวัตถุดิบใหม่/loss −/adjust +/GR/FG-in/surplus/return — RM+FG) ถูก audit + trace พร้อม reason + source + Lot/FIFO ref (D15).** **★ ทุกการเปลี่ยน BOM/Supplier ถูก audit — รวม "บันทึกกลับ BOM master" (save-back planning param จาก Supply Planning) = field-level audit (ใคร/เมื่อ/เดิม→ใหม่); ส่วนการ "จำลอง (simulate/what-if)" ใน modal ที่ไม่ persist = ไม่ audit.** **★ Production: การรับงาน (accept), การเปลี่ยนสถานะ (เริ่มผลิต/ส่ง QC/พร้อมส่ง/Hold/rework), การกรอก "จำนวนผลิตจริง (actual qty)", การ consume lot (FIFO), การบันทึก loss — ถูก audit ครบ ใคร/เมื่อ/เดิม→ใหม่.** **★ การแก้ PO (รวมจากบริบทการผลิต — under-production) = field-level audit ทุกฟิลด์ (who/when/old→new) + raise ⚑ follow-up (po.md §5.2).** **★ "สั่งผลิต from Supply Planning" ตามได้ผ่านสาย SO (produce-to-stock) → PRD/Batch (ผูก batch count ที่เลือก).** **★ ช่อง `comment` ของทุก object ธุรกรรม เป็น field ที่ถูก audit เต็ม + โผล่บน trace.**

---

## 1. Purpose
ตอบคำถาม GMP/ตรวจสอบได้ทุกกรณี: "ของชิ้นนี้มาจาก Lot ไหน ผลิต Batch ไหน ขายใคร" และ "ใครแก้ค่าอะไร เมื่อไหร่ เพราะอะไร" — ครบทุก entity + ทุก field (รวมช่อง `comment`, ทุก stock movement, การเปลี่ยน BOM/Supplier รวม save-back planning param จาก Supply Planning, **การกระทำในสายผลิตทั้งหมด**).

## 2. Screens
| หน้าจอ | บทบาท |
|---|---|
| `trace.html` | entity selector + field · date-range+time · genealogy (node คลิกได้) · ตาราง field-audit (filter/sort/pagination) · archive |

## 3. Entity ที่ค้นได้ + field (จาก US-TRC-01)
| Entity | field ที่ค้นได้ |
|---|---|
| ลูกค้า (Customer) | รหัส CUS / ชื่อ / เบอร์ / สถานะ / **follow_up_flag** |
| **Quotation (QT)** ★ | เลข QT / ลูกค้า / สถานะ (ร่าง/ยืนยัน/ปฏิเสธ/ยกเลิก — ★ ไม่มี "ส่งแล้ว/Sent") / วันที่สร้าง — **head-of-chain สาย OEM** |
| PO | เลข PO / ลูกค้า / สถานะ fulfilment/billing · **★ field-audit การแก้ PO (line/qty/ราคา/ลูกค้า/วันที่) — รวมการแก้จากบริบทการผลิต (po.md §5.2)** |
| **SO (Own-Brand)** ★ | เลข SO / ลูกค้า(ถ้ามี) / ชนิด (ขายจากสต็อก/ผลิตเก็บสต็อก) / สถานะ · **★ produce-to-stock ที่มาจาก Supply Planning "สั่งผลิต" ตามได้ (SO → PRD/Batch, พก batch count — `supply-planning.md` §5b)** |
| PRD / Batch | เลข PRD / เลข Batch `B-{PO}-{line}-{run}` / สถานะ · **★ event: รับงาน (accept) / เริ่มผลิต / ส่ง QC / พร้อมส่ง / Hold / rework · field `actual_produced_qty` (จำนวนผลิตจริง) · consume lot (FIFO) · comment** |
| **วัตถุดิบ (RM) / Lot** | **รหัส RM (ผู้ใช้ตั้ง, unique, ★ ล็อกหลังสร้าง) / ชื่อ** / เลข Lot / supplier / qc_status · **สร้าง RM master + loss/adjust movement (Lot/FIFO ref) audit ได้** |
| **FG (สินค้าสำเร็จรูป, per-Batch)** ★ | **รหัส FG (= รหัส BOM) / ชื่อ** / เลข Batch / ยอดราย Batch · **FG-in/surplus/loss/adjust movement audit ได้** — ค้นชื่อ+รหัส (`stock.md` §4) |
| **BOM (สูตร/FG master)** ★ | **รหัส BOM/FG / ชื่อ / TYPE / สถานะ (Active/Inactive)** · **event: สร้าง / แก้สูตร-ต้นทุน-ราคาซื้อ / inactivate / reactivate · ★ แก้ planning config (Sales Rate/Lead/Safety/Target/Batch) รวม "บันทึกกลับ BOM master" จาก Supply Planning** (`bom.md` §5c/§9 · `supply-planning.md` §5c) |
| PR / GR | เลข PR / เลข GR / วัตถุดิบ / สถานะ |
| **Supplier** ★ | **รหัส SUP / ชื่อ / สถานะ active** · **event: สร้าง / แก้ / active↔inactive / แก้ price-matrix** (`supplier.md` §10) |
| Shipment / DN / Invoice | เลข SHP / DN / INV / ลูกค้า / สถานะ |
> **★ field `comment` (2026-07-29):** ทุก object ธุรกรรม (QT/PO/SO/PRD/Batch/DN/Shipment/Invoice/GR/PR) มี field `comment` ที่ **audit ได้** — filter ด้วย field="comment". ดู `comment-convention.md`.

## 4. Data model / rules
| รายการ | กติกา |
|---|---|
| genealogy | Lot→Batch→line→PO(หรือ SO)→ลูกค้า→DN/INV · node คลิก = deep link · rework = Batch run ใหม่ · **FG per-Batch** ผูก Own-Brand Batch/PRD · **QT = head** สาย OEM (loose ref QT↔PO) · **★ Supply Planning "สั่งผลิต" = SO produce-to-stock → PRD/Batch → FG-in** (สายเดียวกับ SO โหมด ข) |
| audit | ระดับ field: เวลา/ผู้ทำ/entity/field/จาก→เป็น/เหตุผล · **ทุก action ทุก module** · รวม stock ledger (reason/source ต่อ movement, D15) |
| **★ stock movement audit (D15)** | **ทุก movement = audit + trace + reason + source ref บังคับ:** **เพิ่มวัตถุดิบใหม่** · **loss (−)** (RM: อ้าง Lot — เลือก lot/"FIFO") · **adjust (+)** (RM: **★ อ้าง Lot — เลือก lot/"FIFO"** · FG ราย Batch) · GR (+) · FG-in (+) · surplus (+) · return (−) · **CONSUME (−)** (เลือก lot มี stock; หลาย lot = FIFO). entity = RM/Lot หรือ FG/Batch. ดู `stock.md` §6. |
| **★ Production action audit (2026-07-29 Production review)** | **ทุกการกระทำในสายผลิต = audit event + trace:** **รับงาน (accept → gen PRD)** · **เริ่มผลิต (gen Batch + consume lot FIFO)** · **ส่งตรวจ QC** · **กด "✓ พร้อมส่ง" (capture surplus → FG)** · **Hold (บังคับเหตุผล)** · **rework (gen run+1)** · **field `actual_produced_qty` (จำนวนผลิตจริง, old→new)** · **loss (production, เหตุผลบังคับ)** · **comment PRD/Batch**. entity=PRD/Batch, field/action, ใคร/เมื่อ/เดิม→ใหม่/เหตุผล. ดู `production.md` §5/§7. |
| **★ PO edit audit (2026-07-29 Production review)** | **การแก้ PO ทุกครั้ง (รวมจากบริบทการผลิต — under-production ลดจำนวนสั่งให้ = ผลิตจริง) = field-level audit:** entity=PO, ทุกฟิลด์ที่แก้ (line/qty/ราคา/ลูกค้า/วันที่) old→new, ใคร/เมื่อ, เหตุผล · **และ raise ⚑ follow-up ที่ลูกค้า (audit ที่ Customer ด้วย)**. ดู `po.md` §5.2 · `customer.md` §4.1. |
| **★ BOM change audit** | สร้าง/แก้สูตร-ต้นทุน-ราคาซื้อ/inactivate/reactivate. รหัส BOM/FG/RM = create-only-lock. ดู `bom.md` §5c/§9. |
| **★ BOM planning-param save-back audit (2026-07-29 Supply Planning review)** | **การกด "บันทึกกลับ BOM master" ใน Supply Planning modal (persist Sales Rate/Lead Time/Safety Cover/Target Cover/Batch Size กลับ 1-BOM=1-FG master) = field-level audit** (entity=BOM, ทุกฟิลด์ planning ที่แก้ old→new, ใคร/เมื่อ) — ผ่าน field-audit เดียวกับ BOM. **★ การ "จำลอง (simulate/what-if)" ใน modal ที่ไม่กด save (ไม่ persist) = ไม่ audit** (เป็น scratch ฝั่ง client, ทิ้งเมื่อปิด). ดู `supply-planning.md` §5c · `bom.md` §5. |
| **★ Supplier change audit** | สร้าง/แก้/active↔inactive/แก้ price-matrix. ดู `supplier.md` §10. |
| **★ QT activity** | สร้าง/แก้→version/Convert→Confirmed/reject/cancel. **★ การส่ง = print/share ไม่เปลี่ยนสถานะ/ไม่มี sent-date.** ดู `quotation.md` §10. |
| **★ comment edit** | entity=object / field=`comment` / old→new / เวลา / ผู้แก้ · เหตุผลว่างได้ · แก้ทับแต่ประวัติครบ · ลบไม่ได้ (AU2). ดู `comment-convention.md`. |
| retention | online 1 ปี · หลังจากนั้น Super User manual purge/archive |
| archive | text file · **Super User เท่านั้น** · ยืนยันก่อน export |
| เอกสารการค้า | void/cancel ไม่ลบ — trace ครบ (gapless) |

## 5. User Stories (absorbed) + AC สรุป
- **US-TRC-01 (Must) — Entity selector + field ต่อ entity:** เลือก entity=Batch → ค้น "B-…-170-1-2" → พบ + genealogy; ช่องค้นแสดง field ที่ใช้ได้. **Edge:** date range + time. **Error:** ไม่มีสิทธิ์ Read → entity ไม่อยู่ใน selector / 403.
- **US-TRC-02 (Must) — Genealogy + คลิก node:** ค้น B-…-170-1-2 → Lot → Batch run1(ไม่ผ่าน)+run2(ผ่าน) → line1 → PO-170 → ลูกค้า → DN/INV; คลิก node ไปหน้าจริง. **QT head:** entity=Quotation → node QT ต้นสาย. **★ Supply Planning สั่งผลิต:** entity=SO (produce-to-stock) → PRD/Batch → FG-in (ตามสายผลิตเก็บสต็อก, ไม่มีลูกค้า). **Error:** entity ไม่มีสายผลิต (Supplier) → "ไม่มีสายการผลิต" + ยังดู field-audit ได้.
- **US-TRC-03 (Must) — ตาราง field-audit + archive:** CUS-000021 ตั้ง flag ⚑ → กรอง field="follow_up_flag" → false→true + เหตุผล + pagination. **★ QT:** "สร้าง / แก้→version / Convert→Confirmed / ยกเลิก" (★ ไม่มี "sent"). **★ comment:** entity=PO, filter field="comment" → "แก้ comment: '<เดิม>'→'<ใหม่>'". **★ stock movement:** entity=RM → "สร้าง RM / loss −2 (Lot L-GLY-2607) / **adjust +5 (Lot/FIFO)**". **★ Production:** entity=PRD-… → "รับงาน / เริ่มผลิต (consume Lot FIFO) / actual_produced_qty 1000→1200 / พร้อมส่ง (surplus +200→FG) / loss −10 (เหตุผล)". **★ PO edit:** entity=PO-… → "แก้ qty line1 1000→900 (under-production, จากการผลิต) + raise follow-up ลูกค้า". **★ BOM save-back (Supply Planning):** entity=BOM-… → "บันทึกกลับ BOM master: Target Cover 30→45, Safety Cover 5→7 (จาก Supply Planning)" — **การ simulate ที่ไม่ save = ไม่โผล่ (ไม่ audit)**. **★ BOM/Supplier:** ตัวอย่างเดิม. **Edge:** Super User archive text file. **Error:** ผู้ใช้ทั่วไป archive → 403.

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
- ไม่มี auto-purge (retention 1 ปี online, จากนั้น manual).

## 8. Pagination / Search
- ตาราง field-audit: 20/หน้า (G1) · filter (ผู้ใช้/entity/field/ช่วงวัน+เวลา) + sort เวลา (default ใหม่→เก่า) (G2).

## 9. Formulas / rules
- genealogy = graph traversal Lot→Batch(run)→line→order→customer→DN/INV (deep-link nodes).
- audit = generic field-level table ทุกตาราง (เดียวกับ Settings Audit-log) · **รวม field `comment` ทุก object + ทุก stock movement (add-RM/loss/adjust ที่มี Lot/FIFO ref/GR/FG-in/surplus/return/consume) + ทุก production action (accept/เริ่มผลิต/ส่ง QC/พร้อมส่ง/Hold/rework/actual-qty/loss) + PO edit (field-level) + ทุกการเปลี่ยน BOM (รวม save-back planning param จาก Supply Planning) + Supplier** (ไม่ต้องมีตาราง audit แยก). **★ การ simulate/what-if ใน Supply Planning modal ที่ไม่ persist = ไม่เข้า audit** (มีเฉพาะ "บันทึกกลับ BOM master" เท่านั้นที่ audit).

## 10. Cross-links
- Audit log ใน `settings.md` (US-SET-05) = มุมมองรวมของ field-audit เดียวกัน. **ledger reason/source + stock movement (add-RM/loss/adjust Lot-FIFO) → `stock.md` §3b/§6.** **★ Production action/actual-qty/loss/consume → `production.md` §5/§7 · PO edit → `po.md` §5.2 · follow-up → `customer.md` §4.1.** **BOM changes → `bom.md` §5c/§9 · ★ save-back planning param + สั่งผลิต → `supply-planning.md` §5b/§5c.** **Supplier → `supplier.md` §10.** Glossary Lot/Batch. **QT activity → `quotation.md` §10.** **comment field audit → `comment-convention.md`.**

## 11. Module changelog
- **Absorbed:** functional-spec `traceability.html` US-TRC-01..03 (9 AC).
- **เพิ่ม (delta scope ใหม่):** QT = head-of-chain · SO entity · FG per-Batch · stock ledger reason/source (D15).
- **★ เพิ่ม (2026-07-29 — Quotation review):** QT activity audit. **★ REVERTED:** ถอด "Sent + sent-date".
- **★ เพิ่ม (2026-07-29 — comment cross-cutting):** field `comment` audited + trace-visible.
- **★ เพิ่ม (2026-07-29 — Stock review):** stock movement + RM code lock + dropdown search.
- **★ เพิ่ม (2026-07-29 — BOM + Supplier review):** BOM entity + changes audit; Supplier audit.
- **★ เพิ่ม (2026-07-29 — Production module review, ปอนด์):**
  1. **Production action audit** (§3 PRD/Batch row, §4 Production-action row, §5 ตัวอย่าง): **รับงาน/เริ่มผลิต/ส่ง QC/พร้อมส่ง/Hold/rework · field `actual_produced_qty` · consume lot (FIFO) · loss · comment** — audited ครบ. ref `production.md` §5/§7.
  2. **PO edit field-level audit** (§3 PO row, §4 PO-edit row, §5 ตัวอย่าง): การแก้ PO ทุกครั้ง รวมจากบริบทการผลิต (under-production) → old→new ทุกฟิลด์ + raise ⚑ follow-up. ref `po.md` §5.2 / `customer.md` §4.1.
  3. **Stock adjust Lot/FIFO** ระบุใน §4 stock-movement row (adjust + อ้าง Lot/FIFO) — sync `stock.md` §5.1/§6.
- **★ เพิ่ม (2026-07-29 — Supply Planning module review, ปอนด์):**
  1. **BOM planning-param save-back audit** (§3 BOM row, §4 new row, §5 ตัวอย่าง, §9): การกด **"บันทึกกลับ BOM master"** ใน Supply Planning modal (persist Sales Rate/Lead/Safety/Target/Batch) = field-level audit (old→new, ใคร/เมื่อ) · **การ simulate/what-if ที่ไม่ persist = ไม่ audit**. ref `supply-planning.md` §5c · `bom.md` §5.
  2. **"สั่งผลิต from Supply Planning" traceable** (§2b summary, §3 SO row, §4 genealogy row, §5 US-TRC-02): produce-to-stock SO (พก batch count) → PRD/Batch → FG-in ตามสายผลิตเก็บสต็อก. ref `supply-planning.md` §5b · `so.md` §6.
- **คงเดิม:** field-level audit · genealogy node คลิกได้ · archive Super User · retention 1 ปี · source เดียวกับ Settings audit.
