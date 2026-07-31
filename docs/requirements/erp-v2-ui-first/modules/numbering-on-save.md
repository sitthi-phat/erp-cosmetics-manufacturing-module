# Convention — Document number assigned on SAVE (cross-cutting · Global Rule G8)

slug: `erp-v2-ui-first` · per-module canonical · PO · 2026-07-29 (**+ Route/DN rename 2026-07-30 · Q1=A LOCKED · + Invoice create/one-active clarify 2026-07-30 · + Return number `RET-…` added 2026-07-31**) · **AUTHORITATIVE convention (documented ONCE, referenced by every create screen that issues a gapless document number)**
กฎอ้างอิง: `non-functional.md` §5 (D-F2/D-F5 gapless numbering) · `traceability.md` §4 (audit เลขที่ออก) · README §3 · `comment-convention.md` (แม่แบบ convention กลาง)

## สรุปภาษาไทย
กติกากลาง **"เลขเอกสารออกตอนบันทึก (number-on-save)"** = **G8** ที่ใช้ซ้ำกับ **ทุกหน้าสร้างเอกสารที่ต้องออกเลขแบบ gapless**. หลักการ: **บนหน้าสร้าง (create) ห้ามโชว์เลขเอกสารล่วงหน้า** — ช่องเลขแสดงเป็น **"(ระบบออกให้เมื่อบันทึก)"** (read-only) · **เมื่อกดบันทึกสำเร็จ → ระบบออกเลข gapless แล้วเด้ง popup ยืนยันแสดง "เลขที่ออกให้ + สรุปเอกสาร" (+ ลิงก์ดู/พิมพ์)**. ผลลัพธ์: **ป้องกันเลขหาย (gapless)** เพราะ **ร่างที่ไม่ได้บันทึกไม่กินเลข**. ใช้กับ: **Lot/GR · QT · SO · PO · PR** (ปอนด์สั่ง) **+ ขยายไปยัง DN/Route · Invoice · PRD · Batch · ★ Return (`RET-…`)**. **★ DECIDED (Q1=A, ปอนด์ 2026-07-30): รอบจัดส่ง "Shipment `SHP-…`" → "Route `RT-…`" (RT แทน SHP ทั้งหมด, drop SHP); เลข RT + ทุก DN ในรอบ ออกพร้อมกันตอน "สร้างรอบ" (NS7).** **★ Invoice (2026-07-30): เลข INV ออกตอน "สร้างใบแจ้งหนี้" สำเร็จ + พิมพ์ได้ทันที; 1 PO/SO มีใบ active ทีละใบ — void = เลขเดิมคงอยู่ (NS5), ออกใบใหม่หลัง void = เลขใหม่; สร้าง/พิมพ์ Invoice จากหน้า DN = ใบ active เดียวกัน (ไม่ออกเลขซ้ำถ้ามีใบ active — DN-unify).** **★ Return (2026-07-31): ใบคืนวัตถุดิบมีเลขของตัวเอง `RET-{YYYYMM}-{NNNNNN}` (gapless ต่อปี/เดือน, void-only) — คนละ prefix กับ Route (`RT-…`) เพื่อเลิกความกำกวมของ "RT".**

---

## 1. Purpose
1. **ป้องกันการสูญเปล่าของเลข gapless:** ออกเลข **ตอนบันทึกสำเร็จ** → ร่างที่ไม่ถูกบันทึกไม่กินเลข → เลขต่อเนื่องไม่ขาด (D-F2).
2. **ลดความสับสน:** ผู้ใช้เห็น **เลขจริงเมื่อบันทึกเสร็จ** พร้อมสรุป.
3. **สม่ำเสมอทั้งระบบ:** ทุกหน้าสร้างเอกสารมี **พฤติกรรมเดียวกัน**.

## 2. The convention (นิยามกลาง — ยึดที่นี่ที่เดียว)
| # | กติกา | รายละเอียด |
|---|---|---|
| **NS1** | **ไม่โชว์เลขล่วงหน้าบนหน้า create** | ช่อง "เลขเอกสาร" = **read-only placeholder "(ระบบออกให้เมื่อบันทึก)"** |
| **NS2** | **ออกเลขตอนบันทึกสำเร็จ** | validation ผ่าน + บันทึกสำเร็จ → ออกเลข gapless atomic · **ไม่ออกเลขถ้าบันทึกไม่ผ่าน** |
| **NS3** | **Popup ยืนยัน: เลขที่ออก + สรุปเอกสาร** | (ก) เลขที่ออก (เด่นชัด) + (ข) สรุป + (ค) ลิงก์ "ดู/พิมพ์" |
| **NS4** | **ร่างที่ไม่ได้บันทึก = ไม่กินเลข (gapless protection)** | ปิด/ยกเลิกก่อนบันทึก → ไม่ออกเลข |
| **NS5** | **เลขที่ออกแล้ว = immutable + คงอยู่แม้ void/cancel** | ยกเลิก/void = เลขคงอยู่ (ไม่ reuse) |
| **NS6** | **ใช้กับการสร้างครั้งแรกเท่านั้น** | แก้ในใบเดิม (in-place)/void = เลขเดิม · **★ ออก "ใบใหม่" (เอกสารใบใหม่จริง เช่น Invoice ใหม่หลัง void) = เลขใหม่** |
| **NS7** | **1 การบันทึกที่ออกหลายเลข → popup แสดงครบทุกเลข** | **GR + Lot(s)** · **★ Route (RT) + DN(s)** → popup แสดงทุกเลข + summary รายเลข |

## 3. Behaviour / rules
- **Audit:** การออกเลข = ส่วนหนึ่งของ **entity-create event** — audit + trace ผ่าน field-audit เดิม.
- **Concurrency/gapless:** ออกเลข atomic (lock ลำดับต่อชนิด+ปี/เดือน; **RT/DN = ต่อวัน**) — implementation = Tech-Lead.
- **Save ล้มเหลว:** ไม่ออกเลข, ไม่เด้ง popup.
- **หน้า create ที่ออกเลข "ตอน action":** PRD ("รับงาน"), Batch ("เริ่มผลิต"), **Invoice ("สร้างใบแจ้งหนี้" จาก PO/SO)** → NS1 ไม่มีผลแบบหน้าฟอร์ม; NS2/NS3 มีผล (แสดงเลขใน confirm popup).
- **★ Invoice one-active (DN-unify):** ปุ่ม "สร้าง/พิมพ์ Invoice" จากหน้า DN ทำงานบน **ใบ active เดียวกันของ PO/SO** — ยังไม่มีใบ active → สร้าง (ออกเลข INV, NS2/NS3); มีใบ active แล้ว → **พิมพ์ (ไม่ออกเลขซ้ำ)**. (`invoice.md` §4b/§5).
- **เอกสารที่ระบบสร้างอัตโนมัติ:** PR auto จาก PO/SO → ระบบออกเลขเอง ไม่เด้ง popup.
- **★ Return (`RET-…`):** เลขใบคืนออกตอนกด **บันทึกใบคืนสำเร็จ** (NS2/NS3) — ตัด stock + ledger `return (−)` ในการบันทึกเดียวกัน. void ใบคืน = เลขเดิมคงอยู่ (NS5). ไม่ reuse.

## 4. ★ Doc list (ขอบเขตที่ใช้ G8)
| เอกสาร | เลขที่ออก (pattern) | Module doc | ออกเลขตอน (trigger) | สรุปใน popup | ลิงก์ | หมายเหตุ |
|---|---|---|---|---|---|---|
| **★ Lot + GR (Stock รับเข้าคลัง)** | `GR-{YYYYMMDD}-{NNN}` + Lot `{supplier prefix}{YYMM}` | `goods-receipt.md` §3/§5 · `stock.md` §2/§2b | กด **บันทึกรับเข้า** | supplier · จำนวน line/Lot · เลข GR + **ทุก Lot** (NS7) · "รอ QC" | เปิด GR · ไปหน้า QC | **ปอนด์-listed** · ตอกย้ำ "ยังไม่เข้าสต็อก รอ QC" |
| **★ QT (Quotation)** | `QT-{YYYYMM}-{NNNNNN}` | `quotation.md` §3/§5 | กด **บันทึก** | ลูกค้า · จำนวน line · ยอดรวม+VAT · เลข QT | ดู detail / print-ready | **ปอนด์-listed** |
| **★ SO (Sales Order)** | `SO-{YYYYMM}-{NNNNNN}` | `so.md` §3/§5/§6 | กด **บันทึก/ยืนยัน** (ก/ข) | โหมด · ลูกค้า(ก) · FG+จำนวน · เลข SO | ดู so-detail | **ปอนด์-listed** |
| **★ PO (Purchase Order)** | `PO-{YYYYMM}-{NNNNNN}` | `po.md` §3/§5 | กด **บันทึก** (รวม prefill QT) | ลูกค้า · จำนวน line · ยอดรวม+VAT · เลข PO · (origin QT) | ดู po-detail | **ปอนด์-listed** |
| **★ PR (Purchase Request)** | `PR-{NNNNNN}` | `pr.md` §3/§5 | กด **บันทึก** (pr-create ตรง) | วัตถุดิบ · จำนวนที่ขอ · เลข PR | ดู PR | **ปอนด์-listed** · **PR auto = ไม่เด้ง popup** |
| **★★★ DN + Route (จัดส่ง) — Q1=A** | **`RT-{YYYYMMDD}-{NNNN}` (RT แทน SHP, Q1=A DECIDED)** + `DN-{YYYYMMDD}-{NNNNN}` (ราย order) | `shipping.md` §3/§5 · `delivery-note.md` §3 | กด **สร้าง Route (shipping create-round)** | คนขับ/route/ประเภทรถ · จำนวน order · เลข RT + **ทุก DN ที่ gen (PO/SO ใบไหนได้ DN ใด)** (NS7) | เปิด/พิมพ์ DN | **ขยาย** · หลาย DN ต่อรอบ → NS7 · **★ Route = ชื่อใหม่ของ Shipment (drop SHP)** |
| **★ Invoice** | `INV-{YYYY}-{NNNNNN}` | `invoice.md` §3/§4b/§5 | กด **สร้างใบแจ้งหนี้** (จาก PO/SO · รวมจากหน้า DN) | ลูกค้า · อ้าง PO/SO · grand total · เลข INV | ดู detail / **พิมพ์ใบกำกับได้ทันที** | **ขยาย** · **1 PO/SO ใบ active ทีละใบ** · void = เลขเดิม (NS5) · **ใบใหม่หลัง void = เลขใหม่ (NS6)** · **สร้างจากหน้า DN = ใบ active เดียวกัน (ไม่ออกเลขซ้ำถ้ามีใบ active — DN-unify)** |
| **★★ Return (ใบคืนวัตถุดิบ) — NEW 2026-07-31** | **`RET-{YYYYMM}-{NNNNNN}` (gapless ต่อปี/เดือน · void-only)** | `return.md` §3/§5 | กด **บันทึกใบคืน** (return-create) | supplier · Lot · RM · จำนวนคืน · เลข RET | เปิดใบคืน | **ขยาย** · **★ prefix เฉพาะของใบคืน (คนละตัวกับ Route `RT-…`)** · void = เลขเดิม (NS5) · deletion-policy = void-only |
| **PRD (คำสั่งผลิต)** | `PRD-{YYYYMM}-{NNNNNN}` | `production.md` §3/§4 | action **"รับงาน"** | PO/SO · line/สินค้า · เลข PRD | เข้าหน้าจัดการผลิต | **ขยาย — NS1 N/A** · fold เข้ากับ confirm popup "รับงาน" |
| **Batch** | `B-{PO}-{line}-{run}` | `production.md` §3/§4 | action **"เริ่มผลิต"** | PRD/PO · run # · เลข Batch | เปิด Batch | **ขยาย — NS1 N/A · เลข derived** → เฉพาะ NS3 |

- **QC record:** ไม่ใช่เอกสารที่มีเลข gapless แยก → **นอกขอบเขต G8**.
- **Master (Customer/Supplier/RM/BOM-FG code):** user-entered → **ไม่ใช่ G8**.

## 5. ★ Reasonable decisions (PO — settled; ปอนด์ override ได้)
- **ขยาย G8 ไปยัง DN/Route · Invoice · PRD · Batch · Return = ทำ** (ปอนด์: "apply to those too unless one has a reason not to").
- **PRD/Batch = ไม่มีหน้า create form ที่โชว์ช่องเลข** → NS1 ไม่มีผล; ใช้ NS3.
- **PR auto = ไม่เด้ง popup**.
- **★ DECIDED (Q1=A, ปอนด์ 2026-07-30): รอบจัดส่งเปลี่ยนชื่อ Shipment → Route, เลข `RT-…` (RT แทน SHP ทั้งหมด, drop SHP).** RT + ทุก DN ในรอบ ออกพร้อมกันตอน "สร้างรอบ" (NS7). พฤติกรรม number-on-save คงเดิมทุกประการ (เปลี่ยนแค่ prefix/ชื่อ).
- **★ Invoice (2026-07-30 — Invoice review): เลข INV ออกตอน "สร้างใบแจ้งหนี้" สำเร็จ + print-ready ทันที.** เดิม doc มีคำว่า "versioning" — ปอนด์เปลี่ยนโมเดลเป็น **multiple-invoices-one-active** (`invoice.md` §4b): void ใบ = เลขเดิมคงอยู่ (NS5); ออก **ใบใหม่แทน** = **เลขใหม่** (NS6, เพราะเป็นเอกสารใบใหม่จริง ไม่ใช่ in-place edit). แก้ข้อมูลบนใบเดิม (customer override/รายการ) = ใบเดิม เลขเดิม. สร้าง/พิมพ์ Invoice จากหน้า DN = ใบ active เดียวกัน (DN-unify — ไม่ออกเลขซ้ำถ้ามีใบ active).
- **★ Return (2026-07-31 — reconcile M1): ใบคืนวัตถุดิบได้ prefix ของตัวเอง `RET-{YYYYMM}-{NNNNNN}`** (gapless ต่อปี/เดือน, void-only ตาม deletion-policy) — **แยกจาก Route `RT-…`** เพื่อเลิกการชนกันของ token "RT" ที่เดิมใช้แทนทั้งรอบจัดส่งและใบคืน. ledger source ของ `return (−)` ใช้ **RET** (ไม่ใช่ "RT") — sync `return.md` · `stock.md` §6 · `traceability.md`. พฤติกรรม number-on-save = NS2/NS3 (ออกเลขตอนบันทึกใบคืนสำเร็จ).

## 6. Cross-links
- Gapless numbering + pattern → `non-functional.md` §5 (D-F2/D-F5) · void ไม่ทำเลขหาย → `deletion-policy.md`.
- audit การออกเลข → `traceability.md` §4 · `non-functional.md` AU1.
- ราย module: `goods-receipt.md` · `stock.md` · `quotation.md` · `so.md` · `po.md` · `pr.md` · **`shipping.md` (Route) · `delivery-note.md` (DN)** · `invoice.md` · `production.md` · **`return.md` (Return `RET-…`)**.

## 7. Module changelog
- **★ NEW (2026-07-29 — ปอนด์ cross-cutting "document number on save"):** สร้าง Global Rule **G8** (NS1–NS7). Apply: Lot/GR · QT · SO · PO · PR. Extend: DN/Shipment · Invoice · PRD · Batch.
- **★★★ UPDATED (2026-07-30 — Route/DN r11):** "DN + Shipment (`SHP-…`)" → **"DN + Route (`RT-…`)"**; trigger = "สร้าง Route"; popup NS7 แสดง RT + ทุก DN + ระบุ PO/SO ใบไหนได้ DN ใด. §4 doc list · §5 · §6 · summary. พฤติกรรมคงเดิม (เปลี่ยน prefix/ชื่อ).
- **★★★ DECIDED (2026-07-30 — Q1=A, ปอนด์):** **RT แทน SHP ทั้งหมด (drop SHP)** — ถอด open-question ออกทั้งหมด; SHP → RT (renamed) เป็น historical note เท่านั้น.
- **★ UPDATED (2026-07-30 — Invoice review, ปอนด์):** Invoice row §4 trigger = "สร้างใบแจ้งหนี้" (รวมจากหน้า DN) + print-ready ทันที; **one-active model** — void = เลขเดิม (NS5), **ใบใหม่หลัง void = เลขใหม่ (NS6)**, สร้างจากหน้า DN = ใบ active เดียวกัน (ไม่ออกเลขซ้ำ · DN-unify). NS6 wording ปรับให้ครอบทั้ง in-place edit (เลขเดิม) และ "ใบใหม่จริง" (เลขใหม่). §2 (NS6)/§3/§4/§5/summary, ref `invoice.md` §4b/§5.
- **★★ ADDED (2026-07-31 — reconciliation M1, ปอนด์):** **Return document number `RET-{YYYYMM}-{NNNNNN}`** (gapless ต่อปี/เดือน, void-only) เพิ่มลง §4 doc list + §3/§5/§6/summary — **แก้การชนของ token "RT"** (เดิมใช้แทนทั้ง Route และใบคืน). Route คง `RT-…`; ใบคืนใช้ `RET-…`; ledger source ของ `return (−)` เปลี่ยนจาก "RT" → "RET" (sync `return.md` · `stock.md` §6 · `traceability.md`). ไม่กระทบกลไก G8.
