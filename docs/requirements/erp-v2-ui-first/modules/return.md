# Module — Return (คืนวัตถุดิบให้ Supplier)

slug: `erp-v2-ui-first` · per-module canonical · PO · 2026-07-29 · **AUTHORITATIVE SPEC** (absorbs functional-spec `return.html` US-RET-01)
Mockups: `mockups/return.html`
กฎอ้างอิง: entity-status-map §6 (return journey) · `qc.md` (Lot ไม่ผ่าน→ระงับ→คืน, C18) · `stock.md` (ตัด on_hand + ledger `return (−)`) · `supplier.md` (lot→supplier lookup) · `goods-receipt.md` §3 (Lot = `{supplier prefix}{YYMM}` → **1 Lot ถือได้หลาย RM**) · **`comment-convention.md` (G6/CC1–CC7 — comment field)** · **README §3 (G7 search-in-dropdown)** · README §3

## สรุปภาษาไทย
ทำใบคืนวัตถุดิบให้ supplier เมื่อรับของมาแล้วตรวจเจอเสียหาย (หรือ QC ขาเข้าไม่ผ่าน → Lot ระงับ). **★ เพราะ 1 Lot ถือได้หลายวัตถุดิบ (RM)** — เลข Lot = `{supplier prefix}{YYMM}` แชร์กันหลาย RM ที่รับจาก supplier เดียวกันในเดือนเดียวกัน (`goods-receipt.md` §3) — ตอนสร้างใบคืน **ต้องเลือกทั้ง Lot และ RM ตัวที่จะคืน**. ขั้นตอน: **เลือก Lot → ระบบแสดง supplier อัตโนมัติ → ★ เลือก RM ในล็อตนั้น (บังคับ · search-in-dropdown ค้นชื่อ+รหัส RM · G7) → แก้จำนวน return (ไม่เกินคงเหลือของ RM ตัวนั้นในล็อต) → ตัด stock + เหตุผลการคืนบังคับ** (เป็นเหตุผลของการ adjust stock ที่ไม่มี PO). ตัด on_hand ของ (lot, RM) นั้น + ledger `return (−)` (source = Lot/RM/Supplier/RT) + noti Stock + trace. **★ list ค้นได้ด้วย Lot / Supplier / ชื่อ RM / รหัส RM (+ เลข RT / ช่วงวันที่)**. สถานะ: ร่าง → คืนแล้ว → ปิด / ยกเลิก. **★ มีช่องหมายเหตุ (comment) ทั่วไปเพิ่มแยกจากเหตุผลการคืน** — แก้ในที่ + เก็บประวัติครบ ตามกติกากลาง G6.

---

## 1. Purpose
เป็นช่องทางเดียวในการตัดวัตถุดิบเสียออกจากคลังพร้อมเหตุผลตรวจสอบได้ (คืน supplier) — ปิด loop จาก QC ขาเข้าไม่ผ่าน และคงยอด stock ให้ตรงของจริง **ในระดับ (lot, RM) ที่แม่นยำ** (1 lot หลาย RM).

## 2. Screens
| หน้าจอ | บทบาท |
|---|---|
| `return.html` (list) | รายการใบคืน + **★ search: Lot / Supplier / ชื่อ RM / รหัส RM / เลข RT / ช่วงวันที่ (G2)** + 20/หน้า (G1) |
| `return.html` (create) | เลือก lot → supplier auto → **★ เลือก RM ในล็อต (บังคับ, search dropdown ค้นชื่อ+รหัส)** → จำนวน return → ตัด stock + เหตุผลการคืน · **+ ช่อง comment (หมายเหตุ) + ประวัติการแก้ไข (G6)** |

## 3. Fields
| ฟิลด์ | ชนิด | editable/computed | หมายเหตุ |
|---|---|---|---|
| เลขใบคืน (RT) | string | computed | เอกสารการค้า |
| Lot | ref lot | editable | เลือก → supplier auto · **1 Lot อาจถือหลาย RM (`goods-receipt.md` §3)** |
| supplier | ref supplier | computed | จาก lot |
| **★ วัตถุดิบ (RM) ที่คืน** | ref RM master | **editable — บังคับ** | **เลือกว่าจะคืน RM ตัวใดใน Lot ที่เลือก** · **search-in-dropdown ค้นได้ทั้งชื่อและรหัส RM (G7)** · ตัวเลือก = เฉพาะ RM ที่มีคงเหลือใน lot นั้น (on_hand ของ (lot, RM) > 0) · จำนวนคืนหักจากส่วนของ RM ตัวนี้ในล็อต |
| จำนวน return | number + UOM | editable | **ไม่เกินคงเหลือของ RM ที่เลือกในล็อต** (ต่อ (lot, RM) ไม่ใช่ทั้ง lot) |
| เหตุผลการคืน (return reason) | text | editable | **บังคับ** — เหตุผลของการตัด stock ที่ไม่มี PO (ฟิลด์เดิม) |
| **comment (หมายเหตุ)** | text | editable | **ช่องเดียว, แก้ในที่ (overwrite), ว่างได้ (optional)** · เก็บประวัติการแก้ครบ (ใคร/เมื่อ/เดิม→ใหม่) ผ่าน field-audit เดิม · **แยกจาก "เหตุผลการคืน" ด้านบน** · ตามกติกากลาง **`comment-convention.md` (G6/CC1–CC7)** |
| สถานะ | enum {ร่าง, คืนแล้ว, ปิด, ยกเลิก} | mixed | |

## 4. Statuses / lifecycle (entity-status-map §6)
ร่าง → คืนแล้ว → ปิด / ยกเลิก · **RM + เหตุผลการคืนบังคับ** · trace เสมอ. คืนแล้ว = **ตัด on_hand ของ (lot, RM) ที่เลือก** (ledger `return (−)`, source ผูก Lot + RM + Supplier).

### 4b. ★ Comment field (G6 — ตามกติกากลาง)
- ใบคืนมี **ช่องหมายเหตุ (comment) เดียว** แบบ free-text — **แยกจาก "เหตุผลการคืน" (บังคับ)** ที่ใช้อธิบายเหตุตัด stock. comment = บันทึกทั่วไปเพิ่มเติม (optional).
- **แก้ในที่ (overwrite)** เห็นค่าปัจจุบันค่าเดียว · **เก็บประวัติครบทุกครั้ง** (ใคร/เมื่อ/ค่าเดิม→ค่าใหม่) ผ่าน field-audit เดิม (entity=Return, field=`comment`).
- ดูประวัติได้ inline บน return-detail (**"ประวัติการแก้ไข comment"** popover/timeline, 20/หน้า G1) · ค่าปัจจุบันแสดงเด่นบน detail · การแก้ = activity-log event + โผล่บน trace.
- รายละเอียดกติกายึด `comment-convention.md` (CC1–CC7) — module นี้ไม่ทำสำเนากฎ.

## 5. ★ Create flow (delta — เพิ่ม RM selector)
1. เปิด return-create → **เลือก Lot** → ระบบแสดง **supplier อัตโนมัติ** (จาก lot, C13).
2. **★ เลือกวัตถุดิบ (RM) ในล็อตนั้น (บังคับ)** — **search-in-dropdown ค้นได้ทั้งชื่อและรหัส (G7)**; ตัวเลือกจำกัดเฉพาะ RM ที่ยังมีคงเหลือใน lot ที่เลือก (on_hand ของ (lot, RM) > 0). ระบบแสดงคงเหลือของ RM ตัวนั้นในล็อตเป็นเพดานจำนวนคืน.
3. **แก้จำนวน return** — **ไม่เกินคงเหลือของ RM ที่เลือกในล็อตนั้น** (validation §7).
4. กรอก **เหตุผลการคืน (บังคับ)**.
5. (optional) กรอก **หมายเหตุ (comment)** — §4b.
6. บันทึก → ตัด **on_hand ของ (lot, RM)** + ledger `return (−)` (source = Lot/RM/Supplier/RT) → Return = คืนแล้ว → noti Stock → trace.
> **★ เหตุผลที่ต้องเลือก RM:** เลข Lot (`{supplier prefix}{YYMM}`) แชร์ได้หลาย RM (`goods-receipt.md` §3) → ถ้าไม่เลือก RM ระบบไม่รู้จะหักคงเหลือจากวัตถุดิบตัวใด. การเลือก RM ทำให้การตัด stock + genealogy ถูกต้องราย (lot, RM).

## 6. User Stories (absorbed) + AC สรุป
- **US-RET-01 (Must) — ทำใบคืน + เลือก RM ในล็อต + ตัด stock:** Lot L-TT-PHE-2607 มีหลาย RM; เลือก lot → supplier (SUP-02) auto → **★ เลือก RM (เช่น Phenoxyethanol · ค้นชื่อ/รหัสใน dropdown)** → คงเหลือของ RM ตัวนั้นในล็อต = 20 กก. → แก้จำนวน return 10 กก. + เหตุผลการคืน → **ตัด stock 10 กก. จากส่วนของ RM ตัวนั้นในล็อต**; Return=คืนแล้ว; noti Stock; trace (C-Return ผูก Lot+RM+Supplier). **Edge (RM เกินคงเหลือ):** คงเหลือ RM ตัวที่เลือกในล็อต 8 กก. แต่ระบุ return 10 → เตือน/บล็อก "จำนวนคืนเกินคงเหลือของวัตถุดิบนี้ในล็อต" (คืนได้ไม่เกินคงเหลือของ (lot, RM)). **Error (ไม่เลือก RM):** ไม่เลือกวัตถุดิบ → error "ต้องเลือกวัตถุดิบที่จะคืนในล็อตนี้" (บังคับ). **Error (เหตุผลว่าง):** เหตุผลการคืนว่าง → error "ต้องระบุเหตุผลการคืน/ตัด stock" (บังคับ).
- **US-RET-02 (Must) — comment + ประวัติ (G6):** ผู้ใช้ (Warehouse/Stock.Update) เพิ่ม/แก้ **comment** บนใบคืน → บันทึก old→new + ใคร/เมื่อ ผ่าน field-audit; เปิด "ประวัติการแก้ไข comment" เห็นทุกครั้งที่แก้; comment โผล่บน trace ของใบคืน. **Edge:** แก้ comment ให้ว่าง → ค่าเดิมยังอยู่ในประวัติ (ไม่ลบ). **Error:** ผู้ใช้สิทธิ์ Read อย่างเดียว → แก้ comment ไม่ได้ (ปุ่มแก้ซ่อน/บล็อก). ยึด `comment-convention.md`.

## 7. Actions & Permissions (D14)
| ปุ่ม/action | Permission required |
|---|---|
| ดูใบคืน / list | Warehouse/Stock.**Read (R)** |
| ทำใบคืน (เลือก RM + ตัด stock) | Warehouse/Stock.**Update (U)** + RM + เหตุผลบังคับ |
| ยกเลิกใบคืน | Warehouse/Stock.**Update/Delete** + comment |
| **แก้ comment (หมายเหตุ) ใบคืน (G6)** | Warehouse/Stock.**Update (U)** · ดู/เปิดประวัติ = **Read (R)** |

## 8. Validations
- **★ วัตถุดิบ (RM) = บังคับเลือก** — ต้องเป็น RM ที่มีคงเหลือในล็อตที่เลือก (on_hand ของ (lot, RM) > 0).
- เหตุผลการคืน = บังคับ.
- **★ จำนวน return ≤ คงเหลือของ RM ที่เลือกในล็อตนั้น** (ต่อ (lot, RM) — ห้ามเกิน; ไม่ใช่คงเหลือรวมทั้ง lot).
- Lot ต้อง map supplier ได้ (auto).
- **comment (หมายเหตุ) = optional** (ว่างได้) · การแก้ทุกครั้งถูก audit (G6/CC3) · แก้ได้ทุกสถานะของใบคืน (CC default; comment ไม่กระทบ business state).

## 9. Pagination / Search
- รายการใบคืน: 20/หน้า (G1) · **★ ค้น Lot / supplier / ชื่อ RM / รหัส RM / เลข RT / ช่วงวันที่ (G2)** · **RM = search-in-dropdown ค้นชื่อ+รหัส (G7)**.

## 10. Formulas
- on_hand ของ (lot, RM) หลังคืน = `on_hand(lot,RM) − return qty` (ledger `return (−)`, source ผูก Lot+RM+Supplier).

## 11. Cross-links
- QC ขาเข้าไม่ผ่าน → Lot ระงับ → คืน (C18) → `qc.md`. **1 Lot หลาย RM (lot = `{supplier prefix}{YYMM}`) → `goods-receipt.md` §3.** ตัด stock/ledger → `stock.md` (§6 `return (−)`). lot→supplier → `supplier.md`. RM master (ชื่อ/รหัส) → `stock.md` §3b. trace + comment audit → `traceability.md` · **comment field → `comment-convention.md` (G6)** · **search-in-dropdown → README §3 (G7)**.

## 12. Module changelog
- **★ NEW (2026-07-29 — ปอนด์ Return module feedback):**
  1. **★ เพิ่ม RM selector (บังคับ) บน return-create** — เพราะ **1 Lot ถือได้หลาย RM** (lot = `{supplier prefix}{YYMM}`, `goods-receipt.md` §3) → ผู้ใช้ต้องเลือกว่าคืน RM ตัวใดในล็อต; **search-in-dropdown ค้นชื่อ+รหัส (G7)**; จำนวนคืนหักจากคงเหลือของ (lot, RM) ตัวนั้น. §3 field, §5 create flow, US-RET-01, §7 validation (RM บังคับ + qty ≤ คงเหลือ (lot,RM)), §10 formula, §11 cross-links.
  2. **★ list search เพิ่ม Lot / Supplier / ชื่อ RM / รหัส RM** (คง RT/date-range เดิม) — §2/§9.
  3. ledger `return (−)` source ผูก **Lot + RM + Supplier + RT** (เดิม Lot/Supplier/RT) — §4/§10.
- **★ NEW (2026-07-29 — ปอนด์เคาะตัวเลือก A, comment cross-cutting):** เพิ่ม **ช่อง comment (หมายเหตุ) + ประวัติการแก้ไข** บนใบคืน ตามกติกากลาง G6/`comment-convention.md` — **แยกจาก "เหตุผลการคืน" (บังคับ)** เดิม. เพิ่ม field (§3), §4b, US-RET-02 (§6), permission row (§7), validation (§8). Return เข้า object list ของ comment-convention (10→12).
- **Absorbed:** functional-spec `return.html` US-RET-01 (3 AC) verbatim ในความหมาย + delta RM selector.
- **คงเดิม:** lot→supplier auto · เหตุผลการคืนบังคับ · ตัด on_hand + ledger · trace.
