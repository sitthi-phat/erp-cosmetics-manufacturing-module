# Module — Traceability + Field-level Audit

slug: `erp-v2-ui-first` · per-module canonical · PO · 2026-07-29 · **AUTHORITATIVE SPEC** (absorbs functional-spec `traceability.html` US-TRC-01..03)
Mockups: `mockups/trace.html`
กฎอ้างอิง: GMP (Lot→Batch→FG) · `settings.md` US-SET-05 (Audit log = มุมมองรวมของ field-audit เดียวกัน) · stock ledger (reason/source, D15) · Glossary (Lot vs Batch) · README §3 · **`quotation.md` §10 (QT activity actions)** · **`comment-convention.md` (comment field = audited/trace-visible ทุก object ธุรกรรม)** · **`stock.md` §3b/§6 (add-RM + loss/adjust movements + lot/FIFO)** · **`bom.md` §5c/§9 (BOM changes + inactivate)** · **`supplier.md` §10 (supplier + price-matrix changes)** · **`production.md` §5/§7 (accept/actual-qty/status-change/loss/lot-consume) + `po.md` §5.2 (PO edit)** · **`supply-planning.md` §5b/§5c (save-back planning param + สั่งผลิต produce-to-stock)** · **`goods-receipt.md` §4/§9 + `qc.md` §4.1 (GR object lifecycle · QC-gated stock-in credit on pass)**

## สรุปภาษาไทย
สืบย้อน GMP + audit ระดับ field: **entity selector** + **date range + time** · **genealogy Lot→Batch→line→PO→ลูกค้า→DN/INV** · **ตาราง field-audit** (เวลา/ผู้ทำ/entity/field/จาก→เป็น/เหตุผล + filter/sort/pagination) · **archive text file (Super User)**. retention online 1 ปี. เป็นแหล่ง audit เดียวกับ Settings Audit-log. สอดคล้อง scope: **QT = head-of-chain**, **FG per-Batch**, **stock ledger มี reason/source** ต่อ movement. **★ ทุก stock movement (เพิ่มวัตถุดิบใหม่/loss −/adjust +/GR/FG-in/surplus/return — RM+FG) ถูก audit + trace พร้อม reason + source + Lot/FIFO ref (D15).** **★★ r10 GR/QC: GR เป็น object ที่มี lifecycle (QC ตรวจสอบ/ผ่าน/ไม่ผ่าน/ยกเลิก) + action ส่งกลับ QC/ยกเลิก ถูก audit; ★ `GR (+)` credit + FIFO retro-link เกิดตอน QC ตรวจรับ "ผ่าน" (audit event ที่จุด QC pass ไม่ใช่ตอนบันทึก GR); QC ไม่ผ่าน = ไม่มี credit movement.** **★ ทุกการเปลี่ยน BOM/Supplier ถูก audit — รวม "บันทึกกลับ BOM master" (save-back planning param) = field-level audit; simulate/what-if ที่ไม่ persist = ไม่ audit.** **★ Production: accept/status-change/actual-qty/consume-lot(FIFO)/loss ถูก audit ครบ.** **★ การแก้ PO (รวมจากบริบทการผลิต) = field-level audit + raise ⚑ follow-up.** **★ ช่อง `comment` ของทุก object ธุรกรรม เป็น field ที่ถูก audit เต็ม + โผล่บน trace.**

---

## 1. Purpose
ตอบคำถาม GMP/ตรวจสอบได้ทุกกรณี: "ของชิ้นนี้มาจาก Lot ไหน ผลิต Batch ไหน ขายใคร" และ "ใครแก้ค่าอะไร เมื่อไหร่ เพราะอะไร" — ครบทุก entity + ทุก field (รวมช่อง `comment`, ทุก stock movement, **GR object lifecycle + QC-gated credit**, การเปลี่ยน BOM/Supplier รวม save-back planning param, การกระทำในสายผลิตทั้งหมด).

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
| **SO (Own-Brand)** ★ | เลข SO / ลูกค้า(ถ้ามี) / ชนิด (ขายจากสต็อก/ผลิตเก็บสต็อก) / สถานะ · **★ produce-to-stock ที่มาจาก Supply Planning "สั่งผลิต" ตามได้ (SO → PRD/Batch — `supply-planning.md` §5b)** |
| PRD / Batch | เลข PRD / เลข Batch `B-{PO}-{line}-{run}` / สถานะ · **★ event: รับงาน / เริ่มผลิต / ส่ง QC / พร้อมส่ง / Hold / rework · field `actual_produced_qty` · consume lot (FIFO) · comment** · **★ r10: QC ผ่าน/ไม่ผ่าน (Batch) + feedback "QC ไม่ผ่าน" → Rework** |
| **วัตถุดิบ (RM) / Lot** | **รหัส RM (ผู้ใช้ตั้ง, unique, ★ ล็อกหลังสร้าง) / ชื่อ** / เลข Lot / supplier / **qc_status (รอตรวจ/พร้อมใช้/ระงับ)** · **สร้าง RM master + loss/adjust movement (Lot/FIFO ref) audit ได้** |
| **★ GR (ใบรับเข้า — object)** ★ r10 | **เลข GR / supplier / Lot(s) / RM / สถานะ GR (QC ตรวจสอบ/ผ่าน/ไม่ผ่าน/ยกเลิก)** · **event: บันทึกรับ (gen Lot รอตรวจ, ยังไม่ credit) / QC ผ่าน→`GR (+)` credit + FIFO retro-link / QC ไม่ผ่าน→Lot ระงับ / ส่งกลับ QC (re-submit) / ยกเลิก / comment** (`goods-receipt.md` §4/§9) |
| **FG (สินค้าสำเร็จรูป, per-Batch)** ★ | **รหัส FG (= รหัส BOM) / ชื่อ** / เลข Batch / ยอดราย Batch · **FG-in/surplus/loss/adjust movement audit ได้** — ค้นชื่อ+รหัส (`stock.md` §4) |
| **BOM (สูตร/FG master)** ★ | **รหัส BOM/FG / ชื่อ / TYPE / สถานะ (Active/Inactive)** · **event: สร้าง / แก้สูตร-ต้นทุน-ราคาซื้อ / inactivate / reactivate · ★ แก้ planning config รวม "บันทึกกลับ BOM master" จาก Supply Planning** (`bom.md` §5c/§9 · `supply-planning.md` §5c) |
| PR | เลข PR / วัตถุดิบ / สถานะ (**★ r10: รับ/ผ่านครบ = คิดจากปริมาณ QC "ผ่าน"**) |
| **Supplier** ★ | **รหัส SUP / ชื่อ / สถานะ active** · **event: สร้าง / แก้ / active↔inactive / แก้ price-matrix** (`supplier.md` §10) |
| Shipment / DN / Invoice | เลข SHP / DN / INV / ลูกค้า / สถานะ |
> **★ field `comment` (2026-07-29):** ทุก object ธุรกรรม (QT/PO/SO/PRD/Batch/DN/Shipment/Invoice/GR/PR) มี field `comment` ที่ **audit ได้** — filter ด้วย field="comment". ดู `comment-convention.md`.

## 4. Data model / rules
| รายการ | กติกา |
|---|---|
| genealogy | Lot→Batch→line→PO(หรือ SO)→ลูกค้า→DN/INV · node คลิก = deep link · rework = Batch run ใหม่ · **FG per-Batch** ผูก Own-Brand Batch/PRD · **QT = head** สาย OEM (loose ref QT↔PO) · **★ Supply Planning "สั่งผลิต" = SO produce-to-stock → PRD/Batch → FG-in** · **★ r10: Lot ผูก GR object ต้นทาง; Lot เข้าสาย genealogy เมื่อ QC ผ่าน (credit)** |
| audit | ระดับ field: เวลา/ผู้ทำ/entity/field/จาก→เป็น/เหตุผล · **ทุก action ทุก module** · รวม stock ledger (reason/source ต่อ movement, D15) |
| **★ stock movement audit (D15)** | **ทุก movement = audit + trace + reason + source ref บังคับ:** **เพิ่มวัตถุดิบใหม่** · **loss (−)** (RM: อ้าง Lot — เลือก lot/"FIFO") · **adjust (+)** (RM: **★ อ้าง Lot — เลือก lot/"FIFO"** · FG ราย Batch) · **`GR (+)` (★ r10: เกิดตอน QC ตรวจรับ "ผ่าน" — ชดเชยติดลบ + FIFO retro-link ที่จุดนี้; QC ไม่ผ่าน = ไม่มี movement)** · FG-in (+) · surplus (+) · return (−) · **CONSUME (−)** (เลือก lot มี stock; หลาย lot = FIFO). entity = RM/Lot หรือ FG/Batch. ดู `stock.md` §6. |
| **★ r10 GR object + QC-gated stock-in audit** | **GR lifecycle = audit event + trace:** **บันทึกรับ (gen GR object "QC ตรวจสอบ" + Lot รอตรวจ, ยังไม่ credit)** · **QC ตรวจรับ "ผ่าน" (credit `GR (+)` + FIFO retro-link + Lot พร้อมใช้ + GR=ผ่าน)** · **QC "ไม่ผ่าน" (Lot ระงับ + GR=ไม่ผ่าน)** · **ส่งกลับ QC (re-submit)** · **ยกเลิก GR (เฉพาะก่อน credit)** · **comment**. entity=GR/Lot, ใคร/เมื่อ/เดิม→ใหม่/เหตุผล. ดู `goods-receipt.md` §4/§9 · `qc.md` §4.1. |
| **★ Production action audit** | **ทุกการกระทำในสายผลิต = audit event + trace:** รับงาน (accept → gen PRD) · เริ่มผลิต (gen Batch + consume lot FIFO) · ส่งตรวจ QC · กด "✓ พร้อมส่ง" (capture surplus → FG) · Hold · rework (gen run+1) · field `actual_produced_qty` (old→new) · loss (production) · comment PRD/Batch · **★ r10: QC ตัดสิน Batch ผ่าน/ไม่ผ่าน + feedback "QC ไม่ผ่าน" → Rework (กำลังผลิต·Rework)**. ดู `production.md` §5/§7 · `qc.md` §4.2. |
| **★ PO edit audit** | **การแก้ PO ทุกครั้ง (รวมจากบริบทการผลิต — under-production) = field-level audit:** entity=PO, ทุกฟิลด์ที่แก้ old→new, ใคร/เมื่อ, เหตุผล · **และ raise ⚑ follow-up ที่ลูกค้า**. ดู `po.md` §5.2 · `customer.md` §4.1. |
| **★ BOM change audit** | สร้าง/แก้สูตร-ต้นทุน-ราคาซื้อ/inactivate/reactivate. รหัส BOM/FG/RM = create-only-lock. ดู `bom.md` §5c/§9. |
| **★ BOM planning-param save-back audit** | การกด **"บันทึกกลับ BOM master"** ใน Supply Planning modal = field-level audit (old→new) · **การ simulate/what-if ที่ไม่ persist = ไม่ audit**. ดู `supply-planning.md` §5c · `bom.md` §5. |
| **★ Supplier change audit** | สร้าง/แก้/active↔inactive/แก้ price-matrix. ดู `supplier.md` §10. |
| **★ QT activity** | สร้าง/แก้→version/Convert→Confirmed/reject/cancel. **★ การส่ง = print/share ไม่เปลี่ยนสถานะ/ไม่มี sent-date.** ดู `quotation.md` §10. |
| **★ comment edit** | entity=object / field=`comment` / old→new / เวลา / ผู้แก้ · เหตุผลว่างได้ · แก้ทับแต่ประวัติครบ · ลบไม่ได้ (AU2). ดู `comment-convention.md`. |
| retention | online 1 ปี · หลังจากนั้น Super User manual purge/archive |
| archive | text file · **Super User เท่านั้น** · ยืนยันก่อน export |
| เอกสารการค้า | void/cancel ไม่ลบ — trace ครบ (gapless) |

## 5. User Stories (absorbed) + AC สรุป
- **US-TRC-01 (Must) — Entity selector + field ต่อ entity:** เลือก entity=Batch → ค้น "B-…-170-1-2" → พบ + genealogy; ช่องค้นแสดง field ที่ใช้ได้. **★ r10:** entity=GR → ค้น "GR-20260728-003" → พบ + สถานะ GR + Lot + สาย. **Edge:** date range + time. **Error:** ไม่มีสิทธิ์ Read → entity ไม่อยู่ใน selector / 403.
- **US-TRC-02 (Must) — Genealogy + คลิก node:** ค้น B-…-170-1-2 → Lot → Batch run1(ไม่ผ่าน)+run2(ผ่าน) → line1 → PO-170 → ลูกค้า → DN/INV; คลิก node ไปหน้าจริง. **QT head:** entity=Quotation → node QT ต้นสาย. **★ r10 Lot ↔ GR:** node Lot คลิก → GR object ต้นทาง (สถานะ + วันตรวจผ่าน = จุด credit). **★ Supply Planning สั่งผลิต:** entity=SO (produce-to-stock) → PRD/Batch → FG-in. **Error:** entity ไม่มีสายผลิต (Supplier) → "ไม่มีสายการผลิต".
- **US-TRC-03 (Must) — ตาราง field-audit + archive:** CUS-000021 ตั้ง flag ⚑ → กรอง field="follow_up_flag" → false→true + เหตุผล + pagination. **★ QT:** "สร้าง / แก้→version / Convert→Confirmed / ยกเลิก" (★ ไม่มี "sent"). **★ comment:** entity=PO, filter field="comment". **★ stock movement:** entity=RM → "สร้าง RM / loss −2 (Lot L-GLY-2607) / adjust +5 (Lot/FIFO)". **★ r10 GR/QC:** entity=GR-… → "บันทึกรับ (Lot รอตรวจ, ยังไม่ credit) / QC ผ่าน (`GR (+)` +6, ชดเชยติดลบ 4, FIFO retro-link, Lot พร้อมใช้) — หรือ — QC ไม่ผ่าน (Lot ระงับ) / ส่งกลับ QC / ยกเลิก". **★ Production:** entity=PRD-… → "รับงาน / เริ่มผลิต (consume Lot FIFO) / actual_produced_qty 1000→1200 / พร้อมส่ง (surplus +200→FG) / loss −10". **★ Batch QC:** entity=Batch-… → "QC ไม่ผ่าน (feedback 'QC ไม่ผ่าน') → Rework run+1". **★ PO edit:** entity=PO-… → "แก้ qty line1 1000→900 (under-production) + raise follow-up". **★ BOM save-back:** entity=BOM-… → "บันทึกกลับ BOM master: Target Cover 30→45" — **simulate ที่ไม่ save = ไม่โผล่**. **Edge:** Super User archive text file. **Error:** ผู้ใช้ทั่วไป archive → 403.

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
- genealogy = graph traversal Lot→Batch(run)→line→order→customer→DN/INV (deep-link nodes) · **★ r10: Lot ↔ GR object; Lot เข้าสายจริงเมื่อ credit (QC ผ่าน)**.
- audit = generic field-level table ทุกตาราง (เดียวกับ Settings Audit-log) · **รวม field `comment` ทุก object + ทุก stock movement (add-RM/loss/adjust ที่มี Lot/FIFO ref/`GR (+)` on QC pass/FG-in/surplus/return/consume) + ★ GR object lifecycle (บันทึกรับ/QC ผ่าน-ไม่ผ่าน/ส่งกลับ QC/ยกเลิก) + ทุก production action + PO edit + ทุกการเปลี่ยน BOM (รวม save-back planning param) + Supplier** (ไม่ต้องมีตาราง audit แยก). **★ การ simulate/what-if ใน Supply Planning modal ที่ไม่ persist = ไม่เข้า audit**.

## 10. Cross-links
- Audit log ใน `settings.md` (US-SET-05) = มุมมองรวมของ field-audit เดียวกัน. **ledger reason/source + stock movement (add-RM/loss/adjust Lot-FIFO/`GR (+)` on QC pass) → `stock.md` §3b/§6.** **★ r10 GR object + QC-gated credit → `goods-receipt.md` §4/§9 · `qc.md` §4.1 · entity-status-map §1.8.** **★ Production action/actual-qty/loss/consume → `production.md` §5/§7 · PO edit → `po.md` §5.2 · follow-up → `customer.md` §4.1.** **BOM changes → `bom.md` §5c/§9 · save-back planning param + สั่งผลิต → `supply-planning.md` §5b/§5c.** **Supplier → `supplier.md` §10.** Glossary Lot/Batch. **QT activity → `quotation.md` §10.** **comment field audit → `comment-convention.md`.**

## 11. Module changelog
- **Absorbed:** functional-spec `traceability.html` US-TRC-01..03 (9 AC).
- **เพิ่ม (delta scope ใหม่):** QT = head-of-chain · SO entity · FG per-Batch · stock ledger reason/source (D15).
- **★ เพิ่ม (2026-07-29 — Quotation review):** QT activity audit. **★ REVERTED:** ถอด "Sent + sent-date".
- **★ เพิ่ม (2026-07-29 — comment cross-cutting):** field `comment` audited + trace-visible.
- **★ เพิ่ม (2026-07-29 — Stock review):** stock movement + RM code lock + dropdown search.
- **★ เพิ่ม (2026-07-29 — BOM + Supplier review):** BOM entity + changes audit; Supplier audit.
- **★ เพิ่ม (2026-07-29 — Production module review, ปอนด์):** Production action audit · PO edit field-level audit · Stock adjust Lot/FIFO.
- **★ เพิ่ม (2026-07-29 — Supply Planning module review, ปอนด์):** BOM planning-param save-back audit (simulate ไม่ audit) · "สั่งผลิต from Supply Planning" traceable.
- **★★ เพิ่ม (2026-07-29 — QC + GR/Stock flow review, ปอนด์):**
  1. **GR = entity ใหม่ใน §3** (สถานะ QC ตรวจสอบ/ผ่าน/ไม่ผ่าน/ยกเลิก + event lifecycle) · §4 row ใหม่ "GR object + QC-gated stock-in audit" · §5 ตัวอย่าง US-TRC-03 · §9.
  2. **★ `GR (+)` credit + FIFO retro-link = audit event ที่จุด QC ตรวจรับ "ผ่าน"** (ไม่ใช่ตอนบันทึก GR); QC ไม่ผ่าน = ไม่มี credit movement — §4 stock-movement row · §5 · §10, ref `goods-receipt.md` §9 · `qc.md` §4.1 · `stock.md` §6.
  3. **Lot ↔ GR object ใน genealogy** (Lot เข้าสายจริงเมื่อ credit) — §4/§9/US-TRC-02.
  4. **Batch QC ไม่ผ่าน → Rework (feedback "QC ไม่ผ่าน") audit** ใน Production-action row — §4/§5.
- **คงเดิม:** field-level audit · genealogy node คลิกได้ · archive Super User · retention 1 ปี · source เดียวกับ Settings audit.
