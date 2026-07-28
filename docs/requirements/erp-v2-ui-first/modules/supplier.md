# Module — Supplier (ผู้ขายวัตถุดิบ)

slug: `erp-v2-ui-first` · per-module canonical · PO · 2026-07-29 · **AUTHORITATIVE SPEC** (absorbs functional-spec `supplier.html` US-SUP-01..03)
Mockups: `mockups/supplier.html`
กฎอ้างอิง: `bom.md` (BOM cost = max active supplier + snapshot) · `goods-receipt.md` (Lot prefix) · deletion-policy (soft-delete/inactive) · README §3

## สรุปภาษาไทย
จัดการ supplier: เพิ่ม/แก้ + ผูกวัตถุดิบรายตัว + **price matrix (supplier × วัตถุดิบ × ราคารับซื้อ ≥0)** + Active/Inactive + Lot prefix ต่อ supplier. ราคา active **feed BOM cost = ราคาสูงสุดของ active supplier**; Inactive → ถูกตัดจากการคิด BOM cost + หายจาก dropdown ซื้อใหม่ (Lot เดิมยังใช้ผลิตต่อได้). **แก้ราคา/สถานะไม่กระทบ PO/BOM เดิมที่ snapshot ราคาไว้แล้ว** (มี trace ราคา). **ไม่มีฟังก์ชันรับเข้าคลังในหน้านี้** (อยู่ที่ `goods-receipt.md`). เลข `SUP-{NN}`. รายการ supplier: filter สถานะ + ค้นชื่อ/รหัส/วัตถุดิบ + sort ชื่อ + empty state.

---

## 1. Purpose
เป็น master ของ supplier + ราคารับซื้อต่อคู่ (supplier×วัตถุดิบ) เพื่อ feed ต้นทุน BOM และควบคุมว่าใครยัง active สำหรับการจัดซื้อ — โดยไม่กระทบเอกสารเดิมที่ snapshot ราคาไว้แล้ว.

## 2. Screens
| หน้าจอ | บทบาท |
|---|---|
| `supplier.html` | รายการ (full-width) + search/filter + create/edit mode + Active/Inactive + price matrix + search วัตถุดิบ |

## 3. Fields
| ฟิลด์ | หน่วย/ชนิด | editable/computed | หมายเหตุ |
|---|---|---|---|
| เลข `SUP-{NN}` | string | computed | |
| ชื่อ supplier | text | editable | |
| Lot prefix | text (เช่น `L-GLY-`) | editable | ใช้ตอน GR gen Lot |
| สถานะ | enum {Active, Inactive} | editable | Inactive = ตัดจาก BOM cost + ซื้อใหม่ |
| price matrix | list {วัตถุดิบ, ราคารับซื้อ ≥0} | editable | 1 วัตถุดิบ N supplier ได้ · แก้ราคามี trace |
> ราคาที่ BOM/PO ดึงไปแล้ว = **snapshot** (มี badge ราคาที่ใช้จริง) · แก้ราคา matrix มีผลกับ**การคำนวณครั้งใหม่**เท่านั้น.

## 4. Statuses / lifecycle
Active / Inactive · **soft-delete แทน hard delete (แนะนำ inactive)**. Inactive: ถูกตัดจากการคิด BOM cost (max active), หายจาก dropdown ซื้อใหม่, แต่ Lot เดิมยังผลิตต่อได้.

## 5. User Stories (absorbed) + AC สรุป
- **US-SUP-01 (Must) — เพิ่ม/แก้ supplier + price matrix:** สร้าง SUP-01 "กลีเซอรีนไทย" (Lot prefix L-GLY-) → ผูก "กลีเซอรีน" 45, "น้ำหอมกุหลาบ" 900 → บันทึก price matrix; ราคานี้ใช้คิด BOM cost (max active). **Edge:** วัตถุดิบหลาย supplier → เก็บหลายรายการ; BOM ใช้ราคาสูงสุดของ active. **Error:** วัตถุดิบซ้ำใน supplier เดียว / ราคาติดลบ → error "วัตถุดิบผูกแล้ว" / "ราคาต้อง ≥ 0".
- **US-SUP-02 (Must) — Active/Inactive:** SUP-03 อโรมา → ตั้ง Inactive → ถูกตัดจาก BOM cost, หายจาก dropdown ซื้อใหม่, Lot เดิมยังใช้ผลิตได้. **Edge:** วัตถุดิบเหลือ supplier เดียวที่ inactive → ไม่มีราคา active → BOM บล็อกจนกรอก override (ดู `bom.md`). **Error:** มองหาฟังก์ชันรับเข้าในหน้านี้ → ไม่มี (ย้ายไป `goods-receipt.md`).
- **US-SUP-03 (Should) — แก้ราคา/snapshot + ค้น/กรองรายการ:** แก้คู่ (กลีเซอรีน×SUP-01) 45→48 → matrix อัปเดต; BOM ที่คิดใหม่ใช้ 48; **trace ราคา 45→48 (ใคร/เมื่อ)**. **Edge:** BOM/PO เดิม snapshot 45 → **ยังแสดง 45** ไม่เปลี่ยน; filter สถานะ=Active → แสดงเฉพาะ Active; ไม่พบ → empty state "ไม่พบ supplier ตามเงื่อนไข". **Error:** ราคาใหม่ติดลบ → error "ราคาต้อง ≥ 0" (0 ได้).

## 6. Actions & Permissions (D14)
| ปุ่ม/action | Permission required |
|---|---|
| ดูรายการ/detail supplier | Supplier.**Read (R)** |
| สร้าง supplier | Supplier.**Create (C)** |
| แก้ข้อมูล/price matrix/สถานะ | Supplier.**Update (U)** |
| soft-delete (แนะนำ inactive) | Supplier.**Delete (D)** |

## 7. Validations
- ราคารับซื้อ ≥ 0 (0 ได้, ติดลบไม่ได้).
- วัตถุดิบเดิมผูกซ้ำใน supplier เดียวไม่ได้.
- แก้ราคา = ใช้กับการคิดครั้งใหม่; ของเดิม snapshot (ไม่ retro).
- ไม่มีฟอร์มรับเข้าคลังในหน้านี้.

## 8. Pagination / Search
- รายการ supplier: 20/หน้า (G1) · filter สถานะ (Active/Inactive/ทั้งหมด) · ค้นชื่อ/รหัส SUP/วัตถุดิบที่ผูก · sort ชื่อ (default) · empty state.

## 9. Formulas
- BOM cost ต่อวัตถุดิบ = **max(ราคารับซื้อของ active supplier ที่ผูกวัตถุดิบนั้น)** — feed `bom.md`.
- ไม่มี active supplier ที่มีราคา → BOM ต้อง override (บล็อกจนกรอก).

## 10. Cross-links
- ราคา active → `bom.md` (cost, snapshot). Lot prefix → `goods-receipt.md`. inactive/soft-delete → deletion-policy. RBAC → `permission-matrix.md`.

## 11. Module changelog
- **Absorbed:** functional-spec `supplier.html` US-SUP-01..03 (9 AC) verbatim ในความหมาย.
- **คงเดิม:** price matrix + max active → BOM cost · snapshot ไม่ retro · Inactive ตัดจากการคิด/ซื้อใหม่ · ไม่มีรับเข้าในหน้านี้.
