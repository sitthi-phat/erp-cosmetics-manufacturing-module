# Module — Supplier (ผู้ขายวัตถุดิบ)

slug: `erp-v2-ui-first` · per-module canonical · PO · 2026-07-29 · **AUTHORITATIVE SPEC** (absorbs functional-spec `supplier.html` US-SUP-01..03)
Mockups: `mockups/supplier.html`
กฎอ้างอิง: `bom.md` (BOM cost = max active supplier = default ราคาซื้อ ที่ override ได้) · `goods-receipt.md` (Lot prefix) · deletion-policy (soft-delete/inactive) · README §3 (**G7 search-in-dropdown ค้นชื่อ+รหัส**) · `stock.md` §3b (RM master, รหัส user-entered-locked) · `traceability.md`/`non-functional.md` (audit)

## สรุปภาษาไทย
จัดการ supplier: เพิ่ม/แก้ + ผูกวัตถุดิบรายตัว + **price matrix (supplier × วัตถุดิบ × ราคารับซื้อ ≥0)** + Active/Inactive + Lot prefix ต่อ supplier. **★ การเลือกวัตถุดิบใน price matrix = search-in-dropdown ค้นได้ทั้งชื่อและรหัส (G7)** (reuse pattern เดียวกับ Stock). ราคา active **feed BOM cost = ราคาสูงสุดของ active supplier** (เป็น **ค่า default ของ "ราคาซื้อ" ใน BOM ที่ผู้ใช้ override ได้** — `bom.md` §5b); Inactive → ถูกตัดจากการคิด default นี้ + หายจาก dropdown ซื้อใหม่ (Lot เดิมยังใช้ผลิตต่อได้). **แก้ราคา/สถานะไม่กระทบ PO/BOM เดิมที่ snapshot ราคาไว้แล้ว** (มี trace ราคา). **★ ทุกการเปลี่ยนแปลง supplier (create/edit, active↔inactive, และการแก้ price-matrix) ถูก audit-logged + ปรากฏบน trace** (ใคร/เมื่อ/เดิม→ใหม่). **ไม่มีฟังก์ชันรับเข้าคลังในหน้านี้** (อยู่ที่ `goods-receipt.md`). เลข `SUP-{NN}`. รายการ supplier: filter สถานะ + ค้นชื่อ/รหัส/วัตถุดิบ + sort ชื่อ + empty state.

---

## 1. Purpose
เป็น master ของ supplier + ราคารับซื้อต่อคู่ (supplier×วัตถุดิบ) เพื่อ feed ต้นทุน BOM (เป็นค่า default ที่ override ได้) และควบคุมว่าใครยัง active สำหรับการจัดซื้อ — โดยไม่กระทบเอกสารเดิมที่ snapshot ราคาไว้แล้ว.

## 2. Screens
| หน้าจอ | บทบาท |
|---|---|
| `supplier.html` | รายการ (full-width) + search/filter + create/edit mode + Active/Inactive + price matrix + **search วัตถุดิบแบบ dropdown ค้นชื่อ+รหัส (G7)** |

## 3. Fields
| ฟิลด์ | หน่วย/ชนิด | editable/computed | หมายเหตุ |
|---|---|---|---|
| เลข `SUP-{NN}` | string | computed | |
| ชื่อ supplier | text | editable | |
| Lot prefix | text (เช่น `L-GLY-`) | editable | ใช้ตอน GR gen Lot |
| สถานะ | enum {Active, Inactive} | editable | Inactive = ตัดจาก default BOM cost + ซื้อใหม่ · **การสลับสถานะถูก audit** |
| price matrix | list {**วัตถุดิบ (เลือกผ่าน search dropdown ค้นชื่อ+รหัส — G7)**, ราคารับซื้อ ≥0} | editable | 1 วัตถุดิบ N supplier ได้ · **แก้ราคา/เพิ่ม/ลบ คู่ มี audit + trace** |
> ราคาที่ BOM/PO ดึงไปแล้ว = **snapshot** (มี badge ราคาที่ใช้จริง) · แก้ราคา matrix มีผลกับ **ค่า default ของการคำนวณครั้งใหม่** เท่านั้น (ผู้ใช้ยัง override ราคาซื้อใน BOM ได้ — `bom.md` §5b).

## 4. Statuses / lifecycle
Active / Inactive · **soft-delete แทน hard delete (แนะนำ inactive)**. Inactive: ถูกตัดจากการคิด default BOM cost (max active), หายจาก dropdown ซื้อใหม่, แต่ Lot เดิมยังผลิตต่อได้. **การเปลี่ยนสถานะ = audit event (ใคร/เมื่อ/เหตุผล — field-audit).**

## 5. User Stories (absorbed) + AC สรุป
- **US-SUP-01 (Must) — เพิ่ม/แก้ supplier + price matrix:** สร้าง SUP-01 "กลีเซอรีนไทย" (Lot prefix L-GLY-) → **เลือกวัตถุดิบผ่าน search dropdown (ค้น "กลีเซอรีน" หรือรหัส RM ก็ได้ — G7)** → ผูก 45, "น้ำหอมกุหลาบ" 900 → บันทึก price matrix; ราคานี้ = **default ของราคาซื้อใน BOM (override ได้)**. **Edge:** วัตถุดิบหลาย supplier → เก็บหลายรายการ; BOM default = ราคาสูงสุดของ active. **Error:** วัตถุดิบซ้ำใน supplier เดียว / ราคาติดลบ → error "วัตถุดิบผูกแล้ว" / "ราคาต้อง ≥ 0". **Audit:** create supplier + ผูกคู่ราคา = audit event.
- **US-SUP-02 (Must) — Active/Inactive:** SUP-03 อโรมา → ตั้ง Inactive → ถูกตัดจาก default BOM cost, หายจาก dropdown ซื้อใหม่, Lot เดิมยังใช้ผลิตได้; **การสลับ Active↔Inactive ถูก audit + trace**. **Edge:** วัตถุดิบเหลือ supplier เดียวที่ inactive → ไม่มี default active → **BOM ไม่บล็อก** — ผู้ใช้กรอกราคาซื้อเองได้โดยตรง (`bom.md` §5b, เปลี่ยนจากเดิมที่บล็อก). **Error:** มองหาฟังก์ชันรับเข้าในหน้านี้ → ไม่มี (ย้ายไป `goods-receipt.md`).
- **US-SUP-03 (Should) — แก้ราคา/snapshot + ค้น/กรองรายการ:** แก้คู่ (กลีเซอรีน×SUP-01) 45→48 → matrix อัปเดต; BOM ที่คิดใหม่ใช้ 48 เป็น default; **trace ราคา 45→48 (ใคร/เมื่อ) — audit field-level**. **Edge:** BOM/PO เดิม snapshot 45 → **ยังแสดง 45** ไม่เปลี่ยน; filter สถานะ=Active → แสดงเฉพาะ Active; ไม่พบ → empty state "ไม่พบ supplier ตามเงื่อนไข". **Error:** ราคาใหม่ติดลบ → error "ราคาต้อง ≥ 0" (0 ได้).

## 6. Actions & Permissions (D14)
| ปุ่ม/action | Permission required |
|---|---|
| ดูรายการ/detail supplier | Supplier.**Read (R)** |
| สร้าง supplier | Supplier.**Create (C)** (audit create) |
| แก้ข้อมูล/price matrix/สถานะ | Supplier.**Update (U)** (audit ทุกฟิลด์ที่แก้ + price-matrix + active/inactive) |
| soft-delete (แนะนำ inactive) | Supplier.**Delete (D)** (audit) |

## 7. Validations
- ราคารับซื้อ ≥ 0 (0 ได้, ติดลบไม่ได้).
- วัตถุดิบเดิมผูกซ้ำใน supplier เดียวไม่ได้.
- แก้ราคา = ใช้เป็น default การคิดครั้งใหม่; ของเดิม snapshot (ไม่ retro).
- **การเลือกวัตถุดิบใน price matrix = search dropdown ค้นชื่อ+รหัส** (G7) — เลือกได้เฉพาะ RM master ที่ยังไม่ soft-deleted.
- ไม่มีฟอร์มรับเข้าคลังในหน้านี้.

## 8. Pagination / Search
- รายการ supplier: 20/หน้า (G1) · filter สถานะ (Active/Inactive/ทั้งหมด) · ค้นชื่อ/รหัส SUP/วัตถุดิบที่ผูก · sort ชื่อ (default) · empty state.

## 9. Formulas
- **default ราคาซื้อ (BOM cost) ต่อวัตถุดิบ = max(ราคารับซื้อของ active supplier ที่ผูกวัตถุดิบนั้น)** — feed เป็น **ค่าเริ่มต้น** ของ "ราคาซื้อ" ใน `bom.md` §5b (**ผู้ใช้ override ได้**).
- **★ ไม่มี active supplier ที่มีราคา → ไม่บล็อก BOM อีกต่อไป** — BOM ให้ผู้ใช้กรอกราคาซื้อเองได้โดยตรง (`bom.md` §5b/§7, เปลี่ยนจากกฎเดิม "บล็อกจนกรอก override").

## 10. Cross-links
- ราคา active → `bom.md` §5b (default ราคาซื้อ, override ได้, snapshot). Lot prefix → `goods-receipt.md`. inactive/soft-delete → deletion-policy. **RM master (search dropdown ค้นชื่อ+รหัส) → `stock.md` §3b.** **audit + trace (create/edit/active-inactive/price-matrix) → `traceability.md` §3/§4 + `non-functional.md` AU1.** RBAC → `permission-matrix.md`.

## 11. Module changelog
- **Absorbed:** functional-spec `supplier.html` US-SUP-01..03 (9 AC) verbatim ในความหมาย.
- **คงเดิม:** price matrix + max active → default BOM cost · snapshot ไม่ retro · Inactive ตัดจากการคิด/ซื้อใหม่ · ไม่มีรับเข้าในหน้านี้.
- **★ เพิ่ม (2026-07-29 — Supplier module review, ปอนด์):**
  1. **การเลือกวัตถุดิบใน price matrix = search-in-dropdown ค้นได้ทั้งชื่อและรหัส (G7)** — reuse pattern จาก Stock (§2/§3/§5/§7).
  2. **Audit + tracing ตอกย้ำ:** supplier create/edit, active↔inactive, และการแก้ price-matrix = **audit-logged + trace-visible** (ใคร/เมื่อ/เดิม→ใหม่) — §3/§4/§6/§10, `traceability.md` §3/§4, `non-functional.md` AU1.
  3. **สอดคล้องการเปลี่ยนใน BOM:** max-active = **default ราคาซื้อที่ override ได้**; ไม่มี active supplier = **ไม่บล็อก** BOM แล้ว (`bom.md` §5b) — §3/§5/§9.
