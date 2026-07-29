# Module — BOM (สูตรการผลิต / FG master)

slug: `erp-v2-ui-first` · per-module canonical · PO · 2026-07-29
Mockups: `mockups/bom.html` · `mockups/bom-create.html`
กฎอ้างอิง: **D9** (ต้นทุนอื่น per-unit) · **D10** (cost snapshot) · **D11 v2** (1 BOM = 1 FG · **รหัส = ผู้ใช้ตั้งเองตอนสร้าง + unique + ล็อกหลังสร้าง**) · **D16** (planning config on 1-BOM=1-FG master) · deletion-policy §2.4 (BOM = no hard delete → inactivate) · README §3 (G7 search) · `stock.md` (FG per-Batch, RM master, RM code user-entered-locked) · `supplier.md` (ราคาซื้อ max-active reference) · `traceability.md` (audit) · `quotation.md`/`po.md`/`so.md` (inactive-BOM block)

## สรุปภาษาไทย
BOM = สูตร + เป็น FG master (**1 BOM = 1 FG แบบ 1:1 — D11**). **★ รหัส BOM = ผู้ใช้พิมพ์เองตอนสร้าง (user-entered on create), ต้องไม่ซ้ำ (unique), และ "แก้ไขไม่ได้หลังสร้าง" (ล็อกถาวร — create-only-lock)** (ปอนด์ 2026-07-29: "สร้างได้ แต่แก้ไขไม่ได้ RM ก็ด้วย"). **BOM กับ FG ใช้รหัสเดียวกัน (shared code)** → FG **ค้นได้ทั้งชื่อและรหัส** ในคลัง (`stock.md`). การล็อกรหัสหลังสร้างทำให้ **1 BOM = 1 FG และรหัสที่แชร์คงที่ (ไม่มี reference แตก)**. **★ RM component (วัตถุดิบในสูตร) เลือกผ่าน search-in-dropdown ค้นได้ทั้งชื่อและรหัส (G7)**. **★ ราคาซื้อวัตถุดิบ (purchase price, ต่อ component) แก้ด้วยมือได้โดยตรง — ทำได้ทั้งมี supplier และไม่มี supplier active** (ไม่บล็อกอีกต่อไป); ค่านี้ป้อน BOM cost + snapshot. เพิ่ม **"ต้นทุนอื่น (ต่อหน่วย)"** ที่ผู้ใช้ตั้งชื่อ+ใส่ค่าเอง (D9); **ต้นทุนรวม/หน่วย = Σ(ราคาซื้อวัตถุดิบ) + Σ(ต้นทุนอื่น)** → snapshot ตอนขาย (D10). **★ BOM ลบถาวรไม่ได้ → ใช้สถานะ Active/Inactive แทน**: **Inactive = บล็อกการเปิด QT / PO / SO** ที่อ้าง BOM/FG นั้น (คนละเรื่องกับ block ลูกค้า Disabled/Blacklist) **แต่ไม่กระทบงานผลิตที่กำลังทำอยู่หรือของที่วิ่งอยู่แล้ว** + ถูกกันออกจาก Supply Planning (ไม่แนะนำผลิต FG ที่ปิดใช้งาน). **★ ทุกการเปลี่ยนแปลง BOM (สร้าง/แก้ฟิลด์/แก้ราคาซื้อ/inactivate/reactivate) audit + trace ครบ**. TYPE selector = OEM หรือ FG; planning config (Sales Rate/Lead/Safety/Target/Batch) โผล่สำหรับ FG type (D16).

---

## 1. Purpose
กำหนดสูตรวัตถุดิบ + ต้นทุน + config การวางแผนสต็อกของสินค้า, เป็นแหล่ง snapshot ต้นทุน (D10) และ config ที่ Supply Planning ใช้ (D16). **เป็นที่มาของรหัส FG (1 BOM = 1 FG, shared code) ที่ผู้ใช้ตั้งเองตอนสร้าง + ล็อกหลังสร้าง** ที่คลัง FG อ้างอิง. ควบคุมวงจร Active/Inactive ของสูตร (แทนการลบถาวร).

## 2. Screens
| หน้าจอ | บทบาท |
|---|---|
| `bom.html` (list/detail) | list สูตร + filter สถานะ Active/Inactive + detail (รหัส BOM/FG, สูตร, ต้นทุน, TYPE, planning config, สถานะ) |
| `bom-create.html` | สร้าง/แก้ BOM — **ช่องรหัส BOM/FG พิมพ์เองตอนสร้าง (unique) · read-only เมื่อแก้** · RM component (search dropdown ชื่อ+รหัส) + ราคาซื้อแก้มือ · ต้นทุนอื่น · TYPE · planning fields · toggle Active/Inactive |

## 2b. Statuses / lifecycle — ★ Active / Inactive (NEW 2026-07-29)
| สถานะ | ใครเปลี่ยน | ผล |
|---|---|---|
| **Active (ใช้งาน)** | default ตอนสร้าง | เปิด QT/PO/SO ที่อ้าง BOM/FG นี้ได้ตามปกติ · โผล่ใน Supply Planning (ถ้า TYPE=FG) |
| **Inactive (ปิดใช้งาน)** | BOM.**Update/Delete** (บังคับเหตุผล + audit) | **บล็อกการเปิด QT/PO/SO ใหม่** ที่อ้าง FG นี้ · หายจาก dropdown เลือก BOM/FG งานใหม่ · **ถูกกันออกจาก Supply Planning** (ไม่แนะนำผลิต) · **ไม่กระทบ:** PRD/Batch ที่กำลังผลิต, PO/SO/QT ที่เปิดค้างอยู่, FG stock ที่มีอยู่ (ตัด/ส่ง/ปิดงานเดิมได้จนจบ) |
- **ไม่มี hard delete** (deletion-policy §2.4) — "ลบ" BOM = ตั้ง **Inactive** (soft) · reactivate = กลับ Active.
- Inactive แล้วยัง **ดู/ค้นย้อนหลังได้ (read-only)** + badge "ปิดใช้งาน".

## 3. Fields
| ฟิลด์ | หน่วย/ชนิด | editable/computed | หมายเหตุ |
|---|---|---|---|
| **รหัส BOM / FG** | string | **editable เฉพาะตอนสร้าง (ผู้ใช้พิมพ์เอง) · LOCKED หลังสร้าง (read-only)** | **บังคับ + ต้องไม่ซ้ำ (UNIQUE) ตอนสร้าง** · **1 BOM = 1 FG แบบ 1:1 · BOM กับ FG แชร์รหัสเดียวกัน (D11 v2)** · **แก้ไม่ได้หลังสร้าง** (คงรหัส shared ให้ reference ไม่แตก) · **FG ค้นได้ทั้งชื่อและรหัสในแท็บ FG (`stock.md`)** |
| **สถานะ** | enum {Active, Inactive} | editable (Update/Delete) | **Inactive = บล็อก QT/PO/SO ใหม่ + กันออกจาก Supply Planning** (§2b/§5c) · ไม่กระทบงานที่วิ่งอยู่ |
| **TYPE** | enum {OEM, FG} | editable | OEM = made-to-order · FG = Own-Brand stocked (planning config โผล่) |
| **วัตถุดิบ (components)** | list {RM, qty, **ราคาซื้อ**} | editable | **RM เลือกผ่าน search-in-dropdown ค้นได้ทั้งชื่อและรหัส (G7)** — `stock.md` §3b · **ราคาซื้อแก้ด้วยมือได้โดยตรง (§5b)** |
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

## 5. ★ รหัส BOM/FG (D11 v2) + TYPE + Planning config (D16)
- **รหัส BOM = รหัส FG (1 BOM = 1 FG, 1:1, shared code):** ทุก BOM สร้าง FG identity อัตโนมัติและ **แชร์รหัสเดียวกัน**.
- **★ ที่มาของรหัส = ผู้ใช้พิมพ์เองตอนสร้าง (user-entered on create) + ต้องไม่ซ้ำ (unique):** ช่องรหัสบน `bom-create` เปิดให้พิมพ์เฉพาะตอน **สร้างใหม่** · ระบบ **reject ถ้าซ้ำ** ก่อนบันทึก. → **ตอบคำถามปอนด์: "BOM = FG?" = ใช่ (1:1, รหัสเดียว); "รหัส BOM/FG ตั้งเองได้ไหม?" = ตั้งเองตอนสร้าง แต่แก้ไม่ได้หลังสร้าง.**
- **★ Create-only-lock (แก้ไม่ได้หลังสร้าง):** เมื่อบันทึก BOM ครั้งแรกแล้ว **รหัสถูกล็อกถาวร (read-only)** — แก้สูตร/ต้นทุน/ราคา/planning ได้ แต่ **รหัสห้ามแก้**. เหตุผล: รหัสถูก reference โดย FG stock/PO/SO/QT/PRD/Batch/trace — การล็อกทำให้ **1 BOM = 1 FG และรหัส shared คงที่ ไม่มี reference แตก** (stable identity).
- **★ กฎเดียวกันกับ RM code (`stock.md` §3b):** รหัส RM ก็ **ผู้ใช้ตั้งเองตอนสร้าง + unique + ล็อกหลังสร้าง** (ปอนด์: "RM ก็ด้วย"). BOM/FG และ RM จึงใช้กติกา "user-entered on create → unique → create-only-lock" เหมือนกัน.
- **OEM ก็มี FG identity + รหัส:** TYPE=OEM สร้าง FG (รหัส) เช่นกัน — ปกติยอด 0 (ไม่ active-planning) ยกเว้น **surplus (D13)** ที่เข้า FG stock. ดังนั้น **1:1 "BOM = FG" ใช้ได้ทั้ง OEM และ FG** (ไม่ break).
- **TYPE selector** ตอนสร้างสินค้า:
  - **OEM** = สินค้ารับจ้างผลิต made-to-order (ส่งตรง, ปกติไม่เก็บ FG ยกเว้น surplus D13) — planning config ไม่จำเป็น.
  - **FG** = สินค้าแบรนด์ตัวเอง (Own-Brand) ที่เก็บสต็อก/วางแผน — **planning config โผล่**.
- Planning config (Sales Rate/Lead Time/Safety Cover/Target Cover/Batch Size) เก็บบน **1-BOM=1-FG master** (D11/D16) — Supply Planning อ่าน/แก้ได้ (แก้แล้ว save back — supply-planning.md).
> **หมายเหตุ reconcile D11:** D11 เดิมกำหนด "รหัส FG **สร้างอัตโนมัติ**". ปอนด์ปรับ (2026-07-29) → **ที่มารหัสเปลี่ยนจาก auto → ผู้ใช้ตั้งเองตอนสร้าง**; ส่วน **1:1 + shared code คงเดิม** และ **เพิ่ม create-only-lock** (แก้ไม่ได้หลังสร้าง). module package wins เหนือถ้อยคำ "auto" ของ D11 (README §5).

## 5b. ★ ราคาซื้อวัตถุดิบ (purchase price) — แก้ด้วยมือได้ ทั้งมี/ไม่มี supplier (NEW 2026-07-29)
- **แต่ละ component มีช่อง "ราคาซื้อ" ที่ผู้ใช้แก้ด้วยมือได้โดยตรง** บน `bom-create`.
- **ค่าตั้งต้น (default) = ราคาสูงสุดของ active supplier** ที่ผูกวัตถุดิบนั้น (max-active, `supplier.md` §9) — เป็นเพียงค่าเริ่มต้น/คำแนะนำ; ผู้ใช้ **override ได้เสมอ**.
- **★ ทำงานได้แม้ไม่มี supplier active:** ถ้าวัตถุดิบ **ไม่มี active supplier / ไม่มีราคา matrix** → **ไม่บล็อกอีกต่อไป** — ผู้ใช้ **กรอกราคาซื้อเองได้โดยตรง** (แสดง hint "ไม่มีราคาจาก supplier — กรอกเอง"). *(เปลี่ยนจากกฎเดิม "ไม่มี active supplier → บล็อกจนกรอก override".)*
- ราคาซื้อที่กรอก/override → เข้า **สูตรต้นทุนรวม (§4)** และ **cost snapshot (D10)** ตามปกติ.
- คง badge "ราคาทุนอาจล้าสมัย" (เมื่อราคา matrix เปลี่ยนหลัง BOM ตั้งค่า) — แต่ **การไม่มี supplier ไม่ใช่เหตุบล็อกการบันทึก BOM อีกต่อไป**.

## 5c. ★ Active / Inactive + Inactive blocks sales (NEW 2026-07-29)
- **BOM ลบถาวรไม่ได้ (deletion-policy §2.4)** — ใช้ **toggle Active/Inactive**; Inactivate บังคับเหตุผล + audit.
- **ผลของ Inactive:**
  - **บล็อกการเปิด QT / PO / SO ใหม่** ที่อ้าง BOM/FG นี้ (ทั้ง line BOM ของ OEM QT/PO และ FG ของ Own-Brand SO ทั้งขายจากสต็อกและผลิตเก็บสต็อก) — ดู `quotation.md`/`po.md`/`so.md` (§validations). **BOM/FG Inactive หายจาก dropdown เลือกรายการ** ในหน้า create เหล่านั้น; ถ้าหลุดเข้ามา → บล็อกตอนบันทึก/ยืนยัน ข้อความ *"สูตร/สินค้านี้ปิดใช้งาน (Inactive) — เปิดรายการใหม่ไม่ได้"*.
  - **ถูกกันออกจาก Supply Planning** — ไม่คำนวณ Suggested / ไม่มีปุ่ม "สั่งผลิต" / ไม่ยิงแจ้งเตือน Low สำหรับ FG ที่ Inactive (จะผลิตเติมสูตรที่ปิดไปแล้วไม่ได้) — `supply-planning.md` §4.
  - **★ ไม่กระทบของที่วิ่งอยู่แล้ว:** PRD/Batch ที่กำลังผลิต, PO/SO/QT ที่เปิด/ยืนยันไปแล้ว, และ FG stock ที่มีอยู่ **เดินต่อจนจบได้** (ตัด/ส่ง/QC/invoice ตามปกติ) — สอดคล้อง deletion-policy หลักการ §1.4 (ของเดิมวิ่งต่อได้).
- **แยกจาก block ลูกค้า:** การบล็อกด้วย **Inactive BOM/FG** เป็น **คนละเงื่อนไข** กับ hard block ลูกค้า Disabled/Blacklist (`customer.md` §4.2) — ทั้งสองเป็น hard block แต่คนละแหล่ง (สินค้า vs ลูกค้า); ข้อความ error แยกกัน.

## 6. Actions & Permissions (D14)
| ปุ่ม/action | Permission required (BOM module) |
|---|---|
| ดู BOM/detail | BOM.**Read (R)** |
| สร้าง BOM (+ ตั้งรหัสเอง unique) | BOM.**Create (C)** |
| แก้สูตร/ต้นทุนอื่น/ราคาซื้อ/TYPE/ราคาขาย | BOM.**Update (U)** (รหัส BOM/FG = ล็อก, แก้ไม่ได้) |
| แก้ planning config | BOM.**Update (U)** (หรือผ่าน Supply Planning.Update — supply-planning.md) |
| **Inactivate / Reactivate BOM** | BOM.**Delete (D)** (inactivate = soft, แทน hard delete) / **Update (U)** (reactivate) + **เหตุผล** |

## 7. Validations
- **★ รหัส BOM/FG:** ตอนสร้าง = **บังคับ + UNIQUE** (reject ถ้าซ้ำก่อนบันทึก, free-form) · **หลังสร้าง = read-only (แก้ไม่ได้)** — คง 1:1 + shared code.
- ต้นทุนอื่น: ชื่อ + ค่า/หน่วย (≥0).
- ราคาขาย mandatory.
- **★ ราคาซื้อ component: แก้มือได้ (≥0) · ไม่บล็อกแม้ไม่มี active supplier** (กรอกเองได้) — *ยกเลิกกฎเดิม "block ถ้าไม่มี active supplier + ไม่ override"*.
- TYPE=FG → planning config บังคับ (Sales Rate/Batch Size ต้องมี เพื่อให้ Supply Planning คำนวณ); TYPE=OEM → planning config optional.
- **★ Inactivate:** บังคับเหตุผล + audit · **ไม่มี hard delete** (deletion-policy §2.4).
- RM component เลือกจาก master ที่ **ยังไม่ soft-deleted** (search dropdown ชื่อ+รหัส, G7).

## 8. Cross-links
- Planning config → `supply-planning.md` (formula + exclude Inactive) · cost snapshot → `so.md`/`po.md` line · **FG per-Batch + ค้น FG ชื่อ+รหัส → `stock.md` §4/§10** · **component RM master + RM code user-entered-locked → `stock.md` §3b** · **ราคาซื้อ max-active reference → `supplier.md` §9** · **inactive-BOM block → `quotation.md`/`po.md`/`so.md`** · **no-hard-delete/inactivate → `deletion-policy.md` §2.4** · **audit ทุกการเปลี่ยน BOM → `traceability.md` §3/§4 · `non-functional.md` AU1** · RBAC → `permission-matrix.md`.

## 9. Module changelog
- **เพิ่ม (รอบก่อน):** ต้นทุนอื่น per-unit (ชื่อ+ค่า user) + สูตรต้นทุนรวม (D9) · TYPE selector (OEM/FG) · planning config fields (D16).
- **★ เพิ่ม (2026-07-29 — Stock module 4 review):** ระบุ BOM มีรหัส (= รหัส FG, shared, 1:1 — D11) เพื่อให้ FG ค้นได้ชื่อ+รหัส.
- **★ CHANGED (2026-07-29 — BOM module review, ปอนด์: "สร้างได้ แต่แก้ไขไม่ได้ RM ก็ด้วย") — reconcile D11 → D11 v2:**
  1. **รหัส BOM/FG: ที่มาเปลี่ยน auto → ผู้ใช้ตั้งเองตอนสร้าง (user-entered on create) + UNIQUE + LOCKED หลังสร้าง (create-only-lock)** — §3/§5/§7. **1:1 + shared code คงเดิม**; ล็อกหลังสร้างเพื่อ reference ไม่แตก. (RM code ก็กติกาเดียวกัน — `stock.md` §3b.) supersede ถ้อยคำ "auto" ของ D11 (module package wins).
  2. **RM component search = search-in-dropdown ค้นได้ทั้งชื่อและรหัส (G7)** — §3.
  3. **ราคาซื้อ (purchase price) แก้ด้วยมือได้โดยตรง — ทำได้ทั้งมี/ไม่มี active supplier** (default = max-active, override ได้; ไม่มี supplier ก็กรอกเอง ไม่บล็อก) — §5b/§7. **ยกเลิกกฎเดิม "no active supplier → block until override"**; ค่านี้ feed ต้นทุนรวม + snapshot.
  4. **BOM ลบถาวรไม่ได้ → เพิ่มสถานะ Active/Inactive** — §2b/§5c. **Inactive บล็อกเปิด QT/PO/SO ที่อ้าง BOM/FG** (คนละเรื่องกับ block ลูกค้า) + **กันออกจาก Supply Planning** · **ไม่กระทบงานผลิต/เอกสารที่วิ่งอยู่แล้ว/FG stock เดิม**. sync `deletion-policy.md` §2.4 · `quotation.md`/`po.md`/`so.md` (block) · `supply-planning.md` (exclude) · `entity-status-map.md` (BOM lifecycle).
  5. **Audit + trace ทุกการเปลี่ยน BOM** (create/แก้ฟิลด์/แก้ราคาซื้อ/inactivate/reactivate) — §8, `traceability.md`, `non-functional.md` AU1.
