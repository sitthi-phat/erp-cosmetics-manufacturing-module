# Module — Customer (ลูกค้า)

slug: `erp-v2-ui-first` · per-module canonical · PO · 2026-07-29 (**+ address & receiver-contact delta 2026-07-30 · + invoice per-invoice-override note 2026-07-30 · ★ + Follow-up notification = flag-set-only + de-dup (Gate-1 r20 2026-07-31)**)
Mockups: `mockups/customers.html` · `mockups/customer-detail.html` · `mockups/customer-create.html` · `mockups/contact-create.html`
กฎอ้างอิง: entity-status-map §1.1 (**status enum r2 = 5 สถานะ + follow-up flag แยก** — ★ DECIDED ปอนด์ยืนยัน 2026-07-29: ถอด "Follow-up") · deletion-policy §2.1/§2.6 · **deletion-policy §2.15 (ลบ Sale → ลูกค้า unassigned/blank)** · README §3 (G1–G5) · README §2.2 (credit term) · **`invoice.md` §3/§4b/§7 (financial roll-up = ใบ active/ไม่รวม void · pull ข้อมูลลูกค้า → per-invoice override)** · **`po.md` §5.2 (PO edit → raise follow-up)** · **`production.md` §7.6 (edit-PO from production)** · **`settings.md` §4c/§5 US-SET-02 (delete Sale → unassign)** · **★ `shipping.md` §5 / `delivery-note.md` §5/§7 (ที่อยู่จัดส่ง + ผู้รับสินค้า แสดงใน Route/DN)** · **★ `platform.md` §7 / `non-functional.md` §7 (Follow-up notification = flag-set-only + de-dup)**

## สรุปภาษาไทย
โมดูลลูกค้า: เพิ่ม **TYPE = OEM และ/หรือ Own-Brand** (เป็นได้ทั้งคู่) · **Credit term ระดับลูกค้า 30/60/90 default 60** (override รายใบได้). **★ 3 เรื่องใหม่ (ปอนด์ 2026-07-29):** (1) หน้า detail โชว์ **สรุปการเงินลูกค้า** = ยอดซื้อรวม / จ่ายมาแล้ว / ยังไม่จ่าย(ค้างชำระ) — คำนวณจากใบแจ้งหนี้+การรับชำระ, THB, read-only. (2) **"ต้องติดตาม (needs follow-up)" แยกเป็น flag อิสระ** (boolean + เหตุผล + ใคร/เมื่อ) **ควบคู่ได้กับทุกสถานะ** — **★ DECIDED (ปอนด์ยืนยัน 2026-07-29 · ตัวเลือก A): ถอด "Follow-up" ออกจาก status enum** เหลือ Lead/Active/Inactive/Disabled/Blacklist. **★ flag ถูก raise จาก cross-module cascade ได้ รวม "PO ถูกแก้ไข (รวมจากบริบทการผลิต — under-production)" ให้ Sale เห็น (po.md §5.2 / production.md §7.6).** **★ ใหม่ (Gate-1 r20 2026-07-31): notification "ติดตามลูกค้า" ยิงเฉพาะตอน "ตั้ง flag ต้องติดตาม" (flag-set) — ลูกค้าไม่มีฟิลด์ due-date และไม่มี sweep รายวัน; + de-dup: ถ้า flag ถูก auto-raise โดย event ที่ยิง noti ของตัวเองอยู่แล้ว (เช่น Invoice Overdue) → ไม่ยิง Follow-up ซ้ำ (§4.1).** (3) **Disabled/Blacklist = บล็อกการเปิดงานขายทั้งหมด (QT/PO/SO) แบบ HARD block**. **★ 1 เรื่องใหม่ (Customer add-on):** **หน้า EDIT ลูกค้าต้องแก้ได้ครบทุกฟิลด์ = ชุดเดียวกับตอน Create**; financial summary ยัง read-only; ทุกการแก้ลง audit. หน้า detail โชว์ **QT history + PO history**. **★ 1 เรื่องใหม่ (ปอนด์ 2026-07-29 — resolve US-SET-02):** **"Sale ที่ดูแล (assigned Sale)" = NULLABLE/ว่างได้** — ลูกค้าไม่มีผู้ดูแลเป็นสถานะที่ถูกต้อง; **เมื่อลบ Sale → ฟิลด์นี้ถูกล้างเป็นว่างอัตโนมัติ (ไม่บังคับ bulk-reassign)** → reassign ภายหลังด้วยมือผ่านหน้าแก้ไข; ทุกการเปลี่ยน audit-logged. **★★ ใหม่ (Module A — ปอนด์ 2026-07-30):** เพิ่ม **(A1) ที่อยู่ 2 ชุดแยกกัน** — **"ที่อยู่ลูกค้า (registered/ออกเอกสาร)"** และ **"ที่อยู่จัดส่งสินค้า (shipping address)"** (อาจต่างกัน; ที่อยู่จัดส่งไปโผล่บน modal PO/SO/DN ในหน้า Route + หัวใบส่งของ DN). **(A2) ผู้ติดต่อ (contact) เพิ่ม flag "เป็นคนรับสินค้า (is receiver)"** — เมื่อ flag=true **ชื่อ AND เบอร์ ของผู้ติดต่อนั้นบังคับกรอกครบ** (validation). **★★ ใหม่ (Invoice review — ปอนด์ 2026-07-30):** ตอน **สร้างใบแจ้งหนี้** ระบบ **pull ชื่อ/ที่อยู่ออกเอกสาร/เลขภาษี** จาก master นี้เป็นค่าเริ่มต้น **แต่แก้ได้เฉพาะบนใบ (per-invoice override, snapshot) — ไม่แก้ค่า master** (`invoice.md` §3); financial summary ยึดใบ **active/ไม่รวม void** (`invoice.md` §4b).

---

## 1. Purpose
จัดการ master ลูกค้า (ข้อมูล + ผู้ติดต่อ + **ที่อยู่ลูกค้า/ที่อยู่จัดส่ง** + credit + **สรุปการเงิน**) และเป็นจุดเริ่ม/อ้างอิงของทุก order (OEM Quotation/PO, Own-Brand SO). รองรับ lifecycle **5 สถานะ + flag "ต้องติดตาม" แยกอิสระ**, การมอบหมาย Sale (**รวมสถานะ "ไม่มีผู้ดูแล/Sale ว่าง"**), ประวัติการค้าเต็มรูป (QT/PO), **ข้อมูลผู้รับสินค้า + ที่อยู่จัดส่งสำหรับสาย logistics** และ **การบล็อกงานขายเมื่อ Disabled/Blacklist** เพื่อ traceability + การควบคุมความเสี่ยงเครดิต.

## 2. Screens
| หน้าจอ | บทบาท |
|---|---|
| `customers.html` (list) | รายชื่อลูกค้า + filter (สถานะ, **TYPE**, Sale ที่ดูแล **รวมตัวเลือก "ไม่มีผู้ดูแล"**, **⚑ ต้องติดตาม**) + search |
| `customer-detail.html` | ข้อมูลลูกค้า + **ที่อยู่ลูกค้า + ที่อยู่จัดส่ง** + ผู้ติดต่อ (**+ ป้าย "คนรับสินค้า"**) + **สรุปการเงิน (financial summary)** + **⚑ flag ต้องติดตาม (แยกจาก status badge)** + **management-history (section เดียว)** + **QT history** + **PO history** |
| `customer-create.html` (add/edit) | เพิ่ม/แก้ลูกค้า — **★ Edit = ครบทุกฟิลด์เท่ากับ Create** (§2b) · **แก้/มอบหมาย Sale ที่ดูแล (รวมล้างเป็นว่าง)** · **★ 2 ช่องที่อยู่ (ลูกค้า/จัดส่ง) + option "ใช้ที่อยู่เดียวกัน"** |
| `contact-create.html` | เพิ่ม/แก้ผู้ติดต่อของลูกค้า · **★ checkbox "เป็นคนรับสินค้า (is receiver)" → ชื่อ+เบอร์บังคับ (§9b)** |
| **modal detail** (ใช้จากหน้า order) | ดูข้อมูลลูกค้าแบบ modal จาก quotation/po/so-create — กลับได้ไม่เสีย state (G3/G4) |

> **หมายเหตุ split:** ถ้า add/edit ใหญ่เกิน สามารถแยก `customer-add.md` / `customer-edit.md` ภายหลัง — รอบนี้รวมใน customer.md.

## 2b. ★ Edit = ALL fields (เท่ากับ Create — Customer add-on 2026-07-29)
**หน้าแก้ไขลูกค้าต้องเปิดให้แก้ได้ครบทุกฟิลด์ = ชุดเดียวกับตอนสร้าง (Create)** — **ไม่ใช่แก้ได้เฉพาะข้อมูลผู้ติดต่อ**:
- **ข้อมูลบริษัท/ธุรกิจ** (ชื่อบริษัท, เบอร์บริษัท, ประเภทธุรกิจ/รายละเอียด).
- **TYPE = OEM และ/หรือ Own-Brand** (แก้ได้, multi-select).
- **Credit term** ระดับลูกค้า (30/60/90).
- **ภาษี/ที่อยู่ — ★ 2 ชุด:** **ที่อยู่ลูกค้า (registered/ออกเอกสาร)** + **เลขภาษี** และ **ที่อยู่จัดส่งสินค้า (shipping address)** (แยกกัน; มี option "ใช้ที่อยู่เดียวกับที่อยู่ลูกค้า" เพื่อ copy) — §3/§9b.
- **สถานะ (5-status)** — Lead/Active/Inactive/Disabled/Blacklist (บาง transition บังคับ comment / ต้องสิทธิ์ Approve ตาม §8).
- **⚑ flag "ต้องติดตาม"** (ตั้ง/เคลียร์ + เหตุผลบังคับ) — §4.1.
- **Sale ที่ดูแล (assigned Sale) — ★ มอบหมาย/เปลี่ยน/ล้างเป็นว่างได้** (nullable; reassign = Customer.Approve — §5/§8).
- **ผู้ติดต่อ (contacts)** — เพิ่ม/แก้/ลบ (คงกฎผู้ติดต่อหลัก 1 คน §9) · **★ ตั้ง/ยกเลิก flag "เป็นคนรับสินค้า" ต่อผู้ติดต่อ** (§9b).
- **ข้อยกเว้น (read-only):** **financial summary (§7)** = computed อย่างเดียว · **รหัสลูกค้า `CUS-…`** = computed.
- **Audit:** **ทุกการแก้ฟิลด์ลง field-audit + แสดงใน management-history** (ใคร/เมื่อ/เดิม→ใหม่) — §5 / traceability.md §4.
- **สิทธิ์:** แก้ฟิลด์ทั่วไป = Customer.**Update (U)**; เปลี่ยนสถานะ Disabled/Blacklist + reassign Sale = Customer.**Approve (A)** (§8).

## 3. Fields
| ฟิลด์ | หน่วย/ชนิด | editable/computed | หมายเหตุ |
|---|---|---|---|
| รหัสลูกค้า `CUS-{NNNNNN}` | string | computed (auto) | gapless · **แก้ไม่ได้** |
| ชื่อบริษัท | text | editable (create + **edit**) | ใช้ค้นใน customer dropdown (G4) + **ค้นในคิวผลิต (production.md §6)** · **★ ใบแจ้งหนี้ pull ชื่อนี้ตอนสร้าง → แก้บนใบได้ (override, ไม่แก้ master) — `invoice.md` §3** |
| **TYPE** | multi-select {OEM, Own-Brand} | editable (create + **edit**) | **เลือกได้ทั้งคู่** · **mismatch = เตือนไม่บล็อก** |
| สถานะ | enum **5 สถานะ** | editable (create + **edit**; บาง state auto/ต้อง Approve) | **Lead/Active/Inactive/Disabled/Blacklist** (entity-status-map §1.1 r2) · **★ DECIDED: ถอด "Follow-up" ออกจาก enum → flag แยก (§12)** |
| **⚑ ต้องติดตาม (follow-up flag)** | boolean | editable (create + **edit**) | **แยกอิสระจาก status — co-exist กับทุกสถานะ** · เปิด flag = **บังคับกรอกเหตุผล** · เก็บ ใคร/เมื่อ (audit) · **★ raise ได้จาก cross-module (เช่น PO ถูกแก้ไข — §4.1)** · **★ การตั้ง flag (flag-set) = ยิง notification "ติดตามลูกค้า" (§4.1, de-dup กับ event ที่มี noti เอง)** |
| เหตุผลต้องติดตาม (follow-up reason) | text | editable (เมื่อ flag=true) | เช่น "ติดเงิน/ค้างชำระ", "PO-xxx ถูกแก้ไข" · แสดงบน badge/tooltip |
| **Credit term (ระดับลูกค้า)** | enum {30, 60, 90} วัน | editable (create + **edit**) | **DEFAULT = 60** · override รายใบแจ้งหนี้ยังได้ |
| **Sale ที่ดูแล (assigned Sale / owner)** | ref user · **NULLABLE (ว่างได้)** | editable (reassign, Approve) · **สามารถล้างเป็นว่าง** | **★ ว่าง (unassigned) = สถานะที่ถูกต้อง** — ลูกค้าไม่มีผู้ดูแลได้ · **★ ถูกล้างเป็นว่างอัตโนมัติเมื่อลบ Sale ที่ดูแล** (deletion-policy §2.15 / settings.md §4c) · reassign = Sale Manager/Admin (§5) · **ทุกการเปลี่ยน (มอบหมาย/ล้าง/auto-clear) = audit-logged** |
| ผู้ติดต่อ (contacts) | list {ชื่อ, เบอร์, อีเมล, หลัก?, **เป็นคนรับสินค้า (is receiver)?**} | editable (create + **edit**) | ต้องมีผู้ติดต่อหลัก 1 คน · **ชื่อ/เบอร์ผู้ติดต่อใช้ค้นในคิวผลิต (production.md §6) + ค้น PO/SO/DN บนหน้า Route (shipping.md §5) + ค้นบนหน้า Invoice (invoice.md §8)** · **★ เพิ่ม flag "เป็นคนรับสินค้า" ต่อผู้ติดต่อ — §9b** |
| **★ เป็นคนรับสินค้า (is receiver)** (ต่อผู้ติดต่อ) | boolean | editable (create + **edit**) | ระบุว่าผู้ติดต่อคนนี้คือผู้รับสินค้าตอนจัดส่ง · **เมื่อ flag=true → ชื่อ AND เบอร์ ของผู้ติดต่อนั้น "บังคับกรอกครบทั้งคู่" (§9b)** · **ผู้รับสินค้า(ชื่อ+เบอร์) + ที่อยู่จัดส่ง แสดงใน modal รายละเอียด PO/SO/DN บนหน้า Route + หัวใบส่งของ (shipping.md §5 / delivery-note.md §5/§7)** · มีได้หลายคน (ผู้ติดต่อหลายคนติด flag ได้) |
| เบอร์โทรบริษัท | phone | editable (create + **edit**) | ใช้ค้นใน customer dropdown (G4) |
| **★ ที่อยู่ลูกค้า (registered address / ที่อยู่ออกเอกสาร)** | text | editable (create + **edit**) | ที่อยู่จดทะเบียน/ออกเอกสาร (ใช้กับใบแจ้งหนี้/ใบกำกับ, คู่กับเลขภาษี) · **แยกฟิลด์จากที่อยู่จัดส่ง** · **★ ใบแจ้งหนี้ pull ค่านี้ตอนสร้าง → แก้บนใบได้ (per-invoice override, ไม่แก้ master) — `invoice.md` §3** |
| **★ ที่อยู่จัดส่งสินค้า (shipping address)** | text | editable (create + **edit**) | ที่อยู่สำหรับส่งของ (อาจต่างจากที่อยู่จดทะเบียน) · option **"ใช้ที่อยู่เดียวกับที่อยู่ลูกค้า"** (copy) · **แสดงใน modal PO/SO/DN บนหน้า Route + หัวใบส่งของ DN (shipping.md §5 / delivery-note.md §5/§7)** |
| เลขภาษี (Tax ID) | text | editable (create + **edit**) | ใช้ออกเอกสาร (คู่กับที่อยู่ลูกค้า) · **★ ใบแจ้งหนี้ pull ค่านี้ตอนสร้าง → แก้บนใบได้ (per-invoice override, ไม่แก้ master) — `invoice.md` §3** |
| **ยอดซื้อรวม (total purchased)** | THB | **computed (read-only)** | Σ grand total ใบแจ้งหนี้ active (ไม่รวม void) — §7 |
| **จ่ายมาแล้ว (total paid)** | THB | **computed (read-only)** | Σ การรับชำระ — §7 |
| **ยังไม่จ่าย / ค้างชำระ (outstanding)** | THB | **computed (read-only)** | = ยอดซื้อรวม − จ่ายมาแล้ว — §7 |

## 4. Statuses / lifecycle (r2 — 5 สถานะ + follow-up flag แยก)
**สถานะหลัก 5 สถานะ (source: entity-status-map §1.1 r2):** **ผู้สนใจ (Lead)** → **ลูกค้าประจำ (Active)** (auto เมื่อยืนยัน order ใบแรก) → **ห่างหาย (Inactive)** (auto scheduler) · **ปิดใช้งาน (Disabled)/บัญชีดำ (Blacklist)** (Sale Manager/Admin, บังคับ comment).
- **★ "Follow-up" ไม่เป็นสถานะอีกต่อไป (DECIDED · §12)** → แทนด้วย **flag "ต้องติดตาม"** ที่ **ควบคู่ได้กับทุกสถานะ** (§4.1).
- **★ Assigned Sale = nullable** — ลูกค้ามีสถานะ "ไม่มีผู้ดูแล (Sale ว่าง)" ได้เสมอ (ไม่ผูกกับ 5 สถานะข้างต้น) — เกิดเมื่อยังไม่มอบหมาย หรือเมื่อลบ Sale ที่ดูแล (§4.3). **ไม่บล็อกงานขาย**.
- **Soft-delete** ได้เสมอ (deletion-policy §2.1) — PO เดิมเดินต่อ, **ห้ามเปิด order ใหม่**, หายจาก dropdown.

### 4.1 ★ Follow-up flag (attribute แยกจาก status) + notification trigger (★ r20 flag-set-only + de-dup)
- **เป็น boolean อิสระ** — ตั้ง/เคลียร์ได้โดยไม่แตะสถานะหลัก. ตัวอย่าง: **Blacklist + ⚑ ต้องติดตาม** (ติดเงิน) · **Active + ⚑ ต้องติดตาม** (PO ที่เปิดมีปัญหา/ถูกแก้).
- ตั้ง flag = **บังคับเหตุผล** (follow-up reason) + เก็บ **ใคร/เมื่อ** (audit) → ลง management-history.
- **สัญญาณบน UI = แยก badge จาก status badge** เสมอ (chip ⚑ "ต้องติดตาม" สีเตือน + tooltip เหตุผล).
- **แหล่งที่มา flag:** **(a) manual** (Sale/Sale Manager) · **(b) auto จาก cross-module cascade** — เช่น **PRD Hold เหตุลูกค้า**, **invoice Overdue**, **★ PO ถูกแก้ไข (รวมจากบริบทการผลิต — under-production ที่ลดจำนวนสั่งให้ = ผลิตจริง, `po.md` §5.2 / `production.md` §7.6)** — cross-module ตั้ง flag + เหตุผลอ้างเอกสาร. ทุกครั้งลง audit.
- **★★ Notification trigger (Gate-1 r20 — ปอนด์ 2026-07-31; authoritative `platform.md` §7 หมวด 4 / `non-functional.md` §7):**
  - **ยิงเฉพาะตอน "ตั้ง flag ต้องติดตาม" (flag-set / raise) เท่านั้น** — เป็น **near-real-time event** ตอน flag ถูกตั้ง. **ลูกค้าไม่มีฟิลด์ due-date และไม่มี daily sweep** — จึง **ไม่มีถ้อยคำ "ครบกำหนดติดตาม (due)" ในสเปกนี้** (ถ้อยคำ due/ครบกำหนดถูกตัดทิ้ง). รายการที่ยังไม่อ่านค้างใน bell อยู่แล้ว (read-driven) จึงไม่ต้อง sweep.
  - **★ De-dup (กันแจ้งซ้ำ):** ถ้า flag ถูก **auto-raise โดย event ที่มี notification ของตัวเองอยู่แล้ว** — โดยเฉพาะ **Invoice Overdue (noti หมวด 3 การเงิน)** — → **ไม่ยิง notification "ติดตามลูกค้า" ซ้ำ** (flag ยังถูกตั้ง + ขึ้น badge ⚑ บน customer ตามปกติ แต่ไม่ยิง noti Follow-up เพิ่ม). ยิง Follow-up notification เฉพาะ **manual flag-set (Sale ตั้งเอง)** หรือ **cross-module raise ที่ไม่มี noti ของตัวเอง** (เช่น PO ถูกแก้ = under-production).
  - **ผู้รับ = Read Customer** (Sale ที่ดูแลเห็นผ่าน Read Customer) · **deep-link = หน้ารายละเอียดลูกค้า** · แทน **Customer Inactivity** เดิม (Inactivity = state change เท่านั้น ไม่ยิง noti).
- **flag ไม่บล็อกงานขาย** — เป็นแค่ป้ายเตือน/ตัวกรอง.

### 4.2 ★ Hard block: Disabled / Blacklist ห้ามเปิดงานขาย
เมื่อสถานะลูกค้า = **Disabled** หรือ **Blacklist** → **บล็อกการเปิดงานขายทุกชนิด (QT, PO, SO) แบบ HARD block**:
- เป็น **HARD block (ไม่ใช่เตือน)** — ป้องกันไม่ให้เลือก/ยืนยันลูกค้ารายนี้ในหน้า create ของ QT/PO/SO.
- **customer search dropdown (G4):** ลูกค้า Disabled/Blacklist **ยังค้นเจอ + แสดงสถานะ** แต่ **เลือกไม่ได้** พร้อมข้อความชัด.
- **ต่างจาก TYPE mismatch:** TYPE ไม่ตรง = **เตือนไม่บล็อก**; Disabled/Blacklist = **บล็อกจริง**.
- **flag "ต้องติดตาม" ไม่บล็อก** · **"ไม่มีผู้ดูแล (Sale ว่าง)" ไม่บล็อก**.
- ราย order module: `quotation.md` §5/§8, `po.md` §5/§7, `so.md` §5/§8.

### 4.3 ★ Unassigned (Sale ว่าง) — เมื่อลบ Sale ที่ดูแล (DECIDED 2026-07-29 — resolve US-SET-02)
- **ฟิลด์ "Sale ที่ดูแล" = nullable** — ว่างได้เสมอ, เป็นสถานะที่ valid (ไม่บล็อกงานขาย).
- **★ เมื่อ Sale ถูกลบ (settings.md §4c / deletion-policy §2.15):** ลูกค้าทุกรายที่ Sale คนนั้นดูแล → **assigned Sale ถูกล้างเป็นว่าง (unassigned) อัตโนมัติ** — **ไม่มีการบังคับ bulk-reassign, ไม่มีหน้า bulk-reassign**.
- **Reassign ภายหลังด้วยมือ:** มอบหมาย Sale ใหม่ผ่านหน้าแก้ไขลูกค้า (§2b) หรือ reassign action บนหน้ารายชื่อ/detail (Customer.Approve — §8).
- **ค้นหา/กรอง:** หน้ารายชื่อลูกค้ามี filter "Sale ที่ดูแล" ที่รวมตัวเลือก **"ไม่มีผู้ดูแล (unassigned)"** เพื่อหา + มอบหมายลูกค้าที่ว่างได้ง่าย.
- **Audit:** การล้างเป็นว่าง (auto-clear เพราะลบ Sale) + การ reassign ภายหลัง = **audit-logged + ลง management-history** ("Sale ที่ดูแลถูกล้างเพราะลบผู้ใช้ …" / "มอบหมาย Sale ใหม่ …").

## 5. ★ Management-history (section เดียว — consolidated)
รวม 3 อย่างเป็น **section เดียว** บน customer-detail:
1. **เปลี่ยนสถานะ / มอบหมาย + ตั้ง/เคลียร์ flag ต้องติดตาม** — เปลี่ยน 5 สถานะ (บังคับ comment ตาม state), ตั้ง/เคลียร์ ⚑ (บังคับเหตุผล), มอบหมายงานติดตาม.
2. **บันทึก / ประวัติการจัดการ** — timeline (comment, การติดต่อ, การเปลี่ยนสถานะ, ตั้ง/เคลียร์ flag **รวมที่ raise จาก cross-module cascade เช่น PO ถูกแก้**, **★ การแก้ฟิลด์ใด ๆ ของลูกค้า — §2b (รวมที่อยู่/ผู้ติดต่อ/flag ผู้รับสินค้า)**) เรียงเวลา.
3. **Sale ที่ดูแล (reassign)** — เปลี่ยนผู้ดูแล (Sale Manager/Admin) + เหตุผล; **★ การล้างเป็นว่างอัตโนมัติเมื่อลบ Sale (deletion-policy §2.15) — ไม่ต้อง bulk reassign; reassign ภายหลังด้วยมือ**.
> ทุก entry เก็บ ใคร/เมื่อไหร่/เหตุผล (audit). paginate 20/หน้า (G1).

## 6. ★ QT history + PO history (บน customer-detail)
- **ประวัติใบเสนอราคา (Quotation history):** list QT ของลูกค้า · **ค้นเลข QT หรือช่วงวันที่สร้าง** (G2) · 20/หน้า (G1) · drill-back ไม่เสีย state (G3).
- **ประวัติ PO:** list PO ของลูกค้า · ค้นเลข PO หรือช่วงวันที่สร้าง (G2) · 20/หน้า · drill-back ไม่เสีย state.
- (Own-Brand) SO history ในรูปแบบเดียวกัน (optional tab).

## 7. ★ Financial summary (บน customer-detail — computed roll-up)
| ฟิลด์ | นิยาม / ที่มา | หน่วย |
|---|---|---|
| **ยอดซื้อรวม (Total purchased)** | Σ grand total (รวม VAT) ของใบแจ้งหนี้ **active** ทั้งหมดของลูกค้า (**ไม่รวม void** — `invoice.md` §4b) | THB |
| **จ่ายมาแล้ว (Total paid)** | Σ ยอดรับชำระ (invoice.md §6) | THB |
| **ยังไม่จ่าย / ค้างชำระ (Outstanding)** | = ยอดซื้อรวม − จ่ายมาแล้ว | THB |

- **read-only/computed ล้วน** (รวมในโหมด edit ก็ยัง read-only — §2b).
- **ขอบเขต:** ยึด **ใบแจ้งหนี้ (Invoice) ที่ active** เป็นฐาน (1 PO/SO = 1 ใบ active; ใบ void ไม่นับ — `invoice.md` §4b). **★ order ที่ส่งแล้วแต่ใบเดียวถูก void และยังไม่ออกใบใหม่ = 0 (INTENDED — `invoice.md` §4b m2).**
- **Cross-link:** `invoice.md` (§4b/§6/§9).

## 8. Actions & Permissions (per-action, D14/§7.1)
| ปุ่ม/action | Permission required (Customer module) |
|---|---|
| ดูรายชื่อ/detail/history/**financial summary** | Customer.**Read (R)** |
| สร้างลูกค้าใหม่ | Customer.**Create (C)** |
| **แก้ข้อมูลลูกค้า — ★ ครบทุกฟิลด์ (รวมที่อยู่ 2 ชุด + ผู้ติดต่อ + flag ผู้รับสินค้า)** | Customer.**Update (U)** |
| เปลี่ยนสถานะ Lead/Active | Customer.**Update (U)** (บังคับ comment ตาม state) |
| **ตั้ง/เคลียร์ ⚑ flag ต้องติดตาม (+ เหตุผล) — ★ ตั้ง flag = ยิง noti Follow-up (de-dup กับ event ที่มี noti เอง §4.1)** | Customer.**Update (U)** (บังคับเหตุผล) · **cross-module raise (เช่น PO edit) = ระบบตั้งให้ auto + เหตุผลอ้างเอกสาร** |
| **เพิ่ม/แก้/ลบผู้ติดต่อ + ตั้ง flag "เป็นคนรับสินค้า"** | Customer.**Update (U)** |
| ตั้ง Disabled / Blacklist | Customer.**Approve (A)** + comment |
| **reassign / มอบหมาย / ล้าง Sale ที่ดูแล (รวมมอบหมายลูกค้าที่ unassigned)** | Customer.**Approve (A)** |
| **auto-clear Sale ที่ดูแลเป็นว่าง (เมื่อลบ Sale)** | ระบบทำให้อัตโนมัติ (trigger จาก Settings.D — settings.md §4c) + audit |
| soft-delete ลูกค้า | Customer.**Delete (D)** + comment |
| กู้คืน (undelete) | Customer.**Admin** |
| เปิด modal detail จากหน้า order | Customer.**Read (R)** |
> **หมายเหตุ:** การแก้ชื่อ/ที่อยู่ออกเอกสาร/เลขภาษี **บนใบแจ้งหนี้** (per-invoice override) = สิทธิ์ **Invoice.Update (U)** ไม่ใช่ Customer.U — ไม่กระทบ master นี้ (`invoice.md` §6).

## 9. Validations
- TYPE ต้องเลือกอย่างน้อย 1.
- Credit term บังคับเลือก (default 60).
- ต้องมีผู้ติดต่อหลัก 1 คนเสมอ (deletion-policy §2.6).
- เปลี่ยนเป็น Disabled/Blacklist/soft-delete = **บังคับ comment**.
- **★ ตั้ง/เคลียร์ flag ต้องติดตาม = บังคับเหตุผล** + audit (รวม cross-module raise เช่น PO edit — เหตุผล = อ้างเอกสารต้นทาง) · **★ ตั้ง flag = ยิง noti Follow-up ยกเว้น de-dup กับ event ที่มี noti เอง (§4.1); ไม่มีการยิงตาม due-date (ไม่มีฟิลด์ due-date).**
- **★ Hard block Disabled/Blacklist:** ห้ามเลือก/ยืนยันลูกค้า Disabled/Blacklist ใน QT/PO/SO (§4.2).
- **★ Assigned Sale = nullable/ว่างได้** — ไม่บังคับต้องมี Sale ที่ดูแล; "ไม่มีผู้ดูแล" = valid state (ไม่บล็อกงานขาย); ล้างเป็นว่างอัตโนมัติเมื่อลบ Sale (§4.3) — **ไม่ต้อง bulk reassign**.
- **mismatch TYPE** = เตือน ไม่บล็อก.
- **★ Edit = all fields (§2b):** เปิดครบทุกฟิลด์ · financial summary + รหัส CUS read-only.
- **★ ที่อยู่ (Module A):** ที่อยู่ลูกค้า = แนะนำให้กรอก (ใช้ออกเอกสาร) · ที่อยู่จัดส่ง = ถ้าเว้นว่าง ให้ default/เตือนใช้ที่อยู่ลูกค้า (option "ใช้ที่อยู่เดียวกัน") — §9b.

### 9b. ★ Receiver-contact + address validation (Module A — ปอนด์ 2026-07-30)
- **★ ผู้ติดต่อที่ติด flag "เป็นคนรับสินค้า (is receiver)" = ต้องมีทั้ง "ชื่อ" และ "เบอร์" ครบทั้งคู่ (บังคับ, HARD validation):** ถ้าเปิด flag แต่ชื่อ/เบอร์ว่าง → บล็อกการบันทึก + error *"ผู้รับสินค้าต้องระบุชื่อและเบอร์ให้ครบ"*.
- ผู้ติดต่อที่ **ไม่ได้** ติด flag ผู้รับสินค้า → กติกาเดิม (เบอร์/อีเมล optional เว้นแต่เป็นผู้ติดต่อหลัก).
- ติด flag ผู้รับสินค้าได้ **หลายคน** (ไม่จำกัด 1 คน). ผู้ติดต่อหลัก (primary) กับผู้รับสินค้า (receiver) เป็น flag คนละตัว — คน ๆ เดียวเป็นได้ทั้งคู่.
- **ที่อยู่จัดส่ง:** ถ้าเลือก option "ใช้ที่อยู่เดียวกับที่อยู่ลูกค้า" → copy ค่าที่อยู่ลูกค้ามาเป็นที่อยู่จัดส่ง (แก้ต่อได้). ทั้งสองที่อยู่ = free-text.
- **การใช้งานปลายทาง:** ที่อยู่จัดส่ง + ผู้รับสินค้า(ชื่อ+เบอร์) จะถูกดึงไปแสดงใน **modal รายละเอียด PO/SO/DN บนหน้า Route (shipping.md §5)** และ **หัวใบส่งของ DN (delivery-note.md §5/§7)**. **ที่อยู่ลูกค้า (registered) + เลขภาษี** จะถูก **pull ไปตั้งต้นบนใบแจ้งหนี้** (แก้บนใบได้ per-invoice override — `invoice.md` §3).

## 10. Pagination / Search (global)
- ทุก list/history: **20/หน้า** (G1).
- customers list: search ชื่อ/เบอร์/รหัส + filter สถานะ/TYPE/Sale (**รวม "ไม่มีผู้ดูแล"**) + **filter ⚑ ต้องติดตาม (yes/no)**.
- QT/PO history: search เลข **หรือ** ช่วงวันที่สร้าง (G2).
- **Customer search dropdown (G4)** — ใช้ซ้ำบน quotation/po/so-create: ค้น **เบอร์โทร / ชื่อบริษัท / ชื่อผู้ติดต่อ / เบอร์ผู้ติดต่อ**; แสดง **สถานะ + credit term (+ ⚑)**; **Disabled/Blacklist = เลือกไม่ได้ (§4.2)**.

## 11. Cross-links
- **Financial summary (ใบ active/ไม่รวม void) + pull ข้อมูลลูกค้า → per-invoice override → `invoice.md` (§3/§4b/§6/§9).**
- Credit term → `po.md`/`so.md` · README §2.2.
- Customer dropdown + **hard block Disabled/Blacklist** → `quotation.md` §5/§8, `po.md` §5/§7, `so.md` §5/§8.
- **★ Follow-up flag reuse (cross-module raise) → `po.md` §5.2 (PO edit) · `production.md` §7.6 (edit-PO from production).**
- **★ Follow-up notification (flag-set-only + de-dup) → `platform.md` §7 (หมวด 4) · `non-functional.md` §7.**
- **Status enum r2 + follow-up flag → `entity-status-map.md` §1.1.**
- **★ Assigned Sale nullable + auto-clear on Sale delete → `deletion-policy.md` §2.15 · `settings.md` §4c/§5 US-SET-02.**
- **★ ที่อยู่จัดส่ง + ผู้รับสินค้า → `shipping.md` §5 (Route add-order modal) · `delivery-note.md` §5/§7 (DN print + detail).**
- Deletion → deletion-policy §2.1/§2.6 · RBAC → `permission-matrix.md`.

## 12. ★ Status enum disposition — DECIDED (ปอนด์ยืนยัน 2026-07-29)
**ถอด "Follow-up" ออกจาก status enum → 5 สถานะ (Lead/Active/Inactive/Disabled/Blacklist) + flag ⚑ "ต้องติดตาม" แยกอิสระ**. sync `entity-status-map.md` §1.1 (r6) + dashboard tile/filter.
> **ไม่มี open question ค้างในโมดูลนี้.** "Edit = all fields" (§2b) = settled. **"Assigned Sale nullable + auto-clear on Sale delete" (§4.3) = settled (ปอนด์ 2026-07-29).** **"ที่อยู่ 2 ชุด + receiver-contact" (Module A §3/§9b) = settled (ปอนด์ 2026-07-30).** **"Follow-up notification = flag-set-only + de-dup" (§4.1) = settled (ปอนด์ Gate-1 r20 2026-07-31).**

## 13. Module changelog
- **★ เพิ่ม (2026-07-29 — ปอนด์ Customer feedback):** Financial summary · Follow-up flag (attribute อิสระ) · Hard block QT/PO/SO เมื่อ Disabled/Blacklist.
- **★ เพิ่ม (2026-07-29 — Customer add-on):** **Edit = ALL fields** · financial summary + รหัส CUS read-only.
- **★ DECIDED (2026-07-29 — ตัวเลือก A):** status enum **6 → 5** (ถอด "Follow-up" → flag ⚑).
- **★ เพิ่ม (2026-07-29 — Production module review, ปอนด์):** **follow-up flag ถูก raise จาก cross-module cascade เพิ่ม "PO ถูกแก้ไข (รวมจากบริบทการผลิต — under-production)"** ให้ Sale เห็น (§3/§4.1/§5/§8/§9/§11, ref `po.md` §5.2 / `production.md` §7.6). ใช้กลไก flag เดิม (reuse) — ไม่ใช่สถานะ, ไม่บล็อก.
- **★ เพิ่ม (2026-07-29 — ปอนด์, resolve US-SET-02):** **"Sale ที่ดูแล (assigned Sale)" = NULLABLE/ว่างได้** · "ไม่มีผู้ดูแล (unassigned)" = valid state (ไม่บล็อกงานขาย) · **★ เมื่อลบ Sale → ฟิลด์นี้ถูกล้างเป็นว่างอัตโนมัติ (ไม่บังคับ bulk-reassign, ไม่มีหน้า bulk-reassign)** · reassign ภายหลังด้วยมือ (Customer.Approve) · filter รายชื่อลูกค้าเพิ่มตัวเลือก "ไม่มีผู้ดูแล" · ทุกการเปลี่ยน audit-logged. เพิ่ม §4.3 · แก้ field Sale (§3) · §2/§2b/§5/§8/§9/§10/§11 · sync `deletion-policy.md` §2.15 · `settings.md` §4c/§5.
- **★★ เพิ่ม (2026-07-30 — Module A, ปอนด์):** **(A1) ที่อยู่ 2 ชุดแยกกัน** — "ที่อยู่ลูกค้า (registered/ออกเอกสาร)" + "ที่อยู่จัดส่งสินค้า (shipping)" (+ option "ใช้ที่อยู่เดียวกัน"); ที่อยู่จัดส่งไปแสดงใน modal PO/SO/DN บนหน้า Route + หัวใบส่งของ DN. **(A2) ผู้ติดต่อเพิ่ม flag "เป็นคนรับสินค้า (is receiver)"** — ติด flag = ชื่อ+เบอร์บังคับครบ (§9b, HARD validation); มีได้หลายคน; ผู้รับสินค้าไปแสดงใน Route modal + หัว DN. อัปเดต §1/§2/§2b/§3/§8/§9/§9b/§11/§12, ref `shipping.md` §5 · `delivery-note.md` §5/§7. **แยกจากฟิลด์ "ที่อยู่/เลขภาษี" เดิม (split เป็น ที่อยู่ลูกค้า + เลขภาษี + ที่อยู่จัดส่ง).**
- **★★ เพิ่ม (2026-07-30 — Invoice module review, ปอนด์):** note **per-invoice override** — ตอนสร้างใบแจ้งหนี้ระบบ pull ชื่อ/ที่อยู่ออกเอกสาร/เลขภาษี จาก master นี้ **แต่แก้ได้เฉพาะบนใบ (snapshot, Invoice.U) ไม่กระทบ master** · financial summary = ใบ **active/ไม่รวม void** (§3/§7/§8/§9b/§11, ref `invoice.md` §3/§4b/§6).
- **★ แก้ (2026-07-31 — reconciliation M2 cleanup, ปอนด์):** ลบ stray tag `</content>` ท้ายไฟล์ (ไม่ใช่ spec content) · §7 เพิ่ม note "order ส่งแล้วแต่ใบ void = 0 (INTENDED)" ชี้ `invoice.md` §4b m2.
- **★ เพิ่ม (2026-07-31 — Gate-1 review reconciliation r20 · A1, ปอนด์):** **§4.1 Follow-up notification trigger = flag-set-only** — ยิงเฉพาะตอน "ตั้ง flag ต้องติดตาม"; **ตัดถ้อยคำ "ครบกำหนด/due-date" ทั้งหมด** (ลูกค้าไม่มีฟิลด์ due-date, ไม่มี daily sweep) · **de-dup:** flag ที่ถูก auto-raise โดย event ที่มี noti ของตัวเอง (เช่น Invoice Overdue) → ไม่ยิง Follow-up ซ้ำ (ยิงเฉพาะ manual/standalone raise). อัปเดต summary/§3 field/§4.1/§8/§9/§11/§12, ref `platform.md` §7 (หมวด 4) · `non-functional.md` §7. **ใช้ view เดิม (`customer.html` render จาก .md).**
- **คงเดิม:** TYPE (OEM/Own-Brand, both) · credit term preset 30/60/90 default 60 · management-history · QT/PO history · customer search dropdown (G4).
