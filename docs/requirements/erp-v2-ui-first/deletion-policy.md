# Deletion Policy — ESSENCE Hub System (นโยบายการลบข้อมูลที่มีความสัมพันธ์)

slug: `erp-v2-ui-first` · ร่าง **business** โดย PO (2026-07-09) · **FINALIZED — ปอนด์ตอบครบ 7 ข้อ (ล็อกแล้ว ไม่มีคำถามเปิด)** · **Tech-Lead ต่อ (soft-delete technical design / cascade guard) + BA ต่อ (AC ต่อ entity)**
ที่มา: คำถามใหม่ปอนด์ — "ถ้าลบข้อมูลที่มีความสัมพันธ์ค้างอยู่ทำยังไง" + ข้อเสนอปอนด์: **ไม่ permanent delete ใช้ flag/status "deleted"** (search เจอได้ แต่ห้ามเป็น reference ของของใหม่)
เกี่ยวข้อง: `entity-status-map.md` (นิยาม entity + สถานะ + negative stock), `status-journeys.md` §9 (RUCDAA)

## สรุปภาษาไทย
ทั้งระบบ **ไม่มี hard delete** — "ลบ" = ตั้ง flag **"ถูกลบ (deleted)"** (soft delete) · ของที่ถูก flag **ยัง search/ดูย้อนหลังได้ (read-only)** แต่ **ห้ามถูกอ้างอิงในเอกสารใหม่** และ**หายจาก dropdown ของงานใหม่** · **เอกสารเก่าที่อ้างถึงอยู่แล้วยังทำงานต่อได้จนจบ** (คงความถูกต้องย้อนหลัง + gapless ตามสรรพากร) · ทุกการลบ **บันทึก audit (ใคร/เมื่อไหร่/เหตุผล บังคับ comment)** · สิทธิ์ตาม **RUCDAA**: ลบ = bit **D**, กู้คืน/undelete = bit **Admin** · **เอกสารการค้า (PO/Invoice/DN/GR/PR/Shipment) ไม่มีปุ่มลบเลย — มีแต่ "ยกเลิก/void"** เก็บเลขไว้ครบ · **ปอนด์ล็อกกติกาครบทุก entity แล้ว (7 ข้อ) — ไม่มีคำถามเปิด**

---

## 1. หลักการกลาง (ใช้กับทุก entity)
1. **Soft delete เท่านั้น** — ไม่มีการลบถาวรจากฐานข้อมูล · ตั้ง flag `deleted` + เก็บ record ไว้
2. **ยัง search / เปิดดูย้อนหลังได้** (read-only, มี badge "ถูกลบ") — ไม่หายไปจากประวัติ/trace/รายงานย้อนหลัง
3. **ห้ามเป็น reference ของของใหม่** — record ที่ถูก flag จะ**หายจาก dropdown/ตัวเลือกของงานใหม่** (สร้างเอกสาร/สูตร/ผูกใหม่ไม่ได้)
4. **ของเดิมที่ผูกอยู่แล้ววิ่งต่อได้** — เอกสาร/งานที่อ้าง record นี้ก่อนถูกลบ ทำงานต่อจนจบ (ไม่ break integrity ย้อนหลัง)
5. **Audit บังคับ** — ใครลบ / เมื่อไหร่ / **เหตุผล (บังคับ comment)** · โชว์ใน trace ของ record นั้น
6. **สิทธิ์ (RUCDAA):** ลบ = bit **D** ของ module นั้น · **กู้คืน (undelete/restore) = bit Admin เท่านั้น** · บาง entity ต้อง Approve/Manager (ระบุในตาราง)
7. **เอกสารการค้า/กฎหมาย = ไม่มี delete** — PO, Invoice, DN, GR, PR, Shipment ใช้สถานะ **"ยกเลิก (Cancelled/Void)"** แทน (เลขเอกสารต้อง gapless ตามสรรพากร — ห้ามหาย)
8. **Blocked delete → เสนอทางเลือก** — ถ้าลบไม่ได้เพราะมีความสัมพันธ์ค้าง ระบบต้องบอกเหตุผล + เสนอทางออก (เช่น ใช้ Disabled/Blacklist, bulk reassign, ย้าย user ก่อน)
9. **COGS = out of scope** — ระบบ**ไม่คำนวณ COGS**; ต้นทุนใช้ **BOM snapshot** (ราคา ณ ตอนสร้าง PO) เท่านั้น การลบ master ไม่กระทบต้นทุนย้อนหลังเพราะ snapshot แล้ว

---

## 2. กติกาต่อ Entity (ปอนด์ล็อกแล้ว)

### 2.1 Customer (ลูกค้า) — **[ล็อก] flag ได้เสมอ**
| ประเด็น | กติกา |
|---|---|
| ลบได้เมื่อไหร่ | **flag "ถูกลบ" ได้เสมอ** (แม้มี PO active) — **PO เดิมเดินต่อปกติจนจบ** และ **ห้ามสร้าง PO ใหม่** ให้ลูกค้านี้ |
| ของที่ผูกอยู่ | PO/Invoice/DN เดิม + ประวัติทั้งหมดคงอยู่ (read-only, ยัง trace ได้) · ลูกค้าหายจาก dropdown ตอนสร้าง PO/quote ใหม่ |
| ทางเลือกที่ควรใช้แทนลบ | **Disabled** (หยุดค้าขายชั่วคราว) / **Blacklist** (ขึ้นบัญชีดำ) — มีอยู่แล้วใน lifecycle; แนะนำใช้แทน delete ถ้าแค่ต้องการหยุดขาย |
| ใครมีสิทธิ์ | Customer module bit **D** + แนะนำ **Approve = Sale Manager/Admin** · บังคับ comment |

### 2.2 Sale / User (พนักงานขาย/ผู้ใช้) — **[ล็อก] บังคับ bulk reassign ก่อน**
| ประเด็น | กติกา |
|---|---|
| ลบได้เมื่อไหร่ | **flag ได้หลัง "bulk reassign ลูกค้าทั้งหมด" ของ Sale คนนี้ให้คนใหม่เสร็จก่อน** (บังคับ — ระบบไม่ให้ลบจนกว่าจะไม่เหลือลูกค้า/งานค้างในมือ) แล้วจึง soft-delete + ปิด login |
| ของที่ผูกอยู่ | ลูกค้า + escalation/Follow-up ค้าง ต้องถูกโอนยกชุดก่อน · เอกสารเก่าที่ user เคยทำ (PO/QC/GR ฯลฯ) ยังอ้างชื่อผู้ทำได้ (audit ย้อนหลัง) |
| ผลหลังลบ | login ถูกปิด, หายจาก dropdown ผู้รับผิดชอบ/assignee · ประวัติการกระทำคงอยู่ |
| ใครมีสิทธิ์ | User/Role module bit **Admin** (จัดการผู้ใช้) · บังคับ comment + ระบุผู้รับช่วง bulk reassign |

### 2.3 Material — วัตถุดิบ (master) — **[ล็อก] ห้ามใช้ในของใหม่, ของเดิมใช้จนหมด**
| ประเด็น | กติกา |
|---|---|
| ลบได้เมื่อไหร่ | flag "ถูกลบ" ได้ · หลังลบ **ห้ามสร้าง PO/BOM ใหม่ที่เกี่ยวกับวัตถุดิบนี้** (รวม PR/GR ซื้อเข้าใหม่) |
| ของที่ผูกอยู่ | **Lot คงเหลือใช้ผลิตต่อได้จนหมด** ("ของเดิมใช้จนหมด") · BOM เดิมที่มี component นี้ยังใช้ได้ (snapshot ราคาแล้ว) · PRD/Batch ที่กำลังผลิตเดินต่อได้ |
| ผลหลังลบ | หายจาก dropdown ตอนสร้าง BOM/PR/GR/PO ใหม่ · ยังเห็นในประวัติ Lot/Batch/trace |
| ใครมีสิทธิ์ | Material/Stock module bit **D** · บังคับ comment |

### 2.4 BOM (สูตรการผลิต)
| ประเด็น | กติกา |
|---|---|
| ลบได้เมื่อไหร่ | flag "ถูกลบ" ได้เสมอ |
| ของที่ผูกอยู่ | **PO/PRD/Batch ที่ใช้สูตรนี้อยู่ทำต่อได้** (สูตรถูก snapshot ตอนสร้าง PO แล้ว — ไม่กระทบ) · **แต่เปิด PO ใหม่ด้วยสูตรนี้ไม่ได้** (หายจาก dropdown เลือกสูตร) |
| ผลหลังลบ | ดูสูตรย้อนหลังได้ (read-only) + เห็นว่า snapshot ไปกับ PO ใดบ้าง |
| ใครมีสิทธิ์ | BOM module bit **D** · บังคับ comment |

### 2.5 Supplier (ผู้ขายวัตถุดิบ)
| ประเด็น | กติกา |
|---|---|
| ลบได้เมื่อไหร่ | มี **active/inactive** อยู่แล้ว — แนะนำใช้ **inactive** แทนลบ · soft-delete → ห้ามสร้าง PR/GR/PO ซื้อใหม่กับ supplier นี้ |
| ของที่ผูกอยู่ | Lot เดิมของ supplier ยังใช้ผลิตต่อได้ · ราคาที่ snapshot ใน BOM คงอยู่ · ประวัติการซื้อคงอยู่ |
| ใครมีสิทธิ์ | Supplier module bit **D** · บังคับ comment |

### 2.6 Contact (ผู้ติดต่อของลูกค้า)
| ประเด็น | กติกา |
|---|---|
| ลบได้เมื่อไหร่ | flag "ถูกลบ" ได้ · **ยกเว้น**เป็นผู้ติดต่อหลักคนเดียวของลูกค้า → ต้องตั้งผู้ติดต่อหลักคนใหม่ก่อน |
| ของที่ผูกอยู่ | เอกสาร/PO เก่าที่อ้างผู้ติดต่อนี้ยังคงชื่อไว้ (read-only) |
| ใครมีสิทธิ์ | Customer module bit **D** |

### 2.7 Role (บทบาทสิทธิ์) — **[ล็อก] ห้ามลบจนย้าย user ออกหมด**
| ประเด็น | กติกา |
|---|---|
| ลบได้เมื่อไหร่ | **ห้ามลบจนกว่าไม่มี user ผูกกับ role นี้** — ต้องย้าย user ไป role อื่นก่อน (ไม่มี force-migrate) |
| ของที่ผูกอยู่ | user ที่ถืออยู่ต้องถูกย้าย · audit ว่าใครเคยอยู่ role นี้คงอยู่ |
| ใครมีสิทธิ์ | **Admin เท่านั้น** · บังคับ comment |

### 2.8 เอกสารการค้า — PO / Invoice / DN / GR / PR / Shipment — **[ล็อก] void เท่านั้น ไม่มีลบ**
| ประเด็น | กติกา |
|---|---|
| ลบได้ไหม | **ไม่มีปุ่มลบ** — ใช้สถานะ **"ยกเลิก (Cancelled / Void)"** แทน (บังคับ comment) · **เลขเอกสารต้อง gapless ตามสรรพากร — ห้ามหาย** |
| PO | มี Cancelled อยู่แล้ว · Cancelled ≠ delete — record + เลขคงอยู่ตลอด, reopen เป็น Draft คงเลขเดิม |
| Invoice/DN | void/ยกเลิกด้วยเหตุผล + trace · ออกใบแก้ไข/ใบใหม่แทน (คงเลขเดิมในระบบ) |
| **PR/GR** | **void เท่านั้น ไม่มีลบ** (แม้ยังไม่ผูก Lot ก็ใช้ void) — คง gapless |
| PRD / Batch | ไม่ลบเดี่ยว · ถูกยกเลิกตาม PO ที่ถูก cancel (trace) — Batch เป็นหลักฐาน GMP ห้ามหาย |
| ใครมีสิทธิ์ | ยกเลิก = bit **D/Approve** ของ module + **Admin** สำหรับ force · บังคับ comment |

---

## 3. สรุป Matrix (ลบแบบไหน + สิทธิ์) — ล็อกแล้ว
| Entity | วิธี "ลบ" | เงื่อนไขหลัก (ล็อก) | สิทธิ์ | กู้คืน |
|---|---|---|---|---|
| Customer | soft delete (flag) | flag ได้เสมอ; PO เดิมเดินต่อ, ห้าม PO ใหม่ | D + Approve(Sale Mgr) | Admin |
| Sale/User | soft delete + ปิด login | **bulk reassign ลูกค้าทั้งหมดก่อน** | Admin | Admin |
| Material | soft delete | ห้าม PO/BOM/PR/GR ใหม่ที่เกี่ยว; ของเดิมใช้จนหมด | D | Admin |
| BOM | soft delete | PO เดิม snapshot ต่อได้; ห้ามเปิดใหม่ | D | Admin |
| Supplier | inactive/soft delete | ห้ามซื้อใหม่; Lot เดิมใช้ได้ | D | Admin |
| Contact | soft delete | ห้ามถ้าเป็นผู้ติดต่อหลักคนเดียว | D | Admin |
| Role | soft delete | **ห้ามลบจนย้าย user ออกหมด** (ไม่มี force-migrate) | Admin | Admin |
| PO/INV/DN/**PR/GR**/Shipment | **ยกเลิก/void (ไม่ลบ)** | gapless — เลขคงอยู่ | D/Approve/Admin | — (คงอยู่เสมอ) |
| PRD/Batch | ยกเลิกตาม PO | หลักฐาน GMP ห้ามหาย | ตาม PO | — |

---

## 4. หมายเหตุส่งต่อ (Stage 2)
- **ถึง Tech-Lead:** ออกแบบ soft-delete (คอลัมน์ `deleted_at`/`deleted_by`/`delete_reason` + filter default ซ่อน deleted แต่ search เจอ) + **cascade/reference guard** (กันสร้างเอกสารใหม่ที่อ้าง record ถูกลบ) + gapless numbering ไม่กระทบ · **Sale delete = ต้องมี bulk-reassign flow** (ย้ายลูกค้ายกชุดก่อน) · COGS ไม่อยู่ใน scope (ใช้ BOM snapshot)
- **ถึง BA:** เขียน AC ต่อ entity ตามตาราง §2/§3 + edge (ลบแล้วยัง search เจอ / ห้ามโผล่ dropdown ใหม่ / ของเดิมวิ่งต่อ / audit + mandatory comment / Sale bulk-reassign บังคับก่อนลบ / Role block-until-empty)
- **Negative stock ↔ GR (เสริมจาก TL):** เมื่อผลิตตัด stock ติดลบแล้วทำ Goods Receipt ทีหลัง → ระบบ **auto FIFO retro-link lot** ที่รับเข้าใหม่กับการผลิตที่ตัดติดลบไว้ (ผูกย้อนให้ Batch↔Lot ครบตาม GMP) + แสดง notice "ชดเชยยอดติดลบ" — รายละเอียดอยู่ที่ `entity-status-map.md` §1.6 (Negative Stock Rule)
