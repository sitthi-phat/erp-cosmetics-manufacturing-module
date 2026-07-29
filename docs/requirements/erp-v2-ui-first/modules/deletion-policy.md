# Deletion Policy (Folded + Updated) — ESSENCE Hub System

slug: `erp-v2-ui-first` · per-module canonical · PO · 2026-07-29 · **AUTHORITATIVE deletion policy** (folds root `deletion-policy.md` + updates ให้ครอบ entity ใหม่ของ scope OEM/Own-Brand/Supply-Planning)
ที่มา (locked): root `deletion-policy.md` (7 กติกา ปอนด์ล็อก) · `entity-status-map.md` · scope D1–D18 · `non-functional.md` §10 · `permission-matrix.md` · **QT cancel decision (ปอนด์ 2026-07-29)**
> **Source of truth:** ไฟล์นี้เป็นฉบับ **authoritative ปัจจุบัน** สำหรับนโยบายการลบ. root `deletion-policy.md` = historical reference — ถ้าขัดกันให้ยึดไฟล์นี้.

## สรุปภาษาไทย
ทั้งระบบ **ไม่มี hard delete** — "ลบ" = soft-delete (flag `deleted`) สำหรับ master (ยัง search/ดูย้อนหลังได้ read-only, ห้ามเป็น reference ของของใหม่, หายจาก dropdown, ของเดิมวิ่งต่อจนจบ) · **เอกสารการค้า = void/ยกเลิกเท่านั้น** (gapless ตามสรรพากร) · ทุกการลบ audit + comment บังคับ · สิทธิ์ RUCDAA (ลบ=D, undelete=Admin). ไฟล์นี้ **fold กติกาเดิม 7 ข้อ** และ **เพิ่ม entity ใหม่:** **Quotation (QT)**, **Sales Order (SO)**, **FG stock / FG Batch**, **OEM surplus**, **cost snapshot**. **★ Quotation (DECIDED 2026-07-29):** ยกเลิกได้ **ทุกสถานะ** — PO อ้าง QT แบบ **loose reference** เท่านั้น, ยกเลิก QT **ไม่ cascade ไป PO**, บันทึก **activity-log**, เลข gapless (ไม่ hard-delete). **ไม่มี open question ค้างในไฟล์นี้แล้ว**.

---

## 1. หลักการกลาง (ใช้กับทุก entity — คงเดิม)
1. **Soft delete เท่านั้น** (master) — ไม่มีลบถาวร · flag `deleted` + เก็บ record.
2. **ยัง search/เปิดดูย้อนหลังได้** (read-only, badge "ถูกลบ").
3. **ห้ามเป็น reference ของของใหม่** — หายจาก dropdown/ตัวเลือกงานใหม่.
4. **ของเดิมที่ผูกอยู่แล้ววิ่งต่อได้** จนจบ (ไม่ break integrity ย้อนหลัง).
5. **Audit บังคับ** — ใคร/เมื่อ/**เหตุผล (comment บังคับ)**.
6. **RUCDAA:** ลบ = **D** · undelete/restore = **Admin** · บาง entity ต้อง Approve/Manager.
7. **เอกสารการค้า/กฎหมาย = ไม่มี delete** — ใช้ **"ยกเลิก (Cancelled/Void)"** (gapless ห้ามหาย).
8. **Blocked delete → เสนอทางเลือก** (Disabled/Blacklist, bulk reassign, ย้าย user).
9. **COGS out of scope** — ต้นทุนใช้ **BOM snapshot** — การลบ master ไม่กระทบต้นทุนย้อนหลัง.

---

## 2. กติกาต่อ Entity

### 2.1–2.8 (คงเดิม — ปอนด์ล็อก, absorb จาก root deletion-policy)
| Entity | วิธี "ลบ" | เงื่อนไขหลัก (ล็อก) | สิทธิ์ | กู้คืน |
|---|---|---|---|---|
| **Customer** | soft delete (flag) | flag ได้เสมอ; PO เดิมเดินต่อ, ห้าม PO/QT/SO ใหม่; แนะนำ Disabled/Blacklist แทน | D + Approve(Sale Mgr) | Admin |
| **Sale/User** | soft delete + ปิด login | **bulk reassign ลูกค้าทั้งหมดก่อน** (ไม่มี force) | Admin | Admin |
| **Material (RM)** | soft delete | ห้าม PO/BOM/PR/GR ใหม่ที่เกี่ยว; **Lot เดิมใช้จนหมด** | D | Admin |
| **BOM** | soft delete | PO/SO/PRD ที่ snapshot ต่อได้; ห้ามเปิดใหม่ด้วยสูตรนี้ | D | Admin |
| **Supplier** | inactive/soft delete | ห้ามซื้อใหม่; Lot เดิมใช้ได้; snapshot ราคาคงอยู่ | D | Admin |
| **Contact** | soft delete | ห้ามถ้าเป็นผู้ติดต่อหลักคนเดียว (ตั้งคนใหม่ก่อน) | D | Admin |
| **Role** | soft delete | **ห้ามลบจนย้าย user ออกหมด** (ไม่มี force-migrate) | Admin | Admin |
| **PO/INV/DN/PR/GR/Shipment** | **void/ยกเลิก (ไม่ลบ)** | gapless — เลขคงอยู่; PO reopen คงเลข | D/Approve/Admin | — (คงอยู่) |
| **PRD/Batch** | ยกเลิกตาม PO/SO | หลักฐาน GMP ห้ามหาย | ตาม order | — |

### 2.9 ★ Quotation (QT — OEM) — DECIDED 2026-07-29 (cancel-anytime, no cascade)
| ประเด็น | กติกา |
|---|---|
| ประเภท | เอกสารเชิงการค้าก่อน order · เลข **`QT-` gapless** (NFR D-F2) → **ไม่มี hard delete** |
| แก้ไข | **แก้ = เวอร์ชันใหม่** (เก็บเวอร์ชันเดิม read-only) |
| **ยืนยัน (Confirmed) — Convert-to-PO** | กด "Convert to PO" → QT = **"ยืนยัน (Confirmed)" immutable ทันที** (แทนคำเดิม "ตกลง/Agreed" — quotation.md §6) + สร้างลิงก์ QT↔PO แบบ **loose reference** ("created from QT-…") เมื่อสร้าง PO จริง · การสร้าง PO **อิสระ**จากการตั้ง Confirmed |
| **ยกเลิก (Cancel) — ★ ทุกสถานะ** | **กด "ยกเลิก" ได้ไม่ว่า QT อยู่สถานะใด (Draft / Sent / Confirmed / Rejected)** → QT = **ยกเลิก (Cancelled)** + **เหตุผลบังคับ** → บันทึก **activity-log (ใคร/เมื่อ/ทำไม)** · เลข QT คงอยู่ **gapless** (ไม่ hard-delete, ไม่ soft-delete แบบ master) |
| **ผลต่อ PO — ★ ไม่ cascade** | PO อ้าง QT แบบ **loose reference เท่านั้น** (ไม่ใช่ hard dependency) → **ยกเลิก QT = ไม่ทำอะไรกับ PO เลย** (PO ยืนด้วยตัวเอง, เดินต่อปกติ) |
| ของที่ผูกอยู่ | activity/ประวัติเวอร์ชัน + trace คงอยู่ทั้งหมด (read-only) |
| ใครมีสิทธิ์ | Quotation bit **D**/Approve (cancel) + comment · undo/undelete = Admin |
> **แทนที่ default เดิม** ("abandon = void-only" + open question) — **ปิดคำถามแล้ว** (ปอนด์ตัดสิน cancel-anytime + no cascade). **สถานะ "Confirmed" reseat จาก "Agreed" (2026-07-29 Quotation review).**

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
| "ลบ" snapshot | **ไม่มี / ไม่ deletable เดี่ยว** — อยู่กับ order เสมอ · ลบ BOM/Supplier/Material ไม่กระทบ snapshot |
| ใครมีสิทธิ์ | — (ไม่มี action ลบ) |

---

## 3. Matrix รวม (updated — เพิ่ม entity ใหม่)
| Entity | วิธี "ลบ" | เงื่อนไขหลัก | สิทธิ์ | กู้คืน |
|---|---|---|---|---|
| Customer | soft delete | PO/QT/SO เดิมเดินต่อ, ห้ามเปิดใหม่ | D+Approve | Admin |
| Sale/User | soft delete + ปิด login | bulk reassign ก่อน | Admin | Admin |
| Material | soft delete | ห้ามของใหม่; Lot เดิมใช้จนหมด | D | Admin |
| BOM | soft delete | snapshot ต่อได้; ห้ามเปิดใหม่ | D | Admin |
| Supplier | inactive/soft delete | ห้ามซื้อใหม่ | D | Admin |
| Contact | soft delete | ห้ามถ้าเป็นหลักคนเดียว | D | Admin |
| Role | soft delete | ห้ามจนย้าย user ออกหมด | Admin | Admin |
| **Quotation (QT)** | **★ ยกเลิก (Cancel) ได้ทุกสถานะ** (edit=version, Confirmed=immutable) | gapless; **PO = loose ref → ยกเลิก QT ไม่ cascade**; บันทึก activity-log + เหตุผล | D/Approve | Admin (undo) |
| **SO** | **void** | gapless; release FG จอง/ยกเลิก PRD ที่ยังไม่เริ่ม | D/Approve | — |
| PO/INV/DN/PR/GR/Shipment | **void** | gapless | D/Approve/Admin | — |
| PRD/Batch | ยกเลิกตาม order | GMP ห้ามหาย | ตาม order | — |
| **FG Batch** | **ห้ามลบ** (adjust/loss ledger) | GMP; ปรับผ่าน ledger (เหตุผล) | U (adjust/loss) | — |
| **OEM surplus** | **ห้ามลบ** (adjust/loss) | ledger append-only | U | — |
| **Cost snapshot** | **ไม่ deletable** | immutable, อยู่กับ order | — | — |

---

## 4. อ้างอิงจาก module docs (ให้ module ชี้มาที่นี่)
- `customer.md` §soft-delete · `quotation.md` §4/§8 (cancel-anytime) · `so.md` §cancel · `bom.md`/`supplier.md`/`stock.md` (FG adjust/loss) · `settings.md` (ลบ Sale/Role, bit D/Admin) · `pr.md`/`goods-receipt.md`/`invoice.md`/`shipping.md` (void เอกสารการค้า) · `non-functional.md` §10 (soft-delete + reference-guard baseline).

## 5. Open questions
**ไม่มี open question ค้าง.** คำถามเดิมเรื่อง "QT abandon = void-only?" = **ปิดแล้ว** — ปอนด์ตัดสิน **Quotation ยกเลิกได้ทุกสถานะ + PO loose reference + ไม่ cascade + activity-log** (§2.9). กติกา entity ที่เหลือ derive จากหลักการที่ล็อก.

## 6. Module changelog
- **Folded:** root `deletion-policy.md` (หลักการ 7 ข้อ + entity 2.1–2.8) verbatim ในความหมาย.
- **Added (derive):** SO (void=PO twin), FG Batch (ห้ามลบ, ledger adjust/loss), OEM surplus (ledger), cost snapshot (immutable).
- **★ DECIDED (2026-07-29) — Quotation §2.9:** ยกเลิกได้ **ทุกสถานะ** · PO = **loose reference** · ยกเลิก QT **ไม่ cascade** · **activity-log** + gapless · **แทน default เดิม (void-only) + ปิด open question §5**.
- **★ อัปเดต (2026-07-29 — Quotation module review):** สถานะ Convert-to-PO **reseat "ตกลง (Agreed)" → "ยืนยัน (Confirmed)"** (immutable, ตั้งทันทีตอน Convert) · รายการสถานะที่ยกเลิกได้ = Draft/Sent/**Confirmed**/Rejected (§2.9, matrix).
