# Module — Return (คืนวัตถุดิบให้ Supplier)

slug: `erp-v2-ui-first` · per-module canonical · PO · 2026-07-29 · **AUTHORITATIVE SPEC** (absorbs functional-spec `return.html` US-RET-01)
Mockups: `mockups/return.html`
กฎอ้างอิง: entity-status-map §6 (return journey) · `qc.md` (Lot ไม่ผ่าน→ระงับ→คืน, C18) · `stock.md` (ตัด on_hand + ledger `return (−)`) · `supplier.md` (lot→supplier lookup) · README §3

## สรุปภาษาไทย
ทำใบคืนวัตถุดิบให้ supplier เมื่อรับของมาแล้วตรวจเจอเสียหาย (หรือ QC ขาเข้าไม่ผ่าน → Lot ระงับ). ขั้นตอน: **เลือก Lot → ระบบแสดง supplier อัตโนมัติ → แก้จำนวน return (ไม่เกินคงเหลือใน lot) → ตัด stock + comment บังคับ** (เป็นเหตุผลของการ adjust stock ที่ไม่มี PO). ตัด on_hand ของ lot นั้น + ledger `return (−)` (source = Lot/Supplier/RT) + noti Stock + trace. สถานะ: ร่าง → คืนแล้ว → ปิด / ยกเลิก.

---

## 1. Purpose
เป็นช่องทางเดียวในการตัดวัตถุดิบเสียออกจากคลังพร้อมเหตุผลตรวจสอบได้ (คืน supplier) — ปิด loop จาก QC ขาเข้าไม่ผ่าน และคงยอด stock ให้ตรงของจริง.

## 2. Screens
| หน้าจอ | บทบาท |
|---|---|
| `return.html` | เลือก lot → supplier auto → จำนวน return → ตัด stock + comment |

## 3. Fields
| ฟิลด์ | ชนิด | editable/computed | หมายเหตุ |
|---|---|---|---|
| เลขใบคืน (RT) | string | computed | เอกสารการค้า |
| Lot | ref lot | editable | เลือก → supplier auto |
| supplier | ref supplier | computed | จาก lot |
| จำนวน return | number + UOM | editable | **ไม่เกินคงเหลือใน lot** |
| comment/เหตุผล | text | editable | **บังคับ** |
| สถานะ | enum {ร่าง, คืนแล้ว, ปิด, ยกเลิก} | mixed | |

## 4. Statuses / lifecycle (entity-status-map §6)
ร่าง → คืนแล้ว → ปิด / ยกเลิก · comment บังคับ · trace เสมอ. คืนแล้ว = ตัด on_hand ของ lot (ledger `return (−)`).

## 5. User Stories (absorbed) + AC สรุป
- **US-RET-01 (Must) — ทำใบคืน + ตัด stock:** Lot L-TT-PHE-2607 เสียหาย → เลือก lot → ระบบแสดง supplier (SUP-02) auto → แก้จำนวน return 10 กก. + comment → ตัด stock 10 กก.; Return=คืนแล้ว; noti Stock; trace (C-Return). **Edge:** lot คงเหลือ 8 กก. แต่ระบุ return 10 → เตือน/บล็อก "จำนวนคืนเกินคงเหลือใน lot" (คืนได้ไม่เกินคงเหลือ). **Error:** comment ว่าง → error "ต้องระบุเหตุผลการคืน/ตัด stock" (บังคับ).

## 6. Actions & Permissions (D14)
| ปุ่ม/action | Permission required |
|---|---|
| ดูใบคืน / list | Warehouse/Stock.**Read (R)** |
| ทำใบคืน (ตัด stock) | Warehouse/Stock.**Update (U)** + เหตุผลบังคับ |
| ยกเลิกใบคืน | Warehouse/Stock.**Update/Delete** + comment |

## 7. Validations
- comment/เหตุผล = บังคับ.
- จำนวน return ≤ คงเหลือใน lot (ห้ามเกิน).
- Lot ต้อง map supplier ได้ (auto).

## 8. Pagination / Search
- รายการใบคืน: 20/หน้า (G1) · ค้นเลข RT/Lot/supplier/ช่วงวันที่ (G2).

## 9. Formulas
- on_hand ของ lot หลังคืน = `on_hand − return qty` (ledger `return (−)`).

## 10. Cross-links
- QC ขาเข้าไม่ผ่าน → Lot ระงับ → คืน (C18) → `qc.md`. ตัด stock/ledger → `stock.md` (§6 `return (−)`). lot→supplier → `supplier.md`. trace → `traceability.md`.

## 11. Module changelog
- **Absorbed:** functional-spec `return.html` US-RET-01 (3 AC) verbatim ในความหมาย.
- **คงเดิม:** lot→supplier auto · comment บังคับ · ไม่เกินคงเหลือ · ตัด on_hand + ledger.
