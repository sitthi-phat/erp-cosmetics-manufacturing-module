# Convention — Document number assigned on SAVE (cross-cutting · Global Rule G8)

slug: `erp-v2-ui-first` · per-module canonical · PO · 2026-07-29 · **AUTHORITATIVE convention (documented ONCE, referenced by every create screen that issues a gapless document number)**
กฎอ้างอิง: `non-functional.md` §5 (D-F2 gapless numbering ต่อปี/เดือน) · `traceability.md` §4 (audit เลขที่ออก) · README §3 (Global Rules table) · `comment-convention.md` (แม่แบบ convention กลาง)

## สรุปภาษาไทย
กติกากลาง **"เลขเอกสารออกตอนบันทึก (number-on-save)"** = **G8** ที่ใช้ซ้ำกับ **ทุกหน้าสร้างเอกสารที่ต้องออกเลขแบบ gapless**. หลักการ: **บนหน้าสร้าง (create) ห้ามโชว์เลขเอกสารล่วงหน้า** — ช่องเลขแสดงเป็น **"(ระบบออกให้เมื่อบันทึก)"** (read-only) · **เมื่อกดบันทึกสำเร็จ → ระบบออกเลข gapless ต่อปี/เดือน ตามชนิดเอกสาร (D-F2) แล้วเด้ง popup ยืนยันแสดง "เลขที่ออกให้ + สรุปเอกสารที่บันทึก" (+ ลิงก์ดู/พิมพ์ ถ้ามี)**. ผลลัพธ์: **ป้องกันเลขหาย (gapless)** เพราะ **ร่างที่ไม่ได้บันทึกไม่กินเลข** และผู้ใช้เห็นเลขจริงพร้อม summary ทันทีหลังบันทึก. เอกสารนี้เป็นแหล่งเดียว — module อื่นอ้างอิง ไม่เขียนซ้ำ. ใช้กับ: **Lot/GR (Stock รับเข้าคลัง) · QT · SO · PO · PR** (ที่ปอนด์สั่ง) **+ ขยายไปยัง DN/Shipment · Invoice · PRD · Batch** เพื่อความสม่ำเสมอ (ดู §4 พร้อมข้อยกเว้นที่อธิบายชัด).

---

## 1. Purpose
1. **ป้องกันการสูญเปล่าของเลข gapless:** ถ้าออกเลขล่วงหน้า (ตอนเปิดหน้า create) แล้วผู้ใช้ทิ้งร่าง → เลขนั้นหาย/ต้องเว้น. การออกเลข **ตอนบันทึกสำเร็จ** ทำให้ **ร่างที่ไม่ถูกบันทึกไม่กินเลข** → เลขต่อเนื่องไม่ขาด (D-F2).
2. **ลดความสับสน:** ผู้ใช้ไม่เห็นเลขปลอม/เลขจองที่อาจไม่ถูกใช้จริง — เห็น **เลขจริงเมื่อบันทึกเสร็จ** พร้อมสรุปสิ่งที่บันทึก.
3. **สม่ำเสมอทั้งระบบ:** ทุกหน้าสร้างเอกสารมี **พฤติกรรมเดียวกัน** (hidden number → save → popup + summary).

## 2. The convention (นิยามกลาง — ยึดที่นี่ที่เดียว)
| # | กติกา | รายละเอียด |
|---|---|---|
| **NS1** | **ไม่โชว์เลขล่วงหน้าบนหน้า create** | ช่อง "เลขเอกสาร" บนหน้าสร้าง = **read-only placeholder "(ระบบออกให้เมื่อบันทึก)"** · ไม่มีเลขจริง/เลขจอง แสดงก่อนบันทึก |
| **NS2** | **ออกเลขตอนบันทึกสำเร็จ (on successful save)** | เมื่อ validation ผ่าน + บันทึกลง DB สำเร็จ → **ระบบออกเลข gapless ต่อปี/เดือน ตามชนิดเอกสาร** (D-F2, `non-functional.md` §5) แบบ atomic ในทรานแซกชันเดียวกับการบันทึก · **ไม่ออกเลขถ้าบันทึกไม่ผ่าน** |
| **NS3** | **Popup ยืนยัน: เลขที่ออก + สรุปเอกสาร** | หลังบันทึก → **confirmation popup** แสดง **(ก) เลขที่ออกให้** (เด่นชัด) + **(ข) สรุปเอกสารที่บันทึก** (คู่ค้า/ลูกค้า/supplier · จำนวนรายการ · ยอดรวม/ปริมาณ ตามบริบท) + **(ค) ลิงก์ "ดูรายละเอียด" / "พิมพ์"** เมื่อเอกสารนั้นมีมุมมอง detail/print |
| **NS4** | **ร่างที่ไม่ได้บันทึก = ไม่กินเลข (gapless protection)** | เปิดหน้า create แล้วปิด/ยกเลิกก่อนบันทึก → **ไม่มีการออกเลข** → เลขลำดับถัดไปไม่ขาด · เป็นเหตุผลหลักของ NS1/NS2 |
| **NS5** | **เลขที่ออกแล้ว = immutable + คงอยู่แม้ void/cancel** | เมื่อออกเลขแล้วห้ามเปลี่ยน · **ยกเลิก/void เอกสาร = เลขคงอยู่ (gapless, ไม่นำกลับมาใช้ซ้ำ)** — ตรง D-F2/deletion-policy |
| **NS6** | **ใช้กับการสร้างครั้งแรกเท่านั้น** | **แก้ไข / สร้างเวอร์ชันใหม่ / void = ใช้เลขเดิม** (ไม่ออกเลขใหม่, ไม่เด้ง popup ออกเลข) · G8 = จุดออกเลขครั้งแรก |
| **NS7** | **1 การบันทึกที่ออกหลายเลข → popup แสดงครบทุกเลข** | เอกสารที่บันทึกครั้งเดียวออกหลายเลข (เช่น **GR + Lot(s)** · **Shipment + DN(s)**) → popup แสดง **ทุกเลขที่ออก** พร้อม summary รายเลข |

## 3. Behaviour / rules
- **Audit:** การออกเลข = ส่วนหนึ่งของ **entity-create event** (ใคร/เมื่อ/เลขที่ออก) — audit + trace ผ่าน field-audit เดิม (`traceability.md` §4 · `non-functional.md` AU1). ไม่มีตาราง/กลไกใหม่.
- **Concurrency/gapless:** การออกเลขต้อง atomic (lock ลำดับต่อชนิด+ปี/เดือน) เพื่อไม่ให้เลขชนกันภายใต้ 50 concurrent users — รายละเอียด implementation = Tech-Lead (`non-functional.md` P2/D-F2); G8 = business behaviour.
- **Save ล้มเหลว:** ถ้าบันทึกไม่สำเร็จ (validation/DB error) → **ไม่ออกเลข, ไม่เด้ง popup ออกเลข** → ผู้ใช้แก้แล้วบันทึกใหม่ (เลขยังไม่ถูกกิน).
- **หน้า create ที่ออกเลข "ตอน action" (ไม่ใช่ปุ่มบันทึกฟอร์ม):** เอกสารบางชนิดถูกออกเลขจาก **action** (เช่น PRD ตอน "รับงาน", Batch ตอน "เริ่มผลิต") ไม่ใช่จากฟอร์ม create ที่มีช่องเลข → **ส่วน NS1 (ซ่อนช่องเลข) ไม่มีผล** (ไม่มีฟอร์มที่โชว์ช่องเลข) แต่ **NS2/NS3 มีผล**: เลขออกตอน action สำเร็จ + **แสดงเลขที่ออกใน confirm popup ของ action นั้น** (ไม่สร้าง popup ใหม่ซ้อน — fold เข้ากับ confirm popup เดิม §4).
- **เอกสารที่ระบบสร้างอัตโนมัติ (auto):** เช่น **PR auto จาก PO/SO** ที่วัตถุดิบขาด → ระบบออกเลขเองตอน generate (ไม่มีหน้า create/ปุ่มบันทึกของผู้ใช้) → **ไม่เด้ง popup** (ไม่มี user action) แต่ยัง gapless + audit. G8 popup ใช้กับ **การสร้างโดยผู้ใช้ผ่านหน้า create** (เช่น pr-create ตรง).

## 4. ★ Doc list (ขอบเขตที่ใช้ G8)
"เลขที่ออก" = D-F5 (`non-functional.md` §5). "สรุปใน popup" = ฟิลด์แกนที่ผู้ใช้ควรเห็นทันที.

| เอกสาร | เลขที่ออก (pattern) | Module doc | ออกเลขตอน (trigger) | สรุปใน popup | ลิงก์ | หมายเหตุ |
|---|---|---|---|---|---|---|
| **★ Lot + GR (Stock รับเข้าคลัง)** | `GR-{YYYYMMDD}-{NNN}` + Lot `{supplier prefix}{YYMM}` (ราย line) | `goods-receipt.md` §3/§5 · `stock.md` §2/§2b | กด **บันทึกรับเข้า** (goods-receipt create) | supplier · จำนวน line/Lot · เลข GR + **ทุก Lot ที่ gen** (NS7) · หมายเหตุ "รอ QC ตรวจรับ" | เปิด GR เต็ม · ไปหน้า QC ตรวจรับ | **ปอนด์-listed (Lot/รับเข้าคลัง)** · popup ตอกย้ำ "ยังไม่เข้าสต็อก รอ QC" (QC-gated) |
| **★ QT (Quotation)** | `QT-{YYYYMM}-{NNNNNN}` | `quotation.md` §3/§5 | กด **บันทึก** (quotation-create) | ลูกค้า · จำนวน line · ยอดรวม+VAT · เลข QT | ดู detail / **print-ready view** | **ปอนด์-listed** · print-ready view เดิมยังมี (§5) |
| **★ SO (Sales Order)** | `SO-{YYYYMM}-{NNNNNN}` | `so.md` §3/§5/§6 | กด **บันทึก/ยืนยัน** (so-create, โหมด ก/ข) | โหมด · ลูกค้า (ก)/— (ข) · FG+จำนวน · เลข SO | ดู so-detail | **ปอนด์-listed** |
| **★ PO (Purchase Order)** | `PO-{YYYYMM}-{NNNNNN}` | `po.md` §3/§5 | กด **บันทึก** (po-create, รวม prefill จาก QT) | ลูกค้า · จำนวน line · ยอดรวม+VAT · เลข PO · (origin QT ถ้ามี) | ดู po-detail | **ปอนด์-listed** |
| **★ PR (Purchase Request)** | `PR-{NNNNNN}` | `pr.md` §3/§5 | กด **บันทึก** (pr-create ตรง) | วัตถุดิบ · จำนวนที่ขอ · เลข PR | ดู PR | **ปอนด์-listed** · **PR auto จาก PO/SO = ระบบออกเลขเอง ไม่เด้ง popup (§3)** |
| **DN + Shipment (จัดส่ง)** | `SHP-{YYYYMMDD}-{NNNN}` + `DN-{YYYYMMDD}-{NNNNN}` (ราย order) | `shipping.md` §3/§5 | กด **สร้างรอบ** (shipping create-round) | คนขับ/route · จำนวน order · เลข SHP + **ทุก DN ที่ gen** (NS7) | เปิด/พิมพ์ DN | **ขยาย (propose)** · หลาย DN ต่อรอบ → NS7 |
| **Invoice** | `INV-{YYYY}-{NNNNNN}` | `invoice.md` §3/§5 | กด **ออกใบแจ้งหนี้** (จาก PO/SO) | ลูกค้า · อ้าง PO/SO · ยอด grand total · เลข INV | ดู detail / **print ใบกำกับ** | **ขยาย (propose)** · versioning/void = เลขเดิม (NS6) |
| **PRD (คำสั่งผลิต)** | `PRD-{YYYYMM}-{NNNNNN}` | `production.md` §3/§4 | action **"รับงาน"** (ไม่ใช่ฟอร์ม create) | PO/SO ต้นทาง · line/สินค้า · เลข PRD | เข้าหน้าจัดการผลิต | **ขยาย (propose) — NS1 N/A** (ออกตอน action) · **fold เข้ากับ confirm popup "รับงาน" เดิม** (§7.7 production) — ไม่ทำ popup ใหม่ |
| **Batch** | `B-{PO}-{line}-{run}` | `production.md` §3/§4 | action **"เริ่มผลิต"** | PRD/PO · run # · เลข Batch | เปิด Batch | **ขยาย (propose) — NS1 N/A · เลข derived (ไม่ gapless-per-เดือน)** → เฉพาะ NS3 (แสดงเลขใน confirm "เริ่มผลิต") มีผล; NS2 gapless ไม่บังคับ (เลข deterministic) |

- **QC record:** = **ผลการตัดสิน (ผ่าน/ไม่ผ่าน) ผูก GR line/Batch — ไม่ใช่เอกสารที่มีเลข gapless แยก** → **ไม่อยู่ในขอบเขต G8** (ไม่มีเลขให้ออก). ตรวจรับ/ตรวจแบตช์ = แสดงผลบน Lot/Batch เดิม.
- **Master (Customer/Supplier/RM/BOM-FG code):** รหัสเป็น **user-entered หรือ master identity** ไม่ใช่ running number gapless → **ไม่ใช่ G8** (RM/BOM/FG code = user-entered+unique+lock — D11 v2/`stock.md` §3b/`bom.md` §5).

## 5. ★ Reasonable decisions (PO — settled; ปอนด์ override ได้)
- **ขยาย G8 ไปยัง DN/Shipment · Invoice · PRD · Batch = ทำ** (ปอนด์: "apply to those too unless one has a reason not to"). เหตุผล: ทั้งหมดออก running number ตอน action/บันทึก → พฤติกรรม number-on-save + confirm popup + summary สม่ำเสมอทั้งระบบ.
- **PRD/Batch = ไม่มีหน้า create form ที่โชว์ช่องเลข** (ถูก gen จาก action "รับงาน"/"เริ่มผลิต") → **NS1 (ซ่อนช่องเลข) ไม่มีผล**; ใช้เฉพาะ **NS3 (แสดงเลขที่ออกใน confirm popup ของ action เดิม)** — **ไม่สร้าง popup ซ้อนใหม่** เพราะ production มี confirm popup ทุก status change อยู่แล้ว (`production.md` §7.7). Batch เลข **derived (`B-{PO}-{line}-{run}`)** ไม่ใช่ gapless-per-เดือน → NS2 (gapless) ไม่บังคับกับ Batch.
- **PR auto (จาก PO/SO ที่วัตถุดิบขาด) = ระบบ gen เอง → ไม่เด้ง popup** (ไม่มี user action); popup ใช้กับ **pr-create ตรง** เท่านั้น.
- **ไม่มีเอกสารใดที่ "ห้ามใช้" G8** — จึงไม่มีคำถามค้างถึงปอนด์เรื่องนี้. (ข้อยกเว้นเชิงเทคนิค = NS1 N/A ของ PRD/Batch, และ auto-PR ไม่มี popup — เป็นการปรับใช้ ไม่ใช่การยกเว้น.)

## 6. Cross-links
- Gapless numbering ต่อปี/เดือน + รายการ pattern เลข → `non-functional.md` §5 (D-F2/D-F5) · void ไม่ทำเลขหาย → `deletion-policy.md`.
- audit การออกเลข (entity-create) → `traceability.md` §4 · `non-functional.md` AU1.
- ราย module ที่อ้าง G8 บน create flow: `goods-receipt.md` §5 · `stock.md` §2 · `quotation.md` §5 · `so.md` §5/§6 · `po.md` §5 · `pr.md` §5 · `shipping.md` §5 · `invoice.md` §5 · `production.md` §4/§7 (แต่ละไฟล์อ้างกติกานี้ ไม่เขียนซ้ำ).

## 7. Module changelog
- **★ NEW (2026-07-29 — ปอนด์ cross-cutting "document number on save"):** สร้าง Global Rule **G8** = **เลขเอกสารออกตอนบันทึก** (NS1–NS7) · ช่องเลขบน create = **"(ระบบออกให้เมื่อบันทึก)"** · บันทึก → ออกเลข gapless (D-F2) → **popup เลขที่ออก + summary (+ ลิงก์ดู/พิมพ์)** · ร่างที่ไม่บันทึก = ไม่กินเลข. **Apply (ปอนด์-listed):** Lot/GR (รับเข้าคลัง) · QT · SO · PO · PR. **Extend (propose → apply):** DN/Shipment · Invoice · PRD · Batch (พร้อมข้อยกเว้นที่อธิบาย §4/§5). **QC record + master code = นอกขอบเขต G8.** อ้างโดยทุก create flow + `non-functional.md` §5 + README §3.
