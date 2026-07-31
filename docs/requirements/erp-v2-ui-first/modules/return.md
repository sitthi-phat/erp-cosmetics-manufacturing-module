# Module — Return (คืนวัตถุดิบให้ Supplier)

slug: `erp-v2-ui-first` · per-module canonical · PO · 2026-07-29 (**+ Return number `RET-…` + de-collide "RT" 2026-07-31 · ★ + Gate-1 r20 2026-07-31: A4 purge stale C-codes (C18/C13) · B4 mark RT→RET UX note DONE**) · **AUTHORITATIVE SPEC** (absorbs functional-spec `return.html` US-RET-01)
Mockups: `mockups/return.html`
กฎอ้างอิง: entity-status-map §6 (return journey) · `qc.md` (Lot ไม่ผ่าน→ระงับ→คืน) · `stock.md` (ตัด on_hand + ledger `return (−)`) · `supplier.md` (lot→supplier lookup) · `goods-receipt.md` §3 (Lot = `{supplier prefix}{YYMM}` → **1 Lot ถือได้หลาย RM**) · **`numbering-on-save.md` §4 (เลขใบคืน `RET-…` — G8)** · **`comment-convention.md` (G6/CC1–CC7 — comment field)** · **README §3 (G7 search-in-dropdown)** · **`permission-matrix.md` §3 (สร้างใบคืน=C · void ใบคืน=D — r20 B1)** · README §3

## สรุปภาษาไทย
ทำใบคืนวัตถุดิบให้ supplier เมื่อรับของมาแล้วตรวจเจอเสียหาย (หรือ QC ขาเข้าไม่ผ่าน → Lot ระงับ). **★ เพราะ 1 Lot ถือได้หลายวัตถุดิบ (RM)** — เลข Lot = `{supplier prefix}{YYMM}` แชร์กันหลาย RM (`goods-receipt.md` §3) — ตอนสร้างใบคืน **ต้องเลือกทั้ง Lot และ RM ตัวที่จะคืน**. ขั้นตอน: **เลือก Lot → ระบบแสดง supplier อัตโนมัติ → ★ เลือก RM ในล็อตนั้น (บังคับ · search-in-dropdown ค้นชื่อ+รหัส RM · G7) → แก้จำนวน return (ไม่เกินคงเหลือของ RM ตัวนั้นในล็อต) → ตัด stock + เหตุผลการคืนบังคับ**. ตัด on_hand ของ (lot, RM) นั้น + ledger `return (−)` (source = Lot/RM/Supplier/RET) + trace. **★ เลขใบคืน `RET-{YYYYMM}-{NNNNNN}` (ออกตอนบันทึกสำเร็จ G8/NS2, gapless ต่อปี/เดือน, void-only) — คนละ prefix กับ Route `RT-…`.** **★ list ค้นได้ด้วย Lot / Supplier / ชื่อ RM / รหัส RM (+ เลขใบคืน RET / ช่วงวันที่)**. สถานะ: ร่าง → คืนแล้ว → ปิด / ยกเลิก. **★ สิทธิ์ (r20 B1): สร้างใบคืน = Warehouse/Stock.Create (C) · ยกเลิก/void ใบคืน = Warehouse/Stock.Delete (D)** (`permission-matrix.md` §3). **★ มีช่องหมายเหตุ (comment) ทั่วไปเพิ่มแยกจากเหตุผลการคืน** — G6. **★ notification: การสร้างใบคืนไม่มี noti event (Stock เห็นผ่าน ledger/list); การ void ใบคืน = event "เอกสารถูกยกเลิก/ปฏิเสธ" (r19 หมวด 1, Read module).**

---

## 1. Purpose
เป็นช่องทางเดียวในการตัดวัตถุดิบเสียออกจากคลังพร้อมเหตุผลตรวจสอบได้ (คืน supplier) — ปิด loop จาก QC ขาเข้าไม่ผ่าน และคงยอด stock ให้ตรงของจริง **ในระดับ (lot, RM) ที่แม่นยำ** (1 lot หลาย RM).

## 2. Screens
| หน้าจอ | บทบาท |
|---|---|
| `return.html` (list) | รายการใบคืน + **★ search: Lot / Supplier / ชื่อ RM / รหัส RM / เลขใบคืน (RET) / ช่วงวันที่ (G2)** + 20/หน้า (G1) |
| `return.html` (create) | เลือก lot → supplier auto → **★ เลือก RM ในล็อต (บังคับ, search dropdown ค้นชื่อ+รหัส)** → จำนวน return → ตัด stock + เหตุผลการคืน · **+ ช่อง comment (หมายเหตุ) + ประวัติการแก้ไข (G6)** |

## 3. Fields
| ฟิลด์ | ชนิด | editable/computed | หมายเหตุ |
|---|---|---|---|
| **เลขใบคืน `RET-{YYYYMM}-{NNNNNN}`** | string | computed | **★ ออกตอน "บันทึกใบคืน" สำเร็จ (G8/NS2 + popup NS3)** · gapless ต่อปี/เดือน · void = เลขเดิม (NS5) · **★ คนละ prefix กับ Route `RT-…`** · เอกสารการค้า |
| Lot | ref lot | editable | เลือก → supplier auto · **1 Lot อาจถือหลาย RM (`goods-receipt.md` §3)** |
| supplier | ref supplier | computed | จาก lot |
| **★ วัตถุดิบ (RM) ที่คืน** | ref RM master | **editable — บังคับ** | **เลือกว่าจะคืน RM ตัวใดใน Lot** · **search-in-dropdown ค้นชื่อ+รหัส (G7)** · ตัวเลือก = เฉพาะ RM ที่มีคงเหลือใน lot (on_hand ของ (lot, RM) > 0) |
| จำนวน return | number + UOM | editable | **ไม่เกินคงเหลือของ RM ที่เลือกในล็อต** (ต่อ (lot, RM)) |
| เหตุผลการคืน (return reason) | text | editable | **บังคับ** — เหตุผลของการตัด stock ที่ไม่มี PO (ฟิลด์เดิม) |
| **comment (หมายเหตุ)** | text | editable | **ช่องเดียว, แก้ในที่ (overwrite), ว่างได้ (optional)** · เก็บประวัติครบ · **แยกจาก "เหตุผลการคืน"** · `comment-convention.md` (G6/CC1–CC7) |
| สถานะ | enum {ร่าง, คืนแล้ว, ปิด, ยกเลิก} | mixed | |

## 4. Statuses / lifecycle (entity-status-map §6)
ร่าง → คืนแล้ว → ปิด / ยกเลิก · **RM + เหตุผลการคืนบังคับ** · trace เสมอ. คืนแล้ว = **ตัด on_hand ของ (lot, RM) ที่เลือก** (ledger `return (−)`, source ผูก Lot + RM + Supplier + **RET**).

### 4b. ★ Comment field (G6 — ตามกติกากลาง)
- ใบคืนมี **ช่องหมายเหตุ (comment) เดียว** แบบ free-text — **แยกจาก "เหตุผลการคืน" (บังคับ)**. comment = บันทึกทั่วไปเพิ่มเติม (optional).
- **แก้ในที่ (overwrite)** · **เก็บประวัติครบทุกครั้ง** ผ่าน field-audit (entity=Return, field=`comment`).
- ดูประวัติได้ inline บน return-detail · การแก้ = activity-log event + โผล่บน trace.

## 5. ★ Create flow (delta — เพิ่ม RM selector)
1. เปิด return-create → **เลือก Lot** → ระบบแสดง **supplier อัตโนมัติ** (จาก lot).
2. **★ เลือกวัตถุดิบ (RM) ในล็อตนั้น (บังคับ)** — **search-in-dropdown ค้นได้ทั้งชื่อและรหัส (G7)**; ตัวเลือกจำกัดเฉพาะ RM ที่ยังมีคงเหลือใน lot (on_hand ของ (lot, RM) > 0).
3. **แก้จำนวน return** — **ไม่เกินคงเหลือของ RM ที่เลือกในล็อตนั้น** (validation §7).
4. กรอก **เหตุผลการคืน (บังคับ)**.
5. (optional) กรอก **หมายเหตุ (comment)** — §4b.
6. บันทึก → **ออกเลขใบคืน `RET-…` (G8/NS2 + popup NS3)** → ตัด **on_hand ของ (lot, RM)** + ledger `return (−)` (source = Lot/RM/Supplier/RET) → Return = คืนแล้ว → **(ไม่มี noti event สำหรับการสร้างใบคืน — Stock เห็นผ่าน ledger/list; void ใบคืนภายหลัง = event "เอกสารถูกยกเลิก/ปฏิเสธ" r19 หมวด 1)** → trace.
> **★ เหตุผลที่ต้องเลือก RM:** เลข Lot แชร์ได้หลาย RM (`goods-receipt.md` §3) → ถ้าไม่เลือก RM ระบบไม่รู้จะหักคงเหลือจากวัตถุดิบตัวใด. การเลือก RM ทำให้การตัด stock + genealogy ถูกต้องราย (lot, RM).

## 6. User Stories (absorbed) + AC สรุป
- **US-RET-01 (Must) — ทำใบคืน + เลือก RM ในล็อต + ตัด stock:** Lot L-TT-PHE-2607 มีหลาย RM; เลือก lot → supplier (SUP-02) auto → **★ เลือก RM (เช่น Phenoxyethanol)** → คงเหลือของ RM ตัวนั้นในล็อต = 20 กก. → แก้จำนวน return 10 กก. + เหตุผลการคืน → บันทึก → **ออกเลขใบคืน `RET-…` + popup** → **ตัด stock 10 กก.**; Return=คืนแล้ว; trace (ผูก Lot+RM+Supplier+RET). **Edge (RM เกินคงเหลือ):** คงเหลือ 8 กก. แต่ระบุ return 10 → เตือน/บล็อก "จำนวนคืนเกินคงเหลือของวัตถุดิบนี้ในล็อต". **Error (ไม่เลือก RM):** → error "ต้องเลือกวัตถุดิบที่จะคืนในล็อตนี้". **Error (เหตุผลว่าง):** → error "ต้องระบุเหตุผลการคืน/ตัด stock".
- **US-RET-02 (Must) — comment + ประวัติ (G6):** ผู้ใช้ (Warehouse/Stock.Update) เพิ่ม/แก้ **comment** บนใบคืน → บันทึก old→new; เปิด "ประวัติการแก้ไข comment"; comment โผล่บน trace. **Edge:** แก้ comment ให้ว่าง → ค่าเดิมยังอยู่ในประวัติ. **Error:** Read อย่างเดียว → แก้ comment ไม่ได้. ยึด `comment-convention.md`.

## 7. Actions & Permissions (D14 · ★ r20 B1)
| ปุ่ม/action | Permission required | Suffix (G9) |
|---|---|---|
| ดูใบคืน / list | Warehouse/Stock.**Read (R)** | (R) |
| **★ สร้างใบคืน (RET) (เลือก RM + ตัด stock)** *(r20 B1: create = C)* | Warehouse/Stock.**Create (C)** + RM + เหตุผลบังคับ | **(C)** |
| **★ ยกเลิก/void ใบคืน (RET)** *(r20 B1: void = D)* | Warehouse/Stock.**Delete (D)** + comment | **(D)** |
| **แก้ comment (หมายเหตุ) ใบคืน (G6)** | Warehouse/Stock.**Update (U)** · ดู/เปิดประวัติ = **Read (R)** | **(U)** |
> **★ r20 B1 (ปอนด์ Gate-1):** สร้างใบคืน = **(C)** และ void ใบคืน = **(D)** — สอดคล้อง document-lifecycle (สร้าง=C/void=D) + `permission-matrix.md` §3. (เดิม stock.md ระบุ Return = Stock.U; r20 pin ให้ตรง B1: create=C, void=D.)

## 8. Validations
- **★ วัตถุดิบ (RM) = บังคับเลือก** — ต้องเป็น RM ที่มีคงเหลือในล็อต (on_hand ของ (lot, RM) > 0).
- เหตุผลการคืน = บังคับ.
- **★ จำนวน return ≤ คงเหลือของ RM ที่เลือกในล็อตนั้น** (ต่อ (lot, RM)).
- Lot ต้อง map supplier ได้ (auto).
- **★ ออกเลข `RET-…` ตอนบันทึกสำเร็จ (G8/NS2) — ร่างที่ไม่บันทึกไม่กินเลข (NS4); void = เลขเดิม (NS5).**
- **comment (หมายเหตุ) = optional** · การแก้ทุกครั้งถูก audit (G6/CC3).

## 9. Pagination / Search
- รายการใบคืน: 20/หน้า (G1) · **★ ค้น Lot / supplier / ชื่อ RM / รหัส RM / เลขใบคืน (RET) / ช่วงวันที่ (G2)** · **RM = search-in-dropdown ค้นชื่อ+รหัส (G7)**.

## 10. Formulas
- on_hand ของ (lot, RM) หลังคืน = `on_hand(lot,RM) − return qty` (ledger `return (−)`, source ผูก Lot+RM+Supplier+**RET**).

## 11. Cross-links
- QC ขาเข้าไม่ผ่าน → Lot ระงับ → คืน → `qc.md` (**Lot QC ไม่ผ่าน = event r19 หมวด 1, Read Stock/QC**). **1 Lot หลาย RM (lot = `{supplier prefix}{YYMM}`) → `goods-receipt.md` §3.** ตัด stock/ledger → `stock.md` (§6 `return (−)`). lot→supplier → `supplier.md`. RM master (ชื่อ/รหัส) → `stock.md` §3b. **เลขใบคืน `RET-…` (G8/NS2, gapless, void-only) → `numbering-on-save.md` §4 · `non-functional.md` D-F5.** **★ สิทธิ์ create=C/void=D → `permission-matrix.md` §3 (r20 B1).** trace + comment audit → `traceability.md` · **comment field → `comment-convention.md` (G6)** · **search-in-dropdown → README §3 (G7)**.

## 12. Module changelog
- **★ NEW (2026-07-29 — ปอนด์ Return module feedback):**
  1. **★ เพิ่ม RM selector (บังคับ) บน return-create** — เพราะ **1 Lot ถือได้หลาย RM**; search-in-dropdown ค้นชื่อ+รหัส (G7). §3/§5/US-RET-01/§7/§10/§11.
  2. **★ list search เพิ่ม Lot / Supplier / ชื่อ RM / รหัส RM** — §2/§9.
  3. ledger `return (−)` source ผูก **Lot + RM + Supplier + เลขใบคืน** — §4/§10.
- **★ NEW (2026-07-29 — ปอนด์เคาะตัวเลือก A, comment cross-cutting):** เพิ่ม **ช่อง comment (หมายเหตุ) + ประวัติการแก้ไข** บนใบคืน (G6) — **แยกจาก "เหตุผลการคืน" (บังคับ)**.
- **★★ UPDATED (2026-07-31 — reconciliation M1, ปอนด์):** **ให้เลขใบคืนมี prefix ของตัวเอง `RET-{YYYYMM}-{NNNNNN}`** — **เลิกใช้ token "RT" แทนใบคืน** (ชนกับ Route `RT-…`). อัปเดตทุกจุด: field เลขใบคืน (§3), list search (§2/§9), ledger source `return (−)` = **RET** (§4/§5/§10), cross-link. ไม่มี "RT" (หมายถึงใบคืน) เหลือค้าง.
- **★ UPDATED (2026-07-31 — Gate-1 review reconciliation r20, ปอนด์):**
  - **(A4 — purge stale C-codes):** ลบ **C18** (กฎอ้างอิง §header + cross-links §11) และ **C13** (§5 create flow) → แทนด้วยข้อความชัด (Lot QC ไม่ผ่าน = event r19 หมวด 1; supplier auto จาก lot) · การสร้างใบคืน = ไม่มี noti event, void ใบคืน = event "เอกสารถูกยกเลิก/ปฏิเสธ" (§5/§summary). ไม่มี C-code เหลือค้าง.
  - **(B1 — permission):** pin **สร้างใบคืน = (C) · void ใบคืน = (D)** (§7 + summary, `permission-matrix.md` §3).
  - **(B4 — DONE):** ก่อนหน้ามี UX note "return.html หัวคอลัมน์/ป้ายเลขใบคืนใช้ RT → เปลี่ยนเป็น RET" — **★ mockup ใช้ "RET" แล้ว → mark note นี้เป็น DONE (ปิด, ไม่มีงานค้าง)**. (ดู §13.)
  - **ใช้ view เดิม (`return.html` render จาก .md).**
- **Absorbed:** functional-spec `return.html` US-RET-01 (3 AC) verbatim ในความหมาย + delta RM selector.
- **คงเดิม:** lot→supplier auto · เหตุผลการคืนบังคับ · ตัด on_hand + ledger · trace.

## 13. ★ UX follow-up — RT→RET (DONE, ปอนด์ Gate-1 r20 2026-07-31)
- **✅ DONE:** `return.html` mockup ใช้ป้าย/หัวคอลัมน์ **"RET"** สำหรับเลขใบคืนแล้ว (ไม่มี "RT" หลงเหลือ) — UX note "RT→RET" ที่เคยค้าง = **ปิด (DONE)**. ไม่มีงาน UX ค้างในโมดูลนี้.
