# Module — BOM (สูตรการผลิต / FG master)

slug: `erp-v2-ui-first` · per-module canonical · PO · 2026-07-29
Mockups: `mockups/bom.html` · `mockups/bom-create.html`
กฎอ้างอิง: **D9** (ต้นทุนอื่น per-unit) · **D10** (cost snapshot) · **D11** (1 BOM = 1 FG auto) · **D16** (planning config on 1-BOM=1-FG master) · deletion-policy §2.4 · README §3

## สรุปภาษาไทย
BOM = สูตร + เป็น FG master (1 BOM = 1 FG, auto — D11). เพิ่ม **"ต้นทุนอื่น (ต่อหน่วย)"** ที่ **ผู้ใช้ตั้งชื่อ + ใส่ค่าเอง** (อิสระ, D9); **ต้นทุนรวม/หน่วย = Σ(ราคาซื้อวัตถุดิบ) + Σ(ต้นทุนอื่น)** → snapshot ทั้งก้อนตอนขาย (D10). เพิ่ม **TYPE selector = OEM หรือ FG** ตอนสร้างสินค้า OEM(FG); และให้กรอก **Sales Rate, Lead Time, Safety Cover, Target Cover, Batch Size** (Supply Planning config) บน master นี้ (D16). Planning config โผล่สำหรับ **FG type** (Own-Brand ที่วางแผนสต็อก).

---

## 1. Purpose
กำหนดสูตรวัตถุดิบ + ต้นทุน + config การวางแผนสต็อกของสินค้า, เป็นแหล่ง snapshot ต้นทุน (D10) และ config ที่ Supply Planning ใช้ (D16).

## 2. Screens
| หน้าจอ | บทบาท |
|---|---|
| `bom.html` (list/detail) | list สูตร + detail (สูตร, ต้นทุน, TYPE, planning config) |
| `bom-create.html` | สร้าง/แก้ BOM (+ ต้นทุนอื่น, TYPE, planning fields) |

## 3. Fields
| ฟิลด์ | หน่วย/ชนิด | editable/computed | หมายเหตุ |
|---|---|---|---|
| รหัส BOM / FG (auto) | string | computed | 1 BOM = 1 FG (D11) |
| **TYPE** | enum {OEM, FG} | editable | OEM = made-to-order · FG = Own-Brand stocked (planning config โผล่) |
| วัตถุดิบ (components) | list {RM, qty, ราคาซื้อ} | editable | ต้อง active supplier (กติกาเดิม) |
| **ต้นทุนอื่น (ต่อหน่วย)** | list {ชื่อ(user), ค่า/หน่วย(user)} | editable | ผู้ใช้ตั้งชื่อ + ใส่ค่าเอง อิสระ (D9) |
| **ต้นทุนรวม/หน่วย** | THB/unit | **computed** | = Σ(ราคาซื้อ RM) + Σ(ต้นทุนอื่น/หน่วย) |
| ราคาขาย | THB | editable (mandatory) | กติกาเดิม |
| **Sales Rate** | units /day·/week·/month | editable | planning (FG type) |
| **Lead Time** | days | editable | planning (FG type) |
| **Safety Cover** | days | editable | planning (FG type) |
| **Target Cover** | days | editable | planning (FG type) |
| **Batch Size** | units | editable | planning (FG type) |
| cost snapshot | THB/unit | computed (เก็บตอนขาย) | แนบ line SO/PO (D10) |

## 4. ★ ต้นทุนรวม/หน่วย — สูตร (D9)
```
ต้นทุนรวม/หน่วย = Σ(ราคาซื้อวัตถุดิบ ต่อหน่วยสินค้า)  +  Σ(ต้นทุนอื่น ต่อหน่วย ที่ผู้ใช้กำหนด)
```
- **ต้นทุนอื่น:** ผู้ใช้เพิ่มกี่หมวดก็ได้ (ค่าแรง/โสหุ้ย/บรรจุภัณฑ์/อื่น ๆ) — แต่ละหมวด = **ชื่อ (ผู้ใช้พิมพ์) + ค่า/หน่วย (ผู้ใช้ใส่)**.
- **snapshot (D10):** เก็บต้นทุนรวมทั้งก้อน ณ ตอนขาย (line SO/PO) — ยังไม่ทำ UI รายงาน COGS/กำไรเฟสนี้ (data model พร้อมรองรับ).
- badge "ราคาทุนอาจล้าสมัย" ครอบต้นทุนรวมใหม่.

## 5. ★ TYPE (OEM/FG) + Planning config (D16)
- **TYPE selector** ตอนสร้างสินค้า:
  - **OEM** = สินค้ารับจ้างผลิต made-to-order (ส่งตรง, ปกติไม่เก็บ FG ยกเว้น surplus D13) — planning config ไม่จำเป็น.
  - **FG** = สินค้าแบรนด์ตัวเอง (Own-Brand) ที่เก็บสต็อก/วางแผน — **planning config โผล่**.
- Planning config (Sales Rate/Lead Time/Safety Cover/Target Cover/Batch Size) เก็บบน **1-BOM=1-FG master** (D11/D16) — Supply Planning อ่าน/แก้ได้ (แก้แล้ว save back — supply-planning.md).
> **หมายเหตุ (สำหรับ Gate 1 sanity-check):** ทุก BOM สร้าง FG อัตโนมัติ (D11); TYPE=OEM คือ FG ที่ไม่ active-planning (รับ surplus เท่านั้น), TYPE=FG คือ FG ที่ active-planning. Label "OEM/FG" ตามคำปอนด์.

## 6. Actions & Permissions (D14)
| ปุ่ม/action | Permission required (BOM module) |
|---|---|
| ดู BOM/detail | BOM.**Read (R)** |
| สร้าง BOM | BOM.**Create (C)** |
| แก้สูตร/ต้นทุนอื่น/TYPE/ราคาขาย | BOM.**Update (U)** |
| แก้ planning config | BOM.**Update (U)** (หรือผ่าน Supply Planning.Update — supply-planning.md) |
| soft-delete BOM | BOM.**Delete (D)** + comment |

## 7. Validations
- ต้นทุนอื่น: ชื่อ + ค่า/หน่วย (≥0).
- ราคาขาย mandatory; block ถ้าไม่มี active supplier + ไม่ override (กติกาเดิม).
- TYPE=FG → planning config บังคับ (Sales Rate/Batch Size ต้องมี เพื่อให้ Supply Planning คำนวณ); TYPE=OEM → planning config optional.

## 8. Cross-links
- Planning config → `supply-planning.md` (formula) · cost snapshot → `so.md`/`po.md` line · FG per-Batch → `stock.md`.

## 9. Module changelog
- **เพิ่ม:** ต้นทุนอื่น per-unit (ชื่อ+ค่า user) + สูตรต้นทุนรวม (D9) · TYPE selector (OEM/FG) · planning config fields (D16).
