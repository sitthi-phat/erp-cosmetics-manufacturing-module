# Deletion Policy (Folded + Updated) — ESSENCE Hub System

slug: `erp-v2-ui-first` · per-module canonical · PO · 2026-07-29 · **AUTHORITATIVE deletion policy** (folds root `deletion-policy.md` + updates ให้ครอบ entity ใหม่ของ scope OEM/Own-Brand/Supply-Planning)
ที่มา (locked): root `deletion-policy.md` (7 กติกา ปอนด์ล็อก) · `entity-status-map.md` · scope D1–D18 · `non-functional.md` §10 · `permission-matrix.md` · **QT cancel decision (ปอนด์ 2026-07-29)** · **BOM inactivate decision (ปอนด์ 2026-07-29)**
> **Source of truth:** ไฟล์นี้เป็นฉบับ **authoritative ปัจจุบัน** สำหรับนโยบายการลบ. root `deletion-policy.md` = historical reference — ถ้าขัดกันให้ยึดไฟล์นี้.

## สรุปภาษาไทย
ทั้งระบบ **ไม่มี hard delete** — "ลบ" = soft-delete (flag `deleted`) สำหรับ master (ยัง search/ดูย้อนหลังได้ read-only, ห้ามเป็น reference ของของใหม่, หายจาก dropdown, ของเดิมวิ่งต่อจนจบ) · **เอกสารการค้า = void/ยกเลิกเท่านั้น** (gapless ตามสรรพากร) · ทุกการลบ audit + comment บังคับ · สิทธิ์ RUCDAA (ลบ=D, undelete=Admin). ไฟล์นี้ **fold กติกาเดิม 7 ข้อ** และ **เพิ่ม entity ใหม่:** **Quotation (QT)**, **Sales Order (SO)**, **FG stock / FG Batch**, **OEM surplus**, **cost snapshot**. **★ Quotation (DECIDED 2026-07-29):** ยกเลิกได้ **ทุกสถานะ** — PO อ้าง QT แบบ **loose reference** เท่านั้น, ยกเลิก QT **ไม่ cascade ไป PO**, บันทึก **activity-log**, เลข gapless (ไม่ hard-delete). **★ QT status list = Draft / Confirmed / Rejected (+ Cancelled) — ถอด "Sent" ออกแล้ว (ปอนด์ revert 2026-07-29).** **★ BOM (DECIDED 2026-07-29):** **ลบถาวรไม่ได้ → ใช้ Active/Inactive (inactivate) แทน** · **Inactive = บล็อกการเปิด QT/PO/SO ใหม่ที่อ้าง BOM/FG นั้น** (คนละเรื่องกับ block ลูกค้า) **แต่ไม่กระทบงานผลิต/เอกสารที่วิ่งอยู่แล้ว/FG stock เดิม** + กันออกจาก Supply Planning. **ไม่มี open question ค้างในไฟล์นี้แล้ว**.

---

## 1. หลักการกลาง (ใช้กับทุก entity — คงเดิม)
1. **Soft delete เท่านั้น** (master) — ไม่มีลบถาวร · flag `deleted` (หรือ Inactive) + เก็บ record.
2. **ยัง search/เปิดดูย้อนหลังได้** (read-only, badge "ถูกลบ"/"ปิดใช้งาน").
3. **ห้ามเป็น reference ของของใหม่** — หายจาก dropdown/ตัวเลือกงานใหม่.
4. **ของเดิมที่ผูกอยู่แล้ววิ่งต่อได้** จนจบ (ไม่ break integrity ย้อนหลัง).
5. **Audit บังคับ** — ใคร/เมื่อ/**เหตุผล (comment บังคับ)**.
6. **RUCDAA:** ลบ = **D** · undelete/restore = **Admin** · บาง entity ต้อง Approve/Manager.
7. **เอกสารการค้า/กฎหมาย = ไม่มี delete** — ใช้ **"ยกเลิก (Cancelled/Void)"** (gapless ห้ามหาย).
8. **Blocked delete → เสนอทางเลือก** (Disabled/Blacklist, bulk reassign, ย้าย user).
9. **COGS out of scope** — ต้นทุนใช้ **BOM snapshot** — การลบ master ไม่กระทบต้นทุนย้อนหลัง.

---

## 2. กติกาต่อ Entity

### 2.1–2.8 (คงเดิม — ปอนด์ล็อก, absorb จาก root deletion-policy · BOM = ★ อัปเดต 2026-07-29)
| Entity | วิธี "ลบ" | เงื่อนไขหลัก (ล็อก) | สิทธิ์ | กู้คืน |
|---|---|---|---|---|
| **Customer** | soft delete (flag) | flag ได้เสมอ; PO เดิมเดินต่อ, ห้าม PO/QT/SO ใหม่; แนะนำ Disabled/Blacklist แทน | D + Approve(Sale Mgr) | Admin |
| **Sale/User** | soft delete + ปิด login | **bulk reassign ลูกค้าทั้งหมดก่อน** (ไม่มี force) | Admin | Admin |
| **Material (RM)** | soft delete | ห้าม PO/BOM/PR/GR ใหม่ที่เกี่ยว; **Lot เดิมใช้จนหมด**; **รหัส RM แก้ไม่ได้ (create-only-lock)** | D | Admin |
| **BOM** | **★ inactivate (Active/Inactive) — ไม่มี hard/soft-delete-flag แยก** | **ดู §2.4 (ขยาย):** Inactive → **บล็อกเปิด QT/PO/SO ใหม่ที่อ้าง BOM/FG นั้น** + กันออกจาก Supply Planning; **PO/SO/QT/PRD/Batch/FG stock ที่วิ่งอยู่แล้วเดินต่อจนจบ**; snapshot ต่อได้; **รหัส BOM/FG แก้ไม่ได้ (create-only-lock)** | D (inactivate) / U (reactivate) + เหตุผล | Reactivate (U) |
| **Supplier** | inactive/soft delete | ห้ามซื้อใหม่; Lot เดิมใช้ได้; snapshot ราคาคงอยู่; **create/edit/active-inactive/price-matrix = audit** | D | Admin |
| **Contact** | soft delete | ห้ามถ้าเป็นผู้ติดต่อหลักคนเดียว (ตั้งคนใหม่ก่อน) | D | Admin |
| **Role** | soft delete | **ห้ามลบจนย้าย user ออกหมด** (ไม่มี force-migrate) | Admin | Admin |
| **PO/INV/DN/PR/GR/Shipment** | **void/ยกเลิก (ไม่ลบ)** | gapless — เลขคงอยู่; PO reopen คงเลข | D/Approve/Admin | — (คงอยู่) |
| **PRD/Batch** | ยกเลิกตาม PO/SO | หลักฐาน GMP ห้ามหาย | ตาม order | — |

### 2.4 ★ BOM — inactivate แทน hard delete (DECIDED 2026-07-29, ปอนด์)
| ประเด็น | กติกา |
|---|---|
| ประเภท | master สูตร/FG (1 BOM = 1 FG, shared code, **รหัส user-entered ตอนสร้าง + create-only-lock** — bom.md §5) → **ไม่มี hard delete** |
| **"ลบ" = Inactivate** | ตั้งสถานะ **Inactive (ปิดใช้งาน)** (บังคับเหตุผล + audit) แทนการลบถาวร · reactivate กลับ Active ได้ |
| **ผลของ Inactive — ★ บล็อก sales/production ใหม่** | **บล็อกการเปิด QT / PO / SO ใหม่** ที่อ้าง BOM/FG นั้น (line BOM ของ OEM QT/PO; FG ของ Own-Brand SO ทั้งขายจากสต็อก/ผลิตเก็บสต็อก) — BOM/FG หายจาก dropdown งานใหม่ + บล็อกตอนบันทึก/ยืนยัน · **ถูกกันออกจาก Supply Planning** (ไม่แนะนำผลิต, ไม่มีปุ่มสั่งผลิต, ไม่ยิง Low alert) |
| **ไม่กระทบ (★ วิ่งต่อได้)** | **PRD/Batch ที่กำลังผลิต, QT/PO/SO ที่เปิด/ยืนยันไปแล้ว, และ FG stock ที่มีอยู่** เดินต่อจนจบ (ตัด/ส่ง/QC/invoice ได้) — หลักการ §1.4 |
| **แยกจาก block ลูกค้า** | เป็น hard block **คนละแหล่ง** กับ Disabled/Blacklist ของลูกค้า (customer.md §4.2) — ข้อความ error แยก ("สูตร/สินค้าปิดใช้งาน" vs "ลูกค้า Disabled/Blacklist") |
| ใครมีสิทธิ์ | BOM **D** (inactivate) / **U** (reactivate) + เหตุผลบังคับ · ทุกการเปลี่ยน audit + trace |
> **แทน** ถ้อยคำเดิม "BOM soft delete (flag)" — ปอนด์กำหนดชัดเป็น **Active/Inactive + inactive บล็อก sales**. authoritative = `bom.md` §2b/§5c. sync `quotation.md`/`po.md`/`so.md` (§validations) + `supply-planning.md` (§4 exclude) + `entity-status-map.md` (BOM lifecycle).

### 2.9 ★ Quotation (QT — OEM) — DECIDED 2026-07-29 (cancel-anytime, no cascade)
| ประเด็น | กติกา |
|---|---|
| ประเภท | เอกสารเชิงการค้าก่อน order · เลข **`QT-` gapless** (NFR D-F2) → **ไม่มี hard delete** |
| แก้ไข | **แก้ = เวอร์ชันใหม่** (เก็บเวอร์ชันเดิม read-only) |
| **ยืนยัน (Confirmed) — Convert-to-PO** | กด "Convert to PO" → QT = **"ยืนยัน (Confirmed)" immutable ทันที** (แทนคำเดิม "ตกลง/Agreed" — quotation.md §6) + สร้างลิงก์ QT↔PO แบบ **loose reference** ("created from QT-…") เมื่อสร้าง PO จริง · การสร้าง PO **อิสระ**จากการตั้ง Confirmed · **กดได้จากสถานะ Draft เท่านั้น** (ไม่มี Sent อีกต่อไป) |
| **ยกเลิก (Cancel) — ★ ทุกสถานะ** | **กด "ยกเลิก" ได้ไม่ว่า QT อยู่สถานะใด (Draft / Confirmed / Rejected)** → QT = **ยกเลิก (Cancelled)** + **เหตุผลบังคับ** → บันทึก **activity-log (ใคร/เมื่อ/ทำไม)** · เลข QT คงอยู่ **gapless** (ไม่ hard-delete, ไม่ soft-delete แบบ master) |
| **ผลต่อ PO — ★ ไม่ cascade** | PO อ้าง QT แบบ **loose reference เท่านั้น** (ไม่ใช่ hard dependency) → **ยกเลิก QT = ไม่ทำอะไรกับ PO เลย** (PO ยืนด้วยตัวเอง, เดินต่อปกติ) |
| ของที่ผูกอยู่ | activity/ประวัติเวอร์ชัน + trace คงอยู่ทั้งหมด (read-only) |
| ใครมีสิทธิ์ | Quotation bit **D**/Approve (cancel) + comment · undo/undelete = Admin |
> **แทนที่ default เดิม** ("abandon = void-only" + open question) — **ปิดคำถามแล้ว** (ปอนด์ตัดสิน cancel-anytime + no cascade). **สถานะ "Confirmed" reseat จาก "Agreed" (2026-07-29 Quotation review).** **★ สถานะ "ส่งแล้ว (Sent)" ถูกถอดออกทั้งหมด (ปอนด์ revert 2026-07-29) — QT lifecycle = Draft/Confirmed/Rejected/Cancelled; การส่งใบเสนอราคา = print/share ไม่ใช่สถานะ.**

### 2.10 ★ Sales Order (SO — Own-Brand) — NEW
| ประเด็น | กติกา (derive — SO = ฝาแฝด Own-Brand ของ PO, ยึดกติกา PO §2.8) |
|---|---|
| ประเภท | เอกสารการค้า · เลข **`SO-` gapless** → **void เท่านั้น ไม่มี delete** |
| ยกเลิก | สถานะ **"ยกเลิก (Cancelled/Void)"** + comment บังคับ · เลขคงอยู่ (gapless) · reopen (ถ้ามี) คงเลขเดิม |
| จอง/ตัด | SO(ก) ยกเลิก = **release FG reservation ที่ยังไม่ dispatch** · SO(ข) ยกเลิก = ยกเลิก PRD/Batch ที่ยังไม่เริ่ม (Batch ที่ผลิตแล้ว = หลักฐาน GMP คงอยู่, FG ที่เข้าคลังแล้วอยู่ในสต็อก) |
| PRD/Batch/DN/INV ที่ผูก | ตามกติกา §2.8 (void/ยกเลิกตาม order, GMP ห้ามหาย) |
| ใครมีสิทธิ์ | SO bit **D**/Approve (void) + comment · Admin force |

### 2.11 ★ FG Stock / FG Batch — NEW
| ประเด็น | กติกา (derive — Batch = หลักฐาน GMP; ยอด = ledger D15) |
|---|---|
| FG Batch | **ห้ามลบ/void** — เป็นหลักฐาน GMP · ตัด/หมดผ่าน FIFO ตอนขาย/ส่ง (D16) |
| ปรับยอด FG | **ไม่ใช่การลบ** — เป็น **ledger movement `adjust (±)`** (เหตุผลบังคับ + source=warehouse, D15) · ลดยอดเสีย = `loss (−)` |
| ของที่ผูกอยู่ | reservation/DN/INV ที่อ้าง FG Batch คงอยู่ (trace) |
| ใครมีสิทธิ์ | Stock bit **U** + เหตุผลบังคับ (adjust/loss) — **ไม่มี bit D สำหรับ FG Batch** |

### 2.12 ★ OEM Surplus — NEW
| ประเด็น | กติกา (derive — surplus = ledger auto, D13/D15) |
|---|---|
| ธรรมชาติ | OEM ผลิตเกิน → `surplus (+)` เข้า FG ตอน "พร้อมส่ง" (auto, remark, **ไม่ approve**) |
| "ลบ" surplus | **ไม่มี** — ledger append-only. แก้/หักออก = `adjust (−)` หรือ `loss (−)` (เหตุผลบังคับ + source) |
| ใครมีสิทธิ์ | Stock bit **U** + เหตุผล |

### 2.13 ★ Cost Snapshot (BOM/PO/SO) — NEW
| ประเด็น | กติกา (derive — หลักการ §9 + BOM §2.4) |
|---|---|
| ธรรมชาติ | ต้นทุน = **snapshot ณ ตอนสร้าง order** (COGS out of scope) · immutable |
| "ลบ" snapshot | **ไม่มี / ไม่ deletable เดี่ยว** — อยู่กับ order เสมอ · ลบ/inactivate BOM/Supplier/Material ไม่กระทบ snapshot |
| ใครมีสิทธิ์ | — (ไม่มี action ลบ) |

---

## 3. Matrix รวม (updated — เพิ่ม entity ใหม่)
| Entity | วิธี "ลบ" | เงื่อนไขหลัก | สิทธิ์ | กู้คืน |
|---|---|---|---|---|
| Customer | soft delete | PO/QT/SO เดิมเดินต่อ, ห้ามเปิดใหม่ | D+Approve | Admin |
| Sale/User | soft delete + ปิด login | bulk reassign ก่อน | Admin | Admin |
| Material | soft delete | ห้ามของใหม่; Lot เดิมใช้จนหมด; รหัสแก้ไม่ได้ | D | Admin |
| **BOM** | **★ inactivate (Active/Inactive)** | **Inactive บล็อกเปิด QT/PO/SO ใหม่ + กันออก Supply Planning**; งานที่วิ่งอยู่/FG stock เดินต่อ; snapshot ต่อได้; รหัสแก้ไม่ได้ | D (inactivate)/U (reactivate) | Reactivate |
| Supplier | inactive/soft delete | ห้ามซื้อใหม่; audit ทุกการเปลี่ยน + price-matrix | D | Admin |
| Contact | soft delete | ห้ามถ้าเป็นหลักคนเดียว | D | Admin |
| Role | soft delete | ห้ามจนย้าย user ออกหมด | Admin | Admin |
| **Quotation (QT)** | **★ ยกเลิก (Cancel) ได้ทุกสถานะ** (edit=version, Confirmed=immutable) | gapless; status = Draft/Confirmed/Rejected(+Cancelled) — **ไม่มี Sent**; **PO = loose ref → ยกเลิก QT ไม่ cascade**; บันทึก activity-log + เหตุผล | D/Approve | Admin (undo) |
| **SO** | **void** | gapless; release FG จอง/ยกเลิก PRD ที่ยังไม่เริ่ม | D/Approve | — |
| PO/INV/DN/PR/GR/Shipment | **void** | gapless | D/Approve/Admin | — |
| PRD/Batch | ยกเลิกตาม order | GMP ห้ามหาย | ตาม order | — |
| **FG Batch** | **ห้ามลบ** (adjust/loss ledger) | GMP; ปรับผ่าน ledger (เหตุผล) | U (adjust/loss) | — |
| **OEM surplus** | **ห้ามลบ** (adjust/loss) | ledger append-only | U | — |
| **Cost snapshot** | **ไม่ deletable** | immutable, อยู่กับ order | — | — |

---

## 4. อ้างอิงจาก module docs (ให้ module ชี้มาที่นี่)
- `customer.md` §soft-delete · `quotation.md` §4/§8 (cancel-anytime) · `so.md` §cancel · **`bom.md` §2b/§5c (inactivate + inactive blocks sales)** · `supplier.md`/`stock.md` (FG adjust/loss) · `settings.md` (ลบ Sale/Role, bit D/Admin) · `pr.md`/`goods-receipt.md`/`invoice.md`/`shipping.md` (void เอกสารการค้า) · `non-functional.md` §10 (soft-delete + reference-guard baseline).

## 5. Open questions
**ไม่มี open question ค้าง.** คำถามเดิมเรื่อง "QT abandon = void-only?" = **ปิดแล้ว** — ปอนด์ตัดสิน **Quotation ยกเลิกได้ทุกสถานะ + PO loose reference + ไม่ cascade + activity-log** (§2.9). **BOM = inactivate (ไม่ลบถาวร) + inactive บล็อก QT/PO/SO** = ปอนด์ตัดสินแล้ว (§2.4). กติกา entity ที่เหลือ derive จากหลักการที่ล็อก.

## 6. Module changelog
- **Folded:** root `deletion-policy.md` (หลักการ 7 ข้อ + entity 2.1–2.8) verbatim ในความหมาย.
- **Added (derive):** SO (void=PO twin), FG Batch (ห้ามลบ, ledger adjust/loss), OEM surplus (ledger), cost snapshot (immutable).
- **★ DECIDED (2026-07-29) — Quotation §2.9:** ยกเลิกได้ **ทุกสถานะ** · PO = **loose reference** · ยกเลิก QT **ไม่ cascade** · **activity-log** + gapless · **แทน default เดิม (void-only) + ปิด open question §5**.
- **★ อัปเดต (2026-07-29 — Quotation module review):** สถานะ Convert-to-PO **reseat "ตกลง (Agreed)" → "ยืนยัน (Confirmed)"** (immutable, ตั้งทันทีตอน Convert).
- **★ REVERTED (2026-07-29 — Pond):** ถอดสถานะ **"ส่งแล้ว (Sent)"** ออกจาก QT lifecycle ทั้งหมด → รายการสถานะที่ยกเลิกได้ = **Draft / Confirmed / Rejected** (§2.9, matrix). การส่งใบเสนอราคา = print/share ไม่ใช่สถานะ (sync `quotation.md` §4 + `entity-status-map.md` §1.1b).
- **★ DECIDED (2026-07-29 — BOM module review, ปอนด์) — §2.4:** **BOM ลบถาวรไม่ได้ → inactivate (Active/Inactive)** · **Inactive บล็อกเปิด QT/PO/SO ใหม่ที่อ้าง BOM/FG + กันออกจาก Supply Planning** · **ไม่กระทบงานผลิต/เอกสารที่วิ่งอยู่แล้ว/FG stock เดิม** · แยกจาก block ลูกค้า. อัปเดต BOM row (§2.1-2.8 table + matrix §3), เพิ่ม §2.4 dedicated, cross-ref `bom.md`/`quotation.md`/`po.md`/`so.md`/`supply-planning.md`/`entity-status-map.md`. **RM/BOM รหัส create-only-lock** ระบุใน Material/BOM row.
