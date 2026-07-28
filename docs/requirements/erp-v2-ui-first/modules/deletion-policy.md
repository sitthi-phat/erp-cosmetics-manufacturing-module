# Deletion Policy (Folded + Updated) — ESSENCE Hub System

slug: `erp-v2-ui-first` · per-module canonical · PO · 2026-07-29 · **AUTHORITATIVE deletion policy** (folds root `deletion-policy.md` + updates ให้ครอบ entity ใหม่ของ scope OEM/Own-Brand/Supply-Planning)
ที่มา (locked): root `deletion-policy.md` (7 กติกา ปอนด์ล็อก) · `entity-status-map.md` · scope D1–D18 · `non-functional.md` §10 · `permission-matrix.md`
> **Source of truth:** ไฟล์นี้เป็นฉบับ **authoritative ปัจจุบัน** สำหรับนโยบายการลบ. root `deletion-policy.md` = historical reference (หลักการเดิม 7 ข้อ + entity เดิมยังตรงกัน) — ถ้าขัดกันให้ยึดไฟล์นี้ (ซึ่งเพิ่ม entity ใหม่).

## สรุปภาษาไทย
ทั้งระบบ **ไม่มี hard delete** — "ลบ" = soft-delete (flag `deleted`) สำหรับ master (ยัง search/ดูย้อนหลังได้ read-only, ห้ามเป็น reference ของของใหม่, หายจาก dropdown, ของเดิมวิ่งต่อจนจบ) · **เอกสารการค้า = void/ยกเลิกเท่านั้น** (gapless ตามสรรพากร) · ทุกการลบ audit + comment บังคับ · สิทธิ์ RUCDAA (ลบ=D, undelete=Admin). ไฟล์นี้ **fold กติกาเดิม 7 ข้อ** และ **เพิ่ม entity ใหม่:** **Quotation (QT)**, **Sales Order (SO)**, **FG stock / FG Batch**, **OEM surplus**, **cost snapshot** — ทุกข้อ derive จากหลักการที่ล็อกแล้ว (ไม่เดา). จุดเดียวที่เป็น **confirm (ไม่บล็อก)** = พฤติกรรม "ยกเลิก QT ที่ยังไม่ Agreed" — default = void-only (คง gapless) รอปอนด์ยืนยัน/override.

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
9. **COGS out of scope** — ต้นทุนใช้ **BOM snapshot** (ราคา ณ ตอนสร้าง order) — การลบ master ไม่กระทบต้นทุนย้อนหลัง.

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

### 2.9 ★ Quotation (QT — OEM) — NEW
| ประเด็น | กติกา (derive จากหลักการ + scope D18) |
|---|---|
| ประเภท | เอกสารเชิงการค้าก่อน order · เลข **`QT-` gapless** (NFR D-F2) → **ไม่มี hard delete** |
| แก้ไข | **แก้ = เวอร์ชันใหม่** (เก็บเวอร์ชันเดิม read-only) — สอดคล้อง invoice versioning |
| Agreed (Convert-to-PO) | เมื่อ Convert-to-PO → QT = **"ตกลง (Agreed)" immutable** + ผูกลิงก์ QT↔PO · **ยกเลิก/แก้ QT ที่ Agreed แล้วไม่ได้** (ล็อกกับ PO) |
| Rejected | terminal (read-only) · trace คงอยู่ |
| ยกเลิก/superseded (ยังไม่ Agreed = Draft/Sent) | **default = "ยกเลิก (void)" คง gapless** (ไม่ hard delete, ไม่ soft-delete master) + comment บังคับ + trace · ออก QT ใหม่แทนได้ · **[CONFIRM — ไม่บล็อก]** ดู §5 |
| ของที่ผูกอยู่ | ถ้า Agreed → PO อ้าง QT (head-of-chain trace) คงอยู่เสมอ |
| ใครมีสิทธิ์ | Quotation bit **D**/Approve (void) + comment · undelete/undo = Admin |

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
| FG Batch | **ห้ามลบ/void** — เป็นหลักฐาน GMP (Batch = "lot ของ FG", ผูก PRD/PO หรือ Own-Brand Batch) · ตัด/หมดผ่าน FIFO ตอนขาย/ส่ง (D16) |
| ปรับยอด FG | **ไม่ใช่การลบ** — เป็น **ledger movement `adjust (±)`** (เหตุผลบังคับ + source=warehouse, D15) · ลดยอดเสีย = `loss (−)` (เหตุผลบังคับ, ไม่อนุมัติ) |
| ของที่ผูกอยู่ | reservation/DN/INV ที่อ้าง FG Batch คงอยู่ (trace) |
| ใครมีสิทธิ์ | Stock bit **U** + เหตุผลบังคับ (adjust/loss) — **ไม่มี bit D สำหรับ FG Batch** (ห้ามลบ) |

### 2.12 ★ OEM Surplus — NEW
| ประเด็น | กติกา (derive — surplus = ledger auto, D13/D15) |
|---|---|
| ธรรมชาติ | OEM ผลิตเกิน → `surplus (+)` เข้า FG ตอน "พร้อมส่ง" (auto, remark, **ไม่ approve**) — คง Batch identity ผูก OEM Batch/PRD/PO |
| "ลบ" surplus | **ไม่มี** — เป็น ledger movement (append-only). แก้/หักออก = `adjust (−)` หรือ `loss (−)` (เหตุผลบังคับ + source) |
| ใครมีสิทธิ์ | Stock bit **U** + เหตุผล (adjust/loss) |

### 2.13 ★ Cost Snapshot (BOM/PO/SO) — NEW
| ประเด็น | กติกา (derive — หลักการ §9 + BOM §2.4) |
|---|---|
| ธรรมชาติ | ต้นทุน = **snapshot ณ ตอนสร้าง order** (COGS out of scope) · immutable |
| "ลบ" snapshot | **ไม่มี / ไม่ deletable เดี่ยว** — snapshot อยู่กับ order (PO/SO) เสมอ · ลบ BOM/Supplier/Material master **ไม่กระทบ** snapshot ย้อนหลัง (badge "ราคาล้าสมัย" = on-read เปรียบเทียบ, ไม่ใช่การแก้ snapshot) |
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
| **Quotation (QT)** | **void** (Agreed=immutable, edit=version) | gapless; Agreed แก้ไม่ได้ · abandon=void [confirm §5] | D/Approve | Admin (undo) |
| **SO** | **void** | gapless; release FG จอง/ยกเลิก PRD ที่ยังไม่เริ่ม | D/Approve | — |
| PO/INV/DN/PR/GR/Shipment | **void** | gapless | D/Approve/Admin | — |
| PRD/Batch | ยกเลิกตาม order | GMP ห้ามหาย | ตาม order | — |
| **FG Batch** | **ห้ามลบ** (adjust/loss ledger) | GMP; ปรับผ่าน ledger (เหตุผล) | U (adjust/loss) | — |
| **OEM surplus** | **ห้ามลบ** (adjust/loss) | ledger append-only | U | — |
| **Cost snapshot** | **ไม่ deletable** | immutable, อยู่กับ order | — | — |

---

## 4. อ้างอิงจาก module docs (ให้ module ชี้มาที่นี่)
- `customer.md` §soft-delete · `quotation.md` §Convert-to-PO/void · `so.md` §cancel · `bom.md`/`supplier.md`/`stock.md` (FG adjust/loss) · `settings.md` (ลบ Sale/Role, bit D/Admin) · `pr.md`/`goods-receipt.md`/`invoice.md`/`shipping.md` (void เอกสารการค้า) · `non-functional.md` §10 (soft-delete + reference-guard baseline).

## 5. Open question (confirm — ไม่บล็อก)
**QT ที่ยังไม่ Agreed (Draft/Sent) ถูกทิ้ง/ยกเลิก ทำแบบไหน?**
- **Default ที่ใช้ (derive จาก gapless NFR):** "ยกเลิก (void) คงเลข gapless" + comment — ไม่ soft-delete/ไม่ hard delete.
- **ทางเลือกที่รอปอนด์ยืนยัน/override:** (ก) void-only เหมือนเอกสารการค้าอื่น [default] · (ข) อนุญาต soft-delete แบบ master (เพราะ QT ยังไม่ใช่เอกสารภาษี) แต่ยังคง search เจอ · (ค) Draft (ยังไม่ Sent) = soft-delete ได้, Sent แล้ว = void-only.
- **ผลกระทบ:** เฉพาะพฤติกรรมปุ่มบน quotation-detail (ยกเลิก vs ลบ) — ไม่กระทบ flow อื่น. **ไม่บล็อก** (มี default ปลอดภัยแล้ว). รายละเอียดคำถามภาษาไทย+ตัวเลือก อยู่ใน status/README.

## 6. Module changelog
- **Folded:** root `deletion-policy.md` (หลักการ 7 ข้อ + entity 2.1–2.8) verbatim ในความหมาย.
- **Added (derive, ไม่เดา):** Quotation (immutable/version/void), SO (void=PO twin), FG Batch (ห้ามลบ, ledger adjust/loss), OEM surplus (ledger), cost snapshot (immutable).
- **1 confirm non-blocking:** QT abandon behavior (default void-only).
