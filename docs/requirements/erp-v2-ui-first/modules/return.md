# Module — Return (คืนวัตถุดิบให้ Supplier)

slug: `erp-v2-ui-first` · per-module canonical · PO · 2026-07-29 · **AUTHORITATIVE SPEC** (absorbs functional-spec `return.html` US-RET-01)
Mockups: `mockups/return.html`
กฎอ้างอิง: entity-status-map §6 (return journey) · `qc.md` (Lot ไม่ผ่าน→ระงับ→คืน, C18) · `stock.md` (ตัด on_hand + ledger `return (−)`) · `supplier.md` (lot→supplier lookup) · **`comment-convention.md` (G6/CC1–CC7 — comment field)** · README §3

## สรุปภาษาไทย
ทำใบคืนวัตถุดิบให้ supplier เมื่อรับของมาแล้วตรวจเจอเสียหาย (หรือ QC ขาเข้าไม่ผ่าน → Lot ระงับ). ขั้นตอน: **เลือก Lot → ระบบแสดง supplier อัตโนมัติ → แก้จำนวน return (ไม่เกินคงเหลือใน lot) → ตัด stock + เหตุผลการคืนบังคับ** (เป็นเหตุผลของการ adjust stock ที่ไม่มี PO). ตัด on_hand ของ lot นั้น + ledger `return (−)` (source = Lot/Supplier/RT) + noti Stock + trace. สถานะ: ร่าง → คืนแล้ว → ปิด / ยกเลิก. **★ มีช่องหมายเหตุ (comment) ทั่วไปเพิ่มแยกจากเหตุผลการคืน** — แก้ในที่ + เก็บประวัติครบ ตามกติกากลาง G6.

---

## 1. Purpose
เป็นช่องทางเดียวในการตัดวัตถุดิบเสียออกจากคลังพร้อมเหตุผลตรวจสอบได้ (คืน supplier) — ปิด loop จาก QC ขาเข้าไม่ผ่าน และคงยอด stock ให้ตรงของจริง.

## 2. Screens
| หน้าจอ | บทบาท |
|---|---|
| `return.html` | เลือก lot → supplier auto → จำนวน return → ตัด stock + เหตุผลการคืน · **+ ช่อง comment (หมายเหตุ) + ประวัติการแก้ไข (G6)** |

## 3. Fields
| ฟิลด์ | ชนิด | editable/computed | หมายเหตุ |
|---|---|---|---|
| เลขใบคืน (RT) | string | computed | เอกสารการค้า |
| Lot | ref lot | editable | เลือก → supplier auto |
| supplier | ref supplier | computed | จาก lot |
| จำนวน return | number + UOM | editable | **ไม่เกินคงเหลือใน lot** |
| เหตุผลการคืน (return reason) | text | editable | **บังคับ** — เหตุผลของการตัด stock ที่ไม่มี PO (ฟิลด์เดิม) |
| **comment (หมายเหตุ)** | text | editable | **ช่องเดียว, แก้ในที่ (overwrite), ว่างได้ (optional)** · เก็บประวัติการแก้ครบ (ใคร/เมื่อ/เดิม→ใหม่) ผ่าน field-audit เดิม · **แยกจาก "เหตุผลการคืน" ด้านบน** · ตามกติกากลาง **`comment-convention.md` (G6/CC1–CC7)** |
| สถานะ | enum {ร่าง, คืนแล้ว, ปิด, ยกเลิก} | mixed | |

## 4. Statuses / lifecycle (entity-status-map §6)
ร่าง → คืนแล้ว → ปิด / ยกเลิก · เหตุผลการคืนบังคับ · trace เสมอ. คืนแล้ว = ตัด on_hand ของ lot (ledger `return (−)`).

### 4b. ★ Comment field (G6 — ตามกติกากลาง)
- ใบคืนมี **ช่องหมายเหตุ (comment) เดียว** แบบ free-text — **แยกจาก "เหตุผลการคืน" (บังคับ)** ที่ใช้อธิบายเหตุตัด stock. comment = บันทึกทั่วไปเพิ่มเติม (optional).
- **แก้ในที่ (overwrite)** เห็นค่าปัจจุบันค่าเดียว · **เก็บประวัติครบทุกครั้ง** (ใคร/เมื่อ/ค่าเดิม→ค่าใหม่) ผ่าน field-audit เดิม (entity=Return, field=`comment`).
- ดูประวัติได้ inline บน return-detail (**"ประวัติการแก้ไข comment"** popover/timeline, 20/หน้า G1) · ค่าปัจจุบันแสดงเด่นบน detail · การแก้ = activity-log event + โผล่บน trace.
- รายละเอียดกติกายึด `comment-convention.md` (CC1–CC7) — module นี้ไม่ทำสำเนากฎ.

## 5. User Stories (absorbed) + AC สรุป
- **US-RET-01 (Must) — ทำใบคืน + ตัด stock:** Lot L-TT-PHE-2607 เสียหาย → เลือก lot → ระบบแสดง supplier (SUP-02) auto → แก้จำนวน return 10 กก. + เหตุผลการคืน → ตัด stock 10 กก.; Return=คืนแล้ว; noti Stock; trace (C-Return). **Edge:** lot คงเหลือ 8 กก. แต่ระบุ return 10 → เตือน/บล็อก "จำนวนคืนเกินคงเหลือใน lot" (คืนได้ไม่เกินคงเหลือ). **Error:** เหตุผลการคืนว่าง → error "ต้องระบุเหตุผลการคืน/ตัด stock" (บังคับ).
- **US-RET-02 (Must) — comment + ประวัติ (G6):** ผู้ใช้ (Warehouse/Stock.Update) เพิ่ม/แก้ **comment** บนใบคืน → บันทึก old→new + ใคร/เมื่อ ผ่าน field-audit; เปิด "ประวัติการแก้ไข comment" เห็นทุกครั้งที่แก้; comment โผล่บน trace ของใบคืน. **Edge:** แก้ comment ให้ว่าง → ค่าเดิมยังอยู่ในประวัติ (ไม่ลบ). **Error:** ผู้ใช้สิทธิ์ Read อย่างเดียว → แก้ comment ไม่ได้ (ปุ่มแก้ซ่อน/บล็อก). ยึด `comment-convention.md`.

## 6. Actions & Permissions (D14)
| ปุ่ม/action | Permission required |
|---|---|
| ดูใบคืน / list | Warehouse/Stock.**Read (R)** |
| ทำใบคืน (ตัด stock) | Warehouse/Stock.**Update (U)** + เหตุผลบังคับ |
| ยกเลิกใบคืน | Warehouse/Stock.**Update/Delete** + comment |
| **แก้ comment (หมายเหตุ) ใบคืน (G6)** | Warehouse/Stock.**Update (U)** · ดู/เปิดประวัติ = **Read (R)** |

## 7. Validations
- เหตุผลการคืน = บังคับ.
- จำนวน return ≤ คงเหลือใน lot (ห้ามเกิน).
- Lot ต้อง map supplier ได้ (auto).
- **comment (หมายเหตุ) = optional** (ว่างได้) · การแก้ทุกครั้งถูก audit (G6/CC3) · แก้ได้ทุกสถานะของใบคืน (CC default; comment ไม่กระทบ business state).

## 8. Pagination / Search
- รายการใบคืน: 20/หน้า (G1) · ค้นเลข RT/Lot/supplier/ช่วงวันที่ (G2).

## 9. Formulas
- on_hand ของ lot หลังคืน = `on_hand − return qty` (ledger `return (−)`).

## 10. Cross-links
- QC ขาเข้าไม่ผ่าน → Lot ระงับ → คืน (C18) → `qc.md`. ตัด stock/ledger → `stock.md` (§6 `return (−)`). lot→supplier → `supplier.md`. trace + comment audit → `traceability.md` · **comment field → `comment-convention.md` (G6)**.

## 11. Module changelog
- **★ NEW (2026-07-29 — ปอนด์เคาะตัวเลือก A, comment cross-cutting):** เพิ่ม **ช่อง comment (หมายเหตุ) + ประวัติการแก้ไข** บนใบคืน ตามกติกากลาง G6/`comment-convention.md` — **แยกจาก "เหตุผลการคืน" (บังคับ)** เดิม. เพิ่ม field (§3), §4b, US-RET-02 (§5), permission row (§6), validation (§7). Return เข้า object list ของ comment-convention (10→12).
- **Absorbed:** functional-spec `return.html` US-RET-01 (3 AC) verbatim ในความหมาย.
- **คงเดิม:** lot→supplier auto · เหตุผลการคืนบังคับ · ไม่เกินคงเหลือ · ตัด on_hand + ledger.
